/**
 * ExperienciaModel - Enero 2026
 * Gestión de experiencia laboral de empleados
 * Fase 4 del Plan de Empleados Competitivo
 */
const RLSContextManager = require('../../../utils/rlsContextManager');

class ExperienciaModel {

    /**
     * Crea una nueva experiencia laboral
     * @param {Object} data - Datos de la experiencia
     * @returns {Promise<Object>} Experiencia creada
     */
    static async crear(data) {
        return await RLSContextManager.query(data.organizacion_id, async (db) => {
            // Obtener el orden máximo actual
            const ordenQuery = `
                SELECT COALESCE(MAX(orden), -1) + 1 as next_orden
                FROM experiencia_laboral
                WHERE organizacion_id = $1 AND profesional_id = $2 AND eliminado_en IS NULL
            `;
            const ordenResult = await db.query(ordenQuery, [data.organizacion_id, data.profesional_id]);
            const nextOrden = ordenResult.rows[0].next_orden;

            const query = `
                INSERT INTO experiencia_laboral (
                    organizacion_id, profesional_id,
                    empresa, puesto, descripcion, ubicacion,
                    fecha_inicio, fecha_fin, es_empleo_actual,
                    sector_industria, tamanio_empresa, motivo_salida,
                    contacto_referencia, telefono_referencia,
                    orden, creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING *
            `;

            const values = [
                data.organizacion_id,
                data.profesional_id,
                data.empresa,
                data.puesto,
                data.descripcion || null,
                data.ubicacion || null,
                data.fecha_inicio,
                data.es_empleo_actual ? null : (data.fecha_fin || null),
                data.es_empleo_actual || false,
                data.sector_industria || null,
                data.tamanio_empresa || null,
                data.motivo_salida || null,
                data.contacto_referencia || null,
                data.telefono_referencia || null,
                nextOrden,
                data.creado_por || null
            ];

            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (error) {
                if (error.code === '23503') {
                    if (error.constraint?.includes('profesional')) {
                        throw new Error('El profesional especificado no existe');
                    }
                }
                if (error.code === '23514') {
                    if (error.constraint?.includes('fechas')) {
                        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
                    }
                    if (error.constraint?.includes('empresa')) {
                        throw new Error('El nombre de la empresa debe tener al menos 2 caracteres');
                    }
                    if (error.constraint?.includes('puesto')) {
                        throw new Error('El puesto debe tener al menos 2 caracteres');
                    }
                }
                throw error;
            }
        });
    }

    /**
     * Lista experiencias laborales de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>} Lista de experiencias
     */
    static async listarPorProfesional(organizacionId, profesionalId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                es_empleo_actual = null,
                limit = 20,
                offset = 0
            } = filtros;

            let query = `
                SELECT
                    e.*,
                    uc.nombre as creado_por_nombre
                FROM experiencia_laboral e
                LEFT JOIN usuarios uc ON uc.id = e.creado_por
                WHERE e.organizacion_id = $1
                    AND e.profesional_id = $2
                    AND e.eliminado_en IS NULL
            `;

            const values = [organizacionId, profesionalId];
            let contador = 3;

            if (es_empleo_actual !== null) {
                query += ` AND e.es_empleo_actual = $${contador}`;
                values.push(es_empleo_actual);
                contador++;
            }

