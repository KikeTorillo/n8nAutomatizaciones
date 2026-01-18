/**
 * Modelo para Operaciones de Almacen
 * Sistema multi-paso: Recepcion -> QC -> Almacenamiento | Picking -> Empaque -> Envio
 * Fecha: 31 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class OperacionesAlmacenModel {
    // ==================== CRUD BASICO ====================

    /**
     * Crear operacion manualmente
     */
    static async crear(organizacionId, data, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (client) => {
            // Generar folio
            const folioResult = await client.query(
                'SELECT generar_folio_operacion($1, $2) as folio',
                [organizacionId, data.tipo_operacion]
            );
            const folio = folioResult.rows[0].folio;

            // Crear operacion
            const result = await client.query(
                `INSERT INTO operaciones_almacen (
                    organizacion_id, sucursal_id, folio, nombre,
                    tipo_operacion, estado, origen_tipo, origen_id, origen_folio,
                    ubicacion_origen_id, ubicacion_destino_id,
                    asignado_a, prioridad, fecha_programada, notas,
                    creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING *`,
                [
                    organizacionId,
                    data.sucursal_id,
                    folio,
                    data.nombre || `${data.tipo_operacion} ${folio}`,
                    data.tipo_operacion,
                    'borrador',
                    data.origen_tipo || 'manual',
                    data.origen_id || null,
                    data.origen_folio || null,
                    data.ubicacion_origen_id || null,
                    data.ubicacion_destino_id || null,
                    data.asignado_a || null,
                    data.prioridad || 5,
                    data.fecha_programada || null,
                    data.notas || null,
                    usuarioId
                ]
            );
            const operacion = result.rows[0];

            // Crear items si se proporcionan
            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    await client.query(
                        `INSERT INTO operaciones_almacen_items (
                            operacion_id, producto_id, variante_id, numero_serie_id,
                            cantidad_demandada, ubicacion_origen_id, ubicacion_destino_id,
                            lote, fecha_vencimiento, notas
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            operacion.id,
                            item.producto_id,
                            item.variante_id || null,
                            item.numero_serie_id || null,
                            item.cantidad,
                            item.ubicacion_origen_id || null,
                            item.ubicacion_destino_id || null,
                            item.lote || null,
                            item.fecha_vencimiento || null,
                            item.notas || null
                        ]
                    );
                }
            }

            return operacion;
        });
    }

    /**
     * Listar operaciones con filtros
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            let query = `
                SELECT
                    o.*,
                    s.nombre as sucursal_nombre,
                    u_origen.codigo as ubicacion_origen_codigo,
                    u_destino.codigo as ubicacion_destino_codigo,
                    u_asignado.nombre as asignado_nombre,
                    u_creador.nombre as creado_por_nombre
                FROM operaciones_almacen o
                JOIN sucursales s ON s.id = o.sucursal_id
                LEFT JOIN ubicaciones_almacen u_origen ON u_origen.id = o.ubicacion_origen_id
                LEFT JOIN ubicaciones_almacen u_destino ON u_destino.id = o.ubicacion_destino_id
                LEFT JOIN usuarios u_asignado ON u_asignado.id = o.asignado_a
                LEFT JOIN usuarios u_creador ON u_creador.id = o.creado_por
                WHERE o.organizacion_id = $1
            `;
            const params = [organizacionId];
            let paramIndex = 2;

            if (filtros.sucursal_id) {
                query += ` AND o.sucursal_id = $${paramIndex++}`;
                params.push(filtros.sucursal_id);
            }

            if (filtros.tipo_operacion) {
                query += ` AND o.tipo_operacion = $${paramIndex++}`;
                params.push(filtros.tipo_operacion);
            }

            if (filtros.estado) {
                query += ` AND o.estado = $${paramIndex++}`;
                params.push(filtros.estado);
            }

            if (filtros.estados) {
                query += ` AND o.estado = ANY($${paramIndex++})`;
                params.push(filtros.estados);
            }

            if (filtros.asignado_a) {
                query += ` AND o.asignado_a = $${paramIndex++}`;
                params.push(filtros.asignado_a);
            }

            if (filtros.origen_tipo) {
                query += ` AND o.origen_tipo = $${paramIndex++}`;
                params.push(filtros.origen_tipo);
            }

            if (filtros.origen_id) {
                query += ` AND o.origen_id = $${paramIndex++}`;
                params.push(filtros.origen_id);
            }

            query += ' ORDER BY o.prioridad ASC, o.creado_en DESC';

            if (filtros.limit) {
                query += ` LIMIT $${paramIndex++}`;
                params.push(filtros.limit);
            }

            const result = await client.query(query, params);
            return result.rows;
        });
    }

    /**
     * Obtener operacion por ID con items
     */
    static async buscarPorId(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const opResult = await client.query(
                `SELECT
                    o.*,
                    s.nombre as sucursal_nombre,
                    u_origen.codigo as ubicacion_origen_codigo,
                    u_origen.nombre as ubicacion_origen_nombre,
                    u_destino.codigo as ubicacion_destino_codigo,
                    u_destino.nombre as ubicacion_destino_nombre,
                    u_asignado.nombre as asignado_nombre,
                    u_creador.nombre as creado_por_nombre
                FROM operaciones_almacen o
                JOIN sucursales s ON s.id = o.sucursal_id
                LEFT JOIN ubicaciones_almacen u_origen ON u_origen.id = o.ubicacion_origen_id
                LEFT JOIN ubicaciones_almacen u_destino ON u_destino.id = o.ubicacion_destino_id
                LEFT JOIN usuarios u_asignado ON u_asignado.id = o.asignado_a
                LEFT JOIN usuarios u_creador ON u_creador.id = o.creado_por
                WHERE o.id = $1 AND o.organizacion_id = $2`,
                [id, organizacionId]
            );

            if (opResult.rows.length === 0) {
                return null;
            }

            const itemsResult = await client.query(
                `SELECT
                    oi.*,
                    p.nombre as producto_nombre,
                    p.sku as producto_sku,
                    v.nombre as variante_nombre,
                    ns.numero_serie,
                    u_origen.codigo as ubicacion_origen_codigo,
                    u_destino.codigo as ubicacion_destino_codigo
                FROM operaciones_almacen_items oi
                JOIN productos p ON p.id = oi.producto_id
                LEFT JOIN variantes_producto v ON v.id = oi.variante_id
                LEFT JOIN numeros_serie ns ON ns.id = oi.numero_serie_id
                LEFT JOIN ubicaciones_almacen u_origen ON u_origen.id = oi.ubicacion_origen_id
                LEFT JOIN ubicaciones_almacen u_destino ON u_destino.id = oi.ubicacion_destino_id
                WHERE oi.operacion_id = $1
                ORDER BY p.nombre`,
                [id]
            );

            return {
                ...opResult.rows[0],
                items: itemsResult.rows
            };
        });
    }

    /**
     * Actualizar operacion
     */
    static async actualizar(organizacionId, id, data) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `UPDATE operaciones_almacen SET
                    nombre = COALESCE($2, nombre),
                    ubicacion_origen_id = COALESCE($3, ubicacion_origen_id),
                    ubicacion_destino_id = COALESCE($4, ubicacion_destino_id),
                    asignado_a = $5,
                    prioridad = COALESCE($6, prioridad),
                    fecha_programada = $7,
                    notas = $8,
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $9
                RETURNING *`,
                [
                    id,
                    data.nombre,
                    data.ubicacion_origen_id,
                    data.ubicacion_destino_id,
                    data.asignado_a,
                    data.prioridad,
                    data.fecha_programada,
                    data.notas,
                    organizacionId
                ]
            );
            return result.rows[0];
        });
    }

    // ==================== GENERACION DESDE DOCUMENTOS ====================

    /**
     * Generar operaciones desde Orden de Compra
     */
    static async generarDesdeOC(ordenCompraId, sucursalId, usuarioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT crear_operaciones_recepcion($1, $2, $3) as operacion_id',
                [ordenCompraId, sucursalId, usuarioId]
            );
            return result.rows[0].operacion_id;
        });
    }

    /**
     * Generar operaciones desde Venta POS
     */
    static async generarDesdeVenta(ventaPosId, sucursalId, usuarioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT crear_operaciones_envio($1, $2, $3) as operacion_id',
                [ventaPosId, sucursalId, usuarioId]
            );
            return result.rows[0].operacion_id;
        });
    }

    // ==================== PROCESAMIENTO ====================

    /**
     * Completar operacion y procesar items
     */
    static async completarOperacion(operacionId, items, usuarioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT completar_operacion($1, $2, $3) as resultado',
                [operacionId, JSON.stringify(items), usuarioId]
            );
            return result.rows[0].resultado;
        });
    }

    /**
     * Procesar item individual
     */
    static async procesarItem(itemId, cantidadProcesada, ubicacionDestinoId, usuarioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `UPDATE operaciones_almacen_items
                SET cantidad_procesada = cantidad_procesada + $2,
                    ubicacion_destino_id = COALESCE($3, ubicacion_destino_id),
                    estado = CASE
                        WHEN cantidad_procesada + $2 >= cantidad_demandada THEN 'completado'
                        ELSE 'en_proceso'
                    END,
                    procesado_por = $4,
                    procesado_en = NOW(),
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING *`,
                [itemId, cantidadProcesada, ubicacionDestinoId, usuarioId]
            );
            return result.rows[0];
        });
    }

    /**
     * Cancelar item
     */
    static async cancelarItem(itemId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `UPDATE operaciones_almacen_items
                SET estado = 'cancelado', actualizado_en = NOW()
                WHERE id = $1
                RETURNING *`,
                [itemId]
            );
            return result.rows[0];
        });
    }

    // ==================== ASIGNACION ====================

    /**
     * Asignar operacion a usuario
     */
    static async asignar(operacionId, usuarioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `UPDATE operaciones_almacen
                SET asignado_a = $2,
                    estado = CASE WHEN estado = 'borrador' THEN 'asignada' ELSE estado END,
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $3
                RETURNING *`,
                [operacionId, usuarioId, organizacionId]
            );
            return result.rows[0];
        });
    }

    /**
     * Iniciar operacion
     */
    static async iniciar(operacionId, usuarioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `UPDATE operaciones_almacen
                SET estado = 'en_proceso',
                    fecha_inicio = COALESCE(fecha_inicio, NOW()),
                    asignado_a = COALESCE(asignado_a, $2),
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $3
                RETURNING *`,
                [operacionId, usuarioId, organizacionId]
            );
            return result.rows[0];
        });
    }

    /**
     * Cancelar operacion
     */
    static async cancelar(operacionId, motivo, usuarioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            // Cancelar todos los items pendientes
            await client.query(
                `UPDATE operaciones_almacen_items
                SET estado = 'cancelado', actualizado_en = NOW()
                WHERE operacion_id = $1 AND estado NOT IN ('completado', 'cancelado')`,
                [operacionId]
            );

            // Cancelar la operacion
            const result = await client.query(
                `UPDATE operaciones_almacen
                SET estado = 'cancelada',
                    notas_internas = COALESCE(notas_internas || E'\n', '') || 'Cancelada: ' || $2,
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $3
                RETURNING *`,
                [operacionId, motivo || 'Sin motivo especificado', organizacionId]
            );
            return result.rows[0];
        });
    }

    // ==================== CADENA MULTI-STEP ====================

    /**
     * Obtener cadena completa de operaciones
     */
    static async obtenerCadenaOperaciones(operacionId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT * FROM obtener_cadena_operaciones($1)',
                [operacionId]
            );
            return result.rows;
        });
    }

    // ==================== PENDIENTES Y ESTADISTICAS ====================

    /**
     * Obtener operaciones pendientes por sucursal
     */
    static async obtenerPendientes(sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT
                    o.*,
                    u.nombre as asignado_nombre
                FROM operaciones_almacen o
                LEFT JOIN usuarios u ON u.id = o.asignado_a
                WHERE o.sucursal_id = $1
                  AND o.organizacion_id = $2
                  AND o.estado IN ('borrador', 'asignada', 'en_proceso', 'parcial')
                ORDER BY o.prioridad ASC, o.fecha_programada ASC NULLS LAST, o.creado_en ASC`,
                [sucursalId, organizacionId]
            );
            return result.rows;
        });
    }

    /**
     * Obtener estadisticas por tipo
     */
    static async obtenerEstadisticas(sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT
                    tipo_operacion,
                    estado,
                    COUNT(*) as cantidad,
                    SUM(total_items) as total_items,
                    SUM(total_procesados) as total_procesados
                FROM operaciones_almacen
                WHERE sucursal_id = $1 AND organizacion_id = $2
                GROUP BY tipo_operacion, estado
                ORDER BY tipo_operacion, estado`,
                [sucursalId, organizacionId]
            );
            return result.rows;
        });
    }

    /**
     * Obtener resumen Kanban
     */
    static async obtenerResumenKanban(sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT
                    estado,
                    tipo_operacion,
                    COUNT(*) as cantidad
                FROM operaciones_almacen
                WHERE sucursal_id = $1
                  AND organizacion_id = $2
                  AND estado NOT IN ('completada', 'cancelada')
                GROUP BY estado, tipo_operacion`,
                [sucursalId, organizacionId]
            );
            return result.rows;
        });
    }
}

module.exports = OperacionesAlmacenModel;
