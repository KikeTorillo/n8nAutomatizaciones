/**
 * ExperienciaController - Enero 2026
 * Handlers HTTP para experiencia laboral de empleados
 * Fase 4 del Plan de Empleados Competitivo
 */
const ExperienciaModel = require('../models/experiencia.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const logger = require('../../../utils/logger');

class ExperienciaController {

    /**
     * GET /profesionales/:id/experiencias
     * Lista experiencias laborales de un profesional
     */
    static listar = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            es_empleo_actual: req.query.es_empleo_actual !== undefined
                ? req.query.es_empleo_actual === 'true'
                : null,
            limite: Math.min(parseInt(req.query.limit) || 20, 100),
            offset: Math.max(parseInt(req.query.offset) || 0, 0)
        };

        const experiencias = await ExperienciaModel.listarPorProfesional(
            organizacionId,
            profesionalId,
            filtros
        );

        const conteo = await ExperienciaModel.contarPorProfesional(
            organizacionId,
            profesionalId
        );

        return ResponseHelper.success(res, {
            experiencias,
            conteo,
            filtros_aplicados: filtros
        }, 'Experiencias obtenidas exitosamente');
    });

    /**
     * POST /profesionales/:id/experiencias
     * Crea una nueva experiencia laboral
     */
    static crear = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const experienciaData = {
            organizacion_id: organizacionId,
            profesional_id: profesionalId,
            empresa: req.body.empresa,
            puesto: req.body.puesto,
            descripcion: req.body.descripcion || null,
            ubicacion: req.body.ubicacion || null,
            fecha_inicio: req.body.fecha_inicio,
            fecha_fin: req.body.fecha_fin || null,
            es_empleo_actual: req.body.es_empleo_actual || false,
            sector_industria: req.body.sector_industria || null,
            tamanio_empresa: req.body.tamanio_empresa || null,
            motivo_salida: req.body.motivo_salida || null,
            contacto_referencia: req.body.contacto_referencia || null,
            telefono_referencia: req.body.telefono_referencia || null,
            creado_por: usuarioId
        };

        const experiencia = await ExperienciaModel.crear(experienciaData);

        const experienciaCompleta = await ExperienciaModel.obtenerPorId(
            organizacionId,
            experiencia.id
        );

        logger.info(`[Experiencia.crear] Experiencia creada: ${experiencia.empresa} - ${experiencia.puesto} (ID: ${experiencia.id})`);

        return ResponseHelper.success(res, experienciaCompleta, 'Experiencia creada exitosamente', 201);
    });

    /**
     * GET /profesionales/:id/experiencias/:expId
     * Obtiene una experiencia específica
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const experienciaId = parseInt(req.params.expId);
        const organizacionId = req.tenant.organizacionId;

        const experiencia = await ExperienciaModel.obtenerPorId(organizacionId, experienciaId);

        if (!experiencia) {
            return ResponseHelper.notFound(res, 'Experiencia no encontrada');
        }

        return ResponseHelper.success(res, experiencia, 'Experiencia obtenida exitosamente');
    });

    /**
     * PUT /profesionales/:id/experiencias/:expId
     * Actualiza una experiencia laboral
     */
    static actualizar = asyncHandler(async (req, res) => {
        const experienciaId = parseInt(req.params.expId);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const experienciaExistente = await ExperienciaModel.obtenerPorId(organizacionId, experienciaId);
        if (!experienciaExistente) {
            return ResponseHelper.notFound(res, 'Experiencia no encontrada');
        }

        const experiencia = await ExperienciaModel.actualizar(
            organizacionId,
            experienciaId,
            req.body,
            usuarioId
        );

        const experienciaCompleta = await ExperienciaModel.obtenerPorId(
            organizacionId,
            experiencia.id
        );

        logger.info(`[Experiencia.actualizar] Experiencia actualizada: ${experiencia.empresa} (ID: ${experienciaId})`);

        return ResponseHelper.success(res, experienciaCompleta, 'Experiencia actualizada exitosamente');
    });

    /**
     * DELETE /profesionales/:id/experiencias/:expId
     * Soft delete de una experiencia
     */
    static eliminar = asyncHandler(async (req, res) => {
        const experienciaId = parseInt(req.params.expId);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const experiencia = await ExperienciaModel.obtenerPorId(organizacionId, experienciaId);
        if (!experiencia) {
            return ResponseHelper.notFound(res, 'Experiencia no encontrada');
        }

        const eliminado = await ExperienciaModel.eliminar(
            organizacionId,
            experienciaId,
            usuarioId
        );

        if (!eliminado) {
            return ResponseHelper.error(res, 'No se pudo eliminar la experiencia', 400);
        }

        logger.info(`[Experiencia.eliminar] Experiencia eliminada: ${experiencia.empresa} (ID: ${experienciaId})`);

        return ResponseHelper.success(res, { id: experienciaId }, 'Experiencia eliminada exitosamente');
    });

    /**
     * PATCH /profesionales/:id/experiencias/reordenar
     * Reordena las experiencias de un profesional
     */
    static reordenar = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;
        const { orden } = req.body; // Array de {id, orden}

        if (!Array.isArray(orden) || orden.length === 0) {
            return ResponseHelper.error(res, 'Se requiere un array de orden', 400);
        }

        const reordenado = await ExperienciaModel.reordenar(
            organizacionId,
            profesionalId,
            orden
        );

        if (!reordenado) {
            return ResponseHelper.error(res, 'No se pudo reordenar', 400);
        }

        logger.info(`[Experiencia.reordenar] Experiencias reordenadas para profesional ${profesionalId}`);

        return ResponseHelper.success(res, { success: true }, 'Experiencias reordenadas exitosamente');
    });

    /**
     * GET /profesionales/:id/experiencias/actual
     * Obtiene el empleo actual de un profesional
     */
    static obtenerEmpleoActual = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;

        const experiencia = await ExperienciaModel.obtenerEmpleoActual(
            organizacionId,
            profesionalId
        );

        if (!experiencia) {
            return ResponseHelper.success(res, null, 'El profesional no tiene empleo actual registrado');
        }

        return ResponseHelper.success(res, experiencia, 'Empleo actual obtenido exitosamente');
    });

}

module.exports = ExperienciaController;
