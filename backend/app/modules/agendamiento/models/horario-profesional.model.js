const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

class HorarioProfesionalModel {

    /**
     * Crear nuevo horario para un profesional
     *
     * @param {Object} datosHorario - Datos del horario a crear
     * @param {Object} auditoria - { usuario_id }
     * @returns {Promise<Object>} Horario creado
     */
    static async crear(datosHorario, auditoria = {}) {
        return await RLSContextManager.transaction(datosHorario.organizacion_id, async (db) => {
            try {
                // Validar que el profesional existe y pertenece a la organización
                const validarProfesional = await db.query(`
                    SELECT id, nombre_completo, activo
                    FROM profesionales
                    WHERE id = $1 AND organizacion_id = $2
                `, [datosHorario.profesional_id, datosHorario.organizacion_id]);

                if (validarProfesional.rows.length === 0) {
                    throw new Error('El profesional no existe o no pertenece a esta organización');
                }

                // Validar tipo_horario y permite_citas sean consistentes
                if (['break', 'almuerzo'].includes(datosHorario.tipo_horario) && datosHorario.permite_citas === true) {
                    throw new Error('Los horarios de tipo "break" o "almuerzo" no pueden permitir citas');
                }

                const insertQuery = `
                    INSERT INTO horarios_profesionales (
                        organizacion_id, profesional_id, dia_semana,
                        hora_inicio, hora_fin, zona_horaria,
                        tipo_horario, nombre_horario, descripcion,
                        permite_citas,
                        precio_premium, permite_descuentos,
                        fecha_inicio, fecha_fin, motivo_vigencia,
                        capacidad_maxima, configuracion_especial,
                        activo, prioridad, creado_automaticamente,
                        creado_por, creado_en
                    )
                    VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9,
                        $10, $11, $12, $13, $14, $15,
                        $16, $17, $18, $19, $20, $21, NOW()
                    )
                    RETURNING id, organizacion_id, profesional_id, dia_semana,
                             hora_inicio, hora_fin, tipo_horario, nombre_horario,
                             permite_citas, activo,
                             fecha_inicio, fecha_fin, creado_en
                `;

                const result = await db.query(insertQuery, [
                    datosHorario.organizacion_id,
                    datosHorario.profesional_id,
                    datosHorario.dia_semana,
                    datosHorario.hora_inicio,
                    datosHorario.hora_fin,
                    datosHorario.zona_horaria || 'America/Mexico_City',
                    datosHorario.tipo_horario || 'regular',
                    datosHorario.nombre_horario || null,
                    datosHorario.descripcion || null,
                    datosHorario.permite_citas !== false,
                    datosHorario.precio_premium || 0.00,
                    datosHorario.permite_descuentos !== false,
                    datosHorario.fecha_inicio || new Date().toISOString().split('T')[0],
                    datosHorario.fecha_fin || null,
                    datosHorario.motivo_vigencia || null,
                    datosHorario.capacidad_maxima || 1,
                    datosHorario.configuracion_especial || {},
                    datosHorario.activo !== false,
                    datosHorario.prioridad || 0,
                    datosHorario.creado_automaticamente || false,
                    auditoria.usuario_id || null
                ]);

                logger.info('[HorarioProfesionalModel.crear] Horario creado exitosamente', {
                    horario_id: result.rows[0].id,
                    profesional_id: datosHorario.profesional_id,
                    dia_semana: datosHorario.dia_semana,
                    horario: `${datosHorario.hora_inicio}-${datosHorario.hora_fin}`
                });

                return result.rows[0];

            } catch (error) {
                // Manejar errores específicos de constraints
                if (error.code === '23514') { // Check constraint violation
                    if (error.message.includes('valid_horario_base')) {
                        throw new Error('La hora de fin debe ser mayor que la hora de inicio');
                    }
                    if (error.message.includes('valid_duracion_minima_horario')) {
                        throw new Error('El horario debe tener al menos 15 minutos de duración');
                    }
                    if (error.message.includes('valid_vigencia_temporal')) {
                        throw new Error('La fecha de fin debe ser mayor o igual a la fecha de inicio');
                    }
                    if (error.message.includes('valid_tipo_horario')) {
                        throw new Error('Tipo de horario inválido. Valores permitidos: regular, break, almuerzo, premium');
                    }
                    if (error.message.includes('valid_configuracion_permite_citas')) {
                        throw new Error('Los horarios de tipo "break" o "almuerzo" no pueden permitir citas');
                    }
                }

                // Error de solapamiento (del trigger)
                if (error.message.includes('se solapa con otro horario')) {
                    throw new Error('El horario se solapa con otro horario existente del profesional en el mismo día');
                }

                logger.error('[HorarioProfesionalModel.crear] Error creando horario:', {
                    error: error.message,
                    organizacion_id: datosHorario.organizacion_id,
                    profesional_id: datosHorario.profesional_id
                });
                throw error;
            }
        });
    }

