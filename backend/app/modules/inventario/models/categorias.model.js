const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { ErrorHelper } = require('../../../utils/helpers');

/**
 * Model para CRUD de categorías de productos
 * Soporta jerarquía con categoria_padre_id
 */
class CategoriasProductosModel {

    /**
     * Crear nueva categoría de producto
     * @param {number} organizacionId
     * @param {Object} data
     * @returns {Object}
     */
    static async crear(organizacionId, data) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[CategoriasProductosModel.crear] Iniciando', {
                organizacion_id: organizacionId,
                nombre: data.nombre
            });

            // Si tiene categoria_padre_id, validar que existe y pertenece a la organización
            if (data.categoria_padre_id) {
                const padreQuery = await db.query(
                    `SELECT id FROM categorias_productos
                     WHERE id = $1 AND organizacion_id = $2`,
                    [data.categoria_padre_id, organizacionId]
                );

                ErrorHelper.throwIfNotFound(padreQuery.rows[0], 'Categoría padre');
            }

            const query = `
                INSERT INTO categorias_productos (
                    organizacion_id,
                    nombre,
                    descripcion,
                    categoria_padre_id,
                    icono,
                    color,
                    orden,
                    activo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.nombre,
                data.descripcion || null,
                data.categoria_padre_id || null,
                data.icono || null,
                data.color || null,
                data.orden !== undefined ? data.orden : 0,
                data.activo !== undefined ? data.activo : true
            ];

            const result = await db.query(query, values);

            logger.info('[CategoriasProductosModel.crear] Categoría creada', {
                categoria_id: result.rows[0].id
            });

            return result.rows[0];
        });
    }

    /**
     * Obtener categoría por ID
     * @param {number} organizacionId
     * @param {number} id
     * @returns {Object|null}
     */
    static async buscarPorId(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    c.*,
                    p.nombre AS nombre_categoria_padre
                FROM categorias_productos c
                LEFT JOIN categorias_productos p ON c.categoria_padre_id = p.id
                WHERE c.id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Listar categorías con filtros opcionales
     * @param {number} organizacionId
     * @param {Object} filtros
     * @returns {Object}
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['c.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            // Filtro por activo
            if (filtros.activo !== undefined) {
                whereConditions.push(`c.activo = $${paramCounter}`);
                values.push(filtros.activo);
                paramCounter++;
            }

            // Filtro por categoria_padre_id (incluir NULL para raíz)
            if (filtros.categoria_padre_id !== undefined) {
                if (filtros.categoria_padre_id === null) {
                    whereConditions.push(`c.categoria_padre_id IS NULL`);
                } else {
                    whereConditions.push(`c.categoria_padre_id = $${paramCounter}`);
                    values.push(filtros.categoria_padre_id);
                    paramCounter++;
                }
            }

            // Búsqueda por nombre
            if (filtros.busqueda) {
                whereConditions.push(`c.nombre ILIKE $${paramCounter}`);
                values.push(`%${filtros.busqueda}%`);
                paramCounter++;
            }

            const query = `
                SELECT
                    c.*,
                    p.nombre AS nombre_categoria_padre,
                    COUNT(prod.id) AS total_productos
                FROM categorias_productos c
                LEFT JOIN categorias_productos p ON c.categoria_padre_id = p.id
                LEFT JOIN productos prod ON prod.categoria_id = c.id AND prod.activo = true
                WHERE ${whereConditions.join(' AND ')}
                GROUP BY c.id, p.nombre
                ORDER BY c.orden ASC, c.nombre ASC
            `;

            const result = await db.query(query, values);

            return {
                data: result.rows,
                total: result.rows.length
            };
        });
    }

    /**
     * Obtener árbol jerárquico de categorías
     */
    static async obtenerArbol(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener todas las categorías activas
            const query = `
                SELECT
                    c.id,
                    c.nombre,
                    c.descripcion,
                    c.categoria_padre_id,
                    c.icono,
                    c.color,
                    c.orden,
                    c.activo,
                    COUNT(prod.id) AS total_productos
                FROM categorias_productos c
                LEFT JOIN productos prod ON prod.categoria_id = c.id AND prod.activo = true
                WHERE c.organizacion_id = $1 AND c.activo = true
                GROUP BY c.id
                ORDER BY c.orden ASC, c.nombre ASC
            `;

            const result = await db.query(query, [organizacionId]);
            const categorias = result.rows;

            // Construir árbol jerárquico
            const categoriasMap = {};
            const raiz = [];

            // Crear mapa de categorías
            categorias.forEach(cat => {
                categoriasMap[cat.id] = { ...cat, hijos: [] };
            });

            // Construir árbol
            categorias.forEach(cat => {
                if (cat.categoria_padre_id) {
                    if (categoriasMap[cat.categoria_padre_id]) {
                        categoriasMap[cat.categoria_padre_id].hijos.push(categoriasMap[cat.id]);
                    }
                } else {
                    raiz.push(categoriasMap[cat.id]);
                }
            });

            return raiz;
        });
    }

    /**
     * Actualizar categoría
     * @param {number} organizacionId
     * @param {number} id
     * @param {Object} data
     * @returns {Object}
     */
    static async actualizar(organizacionId, id, data) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[CategoriasProductosModel.actualizar] Iniciando', {
                organizacion_id: organizacionId,
                categoria_id: id
            });

            // Validar que la categoría existe
            const existeQuery = await db.query(
                `SELECT id FROM categorias_productos WHERE id = $1`,
                [id]
            );

            ErrorHelper.throwIfNotFound(existeQuery.rows[0], 'Categoría');

            // Si se está cambiando categoria_padre_id, validar
            if (data.categoria_padre_id !== undefined) {
                // No puede ser su propio padre
                if (data.categoria_padre_id === id) {
                    ErrorHelper.throwValidation('Una categoría no puede ser su propia categoría padre');
                }

                // Si tiene padre, validar que existe
                if (data.categoria_padre_id) {
                    const padreQuery = await db.query(
                        `SELECT id FROM categorias_productos
                         WHERE id = $1 AND organizacion_id = $2`,
                        [data.categoria_padre_id, organizacionId]
                    );

                    ErrorHelper.throwIfNotFound(padreQuery.rows[0], 'Categoría padre');

                    // Validar que no se crea un ciclo (padre no puede ser hijo de esta categoría)
                    const cicloQuery = await db.query(
                        `WITH RECURSIVE jerarquia AS (
                            SELECT id, categoria_padre_id, 1 AS nivel
                            FROM categorias_productos
                            WHERE id = $1
                            UNION ALL
                            SELECT c.id, c.categoria_padre_id, j.nivel + 1
                            FROM categorias_productos c
                            JOIN jerarquia j ON c.id = j.categoria_padre_id
                            WHERE j.nivel < 10
                        )
                        SELECT 1 FROM jerarquia WHERE id = $2
                        `,
                        [data.categoria_padre_id, id]
                    );

                    if (cicloQuery.rows.length > 0) {
                        ErrorHelper.throwValidation('No se puede crear un ciclo en la jerarquía de categorías');
                    }
                }
            }

            // Construir query de actualización dinámica
            const camposActualizables = ['nombre', 'descripcion', 'categoria_padre_id', 'icono', 'color', 'orden', 'activo'];
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
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            // Agregar ID al final
            values.push(id);

            const query = `
                UPDATE categorias_productos
                SET ${updates.join(', ')},
                    actualizado_en = NOW()
                WHERE id = $${paramCounter}
                RETURNING *
            `;

            const result = await db.query(query, values);

            logger.info('[CategoriasProductosModel.actualizar] Categoría actualizada', {
                categoria_id: id
            });

            return result.rows[0];
        });
    }

    /**
     * Eliminar categoría (soft delete)
     * @param {number} organizacionId
     * @param {number} id
     * @returns {Object}
     */
    static async eliminar(organizacionId, id) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[CategoriasProductosModel.eliminar] Iniciando', {
                organizacion_id: organizacionId,
                categoria_id: id
            });

            // Verificar si tiene productos asociados
            const productosQuery = await db.query(
                `SELECT COUNT(*) as total FROM productos
                 WHERE categoria_id = $1 AND activo = true`,
                [id]
            );

            if (parseInt(productosQuery.rows[0].total) > 0) {
                ErrorHelper.throwConflict('No se puede eliminar una categoría que tiene productos activos asociados');
            }

            // Verificar si tiene subcategorías
            const subcategoriasQuery = await db.query(
                `SELECT COUNT(*) as total FROM categorias_productos
                 WHERE categoria_padre_id = $1 AND activo = true`,
                [id]
            );

            if (parseInt(subcategoriasQuery.rows[0].total) > 0) {
                ErrorHelper.throwConflict('No se puede eliminar una categoría que tiene subcategorías activas');
            }

            // Soft delete
            const query = `
                UPDATE categorias_productos
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [id]);

            logger.info('[CategoriasProductosModel.eliminar] Categoría eliminada (soft delete)', {
                categoria_id: id
            });

            return result.rows[0];
        });
    }
}

module.exports = CategoriasProductosModel;
