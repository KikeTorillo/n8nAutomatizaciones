/**
 * ====================================================================
 * CONTROLLER - MESAS (Seating Chart)
 * ====================================================================
 * Controlador para gestión de mesas y asignación de invitados.
 *
 * ENDPOINTS (9):
 * - POST   /eventos/:eventoId/mesas                  - Crear mesa
 * - GET    /eventos/:eventoId/mesas                  - Listar mesas
 * - GET    /mesas/:mesaId                            - Obtener mesa
 * - PUT    /eventos/:eventoId/mesas/:mesaId          - Actualizar mesa
 * - DELETE /mesas/:mesaId                            - Eliminar mesa
 * - PATCH  /eventos/:eventoId/mesas/posiciones       - Batch update posiciones
 * - POST   /eventos/:eventoId/mesas/:mesaId/asignar  - Asignar invitado
 * - DELETE /invitados/:invitadoId/mesa               - Desasignar invitado
 * - GET    /eventos/:eventoId/mesas/estadisticas     - Estadísticas
 *
 * NO MIGRADO A BaseCrudController - Ene 2026
 * Razón: Depende de eventoId, 4 métodos custom (actualizarPosiciones,
 * asignarInvitado, desasignarInvitado, estadísticas), lógica de
 * seating chart con capacidad y validaciones.
 *
 * REFACTORIZADO Feb 2026:
 * - Eliminados try-catch redundantes (asyncHandler en rutas)
 * - Uso de ErrorHelper.throwIfNotFound para 404s
 *
 * Fecha creación: 8 Diciembre 2025
 */

const MesaModel = require('../models/mesa.model');
const EventoModel = require('../models/evento.model');
const logger = require('../../../utils/logger');
const { ResponseHelper, ErrorHelper } = require('../../../utils/helpers');

class MesasController {

    /**
     * Crear mesa
     * POST /api/v1/eventos-digitales/eventos/:eventoId/mesas
     */
    static async crear(req, res) {
        const { eventoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        // Verificar que el evento existe y pertenece a la organización
        const evento = await EventoModel.obtenerPorId(parseInt(eventoId), organizacionId);
        ErrorHelper.throwIfNotFound(evento, 'Evento');

        const mesa = await MesaModel.crear({
            ...req.body,
            evento_id: parseInt(eventoId),
            organizacion_id: organizacionId
        });

        logger.info('[MesasController.crear] Mesa creada', {
            mesa_id: mesa.id,
            evento_id: eventoId,
            nombre: mesa.nombre
        });

        return ResponseHelper.success(res, mesa, 'Mesa creada exitosamente', 201);
    }

    /**
     * Listar mesas del evento
     * GET /api/v1/eventos-digitales/eventos/:eventoId/mesas
     */
    static async listar(req, res) {
        const { eventoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const mesas = await MesaModel.listar(parseInt(eventoId), organizacionId);

        return ResponseHelper.success(res, mesas);
    }

    /**
     * Obtener mesa por ID
     * GET /api/v1/eventos-digitales/mesas/:mesaId
     */
    static async obtenerPorId(req, res) {
        const { mesaId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const mesa = await MesaModel.obtenerPorId(parseInt(mesaId), organizacionId);
        ErrorHelper.throwIfNotFound(mesa, 'Mesa');

        return ResponseHelper.success(res, mesa);
    }

    /**
     * Actualizar mesa
     * PUT /api/v1/eventos-digitales/eventos/:eventoId/mesas/:mesaId
     */
    static async actualizar(req, res) {
        const { mesaId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const mesa = await MesaModel.actualizar(parseInt(mesaId), req.body, organizacionId);
        ErrorHelper.throwIfNotFound(mesa, 'Mesa');

        logger.info('[MesasController.actualizar] Mesa actualizada', { mesa_id: mesaId });

        return ResponseHelper.success(res, mesa, 'Mesa actualizada exitosamente');
    }

    /**
     * Eliminar mesa
     * DELETE /api/v1/eventos-digitales/mesas/:mesaId
     */
    static async eliminar(req, res) {
        const { mesaId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const eliminado = await MesaModel.eliminar(parseInt(mesaId), organizacionId);
        ErrorHelper.throwIfNotFound(eliminado, 'Mesa');

        logger.info('[MesasController.eliminar] Mesa eliminada', { mesa_id: mesaId });

        return ResponseHelper.success(res, { eliminado: true }, 'Mesa eliminada exitosamente');
    }

    /**
     * Actualizar posiciones de múltiples mesas (batch)
     * PATCH /api/v1/eventos-digitales/eventos/:eventoId/mesas/posiciones
     */
    static async actualizarPosiciones(req, res) {
        const { eventoId } = req.params;
        const { posiciones } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await MesaModel.actualizarPosiciones(
            parseInt(eventoId),
            posiciones,
            organizacionId
        );

        logger.info('[MesasController.actualizarPosiciones] Posiciones actualizadas', {
            evento_id: eventoId,
            total: resultado.actualizado
        });

        return ResponseHelper.success(res, resultado, 'Posiciones actualizadas');
    }

    /**
     * Asignar invitado a mesa
     * POST /api/v1/eventos-digitales/eventos/:eventoId/mesas/:mesaId/asignar
     */
    static async asignarInvitado(req, res) {
        const { mesaId } = req.params;
        const { invitado_id } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const invitado = await MesaModel.asignarInvitado(
            parseInt(mesaId),
            parseInt(invitado_id),
            organizacionId
        );

        logger.info('[MesasController.asignarInvitado] Invitado asignado', {
            mesa_id: mesaId,
            invitado_id: invitado_id
        });

        return ResponseHelper.success(res, invitado, 'Invitado asignado a mesa exitosamente');
    }

    /**
     * Desasignar invitado de mesa
     * DELETE /api/v1/eventos-digitales/invitados/:invitadoId/mesa
     */
    static async desasignarInvitado(req, res) {
        const { invitadoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const invitado = await MesaModel.desasignarInvitado(
            parseInt(invitadoId),
            organizacionId
        );

        logger.info('[MesasController.desasignarInvitado] Invitado desasignado', {
            invitado_id: invitadoId
        });

        return ResponseHelper.success(res, invitado, 'Invitado removido de mesa');
    }

    /**
     * Obtener estadísticas de ocupación
     * GET /api/v1/eventos-digitales/eventos/:eventoId/mesas/estadisticas
     */
    static async obtenerEstadisticas(req, res) {
        const { eventoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const estadisticas = await MesaModel.obtenerEstadisticas(
            parseInt(eventoId),
            organizacionId
        );

        return ResponseHelper.success(res, estadisticas);
    }
}

module.exports = MesasController;
