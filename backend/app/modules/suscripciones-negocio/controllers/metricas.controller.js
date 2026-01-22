/**
 * ====================================================================
 * CONTROLLER: MÉTRICAS SAAS
 * ====================================================================
 * Gestión de métricas clave de SaaS (MRR, ARR, Churn, LTV, etc.)
 *
 * @module controllers/metricas
 */

const asyncHandler = require('../../../middleware/asyncHandler');
const { MetricasModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');

class MetricasController {

    /**
     * Obtener dashboard completo de métricas
     * GET /api/v1/suscripciones-negocio/metricas/dashboard
     */
    static obtenerDashboard = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const options = {
            mes_actual: req.query.mes || null
        };

        const dashboard = await MetricasModel.obtenerDashboard(organizacionId, options);

        return ResponseHelper.success(res, dashboard);
    });

    /**
     * Calcular MRR (Monthly Recurring Revenue)
     * GET /api/v1/suscripciones-negocio/metricas/mrr
     */
    static calcularMRR = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const fecha = req.query.fecha || null;

        const mrr = await MetricasModel.calcularMRR(organizacionId, fecha);

        return ResponseHelper.success(res, { mrr, fecha: fecha || new Date().toISOString().split('T')[0] });
    });

    /**
     * Calcular ARR (Annual Recurring Revenue)
     * GET /api/v1/suscripciones-negocio/metricas/arr
     */
    static calcularARR = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const fecha = req.query.fecha || null;

        const arr = await MetricasModel.calcularARR(organizacionId, fecha);

        return ResponseHelper.success(res, { arr, fecha: fecha || new Date().toISOString().split('T')[0] });
    });

    /**
     * Calcular Churn Rate (tasa de cancelación)
     * GET /api/v1/suscripciones-negocio/metricas/churn
     */
    static calcularChurnRate = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const mes = req.query.mes || null;

        const churnRate = await MetricasModel.calcularChurnRate(organizacionId, mes);

        return ResponseHelper.success(res, {
            churn_rate: churnRate,
            mes: mes || new Date().toISOString().split('T')[0]
        });
    });

    /**
     * Calcular LTV (Lifetime Value)
     * GET /api/v1/suscripciones-negocio/metricas/ltv
     */
    static calcularLTV = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const ltv = await MetricasModel.calcularLTV(organizacionId);

        return ResponseHelper.success(res, { ltv });
    });

    /**
     * Obtener número de suscriptores activos
     * GET /api/v1/suscripciones-negocio/metricas/suscriptores-activos
     */
    static obtenerSuscriptoresActivos = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const fecha = req.query.fecha || null;

        const total = await MetricasModel.obtenerSuscriptoresActivos(organizacionId, fecha);

        return ResponseHelper.success(res, {
            total,
            fecha: fecha || new Date().toISOString().split('T')[0]
        });
    });

    /**
     * Obtener crecimiento mensual de MRR
     * GET /api/v1/suscripciones-negocio/metricas/crecimiento
     */
    static obtenerCrecimientoMensual = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const mes = req.query.mes || null;

        const crecimiento = await MetricasModel.obtenerCrecimientoMensual(organizacionId, mes);

        return ResponseHelper.success(res, {
            crecimiento_porcentaje: crecimiento,
            mes: mes || new Date().toISOString().split('T')[0]
        });
    });

    /**
     * Obtener distribución de suscriptores por estado
     * GET /api/v1/suscripciones-negocio/metricas/distribucion-estado
     */
    static obtenerDistribucionPorEstado = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const distribucion = await MetricasModel.obtenerDistribucionPorEstado(organizacionId);

        return ResponseHelper.success(res, distribucion);
    });

    /**
     * Obtener top planes más populares
     * GET /api/v1/suscripciones-negocio/metricas/top-planes
     */
    static obtenerTopPlanes = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const limit = parseInt(req.query.limit) || 10;

        const topPlanes = await MetricasModel.obtenerTopPlanes(organizacionId, limit);

        return ResponseHelper.success(res, topPlanes);
    });

    /**
     * Obtener evolución de MRR (últimos N meses)
     * GET /api/v1/suscripciones-negocio/metricas/evolucion-mrr
     */
    static obtenerEvolucionMRR = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const meses = parseInt(req.query.meses) || 12;

        const evolucion = await MetricasModel.obtenerEvolucionMRR(organizacionId, meses);

        return ResponseHelper.success(res, evolucion);
    });

    /**
     * Obtener evolución de Churn Rate (últimos N meses)
     * GET /api/v1/suscripciones-negocio/metricas/evolucion-churn
     */
    static obtenerEvolucionChurn = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const meses = parseInt(req.query.meses) || 12;

        const evolucion = await MetricasModel.obtenerEvolucionChurn(organizacionId, meses);

        return ResponseHelper.success(res, evolucion);
    });

    /**
     * Obtener evolución de suscriptores (nuevos, cancelados, neto)
     * GET /api/v1/suscripciones-negocio/metricas/evolucion-suscriptores
     */
    static obtenerEvolucionSuscriptores = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const meses = parseInt(req.query.meses) || 12;

        const evolucion = await MetricasModel.obtenerEvolucionSuscriptores(organizacionId, meses);

        return ResponseHelper.success(res, evolucion);
    });
}

module.exports = MetricasController;
