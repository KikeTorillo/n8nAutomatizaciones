/**
 * ====================================================================
 * CIRCUIT BREAKER - Patrón de Resiliencia
 * ====================================================================
 * Protege contra fallos en cascada al llamar a servicios externos.
 *
 * Estados:
 * - CLOSED: Normal, todas las llamadas pasan
 * - OPEN: Circuito abierto, rechaza llamadas inmediatamente
 * - HALF_OPEN: Permite una llamada de prueba para verificar recuperación
 *
 * @module utils/circuitBreaker
 * @version 1.0.0
 * @date Enero 2026
 */

const logger = require('./logger');

class CircuitBreaker {
    static STATES = {
        CLOSED: 'CLOSED',
        OPEN: 'OPEN',
        HALF_OPEN: 'HALF_OPEN'
    };

    /**
     * @param {Object} options - Opciones de configuración
     * @param {number} options.maxFailures - Fallos consecutivos para abrir circuito (default: 5)
     * @param {number} options.resetTimeout - Tiempo en ms para intentar recuperación (default: 60000)
     * @param {number} options.halfOpenMaxCalls - Llamadas permitidas en HALF_OPEN (default: 1)
     * @param {string} options.name - Nombre del circuit breaker para logging
     * @param {Function} options.onStateChange - Callback cuando cambia el estado
     */
    constructor(options = {}) {
        this.maxFailures = options.maxFailures || 5;
        this.resetTimeout = options.resetTimeout || 60000; // 1 minuto
        this.halfOpenMaxCalls = options.halfOpenMaxCalls || 1;
        this.name = options.name || 'CircuitBreaker';
        this.onStateChange = options.onStateChange || null;

        this.state = CircuitBreaker.STATES.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.lastFailureTime = null;
        this.nextAttempt = 0;
        this.halfOpenCalls = 0;
    }

    /**
     * Ejecutar una función protegida por el circuit breaker
     *
     * @param {Function} fn - Función async a ejecutar
     * @returns {Promise<any>} - Resultado de la función
     * @throws {Error} - Si el circuito está abierto o la función falla
     */
    async execute(fn) {
        // Verificar si debemos intentar recuperación
        if (this.state === CircuitBreaker.STATES.OPEN) {
            if (Date.now() >= this.nextAttempt) {
                this._transitionTo(CircuitBreaker.STATES.HALF_OPEN);
            } else {
                const waitTime = Math.ceil((this.nextAttempt - Date.now()) / 1000);
                throw new Error(
                    `[${this.name}] Circuit breaker OPEN - servicio temporalmente no disponible. ` +
                    `Reintente en ${waitTime} segundos.`
                );
            }
        }

        // En HALF_OPEN, limitar llamadas
        if (this.state === CircuitBreaker.STATES.HALF_OPEN) {
            if (this.halfOpenCalls >= this.halfOpenMaxCalls) {
                throw new Error(
                    `[${this.name}] Circuit breaker en modo de prueba. ` +
                    `Espere a que se complete la verificación.`
                );
            }
            this.halfOpenCalls++;
        }

        try {
            const result = await fn();
            this._onSuccess();
            return result;
        } catch (error) {
            this._onFailure(error);
            throw error;
        }
    }

    /**
     * Registrar éxito
     * @private
     */
    _onSuccess() {
        this.failures = 0;
        this.successes++;

        if (this.state === CircuitBreaker.STATES.HALF_OPEN) {
            // Recuperación exitosa, cerrar circuito
            this._transitionTo(CircuitBreaker.STATES.CLOSED);
            this.halfOpenCalls = 0;
        }

        logger.debug(`[${this.name}] Llamada exitosa`, {
            state: this.state,
            successes: this.successes
        });
    }

