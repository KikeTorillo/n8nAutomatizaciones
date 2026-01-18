const VariantesModel = require('../models/variantes.model');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

/**
 * Controller para gestion de variantes de producto
 * CRUD de variantes con stock y precios independientes
 */
class VariantesController {

    /**
     * Listar variantes de un producto
     * GET /api/v1/inventario/productos/:productoId/variantes
     */
    static listar = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const variantes = await VariantesModel.listarPorProducto(
            parseInt(productoId),
            organizacionId
        );

        return ResponseHelper.success(res, variantes, 'Variantes obtenidas exitosamente');
    });

    /**
     * Crear variante individual
     * POST /api/v1/inventario/productos/:productoId/variantes
     */
    static crear = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const variante = await VariantesModel.crear(
            parseInt(productoId),
            req.body,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            variante,
            'Variante creada exitosamente',
            201
        );
    });

    /**
     * Generar variantes automaticamente
     * POST /api/v1/inventario/productos/:productoId/variantes/generar
     */
    static generar = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const { atributos, opciones = {} } = req.body;

        if (!atributos || !Array.isArray(atributos) || atributos.length === 0) {
            return ResponseHelper.error(res, 'Debe seleccionar al menos un atributo', 400);
        }

        const resultado = await VariantesModel.generarVariantes(
            parseInt(productoId),
            atributos,
            opciones,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            resultado,
            `Se generaron ${resultado.total} variantes exitosamente`,
            201
        );
    });

    /**
     * Buscar variante por SKU o codigo de barras
     * GET /api/v1/inventario/variantes/buscar
     */
    static buscar = asyncHandler(async (req, res) => {
        const { termino } = req.query;
        const organizacionId = req.tenant.organizacionId;

        if (!termino) {
            return ResponseHelper.error(res, 'Debe proporcionar un termino de busqueda', 400);
        }

        const variante = await VariantesModel.buscar(termino, organizacionId);

        if (!variante) {
            return ResponseHelper.error(res, 'Variante no encontrada', 404);
        }

        return ResponseHelper.success(res, variante, 'Variante encontrada');
    });

    /**
     * Obtener variante por ID
     * GET /api/v1/inventario/variantes/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const variante = await VariantesModel.buscarPorId(organizacionId, parseInt(id));

        if (!variante) {
            return ResponseHelper.error(res, 'Variante no encontrada', 404);
        }

        return ResponseHelper.success(res, variante, 'Variante obtenida exitosamente');
    });

    /**
     * Actualizar variante
     * PUT /api/v1/inventario/variantes/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const variante = await VariantesModel.actualizar(
            parseInt(id),
            req.body,
            organizacionId
        );

        if (!variante) {
            return ResponseHelper.error(res, 'Variante no encontrada', 404);
        }

        return ResponseHelper.success(res, variante, 'Variante actualizada exitosamente');
    });

    /**
     * Ajustar stock de variante
     * PATCH /api/v1/inventario/variantes/:id/stock
     */
    static ajustarStock = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { cantidad, tipo, motivo } = req.body;

        if (!cantidad || cantidad === 0) {
            return ResponseHelper.error(res, 'La cantidad debe ser diferente de 0', 400);
        }

        if (!tipo) {
            return ResponseHelper.error(res, 'Debe especificar el tipo de movimiento', 400);
        }

        try {
            const resultado = await VariantesModel.ajustarStock(
                parseInt(id),
                cantidad,
                tipo,
                motivo || null,
                usuarioId,
                organizacionId
            );

            return ResponseHelper.success(res, resultado, 'Stock ajustado exitosamente');
        } catch (error) {
            if (error.message === 'Stock insuficiente') {
                return ResponseHelper.error(res, error.message, 400);
            }
            if (error.message === 'Variante no encontrada') {
                return ResponseHelper.error(res, error.message, 404);
            }
            throw error;
        }
    });

    /**
     * Eliminar variante (soft delete)
     * DELETE /api/v1/inventario/variantes/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await VariantesModel.eliminar(organizacionId, parseInt(id));

        if (!resultado) {
            return ResponseHelper.error(res, 'Variante no encontrada', 404);
        }

        return ResponseHelper.success(res, resultado, 'Variante eliminada exitosamente');
    });

    /**
     * Obtener resumen de stock por variantes
     * GET /api/v1/inventario/productos/:productoId/variantes/resumen
     */
    static obtenerResumen = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const resumen = await VariantesModel.obtenerResumenStock(
            parseInt(productoId),
            organizacionId
        );

        return ResponseHelper.success(res, resumen, 'Resumen obtenido exitosamente');
    });
}

module.exports = VariantesController;
