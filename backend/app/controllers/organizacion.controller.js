// Controller de Organizaciones - Gestión CRUD para tenants

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
            const nuevaOrganizacion = await OrganizacionModel.crear(req.body);
            ResponseHelper.success(res, nuevaOrganizacion, 'Organización creada exitosamente', 201);
        } catch (error) {
            logger.error('Error al crear organización:', error.message);

            if (error.message.includes('email')) {
                return ResponseHelper.error(res, error.message, 409);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Obtener organización por ID
     * GET /api/v1/organizaciones/:id
     */
    static async obtenerPorId(req, res) {
        try {
            const organizacion = await OrganizacionModel.obtenerPorId(parseInt(req.params.id));

            if (!organizacion) {
                return ResponseHelper.notFound(res, 'Organización no encontrada');
            }

            ResponseHelper.success(res, organizacion);
        } catch (error) {
            logger.error('Error al obtener organización:', error.message);
            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Listar organizaciones con paginación
     * GET /api/v1/organizaciones
     */
    static async listar(req, res) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                tipo_industria: req.query.tipo_industria,
                activo: req.query.activo === 'false' ? false : true
            };

            const resultado = await OrganizacionModel.listar(options);
            ResponseHelper.success(res, resultado);
        } catch (error) {
            logger.error('Error al listar organizaciones:', error.message);
            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Actualizar organización
     * PUT /api/v1/organizaciones/:id
     */
    static async actualizar(req, res) {
        try {
            const organizacionActualizada = await OrganizacionModel.actualizar(parseInt(req.params.id), req.body);

            if (!organizacionActualizada) {
                return ResponseHelper.notFound(res, 'Organización no encontrada');
            }

            ResponseHelper.success(res, organizacionActualizada, 'Organización actualizada exitosamente');
        } catch (error) {
            logger.error('Error al actualizar organización:', error.message);
            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Desactivar organización
     * DELETE /api/v1/organizaciones/:id
     */
    static async desactivar(req, res) {
        try {
            const desactivada = await OrganizacionModel.desactivar(parseInt(req.params.id));

            if (!desactivada) {
                return ResponseHelper.notFound(res, 'Organización no encontrada');
            }

            ResponseHelper.success(res, { id: parseInt(req.params.id) }, 'Organización desactivada exitosamente');
        } catch (error) {
            logger.error('Error al desactivar organización:', error.message);
            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Verificar límites de organización
     * GET /api/v1/organizaciones/:id/limites
     */
    static async verificarLimites(req, res) {
        try {
            const limites = await OrganizacionModel.verificarLimites(parseInt(req.params.id));
            ResponseHelper.success(res, limites);
        } catch (error) {
            logger.error('Error al verificar límites:', error.message);

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
            const estadisticas = await OrganizacionModel.obtenerEstadisticas(parseInt(req.params.id));
            ResponseHelper.success(res, estadisticas);
        } catch (error) {
            logger.error('Error al obtener estadísticas:', error.message);
            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Proceso de onboarding completo para nueva organización
     * POST /api/v1/organizaciones/onboarding
     */
    static async onboarding(req, res) {
        try {
            const { organizacion_data, importar_plantillas = true } = req.body;
            const resultado = await OrganizacionModel.onboarding(organizacion_data, importar_plantillas);

            ResponseHelper.success(res, resultado, 'Onboarding completado exitosamente', 201);
        } catch (error) {
            logger.error('Error en onboarding de organización:', error.message);
            ResponseHelper.error(res, 'Error en proceso de onboarding', 500);
        }
    }

    /**
     * Obtener métricas detalladas de organización para dashboard
     * GET /api/v1/organizaciones/:id/metricas
     */
    static async obtenerMetricas(req, res) {
        try {
            const metricas = await OrganizacionModel.obtenerMetricas(
                parseInt(req.params.id),
                req.query.periodo || 'mes'
            );

            ResponseHelper.success(res, metricas);
        } catch (error) {
            logger.error('Error al obtener métricas de organización:', error.message);

            if (error.message.includes('no encontrada')) {
                return ResponseHelper.notFound(res, 'Organización no encontrada');
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Cambiar plan de subscripción de organización
     * PUT /api/v1/organizaciones/:id/plan
     */
    static async cambiarPlan(req, res) {
        try {
            const { nuevo_plan, configuracion_plan = {} } = req.body;

            const resultado = await OrganizacionModel.cambiarPlan(
                parseInt(req.params.id),
                nuevo_plan,
                configuracion_plan
            );

            ResponseHelper.success(res, resultado, 'Plan cambiado exitosamente');
        } catch (error) {
            logger.error('Error al cambiar plan:', error.message);

            if (error.message.includes('no encontrada')) {
                return ResponseHelper.notFound(res, 'Organización no encontrada');
            }

            if (error.message.includes('no válido')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Suspender organización
     * PUT /api/v1/organizaciones/:id/suspender
     */
    static async suspender(req, res) {
        try {
            const organizacionSuspendida = await OrganizacionModel.actualizar(parseInt(req.params.id), {
                suspendido: true,
                motivo_suspension: req.body.motivo_suspension
            });

            if (!organizacionSuspendida) {
                return ResponseHelper.notFound(res, 'Organización no encontrada');
            }

            ResponseHelper.success(res, organizacionSuspendida, 'Organización suspendida exitosamente');
        } catch (error) {
            logger.error('Error al suspender organización:', error.message);
            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Reactivar organización suspendida
     * PUT /api/v1/organizaciones/:id/reactivar
     */
    static async reactivar(req, res) {
        try {
            const organizacionReactivada = await OrganizacionModel.actualizar(parseInt(req.params.id), {
                suspendido: false,
                motivo_suspension: null
            });

            if (!organizacionReactivada) {
                return ResponseHelper.notFound(res, 'Organización no encontrada');
            }

            ResponseHelper.success(res, organizacionReactivada, 'Organización reactivada exitosamente');
        } catch (error) {
            logger.error('Error al reactivar organización:', error.message);
            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = OrganizacionController;