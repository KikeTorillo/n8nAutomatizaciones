const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

/**
 * Model para Dropshipping
 * Flujo: Venta con producto dropship → OC automatica/manual → Proveedor envia directo
 * Fecha: 30 Diciembre 2025
 */
class DropshipModel {

    // ========================================================================
    // CREAR OC DESDE VENTA
    // ========================================================================

    /**
     * Crear OC dropship desde una venta
     * Llama a la funcion SQL crear_oc_dropship_desde_venta()
     * @param {number} ventaId - ID de la venta POS
     * @param {number} usuarioId - ID del usuario que genera
     * @param {number} organizacionId - ID de la organizacion
     */
    static async crearOCDesdeVenta(ventaId, usuarioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            logger.info('[DropshipModel.crearOCDesdeVenta] Iniciando', {
                venta_id: ventaId,
                usuario_id: usuarioId,
                organizacion_id: organizacionId
            });

            // Verificar que la venta existe y pertenece a la organizacion
            const ventaCheck = await db.query(
                `SELECT id, folio, es_dropship, requiere_oc_dropship, estado
                 FROM ventas_pos
                 WHERE id = $1 AND organizacion_id = $2`,
                [ventaId, organizacionId]
            );

            if (ventaCheck.rows.length === 0) {
                throw new Error('Venta no encontrada');
            }

            const venta = ventaCheck.rows[0];

            if (venta.estado !== 'completada') {
                throw new Error('Solo se pueden procesar ventas completadas');
            }

            // Llamar a la funcion SQL
            const result = await db.query(
                `SELECT crear_oc_dropship_desde_venta($1, $2) as resultado`,
                [ventaId, usuarioId]
            );

            const resultado = result.rows[0].resultado;

            if (!resultado.exito) {
                throw new Error(resultado.mensaje);
            }

            logger.info('[DropshipModel.crearOCDesdeVenta] OC(s) creadas', {
                venta_id: ventaId,
                ocs_creadas: resultado.ocs_creadas,
                items_procesados: resultado.items_procesados
            });

            return resultado;
        });
    }

    // ========================================================================
    // CONSULTAS
    // ========================================================================

    /**
     * Obtener ventas pendientes de generar OC dropship
     */
    static async obtenerVentasPendientes(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                `SELECT * FROM obtener_ventas_dropship_pendientes($1)`,
                [organizacionId]
            );

            return result.rows;
        });
    }

    /**
     * Listar OC dropship con filtros
     */
    static async listarOCDropship(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereClause = 'WHERE oc.organizacion_id = $1 AND oc.es_dropship = true';
            const params = [organizacionId];
            let paramIndex = 2;

            // Filtro por estado
            if (filtros.estado) {
                whereClause += ` AND oc.estado = $${paramIndex}`;
                params.push(filtros.estado);
                paramIndex++;
            }

            // Filtro por proveedor
            if (filtros.proveedor_id) {
                whereClause += ` AND oc.proveedor_id = $${paramIndex}`;
                params.push(filtros.proveedor_id);
                paramIndex++;
            }

            // Filtro por fecha
            if (filtros.fecha_desde) {
                whereClause += ` AND oc.fecha_orden >= $${paramIndex}`;
                params.push(filtros.fecha_desde);
                paramIndex++;
            }

            if (filtros.fecha_hasta) {
                whereClause += ` AND oc.fecha_orden <= $${paramIndex}`;
                params.push(filtros.fecha_hasta);
                paramIndex++;
            }

            const query = `
                SELECT
                    oc.id,
                    oc.folio,
                    oc.estado,
                    oc.total,
                    oc.fecha_orden,
                    oc.proveedor_id,
                    prov.razon_social as proveedor_nombre,
                    oc.venta_pos_id,
                    v.folio as venta_folio,
                    oc.cliente_id,
                    oc.cliente_nombre,
                    oc.cliente_telefono,
                    oc.direccion_envio_cliente,
                    oc.creado_en,
                    (SELECT COUNT(*) FROM ordenes_compra_items oci WHERE oci.orden_compra_id = oc.id) as total_items
                FROM ordenes_compra oc
                JOIN proveedores prov ON prov.id = oc.proveedor_id
                LEFT JOIN ventas_pos v ON v.id = oc.venta_pos_id
                ${whereClause}
                ORDER BY oc.creado_en DESC
            `;

            const result = await db.query(query, params);
            return result.rows;
        });
    }

    /**
     * Obtener detalle de OC dropship
     */
    static async obtenerDetalle(ocId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Cabecera
            const ocQuery = await db.query(`
                SELECT
                    oc.*,
                    prov.razon_social as proveedor_nombre,
                    prov.telefono as proveedor_telefono,
                    prov.email as proveedor_email,
                    v.folio as venta_folio,
                    v.total as venta_total,
                    v.fecha_venta
                FROM ordenes_compra oc
                JOIN proveedores prov ON prov.id = oc.proveedor_id
                LEFT JOIN ventas_pos v ON v.id = oc.venta_pos_id
                WHERE oc.id = $1 AND oc.organizacion_id = $2 AND oc.es_dropship = true
            `, [ocId, organizacionId]);

            if (ocQuery.rows.length === 0) {
                return null;
            }

            const oc = ocQuery.rows[0];

            // Items
            const itemsQuery = await db.query(`
                SELECT
                    oci.*,
                    p.imagen_url
                FROM ordenes_compra_items oci
                LEFT JOIN productos p ON p.id = oci.producto_id
                WHERE oci.orden_compra_id = $1
                ORDER BY oci.id
            `, [ocId]);

            return {
                ...oc,
                items: itemsQuery.rows
            };
        });
    }

    // ========================================================================
    // ACCIONES
    // ========================================================================

    /**
     * Confirmar entrega de OC dropship
     * No actualiza stock ya que el producto nunca paso por almacen
     */
    static async confirmarEntrega(ocId, datos, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[DropshipModel.confirmarEntrega] Iniciando', {
                oc_id: ocId,
                organizacion_id: organizacionId
            });

            // Verificar que la OC existe y es dropship
            const ocCheck = await db.query(`
                SELECT id, folio, estado, es_dropship
                FROM ordenes_compra
                WHERE id = $1 AND organizacion_id = $2
            `, [ocId, organizacionId]);

            if (ocCheck.rows.length === 0) {
                throw new Error('Orden de compra no encontrada');
            }

            const oc = ocCheck.rows[0];

            if (!oc.es_dropship) {
                throw new Error('Esta orden no es de tipo dropship');
            }

            if (oc.estado === 'recibida') {
                throw new Error('Esta orden ya fue marcada como entregada');
            }

            if (oc.estado === 'cancelada') {
                throw new Error('No se puede confirmar una orden cancelada');
            }

            // Actualizar estado a recibida (sin mover stock)
            await db.query(`
                UPDATE ordenes_compra
                SET estado = 'recibida',
                    fecha_recepcion = CURRENT_DATE,
                    notas = COALESCE(notas, '') || $2,
                    actualizado_en = NOW()
                WHERE id = $1
            `, [ocId, datos.notas ? `\n[Entrega confirmada] ${datos.notas}` : '\n[Entrega confirmada al cliente]']);

            // Marcar items como completos
            await db.query(`
                UPDATE ordenes_compra_items
                SET estado = 'completo',
                    cantidad_recibida = cantidad_ordenada,
                    fecha_ultima_recepcion = NOW(),
                    actualizado_en = NOW()
                WHERE orden_compra_id = $1
            `, [ocId]);

            logger.info('[DropshipModel.confirmarEntrega] Entrega confirmada', {
                oc_id: ocId,
                folio: oc.folio
            });

            return {
                exito: true,
                mensaje: `Entrega de ${oc.folio} confirmada exitosamente`,
                oc_id: ocId
            };
        });
    }

    /**
     * Cancelar OC dropship
     */
    static async cancelar(ocId, motivo, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[DropshipModel.cancelar] Iniciando', {
                oc_id: ocId,
                organizacion_id: organizacionId
            });

            const ocCheck = await db.query(`
                SELECT id, folio, estado, es_dropship, venta_pos_id
                FROM ordenes_compra
                WHERE id = $1 AND organizacion_id = $2
            `, [ocId, organizacionId]);

            if (ocCheck.rows.length === 0) {
                throw new Error('Orden de compra no encontrada');
            }

            const oc = ocCheck.rows[0];

            if (!oc.es_dropship) {
                throw new Error('Esta orden no es de tipo dropship');
            }

            if (oc.estado === 'recibida') {
                throw new Error('No se puede cancelar una orden ya entregada');
            }

            if (oc.estado === 'cancelada') {
                throw new Error('Esta orden ya esta cancelada');
            }

            // Cancelar OC
            await db.query(`
                UPDATE ordenes_compra
                SET estado = 'cancelada',
                    cancelada_en = NOW(),
                    notas = COALESCE(notas, '') || $2,
                    actualizado_en = NOW()
                WHERE id = $1
            `, [ocId, motivo ? `\n[Cancelada] ${motivo}` : '\n[Cancelada]']);

            // Cancelar items
            await db.query(`
                UPDATE ordenes_compra_items
                SET estado = 'cancelado',
                    actualizado_en = NOW()
                WHERE orden_compra_id = $1
            `, [ocId]);

            // Marcar venta como que requiere nueva OC
            if (oc.venta_pos_id) {
                await db.query(`
                    UPDATE ventas_pos
                    SET requiere_oc_dropship = true
                    WHERE id = $1
                `, [oc.venta_pos_id]);
            }

            logger.info('[DropshipModel.cancelar] OC cancelada', {
                oc_id: ocId,
                folio: oc.folio
            });

            return {
                exito: true,
                mensaje: `Orden ${oc.folio} cancelada`,
                oc_id: ocId
            };
        });
    }

    // ========================================================================
    // CONFIGURACION
    // ========================================================================

    /**
     * Obtener configuracion dropship de la organizacion
     */
    static async obtenerConfiguracion(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar si la tabla existe
            const tableExists = await db.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_name = 'configuracion_inventario'
                )
            `);

            if (!tableExists.rows[0].exists) {
                // Tabla no existe, retornar configuracion por defecto
                return { dropship_auto_generar_oc: true };
            }

            const result = await db.query(`
                SELECT dropship_auto_generar_oc
                FROM configuracion_inventario
                WHERE organizacion_id = $1
            `, [organizacionId]);

            if (result.rows.length === 0) {
                // Configuracion por defecto
                return { dropship_auto_generar_oc: true };
            }

            return result.rows[0];
        });
    }

    /**
     * Actualizar configuracion dropship
     */
    static async actualizarConfiguracion(organizacionId, autoGenerar) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            await db.query(`
                UPDATE configuracion_inventario
                SET dropship_auto_generar_oc = $2
                WHERE organizacion_id = $1
            `, [organizacionId, autoGenerar]);

            return { dropship_auto_generar_oc: autoGenerar };
        });
    }

    // ========================================================================
    // ESTADISTICAS
    // ========================================================================

    /**
     * Obtener estadisticas de dropship
     */
    static async obtenerEstadisticas(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT
                    COUNT(*) FILTER (WHERE estado = 'borrador') as borradores,
                    COUNT(*) FILTER (WHERE estado = 'enviada') as enviadas,
                    COUNT(*) FILTER (WHERE estado = 'recibida') as entregadas,
                    COUNT(*) FILTER (WHERE estado = 'cancelada') as canceladas,
                    COUNT(*) as total,
                    COALESCE(SUM(total) FILTER (WHERE estado = 'recibida'), 0) as total_entregado,
                    COALESCE(SUM(total) FILTER (WHERE estado IN ('borrador', 'enviada')), 0) as total_pendiente
                FROM ordenes_compra
                WHERE organizacion_id = $1 AND es_dropship = true
            `, [organizacionId]);

            const ventasPendientes = await db.query(`
                SELECT COUNT(*) as total
                FROM ventas_pos
                WHERE organizacion_id = $1
                  AND requiere_oc_dropship = true
                  AND estado = 'completada'
            `, [organizacionId]);

            return {
                ...result.rows[0],
                ventas_pendientes: parseInt(ventasPendientes.rows[0].total)
            };
        });
    }
}

module.exports = DropshipModel;
