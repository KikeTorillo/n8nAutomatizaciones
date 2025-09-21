/**
 * Controller de Servicios
 * Gestión de operaciones CRUD para servicios con aislamiento multi-tenant
 * Incluye manejo de errores, validaciones, relaciones con profesionales y logging
 */

const ServicioModel = require('../database/servicio.model');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');

class ServicioController {
    /**
     * Crear nuevo servicio
     * POST /api/v1/servicios
     */
    static async crear(req, res) {
        try {
            const servicioData = req.body;

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                // Super admin debe especificar organizacion_id en el body
                organizacionId = servicioData.organizacion_id;

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
                servicioData.organizacion_id = organizacionId;
            }

            // Asegurar que el servicio pertenece a la organización determinada
            servicioData.organizacion_id = organizacionId;

            // Validaciones adicionales
            if (!servicioData.nombre || servicioData.nombre.trim() === '') {
                return ResponseHelper.error(res, 'El nombre del servicio es requerido', 400);
            }

            if (!servicioData.duracion_minutos || servicioData.duracion_minutos <= 0) {
                return ResponseHelper.error(res, 'La duración del servicio debe ser mayor a 0 minutos', 400);
            }

            if (!servicioData.precio || servicioData.precio < 0) {
                return ResponseHelper.error(res, 'El precio del servicio debe ser mayor o igual a 0', 400);
            }

            // Crear servicio en la base de datos
            const nuevoServicio = await ServicioModel.crear(servicioData);

            logger.info('Servicio creado exitosamente via API', {
                servicio_id: nuevoServicio.id,
                organizacion_id: organizacionId,
                nombre: nuevoServicio.nombre,
                categoria: nuevoServicio.categoria,
                precio: nuevoServicio.precio,
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            ResponseHelper.success(res, nuevoServicio, 'Servicio creado exitosamente', 201);

        } catch (error) {
            logger.error('Error al crear servicio via API:', {
                error: error.message,
                stack: error.stack,
                body: req.body,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('Ya existe un servicio con ese nombre')) {
                return ResponseHelper.error(res, error.message, 409);
            }

            if (error.message.includes('Error de validación')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Obtener servicio por ID
     * GET /api/v1/servicios/:id
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            const servicio = await ServicioModel.obtenerPorId(parseInt(id), organizacionId);

            if (!servicio) {
                return ResponseHelper.error(res, 'Servicio no encontrado', 404);
            }

            ResponseHelper.success(res, servicio, 'Servicio obtenido exitosamente');

        } catch (error) {
            logger.error('Error al obtener servicio por ID via API:', {
                error: error.message,
                stack: error.stack,
                servicio_id: req.params.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Listar servicios con filtros y paginación
     * GET /api/v1/servicios
     */
    static async listar(req, res) {
        try {
            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            // Extraer filtros de query parameters
            const filtros = {};
            
            if (req.query.activo !== undefined) {
                filtros.activo = req.query.activo === 'true';
            }
            
            if (req.query.categoria) {
                filtros.categoria = req.query.categoria;
            }
            
            if (req.query.busqueda) {
                filtros.busqueda = req.query.busqueda;
            }
            
            if (req.query.tags) {
                filtros.tags = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
            }
            
            if (req.query.precio_min !== undefined) {
                filtros.precio_min = parseFloat(req.query.precio_min);
            }
            
            if (req.query.precio_max !== undefined) {
                filtros.precio_max = parseFloat(req.query.precio_max);
            }

            // Configurar paginación
            const paginacion = {
                pagina: parseInt(req.query.pagina) || 1,
                limite: parseInt(req.query.limite) || 20,
                orden: req.query.orden || 'nombre',
                direccion: req.query.direccion || 'ASC'
            };

            const resultado = await ServicioModel.listar(organizacionId, filtros, paginacion);

            ResponseHelper.success(res, resultado, 'Servicios listados exitosamente');

        } catch (error) {
            logger.error('Error al listar servicios via API:', {
                error: error.message,
                stack: error.stack,
                query: req.query,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Actualizar servicio
     * PUT /api/v1/servicios/:id
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const servicioData = req.body;

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            // No permitir cambio de organizacion_id
            delete servicioData.organizacion_id;

            const servicioActualizado = await ServicioModel.actualizar(parseInt(id), servicioData, organizacionId);

            if (!servicioActualizado) {
                return ResponseHelper.error(res, 'Servicio no encontrado', 404);
            }

            logger.info('Servicio actualizado exitosamente via API', {
                servicio_id: servicioActualizado.id,
                organizacion_id: organizacionId,
                nombre: servicioActualizado.nombre,
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            ResponseHelper.success(res, servicioActualizado, 'Servicio actualizado exitosamente');

        } catch (error) {
            logger.error('Error al actualizar servicio via API:', {
                error: error.message,
                stack: error.stack,
                servicio_id: req.params.id,
                body: req.body,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('Ya existe un servicio con ese nombre')) {
                return ResponseHelper.error(res, error.message, 409);
            }

            if (error.message.includes('Error de validación')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Eliminar servicio (soft delete)
     * DELETE /api/v1/servicios/:id
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            const eliminado = await ServicioModel.eliminar(parseInt(id), organizacionId);

            if (!eliminado) {
                return ResponseHelper.error(res, 'Servicio no encontrado', 404);
            }

            logger.info('Servicio eliminado (soft delete) exitosamente via API', {
                servicio_id: parseInt(id),
                organizacion_id: organizacionId,
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            ResponseHelper.success(res, null, 'Servicio eliminado exitosamente');

        } catch (error) {
            logger.error('Error al eliminar servicio via API:', {
                error: error.message,
                stack: error.stack,
                servicio_id: req.params.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Asignar profesional a servicio
     * POST /api/v1/servicios/:id/profesionales
     */
    static async asignarProfesional(req, res) {
        try {
            const { id } = req.params;
            const { profesional_id, configuracion = {} } = req.body;

            if (!profesional_id) {
                return ResponseHelper.error(res, 'profesional_id es requerido', 400);
            }

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            const asignacion = await ServicioModel.asignarProfesional(
                parseInt(id), 
                parseInt(profesional_id), 
                configuracion, 
                organizacionId
            );

            logger.info('Profesional asignado a servicio exitosamente via API', {
                servicio_id: parseInt(id),
                profesional_id: parseInt(profesional_id),
                organizacion_id: organizacionId,
                ip: req.ip
            });

            ResponseHelper.success(res, asignacion, 'Profesional asignado al servicio exitosamente', 201);

        } catch (error) {
            logger.error('Error al asignar profesional a servicio via API:', {
                error: error.message,
                stack: error.stack,
                servicio_id: req.params.id,
                body: req.body,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('no existe')) {
                return ResponseHelper.error(res, error.message, 404);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Desasignar profesional de servicio
     * DELETE /api/v1/servicios/:id/profesionales/:profesional_id
     */
    static async desasignarProfesional(req, res) {
        try {
            const { id, profesional_id } = req.params;

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            const desasignado = await ServicioModel.desasignarProfesional(
                parseInt(id), 
                parseInt(profesional_id), 
                organizacionId
            );

            if (!desasignado) {
                return ResponseHelper.error(res, 'Asignación no encontrada', 404);
            }

            logger.info('Profesional desasignado de servicio exitosamente via API', {
                servicio_id: parseInt(id),
                profesional_id: parseInt(profesional_id),
                organizacion_id: organizacionId,
                ip: req.ip
            });

            ResponseHelper.success(res, null, 'Profesional desasignado del servicio exitosamente');

        } catch (error) {
            logger.error('Error al desasignar profesional de servicio via API:', {
                error: error.message,
                stack: error.stack,
                servicio_id: req.params.id,
                profesional_id: req.params.profesional_id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Obtener profesionales asignados a un servicio
     * GET /api/v1/servicios/:id/profesionales
     */
    static async obtenerProfesionales(req, res) {
        try {
            const { id } = req.params;
            const solo_activos = req.query.solo_activos !== 'false';

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            const profesionales = await ServicioModel.obtenerProfesionales(parseInt(id), organizacionId, solo_activos);

            ResponseHelper.success(res, profesionales, 'Profesionales del servicio obtenidos exitosamente');

        } catch (error) {
            logger.error('Error al obtener profesionales del servicio via API:', {
                error: error.message,
                stack: error.stack,
                servicio_id: req.params.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Obtener servicios de un profesional
     * GET /api/v1/profesionales/:profesional_id/servicios
     */
    static async obtenerServiciosPorProfesional(req, res) {
        try {
            const { profesional_id } = req.params;
            const solo_activos = req.query.solo_activos !== 'false';

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            const servicios = await ServicioModel.obtenerServiciosPorProfesional(parseInt(profesional_id), organizacionId, solo_activos);

            ResponseHelper.success(res, servicios, 'Servicios del profesional obtenidos exitosamente');

        } catch (error) {
            logger.error('Error al obtener servicios del profesional via API:', {
                error: error.message,
                stack: error.stack,
                profesional_id: req.params.profesional_id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Buscar servicios con búsqueda full-text
     * GET /api/v1/servicios/buscar
     */
    static async buscar(req, res) {
        try {
            const { termino } = req.query;

            if (!termino || termino.trim() === '') {
                return ResponseHelper.error(res, 'Término de búsqueda es requerido', 400);
            }

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            const opciones = {
                limite: parseInt(req.query.limite) || 10,
                solo_activos: req.query.solo_activos !== 'false'
            };

            const servicios = await ServicioModel.buscar(termino.trim(), organizacionId, opciones);

            ResponseHelper.success(res, servicios, 'Búsqueda de servicios completada exitosamente');

        } catch (error) {
            logger.error('Error al buscar servicios via API:', {
                error: error.message,
                stack: error.stack,
                query: req.query,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Obtener estadísticas de servicios
     * GET /api/v1/servicios/estadisticas
     */
    static async obtenerEstadisticas(req, res) {
        try {
            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            const estadisticas = await ServicioModel.obtenerEstadisticas(organizacionId);

            ResponseHelper.success(res, estadisticas, 'Estadísticas de servicios obtenidas exitosamente');

        } catch (error) {
            logger.error('Error al obtener estadísticas de servicios via API:', {
                error: error.message,
                stack: error.stack,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Crear servicio desde plantilla
     * POST /api/v1/servicios/desde-plantilla
     */
    static async crearDesdeePlantilla(req, res) {
        try {
            const { plantilla_id, configuracion_personalizada = {} } = req.body;

            if (!plantilla_id) {
                return ResponseHelper.error(res, 'plantilla_id es requerido', 400);
            }

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = configuracion_personalizada.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id en configuracion_personalizada',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }

                // Sobreescribir cualquier organizacion_id en configuracion_personalizada
                configuracion_personalizada.organizacion_id = organizacionId;
            }

            const nuevoServicio = await ServicioModel.crearDesdeePlantilla(
                organizacionId, 
                parseInt(plantilla_id), 
                configuracion_personalizada
            );

            logger.info('Servicio creado desde plantilla exitosamente via API', {
                servicio_id: nuevoServicio.id,
                plantilla_id: parseInt(plantilla_id),
                organizacion_id: organizacionId,
                nombre: nuevoServicio.nombre,
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            ResponseHelper.success(res, nuevoServicio, 'Servicio creado desde plantilla exitosamente', 201);

        } catch (error) {
            logger.error('Error al crear servicio desde plantilla via API:', {
                error: error.message,
                stack: error.stack,
                body: req.body,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('Plantilla de servicio no encontrada')) {
                return ResponseHelper.error(res, error.message, 404);
            }

            if (error.message.includes('Ya existe un servicio con ese nombre')) {
                return ResponseHelper.error(res, error.message, 409);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = ServicioController;