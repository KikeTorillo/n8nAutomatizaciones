const CitaModel = require('../../models/citas');
const { ResponseHelper } = require('../../../../utils/helpers');
const { asyncHandler } = require('../../../../middleware');

class CitaOperacionalController {

    static checkIn = asyncHandler(async (req, res) => {
        const citaId = parseInt(req.params.id);
        const { notas_llegada } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const citaExistente = await CitaModel.obtenerPorId(citaId, organizacionId);
        if (!citaExistente) {
            return ResponseHelper.error(res, 'Cita no encontrada', 404);
        }

        if (!['pendiente', 'confirmada'].includes(citaExistente.estado)) {
            return ResponseHelper.error(res,
                `No se puede hacer check-in. Estado actual: ${citaExistente.estado}`,
                400
            );
        }

        const resultado = await CitaModel.checkIn(citaId, {
            notas_llegada,
            usuario_id: req.user.id,
            ip_origen: req.ip
        }, organizacionId);

        return ResponseHelper.success(res, resultado, 'Check-in registrado exitosamente');
    });

    static startService = asyncHandler(async (req, res) => {
        const citaId = parseInt(req.params.id);
        const { notas_inicio } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const citaExistente = await CitaModel.obtenerPorId(citaId, organizacionId);
        if (!citaExistente) {
            return ResponseHelper.error(res, 'Cita no encontrada', 404);
        }

        if (!['confirmada', 'en_curso'].includes(citaExistente.estado)) {
            return ResponseHelper.error(res,
                `No se puede iniciar servicio. Estado actual: ${citaExistente.estado}`,
                400
            );
        }

        if (req.user.rol === 'empleado' && citaExistente.profesional_id !== req.user.profesional_id) {
            return ResponseHelper.error(res, 'No autorizado para esta cita', 403);
        }

        const resultado = await CitaModel.startService(citaId, {
            notas_inicio,
            usuario_id: req.user.id,
            ip_origen: req.ip
        }, organizacionId);

        return ResponseHelper.success(res, resultado, 'Servicio iniciado exitosamente');
    });

    static complete = asyncHandler(async (req, res) => {
        const citaId = parseInt(req.params.id);
        const {
            notas_profesional,
            calificacion_profesional,
            comentario_profesional,
            precio_total_real,      // ✅ Nuevo campo
            precio_final_real,      // ⚠️ Deprecated - backward compatibility
            metodo_pago,
            pagado
        } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const citaExistente = await CitaModel.obtenerPorId(citaId, organizacionId);
        if (!citaExistente) {
            return ResponseHelper.error(res, 'Cita no encontrada', 404);
        }

        if (citaExistente.estado !== 'en_curso') {
            return ResponseHelper.error(res,
                `No se puede completar servicio. Estado actual: ${citaExistente.estado}`,
                400
            );
        }

        if (req.user.rol === 'empleado' && citaExistente.profesional_id !== req.user.profesional_id) {
            return ResponseHelper.error(res, 'No autorizado para esta cita', 403);
        }

        // ✅ Soportar ambos campos (nuevo y deprecated) con fallback a precio_total de la cita
        const precioFinalReal = precio_total_real || precio_final_real || citaExistente.precio_total;

        const resultado = await CitaModel.complete(citaId, {
            notas_profesional,
            calificacion_profesional,
            comentario_profesional,
            precio_final_real: precioFinalReal,
            metodo_pago,
            pagado,
            usuario_id: req.user.id,
            ip_origen: req.ip
        }, organizacionId);

        return ResponseHelper.success(res, resultado, 'Servicio completado exitosamente');
    });

    static noShow = asyncHandler(async (req, res) => {
        const citaId = parseInt(req.params.id);
        const { motivo_no_show, notas_adicionales } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const citaExistente = await CitaModel.obtenerPorId(citaId, organizacionId);
        if (!citaExistente) {
            return ResponseHelper.error(res, 'Cita no encontrada', 404);
        }

        // Solo se puede marcar no-show en estados: confirmada, pendiente
        if (!['confirmada', 'pendiente'].includes(citaExistente.estado)) {
            return ResponseHelper.error(res,
                `No se puede marcar no-show. Estado actual: ${citaExistente.estado}`,
                400
            );
        }

        const resultado = await CitaModel.noShow(citaId, {
            motivo_no_show,
            notas_adicionales,
            usuario_id: req.user.id,
            ip_origen: req.ip
        }, organizacionId);

        return ResponseHelper.success(res, resultado, 'Cita marcada como no-show exitosamente');
    });

    static cancelar = asyncHandler(async (req, res) => {
        const citaId = parseInt(req.params.id);
        const { motivo_cancelacion, cancelado_por, notas_adicionales } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const citaExistente = await CitaModel.obtenerPorId(citaId, organizacionId);
        if (!citaExistente) {
            return ResponseHelper.error(res, 'Cita no encontrada', 404);
        }

        // Solo se puede cancelar en estados: pendiente, confirmada
        if (!['pendiente', 'confirmada'].includes(citaExistente.estado)) {
            return ResponseHelper.error(res,
                `No se puede cancelar. Estado actual: ${citaExistente.estado}`,
                400
            );
        }

        const resultado = await CitaModel.cancelar(citaId, {
            motivo_cancelacion,
            cancelado_por: cancelado_por || 'admin',
            notas_adicionales,
            usuario_id: req.user.id,
            ip_origen: req.ip
        }, organizacionId);

        return ResponseHelper.success(res, resultado, 'Cita cancelada exitosamente');
    });

