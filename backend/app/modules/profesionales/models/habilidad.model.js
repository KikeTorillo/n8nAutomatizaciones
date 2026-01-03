/**
 * HabilidadModel - Enero 2026
 * Gestión de catálogo de habilidades y habilidades de empleados
 * Fase 4 del Plan de Empleados Competitivo
 */
const RLSContextManager = require('../../../utils/rlsContextManager');

// ====================================================================
// CATÁLOGO DE HABILIDADES (tabla maestra por organización)
// ====================================================================

class CatalogoHabilidadesModel {

    /**
     * Crea una nueva habilidad en el catálogo
     * @param {Object} data - Datos de la habilidad
     * @returns {Promise<Object>} Habilidad creada
     */
    static async crear(data) {
        return await RLSContextManager.query(data.organizacion_id, async (db) => {
            const query = `
                INSERT INTO catalogo_habilidades (
                    organizacion_id, nombre, categoria,
                    descripcion, icono, color, creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const values = [
                data.organizacion_id,
                data.nombre,
                data.categoria,
                data.descripcion || null,
                data.icono || null,
                data.color || null,
                data.creado_por || null
            ];

            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (error) {
                if (error.code === '23505') {
                    throw new Error('Ya existe una habilidad con este nombre en la organización');
                }
                if (error.code === '23514') {
                    if (error.constraint?.includes('nombre')) {
                        throw new Error('El nombre de la habilidad debe tener al menos 2 caracteres');
                    }
                }
                if (error.code === '22P02') {
                    throw new Error('La categoría especificada no es válida');
                }
                throw error;
            }
        });
    }

    /**
     * Lista habilidades del catálogo
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>} Lista de habilidades
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                categoria = null,
                busqueda = null,
                limite = 100,
                offset = 0
            } = filtros;

            let query = `
                SELECT
                    ch.*,
                    uc.nombre as creado_por_nombre,
                    (SELECT COUNT(*) FROM habilidades_empleado he
                     WHERE he.habilidad_id = ch.id AND he.eliminado_en IS NULL) as total_empleados
                FROM catalogo_habilidades ch
                LEFT JOIN usuarios uc ON uc.id = ch.creado_por
                WHERE ch.organizacion_id = $1
                    AND ch.eliminado_en IS NULL
                    AND ch.activo = true
            `;

            const values = [organizacionId];
            let contador = 2;

            if (categoria) {
                query += ` AND ch.categoria = $${contador}`;
                values.push(categoria);
                contador++;
            }

            if (busqueda) {
                query += ` AND LOWER(ch.nombre) LIKE LOWER($${contador})`;
                values.push(`%${busqueda}%`);
                contador++;
            }

            query += ` ORDER BY ch.categoria ASC, ch.nombre ASC`;
            query += ` LIMIT $${contador} OFFSET $${contador + 1}`;
            values.push(limite, offset);

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Obtiene una habilidad del catálogo por su ID
     * @param {number} organizacionId - ID de la organización
     * @param {number} habilidadId - ID de la habilidad
     * @returns {Promise<Object|null>} Habilidad o null
     */
    static async obtenerPorId(organizacionId, habilidadId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    ch.*,
                    uc.nombre as creado_por_nombre,
                    (SELECT COUNT(*) FROM habilidades_empleado he
                     WHERE he.habilidad_id = ch.id AND he.eliminado_en IS NULL) as total_empleados
                FROM catalogo_habilidades ch
                LEFT JOIN usuarios uc ON uc.id = ch.creado_por
                WHERE ch.id = $1
                    AND ch.organizacion_id = $2
                    AND ch.eliminado_en IS NULL
            `;

            const result = await db.query(query, [habilidadId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualiza una habilidad del catálogo
     * @param {number} organizacionId - ID de la organización
     * @param {number} habilidadId - ID de la habilidad
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object>} Habilidad actualizada
     */
    static async actualizar(organizacionId, habilidadId, datos) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposPermitidos = ['nombre', 'categoria', 'descripcion', 'icono', 'color'];

            const campos = [];
            const valores = [];
            let contador = 1;

            for (const [campo, valor] of Object.entries(datos)) {
                if (camposPermitidos.includes(campo) && valor !== undefined) {
                    campos.push(`${campo} = $${contador}`);
                    valores.push(valor);
                    contador++;
                }
            }

            if (campos.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }

            const query = `
                UPDATE catalogo_habilidades
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${contador} AND organizacion_id = $${contador + 1}
                    AND eliminado_en IS NULL
                RETURNING *
            `;

            valores.push(habilidadId, organizacionId);

            try {
                const result = await db.query(query, valores);

                if (result.rows.length === 0) {
                    throw new Error('Habilidad no encontrada');
                }

                return result.rows[0];
            } catch (error) {
                if (error.code === '23505') {
                    throw new Error('Ya existe una habilidad con este nombre');
                }
                throw error;
            }
        });
    }

    /**
     * Soft delete de una habilidad del catálogo
     * @param {number} organizacionId - ID de la organización
     * @param {number} habilidadId - ID de la habilidad
     * @param {number} usuarioId - ID del usuario que elimina
     * @returns {Promise<boolean>} true si se eliminó
     */
    static async eliminar(organizacionId, habilidadId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar si hay empleados con esta habilidad
            const checkQuery = `
                SELECT COUNT(*) as count
                FROM habilidades_empleado
                WHERE habilidad_id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
            `;
            const checkResult = await db.query(checkQuery, [habilidadId, organizacionId]);

            if (parseInt(checkResult.rows[0].count) > 0) {
                throw new Error('No se puede eliminar: hay empleados con esta habilidad asignada');
            }

            const query = `
                UPDATE catalogo_habilidades
                SET activo = false,
                    eliminado_en = NOW(),
                    eliminado_por = $3
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
                RETURNING id
            `;

            const result = await db.query(query, [habilidadId, organizacionId, usuarioId]);
            return result.rowCount > 0;
        });
    }

    /**
     * Cuenta habilidades por categoría
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Conteo por categoría
     */
    static async contarPorCategoria(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    categoria,
                    COUNT(*) as total
                FROM catalogo_habilidades
                WHERE organizacion_id = $1
                    AND eliminado_en IS NULL
                    AND activo = true
                GROUP BY categoria
                ORDER BY categoria
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }
}

