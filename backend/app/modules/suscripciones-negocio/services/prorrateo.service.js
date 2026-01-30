/**
 * ====================================================================
 * SERVICE: PRORRATEO DE SUSCRIPCIONES
 * ====================================================================
 * Calcula y aplica prorrateos al cambiar de plan mid-term.
 *
 * Reglas de prorrateo:
 * - Upgrade: Cobra diferencia prorrateada inmediatamente
 * - Downgrade: Genera crédito para próxima factura
 *
 * Fórmulas:
 * - factor = diasRestantes / diasTotales
 * - creditoPlanAnterior = precioActual × factor
 * - cargoPlanNuevo = precioNuevo × factor
 * - diferencia = cargoPlanNuevo - creditoPlanAnterior
 *
 * @module services/prorrateo
 * @version 1.0.0
 * @date Enero 2026
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class ProrrateoService {

    /**
     * Días por período de facturación
     */
    static DIAS_POR_PERIODO = {
        mensual: 30,
        trimestral: 90,
        semestral: 180,
        anual: 365
    };

    /**
     * Calcular prorrateo al cambiar de plan
     *
     * @param {number} suscripcionId - ID de la suscripción actual
     * @param {number} nuevoPlanId - ID del plan destino
     * @returns {Promise<Object>} - Detalle del prorrateo
     */
    static async calcularProrrateo(suscripcionId, nuevoPlanId) {
        return await RLSContextManager.withBypass(async (db) => {
            // Obtener suscripción actual con plan
            const suscQuery = `
                SELECT
                    s.id, s.organizacion_id, s.plan_id, s.periodo,
                    s.precio_actual, s.fecha_inicio, s.fecha_proximo_cobro,
                    s.moneda, s.estado,
                    p.nombre as plan_nombre, p.codigo as plan_codigo,
                    p.precio_mensual, p.precio_trimestral, p.precio_anual
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                WHERE s.id = $1
            `;
            const suscResult = await db.query(suscQuery, [suscripcionId]);
            const suscripcion = suscResult.rows[0];

            if (!suscripcion) {
                throw new Error(`Suscripción ${suscripcionId} no encontrada`);
            }

            // Obtener nuevo plan
            const planQuery = `
                SELECT
                    id, nombre, codigo,
                    precio_mensual, precio_trimestral, precio_anual,
                    usuarios_incluidos, precio_usuario_adicional
                FROM planes_suscripcion_org
                WHERE id = $1
            `;
            const planResult = await db.query(planQuery, [nuevoPlanId]);
            const nuevoPlan = planResult.rows[0];

            if (!nuevoPlan) {
                throw new Error(`Plan ${nuevoPlanId} no encontrado`);
            }

            // Calcular precio del nuevo plan según período actual
            const precioNuevo = this._obtenerPrecioPorPeriodo(nuevoPlan, suscripcion.periodo);
            const precioActual = parseFloat(suscripcion.precio_actual) || 0;

            // Calcular días del período
            const diasTotales = this.DIAS_POR_PERIODO[suscripcion.periodo] || 30;

            // Calcular días usados y restantes
            const hoy = new Date();
            const fechaInicioPeriodo = this._calcularInicioPeriodoActual(suscripcion);
            const diasUsados = Math.max(0, Math.floor((hoy - fechaInicioPeriodo) / (1000 * 60 * 60 * 24)));
            const diasRestantes = Math.max(0, diasTotales - diasUsados);

            // Factor de prorrateo
            const factor = diasRestantes / diasTotales;

            // Calcular crédito y cargo
            const creditoPlanAnterior = precioActual * factor;
            const cargoPlanNuevo = precioNuevo * factor;
            const diferencia = cargoPlanNuevo - creditoPlanAnterior;

            // Determinar tipo de cambio
            const esUpgrade = precioNuevo > precioActual;
            const tipo = esUpgrade ? 'upgrade' : 'downgrade';

            return {
                // Identificadores
                suscripcionId,
                planActualId: suscripcion.plan_id,
                planNuevoId: nuevoPlanId,

                // Nombres
                planActualNombre: suscripcion.plan_nombre,
                planNuevoNombre: nuevoPlan.nombre,

                // Precios completos
                precioActual,
                precioNuevo,

                // Cálculo de prorrateo
                creditoPlanAnterior: Math.round(creditoPlanAnterior * 100) / 100,
                cargoPlanNuevo: Math.round(cargoPlanNuevo * 100) / 100,
                diferencia: Math.round(diferencia * 100) / 100,

                // Detalles del período
                diasUsados,
                diasRestantes,
                diasTotales,
                factor: Math.round(factor * 10000) / 10000,
                periodo: suscripcion.periodo,

                // Tipo de cambio
                tipo,
                esUpgrade,

                // Moneda
                moneda: suscripcion.moneda || 'MXN',

                // Acciones requeridas
                requiereCobroInmediato: diferencia > 0,
                requiereCredito: diferencia < 0,

                // Mensaje para UI
                mensaje: this._generarMensajeProrrateo(tipo, diferencia, diasRestantes, suscripcion.moneda)
            };
        });
    }

    /**
     * Aplicar prorrateo a una suscripción
     *
     * @param {number} suscripcionId - ID de la suscripción
     * @param {Object} prorrateo - Resultado de calcularProrrateo()
     * @returns {Promise<Object>} - Resultado de la aplicación
     */
    static async aplicarProrrateo(suscripcionId, prorrateo) {
        return await RLSContextManager.withBypass(async (db) => {
            const { diferencia, esUpgrade, creditoPlanAnterior, cargoPlanNuevo, diasRestantes, diasTotales } = prorrateo;

            // Obtener organización de la suscripción
            const suscResult = await db.query(
                `SELECT organizacion_id FROM suscripciones_org WHERE id = $1`,
                [suscripcionId]
            );
            const organizacionId = suscResult.rows[0]?.organizacion_id;

            if (!organizacionId) {
                throw new Error(`Suscripción ${suscripcionId} no encontrada`);
            }

            let resultado = {
                exito: true,
                tipo: esUpgrade ? 'upgrade' : 'downgrade',
                montoAplicado: Math.abs(diferencia)
            };

            if (diferencia > 0) {
                // UPGRADE: Registrar cargo pendiente
                // El cobro real se hace por separado (MercadoPago/Stripe)

                // Registrar ajuste de facturación
                await db.query(`
                    INSERT INTO ajustes_facturacion_org (
                        organizacion_id, suscripcion_id,
                        tipo, monto, descripcion,
                        dias_prorrateados, dias_periodo
                    ) VALUES ($1, $2, 'prorrateo_cargo', $3, $4, $5, $6)
                `, [
                    organizacionId,
                    suscripcionId,
                    diferencia,
                    `Prorrateo por upgrade: ${prorrateo.planActualNombre} → ${prorrateo.planNuevoNombre}`,
                    diasRestantes,
                    diasTotales
                ]);

                // Actualizar ajuste pendiente en suscripción
                await db.query(`
                    UPDATE suscripciones_org
                    SET ajuste_pendiente = COALESCE(ajuste_pendiente, 0) + $1,
                        actualizado_en = NOW()
                    WHERE id = $2
                `, [diferencia, suscripcionId]);

                resultado.mensaje = `Cargo de $${diferencia.toFixed(2)} registrado por upgrade`;
                resultado.requiereCobroInmediato = true;
                resultado.montoCobrar = diferencia;

                logger.info(`Prorrateo upgrade aplicado: Suscripción ${suscripcionId}, cargo $${diferencia}`);

            } else if (diferencia < 0) {
                // DOWNGRADE: Generar crédito para próxima factura
                const credito = Math.abs(diferencia);

                // Registrar ajuste de facturación
                await db.query(`
                    INSERT INTO ajustes_facturacion_org (
                        organizacion_id, suscripcion_id,
                        tipo, monto, descripcion,
                        dias_prorrateados, dias_periodo
                    ) VALUES ($1, $2, 'prorrateo_credito', $3, $4, $5, $6)
                `, [
                    organizacionId,
                    suscripcionId,
                    credito,
                    `Crédito por downgrade: ${prorrateo.planActualNombre} → ${prorrateo.planNuevoNombre}`,
                    diasRestantes,
                    diasTotales
                ]);

                // Actualizar crédito pendiente en suscripción
                await db.query(`
                    UPDATE suscripciones_org
                    SET credito_pendiente = COALESCE(credito_pendiente, 0) + $1,
                        actualizado_en = NOW()
                    WHERE id = $2
                `, [credito, suscripcionId]);

                resultado.mensaje = `Crédito de $${credito.toFixed(2)} aplicado para próxima factura`;
                resultado.creditoGenerado = credito;

                logger.info(`Prorrateo downgrade aplicado: Suscripción ${suscripcionId}, crédito $${credito}`);

            } else {
                resultado.mensaje = 'Sin ajuste necesario (mismo precio)';
            }

            return resultado;
        });
    }

    /**
     * Obtener historial de ajustes de una suscripción
     *
     * @param {number} suscripcionId - ID de la suscripción
     * @returns {Promise<Array>} - Lista de ajustes
     */
    static async obtenerHistorialAjustes(suscripcionId) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    id, tipo, monto, descripcion,
                    usuarios_base, usuarios_facturados, precio_unitario,
                    dias_prorrateados, dias_periodo,
                    pago_id, creado_en
                FROM ajustes_facturacion_org
                WHERE suscripcion_id = $1
                ORDER BY creado_en DESC
                LIMIT 50
            `;
            const result = await db.query(query, [suscripcionId]);
            return result.rows;
        });
    }

    /**
     * Calcular crédito/ajuste pendiente total
     *
     * @param {number} suscripcionId - ID de la suscripción
     * @returns {Promise<Object>} - { creditoPendiente, ajustePendiente, neto }
     */
    static async obtenerBalanceAjustes(suscripcionId) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    COALESCE(credito_pendiente, 0) as credito_pendiente,
                    COALESCE(ajuste_pendiente, 0) as ajuste_pendiente
                FROM suscripciones_org
                WHERE id = $1
            `;
            const result = await db.query(query, [suscripcionId]);
            const row = result.rows[0];

            if (!row) {
                return { creditoPendiente: 0, ajustePendiente: 0, neto: 0 };
            }

            const creditoPendiente = parseFloat(row.credito_pendiente) || 0;
            const ajustePendiente = parseFloat(row.ajuste_pendiente) || 0;

            return {
                creditoPendiente,
                ajustePendiente,
                neto: ajustePendiente - creditoPendiente
            };
        });
    }

    /**
     * Aplicar balance de ajustes a un cobro
     * Llamado durante el procesamiento de cobro automático
     *
     * @param {number} suscripcionId - ID de la suscripción
     * @param {number} pagoId - ID del pago
     * @returns {Promise<Object>} - { creditoAplicado, ajusteAplicado, montoNeto }
     */
    static async aplicarBalanceACobro(suscripcionId, pagoId) {
        return await RLSContextManager.withBypass(async (db) => {
            const balance = await this.obtenerBalanceAjustes(suscripcionId);

            // Resetear balance en suscripción
            await db.query(`
                UPDATE suscripciones_org
                SET credito_pendiente = 0,
                    ajuste_pendiente = 0,
                    actualizado_en = NOW()
                WHERE id = $1
            `, [suscripcionId]);

            // Actualizar ajustes no asociados a pago con este pago_id
            await db.query(`
                UPDATE ajustes_facturacion_org
                SET pago_id = $1
                WHERE suscripcion_id = $2 AND pago_id IS NULL
            `, [pagoId, suscripcionId]);

            logger.info(`Balance aplicado al cobro: Suscripción ${suscripcionId}, Pago ${pagoId}`, balance);

            return {
                creditoAplicado: balance.creditoPendiente,
                ajusteAplicado: balance.ajustePendiente,
                montoNeto: balance.neto
            };
        });
    }

    // =========================================================================
    // MÉTODOS PRIVADOS
    // =========================================================================

    /**
     * Obtener precio según período
     * @private
     */
    static _obtenerPrecioPorPeriodo(plan, periodo) {
        switch (periodo) {
            case 'mensual':
                return parseFloat(plan.precio_mensual) || 0;
            case 'trimestral':
                return parseFloat(plan.precio_trimestral) || (parseFloat(plan.precio_mensual) || 0) * 3;
            case 'semestral':
                return (parseFloat(plan.precio_mensual) || 0) * 6;
            case 'anual':
                return parseFloat(plan.precio_anual) || (parseFloat(plan.precio_mensual) || 0) * 12;
            default:
                return parseFloat(plan.precio_mensual) || 0;
        }
    }

    /**
     * Calcular inicio del período actual basado en fecha_proximo_cobro
     * @private
     */
    static _calcularInicioPeriodoActual(suscripcion) {
        const fechaProximoCobro = new Date(suscripcion.fecha_proximo_cobro);
        const diasPeriodo = this.DIAS_POR_PERIODO[suscripcion.periodo] || 30;

        // El inicio del período actual es la fecha de próximo cobro menos los días del período
        const inicioPeriodo = new Date(fechaProximoCobro);
        inicioPeriodo.setDate(inicioPeriodo.getDate() - diasPeriodo);

        return inicioPeriodo;
    }

    /**
     * Generar mensaje descriptivo para UI
     * @private
     */
    static _generarMensajeProrrateo(tipo, diferencia, diasRestantes, moneda = 'MXN') {
        const montoAbs = Math.abs(diferencia).toFixed(2);

        if (tipo === 'upgrade') {
            if (diferencia > 0) {
                return `Se cobrará $${montoAbs} ${moneda} por los ${diasRestantes} días restantes del período actual.`;
            }
            return `Cambio sin costo adicional para este período.`;
        } else {
            if (diferencia < 0) {
                return `Recibirás un crédito de $${montoAbs} ${moneda} en tu próxima factura por los ${diasRestantes} días no utilizados.`;
            }
            return `Cambio sin crédito para este período.`;
        }
    }
}

module.exports = ProrrateoService;
