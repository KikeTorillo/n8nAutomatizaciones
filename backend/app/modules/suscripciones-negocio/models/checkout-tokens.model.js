/**
 * ====================================================================
 * MODEL: CHECKOUT TOKENS
 * ====================================================================
 * Modelo para gestión de tokens de checkout público.
 * Permite que clientes paguen suscripciones sin autenticación.
 *
 * Caso de uso:
 * 1. Admin crea token para cliente
 * 2. Sistema genera URL pública: nexo.com/checkout/{token}
 * 3. Cliente abre link, ve resumen, paga
 * 4. Token se marca como usado
 *
 * @module models/checkout-tokens
 * @version 1.0.0
 * @date Enero 2026
 */

const crypto = require('crypto');
const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

class CheckoutTokensModel {

    /**
     * Genera un token único de 64 caracteres (32 bytes hex)
     * @returns {string} Token único
     */
    static generarToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Crear nuevo token de checkout
     *
     * @param {Object} data - Datos del token
     * @param {number} data.cliente_id - ID del cliente
     * @param {number} data.plan_id - ID del plan
     * @param {string} [data.periodo='mensual'] - Período de facturación
     * @param {string} [data.cupon_codigo] - Código de cupón
     * @param {number} data.precio_calculado - Precio final
     * @param {string} [data.moneda='MXN'] - Moneda
     * @param {number} [data.dias_expiracion=7] - Días hasta expiración
     * @param {number} organizacionId - ID de la organización vendor
     * @param {number} usuarioId - ID del usuario que crea el token
     * @returns {Promise<Object>} Token creado
     */
    static async crear(data, organizacionId, usuarioId) {
        const token = this.generarToken();

        const {
            cliente_id,
            plan_id,
            periodo = 'mensual',
            cupon_codigo = null,
            precio_calculado,
            moneda = 'MXN',
            dias_expiracion = 7
        } = data;

        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO checkout_tokens (
                    organizacion_id,
                    cliente_id,
                    plan_id,
                    token,
                    periodo,
                    cupon_codigo,
                    precio_calculado,
                    moneda,
                    expira_en,
                    creado_por
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8,
                    NOW() + ($9 || ' days')::INTERVAL,
                    $10
                )
                RETURNING *
            `;

            const result = await db.query(query, [
                organizacionId,
                cliente_id,
                plan_id,
                token,
                periodo,
                cupon_codigo,
                precio_calculado,
                moneda,
                dias_expiracion,
                usuarioId
            ]);

            logger.info(`[CheckoutTokens] Token creado para cliente ${cliente_id}, plan ${plan_id}, expira en ${dias_expiracion} días`);

            return result.rows[0];
        });
    }

    /**
     * Buscar token por su valor (BYPASS RLS - es público)
     *
     * @param {string} token - Token de 64 caracteres
     * @returns {Promise<Object|null>} Token con datos relacionados
     */
    static async buscarPorToken(token) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    ct.*,
                    p.nombre AS plan_nombre,
                    p.codigo AS plan_codigo,
                    p.precio_mensual AS plan_precio_mensual,
                    p.features AS plan_features,
                    p.color AS plan_color,
                    p.icono AS plan_icono,
                    c.nombre AS cliente_nombre,
                    c.email AS cliente_email,
                    c.telefono AS cliente_telefono,
                    o.nombre AS organizacion_nombre,
                    o.logo_url AS organizacion_logo_url
                FROM checkout_tokens ct
                JOIN planes_suscripcion_org p ON p.id = ct.plan_id
                JOIN clientes c ON c.id = ct.cliente_id
                JOIN organizaciones o ON o.id = ct.organizacion_id
                WHERE ct.token = $1
            `;

            const result = await db.query(query, [token]);
            return result.rows[0] || null;
        });
    }

    /**
     * Marcar token como usado (BYPASS RLS - se llama desde checkout público)
     *
     * @param {number} tokenId - ID del token
     * @param {number} [suscripcionId] - ID de la suscripción creada
     * @returns {Promise<Object>} Token actualizado
     */
    static async marcarComoUsado(tokenId, suscripcionId = null) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                UPDATE checkout_tokens
                SET
                    estado = 'usado',
                    usado_en = NOW(),
                    suscripcion_id = COALESCE($2, suscripcion_id)
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [tokenId, suscripcionId]);
            logger.info(`[CheckoutTokens] Token ${tokenId} marcado como usado`);

            return result.rows[0];
        });
    }

    /**
     * Cancelar token (por org)
     *
     * @param {number} tokenId - ID del token
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} Token actualizado
     */
    static async cancelar(tokenId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE checkout_tokens
                SET estado = 'cancelado'
                WHERE id = $1 AND estado = 'pendiente'
                RETURNING *
            `;

            const result = await db.query(query, [tokenId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Listar tokens de una organización
     *
     * @param {Object} options - Opciones de paginación y filtros
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} { items, paginacion }
     */
    static async listar(options, organizacionId) {
        const {
            page = 1,
            limit = 20,
            estado,
            cliente_id
        } = options;

        const offset = (page - 1) * limit;
        const params = [];
        const conditions = [];
        let paramIndex = 1;

        if (estado) {
            conditions.push(`ct.estado = $${paramIndex++}`);
            params.push(estado);
        }

        if (cliente_id) {
            conditions.push(`ct.cliente_id = $${paramIndex++}`);
            params.push(cliente_id);
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        return await RLSContextManager.query(organizacionId, async (db) => {
            // Contar total
            const countQuery = `
                SELECT COUNT(*) AS total
                FROM checkout_tokens ct
                ${whereClause}
            `;
            const countResult = await db.query(countQuery, params);
            const total = parseInt(countResult.rows[0].total);

            // Obtener items
            const query = `
                SELECT
                    ct.*,
                    p.nombre AS plan_nombre,
                    c.nombre AS cliente_nombre,
                    c.email AS cliente_email
                FROM checkout_tokens ct
                JOIN planes_suscripcion_org p ON p.id = ct.plan_id
                JOIN clientes c ON c.id = ct.cliente_id
                ${whereClause}
                ORDER BY ct.creado_en DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            const result = await db.query(query, [...params, limit, offset]);

            return {
                items: result.rows,
                paginacion: {
                    total,
                    pagina: page,
                    limite: limit,
                    paginas: Math.ceil(total / limit)
                }
            };
        });
    }

    /**
     * Eliminar tokens expirados (cron job)
     * Cambia estado a 'expirado' para tokens pendientes con fecha pasada
     *
     * @returns {Promise<number>} Cantidad de tokens actualizados
     */
    static async marcarExpirados() {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                UPDATE checkout_tokens
                SET estado = 'expirado'
                WHERE estado = 'pendiente'
                  AND expira_en < NOW()
            `;

            const result = await db.query(query);
            const count = result.rowCount;

            if (count > 0) {
                logger.info(`[CheckoutTokens] ${count} tokens marcados como expirados`);
            }

            return count;
        });
    }

    /**
     * Verificar si un token es válido (no expirado, no usado)
     *
     * @param {string} token - Token a verificar
     * @returns {Promise<{ valido: boolean, razon?: string, checkout?: Object }>}
     */
    static async verificar(token) {
        const checkout = await this.buscarPorToken(token);

        if (!checkout) {
            return { valido: false, razon: 'Token no encontrado' };
        }

        if (checkout.estado === 'usado') {
            return { valido: false, razon: 'Este link de pago ya fue utilizado' };
        }

        if (checkout.estado === 'cancelado') {
            return { valido: false, razon: 'Este link de pago fue cancelado' };
        }

        if (checkout.estado === 'expirado' || new Date(checkout.expira_en) < new Date()) {
            return { valido: false, razon: 'Este link de pago ha expirado' };
        }

        return { valido: true, checkout };
    }
}

module.exports = CheckoutTokensModel;
