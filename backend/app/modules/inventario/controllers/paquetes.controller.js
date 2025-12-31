/**
 * Controller para Paquetes de Envio
 * Endpoints para CRUD de paquetes/bultos durante empaque
 * Fecha: 31 Diciembre 2025
 */

const { asyncHandler } = require('../../../middleware');
const { ResponseHelper } = require('../../../utils/helpers');
const PaquetesModel = require('../models/paquetes.model');
const logger = require('../../../utils/logger');

class PaquetesController {
    // ==================== PAQUETES ====================

    /**
     * POST /api/v1/inventario/operaciones/:operacionId/paquetes
     * Crear un nuevo paquete
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { operacionId } = req.params;

        logger.info('[PaquetesController.crear] Request', {
            operacion_id: operacionId,
            usuario_id: usuarioId
        });

        const paquete = await PaquetesModel.crear(
            parseInt(operacionId),
            req.body,
            organizacionId,
            usuarioId
        );

        return ResponseHelper.created(res, paquete, 'Paquete creado exitosamente');
    });

    /**
     * GET /api/v1/inventario/operaciones/:operacionId/paquetes
     * Listar paquetes de una operacion
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { operacionId } = req.params;

        const paquetes = await PaquetesModel.listarPorOperacion(
            parseInt(operacionId),
            organizacionId
        );

        return ResponseHelper.success(res, paquetes, 'Paquetes obtenidos');
    });

    /**
     * GET /api/v1/inventario/operaciones/:operacionId/items-disponibles
     * Obtener items disponibles para empacar
     */
    static itemsDisponibles = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { operacionId } = req.params;

        const items = await PaquetesModel.obtenerItemsDisponibles(
            parseInt(operacionId),
            organizacionId
        );

        return ResponseHelper.success(res, items, 'Items disponibles obtenidos');
    });

    /**
     * GET /api/v1/inventario/operaciones/:operacionId/resumen-empaque
     * Obtener resumen de empaque de la operacion
     */
    static resumenEmpaque = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { operacionId } = req.params;

        const resumen = await PaquetesModel.obtenerResumen(
            parseInt(operacionId),
            organizacionId
        );

        return ResponseHelper.success(res, resumen, 'Resumen de empaque obtenido');
    });

    /**
     * GET /api/v1/inventario/paquetes/:id
     * Obtener paquete por ID con items
     */
    static obtener = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const paquete = await PaquetesModel.obtenerPorId(
            parseInt(id),
            organizacionId
        );

        if (!paquete) {
            return ResponseHelper.notFound(res, 'Paquete no encontrado');
        }

        return ResponseHelper.success(res, paquete, 'Paquete obtenido');
    });

    /**
     * PUT /api/v1/inventario/paquetes/:id
     * Actualizar dimensiones/peso/notas del paquete
     */
    static actualizar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const paquete = await PaquetesModel.actualizar(
            parseInt(id),
            req.body,
            organizacionId
        );

        return ResponseHelper.success(res, paquete, 'Paquete actualizado');
    });

    // ==================== ITEMS DE PAQUETE ====================

    /**
     * POST /api/v1/inventario/paquetes/:id/items
     * Agregar item al paquete
     */
    static agregarItem = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { id } = req.params;

        const resultado = await PaquetesModel.agregarItem(
            parseInt(id),
            req.body,
            organizacionId,
            usuarioId
        );

        return ResponseHelper.success(res, resultado, 'Item agregado al paquete');
    });

    /**
     * DELETE /api/v1/inventario/paquetes/:id/items/:itemId
     * Remover item del paquete
     */
    static removerItem = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id, itemId } = req.params;

        const resultado = await PaquetesModel.removerItem(
            parseInt(id),
            parseInt(itemId),
            organizacionId
        );

        return ResponseHelper.success(res, resultado, 'Item removido del paquete');
    });

    // ==================== OPERACIONES DE PAQUETE ====================

    /**
     * POST /api/v1/inventario/paquetes/:id/cerrar
     * Cerrar paquete (no mas modificaciones)
     */
    static cerrar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { id } = req.params;

        const resultado = await PaquetesModel.cerrar(
            parseInt(id),
            organizacionId,
            usuarioId
        );

        return ResponseHelper.success(res, resultado, 'Paquete cerrado');
    });

    /**
     * POST /api/v1/inventario/paquetes/:id/cancelar
     * Cancelar paquete
     */
    static cancelar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;
        const { motivo } = req.body;

        const resultado = await PaquetesModel.cancelar(
            parseInt(id),
            motivo,
            organizacionId
        );

        return ResponseHelper.success(res, resultado, 'Paquete cancelado');
    });

    /**
     * POST /api/v1/inventario/paquetes/:id/etiquetar
     * Marcar como etiquetado
     */
    static etiquetar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const paquete = await PaquetesModel.marcarEtiquetado(
            parseInt(id),
            req.body,
            organizacionId
        );

        return ResponseHelper.success(res, paquete, 'Paquete etiquetado');
    });

    /**
     * POST /api/v1/inventario/paquetes/:id/enviar
     * Marcar como enviado
     */
    static enviar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const paquete = await PaquetesModel.marcarEnviado(
            parseInt(id),
            organizacionId
        );

        return ResponseHelper.success(res, paquete, 'Paquete marcado como enviado');
    });

    /**
     * GET /api/v1/inventario/paquetes/:id/etiqueta
     * Generar etiqueta del paquete
     */
    static generarEtiqueta = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { id } = req.params;

        const etiqueta = await PaquetesModel.generarEtiqueta(
            parseInt(id),
            organizacionId
        );

        return ResponseHelper.success(res, etiqueta, 'Etiqueta generada');
    });
}

module.exports = PaquetesController;
