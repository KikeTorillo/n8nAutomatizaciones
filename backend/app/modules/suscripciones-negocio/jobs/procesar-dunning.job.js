/**
 * ====================================================================
 * CRON JOB: PROCESAR DUNNING (COBROS FALLIDOS)
 * ====================================================================
 * Gestiona la secuencia de dunning para suscripciones con cobros fallidos.
 * Envía recordatorios y realiza transiciones automáticas:
 *   vencida → grace_period (día 7) → suspendida (día 14)
 *
 * Se ejecuta todos los días a las 8:00 AM.
 *
 * @module jobs/procesar-dunning
 */

const cron = require('node-cron');
const { SuscripcionesModel } = require('../models');
const NotificacionesService = require('../services/notificaciones.service');
const logger = require('../../../utils/logger');
const RLSContextManager = require('../../../utils/rlsContextManager');
const { DUNNING_SEQUENCE, GRACE_PERIOD_DAYS, SUSPENSION_DAYS } = require('../../../config/constants');

class ProcesarDunningJob {

    /**
     * Cambiar estado con Lock Optimista
     * Evita race conditions con webhooks usando `actualizado_en` como versión
     *
     * @param {Object} db - Conexión de base de datos
     * @param {number} suscripcionId - ID de la suscripción
     * @param {string} nuevoEstado - Nuevo estado a aplicar
     * @param {Date|string} actualizadoEnOriginal - Timestamp original para verificación
     * @param {Object} options - Opciones adicionales (razon, etc.)
     * @returns {Promise<boolean>} - true si se actualizó, false si webhook ya procesó
     */
    static async _cambiarEstadoConLock(db, suscripcionId, nuevoEstado, actualizadoEnOriginal, options = {}) {
        const { GRACE_PERIOD_DAYS } = require('../../../config/constants');

        // Construir campos adicionales según el nuevo estado
        let camposAdicionales = '';
        const values = [nuevoEstado, suscripcionId, actualizadoEnOriginal];

        if (nuevoEstado === 'grace_period') {
            camposAdicionales = `, fecha_gracia = CURRENT_DATE + ${GRACE_PERIOD_DAYS}`;
        }

        const result = await db.query(`
            UPDATE suscripciones_org
            SET estado = $1, actualizado_en = NOW()${camposAdicionales}
            WHERE id = $2
              AND actualizado_en = $3
              AND estado NOT IN ('activa', 'cancelada')
            RETURNING id
        `, values);

        if (result.rowCount === 0) {
            // El webhook ya actualizó la suscripción o el estado cambió
            logger.info(`[Dunning] Lock optimista falló para suscripción ${suscripcionId}: webhook probablemente ya procesó el cambio`, {
                suscripcion_id: suscripcionId,
                intento_estado: nuevoEstado,
                actualizado_en_esperado: actualizadoEnOriginal
            });
            return false;
        }

        logger.info(`[Dunning] Estado actualizado con lock optimista: Suscripción ${suscripcionId} → ${nuevoEstado}`, {
            suscripcion_id: suscripcionId,
            nuevo_estado: nuevoEstado,
            razon: options.razon || 'Transición automática por dunning'
        });

        return true;
    }

    /**
     * Iniciar cron job
     */
    static init() {
        // Ejecutar todos los días a las 8:00 AM
        cron.schedule('0 8 * * *', async () => {
            await this.ejecutar();
        }, {
            scheduled: true,
            timezone: "America/Mexico_City"
        });

        logger.info('✅ Cron job "procesar-dunning" inicializado (8:00 AM diario)');
    }

