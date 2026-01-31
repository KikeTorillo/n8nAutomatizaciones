/**
 * ====================================================================
 * RETRY WITH EXPONENTIAL BACKOFF
 * ====================================================================
 * Utilidad para reintentar operaciones con espera exponencial.
 *
 * Fórmula de delay:
 * delay = min(maxDelay, baseDelay * (factor ^ attempt) + jitter)
 *
 * @module utils/retryWithBackoff
 * @version 1.0.0
 * @date Enero 2026
 */

const logger = require('./logger');

/**
 * Opciones por defecto para retry
 */
const DEFAULT_OPTIONS = {
    maxRetries: 3,
    baseDelay: 1000,      // 1 segundo
    maxDelay: 30000,      // 30 segundos
    factor: 2,            // Factor exponencial
    jitterFactor: 0.1,    // 10% de jitter
    retryIf: null,        // Función para determinar si reintentar
    onRetry: null,        // Callback en cada reintento
    name: 'retry'         // Nombre para logging
};

/**
 * Calcular delay con backoff exponencial y jitter
 *
 * @param {number} attempt - Número de intento (1-based)
 * @param {Object} options - Opciones de configuración
 * @returns {number} - Delay en milisegundos
 */
function calculateDelay(attempt, options) {
    const { baseDelay, maxDelay, factor, jitterFactor } = options;

    // Delay exponencial
    const exponentialDelay = baseDelay * Math.pow(factor, attempt - 1);

    // Agregar jitter aleatorio para evitar thundering herd
    const jitter = exponentialDelay * jitterFactor * Math.random();

    // Limitar al máximo
    return Math.min(maxDelay, exponentialDelay + jitter);
}

/**
 * Esperar por un tiempo determinado
 *
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ejecutar función con retry y backoff exponencial
 *
 * @param {Function} fn - Función async a ejecutar
 * @param {Object} options - Opciones de configuración
 * @param {number} options.maxRetries - Número máximo de reintentos (default: 3)
 * @param {number} options.baseDelay - Delay inicial en ms (default: 1000)
 * @param {number} options.maxDelay - Delay máximo en ms (default: 30000)
 * @param {number} options.factor - Factor de incremento exponencial (default: 2)
 * @param {number} options.jitterFactor - Factor de jitter 0-1 (default: 0.1)
 * @param {Function} options.retryIf - Función (error) => boolean para decidir si reintentar
 * @param {Function} options.onRetry - Callback (error, attempt, delay) en cada reintento
 * @param {string} options.name - Nombre para identificar en logs
 * @returns {Promise<any>} - Resultado de la función
 * @throws {Error} - Error del último intento si todos fallan
 */
async function retryWithBackoff(fn, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const { maxRetries, retryIf, onRetry, name } = opts;

    let lastError;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Si es el último intento, no reintentar
            if (attempt > maxRetries) {
                logger.error(`[${name}] Todos los intentos fallidos`, {
                    maxRetries,
                    error: error.message
                });
                break;
            }

            // Verificar si debemos reintentar
            if (retryIf && !retryIf(error)) {
                logger.info(`[${name}] Error no retriable, abortando`, {
                    attempt,
                    error: error.message
                });
                break;
            }

            // Calcular delay
            const delay = calculateDelay(attempt, opts);

            logger.warn(`[${name}] Reintentando operación`, {
                attempt,
                maxRetries,
                delayMs: Math.round(delay),
                error: error.message
            });

            // Ejecutar callback si existe
            if (onRetry) {
                try {
                    await onRetry(error, attempt, delay);
                } catch (callbackError) {
                    logger.error(`[${name}] Error en onRetry callback`, callbackError);
                }
            }

            // Esperar antes de reintentar
            await sleep(delay);
        }
    }

    throw lastError;
}

/**
 * Crear función de retry preconfigurada
 *
 * @param {Object} defaultOptions - Opciones por defecto
 * @returns {Function} - Función de retry configurada
 */
function createRetry(defaultOptions = {}) {
    return (fn, options = {}) => {
        return retryWithBackoff(fn, { ...defaultOptions, ...options });
    };
}

/**
 * Errores comunes que son retriables
 */
const RETRIABLE_ERROR_CODES = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'EAI_AGAIN',
    'EPIPE',
    'EHOSTUNREACH'
];

const RETRIABLE_HTTP_STATUS = [
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504  // Gateway Timeout
];

/**
 * Función helper para determinar si un error es retriable
 *
 * @param {Error} error - Error a evaluar
 * @returns {boolean} - true si el error es retriable
 */
function isRetriableError(error) {
    // Errores de red
    if (error.code && RETRIABLE_ERROR_CODES.includes(error.code)) {
        return true;
    }

    // Errores HTTP retriables
    if (error.response?.status && RETRIABLE_HTTP_STATUS.includes(error.response.status)) {
        return true;
    }

    if (error.status && RETRIABLE_HTTP_STATUS.includes(error.status)) {
        return true;
    }

    // Errores de timeout
    if (error.message?.toLowerCase().includes('timeout')) {
        return true;
    }

    // Rate limiting
    if (error.message?.toLowerCase().includes('rate limit')) {
        return true;
    }

    return false;
}

/**
 * Retry configurado para llamadas a APIs externas
 */
const retryApiCall = createRetry({
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 30000,
    factor: 2,
    retryIf: isRetriableError,
    name: 'API'
});

/**
 * Retry configurado para llamadas a bases de datos
 */
const retryDbCall = createRetry({
    maxRetries: 2,
    baseDelay: 500,
    maxDelay: 5000,
    factor: 2,
    name: 'DB'
});

module.exports = {
    retryWithBackoff,
    createRetry,
    isRetriableError,
    retryApiCall,
    retryDbCall,
    RETRIABLE_ERROR_CODES,
    RETRIABLE_HTTP_STATUS
};
