/**
 * ====================================================================
 * MODELO DE CONECTORES DE PAGO
 * ====================================================================
 *
 * Gestiona conectores de pago multi-tenant con credenciales encriptadas.
 * Cada organización puede configurar sus propios gateways (Stripe, MercadoPago).
 *
 * IMPORTANTE:
 * - Las credenciales se encriptan con AES-256-GCM antes de almacenar
 * - Nunca se exponen credenciales completas en respuestas API
 * - Solo se muestra un "hint" de los últimos caracteres
 *
 * @module suscripciones-negocio/models/conectores
 * @version 1.0.0
 * @date Enero 2026
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const CredentialEncryption = require('../../../services/credentialEncryption.service');
const { ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

// Gateways soportados con sus nombres display
const GATEWAYS_SOPORTADOS = {
    mercadopago: 'MercadoPago',
    stripe: 'Stripe',
    paypal: 'PayPal',
    conekta: 'Conekta'
};

class ConectoresModel {

    /**
     * Crear nuevo conector de pago
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Object} data - Datos del conector
     * @param {string} data.gateway - 'mercadopago', 'stripe', etc.
     * @param {string} data.entorno - 'sandbox' o 'production'
     * @param {Object} data.credenciales - Credenciales del gateway
     * @param {string} [data.nombre_display] - Nombre amigable
     * @param {string} [data.webhook_secret] - Secret para webhooks
     * @param {boolean} [data.es_principal] - Si es el conector principal
     * @param {number} [creadoPor] - ID del usuario que crea
     * @returns {Promise<Object>} Conector creado (sin credenciales)
     */
    static async crear(organizacionId, data, creadoPor = null) {
        // Validar gateway soportado
        if (!GATEWAYS_SOPORTADOS[data.gateway]) {
            ErrorHelper.throwValidation(
                `Gateway no soportado: ${data.gateway}. ` +
                `Soportados: ${Object.keys(GATEWAYS_SOPORTADOS).join(', ')}`
            );
        }

        // Validar credenciales requeridas
        const validacion = CredentialEncryption.validateCredentials(data.gateway, data.credenciales);
        if (!validacion.valid) {
            ErrorHelper.throwValidation(
                `Credenciales incompletas. Faltan: ${validacion.missing.join(', ')}`
            );
        }

        // Encriptar credenciales
        const { encrypted, iv, tag } = CredentialEncryption.encrypt(data.credenciales);
        const hint = CredentialEncryption.generateHint(data.credenciales);

        // Encriptar webhook secret si existe
        let webhookEncrypted = null;
        if (data.webhook_secret) {
            webhookEncrypted = CredentialEncryption.encryptWebhookSecret(data.webhook_secret);
        }

        return await RLSContextManager.query(organizacionId, async (db) => {
            // Si se marca como principal, desmarcar los otros del mismo gateway
            if (data.es_principal) {
                await db.query(`
                    UPDATE conectores_pago_org
                    SET es_principal = false
                    WHERE organizacion_id = $1 AND gateway = $2 AND es_principal = true
                `, [organizacionId, data.gateway]);

                logger.debug('[ConectoresModel.crear] Desmarcados otros conectores como principales', {
                    organizacionId,
                    gateway: data.gateway
                });
            }

            const query = `
                INSERT INTO conectores_pago_org (
                    organizacion_id, gateway, entorno, nombre_display,
                    credenciales_encrypted, credenciales_iv, credenciales_tag,
                    api_key_hint,
                    webhook_url, webhook_secret_encrypted, webhook_secret_iv, webhook_secret_tag,
                    es_principal, creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING id, organizacion_id, gateway, entorno, nombre_display,
                          api_key_hint, webhook_url, activo, es_principal, verificado,
                          creado_en
            `;

            const values = [
                organizacionId,
                data.gateway,
                data.entorno || 'sandbox',
                data.nombre_display || `${GATEWAYS_SOPORTADOS[data.gateway]} ${data.entorno || 'Sandbox'}`,
                encrypted,
                iv,
                tag,
                hint,
                data.webhook_url || null,
                webhookEncrypted?.encrypted || null,
                webhookEncrypted?.iv || null,
                webhookEncrypted?.tag || null,
                data.es_principal || false,
                creadoPor
            ];

            const result = await db.query(query, values);

            logger.info('[ConectoresModel.crear] Conector creado', {
                id: result.rows[0].id,
                organizacionId,
                gateway: data.gateway,
                entorno: data.entorno,
                es_principal: data.es_principal || false
            });

            return result.rows[0];
        });
    }

    /**
     * Listar conectores de una organización (sin credenciales)
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Object} [filtros] - Filtros opcionales
     * @param {string} [filtros.gateway] - Filtrar por gateway
     * @param {string} [filtros.entorno] - Filtrar por entorno
     * @param {boolean} [filtros.activo] - Filtrar por estado
     * @returns {Promise<Array>} Lista de conectores
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let conditions = ['organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            if (filtros.gateway) {
                conditions.push(`gateway = $${paramCounter}`);
                values.push(filtros.gateway);
                paramCounter++;
            }

            if (filtros.entorno) {
                conditions.push(`entorno = $${paramCounter}`);
                values.push(filtros.entorno);
                paramCounter++;
            }

            if (filtros.activo !== undefined) {
                conditions.push(`activo = $${paramCounter}`);
                values.push(filtros.activo);
                paramCounter++;
            }

            const query = `
                SELECT
                    id, organizacion_id, gateway, entorno, nombre_display,
                    api_key_hint, webhook_url, activo, es_principal, verificado,
                    ultima_verificacion, errores_consecutivos,
                    creado_en, actualizado_en
                FROM conectores_pago_org
                WHERE ${conditions.join(' AND ')}
                ORDER BY es_principal DESC, gateway ASC, entorno ASC
            `;

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Obtener un conector por ID (sin credenciales)
     *
     * @param {number} organizacionId - ID de la organización
     * @param {number} id - ID del conector
     * @returns {Promise<Object|null>}
     */
    static async buscarPorId(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    id, organizacion_id, gateway, entorno, nombre_display,
                    api_key_hint, webhook_url, activo, es_principal, verificado,
                    ultima_verificacion, errores_consecutivos, metadata,
                    creado_en, actualizado_en
                FROM conectores_pago_org
                WHERE id = $1 AND organizacion_id = $2
            `;

            const result = await db.query(query, [id, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar conector
     *
     * @param {number} organizacionId - ID de la organización
     * @param {number} id - ID del conector
     * @param {Object} data - Datos a actualizar
     * @param {number} [actualizadoPor] - ID del usuario
     * @returns {Promise<Object>} Conector actualizado
     */
    static async actualizar(organizacionId, id, data, actualizadoPor = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar que existe
            const existe = await this.buscarPorId(organizacionId, id);
            ErrorHelper.throwIfNotFound(existe, 'Conector de pago');

            // Si se marca como principal, desmarcar los otros del mismo gateway
            if (data.es_principal === true) {
                await db.query(`
                    UPDATE conectores_pago_org
                    SET es_principal = false
                    WHERE organizacion_id = $1 AND gateway = $2 AND id != $3 AND es_principal = true
                `, [organizacionId, existe.gateway, id]);

                logger.debug('[ConectoresModel.actualizar] Desmarcados otros conectores como principales', {
                    organizacionId,
                    gateway: existe.gateway,
                    nuevoConectorPrincipal: id
                });
            }

            const updates = [];
            const values = [];
            let paramCounter = 1;

            // Campos actualizables
            const camposSimples = ['nombre_display', 'webhook_url', 'activo', 'es_principal', 'entorno'];

            for (const campo of camposSimples) {
                if (data[campo] !== undefined) {
                    updates.push(`${campo} = $${paramCounter}`);
                    values.push(data[campo]);
                    paramCounter++;
                }
            }

            // Si se actualizan credenciales, re-encriptar
            if (data.credenciales) {
                const validacion = CredentialEncryption.validateCredentials(existe.gateway, data.credenciales);
                if (!validacion.valid) {
                    ErrorHelper.throwValidation(`Credenciales incompletas. Faltan: ${validacion.missing.join(', ')}`);
                }

                const { encrypted, iv, tag } = CredentialEncryption.encrypt(data.credenciales);
                const hint = CredentialEncryption.generateHint(data.credenciales);

                updates.push(`credenciales_encrypted = $${paramCounter}`);
                values.push(encrypted);
                paramCounter++;

                updates.push(`credenciales_iv = $${paramCounter}`);
                values.push(iv);
                paramCounter++;

                updates.push(`credenciales_tag = $${paramCounter}`);
                values.push(tag);
                paramCounter++;

                updates.push(`api_key_hint = $${paramCounter}`);
                values.push(hint);
                paramCounter++;

                // Resetear verificación al cambiar credenciales
                updates.push('verificado = false');
                updates.push('errores_consecutivos = 0');
            }

            // Si se actualiza webhook secret
            if (data.webhook_secret) {
                const webhookEncrypted = CredentialEncryption.encryptWebhookSecret(data.webhook_secret);

                updates.push(`webhook_secret_encrypted = $${paramCounter}`);
                values.push(webhookEncrypted.encrypted);
                paramCounter++;

                updates.push(`webhook_secret_iv = $${paramCounter}`);
                values.push(webhookEncrypted.iv);
                paramCounter++;

                updates.push(`webhook_secret_tag = $${paramCounter}`);
                values.push(webhookEncrypted.tag);
                paramCounter++;
            }

            if (actualizadoPor) {
                updates.push(`actualizado_por = $${paramCounter}`);
                values.push(actualizadoPor);
                paramCounter++;
            }

            if (updates.length === 0) {
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            values.push(id);
            values.push(organizacionId);

            const query = `
                UPDATE conectores_pago_org
                SET ${updates.join(', ')}
                WHERE id = $${paramCounter} AND organizacion_id = $${paramCounter + 1}
                RETURNING id, organizacion_id, gateway, entorno, nombre_display,
                          api_key_hint, webhook_url, activo, es_principal, verificado,
                          actualizado_en
            `;

            const result = await db.query(query, values);

            logger.info('[ConectoresModel.actualizar] Conector actualizado', {
                id,
                organizacionId,
                camposActualizados: updates.length
            });

            return result.rows[0];
        });
    }

    /**
     * Eliminar conector
     *
     * @param {number} organizacionId - ID de la organización
     * @param {number} id - ID del conector
     * @returns {Promise<boolean>}
     */
    static async eliminar(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                `DELETE FROM conectores_pago_org WHERE id = $1 AND organizacion_id = $2 RETURNING id`,
                [id, organizacionId]
            );

            if (result.rowCount > 0) {
                logger.info('[ConectoresModel.eliminar] Conector eliminado', { id, organizacionId });
            }

            return result.rowCount > 0;
        });
    }

    /**
     * Marcar resultado de verificación de conectividad
     *
     * @param {number} id - ID del conector
     * @param {boolean} exitoso - Si la verificación fue exitosa
     * @param {Object} [metadata] - Metadata adicional de la verificación
     * @returns {Promise<void>}
     */
    static async registrarVerificacion(id, exitoso, metadata = null) {
        return await RLSContextManager.withBypass(async (db) => {
            if (exitoso) {
                await db.query(`
                    UPDATE conectores_pago_org
                    SET verificado = true,
                        ultima_verificacion = NOW(),
                        errores_consecutivos = 0,
                        metadata = COALESCE(metadata, '{}') || $2::jsonb
                    WHERE id = $1
                `, [id, JSON.stringify({ ultima_verificacion_exitosa: new Date().toISOString(), ...metadata })]);
            } else {
                await db.query(`
                    UPDATE conectores_pago_org
                    SET verificado = false,
                        ultima_verificacion = NOW(),
                        errores_consecutivos = errores_consecutivos + 1,
                        metadata = COALESCE(metadata, '{}') || $2::jsonb
                    WHERE id = $1
                `, [id, JSON.stringify({ ultimo_error: new Date().toISOString(), ...metadata })]);
            }
        });
    }

    /**
     * Obtener el conector principal de una organización SIN filtrar por entorno.
     * El entorno se detecta automáticamente por el prefijo del access_token (TEST- = sandbox).
     *
     * Prioridad de selección:
     * 1. es_principal = true
     * 2. verificado = true
     * 3. creado_en DESC (más reciente)
     *
     * IMPORTANTE: Solo usar internamente, nunca exponer credenciales a API
     *
     * @param {number} organizacionId - ID de la organización
     * @param {string} gateway - Gateway a buscar ('mercadopago', 'stripe', etc.)
     * @returns {Promise<Object|null>} Credenciales desencriptadas o null si no existe
     */
    static async obtenerConectorPrincipal(organizacionId, gateway) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    id, gateway, entorno,
                    credenciales_encrypted, credenciales_iv, credenciales_tag,
                    webhook_secret_encrypted, webhook_secret_iv, webhook_secret_tag,
                    verificado, es_principal, metadata
                FROM conectores_pago_org
                WHERE organizacion_id = $1
                  AND gateway = $2
                  AND activo = true
                ORDER BY es_principal DESC, verificado DESC, creado_en DESC
                LIMIT 1
            `;

            const result = await db.query(query, [organizacionId, gateway]);

            if (result.rows.length === 0) {
                logger.debug('[ConectoresModel.obtenerConectorPrincipal] No hay conector principal', {
                    organizacionId,
                    gateway
                });
                return null;
            }

            const row = result.rows[0];

            // Desencriptar credenciales
            const credenciales = CredentialEncryption.decrypt(
                row.credenciales_encrypted,
                row.credenciales_iv,
                row.credenciales_tag
            );

            // Desencriptar webhook secret si existe
            let webhookSecret = null;
            if (row.webhook_secret_encrypted) {
                webhookSecret = CredentialEncryption.decryptWebhookSecret(
                    row.webhook_secret_encrypted,
                    row.webhook_secret_iv,
                    row.webhook_secret_tag
                );
            }

            // IMPORTANTE: Usar el entorno guardado en la BD, NO detectar por prefijo del token.
            // Las cuentas de PRUEBA de MercadoPago generan tokens APP_USR- (no TEST-),
            // solo las cuentas REALES tienen tokens TEST- para sandbox.
            // El usuario configura explícitamente el entorno al crear el conector.

            logger.debug('[ConectoresModel.obtenerConectorPrincipal] Conector encontrado', {
                organizacionId,
                gateway,
                conectorId: row.id,
                es_principal: row.es_principal,
                entorno: row.entorno,
                verificado: row.verificado
            });

            return {
                id: row.id,
                gateway: row.gateway,
                entorno: row.entorno, // Usar el entorno configurado por el usuario
                es_principal: row.es_principal,
                credenciales,
                webhookSecret,
                verificado: row.verificado,
                metadata: row.metadata
            };
        });
    }

    /**
     * Verificar si existe conector para un gateway
     *
     * @param {number} organizacionId - ID de la organización
     * @param {string} gateway - Gateway a verificar
     * @param {string} [entorno] - Entorno (opcional)
     * @returns {Promise<boolean>}
     */
    static async existeConector(organizacionId, gateway, entorno = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let query = `
                SELECT COUNT(*) as total
                FROM conectores_pago_org
                WHERE organizacion_id = $1 AND gateway = $2 AND activo = true
            `;
            const values = [organizacionId, gateway];

            if (entorno) {
                query += ' AND entorno = $3';
                values.push(entorno);
            }

            const result = await db.query(query, values);
            return parseInt(result.rows[0].total) > 0;
        });
    }
}

// Exportar constantes útiles
ConectoresModel.GATEWAYS_SOPORTADOS = GATEWAYS_SOPORTADOS;

module.exports = ConectoresModel;
