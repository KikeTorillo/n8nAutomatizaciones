/**
 * @fileoverview Modelo de Horarios para sistema SaaS con IA
 * @description CRÍTICO PARA IA - Maneja consulta y gestión de horarios disponibles
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

const { getDb } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modelo Horarios - CRÍTICO para operaciones de IA
 * @class HorarioModel
 */
class HorarioModel {

    /**
     * 🤖 SÚPER CRÍTICO PARA IA: Consultar horarios disponibles
     * Esta función es la MÁS IMPORTANTE para que la IA pueda agendar citas
     * @param {Object} filtros - Filtros de búsqueda
     * @param {number} filtros.organizacion_id - ID de la organización (REQUERIDO)
     * @param {number} [filtros.profesional_id] - ID del profesional específico
     * @param {number} [filtros.servicio_id] - ID del servicio (para filtrar profesionales compatibles)
     * @param {string} [filtros.fecha_inicio] - Fecha inicio en formato 'YYYY-MM-DD'
     * @param {string} [filtros.fecha_fin] - Fecha fin en formato 'YYYY-MM-DD'
     * @param {Array<string>} [filtros.dias_semana] - Días específicos ['lunes', 'martes', ...]
     * @param {string} [filtros.hora_inicio] - Hora mínima en formato 'HH:MM'
     * @param {string} [filtros.hora_fin] - Hora máxima en formato 'HH:MM'
     * @param {number} [filtros.duracion_servicio] - Duración en minutos para verificar disponibilidad
     * @param {number} [filtros.limite] - Límite de resultados (default: 50)
     * @returns {Promise<Object>} Horarios disponibles agrupados por profesional y fecha
     */
    static async consultarDisponibilidad(filtros) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
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

            logger.info('[HorarioModel.consultarDisponibilidad] Iniciando consulta', {
                organizacion_id: filtros.organizacion_id,
                profesional_id,
                servicio_id,
                fecha_inicio,
                fecha_fin,
                duracion_servicio
            });

            // Calcular fechas por defecto (próximos 7 días)
            const fechaInicioFinal = fecha_inicio || new Date().toISOString().split('T')[0];
            const fechaFinFinal = fecha_fin || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // Construir query principal con filtros dinámicos
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

            // Filtro por profesional específico
            if (profesional_id) {
                query += ` AND p.id = $${paramCounter}`;
                queryParams.push(profesional_id);
                paramCounter++;
            }

