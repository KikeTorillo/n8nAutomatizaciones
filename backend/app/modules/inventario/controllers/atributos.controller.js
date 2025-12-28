const AtributosModel = require('../models/atributos.model');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

/**
 * Controller para gestion de atributos de producto
 * CRUD de atributos (Color, Talla) y sus valores
 */
class AtributosController {

    /**
     * Crear nuevo atributo
     * POST /api/v1/inventario/atributos
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const atributo = await AtributosModel.crear(req.body, organizacionId);

        return ResponseHelper.success(
            res,
            atributo,
            'Atributo creado exitosamente',
            201
        );
    });

    /**
     * Listar atributos
     * GET /api/v1/inventario/atributos
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const incluirInactivos = req.query.incluir_inactivos === 'true';

        const atributos = await AtributosModel.listar(organizacionId, incluirInactivos);

        return ResponseHelper.success(res, atributos, 'Atributos obtenidos exitosamente');
    });

    /**
     * Obtener atributo por ID con valores
     * GET /api/v1/inventario/atributos/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const atributo = await AtributosModel.obtenerPorId(parseInt(id), organizacionId);

        if (!atributo) {
            return ResponseHelper.error(res, 'Atributo no encontrado', 404);
        }

        return ResponseHelper.success(res, atributo, 'Atributo obtenido exitosamente');
    });

    /**
     * Actualizar atributo
     * PUT /api/v1/inventario/atributos/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const atributo = await AtributosModel.actualizar(parseInt(id), req.body, organizacionId);

        if (!atributo) {
            return ResponseHelper.error(res, 'Atributo no encontrado', 404);
        }

        return ResponseHelper.success(res, atributo, 'Atributo actualizado exitosamente');
    });

    /**
     * Eliminar atributo (soft delete)
     * DELETE /api/v1/inventario/atributos/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        try {
            const atributo = await AtributosModel.eliminar(parseInt(id), organizacionId);

            if (!atributo) {
                return ResponseHelper.error(res, 'Atributo no encontrado', 404);
            }

            return ResponseHelper.success(res, atributo, 'Atributo eliminado exitosamente');
        } catch (error) {
            if (error.message.includes('variantes asociadas')) {
                return ResponseHelper.error(res, error.message, 400);
            }
            throw error;
        }
    });

    /**
     * Agregar valor a un atributo
     * POST /api/v1/inventario/atributos/:id/valores
     */
    static agregarValor = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const valor = await AtributosModel.agregarValor(parseInt(id), req.body, organizacionId);

        return ResponseHelper.success(
            res,
            valor,
            'Valor agregado exitosamente',
            201
        );
    });

    /**
     * Obtener valores de un atributo
     * GET /api/v1/inventario/atributos/:id/valores
     */
    static obtenerValores = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const incluirInactivos = req.query.incluir_inactivos === 'true';

        const valores = await AtributosModel.obtenerValores(parseInt(id), organizacionId, incluirInactivos);

        return ResponseHelper.success(res, valores, 'Valores obtenidos exitosamente');
    });

    /**
     * Actualizar valor de atributo
     * PUT /api/v1/inventario/valores/:valorId
     */
    static actualizarValor = asyncHandler(async (req, res) => {
        const { valorId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const valor = await AtributosModel.actualizarValor(parseInt(valorId), req.body, organizacionId);

        if (!valor) {
            return ResponseHelper.error(res, 'Valor no encontrado', 404);
        }

        return ResponseHelper.success(res, valor, 'Valor actualizado exitosamente');
    });

    /**
     * Eliminar valor de atributo
     * DELETE /api/v1/inventario/valores/:valorId
     */
    static eliminarValor = asyncHandler(async (req, res) => {
        const { valorId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        try {
            const valor = await AtributosModel.eliminarValor(parseInt(valorId), organizacionId);

            if (!valor) {
                return ResponseHelper.error(res, 'Valor no encontrado', 404);
            }

            return ResponseHelper.success(res, valor, 'Valor eliminado exitosamente');
        } catch (error) {
            if (error.message.includes('variantes asociadas')) {
                return ResponseHelper.error(res, error.message, 400);
            }
            throw error;
        }
    });

    /**
     * Crear atributos por defecto
     * POST /api/v1/inventario/atributos/defecto
     */
    static crearDefecto = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const atributos = await AtributosModel.crearAtributosDefecto(organizacionId);

        return ResponseHelper.success(
            res,
            atributos,
            'Atributos por defecto creados exitosamente',
            201
        );
    });
}

module.exports = AtributosController;
