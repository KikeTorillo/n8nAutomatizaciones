const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

/**
 * Model para ventas POS (Punto de Venta)
 * IMPORTANTE: Usa locks optimistas (SELECT FOR UPDATE) para evitar race conditions
 * Los triggers automáticos generan: folio, totales, descuento de stock
 */
class VentasPOSModel {

    /**
     * Crear nueva venta con items
     * CRÍTICO: Transaction con lock optimista
     */
    static async crear(data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[VentasPOSModel.crear] Iniciando venta', {
                organizacion_id: organizacionId,
                total_items: data.items?.length || 0,
                cliente_id: data.cliente_id,
                tipo_venta: data.tipo_venta
            });

            // Validar que hay items
            if (!data.items || data.items.length === 0) {
                throw new Error('La venta debe tener al menos un item');
            }

            if (data.items.length > 100) {
                throw new Error('No se pueden agregar más de 100 items en una venta');
            }

            // Validar cliente si se proporciona
            if (data.cliente_id) {
                const clienteQuery = await db.query(
                    `SELECT id FROM clientes
                     WHERE id = $1 AND organizacion_id = $2`,
                    [data.cliente_id, organizacionId]
                );

                if (clienteQuery.rows.length === 0) {
                    throw new Error('Cliente no encontrado o no pertenece a esta organización');
                }
            }

            // Validar profesional si se proporciona
            if (data.profesional_id) {
                const profesionalQuery = await db.query(
                    `SELECT id FROM profesionales
                     WHERE id = $1 AND organizacion_id = $2`,
                    [data.profesional_id, organizacionId]
                );

                if (profesionalQuery.rows.length === 0) {
                    throw new Error('Profesional no encontrado o no pertenece a esta organización');
                }
            }

            // Validar cita si se proporciona
            if (data.cita_id) {
                const citaQuery = await db.query(
                    `SELECT id FROM citas WHERE id = $1`,
                    [data.cita_id]
                );

                if (citaQuery.rows.length === 0) {
                    throw new Error('Cita no encontrada');
                }
            }

            // Validar productos y stock ANTES de insertar (con lock optimista)
            for (const item of data.items) {
                // SELECT FOR UPDATE para lock optimista
                const productoQuery = await db.query(
                    `SELECT id, nombre, sku, precio_venta, precio_mayoreo, cantidad_mayoreo,
                            stock_actual, permite_venta, activo
                     FROM productos
                     WHERE id = $1 AND organizacion_id = $2
                     FOR UPDATE`,
                    [item.producto_id, organizacionId]
                );

                if (productoQuery.rows.length === 0) {
                    throw new Error(`Producto con ID ${item.producto_id} no encontrado`);
                }

                const producto = productoQuery.rows[0];

                if (!producto.activo) {
                    throw new Error(`Producto "${producto.nombre}" está inactivo`);
                }

                if (!producto.permite_venta) {
                    throw new Error(`Producto "${producto.nombre}" no está disponible para venta`);
                }

                // Validar stock suficiente (solo si tipo_venta != 'cotizacion')
                if (data.tipo_venta !== 'cotizacion') {
                    if (producto.stock_actual < item.cantidad) {
                        throw new Error(
                            `Stock insuficiente para "${producto.nombre}". ` +
                            `Disponible: ${producto.stock_actual}, Solicitado: ${item.cantidad}`
                        );
                    }
                }
            }

            // Calcular totales
            let subtotal = 0;
            const itemsConPrecios = data.items.map(item => {
                const productoQuery = db.query(
                    `SELECT nombre, sku, precio_venta, precio_mayoreo, cantidad_mayoreo
                     FROM productos WHERE id = $1`,
                    [item.producto_id]
                );

                // Por ahora usar precio_venta (el trigger calculará el precio correcto)
                const precioUnitario = item.precio_unitario || 0;
                const descuentoMonto = item.descuento_monto || 0;
                const precioFinal = precioUnitario - descuentoMonto;
                const itemSubtotal = item.cantidad * precioFinal;
                subtotal += itemSubtotal;

                return {
                    ...item,
                    precio_unitario: precioUnitario,
                    precio_final: precioFinal,
                    subtotal: itemSubtotal
                };
            });

            const descuentoVenta = data.descuento_monto || 0;
            const impuestos = data.impuestos || 0;
            const total = subtotal - descuentoVenta + impuestos;

            // Generar folio manualmente (evita problemas con trigger)
            const year = new Date().getFullYear();
            const folioQuery = await db.query(
                `SELECT COALESCE(MAX(CAST(SUBSTRING(folio FROM 'POS-\\d{4}-(\\d+)') AS INTEGER)), 0) + 1 AS contador
                 FROM ventas_pos
                 WHERE organizacion_id = $1 AND folio LIKE $2`,
                [organizacionId, `POS-${year}-%`]
            );
            const contador = folioQuery.rows[0].contador;
            const folio = `POS-${year}-${String(contador).padStart(4, '0')}`;

            // Insertar venta con folio generado manualmente
            const ventaQuery = `
                INSERT INTO ventas_pos (
                    organizacion_id,
                    folio,
                    tipo_venta,
                    cliente_id,
                    cita_id,
                    profesional_id,
                    usuario_id,
                    subtotal,
                    descuento_porcentaje,
                    descuento_monto,
                    impuestos,
                    total,
                    metodo_pago,
                    estado_pago,
                    monto_pagado,
                    monto_pendiente,
                    notas,
                    estado,
                    fecha_venta,
                    fecha_apartado,
                    fecha_vencimiento_apartado
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                RETURNING *
            `;

            // El monto_pagado en BD es lo efectivamente cobrado (máximo = total)
            // El "cambio" para el cliente se calcula en frontend como: monto_recibido - total
            const montoRecibido = data.monto_pagado !== undefined ? data.monto_pagado : total;
            const montoPagado = Math.min(montoRecibido, total); // No guardar más del total
            const montoPendiente = Math.max(0, total - montoPagado);
            let estadoPago = 'pendiente';
            if (montoRecibido >= total) {
                estadoPago = 'pagado';
            } else if (montoRecibido > 0) {
                estadoPago = 'parcial';
            }

            const ventaValues = [
                organizacionId,
                folio,
                data.tipo_venta || 'directa',
                data.cliente_id || null,
                data.cita_id || null,
                data.profesional_id || null,
                data.usuario_id,
                subtotal,
                data.descuento_porcentaje || 0,
                descuentoVenta,
                impuestos,
                total,
                data.metodo_pago,
                estadoPago,
                montoPagado,
                montoPendiente,
                data.notas || null,
                data.tipo_venta === 'cotizacion' ? 'cotizacion' : 'completada',
                new Date(),
                data.fecha_apartado || null,
                data.fecha_vencimiento_apartado || null
            ];

            const resultVenta = await db.query(ventaQuery, ventaValues);
            const venta = resultVenta.rows[0];

            // Insertar items de la venta
            const itemsInsertados = [];
            for (const item of data.items) {
                // Obtener datos del producto para snapshot
                const prodQuery = await db.query(
                    `SELECT nombre, sku, precio_venta, precio_mayoreo, cantidad_mayoreo
                     FROM productos WHERE id = $1`,
                    [item.producto_id]
                );

                const producto = prodQuery.rows[0];

                // Calcular precio unitario (mayoreo si aplica)
                let precioUnitario = item.precio_unitario || producto.precio_venta;
                if (!item.precio_unitario && producto.precio_mayoreo && producto.cantidad_mayoreo) {
                    if (item.cantidad >= producto.cantidad_mayoreo) {
                        precioUnitario = producto.precio_mayoreo;
                    }
                }

                const descuentoMonto = item.descuento_monto || 0;
                const descuentoPorcentaje = item.descuento_porcentaje || 0;
                const precioFinal = descuentoMonto > 0
                    ? precioUnitario - descuentoMonto
                    : precioUnitario * (1 - descuentoPorcentaje / 100);
                const itemSubtotal = item.cantidad * precioFinal;

                const itemQuery = `
                    INSERT INTO ventas_pos_items (
                        venta_pos_id,
                        producto_id,
                        nombre_producto,
                        sku,
                        cantidad,
                        precio_unitario,
                        descuento_porcentaje,
                        descuento_monto,
                        precio_final,
                        subtotal,
                        aplica_comision,
                        notas
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING *
                `;

                const itemValues = [
                    venta.id,
                    item.producto_id,
                    producto.nombre,
                    producto.sku,
                    item.cantidad,
                    precioUnitario,
                    descuentoPorcentaje,
                    descuentoMonto,
                    precioFinal,
                    itemSubtotal,
                    item.aplica_comision !== undefined ? item.aplica_comision : true,
                    item.notas || null
                ];

                const resultItem = await db.query(itemQuery, itemValues);
                itemsInsertados.push(resultItem.rows[0]);
            }

            logger.info('[VentasPOSModel.crear] Venta creada exitosamente', {
                venta_id: venta.id,
                folio: venta.folio,
                total: venta.total,
                items: itemsInsertados.length
            });

            return {
                ...venta,
                items: itemsInsertados
            };
        });
    }

    /**
     * Obtener venta por ID con sus items
     * @param {number} id - ID de la venta
     * @param {number} organizacionId - ID de la organización
     * @param {Object} options - Opciones de query
     * @param {boolean} options.incluirAgendamiento - Si incluir JOINs a clientes/profesionales (default: true)
     */
    static async obtenerPorId(id, organizacionId, options = {}) {
        const { incluirAgendamiento = true } = options;

        // ⚠️ CRÍTICO: Usar withBypass para JOINs multi-tabla
        return await RLSContextManager.withBypass(async (db) => {
            // Construir SELECT y JOINs condicionalmente
            let selectFields = 'v.*, u.nombre AS usuario_nombre';
            let joins = 'LEFT JOIN usuarios u ON u.id = v.usuario_id AND u.organizacion_id = v.organizacion_id';

            if (incluirAgendamiento) {
                selectFields += `, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, p.nombre_completo AS profesional_nombre`;
                joins += `
                    LEFT JOIN clientes c ON c.id = v.cliente_id AND c.organizacion_id = v.organizacion_id
                    LEFT JOIN profesionales p ON p.id = v.profesional_id AND p.organizacion_id = v.organizacion_id`;
            }

            const ventaQuery = `
                SELECT ${selectFields}
                FROM ventas_pos v
                ${joins}
                WHERE v.id = $1 AND v.organizacion_id = $2
            `;

            const ventaResult = await db.query(ventaQuery, [id, organizacionId]);

            if (ventaResult.rows.length === 0) {
                return null;
            }

            const venta = ventaResult.rows[0];

            // Si no incluye agendamiento, agregar campos como null para mantener estructura
            if (!incluirAgendamiento) {
                venta.cliente_nombre = null;
                venta.cliente_telefono = null;
                venta.profesional_nombre = null;
            }

            // Obtener items de la venta
            const itemsQuery = `
                SELECT
                    vi.*,
                    pr.nombre AS producto_nombre,
                    pr.sku AS producto_sku,
                    pr.stock_actual
                FROM ventas_pos_items vi
                LEFT JOIN productos pr ON pr.id = vi.producto_id AND pr.organizacion_id = $2
                WHERE vi.venta_pos_id = $1
                ORDER BY vi.id ASC
            `;

            const itemsResult = await db.query(itemsQuery, [id, organizacionId]);

            return {
                venta,
                items: itemsResult.rows
            };
        });
    }

    /**
     * Listar ventas con filtros
     * @param {Object} filtros - Filtros de búsqueda
     * @param {number} organizacionId - ID de la organización
     * @param {Object} options - Opciones de query
     * @param {boolean} options.incluirAgendamiento - Si incluir JOINs a clientes/profesionales (default: true)
     */
    static async listar(filtros, organizacionId, options = {}) {
        const { incluirAgendamiento = true } = options;

        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['v.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            // Filtros
            if (filtros.estado) {
                whereConditions.push(`v.estado = $${paramCounter}`);
                values.push(filtros.estado);
                paramCounter++;
            }

            if (filtros.estado_pago) {
                whereConditions.push(`v.estado_pago = $${paramCounter}`);
                values.push(filtros.estado_pago);
                paramCounter++;
            }

            if (filtros.tipo_venta) {
                whereConditions.push(`v.tipo_venta = $${paramCounter}`);
                values.push(filtros.tipo_venta);
                paramCounter++;
            }

            // Filtros de agendamiento solo si el módulo está activo
            if (filtros.cliente_id && incluirAgendamiento) {
                whereConditions.push(`v.cliente_id = $${paramCounter}`);
                values.push(filtros.cliente_id);
                paramCounter++;
            }

            if (filtros.profesional_id && incluirAgendamiento) {
                whereConditions.push(`v.profesional_id = $${paramCounter}`);
                values.push(filtros.profesional_id);
                paramCounter++;
            }

            if (filtros.metodo_pago) {
                whereConditions.push(`v.metodo_pago = $${paramCounter}`);
                values.push(filtros.metodo_pago);
                paramCounter++;
            }

            // Filtro por rango de fechas
            if (filtros.fecha_desde) {
                whereConditions.push(`v.fecha_venta >= $${paramCounter}`);
                values.push(filtros.fecha_desde);
                paramCounter++;
            }

            if (filtros.fecha_hasta) {
                whereConditions.push(`v.fecha_venta <= $${paramCounter}`);
                values.push(filtros.fecha_hasta);
                paramCounter++;
            }

            // Búsqueda por folio
            if (filtros.folio) {
                whereConditions.push(`v.folio ILIKE $${paramCounter}`);
                values.push(`%${filtros.folio}%`);
                paramCounter++;
            }

            // Construir SELECT y JOINs condicionalmente
            let selectFields = 'v.*, u.nombre AS nombre_usuario, COUNT(vi.id) AS total_items';
            let joins = `LEFT JOIN usuarios u ON u.id = v.usuario_id
                LEFT JOIN ventas_pos_items vi ON vi.venta_pos_id = v.id`;
            let groupBy = 'v.id, u.nombre';

            if (incluirAgendamiento) {
                selectFields = `v.*, c.nombre AS nombre_cliente, p.nombre_completo AS nombre_profesional, u.nombre AS nombre_usuario, COUNT(vi.id) AS total_items`;
                joins = `LEFT JOIN clientes c ON c.id = v.cliente_id
                    LEFT JOIN profesionales p ON p.id = v.profesional_id
                    LEFT JOIN usuarios u ON u.id = v.usuario_id
                    LEFT JOIN ventas_pos_items vi ON vi.venta_pos_id = v.id`;
                groupBy = 'v.id, c.nombre, p.nombre_completo, u.nombre';
            }

            const query = `
                SELECT ${selectFields}
                FROM ventas_pos v
                ${joins}
                WHERE ${whereConditions.join(' AND ')}
                GROUP BY ${groupBy}
                ORDER BY v.fecha_venta DESC
                LIMIT $${paramCounter}
                OFFSET $${paramCounter + 1}
            `;

            values.push(filtros.limit || 50);
            values.push(filtros.offset || 0);

            const result = await db.query(query, values);

            // Si no incluye agendamiento, agregar campos null para mantener estructura
            if (!incluirAgendamiento) {
                result.rows = result.rows.map(row => ({
                    ...row,
                    nombre_cliente: null,
                    nombre_profesional: null
                }));
            }

            // Obtener totales
            const totalesQuery = `
                SELECT
                    COUNT(*) as total_ventas,
                    SUM(total) as total_monto,
                    SUM(monto_pendiente) as total_pendiente
                FROM ventas_pos v
                WHERE ${whereConditions.join(' AND ')}
            `;

            const totalesResult = await db.query(totalesQuery, values.slice(0, values.length - 2));

            return {
                ventas: result.rows,
                totales: totalesResult.rows[0],
                limit: filtros.limit || 50,
                offset: filtros.offset || 0
            };
        });
    }

    /**
     * Actualizar estado de venta
     */
    static async actualizarEstado(id, nuevoEstado, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[VentasPOSModel.actualizarEstado] Actualizando estado', {
                venta_id: id,
                nuevo_estado: nuevoEstado
            });

            const query = `
                UPDATE ventas_pos
                SET estado = $1, actualizado_en = NOW()
                WHERE id = $2
                RETURNING *
            `;

            const result = await db.query(query, [nuevoEstado, id]);

            if (result.rows.length === 0) {
                throw new Error('Venta no encontrada');
            }

            return result.rows[0];
        });
    }

    /**
     * Registrar pago de venta
     */
    static async registrarPago(id, montoPago, metodoPago, pagoId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[VentasPOSModel.registrarPago] Registrando pago', {
                venta_id: id,
                monto: montoPago
            });

            // Obtener venta actual
            const ventaQuery = await db.query(
                `SELECT id, total, monto_pagado, monto_pendiente
                 FROM ventas_pos WHERE id = $1`,
                [id]
            );

            if (ventaQuery.rows.length === 0) {
                throw new Error('Venta no encontrada');
            }

            const venta = ventaQuery.rows[0];
            const nuevoMontoPagado = parseFloat(venta.monto_pagado) + parseFloat(montoPago);
            const nuevoMontoPendiente = parseFloat(venta.total) - nuevoMontoPagado;

            let nuevoEstadoPago = 'parcial';
            if (nuevoMontoPagado >= venta.total) {
                nuevoEstadoPago = 'pagado';
            } else if (nuevoMontoPagado <= 0) {
                nuevoEstadoPago = 'pendiente';
            }

            const query = `
                UPDATE ventas_pos
                SET
                    monto_pagado = $1,
                    monto_pendiente = $2,
                    estado_pago = $3,
                    metodo_pago = $4,
                    pago_id = $5,
                    actualizado_en = NOW()
                WHERE id = $6
                RETURNING *
            `;

            const result = await db.query(query, [
                nuevoMontoPagado,
                nuevoMontoPendiente,
                nuevoEstadoPago,
                metodoPago,
                pagoId,
                id
            ]);

            logger.info('[VentasPOSModel.registrarPago] Pago registrado', {
                venta_id: id,
                monto_pagado_total: nuevoMontoPagado,
                monto_pendiente: nuevoMontoPendiente,
                estado_pago: nuevoEstadoPago
            });

            return result.rows[0];
        });
    }

    /**
     * Cancelar venta completa
     * CRÍTICO: Revierte el stock de todos los items
     */
    static async cancelar(id, motivo, usuarioId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[VentasPOSModel.cancelar] Iniciando cancelación', {
                venta_id: id,
                usuario_id: usuarioId
            });

            // Obtener venta con items
            const ventaQuery = await db.query(
                `SELECT id, folio, estado, tipo_venta FROM ventas_pos WHERE id = $1`,
                [id]
            );

            if (ventaQuery.rows.length === 0) {
                throw new Error('Venta no encontrada');
            }

            const venta = ventaQuery.rows[0];

            // Validar que no esté ya cancelada
            if (venta.estado === 'cancelada') {
                throw new Error('La venta ya está cancelada');
            }

            // Obtener items de la venta
            const itemsQuery = await db.query(
                `SELECT producto_id, cantidad FROM ventas_pos_items WHERE venta_pos_id = $1`,
                [id]
            );

            // Revertir stock solo si NO es cotización (las cotizaciones no afectan stock)
            if (venta.tipo_venta !== 'cotizacion' && itemsQuery.rows.length > 0) {
                logger.info('[VentasPOSModel.cancelar] Revirtiendo stock', {
                    total_items: itemsQuery.rows.length
                });

                // Para cada item, crear movimiento de entrada (devolución)
                for (const item of itemsQuery.rows) {
                    // Obtener stock actual del producto
                    const productoQuery = await db.query(
                        `SELECT stock_actual FROM productos WHERE id = $1`,
                        [item.producto_id]
                    );

                    if (productoQuery.rows.length > 0) {
                        const stockAntes = productoQuery.rows[0].stock_actual;
                        const stockDespues = stockAntes + item.cantidad;

                        // Insertar movimiento de inventario (entrada por devolución)
                        await db.query(
                            `INSERT INTO movimientos_inventario (
                                organizacion_id,
                                producto_id,
                                tipo_movimiento,
                                cantidad,
                                stock_antes,
                                stock_despues,
                                venta_pos_id,
                                usuario_id,
                                motivo
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                            [
                                organizacionId,
                                item.producto_id,
                                'entrada_devolucion',
                                item.cantidad,
                                stockAntes,
                                stockDespues,
                                id,
                                usuarioId,
                                `Cancelación de venta ${venta.folio}: ${motivo || 'Sin motivo especificado'}`
                            ]
                        );

                        // Actualizar stock del producto
                        await db.query(
                            `UPDATE productos SET stock_actual = $1, actualizado_en = NOW() WHERE id = $2`,
                            [stockDespues, item.producto_id]
                        );
                    }
                }
            }

            // Actualizar estado de la venta
            const updateQuery = `
                UPDATE ventas_pos
                SET
                    estado = 'cancelada',
                    notas = CASE
                        WHEN notas IS NULL OR notas = '' THEN $1
                        ELSE notas || E'\n---\nCANCELADA: ' || $1
                    END,
                    actualizado_en = NOW()
                WHERE id = $2
                RETURNING *
            `;

            const result = await db.query(updateQuery, [
                `Cancelada por usuario ${usuarioId}. Motivo: ${motivo || 'No especificado'}`,
                id
            ]);

            logger.info('[VentasPOSModel.cancelar] Venta cancelada exitosamente', {
                venta_id: id,
                folio: venta.folio,
                items_revertidos: itemsQuery.rows.length
            });

            return result.rows[0];
        });
    }

    /**
     * Procesar devolución parcial o total de items
     * CRÍTICO: Ajusta stock y puede generar nota de crédito
     */
    static async devolver(id, itemsDevueltos, motivo, usuarioId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[VentasPOSModel.devolver] Iniciando devolución', {
                venta_id: id,
                total_items: itemsDevueltos.length,
                usuario_id: usuarioId
            });

            // Validar que itemsDevueltos no esté vacío
            if (!itemsDevueltos || itemsDevueltos.length === 0) {
                throw new Error('Debe especificar al menos un item para devolver');
            }

            // Obtener venta
            const ventaQuery = await db.query(
                `SELECT id, folio, total, estado FROM ventas_pos WHERE id = $1`,
                [id]
            );

            if (ventaQuery.rows.length === 0) {
                throw new Error('Venta no encontrada');
            }

            const venta = ventaQuery.rows[0];

            // Validar que la venta esté completada
            if (venta.estado !== 'completada') {
                throw new Error('Solo se pueden hacer devoluciones de ventas completadas');
            }

            let totalDevuelto = 0;
            const itemsActualizados = [];

            // Procesar cada item devuelto
            for (const itemDevuelto of itemsDevueltos) {
                // Validar que el item pertenece a la venta
                const itemQuery = await db.query(
                    `SELECT id, producto_id, cantidad, precio_final, subtotal
                     FROM ventas_pos_items
                     WHERE id = $1 AND venta_pos_id = $2`,
                    [itemDevuelto.item_id, id]
                );

                if (itemQuery.rows.length === 0) {
                    throw new Error(`Item ${itemDevuelto.item_id} no pertenece a esta venta`);
                }

                const item = itemQuery.rows[0];

                // Validar cantidad a devolver
                if (itemDevuelto.cantidad_devolver > item.cantidad) {
                    throw new Error(
                        `No se puede devolver ${itemDevuelto.cantidad_devolver} unidades. ` +
                        `Cantidad original: ${item.cantidad}`
                    );
                }

                // Calcular monto de la devolución
                const montoDevuelto = (item.precio_final * itemDevuelto.cantidad_devolver);
                totalDevuelto += montoDevuelto;

                // Obtener stock actual del producto
                const productoQuery = await db.query(
                    `SELECT stock_actual FROM productos WHERE id = $1`,
                    [item.producto_id]
                );

                if (productoQuery.rows.length > 0) {
                    const stockAntes = productoQuery.rows[0].stock_actual;
                    const stockDespues = stockAntes + itemDevuelto.cantidad_devolver;

                    // Insertar movimiento de inventario (entrada por devolución)
                    await db.query(
                        `INSERT INTO movimientos_inventario (
                            organizacion_id,
                            producto_id,
                            tipo_movimiento,
                            cantidad,
                            stock_antes,
                            stock_despues,
                            venta_pos_id,
                            usuario_id,
                            motivo
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                        [
                            organizacionId,
                            item.producto_id,
                            'entrada_devolucion',
                            itemDevuelto.cantidad_devolver,
                            stockAntes,
                            stockDespues,
                            id,
                            usuarioId,
                            `Devolución de venta ${venta.folio}: ${motivo || 'Sin motivo especificado'}`
                        ]
                    );

                    // Actualizar stock del producto
                    await db.query(
                        `UPDATE productos SET stock_actual = $1, actualizado_en = NOW() WHERE id = $2`,
                        [stockDespues, item.producto_id]
                    );
                }

                itemsActualizados.push({
                    item_id: itemDevuelto.item_id,
                    producto_id: item.producto_id,
                    cantidad_devuelta: itemDevuelto.cantidad_devolver,
                    monto_devuelto: montoDevuelto
                });
            }

            // Actualizar notas de la venta con información de devolución
            const notasDevolucion = `DEVOLUCIÓN (${new Date().toISOString().split('T')[0]}): ` +
                `${itemsDevueltos.length} item(s), Total: $${totalDevuelto.toFixed(2)}. ` +
                `Motivo: ${motivo || 'No especificado'}`;

            await db.query(
                `UPDATE ventas_pos
                 SET notas = CASE
                     WHEN notas IS NULL OR notas = '' THEN $1
                     ELSE notas || E'\n---\n' || $1
                 END,
                 actualizado_en = NOW()
                 WHERE id = $2`,
                [notasDevolucion, id]
            );

            logger.info('[VentasPOSModel.devolver] Devolución procesada exitosamente', {
                venta_id: id,
                folio: venta.folio,
                items_devueltos: itemsActualizados.length,
                total_devuelto: totalDevuelto
            });

            return {
                venta_id: id,
                folio: venta.folio,
                items_devueltos: itemsActualizados,
                total_devuelto: totalDevuelto,
                nota_credito: {
                    monto: totalDevuelto,
                    motivo: motivo,
                    fecha: new Date()
                }
            };
        });
    }

    /**
     * Obtener datos para corte de caja
     * Resumen de ventas por método de pago en un rango de fechas
     */
    static async obtenerParaCorteCaja(fechaInicio, fechaFin, organizacionId, usuarioId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            logger.info('[VentasPOSModel.obtenerParaCorteCaja] Generando corte de caja', {
                organizacion_id: organizacionId,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                usuario_id: usuarioId
            });

            // Condiciones WHERE base
            // Nota: fecha_fin se ajusta para incluir todo el día (hasta las 23:59:59)
            // usando < fecha_fin + 1 día en lugar de <= fecha_fin
            let whereConditions = [
                'v.organizacion_id = $1',
                'v.estado = $2',
                'v.fecha_venta >= $3',
                "v.fecha_venta < ($4::date + interval '1 day')"
            ];
            let values = [organizacionId, 'completada', fechaInicio, fechaFin];
            let paramCounter = 5;

            // Filtro opcional por usuario
            if (usuarioId) {
                whereConditions.push(`v.usuario_id = $${paramCounter}`);
                values.push(usuarioId);
                paramCounter++;
            }

            // Query principal: Totales por método de pago
            const totalesPorMetodoQuery = `
                SELECT
                    metodo_pago,
                    COUNT(*) as total_ventas,
                    SUM(total) as total_monto,
                    SUM(subtotal) as total_subtotal,
                    SUM(descuento_monto) as total_descuentos,
                    SUM(impuestos) as total_impuestos,
                    MIN(total) as venta_minima,
                    MAX(total) as venta_maxima,
                    AVG(total) as ticket_promedio
                FROM ventas_pos v
                WHERE ${whereConditions.join(' AND ')}
                GROUP BY metodo_pago
                ORDER BY total_monto DESC
            `;

            const totalesPorMetodo = await db.query(totalesPorMetodoQuery, values);

            // Query: Resumen general
            const resumenGeneralQuery = `
                SELECT
                    COUNT(*) as total_ventas,
                    SUM(total) as total_ingresos,
                    SUM(subtotal) as total_subtotal,
                    SUM(descuento_monto) as total_descuentos,
                    SUM(impuestos) as total_impuestos,
                    AVG(total) as ticket_promedio,
                    MIN(total) as venta_minima,
                    MAX(total) as venta_maxima
                FROM ventas_pos v
                WHERE ${whereConditions.join(' AND ')}
            `;

            const resumenGeneral = await db.query(resumenGeneralQuery, values);

            // Query: Ventas por tipo
            const ventasPorTipoQuery = `
                SELECT
                    tipo_venta,
                    COUNT(*) as total_ventas,
                    SUM(total) as total_monto
                FROM ventas_pos v
                WHERE ${whereConditions.join(' AND ')}
                GROUP BY tipo_venta
                ORDER BY total_monto DESC
            `;

            const ventasPorTipo = await db.query(ventasPorTipoQuery, values);

            // Query: Ventas por hora (análisis de tráfico)
            const ventasPorHoraQuery = `
                SELECT
                    EXTRACT(HOUR FROM fecha_venta) as hora,
                    COUNT(*) as total_ventas,
                    SUM(total) as total_monto
                FROM ventas_pos v
                WHERE ${whereConditions.join(' AND ')}
                GROUP BY hora
                ORDER BY hora ASC
            `;

            const ventasPorHora = await db.query(ventasPorHoraQuery, values);

            // Query: Top 10 productos vendidos
            const topProductosQuery = `
                SELECT
                    vi.nombre_producto,
                    vi.sku,
                    SUM(vi.cantidad) as unidades_vendidas,
                    SUM(vi.subtotal) as total_ventas,
                    COUNT(DISTINCT vi.venta_pos_id) as numero_ventas
                FROM ventas_pos_items vi
                JOIN ventas_pos v ON v.id = vi.venta_pos_id
                WHERE ${whereConditions.join(' AND ')}
                GROUP BY vi.nombre_producto, vi.sku
                ORDER BY total_ventas DESC
                LIMIT 10
            `;

            const topProductos = await db.query(topProductosQuery, values);

            logger.info('[VentasPOSModel.obtenerParaCorteCaja] Corte de caja generado', {
                total_ventas: resumenGeneral.rows[0].total_ventas,
                total_ingresos: resumenGeneral.rows[0].total_ingresos
            });

            return {
                periodo: {
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin,
                    generado_en: new Date()
                },
                resumen_general: resumenGeneral.rows[0],
                totales_por_metodo_pago: totalesPorMetodo.rows,
                ventas_por_tipo: ventasPorTipo.rows,
                ventas_por_hora: ventasPorHora.rows,
                top_productos: topProductos.rows
            };
        });
    }

    /**
     * Agregar items a venta existente
     * POST /api/v1/pos/ventas/:id/items
     */
    static async agregarItems(ventaId, itemsData, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // 1. Verificar que la venta existe y puede ser modificada
            const ventaQuery = `
                SELECT * FROM ventas_pos
                WHERE id = $1 AND organizacion_id = $2
            `;
            const ventaResult = await db.query(ventaQuery, [ventaId, organizacionId]);

            if (ventaResult.rows.length === 0) {
                throw new Error('Venta no encontrada');
            }

            const venta = ventaResult.rows[0];

            if (venta.estado === 'cancelada') {
                throw new Error('No se pueden agregar items a una venta cancelada');
            }

            const itemsCreados = [];
            let sumaSubtotales = 0;

            // 2. Insertar items
            for (const item of itemsData.items) {
                // Obtener precio del producto si no se proporciona
                let precioUnitario = item.precio_unitario;

                if (!precioUnitario) {
                    const productoQuery = `SELECT precio_venta FROM productos WHERE id = $1 AND organizacion_id = $2`;
                    const productoResult = await db.query(productoQuery, [item.producto_id, organizacionId]);

                    if (productoResult.rows.length === 0) {
                        throw new Error(`Producto con ID ${item.producto_id} no encontrado`);
                    }

                    precioUnitario = productoResult.rows[0].precio_venta;
                }

                // Calcular descuentos y subtotal
                let descuentoTotal = parseFloat(item.descuento_monto || 0);
                if (item.descuento_porcentaje && item.descuento_porcentaje > 0) {
                    descuentoTotal += (precioUnitario * item.cantidad * item.descuento_porcentaje) / 100;
                }

                const subtotal = (precioUnitario * item.cantidad) - descuentoTotal;

                const itemQuery = `
                    INSERT INTO ventas_pos_items (
                        venta_pos_id, producto_id, nombre_producto, sku, cantidad,
                        precio_unitario, descuento_porcentaje, descuento_monto,
                        subtotal, aplica_comision, notas
                    )
                    SELECT
                        $1, $2, p.nombre, p.sku, $3, $4, $5, $6, $7, $8, $9
                    FROM productos p
                    WHERE p.id = $2 AND p.organizacion_id = $10
                    RETURNING *
                `;

                const itemValues = [
                    ventaId,
                    item.producto_id,
                    item.cantidad,
                    precioUnitario,
                    item.descuento_porcentaje || 0,
                    descuentoTotal,
                    subtotal,
                    item.aplica_comision !== undefined ? item.aplica_comision : true,
                    item.notas || null,
                    organizacionId
                ];

                const itemResult = await db.query(itemQuery, itemValues);
                itemsCreados.push(itemResult.rows[0]);
                sumaSubtotales += subtotal;
            }

            // 3. Recalcular totales de la venta
            const updateVentaQuery = `
                UPDATE ventas_pos
                SET
                    subtotal = subtotal + $1,
                    total = subtotal + impuestos,
                    actualizado_en = NOW()
                WHERE id = $2 AND organizacion_id = $3
                RETURNING *
            `;

            const ventaActualizada = await db.query(updateVentaQuery, [
                sumaSubtotales,
                ventaId,
                organizacionId
            ]);

            logger.info('[VentasPOSModel.agregarItems] Items agregados a venta', {
                venta_id: ventaId,
                items_agregados: itemsCreados.length,
                suma_subtotales: sumaSubtotales
            });

            return {
                venta: ventaActualizada.rows[0],
                items_agregados: itemsCreados
            };
        });
    }

    /**
     * Actualizar venta completa
     * PUT /api/v1/pos/ventas/:id
     */
    static async actualizar(id, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que la venta existe
            const checkQuery = `
                SELECT * FROM ventas_pos
                WHERE id = $1 AND organizacion_id = $2
            `;
            const checkResult = await db.query(checkQuery, [id, organizacionId]);

            if (checkResult.rows.length === 0) {
                throw new Error('Venta no encontrada');
            }

            const venta = checkResult.rows[0];

            if (venta.estado === 'cancelada') {
                throw new Error('No se puede actualizar una venta cancelada');
            }

            // Construir query de actualización dinámico
            const fields = [];
            const values = [];
            let valueIndex = 1;

            if (data.tipo_venta !== undefined) {
                fields.push(`tipo_venta = $${valueIndex++}`);
                values.push(data.tipo_venta);
            }

            if (data.cliente_id !== undefined) {
                fields.push(`cliente_id = $${valueIndex++}`);
                values.push(data.cliente_id);
            }

            if (data.profesional_id !== undefined) {
                fields.push(`profesional_id = $${valueIndex++}`);
                values.push(data.profesional_id);
            }

            if (data.descuento_porcentaje !== undefined) {
                fields.push(`descuento_porcentaje = $${valueIndex++}`);
                values.push(data.descuento_porcentaje);
            }

            if (data.descuento_monto !== undefined) {
                fields.push(`descuento_monto = $${valueIndex++}`);
                values.push(data.descuento_monto);
            }

            if (data.impuestos !== undefined) {
                fields.push(`impuestos = $${valueIndex++}`);
                values.push(data.impuestos);
            }

            if (data.metodo_pago !== undefined) {
                fields.push(`metodo_pago = $${valueIndex++}`);
                values.push(data.metodo_pago);
            }

            if (data.fecha_apartado !== undefined) {
                fields.push(`fecha_apartado = $${valueIndex++}`);
                values.push(data.fecha_apartado);
            }

            if (data.fecha_vencimiento_apartado !== undefined) {
                fields.push(`fecha_vencimiento_apartado = $${valueIndex++}`);
                values.push(data.fecha_vencimiento_apartado);
            }

            if (data.notas !== undefined) {
                fields.push(`notas = $${valueIndex++}`);
                values.push(data.notas);
            }

            if (fields.length === 0) {
                throw new Error('No se proporcionaron campos para actualizar');
            }

            fields.push(`actualizado_en = NOW()`);

            values.push(id);
            values.push(organizacionId);

            const query = `
                UPDATE ventas_pos
                SET ${fields.join(', ')}
                WHERE id = $${valueIndex++} AND organizacion_id = $${valueIndex++}
                RETURNING *
            `;

            const result = await db.query(query, values);

            logger.info('[VentasPOSModel.actualizar] Venta actualizada', { venta_id: id });

            return result.rows[0];
        });
    }

    /**
     * Eliminar venta (marca como eliminada, revierte stock)
     * DELETE /api/v1/pos/ventas/:id
     */
    static async eliminar(id, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que la venta existe
            const checkQuery = `
                SELECT * FROM ventas_pos
                WHERE id = $1 AND organizacion_id = $2
            `;
            const checkResult = await db.query(checkQuery, [id, organizacionId]);

            if (checkResult.rows.length === 0) {
                throw new Error('Venta no encontrada');
            }

            const venta = checkResult.rows[0];

            if (venta.estado === 'cancelada') {
                throw new Error('La venta ya está cancelada');
            }

            // 1. Obtener items de la venta
            const itemsQuery = `
                SELECT * FROM ventas_pos_items
                WHERE venta_pos_id = $1
            `;
            const itemsResult = await db.query(itemsQuery, [id]);

            // 2. Revertir stock de cada producto
            for (const item of itemsResult.rows) {
                const updateStockQuery = `
                    UPDATE productos
                    SET stock_actual = stock_actual + $1,
                        actualizado_en = NOW()
                    WHERE id = $2 AND organizacion_id = $3
                `;
                await db.query(updateStockQuery, [item.cantidad, item.producto_id, organizacionId]);

                // Registrar movimiento de reversión
                const movimientoQuery = `
                    INSERT INTO movimientos_inventario (
                        organizacion_id, producto_id, tipo_movimiento, cantidad,
                        venta_pos_id, motivo, referencia
                    )
                    VALUES ($1, $2, 'entrada_devolucion', $3, $4, $5, $6)
                `;

                await db.query(movimientoQuery, [
                    organizacionId,
                    item.producto_id,
                    item.cantidad,
                    id,
                    data.motivo || 'Venta eliminada',
                    `Reversión de venta ${venta.folio}`
                ]);
            }

            // 3. Marcar venta como cancelada
            const updateQuery = `
                UPDATE ventas_pos
                SET
                    estado = 'cancelada',
                    cancelada_en = NOW(),
                    cancelada_por = $1,
                    motivo_cancelacion = $2,
                    actualizado_en = NOW()
                WHERE id = $3 AND organizacion_id = $4
                RETURNING *
            `;

            const result = await db.query(updateQuery, [
                data.usuario_id,
                data.motivo || 'Venta eliminada',
                id,
                organizacionId
            ]);

            logger.info('[VentasPOSModel.eliminar] Venta eliminada y stock revertido', {
                venta_id: id,
                folio: venta.folio,
                items_revertidos: itemsResult.rows.length
            });

            return {
                venta: result.rows[0],
                items_revertidos: itemsResult.rows.length,
                mensaje: 'Venta eliminada y stock revertido exitosamente'
            };
        });
    }
}

module.exports = VentasPOSModel;
