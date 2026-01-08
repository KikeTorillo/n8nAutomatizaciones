/**
 * IncapacidadesController - Enero 2026
 * Endpoints para gestión de incapacidades médicas
 */
const asyncHandler = require('../../../middleware/asyncHandler');
const IncapacidadesModel = require('../models/incapacidades.model');
const ProfesionalModel = require('../../profesionales/models/profesional.model');

/**
 * Registrar nueva incapacidad
 * POST /api/v1/incapacidades
 */
const crear = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId, id: usuarioId } = req.user;
    const { profesional_id, ...data } = req.body;

    const incapacidad = await IncapacidadesModel.crear(
        organizacionId,
        profesional_id,
        data,
        usuarioId
    );

    res.status(201).json({
        success: true,
        message: 'Incapacidad registrada correctamente',
        data: incapacidad,
    });
});

/**
 * Listar incapacidades (admin)
 * GET /api/v1/incapacidades
 */
const listar = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId } = req.user;
    const filtros = req.query;

    const resultado = await IncapacidadesModel.listar(organizacionId, filtros);

    res.json({
        success: true,
        ...resultado,
    });
});

/**
 * Listar mis incapacidades (empleado)
 * GET /api/v1/incapacidades/mis-incapacidades
 */
const listarMisIncapacidades = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId, id: usuarioId } = req.user;
    const filtros = req.query;

    // Obtener profesional vinculado al usuario
    const profesional = await ProfesionalModel.buscarPorUsuario(usuarioId, organizacionId);

    if (!profesional) {
        return res.status(404).json({
            success: false,
            message: 'No tienes un perfil de profesional vinculado',
        });
    }

    const resultado = await IncapacidadesModel.listarMisIncapacidades(
        organizacionId,
        profesional.id,
        filtros
    );

    res.json({
        success: true,
        ...resultado,
    });
});

/**
 * Obtener incapacidad por ID
 * GET /api/v1/incapacidades/:id
 */
const obtenerPorId = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId } = req.user;
    const { id } = req.params;

    const incapacidad = await IncapacidadesModel.obtenerPorId(organizacionId, id);

    if (!incapacidad) {
        return res.status(404).json({
            success: false,
            message: 'Incapacidad no encontrada',
        });
    }

    res.json({
        success: true,
        data: incapacidad,
    });
});

/**
 * Actualizar incapacidad
 * PUT /api/v1/incapacidades/:id
 */
const actualizar = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId, id: usuarioId } = req.user;
    const { id } = req.params;
    const data = req.body;

    const incapacidad = await IncapacidadesModel.actualizar(
        organizacionId,
        id,
        data,
        usuarioId
    );

    res.json({
        success: true,
        message: 'Incapacidad actualizada correctamente',
        data: incapacidad,
    });
});

/**
 * Finalizar incapacidad anticipadamente
 * POST /api/v1/incapacidades/:id/finalizar
 */
const finalizar = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId, id: usuarioId } = req.user;
    const { id } = req.params;
    const data = req.body;

    const incapacidad = await IncapacidadesModel.finalizar(
        organizacionId,
        id,
        usuarioId,
        data
    );

    res.json({
        success: true,
        message: 'Incapacidad finalizada correctamente',
        data: incapacidad,
    });
});

/**
 * Cancelar incapacidad
 * DELETE /api/v1/incapacidades/:id
 */
const cancelar = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId, id: usuarioId } = req.user;
    const { id } = req.params;
    const { motivo_cancelacion } = req.body;

    const incapacidad = await IncapacidadesModel.cancelar(
        organizacionId,
        id,
        usuarioId,
        motivo_cancelacion
    );

    res.json({
        success: true,
        message: 'Incapacidad cancelada correctamente',
        data: incapacidad,
    });
});

/**
 * Crear prórroga de incapacidad
 * POST /api/v1/incapacidades/:id/prorroga
 */
const crearProrroga = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId, id: usuarioId } = req.user;
    const { id } = req.params;
    const data = req.body;

    const prorroga = await IncapacidadesModel.crearProrroga(
        organizacionId,
        id,
        data,
        usuarioId
    );

    res.status(201).json({
        success: true,
        message: 'Prórroga creada correctamente',
        data: prorroga,
    });
});

/**
 * Obtener estadísticas de incapacidades
 * GET /api/v1/incapacidades/estadisticas
 */
const obtenerEstadisticas = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId } = req.user;
    const filtros = req.query;

    const estadisticas = await IncapacidadesModel.obtenerEstadisticas(
        organizacionId,
        filtros
    );

    res.json({
        success: true,
        data: estadisticas,
    });
});

/**
 * Obtener incapacidades activas de un profesional
 * GET /api/v1/incapacidades/profesional/:profesionalId/activas
 */
const obtenerActivasPorProfesional = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId } = req.user;
    const { profesionalId } = req.params;

    const incapacidades = await IncapacidadesModel.obtenerActivasPorProfesional(
        organizacionId,
        profesionalId
    );

    res.json({
        success: true,
        data: incapacidades,
    });
});

module.exports = {
    crear,
    listar,
    listarMisIncapacidades,
    obtenerPorId,
    actualizar,
    finalizar,
    cancelar,
    crearProrroga,
    obtenerEstadisticas,
    obtenerActivasPorProfesional,
};
