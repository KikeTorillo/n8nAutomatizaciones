const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const MovimientosInventarioModel = require('./movimientos.model');

/**
 * Model para gestión de Conteos de Inventario (Conteo Físico)
 * Ciclo completo: borrador → en_proceso → completado → ajustado | cancelado
 *
 * Tipos de conteo:
 * - total: Todos los productos de la organización
 * - por_categoria: Productos de una categoría específica
 * - por_ubicacion: Productos de una ubicación WMS
 * - ciclico: Productos seleccionados manualmente
 * - aleatorio: Muestra aleatoria de productos
 */
class ConteosModel {

    // ========================================================================
    // CRUD BÁSICO
    // ========================================================================

    /**
     * Crear nuevo conteo de inventario (estado: borrador)
     * @param {Object} data - Datos del conteo
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Conteo creado con items
     */
    static async crear(data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ConteosModel.crear] Iniciando', {
                organizacion_id: organizacionId,
                tipo_conteo: data.tipo_conteo,
                sucursal_id: data.sucursal_id
            });

            // Crear conteo (el trigger genera el folio automáticamente)
            const query = `
                INSERT INTO conteos_inventario (
                    organizacion_id,
                    sucursal_id,
                    tipo_conteo,
                    filtros,
                    fecha_programada,
                    usuario_creador_id,
                    usuario_contador_id,
                    usuario_supervisor_id,
                    notas
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.sucursal_id || null,
                data.tipo_conteo,
                JSON.stringify(data.filtros || {}),
                data.fecha_programada || null,
                data.usuario_creador_id,
                data.usuario_contador_id || null,
                data.usuario_supervisor_id || null,
                data.notas || null
            ];

            const result = await db.query(query, values);
            const conteo = result.rows[0];

            logger.info('[ConteosModel.crear] Conteo creado', {
                conteo_id: conteo.id,
                folio: conteo.folio,
                tipo_conteo: conteo.tipo_conteo
            });

            return conteo;
        });
    }

    /**
     * Obtener conteo por ID con items
     * @param {number} id - ID del conteo
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Conteo con items y usuarios relacionados
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.withBypass(async (db) => {
            // Obtener conteo con datos de usuarios
            const conteoQuery = `
                SELECT
                    c.*,
                    uc.nombre AS usuario_creador_nombre,
                    uco.nombre AS usuario_contador_nombre,
                    us.nombre AS usuario_supervisor_nombre,
                    s.nombre AS sucursal_nombre
                FROM conteos_inventario c
                LEFT JOIN usuarios uc ON uc.id = c.usuario_creador_id
                LEFT JOIN usuarios uco ON uco.id = c.usuario_contador_id
                LEFT JOIN usuarios us ON us.id = c.usuario_supervisor_id
                LEFT JOIN sucursales s ON s.id = c.sucursal_id
                WHERE c.id = $1 AND c.organizacion_id = $2
            `;

            const conteoResult = await db.query(conteoQuery, [id, organizacionId]);

            if (conteoResult.rows.length === 0) {
                return null;
            }

            const conteo = conteoResult.rows[0];

            // Obtener items del conteo
            const itemsQuery = `
                SELECT
                    ci.id, ci.conteo_id, ci.producto_id, ci.variante_id,
                    ci.cantidad_sistema, ci.cantidad_contada, ci.diferencia,
                    ci.costo_unitario, ci.valor_diferencia, ci.estado,
                    ci.contado_por_id, ci.contado_en, ci.notas, ci.creado_en,
                    p.nombre AS producto_nombre,
                    p.sku AS producto_sku,
                    p.codigo_barras,
                    p.stock_actual AS stock_actual_sistema,
                    v.nombre_variante AS variante_nombre,
                    uc.nombre AS contado_por_nombre
                FROM conteos_inventario_items ci
                LEFT JOIN productos p ON p.id = ci.producto_id
                LEFT JOIN variantes_producto v ON v.id = ci.variante_id
                LEFT JOIN usuarios uc ON uc.id = ci.contado_por_id
                WHERE ci.conteo_id = $1
                ORDER BY ci.estado ASC, p.nombre ASC
            `;

            const itemsResult = await db.query(itemsQuery, [id]);

            // Calcular resumen
            const resumen = {
                total: itemsResult.rows.length,
                pendientes: itemsResult.rows.filter(i => i.estado === 'pendiente').length,
                contados: itemsResult.rows.filter(i => i.estado === 'contado').length,
                con_diferencia: itemsResult.rows.filter(i => i.diferencia !== 0 && i.estado === 'contado').length,
                sin_diferencia: itemsResult.rows.filter(i => i.diferencia === 0 && i.estado === 'contado').length
            };

            return {
                ...conteo,
                items: itemsResult.rows,
                resumen
            };
        });
    }

    /**
     * Listar conteos con filtros
     * @param {Object} filtros - Filtros de búsqueda
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Lista de conteos con totales
     */
    static async listar(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['c.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            // Filtro por sucursal
            if (filtros.sucursal_id) {
                whereConditions.push(`c.sucursal_id = $${paramCounter}`);
                values.push(filtros.sucursal_id);
                paramCounter++;
            }

            // Filtro por estado
            if (filtros.estado) {
                whereConditions.push(`c.estado = $${paramCounter}`);
                values.push(filtros.estado);
                paramCounter++;
            }

            // Filtro por tipo de conteo
            if (filtros.tipo_conteo) {
                whereConditions.push(`c.tipo_conteo = $${paramCounter}`);
                values.push(filtros.tipo_conteo);
                paramCounter++;
            }

            // Filtro por fecha programada desde
            if (filtros.fecha_desde) {
                whereConditions.push(`c.fecha_programada >= $${paramCounter}`);
                values.push(filtros.fecha_desde);
                paramCounter++;
            }

            // Filtro por fecha programada hasta
            if (filtros.fecha_hasta) {
                whereConditions.push(`c.fecha_programada <= $${paramCounter}`);
                values.push(filtros.fecha_hasta);
                paramCounter++;
            }

            // Búsqueda por folio
            if (filtros.folio) {
                whereConditions.push(`c.folio ILIKE $${paramCounter}`);
                values.push(`%${filtros.folio}%`);
                paramCounter++;
            }

            const query = `
                SELECT
                    c.*,
                    uc.nombre AS usuario_creador_nombre,
                    uco.nombre AS usuario_contador_nombre,
                    s.nombre AS sucursal_nombre
                FROM conteos_inventario c
                LEFT JOIN usuarios uc ON uc.id = c.usuario_creador_id
                LEFT JOIN usuarios uco ON uco.id = c.usuario_contador_id
                LEFT JOIN sucursales s ON s.id = c.sucursal_id
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY c.creado_en DESC
                LIMIT $${paramCounter}
                OFFSET $${paramCounter + 1}
            `;

            values.push(filtros.limit || 50);
            values.push(filtros.offset || 0);

            const result = await db.query(query, values);

            // Obtener totales
            const countQuery = `
                SELECT
                    COUNT(*) as cantidad,
                    SUM(CASE WHEN estado = 'borrador' THEN 1 ELSE 0 END) as borradores,
                    SUM(CASE WHEN estado = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso,
                    SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completados,
                    SUM(CASE WHEN estado = 'ajustado' THEN 1 ELSE 0 END) as ajustados,
                    SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) as cancelados
                FROM conteos_inventario c
                WHERE ${whereConditions.slice(0, -2).join(' AND ') || whereConditions.join(' AND ')}
            `;

            const countValues = values.slice(0, paramCounter - 1);
            const countResult = await db.query(countQuery, countValues);

            return {
                conteos: result.rows,
                totales: countResult.rows[0],
                limit: filtros.limit || 50,
                offset: filtros.offset || 0
            };
        });
    }

    // ========================================================================
    // GESTIÓN DE ESTADOS
    // ========================================================================

    /**
     * Iniciar conteo (genera items según tipo y filtros)
     * Estado: borrador → en_proceso
     * @param {number} id - ID del conteo
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Conteo con items generados
     */
    static async iniciar(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ConteosModel.iniciar] Iniciando conteo', { conteo_id: id });

            // Verificar estado actual
            const conteoQuery = await db.query(
                `SELECT id, estado, tipo_conteo, filtros, sucursal_id, folio
                 FROM conteos_inventario WHERE id = $1`,
                [id]
            );

            if (conteoQuery.rows.length === 0) {
                throw new Error('Conteo no encontrado');
            }

            const conteo = conteoQuery.rows[0];

            if (conteo.estado !== 'borrador') {
                throw new Error(`Solo se pueden iniciar conteos en estado borrador. Estado actual: ${conteo.estado}`);
            }

            // Generar items según tipo de conteo
            await this._generarItemsConteo(db, conteo, organizacionId);

            // Actualizar estado
            const updateQuery = `
                UPDATE conteos_inventario
                SET estado = 'en_proceso',
                    fecha_inicio = NOW(),
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            const updateResult = await db.query(updateQuery, [id]);

            // Recalcular totales
            await db.query(
                `SELECT actualizar_totales_conteo($1)`,
                [id]
            );

            logger.info('[ConteosModel.iniciar] Conteo iniciado', {
                conteo_id: id,
                folio: conteo.folio
            });

            // Retornar conteo completo
            return await this.obtenerPorId(id, organizacionId);
        });
    }

    /**
     * Genera items del conteo según tipo y filtros
     * @private
     */
    static async _generarItemsConteo(db, conteo, organizacionId) {
        const filtros = typeof conteo.filtros === 'string'
            ? JSON.parse(conteo.filtros)
            : conteo.filtros || {};

        let whereConditions = ['p.organizacion_id = $1', 'p.activo = true'];
        let values = [organizacionId];
        let paramCounter = 2;

        // Filtrar por sucursal si aplica
        if (conteo.sucursal_id) {
            whereConditions.push(`(p.sucursal_id = $${paramCounter} OR p.sucursal_id IS NULL)`);
            values.push(conteo.sucursal_id);
            paramCounter++;
        }

        // Aplicar filtros según tipo de conteo
        switch (conteo.tipo_conteo) {
            case 'por_categoria':
                if (filtros.categoria_id) {
                    whereConditions.push(`p.categoria_id = $${paramCounter}`);
                    values.push(filtros.categoria_id);
                    paramCounter++;
                }
                break;

            case 'por_ubicacion':
                if (filtros.ubicacion_id) {
                    whereConditions.push(`p.id IN (SELECT producto_id FROM stock_ubicaciones WHERE ubicacion_id = $${paramCounter})`);
                    values.push(filtros.ubicacion_id);
                    paramCounter++;
                }
                break;

            case 'ciclico':
                // Productos seleccionados manualmente
                if (filtros.producto_ids && filtros.producto_ids.length > 0) {
                    whereConditions.push(`p.id = ANY($${paramCounter}::int[])`);
                    values.push(filtros.producto_ids);
                    paramCounter++;
                } else {
                    throw new Error('Para conteo cíclico debe seleccionar productos');
                }
                break;

            case 'aleatorio':
                // Se manejará con ORDER BY RANDOM() y LIMIT
                break;

            case 'total':
            default:
                // Sin filtros adicionales - todos los productos
                break;
        }

        // Solo productos con stock o con seguimiento
        if (filtros.solo_con_stock) {
            whereConditions.push('p.stock_actual > 0');
        }

        // Query para obtener productos
        let orderBy = 'ORDER BY p.nombre ASC';
        let limit = '';

        if (conteo.tipo_conteo === 'aleatorio') {
            orderBy = 'ORDER BY RANDOM()';
            limit = `LIMIT ${filtros.cantidad_muestra || 50}`;
        }

        const productosQuery = `
            SELECT
                p.id AS producto_id,
                p.stock_actual AS cantidad_sistema,
                COALESCE(p.precio_compra, 0) AS costo_unitario,
                NULL::integer AS ubicacion_id,
                p.nombre
            FROM productos p
            WHERE ${whereConditions.join(' AND ')}
            ${orderBy}
            ${limit}
        `;

        const productosResult = await db.query(productosQuery, values);

        if (productosResult.rows.length === 0) {
            throw new Error('No se encontraron productos para el conteo con los filtros especificados');
        }

        // Insertar items
        for (const producto of productosResult.rows) {
            await db.query(
                `INSERT INTO conteos_inventario_items (
                    conteo_id,
                    producto_id,
                    ubicacion_id,
                    cantidad_sistema,
                    costo_unitario,
                    estado
                ) VALUES ($1, $2, $3, $4, $5, 'pendiente')`,
                [
                    conteo.id,
                    producto.producto_id,
                    producto.ubicacion_id || null,
                    producto.cantidad_sistema,
                    producto.costo_unitario
                ]
            );
        }

        // Si hay variantes, agregar items por variante también
        const variantesQuery = `
            SELECT
                vp.id AS variante_id,
                vp.producto_id,
                vp.stock_actual AS cantidad_sistema,
                NULL::integer AS ubicacion_id,
                COALESCE(vp.precio_compra, p.precio_compra, 0) AS costo_unitario
            FROM variantes_producto vp
            JOIN productos p ON p.id = vp.producto_id
            WHERE p.organizacion_id = $1
              AND p.activo = true
              AND vp.activo = true
              AND p.tiene_variantes = true
        `;

        const variantesResult = await db.query(variantesQuery, [organizacionId]);

        for (const variante of variantesResult.rows) {
            await db.query(
                `INSERT INTO conteos_inventario_items (
                    conteo_id,
                    producto_id,
                    variante_id,
                    ubicacion_id,
                    cantidad_sistema,
                    costo_unitario,
                    estado
                ) VALUES ($1, $2, $3, $4, $5, $6, 'pendiente')
                ON CONFLICT DO NOTHING`,
                [
                    conteo.id,
                    variante.producto_id,
                    variante.variante_id,
                    variante.ubicacion_id || null,
                    variante.cantidad_sistema,
                    variante.costo_unitario
                ]
            );
        }

        logger.info('[ConteosModel._generarItemsConteo] Items generados', {
            conteo_id: conteo.id,
            productos: productosResult.rows.length,
            variantes: variantesResult.rows.length
        });
    }

    /**
     * Registrar cantidad contada para un item
     * @param {number} itemId - ID del item
     * @param {Object} data - Datos del conteo
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Item actualizado
     */
    static async registrarConteo(itemId, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ConteosModel.registrarConteo] Registrando', {
                item_id: itemId,
                cantidad_contada: data.cantidad_contada
            });

            // Verificar que el conteo está en proceso
            const itemQuery = await db.query(
                `SELECT ci.*, c.estado AS conteo_estado, c.id AS conteo_id
                 FROM conteos_inventario_items ci
                 JOIN conteos_inventario c ON c.id = ci.conteo_id
                 WHERE ci.id = $1`,
                [itemId]
            );

            if (itemQuery.rows.length === 0) {
                throw new Error('Item no encontrado');
            }

            const item = itemQuery.rows[0];

            if (item.conteo_estado !== 'en_proceso') {
                throw new Error('Solo se puede registrar conteos cuando el conteo está en proceso');
            }

            // Actualizar item
            const updateQuery = `
                UPDATE conteos_inventario_items
                SET cantidad_contada = $1,
                    contado_por_id = $2,
                    contado_en = NOW(),
                    estado = 'contado',
                    notas = COALESCE($3, notas)
                WHERE id = $4
                RETURNING *
            `;

            const updateResult = await db.query(updateQuery, [
                data.cantidad_contada,
                data.usuario_id,
                data.notas || null,
                itemId
            ]);

            // Recalcular totales del conteo
            await db.query(
                `SELECT actualizar_totales_conteo($1)`,
                [item.conteo_id]
            );

            logger.info('[ConteosModel.registrarConteo] Conteo registrado', {
                item_id: itemId,
                diferencia: data.cantidad_contada - item.cantidad_sistema
            });

            return updateResult.rows[0];
        });
    }

    /**
     * Completar conteo (validar que todos los items estén contados)
     * Estado: en_proceso → completado
     * @param {number} id - ID del conteo
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Conteo completado
     */
    static async completar(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ConteosModel.completar] Completando conteo', { conteo_id: id });

            // Verificar estado y items pendientes
            const conteoQuery = await db.query(
                `SELECT c.*,
                        (SELECT COUNT(*) FROM conteos_inventario_items WHERE conteo_id = c.id AND estado = 'pendiente') AS pendientes
                 FROM conteos_inventario c
                 WHERE c.id = $1`,
                [id]
            );

            if (conteoQuery.rows.length === 0) {
                throw new Error('Conteo no encontrado');
            }

            const conteo = conteoQuery.rows[0];

            if (conteo.estado !== 'en_proceso') {
                throw new Error(`Solo se pueden completar conteos en proceso. Estado actual: ${conteo.estado}`);
            }

            if (parseInt(conteo.pendientes) > 0) {
                throw new Error(`Hay ${conteo.pendientes} items pendientes de contar`);
            }

            // Actualizar estado
            const updateQuery = `
                UPDATE conteos_inventario
                SET estado = 'completado',
                    fecha_fin = NOW(),
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            await db.query(updateQuery, [id]);

            logger.info('[ConteosModel.completar] Conteo completado', {
                conteo_id: id,
                folio: conteo.folio
            });

            return await this.obtenerPorId(id, organizacionId);
        });
    }

    /**
     * Aplicar ajustes de inventario basados en el conteo
     * Estado: completado → ajustado
     * Crea movimientos de ajuste para cada diferencia
     * @param {number} id - ID del conteo
     * @param {number} usuarioId - Usuario que aplica los ajustes
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Conteo con ajustes aplicados
     */
    static async aplicarAjustes(id, usuarioId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ConteosModel.aplicarAjustes] Aplicando ajustes', { conteo_id: id });

            // Verificar estado
            const conteoQuery = await db.query(
                `SELECT c.*, c.folio
                 FROM conteos_inventario c
                 WHERE c.id = $1`,
                [id]
            );

            if (conteoQuery.rows.length === 0) {
                throw new Error('Conteo no encontrado');
            }

            const conteo = conteoQuery.rows[0];

            if (conteo.estado !== 'completado') {
                throw new Error(`Solo se pueden aplicar ajustes a conteos completados. Estado actual: ${conteo.estado}`);
            }

            // Obtener items con diferencia
            const itemsQuery = await db.query(
                `SELECT ci.*, p.nombre AS producto_nombre
                 FROM conteos_inventario_items ci
                 JOIN productos p ON p.id = ci.producto_id
                 WHERE ci.conteo_id = $1 AND ci.diferencia != 0`,
                [id]
            );

            const ajustesRealizados = [];

            // Crear movimiento de ajuste para cada item con diferencia
            for (const item of itemsQuery.rows) {
                const tipoMovimiento = item.diferencia > 0
                    ? 'entrada_ajuste'
                    : 'salida_ajuste';

                // Determinar el costo unitario para el movimiento
                const costoUnitario = item.costo_unitario || 0;

                // Registrar movimiento de inventario
                const movimiento = await db.query(
                    `INSERT INTO movimientos_inventario (
                        organizacion_id,
                        producto_id,
                        tipo_movimiento,
                        cantidad,
                        costo_unitario,
                        valor_total,
                        stock_antes,
                        stock_despues,
                        usuario_id,
                        referencia,
                        motivo
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING id`,
                    [
                        organizacionId,
                        item.producto_id,
                        tipoMovimiento,
                        item.diferencia,
                        costoUnitario,
                        Math.abs(item.diferencia) * costoUnitario,
                        item.cantidad_sistema,
                        item.cantidad_contada,
                        usuarioId,
                        `Conteo: ${conteo.folio}`,
                        `Ajuste por conteo físico. Diferencia: ${item.diferencia}`
                    ]
                );

                // Actualizar stock del producto
                if (item.variante_id) {
                    // Actualizar variante
                    await db.query(
                        `UPDATE variantes_producto
                         SET stock_actual = $1, actualizado_en = NOW()
                         WHERE id = $2`,
                        [item.cantidad_contada, item.variante_id]
                    );
                } else {
                    // Actualizar producto
                    await db.query(
                        `UPDATE productos
                         SET stock_actual = $1, actualizado_en = NOW()
                         WHERE id = $2`,
                        [item.cantidad_contada, item.producto_id]
                    );
                }

                // Vincular movimiento al item
                await db.query(
                    `UPDATE conteos_inventario_items
                     SET movimiento_id = $1, estado = 'ajustado'
                     WHERE id = $2`,
                    [movimiento.rows[0].id, item.id]
                );

                ajustesRealizados.push({
                    item_id: item.id,
                    producto_nombre: item.producto_nombre,
                    diferencia: item.diferencia,
                    movimiento_id: movimiento.rows[0].id
                });
            }

            // Actualizar estado del conteo
            await db.query(
                `UPDATE conteos_inventario
                 SET estado = 'ajustado',
                     fecha_ajuste = NOW(),
                     actualizado_en = NOW()
                 WHERE id = $1`,
                [id]
            );

            logger.info('[ConteosModel.aplicarAjustes] Ajustes aplicados', {
                conteo_id: id,
                folio: conteo.folio,
                ajustes: ajustesRealizados.length
            });

            return {
                conteo: await this.obtenerPorId(id, organizacionId),
                ajustes_realizados: ajustesRealizados
            };
        });
    }

    /**
     * Cancelar conteo
     * Estado: (cualquiera excepto ajustado) → cancelado
     * @param {number} id - ID del conteo
     * @param {string} motivo - Motivo de cancelación
     * @param {number} usuarioId - Usuario que cancela
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Conteo cancelado
     */
    static async cancelar(id, motivo, usuarioId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ConteosModel.cancelar] Cancelando conteo', { conteo_id: id });

            // Verificar estado
            const conteoQuery = await db.query(
                `SELECT id, estado, folio FROM conteos_inventario WHERE id = $1`,
                [id]
            );

            if (conteoQuery.rows.length === 0) {
                throw new Error('Conteo no encontrado');
            }

            const conteo = conteoQuery.rows[0];

            if (conteo.estado === 'ajustado') {
                throw new Error('No se puede cancelar un conteo que ya fue ajustado');
            }

            if (conteo.estado === 'cancelado') {
                throw new Error('El conteo ya está cancelado');
            }

            // Cancelar conteo
            const updateQuery = `
                UPDATE conteos_inventario
                SET estado = 'cancelado',
                    notas = CASE
                        WHEN notas IS NULL OR notas = '' THEN $1
                        ELSE notas || E'\n---\nCANCELADO: ' || $1
                    END,
                    actualizado_en = NOW()
                WHERE id = $2
                RETURNING *
            `;

            await db.query(updateQuery, [
                `Cancelado por usuario ${usuarioId}. Motivo: ${motivo || 'No especificado'}`,
                id
            ]);

            logger.info('[ConteosModel.cancelar] Conteo cancelado', {
                conteo_id: id,
                folio: conteo.folio
            });

            return await this.obtenerPorId(id, organizacionId);
        });
    }

    // ========================================================================
    // UTILIDADES
    // ========================================================================

    /**
     * Buscar item por código de barras o SKU
     * @param {number} conteoId - ID del conteo
     * @param {string} codigo - Código de barras o SKU
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Item encontrado
     */
    static async buscarItemPorCodigo(conteoId, codigo, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT ci.*, p.nombre AS producto_nombre, p.sku, p.codigo_barras
                FROM conteos_inventario_items ci
                JOIN productos p ON p.id = ci.producto_id
                WHERE ci.conteo_id = $1
                  AND (p.codigo_barras = $2 OR p.sku = $2)
                LIMIT 1
            `;

            const result = await db.query(query, [conteoId, codigo]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        });
    }

    /**
     * Obtener resumen de conteos por período
     * @param {number} organizacionId - ID de la organización
     * @param {Date} fechaDesde - Fecha inicio
     * @param {Date} fechaHasta - Fecha fin
     * @returns {Object} Estadísticas de conteos
     */
    static async obtenerEstadisticas(organizacionId, fechaDesde, fechaHasta) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM resumen_conteos_inventario($1, $2, $3)
            `;

            const result = await db.query(query, [organizacionId, fechaDesde, fechaHasta]);

            return result.rows[0] || {
                total_conteos: 0,
                conteos_completados: 0,
                conteos_con_diferencias: 0,
                total_items_contados: 0,
                items_con_diferencia: 0,
                valor_ajustes_positivos: 0,
                valor_ajustes_negativos: 0
            };
        });
    }
}

module.exports = ConteosModel;
