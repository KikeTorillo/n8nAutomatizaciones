/**
 * OnboardingModel - Enero 2026
 * Gestión de plantillas y progreso de onboarding para empleados
 * Fase 5 del Plan de Empleados Competitivo
 */
const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');

class OnboardingModel {

    // =====================================================
    // PLANTILLAS
    // =====================================================

    /**
     * Crea una nueva plantilla de onboarding
     * @param {Object} data - Datos de la plantilla
     * @returns {Promise<Object>} Plantilla creada
     */
    static async crearPlantilla(data) {
        return await RLSContextManager.query(data.organizacion_id, async (db) => {
            const query = `
                INSERT INTO plantillas_onboarding (
                    organizacion_id, nombre, descripcion,
                    departamento_id, puesto_id, duracion_dias,
                    activo, creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const values = [
                data.organizacion_id,
                data.nombre,
                data.descripcion || null,
                data.departamento_id || null,
                data.puesto_id || null,
                data.duracion_dias || 30,
                data.activo !== false,
                data.creado_por || null
            ];

            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (error) {
                if (error.code === '23505') {
                    if (error.constraint?.includes('uk_plantilla_nombre')) {
                        ErrorHelper.throwConflict('Ya existe una plantilla con ese nombre en esta organización');
                    }
                }
                if (error.code === '23503') {
                    if (error.constraint?.includes('departamento')) {
                        ErrorHelper.throwValidation('El departamento especificado no existe');
                    }
                    if (error.constraint?.includes('puesto')) {
                        ErrorHelper.throwValidation('El puesto especificado no existe');
                    }
                }
                throw error;
            }
        });
    }

    /**
     * Lista plantillas de onboarding
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>} Lista de plantillas
     */
    static async listarPlantillas(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                departamento_id = null,
                puesto_id = null,
                activo = null,
                limite = 50,
                offset = 0
            } = filtros;

            let query = `
                SELECT
                    p.*,
                    d.nombre as departamento_nombre,
                    pu.nombre as puesto_nombre,
                    uc.nombre as creado_por_nombre,
                    (SELECT COUNT(*) FROM tareas_onboarding t
                     WHERE t.plantilla_id = p.id AND t.eliminado_en IS NULL) as total_tareas
                FROM plantillas_onboarding p
                LEFT JOIN departamentos d ON d.id = p.departamento_id
                LEFT JOIN puestos pu ON pu.id = p.puesto_id
                LEFT JOIN usuarios uc ON uc.id = p.creado_por
                WHERE p.organizacion_id = $1
                    AND p.eliminado_en IS NULL
            `;

            const values = [organizacionId];
            let contador = 2;

            if (departamento_id !== null) {
                query += ` AND p.departamento_id = $${contador}`;
                values.push(departamento_id);
                contador++;
            }

            if (puesto_id !== null) {
                query += ` AND p.puesto_id = $${contador}`;
                values.push(puesto_id);
                contador++;
            }

            if (activo !== null) {
                query += ` AND p.activo = $${contador}`;
                values.push(activo);
                contador++;
            }

            query += ` ORDER BY p.activo DESC, p.nombre ASC`;
            query += ` LIMIT $${contador} OFFSET $${contador + 1}`;
            values.push(limite, offset);

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Obtiene una plantilla por su ID (con tareas)
     * @param {number} organizacionId - ID de la organización
     * @param {number} plantillaId - ID de la plantilla
     * @returns {Promise<Object|null>} Plantilla con tareas o null
     */
    static async obtenerPlantillaPorId(organizacionId, plantillaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener plantilla
            const plantillaQuery = `
                SELECT
                    p.*,
                    d.nombre as departamento_nombre,
                    pu.nombre as puesto_nombre,
                    uc.nombre as creado_por_nombre
                FROM plantillas_onboarding p
                LEFT JOIN departamentos d ON d.id = p.departamento_id
                LEFT JOIN puestos pu ON pu.id = p.puesto_id
                LEFT JOIN usuarios uc ON uc.id = p.creado_por
                WHERE p.id = $1
                    AND p.organizacion_id = $2
                    AND p.eliminado_en IS NULL
            `;

            const plantillaResult = await db.query(plantillaQuery, [plantillaId, organizacionId]);

            if (plantillaResult.rows.length === 0) {
                return null;
            }

            const plantilla = plantillaResult.rows[0];

            // Obtener tareas
            const tareasQuery = `
                SELECT
                    t.*,
                    uc.nombre as creado_por_nombre
                FROM tareas_onboarding t
                LEFT JOIN usuarios uc ON uc.id = t.creado_por
                WHERE t.plantilla_id = $1
                    AND t.organizacion_id = $2
                    AND t.eliminado_en IS NULL
                ORDER BY t.orden ASC, t.creado_en ASC
            `;

            const tareasResult = await db.query(tareasQuery, [plantillaId, organizacionId]);
            plantilla.tareas = tareasResult.rows;

            return plantilla;
        });
    }

    /**
     * Actualiza una plantilla de onboarding
     * @param {number} organizacionId - ID de la organización
     * @param {number} plantillaId - ID de la plantilla
     * @param {Object} datos - Datos a actualizar
     * @param {number} usuarioId - ID del usuario que actualiza
     * @returns {Promise<Object>} Plantilla actualizada
     */
    static async actualizarPlantilla(organizacionId, plantillaId, datos, usuarioId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposPermitidos = [
                'nombre', 'descripcion', 'departamento_id',
                'puesto_id', 'duracion_dias', 'activo'
            ];

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
                ErrorHelper.throwValidation('No hay campos válidos para actualizar');
            }

            const query = `
                UPDATE plantillas_onboarding
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${contador} AND organizacion_id = $${contador + 1}
                    AND eliminado_en IS NULL
                RETURNING *
            `;

            valores.push(plantillaId, organizacionId);

            try {
                const result = await db.query(query, valores);

                ErrorHelper.throwIfNotFound(result.rows[0], 'Plantilla');
                return result.rows[0];
            } catch (error) {
                if (error.code === '23505') {
                    if (error.constraint?.includes('uk_plantilla_nombre')) {
                        ErrorHelper.throwConflict('Ya existe una plantilla con ese nombre');
                    }
                }
                throw error;
            }
        });
    }

    /**
     * Soft delete de una plantilla
     * @param {number} organizacionId - ID de la organización
     * @param {number} plantillaId - ID de la plantilla
     * @param {number} usuarioId - ID del usuario que elimina
     * @returns {Promise<boolean>} true si se eliminó
     */
    static async eliminarPlantilla(organizacionId, plantillaId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE plantillas_onboarding
                SET activo = false,
                    eliminado_en = NOW(),
                    eliminado_por = $3
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
                RETURNING id
            `;

            const result = await db.query(query, [plantillaId, organizacionId, usuarioId]);
            return result.rowCount > 0;
        });
    }

