const { RLSContextManager } = require('../../../utils/rlsContextManager');

/**
 * ====================================================================
 * MODEL - REPORTES DE INVENTARIO
 * ====================================================================
 *
 * Reportes y analytics del módulo de inventario
 * Utiliza funciones PostgreSQL definidas en sql/inventario/04-funciones.sql
 */
class ReportesInventarioModel {

    /**
     * Obtener valor total del inventario
     * Usa función: calcular_valor_inventario()
     */
    static async obtenerValorInventario(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM calcular_valor_inventario($1)
            `;

            const result = await db.query(query, [organizacionId]);

            if (result.rows.length === 0) {
                return {
                    total_productos: 0,
                    total_unidades: 0,
                    valor_compra: 0,
                    valor_venta: 0,
                    margen_potencial: 0
                };
            }

            return result.rows[0];
        });
    }

    /**
     * Análisis ABC de productos (Pareto)
     * Usa función: analisis_abc_productos()
     */
    static async obtenerAnalisisABC(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { fecha_desde, fecha_hasta, categoria_id } = filtros;

            let query = `
                SELECT * FROM analisis_abc_productos($1, $2, $3)
            `;

            let values = [organizacionId, fecha_desde, fecha_hasta];

            const result = await db.query(query, values);

            // Si se especificó categoría, filtrar resultados
            let productos = result.rows;

            if (categoria_id) {
                const filterQuery = `
                    SELECT p.*
                    FROM (
                        SELECT * FROM analisis_abc_productos($1, $2, $3)
                    ) AS p
                    INNER JOIN productos prod ON prod.id = p.producto_id
                    WHERE prod.categoria_id = $4
                `;

                const filterResult = await db.query(filterQuery, [
                    organizacionId,
                    fecha_desde,
                    fecha_hasta,
                    categoria_id
                ]);

                productos = filterResult.rows;
            }

            // Agrupar por clasificación
            const resumen = {
                total_productos: productos.length,
                clasificacion_a: productos.filter(p => p.clasificacion === 'A'),
                clasificacion_b: productos.filter(p => p.clasificacion === 'B'),
                clasificacion_c: productos.filter(p => p.clasificacion === 'C'),
                ingresos_totales: productos.reduce((sum, p) => sum + parseFloat(p.ingresos_generados || 0), 0)
            };

            return {
                productos,
                resumen
            };
        });
    }

    /**
     * Calcular rotación de inventario
     * Días promedio entre movimientos de salida
     */
    static async obtenerRotacion(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { fecha_desde, fecha_hasta, categoria_id, top } = filtros;

            let query = `
                WITH ventas_producto AS (
                    SELECT
                        m.producto_id,
                        p.nombre AS producto_nombre,
                        p.stock_actual,
                        p.stock_minimo,
                        c.nombre AS categoria_nombre,
                        COUNT(*) AS total_movimientos,
                        SUM(ABS(m.cantidad)) AS total_vendido,
                        ROUND(
                            EXTRACT(EPOCH FROM ($2::date - $1::date)) / 86400 /
                            NULLIF(COUNT(*), 0)
                        , 2) AS dias_promedio_rotacion
                    FROM movimientos_inventario m
                    INNER JOIN productos p ON p.id = m.producto_id
                    LEFT JOIN categorias_productos c ON c.id = p.categoria_id
                    WHERE m.organizacion_id = $3
                      AND m.tipo_movimiento LIKE 'salida_%'
                      AND m.creado_en BETWEEN $1 AND $2
            `;

            const values = [fecha_desde, fecha_hasta, organizacionId];
            let valueIndex = 4;

            if (categoria_id) {
                query += ` AND p.categoria_id = $${valueIndex}`;
                values.push(categoria_id);
                valueIndex++;
            }

            query += `
                    GROUP BY m.producto_id, p.nombre, p.stock_actual, p.stock_minimo, c.nombre
                    HAVING COUNT(*) > 0
                )
                SELECT
                    *,
                    CASE
                        WHEN dias_promedio_rotacion <= 7 THEN 'Muy Alta'
                        WHEN dias_promedio_rotacion <= 15 THEN 'Alta'
                        WHEN dias_promedio_rotacion <= 30 THEN 'Media'
                        WHEN dias_promedio_rotacion <= 60 THEN 'Baja'
                        ELSE 'Muy Baja'
                    END AS clasificacion_rotacion,
                    CASE
                        WHEN stock_actual > 0 THEN ROUND(stock_actual::numeric / (total_vendido::numeric / EXTRACT(EPOCH FROM ($2::date - $1::date)) * 86400), 1)
                        ELSE 0
                    END AS dias_stock_restante
                FROM ventas_producto
                ORDER BY dias_promedio_rotacion ASC
                LIMIT $${valueIndex}
            `;

            values.push(top);

            const result = await db.query(query, values);

            return result.rows;
        });
    }

    /**
     * Obtener resumen de alertas de inventario
     */
    static async obtenerResumenAlertas(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    tipo_alerta,
                    nivel,
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE leida = false) AS no_leidas
                FROM alertas_inventario
                WHERE organizacion_id = $1
                  AND activa = true
                GROUP BY tipo_alerta, nivel
                ORDER BY
                    CASE nivel
                        WHEN 'critical' THEN 1
                        WHEN 'warning' THEN 2
                        WHEN 'info' THEN 3
                    END
            `;

            const result = await db.query(query, [organizacionId]);

            // Calcular totales generales
            const totales = {
                total_alertas: 0,
                total_no_leidas: 0,
                criticas: 0,
                advertencias: 0,
                informativas: 0
            };

            result.rows.forEach(row => {
                totales.total_alertas += parseInt(row.total);
                totales.total_no_leidas += parseInt(row.no_leidas);

                if (row.nivel === 'critical') {
                    totales.criticas += parseInt(row.total);
                } else if (row.nivel === 'warning') {
                    totales.advertencias += parseInt(row.total);
                } else if (row.nivel === 'info') {
                    totales.informativas += parseInt(row.total);
                }
            });

            return {
                alertas_por_tipo: result.rows,
                totales
            };
        });
    }
}

module.exports = ReportesInventarioModel;
