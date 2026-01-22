/**
 * ====================================================================
 * CONTROLLER: CUPONES DE DESCUENTO
 * ====================================================================
 * Gestión de cupones de descuento para suscripciones.
 *
 * @module controllers/cupones
 */

const asyncHandler = require('../../../middleware/asyncHandler');
const { CuponesModel } = require('../models');
const { ResponseHelper, ErrorHelper, ParseHelper } = require('../../../utils/helpers');

class CuponesController {

    /**
     * Listar cupones con paginación y filtros
     * GET /api/v1/suscripciones-negocio/cupones
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            activo: ParseHelper.parseBoolean(req.query.activo),
            tipo_descuento: req.query.tipo_descuento,
            busqueda: req.query.busqueda
        };

        const resultado = await CuponesModel.listar(options, organizacionId);

        return ResponseHelper.success(res, resultado);
    });

    /**
     * Listar solo cupones activos y vigentes
     * GET /api/v1/suscripciones-negocio/cupones/activos
     */
    static listarActivos = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const cupones = await CuponesModel.listarActivos(organizacionId);

        return ResponseHelper.success(res, cupones);
    });

    /**
     * Buscar cupón por ID
     * GET /api/v1/suscripciones-negocio/cupones/:id
     */
    static buscarPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const cupon = await CuponesModel.buscarPorId(id, organizacionId);
        ErrorHelper.throwIfNotFound(cupon, 'Cupón');

        return ResponseHelper.success(res, cupon);
    });

    /**
     * Buscar cupón por código
     * GET /api/v1/suscripciones-negocio/cupones/codigo/:codigo
     */
    static buscarPorCodigo = asyncHandler(async (req, res) => {
        const { codigo } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const cupon = await CuponesModel.buscarPorCodigo(codigo, organizacionId);

        if (!cupon) {
            return ResponseHelper.success(res, null);
        }

        return ResponseHelper.success(res, cupon);
    });

    /**
     * Validar cupón para uso
     * POST /api/v1/suscripciones-negocio/cupones/validar
     */
    static validar = asyncHandler(async (req, res) => {
        const { codigo, plan_id } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const validacion = await CuponesModel.validar(codigo, organizacionId, { plan_id });

        return ResponseHelper.success(res, validacion);
    });

    /**
     * Crear nuevo cupón
     * POST /api/v1/suscripciones-negocio/cupones
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const creadoPorId = req.user.id;

        const cuponData = req.body;

        const nuevoCupon = await CuponesModel.crear(cuponData, organizacionId, creadoPorId);

        return ResponseHelper.success(res, nuevoCupon, 'Cupón creado exitosamente', 201);
    });

    /**
     * Actualizar cupón existente
     * PUT /api/v1/suscripciones-negocio/cupones/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const cuponData = req.body;

        const cuponActualizado = await CuponesModel.actualizar(id, cuponData, organizacionId);

        return ResponseHelper.success(res, cuponActualizado, 'Cupón actualizado exitosamente');
    });

    /**
     * Eliminar cupón (solo si no tiene usos)
     * DELETE /api/v1/suscripciones-negocio/cupones/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        await CuponesModel.eliminar(id, organizacionId);

        return ResponseHelper.success(res, null, 'Cupón eliminado exitosamente');
    });

    /**
     * Desactivar cupón
     * PATCH /api/v1/suscripciones-negocio/cupones/:id/desactivar
     */
    static desactivar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const cuponDesactivado = await CuponesModel.desactivar(id, organizacionId);

        return ResponseHelper.success(res, cuponDesactivado, 'Cupón desactivado');
    });
}

module.exports = CuponesController;
