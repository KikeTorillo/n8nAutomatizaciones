/**
 * ====================================================================
 * SERVICIO MERCADO PAGO - MULTI-TENANT
 * ====================================================================
 *
 * Servicio para operaciones con Mercado Pago, soportando credenciales
 * por organización (multi-tenant) o credenciales globales (fallback).
 *
 * USO:
 * ```javascript
 * // Para una organización específica (busca credenciales en BD)
 * const mpService = await MercadoPagoService.getForOrganization(organizacionId);
 *
 * // Usar instancia global (credenciales de env vars)
 * const mpGlobal = MercadoPagoService.getGlobalInstance();
 * ```
 *
 * FUNCIONALIDADES:
 * - Crear suscripciones directas con init_point (sin plan asociado)
 * - Actualizar/cancelar/pausar suscripciones
 * - Obtener información de pagos
 * - Validar webhooks (CRÍTICO para seguridad)
 *
 * @module services/mercadopago.service
 * @version 2.0.0 - Multi-tenant support
 * @date Enero 2026
 */

const { MercadoPagoConfig, PreApproval, Payment } = require('mercadopago');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Cache de instancias por organización (evita recrear en cada request)
const instanceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

class MercadoPagoService {

    /**
     * @param {Object} credentials - Credenciales (REQUERIDO)
     * @param {string} credentials.accessToken - Access token de MP
     * @param {string} [credentials.webhookSecret] - Secret para validar webhooks
     * @param {string} [credentials.environment] - 'sandbox' o 'production'
     * @param {number} [organizacionId] - ID de la organización (para logging)
     */
    constructor(credentials, organizacionId = null) {
        if (!credentials || !credentials.accessToken) {
            throw new Error(
                'MercadoPagoService requiere credenciales. ' +
                'Use getForOrganization() para obtener credenciales del conector.'
            );
        }

        this._initialized = false;
        this.client = null;
        this.subscriptionClient = null;
        this.paymentClient = null;
        this.credentials = credentials;
        this.organizacionId = organizacionId;
    }

    /**
     * Factory: Obtener instancia para una organización específica
     * Busca credenciales en conectores_pago_org. REQUIERE conector configurado.
     *
     * @param {number} organizacionId - ID de la organización
     * @param {string} [entorno] - 'sandbox' o 'production' (default: según NODE_ENV)
     * @returns {Promise<MercadoPagoService>} Instancia configurada
     * @throws {Error} Si no hay conector configurado para la organización
     */
    static async getForOrganization(organizacionId, entorno = null) {
        if (!organizacionId) {
            throw new Error('MercadoPago: organizacionId es requerido');
        }

        const env = entorno || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox');
        const cacheKey = `${organizacionId}:mercadopago:${env}`;

        // Verificar cache
        const cached = instanceCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            logger.debug('[MercadoPagoService] Usando instancia cacheada', {
                organizacionId,
                entorno: env
            });
            return cached.instance;
        }

        // Buscar credenciales en BD (REQUERIDO)
        const ConectoresModel = require('../modules/suscripciones-negocio/models/conectores.model');
        const conector = await ConectoresModel.obtenerCredenciales(organizacionId, 'mercadopago', env);

        if (!conector) {
            throw new Error(
                `MercadoPago: No hay conector configurado para la organización ${organizacionId}. ` +
                `Configure las credenciales en Configuración > Conectores de Pago.`
            );
        }

        const credentials = {
            accessToken: conector.credenciales.access_token,
            webhookSecret: conector.webhookSecret,
            environment: conector.entorno
        };

        logger.info('[MercadoPagoService] Usando credenciales de organización', {
            organizacionId,
            entorno: env,
            verificado: conector.verificado
        });

        // Crear instancia con credenciales de BD
        const instance = new MercadoPagoService(credentials, organizacionId);

        // Guardar en cache
        instanceCache.set(cacheKey, {
            instance,
            timestamp: Date.now()
        });

