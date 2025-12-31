/**
 * Model para Consigna (Inventario en Consignación)
 * Stock de proveedores almacenado en tu almacén, pago solo al vender
 * Fecha: 31 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

class ConsignaModel {
    // ==================== ACUERDOS ====================

    /**
     * Crear nuevo acuerdo de consignación
     */
    static async crearAcuerdo(data, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const {
                proveedor_id,
                porcentaje_comision,
                dias_liquidacion = 30,
                dias_devolucion = 90,
                sucursal_id,
                ubicacion_consigna_id,
                fecha_inicio,
                fecha_fin,
                notas
            } = data;

            // Verificar que el proveedor existe
            const provCheck = await db.query(
                'SELECT id FROM proveedores WHERE id = $1 AND organizacion_id = $2',
                [proveedor_id, organizacionId]
            );
            if (!provCheck.rows[0]) {
                throw new Error('Proveedor no encontrado');
            }

            // Generar folio
            const folioResult = await db.query(
                'SELECT generar_folio_acuerdo_consigna($1) as folio',
                [organizacionId]
            );
            const folio = folioResult.rows[0].folio;

            const result = await db.query(`
                INSERT INTO acuerdos_consigna (
                    organizacion_id, folio, proveedor_id,
                    porcentaje_comision, dias_liquidacion, dias_devolucion,
                    sucursal_id, ubicacion_consigna_id,
                    fecha_inicio, fecha_fin, notas, creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `, [
                organizacionId, folio, proveedor_id,
                porcentaje_comision, dias_liquidacion, dias_devolucion,
                sucursal_id || null, ubicacion_consigna_id || null,
                fecha_inicio || new Date(), fecha_fin || null,
                notas || null, usuarioId
            ]);

            logger.info('[ConsignaModel.crearAcuerdo] Acuerdo creado', {
                id: result.rows[0].id,
                folio,
                proveedor_id
            });

            return result.rows[0];
        });
    }

    /**
     * Obtener acuerdo por ID con detalles
     */
    static async obtenerAcuerdo(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT
                    ac.*,
                    p.nombre AS proveedor_nombre,
                    p.razon_social AS proveedor_razon_social,
                    su.nombre AS sucursal_nombre,
                    ub.codigo AS ubicacion_codigo,
                    u.nombre AS creado_por_nombre,
                    (SELECT COUNT(*) FROM acuerdos_consigna_productos WHERE acuerdo_id = ac.id AND activo) AS total_productos,
                    (SELECT COALESCE(SUM(cantidad_disponible), 0) FROM stock_consigna WHERE acuerdo_id = ac.id) AS total_stock
                FROM acuerdos_consigna ac
                LEFT JOIN proveedores p ON p.id = ac.proveedor_id
                LEFT JOIN sucursales su ON su.id = ac.sucursal_id
                LEFT JOIN ubicaciones_almacen ub ON ub.id = ac.ubicacion_consigna_id
                LEFT JOIN usuarios u ON u.id = ac.creado_por
                WHERE ac.id = $1 AND ac.organizacion_id = $2
            `, [id, organizacionId]);

            return result.rows[0] || null;
        });
    }

    /**
     * Listar acuerdos con filtros
     */
    static async listarAcuerdos(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                proveedor_id,
                estado,
                busqueda,
                limit = 50,
                offset = 0
            } = filtros;

            let whereClause = 'WHERE ac.organizacion_id = $1';
            const params = [organizacionId];
            let paramIndex = 2;

            if (proveedor_id) {
                whereClause += ` AND ac.proveedor_id = $${paramIndex++}`;
                params.push(proveedor_id);
            }

            if (estado) {
                whereClause += ` AND ac.estado = $${paramIndex++}`;
                params.push(estado);
            }

            if (busqueda) {
                whereClause += ` AND (ac.folio ILIKE $${paramIndex} OR p.nombre ILIKE $${paramIndex})`;
                params.push(`%${busqueda}%`);
                paramIndex++;
            }

            const countResult = await db.query(`
                SELECT COUNT(*) as total
                FROM acuerdos_consigna ac
                LEFT JOIN proveedores p ON p.id = ac.proveedor_id
                ${whereClause}
            `, params);

            params.push(limit, offset);

            const result = await db.query(`
                SELECT
                    ac.*,
                    p.nombre AS proveedor_nombre,
                    (SELECT COUNT(*) FROM acuerdos_consigna_productos WHERE acuerdo_id = ac.id AND activo) AS total_productos,
                    (SELECT COALESCE(SUM(cantidad_disponible), 0) FROM stock_consigna WHERE acuerdo_id = ac.id) AS total_stock,
                    (SELECT COALESCE(SUM(subtotal), 0) FROM movimientos_consigna
                     WHERE acuerdo_id = ac.id AND tipo = 'venta' AND NOT liquidado) AS pendiente_liquidar
                FROM acuerdos_consigna ac
                LEFT JOIN proveedores p ON p.id = ac.proveedor_id
                ${whereClause}
                ORDER BY ac.creado_en DESC
                LIMIT $${paramIndex++} OFFSET $${paramIndex}
            `, params);

            return {
                data: result.rows,
                total: parseInt(countResult.rows[0].total),
                limit,
                offset
            };
        });
    }

    /**
     * Actualizar acuerdo
     */
    static async actualizarAcuerdo(id, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const existing = await db.query(
                'SELECT id, estado FROM acuerdos_consigna WHERE id = $1 AND organizacion_id = $2',
                [id, organizacionId]
            );

            if (!existing.rows[0]) {
                return null;
            }

            if (existing.rows[0].estado === 'terminado') {
                throw new Error('No se puede modificar un acuerdo terminado');
            }

            const {
                porcentaje_comision,
                dias_liquidacion,
                dias_devolucion,
                sucursal_id,
                ubicacion_consigna_id,
                fecha_fin,
                notas
            } = data;

            const result = await db.query(`
                UPDATE acuerdos_consigna SET
                    porcentaje_comision = COALESCE($3, porcentaje_comision),
                    dias_liquidacion = COALESCE($4, dias_liquidacion),
                    dias_devolucion = COALESCE($5, dias_devolucion),
                    sucursal_id = COALESCE($6, sucursal_id),
                    ubicacion_consigna_id = COALESCE($7, ubicacion_consigna_id),
                    fecha_fin = $8,
                    notas = $9,
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
                RETURNING *
            `, [
                id, organizacionId,
                porcentaje_comision, dias_liquidacion, dias_devolucion,
                sucursal_id, ubicacion_consigna_id, fecha_fin, notas
            ]);

            return result.rows[0];
        });
    }

    /**
     * Activar acuerdo
     */
    static async activarAcuerdo(id, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const existing = await db.query(
                'SELECT id, estado FROM acuerdos_consigna WHERE id = $1 AND organizacion_id = $2',
                [id, organizacionId]
            );

            if (!existing.rows[0]) {
                return null;
            }

            if (!['borrador', 'pausado'].includes(existing.rows[0].estado)) {
                throw new Error(`No se puede activar un acuerdo en estado ${existing.rows[0].estado}`);
            }

            const result = await db.query(`
                UPDATE acuerdos_consigna SET
                    estado = 'activo',
                    activado_por = $3,
                    activado_en = NOW(),
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
                RETURNING *
            `, [id, organizacionId, usuarioId]);

            logger.info('[ConsignaModel.activarAcuerdo] Acuerdo activado', { id });

            return result.rows[0];
        });
    }

    /**
     * Pausar acuerdo
     */
    static async pausarAcuerdo(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const result = await db.query(`
                UPDATE acuerdos_consigna SET
                    estado = 'pausado',
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2 AND estado = 'activo'
                RETURNING *
            `, [id, organizacionId]);

            return result.rows[0] || null;
        });
    }

    /**
     * Terminar acuerdo
     */
    static async terminarAcuerdo(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que no hay stock pendiente
            const stockCheck = await db.query(`
                SELECT COALESCE(SUM(cantidad_disponible), 0) as stock_pendiente
                FROM stock_consigna WHERE acuerdo_id = $1
            `, [id]);

            if (parseInt(stockCheck.rows[0].stock_pendiente) > 0) {
                throw new Error('No se puede terminar el acuerdo con stock pendiente. Devuelva la mercancía primero.');
            }

            // Verificar que no hay ventas sin liquidar
            const ventasCheck = await db.query(`
                SELECT COUNT(*) as pendientes
                FROM movimientos_consigna
                WHERE acuerdo_id = $1 AND tipo = 'venta' AND NOT liquidado
            `, [id]);

            if (parseInt(ventasCheck.rows[0].pendientes) > 0) {
                throw new Error('No se puede terminar el acuerdo con ventas pendientes de liquidar.');
            }

            const result = await db.query(`
                UPDATE acuerdos_consigna SET
                    estado = 'terminado',
                    fecha_fin = COALESCE(fecha_fin, CURRENT_DATE),
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2 AND estado IN ('activo', 'pausado')
                RETURNING *
            `, [id, organizacionId]);

            return result.rows[0] || null;
        });
    }

    // ==================== PRODUCTOS DEL ACUERDO ====================

    /**
     * Agregar producto al acuerdo
     */
    static async agregarProducto(acuerdoId, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar acuerdo
            const acuerdo = await db.query(
                'SELECT id, estado FROM acuerdos_consigna WHERE id = $1 AND organizacion_id = $2',
                [acuerdoId, organizacionId]
            );

            if (!acuerdo.rows[0]) {
                throw new Error('Acuerdo no encontrado');
            }

            if (acuerdo.rows[0].estado === 'terminado') {
                throw new Error('No se pueden agregar productos a un acuerdo terminado');
            }

            const {
                producto_id,
                variante_id,
                precio_consigna,
                precio_venta_sugerido,
                cantidad_minima = 0,
                cantidad_maxima
            } = data;

            // Verificar producto
            const prodCheck = await db.query(
                'SELECT id FROM productos WHERE id = $1 AND organizacion_id = $2',
                [producto_id, organizacionId]
            );
            if (!prodCheck.rows[0]) {
                throw new Error('Producto no encontrado');
            }

            // Verificar que producto no esté en otro acuerdo activo
            const duplicateCheck = await db.query(`
                SELECT acp.id, ac.folio
                FROM acuerdos_consigna_productos acp
                JOIN acuerdos_consigna ac ON ac.id = acp.acuerdo_id
                WHERE acp.producto_id = $1
                  AND COALESCE(acp.variante_id, 0) = COALESCE($2, 0)
                  AND ac.organizacion_id = $3
                  AND ac.estado = 'activo'
                  AND acp.activo = true
                  AND ac.id != $4
            `, [producto_id, variante_id, organizacionId, acuerdoId]);

            if (duplicateCheck.rows[0]) {
                throw new Error(`Este producto ya está en el acuerdo activo ${duplicateCheck.rows[0].folio}`);
            }

            const result = await db.query(`
                INSERT INTO acuerdos_consigna_productos (
                    acuerdo_id, producto_id, variante_id,
                    precio_consigna, precio_venta_sugerido,
                    cantidad_minima, cantidad_maxima
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (acuerdo_id, producto_id, COALESCE(variante_id, 0))
                DO UPDATE SET
                    precio_consigna = EXCLUDED.precio_consigna,
                    precio_venta_sugerido = EXCLUDED.precio_venta_sugerido,
                    cantidad_minima = EXCLUDED.cantidad_minima,
                    cantidad_maxima = EXCLUDED.cantidad_maxima,
                    activo = true
                RETURNING *
            `, [
                acuerdoId, producto_id, variante_id || null,
                precio_consigna, precio_venta_sugerido || null,
                cantidad_minima, cantidad_maxima || null
            ]);

            return result.rows[0];
        });
    }

    /**
     * Listar productos del acuerdo
     */
    static async listarProductosAcuerdo(acuerdoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT
                    acp.*,
                    p.nombre AS producto_nombre,
                    p.sku,
                    p.codigo_barras,
                    pv.nombre_variante AS variante_nombre,
                    COALESCE(
                        (SELECT SUM(cantidad_disponible)
                         FROM stock_consigna sc
                         WHERE sc.acuerdo_id = acp.acuerdo_id
                           AND sc.producto_id = acp.producto_id
                           AND COALESCE(sc.variante_id, 0) = COALESCE(acp.variante_id, 0)
                        ), 0
                    ) AS stock_actual
                FROM acuerdos_consigna_productos acp
                JOIN acuerdos_consigna ac ON ac.id = acp.acuerdo_id
                JOIN productos p ON p.id = acp.producto_id
                LEFT JOIN variantes_producto pv ON pv.id = acp.variante_id
                WHERE acp.acuerdo_id = $1 AND ac.organizacion_id = $2
                ORDER BY p.nombre
            `, [acuerdoId, organizacionId]);

            return result.rows;
        });
    }

    /**
     * Actualizar producto del acuerdo
     */
    static async actualizarProducto(acuerdoId, productoId, varianteId, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const {
                precio_consigna,
                precio_venta_sugerido,
                cantidad_minima,
                cantidad_maxima,
                activo
            } = data;

            const result = await db.query(`
                UPDATE acuerdos_consigna_productos acp SET
                    precio_consigna = COALESCE($5, precio_consigna),
                    precio_venta_sugerido = COALESCE($6, precio_venta_sugerido),
                    cantidad_minima = COALESCE($7, cantidad_minima),
                    cantidad_maxima = $8,
                    activo = COALESCE($9, activo)
                FROM acuerdos_consigna ac
                WHERE acp.acuerdo_id = $1
                  AND acp.producto_id = $2
                  AND COALESCE(acp.variante_id, 0) = COALESCE($3, 0)
                  AND ac.id = acp.acuerdo_id
                  AND ac.organizacion_id = $4
                RETURNING acp.*
            `, [
                acuerdoId, productoId, varianteId, organizacionId,
                precio_consigna, precio_venta_sugerido,
                cantidad_minima, cantidad_maxima, activo
            ]);

            return result.rows[0] || null;
        });
    }

    /**
     * Remover producto del acuerdo (desactivar)
     */
    static async removerProducto(acuerdoId, productoId, varianteId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que no hay stock
            const stockCheck = await db.query(`
                SELECT COALESCE(SUM(cantidad_disponible), 0) as stock
                FROM stock_consigna sc
                JOIN acuerdos_consigna ac ON ac.id = sc.acuerdo_id
                WHERE sc.acuerdo_id = $1
                  AND sc.producto_id = $2
                  AND COALESCE(sc.variante_id, 0) = COALESCE($3, 0)
                  AND ac.organizacion_id = $4
            `, [acuerdoId, productoId, varianteId, organizacionId]);

            if (parseInt(stockCheck.rows[0].stock) > 0) {
                throw new Error('No se puede remover producto con stock. Devuelva la mercancía primero.');
            }

            const result = await db.query(`
                UPDATE acuerdos_consigna_productos acp SET activo = false
                FROM acuerdos_consigna ac
                WHERE acp.acuerdo_id = $1
                  AND acp.producto_id = $2
                  AND COALESCE(acp.variante_id, 0) = COALESCE($3, 0)
                  AND ac.id = acp.acuerdo_id
                  AND ac.organizacion_id = $4
                RETURNING acp.*
            `, [acuerdoId, productoId, varianteId, organizacionId]);

            return result.rows[0] || null;
        });
    }

    // ==================== STOCK CONSIGNA ====================

    /**
     * Recibir mercancía en consignación
     */
    static async recibirMercancia(acuerdoId, items, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar acuerdo activo
            const acuerdo = await db.query(`
                SELECT id, sucursal_id, ubicacion_consigna_id
                FROM acuerdos_consigna
                WHERE id = $1 AND organizacion_id = $2 AND estado = 'activo'
            `, [acuerdoId, organizacionId]);

            if (!acuerdo.rows[0]) {
                throw new Error('Acuerdo no encontrado o no está activo');
            }

            const sucursalId = acuerdo.rows[0].sucursal_id;
            const ubicacionId = acuerdo.rows[0].ubicacion_consigna_id;

            if (!sucursalId) {
                throw new Error('El acuerdo no tiene sucursal asignada');
            }

            const movimientos = [];

            for (const item of items) {
                // Verificar que producto está en el acuerdo
                const prodAcuerdo = await db.query(`
                    SELECT precio_consigna
                    FROM acuerdos_consigna_productos
                    WHERE acuerdo_id = $1
                      AND producto_id = $2
                      AND COALESCE(variante_id, 0) = COALESCE($3, 0)
                      AND activo = true
                `, [acuerdoId, item.producto_id, item.variante_id]);

                if (!prodAcuerdo.rows[0]) {
                    throw new Error(`Producto ${item.producto_id} no está incluido en el acuerdo`);
                }

                const precioConsigna = prodAcuerdo.rows[0].precio_consigna;
                const ubicacionFinal = item.ubicacion_id || ubicacionId;

                // Registrar movimiento usando función SQL
                const movResult = await db.query(`
                    SELECT registrar_movimiento_consigna(
                        $1, $2, $3, $4, $5, $6, 'entrada', $7, $8,
                        NULL, NULL, $9, $10, $11, $12
                    ) as movimiento_id
                `, [
                    organizacionId, acuerdoId, item.producto_id, item.variante_id || null,
                    sucursalId, ubicacionFinal, item.cantidad, precioConsigna,
                    item.numero_serie_id || null, item.lote || null,
                    item.notas || null, usuarioId
                ]);

                movimientos.push({
                    movimiento_id: movResult.rows[0].movimiento_id,
                    producto_id: item.producto_id,
                    cantidad: item.cantidad
                });
            }

            logger.info('[ConsignaModel.recibirMercancia] Mercancía recibida', {
                acuerdo_id: acuerdoId,
                items: movimientos.length
            });

            return { movimientos };
        });
    }

    /**
     * Consultar stock en consignación
     */
    static async consultarStock(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                acuerdo_id,
                proveedor_id,
                producto_id,
                sucursal_id,
                solo_disponible = true,
                limit = 100,
                offset = 0
            } = filtros;

            let whereClause = 'WHERE sc.organizacion_id = $1';
            const params = [organizacionId];
            let paramIndex = 2;

            if (acuerdo_id) {
                whereClause += ` AND sc.acuerdo_id = $${paramIndex++}`;
                params.push(acuerdo_id);
            }

            if (proveedor_id) {
                whereClause += ` AND ac.proveedor_id = $${paramIndex++}`;
                params.push(proveedor_id);
            }

            if (producto_id) {
                whereClause += ` AND sc.producto_id = $${paramIndex++}`;
                params.push(producto_id);
            }

            if (sucursal_id) {
                whereClause += ` AND sc.sucursal_id = $${paramIndex++}`;
                params.push(sucursal_id);
            }

            if (solo_disponible) {
                whereClause += ' AND sc.cantidad_disponible > 0';
            }

            params.push(limit, offset);

            const result = await db.query(`
                SELECT
                    sc.*,
                    ac.folio AS acuerdo_folio,
                    ac.proveedor_id,
                    pr.nombre AS proveedor_nombre,
                    p.nombre AS producto_nombre,
                    p.sku,
                    pv.nombre_variante AS variante_nombre,
                    su.nombre AS sucursal_nombre,
                    ub.codigo AS ubicacion_codigo,
                    acp.precio_consigna,
                    (sc.cantidad_disponible * acp.precio_consigna) AS valor_consigna
                FROM stock_consigna sc
                JOIN acuerdos_consigna ac ON ac.id = sc.acuerdo_id
                JOIN proveedores pr ON pr.id = ac.proveedor_id
                JOIN productos p ON p.id = sc.producto_id
                LEFT JOIN variantes_producto pv ON pv.id = sc.variante_id
                JOIN sucursales su ON su.id = sc.sucursal_id
                LEFT JOIN ubicaciones_almacen ub ON ub.id = sc.ubicacion_id
                LEFT JOIN acuerdos_consigna_productos acp
                    ON acp.acuerdo_id = ac.id
                    AND acp.producto_id = sc.producto_id
                    AND COALESCE(acp.variante_id, 0) = COALESCE(sc.variante_id, 0)
                ${whereClause}
                ORDER BY pr.nombre, p.nombre
                LIMIT $${paramIndex++} OFFSET $${paramIndex}
            `, params);

            return result.rows;
        });
    }

    /**
     * Ajustar stock consigna
     */
    static async ajustarStock(stockConsignaId, cantidad, motivo, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const stock = await db.query(`
                SELECT sc.*, acp.precio_consigna
                FROM stock_consigna sc
                JOIN acuerdos_consigna_productos acp
                    ON acp.acuerdo_id = sc.acuerdo_id
                    AND acp.producto_id = sc.producto_id
                    AND COALESCE(acp.variante_id, 0) = COALESCE(sc.variante_id, 0)
                WHERE sc.id = $1 AND sc.organizacion_id = $2
            `, [stockConsignaId, organizacionId]);

            if (!stock.rows[0]) {
                throw new Error('Stock no encontrado');
            }

            const s = stock.rows[0];

            // Verificar que el ajuste no deje stock negativo
            if (s.cantidad_disponible + cantidad < 0) {
                throw new Error('El ajuste dejaría el stock en negativo');
            }

            const movResult = await db.query(`
                SELECT registrar_movimiento_consigna(
                    $1, $2, $3, $4, $5, $6, 'ajuste', $7, $8,
                    NULL, NULL, NULL, NULL, $9, $10
                ) as movimiento_id
            `, [
                organizacionId, s.acuerdo_id, s.producto_id, s.variante_id,
                s.sucursal_id, s.ubicacion_id, cantidad, s.precio_consigna,
                motivo, usuarioId
            ]);

            return {
                movimiento_id: movResult.rows[0].movimiento_id,
                cantidad_anterior: s.cantidad_disponible,
                cantidad_nueva: s.cantidad_disponible + cantidad
            };
        });
    }

    /**
     * Devolver mercancía al proveedor
     */
    static async devolverMercancia(acuerdoId, items, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const acuerdo = await db.query(`
                SELECT id, sucursal_id FROM acuerdos_consigna
                WHERE id = $1 AND organizacion_id = $2 AND estado IN ('activo', 'pausado')
            `, [acuerdoId, organizacionId]);

            if (!acuerdo.rows[0]) {
                throw new Error('Acuerdo no encontrado o terminado');
            }

            const movimientos = [];

            for (const item of items) {
                // Verificar stock disponible
                const stock = await db.query(`
                    SELECT sc.*, acp.precio_consigna
                    FROM stock_consigna sc
                    JOIN acuerdos_consigna_productos acp
                        ON acp.acuerdo_id = sc.acuerdo_id
                        AND acp.producto_id = sc.producto_id
                        AND COALESCE(acp.variante_id, 0) = COALESCE(sc.variante_id, 0)
                    WHERE sc.acuerdo_id = $1
                      AND sc.producto_id = $2
                      AND COALESCE(sc.variante_id, 0) = COALESCE($3, 0)
                      AND sc.sucursal_id = $4
                `, [acuerdoId, item.producto_id, item.variante_id, item.sucursal_id || acuerdo.rows[0].sucursal_id]);

                if (!stock.rows[0] || stock.rows[0].cantidad_disponible < item.cantidad) {
                    throw new Error(`Stock insuficiente para producto ${item.producto_id}`);
                }

                const s = stock.rows[0];

                const movResult = await db.query(`
                    SELECT registrar_movimiento_consigna(
                        $1, $2, $3, $4, $5, $6, 'devolucion', $7, $8,
                        NULL, NULL, $9, $10, $11, $12
                    ) as movimiento_id
                `, [
                    organizacionId, acuerdoId, item.producto_id, item.variante_id || null,
                    s.sucursal_id, s.ubicacion_id, item.cantidad, s.precio_consigna,
                    item.numero_serie_id || null, item.lote || null,
                    item.notas || 'Devolución a proveedor', usuarioId
                ]);

                movimientos.push({
                    movimiento_id: movResult.rows[0].movimiento_id,
                    producto_id: item.producto_id,
                    cantidad: item.cantidad
                });
            }

            logger.info('[ConsignaModel.devolverMercancia] Devolución registrada', {
                acuerdo_id: acuerdoId,
                items: movimientos.length
            });

            return { movimientos };
        });
    }

    // ==================== VENTAS (llamado desde POS) ====================

    /**
     * Verificar si hay stock consigna para un producto
     */
    static async verificarStockConsigna(productoId, varianteId, cantidad, sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT * FROM verificar_stock_consigna($1, $2, $3, $4, $5)
            `, [organizacionId, productoId, varianteId, cantidad, sucursalId]);

            return result.rows[0] || null;
        });
    }

    /**
     * Registrar venta de producto en consigna
     */
    static async registrarVenta(ventaId, ventaItemId, stockConsignaId, cantidad, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const stock = await db.query(`
                SELECT sc.*, acp.precio_consigna
                FROM stock_consigna sc
                JOIN acuerdos_consigna_productos acp
                    ON acp.acuerdo_id = sc.acuerdo_id
                    AND acp.producto_id = sc.producto_id
                    AND COALESCE(acp.variante_id, 0) = COALESCE(sc.variante_id, 0)
                WHERE sc.id = $1 AND sc.organizacion_id = $2
            `, [stockConsignaId, organizacionId]);

            if (!stock.rows[0]) {
                throw new Error('Stock consigna no encontrado');
            }

            const s = stock.rows[0];

            if (s.cantidad_disponible < cantidad) {
                throw new Error('Stock insuficiente');
            }

            const movResult = await db.query(`
                SELECT registrar_movimiento_consigna(
                    $1, $2, $3, $4, $5, $6, 'venta', $7, $8,
                    $9, $10, NULL, NULL, NULL, $11
                ) as movimiento_id
            `, [
                organizacionId, s.acuerdo_id, s.producto_id, s.variante_id,
                s.sucursal_id, s.ubicacion_id, cantidad, s.precio_consigna,
                ventaId, ventaItemId, usuarioId
            ]);

            return {
                movimiento_id: movResult.rows[0].movimiento_id,
                acuerdo_id: s.acuerdo_id,
                precio_consigna: s.precio_consigna
            };
        });
    }

    // ==================== LIQUIDACIONES ====================

    /**
     * Generar liquidación
     */
    static async generarLiquidacion(acuerdoId, fechaDesde, fechaHasta, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar acuerdo
            const acuerdo = await db.query(`
                SELECT id, proveedor_id, porcentaje_comision
                FROM acuerdos_consigna
                WHERE id = $1 AND organizacion_id = $2
            `, [acuerdoId, organizacionId]);

            if (!acuerdo.rows[0]) {
                throw new Error('Acuerdo no encontrado');
            }

            const a = acuerdo.rows[0];

            // Calcular totales
            const totales = await db.query(`
                SELECT * FROM calcular_totales_liquidacion($1, $2, $3)
            `, [acuerdoId, fechaDesde, fechaHasta]);

            const t = totales.rows[0];
            const totalUnidades = parseInt(t.total_unidades) || 0;
            const subtotalVentas = parseFloat(t.subtotal) || 0;
            const comision = Math.round(subtotalVentas * (t.porcentaje_comision / 100) * 100) / 100;
            const totalPagar = subtotalVentas - comision;

            if (totalUnidades === 0) {
                throw new Error('No hay ventas pendientes de liquidar en el período seleccionado');
            }

            // Generar folio
            const folioResult = await db.query(
                'SELECT generar_folio_liquidacion_consigna($1) as folio',
                [organizacionId]
            );

            const result = await db.query(`
                INSERT INTO liquidaciones_consigna (
                    organizacion_id, folio, acuerdo_id, proveedor_id,
                    fecha_desde, fecha_hasta,
                    total_unidades_vendidas, subtotal_ventas, comision, total_pagar_proveedor,
                    creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `, [
                organizacionId, folioResult.rows[0].folio, acuerdoId, a.proveedor_id,
                fechaDesde, fechaHasta,
                totalUnidades, subtotalVentas, comision, totalPagar,
                usuarioId
            ]);

            logger.info('[ConsignaModel.generarLiquidacion] Liquidación generada', {
                id: result.rows[0].id,
                folio: result.rows[0].folio,
                total_pagar: totalPagar
            });

            return result.rows[0];
        });
    }

    /**
     * Obtener liquidación con detalle
     */
    static async obtenerLiquidacion(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const liq = await db.query(`
                SELECT
                    lc.*,
                    ac.folio AS acuerdo_folio,
                    pr.nombre AS proveedor_nombre,
                    pr.razon_social AS proveedor_razon_social,
                    u.nombre AS creado_por_nombre
                FROM liquidaciones_consigna lc
                JOIN acuerdos_consigna ac ON ac.id = lc.acuerdo_id
                JOIN proveedores pr ON pr.id = lc.proveedor_id
                LEFT JOIN usuarios u ON u.id = lc.creado_por
                WHERE lc.id = $1 AND lc.organizacion_id = $2
            `, [id, organizacionId]);

            if (!liq.rows[0]) {
                return null;
            }

            // Obtener items de la liquidación
            const items = await db.query(`
                SELECT
                    mc.*,
                    p.nombre AS producto_nombre,
                    p.sku,
                    pv.nombre_variante AS variante_nombre
                FROM movimientos_consigna mc
                JOIN productos p ON p.id = mc.producto_id
                LEFT JOIN variantes_producto pv ON pv.id = mc.variante_id
                WHERE mc.liquidacion_id = $1
                ORDER BY mc.creado_en
            `, [id]);

            return {
                ...liq.rows[0],
                items: items.rows
            };
        });
    }

    /**
     * Listar liquidaciones
     */
    static async listarLiquidaciones(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                acuerdo_id,
                proveedor_id,
                estado,
                limit = 50,
                offset = 0
            } = filtros;

            let whereClause = 'WHERE lc.organizacion_id = $1';
            const params = [organizacionId];
            let paramIndex = 2;

            if (acuerdo_id) {
                whereClause += ` AND lc.acuerdo_id = $${paramIndex++}`;
                params.push(acuerdo_id);
            }

            if (proveedor_id) {
                whereClause += ` AND lc.proveedor_id = $${paramIndex++}`;
                params.push(proveedor_id);
            }

            if (estado) {
                whereClause += ` AND lc.estado = $${paramIndex++}`;
                params.push(estado);
            }

            params.push(limit, offset);

            const result = await db.query(`
                SELECT
                    lc.*,
                    ac.folio AS acuerdo_folio,
                    pr.nombre AS proveedor_nombre
                FROM liquidaciones_consigna lc
                JOIN acuerdos_consigna ac ON ac.id = lc.acuerdo_id
                JOIN proveedores pr ON pr.id = lc.proveedor_id
                ${whereClause}
                ORDER BY lc.creado_en DESC
                LIMIT $${paramIndex++} OFFSET $${paramIndex}
            `, params);

            return result.rows;
        });
    }

    /**
     * Confirmar liquidación
     */
    static async confirmarLiquidacion(id, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const liq = await db.query(
                'SELECT id, acuerdo_id, fecha_desde, fecha_hasta FROM liquidaciones_consigna WHERE id = $1 AND organizacion_id = $2 AND estado = $3',
                [id, organizacionId, 'borrador']
            );

            if (!liq.rows[0]) {
                throw new Error('Liquidación no encontrada o no está en borrador');
            }

            // Marcar movimientos como liquidados
            await db.query(`
                UPDATE movimientos_consigna SET
                    liquidacion_id = $1,
                    liquidado = true,
                    liquidado_en = NOW()
                WHERE acuerdo_id = $2
                  AND tipo = 'venta'
                  AND liquidado = false
                  AND creado_en::DATE BETWEEN $3 AND $4
            `, [id, liq.rows[0].acuerdo_id, liq.rows[0].fecha_desde, liq.rows[0].fecha_hasta]);

            const result = await db.query(`
                UPDATE liquidaciones_consigna SET
                    estado = 'confirmada',
                    confirmado_por = $3,
                    confirmado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
                RETURNING *
            `, [id, organizacionId, usuarioId]);

            logger.info('[ConsignaModel.confirmarLiquidacion] Liquidación confirmada', { id });

            return result.rows[0];
        });
    }

    /**
     * Pagar liquidación
     */
    static async pagarLiquidacion(id, datosPago, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const {
                fecha_pago,
                metodo_pago,
                referencia_pago
            } = datosPago;

            const result = await db.query(`
                UPDATE liquidaciones_consigna SET
                    estado = 'pagada',
                    fecha_pago = $3,
                    metodo_pago = $4,
                    referencia_pago = $5,
                    pagado_por = $6,
                    pagado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2 AND estado = 'confirmada'
                RETURNING *
            `, [id, organizacionId, fecha_pago || new Date(), metodo_pago, referencia_pago, usuarioId]);

            if (!result.rows[0]) {
                throw new Error('Liquidación no encontrada o no está confirmada');
            }

            logger.info('[ConsignaModel.pagarLiquidacion] Liquidación pagada', { id });

            return result.rows[0];
        });
    }

    /**
     * Cancelar liquidación
     */
    static async cancelarLiquidacion(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const liq = await db.query(
                'SELECT id, estado FROM liquidaciones_consigna WHERE id = $1 AND organizacion_id = $2',
                [id, organizacionId]
            );

            if (!liq.rows[0]) {
                return null;
            }

            if (liq.rows[0].estado === 'pagada') {
                throw new Error('No se puede cancelar una liquidación ya pagada');
            }

            // Desmarcar movimientos
            await db.query(`
                UPDATE movimientos_consigna SET
                    liquidacion_id = NULL,
                    liquidado = false,
                    liquidado_en = NULL
                WHERE liquidacion_id = $1
            `, [id]);

            const result = await db.query(`
                UPDATE liquidaciones_consigna SET estado = 'cancelada'
                WHERE id = $1 AND organizacion_id = $2
                RETURNING *
            `, [id, organizacionId]);

            return result.rows[0];
        });
    }

    // ==================== REPORTES ====================

    /**
     * Reporte de stock consigna
     */
    static async reporteStock(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { proveedor_id } = filtros;

            let whereClause = 'WHERE organizacion_id = $1';
            const params = [organizacionId];

            if (proveedor_id) {
                whereClause += ' AND proveedor_id = $2';
                params.push(proveedor_id);
            }

            const result = await db.query(`
                SELECT * FROM v_resumen_stock_consigna ${whereClause}
                ORDER BY proveedor_nombre, producto_nombre
            `, params);

            return result.rows;
        });
    }

    /**
     * Reporte pendiente de liquidar
     */
    static async reportePendiente(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT * FROM v_pendiente_liquidar_consigna
                WHERE organizacion_id = $1
                ORDER BY proveedor_nombre
            `, [organizacionId]);

            return result.rows;
        });
    }

    /**
     * Reporte de ventas consigna
     */
    static async reporteVentas(fechaDesde, fechaHasta, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT
                    mc.acuerdo_id,
                    ac.folio AS acuerdo_folio,
                    ac.proveedor_id,
                    pr.nombre AS proveedor_nombre,
                    mc.producto_id,
                    p.nombre AS producto_nombre,
                    p.sku,
                    SUM(ABS(mc.cantidad)) AS total_unidades,
                    SUM(mc.subtotal) AS total_valor,
                    COUNT(DISTINCT mc.venta_id) AS total_ventas
                FROM movimientos_consigna mc
                JOIN acuerdos_consigna ac ON ac.id = mc.acuerdo_id
                JOIN proveedores pr ON pr.id = ac.proveedor_id
                JOIN productos p ON p.id = mc.producto_id
                WHERE mc.organizacion_id = $1
                  AND mc.tipo = 'venta'
                  AND mc.creado_en::DATE BETWEEN $2 AND $3
                GROUP BY mc.acuerdo_id, ac.folio, ac.proveedor_id, pr.nombre,
                         mc.producto_id, p.nombre, p.sku
                ORDER BY pr.nombre, p.nombre
            `, [organizacionId, fechaDesde, fechaHasta]);

            return result.rows;
        });
    }
}

module.exports = ConsignaModel;
