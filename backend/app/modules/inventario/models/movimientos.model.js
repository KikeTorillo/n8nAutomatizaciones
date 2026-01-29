const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { ErrorHelper } = require('../../../utils/helpers');

/**
 * Model para movimientos de inventario (tabla particionada)
 * Maneja entradas y salidas de stock (kardex)
 * IMPORTANTE: Tabla particionada por creado_en (rango mensual)
 */
class MovimientosInventarioModel {

    /**
     * Registrar movimiento de inventario
     * CRÍTICO: Usa registrar_movimiento_con_ubicacion() para mantener
     * sincronizado stock_ubicaciones y productos.stock_actual
     * Ene 2026: Refactorizado para usar función SQL consolidada
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
                `SELECT id, nombre FROM productos
                 WHERE id = $1 AND organizacion_id = $2`,
                [data.producto_id, organizacionId]
            );

            ErrorHelper.throwIfNotFound(productoQuery.rows[0], 'Producto');

            // Validar proveedor si es entrada de compra
            if (data.tipo_movimiento === 'entrada_compra' && data.proveedor_id) {
                const proveedorQuery = await db.query(
                    `SELECT id FROM proveedores
                     WHERE id = $1 AND organizacion_id = $2 AND activo = true`,
                    [data.proveedor_id, organizacionId]
                );

                ErrorHelper.throwIfNotFound(proveedorQuery.rows[0], 'Proveedor');
            }

            // Usar función SQL consolidada que maneja:
            // 1. Inserción del movimiento
            // 2. Actualización de stock_ubicaciones
            // 3. Sincronización de productos.stock_actual (via trigger)
            // 4. Sincronización de variantes_producto.stock_actual (si aplica)
            const query = `
                SELECT registrar_movimiento_con_ubicacion(
                    $1,  -- p_organizacion_id
                    $2,  -- p_producto_id
                    $3,  -- p_tipo_movimiento
                    $4,  -- p_cantidad
                    $5,  -- p_sucursal_id
                    $6,  -- p_ubicacion_id
                    $7,  -- p_lote
                    $8,  -- p_fecha_vencimiento
                    $9,  -- p_referencia
                    $10, -- p_motivo
                    $11, -- p_usuario_id
                    $12, -- p_costo_unitario
                    $13, -- p_proveedor_id
                    $14, -- p_venta_pos_id
                    $15, -- p_cita_id
                    $16  -- p_variante_id
                ) as movimiento_id
            `;

            const values = [
                organizacionId,
                data.producto_id,
                data.tipo_movimiento,
                data.cantidad,
                data.sucursal_id || null,
                data.ubicacion_id || null,
                data.lote || null,
                data.fecha_vencimiento || null,
                data.referencia || null,
                data.motivo || null,
                data.usuario_id || null,
                data.costo_unitario || null,
                data.proveedor_id || null,
                data.venta_pos_id || null,
                data.cita_id || null,
                data.variante_id || null
            ];

            const result = await db.query(query, values);
            const movimientoId = result.rows[0].movimiento_id;

            // Obtener el movimiento completo para retornar
            const movimientoQuery = await db.query(
                `SELECT * FROM movimientos_inventario WHERE id = $1`,
                [movimientoId]
            );

            logger.info('[MovimientosInventarioModel.registrar] Movimiento registrado', {
                movimiento_id: movimientoId,
                stock_antes: movimientoQuery.rows[0].stock_antes,
                stock_despues: movimientoQuery.rows[0].stock_despues
            });

            return movimientoQuery.rows[0];
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

            // Obtener información del producto
            const productoQuery = `
                SELECT
                    id,
                    nombre,
                    sku,
                    stock_actual,
                    stock_minimo,
                    stock_maximo,
                    unidad_medida
                FROM productos
                WHERE id = $1
            `;
            const productoResult = await db.query(productoQuery, [productoId]);

            return {
                kardex: result.rows,
                producto: productoResult.rows[0] || null,
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
    static async listar(organizacionId, filtros) {
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

            // ✅ FEATURE: Multi-sucursal - Filtrar por sucursal
            if (filtros.sucursal_id) {
                whereConditions.push(`m.sucursal_id = $${paramCounter}`);
                values.push(filtros.sucursal_id);
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