    /**
     * Registrar fallo
     * @private
     */
    _onFailure(error) {
        this.failures++;
        this.lastFailureTime = Date.now();
        this.successes = 0;

        logger.warn(`[${this.name}] Fallo registrado`, {
            failures: this.failures,
            maxFailures: this.maxFailures,
            state: this.state,
            error: error.message
        });

        if (this.state === CircuitBreaker.STATES.HALF_OPEN) {
            // Fallo en modo prueba, volver a abrir
            this._transitionTo(CircuitBreaker.STATES.OPEN);
            this.halfOpenCalls = 0;
        } else if (this.failures >= this.maxFailures) {
            // Demasiados fallos, abrir circuito
            this._transitionTo(CircuitBreaker.STATES.OPEN);
        }
    }

    /**
     * Transicionar a nuevo estado
     * @private
     */
    _transitionTo(newState) {
        const oldState = this.state;
        this.state = newState;

        if (newState === CircuitBreaker.STATES.OPEN) {
            this.nextAttempt = Date.now() + this.resetTimeout;
            logger.error(`[${this.name}] CIRCUITO ABIERTO`, {
                failures: this.failures,
                nextAttempt: new Date(this.nextAttempt).toISOString(),
                resetTimeoutMs: this.resetTimeout
            });
        } else if (newState === CircuitBreaker.STATES.HALF_OPEN) {
            logger.info(`[${this.name}] Circuito en modo prueba (HALF_OPEN)`);
        } else if (newState === CircuitBreaker.STATES.CLOSED) {
            logger.info(`[${this.name}] Circuito recuperado (CLOSED)`);
            this.failures = 0;
        }

        // Ejecutar callback si existe
        if (this.onStateChange && oldState !== newState) {
            try {
                this.onStateChange(oldState, newState, this.getStats());
            } catch (err) {
                logger.error(`[${this.name}] Error en onStateChange callback`, err);
            }
        }
    }

    /**
     * Forzar apertura del circuito (para testing o emergencias)
     */
    forceOpen() {
        this._transitionTo(CircuitBreaker.STATES.OPEN);
    }

    /**
     * Forzar cierre del circuito (reset manual)
     */
    forceClose() {
        this.failures = 0;
        this.halfOpenCalls = 0;
        this._transitionTo(CircuitBreaker.STATES.CLOSED);
    }

    /**
     * Obtener estadísticas del circuit breaker
     * @returns {Object}
     */
    getStats() {
        return {
            name: this.name,
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            lastFailureTime: this.lastFailureTime,
            nextAttempt: this.nextAttempt > Date.now() ? this.nextAttempt : null,
            isOpen: this.state === CircuitBreaker.STATES.OPEN,
            isClosed: this.state === CircuitBreaker.STATES.CLOSED,
            isHalfOpen: this.state === CircuitBreaker.STATES.HALF_OPEN
        };
    }

    /**
     * Verificar si el circuito permite llamadas
     * @returns {boolean}
     */
    canExecute() {
        if (this.state === CircuitBreaker.STATES.CLOSED) {
            return true;
        }

        if (this.state === CircuitBreaker.STATES.OPEN) {
            return Date.now() >= this.nextAttempt;
        }

        // HALF_OPEN
        return this.halfOpenCalls < this.halfOpenMaxCalls;
    }
}

/**
 * Factory para crear circuit breakers con configuración por defecto
 */
class CircuitBreakerFactory {
    static instances = new Map();

    /**
     * Obtener o crear un circuit breaker por nombre
     * @param {string} name - Nombre único del circuit breaker
     * @param {Object} options - Opciones de configuración
     * @returns {CircuitBreaker}
     */
    static get(name, options = {}) {
        if (!this.instances.has(name)) {
            this.instances.set(name, new CircuitBreaker({ name, ...options }));
        }
        return this.instances.get(name);
    }

    /**
     * Obtener estadísticas de todos los circuit breakers
     * @returns {Object[]}
     */
    static getAllStats() {
        const stats = [];
        this.instances.forEach((cb) => {
            stats.push(cb.getStats());
        });
        return stats;
    }

    /**
     * Resetear todos los circuit breakers
     */
    static resetAll() {
        this.instances.forEach((cb) => {
            cb.forceClose();
        });
    }
}

module.exports = {
    CircuitBreaker,
    CircuitBreakerFactory
};
