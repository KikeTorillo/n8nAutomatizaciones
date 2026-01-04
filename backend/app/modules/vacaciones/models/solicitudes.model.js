/**
 * SolicitudesVacacionesModel - Enero 2026
 * Gestión de solicitudes de vacaciones con integración a bloqueos
 * Fase 3 del Plan de Empleados Competitivo
 */
const RLSContextManager = require('../../../utils/rlsContextManager');
const SaldosVacacionesModel = require('./saldos.model');
const PoliticasVacacionesModel = require('./politicas.model');
const { ESTADOS_SOLICITUD, ERRORES_VACACIONES } = require('../constants/vacaciones.constants');

class SolicitudesVacacionesModel {

    /**
     * Crea una nueva solicitud de vacaciones
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional solicitante
     * @param {Object} data - Datos de la solicitud
     * @param {number} usuarioId - ID del usuario que crea
     * @returns {Promise<Object>} Solicitud creada
     */
    static async crear(organizacionId, profesionalId, data, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const { fecha_inicio, fecha_fin, es_medio_dia, turno_medio_dia, motivo_solicitud } = data;

            // Validar fechas
            const fechaInicio = new Date(fecha_inicio);
            const fechaFin = new Date(fecha_fin);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            if (fechaInicio < hoy) {
                throw new Error(ERRORES_VACACIONES.FECHA_PASADA);
            }

            if (fechaInicio > fechaFin) {
                throw new Error(ERRORES_VACACIONES.FECHAS_INVALIDAS);
            }

            // Obtener política
            const politica = await PoliticasVacacionesModel.obtenerOCrear(organizacionId, usuarioId);

            // Validar anticipación mínima
            const diasAnticipacion = Math.ceil((fechaInicio - hoy) / (1000 * 60 * 60 * 24));
            if (diasAnticipacion < politica.dias_anticipacion_minimos) {
                throw new Error(
                    ERRORES_VACACIONES.ANTICIPACION_INSUFICIENTE.replace('{dias}', politica.dias_anticipacion_minimos)
                );
            }

            // Calcular días solicitados
            let diasSolicitados;
            if (es_medio_dia) {
                diasSolicitados = 0.5;
            } else {
                // Calcular días hábiles
                const diasHabilesQuery = await db.query(
                    `SELECT calcular_dias_habiles_vacaciones($1, $2, $3, $4) as dias`,
                    [organizacionId, fecha_inicio, fecha_fin, politica.ignorar_festivos]
                );
                diasSolicitados = parseFloat(diasHabilesQuery.rows[0].dias);
            }

            // Validar días consecutivos máximos
            if (politica.dias_maximos_consecutivos && diasSolicitados > politica.dias_maximos_consecutivos) {
                throw new Error(
                    ERRORES_VACACIONES.DIAS_CONSECUTIVOS_EXCEDIDOS.replace('{max}', politica.dias_maximos_consecutivos)
                );
            }

            // Verificar saldo disponible
            const anio = fechaInicio.getFullYear();
            const verificacionSaldo = await SaldosVacacionesModel.verificarSaldoDisponible(
                organizacionId, profesionalId, anio, diasSolicitados
            );

            if (!verificacionSaldo.disponible) {
                throw new Error(verificacionSaldo.mensaje);
            }

            // Verificar solapamiento con otras solicitudes
            const solapamientoQuery = await db.query(
                `SELECT id, codigo, fecha_inicio, fecha_fin
                 FROM solicitudes_vacaciones
                 WHERE organizacion_id = $1
                   AND profesional_id = $2
                   AND estado IN ('pendiente', 'aprobada')
                   AND (
                       (fecha_inicio <= $3 AND fecha_fin >= $3) OR
                       (fecha_inicio <= $4 AND fecha_fin >= $4) OR
                       (fecha_inicio >= $3 AND fecha_fin <= $4)
                   )`,
                [organizacionId, profesionalId, fecha_inicio, fecha_fin]
            );

            if (solapamientoQuery.rows.length > 0) {
                throw new Error(ERRORES_VACACIONES.SOLAPAMIENTO);
            }

            // Crear solicitud
            const insertQuery = `
                INSERT INTO solicitudes_vacaciones (
                    organizacion_id, profesional_id,
                    fecha_inicio, fecha_fin, dias_solicitados,
                    es_medio_dia, turno_medio_dia,
                    motivo_solicitud, creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const result = await db.query(insertQuery, [
                organizacionId,
                profesionalId,
                fecha_inicio,
                fecha_fin,
                diasSolicitados,
                es_medio_dia || false,
                turno_medio_dia || null,
                motivo_solicitud || null,
                usuarioId,
            ]);

            const solicitud = result.rows[0];

            // Reservar días en el saldo (dias_solicitados_pendientes)
            await SaldosVacacionesModel.actualizarDiasSolicitadosPendientes(
                organizacionId, profesionalId, anio, diasSolicitados
            );

            // TODO: Notificar al aprobador según política
            // await NotificacionesService.notificarAprobador(solicitud);

            return solicitud;
        });
    }

    /**
     * Lista las solicitudes del profesional autenticado
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {Object} filtros - Filtros
     * @returns {Promise<Object>} { data, total, page, limit }
     */
    static async listarMisSolicitudes(organizacionId, profesionalId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                estado = null,
                anio = null,
                page = 1,
                limit = 20,
            } = filtros;

            let whereClause = 'sv.organizacion_id = $1 AND sv.profesional_id = $2';
            const values = [organizacionId, profesionalId];
            let contador = 3;

            if (estado) {
                whereClause += ` AND sv.estado = $${contador}`;
                values.push(estado);
                contador++;
            }

            if (anio) {
                whereClause += ` AND EXTRACT(YEAR FROM sv.fecha_inicio) = $${contador}`;
                values.push(anio);
                contador++;
            }

            // Contar total
            const countResult = await db.query(
                `SELECT COUNT(*) as total FROM solicitudes_vacaciones sv WHERE ${whereClause}`,
                values
            );
            const total = parseInt(countResult.rows[0].total);

            // Obtener datos paginados
            const offset = (page - 1) * limit;
            const dataQuery = `
                SELECT
                    sv.*,
                    ua.nombre || ' ' || COALESCE(ua.apellidos, '') as aprobador_nombre
                FROM solicitudes_vacaciones sv
                LEFT JOIN usuarios ua ON ua.id = sv.aprobador_id
                WHERE ${whereClause}
                ORDER BY sv.creado_en DESC
                LIMIT $${contador} OFFSET $${contador + 1}
            `;
            values.push(limit, offset);

            const dataResult = await db.query(dataQuery, values);

            return {
                data: dataResult.rows,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        });
    }

    /**
     * Lista todas las solicitudes (admin)
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros
     * @returns {Promise<Object>} { data, total, page, limit }
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                estado = null,
                profesional_id = null,
                fecha_inicio = null,
                fecha_fin = null,
                anio = null,
                page = 1,
                limit = 20,
            } = filtros;

            let whereClause = 'sv.organizacion_id = $1';
            const values = [organizacionId];
            let contador = 2;

            if (estado) {
                whereClause += ` AND sv.estado = $${contador}`;
                values.push(estado);
                contador++;
            }

            if (profesional_id) {
                whereClause += ` AND sv.profesional_id = $${contador}`;
                values.push(profesional_id);
                contador++;
            }

            if (fecha_inicio) {
                whereClause += ` AND sv.fecha_inicio >= $${contador}`;
                values.push(fecha_inicio);
                contador++;
            }

            if (fecha_fin) {
                whereClause += ` AND sv.fecha_fin <= $${contador}`;
                values.push(fecha_fin);
                contador++;
            }

            if (anio) {
                whereClause += ` AND EXTRACT(YEAR FROM sv.fecha_inicio) = $${contador}`;
                values.push(anio);
                contador++;
            }

            // Contar total
            const countResult = await db.query(
                `SELECT COUNT(*) as total FROM solicitudes_vacaciones sv WHERE ${whereClause}`,
                values
            );
            const total = parseInt(countResult.rows[0].total);

            // Obtener datos paginados
            const offset = (page - 1) * limit;
            const dataQuery = `
                SELECT
                    sv.*,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    p.codigo,
                    d.nombre as departamento_nombre,
                    ua.nombre || ' ' || COALESCE(ua.apellidos, '') as aprobador_nombre
                FROM solicitudes_vacaciones sv
                JOIN profesionales p ON p.id = sv.profesional_id
                LEFT JOIN departamentos d ON d.id = p.departamento_id
                LEFT JOIN usuarios ua ON ua.id = sv.aprobador_id
                WHERE ${whereClause}
                ORDER BY sv.creado_en DESC
                LIMIT $${contador} OFFSET $${contador + 1}
            `;
            values.push(limit, offset);

            const dataResult = await db.query(dataQuery, values);

            return {
                data: dataResult.rows,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        });
    }

    /**
     * Lista solicitudes pendientes de aprobación
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros
     * @returns {Promise<Object>} { data, total }
     */
    static async listarPendientes(organizacionId, filtros = {}) {
        return await this.listar(organizacionId, {
            ...filtros,
            estado: ESTADOS_SOLICITUD.PENDIENTE,
        });
    }

    /**
     * Obtiene una solicitud por ID
     * @param {number} organizacionId - ID de la organización
     * @param {number} solicitudId - ID de la solicitud
     * @returns {Promise<Object|null>} Solicitud o null
     */
    static async obtenerPorId(organizacionId, solicitudId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    sv.*,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    p.codigo,
                    p.supervisor_id,
                    d.nombre as departamento_nombre,
                    ua.nombre || ' ' || COALESCE(ua.apellidos, '') as aprobador_nombre,
                    uc.nombre || ' ' || COALESCE(uc.apellidos, '') as creado_por_nombre
                FROM solicitudes_vacaciones sv
                JOIN profesionales p ON p.id = sv.profesional_id
                LEFT JOIN departamentos d ON d.id = p.departamento_id
                LEFT JOIN usuarios ua ON ua.id = sv.aprobador_id
                LEFT JOIN usuarios uc ON uc.id = sv.creado_por
                WHERE sv.id = $1
                  AND sv.organizacion_id = $2
            `;

            const result = await db.query(query, [solicitudId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Aprueba una solicitud y crea el bloqueo correspondiente
     * @param {number} organizacionId - ID de la organización
     * @param {number} solicitudId - ID de la solicitud
     * @param {number} aprobadorId - ID del usuario que aprueba
     * @param {string} notasInternas - Notas internas opcionales
     * @returns {Promise<Object>} Solicitud aprobada con bloqueo
     */
    static async aprobar(organizacionId, solicitudId, aprobadorId, notasInternas = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Obtener solicitud
            const solicitud = await this.obtenerPorId(organizacionId, solicitudId);

            if (!solicitud) {
                throw new Error(ERRORES_VACACIONES.SOLICITUD_NO_ENCONTRADA);
            }

            if (solicitud.estado !== ESTADOS_SOLICITUD.PENDIENTE) {
                throw new Error(ERRORES_VACACIONES.SOLICITUD_YA_PROCESADA);
            }

            // Obtener tipo de bloqueo 'vacaciones'
            const tipoBloqueoQuery = await db.query(
                `SELECT id FROM tipos_bloqueo WHERE codigo = 'vacaciones' OR nombre ILIKE '%vacacion%' LIMIT 1`
            );

            let tipoBloqueoId = tipoBloqueoQuery.rows[0]?.id;

            // Si no existe, crear el tipo de bloqueo
            if (!tipoBloqueoId) {
                const crearTipoQuery = await db.query(
                    `INSERT INTO tipos_bloqueo (organizacion_id, codigo, nombre, color, aplica_todo_dia)
                     VALUES ($1, 'vacaciones', 'Vacaciones', '#22c55e', true)
                     ON CONFLICT (organizacion_id, codigo) DO UPDATE SET nombre = EXCLUDED.nombre
                     RETURNING id`,
                    [organizacionId]
                );
                tipoBloqueoId = crearTipoQuery.rows[0].id;
            }

            // Crear bloqueo en bloqueos_horarios
            // Si es todo el día, hora_inicio y hora_fin quedan null
            const tituloBloqueo = `Vacaciones - ${solicitud.profesional_nombre}`;
            const esTodoElDia = !solicitud.es_medio_dia;
            const bloqueoQuery = await db.query(
                `INSERT INTO bloqueos_horarios (
                    organizacion_id, profesional_id, tipo_bloqueo_id,
                    titulo, descripcion,
                    fecha_inicio, fecha_fin,
                    hora_inicio, hora_fin,
                    auto_generado, origen_bloqueo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 'vacaciones')
                RETURNING id`,
                [
                    organizacionId,
                    solicitud.profesional_id,
                    tipoBloqueoId,
                    tituloBloqueo,
                    `Solicitud ${solicitud.codigo}. ${solicitud.motivo_solicitud || ''}`,
                    solicitud.fecha_inicio,
                    solicitud.fecha_fin,
                    esTodoElDia ? null : '08:00:00',
                    esTodoElDia ? null : '14:00:00',
                ]
            );

            const bloqueoId = bloqueoQuery.rows[0].id;

            // Actualizar solicitud
            const updateQuery = await db.query(
                `UPDATE solicitudes_vacaciones
                 SET estado = $1,
                     aprobador_id = $2,
                     fecha_decision = NOW(),
                     bloqueo_id = $3,
                     notas_internas = $4
                 WHERE id = $5
                 RETURNING *`,
                [ESTADOS_SOLICITUD.APROBADA, aprobadorId, bloqueoId, notasInternas, solicitudId]
            );

            // Actualizar saldo: mover de pendientes a usados
            const anio = new Date(solicitud.fecha_inicio).getFullYear();
            await SaldosVacacionesModel.actualizarDiasSolicitadosPendientes(
                organizacionId, solicitud.profesional_id, anio, -solicitud.dias_solicitados
            );
            await SaldosVacacionesModel.sumarDiasUsados(
                organizacionId, solicitud.profesional_id, anio, solicitud.dias_solicitados
            );

            // TODO: Notificar al empleado
            // await NotificacionesService.notificarEmpleado(solicitud, 'aprobada');

            return {
                ...updateQuery.rows[0],
                bloqueo_id: bloqueoId,
            };
        });
    }

    /**
     * Rechaza una solicitud
     * @param {number} organizacionId - ID de la organización
     * @param {number} solicitudId - ID de la solicitud
     * @param {number} aprobadorId - ID del usuario que rechaza
     * @param {string} motivoRechazo - Motivo del rechazo
     * @param {string} notasInternas - Notas internas opcionales
     * @returns {Promise<Object>} Solicitud rechazada
     */
    static async rechazar(organizacionId, solicitudId, aprobadorId, motivoRechazo, notasInternas = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Obtener solicitud
            const solicitud = await this.obtenerPorId(organizacionId, solicitudId);

            if (!solicitud) {
                throw new Error(ERRORES_VACACIONES.SOLICITUD_NO_ENCONTRADA);
            }

            if (solicitud.estado !== ESTADOS_SOLICITUD.PENDIENTE) {
                throw new Error(ERRORES_VACACIONES.SOLICITUD_YA_PROCESADA);
            }

            // Actualizar solicitud
            const updateQuery = await db.query(
                `UPDATE solicitudes_vacaciones
                 SET estado = $1,
                     aprobador_id = $2,
                     fecha_decision = NOW(),
                     motivo_rechazo = $3,
                     notas_internas = $4
                 WHERE id = $5
                 RETURNING *`,
                [ESTADOS_SOLICITUD.RECHAZADA, aprobadorId, motivoRechazo, notasInternas, solicitudId]
            );

            // Liberar días reservados
            const anio = new Date(solicitud.fecha_inicio).getFullYear();
            await SaldosVacacionesModel.actualizarDiasSolicitadosPendientes(
                organizacionId, solicitud.profesional_id, anio, -solicitud.dias_solicitados
            );

            // TODO: Notificar al empleado
            // await NotificacionesService.notificarEmpleado(solicitud, 'rechazada');

            return updateQuery.rows[0];
        });
    }

    /**
     * Cancela una solicitud (por el empleado o admin)
     * @param {number} organizacionId - ID de la organización
     * @param {number} solicitudId - ID de la solicitud
     * @param {number} usuarioId - ID del usuario que cancela
     * @param {string} motivo - Motivo de cancelación opcional
     * @returns {Promise<Object>} Solicitud cancelada
     */
    static async cancelar(organizacionId, solicitudId, usuarioId, motivo = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Obtener solicitud
            const solicitud = await this.obtenerPorId(organizacionId, solicitudId);

            if (!solicitud) {
                throw new Error(ERRORES_VACACIONES.SOLICITUD_NO_ENCONTRADA);
            }

            // Solo se pueden cancelar solicitudes pendientes o aprobadas
            if (![ESTADOS_SOLICITUD.PENDIENTE, ESTADOS_SOLICITUD.APROBADA].includes(solicitud.estado)) {
                throw new Error('Solo se pueden cancelar solicitudes pendientes o aprobadas');
            }

            const anio = new Date(solicitud.fecha_inicio).getFullYear();

            // Si estaba aprobada, eliminar el bloqueo y revertir días usados
            if (solicitud.estado === ESTADOS_SOLICITUD.APROBADA) {
                if (solicitud.bloqueo_id) {
                    await db.query(
                        `DELETE FROM bloqueos_horarios WHERE id = $1 AND organizacion_id = $2`,
                        [solicitud.bloqueo_id, organizacionId]
                    );
                }

                // Revertir días usados
                await db.query(
                    `UPDATE saldos_vacaciones
                     SET dias_usados = dias_usados - $1
                     WHERE organizacion_id = $2 AND profesional_id = $3 AND anio = $4`,
                    [solicitud.dias_solicitados, organizacionId, solicitud.profesional_id, anio]
                );
            } else {
                // Si estaba pendiente, liberar días reservados
                await SaldosVacacionesModel.actualizarDiasSolicitadosPendientes(
                    organizacionId, solicitud.profesional_id, anio, -solicitud.dias_solicitados
                );
            }

            // Actualizar solicitud
            const updateQuery = await db.query(
                `UPDATE solicitudes_vacaciones
                 SET estado = $1,
                     notas_internas = COALESCE(notas_internas, '') || $2,
                     bloqueo_id = NULL
                 WHERE id = $3
                 RETURNING *`,
                [
                    ESTADOS_SOLICITUD.CANCELADA,
                    motivo ? `\n[Cancelación] ${motivo}` : '\n[Cancelación por usuario]',
                    solicitudId
                ]
            );

            return updateQuery.rows[0];
        });
    }

    /**
     * Obtiene estadísticas de vacaciones para dashboard
     * @param {number} organizacionId - ID de la organización
     * @param {number} anio - Año (default: actual)
     * @param {number} departamentoId - Opcional: filtrar por departamento
     * @returns {Promise<Object>} Estadísticas
     */
    static async obtenerEstadisticas(organizacionId, anio = null, departamentoId = null) {
        const anioConsulta = anio || new Date().getFullYear();

        return await RLSContextManager.query(organizacionId, async (db) => {
            let departamentoClause = '';
            const values = [organizacionId, anioConsulta];
            let contador = 3;

            if (departamentoId) {
                departamentoClause = ` AND p.departamento_id = $${contador}`;
                values.push(departamentoId);
            }

            // Solicitudes por estado
            const solicitudesQuery = await db.query(
                `SELECT estado, COUNT(*) as cantidad
                 FROM solicitudes_vacaciones sv
                 JOIN profesionales p ON p.id = sv.profesional_id
                 WHERE sv.organizacion_id = $1
                   AND EXTRACT(YEAR FROM sv.fecha_inicio) = $2
                   ${departamentoClause}
                 GROUP BY estado`,
                values
            );

            // Total días usados
            const diasUsadosQuery = await db.query(
                `SELECT SUM(dias_usados) as total_dias_usados,
                        SUM(dias_pendientes) as total_dias_pendientes,
                        COUNT(*) as total_empleados
                 FROM saldos_vacaciones sv
                 JOIN profesionales p ON p.id = sv.profesional_id
                 WHERE sv.organizacion_id = $1
                   AND sv.anio = $2
                   ${departamentoClause}`,
                values
            );

            // Empleados con solicitudes activas (próximas vacaciones)
            const proximasQuery = await db.query(
                `SELECT
                    sv.id, sv.codigo, sv.fecha_inicio, sv.fecha_fin, sv.dias_solicitados,
                    p.nombre_completo as profesional_nombre
                 FROM solicitudes_vacaciones sv
                 JOIN profesionales p ON p.id = sv.profesional_id
                 WHERE sv.organizacion_id = $1
                   AND sv.estado = 'aprobada'
                   AND sv.fecha_inicio >= CURRENT_DATE
                   ${departamentoClause}
                 ORDER BY sv.fecha_inicio ASC
                 LIMIT 10`,
                values
            );

            const solicitudesPorEstado = {};
            for (const row of solicitudesQuery.rows) {
                solicitudesPorEstado[row.estado] = parseInt(row.cantidad);
            }

            return {
                anio: anioConsulta,
                solicitudes: {
                    pendientes: solicitudesPorEstado.pendiente || 0,
                    aprobadas: solicitudesPorEstado.aprobada || 0,
                    rechazadas: solicitudesPorEstado.rechazada || 0,
                    canceladas: solicitudesPorEstado.cancelada || 0,
                    total: Object.values(solicitudesPorEstado).reduce((a, b) => a + b, 0),
                },
                saldos: {
                    total_dias_usados: parseFloat(diasUsadosQuery.rows[0]?.total_dias_usados) || 0,
                    total_dias_pendientes: parseFloat(diasUsadosQuery.rows[0]?.total_dias_pendientes) || 0,
                    total_empleados: parseInt(diasUsadosQuery.rows[0]?.total_empleados) || 0,
                },
                proximas_vacaciones: proximasQuery.rows,
            };
        });
    }
}

module.exports = SolicitudesVacacionesModel;
