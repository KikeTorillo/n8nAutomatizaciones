const { getDb } = require('../../config/database');
const logger = require('../../utils/logger');
const { DEFAULTS, CitaHelpersModel } = require('./cita.helpers.model');
const CitaBaseModel = require('./cita.base.model');

class CitaAIModel {

    static async crearAutomatica(datosIA) {
        const db = await getDb();

        try {
            await db.query('BEGIN');
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', datosIA.organizacion_id.toString()]);

            let cliente = await CitaHelpersModel.buscarOCrearCliente(datosIA);

            const servicio = await CitaHelpersModel.obtenerServicioCompleto(datosIA.servicio_id, datosIA.organizacion_id, db);
            if (!servicio) {
                throw new Error('Servicio no encontrado o inactivo');
            }

            const horarioDisponible = await CitaHelpersModel.buscarHorarioCompatible({
                organizacion_id: datosIA.organizacion_id,
                servicio_id: datosIA.servicio_id,
                fecha_solicitada: datosIA.fecha_solicitada || 'mañana',
                turno_preferido: datosIA.turno_preferido || 'cualquiera',
                profesional_preferido: datosIA.profesional_preferido,
                duracion_minutos: servicio.duracion_minutos
            }, db);

            if (!horarioDisponible) {
                throw new Error('No hay horarios disponibles para la fecha y condiciones solicitadas');
            }

            const citaCreada = await CitaHelpersModel.insertarCitaCompleta({
                organizacion_id: datosIA.organizacion_id,
                cliente_id: cliente.id,
                profesional_id: horarioDisponible.profesional_id,
                servicio_id: datosIA.servicio_id,
                fecha_cita: horarioDisponible.fecha,
                hora_inicio: horarioDisponible.hora_inicio,
                hora_fin: horarioDisponible.hora_fin,
                zona_horaria: datosIA.zona_horaria || DEFAULTS.ZONA_HORARIA,
                precio_servicio: servicio.precio,
                descuento: datosIA.descuento || 0.00,
                precio_final: servicio.precio - (datosIA.descuento || 0.00),
                estado: 'pendiente',
                metodo_pago: datosIA.metodo_pago || null,
                pagado: false,
                notas_cliente: `Cita creada por IA. Teléfono: ${datosIA.telefono_cliente}`,
                notas_internas: datosIA.notas_internas || null,
                confirmacion_requerida: true,
                confirmada_por_cliente: null,
                recordatorio_enviado: false,
                creado_por: datosIA.usuario_id || null,
                ip_origen: datosIA.ip_origen || null,
                user_agent: datosIA.user_agent || null,
                origen_aplicacion: datosIA.origen_aplicacion || 'webhook_n8n'
            }, db);

            await CitaHelpersModel.marcarHorarioOcupado(
                horarioDisponible.horario_id,
                citaCreada.id,
                datosIA.organizacion_id,
                db
            );

            await CitaHelpersModel.registrarEventoAuditoria({
                organizacion_id: datosIA.organizacion_id,
                tipo_evento: 'cita_creada_ia',
                descripcion: 'Cita creada automáticamente por IA conversacional',
                cita_id: citaCreada.id,
                usuario_id: datosIA.usuario_id || null,
                metadatos: {
                    telefono_cliente: datosIA.telefono_cliente,
                    cliente_es_nuevo: cliente.es_nuevo,
                    profesional_asignado: horarioDisponible.profesional_nombre,
                    origen: 'ia_webhook',
                    fecha_solicitada: datosIA.fecha_solicitada,
                    turno_preferido: datosIA.turno_preferido
                }
            }, db);

            await db.query('COMMIT');

            const respuesta = {
                cita: {
                    id: citaCreada.id,
                    codigo: citaCreada.codigo_cita,
                    fecha: citaCreada.fecha_cita,
                    hora_inicio: citaCreada.hora_inicio,
                    hora_fin: citaCreada.hora_fin,
                    estado: citaCreada.estado,
                    precio: citaCreada.precio_final,
                    duracion_minutos: servicio.duracion_minutos
                },
                cliente: {
                    id: cliente.id,
                    nombre: cliente.nombre,
                    telefono: cliente.telefono,
                    es_nuevo: cliente.es_nuevo
                },
                profesional: {
                    id: horarioDisponible.profesional_id,
                    nombre: horarioDisponible.profesional_nombre
                },
                servicio: {
                    id: servicio.id,
                    nombre: servicio.nombre,
                    duracion_minutos: servicio.duracion_minutos
                },
                mensaje_confirmacion: `Cita confirmada para ${citaCreada.fecha_cita} a las ${citaCreada.hora_inicio} con ${horarioDisponible.profesional_nombre}`,
                instrucciones_cliente: 'Por favor llegue 5 minutos antes de su cita. Si necesita cancelar, hágalo con al menos 2 horas de anticipación.'
            };

            return respuesta;

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[CitaAIModel.crearAutomatica] Error:', {
                error: error.message,
                stack: error.stack,
                telefono: datosIA.telefono_cliente,
                organizacion_id: datosIA.organizacion_id
            });
            throw error;
        }
    }

    static async buscarPorTelefono(telefono, organizacionId, estados = ['confirmada', 'pendiente'], incluir_historicas = false) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            let whereClause = `
                WHERE cl.telefono = $1
                AND c.organizacion_id = $2
                AND c.estado = ANY($3)
            `;

            let params = [telefono, organizacionId, estados];

            if (!incluir_historicas) {
                whereClause += ` AND c.fecha_cita >= CURRENT_DATE - INTERVAL '7 days'`;
            }

            const query = `
                SELECT
                    c.id,
                    c.codigo_cita,
                    c.fecha_cita,
                    c.hora_inicio,
                    c.hora_fin,
                    c.estado,
                    c.precio_final,
                    c.notas_cliente,
                    cl.nombre as cliente_nombre,
                    p.nombre_completo as profesional_nombre,
                    s.nombre as servicio_nombre,
                    s.duracion_minutos,
                    EXTRACT(EPOCH FROM (
                        (c.fecha_cita + c.hora_inicio)::timestamp - NOW()
                    ))::integer / 60 as minutos_hasta_cita,
                    CASE
                        WHEN c.estado IN ('pendiente', 'confirmada') AND
                             c.fecha_cita + c.hora_inicio > NOW() + INTERVAL '2 hours'
                        THEN true
                        ELSE false
                    END as puede_cancelar,
                    CASE
                        WHEN c.estado = 'pendiente' AND
                             c.fecha_cita + c.hora_inicio > NOW() + INTERVAL '2 hours'
                        THEN true
                        ELSE false
                    END as puede_modificar,
                    CASE
                        WHEN c.estado = 'pendiente' THEN 'Su cita está pendiente de confirmación'
                        WHEN c.estado = 'confirmada' THEN 'Su cita está confirmada'
                        WHEN c.estado = 'en_curso' THEN 'Su cita está en progreso'
                        WHEN c.estado = 'completada' THEN 'Su cita ha sido completada'
                        WHEN c.estado = 'cancelada' THEN 'Su cita fue cancelada'
                        WHEN c.estado = 'no_asistio' THEN 'No asistió a su cita'
                        ELSE 'Estado desconocido'
                    END as mensaje_ia
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                JOIN profesionales p ON c.profesional_id = p.id
                JOIN servicios s ON c.servicio_id = s.id
                ${whereClause}
                ORDER BY c.fecha_cita DESC, c.hora_inicio DESC
                LIMIT 10
            `;

            const resultado = await db.query(query, params);
            return resultado.rows;

        } catch (error) {
            logger.error('[CitaAIModel.buscarPorTelefono] Error en búsqueda:', {
                error: error.message,
                telefono: telefono,
                organizacion_id: organizacionId
            });
            throw error;
        }
    }

    static async modificarAutomatica(codigoCita, cambios, organizacionId) {
        const db = await getDb();

        try {
            await db.query('BEGIN');
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const citaActual = await this.obtenerCitaParaModificar(codigoCita, organizacionId, db);
            if (!citaActual) {
                throw new Error('Cita no encontrada o no se puede modificar');
            }

            let datosActualizacion = {};

            if (cambios.nueva_fecha) {
                datosActualizacion.fecha_cita = cambios.nueva_fecha;
            }

            if (cambios.nuevo_servicio_id) {
                const servicio = await CitaHelpersModel.obtenerServicioCompleto(cambios.nuevo_servicio_id, organizacionId, db);
                if (!servicio) {
                    throw new Error('Nuevo servicio no encontrado');
                }
                datosActualizacion.servicio_id = cambios.nuevo_servicio_id;
                datosActualizacion.precio_servicio = servicio.precio;
                datosActualizacion.precio_final = servicio.precio;
            }

            if (cambios.motivo) {
                datosActualizacion.notas_internas = `Modificado por IA: ${cambios.motivo}`;
            }

            if (cambios.nueva_fecha || cambios.nuevo_turno) {
                const nuevoHorario = await CitaHelpersModel.buscarHorarioCompatible({
                    organizacion_id: organizacionId,
                    servicio_id: datosActualizacion.servicio_id || citaActual.servicio_id,
                    fecha_solicitada: cambios.nueva_fecha || citaActual.fecha_cita,
                    turno_preferido: cambios.nuevo_turno || 'cualquiera',
                    profesional_preferido: null,
                    duracion_minutos: citaActual.duracion_minutos
                }, db);

                if (!nuevoHorario) {
                    throw new Error('No hay horarios disponibles para la nueva fecha/turno solicitado');
                }

                datosActualizacion.fecha_cita = nuevoHorario.fecha;
                datosActualizacion.hora_inicio = nuevoHorario.hora_inicio;
                datosActualizacion.hora_fin = nuevoHorario.hora_fin;
                datosActualizacion.profesional_id = nuevoHorario.profesional_id;

                await this.liberarHorarioAnterior(citaActual.horario_id, db);
                await CitaHelpersModel.marcarHorarioOcupado(
                    nuevoHorario.horario_id,
                    citaActual.id,
                    organizacionId,
                    db
                );
            }

            const citaActualizada = await this.actualizarCita(citaActual.id, datosActualizacion, db);

            await CitaHelpersModel.registrarEventoAuditoria({
                organizacion_id: organizacionId,
                tipo_evento: 'cita_modificada_ia',
                descripcion: 'Cita modificada automáticamente por IA',
                cita_id: citaActual.id,
                metadatos: {
                    codigo_cita: codigoCita,
                    cambios_aplicados: cambios,
                    fecha_anterior: citaActual.fecha_cita,
                    fecha_nueva: datosActualizacion.fecha_cita || citaActual.fecha_cita
                }
            }, db);

            await db.query('COMMIT');

            return {
                exito: true,
                mensaje: 'Cita modificada exitosamente',
                cita_modificada: {
                    codigo: codigoCita,
                    fecha_anterior: citaActual.fecha_cita,
                    fecha_nueva: citaActualizada.fecha_cita,
                    hora_nueva: citaActualizada.hora_inicio,
                    profesional: citaActualizada.profesional_nombre
                }
            };

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[CitaAIModel.modificarAutomatica] Error:', {
                error: error.message,
                codigo_cita: codigoCita,
                cambios: cambios
            });
            throw error;
        }
    }

    static async cancelarAutomatica(codigoCita, organizacionId, motivo = 'Cancelada por cliente') {
        const db = await getDb();

        try {
            await db.query('BEGIN');
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const cita = await this.obtenerCitaParaCancelar(codigoCita, organizacionId, db);
            if (!cita) {
                throw new Error('Cita no encontrada o no se puede cancelar');
            }

            await db.query(`
                UPDATE citas
                SET estado = 'cancelada',
                    motivo_cancelacion = $1,
                    actualizado_en = NOW()
                WHERE codigo_cita = $2 AND organizacion_id = $3
            `, [motivo, codigoCita, organizacionId]);

            await this.liberarHorarioAnterior(cita.horario_id, db);

            await CitaHelpersModel.registrarEventoAuditoria({
                organizacion_id: organizacionId,
                tipo_evento: 'cita_cancelada_ia',
                descripcion: 'Cita cancelada automáticamente por IA',
                cita_id: cita.id,
                metadatos: {
                    codigo_cita: codigoCita,
                    motivo: motivo,
                    estado_anterior: cita.estado
                }
            }, db);

            await db.query('COMMIT');

            return {
                exito: true,
                mensaje: 'Cita cancelada exitosamente',
                cita_cancelada: {
                    codigo: codigoCita,
                    fecha: cita.fecha_cita,
                    hora: cita.hora_inicio,
                    motivo: motivo
                }
            };

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[CitaAIModel.cancelarAutomatica] Error:', {
                error: error.message,
                codigo_cita: codigoCita
            });
            throw error;
        }
    }

    static async obtenerCitaParaModificar(codigoCita, organizacionId, db) {
        const resultado = await db.query(`
            SELECT c.*, h.id as horario_id, s.duracion_minutos
            FROM citas c
            LEFT JOIN horarios_disponibilidad h ON h.cita_id = c.id
            LEFT JOIN servicios s ON c.servicio_id = s.id
            WHERE c.codigo_cita = $1 AND c.organizacion_id = $2
                AND c.estado IN ('pendiente', 'confirmada')
                AND c.fecha_cita + c.hora_inicio > NOW() + INTERVAL '2 hours'
        `, [codigoCita, organizacionId]);

        return resultado.rows.length > 0 ? resultado.rows[0] : null;
    }

    static async obtenerCitaParaCancelar(codigoCita, organizacionId, db) {
        const resultado = await db.query(`
            SELECT c.*, h.id as horario_id
            FROM citas c
            LEFT JOIN horarios_disponibilidad h ON h.cita_id = c.id
            WHERE c.codigo_cita = $1 AND c.organizacion_id = $2
                AND c.estado IN ('pendiente', 'confirmada')
        `, [codigoCita, organizacionId]);

        return resultado.rows.length > 0 ? resultado.rows[0] : null;
    }

    static async actualizarCita(citaId, datosActualizacion, db) {
        const campos = Object.keys(datosActualizacion);
        const valores = Object.values(datosActualizacion);
        const setClause = campos.map((campo, index) => `${campo} = $${index + 1}`).join(', ');

        const query = `
            UPDATE citas
            SET ${setClause}, actualizado_en = NOW()
            WHERE id = $${campos.length + 1}
            RETURNING *
        `;

        const resultado = await db.query(query, [...valores, citaId]);
        return resultado.rows[0];
    }

    static async liberarHorarioAnterior(horarioId, db) {
        if (horarioId) {
            await db.query(`
                UPDATE horarios_disponibilidad
                SET disponible = true, cita_id = NULL
                WHERE id = $1
            `, [horarioId]);
        }
    }
}

module.exports = CitaAIModel;