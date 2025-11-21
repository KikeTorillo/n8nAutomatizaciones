const { RLSContextManager } = require('../../../../utils/rlsContextManager');
const logger = require('../../../../utils/logger');

/**
 * ====================================================================
 * MODEL - REPORTES DE POS
 * ====================================================================
 *
 * Reportes y analytics del punto de venta
 */
class ReportesPOSModel {

    /**
     * Reporte de ventas diarias
     * GET /api/v1/pos/reportes/ventas-diarias
     */
    static async obtenerVentasDiarias(fecha, organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { profesional_id, usuario_id } = filtros;

            // Query base
            let whereConditions = [
                'v.organizacion_id = $1',
                'DATE(v.fecha_venta) = $2',
                "v.estado != 'cancelada'"
            ];

            const values = [organizacionId, fecha];
            let valueIndex = 3;

            // Filtros opcionales
            if (profesional_id) {
                whereConditions.push(`v.profesional_id = $${valueIndex++}`);
                values.push(profesional_id);
            }

            if (usuario_id) {
                whereConditions.push(`v.usuario_id = $${valueIndex++}`);
                values.push(usuario_id);
            }

            // 1. Resumen general del día
            const resumenQuery = `
                SELECT
                    COUNT(*) as total_ventas,
                    SUM(v.subtotal) as subtotal,
                    SUM(v.descuento_monto) as descuentos,
                    SUM(v.impuestos) as impuestos,
                    SUM(v.total) as total,
                    AVG(v.total) as promedio_venta,
                    SUM(CASE WHEN v.estado_pago = 'pagado' THEN v.total ELSE 0 END) as total_pagado,
                    SUM(CASE WHEN v.estado_pago = 'pendiente' THEN v.total ELSE 0 END) as total_pendiente,
                    COUNT(DISTINCT v.cliente_id) FILTER (WHERE v.cliente_id IS NOT NULL) as clientes_unicos
                FROM ventas_pos v
                WHERE ${whereConditions.join(' AND ')}
            `;

            const resumen = await db.query(resumenQuery, values);

            // 2. Ventas por método de pago
            const metodosPagoQuery = `
                SELECT
                    v.metodo_pago,
                    COUNT(*) as cantidad,
                    SUM(v.total) as total
                FROM ventas_pos v
                WHERE ${whereConditions.join(' AND ')}
                GROUP BY v.metodo_pago
                ORDER BY total DESC
            `;

            const metodosPago = await db.query(metodosPagoQuery, values);

            // 3. Ventas por tipo
            const tiposVentaQuery = `
                SELECT
                    v.tipo_venta,
                    COUNT(*) as cantidad,
                    SUM(v.total) as total
                FROM ventas_pos v
                WHERE ${whereConditions.join(' AND ')}
                GROUP BY v.tipo_venta
                ORDER BY total DESC
            `;

            const tiposVenta = await db.query(tiposVentaQuery, values);

            // 4. Ventas por hora
            const ventasPorHoraQuery = `
                SELECT
                    EXTRACT(HOUR FROM v.fecha_venta) as hora,
                    COUNT(*) as cantidad,
                    SUM(v.total) as total
                FROM ventas_pos v
                WHERE ${whereConditions.join(' AND ')}
                GROUP BY hora
                ORDER BY hora ASC
            `;

            const ventasPorHora = await db.query(ventasPorHoraQuery, values);

            // 5. Top 10 productos vendidos del día
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

            // 6. Ventas completas del día
            const ventasQuery = `
                SELECT
                    v.*,
                    u.nombre AS usuario_nombre,
                    c.nombre AS cliente_nombre,
                    p.nombre_completo AS profesional_nombre
                FROM ventas_pos v
                LEFT JOIN usuarios u ON u.id = v.usuario_id
                LEFT JOIN clientes c ON c.id = v.cliente_id
                LEFT JOIN profesionales p ON p.id = v.profesional_id
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY v.fecha_venta DESC
            `;

            const ventas = await db.query(ventasQuery, values);

            logger.info('[ReportesPOSModel.obtenerVentasDiarias] Reporte generado', {
                fecha,
                total_ventas: resumen.rows[0].total_ventas,
                total: resumen.rows[0].total
            });

            return {
                fecha,
                resumen_general: resumen.rows[0],
                por_metodo_pago: metodosPago.rows,
                por_tipo_venta: tiposVenta.rows,
                por_hora: ventasPorHora.rows,
                top_productos: topProductos.rows,
                ventas: ventas.rows
            };
        });
    }
}

module.exports = ReportesPOSModel;
