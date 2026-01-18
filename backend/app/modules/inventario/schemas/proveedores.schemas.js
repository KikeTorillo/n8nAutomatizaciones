/**
 * Schemas de validación - Proveedores
 * @module inventario/schemas/proveedores.schemas
 */

const Joi = require('joi');
const { withPagination, fields } = require('../../../schemas/shared');

const proveedoresSchemas = {
    /**
     * Schema para crear proveedor
     * POST /api/v1/inventario/proveedores
     */
    crearProveedor: {
        body: Joi.object({
            nombre: Joi.string().max(200).required().messages({
                'any.required': 'El nombre es requerido',
                'string.max': 'El nombre no puede exceder 200 caracteres'
            }),

            razon_social: Joi.string().max(200).optional().allow(null, ''),

            // Usa validación RFC compartida (formato mexicano correcto)
            rfc: fields.rfc.optional(),

            // Usa validación teléfono compartida
            telefono: fields.telefonoConLada.optional().allow(null, ''),
            email: Joi.string().email().max(255).optional().allow(null, ''),
            sitio_web: Joi.string().uri().max(255).optional().allow(null, ''),

            direccion: Joi.string().max(500).optional().allow(null, ''),
            codigo_postal: Joi.string().max(10).optional().allow(null, ''),
            // IDs de ubicación normalizados (Nov 2025)
            pais_id: Joi.number().integer().positive().optional().allow(null),
            estado_id: Joi.number().integer().positive().optional().allow(null),
            ciudad_id: Joi.number().integer().positive().optional().allow(null),

            dias_credito: Joi.number().integer().min(0).optional().default(0),
            dias_entrega_estimados: Joi.number().integer().min(1).optional().allow(null),
            monto_minimo_compra: Joi.number().min(0).optional().allow(null),

            notas: Joi.string().max(500).optional().allow(null, ''),
            activo: Joi.boolean().optional().default(true)
        })
    },

    /**
     * Schema para actualizar proveedor
     * PUT /api/v1/inventario/proveedores/:id
     */
    actualizarProveedor: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            nombre: Joi.string().max(200).optional(),
            razon_social: Joi.string().max(200).optional().allow(null, ''),
            rfc: fields.rfc.optional(),
            telefono: fields.telefonoConLada.optional().allow(null, ''),
            email: Joi.string().email().max(255).optional().allow(null, ''),
            sitio_web: Joi.string().uri().max(255).optional().allow(null, ''),
            direccion: Joi.string().max(500).optional().allow(null, ''),
            codigo_postal: Joi.string().max(10).optional().allow(null, ''),
            // IDs de ubicación normalizados (Nov 2025)
            pais_id: Joi.number().integer().positive().optional().allow(null),
            estado_id: Joi.number().integer().positive().optional().allow(null),
            ciudad_id: Joi.number().integer().positive().optional().allow(null),
            dias_credito: Joi.number().integer().min(0).optional(),
            dias_entrega_estimados: Joi.number().integer().min(1).optional().allow(null),
            monto_minimo_compra: Joi.number().min(0).optional().allow(null),
            notas: Joi.string().max(500).optional().allow(null, ''),
            activo: Joi.boolean().optional()
        }).min(1)
    },

    /**
     * Schema para listar proveedores
     * GET /api/v1/inventario/proveedores
     */
    listarProveedores: {
        query: withPagination({
            activo: Joi.boolean().optional(),
            busqueda: Joi.string().max(100).optional(),
            ciudad: Joi.string().max(100).optional(),
            rfc: Joi.string().max(13).optional()
        })
    }
};

module.exports = proveedoresSchemas;
