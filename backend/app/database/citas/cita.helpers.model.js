const logger = require('../../utils/logger');

const DEFAULTS = {
    ZONA_HORARIA: 'America/Mexico_City',
    ORIGEN_APLICACION: 'api',
    DURACION_SLOT_DEFAULT: 30,
    HORAS_CANCELACION_MINIMA: 2
};

class CitaHelpersModel {

    static async buscarOCrearCliente(datosIA, db) {
        const clienteExistente = await db.query(
            'SELECT id, nombre, telefono, email FROM clientes WHERE telefono = $1 AND organizacion_id = $2',
            [datosIA.telefono_cliente, datosIA.organizacion_id]
        );

        if (clienteExistente.rows.length > 0) {
            return {
                ...clienteExistente.rows[0],
                es_nuevo: false
            };
        }

        if (datosIA.crear_cliente_si_no_existe) {
            const nuevoCliente = await db.query(`
                INSERT INTO clientes (
                    organizacion_id, nombre, telefono, email,
                    activo, creado_en
                ) VALUES ($1, $2, $3, $4, true, NOW())
                RETURNING id, nombre, telefono, email
            `, [
                datosIA.organizacion_id,
                datosIA.nombre_cliente_nuevo || `Cliente ${datosIA.telefono_cliente}`,
                datosIA.telefono_cliente,
                datosIA.email_cliente_nuevo || null
            ]);

            return {
                ...nuevoCliente.rows[0],
                es_nuevo: true
            };
        }

        throw new Error('Cliente no encontrado y creación automática deshabilitada');
    }

    static async obtenerServicioCompleto(servicioId, organizacionId, db) {
        const servicio = await db.query(`
            SELECT *
            FROM servicios
            WHERE id = $1 AND organizacion_id = $2 AND activo = true
        `, [servicioId, organizacionId]);

        if (servicio.rows.length === 0) {
            return null;
        }

        return {
            ...servicio.rows[0],
            duracion_minutos: servicio.rows[0].duracion_minutos || DEFAULTS.DURACION_SLOT_DEFAULT,
            precio: servicio.rows[0].precio || 0
        };
    }

    static async buscarHorarioCompatible(criterios, db) {
        const {
            organizacion_id,
            servicio_id,
            fecha_solicitada,
            turno_preferido,
            profesional_preferido,
            duracion_minutos
        } = criterios;

        let fechaObjetivo;
        const hoy = new Date();

        if (fecha_solicitada === 'hoy') {
            fechaObjetivo = hoy;
        } else if (fecha_solicitada === 'mañana') {
            fechaObjetivo = new Date(hoy);
            fechaObjetivo.setDate(hoy.getDate() + 1);
        } else if (fecha_solicitada === 'pasado mañana' || fecha_solicitada === 'pasado_mañana') {
            fechaObjetivo = new Date(hoy);
            fechaObjetivo.setDate(hoy.getDate() + 2);
        } else {
            fechaObjetivo = new Date(fecha_solicitada);
        }

        const fechaFormateada = fechaObjetivo.toISOString().split('T')[0];

        let horaInicio, horaFin;
        switch (turno_preferido) {
            case 'mañana':
                horaInicio = '08:00';
                horaFin = '12:00';
                break;
            case 'tarde':
                horaInicio = '14:00';
                horaFin = '18:00';
                break;
            case 'noche':
                horaInicio = '18:00';
                horaFin = '21:00';
                break;
            default:
                horaInicio = '08:00';
                horaFin = '21:00';
        }

        let query = `
            SELECT
                h.id as horario_id,
                h.profesional_id,
                h.fecha,
                h.hora_inicio,
                h.hora_fin,
                p.nombre_completo as profesional_nombre
            FROM horarios_disponibilidad h
            JOIN profesionales p ON h.profesional_id = p.id
            JOIN servicios_profesionales sp ON sp.profesional_id = p.id AND sp.servicio_id = $2
            WHERE h.organizacion_id = $1
                AND h.fecha = $3
                AND h.estado = 'disponible'
                AND h.cita_id IS NULL
                AND h.hora_inicio >= $4::time
                AND h.hora_fin <= $5::time
                AND p.activo = true
        `;

        const params = [organizacion_id, servicio_id, fechaFormateada, horaInicio, horaFin];

        if (profesional_preferido) {
            query += ' AND h.profesional_id = $6';
            params.push(profesional_preferido);
        }

        query += ' ORDER BY h.hora_inicio ASC LIMIT 1';

        const horarios = await db.query(query, params);

        if (horarios.rows.length === 0) {
            logger.warn('[CitaHelpersModel.buscarHorarioCompatible] No hay horarios disponibles', {
                organizacion_id,
                fecha: fechaFormateada,
                turno: turno_preferido,
                profesional_preferido
            });
            return null;
        }

        return horarios.rows[0];
    }