    static reagendar = asyncHandler(async (req, res) => {
        const citaId = parseInt(req.params.id);
        const { nueva_fecha, nueva_hora_inicio, nueva_hora_fin, motivo_reagenda } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const citaExistente = await CitaModel.obtenerPorId(citaId, organizacionId);
        if (!citaExistente) {
            return ResponseHelper.error(res, 'Cita no encontrada', 404);
        }

        if (['completada', 'cancelada', 'no_asistio', 'en_curso'].includes(citaExistente.estado)) {
            return ResponseHelper.error(res,
                `No se puede reagendar. Estado actual: ${citaExistente.estado}`,
                400
            );
        }

        if (req.user.rol === 'cliente' && citaExistente.cliente_id !== req.user.cliente_id) {
            return ResponseHelper.error(res, 'No autorizado para reagendar esta cita', 403);
        }

        const resultado = await CitaModel.reagendar(citaId, {
            nueva_fecha,
            nueva_hora_inicio,
            nueva_hora_fin,
            motivo_reagenda,
            usuario_id: req.user.id,
            ip_origen: req.ip
        }, organizacionId);

        return ResponseHelper.success(res, resultado, 'Cita reagendada exitosamente');
    });

    static dashboardToday = asyncHandler(async (req, res) => {
        const { profesional_id } = req.query;
        const organizacionId = req.tenant.organizacionId;

        const dashboard = await CitaModel.obtenerDashboardToday(organizacionId, profesional_id);

        return ResponseHelper.success(res, dashboard, 'Dashboard obtenido exitosamente');
    });

    static colaEspera = asyncHandler(async (req, res) => {
        const { profesional_id } = req.query;
        const organizacionId = req.tenant.organizacionId;

        const cola = await CitaModel.obtenerColaEspera(organizacionId, profesional_id);

        return ResponseHelper.success(res, cola, 'Cola de espera obtenida exitosamente');
    });

    static metricasTiempoReal = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const metricas = await CitaModel.obtenerMetricasTiempoReal(organizacionId);

        return ResponseHelper.success(res, metricas, 'Métricas obtenidas exitosamente');
    });

    static crearWalkIn = asyncHandler(async (req, res) => {
        const {
            cliente_id,
            profesional_id,
            servicio_id,
            servicios_ids, // ✅ NUEVO: Múltiples servicios
            nombre_cliente,
            telefono,
            tiempo_espera_aceptado,
            notas_walk_in
        } = req.body;
        const organizacionId = req.tenant.organizacionId;

        try {
            // Obtener zona horaria de la organización desde la BD
            const { getDb } = require('../../../../config/database');
            const db = await getDb();
            let zonaHoraria = 'America/Mexico_City'; // Default

            try {
                const orgResult = await db.query(
                    'SELECT zona_horaria FROM organizaciones WHERE id = $1',
                    [organizacionId]
                );
                if (orgResult.rows.length > 0 && orgResult.rows[0].zona_horaria) {
                    zonaHoraria = orgResult.rows[0].zona_horaria;
                }
            } finally {
                db.release();
            }

            const cita = await CitaModel.crearWalkIn({
                cliente_id,
                profesional_id,
                servicio_id,
                servicios_ids, // ✅ NUEVO: Múltiples servicios
                nombre_cliente,
                telefono,
                tiempo_espera_aceptado,
                notas_walk_in,
                usuario_creador_id: req.user.id,
                ip_origen: req.ip,
                zona_horaria: zonaHoraria  // Pasar zona horaria al modelo
            }, organizacionId);

            return ResponseHelper.success(res, cita, 'Cita walk-in creada exitosamente', 201);
        } catch (error) {
            // Errores de negocio que deben retornar 400 (Bad Request)
            const erroresNegocio = [
                'No hay profesionales disponibles',
                'Servicio no encontrado',
                'No se pudo resolver cliente_id',
                'Profesional ocupado con cita'
            ];

            // Si es un error de negocio, retornar 400
            if (erroresNegocio.some(msg => error.message.includes(msg))) {
                return ResponseHelper.error(res, error.message, 400);
            }

            // Si no es un error de negocio conocido, propagar el error (será 500)
            throw error;
        }
    });

    static disponibilidadInmediata = asyncHandler(async (req, res) => {
        const { servicio_id, profesional_id } = req.query;
        const organizacionId = req.tenant.organizacionId;

        const disponibilidad = await CitaModel.consultarDisponibilidadInmediata(
            parseInt(servicio_id),
            profesional_id ? parseInt(profesional_id) : null,
            organizacionId
        );

        return ResponseHelper.success(res, disponibilidad, 'Disponibilidad consultada exitosamente');
    });
}

module.exports = CitaOperacionalController;
