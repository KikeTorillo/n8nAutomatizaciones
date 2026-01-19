const { getDb } = require('../../../../config/database');
const logger = require('../../../../utils/logger');
const { DEFAULTS, CitaHelpersModel } = require('./cita.helpers.model');
const RLSContextManager = require('../../../../utils/rlsContextManager');
const { DateTime } = require('luxon');
const { ErrorHelper } = require('../../../../utils/helpers');

class CitaOperacionalModel {

    static async checkIn(citaId, datosCheckIn, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
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
                tipo_evento: 'cita_confirmada',
                descripcion: 'Cliente realizó check-in',
                cita_id: citaId,
                usuario_id: datosCheckIn.usuario_id
            }, db);

            return resultado.rows[0];
        });
    }

    static async startService(citaId, datosInicio, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
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

            return resultado.rows[0];
        });
    }

    static async complete(citaId, datosCompletado, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // ✅ precio_final → precio_total
            const resultado = await db.query(`
                UPDATE citas
                SET hora_fin_real = NOW(),
                    estado = 'completada',
                    precio_total = $1,
                    metodo_pago = $2,
                    pagado = true,
                    notas_profesional = COALESCE(notas_profesional, '') || $3,
                    actualizado_por = $4,
                    actualizado_en = NOW()
                WHERE id = $5 AND organizacion_id = $6
                RETURNING *
            `, [
                datosCompletado.precio_total_real || datosCompletado.precio_final_real, // ✅ Backward compatibility
                datosCompletado.metodo_pago,
                datosCompletado.notas_finalizacion ? `\nCompletado: ${datosCompletado.notas_finalizacion}` : '',
                datosCompletado.usuario_id,
                citaId,
                organizacionId
            ]);

            return resultado.rows[0];
        });
    }

    static async reagendar(citaId, datosReagenda, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const citaActual = await db.query('SELECT profesional_id FROM citas WHERE id = $1', [citaId]);
            ErrorHelper.throwIfNotFound(citaActual.rows[0], 'Cita');

            // Validar horario permitido (horarios_profesionales, bloqueos, conflictos)
            const validacion = await CitaHelpersModel.validarHorarioPermitido(
                citaActual.rows[0].profesional_id,
                datosReagenda.nueva_fecha,
                datosReagenda.nueva_hora_inicio,
                datosReagenda.nueva_hora_fin,
                organizacionId,
                db,
                citaId, // excluir esta cita de la validación de conflictos
                { esWalkIn: false, permitirFueraHorario: false }
            );

            if (!validacion.valido) {
                const mensajesError = validacion.errores.map(e => e.mensaje).join('; ');
                logger.error('[reagendar] Validación de horario fallida', {
                    cita_id: citaId,
                    profesional_id: citaActual.rows[0].profesional_id,
                    nueva_fecha: datosReagenda.nueva_fecha,
                    horario: `${datosReagenda.nueva_hora_inicio}-${datosReagenda.nueva_hora_fin}`,
                    errores: validacion.errores
                });
                ErrorHelper.throwConflict(`No se puede reagendar la cita: ${mensajesError}`);
            }

            // Log de advertencias si las hay
            if (validacion.advertencias.length > 0) {
                logger.warn('[reagendar] Advertencias en validación de horario', {
                    cita_id: citaId,
                    advertencias: validacion.advertencias
                });
            }

            // Validar que no cruce medianoche (constraint BD)
            CitaHelpersModel.validarNoMidnightCrossing(
                datosReagenda.nueva_hora_inicio,
                datosReagenda.nueva_hora_fin
            );

            // Normalizar fecha a formato YYYY-MM-DD (soporta ISO completo, Date object o solo fecha)
            let fechaNormalizada;
            if (datosReagenda.nueva_fecha instanceof Date) {
                fechaNormalizada = datosReagenda.nueva_fecha.toISOString().split('T')[0];
            } else if (typeof datosReagenda.nueva_fecha === 'string' && datosReagenda.nueva_fecha.includes('T')) {
                fechaNormalizada = datosReagenda.nueva_fecha.split('T')[0];
            } else {
                fechaNormalizada = datosReagenda.nueva_fecha;
            }

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
                fechaNormalizada,
                datosReagenda.nueva_hora_inicio,
                datosReagenda.nueva_hora_fin,
                `\nReagendada: ${datosReagenda.motivo_reagenda || 'Sin motivo especificado'}`,
                datosReagenda.usuario_id,
                citaId,
                organizacionId
            ]);

            return resultado.rows[0];
        });
    }

    static async obtenerDashboardToday(organizacionId, profesionalId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // ✅ FIX GAP #7: Usar CitaServicioQueries para manejar múltiples servicios
            const CitaServicioQueries = require('./cita-servicio.queries');

            let whereClause = 'WHERE c.organizacion_id = $1 AND c.fecha_cita = CURRENT_DATE';
            let params = [organizacionId];

            if (profesionalId) {
                whereClause += ' AND c.profesional_id = $2';
                params.push(profesionalId);
            }

            const queryDashboard = CitaServicioQueries.buildDashboardConServicios(whereClause);
            const citas = await db.query(queryDashboard, params);

            // ✅ precio_final → precio_total
            const metricas = await db.query(`
                SELECT
                    COUNT(*) as total_citas,
                    COUNT(*) FILTER (WHERE estado = 'completada') as completadas,
                    COUNT(*) FILTER (WHERE estado = 'cancelada') as canceladas,
                    COUNT(*) FILTER (WHERE estado = 'no_asistio') as no_shows,
                    COUNT(*) FILTER (WHERE estado = 'en_curso') as en_progreso,
                    COUNT(*) FILTER (WHERE origen_cita = 'walk_in') as walk_ins,
                    COALESCE(SUM(precio_total) FILTER (WHERE estado = 'completada' AND pagado = true), 0) as ingresos_dia
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
        });
    }

    static async obtenerColaEspera(organizacionId, profesionalId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
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

            // ✅ JOIN con servicios ELIMINADO - Ahora usa duracion_total_minutos de citas
            const cola = await db.query(`
                SELECT
                    c.id,
                    c.codigo_cita,
                    c.hora_inicio,
                    c.hora_llegada,
                    c.estado,
                    c.duracion_total_minutos,
                    cl.nombre as cliente_nombre,
                    p.nombre_completo as profesional_nombre,
                    -- ✅ Servicios como JSON array (evita N+1 queries)
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'nombre', s.nombre,
                                'duracion_minutos', cs.duracion_minutos
                            ) ORDER BY cs.orden_ejecucion
                        ) FILTER (WHERE cs.id IS NOT NULL),
                        '[]'::json
                    ) as servicios,
                    EXTRACT(EPOCH FROM (NOW() - c.hora_llegada))/60 as minutos_esperando,
                    ROW_NUMBER() OVER (PARTITION BY c.profesional_id ORDER BY c.hora_llegada) as posicion_cola
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                JOIN profesionales p ON c.profesional_id = p.id
                LEFT JOIN citas_servicios cs ON c.id = cs.cita_id AND cs.fecha_cita = c.fecha_cita
                LEFT JOIN servicios s ON cs.servicio_id = s.id
                ${whereClause}
                GROUP BY c.id, c.fecha_cita, cl.id, p.id
                ORDER BY c.profesional_id, c.hora_llegada
            `, params);

            return {
                cola_espera: cola.rows,
                total_esperando: cola.rows.length,
                tiempo_espera_promedio: cola.rows.length > 0 ?
                    cola.rows.reduce((sum, c) => sum + parseFloat(c.minutos_esperando), 0) / cola.rows.length : 0
            };
        });
    }

    static async obtenerMetricasTiempoReal(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // ✅ precio_final → precio_total
            const metricas = await db.query(`
                SELECT
                    COUNT(*) FILTER (WHERE fecha_cita = CURRENT_DATE) as citas_hoy,
                    COUNT(*) FILTER (WHERE fecha_cita = CURRENT_DATE AND estado = 'completada') as completadas_hoy,
                    COUNT(*) FILTER (WHERE fecha_cita = CURRENT_DATE AND estado = 'en_curso') as en_progreso_hoy,
                    COUNT(*) FILTER (WHERE fecha_cita = CURRENT_DATE AND origen_cita = 'walk_in') as walkins_hoy,
                    COUNT(*) FILTER (WHERE fecha_cita >= DATE_TRUNC('week', CURRENT_DATE)) as citas_semana,
                    COALESCE(SUM(precio_total) FILTER (WHERE fecha_cita = CURRENT_DATE AND estado = 'completada' AND pagado = true), 0) as ingresos_hoy,
                    COALESCE(SUM(precio_total) FILTER (WHERE fecha_cita >= DATE_TRUNC('week', CURRENT_DATE) AND estado = 'completada' AND pagado = true), 0) as ingresos_semana,
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

            // ✅ precio_final → precio_total
            const profesionales = await db.query(`
                SELECT
                    p.nombre_completo as nombre,
                    COUNT(*) as citas_hoy,
                    COUNT(*) FILTER (WHERE c.estado = 'completada') as completadas,
                    COALESCE(SUM(c.precio_total) FILTER (WHERE c.estado = 'completada' AND c.pagado = true), 0) as ingresos
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
        });
    }

    static async crearWalkIn(datosWalkIn, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // ✅ FEATURE: Soporte para múltiples servicios (pero walk-ins típicamente usan 1 servicio)
            // Aceptar servicio_id (único) o servicios_ids (array)
            let serviciosIds = [];
            if (datosWalkIn.servicios_ids && Array.isArray(datosWalkIn.servicios_ids)) {
                serviciosIds = datosWalkIn.servicios_ids;
            } else if (datosWalkIn.servicio_id) {
                serviciosIds = [datosWalkIn.servicio_id]; // Backward compatibility
            } else {
                ErrorHelper.throwValidation('Se requiere servicio_id o servicios_ids');
            }

            // 1. Validar servicios
            const CitaServicioModel = require('./cita-servicio.model');
            await CitaServicioModel.validarServiciosOrganizacion(serviciosIds, organizacionId);

            // Obtener información completa de TODOS los servicios
            const serviciosInfo = await Promise.all(
                serviciosIds.map(async (servicioId) => {
                    const servicio = await CitaHelpersModel.obtenerServicioCompleto(servicioId, organizacionId, db);
                    ErrorHelper.throwIfNotFound(servicio, `Servicio ${servicioId}`);
                    return servicio;
                })
            );

            // Calcular totales
            const serviciosData = serviciosInfo.map((servicio, index) => ({
                servicio_id: servicio.id,
                orden_ejecucion: index + 1,
                precio_aplicado: servicio.precio || 0.00,
                duracion_minutos: servicio.duracion_minutos || 30,
                descuento: 0.00,
                notas: null
            }));

            const { precio_total, duracion_total_minutos } = CitaServicioModel.calcularTotales(serviciosData);

            logger.info('[crearWalkIn] Servicios validados', {
                cantidad: serviciosIds.length,
                precio_total,
                duracion_total_minutos
            });

            // 2. Resolver cliente (existente o crear nuevo)
            let clienteId = datosWalkIn.cliente_id;

            if (!clienteId && datosWalkIn.nombre_cliente) {
                // Cliente nuevo: crear directamente en la misma transacción
                // Teléfono es OPCIONAL - puede ser null, string vacío o teléfono válido
                const telefonoValido = datosWalkIn.telefono?.trim() || null;

                const clienteInsert = await db.query(`
                    INSERT INTO clientes (
                        organizacion_id, nombre, email, telefono,
                        notas_especiales, como_conocio, activo, marketing_permitido
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id, nombre, telefono
                `, [
                    organizacionId,
                    datosWalkIn.nombre_cliente,
                    null, // email
                    telefonoValido, // puede ser null si no proporcionó teléfono
                    'Cliente walk-in. Creado automáticamente desde POS.',
                    'walk_in_pos',
                    true, // activo
                    false // marketing_permitido
                ]);

                clienteId = clienteInsert.rows[0].id;
                logger.info(`Cliente walk-in creado automáticamente: ${clienteId} - ${datosWalkIn.nombre_cliente}${telefonoValido ? ` (tel: ${telefonoValido})` : ' (sin teléfono)'}`);
            }

            if (!clienteId) {
                ErrorHelper.throwValidation('No se pudo resolver cliente_id');
            }

            // 3. Resolver profesional (existente o auto-asignar)
            let profesionalId = datosWalkIn.profesional_id;

            if (!profesionalId) {
                // Auto-asignar profesional usando disponibilidad inmediata
                const disponibilidad = await this.consultarDisponibilidadInmediata(
                    serviciosIds[0], // Usar primer servicio para búsqueda
                    null, // sin filtro de profesional
                    organizacionId
                );

                if (!disponibilidad.profesionales_disponibles ||
                    disponibilidad.profesionales_disponibles.length === 0) {
                    ErrorHelper.throwConflict('No hay profesionales disponibles para el servicio seleccionado');
                }

                // Tomar el primer profesional disponible (ya vienen ordenados por disponibilidad)
                const profesionalAsignado = disponibilidad.profesionales_disponibles[0];
                profesionalId = profesionalAsignado.id;

                logger.info(`Profesional auto-asignado para walk-in: ${profesionalId} - ${profesionalAsignado.nombre}`);
            }

            // 4. Determinar disponibilidad del profesional y calcular horarios
            // ✅ TIMEZONE FIX: Usar zona horaria de la organización en lugar de UTC
            const zonaHoraria = datosWalkIn.zona_horaria || DEFAULTS.ZONA_HORARIA;
            const ahoraLocal = DateTime.now().setZone(zonaHoraria);
            const ahora = ahoraLocal.toJSDate(); // Para compatibilidad con código existente
            const fechaHoy = ahoraLocal.toFormat('yyyy-MM-dd');
            // ✅ Usar duracion_total_minutos calculado desde múltiples servicios
            const duracionEstimada = duracion_total_minutos;
            const horaActual = ahoraLocal.toFormat('HH:mm:ss'); // Hora local
            const diaSemanaActual = ahoraLocal.weekday === 7 ? 0 : ahoraLocal.weekday; // Luxon: 1=lunes...7=domingo, JS: 0=domingo...6=sábado

            logger.info(`[crearWalkIn] Timezone aplicado: ${zonaHoraria}. Hora UTC: ${DateTime.now().toISO()}, Hora local: ${ahoraLocal.toISO()}, Día semana: ${diaSemanaActual}`);

            // ✅ VALIDACIÓN CRÍTICA: Verificar si el profesional tiene horario laboral AHORA
            // Esto previene walk-ins en horas donde no hay nadie trabajando (ej: 3am)
            const horariosActivos = await db.query(`
                SELECT
                    hp.id,
                    hp.hora_inicio,
                    hp.hora_fin,
                    hp.tipo_horario,
                    hp.nombre_horario
                FROM horarios_profesionales hp
                WHERE hp.profesional_id = $1
                  AND hp.organizacion_id = $2
                  AND hp.dia_semana = $3
                  AND hp.activo = true
                  AND hp.permite_citas = true
                  AND hp.fecha_inicio <= $4
                  AND (hp.fecha_fin IS NULL OR hp.fecha_fin >= $4)
                  AND $5 >= hp.hora_inicio
                  AND $5 < hp.hora_fin
            `, [profesionalId, organizacionId, diaSemanaActual, fechaHoy, horaActual]);

            // Buscar si el profesional tiene una cita en curso (sin terminar)
            // Solo consideramos 'en_curso' porque es el único estado donde el profesional está REALMENTE ocupado
            // ✅ JOIN con servicios ELIMINADO - Ahora usa duracion_total_minutos de citas
            const citaActual = await db.query(`
                SELECT
                    c.id,
                    c.codigo_cita,
                    c.estado,
                    c.hora_inicio_real,
                    c.hora_fin_real,
                    c.hora_inicio,
                    c.duracion_total_minutos,
                    COALESCE(
                        c.hora_fin_real,
                        c.hora_inicio_real + (COALESCE(c.duracion_total_minutos, 30)) * INTERVAL '1 minute',
                        CURRENT_TIMESTAMP + (COALESCE(c.duracion_total_minutos, 30)) * INTERVAL '1 minute'
                    ) as fin_estimado
                FROM citas c
                WHERE c.profesional_id = $1
                  AND c.organizacion_id = $2
                  AND c.fecha_cita = $3
                  AND c.estado = 'en_curso'  -- Solo citas que están siendo atendidas AHORA
                  AND c.hora_fin_real IS NULL  -- Aún NO ha terminado
                ORDER BY c.hora_inicio_real DESC NULLS LAST, c.hora_inicio DESC
                LIMIT 1
            `, [profesionalId, organizacionId, fechaHoy]);

            // ✅ VALIDACIÓN: Si NO tiene cita en curso Y NO tiene horario laboral ahora → RECHAZAR
            if (citaActual.rows.length === 0 && horariosActivos.rows.length === 0) {
                const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                logger.warn(`[crearWalkIn] Walk-in rechazado: Profesional ${profesionalId} no disponible. Día: ${diasSemana[diaSemanaActual]}, Hora local (${zonaHoraria}): ${horaActual.substring(0, 5)}`);
                ErrorHelper.throwConflict(
                    `No se puede atender el walk-in: El profesional no está disponible en este horario. ` +
                    `(Hoy es ${diasSemana[diaSemanaActual]}, hora actual: ${horaActual.substring(0, 5)}, zona: ${zonaHoraria})`
                );
            }

            let horaInicio, horaFin, horaInicioReal, estado;

            // Función auxiliar para convertir Date a formato time "HH:MM:00"
            const formatearHora = (fecha) => {
                const horas = fecha.getHours().toString().padStart(2, '0');
                const minutos = fecha.getMinutes().toString().padStart(2, '0');
                return `${horas}:${minutos}:00`;
            };

            if (citaActual.rows.length === 0) {
                // ✅ ESCENARIO 1: Profesional DISPONIBLE - Empieza INMEDIATAMENTE
                // (Ya validamos que tiene horario laboral activo AHORA)
                const finEstimado = new Date(ahora.getTime() + duracionEstimada * 60000);

                horaInicio = formatearHora(ahora);
                horaFin = formatearHora(finEstimado);

                // Validar que no cruce medianoche (constraint: hora_inicio < hora_fin)
                if (horaFin <= horaInicio) {
                    // Si cruza medianoche, ajustar hora_fin a 23:59:00 del mismo día
                    horaFin = '23:59:00';
                    logger.warn(`⚠️  Walk-in cruzaría medianoche. Ajustando hora_fin a ${horaFin}`);
                }

                horaInicioReal = ahora;  // Empieza AHORA
                estado = 'en_curso';  // Ya está siendo atendido

                logger.info(`✅ Walk-in INMEDIATO - Profesional ${profesionalId} disponible y en horario laboral. Cliente atendido al instante (${horaInicio} - ${horaFin}).`);
            } else {
                // ⏳ ESCENARIO 2: Profesional OCUPADO - Cliente pasa a COLA DE ESPERA
                // (Profesional YA está trabajando, puede exceder su horario laboral para atender)
                const citaConflicto = citaActual.rows[0];
                const finCitaActual = new Date(citaConflicto.fin_estimado);
                const finEstimado = new Date(finCitaActual.getTime() + duracionEstimada * 60000);

                horaInicio = formatearHora(finCitaActual);
                horaFin = formatearHora(finEstimado);

                // Validar que no cruce medianoche
                if (horaFin <= horaInicio) {
                    horaFin = '23:59:00';
                    logger.warn(`⚠️  Walk-in en cola cruzaría medianoche. Ajustando hora_fin a ${horaFin}`);
                }

                horaInicioReal = null;  // AÚN NO empieza
                estado = 'confirmada';  // Esperando su turno

                const tiempoEsperaMinutos = Math.ceil((finCitaActual - ahora) / 60000);
                logger.info(`⏳ Walk-in en COLA DE ESPERA - Profesional ${profesionalId} ocupado (YA está trabajando). Tiempo estimado: ${tiempoEsperaMinutos} min. Será atendido después (${horaInicio} - ${horaFin}).`);
            }

            // 5. Validar horario permitido (horarios_profesionales, bloqueos, conflictos)
            // LÓGICA DINÁMICA para permitirFueraHorario:
            // - Si profesional tiene cita en curso → permitirFueraHorario: true (ya está trabajando, puede atender uno más)
            // - Si profesional NO tiene cita en curso → permitirFueraHorario: false (debe estar en horario laboral)
            const profesionalEstaTrabajando = citaActual.rows.length > 0;

            const validacion = await CitaHelpersModel.validarHorarioPermitido(
                profesionalId,
                fechaHoy,
                horaInicio,
                horaFin,
                organizacionId,
                db,
                null, // no excluir cita
                {
                    esWalkIn: true,
                    permitirFueraHorario: profesionalEstaTrabajando  // ✅ Dinámico según si está trabajando
                }
            );

            if (!validacion.valido) {
                const mensajesError = validacion.errores.map(e => e.mensaje).join('; ');
                logger.error('[crearWalkIn] Validación de horario fallida', {
                    profesional_id: profesionalId,
                    fecha: fechaHoy,
                    horario: `${horaInicio}-${horaFin}`,
                    errores: validacion.errores
                });
                ErrorHelper.throwConflict(`No se puede crear el walk-in: ${mensajesError}`);
            }

            // Log de advertencias si las hay
            if (validacion.advertencias.length > 0) {
                logger.warn('[crearWalkIn] Advertencias en validación de horario', {
                    advertencias: validacion.advertencias
                });
            }

            // 6. Crear cita con horarios calculados según disponibilidad
            // ✅ servicio_id, precio_servicio, descuento, precio_final ELIMINADOS
            // ✅ precio_total, duracion_total_minutos AGREGADOS
            // ✅ FEATURE: Multi-sucursal - sucursal_id agregado
            const citaInsert = await db.query(`
                INSERT INTO citas (
                    organizacion_id, cliente_id, profesional_id, sucursal_id,
                    fecha_cita, hora_inicio, hora_fin, hora_llegada, hora_inicio_real,
                    zona_horaria, precio_total, duracion_total_minutos,
                    estado, metodo_pago, pagado,
                    notas_cliente, notas_internas,
                    confirmacion_requerida, recordatorio_enviado,
                    creado_por, ip_origen, origen_cita, origen_aplicacion, creado_en
                ) VALUES (
                    $1, $2, $3, $4,
                    $5, $6::time, $7::time, NOW(), $8,
                    $9, $10, $11,
                    $12, $13, $14,
                    $15, $16,
                    $17, $18,
                    $19, $20, $21, $22, NOW()
                ) RETURNING
                    id, organizacion_id, codigo_cita, cliente_id, profesional_id, sucursal_id,
                    fecha_cita, hora_inicio, hora_fin, hora_llegada, hora_inicio_real,
                    precio_total, duracion_total_minutos, estado, origen_cita, creado_en
            `, [
                organizacionId,
                clienteId,
                profesionalId,
                datosWalkIn.sucursal_id || null, // ✅ Multi-sucursal
                fechaHoy,
                horaInicio,        // Calculada según disponibilidad
                horaFin,           // Calculada según disponibilidad
                horaInicioReal,    // NOW() si disponible, NULL si en cola
                zonaHoraria,       // Zona horaria de la organización
                precio_total,      // ✅ Total calculado desde múltiples servicios
                duracion_total_minutos, // ✅ Duración total calculada
                estado,            // 'en_curso' o 'confirmada' según disponibilidad
                null,  // metodo_pago
                false, // pagado
                datosWalkIn.notas_walk_in || `Walk-in: ${datosWalkIn.nombre_cliente || 'Cliente'}`,
                `Tiempo espera aceptado: ${datosWalkIn.tiempo_espera_aceptado || 0} min. ${datosWalkIn.profesional_id ? 'Profesional solicitado' : 'Profesional auto-asignado'}.`,
                false, // confirmacion_requerida
                false, // recordatorio_enviado
                datosWalkIn.usuario_creador_id || null,
                datosWalkIn.ip_origen || null,
                'presencial',      // origen_cita
                'walk_in_pos'      // origen_aplicacion
            ]);

            const citaCreada = citaInsert.rows[0];

            // ✅ FEATURE: Insertar servicios en citas_servicios
            const valuesServicios = [];
            const placeholdersServicios = [];
            let paramCountServ = 1;

            serviciosData.forEach((servicio) => {
                placeholdersServicios.push(
                    `($${paramCountServ}, $${paramCountServ + 1}, $${paramCountServ + 2}, $${paramCountServ + 3}, $${paramCountServ + 4}, $${paramCountServ + 5}, $${paramCountServ + 6}, $${paramCountServ + 7})`
                );

                valuesServicios.push(
                    citaCreada.id,
                    citaCreada.fecha_cita,  // ✅ PARTITIONING: Requerido para FK compuesto
                    servicio.servicio_id,
                    servicio.orden_ejecucion,
                    servicio.precio_aplicado,
                    servicio.duracion_minutos,
                    servicio.descuento,
                    servicio.notas
                );

                paramCountServ += 8;
            });

            await db.query(`
                INSERT INTO citas_servicios (
                    cita_id, fecha_cita, servicio_id, orden_ejecucion,
                    precio_aplicado, duracion_minutos, descuento, notas
                ) VALUES ${placeholdersServicios.join(', ')}
            `, valuesServicios);

            logger.info('[crearWalkIn] Servicios insertados en citas_servicios', {
                cita_id: citaCreada.id,
                cantidad: serviciosData.length
            });

            // Registrar evento de auditoría
            // ✅ servicios_ids en lugar de servicio_id único
            await CitaHelpersModel.registrarEventoAuditoria({
                organizacion_id: organizacionId,
                tipo_evento: 'cita_creada',
                descripcion: `Cita walk-in creada. ${datosWalkIn.profesional_id ? 'Profesional especificado' : 'Profesional auto-asignado'}.`,
                cita_id: citaCreada.id,
                usuario_id: datosWalkIn.usuario_creador_id,
                metadatos: {
                    profesional_id: profesionalId,
                    profesional_auto_asignado: !datosWalkIn.profesional_id,
                    cliente_id: clienteId,
                    cliente_creado: !datosWalkIn.cliente_id,
                    servicios_ids: serviciosIds, // ✅ Array de servicios
                    cantidad_servicios: serviciosIds.length,
                    precio_total,
                    duracion_total_minutos,
                    hora_llegada: citaCreada.hora_llegada,
                    hora_inicio_real: citaCreada.hora_inicio_real,
                    origen: 'walk_in'
                }
            }, db);

            return citaCreada;
        });
    }

    static async consultarDisponibilidadInmediata(servicioId, profesionalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const servicio = await CitaHelpersModel.obtenerServicioCompleto(servicioId, organizacionId, db);
            ErrorHelper.throwIfNotFound(servicio, 'Servicio');

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
                GROUP BY p.id, p.nombre_completo
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
        });
    }
}

module.exports = CitaOperacionalModel;