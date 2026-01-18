/**
 * Schemas de validación - Ubicaciones de Almacén
 * @module inventario/schemas/ubicaciones.schemas
 */

const Joi = require('joi');

const ubicacionesSchemas = {
    /**
     * Schema para crear ubicación
     * POST /api/v1/inventario/ubicaciones
     */
    crearUbicacion: {
        body: Joi.object({
            sucursal_id: Joi.number().integer().positive().required().messages({
                'any.required': 'La sucursal es requerida',
                'number.positive': 'sucursal_id debe ser un número positivo'
            }),

            codigo: Joi.string().max(30).required().messages({
                'any.required': 'El código es requerido',
                'string.max': 'El código no puede exceder 30 caracteres'
            }),

            nombre: Joi.string().max(100).optional().allow(null, ''),
            descripcion: Joi.string().max(500).optional().allow(null, ''),

            tipo: Joi.string().valid('zona', 'pasillo', 'estante', 'bin').required().messages({
                'any.required': 'El tipo es requerido',
                'any.only': 'Tipo debe ser: zona, pasillo, estante o bin'
            }),

            parent_id: Joi.number().integer().positive().optional().allow(null),
            capacidad_maxima: Joi.number().integer().min(1).optional().allow(null),
            peso_maximo_kg: Joi.number().min(0).optional().allow(null),
            volumen_m3: Joi.number().min(0).optional().allow(null),

            es_picking: Joi.boolean().optional().default(false),
            es_recepcion: Joi.boolean().optional().default(false),
            es_despacho: Joi.boolean().optional().default(false),
            es_cuarentena: Joi.boolean().optional().default(false),
            es_devolucion: Joi.boolean().optional().default(false),

            temperatura_min: Joi.number().optional().allow(null),
            temperatura_max: Joi.number().optional().allow(null),
            humedad_controlada: Joi.boolean().optional().default(false),

            orden: Joi.number().integer().min(0).optional().default(0),
            color: Joi.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().allow(null, ''),
            icono: Joi.string().max(50).optional().allow(null, '')
        })
    },

    /**
     * Schema para actualizar ubicación
     * PUT /api/v1/inventario/ubicaciones/:id
     */
    actualizarUbicacion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            codigo: Joi.string().max(30).optional(),
            nombre: Joi.string().max(100).optional().allow(null, ''),
            descripcion: Joi.string().max(500).optional().allow(null, ''),
            tipo: Joi.string().valid('zona', 'pasillo', 'estante', 'bin').optional(),
            parent_id: Joi.number().integer().positive().optional().allow(null),
            capacidad_maxima: Joi.number().integer().min(1).optional().allow(null),
            peso_maximo_kg: Joi.number().min(0).optional().allow(null),
            volumen_m3: Joi.number().min(0).optional().allow(null),
            es_picking: Joi.boolean().optional(),
            es_recepcion: Joi.boolean().optional(),
            es_despacho: Joi.boolean().optional(),
            es_cuarentena: Joi.boolean().optional(),
            es_devolucion: Joi.boolean().optional(),
            temperatura_min: Joi.number().optional().allow(null),
            temperatura_max: Joi.number().optional().allow(null),
            humedad_controlada: Joi.boolean().optional(),
            orden: Joi.number().integer().min(0).optional(),
            color: Joi.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().allow(null, ''),
            icono: Joi.string().max(50).optional().allow(null, ''),
            activo: Joi.boolean().optional()
        }).min(1)
    },

    /**
     * Schema para listar ubicaciones
     * GET /api/v1/inventario/ubicaciones
     */
    listarUbicaciones: {
        query: Joi.object({
            sucursal_id: Joi.number().integer().positive().optional(),
            tipo: Joi.string().valid('zona', 'pasillo', 'estante', 'bin').optional(),
            parent_id: Joi.alternatives().try(
                Joi.number().integer().positive(),
                Joi.string().valid('null')
            ).optional(),
            es_picking: Joi.boolean().optional(),
            es_recepcion: Joi.boolean().optional(),
            activo: Joi.boolean().optional(),
            bloqueada: Joi.boolean().optional(),
            busqueda: Joi.string().max(100).optional(),
            limit: Joi.number().integer().min(1).max(500).optional().default(100),
            offset: Joi.number().integer().min(0).optional().default(0)
        })
    },

    /**
     * Schema para bloquear/desbloquear ubicación
     * PATCH /api/v1/inventario/ubicaciones/:id/bloquear
     */
    toggleBloqueoUbicacion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            bloqueada: Joi.boolean().required(),
            motivo_bloqueo: Joi.string().max(500).optional().allow(null, '')
        })
    },

    /**
     * Schema para agregar stock a ubicación
     * POST /api/v1/inventario/ubicaciones/:id/stock
     */
    agregarStockUbicacion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            producto_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El producto_id es requerido'
            }),
            cantidad: Joi.number().integer().min(1).required().messages({
                'any.required': 'La cantidad es requerida',
                'number.min': 'La cantidad debe ser al menos 1'
            }),
            lote: Joi.string().max(50).optional().allow(null, ''),
            fecha_vencimiento: Joi.string().isoDate().optional().allow(null)
        })
    },

    /**
     * Schema para mover stock entre ubicaciones
     * POST /api/v1/inventario/ubicaciones/mover-stock
     */
    moverStockUbicacion: {
        body: Joi.object({
            producto_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El producto_id es requerido'
            }),
            ubicacion_origen_id: Joi.number().integer().positive().required().messages({
                'any.required': 'La ubicación de origen es requerida'
            }),
            ubicacion_destino_id: Joi.number().integer().positive().required().messages({
                'any.required': 'La ubicación de destino es requerida'
            }),
            cantidad: Joi.number().integer().min(1).required().messages({
                'any.required': 'La cantidad es requerida',
                'number.min': 'La cantidad debe ser al menos 1'
            }),
            lote: Joi.string().max(50).optional().allow(null, '')
        })
    },

    /**
     * Schema para obtener árbol de ubicaciones
     * GET /api/v1/inventario/ubicaciones/arbol/:sucursalId
     */
    obtenerArbolUbicaciones: {
        params: Joi.object({
            sucursalId: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para obtener ubicaciones disponibles
     * GET /api/v1/inventario/ubicaciones/disponibles/:sucursalId
     */
    obtenerUbicacionesDisponibles: {
        params: Joi.object({
            sucursalId: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            cantidad: Joi.number().integer().min(1).optional().default(1)
        })
    },

    /**
     * Schema para obtener estadísticas de ubicaciones
     * GET /api/v1/inventario/ubicaciones/estadisticas/:sucursalId
     */
    obtenerEstadisticasUbicaciones: {
        params: Joi.object({
            sucursalId: Joi.number().integer().positive().required()
        })
    }
};

module.exports = ubicacionesSchemas;
