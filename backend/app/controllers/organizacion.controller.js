// Controller de Organizaciones - Gestión CRUD para tenants

const { OrganizacionModel } = require('../database');
const { ResponseHelper } = require('../utils/helpers');
const { asyncHandler } = require('../middleware');


class OrganizacionController {
    static crear = asyncHandler(async (req, res) => {
        const nuevaOrganizacion = await OrganizacionModel.crear(req.body);
        return ResponseHelper.success(res, nuevaOrganizacion, 'Organización creada exitosamente', 201);
    });

    static obtenerPorId = asyncHandler(async (req, res) => {
        const organizacion = await OrganizacionModel.obtenerPorId(parseInt(req.params.id));

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
            activo: req.query.activo === 'false' ? false : true
        };

        const resultado = await OrganizacionModel.listar(options);
        return ResponseHelper.success(res, resultado);
    });

    static actualizar = asyncHandler(async (req, res) => {
        const organizacionActualizada = await OrganizacionModel.actualizar(parseInt(req.params.id), req.body);

        if (!organizacionActualizada) {
            return ResponseHelper.notFound(res, 'Organización no encontrada');
        }

        return ResponseHelper.success(res, organizacionActualizada, 'Organización actualizada exitosamente');
    });

    static desactivar = asyncHandler(async (req, res) => {
        const desactivada = await OrganizacionModel.desactivar(parseInt(req.params.id));

        if (!desactivada) {
            return ResponseHelper.notFound(res, 'Organización no encontrada');
        }

        return ResponseHelper.success(res, { id: parseInt(req.params.id) }, 'Organización desactivada exitosamente');
    });

    static verificarLimites = asyncHandler(async (req, res) => {
        const limites = await OrganizacionModel.verificarLimites(parseInt(req.params.id));
        return ResponseHelper.success(res, limites);
    });

    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const estadisticas = await OrganizacionModel.obtenerEstadisticas(parseInt(req.params.id));
        return ResponseHelper.success(res, estadisticas);
    });

    static onboarding = asyncHandler(async (req, res) => {
        const { organizacion_data, importar_plantillas = true } = req.body;
        const resultado = await OrganizacionModel.onboarding(organizacion_data, importar_plantillas);

        return ResponseHelper.success(res, resultado, 'Onboarding completado exitosamente', 201);
    });

    static obtenerMetricas = asyncHandler(async (req, res) => {
        const metricas = await OrganizacionModel.obtenerMetricas(
            parseInt(req.params.id),
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