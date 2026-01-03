/**
 * EducacionFormalModel - Enero 2026
 * Gestión de educación y formación académica de profesionales
 * Fase 4 del Plan de Empleados Competitivo
 */
const RLSContextManager = require('../../../utils/rlsContextManager');

class EducacionFormalModel {

    /**
     * Crea un nuevo registro de educación formal
     * @param {Object} data - Datos de la educación
     * @returns {Promise<Object>} Educación creada
     */
    static async crear(data) {
        return await RLSContextManager.query(data.organizacion_id, async (db) => {
            // Obtener el orden máximo actual
            const ordenQuery = `
                SELECT COALESCE(MAX(orden), -1) + 1 as next_orden
                FROM educacion_formal
                WHERE organizacion_id = $1 AND profesional_id = $2 AND eliminado_en IS NULL
            `;
            const ordenResult = await db.query(ordenQuery, [data.organizacion_id, data.profesional_id]);
            const nextOrden = ordenResult.rows[0].next_orden;

            const query = `
                INSERT INTO educacion_formal (
                    organizacion_id, profesional_id,
                    institucion, titulo, nivel, campo_estudio,
                    fecha_inicio, fecha_fin, en_curso,
                    descripcion, promedio, numero_cedula, ubicacion,
                    orden, creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            `;

            const values = [
                data.organizacion_id,
                data.profesional_id,
                data.institucion,
                data.titulo,
                data.nivel,
                data.campo_estudio || null,
                data.fecha_inicio,
                data.en_curso ? null : (data.fecha_fin || null),
                data.en_curso || false,
                data.descripcion || null,
                data.promedio || null,
                data.numero_cedula || null,
                data.ubicacion || null,
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
                    if (error.constraint?.includes('institucion')) {
                        throw new Error('El nombre de la institución debe tener al menos 2 caracteres');
                    }
                    if (error.constraint?.includes('titulo')) {
                        throw new Error('El título debe tener al menos 2 caracteres');
                    }
                }
                if (error.code === '22P02') {
                    throw new Error('El nivel de educación especificado no es válido');
                }
                throw error;
            }
        });
    }

    /**
     * Lista educación formal de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>} Lista de educación
     */
    static async listarPorProfesional(organizacionId, profesionalId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                nivel = null,
                en_curso = null,
                limite = 20,
                offset = 0
            } = filtros;

            let query = `
                SELECT
                    e.*,
                    uc.nombre as creado_por_nombre
                FROM educacion_formal e
                LEFT JOIN usuarios uc ON uc.id = e.creado_por
                WHERE e.organizacion_id = $1
                    AND e.profesional_id = $2
                    AND e.eliminado_en IS NULL
            `;

            const values = [organizacionId, profesionalId];
            let contador = 3;

            if (nivel !== null) {
                query += ` AND e.nivel = $${contador}`;
                values.push(nivel);
                contador++;
            }

            if (en_curso !== null) {
                query += ` AND e.en_curso = $${contador}`;
                values.push(en_curso);
                contador++;
            }

            // Ordenar por: estudios en curso primero, luego por nivel (mayor a menor), luego por orden
            query += ` ORDER BY e.en_curso DESC,
                CASE e.nivel
                    WHEN 'doctorado' THEN 1
                    WHEN 'maestria' THEN 2
                    WHEN 'especialidad' THEN 3
                    WHEN 'licenciatura' THEN 4
                    WHEN 'tecnica' THEN 5
                    WHEN 'preparatoria' THEN 6
                    WHEN 'intermedia' THEN 7
                    WHEN 'basica' THEN 8
                END ASC,
                e.orden ASC, e.fecha_inicio DESC`;
            query += ` LIMIT $${contador} OFFSET $${contador + 1}`;
            values.push(limite, offset);

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Obtiene un registro de educación por su ID
     * @param {number} organizacionId - ID de la organización
     * @param {number} educacionId - ID de la educación
     * @returns {Promise<Object|null>} Educación o null
     */
    static async obtenerPorId(organizacionId, educacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    e.*,
                    p.nombre_completo as profesional_nombre,
                    uc.nombre as creado_por_nombre,
                    ua.nombre as actualizado_por_nombre
                FROM educacion_formal e
                JOIN profesionales p ON p.id = e.profesional_id
                LEFT JOIN usuarios uc ON uc.id = e.creado_por
                LEFT JOIN usuarios ua ON ua.id = e.actualizado_por
                WHERE e.id = $1
                    AND e.organizacion_id = $2
                    AND e.eliminado_en IS NULL
            `;

            const result = await db.query(query, [educacionId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualiza un registro de educación existente
     * @param {number} organizacionId - ID de la organización
     * @param {number} educacionId - ID de la educación
     * @param {Object} datos - Datos a actualizar
     * @param {number} usuarioId - ID del usuario que actualiza
     * @returns {Promise<Object>} Educación actualizada
     */
    static async actualizar(organizacionId, educacionId, datos, usuarioId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposPermitidos = [
                'institucion', 'titulo', 'nivel', 'campo_estudio',
                'fecha_inicio', 'fecha_fin', 'en_curso',
                'descripcion', 'promedio', 'numero_cedula', 'ubicacion', 'orden'
            ];

            const campos = [];
            const valores = [];
            let contador = 1;

            for (const [campo, valor] of Object.entries(datos)) {
                if (camposPermitidos.includes(campo) && valor !== undefined) {
                    // Si está en curso, fecha_fin debe ser null
                    if (campo === 'en_curso' && valor === true) {
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
                UPDATE educacion_formal
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${contador} AND organizacion_id = $${contador + 1}
                    AND eliminado_en IS NULL
                RETURNING *
            `;

            valores.push(educacionId, organizacionId);

            try {
                const result = await db.query(query, valores);

                if (result.rows.length === 0) {
                    throw new Error('Registro de educación no encontrado');
                }

                return result.rows[0];
            } catch (error) {
                if (error.code === '23514') {
                    if (error.constraint?.includes('fechas')) {
                        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
                    }
                }
                if (error.code === '22P02') {
                    throw new Error('El nivel de educación especificado no es válido');
                }
                throw error;
            }
        });
    }

    /**
     * Soft delete de un registro de educación
     * @param {number} organizacionId - ID de la organización
     * @param {number} educacionId - ID de la educación
     * @param {number} usuarioId - ID del usuario que elimina
     * @returns {Promise<boolean>} true si se eliminó
     */
    static async eliminar(organizacionId, educacionId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE educacion_formal
                SET activo = false,
                    eliminado_en = NOW(),
                    eliminado_por = $3
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
                RETURNING id
            `;

            const result = await db.query(query, [educacionId, organizacionId, usuarioId]);
            return result.rowCount > 0;
        });
    }

    /**
     * Reordena los registros de educación de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {Array} ordenItems - Array de {id, orden}
     * @returns {Promise<boolean>} true si se reordenó
     */
    static async reordenar(organizacionId, profesionalId, ordenItems) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            for (const item of ordenItems) {
                await db.query(`
                    UPDATE educacion_formal
                    SET orden = $1, actualizado_en = NOW()
                    WHERE id = $2 AND organizacion_id = $3 AND profesional_id = $4
                        AND eliminado_en IS NULL
                `, [item.orden, item.id, organizacionId, profesionalId]);
            }
            return true;
        });
    }

    /**
     * Cuenta registros de educación de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @returns {Promise<Object>} Conteo de educación
     */
    static async contarPorProfesional(organizacionId, profesionalId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE en_curso = true) as en_curso,
                    MAX(CASE nivel
                        WHEN 'doctorado' THEN 8
                        WHEN 'maestria' THEN 7
                        WHEN 'especialidad' THEN 6
                        WHEN 'licenciatura' THEN 5
                        WHEN 'tecnica' THEN 4
                        WHEN 'preparatoria' THEN 3
                        WHEN 'intermedia' THEN 2
                        WHEN 'basica' THEN 1
                        ELSE 0
                    END) as nivel_maximo_num,
                    (SELECT nivel FROM educacion_formal e2
                     WHERE e2.organizacion_id = $1 AND e2.profesional_id = $2
                     AND e2.eliminado_en IS NULL AND e2.activo = true
                     ORDER BY CASE e2.nivel
                        WHEN 'doctorado' THEN 8
                        WHEN 'maestria' THEN 7
                        WHEN 'especialidad' THEN 6
                        WHEN 'licenciatura' THEN 5
                        WHEN 'tecnica' THEN 4
                        WHEN 'preparatoria' THEN 3
                        WHEN 'intermedia' THEN 2
                        WHEN 'basica' THEN 1
                        ELSE 0
                     END DESC LIMIT 1) as nivel_maximo
                FROM educacion_formal
                WHERE organizacion_id = $1
                    AND profesional_id = $2
                    AND eliminado_en IS NULL
                    AND activo = true
            `;

            const result = await db.query(query, [organizacionId, profesionalId]);
            const row = result.rows[0];

            return {
                total: parseInt(row.total) || 0,
                en_curso: parseInt(row.en_curso) || 0,
                nivel_maximo: row.nivel_maximo || null
            };
        });
    }

    /**
     * Obtiene estudios en curso de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @returns {Promise<Array>} Estudios en curso
     */
    static async obtenerEstudiosEnCurso(organizacionId, profesionalId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT *
                FROM educacion_formal
                WHERE organizacion_id = $1
                    AND profesional_id = $2
                    AND en_curso = true
                    AND eliminado_en IS NULL
                    AND activo = true
                ORDER BY fecha_inicio DESC
            `;

            const result = await db.query(query, [organizacionId, profesionalId]);
            return result.rows;
        });
    }

    /**
     * Busca profesionales por nivel educativo en la organización
     * @param {number} organizacionId - ID de la organización
     * @param {string} nivel - Nivel educativo a buscar
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>} Lista de profesionales con ese nivel
     */
    static async buscarPorNivel(organizacionId, nivel, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { limite = 50, offset = 0 } = filtros;

            const query = `
                SELECT DISTINCT ON (p.id)
                    p.id as profesional_id,
                    p.nombre_completo,
                    p.email,
                    p.puesto,
                    e.institucion,
                    e.titulo,
                    e.nivel,
                    e.campo_estudio
                FROM educacion_formal e
                JOIN profesionales p ON p.id = e.profesional_id
                WHERE e.organizacion_id = $1
                    AND e.nivel = $2
                    AND e.eliminado_en IS NULL
                    AND e.activo = true
                    AND p.eliminado_en IS NULL
                    AND p.activo = true
                ORDER BY p.id, e.fecha_inicio DESC
                LIMIT $3 OFFSET $4
            `;

            const result = await db.query(query, [organizacionId, nivel, limite, offset]);
            return result.rows;
        });
    }

}

module.exports = EducacionFormalModel;
