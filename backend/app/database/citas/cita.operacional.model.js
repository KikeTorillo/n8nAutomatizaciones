const { getDb } = require('../../config/database');
const logger = require('../../utils/logger');
const { DEFAULTS, CitaHelpersModel } = require('./cita.helpers.model');

class CitaOperacionalModel {

    static async checkIn(citaId, datosCheckIn, organizacionId) {
        const db = await getDb();

        try {
            await db.query('BEGIN');
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            const resultado = await db.query(`
                UPDATE citas
                SET hora_llegada = NOW(),
                    notas_internas = COALESCE(notas_internas, '') || $1,
                    actualizado_por = $2,
                    actualizado_en = NOW(),
                    ip_origen = $3
                WHERE id = $4 AND organizacion_id = $5
                RETURNING *
            `, [
                datosCheckIn.notas_llegada ? `\nLlegada: ${datosCheckIn.notas_llegada}` : '',
                datosCheckIn.usuario_id,
                datosCheckIn.ip_origen,
                citaId,
                organizacionId
            ]);

            await CitaHelpersModel.registrarEventoAuditoria({
                organizacion_id: organizacionId,
                tipo_evento: 'cita_checkin',
                descripcion: 'Cliente realizó check-in',
                cita_id: citaId,
                usuario_id: datosCheckIn.usuario_id
            }, db);

            await db.query('COMMIT');
            return resultado.rows[0];

        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        } finally {
            db.release();
        }
    }

    static async startService(citaId, datosInicio, organizacionId) {
        const db = await getDb();

        try {
            await db.query('BEGIN');
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            const resultado = await db.query(`
                UPDATE citas
                SET hora_inicio_real = NOW(),
                    estado = 'en_curso',
                    notas_profesional = COALESCE(notas_profesional, '') || $1,
                    actualizado_por = $2,
                    actualizado_en = NOW()
                WHERE id = $3 AND organizacion_id = $4
                RETURNING *
            `, [
                datosInicio.notas_inicio ? `\nInicio: ${datosInicio.notas_inicio}` : '',
                datosInicio.usuario_id,
                citaId,
                organizacionId
            ]);

            await db.query('COMMIT');
            return resultado.rows[0];

        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        } finally {
            db.release();
        }
    }

    static async complete(citaId, datosCompletado, organizacionId) {
        const db = await getDb();

        try {
            await db.query('BEGIN');
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            const resultado = await db.query(`
                UPDATE citas
                SET hora_fin_real = NOW(),
                    estado = 'completada',
                    precio_final = $1,
                    metodo_pago = $2,
                    pagado = true,
                    notas_profesional = COALESCE(notas_profesional, '') || $3,
                    actualizado_por = $4,
                    actualizado_en = NOW()
                WHERE id = $5 AND organizacion_id = $6
                RETURNING *
            `, [
                datosCompletado.precio_final_real,
                datosCompletado.metodo_pago,
                datosCompletado.notas_finalizacion ? `\nCompletado: ${datosCompletado.notas_finalizacion}` : '',
                datosCompletado.usuario_id,
                citaId,
                organizacionId
            ]);

            await db.query('COMMIT');
            return resultado.rows[0];

        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        } finally {
            db.release();
        }
    }

    static async reagendar(citaId, datosReagenda, organizacionId) {
        const db = await getDb();

        try {
            await db.query('BEGIN');
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            const citaActual = await db.query('SELECT profesional_id FROM citas WHERE id = $1', [citaId]);
            if (citaActual.rows.length === 0) {
                throw new Error('Cita no encontrada');
            }

            await CitaHelpersModel.validarConflictoHorario(
                citaActual.rows[0].profesional_id,
                datosReagenda.nueva_fecha,
                datosReagenda.nueva_hora_inicio,
                datosReagenda.nueva_hora_fin,
                citaId,
                db
            );

            const resultado = await db.query(`
                UPDATE citas
                SET fecha_cita = $1,
                    hora_inicio = $2,
                    hora_fin = $3,
                    estado = 'pendiente',
                    confirmada_por_cliente = NULL,
                    notas_internas = COALESCE(notas_internas, '') || $4,
                    actualizado_por = $5,
                    actualizado_en = NOW()
                WHERE id = $6 AND organizacion_id = $7
                RETURNING *
            `, [
                datosReagenda.nueva_fecha,
                datosReagenda.nueva_hora_inicio,
                datosReagenda.nueva_hora_fin,
                `\nReagendada: ${datosReagenda.motivo_reagenda || 'Sin motivo especificado'}`,
                datosReagenda.usuario_id,
                citaId,
                organizacionId
            ]);

            await db.query('COMMIT');
            return resultado.rows[0];

        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        } finally {
            db.release();
        }
    }

