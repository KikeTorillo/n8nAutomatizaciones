/**
 * Controller de Profesionales
 * Gestión de operaciones CRUD para profesionales con aislamiento multi-tenant
 * Incluye manejo de errores, validaciones y logging
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
            const profesionalData = req.body;

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                // Super admin debe especificar organizacion_id en el body
                organizacionId = profesionalData.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id en el cuerpo de la petición',
                        400
                    );
                }
            } else {
                // Usuario regular usa su organizacion_id y no puede especificar otra
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }

                // Sobreescribir cualquier organizacion_id que haya en el body
                profesionalData.organizacion_id = organizacionId;
            }

            // Asegurar que el profesional pertenece a la organización determinada
            profesionalData.organizacion_id = organizacionId;

            // Validar que el email no esté en uso en la organización
            if (profesionalData.email) {
                const emailDisponible = await ProfesionalModel.validarEmailDisponible(
                    profesionalData.email,
                    organizacionId
                );
                if (!emailDisponible) {
                    return ResponseHelper.error(res, 'Ya existe un profesional con este email en la organización', 409);
                }
            }

            // Crear profesional en la base de datos
            const nuevoProfesional = await ProfesionalModel.crear(profesionalData);

            logger.info('Profesional creado exitosamente via API', {
                profesional_id: nuevoProfesional.id,
                organizacion_id: organizacionId,
                nombre_completo: nuevoProfesional.nombre_completo,
                tipo_profesional: nuevoProfesional.tipo_profesional,
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            ResponseHelper.success(res, nuevoProfesional, 'Profesional creado exitosamente', 201);

        } catch (error) {
            logger.error('Error al crear profesional via API:', {
                error: error.message,
                stack: error.stack,
                body: req.body,
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

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                // Super admin debe especificar organizacion_id como query parameter
                organizacionId = req.query.organizacion_id ? parseInt(req.query.organizacion_id) : null;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                // Usuario regular usa su organizacion_id
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de profesional inválido', 400);
            }

            const profesional = await ProfesionalModel.buscarPorId(parseInt(id), organizacionId);

            if (!profesional) {
                return ResponseHelper.notFound(res, 'Profesional no encontrado');
            }

            ResponseHelper.success(res, profesional, 'Profesional obtenido exitosamente');

        } catch (error) {
            logger.error('Error al obtener profesional via API:', {
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
            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                // Super admin debe especificar organizacion_id como query parameter
                organizacionId = req.query.organizacion_id ? parseInt(req.query.organizacion_id) : null;

                logger.debug('Debug super_admin organizacion_id', {
                    queryParam: req.query.organizacion_id,
                    parsedId: organizacionId,
                    userRol: req.user.rol
                });

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                // Usuario regular usa su organizacion_id
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            // Obtener parámetros de filtros y paginación
            const filtros = {
                activo: req.query.activo !== undefined ? req.query.activo === 'true' : null,
                disponible_online: req.query.disponible_online !== undefined ? req.query.disponible_online === 'true' : null,
                tipo_profesional: req.query.tipo_profesional || null,
                busqueda: req.query.busqueda || null,
                limite: Math.min(parseInt(req.query.limit) || 20, 50),
                offset: Math.max(parseInt(req.query.offset) || 0, 0)
            };

            // Obtener datos de la base de datos
            const profesionales = await ProfesionalModel.listarPorOrganizacion(organizacionId, filtros);

            logger.info('Listado de profesionales exitoso', {
                organizacion_id: organizacionId,
                total_resultados: profesionales.length,
                filtros: filtros,
                ip: req.ip
            });

            ResponseHelper.success(res, {
                profesionales,
                filtros_aplicados: filtros,
                total: profesionales.length
            }, 'Profesionales obtenidos exitosamente');

        } catch (error) {
            logger.error('Error al listar profesionales via API:', {
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
            const updateData = req.body;

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                // Super admin debe especificar organizacion_id como query parameter
                organizacionId = req.query.organizacion_id ? parseInt(req.query.organizacion_id) : null;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                // Usuario regular usa su organizacion_id
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de profesional inválido', 400);
            }

            // Validar email si se está actualizando
            if (updateData.email) {
                const emailDisponible = await ProfesionalModel.validarEmailDisponible(
                    updateData.email,
                    organizacionId,
                    parseInt(id)
                );
                if (!emailDisponible) {
                    return ResponseHelper.error(res, 'Ya existe un profesional con este email en la organización', 409);
                }
            }

            const profesionalActualizado = await ProfesionalModel.actualizar(
                parseInt(id),
                organizacionId,
                updateData
            );

            logger.info('Profesional actualizado exitosamente via API', {
                profesional_id: profesionalActualizado.id,
                organizacion_id: organizacionId,
                campos_actualizados: Object.keys(updateData),
                ip: req.ip
            });

            ResponseHelper.success(res, profesionalActualizado, 'Profesional actualizado exitosamente');

        } catch (error) {
            logger.error('Error al actualizar profesional via API:', {
                error: error.message,
                profesional_id: req.params.id,
                body: req.body,
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

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                // Super admin debe especificar organizacion_id como query parameter
                organizacionId = req.query.organizacion_id ? parseInt(req.query.organizacion_id) : null;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                // Usuario regular usa su organizacion_id
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de profesional inválido', 400);
            }

            if (typeof activo !== 'boolean') {
                return ResponseHelper.error(res, 'El campo "activo" debe ser un booleano', 400);
            }

            const profesionalActualizado = await ProfesionalModel.cambiarEstado(
                parseInt(id),
                organizacionId,
                activo,
                motivo_inactividad
            );

            logger.info('Estado de profesional cambiado exitosamente via API', {
                profesional_id: profesionalActualizado.id,
                organizacion_id: organizacionId,
                nuevo_estado: activo,
                motivo: motivo_inactividad,
                ip: req.ip
            });

            ResponseHelper.success(res, profesionalActualizado,
                `Profesional ${activo ? 'activado' : 'desactivado'} exitosamente`);

        } catch (error) {
            logger.error('Error al cambiar estado de profesional via API:', {
                error: error.message,
                profesional_id: req.params.id,
                body: req.body,
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

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                // Super admin debe especificar organizacion_id como query parameter
                organizacionId = req.query.organizacion_id ? parseInt(req.query.organizacion_id) : null;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                // Usuario regular usa su organizacion_id
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de profesional inválido', 400);
            }

            const eliminado = await ProfesionalModel.eliminar(
                parseInt(id),
                organizacionId,
                motivo || 'Eliminado por administrador'
            );

            if (!eliminado) {
                return ResponseHelper.notFound(res, 'Profesional no encontrado');
            }

            logger.info('Profesional eliminado exitosamente via API', {
                profesional_id: parseInt(id),
                organizacion_id: organizacionId,
                motivo: motivo,
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            ResponseHelper.success(res, { id: parseInt(id) }, 'Profesional eliminado exitosamente');

        } catch (error) {
            logger.error('Error al eliminar profesional via API:', {
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

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                // Super admin debe especificar organizacion_id como query parameter
                organizacionId = req.query.organizacion_id ? parseInt(req.query.organizacion_id) : null;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                // Usuario regular usa su organizacion_id
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            if (!tipo) {
                return ResponseHelper.error(res, 'Tipo de profesional requerido', 400);
            }

            const profesionales = await ProfesionalModel.buscarPorTipo(
                organizacionId,
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
            logger.error('Error al buscar profesionales por tipo via API:', {
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
            const metricas = req.body;

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;
            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id ? parseInt(req.query.organizacion_id) : null;
                if (!organizacionId) {
                    return ResponseHelper.error(res, 'Super admin debe especificar organizacion_id como query parameter', 400);
                }
            } else {
                organizacionId = req.user.organizacion_id;
                if (!organizacionId) {
                    return ResponseHelper.error(res, 'Usuario no tiene organización asignada', 400);
                }
            }

            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de profesional inválido', 400);
            }

            const profesionalActualizado = await ProfesionalModel.actualizarMetricas(
                parseInt(id),
                organizacionId,
                metricas
            );

            logger.info('Métricas de profesional actualizadas exitosamente via API', {
                profesional_id: profesionalActualizado.id,
                organizacion_id: organizacionId,
                metricas_actualizadas: metricas,
                ip: req.ip
            });

            ResponseHelper.success(res, profesionalActualizado, 'Métricas actualizadas exitosamente');

        } catch (error) {
            logger.error('Error al actualizar métricas de profesional via API:', {
                error: error.message,
                profesional_id: req.params.id,
                body: req.body,
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
            // Determinar organizacion_id según el rol del usuario
            let organizacionId;
            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id ? parseInt(req.query.organizacion_id) : null;
                if (!organizacionId) {
                    return ResponseHelper.error(res, 'Super admin debe especificar organizacion_id como query parameter', 400);
                }
            } else {
                organizacionId = req.user.organizacion_id;
                if (!organizacionId) {
                    return ResponseHelper.error(res, 'Usuario no tiene organización asignada', 400);
                }
            }

            const estadisticas = await ProfesionalModel.obtenerEstadisticas(organizacionId);

            ResponseHelper.success(res, {
                organizacion_id: organizacionId,
                estadisticas,
                fecha_consulta: new Date().toISOString()
            }, 'Estadísticas obtenidas exitosamente');

        } catch (error) {
            logger.error('Error al obtener estadísticas de profesionales via API:', {
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

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;
            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id ? parseInt(req.query.organizacion_id) : null;
                if (!organizacionId) {
                    return ResponseHelper.error(res, 'Super admin debe especificar organizacion_id como query parameter', 400);
                }
            } else {
                organizacionId = req.user.organizacion_id;
                if (!organizacionId) {
                    return ResponseHelper.error(res, 'Usuario no tiene organización asignada', 400);
                }
            }

            if (!email) {
                return ResponseHelper.error(res, 'Email requerido', 400);
            }

            const disponible = await ProfesionalModel.validarEmailDisponible(
                email,
                organizacionId,
                excluir_id
            );

            ResponseHelper.success(res, {
                email,
                disponible,
                organizacion_id: organizacionId
            }, disponible ? 'Email disponible' : 'Email ya está en uso');

        } catch (error) {
            logger.error('Error al validar email de profesional via API:', {
                error: error.message,
                body: req.body,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = ProfesionalController;