const { getDb } = require('../config/database');
const logger = require('../utils/logger');
const HorarioHelpers = require('../utils/horarioHelpers');

class HorarioModel {

    static async consultarDisponibilidad(filtros) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', filtros.organizacion_id.toString()]);

            const {
                profesional_id = null,
                servicio_id = null,
                fecha_inicio = null,
                fecha_fin = null,
                dias_semana = null,
                hora_inicio = null,
                hora_fin = null,
                duracion_servicio = 30,
                limite = 50
            } = filtros;

            const fechaInicioFinal = fecha_inicio || new Date().toISOString().split('T')[0];
            const fechaFinFinal = fecha_fin || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // Query complejo para disponibilidad con validación de conflictos y duración
            let query = `
                WITH profesionales_validos AS (
                    SELECT DISTINCT p.id, p.nombre_completo, p.tipo_profesional
                    FROM profesionales p
                    WHERE p.organizacion_id = $1
                      AND p.activo = true
                      AND p.disponible_online = true
            `;

            const queryParams = [filtros.organizacion_id];
            let paramCounter = 2;

            if (profesional_id) {
                query += ` AND p.id = $${paramCounter}`;
                queryParams.push(profesional_id);
                paramCounter++;
            }

            if (servicio_id) {
                query += ` AND EXISTS (
                    SELECT 1 FROM servicios_profesionales sp
                    WHERE sp.profesional_id = p.id
                      AND sp.servicio_id = $${paramCounter}
                      AND sp.activo = true
                )`;
                queryParams.push(servicio_id);
                paramCounter++;
            }

            query += `
                ), horarios_base AS (
                    SELECT
                        hd.*,
                        pv.nombre_completo as profesional_nombre,
                        pv.tipo_profesional,
                        CASE
                            WHEN $${paramCounter + 3}::INTEGER IS NOT NULL THEN
                                hd.duracion_slot >= ($${paramCounter}::INTEGER + COALESCE((
                                    SELECT s.tiempo_limpieza_minutos
                                    FROM servicios s
                                    WHERE s.id = $${paramCounter + 3}::INTEGER
                                ), 0))
                            ELSE
                                hd.duracion_slot >= $${paramCounter}::INTEGER
                        END as duracion_suficiente,
                        CASE
                            WHEN NOT EXISTS (
                                SELECT 1 FROM citas c
                                WHERE c.profesional_id = hd.profesional_id
                                  AND c.estado IN ('confirmada', 'en_curso')
                                  AND c.fecha_cita = hd.fecha
                                  AND c.hora_inicio < hd.hora_fin
                                  AND c.hora_fin > hd.hora_inicio
                            ) AND NOT esta_bloqueado_horario(
                                hd.organizacion_id,
                                hd.profesional_id,
                                hd.fecha,
                                hd.hora_inicio,
                                hd.hora_fin
                            ) THEN true
                            ELSE false
                        END as sin_conflictos_citas
                    FROM horarios_disponibilidad hd
                    JOIN profesionales_validos pv ON hd.profesional_id = pv.id
                    WHERE hd.organizacion_id = $1
                      AND hd.estado = 'disponible'
                      AND hd.fecha >= $${paramCounter + 1}::DATE
                      AND hd.fecha <= $${paramCounter + 2}::DATE
            `;

            queryParams.push(duracion_servicio, fechaInicioFinal, fechaFinFinal, servicio_id);
            paramCounter += 4;

            if (dias_semana && dias_semana.length > 0) {
                const diasPlaceholders = dias_semana.map((_, index) => `$${paramCounter + index}`).join(',');
                query += ` AND LOWER(to_char(hd.fecha, 'TMDay')) IN (${diasPlaceholders})`;
                queryParams.push(...dias_semana.map(dia => dia.toLowerCase()));
                paramCounter += dias_semana.length;
            }