    static async obtenerDashboardToday(organizacionId, profesionalId = null) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            let whereClause = 'WHERE c.organizacion_id = $1 AND c.fecha_cita = CURRENT_DATE';
            let params = [organizacionId];

            if (profesionalId) {
                whereClause += ' AND c.profesional_id = $2';
                params.push(profesionalId);
            }

            const citas = await db.query(`
                SELECT
                    c.*,
                    cl.nombre as cliente_nombre,
                    cl.telefono as cliente_telefono,
                    p.nombre_completo as profesional_nombre,
                    s.nombre as servicio_nombre,
                    s.duracion_minutos,
                    CASE
                        WHEN c.hora_llegada IS NOT NULL AND c.hora_inicio_real IS NOT NULL
                        THEN EXTRACT(EPOCH FROM (c.hora_inicio_real - c.hora_llegada))/60
                        ELSE NULL
                    END as tiempo_espera_minutos_calculado
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                JOIN profesionales p ON c.profesional_id = p.id
                JOIN servicios s ON c.servicio_id = s.id
                ${whereClause}
                ORDER BY c.hora_inicio ASC
            `, params);

            const metricas = await db.query(`
                SELECT
                    COUNT(*) as total_citas,
                    COUNT(*) FILTER (WHERE estado = 'completada') as completadas,
                    COUNT(*) FILTER (WHERE estado = 'cancelada') as canceladas,
                    COUNT(*) FILTER (WHERE estado = 'no_asistio') as no_shows,
                    COUNT(*) FILTER (WHERE estado = 'en_curso') as en_progreso,
                    COUNT(*) FILTER (WHERE origen_cita = 'walk_in') as walk_ins,
                    COALESCE(SUM(precio_final) FILTER (WHERE estado = 'completada' AND pagado = true), 0) as ingresos_dia
                FROM citas
                WHERE organizacion_id = $1 AND fecha_cita = CURRENT_DATE
                ${profesionalId ? 'AND profesional_id = $2' : ''}
            `, params);

