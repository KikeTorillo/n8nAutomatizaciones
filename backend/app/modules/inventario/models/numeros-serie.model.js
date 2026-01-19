/**
 * Modelo para Numeros de Serie / Lotes
 * Gap Media Prioridad - Dic 2025
 * Tracking individual de productos con trazabilidad completa
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');

class NumerosSerieModel {
    // ==================== CRUD BASICO ====================

    /**
     * Crear un numero de serie usando la funcion SQL
     */
    static async crear(organizacionId, data, usuarioId) {
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
    static async crearMultiple(organizacionId, items, usuarioId) {
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
    static async buscarPorId(organizacionId, id) {
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
    static async listar(organizacionId, filtros = {}) {
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

            ErrorHelper.throwIfNotFound(check.rows[0], 'Número de serie');

            if (check.rows[0].estado !== 'disponible') {
                ErrorHelper.throwConflict(`No se puede reservar. Estado actual: ${check.rows[0].estado}`);
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

            ErrorHelper.throwIfNotFound(check.rows[0], 'Número de serie');

            if (check.rows[0].estado !== 'reservado') {
                ErrorHelper.throwConflict(`No se puede liberar. Estado actual: ${check.rows[0].estado}`);
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

    // ==================== FEFO - DESPACHO ====================

    /**
     * Obtener números de serie para despacho usando estrategia FEFO
     * (First Expired First Out - primeros en vencer, primeros en salir)
     * Usado en POS para productos perecederos
     *
     * @param {number} productoId - ID del producto
     * @param {number} cantidad - Cantidad de NS requeridos
     * @param {number} organizacionId - ID de la organización
     * @param {number|null} sucursalId - ID de la sucursal (opcional)
     * @returns {Array} Lista de NS ordenados por fecha de vencimiento (más próximos primero)
     */
    static async obtenerParaDespachoFEFO(productoId, cantidad, organizacionId, sucursalId = null) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const params = [organizacionId, productoId, cantidad];
            let sucursalFilter = '';

            if (sucursalId) {
                sucursalFilter = 'AND ns.sucursal_id = $4';
                params.push(sucursalId);
            }

            const result = await client.query(
                `SELECT
                    ns.id,
                    ns.numero_serie,
                    ns.lote,
                    ns.fecha_vencimiento,
                    ns.costo_unitario,
                    ns.sucursal_id,
                    ns.ubicacion_id,
                    p.nombre as producto_nombre,
                    p.sku as producto_sku,
                    s.nombre as sucursal_nombre,
                    ua.codigo as ubicacion_codigo,
                    CASE
                        WHEN ns.fecha_vencimiento IS NULL THEN NULL
                        WHEN ns.fecha_vencimiento < CURRENT_DATE THEN -1
                        ELSE (ns.fecha_vencimiento - CURRENT_DATE)
                    END as dias_para_vencer
                FROM numeros_serie ns
                JOIN productos p ON p.id = ns.producto_id
                LEFT JOIN sucursales s ON s.id = ns.sucursal_id
                LEFT JOIN ubicaciones_almacen ua ON ua.id = ns.ubicacion_id
                WHERE ns.organizacion_id = $1
                  AND ns.producto_id = $2
                  AND ns.estado = 'disponible'
                  ${sucursalFilter}
                ORDER BY
                    ns.fecha_vencimiento ASC NULLS LAST,
                    ns.fecha_entrada ASC
                LIMIT $3`,
                params
            );

            return result.rows;
        });
    }

    /**
     * Reservar NS para despacho FEFO (marca como reservado temporalmente)
     * Usado durante el proceso de venta antes de confirmar
     *
     * @param {Array} nsIds - IDs de números de serie a reservar
     * @param {string} referencia - Referencia de la reserva (ej: 'VENTA-123')
     * @param {number} organizacionId - ID de la organización
     * @param {number} usuarioId - ID del usuario
     * @returns {boolean} True si se reservaron correctamente
     */
    static async reservarParaDespacho(nsIds, referencia, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (client) => {
            for (const nsId of nsIds) {
                // Verificar que está disponible
                const check = await client.query(
                    `SELECT id, estado FROM numeros_serie
                     WHERE id = $1 AND organizacion_id = $2`,
                    [nsId, organizacionId]
                );

                if (check.rows.length === 0) {
                    ErrorHelper.throwIfNotFound(null, `Número de serie ${nsId}`);
                }

                if (check.rows[0].estado !== 'disponible') {
                    ErrorHelper.throwConflict(`Número de serie ${nsId} no está disponible (estado: ${check.rows[0].estado})`);
                }

                // Marcar como reservado
                await client.query(
                    `UPDATE numeros_serie
                     SET estado = 'reservado',
                         notas = COALESCE(notas || E'\n', '') || $2,
                         actualizado_en = NOW()
                     WHERE id = $1`,
                    [nsId, `Reservado para ${referencia} el ${new Date().toISOString()}`]
                );

                // Registrar en historial
                await client.query(
                    `INSERT INTO numeros_serie_historial
                     (numero_serie_id, accion, estado_anterior, estado_nuevo,
                      referencia_tipo, usuario_id, notas)
                     VALUES ($1, 'reserva', 'disponible', 'reservado', 'venta_pos', $2, $3)`,
                    [nsId, usuarioId, `Reserva FEFO para ${referencia}`]
                );
            }

            return true;
        });
    }

    /**
     * Obtener alertas de vencimiento con niveles de urgencia
     * @param {number} organizacionId - ID de la organización
     * @param {number|null} sucursalId - Filtrar por sucursal
     * @returns {Object} Alertas agrupadas por nivel de urgencia
     */
    static async obtenerAlertasVencimiento(organizacionId, sucursalId = null) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const params = [organizacionId];
            let sucursalFilter = '';

            if (sucursalId) {
                sucursalFilter = 'AND ns.sucursal_id = $2';
                params.push(sucursalId);
            }

            const result = await client.query(
                `SELECT
                    ns.id,
                    ns.numero_serie,
                    ns.lote,
                    ns.fecha_vencimiento,
                    ns.costo_unitario,
                    p.id as producto_id,
                    p.nombre as producto_nombre,
                    p.sku,
                    s.nombre as sucursal_nombre,
                    (ns.fecha_vencimiento - CURRENT_DATE) as dias_restantes,
                    CASE
                        WHEN ns.fecha_vencimiento < CURRENT_DATE THEN 'vencido'
                        WHEN ns.fecha_vencimiento <= CURRENT_DATE + 7 THEN 'critico'
                        WHEN ns.fecha_vencimiento <= CURRENT_DATE + 15 THEN 'urgente'
                        WHEN ns.fecha_vencimiento <= CURRENT_DATE + 30 THEN 'proximo'
                        ELSE 'ok'
                    END as nivel_alerta
                FROM numeros_serie ns
                JOIN productos p ON p.id = ns.producto_id
                LEFT JOIN sucursales s ON s.id = ns.sucursal_id
                WHERE ns.organizacion_id = $1
                  AND ns.estado = 'disponible'
                  AND ns.fecha_vencimiento IS NOT NULL
                  AND ns.fecha_vencimiento <= CURRENT_DATE + 30
                  ${sucursalFilter}
                ORDER BY ns.fecha_vencimiento ASC`,
                params
            );

            // Agrupar por nivel de alerta
            const alertas = {
                vencidos: result.rows.filter(r => r.nivel_alerta === 'vencido'),
                criticos: result.rows.filter(r => r.nivel_alerta === 'critico'),
                urgentes: result.rows.filter(r => r.nivel_alerta === 'urgente'),
                proximos: result.rows.filter(r => r.nivel_alerta === 'proximo'),
                resumen: {
                    total: result.rows.length,
                    vencidos: result.rows.filter(r => r.nivel_alerta === 'vencido').length,
                    criticos: result.rows.filter(r => r.nivel_alerta === 'critico').length,
                    urgentes: result.rows.filter(r => r.nivel_alerta === 'urgente').length,
                    proximos: result.rows.filter(r => r.nivel_alerta === 'proximo').length,
                    valor_en_riesgo: result.rows.reduce((sum, r) => sum + (parseFloat(r.costo_unitario) || 0), 0)
                }
            };

            return alertas;
        });
    }

    // ==================== TRAZABILIDAD COMPLETA ====================

    /**
     * Obtener trazabilidad completa de un número de serie
     * Incluye: origen (upstream), estado actual, destino (downstream)
     *
     * @param {number} numeroSerieId - ID del número de serie
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Trazabilidad completa con origen, destino y metadata
     */
    static async obtenerTrazabilidadCompleta(numeroSerieId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT * FROM obtener_trazabilidad_completa($1, $2)',
                [numeroSerieId, organizacionId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            const data = result.rows[0];

            // Estructurar respuesta
            return {
                numero_serie: {
                    id: data.ns_id,
                    codigo: data.numero_serie,
                    lote: data.lote,
                    estado: data.estado,
                    fecha_vencimiento: data.fecha_vencimiento,
                    costo_unitario: data.costo_unitario,
                    dias_en_inventario: data.dias_en_inventario,
                    total_movimientos: data.total_movimientos
                },
                producto: {
                    id: data.producto_id,
                    nombre: data.producto_nombre,
                    sku: data.producto_sku
                },
                origen: {
                    tipo: data.origen_tipo,
                    proveedor: data.origen_proveedor_id ? {
                        id: data.origen_proveedor_id,
                        nombre: data.origen_proveedor_nombre
                    } : null,
                    orden_compra: data.origen_oc_id ? {
                        id: data.origen_oc_id,
                        folio: data.origen_oc_folio
                    } : null,
                    fecha: data.origen_fecha
                },
                ubicacion_actual: {
                    sucursal: data.sucursal_id ? {
                        id: data.sucursal_id,
                        nombre: data.sucursal_nombre
                    } : null,
                    ubicacion: data.ubicacion_id ? {
                        id: data.ubicacion_id,
                        codigo: data.ubicacion_codigo
                    } : null
                },
                destino: data.destino_tipo ? {
                    tipo: data.destino_tipo,
                    cliente: data.destino_cliente_id ? {
                        id: data.destino_cliente_id,
                        nombre: data.destino_cliente_nombre
                    } : null,
                    venta_id: data.destino_venta_id,
                    fecha: data.destino_fecha
                } : null,
                garantia: {
                    tiene: data.tiene_garantia,
                    fecha_fin: data.fecha_fin_garantia
                }
            };
        });
    }

    /**
     * Obtener timeline cronológico de un número de serie
     * Muestra todos los eventos desde entrada hasta estado actual
     *
     * @param {number} numeroSerieId - ID del número de serie
     * @param {number} organizacionId - ID de la organización
     * @returns {Array} Lista de eventos ordenados cronológicamente
     */
    static async obtenerTimeline(numeroSerieId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT * FROM obtener_timeline_ns($1, $2)',
                [numeroSerieId, organizacionId]
            );

            return result.rows.map(evento => ({
                id: evento.evento_id,
                fecha: evento.fecha,
                accion: evento.accion,
                descripcion: evento.descripcion,
                estados: {
                    anterior: evento.estado_anterior,
                    nuevo: evento.estado_nuevo
                },
                ubicaciones: {
                    origen: {
                        sucursal: evento.sucursal_origen,
                        ubicacion: evento.ubicacion_origen
                    },
                    destino: {
                        sucursal: evento.sucursal_destino,
                        ubicacion: evento.ubicacion_destino
                    }
                },
                referencia: evento.referencia_tipo ? {
                    tipo: evento.referencia_tipo,
                    id: evento.referencia_id
                } : null,
                usuario: evento.usuario_nombre,
                notas: evento.notas,
                ui: {
                    icono: evento.icono,
                    color: evento.color
                }
            }));
        });
    }

    /**
     * Buscar NS por número o lote con trazabilidad resumida
     * Útil para escaneo de barcode y búsqueda rápida
     *
     * @param {string} busqueda - Número de serie o lote a buscar
     * @param {number} organizacionId - ID de la organización
     * @returns {Array} Lista de NS con trazabilidad resumida
     */
    static async buscarConTrazabilidad(busqueda, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT
                    ns.id,
                    ns.numero_serie,
                    ns.lote,
                    ns.estado,
                    ns.fecha_vencimiento,
                    ns.costo_unitario,
                    p.id as producto_id,
                    p.nombre as producto_nombre,
                    p.sku,
                    prov.nombre as proveedor_nombre,
                    oc.folio as oc_folio,
                    c.nombre as cliente_nombre,
                    s.nombre as sucursal_nombre,
                    ns.fecha_entrada,
                    ns.fecha_salida,
                    (SELECT COUNT(*) FROM numeros_serie_historial h WHERE h.numero_serie_id = ns.id) as total_movimientos
                FROM numeros_serie ns
                JOIN productos p ON p.id = ns.producto_id
                LEFT JOIN proveedores prov ON prov.id = ns.proveedor_id
                LEFT JOIN ordenes_compra oc ON oc.id = ns.orden_compra_id
                LEFT JOIN clientes c ON c.id = ns.cliente_id
                LEFT JOIN sucursales s ON s.id = ns.sucursal_id
                WHERE ns.organizacion_id = $1
                  AND (ns.numero_serie ILIKE $2 OR ns.lote ILIKE $2)
                ORDER BY ns.creado_en DESC
                LIMIT 20`,
                [organizacionId, `%${busqueda}%`]
            );

            return result.rows.map(row => ({
                id: row.id,
                numero_serie: row.numero_serie,
                lote: row.lote,
                estado: row.estado,
                fecha_vencimiento: row.fecha_vencimiento,
                costo_unitario: row.costo_unitario,
                producto: {
                    id: row.producto_id,
                    nombre: row.producto_nombre,
                    sku: row.sku
                },
                origen: row.proveedor_nombre || row.oc_folio ? {
                    proveedor: row.proveedor_nombre,
                    oc_folio: row.oc_folio
                } : null,
                destino: row.cliente_nombre ? {
                    cliente: row.cliente_nombre
                } : null,
                sucursal: row.sucursal_nombre,
                fechas: {
                    entrada: row.fecha_entrada,
                    salida: row.fecha_salida
                },
                total_movimientos: parseInt(row.total_movimientos)
            }));
        });
    }
}

module.exports = NumerosSerieModel;
