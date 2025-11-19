const BloqueosHorariosModel = require('../../../database/bloqueos-horarios.model');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

class BloqueosHorariosController {

    static crear = asyncHandler(async (req, res) => {
        const datosBloqueo = {
            organizacion_id: req.tenant.organizacionId,
            ...req.body
        };

        const auditoria = {
            usuario_id: req.user.id,
            ip_origen: req.ip,
            user_agent: req.get('User-Agent')
        };

        const bloqueoCreado = await BloqueosHorariosModel.crear(datosBloqueo, auditoria);
        return ResponseHelper.success(res, bloqueoCreado, 'Bloqueo creado exitosamente', 201);
    });

    static obtener = asyncHandler(async (req, res) => {
        const filtros = {
            organizacion_id: req.tenant.organizacionId,
            id: req.params.id || req.query.id || null,
            profesional_id: req.query.profesional_id || null,
            tipo_bloqueo_id: req.query.tipo_bloqueo_id || null,
            fecha_inicio: req.query.fecha_inicio || null,
            fecha_fin: req.query.fecha_fin || null,
            solo_organizacionales: req.query.solo_organizacionales === 'true',
            limite: req.query.limite || 50,
            offset: req.query.offset || 0
        };

        const resultado = await BloqueosHorariosModel.obtener(filtros);
        return ResponseHelper.success(res, resultado);
    });

    static actualizar = asyncHandler(async (req, res) => {
        const auditoria = {
            usuario_id: req.user.id,
            ip_origen: req.ip,
            user_agent: req.get('User-Agent')
        };

        const bloqueoActualizado = await BloqueosHorariosModel.actualizar(
            req.params.id,
            req.tenant.organizacionId,
            req.body,
            auditoria
        );

        return ResponseHelper.success(res, bloqueoActualizado);
    });

    static eliminar = asyncHandler(async (req, res) => {
        const auditoria = {
            usuario_id: req.user.id,
            ip_origen: req.ip,
            user_agent: req.get('User-Agent')
        };

        const resultado = await BloqueosHorariosModel.eliminar(
            req.params.id,
            req.tenant.organizacionId,
            auditoria
        );

        return ResponseHelper.success(res, resultado);
    });
}

module.exports = BloqueosHorariosController;
