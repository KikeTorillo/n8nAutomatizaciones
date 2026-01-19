/**
 * ====================================================================
 * CONTROLLER DE ETIQUETAS CLIENTES
 * ====================================================================
 *
 * Fase 2 - Segmentación de Clientes (Ene 2026)
 * CRUD de etiquetas y asignación a clientes
 *
 * ====================================================================
 */

const EtiquetaClienteModel = require('../models/etiqueta.model');
const { ResponseHelper, ParseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');

class EtiquetaClienteController {

    // ====================================================================
    // CRUD ETIQUETAS
    // ====================================================================

    /**
     * Crear nueva etiqueta
     * POST /api/v1/clientes/etiquetas
     */
    static crear = asyncHandler(async (req, res) => {
        const etiquetaData = {
            ...req.body,
            organizacion_id: req.tenant.organizacionId
        };

        const nuevaEtiqueta = await EtiquetaClienteModel.crear(etiquetaData);

        return ResponseHelper.success(res, nuevaEtiqueta, 'Etiqueta creada exitosamente', 201);
    });

    /**
     * Listar etiquetas de la organización
     * GET /api/v1/clientes/etiquetas
     */
    static listar = asyncHandler(async (req, res) => {
        const soloActivas = ParseHelper.parseBoolean(req.query.soloActivas, true);

        const opciones = { soloActivas };

        const etiquetas = await EtiquetaClienteModel.listar(req.tenant.organizacionId, opciones);

        return ResponseHelper.success(res, etiquetas, 'Etiquetas listadas exitosamente');
    });

    /**
     * Obtener etiqueta por ID
     * GET /api/v1/clientes/etiquetas/:etiquetaId
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { etiquetaId } = req.params;

        const etiqueta = await EtiquetaClienteModel.obtenerPorId(
            req.tenant.organizacionId,
            parseInt(etiquetaId)
        );

        if (!etiqueta) {
            return ResponseHelper.notFound(res, 'Etiqueta no encontrada');
        }

        return ResponseHelper.success(res, etiqueta, 'Etiqueta obtenida exitosamente');
    });

    /**
     * Actualizar etiqueta
     * PUT /api/v1/clientes/etiquetas/:etiquetaId
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { etiquetaId } = req.params;
        const etiquetaData = req.body;

        const etiquetaActualizada = await EtiquetaClienteModel.actualizar(
            req.tenant.organizacionId,
            parseInt(etiquetaId),
            etiquetaData
        );

        return ResponseHelper.success(res, etiquetaActualizada, 'Etiqueta actualizada exitosamente');
    });

    /**
     * Eliminar etiqueta
     * DELETE /api/v1/clientes/etiquetas/:etiquetaId
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { etiquetaId } = req.params;

        await EtiquetaClienteModel.eliminar(req.tenant.organizacionId, parseInt(etiquetaId));

        return ResponseHelper.success(res, null, 'Etiqueta eliminada exitosamente');
    });

    // ====================================================================
    // ASIGNACIÓN A CLIENTES
    // ====================================================================

    /**
     * Obtener etiquetas de un cliente
     * GET /api/v1/clientes/:clienteId/etiquetas
     */
    static obtenerEtiquetasCliente = asyncHandler(async (req, res) => {
        const { clienteId } = req.params;

        const etiquetas = await EtiquetaClienteModel.obtenerEtiquetasCliente(
            req.tenant.organizacionId,
            parseInt(clienteId)
        );

        return ResponseHelper.success(res, etiquetas, 'Etiquetas del cliente obtenidas exitosamente');
    });

    /**
     * Asignar etiquetas a un cliente (reemplaza las existentes)
     * POST /api/v1/clientes/:clienteId/etiquetas
     */
    static asignarEtiquetas = asyncHandler(async (req, res) => {
        const { clienteId } = req.params;
        const { etiqueta_ids } = req.body;

        const etiquetasAsignadas = await EtiquetaClienteModel.asignarEtiquetasCliente(
            req.tenant.organizacionId,
            parseInt(clienteId),
            etiqueta_ids
        );

        return ResponseHelper.success(res, etiquetasAsignadas, 'Etiquetas asignadas exitosamente');
    });

    /**
     * Agregar una etiqueta a un cliente
     * POST /api/v1/clientes/:clienteId/etiquetas/:etiquetaId
     */
    static agregarEtiqueta = asyncHandler(async (req, res) => {
        const { clienteId, etiquetaId } = req.params;

        await EtiquetaClienteModel.agregarEtiquetaCliente(
            req.tenant.organizacionId,
            parseInt(clienteId),
            parseInt(etiquetaId)
        );

        return ResponseHelper.success(res, null, 'Etiqueta agregada al cliente exitosamente');
    });

    /**
     * Quitar una etiqueta de un cliente
     * DELETE /api/v1/clientes/:clienteId/etiquetas/:etiquetaId
     */
    static quitarEtiqueta = asyncHandler(async (req, res) => {
        const { clienteId, etiquetaId } = req.params;

        await EtiquetaClienteModel.quitarEtiquetaCliente(
            req.tenant.organizacionId,
            parseInt(clienteId),
            parseInt(etiquetaId)
        );

        return ResponseHelper.success(res, null, 'Etiqueta removida del cliente exitosamente');
    });
}

module.exports = EtiquetaClienteController;
