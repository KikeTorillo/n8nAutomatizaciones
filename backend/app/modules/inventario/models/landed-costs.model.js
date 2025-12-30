/**
 * Model para Landed Costs (Costos en Destino)
 * CRUD de costos adicionales y distribucion a items de OC
 * Fecha: 30 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

class LandedCostsModel {
    // ==================== COSTOS ADICIONALES ====================

    /**
     * Listar costos adicionales de una OC
     * @param {number} organizacionId
     * @param {number} ordenCompraId
     * @returns {Array} Lista de costos adicionales
     */
    static async listarPorOC(organizacionId, ordenCompraId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT
                    ca.*,
                    u.nombre as usuario_nombre,
                    p.razon_social as proveedor_servicio_razon_social,
                    CASE WHEN ca.distribuido THEN
                        (SELECT COALESCE(SUM(monto_distribuido), 0)
                         FROM ordenes_compra_costos_distribuidos
                         WHERE costo_adicional_id = ca.id)
                    ELSE 0 END as total_distribuido
                FROM ordenes_compra_costos_adicionales ca
                LEFT JOIN usuarios u ON u.id = ca.usuario_id
                LEFT JOIN proveedores p ON p.id = ca.proveedor_servicio_id
                WHERE ca.orden_compra_id = $1
                ORDER BY ca.creado_en DESC
            `, [ordenCompraId]);

            return result.rows;
        });
    }

    /**
     * Obtener un costo adicional por ID
     * @param {number} id
     * @param {number} organizacionId
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT
                    ca.*,
                    u.nombre as usuario_nombre,
                    p.razon_social as proveedor_servicio_razon_social
                FROM ordenes_compra_costos_adicionales ca
                LEFT JOIN usuarios u ON u.id = ca.usuario_id
                LEFT JOIN proveedores p ON p.id = ca.proveedor_servicio_id
                WHERE ca.id = $1 AND ca.organizacion_id = $2
            `, [id, organizacionId]);

            return result.rows[0] || null;
        });
    }

    /**
     * Crear costo adicional
     * @param {Object} data - Datos del costo
     * @param {number} organizacionId
     * @param {number} usuarioId
     */
    static async crear(data, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const {
                orden_compra_id,
                tipo_costo,
                descripcion,
                referencia_externa,
                monto_total,
                moneda = 'MXN',
                tipo_cambio = 1,
                metodo_distribucion = 'valor',
                proveedor_servicio_id,
                proveedor_servicio_nombre
            } = data;

            // Verificar que la OC existe y pertenece a la organizacion
            const ocCheck = await db.query(
                'SELECT id, estado FROM ordenes_compra WHERE id = $1 AND organizacion_id = $2',
                [orden_compra_id, organizacionId]
            );

            if (!ocCheck.rows[0]) {
                throw new Error('Orden de compra no encontrada');
            }

            if (ocCheck.rows[0].estado === 'cancelada') {
                throw new Error('No se pueden agregar costos a una OC cancelada');
            }

            const result = await db.query(`
                INSERT INTO ordenes_compra_costos_adicionales (
                    organizacion_id,
                    orden_compra_id,
                    tipo_costo,
                    descripcion,
                    referencia_externa,
                    monto_total,
                    moneda,
                    tipo_cambio,
                    metodo_distribucion,
                    proveedor_servicio_id,
                    proveedor_servicio_nombre,
                    usuario_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `, [
                organizacionId,
                orden_compra_id,
                tipo_costo,
                descripcion,
                referencia_externa,
                monto_total,
                moneda,
                tipo_cambio,
                metodo_distribucion,
                proveedor_servicio_id || null,
                proveedor_servicio_nombre || null,
                usuarioId
            ]);

            logger.info('[LandedCostsModel.crear] Costo adicional creado', {
                id: result.rows[0].id,
                orden_compra_id,
                tipo_costo,
                monto_total
            });

            return result.rows[0];
        });
    }

    /**
     * Actualizar costo adicional (solo si no esta distribuido)
     */
    static async actualizar(id, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que existe y no esta distribuido
            const existing = await db.query(
                'SELECT id, distribuido FROM ordenes_compra_costos_adicionales WHERE id = $1 AND organizacion_id = $2',
                [id, organizacionId]
            );

            if (!existing.rows[0]) {
                return null;
            }

            if (existing.rows[0].distribuido) {
                throw new Error('No se puede modificar un costo ya distribuido');
            }

            const {
                tipo_costo,
                descripcion,
                referencia_externa,
                monto_total,
                moneda,
                tipo_cambio,
                metodo_distribucion,
                proveedor_servicio_id,
                proveedor_servicio_nombre
            } = data;

            const result = await db.query(`
                UPDATE ordenes_compra_costos_adicionales
                SET
                    tipo_costo = COALESCE($3, tipo_costo),
                    descripcion = COALESCE($4, descripcion),
                    referencia_externa = COALESCE($5, referencia_externa),
                    monto_total = COALESCE($6, monto_total),
                    moneda = COALESCE($7, moneda),
                    tipo_cambio = COALESCE($8, tipo_cambio),
                    metodo_distribucion = COALESCE($9, metodo_distribucion),
                    proveedor_servicio_id = $10,
                    proveedor_servicio_nombre = $11,
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
                RETURNING *
            `, [
                id,
                organizacionId,
                tipo_costo,
                descripcion,
                referencia_externa,
                monto_total,
                moneda,
                tipo_cambio,
                metodo_distribucion,
                proveedor_servicio_id,
                proveedor_servicio_nombre
            ]);

            return result.rows[0];
        });
    }

    /**
     * Eliminar costo adicional (solo si no esta distribuido)
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que existe y no esta distribuido
            const existing = await db.query(
                'SELECT id, distribuido FROM ordenes_compra_costos_adicionales WHERE id = $1 AND organizacion_id = $2',
                [id, organizacionId]
            );

            if (!existing.rows[0]) {
                return false;
            }

            if (existing.rows[0].distribuido) {
                throw new Error('No se puede eliminar un costo ya distribuido');
            }

            await db.query(
                'DELETE FROM ordenes_compra_costos_adicionales WHERE id = $1 AND organizacion_id = $2',
                [id, organizacionId]
            );

            return true;
        });
    }

    // ==================== DISTRIBUCION ====================

    /**
     * Distribuir un costo adicional a los items de la OC
     * @param {number} costoId - ID del costo adicional
     * @param {number} organizacionId
     */
    static async distribuir(costoId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT distribuir_costo_adicional($1)',
                [costoId]
            );

            const resultado = result.rows[0].distribuir_costo_adicional;

            if (!resultado.exito) {
                throw new Error(resultado.mensaje);
            }

            logger.info('[LandedCostsModel.distribuir] Costo distribuido', {
                costo_id: costoId,
                items_procesados: resultado.items_procesados,
                monto_distribuido: resultado.monto_distribuido
            });

            return resultado;
        });
    }

    /**
     * Distribuir todos los costos pendientes de una OC
     */
    static async distribuirTodos(ordenCompraId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Obtener costos no distribuidos
            const costosResult = await db.query(`
                SELECT id FROM ordenes_compra_costos_adicionales
                WHERE orden_compra_id = $1 AND organizacion_id = $2 AND NOT distribuido
            `, [ordenCompraId, organizacionId]);

            const resultados = [];

            for (const costo of costosResult.rows) {
                const result = await db.query(
                    'SELECT distribuir_costo_adicional($1)',
                    [costo.id]
                );
                resultados.push({
                    costo_id: costo.id,
                    ...result.rows[0].distribuir_costo_adicional
                });
            }

            return {
                total_distribuidos: resultados.filter(r => r.exito).length,
                resultados
            };
        });
    }

    /**
     * Obtener detalle de distribucion de un costo
     */
    static async obtenerDistribucion(costoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT
                    cd.*,
                    p.sku as producto_sku,
                    p.codigo_barras
                FROM ordenes_compra_costos_distribuidos cd
                LEFT JOIN productos p ON p.id = cd.producto_id
                WHERE cd.costo_adicional_id = $1
                ORDER BY cd.id
            `, [costoId]);

            return result.rows;
        });
    }

    // ==================== RESUMEN ====================

    /**
     * Obtener resumen de costos por OC
     */
    static async obtenerResumenOC(ordenCompraId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT * FROM obtener_resumen_costos_oc($1)',
                [ordenCompraId]
            );

            // Obtener totales generales
            const totalesResult = await db.query(`
                SELECT
                    COALESCE(SUM(monto_moneda_local), 0) as total_costos,
                    COALESCE(SUM(CASE WHEN distribuido THEN monto_moneda_local ELSE 0 END), 0) as total_distribuido,
                    COALESCE(SUM(CASE WHEN NOT distribuido THEN monto_moneda_local ELSE 0 END), 0) as total_pendiente,
                    COUNT(*) as cantidad_costos
                FROM ordenes_compra_costos_adicionales
                WHERE orden_compra_id = $1
            `, [ordenCompraId]);

            return {
                por_tipo: result.rows,
                totales: totalesResult.rows[0]
            };
        });
    }

    /**
     * Obtener costo total unitario de un item (precio + landed costs)
     */
    static async obtenerCostoTotalItem(itemId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT * FROM obtener_costo_total_item($1)',
                [itemId]
            );

            return result.rows[0] || null;
        });
    }

    /**
     * Obtener costos totales por item de una OC
     */
    static async obtenerCostosPorItems(ordenCompraId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT
                    oci.id as item_id,
                    oci.producto_id,
                    p.nombre as producto_nombre,
                    p.sku as producto_sku,
                    oci.cantidad,
                    oci.cantidad_recibida,
                    oci.precio_unitario,
                    COALESCE(SUM(cd.costo_unitario_distribuido), 0) as landed_costs_unitario,
                    oci.precio_unitario + COALESCE(SUM(cd.costo_unitario_distribuido), 0) as costo_total_unitario,
                    (oci.precio_unitario + COALESCE(SUM(cd.costo_unitario_distribuido), 0)) *
                        COALESCE(oci.cantidad_recibida, oci.cantidad) as costo_total_linea
                FROM ordenes_compra_items oci
                JOIN productos p ON p.id = oci.producto_id
                LEFT JOIN ordenes_compra_costos_distribuidos cd ON cd.orden_compra_item_id = oci.id
                WHERE oci.orden_compra_id = $1
                GROUP BY oci.id, oci.producto_id, p.nombre, p.sku, oci.cantidad,
                         oci.cantidad_recibida, oci.precio_unitario
                ORDER BY oci.id
            `, [ordenCompraId]);

            return result.rows;
        });
    }
}

module.exports = LandedCostsModel;
