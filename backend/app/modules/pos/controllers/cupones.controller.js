/**
 * ====================================================================
 * CONTROLLER - CUPONES DE DESCUENTO
 * ====================================================================
 *
 * Controller para gestión de cupones de descuento en POS
 * - CRUD completo
 * - Validación de cupones
 * - Aplicación y tracking de uso
 * - Estadísticas
 *
 * Ene 2026 - Fase 2 POS
 * ====================================================================
 */

const CuponesModel = require('../models/cupones.model');
const { ResponseHelper, ParseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');

class CuponesController {

    /**
     * Crear cupón
     * POST /api/v1/pos/cupones
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id;

        const cupon = await CuponesModel.crear(req.body, organizacionId, usuarioId);

        return ResponseHelper.success(res, cupon, 'Cupón creado exitosamente', 201);
    });

    /**
     * Obtener cupón por ID
     * GET /api/v1/pos/cupones/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const cupon = await CuponesModel.obtenerPorId(parseInt(id), organizacionId);

        if (!cupon) {
            return ResponseHelper.notFound(res, 'Cupón no encontrado');
        }

        return ResponseHelper.success(res, cupon, 'Cupón obtenido exitosamente');
    });

    /**
     * Listar cupones con paginación
     * GET /api/v1/pos/cupones
     */
    static listar = asyncHandler(async (req, res) => {
        const { pagination, filters, ordering } = ParseHelper.parseListParams(
            req.query,
            {
                busqueda: 'string',
                activo: 'boolean',
                vigente: 'boolean'
            },
            {
                allowedOrderFields: ['codigo', 'tipo_descuento', 'fecha_inicio', 'fecha_fin', 'creado_en'],
                defaultOrderField: 'creado_en'
            }
        );

        const options = {
            organizacionId: req.tenant.organizacionId,
            page: pagination.page,
            limit: pagination.limit,
            busqueda: filters.busqueda,
            activo: filters.activo,
            vigente: filters.vigente,
            ordenPor: ordering.orderBy,
            orden: ordering.orderDirection
        };

        const resultado = await CuponesModel.listar(options);

        return ResponseHelper.paginated(
            res,
            resultado.cupones,
            resultado.paginacion,
            'Cupones listados exitosamente'
        );
    });

    /**
     * Listar cupones vigentes (para selector en POS)
     * GET /api/v1/pos/cupones/vigentes
     */
    static listarVigentes = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const cupones = await CuponesModel.listarVigentes(organizacionId);

        return ResponseHelper.success(res, cupones, 'Cupones vigentes obtenidos');
    });

    /**
     * Actualizar cupón
     * PUT /api/v1/pos/cupones/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const cuponActualizado = await CuponesModel.actualizar(
            parseInt(id),
            req.body,
            organizacionId
        );

        if (!cuponActualizado) {
            return ResponseHelper.notFound(res, 'Cupón no encontrado');
        }

        return ResponseHelper.success(res, cuponActualizado, 'Cupón actualizado exitosamente');
    });

    /**
     * Eliminar cupón
     * DELETE /api/v1/pos/cupones/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        try {
            const eliminado = await CuponesModel.eliminar(parseInt(id), organizacionId);

            if (!eliminado) {
                return ResponseHelper.notFound(res, 'Cupón no encontrado');
            }

            return ResponseHelper.success(res, null, 'Cupón eliminado exitosamente');
        } catch (error) {
            if (error.message.includes('ya ha sido utilizado')) {
                return ResponseHelper.badRequest(res, error.message);
            }
            throw error;
        }
    });

    /**
     * Validar cupón (sin aplicar)
     * POST /api/v1/pos/cupones/validar
     */
    static validar = asyncHandler(async (req, res) => {
        const { codigo, subtotal, cliente_id, productos_ids } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await CuponesModel.validar({
            organizacionId,
            codigo,
            subtotal,
            clienteId: cliente_id,
            productosIds: productos_ids
        });

        if (!resultado.valido) {
            return ResponseHelper.badRequest(res, resultado.mensaje, { error: resultado.error });
        }

        return ResponseHelper.success(res, resultado, 'Cupón válido');
    });

    /**
     * Aplicar cupón a una venta
     * POST /api/v1/pos/cupones/aplicar
     */
    static aplicar = asyncHandler(async (req, res) => {
        const { cupon_id, venta_pos_id, cliente_id, subtotal_antes } = req.body;

        // Primero validar que el cupón sea aplicable
        const cupon = await CuponesModel.obtenerPorId(cupon_id, req.tenant.organizacionId);
        if (!cupon) {
            return ResponseHelper.notFound(res, 'Cupón no encontrado');
        }

        try {
            const uso = await CuponesModel.aplicar({
                cuponId: cupon_id,
                ventaPosId: venta_pos_id,
                clienteId: cliente_id,
                subtotalAntes: subtotal_antes
            });

            return ResponseHelper.success(res, uso, 'Cupón aplicado exitosamente');
        } catch (error) {
            return ResponseHelper.badRequest(res, error.message);
        }
    });

    /**
     * Obtener historial de uso de un cupón
     * GET /api/v1/pos/cupones/:id/historial
     */
    static obtenerHistorial = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { pagination } = ParseHelper.parseListParams(req.query, {}, { defaultLimit: 50 });
        const organizacionId = req.tenant.organizacionId;

        // Verificar que el cupón existe
        const cupon = await CuponesModel.obtenerPorId(parseInt(id), organizacionId);
        if (!cupon) {
            return ResponseHelper.notFound(res, 'Cupón no encontrado');
        }

        const historial = await CuponesModel.obtenerHistorialUso(
            parseInt(id),
            organizacionId,
            { limit: pagination.limit, offset: pagination.offset }
        );

        return ResponseHelper.success(res, historial, 'Historial de uso obtenido');
    });

    /**
     * Obtener estadísticas de un cupón
     * GET /api/v1/pos/cupones/:id/estadisticas
     */
    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const estadisticas = await CuponesModel.obtenerEstadisticas(
            parseInt(id),
            organizacionId
        );

        if (!estadisticas) {
            return ResponseHelper.notFound(res, 'Cupón no encontrado');
        }

        return ResponseHelper.success(res, estadisticas, 'Estadísticas obtenidas');
    });

    /**
     * Cambiar estado de cupón (activar/desactivar)
     * PATCH /api/v1/pos/cupones/:id/estado
     */
    static cambiarEstado = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { activo } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const cuponActualizado = await CuponesModel.actualizar(
            parseInt(id),
            { activo },
            organizacionId
        );

        if (!cuponActualizado) {
            return ResponseHelper.notFound(res, 'Cupón no encontrado');
        }

        return ResponseHelper.success(
            res,
            cuponActualizado,
            `Cupón ${activo ? 'activado' : 'desactivado'} exitosamente`
        );
    });
}

module.exports = CuponesController;