    static async generarCodigoCita(organizacionId, db) {
        logger.error('[CitaHelpersModel.generarCodigoCita] DEPRECATED: Esta función NO debe usarse', {
            organizacion_id: organizacionId,
            mensaje: 'La BD genera codigo_cita automáticamente via trigger',
            formato_correcto: 'ORG001-20251004-001',
            trigger: 'trigger_generar_codigo_cita'
        });

        throw new Error(
            'DEPRECATED: generarCodigoCita() no debe usarse. ' +
            'La base de datos genera codigo_cita automáticamente mediante trigger. ' +
            'NO envíe codigo_cita en el INSERT, use RETURNING * para obtenerlo.'
        );
    }

    static async insertarCitaCompleta(citaData, db) {
        const cita = await db.query(`
            INSERT INTO citas (
                organizacion_id, cliente_id, profesional_id, servicio_id,
                fecha_cita, hora_inicio, hora_fin, zona_horaria, precio_servicio,
                descuento, precio_final, estado, metodo_pago, pagado,
                notas_cliente, notas_internas, confirmacion_requerida,
                confirmada_por_cliente, recordatorio_enviado, creado_por,
                ip_origen, user_agent, origen_aplicacion, creado_en
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                $10, $11, $12, $13, $14, $15, $16, $17,
                $18, $19, $20, $21, $22, $23, NOW()
            ) RETURNING *
        `, [
            citaData.organizacion_id, citaData.cliente_id,
            citaData.profesional_id, citaData.servicio_id, citaData.fecha_cita,
            citaData.hora_inicio, citaData.hora_fin, citaData.zona_horaria,
            citaData.precio_servicio, citaData.descuento, citaData.precio_final,
            citaData.estado, citaData.metodo_pago, citaData.pagado,
            citaData.notas_cliente, citaData.notas_internas, citaData.confirmacion_requerida,
            citaData.confirmada_por_cliente, citaData.recordatorio_enviado,
            citaData.creado_por, citaData.ip_origen, citaData.user_agent,
            citaData.origen_aplicacion
        ]);

        return cita.rows[0];
    }

    static async marcarHorarioOcupado(horarioId, citaId, organizacionId, db) {
        const resultado = await db.query(`
            UPDATE horarios_disponibilidad
            SET estado = 'ocupado',
                cita_id = $1,
                reservado_hasta = NULL,
                session_id = NULL,
                reservado_por = NULL,
                actualizado_en = NOW(),
                version = version + 1
            WHERE id = $2
              AND organizacion_id = $3
              AND estado IN ('disponible', 'reservado_temporal')
            RETURNING id, profesional_id, fecha, hora_inicio, hora_fin, estado
        `, [citaId, horarioId, organizacionId]);

        if (resultado.rows.length === 0) {
            logger.warn('[CitaHelpersModel.marcarHorarioOcupado] Horario no disponible o no existe', {
                horario_id: horarioId,
                cita_id: citaId,
                organizacion_id: organizacionId
            });
            throw new Error('El horario no está disponible o no pertenece a la organización');
        }

        return resultado.rows[0];
    }

