/**
 * HabilidadController - Enero 2026
 * Handlers HTTP para catálogo de habilidades y habilidades de empleados
 * Fase 4 del Plan de Empleados Competitivo
 */
const { CatalogoHabilidadesModel, HabilidadEmpleadoModel } = require('../models/habilidad.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const logger = require('../../../utils/logger');

// ====================================================================
// CONTROLADOR CATÁLOGO DE HABILIDADES
// ====================================================================

class CatalogoHabilidadesController {

    /**
     * GET /habilidades
     * Lista habilidades del catálogo de la organización
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            categoria: req.query.categoria || null,
            busqueda: req.query.q || null,
            limite: Math.min(parseInt(req.query.limit) || 100, 200),
            offset: Math.max(parseInt(req.query.offset) || 0, 0)
        };

        const habilidades = await CatalogoHabilidadesModel.listar(organizacionId, filtros);

        const conteoPorCategoria = await CatalogoHabilidadesModel.contarPorCategoria(organizacionId);

        return ResponseHelper.success(res, {
            habilidades,
            conteo_por_categoria: conteoPorCategoria,
            filtros_aplicados: filtros
        }, 'Catálogo de habilidades obtenido exitosamente');
    });

    /**
     * POST /habilidades
     * Crea una nueva habilidad en el catálogo
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const habilidadData = {
            organizacion_id: organizacionId,
            nombre: req.body.nombre,
            categoria: req.body.categoria,
            descripcion: req.body.descripcion || null,
            icono: req.body.icono || null,
            color: req.body.color || null,
            creado_por: usuarioId
        };

        const habilidad = await CatalogoHabilidadesModel.crear(habilidadData);

        logger.info(`📚 Habilidad creada en catálogo: ${habilidad.nombre} (ID: ${habilidad.id})`);

        return ResponseHelper.success(res, habilidad, 'Habilidad creada exitosamente', 201);
    });

    /**
     * GET /habilidades/:habId
     * Obtiene una habilidad del catálogo
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const habilidadId = parseInt(req.params.habId);
        const organizacionId = req.tenant.organizacionId;

        const habilidad = await CatalogoHabilidadesModel.obtenerPorId(organizacionId, habilidadId);

        if (!habilidad) {
            return ResponseHelper.notFound(res, 'Habilidad no encontrada');
        }

        return ResponseHelper.success(res, habilidad, 'Habilidad obtenida exitosamente');
    });

    /**
     * PUT /habilidades/:habId
     * Actualiza una habilidad del catálogo
     */
    static actualizar = asyncHandler(async (req, res) => {
        const habilidadId = parseInt(req.params.habId);
        const organizacionId = req.tenant.organizacionId;

        const habilidadExistente = await CatalogoHabilidadesModel.obtenerPorId(organizacionId, habilidadId);
        if (!habilidadExistente) {
            return ResponseHelper.notFound(res, 'Habilidad no encontrada');
        }

        const habilidad = await CatalogoHabilidadesModel.actualizar(
            organizacionId,
            habilidadId,
            req.body
        );

        logger.info(`📝 Habilidad actualizada: ${habilidad.nombre} (ID: ${habilidadId})`);

        return ResponseHelper.success(res, habilidad, 'Habilidad actualizada exitosamente');
    });

    /**
     * DELETE /habilidades/:habId
     * Soft delete de una habilidad del catálogo
     */
    static eliminar = asyncHandler(async (req, res) => {
        const habilidadId = parseInt(req.params.habId);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const habilidad = await CatalogoHabilidadesModel.obtenerPorId(organizacionId, habilidadId);
        if (!habilidad) {
            return ResponseHelper.notFound(res, 'Habilidad no encontrada');
        }

        const eliminado = await CatalogoHabilidadesModel.eliminar(
            organizacionId,
            habilidadId,
            usuarioId
        );

        if (!eliminado) {
            return ResponseHelper.error(res, 'No se pudo eliminar la habilidad', 400);
        }

        logger.info(`🗑️ Habilidad eliminada del catálogo: ${habilidad.nombre} (ID: ${habilidadId})`);

        return ResponseHelper.success(res, { id: habilidadId }, 'Habilidad eliminada exitosamente');
    });

    /**
     * GET /habilidades/:habId/profesionales
     * Lista profesionales con una habilidad específica
     */
    static listarProfesionales = asyncHandler(async (req, res) => {
        const habilidadId = parseInt(req.params.habId);
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            nivel_minimo: req.query.nivel_minimo || null,
            verificado: req.query.verificado !== undefined
                ? req.query.verificado === 'true'
                : null,
            limite: Math.min(parseInt(req.query.limit) || 50, 100),
            offset: Math.max(parseInt(req.query.offset) || 0, 0)
        };

        const profesionales = await HabilidadEmpleadoModel.buscarProfesionalesPorHabilidad(
            organizacionId,
            habilidadId,
            filtros
        );

        return ResponseHelper.success(res, {
            profesionales,
            filtros_aplicados: filtros
        }, 'Profesionales obtenidos exitosamente');
    });
}

