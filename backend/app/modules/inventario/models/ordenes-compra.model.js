const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const workflowAdapter = require('../../../services/workflowAdapter');

/**
 * Model para gestión de Órdenes de Compra
 * Ciclo completo: borrador → enviada → parcial/recibida | cancelada
 */
class OrdenesCompraModel {

    // ========================================================================
    // CRUD BÁSICO
    // ========================================================================

    /**
     * Crear nueva orden de compra (estado: borrador)
     */
    static async crear(data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[OrdenesCompraModel.crear] Iniciando', {
                organizacion_id: organizacionId,
                proveedor_id: data.proveedor_id
            });

            // Validar que el proveedor existe y está activo
            const proveedorQuery = await db.query(
                `SELECT id, nombre, dias_credito FROM proveedores
                 WHERE id = $1 AND activo = true`,
                [data.proveedor_id]
            );

            if (proveedorQuery.rows.length === 0) {
                throw new Error('Proveedor no encontrado o está inactivo');
            }

            const proveedor = proveedorQuery.rows[0];

            // Crear orden (el trigger genera el folio)
            const query = `
                INSERT INTO ordenes_compra (
                    organizacion_id,
                    proveedor_id,
                    fecha_entrega_esperada,
                    descuento_porcentaje,
                    descuento_monto,
                    impuestos,
                    dias_credito,
                    notas,
                    referencia_proveedor,
                    usuario_id,
                    estado
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'borrador')
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.proveedor_id,
                data.fecha_entrega_esperada || null,
                data.descuento_porcentaje || 0,
                data.descuento_monto || 0,
                data.impuestos || 0,
                data.dias_credito !== undefined ? data.dias_credito : proveedor.dias_credito,
                data.notas || null,
                data.referencia_proveedor || null,
                data.usuario_id || null
            ];

            const result = await db.query(query, values);
            const orden = result.rows[0];

            // Si vienen items, agregarlos
            let items = [];
            if (data.items && data.items.length > 0) {
                items = await this._agregarItemsInterno(db, orden.id, data.items, organizacionId);
            }

            logger.info('[OrdenesCompraModel.crear] Orden creada', {
                orden_id: orden.id,
                folio: orden.folio,
                items: items.length
            });

            return {
                ...orden,
                proveedor_nombre: proveedor.nombre,
                items
            };
        });
    }

    /**
     * Obtener orden por ID con items
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.withBypass(async (db) => {
            // Obtener orden con datos del proveedor
            const ordenQuery = `
                SELECT
                    oc.*,
                    p.nombre AS proveedor_nombre,
                    p.telefono AS proveedor_telefono,
                    p.email AS proveedor_email,
                    p.direccion AS proveedor_direccion,
                    u.nombre AS usuario_nombre
                FROM ordenes_compra oc
                LEFT JOIN proveedores p ON p.id = oc.proveedor_id
                LEFT JOIN usuarios u ON u.id = oc.usuario_id
                WHERE oc.id = $1 AND oc.organizacion_id = $2
            `;

            const ordenResult = await db.query(ordenQuery, [id, organizacionId]);

            if (ordenResult.rows.length === 0) {
                return null;
            }

            const orden = ordenResult.rows[0];

            // Obtener items de la orden
            const itemsQuery = `
                SELECT
                    oci.*,
                    pr.stock_actual,
                    pr.precio_compra AS precio_compra_actual
                FROM ordenes_compra_items oci
                LEFT JOIN productos pr ON pr.id = oci.producto_id
                WHERE oci.orden_compra_id = $1
                ORDER BY oci.id ASC
            `;

            const itemsResult = await db.query(itemsQuery, [id]);

            // Obtener historial de recepciones
            const recepcionesQuery = `
                SELECT
                    ocr.*,
                    u.nombre AS usuario_nombre
                FROM ordenes_compra_recepciones ocr
                LEFT JOIN usuarios u ON u.id = ocr.usuario_id
                WHERE ocr.orden_compra_id = $1
                ORDER BY ocr.recibido_en DESC
            `;

            const recepcionesResult = await db.query(recepcionesQuery, [id]);

            return {
                ...orden,
                items: itemsResult.rows,
                recepciones: recepcionesResult.rows
            };
        });
    }

    /**
     * Listar órdenes con filtros
     */
    static async listar(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['oc.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            // Filtro por proveedor
            if (filtros.proveedor_id) {
                whereConditions.push(`oc.proveedor_id = $${paramCounter}`);
                values.push(filtros.proveedor_id);
                paramCounter++;
            }

            // Filtro por estado
            if (filtros.estado) {
                whereConditions.push(`oc.estado = $${paramCounter}`);
                values.push(filtros.estado);
                paramCounter++;
            }

            // Filtro por estado de pago
            if (filtros.estado_pago) {
                whereConditions.push(`oc.estado_pago = $${paramCounter}`);
                values.push(filtros.estado_pago);
                paramCounter++;
            }

            // Filtro por rango de fechas
            if (filtros.fecha_desde) {
                whereConditions.push(`oc.fecha_orden >= $${paramCounter}`);
                values.push(filtros.fecha_desde);
                paramCounter++;
            }

            if (filtros.fecha_hasta) {
                whereConditions.push(`oc.fecha_orden <= $${paramCounter}`);
                values.push(filtros.fecha_hasta);
                paramCounter++;
            }

            // Búsqueda por folio
            if (filtros.folio) {
                whereConditions.push(`oc.folio ILIKE $${paramCounter}`);
                values.push(`%${filtros.folio}%`);
                paramCounter++;
            }

            const query = `
                SELECT
                    oc.*,
                    p.nombre AS proveedor_nombre,
                    COUNT(oci.id) AS items_count,
                    SUM(oci.cantidad_ordenada) AS total_unidades,
                    SUM(oci.cantidad_recibida) AS unidades_recibidas
                FROM ordenes_compra oc
                LEFT JOIN proveedores p ON p.id = oc.proveedor_id
                LEFT JOIN ordenes_compra_items oci ON oci.orden_compra_id = oc.id AND oci.estado != 'cancelado'
                WHERE ${whereConditions.join(' AND ')}
                GROUP BY oc.id, p.nombre
                ORDER BY oc.creado_en DESC
                LIMIT $${paramCounter}
                OFFSET $${paramCounter + 1}
            `;

            values.push(filtros.limit || 50);
            values.push(filtros.offset || 0);

            const result = await db.query(query, values);

            // Obtener totales (usamos las condiciones originales sin limit/offset)
            const countConditions = whereConditions.join(' AND ');
            const countValues = values.slice(0, paramCounter - 1); // Sin limit ni offset

            const countQuery = `
                SELECT
                    COUNT(*) as cantidad,
                    COALESCE(SUM(total), 0) as valor_total,
                    COALESCE(SUM(monto_pagado), 0) as total_pagado,
                    COALESCE(SUM(total - monto_pagado), 0) as pendiente_pago,
                    SUM(CASE WHEN estado = 'borrador' THEN 1 ELSE 0 END) as borradores,
                    SUM(CASE WHEN estado IN ('enviada', 'parcial') THEN 1 ELSE 0 END) as pendientes,
                    SUM(CASE WHEN estado = 'recibida' THEN 1 ELSE 0 END) as recibidas
                FROM ordenes_compra oc
                WHERE ${countConditions}
            `;

            const countResult = await db.query(countQuery, countValues);

            return {
                ordenes: result.rows,
                totales: countResult.rows[0],
                limit: filtros.limit || 50,
                offset: filtros.offset || 0
            };
        });
    }

    /**
     * Actualizar orden (solo borradores)
     */
    static async actualizar(id, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[OrdenesCompraModel.actualizar] Iniciando', {
                orden_id: id
            });

            // Verificar que la orden existe y está en borrador
            const checkQuery = await db.query(
                `SELECT id, estado FROM ordenes_compra WHERE id = $1`,
                [id]
            );

            if (checkQuery.rows.length === 0) {
                throw new Error('Orden de compra no encontrada');
            }

            if (checkQuery.rows[0].estado !== 'borrador') {
                throw new Error('Solo se pueden editar órdenes en estado borrador');
            }

            // Construir query dinámico
            const camposActualizables = [
                'proveedor_id', 'fecha_entrega_esperada', 'descuento_porcentaje',
                'descuento_monto', 'impuestos', 'dias_credito', 'notas',
                'referencia_proveedor'
            ];
            const updates = [];
            const values = [];
            let paramCounter = 1;

            camposActualizables.forEach(campo => {
                if (data[campo] !== undefined) {
                    updates.push(`${campo} = $${paramCounter}`);
                    values.push(data[campo]);
                    paramCounter++;
                }
            });

            if (updates.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            values.push(id);

            const query = `
                UPDATE ordenes_compra
                SET ${updates.join(', ')}, actualizado_en = NOW()
                WHERE id = $${paramCounter}
                RETURNING *
            `;

            const result = await db.query(query, values);

            logger.info('[OrdenesCompraModel.actualizar] Orden actualizada', {
                orden_id: id
            });

            return result.rows[0];
        });
    }

    /**
     * Eliminar orden (solo borradores)
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[OrdenesCompraModel.eliminar] Iniciando', {
                orden_id: id
            });

            // El trigger validará que sea borrador
            const query = `
                DELETE FROM ordenes_compra
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                throw new Error('Orden de compra no encontrada');
            }

            logger.info('[OrdenesCompraModel.eliminar] Orden eliminada', {
                orden_id: id,
                folio: result.rows[0].folio
            });

            return result.rows[0];
        });
    }

    // ========================================================================
    // GESTIÓN DE ITEMS
    // ========================================================================

    /**
     * Agregar items a una orden
     */
    static async agregarItems(ordenId, items, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[OrdenesCompraModel.agregarItems] Iniciando', {
                orden_id: ordenId,
                total_items: items.length
            });

            // Verificar que la orden existe y está en borrador
            const ordenQuery = await db.query(
                `SELECT id, estado FROM ordenes_compra WHERE id = $1`,
                [ordenId]
            );

            if (ordenQuery.rows.length === 0) {
                throw new Error('Orden de compra no encontrada');
            }

            if (ordenQuery.rows[0].estado !== 'borrador') {
                throw new Error('Solo se pueden agregar items a órdenes en estado borrador');
            }

            const itemsCreados = await this._agregarItemsInterno(db, ordenId, items, organizacionId);

            logger.info('[OrdenesCompraModel.agregarItems] Items agregados', {
                orden_id: ordenId,
                items_creados: itemsCreados.length
            });

            return itemsCreados;
        });
    }

    /**
     * Método interno para agregar items (usado en crear y agregarItems)
     */
    static async _agregarItemsInterno(db, ordenId, items, organizacionId) {
        const itemsCreados = [];

        for (const item of items) {
            // Obtener datos del producto para snapshot
            const productoQuery = await db.query(
                `SELECT id, nombre, sku, precio_compra, unidad_medida
                 FROM productos
                 WHERE id = $1 AND organizacion_id = $2 AND activo = true`,
                [item.producto_id, organizacionId]
            );

            if (productoQuery.rows.length === 0) {
                throw new Error(`Producto con ID ${item.producto_id} no encontrado o inactivo`);
            }

            const producto = productoQuery.rows[0];

            // Verificar si el producto ya está en la orden
            const existeQuery = await db.query(
                `SELECT id FROM ordenes_compra_items
                 WHERE orden_compra_id = $1 AND producto_id = $2`,
                [ordenId, item.producto_id]
            );

            if (existeQuery.rows.length > 0) {
                throw new Error(`El producto "${producto.nombre}" ya está en esta orden`);
            }

            const insertQuery = `
                INSERT INTO ordenes_compra_items (
                    orden_compra_id,
                    producto_id,
                    nombre_producto,
                    sku,
                    unidad_medida,
                    cantidad_ordenada,
                    precio_unitario,
                    fecha_vencimiento,
                    notas
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const precioUnitario = item.precio_unitario || producto.precio_compra || 0;

            const insertValues = [
                ordenId,
                item.producto_id,
                producto.nombre,
                producto.sku,
                producto.unidad_medida || 'unidad',
                item.cantidad_ordenada,
                precioUnitario,
                item.fecha_vencimiento || null,
                item.notas || null
            ];

            const insertResult = await db.query(insertQuery, insertValues);
            itemsCreados.push(insertResult.rows[0]);
        }

        return itemsCreados;
    }

    /**
     * Actualizar item de orden
     */
    static async actualizarItem(ordenId, itemId, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que la orden está en borrador
            const ordenQuery = await db.query(
                `SELECT estado FROM ordenes_compra WHERE id = $1`,
                [ordenId]
            );

            if (ordenQuery.rows.length === 0) {
                throw new Error('Orden de compra no encontrada');
            }

            if (ordenQuery.rows[0].estado !== 'borrador') {
                throw new Error('Solo se pueden editar items de órdenes en estado borrador');
            }

            const camposActualizables = [
                'cantidad_ordenada', 'precio_unitario', 'fecha_vencimiento', 'notas'
            ];
            const updates = [];
            const values = [];
            let paramCounter = 1;

            camposActualizables.forEach(campo => {
                if (data[campo] !== undefined) {
                    updates.push(`${campo} = $${paramCounter}`);
                    values.push(data[campo]);
                    paramCounter++;
                }
            });

            if (updates.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            values.push(itemId);
            values.push(ordenId);

            const query = `
                UPDATE ordenes_compra_items
                SET ${updates.join(', ')}, actualizado_en = NOW()
                WHERE id = $${paramCounter} AND orden_compra_id = $${paramCounter + 1}
                RETURNING *
            `;

            const result = await db.query(query, values);

            if (result.rows.length === 0) {
                throw new Error('Item no encontrado en esta orden');
            }

            return result.rows[0];
        });
    }

    /**
     * Eliminar item de orden
     */
    static async eliminarItem(ordenId, itemId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que la orden está en borrador
            const ordenQuery = await db.query(
                `SELECT estado FROM ordenes_compra WHERE id = $1`,
                [ordenId]
            );

            if (ordenQuery.rows.length === 0) {
                throw new Error('Orden de compra no encontrada');
            }

            if (ordenQuery.rows[0].estado !== 'borrador') {
                throw new Error('Solo se pueden eliminar items de órdenes en estado borrador');
            }

            const query = `
                DELETE FROM ordenes_compra_items
                WHERE id = $1 AND orden_compra_id = $2
                RETURNING *
            `;

            const result = await db.query(query, [itemId, ordenId]);

            if (result.rows.length === 0) {
                throw new Error('Item no encontrado en esta orden');
            }

            return result.rows[0];
        });
    }

    // ========================================================================
    // CAMBIOS DE ESTADO
    // ========================================================================

    /**
     * Enviar orden al proveedor
     * Si requiere aprobación, cambia a 'pendiente_aprobacion' e inicia workflow
     * Si no requiere aprobación, cambia a 'enviada' directamente
     */
    static async enviar(id, usuarioId, organizacionId) {
        // Primero, obtener datos de la orden para evaluar workflow
        const ordenPrevia = await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT oc.id, oc.estado, oc.folio, oc.total, oc.proveedor_id,
                       p.nombre as proveedor_nombre,
                       COUNT(oci.id) as total_items
                FROM ordenes_compra oc
                LEFT JOIN proveedores p ON p.id = oc.proveedor_id
                LEFT JOIN ordenes_compra_items oci ON oci.orden_compra_id = oc.id
                WHERE oc.id = $1 AND oc.organizacion_id = $2
                GROUP BY oc.id, p.nombre
            `;
            return await db.query(query, [id, organizacionId]);
        });

        if (ordenPrevia.rows.length === 0) {
            throw new Error('Orden de compra no encontrada');
        }

        const orden = ordenPrevia.rows[0];

        if (orden.estado !== 'borrador') {
            throw new Error('Solo se pueden enviar órdenes en estado borrador');
        }

        if (parseInt(orden.total_items) === 0) {
            throw new Error('No se puede enviar una orden sin items');
        }

        logger.info('[OrdenesCompraModel.enviar] Iniciando', {
            orden_id: id,
            total: orden.total,
            usuario_id: usuarioId
        });

        // Evaluar si requiere aprobación (via adapter para evitar acoplamiento)
        const workflowAplicable = await workflowAdapter.evaluarRequiereAprobacion(
            'orden_compra',
            id,
            { total: parseFloat(orden.total) },
            usuarioId,
            organizacionId
        );

        if (workflowAplicable) {
            // Requiere aprobación: iniciar workflow
            logger.info('[OrdenesCompraModel.enviar] Requiere aprobación', {
                orden_id: id,
                workflow_id: workflowAplicable.id
            });

            return await RLSContextManager.transaction(organizacionId, async (db) => {
                // Cambiar estado a pendiente_aprobacion
                const updateQuery = `
                    UPDATE ordenes_compra
                    SET estado = 'pendiente_aprobacion', actualizado_en = NOW()
                    WHERE id = $1
                    RETURNING *
                `;

                const result = await db.query(updateQuery, [id]);
                const ordenActualizada = result.rows[0];

                // Iniciar instancia de workflow (via adapter, DENTRO de transacción)
                await workflowAdapter.iniciarWorkflow(
                    workflowAplicable.id,
                    'orden_compra',
                    id,
                    {
                        folio: orden.folio,
                        total: orden.total,
                        proveedor_nombre: orden.proveedor_nombre
                    },
                    usuarioId,
                    organizacionId,
                    db // Pasar conexión para evitar transacción anidada
                );

                logger.info('[OrdenesCompraModel.enviar] Orden pendiente de aprobación', {
                    orden_id: id,
                    folio: orden.folio
                });

                return {
                    ...ordenActualizada,
                    requiere_aprobacion: true,
                    mensaje: 'La orden requiere aprobación antes de ser enviada al proveedor'
                };
            });
        } else {
            // No requiere aprobación: enviar directamente
            return await RLSContextManager.transaction(organizacionId, async (db) => {
                const query = `
                    UPDATE ordenes_compra
                    SET estado = 'enviada', enviada_en = NOW(), actualizado_en = NOW()
                    WHERE id = $1
                    RETURNING *
                `;

                const result = await db.query(query, [id]);

                logger.info('[OrdenesCompraModel.enviar] Orden enviada directamente', {
                    orden_id: id,
                    folio: orden.folio
                });

                return {
                    ...result.rows[0],
                    requiere_aprobacion: false
                };
            });
        }
    }

    /**
     * Cancelar orden
     */
    static async cancelar(id, motivo, usuarioId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[OrdenesCompraModel.cancelar] Iniciando', { orden_id: id });

            // Verificar estado
            const ordenQuery = await db.query(
                `SELECT id, estado, folio FROM ordenes_compra WHERE id = $1`,
                [id]
            );

            if (ordenQuery.rows.length === 0) {
                throw new Error('Orden de compra no encontrada');
            }

            const orden = ordenQuery.rows[0];

            if (orden.estado === 'recibida') {
                throw new Error('No se puede cancelar una orden ya recibida completamente');
            }

            if (orden.estado === 'cancelada') {
                throw new Error('La orden ya está cancelada');
            }

            // Cancelar orden
            const query = `
                UPDATE ordenes_compra
                SET
                    estado = 'cancelada',
                    cancelada_en = NOW(),
                    notas = CASE
                        WHEN notas IS NULL OR notas = '' THEN $1
                        ELSE notas || E'\n---\nCANCELADA: ' || $1
                    END,
                    actualizado_en = NOW()
                WHERE id = $2
                RETURNING *
            `;

            const result = await db.query(query, [
                `Cancelada por usuario ${usuarioId}. Motivo: ${motivo || 'No especificado'}`,
                id
            ]);

            // Cancelar items pendientes
            await db.query(
                `UPDATE ordenes_compra_items
                 SET estado = 'cancelado', actualizado_en = NOW()
                 WHERE orden_compra_id = $1 AND estado IN ('pendiente', 'parcial')`,
                [id]
            );

            logger.info('[OrdenesCompraModel.cancelar] Orden cancelada', {
                orden_id: id,
                folio: orden.folio
            });

            return result.rows[0];
        });
    }

    // ========================================================================
    // RECEPCIÓN DE MERCANCÍA
    // ========================================================================

    /**
     * Recibir mercancía (parcial o total)
     */
    static async recibirMercancia(ordenId, recepciones, usuarioId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[OrdenesCompraModel.recibirMercancia] Iniciando', {
                orden_id: ordenId,
                total_recepciones: recepciones.length
            });

            // Verificar que la orden existe y está en estado válido
            const ordenQuery = await db.query(
                `SELECT id, estado, folio FROM ordenes_compra WHERE id = $1`,
                [ordenId]
            );

            if (ordenQuery.rows.length === 0) {
                throw new Error('Orden de compra no encontrada');
            }

            const orden = ordenQuery.rows[0];

            if (!['enviada', 'parcial'].includes(orden.estado)) {
                throw new Error('Solo se puede recibir mercancía de órdenes enviadas o con recepción parcial');
            }

            const itemsRecibidos = [];

            for (const recepcion of recepciones) {
                // Obtener item y validar
                const itemQuery = await db.query(
                    `SELECT oci.*, p.stock_actual
                     FROM ordenes_compra_items oci
                     JOIN productos p ON p.id = oci.producto_id
                     WHERE oci.id = $1 AND oci.orden_compra_id = $2`,
                    [recepcion.item_id, ordenId]
                );

                if (itemQuery.rows.length === 0) {
                    throw new Error(`Item ${recepcion.item_id} no encontrado en esta orden`);
                }

                const item = itemQuery.rows[0];

                if (item.estado === 'completo') {
                    throw new Error(`El item "${item.nombre_producto}" ya fue recibido completamente`);
                }

                if (item.estado === 'cancelado') {
                    throw new Error(`El item "${item.nombre_producto}" está cancelado`);
                }

                // Validar cantidad
                const cantidadPendiente = item.cantidad_ordenada - item.cantidad_recibida;
                if (recepcion.cantidad > cantidadPendiente) {
                    throw new Error(
                        `No se puede recibir ${recepcion.cantidad} unidades de "${item.nombre_producto}". ` +
                        `Pendientes: ${cantidadPendiente}`
                    );
                }

                const nuevaCantidadRecibida = item.cantidad_recibida + recepcion.cantidad;

                // Actualizar item
                await db.query(
                    `UPDATE ordenes_compra_items
                     SET
                         cantidad_recibida = $1,
                         fecha_vencimiento = COALESCE($2, fecha_vencimiento),
                         lote = COALESCE($3, lote),
                         actualizado_en = NOW()
                     WHERE id = $4`,
                    [
                        nuevaCantidadRecibida,
                        recepcion.fecha_vencimiento || null,
                        recepcion.lote || null,
                        recepcion.item_id
                    ]
                );

                // Calcular stock antes y después
                const stockAntes = parseInt(item.stock_actual);
                const stockDespues = stockAntes + recepcion.cantidad;

                // Crear movimiento de inventario
                const movimientoQuery = await db.query(
                    `INSERT INTO movimientos_inventario (
                        organizacion_id,
                        producto_id,
                        tipo_movimiento,
                        cantidad,
                        costo_unitario,
                        valor_total,
                        stock_antes,
                        stock_despues,
                        proveedor_id,
                        usuario_id,
                        referencia,
                        motivo,
                        fecha_vencimiento,
                        lote
                    )
                    SELECT
                        oc.organizacion_id,
                        $1,
                        'entrada_compra',
                        $2,
                        $3,
                        $2 * $3,
                        $4,
                        $5,
                        oc.proveedor_id,
                        $6,
                        $7,
                        'Recepción de orden de compra',
                        $8,
                        $9
                    FROM ordenes_compra oc
                    WHERE oc.id = $10
                    RETURNING id`,
                    [
                        item.producto_id,
                        recepcion.cantidad,
                        recepcion.precio_unitario_real || item.precio_unitario,
                        stockAntes,
                        stockDespues,
                        usuarioId,
                        `OC: ${orden.folio}`,
                        recepcion.fecha_vencimiento || null,
                        recepcion.lote || null,
                        ordenId
                    ]
                );

                const movimientoId = movimientoQuery.rows[0].id;

                // Actualizar stock del producto
                await db.query(
                    `UPDATE productos
                     SET stock_actual = $1, actualizado_en = NOW()
                     WHERE id = $2`,
                    [stockDespues, item.producto_id]
                );

                // Actualizar precio_compra si cambió
                if (recepcion.precio_unitario_real && recepcion.precio_unitario_real !== item.precio_unitario) {
                    await db.query(
                        `UPDATE productos
                         SET precio_compra = $1, actualizado_en = NOW()
                         WHERE id = $2`,
                        [recepcion.precio_unitario_real, item.producto_id]
                    );
                }

                // Registrar en historial de recepciones
                await db.query(
                    `INSERT INTO ordenes_compra_recepciones (
                        orden_compra_id,
                        orden_compra_item_id,
                        cantidad_recibida,
                        precio_unitario_real,
                        fecha_vencimiento,
                        lote,
                        movimiento_inventario_id,
                        usuario_id,
                        notas
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        ordenId,
                        recepcion.item_id,
                        recepcion.cantidad,
                        recepcion.precio_unitario_real || null,
                        recepcion.fecha_vencimiento || null,
                        recepcion.lote || null,
                        movimientoId,
                        usuarioId,
                        recepcion.notas || null
                    ]
                );

                itemsRecibidos.push({
                    item_id: recepcion.item_id,
                    producto_id: item.producto_id,
                    nombre_producto: item.nombre_producto,
                    cantidad_recibida: recepcion.cantidad,
                    nuevo_stock: stockDespues,
                    movimiento_id: movimientoId
                });
            }

            logger.info('[OrdenesCompraModel.recibirMercancia] Recepción completada', {
                orden_id: ordenId,
                folio: orden.folio,
                items_recibidos: itemsRecibidos.length
            });

            // Obtener orden actualizada
            const ordenActualizada = await this.obtenerPorId(ordenId, organizacionId);

            return {
                orden: ordenActualizada,
                items_recibidos: itemsRecibidos
            };
        });
    }

    // ========================================================================
    // REPORTES
    // ========================================================================

    /**
     * Obtener órdenes pendientes de recibir
     */
    static async obtenerPendientes(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    oc.*,
                    p.nombre AS proveedor_nombre,
                    COUNT(oci.id) AS total_items,
                    SUM(oci.cantidad_ordenada) AS total_unidades,
                    SUM(oci.cantidad_recibida) AS unidades_recibidas,
                    SUM(oci.cantidad_ordenada - oci.cantidad_recibida) AS unidades_pendientes
                FROM ordenes_compra oc
                JOIN proveedores p ON p.id = oc.proveedor_id
                LEFT JOIN ordenes_compra_items oci ON oci.orden_compra_id = oc.id AND oci.estado != 'cancelado'
                WHERE oc.organizacion_id = $1
                  AND oc.estado IN ('enviada', 'parcial')
                GROUP BY oc.id, p.nombre
                ORDER BY oc.fecha_entrega_esperada ASC NULLS LAST, oc.fecha_orden ASC
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }

    /**
     * Obtener órdenes pendientes de pago
     */
    static async obtenerPendientesPago(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    oc.*,
                    p.nombre AS proveedor_nombre,
                    (oc.total - oc.monto_pagado) AS monto_pendiente,
                    CASE
                        WHEN oc.fecha_vencimiento_pago < CURRENT_DATE THEN 'vencido'
                        WHEN oc.fecha_vencimiento_pago <= CURRENT_DATE + INTERVAL '7 days' THEN 'proximo'
                        ELSE 'vigente'
                    END AS estado_vencimiento
                FROM ordenes_compra oc
                JOIN proveedores p ON p.id = oc.proveedor_id
                WHERE oc.organizacion_id = $1
                  AND oc.estado = 'recibida'
                  AND oc.estado_pago IN ('pendiente', 'parcial')
                ORDER BY oc.fecha_vencimiento_pago ASC NULLS LAST
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }

    /**
     * Registrar pago de orden
     */
    static async registrarPago(id, montoPago, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Obtener orden actual
            const ordenQuery = await db.query(
                `SELECT id, total, monto_pagado, estado FROM ordenes_compra WHERE id = $1`,
                [id]
            );

            if (ordenQuery.rows.length === 0) {
                throw new Error('Orden no encontrada');
            }

            const orden = ordenQuery.rows[0];

            if (orden.estado !== 'recibida') {
                throw new Error('Solo se pueden registrar pagos de órdenes recibidas');
            }

            const nuevoMontoPagado = parseFloat(orden.monto_pagado) + parseFloat(montoPago);
            const montoPendiente = parseFloat(orden.total) - nuevoMontoPagado;

            let nuevoEstadoPago = 'parcial';
            if (nuevoMontoPagado >= parseFloat(orden.total)) {
                nuevoEstadoPago = 'pagado';
            } else if (nuevoMontoPagado <= 0) {
                nuevoEstadoPago = 'pendiente';
            }

            const query = `
                UPDATE ordenes_compra
                SET
                    monto_pagado = $1,
                    estado_pago = $2,
                    actualizado_en = NOW()
                WHERE id = $3
                RETURNING *
            `;

            const result = await db.query(query, [nuevoMontoPagado, nuevoEstadoPago, id]);

            return {
                ...result.rows[0],
                monto_pendiente: montoPendiente
            };
        });
    }

    /**
     * Estadísticas de compras por proveedor
     */
    static async estadisticasPorProveedor(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['oc.organizacion_id = $1', "oc.estado = 'recibida'"];
            let values = [organizacionId];
            let paramCounter = 2;

            if (filtros.fecha_desde) {
                whereConditions.push(`oc.fecha_recepcion >= $${paramCounter}`);
                values.push(filtros.fecha_desde);
                paramCounter++;
            }

            if (filtros.fecha_hasta) {
                whereConditions.push(`oc.fecha_recepcion <= $${paramCounter}`);
                values.push(filtros.fecha_hasta);
                paramCounter++;
            }

            const query = `
                SELECT
                    p.id AS proveedor_id,
                    p.nombre AS proveedor_nombre,
                    COUNT(DISTINCT oc.id) AS total_ordenes,
                    SUM(oc.total) AS monto_total,
                    AVG(oc.total) AS ticket_promedio,
                    SUM(oci.cantidad_recibida) AS unidades_compradas,
                    COUNT(DISTINCT oci.producto_id) AS productos_distintos
                FROM ordenes_compra oc
                JOIN proveedores p ON p.id = oc.proveedor_id
                LEFT JOIN ordenes_compra_items oci ON oci.orden_compra_id = oc.id
                WHERE ${whereConditions.join(' AND ')}
                GROUP BY p.id, p.nombre
                ORDER BY monto_total DESC
            `;

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    // ========================================================================
    // AUTO-GENERACIÓN DE OC (Dic 2025 - Fase 2)
    // ========================================================================

    /**
     * Generar OC desde alerta de stock bajo
     * Crea una orden de compra borrador con los productos con stock bajo
     * @param {number} productoId - ID del producto con stock bajo
     * @param {number} usuarioId - Usuario que genera la OC
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Orden de compra creada
     */
    static async generarDesdeAlerta(productoId, usuarioId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[OrdenesCompraModel.generarDesdeAlerta] Iniciando', {
                producto_id: productoId,
                usuario_id: usuarioId
            });

            // Obtener producto con proveedor
            const productoQuery = await db.query(
                `SELECT p.id, p.nombre, p.sku, p.proveedor_id, p.precio_compra,
                        p.stock_actual, p.stock_minimo, p.stock_maximo,
                        p.cantidad_oc_sugerida, p.auto_generar_oc,
                        prov.nombre as proveedor_nombre
                 FROM productos p
                 LEFT JOIN proveedores prov ON prov.id = p.proveedor_id
                 WHERE p.id = $1 AND p.organizacion_id = $2 AND p.activo = true`,
                [productoId, organizacionId]
            );

            if (productoQuery.rows.length === 0) {
                throw new Error('Producto no encontrado');
            }

            const producto = productoQuery.rows[0];

            if (!producto.proveedor_id) {
                throw new Error(`El producto "${producto.nombre}" no tiene proveedor asignado`);
            }

            // Calcular cantidad sugerida
            // Prioridad: cantidad_oc_sugerida > (stock_maximo - stock_actual) > 50
            let cantidadSugerida = producto.cantidad_oc_sugerida || 50;
            if (producto.stock_maximo) {
                const diferencia = producto.stock_maximo - producto.stock_actual;
                if (diferencia > 0) {
                    cantidadSugerida = Math.max(cantidadSugerida, diferencia);
                }
            }

            // Crear la orden de compra
            const ordenData = {
                proveedor_id: producto.proveedor_id,
                usuario_id: usuarioId,
                notas: `OC generada automáticamente por alerta de stock bajo del producto: ${producto.nombre} (${producto.sku || 'Sin SKU'})`,
                items: [{
                    producto_id: producto.id,
                    cantidad_ordenada: cantidadSugerida,
                    precio_unitario: producto.precio_compra || 0
                }]
            };

            const ordenCreada = await this.crear(ordenData, organizacionId);

            logger.info('[OrdenesCompraModel.generarDesdeAlerta] OC creada', {
                orden_id: ordenCreada.id,
                folio: ordenCreada.folio,
                producto: producto.nombre,
                cantidad: cantidadSugerida
            });

            return {
                ...ordenCreada,
                producto_origen: {
                    id: producto.id,
                    nombre: producto.nombre,
                    sku: producto.sku,
                    stock_actual: producto.stock_actual,
                    stock_minimo: producto.stock_minimo
                }
            };
        });
    }

    /**
     * Generar OC automáticas para todos los productos con stock bajo y auto_generar_oc = true
     * @param {number} organizacionId - ID de la organización
     * @param {number} usuarioId - Usuario del sistema (para auditoría)
     * @returns {Array} Lista de OCs generadas
     */
    static async generarOCsAutomaticas(organizacionId, usuarioId = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[OrdenesCompraModel.generarOCsAutomaticas] Iniciando', {
                organizacion_id: organizacionId
            });

            // Obtener productos con stock bajo y auto_generar_oc activo
            const productosQuery = await db.query(
                `SELECT p.id, p.nombre, p.sku, p.proveedor_id, p.precio_compra,
                        p.stock_actual, p.stock_minimo, p.stock_maximo,
                        p.cantidad_oc_sugerida
                 FROM productos p
                 WHERE p.organizacion_id = $1
                   AND p.activo = true
                   AND p.auto_generar_oc = true
                   AND p.proveedor_id IS NOT NULL
                   AND p.stock_actual <= p.stock_minimo
                   AND NOT EXISTS (
                       -- No generar si ya hay una OC pendiente para este producto
                       SELECT 1 FROM ordenes_compra_items oci
                       JOIN ordenes_compra oc ON oc.id = oci.orden_compra_id
                       WHERE oci.producto_id = p.id
                         AND oc.estado IN ('borrador', 'pendiente_aprobacion', 'enviada', 'parcial')
                         AND oc.organizacion_id = $1
                   )`,
                [organizacionId]
            );

            if (productosQuery.rows.length === 0) {
                logger.info('[OrdenesCompraModel.generarOCsAutomaticas] No hay productos para generar OCs');
                return [];
            }

            // Agrupar productos por proveedor
            const productosPorProveedor = {};
            for (const producto of productosQuery.rows) {
                if (!productosPorProveedor[producto.proveedor_id]) {
                    productosPorProveedor[producto.proveedor_id] = [];
                }
                productosPorProveedor[producto.proveedor_id].push(producto);
            }

            const ordenesCreadas = [];

            // Crear una OC por proveedor con todos sus productos
            for (const [proveedorId, productos] of Object.entries(productosPorProveedor)) {
                const items = productos.map(p => {
                    let cantidad = p.cantidad_oc_sugerida || 50;
                    if (p.stock_maximo) {
                        const diferencia = p.stock_maximo - p.stock_actual;
                        if (diferencia > 0) {
                            cantidad = Math.max(cantidad, diferencia);
                        }
                    }
                    return {
                        producto_id: p.id,
                        cantidad_ordenada: cantidad,
                        precio_unitario: p.precio_compra || 0
                    };
                });

                const nombresProductos = productos.map(p => p.nombre).join(', ');

                const ordenData = {
                    proveedor_id: parseInt(proveedorId),
                    usuario_id: usuarioId,
                    notas: `OC auto-generada por alerta de stock bajo. Productos: ${nombresProductos}`,
                    items
                };

                // Usar el método crear existente
                const ordenCreada = await this.crear(ordenData, organizacionId);

                ordenesCreadas.push({
                    ...ordenCreada,
                    productos_incluidos: productos.length
                });

                logger.info('[OrdenesCompraModel.generarOCsAutomaticas] OC creada', {
                    orden_id: ordenCreada.id,
                    folio: ordenCreada.folio,
                    proveedor_id: proveedorId,
                    productos: productos.length
                });
            }

            logger.info('[OrdenesCompraModel.generarOCsAutomaticas] Proceso completado', {
                ordenes_creadas: ordenesCreadas.length
            });

            return ordenesCreadas;
        });
    }

    /**
     * Obtener sugerencias de OC (productos con stock bajo)
     * @param {number} organizacionId - ID de la organización
     * @returns {Array} Lista de productos sugeridos para OC
     */
    static async obtenerSugerenciasOC(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    p.id,
                    p.nombre,
                    p.sku,
                    p.stock_actual,
                    p.stock_minimo,
                    p.stock_maximo,
                    p.precio_compra,
                    p.cantidad_oc_sugerida,
                    p.auto_generar_oc,
                    p.proveedor_id,
                    prov.nombre as proveedor_nombre,
                    CASE
                        WHEN p.stock_maximo IS NOT NULL AND p.stock_maximo > p.stock_actual
                        THEN GREATEST(COALESCE(p.cantidad_oc_sugerida, 50), p.stock_maximo - p.stock_actual)
                        ELSE COALESCE(p.cantidad_oc_sugerida, 50)
                    END as cantidad_sugerida,
                    CASE
                        WHEN EXISTS (
                            SELECT 1 FROM ordenes_compra_items oci
                            JOIN ordenes_compra oc ON oc.id = oci.orden_compra_id
                            WHERE oci.producto_id = p.id
                              AND oc.estado IN ('borrador', 'pendiente_aprobacion', 'enviada', 'parcial')
                        ) THEN true
                        ELSE false
                    END as tiene_oc_pendiente
                FROM productos p
                LEFT JOIN proveedores prov ON prov.id = p.proveedor_id
                WHERE p.organizacion_id = $1
                  AND p.activo = true
                  AND p.stock_actual <= p.stock_minimo
                ORDER BY
                    p.proveedor_id NULLS LAST,
                    (p.stock_minimo - p.stock_actual) DESC
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }
}

module.exports = OrdenesCompraModel;
