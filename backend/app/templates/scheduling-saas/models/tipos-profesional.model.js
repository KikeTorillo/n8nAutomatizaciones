const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

class TiposProfesionalModel {

    /**
     * Listar tipos de profesional
     */
    static async listar(filtros = {}) {
        return await RLSContextManager.withBypass(async (dbClient) => {
            let whereClause = 'WHERE tp.activo = $1';
            const queryParams = [filtros.activo !== false];
            let paramCounter = 2;

            // Filtro: solo sistema
            if (filtros.solo_sistema) {
                whereClause = 'WHERE tp.activo = true AND tp.organizacion_id IS NULL';
            }
            // Filtro: solo personalizados de la org
            else if (filtros.solo_personalizados && filtros.organizacion_id) {
                whereClause = 'WHERE tp.activo = $1 AND tp.organizacion_id = $2';
                queryParams.push(filtros.organizacion_id);
                paramCounter++;
            }
            // Default: sistema + personalizados de la org
            else if (filtros.organizacion_id) {
                whereClause = 'WHERE tp.activo = $1 AND (tp.organizacion_id IS NULL OR tp.organizacion_id = $2)';
                queryParams.push(filtros.organizacion_id);
                paramCounter++;
            }

            // Filtro: por categoría compatible (Nov 2025: cambiado de tipo_industria)
            if (filtros.categoria_codigo) {
                whereClause += ` AND $${paramCounter} = ANY(tp.industrias_compatibles)`;
                queryParams.push(filtros.categoria_codigo);
                paramCounter++;
            }

            const query = `
                SELECT
                    tp.id,
                    tp.organizacion_id,
                    tp.codigo,
                    tp.nombre,
                    tp.descripcion,
                    tp.categoria,
                    tp.industrias_compatibles,
                    tp.requiere_licencia,
                    tp.nivel_experiencia_minimo,
                    tp.es_sistema,
                    tp.icono,
                    tp.color,
                    tp.activo,
                    tp.creado_en,
                    tp.actualizado_en,
                    (SELECT COUNT(*) FROM profesionales p
                     WHERE p.tipo_profesional_id = tp.id
                       AND p.activo = true
                    ) as profesionales_count
                FROM tipos_profesional tp
                ${whereClause}
                ORDER BY
                    tp.es_sistema DESC,
                    tp.categoria,
                    tp.nombre
            `;

            const result = await dbClient.query(query, queryParams);

            return {
                tipos: result.rows,
                total: result.rows.length,
                filtros_aplicados: {
                    organizacion_id: filtros.organizacion_id,
                    solo_sistema: filtros.solo_sistema || false,
                    solo_personalizados: filtros.solo_personalizados || false,
                    categoria_codigo: filtros.categoria_codigo,
                    activo: filtros.activo
                }
            };
        });
    }

