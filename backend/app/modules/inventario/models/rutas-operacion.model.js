/**
 * Modelo para Rutas de Operación
 * Configurar flujos de movimiento: compra, transferencia, dropship
 * Fecha: 27 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class RutasOperacionModel {
    // ==================== RUTAS ====================

    /**
     * Crear una nueva ruta de operación
     */
    static async crearRuta(data, organizacionId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `INSERT INTO rutas_operacion (
                    organizacion_id, codigo, nombre, descripcion, tipo,
                    activo, es_default, prioridad,
                    sucursal_origen_id, proveedor_default_id,
                    condiciones, lead_time_dias, creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *`,
                [
                    organizacionId,
                    data.codigo,
                    data.nombre,
                    data.descripcion || null,
                    data.tipo,
                    data.activo !== false,
                    data.es_default || false,
                    data.prioridad || 0,
                    data.sucursal_origen_id || null,
                    data.proveedor_default_id || null,
                    JSON.stringify(data.condiciones || {}),
                    data.lead_time_dias || 1,
                    usuarioId
                ]
            );
            return result.rows[0];
        });
    }

    /**
     * Listar rutas de operación
     */
    static async listarRutas(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            let query = `
                SELECT
                    r.*,
                    s.nombre as sucursal_origen_nombre,
                    p.nombre as proveedor_default_nombre,
                    u.nombre as creado_por_nombre,
                    (SELECT COUNT(*) FROM productos_rutas pr WHERE pr.ruta_id = r.id AND pr.activo = true) as productos_asignados
                FROM rutas_operacion r
                LEFT JOIN sucursales s ON s.id = r.sucursal_origen_id
                LEFT JOIN proveedores p ON p.id = r.proveedor_default_id
                LEFT JOIN usuarios u ON u.id = r.creado_por
                WHERE r.organizacion_id = $1
            `;
            const params = [organizacionId];
            let paramIndex = 2;

            if (filtros.tipo) {
                query += ` AND r.tipo = $${paramIndex++}`;
                params.push(filtros.tipo);
            }

            if (filtros.activo !== undefined) {
                query += ` AND r.activo = $${paramIndex++}`;
                params.push(filtros.activo);
            }

            query += ' ORDER BY r.prioridad ASC, r.nombre ASC';

            const result = await client.query(query, params);
            return result.rows;
        });
    }

    /**
     * Obtener ruta por ID
     */
    static async obtenerRutaPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT
                    r.*,
                    s.nombre as sucursal_origen_nombre,
                    p.nombre as proveedor_default_nombre
                FROM rutas_operacion r
                LEFT JOIN sucursales s ON s.id = r.sucursal_origen_id
                LEFT JOIN proveedores p ON p.id = r.proveedor_default_id
                WHERE r.id = $1 AND r.organizacion_id = $2`,
                [id, organizacionId]
            );
            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar ruta
     */
    static async actualizarRuta(id, data, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `UPDATE rutas_operacion SET
                    codigo = COALESCE($2, codigo),
                    nombre = COALESCE($3, nombre),
                    descripcion = COALESCE($4, descripcion),
                    tipo = COALESCE($5, tipo),
                    activo = COALESCE($6, activo),
                    es_default = COALESCE($7, es_default),
                    prioridad = COALESCE($8, prioridad),
                    sucursal_origen_id = $9,
                    proveedor_default_id = $10,
                    condiciones = COALESCE($11, condiciones),
                    lead_time_dias = COALESCE($12, lead_time_dias),
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $13
                RETURNING *`,
                [
                    id,
                    data.codigo,
                    data.nombre,
                    data.descripcion,
                    data.tipo,
                    data.activo,
                    data.es_default,
                    data.prioridad,
                    data.sucursal_origen_id,
                    data.proveedor_default_id,
                    data.condiciones ? JSON.stringify(data.condiciones) : null,
                    data.lead_time_dias,
                    organizacionId
                ]
            );
            return result.rows[0];
        });
    }

    /**
     * Eliminar ruta
     */
    static async eliminarRuta(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'DELETE FROM rutas_operacion WHERE id = $1 AND organizacion_id = $2 RETURNING id',
                [id, organizacionId]
            );
            return result.rowCount > 0;
        });
    }

    // ==================== PRODUCTOS-RUTAS ====================

    /**
     * Asignar ruta a producto
     */
    static async asignarRutaAProducto(productoId, rutaId, config, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `INSERT INTO productos_rutas (
                    organizacion_id, producto_id, ruta_id,
                    activo, prioridad, es_preferida,
                    lead_time_override, proveedor_override_id, sucursal_origen_override_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (producto_id, ruta_id)
                DO UPDATE SET
                    activo = EXCLUDED.activo,
                    prioridad = EXCLUDED.prioridad,
                    es_preferida = EXCLUDED.es_preferida,
                    lead_time_override = EXCLUDED.lead_time_override,
                    proveedor_override_id = EXCLUDED.proveedor_override_id,
                    sucursal_origen_override_id = EXCLUDED.sucursal_origen_override_id,
                    actualizado_en = NOW()
                RETURNING *`,
                [
                    organizacionId,
                    productoId,
                    rutaId,
                    config.activo !== false,
                    config.prioridad || 0,
                    config.es_preferida || false,
                    config.lead_time_override || null,
                    config.proveedor_override_id || null,
                    config.sucursal_origen_override_id || null
                ]
            );
            return result.rows[0];
        });
    }

    /**
     * Obtener rutas de un producto
     */
    static async obtenerRutasDeProducto(productoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT
                    pr.*,
                    r.codigo as ruta_codigo,
                    r.nombre as ruta_nombre,
                    r.tipo as ruta_tipo,
                    r.lead_time_dias as ruta_lead_time,
                    COALESCE(pr.lead_time_override, r.lead_time_dias) as lead_time_efectivo,
                    s.nombre as sucursal_origen_nombre,
                    p.nombre as proveedor_nombre
                FROM productos_rutas pr
                JOIN rutas_operacion r ON r.id = pr.ruta_id
                LEFT JOIN sucursales s ON s.id = COALESCE(pr.sucursal_origen_override_id, r.sucursal_origen_id)
                LEFT JOIN proveedores p ON p.id = COALESCE(pr.proveedor_override_id, r.proveedor_default_id)
                WHERE pr.producto_id = $1 AND pr.organizacion_id = $2
                ORDER BY pr.es_preferida DESC, pr.prioridad ASC`,
                [productoId, organizacionId]
            );
            return result.rows;
        });
    }

    /**
     * Quitar ruta de producto
     */
    static async quitarRutaDeProducto(productoId, rutaId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'DELETE FROM productos_rutas WHERE producto_id = $1 AND ruta_id = $2 AND organizacion_id = $3',
                [productoId, rutaId, organizacionId]
            );
            return result.rowCount > 0;
        });
    }

    // ==================== REGLAS DE REABASTECIMIENTO ====================

    /**
     * Crear regla de reabastecimiento
     */
    static async crearRegla(data, organizacionId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `INSERT INTO reglas_reabastecimiento (
                    organizacion_id, producto_id, categoria_id, sucursal_id,
                    nombre, descripcion, ruta_id,
                    stock_minimo_trigger, usar_stock_proyectado,
                    cantidad_fija, cantidad_hasta_maximo, cantidad_formula,
                    cantidad_minima, cantidad_maxima, multiplo_de,
                    dias_semana, hora_ejecucion, frecuencia_horas,
                    activo, prioridad, creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                RETURNING *`,
                [
                    organizacionId,
                    data.producto_id || null,
                    data.categoria_id || null,
                    data.sucursal_id || null,
                    data.nombre,
                    data.descripcion || null,
                    data.ruta_id,
                    data.stock_minimo_trigger || 5,
                    data.usar_stock_proyectado !== false,
                    data.cantidad_fija || null,
                    data.cantidad_hasta_maximo || false,
                    data.cantidad_formula || null,
                    data.cantidad_minima || 1,
                    data.cantidad_maxima || null,
                    data.multiplo_de || 1,
                    data.dias_semana || [1, 2, 3, 4, 5],
                    data.hora_ejecucion || '08:00:00',
                    data.frecuencia_horas || 24,
                    data.activo !== false,
                    data.prioridad || 0,
                    usuarioId
                ]
            );
            return result.rows[0];
        });
    }

    /**
     * Listar reglas de reabastecimiento
     */
    static async listarReglas(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            let query = `
                SELECT
                    rr.*,
                    p.nombre as producto_nombre,
                    p.sku as producto_sku,
                    c.nombre as categoria_nombre,
                    s.nombre as sucursal_nombre,
                    r.codigo as ruta_codigo,
                    r.nombre as ruta_nombre,
                    r.tipo as ruta_tipo
                FROM reglas_reabastecimiento rr
                LEFT JOIN productos p ON p.id = rr.producto_id
                LEFT JOIN categorias_productos c ON c.id = rr.categoria_id
                LEFT JOIN sucursales s ON s.id = rr.sucursal_id
                JOIN rutas_operacion r ON r.id = rr.ruta_id
                WHERE rr.organizacion_id = $1
            `;
            const params = [organizacionId];
            let paramIndex = 2;

            if (filtros.activo !== undefined) {
                query += ` AND rr.activo = $${paramIndex++}`;
                params.push(filtros.activo);
            }

            if (filtros.producto_id) {
                query += ` AND rr.producto_id = $${paramIndex++}`;
                params.push(filtros.producto_id);
            }

            query += ' ORDER BY rr.prioridad ASC, rr.nombre ASC';

            const result = await client.query(query, params);
            return result.rows;
        });
    }

    /**
     * Obtener regla por ID
     */
    static async obtenerReglaPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT
                    rr.*,
                    p.nombre as producto_nombre,
                    c.nombre as categoria_nombre,
                    s.nombre as sucursal_nombre,
                    r.codigo as ruta_codigo,
                    r.nombre as ruta_nombre,
                    r.tipo as ruta_tipo
                FROM reglas_reabastecimiento rr
                LEFT JOIN productos p ON p.id = rr.producto_id
                LEFT JOIN categorias_productos c ON c.id = rr.categoria_id
                LEFT JOIN sucursales s ON s.id = rr.sucursal_id
                JOIN rutas_operacion r ON r.id = rr.ruta_id
                WHERE rr.id = $1 AND rr.organizacion_id = $2`,
                [id, organizacionId]
            );
            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar regla
     */
    static async actualizarRegla(id, data, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `UPDATE reglas_reabastecimiento SET
                    nombre = COALESCE($2, nombre),
                    descripcion = COALESCE($3, descripcion),
                    ruta_id = COALESCE($4, ruta_id),
                    stock_minimo_trigger = COALESCE($5, stock_minimo_trigger),
                    usar_stock_proyectado = COALESCE($6, usar_stock_proyectado),
                    cantidad_fija = $7,
                    cantidad_hasta_maximo = COALESCE($8, cantidad_hasta_maximo),
                    cantidad_minima = COALESCE($9, cantidad_minima),
                    cantidad_maxima = $10,
                    multiplo_de = COALESCE($11, multiplo_de),
                    dias_semana = COALESCE($12, dias_semana),
                    activo = COALESCE($13, activo),
                    prioridad = COALESCE($14, prioridad),
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $15
                RETURNING *`,
                [
                    id,
                    data.nombre,
                    data.descripcion,
                    data.ruta_id,
                    data.stock_minimo_trigger,
                    data.usar_stock_proyectado,
                    data.cantidad_fija,
                    data.cantidad_hasta_maximo,
                    data.cantidad_minima,
                    data.cantidad_maxima,
                    data.multiplo_de,
                    data.dias_semana,
                    data.activo,
                    data.prioridad,
                    organizacionId
                ]
            );
            return result.rows[0];
        });
    }

    /**
     * Eliminar regla
     */
    static async eliminarRegla(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'DELETE FROM reglas_reabastecimiento WHERE id = $1 AND organizacion_id = $2 RETURNING id',
                [id, organizacionId]
            );
            return result.rowCount > 0;
        });
    }

    // ==================== DETERMINAR RUTA ====================

    /**
     * Determinar la mejor ruta para reabastecer un producto
     */
    static async determinarRutaReabastecimiento(productoId, sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT * FROM determinar_ruta_reabastecimiento($1, $2, $3)',
                [productoId, sucursalId, organizacionId]
            );
            return result.rows;
        });
    }

    // ==================== SOLICITUDES DE TRANSFERENCIA ====================

    /**
     * Crear solicitud de transferencia
     */
    static async crearSolicitudTransferencia(data, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (client) => {
            // Generar folio
            const folioResult = await client.query(
                'SELECT generar_folio_transferencia($1) as folio',
                [organizacionId]
            );
            const folio = folioResult.rows[0].folio;

            // Crear solicitud
            const solicitudResult = await client.query(
                `INSERT INTO solicitudes_transferencia (
                    organizacion_id, folio, sucursal_origen_id, sucursal_destino_id,
                    estado, regla_reabastecimiento_id, generada_automaticamente,
                    fecha_estimada_llegada, solicitado_por, notas
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *`,
                [
                    organizacionId,
                    folio,
                    data.sucursal_origen_id,
                    data.sucursal_destino_id,
                    'borrador',
                    data.regla_reabastecimiento_id || null,
                    data.generada_automaticamente || false,
                    data.fecha_estimada_llegada || null,
                    usuarioId,
                    data.notas || null
                ]
            );
            const solicitud = solicitudResult.rows[0];

            // Crear items
            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    await client.query(
                        `INSERT INTO solicitudes_transferencia_items (
                            solicitud_id, producto_id, cantidad_solicitada, notas
                        ) VALUES ($1, $2, $3, $4)`,
                        [solicitud.id, item.producto_id, item.cantidad, item.notas || null]
                    );
                }
            }

            return solicitud;
        });
    }

    /**
     * Listar solicitudes de transferencia
     */
    static async listarSolicitudesTransferencia(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            let query = `
                SELECT
                    st.*,
                    so.nombre as sucursal_origen_nombre,
                    sd.nombre as sucursal_destino_nombre,
                    u.nombre as solicitado_por_nombre,
                    (SELECT COUNT(*) FROM solicitudes_transferencia_items WHERE solicitud_id = st.id) as total_items,
                    (SELECT SUM(cantidad_solicitada) FROM solicitudes_transferencia_items WHERE solicitud_id = st.id) as total_unidades
                FROM solicitudes_transferencia st
                JOIN sucursales so ON so.id = st.sucursal_origen_id
                JOIN sucursales sd ON sd.id = st.sucursal_destino_id
                LEFT JOIN usuarios u ON u.id = st.solicitado_por
                WHERE st.organizacion_id = $1
            `;
            const params = [organizacionId];
            let paramIndex = 2;

            if (filtros.estado) {
                query += ` AND st.estado = $${paramIndex++}`;
                params.push(filtros.estado);
            }

            if (filtros.sucursal_origen_id) {
                query += ` AND st.sucursal_origen_id = $${paramIndex++}`;
                params.push(filtros.sucursal_origen_id);
            }

            if (filtros.sucursal_destino_id) {
                query += ` AND st.sucursal_destino_id = $${paramIndex++}`;
                params.push(filtros.sucursal_destino_id);
            }

            query += ' ORDER BY st.creado_en DESC';

            const result = await client.query(query, params);
            return result.rows;
        });
    }

    /**
     * Obtener solicitud con items
     */
    static async obtenerSolicitudConItems(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const solicitudResult = await client.query(
                `SELECT
                    st.*,
                    so.nombre as sucursal_origen_nombre,
                    sd.nombre as sucursal_destino_nombre
                FROM solicitudes_transferencia st
                JOIN sucursales so ON so.id = st.sucursal_origen_id
                JOIN sucursales sd ON sd.id = st.sucursal_destino_id
                WHERE st.id = $1 AND st.organizacion_id = $2`,
                [id, organizacionId]
            );

            if (solicitudResult.rows.length === 0) {
                return null;
            }

            const itemsResult = await client.query(
                `SELECT
                    sti.*,
                    p.nombre as producto_nombre,
                    p.sku as producto_sku,
                    p.stock_actual
                FROM solicitudes_transferencia_items sti
                JOIN productos p ON p.id = sti.producto_id
                WHERE sti.solicitud_id = $1
                ORDER BY p.nombre`,
                [id]
            );

            return {
                ...solicitudResult.rows[0],
                items: itemsResult.rows
            };
        });
    }

    /**
     * Cambiar estado de solicitud
     */
    static async cambiarEstadoSolicitud(id, nuevoEstado, data, organizacionId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const updates = ['estado = $2', 'actualizado_en = NOW()'];
            const params = [id, nuevoEstado];
            let paramIndex = 3;

            if (nuevoEstado === 'aprobada') {
                updates.push(`fecha_aprobacion = NOW()`);
                updates.push(`aprobado_por = $${paramIndex++}`);
                params.push(usuarioId);
            } else if (nuevoEstado === 'en_transito') {
                updates.push(`fecha_envio = NOW()`);
                updates.push(`enviado_por = $${paramIndex++}`);
                params.push(usuarioId);
            } else if (nuevoEstado === 'completada') {
                updates.push(`fecha_recepcion = NOW()`);
                updates.push(`recibido_por = $${paramIndex++}`);
                params.push(usuarioId);
            } else if (nuevoEstado === 'rechazada' && data.motivo_rechazo) {
                updates.push(`motivo_rechazo = $${paramIndex++}`);
                params.push(data.motivo_rechazo);
            }

            params.push(organizacionId);

            const result = await client.query(
                `UPDATE solicitudes_transferencia SET ${updates.join(', ')}
                WHERE id = $1 AND organizacion_id = $${paramIndex}
                RETURNING *`,
                params
            );

            return result.rows[0];
        });
    }

    // ==================== RUTAS POR DEFECTO ====================

    /**
     * Crear rutas por defecto para una organización nueva
     */
    static async crearRutasDefault(organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (client) => {
            const rutasDefault = [
                {
                    codigo: 'COMPRA',
                    nombre: 'Compra a Proveedor',
                    descripcion: 'Generar orden de compra al proveedor del producto',
                    tipo: 'compra',
                    es_default: true,
                    prioridad: 1
                },
                {
                    codigo: 'TRANSFERENCIA',
                    nombre: 'Transferencia entre Sucursales',
                    descripcion: 'Solicitar transferencia desde otra sucursal con stock',
                    tipo: 'transferencia',
                    es_default: false,
                    prioridad: 2
                },
                {
                    codigo: 'DROPSHIP',
                    nombre: 'Dropship',
                    descripcion: 'El proveedor envía directamente al cliente',
                    tipo: 'dropship',
                    es_default: false,
                    prioridad: 3
                }
            ];

            const creadas = [];
            for (const ruta of rutasDefault) {
                const result = await client.query(
                    `INSERT INTO rutas_operacion (
                        organizacion_id, codigo, nombre, descripcion,
                        tipo, es_default, prioridad, creado_por
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (organizacion_id, codigo) DO NOTHING
                    RETURNING *`,
                    [
                        organizacionId,
                        ruta.codigo,
                        ruta.nombre,
                        ruta.descripcion,
                        ruta.tipo,
                        ruta.es_default,
                        ruta.prioridad,
                        usuarioId
                    ]
                );
                if (result.rows[0]) {
                    creadas.push(result.rows[0]);
                }
            }

            return creadas;
        });
    }
}

module.exports = RutasOperacionModel;
