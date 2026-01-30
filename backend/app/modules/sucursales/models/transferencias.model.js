const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { ErrorHelper } = require('../../../utils/helpers');

/**
 * Model para transferencias de stock entre sucursales
 * Gestiona el workflow: borrador -> enviado -> recibido
 */
class TransferenciasStockModel {

    /**
     * Crear nueva transferencia
     */
    static async crear(data, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[TransferenciasStockModel.crear] Iniciando', {
                organizacion_id: organizacionId,
                origen: data.sucursal_origen_id,
                destino: data.sucursal_destino_id
            });

            // Crear transferencia
            const transferenciaQuery = `
                INSERT INTO transferencias_stock (
                    organizacion_id,
                    codigo,
                    sucursal_origen_id,
                    sucursal_destino_id,
                    estado,
                    usuario_crea_id,
                    notas
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const transferenciaValues = [
                organizacionId,
                data.codigo || null,  // Se genera automáticamente si es null
                data.sucursal_origen_id,
                data.sucursal_destino_id,
                'borrador',
                usuarioId,
                data.notas || null
            ];

            const transferenciaResult = await db.query(transferenciaQuery, transferenciaValues);
            const transferencia = transferenciaResult.rows[0];

            // Si hay items, agregarlos
            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    await db.query(`
                        INSERT INTO transferencias_stock_items (
                            transferencia_id, producto_id, cantidad_enviada, ubicacion_origen_id, lote, notas
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        transferencia.id,
                        item.producto_id,
                        item.cantidad_enviada,
                        item.ubicacion_origen_id || null,
                        item.lote || null,
                        item.notas || null
                    ]);
                }
            }

            logger.info('[TransferenciasStockModel.crear] Transferencia creada', {
                transferencia_id: transferencia.id,
                codigo: transferencia.codigo
            });

            return await this.obtenerPorId(transferencia.id, organizacionId);
        });
    }

    /**
     * Obtener transferencia por ID con items
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Transferencia
            const transferenciaQuery = `
                SELECT
                    t.*,
                    so.nombre AS sucursal_origen_nombre,
                    sd.nombre AS sucursal_destino_nombre,
                    uc.nombre AS usuario_crea_nombre,
                    ue.nombre AS usuario_envia_nombre,
                    ur.nombre AS usuario_recibe_nombre
                FROM transferencias_stock t
                LEFT JOIN sucursales so ON t.sucursal_origen_id = so.id
                LEFT JOIN sucursales sd ON t.sucursal_destino_id = sd.id
                LEFT JOIN usuarios uc ON t.usuario_crea_id = uc.id
                LEFT JOIN usuarios ue ON t.usuario_envia_id = ue.id
                LEFT JOIN usuarios ur ON t.usuario_recibe_id = ur.id
                WHERE t.id = $1
            `;

            const transferenciaResult = await db.query(transferenciaQuery, [id]);
            if (transferenciaResult.rows.length === 0) {
                return null;
            }

            const transferencia = transferenciaResult.rows[0];

            // Items con ubicaciones
            const itemsQuery = `
                SELECT
                    ti.*,
                    p.nombre AS producto_nombre,
                    p.sku AS producto_sku,
                    uo.codigo AS ubicacion_origen_codigo,
                    uo.nombre AS ubicacion_origen_nombre,
                    ud.codigo AS ubicacion_destino_codigo,
                    ud.nombre AS ubicacion_destino_nombre
                FROM transferencias_stock_items ti
                JOIN productos p ON ti.producto_id = p.id
                LEFT JOIN ubicaciones_almacen uo ON ti.ubicacion_origen_id = uo.id
                LEFT JOIN ubicaciones_almacen ud ON ti.ubicacion_destino_id = ud.id
                WHERE ti.transferencia_id = $1
                ORDER BY ti.id
            `;

            const itemsResult = await db.query(itemsQuery, [id]);
            transferencia.items = itemsResult.rows;

            return transferencia;
        });
    }

    /**
     * Listar transferencias con filtros
     */
    static async listar(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['t.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            // Filtro por estado
            if (filtros.estado) {
                whereConditions.push(`t.estado = $${paramCounter}`);
                values.push(filtros.estado);
                paramCounter++;
            }

            // Filtro por sucursal origen
            if (filtros.sucursal_origen_id) {
                whereConditions.push(`t.sucursal_origen_id = $${paramCounter}`);
                values.push(filtros.sucursal_origen_id);
                paramCounter++;
            }

            // Filtro por sucursal destino
            if (filtros.sucursal_destino_id) {
                whereConditions.push(`t.sucursal_destino_id = $${paramCounter}`);
                values.push(filtros.sucursal_destino_id);
                paramCounter++;
            }

            // Filtro por fecha
            if (filtros.fecha_desde) {
                whereConditions.push(`t.creado_en >= $${paramCounter}`);
                values.push(filtros.fecha_desde);
                paramCounter++;
            }

            if (filtros.fecha_hasta) {
                whereConditions.push(`t.creado_en <= $${paramCounter}`);
                values.push(filtros.fecha_hasta);
                paramCounter++;
            }

            const query = `
                SELECT
                    t.*,
                    so.nombre AS sucursal_origen_nombre,
                    sd.nombre AS sucursal_destino_nombre,
                    uc.nombre AS usuario_crea_nombre,
                    (SELECT COUNT(*) FROM transferencias_stock_items ti WHERE ti.transferencia_id = t.id) AS total_items,
                    (SELECT SUM(cantidad_enviada) FROM transferencias_stock_items ti WHERE ti.transferencia_id = t.id) AS total_unidades
                FROM transferencias_stock t
                LEFT JOIN sucursales so ON t.sucursal_origen_id = so.id
                LEFT JOIN sucursales sd ON t.sucursal_destino_id = sd.id
                LEFT JOIN usuarios uc ON t.usuario_crea_id = uc.id
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY t.creado_en DESC
            `;

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Agregar item a transferencia
     */
    static async agregarItem(transferenciaId, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que transferencia está en borrador
            const transferenciaQuery = await db.query(
                `SELECT estado FROM transferencias_stock WHERE id = $1`,
                [transferenciaId]
            );

            ErrorHelper.throwIfNotFound(transferenciaQuery.rows[0], 'Transferencia');

            if (transferenciaQuery.rows[0].estado !== 'borrador') {
                ErrorHelper.throwConflict('Solo se pueden modificar transferencias en borrador');
            }

            const query = `
                INSERT INTO transferencias_stock_items (
                    transferencia_id, producto_id, cantidad_enviada, ubicacion_origen_id, lote, notas
                ) VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (transferencia_id, producto_id)
                DO UPDATE SET
                    cantidad_enviada = EXCLUDED.cantidad_enviada,
                    ubicacion_origen_id = EXCLUDED.ubicacion_origen_id,
                    lote = EXCLUDED.lote,
                    notas = EXCLUDED.notas
                RETURNING *
            `;

            const result = await db.query(query, [
                transferenciaId,
                data.producto_id,
                data.cantidad_enviada,
                data.ubicacion_origen_id || null,
                data.lote || null,
                data.notas || null
            ]);

            return result.rows[0];
        });
    }

    /**
     * Eliminar item de transferencia
     */
    static async eliminarItem(transferenciaId, itemId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que transferencia está en borrador
            const transferenciaQuery = await db.query(
                `SELECT estado FROM transferencias_stock WHERE id = $1`,
                [transferenciaId]
            );

            ErrorHelper.throwIfNotFound(transferenciaQuery.rows[0], 'Transferencia');

            if (transferenciaQuery.rows[0].estado !== 'borrador') {
                ErrorHelper.throwConflict('Solo se pueden modificar transferencias en borrador');
            }

            await db.query(
                `DELETE FROM transferencias_stock_items WHERE id = $1 AND transferencia_id = $2`,
                [itemId, transferenciaId]
            );

            return true;
        });
    }

    /**
     * Enviar transferencia (borrador -> enviado)
     */
    static async enviar(id, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[TransferenciasStockModel.enviar] Iniciando', {
                transferencia_id: id,
                usuario_id: usuarioId
            });

            // Verificar que está en borrador
            const transferenciaQuery = await db.query(
                `SELECT estado FROM transferencias_stock WHERE id = $1`,
                [id]
            );

            ErrorHelper.throwIfNotFound(transferenciaQuery.rows[0], 'Transferencia');

            if (transferenciaQuery.rows[0].estado !== 'borrador') {
                ErrorHelper.throwConflict('Solo se pueden enviar transferencias en borrador');
            }

            // Verificar que tiene items
            const itemsQuery = await db.query(
                `SELECT COUNT(*) as total FROM transferencias_stock_items WHERE transferencia_id = $1`,
                [id]
            );

            if (parseInt(itemsQuery.rows[0].total) === 0) {
                ErrorHelper.throwValidation('La transferencia no tiene productos');
            }

            // Actualizar estado (el trigger procesará el stock)
            const query = `
                UPDATE transferencias_stock
                SET estado = 'enviado',
                    fecha_envio = NOW(),
                    usuario_envia_id = $2,
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [id, usuarioId]);

            logger.info('[TransferenciasStockModel.enviar] Transferencia enviada', {
                transferencia_id: id,
                codigo: result.rows[0].codigo
            });

            return await this.obtenerPorId(id, organizacionId);
        });
    }

    /**
     * Recibir transferencia (enviado -> recibido)
     */
    static async recibir(id, data, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[TransferenciasStockModel.recibir] Iniciando', {
                transferencia_id: id,
                usuario_id: usuarioId
            });

            // Verificar estado y obtener sucursal destino
            const transferenciaQuery = await db.query(
                `SELECT estado, sucursal_destino_id FROM transferencias_stock WHERE id = $1`,
                [id]
            );

            ErrorHelper.throwIfNotFound(transferenciaQuery.rows[0], 'Transferencia');

            const { estado, sucursal_destino_id } = transferenciaQuery.rows[0];

            if (estado !== 'enviado') {
                ErrorHelper.throwConflict('Solo se pueden recibir transferencias en estado enviado');
            }

            // Verificar que el usuario pertenece a la sucursal destino
            const usuarioSucursalQuery = await db.query(
                `SELECT 1 FROM usuarios_sucursales
                 WHERE usuario_id = $1 AND sucursal_id = $2 AND activo = true`,
                [usuarioId, sucursal_destino_id]
            );

            if (usuarioSucursalQuery.rows.length === 0) {
                ErrorHelper.throwForbidden('No tienes permisos para recibir en esta sucursal');
            }

            // Si hay cantidades recibidas diferentes, actualizar items
            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    await db.query(`
                        UPDATE transferencias_stock_items
                        SET cantidad_recibida = $1,
                            ubicacion_destino_id = COALESCE($2, ubicacion_destino_id),
                            notas = COALESCE($3, notas)
                        WHERE id = $4 AND transferencia_id = $5
                    `, [
                        item.cantidad_recibida,
                        item.ubicacion_destino_id || null,
                        item.notas || null,
                        item.id,
                        id
                    ]);
                }
            }

            // Actualizar estado (el trigger procesará el stock)
            const query = `
                UPDATE transferencias_stock
                SET estado = 'recibido',
                    fecha_recepcion = NOW(),
                    usuario_recibe_id = $2,
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [id, usuarioId]);

            logger.info('[TransferenciasStockModel.recibir] Transferencia recibida', {
                transferencia_id: id,
                codigo: result.rows[0].codigo
            });

            return await this.obtenerPorId(id, organizacionId);
        });
    }

    /**
     * Cancelar transferencia
     */
    static async cancelar(id, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[TransferenciasStockModel.cancelar] Iniciando', {
                transferencia_id: id,
                usuario_id: usuarioId
            });

            // Verificar estado actual
            const transferenciaQuery = await db.query(
                `SELECT estado, sucursal_origen_id FROM transferencias_stock WHERE id = $1`,
                [id]
            );

            ErrorHelper.throwIfNotFound(transferenciaQuery.rows[0], 'Transferencia');

            const estadoActual = transferenciaQuery.rows[0].estado;

            if (estadoActual === 'recibido') {
                ErrorHelper.throwConflict('No se puede cancelar una transferencia ya recibida');
            }

            if (estadoActual === 'cancelado') {
                ErrorHelper.throwConflict('La transferencia ya está cancelada');
            }

            // Si estaba en enviado, devolver stock a origen usando función consolidada
            if (estadoActual === 'enviado') {
                const sucursalOrigenId = transferenciaQuery.rows[0].sucursal_origen_id;
                const items = await db.query(
                    `SELECT producto_id, cantidad_enviada FROM transferencias_stock_items WHERE transferencia_id = $1`,
                    [id]
                );

                for (const item of items.rows) {
                    // Devolver stock usando función consolidada (entrada_ajuste con cantidad positiva)
                    await db.query(`
                        SELECT registrar_movimiento_con_ubicacion(
                            $1, $2, 'entrada_ajuste', $3, $4,
                            NULL, NULL, NULL, NULL,
                            $5, $6, NULL, NULL, NULL, NULL, NULL
                        )
                    `, [
                        organizacionId,
                        item.producto_id,
                        item.cantidad_enviada,  // Positivo para devolver stock
                        sucursalOrigenId,
                        `Cancelación de transferencia ${id} - stock devuelto a origen`,
                        usuarioId
                    ]);
                }
            }

            // Actualizar estado
            const query = `
                UPDATE transferencias_stock
                SET estado = 'cancelado', actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [id]);

            logger.info('[TransferenciasStockModel.cancelar] Transferencia cancelada', {
                transferencia_id: id,
                estado_anterior: estadoActual
            });

            return result.rows[0];
        });
    }
}

module.exports = TransferenciasStockModel;
