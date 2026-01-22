/**
 * ====================================================================
 * MODEL: MÉTRICAS SAAS
 * ====================================================================
 * Gestión de métricas SaaS (MRR, ARR, Churn, LTV, etc.)
 * Envuelve funciones SQL de cálculo de métricas.
 *
 * @module models/metricas
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class MetricasModel {

    /**
     * Calcular MRR (Monthly Recurring Revenue)
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Date|string} fecha - Fecha de cálculo (default: hoy)
     * @returns {Promise<number>} - MRR total
     */
    static async calcularMRR(organizacionId, fecha = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT calcular_mrr($1, $2) as mrr`;
            const fechaParam = fecha || new Date().toISOString().split('T')[0];

            const result = await db.query(query, [organizacionId, fechaParam]);
            return parseFloat(result.rows[0]?.mrr || 0);
        });
    }

    /**
     * Calcular ARR (Annual Recurring Revenue)
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Date|string} fecha - Fecha de cálculo (default: hoy)
     * @returns {Promise<number>} - ARR total (MRR * 12)
     */
    static async calcularARR(organizacionId, fecha = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT calcular_arr($1, $2) as arr`;
            const fechaParam = fecha || new Date().toISOString().split('T')[0];

            const result = await db.query(query, [organizacionId, fechaParam]);
            return parseFloat(result.rows[0]?.arr || 0);
        });
    }

    /**
     * Calcular Churn Rate (tasa de cancelación) mensual
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Date|string} mes - Mes de cálculo (default: mes actual)
     * @returns {Promise<number>} - Porcentaje de churn (0-100)
     */
    static async calcularChurnRate(organizacionId, mes = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT calcular_churn_rate($1, $2) as churn_rate`;
            const mesParam = mes || new Date().toISOString().split('T')[0];

            const result = await db.query(query, [organizacionId, mesParam]);
            return parseFloat(result.rows[0]?.churn_rate || 0);
        });
    }

    /**
     * Calcular LTV (Lifetime Value) promedio
     *
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<number>} - LTV promedio de clientes cancelados
     */
    static async calcularLTV(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT calcular_ltv($1) as ltv`;

            const result = await db.query(query, [organizacionId]);
            return parseFloat(result.rows[0]?.ltv || 0);
        });
    }

    /**
     * Obtener número de suscriptores activos
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Date|string} fecha - Fecha de consulta (default: hoy)
     * @returns {Promise<number>} - Número de suscriptores activos
     */
    static async obtenerSuscriptoresActivos(organizacionId, fecha = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT obtener_suscriptores_activos($1, $2) as total`;
            const fechaParam = fecha || new Date().toISOString().split('T')[0];

            const result = await db.query(query, [organizacionId, fechaParam]);
            return parseInt(result.rows[0]?.total || 0);
        });
    }

    /**
     * Calcular crecimiento mensual de MRR
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Date|string} mes - Mes de cálculo (default: mes actual)
     * @returns {Promise<number>} - Porcentaje de crecimiento
     */
    static async obtenerCrecimientoMensual(organizacionId, mes = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT obtener_crecimiento_mensual($1, $2) as crecimiento`;
            const mesParam = mes || new Date().toISOString().split('T')[0];

            const result = await db.query(query, [organizacionId, mesParam]);
            return parseFloat(result.rows[0]?.crecimiento || 0);
        });
    }

    /**
     * Obtener distribución de suscriptores por estado
     *
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} - [{estado, cantidad}]
     */
    static async obtenerDistribucionPorEstado(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT * FROM obtener_distribucion_por_estado($1)`;

            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }

    /**
     * Obtener top planes más populares
     *
     * @param {number} organizacionId - ID de la organización
     * @param {number} limit - Número máximo de planes (default: 10)
     * @returns {Promise<Array>} - [{plan_id, plan_nombre, suscriptores, mrr}]
     */
    static async obtenerTopPlanes(organizacionId, limit = 10) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT * FROM obtener_top_planes($1, $2)`;

            const result = await db.query(query, [organizacionId, limit]);
            return result.rows.map(row => ({
                plan_id: row.plan_id,
                plan_nombre: row.plan_nombre,
                suscriptores: parseInt(row.suscriptores),
                mrr: parseFloat(row.mrr || 0)
            }));
        });
    }

    /**
     * Obtener dashboard completo de métricas
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Object>} - Dashboard con todas las métricas
     */
    static async obtenerDashboard(organizacionId, options = {}) {
        const { mes_actual = null } = options;

        return await RLSContextManager.query(organizacionId, async (db) => {
            const fecha = mes_actual || new Date().toISOString().split('T')[0];

            // Ejecutar todas las consultas en paralelo
            const [
                mrr,
                arr,
                churnRate,
                ltv,
                suscriptoresActivos,
                crecimiento,
                distribucion,
                topPlanes
            ] = await Promise.all([
                this.calcularMRR(organizacionId, fecha),
                this.calcularARR(organizacionId, fecha),
                this.calcularChurnRate(organizacionId, fecha),
                this.calcularLTV(organizacionId),
                this.obtenerSuscriptoresActivos(organizacionId, fecha),
                this.obtenerCrecimientoMensual(organizacionId, fecha),
                this.obtenerDistribucionPorEstado(organizacionId),
                this.obtenerTopPlanes(organizacionId, 5)
            ]);

            return {
                mrr,
                arr,
                churn_rate: churnRate,
                ltv,
                suscriptores_activos: suscriptoresActivos,
                crecimiento_mensual: crecimiento,
                distribucion_por_estado: distribucion,
                top_planes: topPlanes,
                fecha_calculo: fecha
            };
        });
    }

    /**
     * Obtener evolución de MRR por mes (últimos N meses)
     *
     * @param {number} organizacionId - ID de la organización
     * @param {number} meses - Número de meses hacia atrás (default: 12)
     * @returns {Promise<Array>} - [{mes, mrr, arr}]
     */
    static async obtenerEvolucionMRR(organizacionId, meses = 12) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const resultados = [];
            const hoy = new Date();

            for (let i = 0; i < meses; i++) {
                const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
                const ultimoDiaMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
                const fechaStr = ultimoDiaMes.toISOString().split('T')[0];

                const mrr = await this.calcularMRR(organizacionId, fechaStr);

                resultados.unshift({
                    mes: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`,
                    mrr,
                    arr: mrr * 12
                });
            }

            return resultados;
        });
    }

    /**
     * Obtener evolución de Churn Rate por mes (últimos N meses)
     *
     * @param {number} organizacionId - ID de la organización
     * @param {number} meses - Número de meses hacia atrás (default: 12)
     * @returns {Promise<Array>} - [{mes, churn_rate}]
     */
    static async obtenerEvolucionChurn(organizacionId, meses = 12) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const resultados = [];
            const hoy = new Date();

            for (let i = 0; i < meses; i++) {
                const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
                const fechaStr = fecha.toISOString().split('T')[0];

                const churnRate = await this.calcularChurnRate(organizacionId, fechaStr);

                resultados.unshift({
                    mes: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`,
                    churn_rate: churnRate
                });
            }

            return resultados;
        });
    }

    /**
     * Obtener resumen de nuevos suscriptores por mes
     *
     * @param {number} organizacionId - ID de la organización
     * @param {number} meses - Número de meses hacia atrás (default: 12)
     * @returns {Promise<Array>} - [{mes, nuevos, cancelados, neto}]
     */
    static async obtenerEvolucionSuscriptores(organizacionId, meses = 12) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                WITH meses_rango AS (
                    SELECT generate_series(
                        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '${meses} months'),
                        DATE_TRUNC('month', CURRENT_DATE),
                        '1 month'::interval
                    ) AS mes
                )
                SELECT
                    TO_CHAR(m.mes, 'YYYY-MM') as mes,
                    COUNT(DISTINCT s.id) FILTER (
                        WHERE s.fecha_inicio >= m.mes
                          AND s.fecha_inicio < m.mes + INTERVAL '1 month'
                    ) as nuevos,
                    COUNT(DISTINCT s.id) FILTER (
                        WHERE s.estado = 'cancelada'
                          AND s.fecha_fin >= m.mes
                          AND s.fecha_fin < m.mes + INTERVAL '1 month'
                    ) as cancelados,
                    COUNT(DISTINCT s.id) FILTER (
                        WHERE s.fecha_inicio >= m.mes
                          AND s.fecha_inicio < m.mes + INTERVAL '1 month'
                    ) - COUNT(DISTINCT s.id) FILTER (
                        WHERE s.estado = 'cancelada'
                          AND s.fecha_fin >= m.mes
                          AND s.fecha_fin < m.mes + INTERVAL '1 month'
                    ) as neto
                FROM meses_rango m
                LEFT JOIN suscripciones_org s ON s.organizacion_id = $1
                GROUP BY m.mes
                ORDER BY m.mes ASC
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows.map(row => ({
                mes: row.mes,
                nuevos: parseInt(row.nuevos),
                cancelados: parseInt(row.cancelados),
                neto: parseInt(row.neto)
            }));
        });
    }
}

module.exports = MetricasModel;
