/**
 * EducacionController - Enero 2026
 * Handlers HTTP para educación formal de empleados
 * Fase 4 del Plan de Empleados Competitivo
 */
const EducacionFormalModel = require('../models/educacion.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const logger = require('../../../utils/logger');

class EducacionController {

    /**
     * GET /profesionales/:id/educacion
     * Lista educación formal de un profesional
     */
    static listar = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            nivel: req.query.nivel || null,
            en_curso: req.query.en_curso !== undefined
                ? req.query.en_curso === 'true'
                : null,
            limite: Math.min(parseInt(req.query.limit) || 20, 100),
            offset: Math.max(parseInt(req.query.offset) || 0, 0)
        };

        const educacion = await EducacionFormalModel.listarPorProfesional(
            organizacionId,
            profesionalId,
            filtros
        );

        const conteo = await EducacionFormalModel.contarPorProfesional(
            organizacionId,
            profesionalId
        );

        return ResponseHelper.success(res, {
            educaciones: educacion, // FIX BUG-001: usar plural para consistencia
            conteo,
            filtros_aplicados: filtros
        }, 'Educación obtenida exitosamente');
    });

    /**
     * POST /profesionales/:id/educacion
     * Crea un nuevo registro de educación formal
     */
    static crear = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const educacionData = {
            organizacion_id: organizacionId,
            profesional_id: profesionalId,
            institucion: req.body.institucion,
            titulo: req.body.titulo,
            nivel: req.body.nivel,
            campo_estudio: req.body.campo_estudio || null,
            fecha_inicio: req.body.fecha_inicio,
            fecha_fin: req.body.fecha_fin || null,
            en_curso: req.body.en_curso || false,
            descripcion: req.body.descripcion || null,
            promedio: req.body.promedio || null,
            numero_cedula: req.body.numero_cedula || null,
            ubicacion: req.body.ubicacion || null,
            creado_por: usuarioId
        };

        const educacion = await EducacionFormalModel.crear(educacionData);

        const educacionCompleta = await EducacionFormalModel.obtenerPorId(
            organizacionId,
            educacion.id
        );

        logger.info(`[Educacion.crear] Educación creada: ${educacion.titulo} en ${educacion.institucion} (ID: ${educacion.id})`);

        return ResponseHelper.success(res, educacionCompleta, 'Educación creada exitosamente', 201);
    });

    /**
     * GET /profesionales/:id/educacion/:eduId
     * Obtiene un registro de educación específico
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const educacionId = parseInt(req.params.eduId);
        const organizacionId = req.tenant.organizacionId;

        const educacion = await EducacionFormalModel.obtenerPorId(organizacionId, educacionId);

        if (!educacion) {
            return ResponseHelper.notFound(res, 'Educación no encontrada');
        }

        return ResponseHelper.success(res, educacion, 'Educación obtenida exitosamente');
    });

    /**
     * PUT /profesionales/:id/educacion/:eduId
     * Actualiza un registro de educación
     */
    static actualizar = asyncHandler(async (req, res) => {
        const educacionId = parseInt(req.params.eduId);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const educacionExistente = await EducacionFormalModel.obtenerPorId(organizacionId, educacionId);
        if (!educacionExistente) {
            return ResponseHelper.notFound(res, 'Educación no encontrada');
        }

        const educacion = await EducacionFormalModel.actualizar(
            organizacionId,
            educacionId,
            req.body,
            usuarioId
        );

        const educacionCompleta = await EducacionFormalModel.obtenerPorId(
            organizacionId,
            educacion.id
        );

        logger.info(`[Educacion.actualizar] Educación actualizada: ${educacion.titulo} (ID: ${educacionId})`);

        return ResponseHelper.success(res, educacionCompleta, 'Educación actualizada exitosamente');
    });

    /**
     * DELETE /profesionales/:id/educacion/:eduId
     * Soft delete de un registro de educación
     */
    static eliminar = asyncHandler(async (req, res) => {
        const educacionId = parseInt(req.params.eduId);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const educacion = await EducacionFormalModel.obtenerPorId(organizacionId, educacionId);
        if (!educacion) {
            return ResponseHelper.notFound(res, 'Educación no encontrada');
        }

        const eliminado = await EducacionFormalModel.eliminar(
            organizacionId,
            educacionId,
            usuarioId
        );

        if (!eliminado) {
            return ResponseHelper.error(res, 'No se pudo eliminar la educación', 400);
        }

        logger.info(`[Educacion.eliminar] Educación eliminada: ${educacion.titulo} (ID: ${educacionId})`);

        return ResponseHelper.success(res, { id: educacionId }, 'Educación eliminada exitosamente');
    });

    /**
     * PATCH /profesionales/:id/educacion/reordenar
     * Reordena los registros de educación de un profesional
     */
    static reordenar = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;
        const { orden } = req.body; // Array de {id, orden}

        if (!Array.isArray(orden) || orden.length === 0) {
            return ResponseHelper.error(res, 'Se requiere un array de orden', 400);
        }

        const reordenado = await EducacionFormalModel.reordenar(
            organizacionId,
            profesionalId,
            orden
        );

        if (!reordenado) {
            return ResponseHelper.error(res, 'No se pudo reordenar', 400);
        }

        logger.info(`[Educacion.reordenar] Educación reordenada para profesional ${profesionalId}`);

        return ResponseHelper.success(res, { success: true }, 'Educación reordenada exitosamente');
    });

    /**
     * GET /profesionales/:id/educacion/en-curso
     * Obtiene estudios en curso de un profesional
     */
    static obtenerEnCurso = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;

        const estudios = await EducacionFormalModel.obtenerEstudiosEnCurso(
            organizacionId,
            profesionalId
        );

        return ResponseHelper.success(res, estudios, 'Estudios en curso obtenidos exitosamente');
    });

}

module.exports = EducacionController;
