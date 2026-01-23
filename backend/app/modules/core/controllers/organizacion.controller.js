// Controller de Organizaciones - Gestión CRUD para tenants

const { OrganizacionModel, UsuarioModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const authConfig = require('../../../config/auth');


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
        const organizacionData = {
            nombre_comercial: organizacion.nombre_comercial,
            razon_social: organizacion.razon_social,
            rfc_nif: organizacion.rfc,
            categoria_id: organizacion.categoria_id,
            plan_actual: organizacion.plan || 'basico',
            telefono: organizacion.telefono_principal,
            email_admin: admin.email
        };

        // PASO 3: Crear organización
        const nuevaOrganizacion = await OrganizacionModel.crear(organizacionData);

        // PASO 4: Crear subscripción trial para TODOS los planes
        // ✅ NUEVO FLUJO: Todos empiezan con trial (14 días para planes de pago)
        // - trial/custom: trial indefinido sin pago requerido
        // - basico/profesional: trial de 14 días, luego activan pago desde dashboard
        const diasTrial = 14; // Trial de 14 días para planes de pago
        await OrganizacionModel.crearSubscripcionActiva(
            nuevaOrganizacion.id,
            organizacionData.plan_actual,
            diasTrial
        );

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
     * Usado para mostrar el TrialBanner en el frontend
     */
    static obtenerEstadoSuscripcion = asyncHandler(async (req, res) => {
        const organizacionId = parseInt(req.params.id);

        // Validar acceso
        if (!this.validarAccesoOrganizacion(req, organizacionId)) {
            return ResponseHelper.error(res, 'No tienes permisos para acceder a esta información', 403);
        }

        const organizacion = await OrganizacionModel.obtenerPorId(organizacionId);

        if (!organizacion) {
            return ResponseHelper.notFound(res, 'Organización no encontrada');
        }

        const planActual = organizacion.plan_actual || 'trial';
        const esTrial = planActual === 'trial';

        // Calcular días restantes del trial (14 días desde creación)
        const DIAS_TRIAL = 14;
        let diasRestantesTrial = 0;
        let fechaFinTrial = null;

        if (esTrial && organizacion.creado_en) {
            const fechaCreacion = new Date(organizacion.creado_en);
            fechaFinTrial = new Date(fechaCreacion);
            fechaFinTrial.setDate(fechaFinTrial.getDate() + DIAS_TRIAL);

            const hoy = new Date();
            const diffTime = fechaFinTrial.getTime() - hoy.getTime();
            diasRestantesTrial = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        return ResponseHelper.success(res, {
            plan_actual: planActual,
            plan_nombre: planActual === 'trial' ? 'Plan Trial' : planActual === 'pro' ? 'Plan Pro' : planActual,
            es_trial: esTrial,
            dias_restantes_trial: diasRestantesTrial,
            fecha_fin_trial: fechaFinTrial,
            trial_expirado: esTrial && diasRestantesTrial === 0,
            modulos_activos: organizacion.modulos_activos || {}
        });
    });

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