const { ReportesModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

/**
 * Controller para reportes contables
 *
 * NO MIGRADO a BaseCrudController - Ene 2026
 * Razones:
 * - 100% métodos custom (9 métodos), sin operaciones CRUD estándar
 * - Es un controller de reportes/consultas, no de entidades CRUD
 */
class ReportesController {

    /**
     * Obtener resumen del dashboard contable
     * GET /api/v1/contabilidad/dashboard
     */
    static obtenerDashboard = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const resumen = await ReportesModel.obtenerResumenDashboard(organizacionId);

        return ResponseHelper.success(res, resumen);
    });

    /**
     * Obtener Balanza de Comprobación
     * GET /api/v1/contabilidad/reportes/balanza
     *
     * Query params:
     * - periodo_id: ID del período (requerido)
     */
    static obtenerBalanza = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const periodoId = req.query.periodo_id ? parseInt(req.query.periodo_id) : null;

        if (!periodoId) {
            return ResponseHelper.badRequest(res, 'Se requiere el parámetro periodo_id');
        }

        const balanza = await ReportesModel.obtenerBalanzaComprobacion(periodoId, organizacionId);

        return ResponseHelper.success(res, balanza, 'Balanza de comprobación obtenida');
    });

    /**
     * Obtener Libro Mayor de una cuenta
     * GET /api/v1/contabilidad/reportes/libro-mayor
     *
     * Query params:
     * - cuenta_id: ID de la cuenta (requerido)
     * - fecha_inicio: YYYY-MM-DD (requerido)
     * - fecha_fin: YYYY-MM-DD (requerido)
     */
    static obtenerLibroMayor = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { cuenta_id, fecha_inicio, fecha_fin } = req.query;

        if (!cuenta_id || !fecha_inicio || !fecha_fin) {
            return ResponseHelper.badRequest(res, 'Se requieren cuenta_id, fecha_inicio y fecha_fin');
        }

        const libroMayor = await ReportesModel.obtenerLibroMayor(
            parseInt(cuenta_id),
            fecha_inicio,
            fecha_fin,
            organizacionId
        );

        return ResponseHelper.success(res, libroMayor, 'Libro mayor obtenido');
    });

    /**
     * Obtener Estado de Resultados
     * GET /api/v1/contabilidad/reportes/estado-resultados
     *
     * Query params:
     * - fecha_inicio: YYYY-MM-DD (requerido)
     * - fecha_fin: YYYY-MM-DD (requerido)
     */
    static obtenerEstadoResultados = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { fecha_inicio, fecha_fin } = req.query;

        if (!fecha_inicio || !fecha_fin) {
            return ResponseHelper.badRequest(res, 'Se requieren fecha_inicio y fecha_fin');
        }

        const estadoResultados = await ReportesModel.obtenerEstadoResultados(
            fecha_inicio,
            fecha_fin,
            organizacionId
        );

        return ResponseHelper.success(res, estadoResultados, 'Estado de resultados obtenido');
    });

    /**
     * Obtener Balance General
     * GET /api/v1/contabilidad/reportes/balance-general
     *
     * Query params:
     * - fecha: YYYY-MM-DD (requerido)
     */
    static obtenerBalanceGeneral = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { fecha } = req.query;

        if (!fecha) {
            return ResponseHelper.badRequest(res, 'Se requiere el parámetro fecha');
        }

        const balance = await ReportesModel.obtenerBalanceGeneral(fecha, organizacionId);

        return ResponseHelper.success(res, balance, 'Balance general obtenido');
    });

    /**
     * Listar períodos contables
     * GET /api/v1/contabilidad/periodos
     *
     * Query params:
     * - anio: Filtrar por año
     */
    static listarPeriodos = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const anio = req.query.anio ? parseInt(req.query.anio) : null;

        const periodos = await ReportesModel.listarPeriodos(organizacionId, anio);

        return ResponseHelper.success(res, periodos, 'Períodos obtenidos');
    });

    /**
     * Cerrar período contable
     * POST /api/v1/contabilidad/periodos/:id/cerrar
     */
    static cerrarPeriodo = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const resultado = await ReportesModel.cerrarPeriodo(parseInt(id), organizacionId, usuarioId);

        return ResponseHelper.success(res, resultado);
    });

    /**
     * Obtener configuración contable
     * GET /api/v1/contabilidad/configuracion
     */
    static obtenerConfiguracion = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const config = await ReportesModel.obtenerConfiguracion(organizacionId);

        if (!config) {
            return ResponseHelper.notFound(res, 'No existe configuración contable. Inicialice primero el catálogo SAT.');
        }

        return ResponseHelper.success(res, config, 'Configuración obtenida');
    });

    /**
     * Actualizar configuración contable
     * PUT /api/v1/contabilidad/configuracion
     */
    static actualizarConfiguracion = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const config = await ReportesModel.actualizarConfiguracion(req.body, organizacionId, usuarioId);

        return ResponseHelper.success(res, config, 'Configuración actualizada');
    });
}

module.exports = ReportesController;
