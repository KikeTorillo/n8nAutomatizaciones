const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

/**
 * Model para movimientos de inventario (tabla particionada)
 * Maneja entradas y salidas de stock (kardex)
 * IMPORTANTE: Tabla particionada por creado_en (rango mensual)
 */
class MovimientosInventarioModel {

    /**
     * Registrar movimiento de inventario
     * CRÍTICO: Actualiza stock_actual del producto automáticamente
     */
    static async registrar(data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[MovimientosInventarioModel.registrar] Iniciando', {
                organizacion_id: organizacionId,
                producto_id: data.producto_id,
                tipo_movimiento: data.tipo_movimiento,
                cantidad: data.cantidad
            });

            // Validar que el producto existe
            const productoQuery = await db.query(
                `SELECT id, stock_actual, nombre FROM productos
                 WHERE id = $1 AND organizacion_id = $2`,
                [data.producto_id, organizacionId]
            );

            if (productoQuery.rows.length === 0) {
                throw new Error('Producto no encontrado o no pertenece a esta organización');
            }

            const producto = productoQuery.rows[0];
            const stockAntes = producto.stock_actual;
            const stockDespues = stockAntes + data.cantidad;

            // Validar que el stock no quede negativo
            if (stockDespues < 0) {
                throw new Error(`Stock insuficiente. Stock actual: ${stockAntes}, intentando restar: ${Math.abs(data.cantidad)}`);
            }

            // Validar proveedor si es entrada de compra
            if (data.tipo_movimiento === 'entrada_compra' && data.proveedor_id) {
                const proveedorQuery = await db.query(
                    `SELECT id FROM proveedores
                     WHERE id = $1 AND organizacion_id = $2 AND activo = true`,
                    [data.proveedor_id, organizacionId]
                );

                if (proveedorQuery.rows.length === 0) {
                    throw new Error('Proveedor no encontrado o no pertenece a esta organización');
                }
            }

            // Calcular valor_total
            const costoUnitario = data.costo_unitario || 0;
            const valorTotal = Math.abs(data.cantidad) * costoUnitario;

            // Insertar movimiento
            const query = `
                INSERT INTO movimientos_inventario (
                    organizacion_id,
                    producto_id,
                    tipo_movimiento,
                    cantidad,
                    stock_antes,
                    stock_despues,
                    costo_unitario,
                    valor_total,
                    proveedor_id,
                    venta_pos_id,
                    cita_id,
                    usuario_id,
                    referencia,
                    motivo,
                    fecha_vencimiento,
                    lote
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.producto_id,
                data.tipo_movimiento,
                data.cantidad,
                stockAntes,
                stockDespues,
                costoUnitario,
                valorTotal,
                data.proveedor_id || null,
                data.venta_pos_id || null,
                data.cita_id || null,
                data.usuario_id || null,
                data.referencia || null,
                data.motivo || null,
                data.fecha_vencimiento || null,
                data.lote || null
            ];

            const resultMovimiento = await db.query(query, values);

            // Actualizar stock del producto
            await db.query(
                `UPDATE productos
                 SET stock_actual = $1, actualizado_en = NOW()
                 WHERE id = $2`,
                [stockDespues, data.producto_id]
            );

            logger.info('[MovimientosInventarioModel.registrar] Movimiento registrado', {
                movimiento_id: resultMovimiento.rows[0].id,
                stock_antes: stockAntes,
                stock_despues: stockDespues
            });

            return resultMovimiento.rows[0];
        });
    }

    /**
     * Obtener kardex (historial de movimientos) de un producto
     * IMPORTANTE: Trabaja con tabla particionada
     */
    static async obtenerKardex(productoId, organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = [
                'm.producto_id = $1'
            ];
            let values = [productoId];
            let paramCounter = 2;

            // Filtro por tipo de movimiento
            if (filtros.tipo_movimiento) {
                whereConditions.push(`m.tipo_movimiento = $${paramCounter}`);
                values.push(filtros.tipo_movimiento);
                paramCounter++;
            }

            // Filtro por fecha desde
            if (filtros.fecha_desde) {
                whereConditions.push(`m.creado_en >= $${paramCounter}`);
                values.push(filtros.fecha_desde);
                paramCounter++;
            }

            // Filtro por fecha hasta
            if (filtros.fecha_hasta) {
                whereConditions.push(`m.creado_en <= $${paramCounter}`);
                values.push(filtros.fecha_hasta);
                paramCounter++;
            }

            // Filtro por proveedor
            if (filtros.proveedor_id) {
                whereConditions.push(`m.proveedor_id = $${paramCounter}`);
                values.push(filtros.proveedor_id);
                paramCounter++;
            }

            const query = `
                SELECT
                    m.*,
                    p.nombre AS nombre_producto,
                    p.sku,
                    prov.nombre AS nombre_proveedor,
                    u.nombre AS nombre_usuario
                FROM movimientos_inventario m
                JOIN productos p ON p.id = m.producto_id
                LEFT JOIN proveedores prov ON prov.id = m.proveedor_id
                LEFT JOIN usuarios u ON u.id = m.usuario_id
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY m.creado_en DESC
                LIMIT $${paramCounter}
                OFFSET $${paramCounter + 1}
            `;

            values.push(filtros.limit || 100);
            values.push(filtros.offset || 0);

            const result = await db.query(query, values);

            // Obtener total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM movimientos_inventario m
                WHERE ${whereConditions.join(' AND ')}
            `;

            const countResult = await db.query(countQuery, values.slice(0, values.length - 2));

            return {
                movimientos: result.rows,
                total: parseInt(countResult.rows[0].total),
                limit: filtros.limit || 100,
                offset: filtros.offset || 0
            };
        });
    }

    /**
     * Listar movimientos con filtros
     * IMPORTANTE: Query optimizada para tabla particionada
     */
    static async listar(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['m.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            // Filtro por tipo de movimiento
            if (filtros.tipo_movimiento) {
                whereConditions.push(`m.tipo_movimiento = $${paramCounter}`);
                values.push(filtros.tipo_movimiento);
                paramCounter++;
            }

            // Filtro por categoría (tipos entrada/salida)
            if (filtros.categoria === 'entrada') {
                whereConditions.push(`m.tipo_movimiento LIKE 'entrada%'`);
            } else if (filtros.categoria === 'salida') {
                whereConditions.push(`m.tipo_movimiento LIKE 'salida%'`);
            }

            // Filtro por producto
            if (filtros.producto_id) {
                whereConditions.push(`m.producto_id = $${paramCounter}`);
                values.push(filtros.producto_id);
                paramCounter++;
            }

            // Filtro por proveedor
            if (filtros.proveedor_id) {
                whereConditions.push(`m.proveedor_id = $${paramCounter}`);
                values.push(filtros.proveedor_id);
                paramCounter++;
            }

            // CRÍTICO: Filtro por rango de fechas (aprovecha particionamiento)
            if (filtros.fecha_desde) {
                whereConditions.push(`m.creado_en >= $${paramCounter}`);
                values.push(filtros.fecha_desde);
                paramCounter++;
            }

            if (filtros.fecha_hasta) {
                whereConditions.push(`m.creado_en <= $${paramCounter}`);
                values.push(filtros.fecha_hasta);
                paramCounter++;
            }

            const query = `
                SELECT
                    m.*,
                    p.nombre AS nombre_producto,
                    p.sku,
                    prov.nombre AS nombre_proveedor,
                    u.nombre AS nombre_usuario
                FROM movimientos_inventario m
                JOIN productos p ON p.id = m.producto_id
                LEFT JOIN proveedores prov ON prov.id = m.proveedor_id
                LEFT JOIN usuarios u ON u.id = m.usuario_id
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY m.creado_en DESC
                LIMIT $${paramCounter}
                OFFSET $${paramCounter + 1}
            `;

            values.push(filtros.limit || 50);
            values.push(filtros.offset || 0);

            const result = await db.query(query, values);

            // Obtener totales
            const totalesQuery = `
                SELECT
                    COUNT(*) as total_movimientos,
                    SUM(CASE WHEN m.tipo_movimiento LIKE 'entrada%' THEN m.cantidad ELSE 0 END) as total_entradas,
                    SUM(CASE WHEN m.tipo_movimiento LIKE 'salida%' THEN ABS(m.cantidad) ELSE 0 END) as total_salidas,
                    SUM(m.valor_total) as valor_total
                FROM movimientos_inventario m
                WHERE ${whereConditions.join(' AND ')}
            `;

            const totalesResult = await db.query(totalesQuery, values.slice(0, values.length - 2));

            return {
                movimientos: result.rows,
                totales: totalesResult.rows[0],
                limit: filtros.limit || 50,
                offset: filtros.offset || 0
            };
        });
    }

    /**
     * Obtener estadísticas de movimientos por período
     */
    static async obtenerEstadisticas(organizacionId, fechaDesde, fechaHasta) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    m.tipo_movimiento,
                    COUNT(*) as total_movimientos,
                    SUM(ABS(m.cantidad)) as total_unidades,
                    SUM(m.valor_total) as valor_total,
                    AVG(ABS(m.cantidad)) as promedio_unidades
                FROM movimientos_inventario m
                WHERE m.organizacion_id = $1
                  AND m.creado_en >= $2
                  AND m.creado_en <= $3
                GROUP BY m.tipo_movimiento
                ORDER BY total_movimientos DESC
            `;

            const result = await db.query(query, [organizacionId, fechaDesde, fechaHasta]);

            // Resumen por categoría (entradas vs salidas)
            const resumenQuery = `
                SELECT
                    CASE
                        WHEN tipo_movimiento LIKE 'entrada%' THEN 'entradas'
                        WHEN tipo_movimiento LIKE 'salida%' THEN 'salidas'
                    END as categoria,
                    COUNT(*) as total_movimientos,
                    SUM(ABS(cantidad)) as total_unidades,
                    SUM(valor_total) as valor_total
                FROM movimientos_inventario
                WHERE organizacion_id = $1
                  AND creado_en >= $2
                  AND creado_en <= $3
                GROUP BY categoria
            `;

            const resumenResult = await db.query(resumenQuery, [organizacionId, fechaDesde, fechaHasta]);

            return {
                por_tipo: result.rows,
                resumen: resumenResult.rows
            };
        });
    }
}

module.exports = MovimientosInventarioModel;
