// Controller de Organizaciones - Gestión CRUD para tenants

const { OrganizacionModel, UsuarioModel } = require('../database');
const { ResponseHelper } = require('../utils/helpers');
const { asyncHandler } = require('../middleware');
const authConfig = require('../config/auth');


class OrganizacionController {
    // Helper para validar acceso a organización
    static validarAccesoOrganizacion(req, organizacionId) {
        // super_admin puede acceder a cualquier organización
        if (req.user.rol === 'super_admin') {
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
            tipo_industria: req.query.tipo_industria,
            incluir_inactivas: req.query.incluir_inactivas
        };

        // Si NO es super_admin, solo puede listar su propia organización
        if (req.user.rol !== 'super_admin') {
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

    static onboarding = asyncHandler(async (req, res) => {
        const { organizacion, admin } = req.body;

        // Preparar datos de la organización
        const organizacionData = {
            nombre_comercial: organizacion.nombre_comercial,
            razon_social: organizacion.razon_social,
            rfc_nif: organizacion.rfc,
            tipo_industria: organizacion.tipo_industria,
            plan_actual: organizacion.plan || 'basico',
            telefono: organizacion.telefono_principal,
            email_admin: admin.email
        };

        // Crear organización
        const nuevaOrganizacion = await OrganizacionModel.crear(organizacionData);

        // Crear subscripción activa para la organización
        await OrganizacionModel.crearSubscripcionActiva(
            nuevaOrganizacion.id,
            organizacionData.plan_actual
        );

        // Crear usuario admin
        const adminData = {
            ...admin,
            organizacion_id: nuevaOrganizacion.id,
            rol: 'admin',
            activo: true,
            email_verificado: true
        };

        let nuevoAdmin;
        try {
            nuevoAdmin = await UsuarioModel.crear(adminData);
        } catch (error) {
            // Si el email está duplicado, retornar 409 (la org quedará sin admin y será inaccesible)
            if (error.message && error.message.includes('email ya está registrado')) {
                return ResponseHelper.error(res, 'El email del administrador ya está registrado en el sistema', 409);
            }
            throw error;
        }

        // Generar token JWT para el admin
        const token = authConfig.generateToken({
            userId: nuevoAdmin.id,
            email: nuevoAdmin.email,
            rol: nuevoAdmin.rol,
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
                rol: nuevoAdmin.rol,
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