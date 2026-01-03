/**
 * OnboardingController - Enero 2026
 * Handlers HTTP para onboarding de empleados
 * Fase 5 del Plan de Empleados Competitivo
 */
const OnboardingModel = require('../models/onboarding.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const logger = require('../../../utils/logger');

class OnboardingController {

    // =====================================================
    // PLANTILLAS
    // =====================================================

    /**
     * GET /onboarding-empleados/plantillas
     * Lista plantillas de onboarding
     */
    static listarPlantillas = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            departamento_id: req.query.departamento_id ? parseInt(req.query.departamento_id) : null,
            puesto_id: req.query.puesto_id ? parseInt(req.query.puesto_id) : null,
            activo: req.query.activo !== undefined ? req.query.activo === 'true' : null,
            limite: Math.min(parseInt(req.query.limite) || 50, 100),
            offset: Math.max(parseInt(req.query.offset) || 0, 0)
        };

        const plantillas = await OnboardingModel.listarPlantillas(organizacionId, filtros);

        return ResponseHelper.success(res, {
            plantillas,
            total: plantillas.length,
            filtros_aplicados: filtros
        }, 'Plantillas obtenidas exitosamente');
    });

    /**
     * POST /onboarding-empleados/plantillas
     * Crea una nueva plantilla de onboarding
     */
    static crearPlantilla = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const plantillaData = {
            organizacion_id: organizacionId,
            nombre: req.body.nombre,
            descripcion: req.body.descripcion || null,
            departamento_id: req.body.departamento_id || null,
            puesto_id: req.body.puesto_id || null,
            duracion_dias: req.body.duracion_dias || 30,
            activo: req.body.activo !== false,
            creado_por: usuarioId
        };

        const plantilla = await OnboardingModel.crearPlantilla(plantillaData);

        const plantillaCompleta = await OnboardingModel.obtenerPlantillaPorId(
            organizacionId,
            plantilla.id
        );

        logger.info(`📋 Plantilla onboarding creada: "${plantilla.nombre}" (ID: ${plantilla.id})`);

        return ResponseHelper.success(res, plantillaCompleta, 'Plantilla creada exitosamente', 201);
    });

    /**
     * GET /onboarding-empleados/plantillas/:id
     * Obtiene una plantilla con sus tareas
     */
    static obtenerPlantilla = asyncHandler(async (req, res) => {
        const plantillaId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;

        const plantilla = await OnboardingModel.obtenerPlantillaPorId(organizacionId, plantillaId);

        if (!plantilla) {
            return ResponseHelper.notFound(res, 'Plantilla no encontrada');
        }

        return ResponseHelper.success(res, plantilla, 'Plantilla obtenida exitosamente');
    });

    /**
     * PUT /onboarding-empleados/plantillas/:id
     * Actualiza una plantilla
     */
    static actualizarPlantilla = asyncHandler(async (req, res) => {
        const plantillaId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const plantillaExistente = await OnboardingModel.obtenerPlantillaPorId(organizacionId, plantillaId);
        if (!plantillaExistente) {
            return ResponseHelper.notFound(res, 'Plantilla no encontrada');
        }

        await OnboardingModel.actualizarPlantilla(
            organizacionId,
            plantillaId,
            req.body,
            usuarioId
        );

        const plantillaActualizada = await OnboardingModel.obtenerPlantillaPorId(
            organizacionId,
            plantillaId
        );

        logger.info(`📝 Plantilla onboarding actualizada: "${plantillaActualizada.nombre}" (ID: ${plantillaId})`);

        return ResponseHelper.success(res, plantillaActualizada, 'Plantilla actualizada exitosamente');
    });

    /**
     * DELETE /onboarding-empleados/plantillas/:id
     * Elimina (soft delete) una plantilla
     */
    static eliminarPlantilla = asyncHandler(async (req, res) => {
        const plantillaId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const plantilla = await OnboardingModel.obtenerPlantillaPorId(organizacionId, plantillaId);
        if (!plantilla) {
            return ResponseHelper.notFound(res, 'Plantilla no encontrada');
        }

        const eliminado = await OnboardingModel.eliminarPlantilla(
            organizacionId,
            plantillaId,
            usuarioId
        );

        if (!eliminado) {
            return ResponseHelper.error(res, 'No se pudo eliminar la plantilla', 400);
        }

        logger.info(`🗑️ Plantilla onboarding eliminada: "${plantilla.nombre}" (ID: ${plantillaId})`);

        return ResponseHelper.success(res, { id: plantillaId }, 'Plantilla eliminada exitosamente');
    });

    /**
     * GET /onboarding-empleados/plantillas/sugeridas/:profesionalId
     * Obtiene plantillas sugeridas para un profesional
     */
    static obtenerPlantillasSugeridas = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.profesionalId);
        const organizacionId = req.tenant.organizacionId;

        const plantillas = await OnboardingModel.obtenerPlantillasSugeridas(
            organizacionId,
            profesionalId
        );

        return ResponseHelper.success(res, {
            plantillas,
            total: plantillas.length
        }, 'Plantillas sugeridas obtenidas exitosamente');
    });

    // =====================================================
    // TAREAS DE PLANTILLA
    // =====================================================

    /**
     * POST /onboarding-empleados/plantillas/:id/tareas
     * Crea una nueva tarea en una plantilla
     */
    static crearTarea = asyncHandler(async (req, res) => {
        const plantillaId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        // Verificar que la plantilla existe
        const plantilla = await OnboardingModel.obtenerPlantillaPorId(organizacionId, plantillaId);
        if (!plantilla) {
            return ResponseHelper.notFound(res, 'Plantilla no encontrada');
        }

        const tareaData = {
            organizacion_id: organizacionId,
            plantilla_id: plantillaId,
            titulo: req.body.titulo,
            descripcion: req.body.descripcion || null,
            responsable_tipo: req.body.responsable_tipo || 'empleado',
            dias_limite: req.body.dias_limite !== undefined ? req.body.dias_limite : null,
            orden: req.body.orden,
            es_obligatoria: req.body.es_obligatoria !== false,
            url_recurso: req.body.url_recurso || null,
            creado_por: usuarioId
        };

        const tarea = await OnboardingModel.crearTarea(tareaData);

        const tareaCompleta = await OnboardingModel.obtenerTareaPorId(organizacionId, tarea.id);

        logger.info(`✅ Tarea onboarding creada: "${tarea.titulo}" en plantilla ${plantillaId}`);

        return ResponseHelper.success(res, tareaCompleta, 'Tarea creada exitosamente', 201);
    });

    /**
     * PUT /onboarding-empleados/tareas/:tareaId
     * Actualiza una tarea
     */
    static actualizarTarea = asyncHandler(async (req, res) => {
        const tareaId = parseInt(req.params.tareaId);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const tareaExistente = await OnboardingModel.obtenerTareaPorId(organizacionId, tareaId);
        if (!tareaExistente) {
            return ResponseHelper.notFound(res, 'Tarea no encontrada');
        }

        await OnboardingModel.actualizarTarea(
            organizacionId,
            tareaId,
            req.body,
            usuarioId
        );

        const tareaActualizada = await OnboardingModel.obtenerTareaPorId(organizacionId, tareaId);

        logger.info(`📝 Tarea onboarding actualizada: "${tareaActualizada.titulo}" (ID: ${tareaId})`);

        return ResponseHelper.success(res, tareaActualizada, 'Tarea actualizada exitosamente');
    });

    /**
     * DELETE /onboarding-empleados/tareas/:tareaId
     * Elimina (soft delete) una tarea
     */
    static eliminarTarea = asyncHandler(async (req, res) => {
        const tareaId = parseInt(req.params.tareaId);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const tarea = await OnboardingModel.obtenerTareaPorId(organizacionId, tareaId);
        if (!tarea) {
            return ResponseHelper.notFound(res, 'Tarea no encontrada');
        }

        const eliminado = await OnboardingModel.eliminarTarea(
            organizacionId,
            tareaId,
            usuarioId
        );

        if (!eliminado) {
            return ResponseHelper.error(res, 'No se pudo eliminar la tarea', 400);
        }

        logger.info(`🗑️ Tarea onboarding eliminada: "${tarea.titulo}" (ID: ${tareaId})`);

        return ResponseHelper.success(res, { id: tareaId }, 'Tarea eliminada exitosamente');
    });

    /**
     * PATCH /onboarding-empleados/plantillas/:id/tareas/reordenar
     * Reordena las tareas de una plantilla
     */
    static reordenarTareas = asyncHandler(async (req, res) => {
        const plantillaId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return ResponseHelper.error(res, 'Se requiere un array de items para reordenar', 400);
        }

        const reordenado = await OnboardingModel.reordenarTareas(
            organizacionId,
            plantillaId,
            items
        );

        if (!reordenado) {
            return ResponseHelper.error(res, 'No se pudo reordenar', 400);
        }

        logger.info(`🔄 Tareas reordenadas en plantilla ${plantillaId}`);

        return ResponseHelper.success(res, { success: true }, 'Tareas reordenadas exitosamente');
    });

    // =====================================================
    // PROGRESO DE EMPLEADO
    // =====================================================

    /**
     * POST /profesionales/:id/onboarding/aplicar
     * Aplica una plantilla a un profesional
     */
    static aplicarPlantilla = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;
        const { plantilla_id } = req.body;

        const resultado = await OnboardingModel.aplicarPlantilla(
            organizacionId,
            profesionalId,
            plantilla_id
        );

        logger.info(`📋 Plantilla "${resultado.plantilla.nombre}" aplicada a ${resultado.profesional.nombre_completo} (${resultado.tareas_creadas} tareas)`);

        return ResponseHelper.success(res, resultado, 'Plantilla aplicada exitosamente', 201);
    });

    /**
     * GET /profesionales/:id/onboarding/progreso
     * Obtiene el progreso de onboarding de un profesional
     */
    static obtenerProgreso = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            solo_pendientes: req.query.solo_pendientes === 'true'
        };

        const progreso = await OnboardingModel.obtenerProgreso(
            organizacionId,
            profesionalId,
            filtros
        );

        return ResponseHelper.success(res, progreso, 'Progreso obtenido exitosamente');
    });

    /**
     * PATCH /profesionales/:id/onboarding/progreso/:tareaId
     * Marca una tarea como completada o pendiente
     */
    static marcarTarea = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const tareaId = parseInt(req.params.tareaId);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = parseInt(req.user.id);

        const datos = {
            completado: req.body.completado !== false,
            notas: req.body.notas || null,
            completado_por: usuarioId
        };

        const progreso = await OnboardingModel.marcarTareaCompletada(
            organizacionId,
            profesionalId,
            tareaId,
            datos
        );

        const estado = datos.completado ? 'completada' : 'pendiente';
        logger.info(`✅ Tarea onboarding marcada como ${estado} (profesional: ${profesionalId}, tarea: ${tareaId})`);

        return ResponseHelper.success(res, progreso, `Tarea marcada como ${estado} exitosamente`);
    });

    /**
     * DELETE /profesionales/:id/onboarding
     * Elimina todo el progreso de onboarding de un profesional
     */
    static eliminarProgreso = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;

        const eliminados = await OnboardingModel.eliminarProgreso(
            organizacionId,
            profesionalId
        );

        logger.info(`🗑️ Progreso onboarding eliminado para profesional ${profesionalId} (${eliminados} registros)`);

        return ResponseHelper.success(res, {
            profesional_id: profesionalId,
            registros_eliminados: eliminados
        }, 'Progreso de onboarding eliminado exitosamente');
    });

    // =====================================================
    // DASHBOARD RRHH
    // =====================================================

    /**
     * GET /onboarding-empleados/dashboard
     * Obtiene el dashboard de onboarding para RRHH
     */
    static obtenerDashboard = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            departamento_id: req.query.departamento_id ? parseInt(req.query.departamento_id) : null,
            estado_empleado: req.query.estado_empleado || null,
            limite: Math.min(parseInt(req.query.limite) || 50, 100),
            offset: Math.max(parseInt(req.query.offset) || 0, 0)
        };

        const dashboard = await OnboardingModel.obtenerDashboard(organizacionId, filtros);

        // Agregar conteos por estado
        const conteosPorEstado = await OnboardingModel.contarPorEstado(organizacionId);

        return ResponseHelper.success(res, {
            ...dashboard,
            conteos_por_estado: conteosPorEstado,
            filtros_aplicados: filtros
        }, 'Dashboard obtenido exitosamente');
    });

    /**
     * GET /onboarding-empleados/vencidas
     * Obtiene tareas vencidas de todos los empleados
     */
    static obtenerTareasVencidas = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            solo_obligatorias: req.query.solo_obligatorias === 'true',
            limite: Math.min(parseInt(req.query.limite) || 100, 200),
            offset: Math.max(parseInt(req.query.offset) || 0, 0)
        };

        const tareasVencidas = await OnboardingModel.obtenerTareasVencidas(organizacionId, filtros);

        return ResponseHelper.success(res, {
            tareas: tareasVencidas,
            total: tareasVencidas.length,
            filtros_aplicados: filtros
        }, 'Tareas vencidas obtenidas exitosamente');
    });

}

module.exports = OnboardingController;
