const RLSContextManager = require('../../../utils/rlsContextManager');
const ReservasModel = require('../../inventario/models/reservas.model');
const logger = require('../../../utils/logger');
const { ErrorHelper } = require('../../../utils/helpers');

/**
 * Model para ventas POS (Punto de Venta)
 * IMPORTANTE: Usa locks optimistas (SELECT FOR UPDATE) para evitar race conditions
 * Los triggers automáticos generan: folio, totales, descuento de stock
 *
 * ACTUALIZADO Dic 2025: Integración con sistema de reservas de stock
 * para evitar sobreventa en ventas concurrentes multi-cajero
 */
class VentasPOSModel {

    /**
     * Crear nueva venta con items
     * CRÍTICO: Transaction con lock optimista
     */
    static async crear(organizacionId, data) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[VentasPOSModel.crear] Iniciando venta', {
                organizacion_id: organizacionId,
                total_items: data.items?.length || 0,
                cliente_id: data.cliente_id,
                tipo_venta: data.tipo_venta
            });

            // Validar que hay items
            if (!data.items || data.items.length === 0) {
                ErrorHelper.throwValidation('La venta debe tener al menos un item');
            }

            if (data.items.length > 100) {
                ErrorHelper.throwValidation('No se pueden agregar más de 100 items en una venta');
            }

            // Validar cliente si se proporciona
            if (data.cliente_id) {
                const clienteQuery = await db.query(
                    `SELECT id FROM clientes
                     WHERE id = $1 AND organizacion_id = $2`,
                    [data.cliente_id, organizacionId]
                );

                if (clienteQuery.rows.length === 0) {
                    ErrorHelper.throwIfNotFound(null, 'Cliente');
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
                    ErrorHelper.throwIfNotFound(null, 'Profesional');
                }
            }

            // Validar cita si se proporciona
            if (data.cita_id) {
                const citaQuery = await db.query(
                    `SELECT id FROM citas WHERE id = $1`,
                    [data.cita_id]
                );

                if (citaQuery.rows.length === 0) {
                    ErrorHelper.throwIfNotFound(null, 'Cita');
                }
            }

            // ================================================================
            // VALIDACIÓN Y RESERVA ATÓMICA DE STOCK
            // Arquitectura Superior v2.0 - Dic 2025
            // Usa crear_reserva_atomica con SKIP LOCKED para concurrencia
            // ================================================================
            const reservasCreadas = [];

            try {
                for (const item of data.items) {
                    // Validar producto existe y está activo
                    const productoQuery = await db.query(
                        `SELECT id, nombre, sku, precio_venta,
                                stock_actual, permite_venta, activo, tiene_variantes,
                                ruta_preferida
                         FROM productos
                         WHERE id = $1 AND organizacion_id = $2
                         FOR UPDATE`,
                        [item.producto_id, organizacionId]
                    );

                    if (productoQuery.rows.length === 0) {
                        ErrorHelper.throwIfNotFound(null, `Producto con ID ${item.producto_id}`);
                    }

                    const producto = productoQuery.rows[0];

                    if (!producto.activo) {
                        ErrorHelper.throwConflict(`Producto "${producto.nombre}" está inactivo`);
                    }

                    if (!producto.permite_venta) {
                        ErrorHelper.throwConflict(`Producto "${producto.nombre}" no está disponible para venta`);
                    }

                    // Para cotizaciones no necesitamos reservar stock
                    if (data.tipo_venta === 'cotizacion') {
                        continue;
                    }

                    // Productos dropship no necesitan reserva de stock - se genera OC al proveedor
                    if (producto.ruta_preferida === 'dropship') {
                        logger.info('[VentasPOSModel.crear] Producto dropship, omitiendo reserva', {
                            producto_id: item.producto_id,
                            nombre: producto.nombre
                        });
                        continue;
                    }

                    // Crear reserva atómica usando la función SQL con SKIP LOCKED
                    if (item.variante_id) {
                        // Validar que la variante existe y está activa
                        const varianteQuery = await db.query(
                            `SELECT id, nombre_variante, stock_actual, activo
                             FROM variantes_producto
                             WHERE id = $1 AND producto_id = $2`,
                            [item.variante_id, item.producto_id]
                        );

                        if (varianteQuery.rows.length === 0) {
                            ErrorHelper.throwIfNotFound(null, `Variante con ID ${item.variante_id}`);
                        }

                        const variante = varianteQuery.rows[0];

                        if (!variante.activo) {
                            ErrorHelper.throwConflict(`Variante "${variante.nombre_variante}" está inactiva`);
                        }

                        // Crear reserva atómica para VARIANTE
                        const reservaResult = await db.query(
                            `SELECT * FROM crear_reserva_atomica(
                                $1::INTEGER,   -- organizacion_id
                                $2::INTEGER,   -- cantidad
                                'venta_pos',   -- tipo_origen
                                NULL,          -- producto_id (null para variante)
                                $3::INTEGER,   -- variante_id
                                NULL,          -- origen_id (se actualizará después)
                                NULL,          -- origen_referencia
                                $4::INTEGER,   -- sucursal_id
                                $5::INTEGER,   -- usuario_id
                                15             -- minutos_expiracion
                            )`,
                            [organizacionId, item.cantidad, item.variante_id, data.sucursal_id, data.usuario_id]
                        );

                        const reserva = reservaResult.rows[0];

                        if (!reserva.exito) {
                            ErrorHelper.throwConflict(
                                `${reserva.mensaje} para variante "${variante.nombre_variante}"`
                            );
                        }

                        reservasCreadas.push({
                            reserva_id: reserva.reserva_id,
                            producto_id: item.producto_id,
                            variante_id: item.variante_id,
                            cantidad: item.cantidad,
                            nombre: variante.nombre_variante
                        });

                    } else if (!producto.tiene_variantes) {
                        // Crear reserva atómica para PRODUCTO (sin variantes)
                        // Orden: org, cantidad, tipo, producto_id, variante_id, origen_id, origen_ref, sucursal, usuario, mins
                        const reservaResult = await db.query(
                            `SELECT * FROM crear_reserva_atomica(
                                $1::INTEGER,   -- organizacion_id
                                $2::INTEGER,   -- cantidad
                                'venta_pos',   -- tipo_origen
                                $3::INTEGER,   -- producto_id
                                NULL,          -- variante_id (null para producto)
                                NULL,          -- origen_id (se actualizará después)
                                NULL,          -- origen_referencia
                                $4::INTEGER,   -- sucursal_id
                                $5::INTEGER,   -- usuario_id
                                15             -- minutos_expiracion
                            )`,
                            [organizacionId, item.cantidad, item.producto_id, data.sucursal_id, data.usuario_id]
                        );

                        const reserva = reservaResult.rows[0];

                        if (!reserva.exito) {
                            ErrorHelper.throwConflict(
                                `${reserva.mensaje} para producto "${producto.nombre}"`
                            );
                        }

                        reservasCreadas.push({
                            reserva_id: reserva.reserva_id,
                            producto_id: item.producto_id,
                            variante_id: null,
                            cantidad: item.cantidad,
                            nombre: producto.nombre
                        });
                    }
                }

                logger.info('[VentasPOSModel.crear] Reservas creadas exitosamente', {
                    total_reservas: reservasCreadas.length,
                    reservas: reservasCreadas.map(r => ({ id: r.reserva_id, nombre: r.nombre, cantidad: r.cantidad }))
                });

            } catch (error) {
                // Si hay error, liberar todas las reservas creadas
                if (reservasCreadas.length > 0) {
                    logger.warn('[VentasPOSModel.crear] Error en validación, liberando reservas', {
                        reservas_a_liberar: reservasCreadas.length,
                        error: error.message
                    });

                    for (const reserva of reservasCreadas) {
                        try {
                            await db.query(
                                `SELECT liberar_reserva($1, 'Error en creación de venta: ' || $2)`,
                                [reserva.reserva_id, error.message]
                            );
                        } catch (liberarError) {
                            logger.error('[VentasPOSModel.crear] Error liberando reserva', {
                                reserva_id: reserva.reserva_id,
                                error: liberarError.message
                            });
                        }
                    }
                }
                throw error;
            }

            // Calcular totales
            let subtotal = 0;
            logger.info('[VentasPOSModel.crear] DEBUG - Items recibidos:', {
                items: data.items.map(i => ({ producto_id: i.producto_id, precio_unitario: i.precio_unitario, tipo: typeof i.precio_unitario }))
            });
            const itemsConPrecios = data.items.map(item => {
                const precioUnitario = item.precio_unitario || 0;
                logger.info('[VentasPOSModel.crear] DEBUG - Procesando item:', {
                    producto_id: item.producto_id,
                    precio_unitario_raw: item.precio_unitario,
                    precio_unitario_parsed: precioUnitario,
                    tipo: typeof item.precio_unitario
                });
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

            // Ene 2026: Incluir descuento de cupón y puntos en el total
            const descuentoMonto = data.descuento_monto || 0;
            const descuentoCupon = data.descuento_cupon || 0;
            const descuentoPuntos = data.descuento_puntos || 0;
            const puntosCanjeados = data.puntos_canjeados || 0;
            const descuentoVenta = descuentoMonto + descuentoCupon;
            const impuestos = data.impuestos || 0;
            const total = subtotal - descuentoVenta - descuentoPuntos + impuestos;

            logger.info('[VentasPOSModel.crear] DEBUG - Totales calculados:', {
                subtotal,
                descuentoVenta,
                descuentoPuntos,
                puntosCanjeados,
                impuestos,
                total,
                monto_pagado: data.monto_pagado
            });

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
            // ✅ FEATURE: Multi-sucursal - sucursal_id agregado
            // ✅ Ene 2026: puntos_canjeados y descuento_puntos para lealtad
            const ventaQuery = `
                INSERT INTO ventas_pos (
                    organizacion_id,
                    sucursal_id,
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
                    fecha_vencimiento_apartado,
                    puntos_canjeados,
                    descuento_puntos
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
                RETURNING *
            `;

            // El monto_pagado en BD es lo efectivamente cobrado (máximo = total)
            // El "cambio" para el cliente se calcula en frontend como: monto_recibido - total
            // Ene 2026: Si no hay metodo_pago, es pago split y monto_pagado debe ser 0
            // (los pagos se registran después en venta_pagos)
            const esPagoSplit = !data.metodo_pago;
            const montoRecibido = esPagoSplit ? 0 : (data.monto_pagado !== undefined ? data.monto_pagado : total);
            const montoPagado = Math.min(montoRecibido, total); // No guardar más del total
            const montoPendiente = Math.max(0, total - montoPagado);
            let estadoPago = 'pendiente';
            if (montoRecibido >= total) {
                estadoPago = 'pagado';
            } else if (montoRecibido > 0) {
                estadoPago = 'parcial';
            }

            // DEBUG: Verificar valores de pago
            logger.info('[VentasPOSModel.crear] DEBUG PAGO', {
                data_monto_pagado: data.monto_pagado,
                data_monto_pagado_type: typeof data.monto_pagado,
                montoRecibido,
                montoPagado,
                montoPendiente,
                estadoPago,
                total
            });

            // FIX Dic 2025: Insertar inicialmente con monto_pagado = 0
            // El trigger calcular_totales_venta_pos() recalcula el total después de cada item
            // Si insertamos con monto_pagado > 0, el constraint monto_pagado <= total falla
            // cuando el total parcial (1 item) es menor que el monto_pagado total
            const ventaValues = [
                organizacionId,
                data.sucursal_id || null, // ✅ Multi-sucursal
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
                'pendiente',  // estado_pago inicial (se actualiza después)
                0,            // monto_pagado = 0 (se actualiza después de items)
                total,        // monto_pendiente = total (se actualiza después)
                data.notas || null,
                data.tipo_venta === 'cotizacion' ? 'cotizacion' : 'completada',
                new Date(),
                data.fecha_apartado || null,
                data.fecha_vencimiento_apartado || null,
                puntosCanjeados,      // Ene 2026: puntos de lealtad canjeados
                descuentoPuntos       // Ene 2026: descuento en $ por puntos
            ];

            const resultVenta = await db.query(ventaQuery, ventaValues);
            let venta = resultVenta.rows[0];

            // Insertar items de la venta
            const itemsInsertados = [];
            for (const item of data.items) {
                let producto;
                let nombreSnapshot;
                let skuSnapshot;

                // Dic 2025: Soporte para variantes de producto
                if (item.variante_id) {
                    // Obtener datos de la variante
                    const varQuery = await db.query(
                        `SELECT
                            v.nombre_variante AS nombre,
                            v.sku,
                            COALESCE(v.precio_venta, p.precio_venta) AS precio_venta
                         FROM variantes_producto v
                         JOIN productos p ON p.id = v.producto_id
                         WHERE v.id = $1`,
                        [item.variante_id]
                    );
                    producto = varQuery.rows[0];
                    nombreSnapshot = producto.nombre;
                    skuSnapshot = producto.sku;
                } else {
                    // Obtener datos del producto para snapshot
                    const prodQuery = await db.query(
                        `SELECT nombre, sku, precio_venta
                         FROM productos WHERE id = $1`,
                        [item.producto_id]
                    );
                    producto = prodQuery.rows[0];
                    nombreSnapshot = producto.nombre;
                    skuSnapshot = producto.sku;
                }

                // Calcular precio unitario (Dic 2025: precio mayoreo ahora viene de listas_precios)
                let precioUnitario = item.precio_unitario || producto.precio_venta;

                const descuentoMonto = item.descuento_monto || 0;
                const descuentoPorcentaje = item.descuento_porcentaje || 0;
                const precioFinal = descuentoMonto > 0
                    ? precioUnitario - descuentoMonto
                    : precioUnitario * (1 - descuentoPorcentaje / 100);
                const itemSubtotal = item.cantidad * precioFinal;

                // DEBUG: Log del numero_serie_id recibido
                logger.info('[VentasPOSModel.crear] DEBUG NS item:', {
                    producto_id: item.producto_id,
                    numero_serie_id: item.numero_serie_id,
                    numero_serie: item.numero_serie
                });

                const itemQuery = `
                    INSERT INTO ventas_pos_items (
                        venta_pos_id,
                        producto_id,
                        variante_id,
                        nombre_producto,
                        sku,
                        cantidad,
                        precio_unitario,
                        descuento_porcentaje,
                        descuento_monto,
                        precio_final,
                        subtotal,
                        aplica_comision,
                        notas,
                        numero_serie_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    RETURNING *
                `;

                const itemValues = [
                    venta.id,
                    item.producto_id,
                    item.variante_id || null,  // Dic 2025: variante_id
                    nombreSnapshot,
                    skuSnapshot,
                    item.cantidad,
                    precioUnitario,
                    descuentoPorcentaje,
                    descuentoMonto,
                    precioFinal,
                    itemSubtotal,
                    item.aplica_comision !== undefined ? item.aplica_comision : true,
                    item.notas || null,
                    item.numero_serie_id || null  // Dic 2025: NS para trazabilidad
                ];

                const resultItem = await db.query(itemQuery, itemValues);
                itemsInsertados.push(resultItem.rows[0]);

                // NOTA: El trigger SQL calcular_totales_venta_pos() decrementa
                // automáticamente el stock de variantes y productos cuando la
                // venta está 'completada'. No duplicar aquí.

                // Dic 2025: NS se marca como vendido via trigger trg_marcar_ns_vendido
                // El trigger se ejecuta automáticamente después del INSERT
                if (item.numero_serie_id) {
                    logger.info('[VentasPOSModel.crear] NS incluido en item (trigger lo marcará vendido)', {
                        numero_serie_id: item.numero_serie_id,
                        venta_id: venta.id
                    });
                }
            }

            // ================================================================
            // FIX Dic 2025: ACTUALIZAR MONTO PAGADO
            // Ahora que todos los items están insertados y el trigger calculó
            // el total correcto, actualizamos monto_pagado y estado_pago
            // ================================================================
            if (data.tipo_venta !== 'cotizacion') {
                const updatePagoResult = await db.query(
                    `UPDATE ventas_pos
                     SET monto_pagado = $1,
                         monto_pendiente = $2,
                         estado_pago = $3
                     WHERE id = $4
                     RETURNING *`,
                    [montoPagado, montoPendiente, estadoPago, venta.id]
                );
                venta = updatePagoResult.rows[0];

                logger.info('[VentasPOSModel.crear] Pago actualizado después de items', {
                    venta_id: venta.id,
                    monto_pagado: montoPagado,
                    estado_pago: estadoPago,
                    total_final: venta.total
                });
            }

            // NOTA: La comisión se calcula automáticamente por el trigger DEFERRED
            // trigger_calcular_comision_venta que se ejecuta al COMMIT de la transacción

            // ================================================================
            // CONFIRMAR RESERVAS DE STOCK
            // Las reservas se crearon al inicio, ahora las confirmamos
            // El descuento real de stock lo hace el trigger de venta
            // ================================================================
            if (reservasCreadas.length > 0 && data.tipo_venta !== 'cotizacion') {
                for (const reserva of reservasCreadas) {
                    try {
                        // Actualizar origen_id ahora que tenemos el ID de la venta
                        await db.query(
                            `UPDATE reservas_stock
                             SET origen_id = $1,
                                 origen_referencia = $2
                             WHERE id = $3`,
                            [venta.id, venta.folio, reserva.reserva_id]
                        );

                        // Confirmar la reserva
                        await db.query(
                            `SELECT confirmar_reserva_stock($1, $2)`,
                            [reserva.reserva_id, data.usuario_id]
                        );
                    } catch (confirmarError) {
                        logger.error('[VentasPOSModel.crear] Error confirmando reserva', {
                            reserva_id: reserva.reserva_id,
                            venta_id: venta.id,
                            error: confirmarError.message
                        });
                        // No lanzar error aquí, la venta ya está creada
                    }
                }

                logger.info('[VentasPOSModel.crear] Reservas confirmadas', {
                    total_confirmadas: reservasCreadas.length,
                    venta_id: venta.id
                });
            }

            logger.info('[VentasPOSModel.crear] Venta creada exitosamente', {
                venta_id: venta.id,
                folio: venta.folio,
                total: venta.total,
                items: itemsInsertados.length,
                reservas_confirmadas: reservasCreadas.length
            });

            // ================================================================
            // DROPSHIP: Generar OC automáticamente si hay productos dropship
            // Dic 2025: Fix para auto-generación de OC dropship
            // ================================================================
            if (data.tipo_venta !== 'cotizacion') {
                try {
                    // Verificar si hay productos dropship en la venta
                    const tieneDropship = await db.query(
                        `SELECT tiene_productos_dropship($1) as tiene`,
                        [venta.id]
                    );

                    if (tieneDropship.rows[0]?.tiene) {
                        // Verificar configuración auto_generar
                        const configQuery = await db.query(
                            `SELECT COALESCE(dropship_auto_generar_oc, true) as auto_generar
                             FROM configuracion_inventario
                             WHERE organizacion_id = $1`,
                            [organizacionId]
                        );

                        const autoGenerar = configQuery.rows[0]?.auto_generar ?? true;

                        if (autoGenerar) {
                            logger.info('[VentasPOSModel.crear] Generando OC dropship automáticamente', {
                                venta_id: venta.id,
                                folio: venta.folio
                            });

                            const dropshipResult = await db.query(
                                `SELECT crear_oc_dropship_desde_venta($1, $2) as resultado`,
                                [venta.id, data.usuario_id]
                            );

                            const resultado = dropshipResult.rows[0]?.resultado;

                            if (resultado?.exito) {
                                logger.info('[VentasPOSModel.crear] OC dropship creada', {
                                    venta_id: venta.id,
                                    ocs_creadas: resultado.ocs_creadas,
                                    items_procesados: resultado.items_procesados
                                });

                                // Agregar info de dropship a la respuesta
                                venta.dropship = resultado;
                            } else {
                                logger.warn('[VentasPOSModel.crear] Error generando OC dropship', {
                                    venta_id: venta.id,
                                    error: resultado?.mensaje
                                });
                            }
                        } else {
                            // Marcar venta para generar OC manualmente
                            await db.query(
                                `UPDATE ventas_pos SET requiere_oc_dropship = true WHERE id = $1`,
                                [venta.id]
                            );
                            logger.info('[VentasPOSModel.crear] Venta marcada para OC dropship manual', {
                                venta_id: venta.id
                            });
                        }
                    }
                } catch (dropshipError) {
                    // No fallar la venta si hay error en dropship, solo loguear
                    logger.error('[VentasPOSModel.crear] Error en proceso dropship', {
                        venta_id: venta.id,
                        error: dropshipError.message
                    });
                }
            }

            // ================================================================
            // ENE 2026: REGISTRAR USO DE CUPÓN
            // Si la venta tiene cupon_id, registrar en uso_cupones
            // ================================================================
            if (data.cupon_id && data.tipo_venta !== 'cotizacion') {
                try {
                    await db.query(
                        `INSERT INTO uso_cupones (cupon_id, venta_pos_id, cliente_id, descuento_aplicado, subtotal_antes)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [data.cupon_id, venta.id, data.cliente_id || null, descuentoCupon, subtotal]
                    );

                    // Incrementar contador de usos del cupón
                    await db.query(
                        `UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = $1`,
                        [data.cupon_id]
                    );

                    logger.info('[VentasPOSModel.crear] Cupón registrado', {
                        venta_id: venta.id,
                        cupon_id: data.cupon_id,
                        descuento: descuentoCupon
                    });
                } catch (cuponError) {
                    // No fallar la venta si hay error en cupón, solo loguear
                    logger.error('[VentasPOSModel.crear] Error registrando cupón', {
                        venta_id: venta.id,
                        cupon_id: data.cupon_id,
                        error: cuponError.message
                    });
                }
            }

            return {
                ...venta,
                items: itemsInsertados,
                reservas: reservasCreadas
            };
        });
    }

    /**
     * Obtener venta por ID con sus items
     * @param {number} organizacionId - ID de la organización
     * @param {number} id - ID de la venta
     * @param {Object} options - Opciones de query
     * @param {boolean} options.incluirAgendamiento - Si incluir JOINs a clientes/profesionales (default: true)
     */
    static async buscarPorId(organizacionId, id, options = {}) {
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
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros de búsqueda
     * @param {Object} options - Opciones de query
     * @param {boolean} options.incluirAgendamiento - Si incluir JOINs a clientes/profesionales (default: true)
     */
    static async listar(organizacionId, filtros = {}, options = {}) {
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

            // ✅ FEATURE: Multi-sucursal - Filtrar por sucursal
            if (filtros.sucursal_id) {
                whereConditions.push(`v.sucursal_id = $${paramCounter}`);
                values.push(filtros.sucursal_id);
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
    static async actualizarEstado(organizacionId, id, nuevoEstado) {
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

            ErrorHelper.throwIfNotFound(result.rows[0], 'Venta');

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

            ErrorHelper.throwIfNotFound(ventaQuery.rows[0], 'Venta');

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

            ErrorHelper.throwIfNotFound(ventaQuery.rows[0], 'Venta');

            const venta = ventaQuery.rows[0];

            // Validar que no esté ya cancelada
            if (venta.estado === 'cancelada') {
                ErrorHelper.throwConflict('La venta ya está cancelada');
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
                ErrorHelper.throwValidation('Debe especificar al menos un item para devolver');
            }

            // Obtener venta (incluir cliente_id para reversión de puntos)
            const ventaQuery = await db.query(
                `SELECT id, folio, total, estado, cliente_id FROM ventas_pos WHERE id = $1`,
                [id]
            );

            ErrorHelper.throwIfNotFound(ventaQuery.rows[0], 'Venta');

            const venta = ventaQuery.rows[0];

            // Validar que la venta permita devoluciones (completada o con devolución parcial)
            // Ene 2026: Permitir devoluciones adicionales en ventas con devolucion_parcial
            const estadosPermitidos = ['completada', 'devolucion_parcial'];
            if (!estadosPermitidos.includes(venta.estado)) {
                ErrorHelper.throwConflict('Solo se pueden hacer devoluciones de ventas completadas o con devolución parcial');
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
                    ErrorHelper.throwValidation(`Item ${itemDevuelto.item_id} no pertenece a esta venta`);
                }

                const item = itemQuery.rows[0];

                // Validar cantidad a devolver
                if (itemDevuelto.cantidad_devolver > item.cantidad) {
                    ErrorHelper.throwValidation(
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

            // Determinar si es devolución parcial o total
            // Obtener todos los items de la venta para comparar
            const todosItemsQuery = await db.query(
                `SELECT SUM(cantidad) as total_items FROM ventas_pos_items WHERE venta_pos_id = $1`,
                [id]
            );
            const totalItemsVenta = parseInt(todosItemsQuery.rows[0]?.total_items || 0);
            const totalItemsDevueltos = itemsDevueltos.reduce((sum, item) => sum + item.cantidad_devolver, 0);

            const nuevoEstado = totalItemsDevueltos >= totalItemsVenta
                ? 'devolucion_total'
                : 'devolucion_parcial';

            await db.query(
                `UPDATE ventas_pos SET estado = $1, actualizado_en = NOW() WHERE id = $2`,
                [nuevoEstado, id]
            );

            // Ene 2026: Revertir puntos de lealtad si la venta tuvo cliente
            if (venta.cliente_id) {
                try {
                    const LealtadModel = require('./lealtad.model');
                    await LealtadModel.revertirPuntosDevolucion({
                        cliente_id: venta.cliente_id,
                        venta_pos_id: id,
                        monto_devuelto: totalDevuelto,
                        monto_original: parseFloat(venta.total)
                    }, organizacionId, usuarioId);

                    logger.info('[VentasPOSModel.devolver] Puntos revertidos por devolución', {
                        venta_id: id,
                        cliente_id: venta.cliente_id,
                        monto_devuelto: totalDevuelto
                    });
                } catch (errorLealtad) {
                    // No fallar la devolución si hay error en lealtad
                    logger.warn('[VentasPOSModel.devolver] Error al revertir puntos (no crítico)', {
                        error: errorLealtad.message,
                        venta_id: id
                    });
                }
            }

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

            ErrorHelper.throwIfNotFound(ventaResult.rows[0], 'Venta');

            const venta = ventaResult.rows[0];

            if (venta.estado === 'cancelada') {
                ErrorHelper.throwConflict('No se pueden agregar items a una venta cancelada');
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
                        ErrorHelper.throwIfNotFound(null, `Producto con ID ${item.producto_id}`);
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
    static async actualizar(organizacionId, id, data) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que la venta existe
            const checkQuery = `
                SELECT * FROM ventas_pos
                WHERE id = $1 AND organizacion_id = $2
            `;
            const checkResult = await db.query(checkQuery, [id, organizacionId]);

            ErrorHelper.throwIfNotFound(checkResult.rows[0], 'Venta');

            const venta = checkResult.rows[0];

            if (venta.estado === 'cancelada') {
                ErrorHelper.throwConflict('No se puede actualizar una venta cancelada');
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
                ErrorHelper.throwValidation('No se proporcionaron campos para actualizar');
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
    static async eliminar(organizacionId, id, data) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que la venta existe
            const checkQuery = `
                SELECT * FROM ventas_pos
                WHERE id = $1 AND organizacion_id = $2
            `;
            const checkResult = await db.query(checkQuery, [id, organizacionId]);

            ErrorHelper.throwIfNotFound(checkResult.rows[0], 'Venta');

            const venta = checkResult.rows[0];

            if (venta.estado === 'cancelada') {
                ErrorHelper.throwConflict('La venta ya está cancelada');
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

    // =========================================================================
    // MÉTODOS DE RESERVAS DE STOCK (Dic 2025 - Fase 1 Gaps Inventario)
    // =========================================================================

    /**
     * Validar stock disponible para items del carrito
     * Considera reservas activas de otros cajeros
     * @param {Array} items - Array de { producto_id, cantidad }
     * @param {number} organizacionId - ID de la organización
     * @param {number|null} sucursalId - ID de sucursal (opcional)
     * @returns {Object} { valido: boolean, errores: [], stockMap: {} }
     */
    static async validarStockDisponible(items, organizacionId, sucursalId = null) {
        // Transformar items para incluir producto_id en formato correcto
        const itemsFormateados = items.map(i => ({
            producto_id: i.producto_id,
            variante_id: i.variante_id || null
        }));

        // Obtener stock disponible (real - reservas activas) con ruta_preferida
        const stockMap = await ReservasModel.stockDisponibleMultiple(
            itemsFormateados,
            organizacionId,
            sucursalId
        );

        const errores = [];
        let valido = true;

        for (const item of items) {
            // Generar la key correcta según el modelo de reservas
            const key = item.variante_id
                ? `variante_${item.variante_id}`
                : `producto_${item.producto_id}`;

            const stockInfo = stockMap[key];

            if (!stockInfo) {
                errores.push({
                    producto_id: item.producto_id,
                    error: 'Producto no encontrado'
                });
                valido = false;
                continue;
            }

            // DROPSHIP: Productos con ruta_preferida='dropship' no requieren stock
            // El proveedor envía directamente al cliente
            if (stockInfo.ruta_preferida === 'dropship') {
                logger.debug('[VentasPOSModel.validarStockDisponible] Producto dropship, sin validación de stock', {
                    producto_id: item.producto_id,
                    nombre: stockInfo.nombre
                });
                continue; // Saltar validación de stock para productos dropship
            }

            if (stockInfo.stock_disponible < item.cantidad) {
                errores.push({
                    producto_id: item.producto_id,
                    nombre: stockInfo.nombre,
                    stock_disponible: stockInfo.stock_disponible,
                    cantidad_solicitada: item.cantidad,
                    error: `Stock insuficiente. Disponible: ${stockInfo.stock_disponible}`
                });
                valido = false;
            }
        }

        return { valido, errores, stockMap };
    }

    /**
     * Crear reservas para items del carrito
     * Llamar cuando el usuario agrega productos al carrito
     * @param {Array} items - Array de { producto_id, cantidad }
     * @param {number} organizacionId - ID de la organización
     * @param {number|null} sucursalId - ID de sucursal
     * @param {number|null} usuarioId - ID del usuario/cajero
     * @returns {Array} Array de reservas creadas con sus IDs
     */
    static async crearReservasCarrito(items, organizacionId, sucursalId = null, usuarioId = null) {
        logger.info('[VentasPOSModel.crearReservasCarrito] Creando reservas', {
            organizacion_id: organizacionId,
            total_items: items.length
        });

        try {
            const reservas = await ReservasModel.crearMultiple(
                items,
                'venta_pos',
                null, // origen_id: null porque la venta aún no existe
                organizacionId,
                sucursalId,
                usuarioId
            );

            logger.info('[VentasPOSModel.crearReservasCarrito] Reservas creadas', {
                total: reservas.length
            });

            return reservas;
        } catch (error) {
            logger.error('[VentasPOSModel.crearReservasCarrito] Error', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Confirmar reservas al completar venta
     * Llamar después de crear la venta exitosamente
     * @param {Array<number>} reservaIds - IDs de las reservas a confirmar
     * @param {number} organizacionId - ID de la organización
     */
    static async confirmarReservasVenta(reservaIds, organizacionId) {
        if (!reservaIds || reservaIds.length === 0) {
            return [];
        }

        logger.info('[VentasPOSModel.confirmarReservasVenta] Confirmando', {
            total: reservaIds.length
        });

        const confirmadas = await ReservasModel.confirmarMultiple(reservaIds, organizacionId);

        logger.info('[VentasPOSModel.confirmarReservasVenta] Confirmadas', {
            total: confirmadas.length
        });

        return confirmadas;
    }

    /**
     * Cancelar reservas de un carrito abandonado
     * @param {Array<number>} reservaIds - IDs de las reservas a cancelar
     * @param {number} organizacionId - ID de la organización
     */
    static async cancelarReservasCarrito(reservaIds, organizacionId) {
        if (!reservaIds || reservaIds.length === 0) {
            return 0;
        }

        logger.info('[VentasPOSModel.cancelarReservasCarrito] Cancelando', {
            total: reservaIds.length
        });

        let canceladas = 0;
        for (const reservaId of reservaIds) {
            const resultado = await ReservasModel.cancelar(reservaId, organizacionId);
            if (resultado) canceladas++;
        }

        logger.info('[VentasPOSModel.cancelarReservasCarrito] Canceladas', {
            total: canceladas
        });

        return canceladas;
    }

    /**
     * Crear venta con reservas pre-existentes
     * Flujo optimizado: reservas ya creadas, solo confirmar
     * @param {number} organizacionId - ID de la organización
     * @param {Object} data - Datos de la venta (igual que crear)
     * @param {Array<number>} reservaIds - IDs de reservas a confirmar
     */
    static async crearConReservas(organizacionId, data, reservaIds) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[VentasPOSModel.crearConReservas] Iniciando venta con reservas', {
                organizacion_id: organizacionId,
                total_items: data.items?.length || 0,
                total_reservas: reservaIds?.length || 0
            });

            // Confirmar reservas primero (esto valida stock y lo descuenta)
            if (reservaIds && reservaIds.length > 0) {
                for (const reservaId of reservaIds) {
                    const query = `SELECT confirmar_reserva_stock($1) as resultado`;
                    const result = await db.query(query, [reservaId]);

                    if (!result.rows[0].resultado) {
                        ErrorHelper.throwConflict(`No se pudo confirmar la reserva ${reservaId}`);
                    }
                }

                logger.info('[VentasPOSModel.crearConReservas] Reservas confirmadas', {
                    total: reservaIds.length
                });
            }

            // Ahora crear la venta normal (sin validar stock, ya fue descontado)
            // NOTA: Usamos una versión simplificada que no valida stock
            const venta = await this.crearSinValidarStock(organizacionId, data, db);

            return venta;
        });
    }

    /**
     * Crear venta sin validar stock (para uso con reservas)
     * SOLO USAR INTERNAMENTE después de confirmar reservas
     * @private
     */
    static async crearSinValidarStock(organizacionId, data, db) {
        // Validar que hay items
        if (!data.items || data.items.length === 0) {
            ErrorHelper.throwValidation('La venta debe tener al menos un item');
        }

        // Generar folio
        const year = new Date().getFullYear();
        const folioQuery = await db.query(
            `SELECT COALESCE(MAX(CAST(SUBSTRING(folio FROM 'POS-\\d{4}-(\\d+)') AS INTEGER)), 0) + 1 AS contador
             FROM ventas_pos
             WHERE organizacion_id = $1 AND folio LIKE $2`,
            [organizacionId, `POS-${year}-%`]
        );
        const contador = folioQuery.rows[0].contador;
        const folio = `POS-${year}-${String(contador).padStart(4, '0')}`;

        // Calcular totales
        let subtotal = 0;

        // Insertar venta
        const montoRecibido = data.monto_pagado !== undefined ? data.monto_pagado : 0;
        const ventaQuery = `
            INSERT INTO ventas_pos (
                organizacion_id, sucursal_id, folio, tipo_venta,
                cliente_id, cita_id, profesional_id, usuario_id,
                subtotal, descuento_porcentaje, descuento_monto,
                impuestos, total, metodo_pago, estado_pago,
                monto_pagado, monto_pendiente, notas, estado, fecha_venta
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING *
        `;

        // Calcular subtotal de items
        for (const item of data.items) {
            const prodQuery = await db.query(
                `SELECT precio_venta FROM productos WHERE id = $1`,
                [item.producto_id]
            );
            const precioUnitario = item.precio_unitario || prodQuery.rows[0]?.precio_venta || 0;
            const descuentoMonto = item.descuento_monto || 0;
            subtotal += item.cantidad * (precioUnitario - descuentoMonto);
        }

        const descuentoVenta = data.descuento_monto || 0;
        const impuestos = data.impuestos || 0;
        const total = subtotal - descuentoVenta + impuestos;
        const montoPagado = Math.min(montoRecibido, total);
        const montoPendiente = Math.max(0, total - montoPagado);
        let estadoPago = 'pendiente';
        if (montoRecibido >= total) estadoPago = 'pagado';
        else if (montoRecibido > 0) estadoPago = 'parcial';

        const ventaValues = [
            organizacionId,
            data.sucursal_id || null,
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
            new Date()
        ];

        const resultVenta = await db.query(ventaQuery, ventaValues);
        const venta = resultVenta.rows[0];

        // Insertar items
        const itemsInsertados = [];
        for (const item of data.items) {
            const prodQuery = await db.query(
                `SELECT nombre, sku, precio_venta FROM productos WHERE id = $1`,
                [item.producto_id]
            );
            const producto = prodQuery.rows[0];
            const precioUnitario = item.precio_unitario || producto.precio_venta;
            const descuentoMonto = item.descuento_monto || 0;
            const descuentoPorcentaje = item.descuento_porcentaje || 0;
            const precioFinal = descuentoMonto > 0
                ? precioUnitario - descuentoMonto
                : precioUnitario * (1 - descuentoPorcentaje / 100);
            const itemSubtotal = item.cantidad * precioFinal;

            const itemQuery = `
                INSERT INTO ventas_pos_items (
                    venta_pos_id, producto_id, nombre_producto, sku, cantidad,
                    precio_unitario, descuento_porcentaje, descuento_monto,
                    precio_final, subtotal, aplica_comision, notas
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `;

            const itemValues = [
                venta.id, item.producto_id, producto.nombre, producto.sku,
                item.cantidad, precioUnitario, descuentoPorcentaje, descuentoMonto,
                precioFinal, itemSubtotal,
                item.aplica_comision !== undefined ? item.aplica_comision : true,
                item.notas || null
            ];

            const resultItem = await db.query(itemQuery, itemValues);
            itemsInsertados.push(resultItem.rows[0]);
        }

        logger.info('[VentasPOSModel.crearSinValidarStock] Venta creada', {
            venta_id: venta.id,
            folio: venta.folio
        });

        return {
            ...venta,
            items: itemsInsertados
        };
    }

    // =========================================================================
    // PAGO SPLIT - Múltiples métodos de pago (Ene 2026)
    // =========================================================================

    /**
     * Registrar pagos split para una venta
     * Soporta múltiples métodos de pago en una sola venta
     * @param {number} ventaId - ID de la venta
     * @param {Array} pagos - Array de { metodo_pago, monto, monto_recibido?, referencia? }
     * @param {number} usuarioId - ID del usuario que registra el pago
     * @param {number} organizacionId - ID de la organización
     * @param {number|null} clienteId - ID del cliente (opcional, para crédito)
     */
    static async registrarPagosSplit(ventaId, pagos, usuarioId, organizacionId, clienteId = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[VentasPOSModel.registrarPagosSplit] Iniciando', {
                venta_id: ventaId,
                total_pagos: pagos.length,
                usuario_id: usuarioId
            });

            // Obtener venta
            const ventaQuery = await db.query(
                `SELECT id, total, monto_pagado, estado, estado_pago
                 FROM ventas_pos WHERE id = $1 AND organizacion_id = $2
                 FOR UPDATE`,
                [ventaId, organizacionId]
            );

            ErrorHelper.throwIfNotFound(ventaQuery.rows[0], 'Venta');

            const venta = ventaQuery.rows[0];

            if (venta.estado === 'cancelada') {
                ErrorHelper.throwConflict('No se pueden registrar pagos en una venta cancelada');
            }

            // Calcular total de pagos a registrar
            const totalPagos = pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);
            const totalEsperado = parseFloat(venta.total) - parseFloat(venta.monto_pagado);

            // Validar que no se pague de más (excepto efectivo que genera cambio)
            const pagoEfectivo = pagos.find(p => p.metodo_pago === 'efectivo');
            const pagosNoEfectivo = pagos.filter(p => p.metodo_pago !== 'efectivo');
            const totalNoEfectivo = pagosNoEfectivo.reduce((sum, p) => sum + parseFloat(p.monto), 0);

            if (totalNoEfectivo > totalEsperado) {
                ErrorHelper.throwValidation(`Los pagos no pueden exceder el monto pendiente ($${totalEsperado.toFixed(2)})`);
            }

            const pagosRegistrados = [];

            // Registrar cada pago
            for (const pago of pagos) {
                // Validar método cuenta_cliente
                if (pago.metodo_pago === 'cuenta_cliente') {
                    if (!clienteId) {
                        ErrorHelper.throwValidation('Se requiere cliente_id para pagos a cuenta');
                    }

                    // Registrar cargo de crédito
                    await db.query(
                        `SELECT registrar_cargo_credito($1, $2, $3, $4, NULL, $5, $6)`,
                        [
                            organizacionId,
                            clienteId,
                            pago.monto,
                            ventaId,
                            `Venta a crédito - ${venta.id}`,
                            usuarioId
                        ]
                    );

                    logger.info('[VentasPOSModel.registrarPagosSplit] Cargo de crédito registrado', {
                        cliente_id: clienteId,
                        monto: pago.monto
                    });
                }

                // Calcular cambio para efectivo
                let cambio = 0;
                if (pago.metodo_pago === 'efectivo' && pago.monto_recibido) {
                    cambio = parseFloat(pago.monto_recibido) - parseFloat(pago.monto);
                }

                // Insertar pago
                const insertQuery = `
                    INSERT INTO venta_pagos (
                        venta_pos_id,
                        metodo_pago,
                        monto,
                        monto_recibido,
                        cambio,
                        referencia,
                        usuario_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING *
                `;

                const result = await db.query(insertQuery, [
                    ventaId,
                    pago.metodo_pago,
                    pago.monto,
                    pago.metodo_pago === 'efectivo' ? (pago.monto_recibido || pago.monto) : null,
                    pago.metodo_pago === 'efectivo' ? cambio : 0,
                    pago.referencia || null,
                    usuarioId
                ]);

                pagosRegistrados.push(result.rows[0]);
            }

            // El trigger sincronizar_pagos_venta() actualiza automáticamente:
            // - monto_pagado
            // - monto_pendiente
            // - estado_pago
            // - metodo_pago

            // Obtener venta actualizada
            const ventaActualizada = await db.query(
                `SELECT * FROM ventas_pos WHERE id = $1`,
                [ventaId]
            );

            logger.info('[VentasPOSModel.registrarPagosSplit] Pagos registrados', {
                venta_id: ventaId,
                total_pagos: pagosRegistrados.length,
                estado_pago: ventaActualizada.rows[0].estado_pago,
                monto_pagado: ventaActualizada.rows[0].monto_pagado
            });

            return {
                venta: ventaActualizada.rows[0],
                pagos: pagosRegistrados
            };
        });
    }

    /**
     * Obtener desglose de pagos de una venta
     * @param {number} ventaId - ID de la venta
     * @param {number} organizacionId - ID de la organización
     */
    static async obtenerPagosVenta(ventaId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar que la venta existe
            const ventaQuery = await db.query(
                `SELECT id, total, monto_pagado, monto_pendiente, estado_pago, metodo_pago
                 FROM ventas_pos WHERE id = $1`,
                [ventaId]
            );

            ErrorHelper.throwIfNotFound(ventaQuery.rows[0], 'Venta');

            // Obtener pagos
            const pagosQuery = await db.query(
                `SELECT
                    vp.*,
                    u.nombre AS usuario_nombre
                 FROM venta_pagos vp
                 LEFT JOIN usuarios u ON u.id = vp.usuario_id
                 WHERE vp.venta_pos_id = $1
                 ORDER BY vp.creado_en ASC`,
                [ventaId]
            );

            return {
                venta: ventaQuery.rows[0],
                pagos: pagosQuery.rows,
                resumen: {
                    total_pagos: pagosQuery.rows.length,
                    total_efectivo: pagosQuery.rows
                        .filter(p => p.metodo_pago === 'efectivo')
                        .reduce((sum, p) => sum + parseFloat(p.monto), 0),
                    total_tarjeta: pagosQuery.rows
                        .filter(p => ['tarjeta_debito', 'tarjeta_credito'].includes(p.metodo_pago))
                        .reduce((sum, p) => sum + parseFloat(p.monto), 0),
                    total_otros: pagosQuery.rows
                        .filter(p => !['efectivo', 'tarjeta_debito', 'tarjeta_credito'].includes(p.metodo_pago))
                        .reduce((sum, p) => sum + parseFloat(p.monto), 0),
                    cambio_total: pagosQuery.rows
                        .reduce((sum, p) => sum + parseFloat(p.cambio || 0), 0)
                }
            };
        });
    }
}

module.exports = VentasPOSModel;
