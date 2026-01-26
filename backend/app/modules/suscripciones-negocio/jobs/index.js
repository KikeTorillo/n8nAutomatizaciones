/**
 * ====================================================================
 * JOBS INDEX - SUSCRIPCIONES-NEGOCIO
 * ====================================================================
 * Inicializa todos los cron jobs del módulo de suscripciones.
 *
 * Cronograma:
 * - 06:00 AM - Procesar cobros automáticos
 * - 07:00 AM - Verificar trials expirados
 * - 08:00 AM - Procesar dunning (vencida → grace_period → suspendida)
 * - Cada 5 min - Polling MercadoPago (fallback webhooks)
 */

const ProcesarCobrosJob = require('./procesar-cobros.job');
const VerificarTrialsJob = require('./verificar-trials.job');
const ProcesarDunningJob = require('./procesar-dunning.job');
const PollingSuscripcionesJob = require('./polling-suscripciones.job');
const logger = require('../../../utils/logger');

class SuscripcionesJobs {
    /**
     * Inicializar todos los cron jobs
     */
    static init() {
        logger.info('Inicializando cron jobs de suscripciones-negocio...');

        ProcesarCobrosJob.init();
        VerificarTrialsJob.init();
        ProcesarDunningJob.init();
        PollingSuscripcionesJob.init();

        logger.info('✅ Todos los cron jobs de suscripciones-negocio inicializados');
    }
}

module.exports = SuscripcionesJobs;
