/**
 * ====================================================================
 * CONTROLLER - INVITADOS DE EVENTOS
 * ====================================================================
 * Controlador para gestión de invitados y RSVP.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const InvitadoModel = require('../models/invitado.model');
const logger = require('../../../utils/logger');
const { ResponseHelper } = require('../../../utils/helpers');

class InvitadosController {

    /**
     * Crear invitado
     * POST /api/v1/eventos-digitales/eventos/:eventoId/invitados
     */
    static async crear(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const datos = {
                ...req.body,
                organizacion_id: organizacionId,
                evento_id: parseInt(eventoId)
            };

            const invitado = await InvitadoModel.crear(datos);

            logger.info('[InvitadosController.crear] Invitado creado', {
                invitado_id: invitado.id,
                evento_id: eventoId
            });

            return ResponseHelper.success(res, invitado, 'Invitado creado exitosamente', 201);

        } catch (error) {
            logger.error('[InvitadosController.crear] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Importar invitados masivamente
     * POST /api/v1/eventos-digitales/eventos/:eventoId/invitados/importar
     */
    static async importar(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;
            const { invitados } = req.body;

            const resultado = await InvitadoModel.crearMasivo(
                parseInt(eventoId),
                organizacionId,
                invitados
            );

            logger.info('[InvitadosController.importar] Importación completada', {
                evento_id: eventoId,
                creados: resultado.creados.length,
                errores: resultado.errores.length
            });

            return ResponseHelper.success(res, resultado, `${resultado.creados.length} invitados importados`);

        } catch (error) {
            logger.error('[InvitadosController.importar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Listar invitados del evento
     * GET /api/v1/eventos-digitales/eventos/:eventoId/invitados
     */
    static async listar(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;
            const filtros = req.query;

            const resultado = await InvitadoModel.listar(
                parseInt(eventoId),
                organizacionId,
                filtros
            );

            return ResponseHelper.success(res, resultado);

        } catch (error) {
            logger.error('[InvitadosController.listar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Actualizar invitado
     * PUT /api/v1/eventos-digitales/invitados/:id
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const invitado = await InvitadoModel.actualizar(
                parseInt(id),
                req.body,
                organizacionId
            );

            if (!invitado) {
                return ResponseHelper.error(res, 'Invitado no encontrado', 404);
            }

            return ResponseHelper.success(res, invitado, 'Invitado actualizado exitosamente');

        } catch (error) {
            logger.error('[InvitadosController.actualizar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Eliminar invitado
     * DELETE /api/v1/eventos-digitales/invitados/:id
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const eliminado = await InvitadoModel.eliminar(parseInt(id), organizacionId);

            if (!eliminado) {
                return ResponseHelper.error(res, 'Invitado no encontrado', 404);
            }

            return ResponseHelper.success(res, { id: parseInt(id) }, 'Invitado eliminado');

        } catch (error) {
            logger.error('[InvitadosController.eliminar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Exportar invitados a CSV
     * GET /api/v1/eventos-digitales/eventos/:eventoId/invitados/exportar
     */
    static async exportar(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const invitados = await InvitadoModel.exportar(parseInt(eventoId), organizacionId);

            // Generar CSV
            const headers = [
                'Nombre', 'Email', 'Teléfono', 'Grupo Familiar',
                'Max Acompañantes', 'Estado RSVP', 'Num Asistentes',
                'Mensaje', 'Restricciones Dietéticas', 'Confirmado En', 'Vía'
            ];

            const rows = invitados.map(i => [
                i.nombre,
                i.email || '',
                i.telefono || '',
                i.grupo_familiar || '',
                i.max_acompanantes,
                i.estado_rsvp,
                i.num_asistentes || 0,
                i.mensaje_rsvp || '',
                i.restricciones_dieteticas || '',
                i.confirmado_en || '',
                i.confirmado_via || ''
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell =>
                    typeof cell === 'string' && cell.includes(',')
                        ? `"${cell}"`
                        : cell
                ).join(','))
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=invitados-${eventoId}.csv`);
            return res.send(csvContent);

        } catch (error) {
            logger.error('[InvitadosController.exportar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Obtener grupos familiares únicos
     * GET /api/v1/eventos-digitales/eventos/:eventoId/grupos
     */
    static async obtenerGrupos(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const grupos = await InvitadoModel.obtenerGrupos(parseInt(eventoId), organizacionId);

            return ResponseHelper.success(res, grupos);

        } catch (error) {
            logger.error('[InvitadosController.obtenerGrupos] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Obtener etiquetas únicas
     * GET /api/v1/eventos-digitales/eventos/:eventoId/etiquetas
     */
    static async obtenerEtiquetas(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const etiquetas = await InvitadoModel.obtenerEtiquetas(parseInt(eventoId), organizacionId);

            return ResponseHelper.success(res, etiquetas);

        } catch (error) {
            logger.error('[InvitadosController.obtenerEtiquetas] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }
}

module.exports = InvitadosController;
