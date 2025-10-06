const CitaModel = require('../../database/citas');
const { ResponseHelper } = require('../../utils/helpers');
const { asyncHandler } = require('../../middleware');

class CitaBaseController {

    static crear = asyncHandler(async (req, res) => {
        const citaData = {
            ...req.body,
            organizacion_id: req.tenant.organizacionId
        };

        const nuevaCita = await CitaModel.crearEstandar(citaData, req.user.id);

        return ResponseHelper.success(res, nuevaCita, 'Cita creada exitosamente', 201);
    });

    static obtener = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const cita = await CitaModel.obtenerPorId(parseInt(id), organizacionId);

        if (!cita) {
            return ResponseHelper.error(res, 'Cita no encontrada', 404);
        }

        return ResponseHelper.success(res, cita, 'Cita obtenida exitosamente');
    });

    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const citaData = req.body;

        const citaActualizada = await CitaModel.actualizarEstandar(parseInt(id), citaData, organizacionId, req.user.id);

        if (!citaActualizada) {
            return ResponseHelper.error(res, 'Cita no encontrada', 404);
        }

        return ResponseHelper.success(res, citaActualizada, 'Cita actualizada exitosamente');
    });

    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const eliminada = await CitaModel.eliminarEstandar(parseInt(id), organizacionId, req.user.id);

        if (!eliminada) {
            return ResponseHelper.error(res, 'Cita no encontrada', 404);
        }

        return ResponseHelper.success(res, null, 'Cita cancelada exitosamente');
    });

    static confirmarAsistencia = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await CitaModel.confirmarAsistenciaEstandar(parseInt(id), organizacionId, req.user.id);

        if (!resultado.exito) {
            return ResponseHelper.error(res, resultado.mensaje || 'No se pudo confirmar asistencia', 400);
        }

        return ResponseHelper.success(res, resultado, 'Asistencia confirmada exitosamente');
    });

    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const orden = req.query.orden || 'fecha_cita';
        const direccion = req.query.direccion || 'DESC';

        const filtros = {
            organizacion_id: organizacionId,
            estado: req.query.estado,
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta,
            cliente_id: req.query.cliente_id ? parseInt(req.query.cliente_id) : null,
            profesional_id: req.query.profesional_id ? parseInt(req.query.profesional_id) : null,
            servicio_id: req.query.servicio_id ? parseInt(req.query.servicio_id) : null,
            busqueda: req.query.busqueda,
            limite: limit,
            offset,
            orden,
            direccion
        };

        const resultado = await CitaModel.listarConFiltros(filtros);

        return ResponseHelper.success(res, {
            citas: resultado.citas,
            meta: {
                total: resultado.total,
                page: page,
                limit: limit,
                total_pages: Math.ceil(resultado.total / limit),
                has_next: page * limit < resultado.total,
                has_prev: page > 1
            }
        }, 'Citas obtenidas exitosamente');
    });
}

module.exports = CitaBaseController;
