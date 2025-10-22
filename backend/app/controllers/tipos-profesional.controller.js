const TiposProfesionalModel = require('../database/tipos-profesional.model');
const { ResponseHelper } = require('../utils/helpers');
const { asyncHandler } = require('../middleware');

class TiposProfesionalController {

    /**
     * GET /api/v1/tipos-profesional
     * Listar tipos de profesional (sistema + personalizados)
     */
    static listar = asyncHandler(async (req, res) => {
        const filtros = {
            organizacion_id: req.tenant.organizacionId,
            solo_sistema: req.query.solo_sistema === 'true',
            solo_personalizados: req.query.solo_personalizados === 'true',
            tipo_industria: req.query.tipo_industria || null,
            activo: req.query.activo !== 'false'
        };

        const resultado = await TiposProfesionalModel.listar(filtros);
        return ResponseHelper.success(res, resultado);
    });

    /**
     * GET /api/v1/tipos-profesional/:id
     * Obtener un tipo por ID
     */
    static obtener = asyncHandler(async (req, res) => {
        const tipo = await TiposProfesionalModel.obtenerPorId(
            req.params.id,
            req.tenant.organizacionId
        );
        return ResponseHelper.success(res, tipo);
    });

    /**
     * POST /api/v1/tipos-profesional
     * Crear tipo personalizado (solo para la organización)
     */
    static crear = asyncHandler(async (req, res) => {
        const datosTipo = {
            organizacion_id: req.tenant.organizacionId,
            ...req.body
        };

        const tipoCreado = await TiposProfesionalModel.crear(datosTipo);
        return ResponseHelper.success(res, tipoCreado, 'Tipo de profesional creado exitosamente', 201);
    });

    /**
     * PUT /api/v1/tipos-profesional/:id
     * Actualizar tipo personalizado (NO permite modificar tipos de sistema)
     */
    static actualizar = asyncHandler(async (req, res) => {
        const tipoActualizado = await TiposProfesionalModel.actualizar(
            req.params.id,
            req.tenant.organizacionId,
            req.body
        );
        return ResponseHelper.success(res, tipoActualizado);
    });

    /**
     * DELETE /api/v1/tipos-profesional/:id
     * Eliminar tipo personalizado (NO permite eliminar tipos de sistema)
     */
    static eliminar = asyncHandler(async (req, res) => {
        await TiposProfesionalModel.eliminar(
            req.params.id,
            req.tenant.organizacionId
        );
        return ResponseHelper.success(res, null, 'Tipo de profesional eliminado exitosamente');
    });
}

module.exports = TiposProfesionalController;