            // Filtro por compatibilidad con servicio
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
                        -- Calcular si el slot tiene duración suficiente
                        CASE
                            WHEN hd.duracion_minutos >= $${paramCounter} THEN true
                            ELSE false
                        END as duracion_suficiente,
                        -- Verificar si no hay citas conflictivas
                        CASE
                            WHEN NOT EXISTS (
                                SELECT 1 FROM citas c
                                WHERE c.profesional_id = hd.profesional_id
                                  AND c.estado IN ('confirmada', 'en_progreso')
                                  AND (
                                    (c.fecha_hora_inicio <= hd.fecha_hora_inicio AND c.fecha_hora_fin > hd.fecha_hora_inicio)
                                    OR (c.fecha_hora_inicio < hd.fecha_hora_fin AND c.fecha_hora_fin >= hd.fecha_hora_fin)
                                    OR (c.fecha_hora_inicio >= hd.fecha_hora_inicio AND c.fecha_hora_fin <= hd.fecha_hora_fin)
                                  )
                            ) THEN true
                            ELSE false
                        END as sin_conflictos_citas
                    FROM horarios_disponibilidad hd
                    JOIN profesionales_validos pv ON hd.profesional_id = pv.id
                    WHERE hd.organizacion_id = $1
                      AND hd.estado = 'disponible'
                      AND hd.fecha_hora_inicio >= $${paramCounter + 1}::timestamp
                      AND hd.fecha_hora_inicio <= $${paramCounter + 2}::timestamp + interval '1 day'
            `;

            queryParams.push(duracion_servicio, `${fechaInicioFinal} 00:00:00`, `${fechaFinFinal} 23:59:59`);
            paramCounter += 3;

            // Filtros adicionales
            if (dias_semana && dias_semana.length > 0) {
                const diasPlaceholders = dias_semana.map((_, index) => `$${paramCounter + index}`).join(',');
                query += ` AND LOWER(to_char(hd.fecha_hora_inicio, 'TMDay')) IN (${diasPlaceholders})`;
                queryParams.push(...dias_semana.map(dia => dia.toLowerCase()));
                paramCounter += dias_semana.length;
            }

            if (hora_inicio) {
                query += ` AND EXTRACT(HOUR FROM hd.fecha_hora_inicio) * 60 + EXTRACT(MINUTE FROM hd.fecha_hora_inicio) >=
                          EXTRACT(HOUR FROM $${paramCounter}::time) * 60 + EXTRACT(MINUTE FROM $${paramCounter}::time)`;
                queryParams.push(hora_inicio);
                paramCounter++;
            }

            if (hora_fin) {
                query += ` AND EXTRACT(HOUR FROM hd.fecha_hora_inicio) * 60 + EXTRACT(MINUTE FROM hd.fecha_hora_inicio) <=
                          EXTRACT(HOUR FROM $${paramCounter}::time) * 60 + EXTRACT(MINUTE FROM $${paramCounter}::time)`;
                queryParams.push(hora_fin);
                paramCounter++;
            }

            // Completar query con agrupación y ordenamiento
            query += `
                )
                SELECT
                    profesional_id,
                    profesional_nombre,
                    tipo_profesional,
                    DATE(fecha_hora_inicio) as fecha,
                    to_char(fecha_hora_inicio, 'TMDay') as dia_semana,
                    array_agg(
                        json_build_object(
                            'id', id,
                            'fecha_hora_inicio', fecha_hora_inicio,
                            'fecha_hora_fin', fecha_hora_fin,
                            'duracion_minutos', duracion_minutos,
                            'hora_inicio', to_char(fecha_hora_inicio, 'HH24:MI'),
                            'hora_fin', to_char(fecha_hora_fin, 'HH24:MI'),
                            'disponible', (duracion_suficiente AND sin_conflictos_citas),
                            'razon_no_disponible',
                                CASE
                                    WHEN NOT duracion_suficiente THEN 'duracion_insuficiente'
                                    WHEN NOT sin_conflictos_citas THEN 'conflicto_citas'
                                    ELSE null
                                END
                        ) ORDER BY fecha_hora_inicio
                    ) as slots_disponibles,
                    COUNT(*) as total_slots,
                    COUNT(*) FILTER (WHERE duracion_suficiente AND sin_conflictos_citas) as slots_libres,
                    MIN(fecha_hora_inicio) as primer_slot,
                    MAX(fecha_hora_inicio) as ultimo_slot
                FROM horarios_base
                GROUP BY profesional_id, profesional_nombre, tipo_profesional, DATE(fecha_hora_inicio),
                         to_char(fecha_hora_inicio, 'TMDay')
                HAVING COUNT(*) FILTER (WHERE duracion_suficiente AND sin_conflictos_citas) > 0
                ORDER BY DATE(fecha_hora_inicio), profesional_nombre, MIN(fecha_hora_inicio)
                LIMIT $${paramCounter}
            `;

            queryParams.push(limite);

            // Ejecutar query principal
            const result = await db.query(query, queryParams);

            // Procesar y estructurar resultados para IA
            const horariosPorFecha = {};
            const resumenProfesionales = {};

            result.rows.forEach(row => {
                const fecha = row.fecha.toISOString().split('T')[0];

                if (!horariosPorFecha[fecha]) {
                    horariosPorFecha[fecha] = {
                        fecha: fecha,
                        dia_semana: row.dia_semana.trim(),
                        profesionales: {}
                    };
                }

                horariosPorFecha[fecha].profesionales[row.profesional_id] = {
                    profesional_id: row.profesional_id,
                    nombre: row.profesional_nombre,
                    tipo: row.tipo_profesional,
                    slots_disponibles: row.slots_disponibles.filter(slot => slot.disponible),
                    total_slots: parseInt(row.total_slots),
                    slots_libres: parseInt(row.slots_libres),
                    primer_slot: row.primer_slot,
                    ultimo_slot: row.ultimo_slot
                };

                // Resumen por profesional
                if (!resumenProfesionales[row.profesional_id]) {
                    resumenProfesionales[row.profesional_id] = {
                        profesional_id: row.profesional_id,
                        nombre: row.profesional_nombre,
                        tipo: row.tipo_profesional,
                        dias_disponibles: 0,
                        total_slots_libres: 0,
                        proxima_disponibilidad: null
                    };
                }

                resumenProfesionales[row.profesional_id].dias_disponibles++;
                resumenProfesionales[row.profesional_id].total_slots_libres += parseInt(row.slots_libres);

                if (!resumenProfesionales[row.profesional_id].proxima_disponibilidad ||
                    row.primer_slot < resumenProfesionales[row.profesional_id].proxima_disponibilidad) {
                    resumenProfesionales[row.profesional_id].proxima_disponibilidad = row.primer_slot;
                }
            });

            // Calcular estadísticas generales
            const totalDiasConsultados = Object.keys(horariosPorFecha).length;
            const totalProfesionalesDisponibles = Object.keys(resumenProfesionales).length;
            const totalSlotsLibres = Object.values(resumenProfesionales)
                .reduce((sum, prof) => sum + prof.total_slots_libres, 0);

            const respuesta = {
                consulta: {
                    organizacion_id: filtros.organizacion_id,
                    fecha_inicio: fechaInicioFinal,
                    fecha_fin: fechaFinFinal,
                    duracion_servicio: duracion_servicio,
                    filtros_aplicados: { profesional_id, servicio_id, dias_semana, hora_inicio, hora_fin }
                },
                estadisticas: {
                    total_dias_consultados: totalDiasConsultados,
                    total_profesionales_disponibles: totalProfesionalesDisponibles,
                    total_slots_libres: totalSlotsLibres,
                    promedio_slots_por_dia: totalDiasConsultados > 0 ? Math.round(totalSlotsLibres / totalDiasConsultados) : 0
                },
                disponibilidad_por_fecha: horariosPorFecha,
                resumen_profesionales: Object.values(resumenProfesionales),
                recomendacion_ia: this.generarRecomendacionIA(Object.values(resumenProfesionales), duracion_servicio)
            };

            logger.info('[HorarioModel.consultarDisponibilidad] Consulta completada', {
                organizacion_id: filtros.organizacion_id,
                dias_encontrados: totalDiasConsultados,
                profesionales_disponibles: totalProfesionalesDisponibles,
                slots_libres_total: totalSlotsLibres
            });

            return respuesta;

        } catch (error) {
            logger.error('[HorarioModel.consultarDisponibilidad] Error:', {
                error: error.message,
                filtros: filtros
            });
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * 🤖 CRÍTICO PARA IA: Reservar temporalmente un slot
     * @param {number} horarioId - ID del slot de horario
     * @param {number} organizacionId - ID de la organización
     * @param {number} duracionMinutos - Duración de la reserva temporal
     * @param {string} motivoReserva - Motivo de la reserva temporal
     * @returns {Promise<Object>} Confirmación de reserva temporal
     */
    static async reservarTemporalmente(horarioId, organizacionId, duracionMinutos = 15, motivoReserva = 'Reserva IA') {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            // Verificar que el slot esté disponible
            const verificarQuery = `
                SELECT id, profesional_id, fecha_hora_inicio, fecha_hora_fin,
                       duracion_minutos, estado, reservado_hasta
                FROM horarios_disponibilidad
                WHERE id = $1 AND organizacion_id = $2 AND estado = 'disponible'
                  AND (reservado_hasta IS NULL OR reservado_hasta < NOW())
            `;

            const verificarResult = await db.query(verificarQuery, [horarioId, organizacionId]);

            if (verificarResult.rows.length === 0) {
                throw new Error('El horario no está disponible para reserva');
            }

            const slot = verificarResult.rows[0];
            const reservadoHasta = new Date(Date.now() + duracionMinutos * 60000);

            // Reservar temporalmente
            const reservarQuery = `
                UPDATE horarios_disponibilidad
                SET
                    estado = 'reservado_temporalmente',
                    reservado_hasta = $1,
                    actualizado_en = NOW()
                WHERE id = $2
                RETURNING id, profesional_id, fecha_hora_inicio, fecha_hora_fin,
                         estado, reservado_hasta
            `;

            const reservarResult = await db.query(reservarQuery, [reservadoHasta, horarioId]);

            await db.query('COMMIT');

            logger.info('[HorarioModel.reservarTemporalmente] Slot reservado temporalmente', {
                horario_id: horarioId,
                profesional_id: slot.profesional_id,
                organizacion_id: organizacionId,
                reservado_hasta: reservadoHasta,
                motivo: motivoReserva
            });

            return {
                reserva_exitosa: true,
                horario_id: horarioId,
                profesional_id: slot.profesional_id,
                fecha_hora_inicio: slot.fecha_hora_inicio,
                fecha_hora_fin: slot.fecha_hora_fin,
                reservado_hasta: reservadoHasta,
                duracion_reserva_minutos: duracionMinutos,
                motivo: motivoReserva
            };

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[HorarioModel.reservarTemporalmente] Error:', {
                error: error.message,
                horario_id: horarioId,
                organizacion_id: organizacionId
            });
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * 🤖 COMPLEMENTARIO PARA IA: Liberar reserva temporal
     * @param {number} horarioId - ID del slot a liberar
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<boolean>} True si se liberó exitosamente
     */
    static async liberarReservaTemporalCriterio(horarioId, organizacionId) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const query = `
                UPDATE horarios_disponibilidad
                SET
                    estado = 'disponible',
                    reservado_hasta = NULL,
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
                  AND estado = 'reservado_temporalmente'
                RETURNING id
            `;

            const result = await db.query(query, [horarioId, organizacionId]);
            const liberado = result.rowCount > 0;

            if (liberado) {
                logger.info('[HorarioModel.liberarReservaTemporalCriterio] Reserva liberada', {
                    horario_id: horarioId,
                    organizacion_id: organizacionId
                });
            }

            return liberado;

        } catch (error) {
            logger.error('[HorarioModel.liberarReservaTemporalCriterio] Error:', {
                error: error.message,
                horario_id: horarioId,
                organizacion_id: organizacionId
            });
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * 🤖 UTILIDAD PARA IA: Generar recomendación inteligente de horarios
     * @param {Array} profesionales - Lista de profesionales con disponibilidad
     * @param {number} duracionServicio - Duración del servicio en minutos
     * @returns {Object} Recomendación estructurada para IA
     */
    static generarRecomendacionIA(profesionales, duracionServicio) {
        if (profesionales.length === 0) {
            return {
                tipo: 'sin_disponibilidad',
                mensaje: 'No hay horarios disponibles en el rango consultado',
                sugerencia: 'Ampliar el rango de fechas o considerar otros profesionales'
            };
        }

        // Ordenar profesionales por disponibilidad
        const profesionalesOrdenados = profesionales.sort((a, b) => {
            // Priorizar por proximidad de disponibilidad, luego por total de slots
            const diffA = a.proxima_disponibilidad ? new Date(a.proxima_disponibilidad) - new Date() : Infinity;
            const diffB = b.proxima_disponibilidad ? new Date(b.proxima_disponibilidad) - new Date() : Infinity;

            if (diffA !== diffB) return diffA - diffB;
            return b.total_slots_libres - a.total_slots_libres;
        });

        const mejorProfesional = profesionalesOrdenados[0];
        const horasHastaProxima = mejorProfesional.proxima_disponibilidad ?
            Math.ceil((new Date(mejorProfesional.proxima_disponibilidad) - new Date()) / (1000 * 60 * 60)) : 0;

        return {
            tipo: 'recomendacion_disponible',
            profesional_recomendado: {
                id: mejorProfesional.profesional_id,
                nombre: mejorProfesional.nombre,
                tipo: mejorProfesional.tipo,
                total_slots_libres: mejorProfesional.total_slots_libres,
                dias_disponibles: mejorProfesional.dias_disponibles,
                proxima_disponibilidad: mejorProfesional.proxima_disponibilidad,
                horas_hasta_proxima: horasHastaProxima
            },
            alternativas: profesionalesOrdenados.slice(1, 3).map(prof => ({
                id: prof.profesional_id,
                nombre: prof.nombre,
                slots_libres: prof.total_slots_libres,
                proxima_disponibilidad: prof.proxima_disponibilidad
            })),
            mensaje_ia: horasHastaProxima <= 24 ?
                `${mejorProfesional.nombre} tiene disponibilidad hoy mismo` :
                horasHastaProxima <= 72 ?
                `${mejorProfesional.nombre} tiene disponibilidad en los próximos 3 días` :
                `${mejorProfesional.nombre} es la mejor opción con ${mejorProfesional.total_slots_libres} horarios disponibles`
        };
    }

    /**
     * Limpiar reservas temporales expiradas (tarea de mantenimiento)
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<number>} Número de reservas limpiadas
     */
    static async limpiarReservasExpiradas(organizacionId) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const query = `
                UPDATE horarios_disponibilidad
                SET
                    estado = 'disponible',
                    reservado_hasta = NULL,
                    actualizado_en = NOW()
                WHERE organizacion_id = $1
                  AND estado = 'reservado_temporalmente'
                  AND reservado_hasta < NOW()
                RETURNING id
            `;

            const result = await db.query(query, [organizacionId]);

            if (result.rowCount > 0) {
                logger.info('[HorarioModel.limpiarReservasExpiradas] Reservas limpiadas', {
                    organizacion_id: organizacionId,
                    reservas_limpiadas: result.rowCount
                });
            }

            return result.rowCount;

        } catch (error) {
            logger.error('[HorarioModel.limpiarReservasExpiradas] Error:', {
                error: error.message,
                organizacion_id: organizacionId
            });
            throw error;
        } finally {
            db.release();
        }
    }
}

module.exports = HorarioModel;