            if (hora_inicio) {
                query += ` AND EXTRACT(HOUR FROM hd.hora_inicio) * 60 + EXTRACT(MINUTE FROM hd.hora_inicio) >=
                          EXTRACT(HOUR FROM $${paramCounter}::time) * 60 + EXTRACT(MINUTE FROM $${paramCounter}::time)`;
                queryParams.push(hora_inicio);
                paramCounter++;
            }

            if (hora_fin) {
                query += ` AND EXTRACT(HOUR FROM hd.hora_inicio) * 60 + EXTRACT(MINUTE FROM hd.hora_inicio) <=
                          EXTRACT(HOUR FROM $${paramCounter}::time) * 60 + EXTRACT(MINUTE FROM $${paramCounter}::time)`;
                queryParams.push(hora_fin);
                paramCounter++;
            }

            query += `
                )
                SELECT
                    profesional_id,
                    profesional_nombre,
                    tipo_profesional,
                    fecha,
                    to_char(fecha, 'TMDay') as dia_semana,
                    array_agg(
                        json_build_object(
                            'id', id,
                            'fecha', fecha,
                            'hora_inicio', hora_inicio,
                            'hora_fin', hora_fin,
                            'duracion_slot', duracion_slot,
                            'hora_inicio_fmt', to_char(hora_inicio, 'HH24:MI'),
                            'hora_fin_fmt', to_char(hora_fin, 'HH24:MI'),
                            'disponible', (duracion_suficiente AND sin_conflictos_citas),
                            'precio_base', precio_base,
                            'precio_dinamico', precio_dinamico,
                            'es_premium', es_horario_premium,
                            'descuento_porcentaje', descuento_porcentaje,
                            'precio_final', COALESCE(precio_dinamico, precio_base, 0) * (1 - COALESCE(descuento_porcentaje, 0) / 100)
                        ) ORDER BY hora_inicio
                    ) as slots_disponibles,
                    COUNT(*) as total_slots,
                    COUNT(*) FILTER (WHERE duracion_suficiente AND sin_conflictos_citas) as slots_libres,
                    MIN(hora_inicio) as primer_slot,
                    MAX(hora_inicio) as ultimo_slot
                FROM horarios_base
                GROUP BY profesional_id, profesional_nombre, tipo_profesional, fecha,
                         to_char(fecha, 'TMDay')
                HAVING COUNT(*) FILTER (WHERE duracion_suficiente AND sin_conflictos_citas) > 0
                ORDER BY fecha, profesional_nombre, MIN(hora_inicio)
                LIMIT $${paramCounter}
            `;

            queryParams.push(limite);

            const result = await db.query(query, queryParams);