    /**
     * Ejecutar procesamiento de dunning
     */
    static async ejecutar() {
        const horaInicio = new Date();
        logger.info('═══════════════════════════════════════════════');
        logger.info('📧 Iniciando procesamiento de dunning');
        logger.info('═══════════════════════════════════════════════');

        try {
            const hoy = new Date();

            // Contadores
            const resumen = {
                total_procesadas: 0,
                emails_enviados: 0,
                transiciones_grace_period: 0,
                transiciones_suspendida: 0,
                omitidas_por_webhook: 0,
                errores: 0
            };

            // 1. Obtener suscripciones vencidas (para transición a grace_period)
            const vencidas = await this._obtenerSuscripcionesVencidas();
            logger.info(`📋 Suscripciones vencidas a procesar: ${vencidas.length}`);

            for (const suscripcion of vencidas) {
                try {
                    resumen.total_procesadas++;
                    const diasVencida = this._calcularDiasDesde(suscripcion.actualizado_en, hoy);

                    logger.debug(`Procesando suscripción ${suscripcion.id} - Días vencida: ${diasVencida}`);

                    // Determinar acción según días de vencimiento
                    const accion = this._determinarAccion(diasVencida, 'vencida');

                    if (accion) {
                        if (accion.tipo === 'email') {
                            await NotificacionesService.enviarFalloPago(
                                suscripcion,
                                null,
                                'Cobro fallido - Actualiza tu método de pago',
                                accion.intentos_restantes
                            );
                            resumen.emails_enviados++;
                            logger.info(`📧 Email ${accion.subtipo} enviado: Suscripción ${suscripcion.id}`);
                        } else if (accion.tipo === 'cambiar_estado' && accion.nuevo_estado === 'grace_period') {
                            // Usar lock optimista para evitar race conditions con webhooks
                            const actualizado = await RLSContextManager.withBypass(async (db) => {
                                return await this._cambiarEstadoConLock(
                                    db,
                                    suscripcion.id,
                                    'grace_period',
                                    suscripcion.actualizado_en,
                                    { razon: 'Transición automática por dunning' }
                                );
                            });

                            if (actualizado) {
                                resumen.transiciones_grace_period++;
                                logger.info(`⏳ Suscripción ${suscripcion.id} movida a grace_period`);
                            } else {
                                resumen.omitidas_por_webhook++;
                                logger.info(`⏭️ Suscripción ${suscripcion.id} omitida: ya fue actualizada por webhook`);
                            }
                        }
                    }
                } catch (error) {
                    resumen.errores++;
                    logger.error(`❌ Error procesando suscripción vencida ${suscripcion.id}`, {
                        error: error.message
                    });
                }
            }

            // 2. Obtener suscripciones en grace_period (para transición a suspendida)
            const enGracePeriod = await this._obtenerSuscripcionesGracePeriod();
            logger.info(`📋 Suscripciones en grace_period a procesar: ${enGracePeriod.length}`);

            for (const suscripcion of enGracePeriod) {
                try {
                    resumen.total_procesadas++;

                    // Verificar si el período de gracia ha expirado
                    if (suscripcion.fecha_gracia) {
                        const fechaGracia = new Date(suscripcion.fecha_gracia);

                        if (hoy >= fechaGracia) {
                            // Grace period expirado → suspender con lock optimista
                            const actualizado = await RLSContextManager.withBypass(async (db) => {
                                return await this._cambiarEstadoConLock(
                                    db,
                                    suscripcion.id,
                                    'suspendida',
                                    suscripcion.actualizado_en,
                                    { razon: 'Grace period expirado - transición automática' }
                                );
                            });

                            if (actualizado) {
                                resumen.transiciones_suspendida++;
                                logger.warn(`🚫 Suscripción ${suscripcion.id} suspendida (grace period expirado)`);
                            } else {
                                resumen.omitidas_por_webhook++;
                                logger.info(`⏭️ Suscripción ${suscripcion.id} omitida: ya fue actualizada por webhook`);
                            }
                        } else {
                            // Calcular días restantes y enviar recordatorio urgente
                            const diasRestantes = this._calcularDiasDesde(hoy, fechaGracia);

                            if (diasRestantes <= 3) {
                                await NotificacionesService.enviarGracePeriod(suscripcion);
                                resumen.emails_enviados++;
                                logger.info(`📧 Email urgente enviado: Suscripción ${suscripcion.id} (${diasRestantes} días restantes)`);
                            }
                        }
                    }
                } catch (error) {
                    resumen.errores++;
                    logger.error(`❌ Error procesando suscripción en grace_period ${suscripcion.id}`, {
                        error: error.message
                    });
                }
            }

            // 3. Procesar recordatorios para suscripciones activas (3 días antes del cobro)
            const proximasACobrar = await this._obtenerProximasACobrar(hoy, 3);
            logger.info(`📋 Suscripciones con cobro próximo: ${proximasACobrar.length}`);

            for (const suscripcion of proximasACobrar) {
                try {
                    await NotificacionesService.enviarRecordatorioCobro(suscripcion, 3);
                    resumen.emails_enviados++;
                    logger.info(`📧 Recordatorio de cobro enviado: Suscripción ${suscripcion.id}`);
                } catch (error) {
                    logger.error(`Error enviando recordatorio: Suscripción ${suscripcion.id}`, {
                        error: error.message
                    });
                }
            }

            // Resumen final
            const horaFin = new Date();
            const duracion = Math.round((horaFin - horaInicio) / 1000);

            logger.info('\n═══════════════════════════════════════════════');
            logger.info('📊 RESUMEN DE PROCESAMIENTO DE DUNNING');
            logger.info('═══════════════════════════════════════════════');
            logger.info(`📋 Total procesadas: ${resumen.total_procesadas}`);
            logger.info(`📧 Emails enviados: ${resumen.emails_enviados}`);
            logger.info(`⏳ Transiciones a grace_period: ${resumen.transiciones_grace_period}`);
            logger.info(`🚫 Transiciones a suspendida: ${resumen.transiciones_suspendida}`);
            logger.info(`⏭️  Omitidas por webhook: ${resumen.omitidas_por_webhook}`);
            logger.info(`❌ Errores: ${resumen.errores}`);
            logger.info(`⏱️  Duración: ${duracion} segundos`);
            logger.info('═══════════════════════════════════════════════\n');

        } catch (error) {
            logger.error('❌ Error crítico en procesamiento de dunning', {
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Determinar acción según días de vencimiento y estado actual
     *
     * @param {number} dias - Días desde el cambio de estado
     * @param {string} estadoActual - Estado actual de la suscripción
     * @returns {Object|null} - Acción a tomar o null
     */
    static _determinarAccion(dias, estadoActual) {
        // Buscar en DUNNING_SEQUENCE la acción correspondiente
        for (const paso of DUNNING_SEQUENCE) {
            if (dias === paso.dias) {
                if (paso.accion === 'email') {
                    return {
                        tipo: 'email',
                        subtipo: paso.tipo,
                        intentos_restantes: Math.max(0, Math.floor((GRACE_PERIOD_DAYS - dias) / 3))
                    };
                } else if (paso.accion === 'cambiar_estado') {
                    if (paso.tipo === 'grace_period' && estadoActual === 'vencida') {
                        return { tipo: 'cambiar_estado', nuevo_estado: 'grace_period' };
                    } else if (paso.tipo === 'suspension' && estadoActual === 'grace_period') {
                        return { tipo: 'cambiar_estado', nuevo_estado: 'suspendida' };
                    }
                }
            }
        }
        return null;
    }

    /**
     * Calcular días entre dos fechas
     *
     * @param {Date|string} fechaInicio - Fecha inicial
     * @param {Date|string} fechaFin - Fecha final
     * @returns {number} - Días de diferencia
     */
    static _calcularDiasDesde(fechaInicio, fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        const diffTime = Math.abs(fin - inicio);
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Obtener suscripciones en estado vencida
     *
     * @returns {Promise<Array>} - Lista de suscripciones vencidas
     */
    static async _obtenerSuscripcionesVencidas() {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    s.*,
                    p.nombre as plan_nombre,
                    c.email as cliente_email,
                    c.nombre as cliente_nombre
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                WHERE s.estado = 'vencida'
                ORDER BY s.actualizado_en ASC
            `;

            const result = await db.query(query);
            return result.rows;
        });
    }

    /**
     * Obtener suscripciones en estado grace_period
     *
     * @returns {Promise<Array>} - Lista de suscripciones en grace_period
     */
    static async _obtenerSuscripcionesGracePeriod() {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    s.*,
                    p.nombre as plan_nombre,
                    c.email as cliente_email,
                    c.nombre as cliente_nombre
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                WHERE s.estado = 'grace_period'
                ORDER BY s.fecha_gracia ASC
            `;

            const result = await db.query(query);
            return result.rows;
        });
    }

    /**
     * Obtener suscripciones activas próximas a cobrar
     *
     * @param {Date} hoy - Fecha actual
     * @param {number} diasAntes - Días antes del cobro
     * @returns {Promise<Array>} - Lista de suscripciones
     */
    static async _obtenerProximasACobrar(hoy, diasAntes) {
        return await RLSContextManager.withBypass(async (db) => {
            const fechaCobro = new Date(hoy);
            fechaCobro.setDate(fechaCobro.getDate() + diasAntes);
            const fechaCobroStr = fechaCobro.toISOString().split('T')[0];

            const query = `
                SELECT
                    s.*,
                    p.nombre as plan_nombre,
                    c.email as cliente_email,
                    c.nombre as cliente_nombre
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                WHERE s.estado = 'activa'
                  AND s.auto_cobro = TRUE
                  AND s.fecha_proximo_cobro = $1
                ORDER BY s.organizacion_id, s.id
            `;

            const result = await db.query(query, [fechaCobroStr]);
            return result.rows;
        });
    }

    /**
     * Método auxiliar para enviar notificación de suspensión por fallo de cobro
     * (usado por el job de verificar-trials también)
     *
     * @param {Object} suscripcion - Suscripción
     * @returns {Promise<void>}
     */
    static async enviarSuspensionPorFalloCobro(suscripcion) {
        try {
            await NotificacionesService.enviarSuspension(suscripcion);
        } catch (error) {
            logger.error(`Error enviando notificación de suspensión: ${suscripcion.id}`, {
                error: error.message
            });
        }
    }
}

module.exports = ProcesarDunningJob;
