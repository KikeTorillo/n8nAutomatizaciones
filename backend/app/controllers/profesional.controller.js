/**
 * Controller de Profesionales
 * Gestión de operaciones CRUD para profesionales con aislamiento multi-tenant
 */

const ProfesionalModel = require('../database/profesional.model');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');

class ProfesionalController {
    /**
     * Crear nuevo profesional
     * POST /api/v1/profesionales
     */
    static async crear(req, res) {
        try {
            const profesionalData = {
                ...req.body,
                organizacion_id: req.tenant.organizacionId
            };

            // Validar email único si se proporciona
            if (profesionalData.email) {
                const emailDisponible = await ProfesionalModel.validarEmailDisponible(
                    profesionalData.email,
                    req.tenant.organizacionId
                );
                if (!emailDisponible) {
                    return ResponseHelper.error(res, 'Ya existe un profesional con este email en la organización', 409);
                }
            }

            const nuevoProfesional = await ProfesionalModel.crear(profesionalData);
            ResponseHelper.success(res, nuevoProfesional, 'Profesional creado exitosamente', 201);

        } catch (error) {
            logger.error('Error al crear profesional', {
                error: error.message,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('incompatible con la industria')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Obtener profesional por ID
     * GET /api/v1/profesionales/:id
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const profesional = await ProfesionalModel.buscarPorId(parseInt(id), req.tenant.organizacionId);

            if (!profesional) {
                return ResponseHelper.notFound(res, 'Profesional no encontrado');
            }

            ResponseHelper.success(res, profesional, 'Profesional obtenido exitosamente');

        } catch (error) {
            logger.error('Error al obtener profesional', {
                error: error.message,
                profesional_id: req.params.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Listar profesionales con filtros y paginación
     * GET /api/v1/profesionales
     */
    static async listar(req, res) {
        try {
            const filtros = {
                activo: req.query.activo !== undefined ? req.query.activo === 'true' : null,
                disponible_online: req.query.disponible_online !== undefined ? req.query.disponible_online === 'true' : null,
                tipo_profesional: req.query.tipo_profesional || null,
                busqueda: req.query.busqueda || null,
                limite: Math.min(parseInt(req.query.limit) || 20, 50),
                offset: Math.max(parseInt(req.query.offset) || 0, 0)
            };

            const profesionales = await ProfesionalModel.listarPorOrganizacion(req.tenant.organizacionId, filtros);

            ResponseHelper.success(res, {
                profesionales,
                filtros_aplicados: filtros,
                total: profesionales.length
            }, 'Profesionales obtenidos exitosamente');

        } catch (error) {
            logger.error('Error al listar profesionales', {
                error: error.message,
                query: req.query,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Actualizar profesional
     * PUT /api/v1/profesionales/:id
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;

            // Validar email único si se está actualizando
            if (req.body.email) {
                const emailDisponible = await ProfesionalModel.validarEmailDisponible(
                    req.body.email,
                    req.tenant.organizacionId,
                    parseInt(id)
                );
                if (!emailDisponible) {
                    return ResponseHelper.error(res, 'Ya existe un profesional con ese email en la organización', 409);
                }
            }

            const profesionalActualizado = await ProfesionalModel.actualizar(
                parseInt(id),
                req.tenant.organizacionId,
                req.body
            );

            ResponseHelper.success(res, profesionalActualizado, 'Profesional actualizado exitosamente');

        } catch (error) {
            logger.error('Error al actualizar profesional', {
                error: error.message,
                profesional_id: req.params.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('no encontrado')) {
                return ResponseHelper.notFound(res, 'Profesional no encontrado');
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Cambiar estado de profesional (activar/desactivar)
     * PATCH /api/v1/profesionales/:id/estado
     */
    static async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { activo, motivo_inactividad } = req.body;

            const profesionalActualizado = await ProfesionalModel.cambiarEstado(
                parseInt(id),
                req.tenant.organizacionId,
                activo,
                motivo_inactividad
            );

            ResponseHelper.success(res, profesionalActualizado,
                `Profesional ${activo ? 'activado' : 'desactivado'} exitosamente`);

        } catch (error) {
            logger.error('Error al cambiar estado de profesional', {
                error: error.message,
                profesional_id: req.params.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('no encontrado')) {
                return ResponseHelper.notFound(res, 'Profesional no encontrado');
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Eliminar profesional (soft delete)
     * DELETE /api/v1/profesionales/:id
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;
            const { motivo } = req.body;

            const eliminado = await ProfesionalModel.eliminar(
                parseInt(id),
                req.tenant.organizacionId,
                motivo || 'Eliminado por administrador'
            );

            if (!eliminado) {
                return ResponseHelper.notFound(res, 'Profesional no encontrado');
            }

            ResponseHelper.success(res, { id: parseInt(id) }, 'Profesional eliminado exitosamente');

        } catch (error) {
            logger.error('Error al eliminar profesional', {
                error: error.message,
                profesional_id: req.params.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Buscar profesionales por tipo
     * GET /api/v1/profesionales/tipo/:tipo
     */
    static async buscarPorTipo(req, res) {
        try {
            const { tipo } = req.params;
            const soloActivos = req.query.activos !== 'false';

            const profesionales = await ProfesionalModel.buscarPorTipo(
                req.tenant.organizacionId,
                tipo,
                soloActivos
            );

            ResponseHelper.success(res, {
                tipo_profesional: tipo,
                solo_activos: soloActivos,
                profesionales,
                total: profesionales.length
            }, 'Profesionales por tipo obtenidos exitosamente');

        } catch (error) {
            logger.error('Error al buscar profesionales por tipo', {
                error: error.message,
                tipo_profesional: req.params.tipo,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Actualizar métricas de profesional
     * PATCH /api/v1/profesionales/:id/metricas
     */
    static async actualizarMetricas(req, res) {
        try {
            const { id } = req.params;

            const profesionalActualizado = await ProfesionalModel.actualizarMetricas(
                parseInt(id),
                req.tenant.organizacionId,
                req.body
            );

            ResponseHelper.success(res, profesionalActualizado, 'Métricas actualizadas exitosamente');

        } catch (error) {
            logger.error('Error al actualizar métricas de profesional', {
                error: error.message,
                profesional_id: req.params.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('no encontrado')) {
                return ResponseHelper.notFound(res, 'Profesional no encontrado');
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Obtener estadísticas de profesionales de la organización
     * GET /api/v1/profesionales/estadisticas
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = await ProfesionalModel.obtenerEstadisticas(req.tenant.organizacionId);

            ResponseHelper.success(res, {
                organizacion_id: req.tenant.organizacionId,
                estadisticas,
                fecha_consulta: new Date().toISOString()
            }, 'Estadísticas obtenidas exitosamente');

        } catch (error) {
            logger.error('Error al obtener estadísticas de profesionales', {
                error: error.message,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Validar disponibilidad de email
     * POST /api/v1/profesionales/validar-email
     */
    static async validarEmail(req, res) {
        try {
            const { email, excluir_id } = req.body;

            const disponible = await ProfesionalModel.validarEmailDisponible(
                email,
                req.tenant.organizacionId,
                excluir_id
            );

            ResponseHelper.success(res, {
                email,
                disponible,
                organizacion_id: req.tenant.organizacionId
            }, disponible ? 'Email disponible' : 'Email ya está en uso');

        } catch (error) {
            logger.error('Error al validar email de profesional', {
                error: error.message,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = ProfesionalController;
