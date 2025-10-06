const { HorarioModel } = require('../database');
const { ResponseHelper } = require('../utils/helpers');
const HorarioHelpers = require('../utils/horarioHelpers');
const { asyncHandler } = require('../middleware');

class HorarioController {

    static obtenerDisponibilidad = asyncHandler(async (req, res) => {
        const filtros = {
            organizacion_id: req.query.organizacion_id,
            profesional_id: req.query.profesional_id || null,
            servicio_id: req.query.servicio_id || null,
            fecha_inicio: req.query.fecha_inicio || null,
            fecha_fin: req.query.fecha_fin || null,
            dias_semana: req.query.dias_semana ? req.query.dias_semana.split(',') : null,
            hora_inicio: req.query.hora_inicio || null,
            hora_fin: req.query.hora_fin || null,
            duracion_servicio: req.query.duracion_servicio || 30,
            limite: req.query.limite || 50
        };

        const horarios = await HorarioModel.consultarDisponibilidad(filtros);
        return ResponseHelper.success(res, horarios);
    });

    static obtenerDisponibilidadInteligente = asyncHandler(async (req, res) => {
        const { fecha_inicio, fecha_fin } = HorarioHelpers.procesarFechaTexto(req.query.fecha_texto);

        let servicio_id = null;
        if (req.query.servicio && !isNaN(parseInt(req.query.servicio))) {
            servicio_id = parseInt(req.query.servicio);
        }

        const filtros = {
            organizacion_id: req.query.organizacion_id,
            servicio_id: servicio_id || null,
            fecha_inicio,
            fecha_fin,
            turno_preferido: req.query.turno || null,
            duracion_servicio: 30,
            limite: 20
        };

        const horarios = await HorarioModel.consultarDisponibilidad(filtros);
        const respuestaIA = HorarioHelpers.formatearParaIA(horarios);

        return ResponseHelper.success(res, respuestaIA);
    });

    static reservarTemporalmente = asyncHandler(async (req, res) => {
        const resultado = await HorarioModel.reservarTemporalmente(
            req.body.horario_id,
            req.body.organizacion_id,
            req.body.duracion_minutos || 15,
            req.body.motivo_reserva || 'Reserva IA'
        );

        return ResponseHelper.success(res, resultado);
    });

    static crear = asyncHandler(async (req, res) => {
        const datosHorario = {
            organizacion_id: req.tenant.organizacionId,
            ...req.body
        };

        const auditoria = {
            usuario_id: req.user.id,
            ip_origen: req.ip,
            user_agent: req.get('User-Agent')
        };

        const horarioCreado = await HorarioModel.crear(datosHorario, auditoria);
        return ResponseHelper.success(res, horarioCreado, 'Horario creado exitosamente', 201);
    });

    static obtener = asyncHandler(async (req, res) => {
        const filtros = {
            organizacion_id: req.tenant.organizacionId,
            id: req.params.id || req.query.id || null,
            profesional_id: req.query.profesional_id || null,
            fecha: req.query.fecha || null,
            estado: req.query.estado || null,
            limite: req.query.limite || 50,
            offset: req.query.offset || 0
        };

        const resultado = await HorarioModel.obtener(filtros);
        return ResponseHelper.success(res, resultado);
    });

    static actualizar = asyncHandler(async (req, res) => {
        const auditoria = {
            usuario_id: req.user.id,
            ip_origen: req.ip,
            user_agent: req.get('User-Agent')
        };

        const horarioActualizado = await HorarioModel.actualizar(
            req.params.id,
            req.tenant.organizacionId,
            req.body,
            auditoria
        );

        return ResponseHelper.success(res, horarioActualizado);
    });

    static eliminar = asyncHandler(async (req, res) => {
        const auditoria = {
            usuario_id: req.user.id,
            ip_origen: req.ip,
            user_agent: req.get('User-Agent')
        };

        const resultado = await HorarioModel.eliminar(req.params.id, req.tenant.organizacionId, auditoria);
        return ResponseHelper.success(res, resultado);
    });

    static liberarReservaTemporal = asyncHandler(async (req, res) => {
        const organizacion_id = req.tenant?.organizacionId || req.body.organizacion_id;

        const resultado = await HorarioModel.liberarReservaTemporalHorario(
            req.body.horario_id,
            organizacion_id
        );

        if (!resultado) {
            throw new Error('No se pudo liberar la reserva');
        }

        return ResponseHelper.success(res, {
            success: true,
            mensaje: 'Reserva liberada exitosamente'
        });
    });

    static limpiarReservasExpiradas = asyncHandler(async (req, res) => {
        const organizacion_id = req.tenant?.organizacionId || req.body.organizacion_id;
        const cantidad = await HorarioModel.limpiarReservasExpiradas(organizacion_id);

        return ResponseHelper.success(res, {
            reservas_limpiadas: cantidad,
            mensaje: `Se limpiaron ${cantidad} reservas expiradas`
        });
    });
}

module.exports = HorarioController;