    /**
     * Busca la plantilla más específica aplicable a un profesional
     * Usa la función SQL buscar_plantilla_onboarding_aplicable
     * @param {number} organizacionId - ID de la organización
     * @param {number} departamentoId - ID del departamento (puede ser null)
     * @param {number} puestoId - ID del puesto (puede ser null)
     * @returns {Promise<Object|null>} Plantilla aplicable o null
     */
    static async buscarPlantillaAplicable(organizacionId, departamentoId, puestoId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT id FROM buscar_plantilla_onboarding_aplicable($1, $2, $3) as id
                WHERE id IS NOT NULL
            `;

            const result = await db.query(query, [
                organizacionId,
                departamentoId || null,
                puestoId || null
            ]);

            if (result.rows.length === 0 || !result.rows[0].id) {
                return null;
            }

            // Obtener la plantilla completa
            return await OnboardingModel.obtenerPlantillaPorId(organizacionId, result.rows[0].id);
        });
    }

    /**
     * Obtiene plantillas sugeridas para un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @returns {Promise<Array>} Lista de plantillas sugeridas
     */
    static async obtenerPlantillasSugeridas(organizacionId, profesionalId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener datos del profesional
            const profQuery = `
                SELECT departamento_id, puesto_id
                FROM profesionales
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
            `;
            const profResult = await db.query(profQuery, [profesionalId, organizacionId]);

            ErrorHelper.throwIfNotFound(profResult.rows[0], 'Profesional');

            const { departamento_id, puesto_id } = profResult.rows[0];

            // Buscar plantillas compatibles ordenadas por especificidad
            const query = `
                SELECT
                    p.*,
                    d.nombre as departamento_nombre,
                    pu.nombre as puesto_nombre,
                    (SELECT COUNT(*) FROM tareas_onboarding t
                     WHERE t.plantilla_id = p.id AND t.eliminado_en IS NULL) as total_tareas,
                    CASE
                        WHEN p.departamento_id = $2 AND p.puesto_id = $3 THEN 1
                        WHEN p.departamento_id IS NULL AND p.puesto_id = $3 THEN 2
                        WHEN p.departamento_id = $2 AND p.puesto_id IS NULL THEN 3
                        WHEN p.departamento_id IS NULL AND p.puesto_id IS NULL THEN 4
                        ELSE 5
                    END as prioridad
                FROM plantillas_onboarding p
                LEFT JOIN departamentos d ON d.id = p.departamento_id
                LEFT JOIN puestos pu ON pu.id = p.puesto_id
                WHERE p.organizacion_id = $1
                    AND p.activo = true
                    AND p.eliminado_en IS NULL
                    AND (
                        (p.departamento_id = $2 OR p.departamento_id IS NULL)
                        AND (p.puesto_id = $3 OR p.puesto_id IS NULL)
                    )
                ORDER BY prioridad ASC, p.nombre ASC
                LIMIT 5
            `;

            const result = await db.query(query, [organizacionId, departamento_id, puesto_id]);
            return result.rows;
        });
    }

    // =====================================================
    // TAREAS DE PLANTILLA
    // =====================================================

    /**
     * Crea una nueva tarea de onboarding
     * @param {Object} data - Datos de la tarea
     * @returns {Promise<Object>} Tarea creada
     */
    static async crearTarea(data) {
        return await RLSContextManager.query(data.organizacion_id, async (db) => {
            // Obtener orden máximo
            const ordenQuery = `
                SELECT COALESCE(MAX(orden), -1) + 1 as next_orden
                FROM tareas_onboarding
                WHERE organizacion_id = $1 AND plantilla_id = $2 AND eliminado_en IS NULL
            `;
            const ordenResult = await db.query(ordenQuery, [data.organizacion_id, data.plantilla_id]);
            const nextOrden = ordenResult.rows[0].next_orden;

            const query = `
                INSERT INTO tareas_onboarding (
                    organizacion_id, plantilla_id,
                    titulo, descripcion, responsable_tipo,
                    dias_limite, orden, es_obligatoria,
                    url_recurso, creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `;

            const values = [
                data.organizacion_id,
                data.plantilla_id,
                data.titulo,
                data.descripcion || null,
                data.responsable_tipo || 'empleado',
                data.dias_limite || null,
                data.orden !== undefined ? data.orden : nextOrden,
                data.es_obligatoria !== false,
                data.url_recurso || null,
                data.creado_por || null
            ];

            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (error) {
                if (error.code === '23503') {
                    if (error.constraint?.includes('plantilla')) {
                        ErrorHelper.throwValidation('La plantilla especificada no existe');
                    }
                }
                if (error.code === '22P02') {
                    ErrorHelper.throwValidation('El tipo de responsable especificado no es válido');
                }
                throw error;
            }
        });
    }

    /**
     * Lista tareas de una plantilla
     * @param {number} organizacionId - ID de la organización
     * @param {number} plantillaId - ID de la plantilla
     * @returns {Promise<Array>} Lista de tareas
     */
    static async listarTareas(organizacionId, plantillaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    t.*,
                    uc.nombre as creado_por_nombre
                FROM tareas_onboarding t
                LEFT JOIN usuarios uc ON uc.id = t.creado_por
                WHERE t.organizacion_id = $1
                    AND t.plantilla_id = $2
                    AND t.eliminado_en IS NULL
                ORDER BY t.orden ASC, t.creado_en ASC
            `;

            const result = await db.query(query, [organizacionId, plantillaId]);
            return result.rows;
        });
    }

    /**
     * Obtiene una tarea por su ID
     * @param {number} organizacionId - ID de la organización
     * @param {number} tareaId - ID de la tarea
     * @returns {Promise<Object|null>} Tarea o null
     */
    static async obtenerTareaPorId(organizacionId, tareaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    t.*,
                    p.nombre as plantilla_nombre,
                    uc.nombre as creado_por_nombre
                FROM tareas_onboarding t
                JOIN plantillas_onboarding p ON p.id = t.plantilla_id
                LEFT JOIN usuarios uc ON uc.id = t.creado_por
                WHERE t.id = $1
                    AND t.organizacion_id = $2
                    AND t.eliminado_en IS NULL
            `;

            const result = await db.query(query, [tareaId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualiza una tarea de onboarding
     * @param {number} organizacionId - ID de la organización
     * @param {number} tareaId - ID de la tarea
     * @param {Object} datos - Datos a actualizar
     * @param {number} usuarioId - ID del usuario que actualiza
     * @returns {Promise<Object>} Tarea actualizada
     */
    static async actualizarTarea(organizacionId, tareaId, datos, usuarioId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposPermitidos = [
                'titulo', 'descripcion', 'responsable_tipo',
                'dias_limite', 'orden', 'es_obligatoria', 'url_recurso'
            ];

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
                ErrorHelper.throwValidation('No hay campos válidos para actualizar');
            }

            const query = `
                UPDATE tareas_onboarding
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${contador} AND organizacion_id = $${contador + 1}
                    AND eliminado_en IS NULL
                RETURNING *
            `;

            valores.push(tareaId, organizacionId);

            try {
                const result = await db.query(query, valores);

                ErrorHelper.throwIfNotFound(result.rows[0], 'Tarea');
                return result.rows[0];
            } catch (error) {
                if (error.code === '22P02') {
                    ErrorHelper.throwValidation('El tipo de responsable especificado no es válido');
                }
                throw error;
            }
        });
    }

    /**
     * Soft delete de una tarea
     * @param {number} organizacionId - ID de la organización
     * @param {number} tareaId - ID de la tarea
     * @param {number} usuarioId - ID del usuario que elimina
     * @returns {Promise<boolean>} true si se eliminó
     */
    static async eliminarTarea(organizacionId, tareaId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE tareas_onboarding
                SET eliminado_en = NOW(),
                    eliminado_por = $3
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
                RETURNING id
            `;

            const result = await db.query(query, [tareaId, organizacionId, usuarioId]);
            return result.rowCount > 0;
        });
    }

    /**
     * Reordena las tareas de una plantilla
     * @param {number} organizacionId - ID de la organización
     * @param {number} plantillaId - ID de la plantilla
     * @param {Array} ordenItems - Array de {id, orden}
     * @returns {Promise<boolean>} true si se reordenó
     */
    static async reordenarTareas(organizacionId, plantillaId, ordenItems) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            for (const item of ordenItems) {
                await db.query(`
                    UPDATE tareas_onboarding
                    SET orden = $1, actualizado_en = NOW()
                    WHERE id = $2 AND organizacion_id = $3 AND plantilla_id = $4
                        AND eliminado_en IS NULL
                `, [item.orden, item.id, organizacionId, plantillaId]);
            }
            return true;
        });
    }

    // =====================================================
    // PROGRESO DE ONBOARDING
    // =====================================================

    /**
     * Aplica una plantilla a un profesional (genera progreso)
     * Usa la función SQL generar_progreso_onboarding
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {number} plantillaId - ID de la plantilla
     * @returns {Promise<Object>} Resultado con tareas generadas
     */
    static async aplicarPlantilla(organizacionId, profesionalId, plantillaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar que el profesional existe
            const profQuery = `
                SELECT id, nombre_completo FROM profesionales
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
            `;
            const profResult = await db.query(profQuery, [profesionalId, organizacionId]);

            ErrorHelper.throwIfNotFound(profResult.rows[0], 'Profesional');

            // Verificar que la plantilla existe
            const plantQuery = `
                SELECT id, nombre FROM plantillas_onboarding
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL AND activo = true
            `;
            const plantResult = await db.query(plantQuery, [plantillaId, organizacionId]);

            if (plantResult.rows.length === 0) {
                ErrorHelper.throwIfNotFound(null, 'Plantilla');
            }

            // Llamar a la función SQL
            const query = `
                SELECT generar_progreso_onboarding($1, $2, $3) as tareas_creadas
            `;
            const result = await db.query(query, [organizacionId, profesionalId, plantillaId]);

            return {
                profesional: profResult.rows[0],
                plantilla: plantResult.rows[0],
                tareas_creadas: result.rows[0].tareas_creadas
            };
        });
    }

    /**
     * Obtiene el progreso de onboarding de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Object>} Progreso con resumen y tareas
     */
    static async obtenerProgreso(organizacionId, profesionalId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { solo_pendientes = false } = filtros;

            // Obtener resumen
            const resumenQuery = `
                SELECT * FROM v_progreso_onboarding_resumen
                WHERE organizacion_id = $1 AND profesional_id = $2
            `;
            const resumenResult = await db.query(resumenQuery, [organizacionId, profesionalId]);

            if (resumenResult.rows.length === 0) {
                return {
                    tiene_onboarding: false,
                    resumen: null,
                    tareas: []
                };
            }

            const resumen = resumenResult.rows[0];

            // Obtener tareas detalladas
            let tareasQuery = `
                SELECT
                    p.id as progreso_id,
                    p.completado,
                    p.completado_en,
                    p.fecha_limite,
                    p.notas,
                    t.id as tarea_id,
                    t.titulo,
                    t.descripcion,
                    t.responsable_tipo,
                    t.dias_limite,
                    t.orden,
                    t.es_obligatoria,
                    t.url_recurso,
                    uc.nombre as completado_por_nombre,
                    CASE
                        WHEN p.completado = true THEN 'completada'
                        WHEN p.fecha_limite < CURRENT_DATE THEN 'vencida'
                        WHEN p.fecha_limite = CURRENT_DATE THEN 'hoy'
                        WHEN p.fecha_limite <= CURRENT_DATE + INTERVAL '3 days' THEN 'proxima'
                        ELSE 'pendiente'
                    END as estado_tarea
                FROM progreso_onboarding p
                JOIN tareas_onboarding t ON t.id = p.tarea_id
                LEFT JOIN usuarios uc ON uc.id = p.completado_por
                WHERE p.organizacion_id = $1
                    AND p.profesional_id = $2
                    AND t.eliminado_en IS NULL
            `;

            const values = [organizacionId, profesionalId];

            if (solo_pendientes) {
                tareasQuery += ` AND p.completado = false`;
            }

            tareasQuery += ` ORDER BY p.completado ASC, t.orden ASC`;

            const tareasResult = await db.query(tareasQuery, values);

            return {
                tiene_onboarding: true,
                resumen,
                tareas: tareasResult.rows
            };
        });
    }

    /**
     * Marca una tarea como completada
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {number} tareaId - ID de la tarea
     * @param {Object} datos - Datos adicionales (notas, completado_por)
     * @returns {Promise<Object>} Progreso actualizado
     */
    static async marcarTareaCompletada(organizacionId, profesionalId, tareaId, datos = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { completado = true, notas = null, completado_por = null } = datos;

            const query = `
                UPDATE progreso_onboarding
                SET completado = $4,
                    completado_en = CASE WHEN $4 = true THEN NOW() ELSE NULL END,
                    completado_por = CASE WHEN $4 = true THEN $5::INTEGER ELSE NULL END,
                    notas = COALESCE($6, notas),
                    actualizado_en = NOW()
                WHERE organizacion_id = $1
                    AND profesional_id = $2
                    AND tarea_id = $3
                RETURNING *
            `;

            const result = await db.query(query, [
                organizacionId,
                profesionalId,
                tareaId,
                completado,
                completado_por,
                notas
            ]);

            ErrorHelper.throwIfNotFound(result.rows[0], 'Tarea de onboarding');
            return result.rows[0];
        });
    }

    /**
     * Elimina todo el progreso de onboarding de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @returns {Promise<number>} Número de registros eliminados
     */
    static async eliminarProgreso(organizacionId, profesionalId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                DELETE FROM progreso_onboarding
                WHERE organizacion_id = $1 AND profesional_id = $2
                RETURNING id
            `;

            const result = await db.query(query, [organizacionId, profesionalId]);
            return result.rowCount;
        });
    }

    // =====================================================
    // DASHBOARD RRHH
    // =====================================================

    /**
     * Obtiene el dashboard de onboarding para RRHH
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Object>} Dashboard con estadísticas
     */
    static async obtenerDashboard(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                departamento_id = null,
                estado_empleado = null,
                limite = 50,
                offset = 0
            } = filtros;

            // Estadísticas generales
            let statsQuery = `
                SELECT
                    COUNT(DISTINCT profesional_id) as total_empleados_onboarding,
                    COUNT(DISTINCT profesional_id) FILTER (
                        WHERE porcentaje_completado = 100
                    ) as completados,
                    COUNT(DISTINCT profesional_id) FILTER (
                        WHERE tareas_vencidas > 0
                    ) as con_tareas_vencidas,
                    AVG(porcentaje_completado)::NUMERIC(5,1) as promedio_avance
                FROM v_progreso_onboarding_resumen
                WHERE organizacion_id = $1
            `;

            const statsResult = await db.query(statsQuery, [organizacionId]);
            const stats = statsResult.rows[0];

            // Lista de empleados con progreso
            let listaQuery = `
                SELECT * FROM v_progreso_onboarding_resumen
                WHERE organizacion_id = $1
            `;

            const values = [organizacionId];
            let contador = 2;

            if (estado_empleado) {
                listaQuery += ` AND estado = $${contador}`;
                values.push(estado_empleado);
                contador++;
            }

            listaQuery += ` ORDER BY
                CASE WHEN tareas_vencidas > 0 THEN 0 ELSE 1 END,
                porcentaje_completado ASC,
                fecha_ingreso DESC`;
            listaQuery += ` LIMIT $${contador} OFFSET $${contador + 1}`;
            values.push(limite, offset);

            const listaResult = await db.query(listaQuery, values);

            return {
                estadisticas: {
                    total_empleados_onboarding: parseInt(stats.total_empleados_onboarding) || 0,
                    completados: parseInt(stats.completados) || 0,
                    con_tareas_vencidas: parseInt(stats.con_tareas_vencidas) || 0,
                    promedio_avance: parseFloat(stats.promedio_avance) || 0
                },
                empleados: listaResult.rows
            };
        });
    }

    /**
     * Obtiene tareas vencidas de todos los empleados
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>} Lista de tareas vencidas
     */
    static async obtenerTareasVencidas(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                solo_obligatorias = false,
                limite = 100,
                offset = 0
            } = filtros;

            let query = `
                SELECT * FROM v_tareas_onboarding_vencidas
                WHERE organizacion_id = $1
            `;

            const values = [organizacionId];
            let contador = 2;

            if (solo_obligatorias) {
                query += ` AND es_obligatoria = true`;
            }

            query += ` ORDER BY dias_vencido DESC, fecha_limite ASC`;
            query += ` LIMIT $${contador} OFFSET $${contador + 1}`;
            values.push(limite, offset);

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Cuenta empleados por estado de onboarding
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Conteos por estado
     */
    static async contarPorEstado(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    COUNT(*) FILTER (WHERE porcentaje_completado = 100) as completado,
                    COUNT(*) FILTER (WHERE porcentaje_completado >= 50 AND porcentaje_completado < 100) as avanzado,
                    COUNT(*) FILTER (WHERE porcentaje_completado > 0 AND porcentaje_completado < 50) as iniciado,
                    COUNT(*) FILTER (WHERE porcentaje_completado = 0) as sin_iniciar,
                    COUNT(*) as total
                FROM v_progreso_onboarding_resumen
                WHERE organizacion_id = $1
            `;

            const result = await db.query(query, [organizacionId]);
            const row = result.rows[0];

            return {
                completado: parseInt(row.completado) || 0,
                avanzado: parseInt(row.avanzado) || 0,
                iniciado: parseInt(row.iniciado) || 0,
                sin_iniciar: parseInt(row.sin_iniciar) || 0,
                total: parseInt(row.total) || 0
            };
        });
    }
}

module.exports = OnboardingModel;
