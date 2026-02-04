/**
 * ====================================================================
 * CONTROLLER - BLOQUES INVITACIÓN
 * ====================================================================
 * Controlador para gestión de bloques del editor de invitaciones.
 *
 * ENDPOINTS (6):
 * - GET    /eventos/:id/bloques           - Obtener bloques
 * - PUT    /eventos/:id/bloques           - Guardar todos los bloques
 * - POST   /eventos/:id/bloques           - Agregar bloque
 * - PUT    /eventos/:id/bloques/:bloqueId - Actualizar bloque
 * - DELETE /eventos/:id/bloques/:bloqueId - Eliminar bloque
 * - POST   /eventos/:id/bloques/:bloqueId/duplicar - Duplicar bloque
 * - PUT    /eventos/:id/bloques/reordenar - Reordenar bloques
 *
 * Fecha creación: 3 Febrero 2026
 */

const BloquesInvitacionModel = require('../models/bloquesInvitacion.model');
const logger = require('../../../utils/logger');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const { ResourceNotFoundError } = require('../../../utils/errors');

class BloquesController {

    /**
     * Obtener bloques de un evento
     * GET /api/v1/eventos-digitales/eventos/:id/bloques
     */
    static obtener = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const bloques = await BloquesInvitacionModel.obtenerBloques(
            parseInt(id),
            organizacionId
        );

        return ResponseHelper.success(res, { bloques });
    });

    /**
     * Guardar todos los bloques (reemplaza los existentes)
     * PUT /api/v1/eventos-digitales/eventos/:id/bloques
     */
    static guardar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { bloques } = req.body;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const bloquesGuardados = await BloquesInvitacionModel.guardarBloques(
            parseInt(id),
            bloques || [],
            organizacionId
        );

        logger.info('[BloquesController.guardar] Bloques guardados', {
            evento_id: id,
            cantidad: bloquesGuardados?.length || 0,
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, { bloques: bloquesGuardados }, 'Bloques guardados exitosamente');
    });

    /**
     * Agregar un nuevo bloque
     * POST /api/v1/eventos-digitales/eventos/:id/bloques
     */
    static agregar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const bloque = await BloquesInvitacionModel.agregarBloque(
            parseInt(id),
            req.body,
            organizacionId
        );

        logger.info('[BloquesController.agregar] Bloque agregado', {
            evento_id: id,
            bloque_id: bloque.id,
            bloque_tipo: bloque.tipo,
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, { bloque }, 'Bloque agregado exitosamente', 201);
    });

    /**
     * Actualizar un bloque específico
     * PUT /api/v1/eventos-digitales/eventos/:id/bloques/:bloqueId
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id, bloqueId } = req.params;
        const { contenido } = req.body;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const bloque = await BloquesInvitacionModel.actualizarBloque(
            parseInt(id),
            bloqueId,
            contenido,
            organizacionId
        );

        logger.info('[BloquesController.actualizar] Bloque actualizado', {
            evento_id: id,
            bloque_id: bloqueId,
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, { bloque }, 'Bloque actualizado exitosamente');
    });

    /**
     * Eliminar un bloque
     * DELETE /api/v1/eventos-digitales/eventos/:id/bloques/:bloqueId
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id, bloqueId } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const eliminado = await BloquesInvitacionModel.eliminarBloque(
            parseInt(id),
            bloqueId,
            organizacionId
        );

        if (!eliminado) {
            throw new ResourceNotFoundError('Bloque', bloqueId);
        }

        logger.info('[BloquesController.eliminar] Bloque eliminado', {
            evento_id: id,
            bloque_id: bloqueId,
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, { id: bloqueId }, 'Bloque eliminado exitosamente');
    });

    /**
     * Duplicar un bloque
     * POST /api/v1/eventos-digitales/eventos/:id/bloques/:bloqueId/duplicar
     */
    static duplicar = asyncHandler(async (req, res) => {
        const { id, bloqueId } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const bloque = await BloquesInvitacionModel.duplicarBloque(
            parseInt(id),
            bloqueId,
            organizacionId
        );

        logger.info('[BloquesController.duplicar] Bloque duplicado', {
            evento_id: id,
            bloque_original_id: bloqueId,
            bloque_nuevo_id: bloque.id,
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, { bloque }, 'Bloque duplicado exitosamente', 201);
    });

    /**
     * Reordenar bloques
     * PUT /api/v1/eventos-digitales/eventos/:id/bloques/reordenar
     */
    static reordenar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { orden } = req.body; // Array de IDs en el nuevo orden
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const bloques = await BloquesInvitacionModel.reordenarBloques(
            parseInt(id),
            orden,
            organizacionId
        );

        logger.info('[BloquesController.reordenar] Bloques reordenados', {
            evento_id: id,
            cantidad: bloques?.length || 0,
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, { bloques }, 'Bloques reordenados exitosamente');
    });
}

module.exports = BloquesController;
