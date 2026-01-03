/**
 * VacacionesController - Enero 2026
 * Controlador unificado para el módulo de vacaciones
 * Fase 3 del Plan de Empleados Competitivo
 */
const asyncHandler = require('../../../middleware/asyncHandler');
const PoliticasVacacionesModel = require('../models/politicas.model');
const NivelesVacacionesModel = require('../models/niveles.model');
const SaldosVacacionesModel = require('../models/saldos.model');
const SolicitudesVacacionesModel = require('../models/solicitudes.model');

// ==================== POLÍTICAS ====================

/**
 * GET /vacaciones/politica
 * Obtiene la política de vacaciones de la organización
 */
const obtenerPolitica = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const user_id = req.user.id;

    const politica = await PoliticasVacacionesModel.obtenerOCrear(organizacion_id, user_id);

    res.json({
        success: true,
        data: politica,
    });
});

/**
 * PUT /vacaciones/politica
 * Actualiza la política de vacaciones
 */
const actualizarPolitica = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const user_id = req.user.id;
    const data = req.body;

    const politica = await PoliticasVacacionesModel.actualizar(organizacion_id, data, user_id);

    res.json({
        success: true,
        message: 'Política actualizada correctamente',
        data: politica,
    });
});

// ==================== NIVELES ====================

/**
 * GET /vacaciones/niveles
 * Lista los niveles de vacaciones por antigüedad
 */
const listarNiveles = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const { activo } = req.query;

    const niveles = await NivelesVacacionesModel.listar(organizacion_id, {
        activo: activo !== undefined ? activo === 'true' : null,
    });

    res.json({
        success: true,
        data: niveles,
        total: niveles.length,
    });
});

/**
 * POST /vacaciones/niveles
 * Crea un nuevo nivel de vacaciones
 */
const crearNivel = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const user_id = req.user.id;
    const data = req.body;

    const nivel = await NivelesVacacionesModel.crear(organizacion_id, data, user_id);

    res.status(201).json({
        success: true,
        message: 'Nivel creado correctamente',
        data: nivel,
    });
});

/**
 * PUT /vacaciones/niveles/:id
 * Actualiza un nivel existente
 */
const actualizarNivel = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const { id } = req.params;
    const data = req.body;

    const nivel = await NivelesVacacionesModel.actualizar(organizacion_id, parseInt(id), data);

    if (!nivel) {
        return res.status(404).json({
            success: false,
            error: 'Nivel no encontrado',
        });
    }

    res.json({
        success: true,
        message: 'Nivel actualizado correctamente',
        data: nivel,
    });
});

/**
 * DELETE /vacaciones/niveles/:id
 * Elimina (desactiva) un nivel
 */
const eliminarNivel = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const { id } = req.params;

    const eliminado = await NivelesVacacionesModel.eliminar(organizacion_id, parseInt(id));

    if (!eliminado) {
        return res.status(404).json({
            success: false,
            error: 'Nivel no encontrado',
        });
    }

    res.json({
        success: true,
        message: 'Nivel eliminado correctamente',
    });
});

/**
 * POST /vacaciones/niveles/preset
 * Crea niveles predefinidos según país (México LFT o Colombia)
 */
const crearNivelesPreset = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const { pais, sobrescribir } = req.body;

    const niveles = await NivelesVacacionesModel.crearNivelesPreset(organizacion_id, pais, sobrescribir);

    res.status(201).json({
        success: true,
        message: `Niveles ${pais.toUpperCase()} creados correctamente`,
        data: niveles,
        total: niveles.length,
    });
});

// ==================== SALDOS ====================

/**
 * GET /vacaciones/mi-saldo
 * Obtiene el saldo de vacaciones del usuario autenticado
 */
const obtenerMiSaldo = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const user_id = req.user.id;
    const { anio } = req.query;

    // Obtener profesional_id del usuario
    const profesionalId = await obtenerProfesionalIdDeUsuario(organizacion_id, user_id);

    if (!profesionalId) {
        return res.status(404).json({
            success: false,
            error: 'No se encontró un profesional asociado a tu usuario',
        });
    }

    const saldo = await SaldosVacacionesModel.obtenerSaldo(
        organizacion_id,
        profesionalId,
        anio ? parseInt(anio) : null
    );

    // Obtener información del nivel actual
    const nivelInfo = await NivelesVacacionesModel.obtenerNivelProfesional(organizacion_id, profesionalId);

    res.json({
        success: true,
        data: {
            saldo,
            nivel: nivelInfo,
        },
    });
});

/**
 * GET /vacaciones/saldos
 * Lista saldos de vacaciones (admin)
 */