    static async registrarEventoAuditoria(evento, db) {
        try {
            await db.query(`
                INSERT INTO eventos_sistema (
                    organizacion_id, tipo_evento, descripcion,
                    cita_id, usuario_id, metadata, creado_en
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [
                evento.organizacion_id,
                evento.tipo_evento || 'cita_creada',
                evento.descripcion || 'Cita creada automáticamente por IA',
                evento.cita_id,
                evento.usuario_id || null,
                JSON.stringify(evento.metadatos || {})
            ]);
        } catch (error) {
            logger.warn('[CitaHelpersModel.registrarEventoAuditoria] Error registrando evento', {
                error: error.message,
                evento
            });
        }
    }

    static async validarEntidadesRelacionadas(clienteId, profesionalId, servicioId, organizacionId, db) {
        const cliente = await db.query(
            'SELECT id FROM clientes WHERE id = $1 AND organizacion_id = $2 AND activo = true',
            [clienteId, organizacionId]
        );
        if (cliente.rows.length === 0) {
            throw new Error('Cliente no encontrado o inactivo');
        }

        const profesional = await db.query(
            'SELECT id FROM profesionales WHERE id = $1 AND organizacion_id = $2 AND activo = true',
            [profesionalId, organizacionId]
        );
        if (profesional.rows.length === 0) {
            throw new Error('Profesional no encontrado o inactivo');
        }

        const servicio = await db.query(
            'SELECT id FROM servicios WHERE id = $1 AND organizacion_id = $2 AND activo = true',
            [servicioId, organizacionId]
        );
        if (servicio.rows.length === 0) {
            throw new Error('Servicio no encontrado o inactivo');
        }

        const servicioprofesional = await db.query(
            'SELECT id FROM servicios_profesionales WHERE profesional_id = $1 AND servicio_id = $2',
            [profesionalId, servicioId]
        );
        if (servicioprofesional.rows.length === 0) {
            throw new Error('El profesional no está autorizado para realizar este servicio');
        }

        return true;
    }

    static async validarConflictoHorario(profesionalId, fecha, horaInicio, horaFin, citaIdExcluir, db) {
        // Normalizar fecha a formato YYYY-MM-DD (soporta ISO completo, Date object o solo fecha)
        let fechaNormalizada;
        if (fecha instanceof Date) {
            fechaNormalizada = fecha.toISOString().split('T')[0];
        } else if (typeof fecha === 'string' && fecha.includes('T')) {
            fechaNormalizada = fecha.split('T')[0];
        } else {
            fechaNormalizada = fecha;
        }

        let query = `
            SELECT id FROM citas
            WHERE profesional_id = $1
                AND fecha_cita = $2
                AND estado NOT IN ('cancelada', 'no_asistio')
                AND (
                    (hora_inicio < $4 AND hora_fin > $3) OR
                    (hora_inicio < $3 AND hora_fin > $3) OR
                    (hora_inicio < $4 AND hora_fin > $4)
                )
        `;

        const params = [profesionalId, fechaNormalizada, horaInicio, horaFin];

        if (citaIdExcluir) {
            query += ' AND id != $5';
            params.push(citaIdExcluir);
        }

        const conflictos = await db.query(query, params);

        if (conflictos.rows.length > 0) {
            throw new Error('Conflicto de horario: el profesional ya tiene una cita en ese horario');
        }

        return true;
    }

    /**
     * 🚫 VALIDACIÓN ANTI-MIDNIGHT CROSSING
     *
     * Valida que el horario no cruce medianoche (constraint BD: hora_fin > hora_inicio)
     * La BD no permite citas que crucen medianoche. Este método previene errores de constraint.
     *
     * @param {string} horaInicio - Hora de inicio (HH:MM:SS)
     * @param {string} horaFin - Hora de fin (HH:MM:SS)
     * @throws {Error} Si hora_fin <= hora_inicio
     * @returns {boolean} true si la validación pasa
     */
    static validarNoMidnightCrossing(horaInicio, horaFin) {
        if (horaFin <= horaInicio) {
            const error = new Error(
                `Horario inválido: ${horaInicio}-${horaFin}. ` +
                `La cita no puede cruzar medianoche. ` +
                `hora_fin debe ser mayor que hora_inicio.`
            );
            logger.error('[CitaHelpersModel.validarNoMidnightCrossing] Validación FALLIDA', {
                hora_inicio: horaInicio,
                hora_fin: horaFin,
                mensaje: 'La cita cruza medianoche'
            });
            throw error;
        }

        logger.debug('[CitaHelpersModel.validarNoMidnightCrossing] Validación EXITOSA', {
            hora_inicio: horaInicio,
            hora_fin: horaFin
        });

        return true;
    }

    /**
     * 🔒 VALIDACIÓN INTEGRAL DE HORARIOS
     *
     * Valida que una cita pueda agendarse verificando:
     * 1. ✅ Horario laboral del profesional (horarios_profesionales)
     * 2. ✅ Bloqueos activos (bloqueos_horarios) - vacaciones, feriados
     * 3. ✅ Conflictos con otras citas (evita double-booking)
     *
     * @param {number} profesionalId - ID del profesional
     * @param {string} fecha - Fecha de la cita (YYYY-MM-DD)
     * @param {string} horaInicio - Hora de inicio (HH:MM:SS)
     * @param {string} horaFin - Hora de fin (HH:MM:SS)
     * @param {number} organizacionId - ID de la organización
     * @param {object} db - Conexión de base de datos
     * @param {number|null} citaIdExcluir - ID de cita a excluir (para reagendar)
     * @param {object} opciones - Opciones adicionales { esWalkIn: boolean, permitirFueraHorario: boolean }
     * @returns {Promise<object>} - { valido: boolean, errores: [], advertencias: [] }
     */
    static async validarHorarioPermitido(profesionalId, fecha, horaInicio, horaFin, organizacionId, db, citaIdExcluir = null, opciones = {}) {
        const { esWalkIn = false, permitirFueraHorario = false } = opciones;

        const errores = [];
        const advertencias = [];

        // Normalizar fecha a formato YYYY-MM-DD (soporta ISO completo, Date object o solo fecha)
        let fechaNormalizada;
        if (fecha instanceof Date) {
            // Si es un Date object, convertir a YYYY-MM-DD
            fechaNormalizada = fecha.toISOString().split('T')[0];
        } else if (typeof fecha === 'string' && fecha.includes('T')) {
            // Si es string con timestamp ISO, extraer solo la fecha
            fechaNormalizada = fecha.split('T')[0];
        } else {
            // Si es string en formato YYYY-MM-DD, usar tal cual
            fechaNormalizada = fecha;
        }

        // Obtener día de la semana (0 = domingo, 6 = sábado)
        const fechaObj = new Date(fechaNormalizada + 'T00:00:00');
        const diaSemana = fechaObj.getDay();

        logger.debug('[CitaHelpersModel.validarHorarioPermitido] Validando horario', {
            profesionalId,
            fecha: fechaNormalizada,
            fecha_original: fecha,
            diaSemana,
            horaInicio,
            horaFin,
            esWalkIn,
            permitirFueraHorario
        });

        // ====================================================================
        // VALIDACIÓN 1: Horario laboral del profesional (horarios_profesionales)
        // ====================================================================
        const horariosLaborales = await db.query(`
            SELECT
                hp.id,
                hp.dia_semana,
                hp.hora_inicio,
                hp.hora_fin,
                hp.tipo_horario,
                hp.permite_citas,
                hp.nombre_horario
            FROM horarios_profesionales hp
            WHERE hp.profesional_id = $1
              AND hp.organizacion_id = $2
              AND hp.dia_semana = $3
              AND hp.activo = true
              AND hp.permite_citas = true
              AND hp.fecha_inicio <= $4
              AND (hp.fecha_fin IS NULL OR hp.fecha_fin >= $4)
            ORDER BY hp.hora_inicio
        `, [profesionalId, organizacionId, diaSemana, fechaNormalizada]);

        if (horariosLaborales.rows.length === 0) {
            errores.push({
                tipo: 'SIN_HORARIO_LABORAL',
                mensaje: `El profesional no trabaja los ${['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'][diaSemana]}`,
                detalles: { dia_semana: diaSemana, fecha }
            });
        } else {
            // Verificar que el horario solicitado esté dentro de alguna franja laboral
            let dentroDeFranja = false;

            for (const horario of horariosLaborales.rows) {
                // Verificar si el horario de la cita está completamente dentro de la franja laboral
                if (horaInicio >= horario.hora_inicio && horaFin <= horario.hora_fin) {
                    dentroDeFranja = true;
                    logger.debug('[CitaHelpersModel.validarHorarioPermitido] Horario dentro de franja laboral', {
                        franja: `${horario.hora_inicio}-${horario.hora_fin}`,
                        tipo: horario.tipo_horario,
                        nombre: horario.nombre_horario
                    });
                    break;
                }
            }

            if (!dentroDeFranja && !permitirFueraHorario) {
                const franjasDisponibles = horariosLaborales.rows
                    .map(h => `${h.hora_inicio}-${h.hora_fin} (${h.nombre_horario || h.tipo_horario})`)
                    .join(', ');

                errores.push({
                    tipo: 'FUERA_HORARIO_LABORAL',
                    mensaje: `El horario ${horaInicio}-${horaFin} está fuera del horario laboral del profesional`,
                    detalles: {
                        horario_solicitado: `${horaInicio}-${horaFin}`,
                        franjas_disponibles: franjasDisponibles
                    }
                });
            } else if (!dentroDeFranja && permitirFueraHorario) {
                advertencias.push({
                    tipo: 'FUERA_HORARIO_LABORAL_PERMITIDO',
                    mensaje: 'Cita fuera del horario laboral habitual (permitido explícitamente)'
                });
            }
        }

        // ====================================================================
        // VALIDACIÓN 2: Bloqueos activos (vacaciones, feriados, etc.)
        // ====================================================================
        const bloqueos = await db.query(`
            SELECT
                b.id,
                b.tipo_bloqueo,
                b.titulo,
                b.fecha_inicio,
                b.fecha_fin,
                b.hora_inicio,
                b.hora_fin,
                b.profesional_id
            FROM bloqueos_horarios b
            WHERE b.organizacion_id = $1
              AND b.activo = true
              AND $2 BETWEEN b.fecha_inicio AND b.fecha_fin
              AND (
                  -- Bloqueo organizacional (afecta a todos)
                  b.profesional_id IS NULL OR
                  -- Bloqueo específico del profesional
                  b.profesional_id = $3
              )
              AND (
                  -- Bloqueo de todo el día
                  (b.hora_inicio IS NULL AND b.hora_fin IS NULL) OR
                  -- Bloqueo de horario específico que se solapa
                  (b.hora_inicio IS NOT NULL AND b.hora_fin IS NOT NULL AND
                   $4 < b.hora_fin AND $5 > b.hora_inicio)
              )
        `, [organizacionId, fechaNormalizada, profesionalId, horaInicio, horaFin]);

        if (bloqueos.rows.length > 0) {
            for (const bloqueo of bloqueos.rows) {
                const esBloqueoOrganizacional = bloqueo.profesional_id === null;
                const tipoBloqueo = bloqueo.tipo_bloqueo;
                const esTodoElDia = bloqueo.hora_inicio === null;

                errores.push({
                    tipo: 'HORARIO_BLOQUEADO',
                    mensaje: `${esBloqueoOrganizacional ? 'Bloqueo organizacional' : 'Bloqueo del profesional'}: ${bloqueo.titulo}`,
                    detalles: {
                        tipo_bloqueo: tipoBloqueo,
                        fecha_inicio: bloqueo.fecha_inicio,
                        fecha_fin: bloqueo.fecha_fin,
                        horario_bloqueado: esTodoElDia ? 'Todo el día' : `${bloqueo.hora_inicio}-${bloqueo.hora_fin}`,
                        es_organizacional: esBloqueoOrganizacional
                    }
                });

                logger.warn('[CitaHelpersModel.validarHorarioPermitido] Horario bloqueado', {
                    bloqueo_id: bloqueo.id,
                    tipo: tipoBloqueo,
                    titulo: bloqueo.titulo,
                    profesional_id: profesionalId
                });
            }
        }

        // ====================================================================
        // VALIDACIÓN 3: Conflictos con otras citas
        // ====================================================================
        try {
            await this.validarConflictoHorario(profesionalId, fecha, horaInicio, horaFin, citaIdExcluir, db);
        } catch (error) {
            errores.push({
                tipo: 'CONFLICTO_CITA',
                mensaje: error.message,
                detalles: { profesional_id: profesionalId, fecha, horario: `${horaInicio}-${horaFin}` }
            });
        }

        // ====================================================================
        // RESULTADO FINAL
        // ====================================================================
        const valido = errores.length === 0;

        if (!valido) {
            logger.warn('[CitaHelpersModel.validarHorarioPermitido] Validación FALLIDA', {
                profesionalId,
                fecha,
                horaInicio,
                horaFin,
                errores: errores.map(e => e.mensaje)
            });
        } else {
            logger.info('[CitaHelpersModel.validarHorarioPermitido] Validación EXITOSA', {
                profesionalId,
                fecha,
                horaInicio,
                horaFin,
                advertencias: advertencias.length
            });
        }

        return {
            valido,
            errores,
            advertencias
        };
    }
}

module.exports = {
    DEFAULTS,
    CitaHelpersModel
};