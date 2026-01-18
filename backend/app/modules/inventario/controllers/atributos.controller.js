/**
 * Controller de Atributos de Producto
 * Migrado a BaseCrudController - Ene 2026
 *
 * CRUD de atributos (Color, Talla) y sus valores
 */

const { createCrudController } = require('../../../utils/BaseCrudController');
const { asyncHandler } = require('../../../middleware');
const { ResponseHelper } = require('../../../utils/helpers');
const AtributosModel = require('../models/atributos.model');

// Controller base con CRUD estándar para atributos
const baseController = createCrudController({
    Model: AtributosModel,
    resourceName: 'Atributo',
    resourceNamePlural: 'atributos',
    filterSchema: {
        incluir_inactivos: 'boolean'
    },
    allowedOrderFields: ['orden', 'nombre', 'creado_en']
});

// Extender con métodos adicionales para valores
module.exports = {
    ...baseController,

    // =========================================================================
    // VALORES DE ATRIBUTO
    // =========================================================================

    /**
     * Agregar valor a un atributo
     * POST /api/v1/inventario/atributos/:id/valores
     */
    agregarValor: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const valor = await AtributosModel.agregarValor(organizacionId, parseInt(id), req.body);

        return ResponseHelper.success(
            res,
            valor,
            'Valor agregado exitosamente',
            201
        );
    }),

    /**
     * Obtener valores de un atributo
     * GET /api/v1/inventario/atributos/:id/valores
     */
    obtenerValores: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const incluirInactivos = req.query.incluir_inactivos === 'true';

        const valores = await AtributosModel.obtenerValores(organizacionId, parseInt(id), incluirInactivos);

        return ResponseHelper.success(res, valores, 'Valores obtenidos exitosamente');
    }),

    /**
     * Actualizar valor de atributo
     * PUT /api/v1/inventario/valores/:valorId
     */
    actualizarValor: asyncHandler(async (req, res) => {
        const { valorId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const valor = await AtributosModel.actualizarValor(organizacionId, parseInt(valorId), req.body);

        if (!valor) {
            return ResponseHelper.notFound(res, 'Valor no encontrado');
        }

        return ResponseHelper.success(res, valor, 'Valor actualizado exitosamente');
    }),

    /**
     * Eliminar valor de atributo
     * DELETE /api/v1/inventario/valores/:valorId
     *
     * Errores manejados por asyncHandler:
     * - ResourceInUseError → 409 (tiene variantes asociadas)
     */
    eliminarValor: asyncHandler(async (req, res) => {
        const { valorId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const valor = await AtributosModel.eliminarValor(organizacionId, parseInt(valorId));

        if (!valor) {
            return ResponseHelper.notFound(res, 'Valor no encontrado');
        }

        return ResponseHelper.success(res, valor, 'Valor eliminado exitosamente');
    }),

    // =========================================================================
    // ATRIBUTOS POR DEFECTO
    // =========================================================================

    /**
     * Crear atributos por defecto
     * POST /api/v1/inventario/atributos/defecto
     */
    crearDefecto: asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const atributos = await AtributosModel.crearAtributosDefecto(organizacionId);

        return ResponseHelper.success(
            res,
            atributos,
            'Atributos por defecto creados exitosamente',
            201
        );
    })
};
