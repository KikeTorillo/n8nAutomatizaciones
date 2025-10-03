/**
 * Controller de Servicios
 * Gestión de operaciones CRUD para servicios con aislamiento multi-tenant
 * Incluye manejo de errores, validaciones, relaciones con profesionales y logging
 */

const ServicioModel = require('../database/servicio.model');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');

class ServicioController {
    static async crear(req, res) {
        try {
            const nuevoServicio = await ServicioModel.crear({
                ...req.body,
                organizacion_id: req.tenant.organizacionId
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

    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const servicio = await ServicioModel.obtenerPorId(parseInt(id), req.tenant.organizacionId);

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

    static async listar(req, res) {
        try {
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

            const paginacion = {
                pagina: parseInt(req.query.pagina) || 1,
                limite: parseInt(req.query.limite) || 20,
                orden: req.query.orden || 'nombre',
                direccion: req.query.direccion || 'ASC'
            };

            const resultado = await ServicioModel.listar(req.tenant.organizacionId, filtros, paginacion);

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

    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const servicioData = { ...req.body };
            delete servicioData.organizacion_id;

            const servicioActualizado = await ServicioModel.actualizar(
                parseInt(id),
                servicioData,
                req.tenant.organizacionId
            );

            if (!servicioActualizado) {
                return ResponseHelper.error(res, 'Servicio no encontrado', 404);
            }

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

    static async eliminar(req, res) {
        try {
            const { id } = req.params;
            const eliminado = await ServicioModel.eliminar(parseInt(id), req.tenant.organizacionId);

            if (!eliminado) {
                return ResponseHelper.error(res, 'Servicio no encontrado', 404);
            }

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

    static async asignarProfesional(req, res) {
        try {
            const { id } = req.params;
            const { profesional_id, configuracion = {} } = req.body;

            const asignacion = await ServicioModel.asignarProfesional(
                parseInt(id),
                parseInt(profesional_id),
                configuracion,
                req.tenant.organizacionId
            );

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

    static async desasignarProfesional(req, res) {
        try {
            const { id, profesional_id } = req.params;

            const desasignado = await ServicioModel.desasignarProfesional(
                parseInt(id),
                parseInt(profesional_id),
                req.tenant.organizacionId
            );

            if (!desasignado) {
                return ResponseHelper.error(res, 'Asignación no encontrada', 404);
            }

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

    static async obtenerProfesionales(req, res) {
        try {
            const { id } = req.params;
            const solo_activos = req.query.solo_activos !== 'false';

            const profesionales = await ServicioModel.obtenerProfesionales(
                parseInt(id),
                req.tenant.organizacionId,
                solo_activos
            );

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

    static async obtenerServiciosPorProfesional(req, res) {
        try {
            const { profesional_id } = req.params;
            const solo_activos = req.query.solo_activos !== 'false';

            const servicios = await ServicioModel.obtenerServiciosPorProfesional(
                parseInt(profesional_id),
                req.tenant.organizacionId,
                solo_activos
            );

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

    static async buscar(req, res) {
        try {
            const { termino } = req.query;

            const opciones = {
                limite: parseInt(req.query.limite) || 10,
                solo_activos: req.query.solo_activos !== 'false'
            };

            const servicios = await ServicioModel.buscar(
                termino.trim(),
                req.tenant.organizacionId,
                opciones
            );

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

    static async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = await ServicioModel.obtenerEstadisticas(req.tenant.organizacionId);

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

    static async crearDesdeePlantilla(req, res) {
        try {
            const { plantilla_id, configuracion_personalizada = {} } = req.body;

            const nuevoServicio = await ServicioModel.crearDesdeePlantilla(
                req.tenant.organizacionId,
                parseInt(plantilla_id),
                configuracion_personalizada
            );

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

    static async eliminarPermanente(req, res) {
        try {
            const { id } = req.params;
            const eliminado = await ServicioModel.eliminarPermanente(parseInt(id), req.tenant.organizacionId);

            if (!eliminado) {
                return ResponseHelper.error(res, 'Servicio no encontrado', 404);
            }

            ResponseHelper.success(res, null, 'Servicio eliminado permanentemente');

        } catch (error) {
            logger.error('Error al eliminar servicio permanentemente via API:', {
                error: error.message,
                stack: error.stack,
                servicio_id: req.params.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('tiene citas asociadas')) {
                return ResponseHelper.error(res, error.message, 409);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = ServicioController;