            return {
                fecha: new Date().toISOString().split('T')[0],
                citas: citas.rows,
                metricas: metricas.rows[0],
                profesional_filtro: profesionalId
            };

        } catch (error) {
            logger.error('[CitaOperacionalModel.obtenerDashboardToday] Error:', error);
            throw error;
        } finally {
            db.release();
        }
    }

    static async obtenerColaEspera(organizacionId, profesionalId = null) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            let whereClause = `
                WHERE c.organizacion_id = $1
                AND c.fecha_cita = CURRENT_DATE
                AND c.estado IN ('confirmada', 'en_curso')
                AND c.hora_llegada IS NOT NULL
                AND c.hora_fin_real IS NULL
            `;
            let params = [organizacionId];

            if (profesionalId) {
                whereClause += ' AND c.profesional_id = $2';
                params.push(profesionalId);
            }

            const cola = await db.query(`
                SELECT
                    c.id,
                    c.codigo_cita,
                    c.hora_inicio,
                    c.hora_llegada,
                    c.estado,
                    cl.nombre as cliente_nombre,
                    p.nombre_completo as profesional_nombre,
                    s.nombre as servicio_nombre,
                    s.duracion_minutos,
                    EXTRACT(EPOCH FROM (NOW() - c.hora_llegada))/60 as minutos_esperando,
                    ROW_NUMBER() OVER (PARTITION BY c.profesional_id ORDER BY c.hora_llegada) as posicion_cola
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                JOIN profesionales p ON c.profesional_id = p.id
                JOIN servicios s ON c.servicio_id = s.id
                ${whereClause}
                ORDER BY c.profesional_id, c.hora_llegada
            `, params);

            return {
                cola_espera: cola.rows,
                total_esperando: cola.rows.length,
                tiempo_espera_promedio: cola.rows.length > 0 ?
                    cola.rows.reduce((sum, c) => sum + parseFloat(c.minutos_esperando), 0) / cola.rows.length : 0
            };

        } catch (error) {
            logger.error('[CitaOperacionalModel.obtenerColaEspera] Error:', error);
            throw error;
        } finally {
            db.release();
        }
    }

    static async obtenerMetricasTiempoReal(organizacionId) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            const metricas = await db.query(`
                SELECT
                    COUNT(*) FILTER (WHERE fecha_cita = CURRENT_DATE) as citas_hoy,
                    COUNT(*) FILTER (WHERE fecha_cita = CURRENT_DATE AND estado = 'completada') as completadas_hoy,
                    COUNT(*) FILTER (WHERE fecha_cita = CURRENT_DATE AND estado = 'en_curso') as en_progreso_hoy,
                    COUNT(*) FILTER (WHERE fecha_cita = CURRENT_DATE AND origen_cita = 'walk_in') as walkins_hoy,
                    COUNT(*) FILTER (WHERE fecha_cita >= DATE_TRUNC('week', CURRENT_DATE)) as citas_semana,
                    COALESCE(SUM(precio_final) FILTER (WHERE fecha_cita = CURRENT_DATE AND estado = 'completada' AND pagado = true), 0) as ingresos_hoy,
                    COALESCE(SUM(precio_final) FILTER (WHERE fecha_cita >= DATE_TRUNC('week', CURRENT_DATE) AND estado = 'completada' AND pagado = true), 0) as ingresos_semana,
                    AVG(tiempo_espera_minutos) FILTER (WHERE fecha_cita >= CURRENT_DATE - INTERVAL '7 days' AND tiempo_espera_minutos IS NOT NULL) as tiempo_espera_promedio,
                    ROUND(
                        COUNT(*) FILTER (WHERE fecha_cita >= CURRENT_DATE - INTERVAL '30 days' AND estado = 'no_asistio') * 100.0 /
                        NULLIF(COUNT(*) FILTER (WHERE fecha_cita >= CURRENT_DATE - INTERVAL '30 days' AND estado IN ('completada', 'no_asistio')), 0),
                        2
                    ) as tasa_no_show_pct
                FROM citas
                WHERE organizacion_id = $1
            `, [organizacionId]);

            const canales = await db.query(`
                SELECT
                    origen_cita,
                    COUNT(*) as total,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as porcentaje
                FROM citas
                WHERE organizacion_id = $1
                AND fecha_cita >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY origen_cita
                ORDER BY total DESC
            `, [organizacionId]);

            const profesionales = await db.query(`
                SELECT
                    p.nombre_completo as nombre,
                    COUNT(*) as citas_hoy,
                    COUNT(*) FILTER (WHERE c.estado = 'completada') as completadas,
                    COALESCE(SUM(c.precio_final) FILTER (WHERE c.estado = 'completada' AND c.pagado = true), 0) as ingresos
                FROM citas c
                JOIN profesionales p ON c.profesional_id = p.id
                WHERE c.organizacion_id = $1
                AND c.fecha_cita = CURRENT_DATE
                GROUP BY p.id, p.nombre_completo
                ORDER BY citas_hoy DESC
                LIMIT 10
            `, [organizacionId]);

            return {
                metricas_generales: metricas.rows[0],
                distribucion_canales: canales.rows,
                profesionales_hoy: profesionales.rows,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('[CitaOperacionalModel.obtenerMetricasTiempoReal] Error:', error);
            throw error;
        } finally {
            db.release();
        }
    }

    static async crearWalkIn(datosWalkIn, organizacionId) {
        const db = await getDb();

        try {
            await db.query('BEGIN');
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            const servicio = await CitaHelpersModel.obtenerServicioCompleto(datosWalkIn.servicio_id, organizacionId, db);
            if (!servicio) {
                throw new Error('Servicio no encontrado o inactivo');
            }

            const ahora = new Date();
            const fechaHoy = ahora.toISOString().split('T')[0];
            const duracionEstimada = servicio.duracion_minutos || 30;
            const horaFinEstimada = new Date(ahora.getTime() + (duracionEstimada * 60000));

            const solapamiento = await db.query(`
                SELECT
                    c.id,
                    c.codigo_cita,
                    c.hora_inicio_real,
                    c.hora_fin_real,
                    COALESCE(c.hora_fin_real, c.hora_inicio_real + (s.duracion_minutos || 30) * INTERVAL '1 minute') as fin_estimado
                FROM citas c
                JOIN servicios s ON c.servicio_id = s.id
                WHERE c.profesional_id = $1
                  AND c.organizacion_id = $2
                  AND c.fecha_cita = $3
                  AND c.estado IN ('confirmada', 'en_curso')
                  AND c.hora_inicio_real IS NOT NULL
                  AND (
                    (c.hora_inicio_real <= $4::timestamptz AND
                     COALESCE(c.hora_fin_real, c.hora_inicio_real + (s.duracion_minutos || 30) * INTERVAL '1 minute') > $4::timestamptz)
                    OR
                    (c.hora_inicio_real < $5::timestamptz AND
                     COALESCE(c.hora_fin_real, c.hora_inicio_real + (s.duracion_minutos || 30) * INTERVAL '1 minute') >= $5::timestamptz)
                    OR
                    (c.hora_inicio_real >= $4::timestamptz AND
                     COALESCE(c.hora_fin_real, c.hora_inicio_real + (s.duracion_minutos || 30) * INTERVAL '1 minute') <= $5::timestamptz)
                  )
                LIMIT 1
            `, [datosWalkIn.profesional_id, organizacionId, fechaHoy, ahora.toISOString(), horaFinEstimada.toISOString()]);

            if (solapamiento.rows.length > 0) {
                const citaConflicto = solapamiento.rows[0];
                throw new Error(
                    `Profesional ocupado con cita ${citaConflicto.codigo_cita} hasta ${citaConflicto.fin_estimado}. ` +
                    `Tiempo de espera estimado: ${Math.ceil((new Date(citaConflicto.fin_estimado) - ahora) / 60000)} minutos`
                );
            }

            const citaInsert = await db.query(`
                INSERT INTO citas (
                    organizacion_id, cliente_id, profesional_id, servicio_id,
                    fecha_cita, hora_inicio, hora_fin, hora_llegada, hora_inicio_real,
                    zona_horaria, precio_servicio, descuento, precio_final,
                    estado, metodo_pago, pagado,
                    notas_cliente, notas_internas,
                    confirmacion_requerida, recordatorio_enviado,
                    creado_por, ip_origen, origen_cita, origen_aplicacion, creado_en
                ) VALUES (
                    $1, $2, $3, $4,
                    $5, NULL, NULL, NOW(), NOW(),
                    $6, $7, $8, $9,
                    $10, $11, $12,
                    $13, $14,
                    $15, $16,
                    $17, $18, $19, $20, NOW()
                ) RETURNING
                    id, organizacion_id, codigo_cita, cliente_id, profesional_id, servicio_id,
                    fecha_cita, hora_llegada, hora_inicio_real,
                    precio_final, estado, origen_cita, creado_en
            `, [
                organizacionId,
                datosWalkIn.cliente_id,
                datosWalkIn.profesional_id,
                datosWalkIn.servicio_id,
                fechaHoy,
                DEFAULTS.ZONA_HORARIA,
                servicio.precio || 0,
                0,
                servicio.precio || 0,
                'confirmada',
                null,  // metodo_pago
                false, // pagado
                datosWalkIn.notas_walk_in || `Walk-in: ${datosWalkIn.nombre_cliente || 'Cliente'}`,
                `Tiempo espera aceptado: ${datosWalkIn.tiempo_espera_aceptado || 0} min. Atención inmediata.`,
                false, // confirmacion_requerida
                false, // recordatorio_enviado
                datosWalkIn.usuario_creador_id || null,
                datosWalkIn.ip_origen || null,
                'presencial',      // origen_cita
                'walk_in_pos'      // origen_aplicacion
            ]);

            const citaCreada = citaInsert.rows[0];

            // Registrar evento de auditoría
            await CitaHelpersModel.registrarEventoAuditoria({
                organizacion_id: organizacionId,
                tipo_evento: 'cita_walk_in_creada',
                descripcion: 'Cita walk-in creada desde punto de venta (sin cita previa)',
                cita_id: citaCreada.id,
                usuario_id: datosWalkIn.usuario_creador_id,
                metadatos: {
                    profesional_id: datosWalkIn.profesional_id,
                    servicio_id: datosWalkIn.servicio_id,
                    hora_llegada: citaCreada.hora_llegada,
                    hora_inicio_real: citaCreada.hora_inicio_real,
                    origen: 'walk_in',
                    validacion_solapamiento: 'aprobado'
                }
            }, db);

            await db.query('COMMIT');
            return citaCreada;

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[CitaOperacionalModel.crearWalkIn] Error:', {
                error: error.message,
                organizacion_id: organizacionId,
                datos: datosWalkIn
            });
            throw error;
        } finally {
            db.release();
        }
    }

    static async consultarDisponibilidadInmediata(servicioId, profesionalId, organizacionId) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            const servicio = await CitaHelpersModel.obtenerServicioCompleto(servicioId, organizacionId, db);
            if (!servicio) {
                throw new Error('Servicio no encontrado');
            }

            let whereClause = `
                WHERE p.organizacion_id = $1
                AND p.activo = true
                AND sp.servicio_id = $2
            `;
            let params = [organizacionId, servicioId];

            if (profesionalId) {
                whereClause += ' AND p.id = $3';
                params.push(profesionalId);
            }

            const profesionales = await db.query(`
                SELECT
                    p.id,
                    p.nombre_completo as nombre,
                    p.especialidades,
                    COUNT(c.id) FILTER (WHERE c.fecha_cita = CURRENT_DATE AND c.estado IN ('en_curso', 'confirmada')) as citas_hoy,
                    CASE
                        WHEN EXISTS (
                            SELECT 1 FROM citas c2
                            WHERE c2.profesional_id = p.id
                            AND c2.fecha_cita = CURRENT_DATE
                            AND c2.estado = 'en_curso'
                        ) THEN false
                        ELSE true
                    END as disponible_ahora,
                    COALESCE(
                        (SELECT MIN(c3.hora_fin)
                         FROM citas c3
                         WHERE c3.profesional_id = p.id
                         AND c3.fecha_cita = CURRENT_DATE
                         AND c3.estado IN ('en_curso', 'confirmada')
                         AND c3.hora_inicio > NOW()::time
                        ), '00:00'
                    ) as proxima_disponibilidad
                FROM profesionales p
                JOIN servicios_profesionales sp ON sp.profesional_id = p.id
                LEFT JOIN citas c ON c.profesional_id = p.id
                ${whereClause}
                GROUP BY p.id, p.nombre_completo, p.especialidades
                ORDER BY disponible_ahora DESC, citas_hoy ASC
            `, params);

            return {
                servicio: {
                    id: servicio.id,
                    nombre: servicio.nombre,
                    duracion_minutos: servicio.duracion_minutos,
                    precio: servicio.precio
                },
                profesionales_disponibles: profesionales.rows,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('[CitaOperacionalModel.consultarDisponibilidadInmediata] Error:', error);
            throw error;
        } finally {
            db.release();
        }
    }
}

module.exports = CitaOperacionalModel;