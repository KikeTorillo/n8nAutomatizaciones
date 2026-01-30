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
const { ErrorHelper } = require('../../../utils/helpers');

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
                        sku_csv, codigo_barras_csv, cantidad_csv, motivo_csv, ubicacion_codigo_csv
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING *
                `;

                const itemResult = await db.query(itemQuery, [
                    ajuste.id,
                    item.fila_numero,
                    item.sku || null,
                    item.codigo_barras || null,
                    String(item.cantidad_ajuste),
                    item.motivo || null,
                    item.ubicacion_codigo || null
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

            ErrorHelper.throwIfNotFound(cabeceraResult.rows[0], 'Ajuste masivo');

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

            ErrorHelper.throwIfNotFound(ajusteQuery.rows[0], 'Ajuste masivo');

            const ajuste = ajusteQuery.rows[0];

            if (ajuste.estado !== 'pendiente') {
                ErrorHelper.throwConflict(`Solo se pueden validar ajustes en estado pendiente. Estado actual: ${ajuste.estado}`);
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

                    // Resolver ubicación si se proporcionó
                    let ubicacionId = null;
                    if (item.ubicacion_codigo_csv) {
                        const ubicacionQuery = await db.query(`
                            SELECT id FROM ubicaciones_almacen
                            WHERE codigo = $1
                              AND sucursal_id = $2
                              AND activo = true
                        `, [item.ubicacion_codigo_csv, ajuste.sucursal_id]);

                        if (ubicacionQuery.rows.length === 0) {
                            await this._marcarItemError(db, item.id, 'ubicacion_no_encontrada',
                                `Ubicación no encontrada: "${item.ubicacion_codigo_csv}"`);
                            itemsError++;
                            continue;
                        }
                        ubicacionId = ubicacionQuery.rows[0].id;
                    }

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
                            ubicacion_id = $3,
                            producto_nombre = $4,
                            cantidad_ajuste = $5,
                            stock_antes = $6,
                            stock_despues = $7,
                            costo_unitario = $8,
                            valor_ajuste = $9,
                            estado = 'valido',
                            error_tipo = NULL,
                            error_mensaje = NULL
                        WHERE id = $10
                    `, [
                        producto.producto_id,
                        producto.variante_id,
                        ubicacionId,
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

            ErrorHelper.throwIfNotFound(ajusteQuery.rows[0], 'Ajuste masivo');

            const ajuste = ajusteQuery.rows[0];

            if (ajuste.estado !== 'validado') {
                ErrorHelper.throwConflict(`Solo se pueden aplicar ajustes en estado validado. Estado actual: ${ajuste.estado}`);
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
            // Ene 2026: Refactorizado para usar registrar_movimiento_con_ubicacion()
            for (const item of itemsQuery.rows) {
                try {
                    // Determinar tipo de movimiento
                    const tipoMovimiento = item.cantidad_ajuste > 0
                        ? 'entrada_ajuste'
                        : 'salida_ajuste';

                    // Usar función consolidada para registrar movimiento
                    const movimientoResult = await db.query(`
                        SELECT registrar_movimiento_con_ubicacion(
                            $1,  -- organizacion_id
                            $2,  -- producto_id
                            $3,  -- tipo_movimiento
                            $4,  -- cantidad
                            $5,  -- sucursal_id
                            $6,  -- ubicacion_id (del item validado)
                            NULL, -- lote
                            NULL, -- fecha_vencimiento
                            $7,  -- referencia
                            $8,  -- motivo
                            $9,  -- usuario_id
                            $10, -- costo_unitario
                            NULL, -- proveedor_id
                            NULL, -- venta_pos_id
                            NULL, -- cita_id
                            $11  -- variante_id
                        ) as movimiento_id
                    `, [
                        organizacionId,
                        item.producto_id,
                        tipoMovimiento,
                        item.cantidad_ajuste,
                        ajuste.sucursal_id,
                        item.ubicacion_id || null,
                        `Ajuste masivo: ${ajuste.folio}`,
                        item.motivo_csv || 'Ajuste masivo CSV',
                        usuarioId,
                        item.costo_unitario || 0,
                        item.variante_id || null
                    ]);

                    // Marcar item como aplicado
                    await db.query(`
                        UPDATE ajustes_masivos_items SET
                            estado = 'aplicado',
                            movimiento_id = $1,
                            aplicado_en = NOW()
                        WHERE id = $2
                    `, [movimientoResult.rows[0].movimiento_id, item.id]);

                    aplicados.push({
                        item_id: item.id,
                        fila: item.fila_numero,
                        producto: item.producto_nombre,
                        cantidad: item.cantidad_ajuste,
                        movimiento_id: movimientoResult.rows[0].movimiento_id
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

            ErrorHelper.throwIfNotFound(ajusteQuery.rows[0], 'Ajuste masivo');

            const ajuste = ajusteQuery.rows[0];

            if (ajuste.estado === 'aplicado' || ajuste.estado === 'con_errores') {
                ErrorHelper.throwConflict(`No se puede cancelar un ajuste que ya fue aplicado. Estado actual: ${ajuste.estado}`);
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
