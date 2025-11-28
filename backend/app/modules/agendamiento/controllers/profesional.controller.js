const ProfesionalModel = require('../models/profesional.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const logger = require('../../../utils/logger');

class ProfesionalController {
    static crear = asyncHandler(async (req, res) => {
        const profesionalData = {
            ...req.body,
            organizacion_id: req.tenant.organizacionId
        };

        if (profesionalData.email) {
            const emailDisponible = await ProfesionalModel.validarEmailDisponible(
                profesionalData.email,
                req.tenant.organizacionId
            );
            if (!emailDisponible) {
                return ResponseHelper.error(res, 'Ya existe un profesional con este email en la organización', 409);
            }
        }

        const nuevoProfesional = await ProfesionalModel.crear(profesionalData);
        return ResponseHelper.success(res, nuevoProfesional, 'Profesional creado exitosamente', 201);
    });

    /**
     * Crear múltiples profesionales en una transacción
     * POST /profesionales/bulk-create
     */
    static bulkCrear = asyncHandler(async (req, res) => {
        const { profesionales } = req.body;
        const organizacionId = req.tenant.organizacionId;

        logger.info(`📦 Creación bulk de ${profesionales.length} profesionales para org ${organizacionId}`);

        try {
            const profesionalesCreados = await ProfesionalModel.crearBulk(
                organizacionId,
                profesionales
            );

            logger.info(`✅ ${profesionalesCreados.length} profesionales creados exitosamente`);

            return ResponseHelper.success(
                res,
                {
                    profesionales: profesionalesCreados,
                    total_creados: profesionalesCreados.length
                },
                `${profesionalesCreados.length} profesionales creados exitosamente`,
                201
            );

        } catch (error) {
            logger.error('❌ Error en creación bulk de profesionales:', error);

            // Distinguir errores de límite de plan vs otros errores
            if (error.message.includes('límite') || error.message.includes('Límite')) {
                return ResponseHelper.error(res, error.message, 403, {
                    codigo_error: 'PLAN_LIMIT_REACHED',
                    accion_requerida: 'upgrade_plan'
                });
            }

            if (error.message.includes('email')) {
                return ResponseHelper.error(res, error.message, 409);
            }

            if (error.message.includes('incompatible')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            throw error; // asyncHandler maneja otros errores
        }
    });

    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const profesional = await ProfesionalModel.buscarPorId(parseInt(id), req.tenant.organizacionId);

        if (!profesional) {
            return ResponseHelper.notFound(res, 'Profesional no encontrado');
        }

        return ResponseHelper.success(res, profesional, 'Profesional obtenido exitosamente');
    });

    static listar = asyncHandler(async (req, res) => {
        const filtros = {
            activo: req.query.activo !== undefined ? req.query.activo === 'true' : null,
            disponible_online: req.query.disponible_online !== undefined ? req.query.disponible_online === 'true' : null,
            tipo_profesional_id: req.query.tipo_profesional_id ? parseInt(req.query.tipo_profesional_id) : null,
            busqueda: req.query.busqueda || null,
            modulo: req.query.modulo || null, // Nov 2025: filtrar por módulo habilitado
            con_usuario: req.query.con_usuario !== undefined ? req.query.con_usuario === 'true' : null, // Nov 2025
            limite: Math.min(parseInt(req.query.limit) || 20, 50),
            offset: Math.max(parseInt(req.query.offset) || 0, 0)
        };

        const profesionales = await ProfesionalModel.listarPorOrganizacion(req.tenant.organizacionId, filtros);

        return ResponseHelper.success(res, {
            profesionales,
            filtros_aplicados: filtros,
            total: profesionales.length
        }, 'Profesionales obtenidos exitosamente');
    });

    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (req.body.email) {
            const emailDisponible = await ProfesionalModel.validarEmailDisponible(
                req.body.email,
                req.tenant.organizacionId,
                parseInt(id)
            );
            if (!emailDisponible) {
                return ResponseHelper.error(res, 'Ya existe un profesional con ese email en la organización', 409);
            }
        }

        const profesionalActualizado = await ProfesionalModel.actualizar(
            parseInt(id),
            req.tenant.organizacionId,
            req.body
        );

        return ResponseHelper.success(res, profesionalActualizado, 'Profesional actualizado exitosamente');
    });

    static cambiarEstado = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { activo, motivo_inactividad } = req.body;

        const profesionalActualizado = await ProfesionalModel.cambiarEstado(
            parseInt(id),
            req.tenant.organizacionId,
            activo,
            motivo_inactividad
        );

        return ResponseHelper.success(res, profesionalActualizado,
            `Profesional ${activo ? 'activado' : 'desactivado'} exitosamente`);
    });

    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { motivo } = req.body;

        const eliminado = await ProfesionalModel.eliminar(
            parseInt(id),
            req.tenant.organizacionId,
            motivo || 'Eliminado por administrador'
        );

        if (!eliminado) {
            return ResponseHelper.notFound(res, 'Profesional no encontrado');
        }

        return ResponseHelper.success(res, { id: parseInt(id) }, 'Profesional eliminado exitosamente');
    });

    static buscarPorTipo = asyncHandler(async (req, res) => {
        const { tipoId } = req.params;
        const tipoProfesionalId = parseInt(tipoId);
        const soloActivos = req.query.activos !== 'false';

        const profesionales = await ProfesionalModel.buscarPorTipo(
            req.tenant.organizacionId,
            tipoProfesionalId,
            soloActivos
        );

        return ResponseHelper.success(res, {
            tipo_profesional_id: tipoProfesionalId,
            solo_activos: soloActivos,
            profesionales,
            total: profesionales.length
        }, 'Profesionales por tipo obtenidos exitosamente');
    });

    static actualizarMetricas = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const profesionalActualizado = await ProfesionalModel.actualizarMetricas(
            parseInt(id),
            req.tenant.organizacionId,
            req.body
        );

        return ResponseHelper.success(res, profesionalActualizado, 'Métricas actualizadas exitosamente');
    });

    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const estadisticas = await ProfesionalModel.obtenerEstadisticas(req.tenant.organizacionId);

        return ResponseHelper.success(res, {
            organizacion_id: req.tenant.organizacionId,
            estadisticas,
            fecha_consulta: new Date().toISOString()
        }, 'Estadísticas obtenidas exitosamente');
    });

    static validarEmail = asyncHandler(async (req, res) => {
        const { email, excluir_id } = req.body;

        const disponible = await ProfesionalModel.validarEmailDisponible(
            email,
            req.tenant.organizacionId,
            excluir_id
        );

        return ResponseHelper.success(res, {
            email,
            disponible,
            organizacion_id: req.tenant.organizacionId
        }, disponible ? 'Email disponible' : 'Email ya está en uso');
    });

    // ====================================================================
    // ENDPOINTS PARA MODELO UNIFICADO PROFESIONAL-USUARIO (Nov 2025)
    // ====================================================================

    /**
     * Buscar profesional por usuario vinculado
     * GET /profesionales/por-usuario/:usuarioId
     */
    static buscarPorUsuario = asyncHandler(async (req, res) => {
        const { usuarioId } = req.params;

        const profesional = await ProfesionalModel.buscarPorUsuario(
            parseInt(usuarioId),
            req.tenant.organizacionId
        );

        if (!profesional) {
            return ResponseHelper.success(res, null, 'Usuario no tiene profesional vinculado');
        }

        return ResponseHelper.success(res, profesional, 'Profesional encontrado');
    });

    /**
     * Vincular o desvincular usuario a profesional
     * PATCH /profesionales/:id/vincular-usuario
     */
    static vincularUsuario = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { usuario_id } = req.body; // null para desvincular

        try {
            const profesional = await ProfesionalModel.vincularUsuario(
                parseInt(id),
                req.tenant.organizacionId,
                usuario_id
            );

            const mensaje = usuario_id
                ? 'Usuario vinculado exitosamente'
                : 'Usuario desvinculado exitosamente';

            return ResponseHelper.success(res, profesional, mensaje);
        } catch (error) {
            if (error.message.includes('ya está vinculado')) {
                return ResponseHelper.error(res, error.message, 409);
            }
            throw error;
        }
    });

    /**
     * Actualizar módulos habilitados para un profesional
     * PATCH /profesionales/:id/modulos
     */
    static actualizarModulos = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { modulos_acceso } = req.body;

        const profesional = await ProfesionalModel.actualizarModulos(
            parseInt(id),
            req.tenant.organizacionId,
            modulos_acceso
        );

        return ResponseHelper.success(res, profesional, 'Módulos actualizados exitosamente');
    });

    /**
     * Listar profesionales por módulo habilitado
     * GET /profesionales/por-modulo/:modulo
     */
    static listarPorModulo = asyncHandler(async (req, res) => {
        const { modulo } = req.params;
        const soloActivos = req.query.activos !== 'false';

        const modulosValidos = ['agendamiento', 'pos', 'inventario'];
        if (!modulosValidos.includes(modulo)) {
            return ResponseHelper.error(res, `Módulo inválido. Valores permitidos: ${modulosValidos.join(', ')}`, 400);
        }

        const profesionales = await ProfesionalModel.listarPorModulo(
            req.tenant.organizacionId,
            modulo,
            soloActivos
        );

        return ResponseHelper.success(res, {
            modulo,
            solo_activos: soloActivos,
            profesionales,
            total: profesionales.length
        }, `Profesionales con acceso a ${modulo} obtenidos`);
    });

    /**
     * Obtener usuarios disponibles para vincular
     * GET /profesionales/usuarios-disponibles
     */
    static obtenerUsuariosDisponibles = asyncHandler(async (req, res) => {
        const usuarios = await ProfesionalModel.obtenerUsuariosDisponibles(
            req.tenant.organizacionId
        );

        return ResponseHelper.success(res, {
            usuarios,
            total: usuarios.length
        }, 'Usuarios disponibles obtenidos');
    });
}

module.exports = ProfesionalController;