const listarSaldos = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const filtros = req.query;

    const resultado = await SaldosVacacionesModel.listar(organizacion_id, {
        ...filtros,
        page: filtros.page ? parseInt(filtros.page) : 1,
        limit: filtros.limit ? parseInt(filtros.limit) : 20,
    });

    res.json({
        success: true,
        ...resultado,
    });
});

/**
 * PUT /vacaciones/saldos/:id/ajustar
 * Ajusta manualmente el saldo de un profesional
 */
const ajustarSaldo = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const user_id = req.user.id;
    const { id } = req.params;
    const { dias_ajuste, motivo } = req.body;

    const saldo = await SaldosVacacionesModel.ajustar(
        organizacion_id,
        parseInt(id),
        dias_ajuste,
        motivo,
        user_id
    );

    res.json({
        success: true,
        message: `Saldo ajustado en ${dias_ajuste > 0 ? '+' : ''}${dias_ajuste} días`,
        data: saldo,
    });
});

/**
 * POST /vacaciones/saldos/generar-anio
 * Genera saldos para todos los profesionales de un año
 */
const generarSaldosAnio = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const { anio, profesional_id, sobrescribir } = req.body;

    const resultado = await SaldosVacacionesModel.generarSaldosAnio(
        organizacion_id,
        anio,
        profesional_id || null,
        sobrescribir
    );

    res.json({
        success: true,
        message: `Saldos generados: ${resultado.creados} creados, ${resultado.actualizados} actualizados`,
        data: resultado,
    });
});

// ==================== SOLICITUDES ====================

/**
 * POST /vacaciones/solicitudes
 * Crea una nueva solicitud de vacaciones
 */
const crearSolicitud = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const user_id = req.user.id;
    const data = req.body;

    // Obtener profesional_id del usuario
    const profesionalId = await obtenerProfesionalIdDeUsuario(organizacion_id, user_id);

    if (!profesionalId) {
        return res.status(404).json({
            success: false,
            error: 'No se encontró un profesional asociado a tu usuario',
        });
    }

    const solicitud = await SolicitudesVacacionesModel.crear(
        organizacion_id,
        profesionalId,
        data,
        user_id
    );

    res.status(201).json({
        success: true,
        message: 'Solicitud de vacaciones creada correctamente',
        data: solicitud,
    });
});

/**
 * GET /vacaciones/mis-solicitudes
 * Lista las solicitudes del usuario autenticado
 */
const listarMisSolicitudes = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const user_id = req.user.id;
    const filtros = req.query;

    // Obtener profesional_id del usuario
    const profesionalId = await obtenerProfesionalIdDeUsuario(organizacion_id, user_id);

    if (!profesionalId) {
        return res.json({
            success: true,
            data: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
        });
    }

    const resultado = await SolicitudesVacacionesModel.listarMisSolicitudes(
        organizacion_id,
        profesionalId,
        {
            ...filtros,
            page: filtros.page ? parseInt(filtros.page) : 1,
            limit: filtros.limit ? parseInt(filtros.limit) : 20,
        }
    );

    res.json({
        success: true,
        ...resultado,
    });
});

/**
 * GET /vacaciones/solicitudes
 * Lista todas las solicitudes (admin)
 */
const listarSolicitudes = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const filtros = req.query;

    const resultado = await SolicitudesVacacionesModel.listar(organizacion_id, {
        ...filtros,
        page: filtros.page ? parseInt(filtros.page) : 1,
        limit: filtros.limit ? parseInt(filtros.limit) : 20,
    });

    res.json({
        success: true,
        ...resultado,
    });
});

/**
 * GET /vacaciones/solicitudes/pendientes
 * Lista solicitudes pendientes de aprobación
 */
const listarPendientes = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const filtros = req.query;

    const resultado = await SolicitudesVacacionesModel.listarPendientes(organizacion_id, {
        page: filtros.page ? parseInt(filtros.page) : 1,
        limit: filtros.limit ? parseInt(filtros.limit) : 20,
    });

    res.json({
        success: true,
        ...resultado,
    });
});

/**
 * GET /vacaciones/solicitudes/:id
 * Obtiene detalle de una solicitud
 */
const obtenerSolicitud = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const { id } = req.params;

    const solicitud = await SolicitudesVacacionesModel.obtenerPorId(organizacion_id, parseInt(id));

    if (!solicitud) {
        return res.status(404).json({
            success: false,
            error: 'Solicitud no encontrada',
        });
    }

    res.json({
        success: true,
        data: solicitud,
    });
});

/**
 * POST /vacaciones/solicitudes/:id/aprobar
 * Aprueba una solicitud de vacaciones
 */
