/**
 * ====================================================================
 * CRON JOB: PURGAR DATOS HISTORICOS
 * ====================================================================
 * Elimina datos historicos antiguos para mantener el rendimiento
 * de la base de datos y cumplir con politicas de retencion.
 *
 * Ejecucion: Dia 1 de cada mes a las 03:00 AM (0 3 1 * *)
 *
 * Politicas de retencion:
 * - uso_usuarios_org: 395 dias (~13 meses) para reportes anuales
 * - webhooks_procesados_org: 90 dias
 *
 * Caracteristicas:
 * - Eliminacion en lotes de 5000 registros para evitar bloqueos
 * - Usa RLSContextManager.withBypass() para operaciones cross-org
 * - Logging detallado con Winston
 *
 * @module suscripciones-negocio/jobs/purgar-datos-historicos
 * @version 1.0.0
 * @date Febrero 2026
 */

const cron = require('node-cron');
const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

// Configuracion de retencion (en dias)
const RETENCION_USO_USUARIOS = 395;      // ~13 meses para reportes anuales
const RETENCION_WEBHOOKS = 90;            // 3 meses

// Tamano de lote para eliminacion
const TAMANO_LOTE = 5000;

class PurgarDatosHistoricosJob {

    /**
     * Inicializar el cron job
     * Se ejecuta el dia 1 de cada mes a las 03:00 AM
     */
    static init() {
        cron.schedule('0 3 1 * *', async () => {
            await this.ejecutar();
        }, {
            scheduled: true,
            timezone: "America/Mexico_City"
        });

        logger.info('[PurgarDatosHistoricosJob] Job programado: dia 1 de cada mes a las 03:00 AM');
    }

    /**
     * Ejecutar la purga de datos historicos
     */
    static async ejecutar() {
        const horaInicio = new Date();

        logger.info('===================================================');
        logger.info('[PurgarDatosHistoricosJob] Iniciando purga de datos historicos');
        logger.info('===================================================');

        const resumen = {
            usoUsuarios: { eliminados: 0, errores: 0 },
            webhooks: { eliminados: 0, errores: 0 }
        };

        try {
            // Purgar uso_usuarios_org (395 dias)
            logger.info(`[PurgarDatosHistoricosJob] Purgando uso_usuarios_org (retencion: ${RETENCION_USO_USUARIOS} dias)...`);
            resumen.usoUsuarios = await this._purgarTabla(
                'uso_usuarios_org',
                'fecha',
                RETENCION_USO_USUARIOS
            );

            // Purgar webhooks_procesados_org (90 dias)
            logger.info(`[PurgarDatosHistoricosJob] Purgando webhooks_procesados_org (retencion: ${RETENCION_WEBHOOKS} dias)...`);
            resumen.webhooks = await this._purgarTabla(
                'webhooks_procesados_org',
                'procesado_en',
                RETENCION_WEBHOOKS
            );

        } catch (error) {
            logger.error('[PurgarDatosHistoricosJob] Error critico durante purga', {
                error: error.message,
                stack: error.stack
            });
        }

        // Resumen final
        const horaFin = new Date();
        const duracion = Math.round((horaFin - horaInicio) / 1000);

        logger.info('===================================================');
        logger.info('[PurgarDatosHistoricosJob] RESUMEN DE PURGA');
        logger.info('===================================================');
        logger.info(`uso_usuarios_org: ${resumen.usoUsuarios.eliminados} registros eliminados (${resumen.usoUsuarios.errores} errores)`);
        logger.info(`webhooks_procesados_org: ${resumen.webhooks.eliminados} registros eliminados (${resumen.webhooks.errores} errores)`);
        logger.info(`Duracion total: ${duracion} segundos`);
        logger.info('===================================================');

        return resumen;
    }

    /**
     * Purgar registros antiguos de una tabla en lotes
     *
     * @param {string} tabla - Nombre de la tabla a purgar
     * @param {string} campoFecha - Nombre del campo de fecha para filtrar
     * @param {number} diasRetencion - Dias de retencion
     * @returns {Promise<{eliminados: number, errores: number}>}
     */
    static async _purgarTabla(tabla, campoFecha, diasRetencion) {
        let totalEliminados = 0;
        let errores = 0;
        let loteActual = 0;

        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - diasRetencion);

