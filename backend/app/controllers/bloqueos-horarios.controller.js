/**
 * Controller de Bloqueos de Horarios
 * Gestión de vacaciones, permisos, festivos y bloqueos organizacionales
 */

const BloqueosHorariosModel = require('../database/bloqueos-horarios.model');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');

class BloqueosHorariosController {

    /**
     * Crear bloqueo de horario
     * POST /bloqueos-horarios
     */
    static async crear(req, res) {
        try {
            const datosBloqueo = {
                organizacion_id: req.tenant.organizacionId,
                ...req.body
            };

            const auditoria = {
                usuario_id: req.user.id,
                ip_origen: req.ip,
                user_agent: req.get('User-Agent')
            };

            const bloqueoCreado = await BloqueosHorariosModel.crear(datosBloqueo, auditoria);

            ResponseHelper.success(res, bloqueoCreado, 'Bloqueo creado exitosamente', 201);

        } catch (error) {
            logger.error('Error creando bloqueo de horario:', error);

            if (error.message.includes('no existe') ||
                error.message.includes('no pertenece')) {
                ResponseHelper.error(res, error.message, 400);
            } else {
                ResponseHelper.error(res, 'Error interno creando bloqueo', 500);
            }
        }
    }

    /**
     * Obtener bloqueos con filtros
     * GET /bloqueos-horarios
     * GET /bloqueos-horarios/:id
     */
    static async obtener(req, res) {
        try {
            const filtros = {
                organizacion_id: req.tenant.organizacionId,
                id: req.params.id || req.query.id || null,
                profesional_id: req.query.profesional_id || null,
                tipo_bloqueo: req.query.tipo_bloqueo || null,
                fecha_inicio: req.query.fecha_inicio || null,
                fecha_fin: req.query.fecha_fin || null,
                solo_organizacionales: req.query.solo_organizacionales === 'true',
                limite: req.query.limite || 50,
                offset: req.query.offset || 0
            };

            const resultado = await BloqueosHorariosModel.obtener(filtros);

            ResponseHelper.success(res, resultado, 'Bloqueos obtenidos exitosamente');

        } catch (error) {
            logger.error('Error obteniendo bloqueos:', error);
            ResponseHelper.error(res, 'Error interno obteniendo bloqueos', 500);
        }
    }

    /**
     * Actualizar bloqueo
     * PUT /bloqueos-horarios/:id
     */
    static async actualizar(req, res) {
        try {
            const bloqueoId = req.params.id;

            const auditoria = {
                usuario_id: req.user.id,
                ip_origen: req.ip,
                user_agent: req.get('User-Agent')
            };

            const bloqueoActualizado = await BloqueosHorariosModel.actualizar(
                bloqueoId,
                req.tenant.organizacionId,
                req.body,
                auditoria
            );

            ResponseHelper.success(res, bloqueoActualizado, 'Bloqueo actualizado exitosamente');

        } catch (error) {
            logger.error('Error actualizando bloqueo:', error);

            if (error.message.includes('no encontrado') ||
                error.message.includes('sin permisos') ||
                error.message.includes('No hay campos')) {
                ResponseHelper.error(res, error.message, 400);
            } else {
                ResponseHelper.error(res, 'Error interno actualizando bloqueo', 500);
            }
        }
    }

    /**
     * Eliminar bloqueo (lógico)
     * DELETE /bloqueos-horarios/:id
     */
    static async eliminar(req, res) {
        try {
            const bloqueoId = req.params.id;

            const auditoria = {
                usuario_id: req.user.id,
                ip_origen: req.ip,
                user_agent: req.get('User-Agent')
            };

            const resultado = await BloqueosHorariosModel.eliminar(
                bloqueoId,
                req.tenant.organizacionId,
                auditoria
            );

            ResponseHelper.success(res, resultado, 'Bloqueo eliminado exitosamente');

        } catch (error) {
            logger.error('Error eliminando bloqueo:', error);

            if (error.message.includes('no encontrado') ||
                error.message.includes('sin permisos')) {
                ResponseHelper.error(res, error.message, 400);
            } else {
                ResponseHelper.error(res, 'Error interno eliminando bloqueo', 500);
            }
        }
    }
}

module.exports = BloqueosHorariosController;
