/**
 * Controller de Organizaciones
 * Gestión de operaciones CRUD para organizaciones (tenants)
 * Incluye manejo de errores, validaciones y logging
 */

const { OrganizacionModel } = require('../database');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');

class OrganizacionController {
    /**
     * Crear nueva organización
     * POST /api/v1/organizaciones
     */
    static async crear(req, res) {
        try {
            const organizacionData = req.body;

            // Verificar si ya existe organización con el mismo email
            if (organizacionData.email_admin) {
                const existente = await OrganizacionModel.obtenerPorEmail(organizacionData.email_admin);
                if (existente) {
                    return ResponseHelper.error(res, 'Ya existe una organización con este email', 409);
                }
            }

            // Crear organización en la base de datos
            const nuevaOrganizacion = await OrganizacionModel.crear(organizacionData);

            logger.info('Organización creada exitosamente via API', {
                organizacion_id: nuevaOrganizacion.id,
                nombre_comercial: nuevaOrganizacion.nombre_comercial,
                configuracion_industria: nuevaOrganizacion.tipo_industria,
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            ResponseHelper.success(res, nuevaOrganizacion, 'Organización creada exitosamente', 201);

        } catch (error) {
            logger.error('Error al crear organización via API:', {
                error: error.message,
                stack: error.stack,
                body: req.body,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Obtener organización por ID
     * GET /api/v1/organizaciones/:id
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de organización inválido', 400);
            }

            const organizacion = await OrganizacionModel.obtenerPorId(parseInt(id));

            if (!organizacion) {
                return ResponseHelper.notFound(res, 'Organización no encontrada');
            }

            ResponseHelper.success(res, organizacion, 'Organización obtenida exitosamente');

        } catch (error) {
            logger.error('Error al obtener organización via API:', {
                error: error.message,
                organizacion_id: req.params.id,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Listar organizaciones con paginación
     * GET /api/v1/organizaciones
     */
    static async listar(req, res) {
        try {
            // Obtener parámetros de paginación y filtros
            const options = {
                page: Math.max(parseInt(req.query.page) || 1, 1),
                limit: Math.min(parseInt(req.query.limit) || 10, 50),
                tipo_industria: req.query.tipo_industria,
                activo: req.query.activo !== undefined ? req.query.activo === 'true' : true
            };

            // Obtener datos reales de la base de datos
            const resultado = await OrganizacionModel.listar(options);

            logger.info('Listado de organizaciones exitoso', {
                total: resultado.pagination.total,
                page: resultado.pagination.page,
                filtros: {
                    tipo_industria: options.tipo_industria,
                    activo: options.activo
                },
                ip: req.ip
            });

            ResponseHelper.success(res, resultado, 'Organizaciones obtenidas exitosamente');

        } catch (error) {
            logger.error('Error al listar organizaciones via API:', {
                error: error.message,
                query: req.query,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Actualizar organización
     * PUT /api/v1/organizaciones/:id
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de organización inválido', 400);
            }

            // Verificar si el email ya existe en otra organización
            if (updateData.email_admin) {
                const existente = await OrganizacionModel.obtenerPorEmail(updateData.email_admin);
                if (existente && existente.id !== parseInt(id)) {
                    return ResponseHelper.error(res, 'Ya existe una organización con este email', 409);
                }
            }

            const organizacionActualizada = await OrganizacionModel.actualizar(parseInt(id), updateData);

            if (!organizacionActualizada) {
                return ResponseHelper.notFound(res, 'Organización no encontrada');
            }

            logger.info('Organización actualizada exitosamente via API', {
                organizacion_id: organizacionActualizada.id,
                campos_actualizados: Object.keys(updateData),
                ip: req.ip
            });

            ResponseHelper.success(res, organizacionActualizada, 'Organización actualizada exitosamente');

        } catch (error) {
            logger.error('Error al actualizar organización via API:', {
                error: error.message,
                organizacion_id: req.params.id,
                body: req.body,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Desactivar organización
     * DELETE /api/v1/organizaciones/:id
     */
    static async desactivar(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de organización inválido', 400);
            }

            const desactivada = await OrganizacionModel.desactivar(parseInt(id));

            if (!desactivada) {
                return ResponseHelper.notFound(res, 'Organización no encontrada');
            }

            logger.info('Organización desactivada exitosamente via API', {
                organizacion_id: parseInt(id),
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            ResponseHelper.success(res, { id: parseInt(id) }, 'Organización desactivada exitosamente');

        } catch (error) {
            logger.error('Error al desactivar organización via API:', {
                error: error.message,
                organizacion_id: req.params.id,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Verificar límites de organización
     * GET /api/v1/organizaciones/:id/limites
     */
    static async verificarLimites(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de organización inválido', 400);
            }

            const limites = await OrganizacionModel.verificarLimites(parseInt(id));

            ResponseHelper.success(res, limites, 'Límites obtenidos exitosamente');

        } catch (error) {
            logger.error('Error al verificar límites via API:', {
                error: error.message,
                organizacion_id: req.params.id,
                ip: req.ip
            });

            if (error.message.includes('no encontrada')) {
                return ResponseHelper.notFound(res, 'Organización no encontrada');
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Obtener estadísticas de organización
     * GET /api/v1/organizaciones/:id/estadisticas
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de organización inválido', 400);
            }

            // Verificar que la organización existe
            const organizacion = await OrganizacionModel.obtenerPorId(parseInt(id));
            if (!organizacion) {
                return ResponseHelper.notFound(res, 'Organización no encontrada');
            }

            // Obtener límites como estadísticas básicas
            const limites = await OrganizacionModel.verificarLimites(parseInt(id));

            const estadisticas = {
                organizacion: {
                    id: organizacion.id,
                    nombre: organizacion.nombre,
                    tipo_industria: organizacion.tipo_industria,
                    fecha_creacion: organizacion.fecha_creacion
                },
                uso_actual: limites,
                resumen: {
                    estado: organizacion.estado,
                    configuracion_completa: !!organizacion.configuracion?.completa
                }
            };

            ResponseHelper.success(res, estadisticas, 'Estadísticas obtenidas exitosamente');

        } catch (error) {
            logger.error('Error al obtener estadísticas via API:', {
                error: error.message,
                organizacion_id: req.params.id,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = OrganizacionController;