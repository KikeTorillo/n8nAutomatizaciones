/**
 * ====================================================================
 * JOBS INDEX - SUSCRIPCIONES-NEGOCIO
 * ====================================================================
 * Inicializa todos los cron jobs del módulo de suscripciones.
 */

const ProcesarCobrosJob = require('./procesar-cobros.job');
const VerificarTrialsJob = require('./verificar-trials.job');
const logger = require('../../../utils/logger');

class SuscripcionesJobs {
    /**
     * Inicializar todos los cron jobs
     */
    static init() {
        logger.info('Inicializando cron jobs de suscripciones-negocio...');

        ProcesarCobrosJob.init();
        VerificarTrialsJob.init();

        logger.info('✅ Todos los cron jobs de suscripciones-negocio inicializados');
    }
}

module.exports = SuscripcionesJobs;
