const CitaModel = require('../../database/citas');
const { ResponseHelper } = require('../../utils/helpers');
const { asyncHandler } = require('../../middleware');

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
        const { notas_finalizacion, precio_final_real, metodo_pago } = req.body;
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

        const resultado = await CitaModel.complete(citaId, {
            notas_finalizacion,
            precio_final_real: precio_final_real || citaExistente.precio_final,
            metodo_pago,
            usuario_id: req.user.id,
            ip_origen: req.ip
        }, organizacionId);

        return ResponseHelper.success(res, resultado, 'Servicio completado exitosamente');
    });

    static reagendar = asyncHandler(async (req, res) => {
        const citaId = parseInt(req.params.id);
        const { nueva_fecha, nueva_hora_inicio, nueva_hora_fin, motivo_reagenda } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const citaExistente = await CitaModel.obtenerPorId(citaId, organizacionId);
        if (!citaExistente) {
            return ResponseHelper.error(res, 'Cita no encontrada', 404);
        }

        if (['completada', 'cancelada', 'no_asistio'].includes(citaExistente.estado)) {
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
            nombre_cliente,
            tiempo_espera_aceptado,
            notas_walk_in
        } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const cita = await CitaModel.crearWalkIn({
            cliente_id,
            profesional_id,
            servicio_id,
            nombre_cliente,
            tiempo_espera_aceptado,
            notas_walk_in,
            usuario_creador_id: req.user.id,
            ip_origen: req.ip
        }, organizacionId);

        return ResponseHelper.success(res, cita, 'Cita walk-in creada exitosamente', 201);
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
