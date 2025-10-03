/**
 * Servicio de Horarios
 * Lógica de negocio para generación y gestión de horarios
 */

const { getDb } = require('../config/database');
const HorarioHelpers = require('../utils/horarioHelpers');
const logger = require('../utils/logger');

class HorarioService {
    /**
     * Generar horarios automáticamente para profesional
     * @param {number} profesionalId - ID del profesional
     * @param {number} organizacionId - ID de la organización
     * @param {Object} configuracion - Configuración de horarios
     * @returns {Promise<Object>} Resumen de horarios generados
     */
    static async generarHorariosProfesional(profesionalId, organizacionId, configuracion) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            // Configurar contexto RLS multi-tenant
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            const {
                zona_horaria = 'America/Mexico_City',
                horarios_base = {},
                duracion_slot_minutos = 30,
                dias_laborables = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
                tipo_generacion = 'semanal',
                fecha_inicio,
                fecha_fin
            } = configuracion;

            // Validar que el profesional existe
            const profesionalQuery = `
                SELECT id, nombre_completo, tipo_profesional, activo
                FROM profesionales
                WHERE id = $1 AND organizacion_id = $2 AND activo = true
            `;
            const profesionalResult = await db.query(profesionalQuery, [profesionalId, organizacionId]);

            if (profesionalResult.rows.length === 0) {
                throw new Error('Profesional no encontrado o inactivo');
            }

            const profesional = profesionalResult.rows[0];

            // Configurar horarios base por defecto
            const horariosDefecto = {
                lunes: { inicio: '09:00', fin: '18:00', descansos: [{ inicio: '13:00', fin: '14:00' }] },
                martes: { inicio: '09:00', fin: '18:00', descansos: [{ inicio: '13:00', fin: '14:00' }] },
                miercoles: { inicio: '09:00', fin: '18:00', descansos: [{ inicio: '13:00', fin: '14:00' }] },
                jueves: { inicio: '09:00', fin: '18:00', descansos: [{ inicio: '13:00', fin: '14:00' }] },
                viernes: { inicio: '09:00', fin: '17:00', descansos: [{ inicio: '13:00', fin: '14:00' }] },
                sabado: { inicio: '09:00', fin: '14:00', descansos: [] },
                domingo: null
            };

            const horariosFinales = { ...horariosDefecto, ...horarios_base };

            // Calcular fechas de generación
            const fechaInicioDate = fecha_inicio ? new Date(fecha_inicio) : new Date();
            const fechaFinDate = fecha_fin ? new Date(fecha_fin) :
                new Date(fechaInicioDate.getTime() + (tipo_generacion === 'semanal' ? 7 : 30) * 24 * 60 * 60 * 1000);

            let horariosCreados = 0;
            let diasProcesados = 0;
            const resumenPorDia = {};

            // Generar horarios día por día
            for (let fecha = new Date(fechaInicioDate); fecha <= fechaFinDate; fecha.setDate(fecha.getDate() + 1)) {
                const nombreDia = HorarioHelpers.obtenerNombreDia(fecha.getDay());

                if (!dias_laborables.includes(nombreDia)) {
                    continue;
                }

                const horarioDia = horariosFinales[nombreDia];
                if (!horarioDia) {
                    continue;
                }

                diasProcesados++;

                // Verificar si ya existen horarios
                const existenQuery = `
                    SELECT COUNT(*) as count
                    FROM horarios_profesionales
                    WHERE profesional_id = $1 AND fecha = $2
                `;
                const existenResult = await db.query(existenQuery, [profesionalId, fecha.toISOString().split('T')[0]]);

                if (parseInt(existenResult.rows[0].count) > 0) {
                    continue;
                }

                // Generar slots
                const slots = this._generarSlots(
                    horarioDia.inicio,
                    horarioDia.fin,
                    duracion_slot_minutos,
                    horarioDia.descansos || []
                );

                // Insertar horarios base del profesional
                const insertBaseQuery = `
                    INSERT INTO horarios_profesionales (
                        profesional_id, organizacion_id, dia_semana, fecha,
                        hora_inicio, hora_fin, disponible,
                        tipo_horario, configuracion_especial,
                        creado_en, actualizado_en
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                `;

                await db.query(insertBaseQuery, [
                    profesionalId, organizacionId, nombreDia, fecha.toISOString().split('T')[0],
                    horarioDia.inicio, horarioDia.fin, true,
                    'regular',
                    JSON.stringify({
                        slots_generados: slots.length,
                        duracion_slot: duracion_slot_minutos,
                        descansos: horarioDia.descansos || [],
                        zona_horaria: zona_horaria,
                        generado_automaticamente: true
                    })
                ]);

                // Insertar slots de disponibilidad
                for (const slot of slots) {
                    const slotDateTime = new Date(`${fecha.toISOString().split('T')[0]}T${slot.hora_inicio}:00`);
                    const fechaHoraFin = new Date(slotDateTime.getTime() + duracion_slot_minutos * 60000);

                    const insertSlotQuery = `
                        INSERT INTO horarios_disponibilidad (
                            profesional_id, organizacion_id, fecha_hora_inicio, fecha_hora_fin,
                            duracion_minutos, estado, reservado_hasta,
                            creado_en, actualizado_en
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                    `;

                    await db.query(insertSlotQuery, [
                        profesionalId, organizacionId, slotDateTime, fechaHoraFin,
                        duracion_slot_minutos, 'disponible', null
                    ]);

                    horariosCreados++;
                }

                // Registrar resumen del día
                resumenPorDia[fecha.toISOString().split('T')[0]] = {
                    dia_semana: nombreDia,
                    slots_creados: slots.length,
                    hora_inicio: horarioDia.inicio,
                    hora_fin: horarioDia.fin,
                    descansos: horarioDia.descansos?.length || 0
                };
            }

