const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

/**
 * Model para valoracion de inventario FIFO/AVCO
 * Proporciona metodos contables de valoracion de stock
 * @since Dic 2025 - Gap Valoracion FIFO/AVCO
 */
class ValoracionModel {

    // Metodos disponibles
    static METODOS = {
        FIFO: 'fifo',
        AVCO: 'avco',
        PROMEDIO: 'promedio'
    };

    // =========================================================================
    // CONFIGURACION
    // =========================================================================

    /**
     * Obtener configuracion de valoracion de la organizacion
     */
    static async obtenerConfiguracion(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    id,
                    metodo_valoracion,
                    incluir_gastos_envio,
                    redondeo_decimales,
                    actualizado_en
                FROM configuracion_valoracion
                WHERE organizacion_id = $1
            `;

            const result = await db.query(query, [organizacionId]);

            if (result.rows.length === 0) {
                // Crear configuracion por defecto si no existe
                const insertQuery = `
                    INSERT INTO configuracion_valoracion (organizacion_id, metodo_valoracion)
                    VALUES ($1, 'promedio')
                    RETURNING *
                `;
                const insertResult = await db.query(insertQuery, [organizacionId]);
                return insertResult.rows[0];
            }

            return result.rows[0];
        });
    }

    /**
     * Actualizar configuracion de valoracion
     */
    static async actualizarConfiguracion(organizacionId, data, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const { metodo_valoracion, incluir_gastos_envio, redondeo_decimales } = data;

            const query = `
                UPDATE configuracion_valoracion
                SET
                    metodo_valoracion = COALESCE($1, metodo_valoracion),
                    incluir_gastos_envio = COALESCE($2, incluir_gastos_envio),
                    redondeo_decimales = COALESCE($3, redondeo_decimales),
                    actualizado_por = $4,
                    actualizado_en = NOW()
                WHERE organizacion_id = $5
                RETURNING *
            `;

            const result = await db.query(query, [
                metodo_valoracion,
                incluir_gastos_envio,
                redondeo_decimales,
                usuarioId,
                organizacionId
            ]);

            logger.info('[ValoracionModel.actualizarConfiguracion] Configuracion actualizada', {
                organizacion_id: organizacionId,
                metodo: metodo_valoracion
            });

            return result.rows[0];
        });
    }

    // =========================================================================
    // CALCULO FIFO
    // =========================================================================

    /**
     * Calcular costo FIFO para un producto
     * @param {number} productoId - ID del producto
     * @param {number} organizacionId - ID de la organizacion
     * @param {number|null} sucursalId - ID de sucursal (opcional)
     */
    static async calcularFIFO(productoId, organizacionId, sucursalId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM calcular_costo_fifo($1, $2, $3)
            `;

            const result = await db.query(query, [productoId, organizacionId, sucursalId]);
            return result.rows[0];
        });
    }

    /**
     * Obtener capas de inventario FIFO detalladas
     */
    static async obtenerCapasFIFO(productoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM obtener_capas_inventario_fifo($1, $2)
            `;

            const result = await db.query(query, [productoId, organizacionId]);
            return result.rows;
        });
    }

    // =========================================================================
    // CALCULO AVCO
    // =========================================================================

    /**
     * Calcular costo AVCO (Average Cost) para un producto
     * @param {number} productoId - ID del producto
     * @param {number} organizacionId - ID de la organizacion
     * @param {number|null} sucursalId - ID de sucursal (opcional)
     */
    static async calcularAVCO(productoId, organizacionId, sucursalId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM calcular_costo_avco($1, $2, $3)
            `;

            const result = await db.query(query, [productoId, organizacionId, sucursalId]);
            return result.rows[0];
        });
    }

    // =========================================================================
    // VALORACION TOTAL
    // =========================================================================

    /**
     * Calcular valor total del inventario usando el metodo especificado
     * @param {number} organizacionId - ID de la organizacion
     * @param {string|null} metodo - Metodo (fifo, avco, promedio) o null para usar config
     * @param {number|null} categoriaId - Filtrar por categoria
     * @param {number|null} sucursalId - Filtrar por sucursal
     */
    static async calcularValorTotal(organizacionId, metodo = null, categoriaId = null, sucursalId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM calcular_valor_inventario_metodo($1, $2, $3, $4)
            `;

            const result = await db.query(query, [organizacionId, metodo, categoriaId, sucursalId]);
            return result.rows[0];
        });
    }

    /**
     * Comparar todos los metodos de valoracion para un producto o inventario
     */
    static async compararMetodos(organizacionId, productoId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM comparar_metodos_valoracion($1, $2)
            `;

            const result = await db.query(query, [organizacionId, productoId]);
            return result.rows;
        });
    }

    // =========================================================================
    // REPORTES
    // =========================================================================

    /**
     * Obtener reporte de valoracion por categoria
     */
    static async reportePorCategoria(organizacionId, metodo = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Primero obtener metodo configurado si no se especifica
            let metodoUsar = metodo;
            if (!metodoUsar) {
                const configQuery = `
                    SELECT metodo_valoracion FROM configuracion_valoracion
                    WHERE organizacion_id = $1
                `;
                const configResult = await db.query(configQuery, [organizacionId]);
                metodoUsar = configResult.rows[0]?.metodo_valoracion || 'promedio';
            }

            const query = `
                SELECT
                    cp.id as categoria_id,
                    cp.nombre as categoria,
                    COUNT(p.id) as total_productos,
                    SUM(p.stock_actual) as total_unidades,
                    SUM(p.stock_actual * p.precio_compra) as valor_promedio,
                    $2 as metodo
                FROM productos p
                LEFT JOIN categorias_productos cp ON cp.id = p.categoria_id
                WHERE p.organizacion_id = $1
                AND p.activo = true
                AND p.eliminado_en IS NULL
                AND p.stock_actual > 0
                GROUP BY cp.id, cp.nombre
                ORDER BY valor_promedio DESC
            `;

            const result = await db.query(query, [organizacionId, metodoUsar]);

            // Para cada categoria, calcular valor segun metodo
            for (const row of result.rows) {
                if (metodoUsar !== 'promedio') {
                    const valorQuery = `
                        SELECT valor_total FROM calcular_valor_inventario_metodo($1, $2, $3, NULL)
                    `;
                    const valorResult = await db.query(valorQuery, [organizacionId, metodoUsar, row.categoria_id]);
                    row.valor_metodo = valorResult.rows[0]?.valor_total || row.valor_promedio;
                } else {
                    row.valor_metodo = row.valor_promedio;
                }
            }

            return result.rows;
        });
    }

    /**
     * Obtener productos con mayor diferencia entre metodos
     */
    static async productosConMayorDiferencia(organizacionId, limite = 10) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    c.*,
                    ABS(c.diferencia_fifo_promedio) + ABS(c.diferencia_avco_promedio) as diferencia_total
                FROM comparar_metodos_valoracion($1, NULL) c
                ORDER BY ABS(c.diferencia_fifo_promedio) + ABS(c.diferencia_avco_promedio) DESC
                LIMIT $2
            `;

            const result = await db.query(query, [organizacionId, limite]);
            return result.rows;
        });
    }

    /**
     * Obtener resumen de valoracion para dashboard
     */
    static async resumenValoracion(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener config
            const configQuery = `
                SELECT metodo_valoracion FROM configuracion_valoracion
                WHERE organizacion_id = $1
            `;
            const configResult = await db.query(configQuery, [organizacionId]);
            const metodoActual = configResult.rows[0]?.metodo_valoracion || 'promedio';

            // Calcular valores con cada metodo
            const promedio = await db.query(
                `SELECT * FROM calcular_valor_inventario_metodo($1, 'promedio', NULL, NULL)`,
                [organizacionId]
            );

            const fifo = await db.query(
                `SELECT * FROM calcular_valor_inventario_metodo($1, 'fifo', NULL, NULL)`,
                [organizacionId]
            );

            const avco = await db.query(
                `SELECT * FROM calcular_valor_inventario_metodo($1, 'avco', NULL, NULL)`,
                [organizacionId]
            );

            return {
                metodo_configurado: metodoActual,
                promedio: promedio.rows[0],
                fifo: fifo.rows[0],
                avco: avco.rows[0],
                comparativa: {
                    diferencia_fifo_promedio: parseFloat(fifo.rows[0]?.valor_total || 0) -
                                              parseFloat(promedio.rows[0]?.valor_total || 0),
                    diferencia_avco_promedio: parseFloat(avco.rows[0]?.valor_total || 0) -
                                              parseFloat(promedio.rows[0]?.valor_total || 0)
                }
            };
        });
    }

    // =========================================================================
    // UTILIDADES
    // =========================================================================

    /**
     * Obtener valor para un producto especifico con todos los metodos
     */
    static async valorProducto(productoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Info del producto
            const productoQuery = `
                SELECT
                    p.id,
                    p.nombre,
                    p.sku,
                    p.stock_actual,
                    p.precio_compra,
                    p.precio_venta,
                    cp.nombre as categoria
                FROM productos p
                LEFT JOIN categorias_productos cp ON cp.id = p.categoria_id
                WHERE p.id = $1
                AND p.organizacion_id = $2
            `;
            const productoResult = await db.query(productoQuery, [productoId, organizacionId]);

            if (productoResult.rows.length === 0) {
                return null;
            }

            const producto = productoResult.rows[0];

            // Calcular valoraciones
            const fifoResult = await db.query(
                `SELECT * FROM calcular_costo_fifo($1, $2, NULL)`,
                [productoId, organizacionId]
            );

            const avcoResult = await db.query(
                `SELECT * FROM calcular_costo_avco($1, $2, NULL)`,
                [productoId, organizacionId]
            );

            const capasResult = await db.query(
                `SELECT * FROM obtener_capas_inventario_fifo($1, $2)`,
                [productoId, organizacionId]
            );

            return {
                producto,
                valoraciones: {
                    promedio: {
                        costo_unitario: parseFloat(producto.precio_compra || 0),
                        valor_total: parseFloat(producto.stock_actual || 0) * parseFloat(producto.precio_compra || 0)
                    },
                    fifo: fifoResult.rows[0],
                    avco: avcoResult.rows[0]
                },
                capas_fifo: capasResult.rows
            };
        });
    }
}

module.exports = ValoracionModel;
