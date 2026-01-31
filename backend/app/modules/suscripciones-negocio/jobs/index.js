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
 * - 20:00 (día 28) - Ajustar monto preapproval MercadoPago (seat-based billing)
 * - 23:55 PM - Registrar uso diario de usuarios (seat-based billing)
 * - Cada 5 min - Polling MercadoPago (fallback webhooks)
 */

const ProcesarCobrosJob = require('./procesar-cobros.job');
const VerificarTrialsJob = require('./verificar-trials.job');
const ProcesarDunningJob = require('./procesar-dunning.job');
const PollingSuscripcionesJob = require('./polling-suscripciones.job');
const RegistrarUsoUsuariosJob = require('./registrar-uso-usuarios.job');
const MonitorearWebhooksJob = require('./monitorear-webhooks.job');
const AjustarPreapprovalJob = require('./ajustar-preapproval.job');
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
        RegistrarUsoUsuariosJob.init();
        MonitorearWebhooksJob.init();
        AjustarPreapprovalJob.init();

        logger.info('✅ Todos los cron jobs de suscripciones-negocio inicializados');
    }
}

module.exports = SuscripcionesJobs;
