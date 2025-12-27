/**
 * Modelo para Numeros de Serie / Lotes
 * Gap Media Prioridad - Dic 2025
 * Tracking individual de productos con trazabilidad completa
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class NumerosSerieModel {
    // ==================== CRUD BASICO ====================

    /**
     * Crear un numero de serie usando la funcion SQL
     */
    static async crear(data, organizacionId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT registrar_numero_serie(
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
                ) as id`,
                [
                    organizacionId,
                    data.producto_id,
                    data.numero_serie,
                    data.lote || null,
                    data.fecha_vencimiento || null,
                    data.sucursal_id || null,
                    data.ubicacion_id || null,
                    data.costo_unitario || null,
                    data.proveedor_id || null,
                    data.orden_compra_id || null,
                    usuarioId,
                    data.notas || null
                ]
            );
            return result.rows[0].id;
        });
    }

    /**
     * Crear multiples numeros de serie (para recepcion masiva de OC)
     */
    static async crearMultiple(items, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (client) => {
            const creados = [];

            for (const item of items) {
                const result = await client.query(
                    `SELECT registrar_numero_serie(
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
                    ) as id`,
                    [
                        organizacionId,
                        item.producto_id,
                        item.numero_serie,
                        item.lote || null,
                        item.fecha_vencimiento || null,
                        item.sucursal_id || null,
                        item.ubicacion_id || null,
                        item.costo_unitario || null,
                        item.proveedor_id || null,
                        item.orden_compra_id || null,
                        usuarioId,
                        item.notas || null
                    ]
                );
                creados.push({
                    numero_serie: item.numero_serie,
                    id: result.rows[0].id
                });
            }

            return creados;
        });
    }

    /**
     * Obtener un numero de serie por ID
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT
                    ns.*,
                    p.nombre as producto_nombre,
                    p.sku as producto_sku,
                    p.imagen_url as producto_imagen,
                    s.nombre as sucursal_nombre,
                    ua.codigo as ubicacion_codigo,
                    ua.nombre as ubicacion_nombre,
                    prov.nombre as proveedor_nombre,
                    c.nombre as cliente_nombre,
                    u.nombre as creado_por_nombre
                FROM numeros_serie ns
                JOIN productos p ON p.id = ns.producto_id
                LEFT JOIN sucursales s ON s.id = ns.sucursal_id
                LEFT JOIN ubicaciones_almacen ua ON ua.id = ns.ubicacion_id
                LEFT JOIN proveedores prov ON prov.id = ns.proveedor_id
                LEFT JOIN clientes c ON c.id = ns.cliente_id
                LEFT JOIN usuarios u ON u.id = ns.creado_por
                WHERE ns.id = $1 AND ns.organizacion_id = $2`,
                [id, organizacionId]
            );
            return result.rows[0] || null;
        });
    }

    /**
     * Listar numeros de serie con filtros y paginacion
     */
    static async listar(filtros, organizacionId) {
        const {
            producto_id,
            sucursal_id,
            ubicacion_id,
            estado,
            lote,
            fecha_vencimiento_desde,
            fecha_vencimiento_hasta,
            orden_compra_id,
            proveedor_id,
            busqueda,
            page = 1,
            limit = 50
        } = filtros;

        const offset = (page - 1) * limit;
        const params = [organizacionId];
        let whereClause = 'WHERE ns.organizacion_id = $1';
        let paramIndex = 2;

        if (producto_id) {
            whereClause += ` AND ns.producto_id = $${paramIndex++}`;
            params.push(producto_id);
        }

        if (sucursal_id) {
            whereClause += ` AND ns.sucursal_id = $${paramIndex++}`;
            params.push(sucursal_id);
        }

        if (ubicacion_id) {
            whereClause += ` AND ns.ubicacion_id = $${paramIndex++}`;
            params.push(ubicacion_id);
        }

        if (estado) {
            whereClause += ` AND ns.estado = $${paramIndex++}`;
            params.push(estado);
        }

        if (lote) {
            whereClause += ` AND ns.lote ILIKE $${paramIndex++}`;
            params.push(`%${lote}%`);
        }

        if (fecha_vencimiento_desde) {
            whereClause += ` AND ns.fecha_vencimiento >= $${paramIndex++}`;
            params.push(fecha_vencimiento_desde);
        }

        if (fecha_vencimiento_hasta) {
            whereClause += ` AND ns.fecha_vencimiento <= $${paramIndex++}`;
            params.push(fecha_vencimiento_hasta);
        }

        if (orden_compra_id) {
            whereClause += ` AND ns.orden_compra_id = $${paramIndex++}`;
            params.push(orden_compra_id);
        }

        if (proveedor_id) {
            whereClause += ` AND ns.proveedor_id = $${paramIndex++}`;
            params.push(proveedor_id);
        }

        if (busqueda) {
            whereClause += ` AND (
                ns.numero_serie ILIKE $${paramIndex} OR
                ns.lote ILIKE $${paramIndex} OR
                p.nombre ILIKE $${paramIndex} OR
                p.sku ILIKE $${paramIndex}
            )`;
            params.push(`%${busqueda}%`);
            paramIndex++;
        }

        return await RLSContextManager.query(organizacionId, async (client) => {
            // Total count
            const countResult = await client.query(
                `SELECT COUNT(*) as total
                FROM numeros_serie ns
                JOIN productos p ON p.id = ns.producto_id
                ${whereClause}`,
                params
            );

            // Data with pagination
            params.push(limit, offset);
            const dataResult = await client.query(
                `SELECT
                    ns.id,
                    ns.numero_serie,
                    ns.lote,
                    ns.estado,
                    ns.fecha_vencimiento,
                    ns.costo_unitario,
                    ns.fecha_entrada,
                    ns.fecha_salida,
                    ns.producto_id,
                    p.nombre as producto_nombre,
                    p.sku as producto_sku,
                    s.nombre as sucursal_nombre,
                    ua.codigo as ubicacion_codigo,
                    c.nombre as cliente_nombre
                FROM numeros_serie ns
                JOIN productos p ON p.id = ns.producto_id
                LEFT JOIN sucursales s ON s.id = ns.sucursal_id
                LEFT JOIN ubicaciones_almacen ua ON ua.id = ns.ubicacion_id
                LEFT JOIN clientes c ON c.id = ns.cliente_id
                ${whereClause}
                ORDER BY ns.creado_en DESC
                LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
                params
            );

            return {
                data: dataResult.rows,
                total: parseInt(countResult.rows[0].total),
                page,
                limit,
                totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
            };
        });
    }

    // ==================== OPERACIONES DE NEGOCIO ====================

    /**
     * Marcar numero de serie como vendido
     */
    static async vender(numeroSerieId, ventaId, clienteId, organizacionId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT vender_numero_serie($1, $2, $3, $4) as success',
                [numeroSerieId, ventaId, clienteId || null, usuarioId]
            );
            return result.rows[0].success;
        });
    }

    /**
     * Transferir numero de serie a otra sucursal/ubicacion
     */
    static async transferir(numeroSerieId, sucursalDestinoId, ubicacionDestinoId, organizacionId, usuarioId, notas) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT transferir_numero_serie($1, $2, $3, $4, $5) as success',
                [numeroSerieId, sucursalDestinoId, ubicacionDestinoId || null, usuarioId, notas || null]
            );
            return result.rows[0].success;
        });
    }

    /**
     * Procesar devolucion de cliente
     */
    static async devolver(numeroSerieId, sucursalId, ubicacionId, motivo, organizacionId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT devolver_numero_serie($1, $2, $3, $4, $5) as success',
                [numeroSerieId, sucursalId, ubicacionId || null, motivo, usuarioId]
            );
            return result.rows[0].success;
        });
    }

    /**
     * Marcar como defectuoso
     */
    static async marcarDefectuoso(numeroSerieId, motivo, organizacionId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT marcar_defectuoso($1, $2, $3) as success',
                [numeroSerieId, motivo, usuarioId]
            );
            return result.rows[0].success;
        });
    }

    /**
     * Reservar numero de serie
     */
    static async reservar(numeroSerieId, organizacionId, usuarioId, notas) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            // Verificar estado actual
            const check = await client.query(
                'SELECT estado, sucursal_id FROM numeros_serie WHERE id = $1 AND organizacion_id = $2',
                [numeroSerieId, organizacionId]
            );

            if (!check.rows[0]) {
                throw new Error('Número de serie no encontrado');
            }

            if (check.rows[0].estado !== 'disponible') {
                throw new Error(`No se puede reservar. Estado actual: ${check.rows[0].estado}`);
            }

            // Actualizar estado
            await client.query(
                `UPDATE numeros_serie
                SET estado = 'reservado', actualizado_en = NOW()
                WHERE id = $1`,
                [numeroSerieId]
            );

            // Registrar historial
            await client.query(
                `INSERT INTO numeros_serie_historial
                (numero_serie_id, accion, estado_anterior, estado_nuevo, usuario_id, notas)
                VALUES ($1, 'reserva', 'disponible', 'reservado', $2, $3)`,
                [numeroSerieId, usuarioId, notas || 'Reservado']
            );

            return true;
        });
    }

    /**
     * Liberar reserva
     */
    static async liberarReserva(numeroSerieId, organizacionId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const check = await client.query(
                'SELECT estado FROM numeros_serie WHERE id = $1 AND organizacion_id = $2',
                [numeroSerieId, organizacionId]
            );

            if (!check.rows[0]) {
                throw new Error('Número de serie no encontrado');
            }

            if (check.rows[0].estado !== 'reservado') {
                throw new Error(`No se puede liberar. Estado actual: ${check.rows[0].estado}`);
            }

            await client.query(
                `UPDATE numeros_serie
                SET estado = 'disponible', actualizado_en = NOW()
                WHERE id = $1`,
                [numeroSerieId]
            );

            await client.query(
                `INSERT INTO numeros_serie_historial
                (numero_serie_id, accion, estado_anterior, estado_nuevo, usuario_id, notas)
                VALUES ($1, 'liberacion', 'reservado', 'disponible', $2, 'Reserva liberada')`,
                [numeroSerieId, usuarioId]
            );

            return true;
        });
    }

    // ==================== CONSULTAS ESPECIALES ====================

    /**
     * Busqueda rapida por numero de serie
     */
    static async buscar(termino, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT * FROM buscar_numero_serie($1, $2)',
                [organizacionId, termino]
            );
            return result.rows;
        });
    }

    /**
     * Obtener numeros de serie disponibles de un producto
     */
    static async obtenerDisponiblesPorProducto(productoId, sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            let query = `
                SELECT
                    ns.id,
                    ns.numero_serie,
                    ns.lote,
                    ns.fecha_vencimiento,
                    ns.costo_unitario,
                    ua.codigo as ubicacion_codigo
                FROM numeros_serie ns
                LEFT JOIN ubicaciones_almacen ua ON ua.id = ns.ubicacion_id
                WHERE ns.organizacion_id = $1
                AND ns.producto_id = $2
                AND ns.estado = 'disponible'
            `;
            const params = [organizacionId, productoId];

            if (sucursalId) {
                query += ' AND ns.sucursal_id = $3';
                params.push(sucursalId);
            }

            query += ' ORDER BY ns.fecha_vencimiento ASC NULLS LAST, ns.fecha_entrada ASC';

            const result = await client.query(query, params);
            return result.rows;
        });
    }

    /**
     * Obtener proximos a vencer
     */
    static async obtenerProximosVencer(dias, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT * FROM obtener_proximos_vencer($1, $2)',
                [organizacionId, dias || 30]
            );
            return result.rows;
        });
    }

    /**
     * Obtener estadisticas generales
     */
    static async obtenerEstadisticas(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT * FROM estadisticas_numeros_serie($1)',
                [organizacionId]
            );
            return result.rows[0];
        });
    }

    /**
     * Obtener historial de un numero de serie
     */
    static async obtenerHistorial(numeroSerieId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT
                    h.*,
                    sa.nombre as sucursal_anterior,
                    sn.nombre as sucursal_nueva,
                    ua.codigo as ubicacion_anterior,
                    un.codigo as ubicacion_nueva,
                    u.nombre as usuario_nombre
                FROM numeros_serie_historial h
                LEFT JOIN sucursales sa ON sa.id = h.sucursal_anterior_id
                LEFT JOIN sucursales sn ON sn.id = h.sucursal_nueva_id
                LEFT JOIN ubicaciones_almacen ua ON ua.id = h.ubicacion_anterior_id
                LEFT JOIN ubicaciones_almacen un ON un.id = h.ubicacion_nueva_id
                LEFT JOIN usuarios u ON u.id = h.usuario_id
                WHERE h.numero_serie_id = $1
                ORDER BY h.creado_en DESC`,
                [numeroSerieId]
            );
            return result.rows;
        });
    }

    /**
     * Verificar si un numero de serie ya existe
     */
    static async existeNumeroSerie(productoId, numeroSerie, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT id FROM numeros_serie
                WHERE organizacion_id = $1
                AND producto_id = $2
                AND numero_serie = $3`,
                [organizacionId, productoId, numeroSerie]
            );
            return result.rows.length > 0;
        });
    }

    /**
     * Obtener resumen por producto
     */
    static async obtenerResumenPorProducto(productoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT
                    estado,
                    COUNT(*) as cantidad,
                    SUM(costo_unitario) as valor_total
                FROM numeros_serie
                WHERE organizacion_id = $1 AND producto_id = $2
                GROUP BY estado
                ORDER BY estado`,
                [organizacionId, productoId]
            );
            return result.rows;
        });
    }

    /**
     * Obtener productos que requieren numero de serie
     */
    static async obtenerProductosConSerie(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT
                    p.id,
                    p.nombre,
                    p.sku,
                    p.imagen_url,
                    COUNT(ns.id) FILTER (WHERE ns.estado = 'disponible') as disponibles,
                    COUNT(ns.id) FILTER (WHERE ns.estado = 'vendido') as vendidos,
                    COUNT(ns.id) as total_registrados
                FROM productos p
                LEFT JOIN numeros_serie ns ON ns.producto_id = p.id
                WHERE p.organizacion_id = $1
                AND p.requiere_numero_serie = true
                AND p.activo = true
                GROUP BY p.id, p.nombre, p.sku, p.imagen_url
                ORDER BY p.nombre`,
                [organizacionId]
            );
            return result.rows;
        });
    }

    /**
     * Actualizar datos de garantia
     */
    static async actualizarGarantia(numeroSerieId, garantiaData, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            await client.query(
                `UPDATE numeros_serie
                SET tiene_garantia = $2,
                    fecha_inicio_garantia = $3,
                    fecha_fin_garantia = $4,
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $5`,
                [
                    numeroSerieId,
                    garantiaData.tiene_garantia,
                    garantiaData.fecha_inicio_garantia || null,
                    garantiaData.fecha_fin_garantia || null,
                    organizacionId
                ]
            );
            return true;
        });
    }
}

module.exports = NumerosSerieModel;