            return HorarioHelpers.procesarRespuestaDisponibilidad(
                result.rows,
                filtros,
                fechaInicioFinal,
                fechaFinFinal,
                duracion_servicio
            );

        } catch (error) {
            logger.error('[HorarioModel.consultarDisponibilidad] Error:', {
                error: error.message,
                organizacion_id: filtros.organizacion_id
            });
            throw new Error(`Error en consulta de disponibilidad: ${error.message}`);
        } finally {
            db.release();
        }
    }

    static async reservarTemporalmente(horarioId, organizacionId, duracionMinutos = 15, motivoReserva = 'Reserva IA', auditoria = {}) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            // Primero adquirir lock (sin filtrar por estado para forzar conflict)
            const lockQuery = `
                SELECT id, profesional_id, fecha, hora_inicio, hora_fin,
                       duracion_slot, estado, reservado_hasta
                FROM horarios_disponibilidad
                WHERE id = $1
                  AND organizacion_id = $2
                FOR UPDATE NOWAIT
            `;

            const lockResult = await db.query(lockQuery, [horarioId, organizacionId]);

            if (lockResult.rows.length === 0) {
                throw new Error('Horario no encontrado');
            }

            const slot = lockResult.rows[0];

            // Validar disponibilidad DESPUÉS del lock
            if (slot.estado !== 'disponible') {
                throw new Error('El horario ya está reservado');
            }

            if (slot.reservado_hasta && new Date(slot.reservado_hasta) >= new Date()) {
                throw new Error('El horario ya está reservado temporalmente');
            }
            const reservadoHasta = new Date(Date.now() + duracionMinutos * 60000);

            const reservarQuery = `
                UPDATE horarios_disponibilidad
                SET
                    estado = 'reservado_temporal',
                    reservado_hasta = $1,
                    session_id = $3,
                    reservado_por = $4,
                    actualizado_por = $5,
                    ip_origen = $6,
                    user_agent = $7,
                    actualizado_en = NOW(),
                    version = version + 1
                WHERE id = $2
                RETURNING id, profesional_id, fecha, hora_inicio, hora_fin,
                         estado, reservado_hasta, session_id, version
            `;

            await db.query(reservarQuery, [
                reservadoHasta,
                horarioId,
                auditoria.session_id || null,
                auditoria.usuario_id ? `Usuario:${auditoria.usuario_id}` : motivoReserva,
                auditoria.usuario_id || null,
                auditoria.ip_origen || null,
                auditoria.user_agent?.substring(0, 255) || null
            ]);

            await db.query('COMMIT');

            return {
                reserva_exitosa: true,
                horario_id: horarioId,
                profesional_id: slot.profesional_id,
                fecha: slot.fecha,
                hora_inicio: slot.hora_inicio,
                hora_fin: slot.hora_fin,
                reservado_hasta: reservadoHasta,
                duracion_reserva_minutos: duracionMinutos,
                motivo: motivoReserva
            };

        } catch (error) {
            await db.query('ROLLBACK');

            // Detectar error de lock conflict (otro usuario está reservando el mismo horario)
            if (error.code === '55P03') {
                logger.warn('[HorarioModel.reservarTemporalmente] Lock conflict:', {
                    horario_id: horarioId,
                    organizacion_id: organizacionId
                });
                throw new Error('El horario ya está siendo reservado por otro usuario');
            }

            logger.error('[HorarioModel.reservarTemporalmente] Error:', { error: error.message });
            throw error;
        } finally {
            db.release();
        }
    }

    static async liberarReservaTemporalHorario(horarioId, organizacionId, auditoria = {}) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const query = `
                UPDATE horarios_disponibilidad
                SET
                    estado = 'disponible',
                    reservado_hasta = NULL,
                    session_id = NULL,
                    reservado_por = NULL,
                    actualizado_por = $3,
                    ip_origen = $4,
                    actualizado_en = NOW(),
                    version = version + 1
                WHERE id = $1 AND organizacion_id = $2
                  AND estado = 'reservado_temporal'
                RETURNING id, version
            `;

            const result = await db.query(query, [
                horarioId,
                organizacionId,
                auditoria.usuario_id || null,
                auditoria.ip_origen || null
            ]);

            return result.rowCount > 0;

        } catch (error) {
            logger.error('[HorarioModel.liberarReservaTemporalHorario] Error:', { error: error.message });
            throw error;
        } finally {
            db.release();
        }
    }

    static async crear(datosHorario, auditoria = {}) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', datosHorario.organizacion_id.toString()]);

            const validarProfesional = await db.query(`
                SELECT id, nombre_completo, tipo_profesional
                FROM profesionales
                WHERE id = $1 AND organizacion_id = $2 AND activo = true
            `, [datosHorario.profesional_id, datosHorario.organizacion_id]);

            if (validarProfesional.rows.length === 0) {
                throw new Error('El profesional no existe o no pertenece a esta organización');
            }

            const verificarSolapamiento = await db.query(`
                SELECT id, hora_inicio, hora_fin
                FROM horarios_disponibilidad
                WHERE organizacion_id = $1
                  AND profesional_id = $2
                  AND fecha = $3::date
                  AND estado != 'bloqueado'
                  AND (
                    (hora_inicio <= $4::time AND hora_fin > $4::time) OR
                    (hora_inicio < $5::time AND hora_fin >= $5::time) OR
                    (hora_inicio >= $4::time AND hora_fin <= $5::time)
                  )
            `, [
                datosHorario.organizacion_id,
                datosHorario.profesional_id,
                datosHorario.fecha,
                datosHorario.hora_inicio,
                datosHorario.hora_fin
            ]);

            if (verificarSolapamiento.rows.length > 0) {
                throw new Error(`Ya existe un horario en conflicto: ${verificarSolapamiento.rows[0].hora_inicio}-${verificarSolapamiento.rows[0].hora_fin}`);
            }

            const insertQuery = `
                INSERT INTO horarios_disponibilidad (
                    organizacion_id, profesional_id, servicio_id, tipo_horario,
                    fecha, hora_inicio, hora_fin, zona_horaria,
                    dia_semana, es_recurrente, fecha_fin_recurrencia,
                    estado, duracion_slot, capacidad_maxima,
                    precio_base, es_horario_premium,
                    creado_automaticamente, algoritmo_creacion,
                    creado_por, ip_origen, user_agent, creado_en
                )
                VALUES (
                    $1, $2, $3, $4, $5::date, $6::time, $7::time, $8,
                    $9, $10, $11::date, $12, $13, $14, $15, $16,
                    $17, $18, $19, $20, $21, NOW()
                )
                RETURNING id, organizacion_id, profesional_id, tipo_horario,
                         fecha, hora_inicio, hora_fin, estado, duracion_slot,
                         precio_base, es_horario_premium, creado_en, version
            `;

            const result = await db.query(insertQuery, [
                datosHorario.organizacion_id,
                datosHorario.profesional_id,
                datosHorario.servicio_id || null,
                datosHorario.tipo_horario,
                datosHorario.fecha,
                datosHorario.hora_inicio,
                datosHorario.hora_fin,
                datosHorario.zona_horaria || 'America/Mexico_City',
                datosHorario.dia_semana || null,
                datosHorario.es_recurrente || false,
                datosHorario.fecha_fin_recurrencia || null,
                'disponible', // Estado por defecto
                datosHorario.duracion_slot || 15,
                datosHorario.capacidad_maxima || 1,
                datosHorario.precio_base || null,
                datosHorario.es_horario_premium || false,
                false,
                'manual',
                auditoria.usuario_id || null,
                auditoria.ip_origen || null,
                auditoria.user_agent?.substring(0, 255) || null
            ]);

            await db.query('COMMIT');

            return {
                ...result.rows[0],
                profesional_info: validarProfesional.rows[0]
            };

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[HorarioModel.crear] Error:', { error: error.message });
            throw error;
        } finally {
            db.release();
        }
    }

    static async obtener(filtros) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', filtros.organizacion_id.toString()]);

            const limite = Math.min(filtros.limite || 50, 100);
            const offset = filtros.offset || 0;

            let whereClause = 'WHERE hd.organizacion_id = $1';
            const queryParams = [filtros.organizacion_id];
            let paramCounter = 2;

            if (filtros.id) {
                whereClause += ` AND hd.id = $${paramCounter}`;
                queryParams.push(filtros.id);
                paramCounter++;
            }

            if (filtros.profesional_id) {
                whereClause += ` AND hd.profesional_id = $${paramCounter}`;
                queryParams.push(filtros.profesional_id);
                paramCounter++;
            }

            if (filtros.fecha) {
                whereClause += ` AND hd.fecha = $${paramCounter}::date`;
                queryParams.push(filtros.fecha);
                paramCounter++;
            }

            if (filtros.estado) {
                whereClause += ` AND hd.estado = $${paramCounter}`;
                queryParams.push(filtros.estado);
                paramCounter++;
            }

            const query = `
                SELECT
                    hd.id, hd.organizacion_id, hd.profesional_id, hd.servicio_id,
                    hd.tipo_horario, hd.fecha, hd.hora_inicio, hd.hora_fin,
                    hd.zona_horaria, hd.dia_semana, hd.es_recurrente,
                    hd.fecha_fin_recurrencia, hd.estado, hd.duracion_slot,
                    hd.capacidad_maxima, hd.capacidad_ocupada,
                    hd.precio_base, hd.precio_dinamico, hd.es_horario_premium,
                    hd.descuento_porcentaje, hd.creado_en, hd.actualizado_en,
                    hd.version,
                    p.nombre_completo as profesional_nombre,
                    p.tipo_profesional,
                    s.nombre as servicio_nombre,
                    to_char(hd.fecha, 'DD/MM/YYYY') as fecha_formateada,
                    to_char(hd.hora_inicio, 'HH24:MI') as hora_inicio_fmt,
                    to_char(hd.hora_fin, 'HH24:MI') as hora_fin_fmt,
                    to_char(hd.fecha, 'TMDay') as dia_semana_texto,
                    COALESCE(hd.precio_dinamico, hd.precio_base, 0) *
                    (1 - COALESCE(hd.descuento_porcentaje, 0) / 100) as precio_final
                FROM horarios_disponibilidad hd
                LEFT JOIN profesionales p ON hd.profesional_id = p.id
                LEFT JOIN servicios s ON hd.servicio_id = s.id
                ${whereClause}
                ORDER BY hd.fecha, hd.hora_inicio, p.nombre_completo
                LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
            `;

            queryParams.push(limite, offset);

            const countQuery = `
                SELECT COUNT(*) as total
                FROM horarios_disponibilidad hd
                ${whereClause}
            `;

            const [dataResult, countResult] = await Promise.all([
                db.query(query, queryParams),
                db.query(countQuery, queryParams.slice(0, -2))
            ]);

            const total = parseInt(countResult.rows[0].total);

            return {
                horarios: dataResult.rows,
                paginacion: {
                    total,
                    limite,
                    offset,
                    pagina_actual: Math.floor(offset / limite) + 1,
                    total_paginas: Math.ceil(total / limite)
                },
                filtros_aplicados: {
                    organizacion_id: filtros.organizacion_id,
                    id: filtros.id,
                    profesional_id: filtros.profesional_id,
                    fecha: filtros.fecha,
                    estado: filtros.estado
                }
            };

        } catch (error) {
            logger.error('[HorarioModel.obtener] Error:', { error: error.message });
            throw error;
        } finally {
            db.release();
        }
    }

    static async actualizar(horarioId, organizacionId, datosActualizacion, auditoria = {}) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const horarioExistente = await db.query(`
                SELECT id, profesional_id, fecha, hora_inicio, hora_fin,
                       estado, version
                FROM horarios_disponibilidad
                WHERE id = $1 AND organizacion_id = $2
                FOR UPDATE
            `, [horarioId, organizacionId]);

            if (horarioExistente.rows.length === 0) {
                throw new Error('Horario no encontrado o sin permisos para actualizar');
            }

            const horarioActual = horarioExistente.rows[0];

            if (datosActualizacion.hora_inicio || datosActualizacion.hora_fin || datosActualizacion.fecha) {
                const nuevaFecha = datosActualizacion.fecha || horarioActual.fecha;
                const nuevaHoraInicio = datosActualizacion.hora_inicio || horarioActual.hora_inicio;
                const nuevaHoraFin = datosActualizacion.hora_fin || horarioActual.hora_fin;

                const verificarConflicto = await db.query(`
                    SELECT id
                    FROM horarios_disponibilidad
                    WHERE organizacion_id = $1
                      AND profesional_id = $2
                      AND fecha = $3::date
                      AND id != $4
                      AND estado != 'bloqueado'
                      AND (
                        (hora_inicio <= $5::time AND hora_fin > $5::time) OR
                        (hora_inicio < $6::time AND hora_fin >= $6::time) OR
                        (hora_inicio >= $5::time AND hora_fin <= $6::time)
                      )
                `, [organizacionId, horarioActual.profesional_id, nuevaFecha, horarioId, nuevaHoraInicio, nuevaHoraFin]);

                if (verificarConflicto.rows.length > 0) {
                    throw new Error('La actualización genera conflicto con otro horario existente');
                }
            }

            const camposActualizar = [];
            const valoresActualizar = [horarioId, organizacionId];
            let paramCounter = 3;

            const camposPermitidos = [
                'tipo_horario', 'fecha', 'hora_inicio', 'hora_fin', 'zona_horaria',
                'dia_semana', 'es_recurrente', 'fecha_fin_recurrencia',
                'estado', 'duracion_slot', 'capacidad_maxima',
                'precio_base', 'precio_dinamico', 'es_horario_premium',
                'descuento_porcentaje'
            ];

            camposPermitidos.forEach(campo => {
                if (datosActualizacion.hasOwnProperty(campo)) {
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
                `ip_origen = $${paramCounter + 1}`,
                `actualizado_en = NOW()`,
                `version = version + 1`
            );
            valoresActualizar.push(
                auditoria.usuario_id || null,
                auditoria.ip_origen || null
            );

            const updateQuery = `
                UPDATE horarios_disponibilidad
                SET ${camposActualizar.join(', ')}
                WHERE id = $1 AND organizacion_id = $2
                RETURNING id, organizacion_id, profesional_id, tipo_horario,
                         fecha, hora_inicio, hora_fin, estado, duracion_slot,
                         precio_base, precio_dinamico, es_horario_premium,
                         actualizado_en, version
            `;

            const result = await db.query(updateQuery, valoresActualizar);

            await db.query('COMMIT');

            return {
                ...result.rows[0],
                cambios_aplicados: Object.keys(datosActualizacion)
            };

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[HorarioModel.actualizar] Error:', { error: error.message });
            throw error;
        } finally {
            db.release();
        }
    }

    static async eliminar(horarioId, organizacionId, auditoria = {}) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const horarioExistente = await db.query(`
                SELECT id, profesional_id, fecha, hora_inicio, hora_fin,
                       estado, cita_id
                FROM horarios_disponibilidad
                WHERE id = $1 AND organizacion_id = $2
                FOR UPDATE
            `, [horarioId, organizacionId]);

            if (horarioExistente.rows.length === 0) {
                throw new Error('Horario no encontrado o sin permisos para eliminar');
            }

            const horario = horarioExistente.rows[0];

            if (horario.cita_id) {
                const citaEstado = await db.query(`
                    SELECT estado FROM citas WHERE id = $1
                `, [horario.cita_id]);

                if (citaEstado.rows.length > 0 &&
                    ['confirmada', 'en_curso'].includes(citaEstado.rows[0].estado)) {
                    throw new Error('No se puede eliminar un horario con cita confirmada o en curso');
                }
            }

            const result = await db.query(`
                UPDATE horarios_disponibilidad
                SET
                    estado = 'bloqueado',
                    tipo_horario = 'bloqueo',
                    actualizado_por = $3,
                    ip_origen = $4,
                    actualizado_en = NOW(),
                    version = version + 1
                WHERE id = $1 AND organizacion_id = $2
                RETURNING id, fecha, hora_inicio, hora_fin, version
            `, [
                horarioId,
                organizacionId,
                auditoria.usuario_id || null,
                auditoria.ip_origen || null
            ]);

            await db.query('COMMIT');

            return {
                eliminado: true,
                horario_id: horarioId,
                fecha: result.rows[0].fecha,
                horario: `${result.rows[0].hora_inicio}-${result.rows[0].hora_fin}`
            };

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[HorarioModel.eliminar] Error:', { error: error.message });
            throw error;
        } finally {
            db.release();
        }
    }

    static async limpiarReservasExpiradas(organizacionId) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const query = `
                UPDATE horarios_disponibilidad
                SET
                    estado = 'disponible',
                    reservado_hasta = NULL,
                    actualizado_en = NOW()
                WHERE organizacion_id = $1
                  AND estado = 'reservado_temporal'
                  AND reservado_hasta < NOW()
                RETURNING id
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rowCount;

        } catch (error) {
            logger.error('[HorarioModel.limpiarReservasExpiradas] Error:', { error: error.message });
            throw error;
        } finally {
            db.release();
        }
    }
}

module.exports = HorarioModel;