            // Ordenar por empleo actual primero, luego por orden personalizado
            query += ` ORDER BY e.es_empleo_actual DESC, e.orden ASC, e.fecha_inicio DESC`;
            query += ` LIMIT $${contador} OFFSET $${contador + 1}`;
            values.push(limit, offset);

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Obtiene una experiencia por su ID
     * @param {number} organizacionId - ID de la organización
     * @param {number} experienciaId - ID de la experiencia
     * @returns {Promise<Object|null>} Experiencia o null
     */
    static async obtenerPorId(organizacionId, experienciaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    e.*,
                    p.nombre_completo as profesional_nombre,
                    uc.nombre as creado_por_nombre,
                    ua.nombre as actualizado_por_nombre
                FROM experiencia_laboral e
                JOIN profesionales p ON p.id = e.profesional_id
                LEFT JOIN usuarios uc ON uc.id = e.creado_por
                LEFT JOIN usuarios ua ON ua.id = e.actualizado_por
                WHERE e.id = $1
                    AND e.organizacion_id = $2
                    AND e.eliminado_en IS NULL
            `;

            const result = await db.query(query, [experienciaId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualiza una experiencia laboral existente
     * @param {number} organizacionId - ID de la organización
     * @param {number} experienciaId - ID de la experiencia
     * @param {Object} datos - Datos a actualizar
     * @param {number} usuarioId - ID del usuario que actualiza
     * @returns {Promise<Object>} Experiencia actualizada
     */
    static async actualizar(organizacionId, experienciaId, datos, usuarioId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposPermitidos = [
                'empresa', 'puesto', 'descripcion', 'ubicacion',
                'fecha_inicio', 'fecha_fin', 'es_empleo_actual',
                'sector_industria', 'tamanio_empresa', 'motivo_salida',
                'contacto_referencia', 'telefono_referencia', 'orden'
            ];

            const campos = [];
            const valores = [];
            let contador = 1;

            for (const [campo, valor] of Object.entries(datos)) {
                if (camposPermitidos.includes(campo) && valor !== undefined) {
                    // Si es empleo actual, fecha_fin debe ser null
                    if (campo === 'es_empleo_actual' && valor === true) {
                        campos.push(`fecha_fin = NULL`);
                    }
                    campos.push(`${campo} = $${contador}`);
                    valores.push(valor);
                    contador++;
                }
            }

            if (campos.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }

            // Agregar actualizado_por si se proporciona
            if (usuarioId) {
                campos.push(`actualizado_por = $${contador}`);
                valores.push(usuarioId);
                contador++;
            }

            const query = `
                UPDATE experiencia_laboral
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${contador} AND organizacion_id = $${contador + 1}
                    AND eliminado_en IS NULL
                RETURNING *
            `;

            valores.push(experienciaId, organizacionId);

            try {
                const result = await db.query(query, valores);

                if (result.rows.length === 0) {
                    throw new Error('Experiencia no encontrada');
                }

                return result.rows[0];
            } catch (error) {
                if (error.code === '23514') {
                    if (error.constraint?.includes('fechas')) {
                        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
                    }
                }
                throw error;
            }
        });
    }

    /**
     * Soft delete de una experiencia
     * @param {number} organizacionId - ID de la organización
     * @param {number} experienciaId - ID de la experiencia
     * @param {number} usuarioId - ID del usuario que elimina
     * @returns {Promise<boolean>} true si se eliminó
     */
    static async eliminar(organizacionId, experienciaId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE experiencia_laboral
                SET activo = false,
                    eliminado_en = NOW(),
                    eliminado_por = $3
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
                RETURNING id
            `;

            const result = await db.query(query, [experienciaId, organizacionId, usuarioId]);
            return result.rowCount > 0;
        });
    }

    /**
     * Reordena las experiencias de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {Array} ordenItems - Array de {id, orden}
     * @returns {Promise<boolean>} true si se reordenó
     */
    static async reordenar(organizacionId, profesionalId, ordenItems) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            for (const item of ordenItems) {
                await db.query(`
                    UPDATE experiencia_laboral
                    SET orden = $1, actualizado_en = NOW()
                    WHERE id = $2 AND organizacion_id = $3 AND profesional_id = $4
                        AND eliminado_en IS NULL
                `, [item.orden, item.id, organizacionId, profesionalId]);
            }
            return true;
        });
    }

    /**
     * Cuenta el número de experiencias de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @returns {Promise<Object>} Conteo de experiencias
     */
    static async contarPorProfesional(organizacionId, profesionalId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE es_empleo_actual = true) as actuales
                FROM experiencia_laboral
                WHERE organizacion_id = $1
                    AND profesional_id = $2
                    AND eliminado_en IS NULL
                    AND activo = true
            `;

            const result = await db.query(query, [organizacionId, profesionalId]);
            const row = result.rows[0];

            return {
                total: parseInt(row.total) || 0,
                actuales: parseInt(row.actuales) || 0
            };
        });
    }

    /**
     * Obtiene el empleo actual de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @returns {Promise<Object|null>} Empleo actual o null
     */
    static async obtenerEmpleoActual(organizacionId, profesionalId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT *
                FROM experiencia_laboral
                WHERE organizacion_id = $1
                    AND profesional_id = $2
                    AND es_empleo_actual = true
                    AND eliminado_en IS NULL
                    AND activo = true
            `;

            const result = await db.query(query, [organizacionId, profesionalId]);
            return result.rows[0] || null;
        });
    }

}

module.exports = ExperienciaModel;