    /**
     * Obtener tipo por ID
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.withBypass(async (dbClient) => {
            const query = `
                SELECT
                    tp.id,
                    tp.organizacion_id,
                    tp.codigo,
                    tp.nombre,
                    tp.descripcion,
                    tp.categoria,
                    tp.industrias_compatibles,
                    tp.requiere_licencia,
                    tp.nivel_experiencia_minimo,
                    tp.es_sistema,
                    tp.icono,
                    tp.color,
                    tp.metadata,
                    tp.activo,
                    tp.creado_en,
                    tp.actualizado_en
                FROM tipos_profesional tp
                WHERE tp.id = $1
                  AND (tp.organizacion_id IS NULL OR tp.organizacion_id = $2)
            `;

            const result = await dbClient.query(query, [id, organizacionId]);

            if (result.rows.length === 0) {
                throw new Error('Tipo de profesional no encontrado');
            }

            return result.rows[0];
        });
    }

    /**
     * Crear tipo personalizado
     */
    static async crear(datosTipo) {
        return await RLSContextManager.transaction(datosTipo.organizacion_id, async (dbClient) => {

            // Validar que no existe un tipo con el mismo código en la org
            const existente = await dbClient.query(`
                SELECT id FROM tipos_profesional
                WHERE codigo = $1
                  AND (organizacion_id = $2 OR organizacion_id IS NULL)
            `, [datosTipo.codigo, datosTipo.organizacion_id]);

            if (existente.rows.length > 0) {
                throw new Error('Ya existe un tipo de profesional con este código');
            }

            const query = `
                INSERT INTO tipos_profesional (
                    organizacion_id, codigo, nombre, descripcion,
                    categoria, industrias_compatibles, requiere_licencia,
                    nivel_experiencia_minimo, icono, color, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;

            const result = await dbClient.query(query, [
                datosTipo.organizacion_id,
                datosTipo.codigo,
                datosTipo.nombre,
                datosTipo.descripcion || null,
                datosTipo.categoria || 'otro',
                datosTipo.industrias_compatibles || [],
                datosTipo.requiere_licencia || false,
                datosTipo.nivel_experiencia_minimo || 0,
                datosTipo.icono || 'User',
                datosTipo.color || '#808080',
                datosTipo.metadata || {}
            ]);

            logger.info('[TiposProfesionalModel.crear] Tipo personalizado creado', {
                id: result.rows[0].id,
                codigo: result.rows[0].codigo,
                organizacion_id: datosTipo.organizacion_id
            });

            return result.rows[0];
        });
    }

    /**
     * Actualizar tipo personalizado
     */
    static async actualizar(id, organizacionId, datosActualizacion) {
        return await RLSContextManager.transaction(organizacionId, async (dbClient) => {

            const tipoExistente = await dbClient.query(`
                SELECT id, es_sistema, organizacion_id
                FROM tipos_profesional
                WHERE id = $1 AND organizacion_id = $2
            `, [id, organizacionId]);

            if (tipoExistente.rows.length === 0) {
                throw new Error('Tipo de profesional no encontrado o no tienes permiso para modificarlo');
            }

            if (tipoExistente.rows[0].es_sistema) {
                throw new Error('No se pueden modificar tipos de sistema');
            }

            const camposPermitidos = [
                'nombre', 'descripcion', 'categoria', 'industrias_compatibles',
                'requiere_licencia', 'nivel_experiencia_minimo', 'icono',
                'color', 'metadata', 'activo'
            ];

            const camposActualizar = [];
            const valoresActualizar = [id, organizacionId];
            let paramCounter = 3;

            for (const campo of camposPermitidos) {
                if (datosActualizacion.hasOwnProperty(campo)) {
                    camposActualizar.push(`${campo} = $${paramCounter}`);
                    valoresActualizar.push(datosActualizacion[campo]);
                    paramCounter++;
                }
            }

            if (camposActualizar.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            const query = `
                UPDATE tipos_profesional
                SET ${camposActualizar.join(', ')}, actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
                RETURNING *
            `;

            const result = await dbClient.query(query, valoresActualizar);

            logger.info('[TiposProfesionalModel.actualizar] Tipo actualizado', {
                id,
                organizacion_id: organizacionId
            });

            return result.rows[0];
        });
    }

    /**
     * Eliminar tipo personalizado (soft delete)
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (dbClient) => {

            const tipoExistente = await dbClient.query(`
                SELECT id, es_sistema, codigo
                FROM tipos_profesional
                WHERE id = $1 AND organizacion_id = $2
            `, [id, organizacionId]);

            if (tipoExistente.rows.length === 0) {
                throw new Error('Tipo de profesional no encontrado');
            }

            if (tipoExistente.rows[0].es_sistema) {
                throw new Error('No se pueden eliminar tipos de sistema');
            }

            const profesionalesUsando = await dbClient.query(`
                SELECT COUNT(*) as count
                FROM profesionales
                WHERE tipo_profesional_id = $1 AND activo = true
            `, [id]);

            if (parseInt(profesionalesUsando.rows[0].count) > 0) {
                throw new Error('No se puede eliminar el tipo porque hay profesionales activos usándolo');
            }

            await dbClient.query(`
                UPDATE tipos_profesional
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
            `, [id, organizacionId]);

            logger.info('[TiposProfesionalModel.eliminar] Tipo eliminado (soft delete)', {
                id,
                codigo: tipoExistente.rows[0].codigo,
                organizacion_id: organizacionId
            });

            return { success: true };
        });
    }
}

module.exports = TiposProfesionalModel;
