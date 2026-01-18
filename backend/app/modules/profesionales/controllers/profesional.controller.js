const ProfesionalModel = require('../models/profesional.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const logger = require('../../../utils/logger');

class ProfesionalController {
    static crear = asyncHandler(async (req, res) => {
        if (req.body.email) {
            const emailDisponible = await ProfesionalModel.validarEmailDisponible(
                req.body.email,
                req.tenant.organizacionId
            );
            if (!emailDisponible) {
                return ResponseHelper.error(res, 'Ya existe un profesional con este email en la organización', 409);
            }
        }

        const nuevoProfesional = await ProfesionalModel.crear(
            req.tenant.organizacionId,
            req.body
        );
        return ResponseHelper.success(res, nuevoProfesional, 'Profesional creado exitosamente', 201);
    });

    /**
     * Crear múltiples profesionales en una transacción
     * POST /profesionales/bulk-create
     *
     * Errores manejados automáticamente por asyncHandler:
     * - PlanLimitExceededError → 403
     * - DuplicateResourceError → 409
     * - ValidationError → 400
     */
    static bulkCrear = asyncHandler(async (req, res) => {
        const { profesionales } = req.body;
        const organizacionId = req.tenant.organizacionId;

        logger.info(`Creación bulk de ${profesionales.length} profesionales para org ${organizacionId}`);

        const profesionalesCreados = await ProfesionalModel.crearBulk(
            organizacionId,
            profesionales
        );

        logger.info(`${profesionalesCreados.length} profesionales creados exitosamente`);

        return ResponseHelper.success(
            res,
            {
                profesionales: profesionalesCreados,
                total_creados: profesionalesCreados.length
            },
            `${profesionalesCreados.length} profesionales creados exitosamente`,
            201
        );
    });

    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const profesional = await ProfesionalModel.buscarPorId(req.tenant.organizacionId, parseInt(id));

        if (!profesional) {
            return ResponseHelper.notFound(res, 'Profesional no encontrado');
        }

        return ResponseHelper.success(res, profesional, 'Profesional obtenido exitosamente');
    });

    static listar = asyncHandler(async (req, res) => {
        // Ene 2026: Soporte de paginación con page/limit
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

        const filtros = {
            activo: req.query.activo !== undefined ? req.query.activo === 'true' : null,
            disponible_online: req.query.disponible_online !== undefined ? req.query.disponible_online === 'true' : null,
            busqueda: req.query.busqueda || null,
            modulo: req.query.modulo || null, // Nov 2025: filtrar por módulo habilitado
            con_usuario: req.query.con_usuario !== undefined ? req.query.con_usuario === 'true' : null, // Nov 2025
            // Dic 2025: Filtros de clasificación y jerarquía
            rol_usuario: req.query.rol_usuario || null, // puede ser string o array (admin, propietario para supervisores)
            estado: req.query.estado || null,
            tipo_contratacion: req.query.tipo_contratacion || null,
            departamento_id: req.query.departamento_id ? parseInt(req.query.departamento_id) : null,
            puesto_id: req.query.puesto_id ? parseInt(req.query.puesto_id) : null,
            supervisor_id: req.query.supervisor_id ? parseInt(req.query.supervisor_id) : null,
            // Ene 2026: Usar page en lugar de offset directo
            page,
            limite: limit
        };

        const resultado = await ProfesionalModel.listar(req.tenant.organizacionId, filtros);

        return ResponseHelper.success(res, {
            profesionales: resultado.profesionales,
            pagination: resultado.paginacion
        }, 'Profesionales obtenidos exitosamente');
    });

    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const profesionalId = parseInt(id);

        // Validar email único
        if (req.body.email) {
            const emailDisponible = await ProfesionalModel.validarEmailDisponible(
                req.body.email,
                req.tenant.organizacionId,
                profesionalId
            );
            if (!emailDisponible) {
                return ResponseHelper.error(res, 'Ya existe un profesional con ese email en la organización', 409);
            }
        }

        // Validar que supervisor_id no cree ciclo jerárquico (Dic 2025)
        if (req.body.supervisor_id !== undefined && req.body.supervisor_id !== null) {
            const supervisorId = parseInt(req.body.supervisor_id);

            // No puede ser su propio supervisor
            if (supervisorId === profesionalId) {
                return ResponseHelper.error(res, 'Un profesional no puede ser su propio supervisor', 400);
            }

            // Validar que no cree ciclo en la jerarquía
            const esValido = await ProfesionalModel.validarSupervisorSinCiclo(
                req.tenant.organizacionId,
                profesionalId,
                supervisorId
            );

            if (!esValido) {
                return ResponseHelper.error(
                    res,
                    'El supervisor seleccionado crearía un ciclo en la jerarquía organizacional. ' +
                    'No se puede asignar como supervisor a alguien que es subordinado de este profesional.',
                    400
                );
            }
        }

        const profesionalActualizado = await ProfesionalModel.actualizar(
            req.tenant.organizacionId,
            profesionalId,
            req.body
        );

        return ResponseHelper.success(res, profesionalActualizado, 'Profesional actualizado exitosamente');
    });

    static cambiarEstado = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { activo, motivo_inactividad } = req.body;

        const profesionalActualizado = await ProfesionalModel.cambiarEstado(
            req.tenant.organizacionId,
            parseInt(id),
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
            req.tenant.organizacionId,
            parseInt(id),
            motivo || 'Eliminado por administrador'
        );

        if (!eliminado) {
            return ResponseHelper.notFound(res, 'Profesional no encontrado');
        }

        return ResponseHelper.success(res, { id: parseInt(id) }, 'Profesional eliminado exitosamente');
    });

    // Método buscarPorTipo eliminado - usar listar con filtro de categorías

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
     * @deprecated ENDPOINT DEPRECADO - Dic 2025
     * Los permisos ahora se gestionan via sistema normalizado
     * Usar: POST /api/permisos/usuario-sucursal para asignar permisos
     * PATCH /profesionales/:id/modulos
     */
    static actualizarModulos = asyncHandler(async (req, res) => {
        return ResponseHelper.error(
            res,
            'Endpoint deprecado. Los permisos ahora se gestionan via /api/permisos. ' +
            'Ver documentación de permisos_catalogo, permisos_rol, permisos_usuario_sucursal.',
            410 // 410 Gone
        );
    });

    /**
     * @deprecated ENDPOINT DEPRECADO - Dic 2025
     * Para filtrar por permisos, usar consultas SQL con tiene_permiso()
     * GET /profesionales/por-modulo/:modulo
     */
    static listarPorModulo = asyncHandler(async (req, res) => {
        return ResponseHelper.error(
            res,
            'Endpoint deprecado. Usar filtros con sistema de permisos normalizado. ' +
            'Consultar permisos via /api/permisos/verificar o función SQL tiene_permiso().',
            410 // 410 Gone
        );
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

    // ====================================================================
    // ENDPOINTS PARA JERARQUÍA ORGANIZACIONAL (Dic 2025)
    // ====================================================================

    /**
     * Obtener subordinados de un profesional
     * GET /profesionales/:id/subordinados
     */
    static obtenerSubordinados = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const maxNivel = parseInt(req.query.max_nivel) || 10;
        const soloDirectos = req.query.solo_directos === 'true';

        const subordinados = await ProfesionalModel.obtenerSubordinados(
            req.tenant.organizacionId,
            parseInt(id),
            soloDirectos ? 1 : maxNivel
        );

        return ResponseHelper.success(res, {
            profesional_id: parseInt(id),
            subordinados,
            total: subordinados.length,
            solo_directos: soloDirectos
        }, 'Subordinados obtenidos exitosamente');
    });

    /**
     * Obtener cadena de supervisores de un profesional
     * GET /profesionales/:id/supervisores
     */
    static obtenerSupervisores = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const supervisores = await ProfesionalModel.obtenerCadenaSupervisores(
            req.tenant.organizacionId,
            parseInt(id)
        );

        return ResponseHelper.success(res, {
            profesional_id: parseInt(id),
            supervisores,
            total: supervisores.length
        }, 'Cadena de supervisores obtenida exitosamente');
    });

    // ====================================================================
    // ENDPOINTS PARA CATEGORÍAS DE PROFESIONAL (Dic 2025)
    // ====================================================================

    /**
     * Obtener categorías de un profesional
     * GET /profesionales/:id/categorias
     */
    static obtenerCategorias = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const categorias = await ProfesionalModel.obtenerCategorias(
            req.tenant.organizacionId,
            parseInt(id)
        );

        return ResponseHelper.success(res, {
            profesional_id: parseInt(id),
            categorias,
            total: categorias.length
        }, 'Categorías obtenidas exitosamente');
    });

    /**
     * Asignar categoría a un profesional
     * POST /profesionales/:id/categorias
     */
    static asignarCategoria = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { categoria_id, notas } = req.body;

        const resultado = await ProfesionalModel.asignarCategoria(
            req.tenant.organizacionId,
            parseInt(id),
            categoria_id,
            notas
        );

        logger.info(`Categoría ${categoria_id} asignada a profesional ${id}`, {
            organizacionId: req.tenant.organizacionId,
            profesionalId: id,
            categoriaId: categoria_id,
            usuario: req.user.email
        });

        return ResponseHelper.success(res, resultado, 'Categoría asignada exitosamente', 201);
    });

    /**
     * Eliminar categoría de un profesional
     * DELETE /profesionales/:id/categorias/:categoriaId
     */
    static eliminarCategoria = asyncHandler(async (req, res) => {
        const { id, categoriaId } = req.params;

        const eliminada = await ProfesionalModel.eliminarCategoria(
            req.tenant.organizacionId,
            parseInt(id),
            parseInt(categoriaId)
        );

        if (!eliminada) {
            return ResponseHelper.notFound(res, 'La categoría no estaba asignada al profesional');
        }

        logger.info(`Categoría ${categoriaId} eliminada de profesional ${id}`, {
            organizacionId: req.tenant.organizacionId,
            profesionalId: id,
            categoriaId,
            usuario: req.user.email
        });

        return ResponseHelper.success(res, { profesional_id: parseInt(id), categoria_id: parseInt(categoriaId) }, 'Categoría eliminada exitosamente');
    });

    /**
     * Sincronizar categorías de un profesional (reemplaza todas)
     * PUT /profesionales/:id/categorias
     */
    static sincronizarCategorias = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { categoria_ids } = req.body;

        const categorias = await ProfesionalModel.sincronizarCategorias(
            req.tenant.organizacionId,
            parseInt(id),
            categoria_ids || []
        );

        logger.info(`Categorías sincronizadas para profesional ${id}`, {
            organizacionId: req.tenant.organizacionId,
            profesionalId: id,
            totalCategorias: categorias.length,
            usuario: req.user.email
        });

        return ResponseHelper.success(res, {
            profesional_id: parseInt(id),
            categorias,
            total: categorias.length
        }, 'Categorías sincronizadas exitosamente');
    });
}

module.exports = ProfesionalController;
