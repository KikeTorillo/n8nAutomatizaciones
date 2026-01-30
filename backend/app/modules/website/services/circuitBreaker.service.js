/**
 * @fileoverview Circuit Breaker Distribuido para servicios de IA
 *
 * Sistema de circuit breaker compartido entre instancias via Redis:
 * - Redis (DB 5) para estado distribuido
 * - Pub/Sub para sincronización en tiempo real
 * - Fallback a estado local si Redis no disponible
 *
 * Estados del circuito:
 * - CLOSED: Funcionamiento normal, las requests pasan
 * - OPEN: Circuito abierto, las requests fallan inmediatamente
 * - HALF_OPEN: Probando reconexión, permite una request de prueba
 *
 * @author Backend Team
 * @version 1.0.0
 * @since 2026-01-29
 */

const RedisClientFactory = require('../../../services/RedisClientFactory');
const logger = require('../../../utils/logger');

/**
 * Canal de Pub/Sub para sincronización del circuit breaker
 * @constant {string}
 */
const CHANNEL_CIRCUIT_SYNC = 'circuit:ai:sync';

/**
 * Clave Redis para estado del circuit breaker
 * @constant {string}
 */
const CIRCUIT_STATE_KEY = 'circuit:ai:openrouter:state';

/**
 * Configuración del Circuit Breaker
 * @constant {Object}
 */
const CONFIG = {
    /** Timeout en milisegundos para requests a OpenRouter */
    TIMEOUT_MS: 10000,
    /** Número de fallas consecutivas para abrir el circuito */
    FAILURE_THRESHOLD: 5,
    /** Tiempo en ms antes de intentar cerrar el circuito */
    RESET_TIMEOUT_MS: 30000,
    /** TTL del estado en Redis (1 hora) */
    STATE_TTL_SECONDS: 3600,
};

/**
 * Estados posibles del circuito
 * @enum {string}
 */
const CircuitState = {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HALF_OPEN',
};

/**
 * Circuit Breaker Distribuido para servicios de IA
 *
 * Comparte estado entre instancias usando Redis. Si Redis no está disponible,
 * funciona con estado local (degradación graceful).
 *
 * @class AICircuitBreaker
 */
class AICircuitBreaker {
    constructor() {
        /** @type {import('redis').RedisClientType|null} Cliente Redis */
        this.redisClient = null;

        /** @type {import('redis').RedisClientType|null} Suscriptor Pub/Sub */
        this.subscriberClient = null;

        /** @type {boolean} Redis disponible */
        this.redisAvailable = false;

        /** @type {boolean} Servicio inicializado */
        this.isInitialized = false;

        // Estado local (fallback y cache)
        this.localState = {
            state: CircuitState.CLOSED,
            failureCount: 0,
            openedAt: null,
            lastError: null,
        };

        // Inicializar conexión Redis
        this.initRedis();
    }

    /**
     * Inicializa conexión a Redis
     * @private
     * @async
     */
    async initRedis() {
        try {
            // Usar DB 5 (misma que websiteCache)
            this.redisClient = await RedisClientFactory.getClient(5, 'AICircuitBreaker');

            if (!this.redisClient) {
                logger.info('[AICircuitBreaker] Redis no disponible, usando estado local');
                this.isInitialized = true;
                return;
            }

            this.redisAvailable = true;

            // Cliente separado para Pub/Sub
            this.subscriberClient = await RedisClientFactory.createSubscriber(5, 'AICircuitBreakerPubSub');

            if (this.subscriberClient) {
                await this.subscriberClient.subscribe(CHANNEL_CIRCUIT_SYNC, (message) => {
                    this.handleSyncMessage(message);
                });

                logger.info('[AICircuitBreaker] Suscrito a canal de sincronización', {
                    channel: CHANNEL_CIRCUIT_SYNC,
                });
            }

            // Cargar estado inicial desde Redis
            await this.loadStateFromRedis();

            this.isInitialized = true;
            logger.info('[AICircuitBreaker] Inicializado correctamente');

        } catch (error) {
            logger.warn('[AICircuitBreaker] Error inicializando Redis, usando estado local', {
                error: error.message,
            });
            this.redisClient = null;
            this.subscriberClient = null;
            this.redisAvailable = false;
            this.isInitialized = true;
        }
    }

    /**
     * Carga estado desde Redis
     * @private
     * @async
     */
    async loadStateFromRedis() {
        if (!this.redisClient || !this.redisAvailable) return;

        try {
            const stateJson = await this.redisClient.get(CIRCUIT_STATE_KEY);
            if (stateJson) {
                const state = JSON.parse(stateJson);
                this.localState = {
                    state: state.state || CircuitState.CLOSED,
                    failureCount: state.failureCount || 0,
                    openedAt: state.openedAt || null,
                    lastError: state.lastError || null,
                };
                logger.debug('[AICircuitBreaker] Estado cargado desde Redis', this.localState);
            }
        } catch (error) {
            logger.debug('[AICircuitBreaker] Error cargando estado desde Redis', {
                error: error.message,
            });
        }
    }

    /**
     * Guarda estado en Redis
     * @private
     * @async
     */
    async saveStateToRedis() {
        if (!this.redisClient || !this.redisAvailable) return;

        try {
            await this.redisClient.set(
                CIRCUIT_STATE_KEY,
                JSON.stringify(this.localState),
                { EX: CONFIG.STATE_TTL_SECONDS }
            );
        } catch (error) {
            logger.debug('[AICircuitBreaker] Error guardando estado en Redis', {
                error: error.message,
            });
        }
    }

