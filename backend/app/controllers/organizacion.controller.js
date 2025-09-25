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

            /**
             * IMPORTANTE: DOS CAMPOS DIFERENTES DE INDUSTRIA
             *
             * 1. tipo_industria (ENUM): Clasificación categórica fija
             *    - Usado para validaciones y compatibilidad profesional-industria
             *    - Valor del frontend: req.body.configuracion_industria (por compatibilidad API)
             *
             * 2. configuracion_industria (JSONB): Configuraciones operativas
             *    - Usado para personalizaciones específicas por sector
             *    - Opcional, puede venir en req.body.configuracion_industria_jsonb
             */

            // Mapear configuracion_industria del frontend a tipo_industria de BD
            // TODO: Cambiar frontend para enviar tipo_industria directamente
            if (organizacionData.configuracion_industria && !organizacionData.tipo_industria) {
                organizacionData.tipo_industria = organizacionData.configuracion_industria;
                delete organizacionData.configuracion_industria; // Evitar conflicto con JSONB
            }

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

    /**
     * Proceso de onboarding completo para nueva organización
     * POST /api/v1/organizaciones/onboarding
     */
    static async onboarding(req, res) {
        try {
            const { organizacion_data, importar_plantillas = true } = req.body;

            if (!organizacion_data || !organizacion_data.nombre_comercial || !organizacion_data.tipo_industria) {
                return ResponseHelper.error(res, 'Datos de organización incompletos', 400);
            }

            // 1. Crear organización
            const nuevaOrganizacion = await OrganizacionModel.crear(organizacion_data);

            let resultadoPlantillas = null;

            // 2. Importar plantillas de servicios automáticamente si se solicita
            if (importar_plantillas) {
                try {
                    resultadoPlantillas = await OrganizacionModel.agregarPlantillasServicios(
                        nuevaOrganizacion.id,
                        nuevaOrganizacion.tipo_industria
                    );
                } catch (plantillasError) {
                    logger.warn('Error importando plantillas durante onboarding:', {
                        organizacion_id: nuevaOrganizacion.id,
                        error: plantillasError.message
                    });
                    // No fallar el onboarding por esto
                }
            }

            logger.info('Onboarding de organización completado', {
                organizacion_id: nuevaOrganizacion.id,
                nombre_comercial: nuevaOrganizacion.nombre_comercial,
                tipo_industria: nuevaOrganizacion.tipo_industria,
                plantillas_importadas: resultadoPlantillas?.servicios_importados || 0,
                ip: req.ip
            });

            ResponseHelper.success(res, {
                organizacion: nuevaOrganizacion,
                plantillas: resultadoPlantillas,
                siguiente_paso: 'Crear usuarios y profesionales para la organización'
            }, 'Onboarding completado exitosamente', 201);

        } catch (error) {
            logger.error('Error en onboarding de organización:', {
                error: error.message,
                body: req.body,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error en proceso de onboarding', 500);
        }
    }

    /**
     * Obtener métricas detalladas de organización para dashboard
     * GET /api/v1/organizaciones/:id/metricas
     */
    static async obtenerMetricas(req, res) {
        try {
            const { id } = req.params;
            const { periodo = 'mes' } = req.query;

            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de organización inválido', 400);
            }

            if (!['mes', 'semana', 'año'].includes(periodo)) {
                return ResponseHelper.error(res, 'Período debe ser: mes, semana o año', 400);
            }

            const metricas = await OrganizacionModel.obtenerMetricas(parseInt(id), periodo);

            logger.info('Métricas de organización obtenidas', {
                organizacion_id: parseInt(id),
                periodo: periodo,
                citas_total: metricas.resumen.citas_total,
                ingresos: metricas.financieras.ingresos_periodo
            });

            ResponseHelper.success(res, metricas, 'Métricas obtenidas exitosamente');

        } catch (error) {
            logger.error('Error al obtener métricas de organización:', {
                error: error.message,
                organizacion_id: req.params.id,
                periodo: req.query.periodo,
                ip: req.ip
            });

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
            const { id } = req.params;
            const { nuevo_plan, configuracion_plan } = req.body;

            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de organización inválido', 400);
            }

            if (!nuevo_plan) {
                return ResponseHelper.error(res, 'nuevo_plan es requerido', 400);
            }

            const planesValidos = ['trial', 'basico', 'profesional', 'empresarial', 'custom'];
            if (!planesValidos.includes(nuevo_plan)) {
                return ResponseHelper.error(res,
                    `Plan no válido. Opciones: ${planesValidos.join(', ')}`, 400);
            }

            const resultado = await OrganizacionModel.cambiarPlan(
                parseInt(id),
                nuevo_plan,
                configuracion_plan || {}
            );

            logger.info('Plan de organización cambiado via API', {
                organizacion_id: parseInt(id),
                plan_anterior: resultado.plan_anterior,
                plan_nuevo: resultado.plan_nuevo,
                precio_mensual: resultado.limites.precio_mensual,
                ip: req.ip
            });

            ResponseHelper.success(res, resultado, 'Plan cambiado exitosamente');

        } catch (error) {
            logger.error('Error al cambiar plan via API:', {
                error: error.message,
                organizacion_id: req.params.id,
                body: req.body,
                ip: req.ip
            });

            if (error.message.includes('no encontrada')) {
                return ResponseHelper.notFound(res, 'Organización no encontrada');
            }

            if (error.message.includes('no válido')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = OrganizacionController;