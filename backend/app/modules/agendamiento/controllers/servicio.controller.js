// Controller de Servicios - Gestión CRUD multi-tenant

const ServicioModel = require('../models/servicio.model');
const { asyncHandler } = require('../../../middleware');
const { ResponseHelper, ParseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class ServicioController {
    static crear = asyncHandler(async (req, res) => {
        const { precios_moneda, ...servicioData } = req.body;

        const nuevoServicio = await ServicioModel.crear(
            req.tenant.organizacionId,
            servicioData
        );

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
    /**
     * Crear múltiples servicios en una transacción
     * POST /servicios/bulk-create
     *
     * Errores manejados automáticamente por asyncHandler:
     * - PlanLimitExceededError → 403 (límite del plan)
     * - DuplicateResourceError → 409 (nombres duplicados)
     * - InvalidProfessionalsError → 400 (profesionales inválidos)
     */
    static bulkCrear = asyncHandler(async (req, res) => {
        const { servicios } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const serviciosCreados = await ServicioModel.crearBulk(
            organizacionId,
            servicios
        );

        return ResponseHelper.success(res, {
            servicios: serviciosCreados,
            total_creados: serviciosCreados.length
        }, `${serviciosCreados.length} servicios creados exitosamente`, 201);
    });

    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const servicio = await ServicioModel.buscarPorId(req.tenant.organizacionId, parseInt(id));

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
        // Parseo con ParseHelper - centralizado y consistente
        const filtros = ParseHelper.parseFilters(req.query, {
            activo: 'boolean',
            categoria: 'string',
            busqueda: 'string',
            tags: 'array',
            precio_min: 'float',
            precio_max: 'float'
        });

        const { pagination, ordering } = ParseHelper.parseListParams(
            req.query,
            {},
            {
                allowedOrderFields: ['nombre', 'precio', 'duracion', 'creado_en'],
                defaultOrderField: 'nombre'
            }
        );

        const paginacion = {
            pagina: pagination.page,
            limite: pagination.limit,
            orden: ordering.orderBy,
            direccion: ordering.orderDirection
        };

        const resultado = await ServicioModel.listar(req.tenant.organizacionId, filtros, paginacion);

        return ResponseHelper.success(res, resultado, 'Servicios listados exitosamente');
    });

    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { precios_moneda, ...servicioData } = req.body;
        delete servicioData.organizacion_id;

        const servicioActualizado = await ServicioModel.actualizar(
            req.tenant.organizacionId,
            parseInt(id),
            servicioData
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
        const eliminado = await ServicioModel.eliminar(req.tenant.organizacionId, parseInt(id));

        if (!eliminado) {
            return ResponseHelper.error(res, 'Servicio no encontrado', 404);
        }

        return ResponseHelper.success(res, null, 'Servicio eliminado exitosamente');
    });

    static asignarProfesional = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { profesional_id, configuracion = {} } = req.body;

        const asignacion = await ServicioModel.asignarProfesional(
            req.tenant.organizacionId,
            parseInt(id),
            parseInt(profesional_id),
            configuracion
        );

        return ResponseHelper.success(res, asignacion, 'Profesional asignado al servicio exitosamente', 201);
    });

    static desasignarProfesional = asyncHandler(async (req, res) => {
        const { id, profesional_id } = req.params;

        const desasignado = await ServicioModel.desasignarProfesional(
            req.tenant.organizacionId,
            parseInt(id),
            parseInt(profesional_id)
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
            req.tenant.organizacionId,
            parseInt(id),
            solo_activos
        );

        return ResponseHelper.success(res, profesionales, 'Profesionales del servicio obtenidos exitosamente');
    });

    static obtenerServiciosPorProfesional = asyncHandler(async (req, res) => {
        const { profesional_id } = req.params;
        const solo_activos = req.query.solo_activos !== 'false';

        const servicios = await ServicioModel.obtenerServiciosPorProfesional(
            req.tenant.organizacionId,
            parseInt(profesional_id),
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
        const eliminado = await ServicioModel.eliminarPermanente(req.tenant.organizacionId, parseInt(id));

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

    // =====================================================================
    // ROUND-ROBIN: ORDEN DE PROFESIONALES (Ene 2026)
    // =====================================================================

    /**
     * Obtiene profesionales de un servicio con orden de rotación
     * @route GET /api/v1/servicios/:id/profesionales/orden
     */
    static obtenerProfesionalesConOrden = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const profesionales = await ServicioModel.obtenerProfesionalesConOrden(
            parseInt(id),
            req.tenant.organizacionId
        );

        return ResponseHelper.success(
            res,
            profesionales,
            'Profesionales con orden de rotación obtenidos exitosamente'
        );
    });

    /**
     * Actualiza el orden de rotación de profesionales para un servicio
     * @route PUT /api/v1/servicios/:id/profesionales/orden
     * @body { orden: [{profesional_id: number, orden: number}] }
     */
    static actualizarOrdenProfesionales = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { orden } = req.body;

        if (!Array.isArray(orden) || orden.length === 0) {
            return ResponseHelper.error(res, 'Se requiere un array de orden', 400);
        }

        // Validar estructura del array
        for (const item of orden) {
            if (!item.profesional_id || item.orden === undefined) {
                return ResponseHelper.error(
                    res,
                    'Cada elemento debe tener profesional_id y orden',
                    400
                );
            }
        }

        try {
            const profesionalesActualizados = await ServicioModel.actualizarOrdenProfesionales(
                parseInt(id),
                orden,
                req.tenant.organizacionId
            );

            return ResponseHelper.success(
                res,
                profesionalesActualizados,
                'Orden de profesionales actualizado exitosamente'
            );
        } catch (error) {
            if (error.message.includes('no encontrado') || error.message.includes('no asignados')) {
                return ResponseHelper.error(res, error.message, 400);
            }
            throw error;
        }
    });
}

module.exports = ServicioController;
