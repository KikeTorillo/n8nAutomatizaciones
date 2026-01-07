const logger = require('../../../../utils/logger');
const CitaValidacionUtil = require('../../utils/cita-validacion.util');

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
        // ✅ FEATURE: Soporte para múltiples servicios
        // servicio_id, precio_servicio, descuento, precio_final ELIMINADOS
        // precio_total y duracion_total_minutos AGREGADOS
        // ✅ FEATURE: Multi-sucursal - sucursal_id agregado
        const cita = await db.query(`
            INSERT INTO citas (
                organizacion_id, cliente_id, profesional_id, sucursal_id,
                fecha_cita, hora_inicio, hora_fin, zona_horaria,
                precio_total, duracion_total_minutos,
                estado, metodo_pago, pagado,
                notas_cliente, notas_internas, confirmacion_requerida,
                confirmada_por_cliente, recordatorio_enviado, creado_por,
                ip_origen, user_agent, origen_aplicacion, creado_en
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16,
                $17, $18, $19, $20, $21, $22, NOW()
            ) RETURNING *
        `, [
            citaData.organizacion_id, citaData.cliente_id,
            citaData.profesional_id, citaData.sucursal_id || null,
            citaData.fecha_cita,
            citaData.hora_inicio, citaData.hora_fin, citaData.zona_horaria,
            citaData.precio_total, citaData.duracion_total_minutos,
            citaData.estado, citaData.metodo_pago, citaData.pagado,
            citaData.notas_cliente, citaData.notas_internas, citaData.confirmacion_requerida,
            citaData.confirmada_por_cliente, citaData.recordatorio_enviado,
            citaData.creado_por, citaData.ip_origen, citaData.user_agent,
            citaData.origen_aplicacion
        ]);

        return cita.rows[0];
    }


    /**
     * Registrar evento de auditoría de forma segura usando SAVEPOINT
     *
     * IMPORTANTE: Usa SAVEPOINT para que un error (ej: partición faltante)
     * NO aborte la transacción principal. Sin SAVEPOINT, PostgreSQL marca
     * la transacción como "aborted" y el COMMIT se convierte en ROLLBACK.
     *
     * @param {Object} evento - Datos del evento
     * @param {Object} db - Conexión de base de datos (dentro de transacción)
     */
    static async registrarEventoAuditoria(evento, db) {
        const savepointName = `auditoria_${Date.now()}`;

        try {
            // Crear SAVEPOINT antes de la operación
            await db.query(`SAVEPOINT ${savepointName}`);

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

            // Liberar SAVEPOINT si todo OK
            await db.query(`RELEASE SAVEPOINT ${savepointName}`);

        } catch (error) {
            // Rollback solo hasta el SAVEPOINT (no aborta la transacción principal)
            try {
                await db.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
            } catch (rollbackError) {
                // Ignorar error de rollback (el savepoint puede no existir)
            }

            logger.warn('[CitaHelpersModel.registrarEventoAuditoria] Error registrando evento (transacción NO afectada)', {
                error: error.message,
                evento
            });
        }
    }

    /**
     * Validar entidades relacionadas (cliente, profesional, servicios)
     * ✅ FEATURE: Ahora acepta servicio_id (backward compatibility) o serviciosIds (array)
     * @param {number} clienteId - ID del cliente
     * @param {number} profesionalId - ID del profesional
     * @param {number|Array<number>} servicioIdOArray - ID de servicio único o array de IDs
     * @param {number} organizacionId - ID de la organización
     * @param {Object} db - Conexión de base de datos
     * @returns {Promise<boolean>} true si todas las validaciones pasan
     */
    static async validarEntidadesRelacionadas(clienteId, profesionalId, servicioIdOArray, organizacionId, db) {
        // Normalizar a array (backward compatibility)
        let serviciosIds = Array.isArray(servicioIdOArray) ? servicioIdOArray : [servicioIdOArray];

        // 1. Validar cliente
        const cliente = await db.query(
            'SELECT id FROM clientes WHERE id = $1 AND organizacion_id = $2 AND activo = true',
            [clienteId, organizacionId]
        );
        if (cliente.rows.length === 0) {
            throw new Error('Cliente no encontrado o inactivo');
        }

        // 2. Validar profesional
        const profesional = await db.query(
            'SELECT id, nombre_completo FROM profesionales WHERE id = $1 AND organizacion_id = $2 AND activo = true',
            [profesionalId, organizacionId]
        );
        if (profesional.rows.length === 0) {
            throw new Error('Profesional no encontrado o inactivo');
        }

        const nombreProfesional = profesional.rows[0].nombre_completo;

        // 3. Validar que TODOS los servicios existen y están activos
        const servicios = await db.query(
            'SELECT id, nombre FROM servicios WHERE id = ANY($1::int[]) AND organizacion_id = $2 AND activo = true',
            [serviciosIds, organizacionId]
        );

        if (servicios.rows.length !== serviciosIds.length) {
            const encontrados = servicios.rows.map(s => s.id);
            const faltantes = serviciosIds.filter(id => !encontrados.includes(id));
            throw new Error(`Los siguientes servicios no existen o están inactivos: ${faltantes.join(', ')}`);
        }

        // 4. Validar que el profesional tiene TODOS los servicios asignados
        const serviciosProfesional = await db.query(
            `SELECT sp.servicio_id, sp.activo,
                    s.nombre as servicio_nombre
             FROM servicios_profesionales sp
             JOIN servicios s ON sp.servicio_id = s.id
             WHERE sp.profesional_id = $1 AND sp.servicio_id = ANY($2::int[])`,
            [profesionalId, serviciosIds]
        );

        // Verificar que encontramos TODAS las asignaciones
        const serviciosAsignados = serviciosProfesional.rows.map(sp => sp.servicio_id);
        const serviciosSinAsignar = serviciosIds.filter(id => !serviciosAsignados.includes(id));

        if (serviciosSinAsignar.length > 0) {
            // Obtener nombres de servicios sin asignar
            const nombresSinAsignar = servicios.rows
                .filter(s => serviciosSinAsignar.includes(s.id))
                .map(s => s.nombre);

            // Mensaje genérico que funciona para singular y plural
            const servicioTexto = nombresSinAsignar.length === 1 ? 'el servicio' : 'los servicios';
            throw new Error(
                `El profesional "${nombreProfesional}" no tiene asignado ${servicioTexto}: ${nombresSinAsignar.join(', ')}. ` +
                `Por favor asigna ${servicioTexto} al profesional desde la página de Servicios antes de crear la cita.`
            );
        }

        // Verificar que TODAS las asignaciones están activas
        const serviciosInactivos = serviciosProfesional.rows.filter(sp => !sp.activo);
        if (serviciosInactivos.length > 0) {
            const nombresInactivos = serviciosInactivos.map(sp => sp.servicio_nombre);
            const estaEstanTexto = nombresInactivos.length === 1 ? 'está inactiva' : 'están inactivas';
            const reactivalaTexto = nombresInactivos.length === 1 ? 'reactívala' : 'reactívalas';

            throw new Error(
                `La asignación ${estaEstanTexto} para "${nombreProfesional}": ${nombresInactivos.join(', ')}. ` +
                `Por favor ${reactivalaTexto} desde la página de Servicios antes de crear la cita.`
            );
        }

        return true;
    }

    /**
     * Valida conflictos de horario con citas existentes
     *
     * ⚠️ REFACTORIZADO: Usa CitaValidacionUtil.citaSolapaConSlot() para lógica compartida
     *
     * @param {number} profesionalId - ID del profesional
     * @param {string|Date} fecha - Fecha de la cita
     * @param {string} horaInicio - Hora inicio (HH:MM:SS)
     * @param {string} horaFin - Hora fin (HH:MM:SS)
     * @param {number|null} citaIdExcluir - ID de cita a excluir (para reagendar)
     * @param {object} db - Conexión de base de datos
     * @throws {Error} Si hay conflicto de horario
     * @returns {boolean} true si no hay conflictos
     */
    static async validarConflictoHorario(profesionalId, fecha, horaInicio, horaFin, citaIdExcluir, db) {
        // ✅ Usar CitaValidacionUtil para normalizar fecha
        const fechaNormalizada = CitaValidacionUtil.normalizarFecha(fecha);

        // Consultar todas las citas del profesional en la fecha
        // ✅ IMPORTANTE: Incluir buffer_preparacion y buffer_limpieza del servicio
        // Buffer de preparación: del primer servicio (orden_ejecucion ASC)
        // Buffer de limpieza: del último servicio (orden_ejecucion DESC)
        let query = `
            WITH citas_con_buffer AS (
                SELECT
                    c.id,
                    c.profesional_id,
                    c.fecha_cita,
                    c.hora_inicio as hora_inicio_original,
                    c.hora_fin as hora_fin_original,
                    c.estado,
                    c.codigo_cita,
                    -- Buffer de preparación: del primer servicio
                    COALESCE(
                        (SELECT s.requiere_preparacion_minutos
                         FROM citas_servicios cs
                         JOIN servicios s ON cs.servicio_id = s.id
                         WHERE cs.cita_id = c.id AND cs.fecha_cita = c.fecha_cita
                         ORDER BY cs.orden_ejecucion ASC LIMIT 1), 0
                    ) as buffer_preparacion,
                    -- Buffer de limpieza: del último servicio
                    COALESCE(
                        (SELECT s.tiempo_limpieza_minutos
                         FROM citas_servicios cs
                         JOIN servicios s ON cs.servicio_id = s.id
                         WHERE cs.cita_id = c.id AND cs.fecha_cita = c.fecha_cita
                         ORDER BY cs.orden_ejecucion DESC LIMIT 1), 0
                    ) as buffer_limpieza
                FROM citas c
                WHERE c.profesional_id = $1
                    AND c.fecha_cita = $2
                    AND c.estado NOT IN ('cancelada', 'no_asistio')
                    ${citaIdExcluir ? 'AND c.id != $3' : ''}
            )
            SELECT
                id,
                profesional_id,
                fecha_cita,
                -- Horas efectivas con buffer aplicado
                (hora_inicio_original - (buffer_preparacion || ' minutes')::interval)::time as hora_inicio,
                (hora_fin_original + (buffer_limpieza || ' minutes')::interval)::time as hora_fin,
                -- Horas originales para logging
                hora_inicio_original,
                hora_fin_original,
                estado,
                codigo_cita,
                buffer_preparacion,
                buffer_limpieza
            FROM citas_con_buffer
        `;

        const params = citaIdExcluir
            ? [profesionalId, fechaNormalizada, citaIdExcluir]
            : [profesionalId, fechaNormalizada];

        const citasResult = await db.query(query, params);

        // ✅ Usar CitaValidacionUtil.citaSolapaConSlot() para validar cada cita
        // Las horas ya vienen ajustadas con buffer desde SQL
        for (const cita of citasResult.rows) {
            if (CitaValidacionUtil.citaSolapaConSlot(cita, profesionalId, fecha, horaInicio, horaFin)) {
                // Mostrar hora original + buffer en mensaje de error
                const horaOriginal = `${cita.hora_inicio_original.substring(0, 5)} - ${cita.hora_fin_original.substring(0, 5)}`;
                const horaEfectiva = `${cita.hora_inicio.substring(0, 5)} - ${cita.hora_fin.substring(0, 5)}`;

                // Formatear fecha correctamente
                const fechaStr = cita.fecha_cita instanceof Date
                    ? cita.fecha_cita.toISOString().split('T')[0]
                    : String(cita.fecha_cita);
                const [year, month, day] = fechaStr.split('-');
                const fechaFormateada = `${day}/${month}/${year}`;

                // Construir mensaje con info de buffer si aplica
                let bufferInfo = '';
                if (cita.buffer_preparacion > 0 || cita.buffer_limpieza > 0) {
                    const buffers = [];
                    if (cita.buffer_preparacion > 0) buffers.push(`${cita.buffer_preparacion} min prep.`);
                    if (cita.buffer_limpieza > 0) buffers.push(`${cita.buffer_limpieza} min limpieza`);
                    bufferInfo = ` (incluye ${buffers.join(' + ')}, bloquea ${horaEfectiva})`;
                }

                throw new Error(
                    `Conflicto de horario: El profesional ya tiene la cita ${cita.codigo_cita} programada el ${fechaFormateada} de ${horaOriginal}${bufferInfo}. ` +
                    `Por favor, selecciona otro horario disponible.`
                );
            }
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
     * 🔒 VALIDACIÓN INTEGRAL DE HORARIOS (OPERACIONES DE ESCRITURA)
     *
     * ⚠️ IMPORTANTE: Este método valida UN SOLO SLOT antes de operaciones de escritura
     * (crear, editar, reagendar citas). Hace queries SQL individuales para garantizar
     * precisión del 100% con datos actualizados.
     *
     * Para consultas de disponibilidad masiva (lectura), usar:
     * - DisponibilidadModel.consultarDisponibilidad() (optimizado con batch queries)
     *
     * LÓGICA COMPARTIDA:
     * - CitaValidacionUtil.haySolapamientoHorario() - Lógica de solapamiento
     * - CitaValidacionUtil.bloqueoAfectaSlot() - Validación de bloqueos
     * - CitaValidacionUtil.citaSolapaConSlot() - Validación de conflictos
     *
     * Si se modifica la lógica de validación, actualizar también en:
     * - CitaValidacionUtil (funciones compartidas)
     * - DisponibilidadModel._verificarDisponibilidadSlotsEnMemoria()
     *
     * Valida que una cita pueda agendarse verificando:
     * 1. ✅ Horario laboral del profesional (horarios_profesionales)
     * 2. ✅ Bloqueos activos (bloqueos_horarios) - vacaciones, feriados
     * 3. ✅ Conflictos con otras citas (evita double-booking)
     *
     * @param {number} profesionalId - ID del profesional
     * @param {string|Date} fecha - Fecha de la cita (YYYY-MM-DD, ISO o Date)
     * @param {string} horaInicio - Hora de inicio (HH:MM:SS)
     * @param {string} horaFin - Hora de fin (HH:MM:SS)
     * @param {number} organizacionId - ID de la organización
     * @param {object} db - Conexión de base de datos
     * @param {number|null} citaIdExcluir - ID de cita a excluir (para reagendar)
     * @param {object} opciones - Opciones adicionales { esWalkIn: boolean, permitirFueraHorario: boolean }
     * @returns {Promise<object>} - { valido: boolean, errores: [], advertencias: [] }
     *
     * @see backend/app/utils/cita-validacion.util.js
     * @see backend/app/database/disponibilidad.model.js:328
     */
    static async validarHorarioPermitido(profesionalId, fecha, horaInicio, horaFin, organizacionId, db, citaIdExcluir = null, opciones = {}) {
        const { esWalkIn = false, permitirFueraHorario = false } = opciones;

        const errores = [];
        const advertencias = [];

        // ✅ Usar CitaValidacionUtil para normalizar fecha
        const fechaNormalizada = CitaValidacionUtil.normalizarFecha(fecha);

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
        // ✅ Query simplificada - CitaValidacionUtil.bloqueoAfectaSlot() maneja la lógica
        const bloqueos = await db.query(`
            SELECT
                b.id,
                b.tipo_bloqueo_id,
                tb.codigo AS tipo_bloqueo,
                tb.nombre AS tipo_bloqueo_nombre,
                b.titulo,
                b.fecha_inicio,
                b.fecha_fin,
                b.hora_inicio,
                b.hora_fin,
                b.profesional_id
            FROM bloqueos_horarios b
            LEFT JOIN tipos_bloqueo tb ON b.tipo_bloqueo_id = tb.id
            WHERE b.organizacion_id = $1
              AND b.activo = true
              AND (
                  -- Bloqueo organizacional (afecta a todos)
                  b.profesional_id IS NULL OR
                  -- Bloqueo específico del profesional
                  b.profesional_id = $2
              )
        `, [organizacionId, profesionalId]);

        // ✅ Usar CitaValidacionUtil.bloqueoAfectaSlot() para validar cada bloqueo
        for (const bloqueo of bloqueos.rows) {
            if (CitaValidacionUtil.bloqueoAfectaSlot(bloqueo, profesionalId, fecha, horaInicio, horaFin)) {
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