/**
 * @module AjustesMasivosModel
 * @description Modelo para gestión de Ajustes Masivos de Inventario
 * Permite importar ajustes desde CSV, validarlos y aplicarlos en lote
 *
 * Flujo de estados:
 * pendiente → validado → aplicado | con_errores
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const MovimientosInventarioModel = require('./movimientos.model');
const logger = require('../../../utils/logger');

class AjustesMasivosModel {
    // ==================== CREAR ====================

    /**
     * Crear ajuste masivo desde array de items parseados del CSV
     * @param {Object} data - Datos del ajuste
     * @param {string} data.archivo_nombre - Nombre del archivo CSV
     * @param {Array} data.items - Items parseados del CSV
     * @param {number} usuarioId - ID del usuario que crea
     * @param {number} organizacionId - ID de la organización
     * @param {number} [sucursalId] - ID de la sucursal (opcional)
     * @returns {Promise<Object>} Ajuste masivo creado con items
     */
    static async crear(data, usuarioId, organizacionId, sucursalId = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // 1. Crear cabecera (folio se genera por trigger)
            const cabeceraQuery = `
                INSERT INTO ajustes_masivos (
                    organizacion_id, sucursal_id, archivo_nombre, usuario_id
                ) VALUES ($1, $2, $3, $4)
                RETURNING *
            `;

            const cabeceraResult = await db.query(cabeceraQuery, [
                organizacionId,
                sucursalId,
                data.archivo_nombre,
                usuarioId
            ]);

            const ajuste = cabeceraResult.rows[0];

            // 2. Insertar items
            const itemsInsertados = [];
            for (const item of data.items) {
                const itemQuery = `
                    INSERT INTO ajustes_masivos_items (
                        ajuste_masivo_id, fila_numero,
                        sku_csv, codigo_barras_csv, cantidad_csv, motivo_csv
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `;

                const itemResult = await db.query(itemQuery, [
                    ajuste.id,
                    item.fila_numero,
                    item.sku || null,
                    item.codigo_barras || null,
                    String(item.cantidad_ajuste),
                    item.motivo || null
                ]);

                itemsInsertados.push(itemResult.rows[0]);
            }

            logger.info('[AjustesMasivosModel.crear] Ajuste masivo creado', {
                ajuste_id: ajuste.id,
                folio: ajuste.folio,
                total_items: itemsInsertados.length
            });

            // 3. Obtener ajuste actualizado (con totales recalculados por trigger)
            // Pasamos db para reusar la misma conexión de la transacción
            return await this.buscarPorId(organizacionId, ajuste.id, db);
        });
    }

    // ==================== LISTAR ====================

    /**
     * Listar ajustes masivos con filtros
     * @param {Object} params - Parámetros de filtrado
     * @param {string} [params.estado] - Filtrar por estado
     * @param {string} [params.fecha_desde] - Fecha inicio (YYYY-MM-DD)
     * @param {string} [params.fecha_hasta] - Fecha fin (YYYY-MM-DD)
     * @param {string} [params.folio] - Búsqueda por folio
     * @param {number} [params.limit=20] - Límite de resultados
     * @param {number} [params.offset=0] - Offset para paginación
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} { ajustes, total, totales }
     */
    static async listar(params, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const conditions = ['am.organizacion_id = $1'];
            const values = [organizacionId];
            let paramIndex = 2;

            // Filtros
            if (params.estado) {
                conditions.push(`am.estado = $${paramIndex++}`);
                values.push(params.estado);
            }

            if (params.fecha_desde) {
                conditions.push(`am.creado_en >= $${paramIndex++}`);
                values.push(params.fecha_desde);
            }

            if (params.fecha_hasta) {
                conditions.push(`am.creado_en < ($${paramIndex++}::date + interval '1 day')`);
                values.push(params.fecha_hasta);
            }

            if (params.folio) {
                conditions.push(`am.folio ILIKE $${paramIndex++}`);
                values.push(`%${params.folio}%`);
            }

            const whereClause = conditions.join(' AND ');

            // Query principal
            const query = `
                SELECT
                    am.*,
                    u.nombre AS usuario_nombre
                FROM ajustes_masivos am
                LEFT JOIN usuarios u ON u.id = am.usuario_id
                WHERE ${whereClause}
                ORDER BY am.creado_en DESC
                LIMIT $${paramIndex++} OFFSET $${paramIndex++}
            `;

            const limit = params.limit || 20;
            const offset = params.offset || 0;
            values.push(limit, offset);

            const result = await db.query(query, values);

            // Contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM ajustes_masivos am
                WHERE ${whereClause}
            `;
            const countResult = await db.query(countQuery, values.slice(0, -2));

            // Totales por estado
            const totalesQuery = `
                SELECT
                    estado,
                    COUNT(*) as cantidad
                FROM ajustes_masivos
                WHERE organizacion_id = $1
                GROUP BY estado
            `;
            const totalesResult = await db.query(totalesQuery, [organizacionId]);

            const totales = {
                pendiente: 0,
                validado: 0,
                aplicado: 0,
                con_errores: 0
            };
            totalesResult.rows.forEach(row => {
                totales[row.estado] = parseInt(row.cantidad);
            });

            return {
                ajustes: result.rows,
                total: parseInt(countResult.rows[0].total),
                totales
            };
        });
    }

    // ==================== OBTENER POR ID ====================

    /**
     * Obtener ajuste masivo por ID con todos sus items
     * @param {number} organizacionId - ID de la organización
     * @param {number} id - ID del ajuste
     * @param {Object} [existingDb] - Conexión existente (para reusar en transacciones)
     * @returns {Promise<Object>} Ajuste con items
     */
    static async buscarPorId(organizacionId, id, existingDb = null) {
        const queryFn = async (db) => {
            // Cabecera con usuario
            const cabeceraQuery = `
                SELECT
                    am.*,
                    u.nombre AS usuario_nombre
                FROM ajustes_masivos am
                LEFT JOIN usuarios u ON u.id = am.usuario_id
                WHERE am.id = $1 AND am.organizacion_id = $2
            `;

            const cabeceraResult = await db.query(cabeceraQuery, [id, organizacionId]);

            if (cabeceraResult.rows.length === 0) {
                throw new Error('Ajuste masivo no encontrado');
            }

            const ajuste = cabeceraResult.rows[0];

            // Items con detalle
            const itemsQuery = `
                SELECT
                    ami.*,
                    p.nombre AS producto_nombre_actual,
                    p.stock_actual AS stock_producto_actual,
                    v.stock_actual AS stock_variante_actual
                FROM ajustes_masivos_items ami
                LEFT JOIN productos p ON p.id = ami.producto_id
                LEFT JOIN variantes_producto v ON v.id = ami.variante_id
                WHERE ami.ajuste_masivo_id = $1
                ORDER BY ami.fila_numero ASC
            `;

            const itemsResult = await db.query(itemsQuery, [id]);

            return {
                ...ajuste,
                items: itemsResult.rows
            };
        };

        // Si hay conexión existente (desde transacción), usarla directamente
        if (existingDb) {
            return await queryFn(existingDb);
        }

        // Si no, crear nuevo contexto RLS
        return await RLSContextManager.query(organizacionId, queryFn);
    }

    // ==================== VALIDAR ====================

    /**
     * Validar items del ajuste masivo
     * Resuelve SKU/código barras a producto_id, calcula stock_despues
     * @param {number} id - ID del ajuste
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Ajuste actualizado con items validados
     */
    static async validar(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // 1. Verificar estado
            const ajusteQuery = await db.query(
                `SELECT * FROM ajustes_masivos WHERE id = $1 AND organizacion_id = $2`,
                [id, organizacionId]
            );

            if (ajusteQuery.rows.length === 0) {
                throw new Error('Ajuste masivo no encontrado');
            }

            const ajuste = ajusteQuery.rows[0];

            if (ajuste.estado !== 'pendiente') {
                throw new Error(`Solo se pueden validar ajustes en estado pendiente. Estado actual: ${ajuste.estado}`);
            }

            // 2. Obtener items pendientes
            const itemsQuery = await db.query(
                `SELECT * FROM ajustes_masivos_items
                 WHERE ajuste_masivo_id = $1 AND estado = 'pendiente'
                 ORDER BY fila_numero`,
                [id]
            );

            let itemsValidados = 0;
            let itemsError = 0;

            // 3. Validar cada item
            for (const item of itemsQuery.rows) {
                try {
                    // Parsear cantidad
                    const cantidad = parseInt(item.cantidad_csv);
                    if (isNaN(cantidad) || cantidad === 0) {
                        await this._marcarItemError(db, item.id, 'cantidad_invalida',
                            `Cantidad inválida: "${item.cantidad_csv}". Debe ser un número entero distinto de 0.`);
                        itemsError++;
                        continue;
                    }

                    // Buscar producto
                    const productoQuery = await db.query(
                        `SELECT * FROM buscar_producto_por_codigo($1, $2, $3)`,
                        [organizacionId, item.sku_csv, item.codigo_barras_csv]
                    );

                    if (productoQuery.rows.length === 0) {
                        await this._marcarItemError(db, item.id, 'producto_no_encontrado',
                            `Producto no encontrado con SKU "${item.sku_csv || '-'}" o código de barras "${item.codigo_barras_csv || '-'}"`);
                        itemsError++;
                        continue;
                    }

                    const producto = productoQuery.rows[0];

                    // Calcular stock después
                    const stockDespues = producto.stock_actual + cantidad;

                    // Verificar stock no negativo (para salidas)
                    if (stockDespues < 0) {
                        await this._marcarItemError(db, item.id, 'stock_insuficiente',
                            `Stock insuficiente. Actual: ${producto.stock_actual}, ajuste: ${cantidad}, resultado: ${stockDespues}`);
                        itemsError++;
                        continue;
                    }

                    // Calcular valor del ajuste
                    const valorAjuste = cantidad * (producto.costo_unitario || 0);

                    // Actualizar item como válido
                    await db.query(`
                        UPDATE ajustes_masivos_items SET
                            producto_id = $1,
                            variante_id = $2,
                            producto_nombre = $3,
                            cantidad_ajuste = $4,
                            stock_antes = $5,
                            stock_despues = $6,
                            costo_unitario = $7,
                            valor_ajuste = $8,
                            estado = 'valido',
                            error_tipo = NULL,
                            error_mensaje = NULL
                        WHERE id = $9
                    `, [
                        producto.producto_id,
                        producto.variante_id,
                        producto.producto_nombre,
                        cantidad,
                        producto.stock_actual,
                        stockDespues,
                        producto.costo_unitario || 0,
                        valorAjuste,
                        item.id
                    ]);

                    itemsValidados++;
                } catch (error) {
                    logger.error('[AjustesMasivosModel.validar] Error validando item', {
                        item_id: item.id,
                        error: error.message
                    });

                    await this._marcarItemError(db, item.id, 'error_validacion', error.message);
                    itemsError++;
                }
            }

            // 4. Actualizar estado del ajuste
            const nuevoEstado = itemsError > 0 && itemsValidados === 0 ? 'pendiente' : 'validado';

            await db.query(`
                UPDATE ajustes_masivos SET
                    estado = $1,
                    validado_en = NOW()
                WHERE id = $2
            `, [nuevoEstado, id]);

            logger.info('[AjustesMasivosModel.validar] Validación completada', {
                ajuste_id: id,
                items_validados: itemsValidados,
                items_error: itemsError,
                nuevo_estado: nuevoEstado
            });

            return await this.buscarPorId(organizacionId, id, db);
        });
    }

    /**
     * Helper: Marcar item con error
     */
    static async _marcarItemError(db, itemId, errorTipo, errorMensaje) {
        await db.query(`
            UPDATE ajustes_masivos_items SET
                estado = 'error',
                error_tipo = $1,
                error_mensaje = $2
            WHERE id = $3
        `, [errorTipo, errorMensaje, itemId]);
    }

    // ==================== APLICAR ====================

    /**
     * Aplicar ajustes de inventario (crear movimientos)
     * @param {number} id - ID del ajuste
     * @param {number} usuarioId - ID del usuario que aplica
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} { ajuste, aplicados, errores }
     */
    static async aplicar(id, usuarioId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // 1. Verificar estado
            const ajusteQuery = await db.query(
                `SELECT * FROM ajustes_masivos WHERE id = $1 AND organizacion_id = $2`,
                [id, organizacionId]
            );

            if (ajusteQuery.rows.length === 0) {
                throw new Error('Ajuste masivo no encontrado');
            }

            const ajuste = ajusteQuery.rows[0];

            if (ajuste.estado !== 'validado') {
                throw new Error(`Solo se pueden aplicar ajustes en estado validado. Estado actual: ${ajuste.estado}`);
            }

            // 2. Obtener items válidos
            const itemsQuery = await db.query(
                `SELECT * FROM ajustes_masivos_items
                 WHERE ajuste_masivo_id = $1 AND estado = 'valido'
                 ORDER BY fila_numero`,
                [id]
            );

            const aplicados = [];
            const errores = [];

            // 3. Aplicar cada item
            for (const item of itemsQuery.rows) {
                try {
                    // Determinar tipo de movimiento
                    const tipoMovimiento = item.cantidad_ajuste > 0
                        ? 'entrada_ajuste'
                        : 'salida_ajuste';

                    // Registrar movimiento de inventario
                    const movimientoData = {
                        producto_id: item.producto_id,
                        tipo_movimiento: tipoMovimiento,
                        cantidad: item.cantidad_ajuste,
                        costo_unitario: item.costo_unitario || 0,
                        usuario_id: usuarioId,
                        referencia: `Ajuste masivo: ${ajuste.folio}`,
                        motivo: item.motivo_csv || 'Ajuste masivo CSV',
                        sucursal_id: ajuste.sucursal_id
                    };

                    // Usar MovimientosInventarioModel directamente dentro de la transacción
                    // Para evitar transacción anidada, hacemos el insert manual
                    const stockActual = await this._obtenerStockActual(db, item.producto_id, item.variante_id);
                    const stockDespues = stockActual + item.cantidad_ajuste;

                    // Validar stock no negativo
                    if (stockDespues < 0) {
                        throw new Error(`Stock insuficiente. Actual: ${stockActual}, ajuste: ${item.cantidad_ajuste}`);
                    }

                    // Insertar movimiento
                    const movimientoResult = await db.query(`
                        INSERT INTO movimientos_inventario (
                            organizacion_id, sucursal_id, producto_id,
                            tipo_movimiento, cantidad,
                            stock_antes, stock_despues,
                            costo_unitario, valor_total,
                            usuario_id, referencia, motivo
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                        RETURNING id
                    `, [
                        organizacionId,
                        ajuste.sucursal_id,
                        item.producto_id,
                        tipoMovimiento,
                        item.cantidad_ajuste,
                        stockActual,
                        stockDespues,
                        item.costo_unitario || 0,
                        Math.abs(item.cantidad_ajuste) * (item.costo_unitario || 0),
                        usuarioId,
                        `Ajuste masivo: ${ajuste.folio}`,
                        item.motivo_csv || 'Ajuste masivo CSV'
                    ]);

                    // Actualizar stock del producto o variante
                    if (item.variante_id) {
                        await db.query(`
                            UPDATE variantes_producto SET
                                stock_actual = $1, actualizado_en = NOW()
                            WHERE id = $2
                        `, [stockDespues, item.variante_id]);
                    } else {
                        await db.query(`
                            UPDATE productos SET
                                stock_actual = $1, actualizado_en = NOW()
                            WHERE id = $2
                        `, [stockDespues, item.producto_id]);
                    }

                    // Marcar item como aplicado
                    await db.query(`
                        UPDATE ajustes_masivos_items SET
                            estado = 'aplicado',
                            movimiento_id = $1,
                            aplicado_en = NOW()
                        WHERE id = $2
                    `, [movimientoResult.rows[0].id, item.id]);

                    aplicados.push({
                        item_id: item.id,
                        fila: item.fila_numero,
                        producto: item.producto_nombre,
                        cantidad: item.cantidad_ajuste,
                        movimiento_id: movimientoResult.rows[0].id
                    });

                } catch (error) {
                    logger.error('[AjustesMasivosModel.aplicar] Error aplicando item', {
                        item_id: item.id,
                        error: error.message
                    });

                    // Marcar item con error
                    await db.query(`
                        UPDATE ajustes_masivos_items SET
                            estado = 'error',
                            error_tipo = 'error_aplicacion',
                            error_mensaje = $1
                        WHERE id = $2
                    `, [error.message, item.id]);

                    errores.push({
                        item_id: item.id,
                        fila: item.fila_numero,
                        producto: item.producto_nombre,
                        error: error.message
                    });
                }
            }

            // 4. Actualizar estado del ajuste
            const nuevoEstado = errores.length > 0 ? 'con_errores' : 'aplicado';

            await db.query(`
                UPDATE ajustes_masivos SET
                    estado = $1,
                    aplicado_en = NOW()
                WHERE id = $2
            `, [nuevoEstado, id]);

            logger.info('[AjustesMasivosModel.aplicar] Aplicación completada', {
                ajuste_id: id,
                folio: ajuste.folio,
                aplicados: aplicados.length,
                errores: errores.length,
                nuevo_estado: nuevoEstado
            });

            return {
                ajuste: await this.buscarPorId(organizacionId, id, db),
                aplicados,
                errores
            };
        });
    }

    /**
     * Helper: Obtener stock actual de producto o variante
     */
    static async _obtenerStockActual(db, productoId, varianteId) {
        if (varianteId) {
            const result = await db.query(
                `SELECT stock_actual FROM variantes_producto WHERE id = $1`,
                [varianteId]
            );
            return result.rows[0]?.stock_actual || 0;
        } else {
            const result = await db.query(
                `SELECT stock_actual FROM productos WHERE id = $1`,
                [productoId]
            );
            return result.rows[0]?.stock_actual || 0;
        }
    }

    // ==================== CANCELAR ====================

    /**
     * Cancelar/eliminar ajuste masivo
     * Solo permitido en estados pendiente o validado
     * @param {number} id - ID del ajuste
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<boolean>} true si se eliminó
     */
    static async cancelar(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar estado
            const ajusteQuery = await db.query(
                `SELECT * FROM ajustes_masivos WHERE id = $1 AND organizacion_id = $2`,
                [id, organizacionId]
            );

            if (ajusteQuery.rows.length === 0) {
                throw new Error('Ajuste masivo no encontrado');
            }

            const ajuste = ajusteQuery.rows[0];

            if (ajuste.estado === 'aplicado' || ajuste.estado === 'con_errores') {
                throw new Error(`No se puede cancelar un ajuste que ya fue aplicado. Estado actual: ${ajuste.estado}`);
            }

            // Eliminar (CASCADE elimina items)
            await db.query(
                `DELETE FROM ajustes_masivos WHERE id = $1`,
                [id]
            );

            logger.info('[AjustesMasivosModel.cancelar] Ajuste masivo cancelado', {
                ajuste_id: id,
                folio: ajuste.folio
            });

            return true;
        });
    }
}

module.exports = AjustesMasivosModel;
