const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { DuplicateResourceError } = require('../../../utils/errors');

/**
 * Model para CRUD de proveedores
 * Maneja información comercial y términos de compra
 */
class ProveedoresModel {

    /**
     * Crear nuevo proveedor
     * @param {number} organizacionId
     * @param {Object} data
     * @returns {Object}
     */
    static async crear(organizacionId, data) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ProveedoresModel.crear] Iniciando', {
                organizacion_id: organizacionId,
                nombre: data.nombre
            });

            const query = `
                INSERT INTO proveedores (
                    organizacion_id, nombre, razon_social, rfc, telefono, email,
                    sitio_web, direccion, ciudad_id, estado_id, pais_id,
                    codigo_postal, dias_credito, dias_entrega_estimados,
                    monto_minimo_compra, notas, activo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING *
            `;

            const values = [
                organizacionId, data.nombre, data.razon_social || null,
                data.rfc || null, data.telefono || null, data.email || null,
                data.sitio_web || null, data.direccion || null, data.ciudad_id || null,
                data.estado_id || null, data.pais_id || null, data.codigo_postal || null,
                data.dias_credito !== undefined ? data.dias_credito : 0,
                data.dias_entrega_estimados || null, data.monto_minimo_compra || null,
                data.notas || null, data.activo !== undefined ? data.activo : true
            ];

            try {
                const result = await db.query(query, values);

                logger.info('[ProveedoresModel.crear] Proveedor creado', {
                    proveedor_id: result.rows[0].id
                });

                return result.rows[0];
            } catch (error) {
                // Manejar errores de constraint único
                if (error.code === '23505') {
                    if (error.constraint?.includes('nombre')) {
                        throw new DuplicateResourceError('Proveedor', 'nombre', data.nombre);
                    }
                    if (error.constraint?.includes('rfc')) {
                        throw new DuplicateResourceError('Proveedor', 'RFC', data.rfc);
                    }
                    throw new DuplicateResourceError('Proveedor', 'datos únicos');
                }
                throw error;
            }
        });
    }

    /**
     * Obtener proveedor por ID
     * @param {number} organizacionId
     * @param {number} id
     * @returns {Object|null}
     */
    static async buscarPorId(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    p.*,
                    COUNT(DISTINCT prod.id) AS total_productos,
                    COUNT(DISTINCT m.id) FILTER (
                        WHERE m.tipo_movimiento = 'entrada_compra'
                        AND m.creado_en >= NOW() - INTERVAL '30 days'
                    ) AS compras_ultimo_mes
                FROM proveedores p
                LEFT JOIN productos prod ON prod.proveedor_id = p.id AND prod.activo = true
                LEFT JOIN movimientos_inventario m ON m.proveedor_id = p.id
                WHERE p.id = $1
                GROUP BY p.id
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Listar proveedores con filtros opcionales
     * @param {number} organizacionId
     * @param {Object} filtros
     * @returns {Object}
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['p.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            // Filtro por activo
            if (filtros.activo !== undefined) {
                whereConditions.push(`p.activo = $${paramCounter}`);
                values.push(filtros.activo);
                paramCounter++;
            }

            // Búsqueda por nombre o razón social
            if (filtros.busqueda) {
                whereConditions.push(
                    `(p.nombre ILIKE $${paramCounter} OR p.razon_social ILIKE $${paramCounter})`
                );
                values.push(`%${filtros.busqueda}%`);
                paramCounter++;
            }

            // Filtro por ciudad (ID)
            if (filtros.ciudad_id) {
                whereConditions.push(`p.ciudad_id = $${paramCounter}`);
                values.push(filtros.ciudad_id);
                paramCounter++;
            }

            // Filtro por RFC
            if (filtros.rfc) {
                whereConditions.push(`p.rfc = $${paramCounter}`);
                values.push(filtros.rfc);
                paramCounter++;
            }

            const query = `
                SELECT
                    p.*,
                    COUNT(DISTINCT prod.id) AS total_productos,
                    COUNT(DISTINCT m.id) FILTER (
                        WHERE m.tipo_movimiento = 'entrada_compra'
                    ) AS total_compras
                FROM proveedores p
                LEFT JOIN productos prod ON prod.proveedor_id = p.id AND prod.activo = true
                LEFT JOIN movimientos_inventario m ON m.proveedor_id = p.id
                WHERE ${whereConditions.join(' AND ')}
                GROUP BY p.id
                ORDER BY p.nombre ASC
                LIMIT $${paramCounter}
                OFFSET $${paramCounter + 1}
            `;

            values.push(filtros.limit || 50);
            values.push(filtros.offset || 0);

            const result = await db.query(query, values);

            // Obtener total de registros
            const countQuery = `
                SELECT COUNT(*) as total
                FROM proveedores p
                WHERE ${whereConditions.join(' AND ')}
            `;

            const countResult = await db.query(countQuery, values.slice(0, values.length - 2));

            return {
                data: result.rows,
                total: parseInt(countResult.rows[0].total)
            };
        });
    }

    /**
     * Actualizar proveedor
     * @param {number} organizacionId
     * @param {number} id
     * @param {Object} data
     * @returns {Object}
     */
    static async actualizar(organizacionId, id, data) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ProveedoresModel.actualizar] Iniciando', {
                organizacion_id: organizacionId,
                proveedor_id: id
            });

            // Validar que el proveedor existe
            const existeQuery = await db.query(
                `SELECT id FROM proveedores WHERE id = $1`,
                [id]
            );

            if (existeQuery.rows.length === 0) {
                throw new Error('Proveedor no encontrado');
            }

            // Construir query de actualización dinámica
            const camposActualizables = [
                'nombre', 'razon_social', 'rfc', 'telefono', 'email', 'sitio_web',
                'direccion', 'ciudad_id', 'estado_id', 'pais_id', 'codigo_postal',
                'dias_credito', 'dias_entrega_estimados', 'monto_minimo_compra',
                'notas', 'activo'
            ];
            const updates = [];
            const values = [];
            let paramCounter = 1;

            camposActualizables.forEach(campo => {
                if (data[campo] !== undefined) {
                    updates.push(`${campo} = $${paramCounter}`);
                    values.push(data[campo]);
                    paramCounter++;
                }
            });

            if (updates.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            // Agregar ID al final
            values.push(id);

            const query = `
                UPDATE proveedores
                SET ${updates.join(', ')},
                    actualizado_en = NOW()
                WHERE id = $${paramCounter}
                RETURNING *
            `;

            const result = await db.query(query, values);

            logger.info('[ProveedoresModel.actualizar] Proveedor actualizado', {
                proveedor_id: id
            });

            return result.rows[0];
        });
    }

    /**
     * Eliminar proveedor (soft delete)
     * @param {number} organizacionId
     * @param {number} id
     * @returns {Object}
     */
    static async eliminar(organizacionId, id) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ProveedoresModel.eliminar] Iniciando', {
                organizacion_id: organizacionId,
                proveedor_id: id
            });

            // Verificar si tiene productos asociados
            const productosQuery = await db.query(
                `SELECT COUNT(*) as total FROM productos
                 WHERE proveedor_id = $1 AND activo = true`,
                [id]
            );

            if (parseInt(productosQuery.rows[0].total) > 0) {
                throw new Error('No se puede eliminar un proveedor que tiene productos activos asociados');
            }

            // Soft delete
            const query = `
                UPDATE proveedores
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [id]);

            logger.info('[ProveedoresModel.eliminar] Proveedor eliminado (soft delete)', {
                proveedor_id: id
            });

            return result.rows[0];
        });
    }

    /**
     * Obtener historial de compras de un proveedor
     */
    static async obtenerHistorialCompras(id, organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = [
                'm.proveedor_id = $1',
                "m.tipo_movimiento = 'entrada_compra'"
            ];
            let values = [id];
            let paramCounter = 2;

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

            const query = `
                SELECT
                    m.*,
                    p.nombre AS nombre_producto,
                    p.sku,
                    u.nombre AS nombre_usuario
                FROM movimientos_inventario m
                JOIN productos p ON p.id = m.producto_id
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
                    COUNT(*) as total_compras,
                    SUM(ABS(cantidad)) as total_unidades,
                    SUM(valor_total) as valor_total
                FROM movimientos_inventario m
                WHERE ${whereConditions.join(' AND ')}
            `;

            const totalesResult = await db.query(totalesQuery, values.slice(0, values.length - 2));

            return {
                compras: result.rows,
                totales: totalesResult.rows[0],
                limit: filtros.limit || 50,
                offset: filtros.offset || 0
            };
        });
    }
}

module.exports = ProveedoresModel;