            await db.query('COMMIT');

            logger.info('Horarios generados automáticamente para profesional', {
                profesional_id: profesionalId,
                organizacion_id: organizacionId,
                nombre_profesional: profesional.nombre_completo,
                periodo: `${fechaInicioDate.toISOString().split('T')[0]} a ${fechaFinDate.toISOString().split('T')[0]}`,
                dias_procesados: diasProcesados,
                slots_creados: horariosCreados,
                duracion_slot: duracion_slot_minutos
            });

            return {
                profesional: {
                    id: profesionalId,
                    nombre: profesional.nombre_completo,
                    tipo: profesional.tipo_profesional
                },
                generacion: {
                    tipo: tipo_generacion,
                    fecha_inicio: fechaInicioDate.toISOString().split('T')[0],
                    fecha_fin: fechaFinDate.toISOString().split('T')[0],
                    zona_horaria: zona_horaria,
                    duracion_slot_minutos: duracion_slot_minutos
                },
                resultado: {
                    dias_procesados: diasProcesados,
                    slots_disponibles_creados: horariosCreados,
                    promedio_slots_por_dia: diasProcesados > 0 ? Math.round(horariosCreados / diasProcesados) : 0
                },
                configuracion: {
                    dias_laborables: dias_laborables,
                    horarios_aplicados: horariosFinales
                },
                resumen_por_dia: resumenPorDia,
                mensaje: `Se generaron ${horariosCreados} slots de disponibilidad en ${diasProcesados} días para ${profesional.nombre_completo}`
            };

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('Error generando horarios automáticamente', {
                profesional_id: profesionalId,
                organizacion_id: organizacionId,
                error: error.message
            });
            throw new Error(`Error al generar horarios: ${error.message}`);
        } finally {
            db.release();
        }
    }

    /**
     * Función interna para generar slots de tiempo
     * @param {string} inicio - Hora de inicio (HH:MM)
     * @param {string} fin - Hora de fin (HH:MM)
     * @param {number} duracionMinutos - Duración de cada slot
     * @param {Array} descansos - Períodos de descanso
     * @returns {Array} Array de slots generados
     * @private
     */
    static _generarSlots(inicio, fin, duracionMinutos, descansos = []) {
        const slots = [];
        const inicioMinutos = HorarioHelpers.timeToMinutes(inicio);
        const finMinutos = HorarioHelpers.timeToMinutes(fin);

        for (let minutos = inicioMinutos; minutos < finMinutos; minutos += duracionMinutos) {
            const horaSlot = HorarioHelpers.minutesToTime(minutos);
            const horaFinSlot = HorarioHelpers.minutesToTime(minutos + duracionMinutos);

            // Verificar si el slot NO está en horario de descanso
            const enDescanso = descansos.some(descanso => {
                const inicioDescanso = HorarioHelpers.timeToMinutes(descanso.inicio);
                const finDescanso = HorarioHelpers.timeToMinutes(descanso.fin);
                return minutos >= inicioDescanso && minutos < finDescanso;
            });

            if (!enDescanso) {
                slots.push({
                    hora_inicio: horaSlot,
                    hora_fin: horaFinSlot,
                    duracion_minutos: duracionMinutos
                });
            }
        }

        return slots;
    }
}

module.exports = HorarioService;
