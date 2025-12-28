const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

/**
 * Model para CRUD de atributos de producto
 * Maneja tipos de atributos (Color, Talla) y sus valores
 */
class AtributosModel {

    // =========================================================================
    // ATRIBUTOS
    // =========================================================================

    /**
     * Crear un nuevo atributo
     */
    static async crear(datos, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const query = `
                INSERT INTO atributos_producto (
                    organizacion_id, nombre, codigo, tipo_visualizacion, orden
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;

            const values = [
                organizacionId,
                datos.nombre,
                datos.codigo.toUpperCase(),
                datos.tipo_visualizacion || 'dropdown',
                datos.orden || 0
            ];

            const result = await db.query(query, values);
            logger.info(`Atributo creado: ${result.rows[0].id} - ${datos.nombre}`);
            return result.rows[0];
        });
    }

    /**
     * Listar atributos de la organizacion con sus valores
     */
    static async listar(organizacionId, incluirInactivos = false) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    a.*,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', v.id,
                                'valor', v.valor,
                                'codigo', v.codigo,
                                'color_hex', v.color_hex,
                                'orden', v.orden
                            ) ORDER BY v.orden, v.valor
                        ) FILTER (WHERE v.id IS NOT NULL),
                        '[]'
                    ) as valores
                FROM atributos_producto a
                LEFT JOIN valores_atributo v ON v.atributo_id = a.id AND v.activo = true
                WHERE a.organizacion_id = $1
                ${incluirInactivos ? '' : 'AND a.activo = true'}
                GROUP BY a.id
                ORDER BY a.orden, a.nombre
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }

    /**
     * Obtener atributo por ID con sus valores
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener atributo
            const atributoQuery = `
                SELECT * FROM atributos_producto
                WHERE id = $1 AND organizacion_id = $2
            `;
            const atributoResult = await db.query(atributoQuery, [id, organizacionId]);

            if (atributoResult.rows.length === 0) {
                return null;
            }

            // Obtener valores
            const valoresQuery = `
                SELECT * FROM valores_atributo
                WHERE atributo_id = $1 AND activo = true
                ORDER BY orden, valor
            `;
            const valoresResult = await db.query(valoresQuery, [id]);

            return {
                ...atributoResult.rows[0],
                valores: valoresResult.rows
            };
        });
    }

    /**
     * Actualizar atributo
     */
    static async actualizar(id, datos, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const campos = [];
            const values = [];
            let idx = 1;

            if (datos.nombre !== undefined) {
                campos.push(`nombre = $${idx++}`);
                values.push(datos.nombre);
            }
            if (datos.codigo !== undefined) {
                campos.push(`codigo = $${idx++}`);
                values.push(datos.codigo.toUpperCase());
            }
            if (datos.tipo_visualizacion !== undefined) {
                campos.push(`tipo_visualizacion = $${idx++}`);
                values.push(datos.tipo_visualizacion);
            }
            if (datos.orden !== undefined) {
                campos.push(`orden = $${idx++}`);
                values.push(datos.orden);
            }
            if (datos.activo !== undefined) {
                campos.push(`activo = $${idx++}`);
                values.push(datos.activo);
            }

            if (campos.length === 0) {
                return await this.obtenerPorId(id, organizacionId);
            }

            values.push(id, organizacionId);

            const query = `
                UPDATE atributos_producto
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${idx++} AND organizacion_id = $${idx}
                RETURNING *
            `;

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Eliminar atributo (soft delete)
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que no tenga variantes asociadas
            const checkQuery = `
                SELECT COUNT(*) as total
                FROM variantes_atributos va
                JOIN variantes_producto vp ON vp.id = va.variante_id
                WHERE va.atributo_id = $1 AND vp.activo = true
            `;
            const checkResult = await db.query(checkQuery, [id]);

            if (parseInt(checkResult.rows[0].total) > 0) {
                throw new Error('No se puede eliminar: el atributo tiene variantes asociadas');
            }

            // Soft delete del atributo y sus valores
            await db.query(
                'UPDATE valores_atributo SET activo = false WHERE atributo_id = $1',
                [id]
            );

            const query = `
                UPDATE atributos_producto
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
                RETURNING *
            `;

            const result = await db.query(query, [id, organizacionId]);
            return result.rows[0];
        });
    }

    // =========================================================================
    // VALORES DE ATRIBUTO
    // =========================================================================

    /**
     * Agregar valor a un atributo
     */
    static async agregarValor(atributoId, datos, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const query = `
                INSERT INTO valores_atributo (
                    atributo_id, organizacion_id, valor, codigo, color_hex, orden
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;

            const values = [
                atributoId,
                organizacionId,
                datos.valor,
                datos.codigo.toUpperCase(),
                datos.color_hex || null,
                datos.orden || 0
            ];

            const result = await db.query(query, values);
            logger.info(`Valor agregado a atributo ${atributoId}: ${datos.valor}`);
            return result.rows[0];
        });
    }

    /**
     * Actualizar valor de atributo
     */
    static async actualizarValor(valorId, datos, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const campos = [];
            const values = [];
            let idx = 1;

            if (datos.valor !== undefined) {
                campos.push(`valor = $${idx++}`);
                values.push(datos.valor);
            }
            if (datos.codigo !== undefined) {
                campos.push(`codigo = $${idx++}`);
                values.push(datos.codigo.toUpperCase());
            }
            if (datos.color_hex !== undefined) {
                campos.push(`color_hex = $${idx++}`);
                values.push(datos.color_hex);
            }
            if (datos.orden !== undefined) {
                campos.push(`orden = $${idx++}`);
                values.push(datos.orden);
            }
            if (datos.activo !== undefined) {
                campos.push(`activo = $${idx++}`);
                values.push(datos.activo);
            }

            if (campos.length === 0) {
                const result = await db.query(
                    'SELECT * FROM valores_atributo WHERE id = $1',
                    [valorId]
                );
                return result.rows[0];
            }

            values.push(valorId, organizacionId);

            const query = `
                UPDATE valores_atributo
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${idx++} AND organizacion_id = $${idx}
                RETURNING *
            `;

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Eliminar valor de atributo (soft delete)
     */
    static async eliminarValor(valorId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que no tenga variantes asociadas
            const checkQuery = `
                SELECT COUNT(*) as total
                FROM variantes_atributos va
                JOIN variantes_producto vp ON vp.id = va.variante_id
                WHERE va.valor_id = $1 AND vp.activo = true
            `;
            const checkResult = await db.query(checkQuery, [valorId]);

            if (parseInt(checkResult.rows[0].total) > 0) {
                throw new Error('No se puede eliminar: el valor tiene variantes asociadas');
            }

            const query = `
                UPDATE valores_atributo
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
                RETURNING *
            `;

            const result = await db.query(query, [valorId, organizacionId]);
            return result.rows[0];
        });
    }

    /**
     * Obtener valores de un atributo
     */
    static async obtenerValores(atributoId, organizacionId, incluirInactivos = false) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM valores_atributo
                WHERE atributo_id = $1 AND organizacion_id = $2
                ${incluirInactivos ? '' : 'AND activo = true'}
                ORDER BY orden, valor
            `;

            const result = await db.query(query, [atributoId, organizacionId]);
            return result.rows;
        });
    }

    /**
     * Crear atributos por defecto para una organizacion
     */
    static async crearAtributosDefecto(organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            await db.query('SELECT crear_atributos_defecto($1)', [organizacionId]);
            return await this.listar(organizacionId);
        });
    }
}

module.exports = AtributosModel;