// ====================================================================
// HABILIDADES DE EMPLEADO (relación M:N con nivel)
// ====================================================================

class HabilidadEmpleadoModel {

    /**
     * Asigna una habilidad a un empleado
     * @param {Object} data - Datos de la asignación
     * @returns {Promise<Object>} Asignación creada
     */
    static async asignar(data) {
        return await RLSContextManager.query(data.organizacion_id, async (db) => {
            const query = `
                INSERT INTO habilidades_empleado (
                    organizacion_id, profesional_id, habilidad_id,
                    nivel, anios_experiencia, notas, certificaciones,
                    creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const values = [
                data.organizacion_id,
                data.profesional_id,
                data.habilidad_id,
                data.nivel || 'basico',
                data.anios_experiencia || 0,
                data.notas || null,
                data.certificaciones || null,
                data.creado_por || null
            ];

            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (error) {
                if (error.code === '23505') {
                    throw new Error('El empleado ya tiene asignada esta habilidad');
                }
                if (error.code === '23503') {
                    if (error.constraint?.includes('profesional')) {
                        throw new Error('El profesional especificado no existe');
                    }
                    if (error.constraint?.includes('habilidad')) {
                        throw new Error('La habilidad especificada no existe en el catálogo');
                    }
                }
                if (error.code === '22P02') {
                    throw new Error('El nivel de habilidad especificado no es válido');
                }
                throw error;
            }
        });
    }

    /**
     * Lista habilidades de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>} Lista de habilidades del empleado
     */
    static async listarPorProfesional(organizacionId, profesionalId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                categoria = null,
                nivel = null,
                verificado = null,
                limite = 50,
                offset = 0
            } = filtros;

            let query = `
                SELECT
                    he.*,
                    ch.nombre as habilidad_nombre,
                    ch.categoria as habilidad_categoria,
                    ch.descripcion as habilidad_descripcion,
                    ch.icono as habilidad_icono,
                    ch.color as habilidad_color,
                    uv.nombre as verificado_por_nombre,
                    uc.nombre as creado_por_nombre
                FROM habilidades_empleado he
                JOIN catalogo_habilidades ch ON ch.id = he.habilidad_id
                LEFT JOIN usuarios uv ON uv.id = he.verificado_por
                LEFT JOIN usuarios uc ON uc.id = he.creado_por
                WHERE he.organizacion_id = $1
                    AND he.profesional_id = $2
                    AND he.eliminado_en IS NULL
                    AND he.activo = true
            `;

            const values = [organizacionId, profesionalId];
            let contador = 3;

            if (categoria) {
                query += ` AND ch.categoria = $${contador}`;
                values.push(categoria);
                contador++;
            }

            if (nivel) {
                query += ` AND he.nivel = $${contador}`;
                values.push(nivel);
                contador++;
            }

            if (verificado !== null) {
                query += ` AND he.verificado = $${contador}`;
                values.push(verificado);
                contador++;
            }

            // Ordenar por categoría, luego nivel (experto primero), luego nombre
            query += ` ORDER BY ch.categoria ASC,
                CASE he.nivel
                    WHEN 'experto' THEN 1
                    WHEN 'avanzado' THEN 2
                    WHEN 'intermedio' THEN 3
                    WHEN 'basico' THEN 4
                END ASC,
                ch.nombre ASC`;
            query += ` LIMIT $${contador} OFFSET $${contador + 1}`;
            values.push(limite, offset);

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Obtiene una habilidad de empleado por su ID
     * @param {number} organizacionId - ID de la organización
     * @param {number} habilidadEmpleadoId - ID de la relación
     * @returns {Promise<Object|null>} Habilidad del empleado o null
     */
    static async obtenerPorId(organizacionId, habilidadEmpleadoId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    he.*,
                    p.nombre_completo as profesional_nombre,
                    ch.nombre as habilidad_nombre,
                    ch.categoria as habilidad_categoria,
                    ch.descripcion as habilidad_descripcion,
                    ch.icono as habilidad_icono,
                    ch.color as habilidad_color,
                    uv.nombre as verificado_por_nombre,
                    uc.nombre as creado_por_nombre
                FROM habilidades_empleado he
                JOIN profesionales p ON p.id = he.profesional_id
                JOIN catalogo_habilidades ch ON ch.id = he.habilidad_id
                LEFT JOIN usuarios uv ON uv.id = he.verificado_por
                LEFT JOIN usuarios uc ON uc.id = he.creado_por
                WHERE he.id = $1
                    AND he.organizacion_id = $2
                    AND he.eliminado_en IS NULL
            `;

            const result = await db.query(query, [habilidadEmpleadoId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualiza la habilidad de un empleado
     * @param {number} organizacionId - ID de la organización
     * @param {number} habilidadEmpleadoId - ID de la relación
     * @param {Object} datos - Datos a actualizar
     * @param {number} usuarioId - ID del usuario que actualiza
     * @returns {Promise<Object>} Habilidad actualizada
     */
    static async actualizar(organizacionId, habilidadEmpleadoId, datos, usuarioId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposPermitidos = ['nivel', 'anios_experiencia', 'notas', 'certificaciones'];

            const campos = [];
            const valores = [];
            let contador = 1;

            for (const [campo, valor] of Object.entries(datos)) {
                if (camposPermitidos.includes(campo) && valor !== undefined) {
                    campos.push(`${campo} = $${contador}`);
                    valores.push(valor);
                    contador++;
                }
            }

            if (campos.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }

            if (usuarioId) {
                campos.push(`actualizado_por = $${contador}`);
                valores.push(usuarioId);
                contador++;
            }

            const query = `
                UPDATE habilidades_empleado
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${contador} AND organizacion_id = $${contador + 1}
                    AND eliminado_en IS NULL
                RETURNING *
            `;

            valores.push(habilidadEmpleadoId, organizacionId);

            try {
                const result = await db.query(query, valores);

                if (result.rows.length === 0) {
                    throw new Error('Habilidad de empleado no encontrada');
                }

                return result.rows[0];
            } catch (error) {
                if (error.code === '22P02') {
                    throw new Error('El nivel de habilidad especificado no es válido');
                }
                throw error;
            }
        });
    }

    /**
     * Elimina una habilidad de un empleado
     * @param {number} organizacionId - ID de la organización
     * @param {number} habilidadEmpleadoId - ID de la relación
     * @param {number} usuarioId - ID del usuario que elimina
     * @returns {Promise<boolean>} true si se eliminó
     */
    static async eliminar(organizacionId, habilidadEmpleadoId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE habilidades_empleado
                SET activo = false,
                    eliminado_en = NOW(),
                    eliminado_por = $3
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
                RETURNING id
            `;

            const result = await db.query(query, [habilidadEmpleadoId, organizacionId, usuarioId]);
            return result.rowCount > 0;
        });
    }

    /**
     * Verifica una habilidad de empleado
     * @param {number} organizacionId - ID de la organización
     * @param {number} habilidadEmpleadoId - ID de la relación
     * @param {boolean} verificado - Estado de verificación
     * @param {number} usuarioId - ID del usuario que verifica
     * @returns {Promise<Object>} Habilidad actualizada
     */
    static async verificar(organizacionId, habilidadEmpleadoId, verificado, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE habilidades_empleado
                SET verificado = $3,
                    verificado_por = CASE WHEN $3 = true THEN $4::INTEGER ELSE NULL END,
                    fecha_verificacion = CASE WHEN $3 = true THEN NOW() ELSE NULL END,
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
                RETURNING *
            `;

            const result = await db.query(query, [
                habilidadEmpleadoId, organizacionId, verificado, usuarioId
            ]);

            if (result.rows.length === 0) {
                throw new Error('Habilidad de empleado no encontrada');
            }

            return result.rows[0];
        });
    }

    /**
     * Cuenta habilidades de un empleado
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @returns {Promise<Object>} Conteo de habilidades
     */
    static async contarPorProfesional(organizacionId, profesionalId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE he.verificado = true) as verificadas,
                    COUNT(*) FILTER (WHERE he.nivel = 'experto') as nivel_experto,
                    COUNT(*) FILTER (WHERE he.nivel = 'avanzado') as nivel_avanzado,
                    COUNT(*) FILTER (WHERE he.nivel = 'intermedio') as nivel_intermedio,
                    COUNT(*) FILTER (WHERE he.nivel = 'basico') as nivel_basico
                FROM habilidades_empleado he
                WHERE he.organizacion_id = $1
                    AND he.profesional_id = $2
                    AND he.eliminado_en IS NULL
                    AND he.activo = true
            `;

            const result = await db.query(query, [organizacionId, profesionalId]);
            const row = result.rows[0];

            return {
                total: parseInt(row.total) || 0,
                verificadas: parseInt(row.verificadas) || 0,
                por_nivel: {
                    experto: parseInt(row.nivel_experto) || 0,
                    avanzado: parseInt(row.nivel_avanzado) || 0,
                    intermedio: parseInt(row.nivel_intermedio) || 0,
                    basico: parseInt(row.nivel_basico) || 0
                }
            };
        });
    }

    /**
     * Busca profesionales con una habilidad específica
     * @param {number} organizacionId - ID de la organización
     * @param {number} habilidadId - ID de la habilidad del catálogo
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>} Lista de profesionales con esa habilidad
     */
    static async buscarProfesionalesPorHabilidad(organizacionId, habilidadId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { nivel_minimo = null, verificado = null, limite = 50, offset = 0 } = filtros;

            let query = `
                SELECT
                    p.id as profesional_id,
                    p.nombre_completo,
                    p.email,
                    p.puesto,
                    he.nivel,
                    he.anios_experiencia,
                    he.verificado,
                    he.certificaciones
                FROM habilidades_empleado he
                JOIN profesionales p ON p.id = he.profesional_id
                WHERE he.organizacion_id = $1
                    AND he.habilidad_id = $2
                    AND he.eliminado_en IS NULL
                    AND he.activo = true
                    AND p.eliminado_en IS NULL
                    AND p.activo = true
            `;

            const values = [organizacionId, habilidadId];
            let contador = 3;

            if (nivel_minimo) {
                const nivelesOrden = { basico: 1, intermedio: 2, avanzado: 3, experto: 4 };
                const ordenMinimo = nivelesOrden[nivel_minimo] || 1;
                query += ` AND CASE he.nivel
                    WHEN 'experto' THEN 4
                    WHEN 'avanzado' THEN 3
                    WHEN 'intermedio' THEN 2
                    WHEN 'basico' THEN 1
                END >= $${contador}`;
                values.push(ordenMinimo);
                contador++;
            }

            if (verificado !== null) {
                query += ` AND he.verificado = $${contador}`;
                values.push(verificado);
                contador++;
            }

            query += ` ORDER BY
                CASE he.nivel
                    WHEN 'experto' THEN 1
                    WHEN 'avanzado' THEN 2
                    WHEN 'intermedio' THEN 3
                    WHEN 'basico' THEN 4
                END ASC,
                he.anios_experiencia DESC,
                p.nombre_completo ASC`;
            query += ` LIMIT $${contador} OFFSET $${contador + 1}`;
            values.push(limite, offset);

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Asigna múltiples habilidades a un empleado en batch
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {Array} habilidades - Array de {habilidad_id, nivel, anios_experiencia}
     * @param {number} creado_por - ID del usuario que crea
     * @returns {Promise<Array>} Habilidades asignadas
     */
    static async asignarBatch(organizacionId, profesionalId, habilidades, creado_por = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const resultados = [];

            for (const hab of habilidades) {
                const query = `
                    INSERT INTO habilidades_empleado (
                        organizacion_id, profesional_id, habilidad_id,
                        nivel, anios_experiencia, creado_por
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (organizacion_id, profesional_id, habilidad_id)
                    DO UPDATE SET
                        nivel = EXCLUDED.nivel,
                        anios_experiencia = EXCLUDED.anios_experiencia,
                        actualizado_en = NOW()
                    RETURNING *
                `;

                const values = [
                    organizacionId,
                    profesionalId,
                    hab.habilidad_id,
                    hab.nivel || 'basico',
                    hab.anios_experiencia || 0,
                    creado_por
                ];

                const result = await db.query(query, values);
                resultados.push(result.rows[0]);
            }

            return resultados;
        });
    }
}

module.exports = {
    CatalogoHabilidadesModel,
    HabilidadEmpleadoModel
};