// ====================================================================
// CONTROLADOR HABILIDADES DE EMPLEADO
// ====================================================================

class HabilidadEmpleadoController {

    /**
     * GET /profesionales/:id/habilidades
     * Lista habilidades de un profesional
     */
    static listar = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            categoria: req.query.categoria || null,
            nivel: req.query.nivel || null,
            verificado: req.query.verificado !== undefined
                ? req.query.verificado === 'true'
                : null,
            limite: Math.min(parseInt(req.query.limit) || 50, 100),
            offset: Math.max(parseInt(req.query.offset) || 0, 0)
        };

        const habilidades = await HabilidadEmpleadoModel.listarPorProfesional(
            organizacionId,
            profesionalId,
            filtros
        );

        const conteo = await HabilidadEmpleadoModel.contarPorProfesional(
            organizacionId,
            profesionalId
        );

        return ResponseHelper.success(res, {
            habilidades,
            conteo,
            filtros_aplicados: filtros
        }, 'Habilidades obtenidas exitosamente');
    });

    /**
     * POST /profesionales/:id/habilidades
     * Asigna una habilidad a un empleado
     */
    static asignar = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const habilidadData = {
            organizacion_id: organizacionId,
            profesional_id: profesionalId,
            habilidad_id: req.body.habilidad_id,
            nivel: req.body.nivel || 'basico',
            anios_experiencia: req.body.anios_experiencia || 0,
            notas: req.body.notas || null,
            certificaciones: req.body.certificaciones || null,
            creado_por: usuarioId
        };

        const habilidadEmpleado = await HabilidadEmpleadoModel.asignar(habilidadData);

        const habilidadCompleta = await HabilidadEmpleadoModel.obtenerPorId(
            organizacionId,
            habilidadEmpleado.id
        );

        logger.info(`🏅 Habilidad asignada a profesional ${profesionalId}: ID ${habilidadEmpleado.habilidad_id}`);

        return ResponseHelper.success(res, habilidadCompleta, 'Habilidad asignada exitosamente', 201);
    });

    /**
     * POST /profesionales/:id/habilidades/batch
     * Asigna múltiples habilidades a un empleado
     */
    static asignarBatch = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { habilidades } = req.body;

        if (!Array.isArray(habilidades) || habilidades.length === 0) {
            return ResponseHelper.error(res, 'Se requiere un array de habilidades', 400);
        }

        const resultados = await HabilidadEmpleadoModel.asignarBatch(
            organizacionId,
            profesionalId,
            habilidades,
            usuarioId
        );

        logger.info(`🏅 ${resultados.length} habilidades asignadas a profesional ${profesionalId}`);

        return ResponseHelper.success(res, {
            asignadas: resultados.length,
            habilidades: resultados
        }, 'Habilidades asignadas exitosamente', 201);
    });

    /**
     * GET /profesionales/:id/habilidades/:habEmpId
     * Obtiene una habilidad específica de un empleado
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const habilidadEmpleadoId = parseInt(req.params.habEmpId);
        const organizacionId = req.tenant.organizacionId;

        const habilidad = await HabilidadEmpleadoModel.obtenerPorId(organizacionId, habilidadEmpleadoId);

        if (!habilidad) {
            return ResponseHelper.notFound(res, 'Habilidad de empleado no encontrada');
        }

        return ResponseHelper.success(res, habilidad, 'Habilidad obtenida exitosamente');
    });

    /**
     * PUT /profesionales/:id/habilidades/:habEmpId
     * Actualiza una habilidad de empleado
     */
    static actualizar = asyncHandler(async (req, res) => {
        const habilidadEmpleadoId = parseInt(req.params.habEmpId);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const habilidadExistente = await HabilidadEmpleadoModel.obtenerPorId(organizacionId, habilidadEmpleadoId);
        if (!habilidadExistente) {
            return ResponseHelper.notFound(res, 'Habilidad de empleado no encontrada');
        }

        const habilidad = await HabilidadEmpleadoModel.actualizar(
            organizacionId,
            habilidadEmpleadoId,
            req.body,
            usuarioId
        );

        const habilidadCompleta = await HabilidadEmpleadoModel.obtenerPorId(
            organizacionId,
            habilidad.id
        );

        logger.info(`📝 Habilidad de empleado actualizada: ID ${habilidadEmpleadoId}`);

        return ResponseHelper.success(res, habilidadCompleta, 'Habilidad actualizada exitosamente');
    });

    /**
     * DELETE /profesionales/:id/habilidades/:habEmpId
     * Elimina una habilidad de un empleado
     */
    static eliminar = asyncHandler(async (req, res) => {
        const habilidadEmpleadoId = parseInt(req.params.habEmpId);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const habilidad = await HabilidadEmpleadoModel.obtenerPorId(organizacionId, habilidadEmpleadoId);
        if (!habilidad) {
            return ResponseHelper.notFound(res, 'Habilidad de empleado no encontrada');
        }

        const eliminado = await HabilidadEmpleadoModel.eliminar(
            organizacionId,
            habilidadEmpleadoId,
            usuarioId
        );

        if (!eliminado) {
            return ResponseHelper.error(res, 'No se pudo eliminar la habilidad', 400);
        }

        logger.info(`🗑️ Habilidad eliminada de empleado: ID ${habilidadEmpleadoId}`);

        return ResponseHelper.success(res, { id: habilidadEmpleadoId }, 'Habilidad eliminada exitosamente');
    });

    /**
     * PATCH /profesionales/:id/habilidades/:habEmpId/verificar
     * Verifica/desverifica una habilidad de empleado
     */
    static verificar = asyncHandler(async (req, res) => {
        const habilidadEmpleadoId = parseInt(req.params.habEmpId);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { verificado } = req.body;

        const habilidadExistente = await HabilidadEmpleadoModel.obtenerPorId(organizacionId, habilidadEmpleadoId);
        if (!habilidadExistente) {
            return ResponseHelper.notFound(res, 'Habilidad de empleado no encontrada');
        }

        const habilidad = await HabilidadEmpleadoModel.verificar(
            organizacionId,
            habilidadEmpleadoId,
            verificado,
            usuarioId
        );

        const habilidadCompleta = await HabilidadEmpleadoModel.obtenerPorId(
            organizacionId,
            habilidad.id
        );

        const accion = verificado ? 'verificada' : 'desverificada';
        logger.info(`✅ Habilidad ${accion}: ID ${habilidadEmpleadoId} por usuario ${usuarioId}`);

        return ResponseHelper.success(res, habilidadCompleta, `Habilidad ${accion} exitosamente`);
    });
}

module.exports = {
    CatalogoHabilidadesController,
    HabilidadEmpleadoController
};