    /**
     * Obtener horarios de un profesional con filtros
     *
     * @param {Object} filtros - Filtros de búsqueda
     * @returns {Promise<Object>} Lista de horarios con paginación
     */
    static async obtenerPorProfesional(filtros) {
        return await RLSContextManager.query(filtros.organizacion_id, async (db) => {
            try {
                const limite = Math.min(filtros.limite || 50, 100);
                const offset = filtros.offset || 0;

                let whereClause = 'WHERE hp.organizacion_id = $1 AND hp.profesional_id = $2';
                const queryParams = [filtros.organizacion_id, filtros.profesional_id];
                let paramCounter = 3;

                // Filtro por estado activo (por defecto solo activos)
                if (filtros.incluir_inactivos === true) {
                    // No agregar filtro de activo
                } else {
                    whereClause += ' AND hp.activo = true';
                }

                // Filtro por día de semana
                if (filtros.dia_semana !== undefined && filtros.dia_semana !== null) {
                    whereClause += ` AND hp.dia_semana = $${paramCounter}`;
                    queryParams.push(filtros.dia_semana);
                    paramCounter++;
                }

                // Filtro por tipo de horario
                if (filtros.tipo_horario) {
                    whereClause += ` AND hp.tipo_horario = $${paramCounter}`;
                    queryParams.push(filtros.tipo_horario);
                    paramCounter++;
                }

                // Filtro por permite_citas
                if (filtros.solo_permite_citas === true) {
                    whereClause += ' AND hp.permite_citas = true';
                }

                // Filtro por vigencia en fecha específica
                if (filtros.fecha_vigencia) {
                    whereClause += ` AND hp.fecha_inicio <= $${paramCounter}::date`;
                    queryParams.push(filtros.fecha_vigencia);
                    paramCounter++;
                    whereClause += ` AND (hp.fecha_fin IS NULL OR hp.fecha_fin >= $${paramCounter}::date)`;
                    queryParams.push(filtros.fecha_vigencia);
                    paramCounter++;
                }

                const query = `
                    SELECT
                        hp.id, hp.organizacion_id, hp.profesional_id,
                        hp.dia_semana, hp.hora_inicio, hp.hora_fin, hp.zona_horaria,
                        hp.tipo_horario, hp.nombre_horario, hp.descripcion,
                        hp.permite_citas,
                        hp.precio_premium, hp.permite_descuentos,
                        hp.fecha_inicio, hp.fecha_fin, hp.motivo_vigencia,
                        hp.capacidad_maxima, hp.configuracion_especial,
                        hp.activo, hp.prioridad, hp.creado_automaticamente,
                        hp.creado_en, hp.actualizado_en,
                        p.nombre_completo as profesional_nombre,
                        CASE hp.dia_semana
                            WHEN 0 THEN 'Domingo'
                            WHEN 1 THEN 'Lunes'
                            WHEN 2 THEN 'Martes'
                            WHEN 3 THEN 'Miércoles'
                            WHEN 4 THEN 'Jueves'
                            WHEN 5 THEN 'Viernes'
                            WHEN 6 THEN 'Sábado'
                        END as dia_semana_nombre,
                        to_char(hp.hora_inicio, 'HH24:MI') || ' - ' || to_char(hp.hora_fin, 'HH24:MI') as horario_fmt,
                        EXTRACT(EPOCH FROM (hp.hora_fin - hp.hora_inicio))/60 as duracion_minutos_total
                    FROM horarios_profesionales hp
                    INNER JOIN profesionales p ON hp.profesional_id = p.id
                    ${whereClause}
                    ORDER BY hp.dia_semana ASC, hp.hora_inicio ASC, hp.prioridad DESC
                    LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
                `;

                queryParams.push(limite, offset);

                const countQuery = `
                    SELECT COUNT(*) as total
                    FROM horarios_profesionales hp
                    ${whereClause}
                `;

                const [dataResult, countResult] = await Promise.all([
                    db.query(query, queryParams),
                    db.query(countQuery, queryParams.slice(0, -2))
                ]);

                const total = parseInt(countResult.rows[0].total);
                const horarios = dataResult.rows;

                return {
                    horarios,
                    paginacion: {
                        total,
                        limite,
                        offset,
                        pagina_actual: Math.floor(offset / limite) + 1,
                        total_paginas: Math.ceil(total / limite)
                    },
                    filtros_aplicados: {
                        organizacion_id: filtros.organizacion_id,
                        profesional_id: filtros.profesional_id,
                        dia_semana: filtros.dia_semana,
                        tipo_horario: filtros.tipo_horario,
                        solo_permite_citas: filtros.solo_permite_citas
                    }
                };

            } catch (error) {
                logger.error('[HorarioProfesionalModel.obtenerPorProfesional] Error obteniendo horarios:', {
                    error: error.message,
                    filtros
                });
                throw error;
            }
        });
    }

