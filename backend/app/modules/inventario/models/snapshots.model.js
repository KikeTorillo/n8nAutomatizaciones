const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { ErrorHelper } = require('../../../utils/helpers');

/**
 * Model para Inventory at Date (Snapshots de Inventario)
 * Permite consultar el estado historico del inventario
 */
class SnapshotsModel {

    // ========================================================================
    // CONSULTAS
    // ========================================================================

    /**
     * Listar snapshots disponibles
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    id,
                    fecha_snapshot,
                    tipo,
                    total_productos,
                    total_unidades,
                    valor_total,
                    estado,
                    tiempo_generacion_ms,
                    creado_en
                FROM inventario_snapshots
                WHERE organizacion_id = $1
                  AND estado = 'completo'
                ORDER BY fecha_snapshot DESC
                LIMIT $2
                OFFSET $3
            `;

            const result = await db.query(query, [
                organizacionId,
                filtros.limit || 90,
                filtros.offset || 0
            ]);

            return result.rows;
        });
    }

    /**
     * Obtener stock en una fecha especifica
     */
    static async obtenerStockEnFecha(organizacionId, fecha, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            logger.info('[SnapshotsModel.obtenerStockEnFecha] Consultando', {
                organizacion_id: organizacionId,
                fecha,
                filtros
            });

            const result = await db.query(
                `SELECT * FROM obtener_stock_en_fecha($1, $2, $3, $4, $5, $6, $7)`,
                [
                    organizacionId,
                    fecha,
                    filtros.producto_id || null,
                    filtros.categoria_id || null,
                    filtros.solo_con_stock || false,
                    filtros.limit || 1000,
                    filtros.offset || 0
                ]
            );

            // Obtener totales del snapshot
            const snapshotQuery = await db.query(
                `SELECT total_productos, total_unidades, valor_total, creado_en
                 FROM inventario_snapshots
                 WHERE organizacion_id = $1 AND fecha_snapshot = $2 AND estado = 'completo'`,
                [organizacionId, fecha]
            );

            return {
                fecha,
                productos: result.rows,
                totales: snapshotQuery.rows[0] || null,
                filtros: {
                    producto_id: filtros.producto_id,
                    categoria_id: filtros.categoria_id,
                    solo_con_stock: filtros.solo_con_stock
                }
            };
        });
    }

    /**
     * Comparar inventario entre dos fechas
     */
    static async compararFechas(organizacionId, fechaDesde, fechaHasta, soloCambios = true) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            logger.info('[SnapshotsModel.compararFechas] Comparando', {
                organizacion_id: organizacionId,
                fecha_desde: fechaDesde,
                fecha_hasta: fechaHasta
            });

            const result = await db.query(
                `SELECT * FROM comparar_inventario_fechas($1, $2, $3, $4)`,
                [organizacionId, fechaDesde, fechaHasta, soloCambios]
            );

            // Calcular resumen
            let totalAumentaron = 0;
            let totalDisminuyeron = 0;
            let valorGanado = 0;
            let valorPerdido = 0;

            result.rows.forEach(row => {
                if (row.diferencia > 0) {
                    totalAumentaron++;
                    valorGanado += parseFloat(row.diferencia_valor) || 0;
                } else if (row.diferencia < 0) {
                    totalDisminuyeron++;
                    valorPerdido += parseFloat(row.diferencia_valor) || 0;
                }
            });

            return {
                fecha_desde: fechaDesde,
                fecha_hasta: fechaHasta,
                productos: result.rows,
                resumen: {
                    total_productos: result.rows.length,
                    aumentaron: totalAumentaron,
                    disminuyeron: totalDisminuyeron,
                    sin_cambio: result.rows.length - totalAumentaron - totalDisminuyeron,
                    valor_ganado: valorGanado,
                    valor_perdido: valorPerdido,
                    diferencia_neta: valorGanado + valorPerdido
                }
            };
        });
    }

    /**
     * Obtener fechas disponibles (para selector en UI)
     */
    static async obtenerFechasDisponibles(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                `SELECT DISTINCT fecha_snapshot
                 FROM inventario_snapshots
                 WHERE organizacion_id = $1 AND estado = 'completo'
                 ORDER BY fecha_snapshot DESC
                 LIMIT 365`,
                [organizacionId]
            );

            return result.rows.map(r => r.fecha_snapshot);
        });
    }

    /**
     * Verificar si existe snapshot para una fecha
     */
    static async existeSnapshot(organizacionId, fecha) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                `SELECT id, estado FROM inventario_snapshots
                 WHERE organizacion_id = $1 AND fecha_snapshot = $2`,
                [organizacionId, fecha]
            );

            return result.rows.length > 0 ? result.rows[0] : null;
        });
    }

    /**
     * Obtener historico de stock de un producto para grafico de pronostico
     * @param {number} organizacionId
     * @param {number} productoId
     * @param {number} dias - Dias de historico (default 30)
     * @returns {Object} { snapshots, producto, oc_pendientes, proyeccion }
     */
    static async obtenerHistoricoProducto(organizacionId, productoId, dias = 30) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // 1. Obtener snapshots historicos del producto
            const snapshotsResult = await db.query(`
                SELECT
                    s.fecha_snapshot,
                    COALESCE(sd.stock_actual, 0) as stock_actual,
                    COALESCE(sd.reservas, 0) as reservas,
                    COALESCE(sd.stock_disponible, 0) as stock_disponible,
                    COALESCE(sd.costo_total, 0) as costo_total
                FROM inventario_snapshots s
                LEFT JOIN inventario_snapshots_detalle sd
                    ON sd.snapshot_id = s.id AND sd.producto_id = $2
                WHERE s.organizacion_id = $1
                  AND s.estado = 'completo'
                  AND s.fecha_snapshot >= CURRENT_DATE - $3::INTEGER
                ORDER BY s.fecha_snapshot ASC
            `, [organizacionId, productoId, dias]);

            // 2. Obtener datos actuales del producto
            const productoResult = await db.query(`
                SELECT
                    p.id,
                    p.nombre,
                    p.sku,
                    p.stock_actual,
                    p.stock_minimo,
                    p.stock_maximo,
                    p.unidad_medida,
                    c.nombre as categoria_nombre,
                    pr.razon_social as proveedor_nombre
                FROM productos p
                LEFT JOIN categorias c ON c.id = p.categoria_id
                LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
                WHERE p.id = $1 AND p.organizacion_id = $2
            `, [productoId, organizacionId]);

            ErrorHelper.throwIfNotFound(productoResult.rows[0], 'Producto');

            // 3. Obtener OC pendientes para este producto
            const ocPendientesResult = await db.query(`
                SELECT
                    oc.id,
                    oc.folio,
                    oc.fecha_esperada,
                    oci.cantidad - COALESCE(oci.cantidad_recibida, 0) as cantidad_pendiente
                FROM ordenes_compra oc
                JOIN ordenes_compra_items oci ON oci.orden_compra_id = oc.id
                WHERE oc.organizacion_id = $1
                  AND oci.producto_id = $2
                  AND oc.estado IN ('enviada', 'parcial')
                  AND oci.cantidad > COALESCE(oci.cantidad_recibida, 0)
                ORDER BY oc.fecha_esperada ASC NULLS LAST
            `, [organizacionId, productoId]);

            // 4. Calcular proyeccion simple (si no hay snapshots suficientes, usar stock actual)
            const producto = productoResult.rows[0];
            const snapshots = snapshotsResult.rows;

            // Calcular tendencia de consumo (promedio de cambio diario)
            let consumoDiarioPromedio = 0;
            if (snapshots.length >= 2) {
                const cambios = [];
                for (let i = 1; i < snapshots.length; i++) {
                    const cambio = snapshots[i - 1].stock_actual - snapshots[i].stock_actual;
                    if (cambio > 0) cambios.push(cambio); // Solo consumos, no entradas
                }
                if (cambios.length > 0) {
                    consumoDiarioPromedio = cambios.reduce((a, b) => a + b, 0) / cambios.length;
                }
            }

            // Generar proyeccion para los proximos 30 dias
            const proyeccion = [];
            let stockProyectado = parseFloat(producto.stock_actual);
            const hoy = new Date();

            for (let i = 1; i <= 30; i++) {
                const fecha = new Date(hoy);
                fecha.setDate(fecha.getDate() + i);

                // Aplicar consumo diario
                stockProyectado = Math.max(0, stockProyectado - consumoDiarioPromedio);

                // Sumar OC que llegan en esta fecha
                ocPendientesResult.rows.forEach(oc => {
                    if (oc.fecha_esperada) {
                        const fechaOC = new Date(oc.fecha_esperada);
                        if (fechaOC.toDateString() === fecha.toDateString()) {
                            stockProyectado += parseFloat(oc.cantidad_pendiente);
                        }
                    }
                });

                proyeccion.push({
                    fecha: fecha.toISOString().split('T')[0],
                    stock_proyectado: Math.round(stockProyectado * 100) / 100
                });
            }

            return {
                snapshots: snapshots.map(s => ({
                    fecha: s.fecha_snapshot,
                    stock_actual: parseFloat(s.stock_actual),
                    reservas: parseFloat(s.reservas),
                    stock_disponible: parseFloat(s.stock_disponible),
                    costo_total: parseFloat(s.costo_total)
                })),
                producto: {
                    id: producto.id,
                    nombre: producto.nombre,
                    sku: producto.sku,
                    stock_actual: parseFloat(producto.stock_actual),
                    stock_minimo: parseFloat(producto.stock_minimo || 0),
                    stock_maximo: parseFloat(producto.stock_maximo || 0),
                    unidad_medida: producto.unidad_medida,
                    categoria: producto.categoria_nombre,
                    proveedor: producto.proveedor_nombre
                },
                oc_pendientes: ocPendientesResult.rows.map(oc => ({
                    id: oc.id,
                    folio: oc.folio,
                    fecha_estimada: oc.fecha_esperada,
                    cantidad: parseFloat(oc.cantidad_pendiente)
                })),
                proyeccion,
                metricas: {
                    consumo_diario_promedio: Math.round(consumoDiarioPromedio * 100) / 100,
                    dias_hasta_stock_cero: consumoDiarioPromedio > 0
                        ? Math.ceil(producto.stock_actual / consumoDiarioPromedio)
                        : null
                }
            };
        });
    }

    // ========================================================================
    // GENERACION
    // ========================================================================

    /**
     * Generar snapshot manualmente
     */
    static async generar(organizacionId, usuarioId, fecha = null, descripcion = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[SnapshotsModel.generar] Iniciando generacion manual', {
                organizacion_id: organizacionId,
                usuario_id: usuarioId,
                fecha
            });

            const fechaSnapshot = fecha || new Date().toISOString().split('T')[0];

            const result = await db.query(
                `SELECT generar_snapshot_inventario($1, $2, 'manual', $3, $4) as snapshot_id`,
                [
                    organizacionId,
                    fechaSnapshot,
                    usuarioId,
                    descripcion
                ]
            );

            const snapshotId = result.rows[0].snapshot_id;

            // Obtener datos del snapshot creado
            const snapshot = await db.query(
                `SELECT * FROM inventario_snapshots WHERE id = $1`,
                [snapshotId]
            );

            logger.info('[SnapshotsModel.generar] Snapshot generado', {
                snapshot_id: snapshotId,
                total_productos: snapshot.rows[0].total_productos,
                tiempo_ms: snapshot.rows[0].tiempo_generacion_ms
            });

            return snapshot.rows[0];
        });
    }
}

module.exports = SnapshotsModel;
