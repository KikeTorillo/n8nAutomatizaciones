/**
 * ====================================================================
 * CONTROLLER DE ETIQUETAS CLIENTES
 * ====================================================================
 *
 * Fase 2 - Segmentación de Clientes (Ene 2026)
 * CRUD de etiquetas y asignación a clientes
 *
 * Refactorizado a BaseCrudController - Auditoría Backend v2.1
 * ====================================================================
 */

const { createCrudController } = require('../../../utils/BaseCrudController');
const EtiquetaClienteModel = require('../models/etiqueta.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');

// CRUD base via factory
const crudController = createCrudController({
    Model: EtiquetaClienteModel,
    resourceName: 'Etiqueta',
    filterSchema: { soloActivas: 'boolean' },
    allowedOrderFields: ['orden', 'nombre', 'creado_en']
});

// Métodos custom para asignación de etiquetas a clientes
module.exports = {
    // CRUD estándar
    ...crudController,

    // ====================================================================
    // ASIGNACIÓN A CLIENTES
    // ====================================================================

    /**
     * Obtener etiquetas de un cliente
     * GET /api/v1/clientes/:clienteId/etiquetas
     */
    obtenerEtiquetasCliente: asyncHandler(async (req, res) => {
        const etiquetas = await EtiquetaClienteModel.obtenerEtiquetasCliente(
            req.tenant.organizacionId,
            parseInt(req.params.clienteId)
        );

        return ResponseHelper.success(res, etiquetas, 'Etiquetas del cliente obtenidas exitosamente');
    }),

    /**
     * Asignar etiquetas a un cliente (reemplaza las existentes)
     * POST /api/v1/clientes/:clienteId/etiquetas
     */
    asignarEtiquetas: asyncHandler(async (req, res) => {
        const etiquetasAsignadas = await EtiquetaClienteModel.asignarEtiquetasCliente(
            req.tenant.organizacionId,
            parseInt(req.params.clienteId),
            req.body.etiqueta_ids
        );

        return ResponseHelper.success(res, etiquetasAsignadas, 'Etiquetas asignadas exitosamente');
    }),

    /**
     * Agregar una etiqueta a un cliente
     * POST /api/v1/clientes/:clienteId/etiquetas/:etiquetaId
     */
    agregarEtiqueta: asyncHandler(async (req, res) => {
        await EtiquetaClienteModel.agregarEtiquetaCliente(
            req.tenant.organizacionId,
            parseInt(req.params.clienteId),
            parseInt(req.params.etiquetaId)
        );

        return ResponseHelper.success(res, null, 'Etiqueta agregada al cliente exitosamente');
    }),

    /**
     * Quitar una etiqueta de un cliente
     * DELETE /api/v1/clientes/:clienteId/etiquetas/:etiquetaId
     */
    quitarEtiqueta: asyncHandler(async (req, res) => {
        await EtiquetaClienteModel.quitarEtiquetaCliente(
            req.tenant.organizacionId,
            parseInt(req.params.clienteId),
            parseInt(req.params.etiquetaId)
        );

        return ResponseHelper.success(res, null, 'Etiqueta removida del cliente exitosamente');
    })
};