    /**
     * Obtener horario específico por ID
     *
     * @param {number} horarioId - ID del horario
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} Horario o null si no existe
     */
    static async obtenerPorId(horarioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            try {
                const query = `
                    SELECT
                        hp.id, hp.organizacion_id, hp.profesional_id,
                        hp.dia_semana, hp.hora_inicio, hp.hora_fin, hp.zona_horaria,
                        hp.tipo_horario, hp.nombre_horario, hp.descripcion,
                        hp.permite_citas,
                        hp.precio_premium, hp.permite_descuentos,
                        hp.fecha_inicio, hp.fecha_fin, hp.motivo_vigencia,
                        hp.capacidad_maxima, hp.configuracion_especial,
                        hp.activo, hp.prioridad, hp.creado_automaticamente,
                        hp.creado_en, hp.actualizado_en,
                        p.nombre_completo as profesional_nombre,
                        CASE hp.dia_semana
                            WHEN 0 THEN 'Domingo'
                            WHEN 1 THEN 'Lunes'
                            WHEN 2 THEN 'Martes'
                            WHEN 3 THEN 'Miércoles'
                            WHEN 4 THEN 'Jueves'
                            WHEN 5 THEN 'Viernes'
                            WHEN 6 THEN 'Sábado'
                        END as dia_semana_nombre
                    FROM horarios_profesionales hp
                    INNER JOIN profesionales p ON hp.profesional_id = p.id
                    WHERE hp.id = $1 AND hp.organizacion_id = $2
                `;

                const result = await db.query(query, [horarioId, organizacionId]);
                return result.rows[0] || null;

            } catch (error) {
                logger.error('[HorarioProfesionalModel.obtenerPorId] Error obteniendo horario:', {
                    error: error.message,
                    horario_id: horarioId,
                    organizacion_id: organizacionId
                });
                throw error;
            }
        });
    }

    /**
     * Actualizar horario existente
     *
     * @param {number} horarioId - ID del horario
     * @param {number} organizacionId - ID de la organización
     * @param {Object} datosActualizacion - Datos a actualizar
     * @param {Object} auditoria - { usuario_id }
     * @returns {Promise<Object>} Horario actualizado
     */
    static async actualizar(horarioId, organizacionId, datosActualizacion, auditoria = {}) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            try {
                // Verificar que el horario existe
                const horarioExistente = await db.query(`
                    SELECT id, profesional_id, activo
                    FROM horarios_profesionales
                    WHERE id = $1 AND organizacion_id = $2
                    FOR UPDATE
                `, [horarioId, organizacionId]);

                if (horarioExistente.rows.length === 0) {
                    throw new Error('Horario no encontrado o sin permisos para actualizar');
                }

                // Validar tipo_horario y permite_citas sean consistentes
                if (datosActualizacion.tipo_horario && ['break', 'almuerzo'].includes(datosActualizacion.tipo_horario)) {
                    if (datosActualizacion.permite_citas === true) {
                        throw new Error('Los horarios de tipo "break" o "almuerzo" no pueden permitir citas');
                    }
                    datosActualizacion.permite_citas = false;
                }

                const camposActualizar = [];
                const valoresActualizar = [horarioId, organizacionId];
                let paramCounter = 3;

                const camposPermitidos = [
                    'dia_semana', 'hora_inicio', 'hora_fin', 'zona_horaria',
                    'tipo_horario', 'nombre_horario', 'descripcion',
                    'permite_citas',
                    'precio_premium', 'permite_descuentos',
                    'fecha_inicio', 'fecha_fin', 'motivo_vigencia',
                    'capacidad_maxima', 'configuracion_especial',
                    'activo', 'prioridad'
                ];

                camposPermitidos.forEach(campo => {
                    // Solo actualizar si el campo está presente Y no es undefined
                    if (datosActualizacion.hasOwnProperty(campo) && datosActualizacion[campo] !== undefined) {
                        camposActualizar.push(`${campo} = $${paramCounter}`);
                        valoresActualizar.push(datosActualizacion[campo]);
                        paramCounter++;
                    }
                });

                if (camposActualizar.length === 0) {
                    throw new Error('No hay campos válidos para actualizar');
                }

                camposActualizar.push(
                    `actualizado_por = $${paramCounter}`,
                    `actualizado_en = NOW()`
                );
                valoresActualizar.push(auditoria.usuario_id || null);

                const updateQuery = `
                    UPDATE horarios_profesionales
                    SET ${camposActualizar.join(', ')}
                    WHERE id = $1 AND organizacion_id = $2
                    RETURNING id, organizacion_id, profesional_id, dia_semana,
                             hora_inicio, hora_fin, tipo_horario, nombre_horario,
                             permite_citas, activo, actualizado_en
                `;

                const result = await db.query(updateQuery, valoresActualizar);

                logger.info('[HorarioProfesionalModel.actualizar] Horario actualizado', {
                    horario_id: horarioId,
                    campos_actualizados: Object.keys(datosActualizacion)
                });

                return {
                    ...result.rows[0],
                    cambios_aplicados: Object.keys(datosActualizacion)
                };

            } catch (error) {
                // Manejar errores de constraints igual que en crear()
                if (error.code === '23514') {
                    if (error.message.includes('valid_horario_base')) {
                        throw new Error('La hora de fin debe ser mayor que la hora de inicio');
                    }
                    if (error.message.includes('valid_duracion_minima_horario')) {
                        throw new Error('El horario debe tener al menos 15 minutos de duración');
                    }
                    if (error.message.includes('valid_vigencia_temporal')) {
                        throw new Error('La fecha de fin debe ser mayor o igual a la fecha de inicio');
                    }
                }

                if (error.message.includes('se solapa con otro horario')) {
                    throw new Error('El horario actualizado se solapa con otro horario existente del profesional');
                }

                logger.error('[HorarioProfesionalModel.actualizar] Error actualizando horario:', {
                    error: error.message,
                    horario_id: horarioId,
                    organizacion_id: organizacionId
                });
                throw error;
            }
        });
    }

    /**
     * Eliminar horario (soft delete)
     *
     * @param {number} horarioId - ID del horario
     * @param {number} organizacionId - ID de la organización
     * @param {Object} auditoria - { usuario_id }
     * @returns {Promise<Object>} Confirmación de eliminación
     */
    static async eliminar(horarioId, organizacionId, auditoria = {}) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            try {
                // Verificar que existe el horario
                const horarioExistente = await db.query(`
                    SELECT id, profesional_id, dia_semana, hora_inicio, hora_fin
                    FROM horarios_profesionales
                    WHERE id = $1 AND organizacion_id = $2 AND activo = true
                `, [horarioId, organizacionId]);

                if (horarioExistente.rows.length === 0) {
                    throw new Error('Horario no encontrado o ya está inactivo');
                }

                // Verificar que el profesional tenga al menos otro horario activo que permita citas
                const horariosActivosRestantes = await db.query(`
                    SELECT COUNT(*) as total
                    FROM horarios_profesionales
                    WHERE profesional_id = $1
                      AND organizacion_id = $2
                      AND activo = true
                      AND permite_citas = true
                      AND id != $3
                `, [horarioExistente.rows[0].profesional_id, organizacionId, horarioId]);

                const totalRestantes = parseInt(horariosActivosRestantes.rows[0].total);

                if (totalRestantes === 0) {
                    logger.warn('[HorarioProfesionalModel.eliminar] Eliminando último horario del profesional', {
                        horario_id: horarioId,
                        profesional_id: horarioExistente.rows[0].profesional_id
                    });
                }

                // Soft delete
                const result = await db.query(`
                    UPDATE horarios_profesionales
                    SET activo = false,
                        actualizado_por = $3,
                        actualizado_en = NOW()
                    WHERE id = $1 AND organizacion_id = $2
                    RETURNING id, dia_semana, hora_inicio, hora_fin
                `, [horarioId, organizacionId, auditoria.usuario_id || null]);

                logger.info('[HorarioProfesionalModel.eliminar] Horario eliminado', {
                    horario_id: horarioId,
                    horarios_restantes: totalRestantes
                });

                return {
                    eliminado: true,
                    horario_id: horarioId,
                    horarios_activos_restantes: totalRestantes,
                    advertencia: totalRestantes === 0 ? 'El profesional no tiene horarios activos que permitan citas' : null
                };

            } catch (error) {
                logger.error('[HorarioProfesionalModel.eliminar] Error eliminando horario:', {
                    error: error.message,
                    horario_id: horarioId,
                    organizacion_id: organizacionId
                });
                throw error;
            }
        });
    }

    /**
     * Validar si un profesional tiene horarios configurados
     *
     * @param {number} profesionalId - ID del profesional
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Estado de configuración de horarios
     */
    static async validarProfesionalTieneHorarios(profesionalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            try {
                const query = `
                    SELECT
                        COUNT(*) FILTER (WHERE activo = true) as horarios_activos,
                        COUNT(*) FILTER (WHERE activo = true AND permite_citas = true) as horarios_permiten_citas,
                        COUNT(DISTINCT dia_semana) FILTER (WHERE activo = true AND permite_citas = true) as dias_configurados,
                        MIN(fecha_inicio) as fecha_inicio_mas_antigua,
                        MAX(fecha_fin) as fecha_fin_mas_reciente
                    FROM horarios_profesionales
                    WHERE profesional_id = $1 AND organizacion_id = $2
                `;

                const result = await db.query(query, [profesionalId, organizacionId]);
                const stats = result.rows[0];

                const tieneHorarios = parseInt(stats.horarios_activos) > 0;
                const puedeRecibirCitas = parseInt(stats.horarios_permiten_citas) > 0;

                return {
                    tiene_horarios: tieneHorarios,
                    puede_recibir_citas: puedeRecibirCitas,
                    horarios_activos: parseInt(stats.horarios_activos),
                    horarios_permiten_citas: parseInt(stats.horarios_permiten_citas),
                    dias_configurados: parseInt(stats.dias_configurados),
                    configuracion_completa: puedeRecibirCitas && parseInt(stats.dias_configurados) >= 1,
                    fecha_inicio_mas_antigua: stats.fecha_inicio_mas_antigua,
                    fecha_fin_mas_reciente: stats.fecha_fin_mas_reciente
                };

            } catch (error) {
                logger.error('[HorarioProfesionalModel.validarProfesionalTieneHorarios] Error validando:', {
                    error: error.message,
                    profesional_id: profesionalId,
                    organizacion_id: organizacionId
                });
                throw error;
            }
        });
    }

    /**
     * Crear horarios semanales estándar para un profesional
     * Helper para crear horarios de Lunes-Viernes con el mismo horario
     *
     * @param {number} profesionalId - ID del profesional
     * @param {number} organizacionId - ID de la organización
     * @param {Object} configuracion - Configuración del horario estándar
     * @param {Object} auditoria - { usuario_id }
     * @returns {Promise<Array>} Horarios creados
     */
    static async crearHorariosSemanalesEstandar(profesionalId, organizacionId, configuracion, auditoria = {}) {
        const {
            dias = [1, 2, 3, 4, 5], // Lunes a Viernes por defecto
            hora_inicio = '09:00:00',
            hora_fin = '18:00:00',
            tipo_horario = 'regular',
            nombre_horario = 'Horario Laboral',
            fecha_inicio = new Date().toISOString().split('T')[0]
        } = configuracion;

        const horariosCreados = [];

        for (const dia of dias) {
            try {
                const horario = await this.crear({
                    organizacion_id: organizacionId,
                    profesional_id: profesionalId,
                    dia_semana: dia,
                    hora_inicio,
                    hora_fin,
                    tipo_horario,
                    nombre_horario,
                    permite_citas: true,
                    fecha_inicio,
                    activo: true
                }, auditoria);

                horariosCreados.push(horario);
            } catch (error) {
                logger.error('[HorarioProfesionalModel.crearHorariosSemanalesEstandar] Error en día', {
                    dia_semana: dia,
                    error: error.message
                });
                // Continuar con los siguientes días aunque uno falle
            }
        }

        logger.info('[HorarioProfesionalModel.crearHorariosSemanalesEstandar] Horarios estándar creados', {
            profesional_id: profesionalId,
            horarios_creados: horariosCreados.length,
            dias_configurados: dias
        });

        return horariosCreados;
    }
}

module.exports = HorarioProfesionalModel;
