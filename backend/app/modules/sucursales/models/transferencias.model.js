const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

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
                            transferencia_id, producto_id, cantidad_enviada, notas
                        ) VALUES ($1, $2, $3, $4)
                    `, [
                        transferencia.id,
                        item.producto_id,
                        item.cantidad_enviada,
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

            // Items
            const itemsQuery = `
                SELECT
                    ti.*,
                    p.nombre AS producto_nombre,
                    p.sku AS producto_sku
                FROM transferencias_stock_items ti
                JOIN productos p ON ti.producto_id = p.id
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

            if (transferenciaQuery.rows.length === 0) {
                throw new Error('Transferencia no encontrada');
            }

            if (transferenciaQuery.rows[0].estado !== 'borrador') {
                throw new Error('Solo se pueden modificar transferencias en borrador');
            }

            const query = `
                INSERT INTO transferencias_stock_items (
                    transferencia_id, producto_id, cantidad_enviada, notas
                ) VALUES ($1, $2, $3, $4)
                ON CONFLICT (transferencia_id, producto_id)
                DO UPDATE SET
                    cantidad_enviada = EXCLUDED.cantidad_enviada,
                    notas = EXCLUDED.notas
                RETURNING *
            `;

            const result = await db.query(query, [
                transferenciaId,
                data.producto_id,
                data.cantidad_enviada,
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

            if (transferenciaQuery.rows.length === 0) {
                throw new Error('Transferencia no encontrada');
            }

            if (transferenciaQuery.rows[0].estado !== 'borrador') {
                throw new Error('Solo se pueden modificar transferencias en borrador');
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

            if (transferenciaQuery.rows.length === 0) {
                throw new Error('Transferencia no encontrada');
            }

            if (transferenciaQuery.rows[0].estado !== 'borrador') {
                throw new Error('Solo se pueden enviar transferencias en borrador');
            }

            // Verificar que tiene items
            const itemsQuery = await db.query(
                `SELECT COUNT(*) as total FROM transferencias_stock_items WHERE transferencia_id = $1`,
                [id]
            );

            if (parseInt(itemsQuery.rows[0].total) === 0) {
                throw new Error('La transferencia no tiene productos');
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

            if (transferenciaQuery.rows.length === 0) {
                throw new Error('Transferencia no encontrada');
            }

            const { estado, sucursal_destino_id } = transferenciaQuery.rows[0];

            if (estado !== 'enviado') {
                throw new Error('Solo se pueden recibir transferencias en estado enviado');
            }

            // Verificar que el usuario pertenece a la sucursal destino
            const usuarioSucursalQuery = await db.query(
                `SELECT 1 FROM usuarios_sucursales
                 WHERE usuario_id = $1 AND sucursal_id = $2 AND activo = true`,
                [usuarioId, sucursal_destino_id]
            );

            if (usuarioSucursalQuery.rows.length === 0) {
                throw new Error('No tienes permisos para recibir en esta sucursal');
            }

            // Si hay cantidades recibidas diferentes, actualizar items
            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    await db.query(`
                        UPDATE transferencias_stock_items
                        SET cantidad_recibida = $1, notas = COALESCE($2, notas)
                        WHERE id = $3 AND transferencia_id = $4
                    `, [
                        item.cantidad_recibida,
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

            if (transferenciaQuery.rows.length === 0) {
                throw new Error('Transferencia no encontrada');
            }

            const estadoActual = transferenciaQuery.rows[0].estado;

            if (estadoActual === 'recibido') {
                throw new Error('No se puede cancelar una transferencia ya recibida');
            }

            if (estadoActual === 'cancelado') {
                throw new Error('La transferencia ya está cancelada');
            }

            // Si estaba en enviado, devolver stock a origen
            if (estadoActual === 'enviado') {
                const sucursalOrigenId = transferenciaQuery.rows[0].sucursal_origen_id;
                const items = await db.query(
                    `SELECT producto_id, cantidad_enviada FROM transferencias_stock_items WHERE transferencia_id = $1`,
                    [id]
                );

                for (const item of items.rows) {
                    await db.query(`
                        UPDATE stock_sucursales
                        SET cantidad = cantidad + $1, actualizado_en = NOW()
                        WHERE producto_id = $2 AND sucursal_id = $3
                    `, [item.cantidad_enviada, item.producto_id, sucursalOrigenId]);
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
