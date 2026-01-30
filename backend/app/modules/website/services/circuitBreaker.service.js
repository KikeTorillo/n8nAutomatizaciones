/**
 * @fileoverview Circuit Breaker Distribuido Genérico
 *
 * Sistema de circuit breaker compartido entre instancias via Redis:
 * - Redis (DB 5) para estado distribuido
 * - Pub/Sub para sincronización en tiempo real
 * - Fallback a estado local si Redis no disponible
 * - Retry con backoff exponencial y jitter
 *
 * Estados del circuito:
 * - CLOSED: Funcionamiento normal, las requests pasan
 * - OPEN: Circuito abierto, las requests fallan inmediatamente
 * - HALF_OPEN: Probando reconexión, permite una request de prueba
 *
 * @author Backend Team
 * @version 2.0.0
 * @since 2026-01-29
 */

const RedisClientFactory = require('../../../services/RedisClientFactory');
const logger = require('../../../utils/logger');

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
 * Error lanzado cuando el circuito está abierto
 */
class CircuitOpenError extends Error {
    /**
     * @param {string} circuitName - Nombre del circuito
     * @param {number} timeUntilRetry - Tiempo hasta el próximo intento en ms
     */
    constructor(circuitName, timeUntilRetry) {
        super(`Circuit breaker [${circuitName}] is OPEN. Retry in ${Math.ceil(timeUntilRetry / 1000)}s`);
        this.name = 'CircuitOpenError';
        this.circuitName = circuitName;
        this.timeUntilRetry = timeUntilRetry;
        this.retryAfter = Math.ceil(timeUntilRetry / 1000);
    }
}

/**
 * Configuración por defecto del Circuit Breaker
 * @constant {Object}
 */
const DEFAULT_CONFIG = {
    /** Timeout en milisegundos para requests */
    timeoutMs: 10000,
    /** Número de fallas consecutivas para abrir el circuito */
    failureThreshold: 5,
    /** Tiempo en ms antes de intentar cerrar el circuito */
    resetTimeoutMs: 30000,
    /** TTL del estado en Redis (1 hora) */
    stateTtlSeconds: 3600,
    /** Configuración de retry */
    retry: {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 8000,
        jitter: true,
        backoffMultiplier: 2,
    },
};

/**
 * Circuit Breaker Distribuido Genérico
 *
 * Comparte estado entre instancias usando Redis. Si Redis no está disponible,
 * funciona con estado local (degradación graceful).
 *
 * @class CircuitBreaker
 */
