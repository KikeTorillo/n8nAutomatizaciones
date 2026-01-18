/**
 * Schemas de validación - Alertas de Inventario
 * @module inventario/schemas/alertas.schemas
 */

const Joi = require('joi');

const alertasSchemas = {
    /**
     * Schema para listar alertas
     * GET /api/v1/inventario/alertas
     */
    listarAlertas: {
        query: Joi.object({
            tipo_alerta: Joi.string().valid(
                'stock_minimo', 'stock_agotado', 'proximo_vencimiento',
                'vencido', 'sin_movimiento'
            ).optional(),
            nivel: Joi.string().valid('info', 'warning', 'critical').optional(),
            leida: Joi.boolean().optional(),
            producto_id: Joi.number().integer().positive().optional(),
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional(),
            limit: Joi.number().integer().min(1).max(100).optional().default(50),
            offset: Joi.number().integer().min(0).optional().default(0)
        })
    },

    /**
     * Schema para marcar alerta como leída
     * PATCH /api/v1/inventario/alertas/:id/marcar-leida
     */
    marcarAlertaLeida: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para marcar múltiples alertas como leídas
     * PATCH /api/v1/inventario/alertas/marcar-varias-leidas
     */
    marcarVariasAlertasLeidas: {
        body: Joi.object({
            alerta_ids: Joi.array()
                .items(Joi.number().integer().positive())
                .min(1)
                .required()
                .messages({
                    'any.required': 'alerta_ids es requerido',
                    'array.min': 'Debe incluir al menos un ID de alerta'
                })
        })
    }
};

module.exports = alertasSchemas;
