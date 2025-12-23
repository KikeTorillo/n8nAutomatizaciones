// Controller de Servicios - Gestión CRUD multi-tenant

const ServicioModel = require('../models/servicio.model');
const { asyncHandler } = require('../../../middleware');
const { ResponseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class ServicioController {
    static crear = asyncHandler(async (req, res) => {
        const { precios_moneda, ...servicioData } = req.body;

        const nuevoServicio = await ServicioModel.crear({
            ...servicioData,
            organizacion_id: req.tenant.organizacionId
        });

        // Guardar precios multi-moneda si se proporcionan
        if (precios_moneda && Array.isArray(precios_moneda) && precios_moneda.length > 0) {
            nuevoServicio.precios_moneda = await ServicioModel.guardarPreciosMoneda(
                nuevoServicio.id,
                precios_moneda,
                req.tenant.organizacionId
            );
        }

        return ResponseHelper.success(res, nuevoServicio, 'Servicio creado exitosamente', 201);
    });

    /**
     * Crea múltiples servicios en una sola transacción (ALL or NONE)
     * Valida límites del plan ANTES de crear cualquier registro
     *
     * @route POST /api/v1/servicios/bulk-create
     * @body { servicios: Array<Object> }
     * @returns 201 - Servicios creados exitosamente
     * @returns 403 - Límite del plan excedido
     * @returns 409 - Nombres duplicados
     * @returns 400 - Validación fallida
     */
    static bulkCrear = asyncHandler(async (req, res) => {
        const { servicios } = req.body;
        const organizacionId = req.tenant.organizacionId;

        try {
            const serviciosCreados = await ServicioModel.crearBulk(
                organizacionId,
                servicios
            );

            return ResponseHelper.success(res, {
                servicios: serviciosCreados,
                total_creados: serviciosCreados.length
            }, `${serviciosCreados.length} servicios creados exitosamente`, 201);

        } catch (error) {
            const errorMsg = error.message.toLowerCase();

            // Error de límite del plan
            if (errorMsg.includes('límite') || errorMsg.includes('upgrade tu plan')) {
                return ResponseHelper.error(res, error.message, 403, {
                    codigo_error: 'PLAN_LIMIT_REACHED',
                    accion_requerida: 'upgrade_plan'
                });
            }

            // Error de nombres duplicados
            if (errorMsg.includes('ya existen servicios') || errorMsg.includes('nombres duplicados')) {
                return ResponseHelper.error(res, error.message, 409, {
                    codigo_error: 'DUPLICATE_SERVICES'
                });
            }

            // Error de validación de profesionales
            if (errorMsg.includes('profesionales no existen')) {
                return ResponseHelper.error(res, error.message, 400, {
                    codigo_error: 'INVALID_PROFESSIONALS'
                });
            }

            // Otros errores se propagan para manejo global
            throw error;
        }
    });

    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const servicio = await ServicioModel.obtenerPorId(parseInt(id), req.tenant.organizacionId);

        if (!servicio) {
            return ResponseHelper.error(res, 'Servicio no encontrado', 404);
        }

        // Obtener precios multi-moneda
        servicio.precios_moneda = await ServicioModel.obtenerPreciosMoneda(
            servicio.id,
            req.tenant.organizacionId
        );

        return ResponseHelper.success(res, servicio, 'Servicio obtenido exitosamente');
    });

    static listar = asyncHandler(async (req, res) => {
        const filtros = {};

        // ⚠️ IMPORTANTE: Joi schema convierte query params a boolean
        // req.query.activo puede llegar como boolean true/false (post-validación Joi)
        // o como string "true"/"false" (si no pasa por validación)
        if (req.query.activo !== undefined) {
            filtros.activo = req.query.activo === 'true' || req.query.activo === true;
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

        return ResponseHelper.success(res, resultado, 'Servicios listados exitosamente');
    });

    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { precios_moneda, ...servicioData } = req.body;
        delete servicioData.organizacion_id;

        const servicioActualizado = await ServicioModel.actualizar(
            parseInt(id),
            servicioData,
            req.tenant.organizacionId
        );

        if (!servicioActualizado) {
            return ResponseHelper.error(res, 'Servicio no encontrado', 404);
        }

        // Guardar precios multi-moneda si se proporcionan
        if (precios_moneda && Array.isArray(precios_moneda) && precios_moneda.length > 0) {
            servicioActualizado.precios_moneda = await ServicioModel.guardarPreciosMoneda(
                parseInt(id),
                precios_moneda,
                req.tenant.organizacionId
            );
        }

        return ResponseHelper.success(res, servicioActualizado, 'Servicio actualizado exitosamente');
    });

    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const eliminado = await ServicioModel.eliminar(parseInt(id), req.tenant.organizacionId);

        if (!eliminado) {
            return ResponseHelper.error(res, 'Servicio no encontrado', 404);
        }

        return ResponseHelper.success(res, null, 'Servicio eliminado exitosamente');
    });

    static asignarProfesional = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { profesional_id, configuracion = {} } = req.body;

        const asignacion = await ServicioModel.asignarProfesional(
            parseInt(id),
            parseInt(profesional_id),
            configuracion,
            req.tenant.organizacionId
        );

        return ResponseHelper.success(res, asignacion, 'Profesional asignado al servicio exitosamente', 201);
    });

    static desasignarProfesional = asyncHandler(async (req, res) => {
        const { id, profesional_id } = req.params;

        const desasignado = await ServicioModel.desasignarProfesional(
            parseInt(id),
            parseInt(profesional_id),
            req.tenant.organizacionId
        );

        if (!desasignado) {
            return ResponseHelper.error(res, 'Asignación no encontrada', 404);
        }

        return ResponseHelper.success(res, null, 'Profesional desasignado del servicio exitosamente');
    });

    static obtenerProfesionales = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const solo_activos = req.query.solo_activos !== 'false';

        const profesionales = await ServicioModel.obtenerProfesionales(
            parseInt(id),
            req.tenant.organizacionId,
            solo_activos
        );

        return ResponseHelper.success(res, profesionales, 'Profesionales del servicio obtenidos exitosamente');
    });

    static obtenerServiciosPorProfesional = asyncHandler(async (req, res) => {
        const { profesional_id } = req.params;
        const solo_activos = req.query.solo_activos !== 'false';

        const servicios = await ServicioModel.obtenerServiciosPorProfesional(
            parseInt(profesional_id),
            req.tenant.organizacionId,
            solo_activos
        );

        return ResponseHelper.success(res, servicios, 'Servicios del profesional obtenidos exitosamente');
    });

    static buscar = asyncHandler(async (req, res) => {
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

        return ResponseHelper.success(res, servicios, 'Búsqueda de servicios completada exitosamente');
    });

    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const estadisticas = await ServicioModel.obtenerEstadisticas(req.tenant.organizacionId);

        return ResponseHelper.success(res, estadisticas, 'Estadísticas de servicios obtenidas exitosamente');
    });

    static crearDesdeePlantilla = asyncHandler(async (req, res) => {
        const { plantilla_id, configuracion_personalizada = {} } = req.body;

        const nuevoServicio = await ServicioModel.crearDesdeePlantilla(
            req.tenant.organizacionId,
            parseInt(plantilla_id),
            configuracion_personalizada
        );

        return ResponseHelper.success(res, nuevoServicio, 'Servicio creado desde plantilla exitosamente', 201);
    });

    static eliminarPermanente = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const eliminado = await ServicioModel.eliminarPermanente(parseInt(id), req.tenant.organizacionId);

        if (!eliminado) {
            return ResponseHelper.error(res, 'Servicio no encontrado', 404);
        }

        return ResponseHelper.success(res, null, 'Servicio eliminado permanentemente');
    });

    /**
     * Obtiene estadísticas de asignaciones servicio-profesional
     * @route GET /api/servicios/estadisticas/asignaciones
     */
    static obtenerEstadisticasAsignaciones = asyncHandler(async (req, res) => {
        const stats = await ServicioModel.obtenerEstadisticasAsignaciones(
            req.tenant.organizacionId
        );

        return ResponseHelper.success(
            res,
            stats,
            'Estadísticas de asignaciones obtenidas exitosamente'
        );
    });
}

module.exports = ServicioController;