const aprobarSolicitud = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const user_id = req.user.id;
    const { id } = req.params;
    const { notas_internas } = req.body;

    const solicitud = await SolicitudesVacacionesModel.aprobar(
        organizacion_id,
        parseInt(id),
        user_id,
        notas_internas
    );

    res.json({
        success: true,
        message: 'Solicitud aprobada correctamente. Se ha creado el bloqueo en el calendario.',
        data: solicitud,
    });
});

/**
 * POST /vacaciones/solicitudes/:id/rechazar
 * Rechaza una solicitud de vacaciones
 */
const rechazarSolicitud = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const user_id = req.user.id;
    const { id } = req.params;
    const { motivo_rechazo, notas_internas } = req.body;

    const solicitud = await SolicitudesVacacionesModel.rechazar(
        organizacion_id,
        parseInt(id),
        user_id,
        motivo_rechazo,
        notas_internas
    );

    res.json({
        success: true,
        message: 'Solicitud rechazada',
        data: solicitud,
    });
});

/**
 * DELETE /vacaciones/solicitudes/:id
 * Cancela una solicitud de vacaciones
 */
const cancelarSolicitud = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const user_id = req.user.id;
    const { id } = req.params;
    const { motivo } = req.body;

    const solicitud = await SolicitudesVacacionesModel.cancelar(
        organizacion_id,
        parseInt(id),
        user_id,
        motivo
    );

    res.json({
        success: true,
        message: 'Solicitud cancelada',
        data: solicitud,
    });
});

// ==================== DASHBOARD / ESTADÍSTICAS ====================

/**
 * GET /vacaciones/dashboard
 * Obtiene el dashboard de vacaciones del usuario
 */
const obtenerDashboard = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const user_id = req.user.id;
    const { anio } = req.query;

    // Obtener profesional_id del usuario
    const profesionalId = await obtenerProfesionalIdDeUsuario(organizacion_id, user_id);

    if (!profesionalId) {
        return res.status(404).json({
            success: false,
            error: 'No se encontró un profesional asociado a tu usuario',
        });
    }

    const anioConsulta = anio ? parseInt(anio) : new Date().getFullYear();

    // Obtener saldo
    const saldo = await SaldosVacacionesModel.obtenerSaldo(organizacion_id, profesionalId, anioConsulta);

    // Obtener nivel
    const nivel = await NivelesVacacionesModel.obtenerNivelProfesional(organizacion_id, profesionalId);

    // Obtener mis solicitudes recientes
    const misSolicitudes = await SolicitudesVacacionesModel.listarMisSolicitudes(
        organizacion_id,
        profesionalId,
        { limit: 5, page: 1 }
    );

    res.json({
        success: true,
        data: {
            anio: anioConsulta,
            saldo,
            nivel,
            solicitudes_recientes: misSolicitudes.data,
        },
    });
});

/**
 * GET /vacaciones/estadisticas
 * Obtiene estadísticas generales de vacaciones (admin)
 */
const obtenerEstadisticas = asyncHandler(async (req, res) => {
    const organizacion_id = req.tenant.organizacionId;
    const { anio, departamento_id } = req.query;

    const estadisticas = await SolicitudesVacacionesModel.obtenerEstadisticas(
        organizacion_id,
        anio ? parseInt(anio) : null,
        departamento_id ? parseInt(departamento_id) : null
    );

    res.json({
        success: true,
        data: estadisticas,
    });
});

// ==================== UTILIDADES ====================

/**
 * Obtiene el profesional_id asociado a un usuario
 * @param {number} organizacionId - ID de la organización
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<number|null>} profesional_id o null
 */
async function obtenerProfesionalIdDeUsuario(organizacionId, usuarioId) {
    const RLSContextManager = require('../../../utils/rlsContextManager');

    return await RLSContextManager.query(organizacionId, async (db) => {
        const result = await db.query(
            `SELECT id FROM profesionales WHERE usuario_id = $1 AND organizacion_id = $2 AND activo = true LIMIT 1`,
            [usuarioId, organizacionId]
        );
        return result.rows[0]?.id || null;
    });
}

module.exports = {
    // Políticas
    obtenerPolitica,
    actualizarPolitica,

    // Niveles
    listarNiveles,
    crearNivel,
    actualizarNivel,
    eliminarNivel,
    crearNivelesPreset,

    // Saldos
    obtenerMiSaldo,
    listarSaldos,
    ajustarSaldo,
    generarSaldosAnio,

    // Solicitudes
    crearSolicitud,
    listarMisSolicitudes,
    listarSolicitudes,
    listarPendientes,
    obtenerSolicitud,
    aprobarSolicitud,
    rechazarSolicitud,
    cancelarSolicitud,

    // Dashboard
    obtenerDashboard,
    obtenerEstadisticas,
};
