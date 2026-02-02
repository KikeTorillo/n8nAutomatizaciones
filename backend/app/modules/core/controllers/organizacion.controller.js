// Controller de Organizaciones - Gestión CRUD para tenants

const { OrganizacionModel, UsuarioModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const authConfig = require('../../../config/auth');
const RLSContextManager = require('../../../utils/rlsContextManager');
const { NEXO_TEAM_ORG_ID } = require('../../../config/constants');


class OrganizacionController {
    // Helper para validar acceso a organización
    static validarAccesoOrganizacion(req, organizacionId) {
        // super_admin puede acceder a cualquier organización
        if (req.user.rol_codigo === 'super_admin') {
            return true;
        }

        // Admin/propietario solo puede acceder a su propia organización
        return req.tenant?.organizacionId === organizacionId;
    }

    static crear = asyncHandler(async (req, res) => {
        const nuevaOrganizacion = await OrganizacionModel.crear(req.body);
        return ResponseHelper.success(res, nuevaOrganizacion, 'Organización creada exitosamente', 201);
    });

    static obtenerPorId = asyncHandler(async (req, res) => {
        const organizacionId = parseInt(req.params.id);

        // Validar acceso
        if (!this.validarAccesoOrganizacion(req, organizacionId)) {
            return ResponseHelper.error(res, 'No tienes permisos para acceder a esta organización', 403);
        }

        const organizacion = await OrganizacionModel.obtenerPorId(organizacionId);

        if (!organizacion) {
            return ResponseHelper.notFound(res, 'Organización no encontrada');
        }

        return ResponseHelper.success(res, organizacion);
    });

    static listar = asyncHandler(async (req, res) => {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            categoria_id: req.query.categoria_id ? parseInt(req.query.categoria_id) : undefined,
            incluir_inactivas: req.query.incluir_inactivas
        };

        // Si NO es super_admin, solo puede listar su propia organización
        if (req.user.rol_codigo !== 'super_admin') {
            options.organizacion_id = req.user.organizacion_id;
        }

        const resultado = await OrganizacionModel.listar(options);
        return ResponseHelper.success(res, resultado);
    });

    static actualizar = asyncHandler(async (req, res) => {
        const organizacionId = parseInt(req.params.id);

        // Validar acceso
        if (!this.validarAccesoOrganizacion(req, organizacionId)) {
            return ResponseHelper.error(res, 'No tienes permisos para modificar esta organización', 403);
        }

        const organizacionActualizada = await OrganizacionModel.actualizar(organizacionId, req.body);

        if (!organizacionActualizada) {
            return ResponseHelper.notFound(res, 'Organización no encontrada');
        }

        return ResponseHelper.success(res, organizacionActualizada, 'Organización actualizada exitosamente');
    });

    static desactivar = asyncHandler(async (req, res) => {
        // Validar confirmación
        if (!req.body.confirmar) {
            return ResponseHelper.error(res, 'Debes confirmar la desactivación de la organización', 400);
        }

        const organizacionId = parseInt(req.params.id);

        // Actualizar para desactivar
        const organizacionDesactivada = await OrganizacionModel.actualizar(organizacionId, {
            activo: false
        });

        if (!organizacionDesactivada) {
            return ResponseHelper.notFound(res, 'Organización no encontrada');
        }

        return ResponseHelper.success(res, organizacionDesactivada, 'Organización desactivada exitosamente');
    });

    static verificarLimites = asyncHandler(async (req, res) => {
        const organizacionId = parseInt(req.params.id);

        // Validar acceso
        if (!this.validarAccesoOrganizacion(req, organizacionId)) {
            return ResponseHelper.error(res, 'No tienes permisos para acceder a esta información', 403);
        }

        const limites = await OrganizacionModel.verificarLimites(organizacionId);
        return ResponseHelper.success(res, limites);
    });

    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const organizacionId = parseInt(req.params.id);

        // Validar acceso
        if (!this.validarAccesoOrganizacion(req, organizacionId)) {
            return ResponseHelper.error(res, 'No tienes permisos para acceder a esta información', 403);
        }

        const estadisticas = await OrganizacionModel.obtenerEstadisticas(organizacionId);
        return ResponseHelper.success(res, estadisticas);
    });

    static obtenerProgresoSetup = asyncHandler(async (req, res) => {
        const organizacionId = parseInt(req.params.id);

        // Validar acceso
        if (!this.validarAccesoOrganizacion(req, organizacionId)) {
            return ResponseHelper.error(res, 'No tienes permisos para acceder a esta información', 403);
        }

        const progreso = await OrganizacionModel.obtenerProgresoSetup(organizacionId);
        return ResponseHelper.success(res, progreso);
    });

    static onboarding = asyncHandler(async (req, res) => {
        const { organizacion, admin, modulos_activos = [] } = req.body;

        // PASO 1: Validar email duplicado ANTES de crear la organización
        // Esto evita dejar organizaciones huérfanas sin admin
        const emailExistente = await UsuarioModel.buscarPorEmail(admin.email);
        if (emailExistente) {
            return ResponseHelper.error(res, 'Ya existe una cuenta con este email', 409);
        }

        // PASO 2: Preparar datos de la organización
        // NOTA Feb 2026: plan_actual eliminado de organizaciones
        // El plan se maneja via suscripciones_org (dogfooding hook)
        const organizacionData = {
            nombre_comercial: organizacion.nombre_comercial,
            razon_social: organizacion.razon_social,
            rfc_nif: organizacion.rfc,
            categoria_id: organizacion.categoria_id,
            plan: organizacion.plan || 'basico', // Solo para referencia, no se guarda en org
            telefono: organizacion.telefono_principal,
            email_admin: admin.email
        };

        // PASO 3: Crear organización
        // La suscripción se crea automáticamente via dogfooding hook en DogfoodingService
        const nuevaOrganizacion = await OrganizacionModel.crear(organizacionData);

        // PASO 4.5: Guardar módulos activos seleccionados durante el onboarding
        if (modulos_activos && modulos_activos.length > 0) {
            // Los módulos base (core, agendamiento) siempre están activos
            // Solo guardamos los módulos opcionales seleccionados
            const modulosActuales = {
                core: true,
                agendamiento: true
            };

            // Agregar módulos opcionales seleccionados
            modulos_activos.forEach(modulo => {
                modulosActuales[modulo] = true;
            });

            // Guardar en la organización
            await OrganizacionModel.actualizarModulosActivos(nuevaOrganizacion.id, modulosActuales);
        }

        // PASO 5: Crear usuario admin
        const adminData = {
            ...admin,
            organizacion_id: nuevaOrganizacion.id,
            rol: 'admin',
            activo: true,
            email_verificado: true
        };

        const nuevoAdmin = await UsuarioModel.crear(adminData);

        // Generar token JWT para el admin
        // FASE 7: Usar rol_id del sistema dinámico
        const token = authConfig.generateToken({
            userId: nuevoAdmin.id,
            email: nuevoAdmin.email,
            rolId: nuevoAdmin.rol_id,
            organizacionId: nuevaOrganizacion.id
        });

        // Preparar respuesta
        const resultado = {
            organizacion: nuevaOrganizacion,
            admin: {
                id: nuevoAdmin.id,
                nombre: nuevoAdmin.nombre,
                apellidos: nuevoAdmin.apellidos,
                email: nuevoAdmin.email,
                rol_id: nuevoAdmin.rol_id,
                token
            }
        };

        return ResponseHelper.success(res, resultado, 'Onboarding completado exitosamente', 201);
    });

    static obtenerMetricas = asyncHandler(async (req, res) => {
        const organizacionId = parseInt(req.params.id);

        // Validar acceso
        if (!this.validarAccesoOrganizacion(req, organizacionId)) {
            return ResponseHelper.error(res, 'No tienes permisos para acceder a esta información', 403);
        }

        const metricas = await OrganizacionModel.obtenerMetricas(
            organizacionId,
            req.query.periodo || 'mes'
        );

        return ResponseHelper.success(res, metricas);
    });

    /**
     * Obtener estado de suscripción de la organización
     * OPTIMIZADO Feb 2026: Query única combinada para mejor rendimiento
     */
    static obtenerEstadoSuscripcion = asyncHandler(async (req, res) => {
        const organizacionId = parseInt(req.params.id);

        // Validar acceso
        if (!this.validarAccesoOrganizacion(req, organizacionId)) {
            return ResponseHelper.error(res, 'No tienes permisos para acceder a esta información', 403);
        }

        // Query única que obtiene organización + suscripción + plan en una sola llamada
        const resultado = await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    o.id as org_id,
                    o.modulos_activos,
                    o.creado_en as org_creado_en,
                    s.id as suscripcion_id,
                    s.estado as suscripcion_estado,
                    s.es_trial,
                    s.fecha_fin_trial,
                    s.fecha_proximo_cobro,
                    p.codigo as plan_codigo,
                    p.nombre as plan_nombre,
                    p.modulos_habilitados,
                    p.dias_trial as plan_dias_trial
                FROM organizaciones o
                LEFT JOIN clientes c ON c.organizacion_vinculada_id = o.id
                LEFT JOIN suscripciones_org s ON s.cliente_id = c.id
                    AND s.estado IN ('activa', 'trial', 'pendiente_pago', 'grace_period', 'vencida')
                LEFT JOIN planes_suscripcion_org p ON s.plan_id = p.id
                WHERE o.id = $1
                ORDER BY
                    CASE s.estado
                        WHEN 'activa' THEN 1
                        WHEN 'trial' THEN 2
                        WHEN 'grace_period' THEN 3
                        WHEN 'pendiente_pago' THEN 4
                        WHEN 'vencida' THEN 5
                    END NULLS LAST,
                    s.creado_en DESC NULLS LAST
                LIMIT 1
            `;

            return (await db.query(query, [organizacionId])).rows[0];
        });

        // Organización no encontrada
        if (!resultado) {
            return ResponseHelper.notFound(res, 'Organización no encontrada');
        }

        const modulosActivos = resultado.modulos_activos || { core: true };

        // Si no hay suscripción activa, asumir trial basado en fecha de creación
        if (!resultado.suscripcion_id) {
            // Obtener plan trial (con cache en memoria para evitar queries repetidas)
            let planTrial = OrganizacionController._planTrialCache;
            const CACHE_TTL = 3600000; // 1 hora

            if (!planTrial || Date.now() - OrganizacionController._planTrialCacheTime > CACHE_TTL) {
                const planQuery = await RLSContextManager.withBypass(async (db) => {
                    return (await db.query(
                        `SELECT modulos_habilitados, dias_trial FROM planes_suscripcion_org WHERE codigo = 'trial' AND organizacion_id = $1`,
                        [NEXO_TEAM_ORG_ID]
                    )).rows[0];
                });
                planTrial = planQuery || { modulos_habilitados: [], dias_trial: 14 };
                OrganizacionController._planTrialCache = planTrial;
                OrganizacionController._planTrialCacheTime = Date.now();
            }

            const DIAS_TRIAL = planTrial.dias_trial || 14;
            let diasRestantesTrial = DIAS_TRIAL;
            let fechaFinTrial = null;

            if (resultado.org_creado_en) {
                const fechaCreacion = new Date(resultado.org_creado_en);
                fechaFinTrial = new Date(fechaCreacion);
                fechaFinTrial.setDate(fechaFinTrial.getDate() + DIAS_TRIAL);

                const hoy = new Date();
                const diffTime = fechaFinTrial.getTime() - hoy.getTime();
                diasRestantesTrial = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }

            return ResponseHelper.success(res, {
                plan_actual: 'trial',
                plan_nombre: 'Plan Trial',
                es_trial: true,
                dias_restantes_trial: diasRestantesTrial,
                fecha_fin_trial: fechaFinTrial,
                trial_expirado: diasRestantesTrial === 0,
                modulos_activos: modulosActivos,
                modulos_habilitados: planTrial.modulos_habilitados || []
            });
        }

        // Calcular días restantes de trial
        let diasRestantesTrial = 0;
        if (resultado.es_trial && resultado.fecha_fin_trial) {
            const finTrial = new Date(resultado.fecha_fin_trial);
            const hoy = new Date();
            const diffTime = finTrial.getTime() - hoy.getTime();
            diasRestantesTrial = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        const esTrial = resultado.es_trial || resultado.suscripcion_estado === 'trial';

        return ResponseHelper.success(res, {
            plan_actual: resultado.plan_codigo || 'trial',
            plan_nombre: resultado.plan_nombre || 'Plan Trial',
            es_trial: esTrial,
            dias_restantes_trial: diasRestantesTrial,
            fecha_fin_trial: resultado.fecha_fin_trial,
            trial_expirado: esTrial && diasRestantesTrial === 0,
            modulos_activos: modulosActivos,
            modulos_habilitados: resultado.modulos_habilitados || [],
            estado_suscripcion: resultado.suscripcion_estado,
            fecha_proximo_cobro: resultado.fecha_proximo_cobro
        });
    });

    // Cache estático para plan trial (evita queries repetidas)
    static _planTrialCache = null;
    static _planTrialCacheTime = 0;

    static cambiarPlan = asyncHandler(async (req, res) => {
        const { nuevo_plan, configuracion_plan = {} } = req.body;

        const resultado = await OrganizacionModel.cambiarPlan(
            parseInt(req.params.id),
            nuevo_plan,
            configuracion_plan
        );

        return ResponseHelper.success(res, resultado, 'Plan cambiado exitosamente');
    });

    static suspender = asyncHandler(async (req, res) => {
        const organizacionSuspendida = await OrganizacionModel.actualizar(parseInt(req.params.id), {
            activo: false,
            suspendido: true,
            motivo_suspension: req.body.motivo_suspension
        });

        if (!organizacionSuspendida) {
            return ResponseHelper.notFound(res, 'Organización no encontrada');
        }

        return ResponseHelper.success(res, organizacionSuspendida, 'Organización suspendida exitosamente');
    });

    static reactivar = asyncHandler(async (req, res) => {
        const organizacionReactivada = await OrganizacionModel.actualizar(parseInt(req.params.id), {
            activo: true,
            suspendido: false,
            motivo_suspension: null
        });

        if (!organizacionReactivada) {
            return ResponseHelper.notFound(res, 'Organización no encontrada');
        }

        return ResponseHelper.success(res, organizacionReactivada, 'Organización reactivada exitosamente');
    });
}

module.exports = OrganizacionController;