    /**
     * Publica cambio de estado a otras instancias
     * @private
     * @async
     * @param {string} action - Acción realizada
     */
    async publishStateChange(action) {
        if (!this.redisClient || !this.redisAvailable) return;

        try {
            await this.redisClient.publish(
                CHANNEL_CIRCUIT_SYNC,
                JSON.stringify({
                    action,
                    state: this.localState,
                    timestamp: Date.now(),
                    instanceId: process.pid,
                })
            );
        } catch (error) {
            logger.debug('[AICircuitBreaker] Error publicando cambio de estado', {
                error: error.message,
            });
        }
    }

    /**
     * Maneja mensajes de sincronización de otras instancias
     * @private
     * @param {string} message - Mensaje JSON
     */
    handleSyncMessage(message) {
        try {
            const data = JSON.parse(message);

            // Ignorar mensajes propios
            if (data.instanceId === process.pid) return;

            logger.debug('[AICircuitBreaker] Sincronizando estado desde otra instancia', {
                fromInstance: data.instanceId,
                action: data.action,
            });

            // Actualizar estado local
            if (data.state) {
                this.localState = {
                    state: data.state.state || CircuitState.CLOSED,
                    failureCount: data.state.failureCount || 0,
                    openedAt: data.state.openedAt || null,
                    lastError: data.state.lastError || null,
                };
            }
        } catch (error) {
            logger.error('[AICircuitBreaker] Error procesando mensaje de sincronización', {
                error: error.message,
            });
        }
    }

    /**
     * Verifica si el circuito está abierto
     * @async
     * @returns {Promise<boolean>} true si el circuito está abierto
     */
    async isOpen() {
        // Recargar estado desde Redis si disponible
        if (this.redisAvailable) {
            await this.loadStateFromRedis();
        }

        if (this.localState.state === CircuitState.OPEN) {
            const now = Date.now();
            // Verificar si es tiempo de intentar cerrar
            if (now - this.localState.openedAt >= CONFIG.RESET_TIMEOUT_MS) {
                this.localState.state = CircuitState.HALF_OPEN;
                await this.saveStateToRedis();
                await this.publishStateChange('half_open');

                logger.info('[AICircuitBreaker] Circuito HALF_OPEN - intentando reconectar');
                return false;
            }
            return true;
        }

        return false;
    }

    /**
     * Obtiene tiempo restante hasta retry
     * @returns {number} Milisegundos hasta próximo retry
     */
    getTimeUntilRetry() {
        if (this.localState.state !== CircuitState.OPEN) return 0;
        return Math.max(0, CONFIG.RESET_TIMEOUT_MS - (Date.now() - this.localState.openedAt));
    }

    /**
     * Registra una falla
     * @async
     * @param {Error} error - Error ocurrido
     */
    async recordFailure(error) {
        this.localState.failureCount++;
        this.localState.lastError = error.message;

        if (this.localState.failureCount >= CONFIG.FAILURE_THRESHOLD) {
            this.localState.state = CircuitState.OPEN;
            this.localState.openedAt = Date.now();

            logger.warn('[AICircuitBreaker] Circuito ABIERTO - demasiadas fallas consecutivas', {
                failureCount: this.localState.failureCount,
                lastError: this.localState.lastError,
            });
        }

        await this.saveStateToRedis();
        await this.publishStateChange('failure');
    }

    /**
     * Registra un éxito y resetea el circuito
     * @async
     */
    async recordSuccess() {
        const wasOpen = this.localState.state !== CircuitState.CLOSED;

        this.localState.failureCount = 0;
        this.localState.lastError = null;
        this.localState.state = CircuitState.CLOSED;
        this.localState.openedAt = null;

        if (wasOpen) {
            logger.info('[AICircuitBreaker] Circuito CERRADO - conexión restaurada');
        }

        await this.saveStateToRedis();
        await this.publishStateChange('success');
    }

    /**
     * Obtiene estado actual del circuit breaker
     * @returns {Object} Estado actual
     */
    getStatus() {
        return {
            state: this.localState.state,
            failureCount: this.localState.failureCount,
            lastError: this.localState.lastError,
            openedAt: this.localState.openedAt,
            timeUntilRetry: this.getTimeUntilRetry(),
            redisAvailable: this.redisAvailable,
            config: {
                timeoutMs: CONFIG.TIMEOUT_MS,
                failureThreshold: CONFIG.FAILURE_THRESHOLD,
                resetTimeoutMs: CONFIG.RESET_TIMEOUT_MS,
            },
        };
    }

    /**
     * Obtiene configuración de timeout
     * @returns {number} Timeout en milisegundos
     */
    getTimeoutMs() {
        return CONFIG.TIMEOUT_MS;
    }

    /**
     * Cierra conexiones
     * @async
     */
    async close() {
        try {
            if (this.subscriberClient && this.subscriberClient.isOpen) {
                await this.subscriberClient.unsubscribe(CHANNEL_CIRCUIT_SYNC);
                this.subscriberClient.removeAllListeners();
                await this.subscriberClient.quit();
            }

            this.redisAvailable = false;
            this.isInitialized = false;
            this.redisClient = null;
            this.subscriberClient = null;

            logger.info('[AICircuitBreaker] Conexiones cerradas');
        } catch (error) {
            logger.error('[AICircuitBreaker] Error cerrando conexiones', {
                error: error.message,
            });
        }
    }
}

// Exportar instancia singleton
const aiCircuitBreaker = new AICircuitBreaker();

module.exports = aiCircuitBreaker;