        return instance;
    }

    // getGlobalInstance() ELIMINADO - Enero 2026
    // Todas las operaciones deben usar getForOrganization() con credenciales de conectores_pago_org

    /**
     * Limpiar cache de instancias (útil cuando se actualizan credenciales)
     *
     * @param {number} [organizacionId] - Si se especifica, solo limpia esa org
     */
    static clearCache(organizacionId = null) {
        if (organizacionId) {
            for (const key of instanceCache.keys()) {
                if (key.startsWith(`${organizacionId}:`)) {
                    instanceCache.delete(key);
                }
            }
            logger.debug('[MercadoPagoService] Cache limpiado para organización', { organizacionId });
        } else {
            instanceCache.clear();
            logger.debug('[MercadoPagoService] Cache global limpiado');
        }
    }

    /**
     * Inicializa el servicio (lazy initialization)
     * Solo se ejecuta la primera vez que se usa el servicio
     * @private
     */
    _ensureInitialized() {
        if (this._initialized) return;

        // Validar que tenemos access token
        if (!this.credentials.accessToken) {
            throw new Error(
                'MercadoPago: accessToken no configurado. ' +
                'Configurar en conectores_pago_org o MERCADOPAGO_ACCESS_TOKEN'
            );
        }

        // Inicializar cliente de Mercado Pago
        this.client = new MercadoPagoConfig({
            accessToken: this.credentials.accessToken,
            options: {
                timeout: 5000,
                idempotencyKey: this._generateIdempotencyKey()
            }
        });

        // Inicializar clientes especializados
        this.subscriptionClient = new PreApproval(this.client);
        this.paymentClient = new Payment(this.client);

        this._initialized = true;

        logger.info('✅ MercadoPagoService inicializado', {
            environment: this.credentials.environment,
            organizacionId: this.organizacionId,
            isGlobal: !this.organizacionId
        });
    }

    // ====================================================================
    // SUSCRIPCIONES
    // ====================================================================

    /**
     * Crear suscripción SIN plan asociado - Genera init_point para pago pendiente
     *
     * Este método crea una suscripción definiendo auto_recurring directamente,
     * en lugar de usar preapproval_plan_id. Esto permite generar un init_point
     * sin requerir card_token_id.
     *
     * NOTA: notification_url NO es un parámetro soportado por preapproval.
     * Los webhooks se configuran en el panel de MercadoPago Developers.
     * Ver: https://www.mercadopago.com.mx/developers/en/reference/subscriptions/_preapproval/post
     *
     * @param {Object} params - Parámetros de la suscripción
     * @param {string} params.nombre - Nombre/razón de la suscripción
     * @param {number} params.precio - Precio mensual
     * @param {string} [params.moneda='MXN'] - Moneda
     * @param {string} params.email - Email del pagador
     * @param {string} params.returnUrl - URL de retorno
     * @param {string} params.externalReference - Referencia externa (org_X_timestamp)
     * @returns {Promise<Object>} { id, status, init_point }
     */
    async crearSuscripcionConInitPoint({ nombre, precio, moneda = 'MXN', email, returnUrl, externalReference }) {
        this._ensureInitialized();
        try {
            logger.info('Creando suscripción con init_point (sin plan asociado)', {
                nombre,
                precio,
                moneda,
                email,
                externalReference,
                organizacionId: this.organizacionId
            });

            const axios = require('axios');

            const subscriptionData = {
                reason: nombre,
                payer_email: email,
                back_url: returnUrl,
                external_reference: externalReference,
                status: 'pending', // CRÍTICO: pending genera init_point
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: precio,
                    currency_id: moneda
                }
            };

            // NOTA: notification_url NO es un parámetro oficial de preapproval.
            // Los webhooks de suscripciones se configuran en el panel de MercadoPago.

            const response = await axios.post(
                'https://api.mercadopago.com/preapproval',
                subscriptionData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.credentials.accessToken}`,
                        'Content-Type': 'application/json',
                        'X-Idempotency-Key': this._generateIdempotencyKey()
                    },
                    timeout: 5000
                }
            );

            logger.info('✅ Suscripción con init_point creada exitosamente', {
                subscriptionId: response.data.id,
                email,
                status: response.data.status,
                hasInitPoint: !!response.data.init_point,
                organizacionId: this.organizacionId
            });

            return {
                id: response.data.id,
                status: response.data.status,
                init_point: response.data.init_point
            };
        } catch (error) {
            logger.error('❌ Error creando suscripción con init_point:', {
                error: error.message,
                nombre,
                precio,
                email,
                responseData: error.response?.data,
                organizacionId: this.organizacionId
            });
            throw new Error(`Error creando suscripción: ${error.message}`);
        }
    }

    /**
     * Actualizar suscripción (cambio de plan)
     *
     * @param {string} subscriptionId - ID de suscripción en MP
     * @param {string} nuevoPlanId - ID del nuevo plan
     * @returns {Promise<Object>} Suscripción actualizada
     */
    async actualizarSuscripcion(subscriptionId, nuevoPlanId) {
        this._ensureInitialized();
        try {
            logger.info('Actualizando suscripción', {
                subscriptionId,
                nuevoPlanId,
                organizacionId: this.organizacionId
            });

            const response = await this.subscriptionClient.update({
                id: subscriptionId,
                body: {
                    preapproval_plan_id: nuevoPlanId,
                    status: 'authorized' // Reactivar si estaba pausada
                }
            });

            logger.info('✅ Suscripción actualizada', { subscriptionId, nuevoPlanId });
            return response;
        } catch (error) {
            logger.error('Error actualizando suscripción:', {
                subscriptionId,
                error: error.message
            });
            throw new Error(`Error actualizando suscripción: ${error.message}`);
        }
    }

    /**
     * Cancelar suscripción
     *
     * @param {string} subscriptionId - ID de suscripción en MP
     * @returns {Promise<Object>} Suscripción cancelada
     */
    async cancelarSuscripcion(subscriptionId) {
        this._ensureInitialized();
        try {
            logger.info('Cancelando suscripción', { subscriptionId });

            const response = await this.subscriptionClient.update({
                id: subscriptionId,
                body: { status: 'cancelled' }
            });

            logger.info('✅ Suscripción cancelada', { subscriptionId });
            return response;
        } catch (error) {
            logger.error('Error cancelando suscripción:', {
                subscriptionId,
                error: error.message
            });
            throw new Error(`Error cancelando suscripción: ${error.message}`);
        }
    }

    /**
     * Pausar suscripción
     *
     * @param {string} subscriptionId - ID de suscripción en MP
     * @returns {Promise<Object>} Suscripción pausada
     */
    async pausarSuscripcion(subscriptionId) {
        this._ensureInitialized();
        try {
            const response = await this.subscriptionClient.update({
                id: subscriptionId,
                body: { status: 'paused' }
            });

            logger.info('Suscripción pausada', { subscriptionId });
            return response;
        } catch (error) {
            logger.error('Error pausando suscripción:', { subscriptionId, error: error.message });
            throw new Error(`Error pausando suscripción: ${error.message}`);
        }
    }

    /**
     * Obtener suscripción por ID
     *
     * @param {string} subscriptionId - ID de suscripción en MP
     * @returns {Promise<Object>} Datos de la suscripción
     */
    async obtenerSuscripcion(subscriptionId) {
        this._ensureInitialized();
        try {
            const response = await this.subscriptionClient.get({ id: subscriptionId });
            return response;
        } catch (error) {
            logger.error('Error obteniendo suscripción:', {
                subscriptionId,
                error: error.message
            });
            throw new Error(`Error obteniendo suscripción: ${error.message}`);
        }
    }

    // ====================================================================
    // PAGOS
    // ====================================================================

    /**
     * Obtener información de un pago
     *
     * @param {string} paymentId - ID del pago en MP
     * @returns {Promise<Object>} Datos del pago
     */
    async obtenerPago(paymentId) {
        this._ensureInitialized();
        try {
            const response = await this.paymentClient.get({ id: paymentId });
            return response;
        } catch (error) {
            logger.error('Error obteniendo pago:', { paymentId, error: error.message });
            throw new Error(`Error obteniendo pago: ${error.message}`);
        }
    }

    /**
     * Obtener información de un pago autorizado de suscripción
     * Endpoint: /authorized_payments/{id}
     *
     * @param {string} authorizedPaymentId - ID del pago autorizado
     * @returns {Promise<Object>} Datos del pago autorizado incluyendo preapproval_id
     */
    async obtenerPagoAutorizado(authorizedPaymentId) {
        this._ensureInitialized();
        try {
            const axios = require('axios');
            const response = await axios.get(
                `https://api.mercadopago.com/authorized_payments/${authorizedPaymentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.credentials.accessToken}`
                    },
                    timeout: 5000
                }
            );
            return response.data;
        } catch (error) {
            logger.error('Error obteniendo pago autorizado:', {
                authorizedPaymentId,
                error: error.message,
                status: error.response?.status
            });
            // Si es 404, retornar null en vez de lanzar error
            if (error.response?.status === 404) {
                return null;
            }
            throw new Error(`Error obteniendo pago autorizado: ${error.message}`);
        }
    }

    // ====================================================================
    // VALIDACIÓN DE WEBHOOKS (CRÍTICO PARA SEGURIDAD)
    // ====================================================================

    /**
     * Validar firma de webhook de Mercado Pago usando HMAC SHA-256
     *
     * IMPORTANTE: Esta es una validación crítica de seguridad.
     * NUNCA procesar webhooks sin validar la firma.
     *
     * @param {string} signature - Header x-signature del request
     * @param {string} requestId - Header x-request-id del request
     * @param {string} dataId - ID del recurso notificado
     * @returns {boolean} true si la firma es válida, false si no
     */
    validarWebhook(signature, requestId, dataId) {
        // Validar que tenemos todos los datos necesarios
        if (!signature || !requestId || !dataId) {
            logger.warn('⚠️  Webhook sin datos de validación completos', {
                hasSignature: !!signature,
                hasRequestId: !!requestId,
                hasDataId: !!dataId
            });
            return false;
        }

        const secret = this.credentials.webhookSecret;
        if (!secret) {
            logger.error('❌ webhookSecret no configurado');
            return false;
        }

        try {
            // Parsear signature: "ts=1234567890,v1=abcd1234..."
            const parts = signature.split(',');
            if (parts.length < 2) {
                logger.warn('Formato de signature inválido', { signature });
                return false;
            }

            const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
            const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1];

            if (!ts || !hash) {
                logger.warn('Signature sin timestamp o hash', { signature });
                return false;
            }

            // Crear manifest según especificación de MP
            const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;

            // Calcular HMAC SHA-256
            const hmac = crypto.createHmac('sha256', secret);
            hmac.update(manifest);
            const computedHash = hmac.digest('hex');

            // Comparar hashes (time-safe comparison)
            const isValid = crypto.timingSafeEqual(
                Buffer.from(hash, 'hex'),
                Buffer.from(computedHash, 'hex')
            );

            if (!isValid) {
                logger.warn('⚠️  Webhook con firma inválida', {
                    dataId,
                    requestId,
                    expectedHash: computedHash.substring(0, 10) + '...',
                    receivedHash: hash.substring(0, 10) + '...'
                });
            } else {
                logger.debug('✅ Webhook validado correctamente', { dataId, requestId });
            }

            return isValid;
        } catch (error) {
            logger.error('❌ Error validando webhook:', {
                error: error.message,
                dataId,
                requestId
            });
            return false;
        }
    }

    // ====================================================================
    // VERIFICACIÓN DE CONECTIVIDAD
    // ====================================================================

    /**
     * Verificar conectividad con MercadoPago
     * Útil para validar credenciales al configurar un conector
     *
     * @returns {Promise<{success: boolean, message: string, details?: Object}>}
     */
    async verificarConectividad() {
        try {
            this._ensureInitialized();

            // Hacer una llamada simple a la API para verificar credenciales
            const axios = require('axios');
            const response = await axios.get(
                'https://api.mercadopago.com/users/me',
                {
                    headers: {
                        'Authorization': `Bearer ${this.credentials.accessToken}`
                    },
                    timeout: 5000
                }
            );

            return {
                success: true,
                message: 'Conexión exitosa',
                details: {
                    userId: response.data.id,
                    email: response.data.email,
                    siteId: response.data.site_id
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                details: {
                    statusCode: error.response?.status,
                    error: error.response?.data?.error
                }
            };
        }
    }

    // ====================================================================
    // UTILIDADES
    // ====================================================================

    /**
     * Generar clave de idempotencia para requests
     * Usa SecureRandom para seguridad criptográfica
     * @private
     */
    _generateIdempotencyKey() {
        const SecureRandom = require('../utils/helpers/SecureRandom');
        return SecureRandom.idempotencyKey();
    }
}

// Exportar clase para multi-tenant
// Usar: MercadoPagoService.getForOrganization(orgId)
module.exports = MercadoPagoService;