class CircuitBreaker {
    /**
     * @param {string} name - Nombre único del circuit breaker
     * @param {Object} config - Configuración personalizada
     */
    constructor(name, config = {}) {
        this.name = name;
        this.config = { ...DEFAULT_CONFIG, ...config, retry: { ...DEFAULT_CONFIG.retry, ...config.retry } };

        /** @type {import('redis').RedisClientType|null} Cliente Redis */
        this.redisClient = null;

        /** @type {import('redis').RedisClientType|null} Suscriptor Pub/Sub */
        this.subscriberClient = null;

        /** @type {boolean} Redis disponible */
        this.redisAvailable = false;

        /** @type {boolean} Servicio inicializado */
        this.isInitialized = false;

        // Canal y clave Redis para este circuito específico
        this.channelName = `circuit:${name}:sync`;
        this.stateKey = `circuit:${name}:state`;

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
            this.redisClient = await RedisClientFactory.getClient(5, `CircuitBreaker:${this.name}`);

            if (!this.redisClient) {
                logger.info(`[CircuitBreaker:${this.name}] Redis no disponible, usando estado local`);
                this.isInitialized = true;
                return;
            }

            this.redisAvailable = true;

            // Cliente separado para Pub/Sub
            this.subscriberClient = await RedisClientFactory.createSubscriber(5, `CircuitBreaker:${this.name}:PubSub`);

            if (this.subscriberClient) {
                await this.subscriberClient.subscribe(this.channelName, (message) => {
                    this.handleSyncMessage(message);
                });

                logger.info(`[CircuitBreaker:${this.name}] Suscrito a canal de sincronización`, {
                    channel: this.channelName,
                });
            }

            // Cargar estado inicial desde Redis
            await this.loadStateFromRedis();

            this.isInitialized = true;
            logger.info(`[CircuitBreaker:${this.name}] Inicializado correctamente`);

        } catch (error) {
            logger.warn(`[CircuitBreaker:${this.name}] Error inicializando Redis, usando estado local`, {
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
            const stateJson = await this.redisClient.get(this.stateKey);
            if (stateJson) {
                const state = JSON.parse(stateJson);
                this.localState = {
                    state: state.state || CircuitState.CLOSED,
                    failureCount: state.failureCount || 0,
                    openedAt: state.openedAt || null,
                    lastError: state.lastError || null,
                };
                logger.debug(`[CircuitBreaker:${this.name}] Estado cargado desde Redis`, this.localState);
            }
        } catch (error) {
            logger.debug(`[CircuitBreaker:${this.name}] Error cargando estado desde Redis`, {
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
                this.stateKey,
                JSON.stringify(this.localState),
                { EX: this.config.stateTtlSeconds }
            );
        } catch (error) {
            logger.debug(`[CircuitBreaker:${this.name}] Error guardando estado en Redis`, {
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
                this.channelName,
                JSON.stringify({
                    action,
                    state: this.localState,
                    timestamp: Date.now(),
                    instanceId: process.pid,
                })
            );
        } catch (error) {
            logger.debug(`[CircuitBreaker:${this.name}] Error publicando cambio de estado`, {
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

            logger.debug(`[CircuitBreaker:${this.name}] Sincronizando estado desde otra instancia`, {
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
            logger.error(`[CircuitBreaker:${this.name}] Error procesando mensaje de sincronización`, {
                error: error.message,
            });
        }
    }

    /**
     * Calcula el delay para el siguiente retry con backoff exponencial y jitter
     * @private
     * @param {number} attempt - Número de intento (0-based)
     * @returns {number} Delay en milisegundos
     */
    calculateRetryDelay(attempt) {
        const { baseDelayMs, maxDelayMs, backoffMultiplier, jitter } = this.config.retry;

        // Backoff exponencial: baseDelay * (multiplier ^ attempt)
        let delay = baseDelayMs * Math.pow(backoffMultiplier, attempt);

        // Limitar al máximo
        delay = Math.min(delay, maxDelayMs);

        // Agregar jitter (0-50% del delay)
        if (jitter) {
            const jitterAmount = delay * 0.5 * Math.random();
            delay = delay + jitterAmount;
        }

        return Math.floor(delay);
    }

    /**
     * Espera un tiempo determinado
     * @private
     * @param {number} ms - Milisegundos a esperar
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Verifica si el circuito está abierto y actualiza estado si es necesario
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
            if (now - this.localState.openedAt >= this.config.resetTimeoutMs) {
                this.localState.state = CircuitState.HALF_OPEN;
                await this.saveStateToRedis();
                await this.publishStateChange('half_open');

                logger.info(`[CircuitBreaker:${this.name}] Circuito HALF_OPEN - intentando reconectar`);
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
        return Math.max(0, this.config.resetTimeoutMs - (Date.now() - this.localState.openedAt));
    }

    /**
     * Registra una falla
     * @async
     * @param {Error} error - Error ocurrido
     */
    async recordFailure(error) {
        this.localState.failureCount++;
        this.localState.lastError = error.message;

        if (this.localState.failureCount >= this.config.failureThreshold) {
            this.localState.state = CircuitState.OPEN;
            this.localState.openedAt = Date.now();

            logger.warn(`[CircuitBreaker:${this.name}] Circuito ABIERTO - demasiadas fallas consecutivas`, {
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
            logger.info(`[CircuitBreaker:${this.name}] Circuito CERRADO - conexión restaurada`);
        }

        await this.saveStateToRedis();
        await this.publishStateChange('success');
    }

    /**
     * Ejecuta una función con protección del circuit breaker y retry automático
     * @async
     * @template T
     * @param {() => Promise<T>} fn - Función a ejecutar
     * @param {Object} options - Opciones de ejecución
     * @param {boolean} [options.skipRetry=false] - Saltar reintentos
     * @returns {Promise<T>} Resultado de la función
     * @throws {CircuitOpenError} Si el circuito está abierto
     * @throws {Error} Si todos los reintentos fallan
     */
    async execute(fn, options = {}) {
        const { skipRetry = false } = options;
        const { maxRetries } = this.config.retry;

        // Verificar si el circuito está abierto
        if (await this.isOpen()) {
            const timeUntilRetry = this.getTimeUntilRetry();
            throw new CircuitOpenError(this.name, timeUntilRetry);
        }

        let lastError;
        const retries = skipRetry ? 0 : maxRetries;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // Ejecutar la función
                const result = await fn();

                // Éxito: resetear circuit breaker
                await this.recordSuccess();

                return result;

            } catch (error) {
                lastError = error;

                // Log del intento fallido
                if (attempt < retries) {
                    const delay = this.calculateRetryDelay(attempt);
                    logger.debug(`[CircuitBreaker:${this.name}] Intento ${attempt + 1}/${retries + 1} fallido, reintentando en ${delay}ms`, {
                        error: error.message,
                    });
                    await this.sleep(delay);
                }
            }
        }

        // Todos los intentos fallaron
        await this.recordFailure(lastError);
        throw lastError;
    }

    /**
     * Obtiene estado actual del circuit breaker
     * @returns {Object} Estado actual
     */
    getStatus() {
        return {
            name: this.name,
            state: this.localState.state,
            failureCount: this.localState.failureCount,
            lastError: this.localState.lastError,
            openedAt: this.localState.openedAt,
            timeUntilRetry: this.getTimeUntilRetry(),
            redisAvailable: this.redisAvailable,
            config: {
                timeoutMs: this.config.timeoutMs,
                failureThreshold: this.config.failureThreshold,
                resetTimeoutMs: this.config.resetTimeoutMs,
                retry: this.config.retry,
            },
        };
    }

    /**
     * Obtiene configuración de timeout
     * @returns {number} Timeout en milisegundos
     */
    getTimeoutMs() {
        return this.config.timeoutMs;
    }

    /**
     * Cierra conexiones
     * @async
     */
    async close() {
        try {
            if (this.subscriberClient && this.subscriberClient.isOpen) {
                await this.subscriberClient.unsubscribe(this.channelName);
                this.subscriberClient.removeAllListeners();
                await this.subscriberClient.quit();
            }

            this.redisAvailable = false;
            this.isInitialized = false;
            this.redisClient = null;
            this.subscriberClient = null;

            logger.info(`[CircuitBreaker:${this.name}] Conexiones cerradas`);
        } catch (error) {
            logger.error(`[CircuitBreaker:${this.name}] Error cerrando conexiones`, {
                error: error.message,
            });
        }
    }
}

/**
 * Factory para crear instancias de Circuit Breaker
 */
class CircuitBreakerFactory {
    /** @type {Map<string, CircuitBreaker>} Cache de instancias */
    static instances = new Map();

    /**
     * Obtiene o crea una instancia de Circuit Breaker
     * @param {string} name - Nombre único del circuit breaker
     * @param {Object} config - Configuración personalizada
     * @returns {CircuitBreaker}
     */
    static getInstance(name, config = {}) {
        if (!this.instances.has(name)) {
            this.instances.set(name, new CircuitBreaker(name, config));
        }
        return this.instances.get(name);
    }

    /**
     * Obtiene estado de todos los circuit breakers
     * @returns {Object} Estado de todos los circuitos
     */
    static getAllStatus() {
        const status = {};
        for (const [name, breaker] of this.instances) {
            status[name] = breaker.getStatus();
        }
        return status;
    }

    /**
     * Cierra todas las instancias
     * @async
     */
    static async closeAll() {
        for (const [name, breaker] of this.instances) {
            await breaker.close();
        }
        this.instances.clear();
    }
}

// ========== INSTANCIAS PREDEFINIDAS ==========

/**
 * Circuit Breaker para servicios de IA (OpenRouter)
 */
const aiCircuitBreaker = CircuitBreakerFactory.getInstance('ai:openrouter', {
    timeoutMs: 10000,
    failureThreshold: 5,
    resetTimeoutMs: 30000,
    retry: {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 8000,
        jitter: true,
        backoffMultiplier: 2,
    },
});

/**
 * Circuit Breaker para servicios de Unsplash
 */
const unsplashCircuitBreaker = CircuitBreakerFactory.getInstance('images:unsplash', {
    timeoutMs: 8000,
    failureThreshold: 5,
    resetTimeoutMs: 30000,
    retry: {
        maxRetries: 2,
        baseDelayMs: 200,
        maxDelayMs: 4000,
        jitter: true,
        backoffMultiplier: 2,
    },
});

module.exports = {
    CircuitBreaker,
    CircuitBreakerFactory,
    CircuitOpenError,
    CircuitState,
    aiCircuitBreaker,
    unsplashCircuitBreaker,
};