        logger.info(`[PurgarDatosHistoricosJob] Fecha limite para ${tabla}: ${fechaLimite.toISOString()}`);

        try {
            // Contar registros a eliminar
            const totalAEliminar = await this._contarRegistrosAntiguos(tabla, campoFecha, fechaLimite);

            if (totalAEliminar === 0) {
                logger.info(`[PurgarDatosHistoricosJob] No hay registros antiguos en ${tabla}`);
                return { eliminados: 0, errores: 0 };
            }

            logger.info(`[PurgarDatosHistoricosJob] ${tabla}: ${totalAEliminar} registros a eliminar`);

            // Eliminar en lotes
            let eliminadosEnLote = TAMANO_LOTE;

            while (eliminadosEnLote === TAMANO_LOTE) {
                loteActual++;

                try {
                    eliminadosEnLote = await this._eliminarLote(tabla, campoFecha, fechaLimite);
                    totalEliminados += eliminadosEnLote;

                    if (eliminadosEnLote > 0) {
                        logger.debug(`[PurgarDatosHistoricosJob] ${tabla} lote ${loteActual}: ${eliminadosEnLote} eliminados (total: ${totalEliminados})`);
                    }

                    // Pequena pausa entre lotes para no saturar la BD
                    if (eliminadosEnLote === TAMANO_LOTE) {
                        await this._delay(100);
                    }

                } catch (loteError) {
                    errores++;
                    logger.error(`[PurgarDatosHistoricosJob] Error en lote ${loteActual} de ${tabla}`, {
                        error: loteError.message
                    });

                    // Si hay muchos errores consecutivos, detener
                    if (errores >= 5) {
                        logger.error(`[PurgarDatosHistoricosJob] Demasiados errores, deteniendo purga de ${tabla}`);
                        break;
                    }

                    // Continuar con el siguiente lote
                    eliminadosEnLote = TAMANO_LOTE;
                }
            }

            logger.info(`[PurgarDatosHistoricosJob] ${tabla}: completado. ${totalEliminados} registros eliminados en ${loteActual} lotes`);

        } catch (error) {
            errores++;
            logger.error(`[PurgarDatosHistoricosJob] Error purgando ${tabla}`, {
                error: error.message,
                stack: error.stack
            });
        }

        return { eliminados: totalEliminados, errores };
    }

    /**
     * Contar registros antiguos a eliminar
     *
     * @param {string} tabla - Nombre de la tabla
     * @param {string} campoFecha - Campo de fecha
     * @param {Date} fechaLimite - Fecha limite
     * @returns {Promise<number>}
     */
    static async _contarRegistrosAntiguos(tabla, campoFecha, fechaLimite) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT COUNT(*) as total
                FROM ${tabla}
                WHERE ${campoFecha} < $1
            `;

            const result = await db.query(query, [fechaLimite]);
            return parseInt(result.rows[0].total, 10);
        });
    }

    /**
     * Eliminar un lote de registros
     *
     * @param {string} tabla - Nombre de la tabla
     * @param {string} campoFecha - Campo de fecha
     * @param {Date} fechaLimite - Fecha limite
     * @returns {Promise<number>} - Cantidad de registros eliminados
     */
    static async _eliminarLote(tabla, campoFecha, fechaLimite) {
        return await RLSContextManager.withBypass(async (db) => {
            // Usar CTE para eliminar solo un lote
            const query = `
                WITH registros_a_eliminar AS (
                    SELECT id
                    FROM ${tabla}
                    WHERE ${campoFecha} < $1
                    LIMIT $2
                )
                DELETE FROM ${tabla}
                WHERE id IN (SELECT id FROM registros_a_eliminar)
            `;

            const result = await db.query(query, [fechaLimite, TAMANO_LOTE]);
            return result.rowCount;
        });
    }

    /**
     * Delay helper para pausas entre lotes
     * @param {number} ms - Milisegundos
     */
    static _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Ejecutar manualmente (para testing o mantenimiento)
     */
    static async ejecutarManual() {
        logger.info('[PurgarDatosHistoricosJob] Ejecutando manualmente...');
        return await this.ejecutar();
    }
}

module.exports = PurgarDatosHistoricosJob;
