/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - COMISIONES
 * ====================================================================
 *
 * Schemas Joi para validación de requests del módulo de comisiones.
 */

const Joi = require('joi');

const comisionesSchemas = {
    // ========================================================================
    // CONFIGURACIÓN DE COMISIONES
    // ========================================================================

    /**
     * Schema para crear/actualizar configuración
     * POST /api/v1/comisiones/configuracion
     */
    crearConfiguracion: {
        body: Joi.object({
            // ========== OBLIGATORIOS ==========
            profesional_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El profesional_id es requerido',
                'number.base': 'profesional_id debe ser un número',
                'number.positive': 'profesional_id debe ser positivo'
            }),

            tipo_comision: Joi.string()
                .valid('porcentaje', 'monto_fijo')
                .required()
                .messages({
                    'any.required': 'El tipo_comision es requerido',
                    'any.only': 'tipo_comision debe ser "porcentaje" o "monto_fijo"'
                }),

            valor_comision: Joi.number().min(0).required().messages({
                'any.required': 'El valor_comision es requerido',
                'number.base': 'valor_comision debe ser un número',
                'number.min': 'valor_comision debe ser mayor o igual a 0'
            }),

            // ========== OPCIONALES ==========
            servicio_id: Joi.number().integer().positive().optional().messages({
                'number.base': 'servicio_id debe ser un número',
                'number.positive': 'servicio_id debe ser positivo'
            }),

            activo: Joi.boolean().optional().default(true),

            notas: Joi.string().max(500).optional().allow(null, '').messages({
                'string.max': 'Las notas no pueden exceder 500 caracteres'
            }),

            creado_por: Joi.number().integer().positive().optional().messages({
                'number.base': 'creado_por debe ser un número',
                'number.positive': 'creado_por debe ser positivo'
            })
        }).custom((value, helpers) => {
            // Validación adicional: Si tipo es porcentaje, valor debe estar entre 0-100
            if (value.tipo_comision === 'porcentaje') {
                if (value.valor_comision < 0 || value.valor_comision > 100) {
                    return helpers.error('any.custom', {
                        message: 'El porcentaje debe estar entre 0 y 100'
                    });
                }
            }
            return value;
        })
    },

    /**
     * Schema para listar configuraciones
     * GET /api/v1/comisiones/configuracion
     */
    listarConfiguracion: {
        query: Joi.object({
            profesional_id: Joi.number().integer().positive().optional().messages({
                'number.base': 'profesional_id debe ser un número',
                'number.positive': 'profesional_id debe ser positivo'
            }),

            servicio_id: Joi.number().integer().positive().optional().messages({
                'number.base': 'servicio_id debe ser un número',
                'number.positive': 'servicio_id debe ser positivo'
            }),

            activo: Joi.boolean().optional(),

            tipo_comision: Joi.string()
                .valid('porcentaje', 'monto_fijo')
                .optional()
                .messages({
                    'any.only': 'tipo_comision debe ser "porcentaje" o "monto_fijo"'
                })
        })
    },

    /**
     * Schema para eliminar configuración
     * DELETE /api/v1/comisiones/configuracion/:id
     */
    eliminarConfiguracion: {
        params: Joi.object({
            id: Joi.number().integer().positive().required().messages({
                'any.required': 'El ID de configuración es requerido',
                'number.base': 'El ID debe ser un número',
                'number.positive': 'El ID debe ser positivo'
            })
        })
    },

    // ========================================================================
    // CONSULTAS DE COMISIONES
    // ========================================================================

    /**
     * Schema para listar comisiones de un profesional
     * GET /api/v1/comisiones/profesional/:id
     */
    listarPorProfesional: {
        params: Joi.object({
            id: Joi.number().integer().positive().required().messages({
                'any.required': 'El ID del profesional es requerido',
                'number.base': 'El ID debe ser un número',
                'number.positive': 'El ID debe ser positivo'
            })
        }),

        query: Joi.object({
            estado_pago: Joi.string()
                .valid('pendiente', 'pagada', 'cancelada')
                .optional()
                .messages({
                    'any.only': 'estado_pago debe ser "pendiente", "pagada" o "cancelada"'
                }),

            fecha_desde: Joi.string().isoDate().optional().messages({
                'string.isoDate': 'fecha_desde debe tener formato YYYY-MM-DD'
            }),

            fecha_hasta: Joi.string().isoDate().optional().messages({
                'string.isoDate': 'fecha_hasta debe tener formato YYYY-MM-DD'
            }),

            pagina: Joi.number().integer().min(1).optional().default(1).messages({
                'number.min': 'pagina debe ser mayor o igual a 1'
            }),

            limite: Joi.number().integer().min(1).max(100).optional().default(20).messages({
                'number.min': 'limite debe ser mayor o igual a 1',
                'number.max': 'limite no puede exceder 100'
            })
        })
    },

    /**
     * Schema para consultar comisiones por período
     * GET /api/v1/comisiones/periodo
     */
    consultarPorPeriodo: {
        query: Joi.object({
            // ========== OBLIGATORIOS ==========
            fecha_desde: Joi.string().isoDate().required().messages({
                'any.required': 'fecha_desde es requerida',
                'string.isoDate': 'fecha_desde debe tener formato YYYY-MM-DD'
            }),

            fecha_hasta: Joi.string().isoDate().required().messages({
                'any.required': 'fecha_hasta es requerida',
                'string.isoDate': 'fecha_hasta debe tener formato YYYY-MM-DD'
            }),

            // ========== OPCIONALES ==========
            profesional_id: Joi.number().integer().positive().optional().messages({
                'number.base': 'profesional_id debe ser un número',
                'number.positive': 'profesional_id debe ser positivo'
            }),

            estado_pago: Joi.string()
                .valid('pendiente', 'pagada', 'cancelada')
                .optional()
                .messages({
                    'any.only': 'estado_pago debe ser "pendiente", "pagada" o "cancelada"'
                })
        })
    },

    /**
     * Schema para marcar comisión como pagada
     * PATCH /api/v1/comisiones/:id/pagar
     */
    marcarComoPagada: {
        params: Joi.object({
            id: Joi.number().integer().positive().required().messages({
                'any.required': 'El ID de comisión es requerido',
                'number.base': 'El ID debe ser un número',
                'number.positive': 'El ID debe ser positivo'
            })
        }),

        body: Joi.object({
            fecha_pago: Joi.string().isoDate().optional().messages({
                'string.isoDate': 'fecha_pago debe tener formato YYYY-MM-DD'
            }),

            metodo_pago: Joi.string()
                .valid('efectivo', 'transferencia', 'cheque', 'tarjeta', 'otro')
                .optional()
                .default('efectivo')
                .messages({
                    'any.only': 'metodo_pago debe ser "efectivo", "transferencia", "cheque", "tarjeta" o "otro"'
                }),

            referencia_pago: Joi.string().max(100).optional().allow(null, '').messages({
                'string.max': 'referencia_pago no puede exceder 100 caracteres'
            }),

            notas_pago: Joi.string().max(500).optional().allow(null, '').messages({
                'string.max': 'notas_pago no pueden exceder 500 caracteres'
            }),

            pagado_por: Joi.number().integer().positive().optional().messages({
                'number.base': 'pagado_por debe ser un número',
                'number.positive': 'pagado_por debe ser positivo'
            })
        })
    },

    // ========================================================================
    // REPORTES Y DASHBOARD
    // ========================================================================

    /**
     * Schema para generar reporte
     * GET /api/v1/comisiones/reporte
     */
    generarReporte: {
        query: Joi.object({
            // ========== OBLIGATORIOS ==========
            fecha_desde: Joi.string().isoDate().required().messages({
                'any.required': 'fecha_desde es requerida',
                'string.isoDate': 'fecha_desde debe tener formato YYYY-MM-DD'
            }),

            fecha_hasta: Joi.string().isoDate().required().messages({
                'any.required': 'fecha_hasta es requerida',
                'string.isoDate': 'fecha_hasta debe tener formato YYYY-MM-DD'
            }),

            // ========== OPCIONALES ==========
            tipo: Joi.string()
                .valid('por_profesional', 'detallado', 'por_dia')
                .optional()
                .default('por_profesional')
                .messages({
                    'any.only': 'tipo debe ser "por_profesional", "detallado" o "por_dia"'
                }),

            profesional_id: Joi.number().integer().positive().optional().messages({
                'number.base': 'profesional_id debe ser un número',
                'number.positive': 'profesional_id debe ser positivo'
            }),

            estado_pago: Joi.string()
                .valid('pendiente', 'pagada', 'cancelada')
                .optional()
                .messages({
                    'any.only': 'estado_pago debe ser "pendiente", "pagada" o "cancelada"'
                }),

            formato: Joi.string()
                .valid('json', 'excel', 'pdf')
                .optional()
                .default('json')
                .messages({
                    'any.only': 'formato debe ser "json", "excel" o "pdf"'
                })
        })
    },

    /**
     * Schema para métricas del dashboard
     * GET /api/v1/comisiones/dashboard
     */
    metricasDashboard: {
        query: Joi.object({
            fecha_desde: Joi.string().isoDate().optional().messages({
                'string.isoDate': 'fecha_desde debe tener formato YYYY-MM-DD'
            }),

            fecha_hasta: Joi.string().isoDate().optional().messages({
                'string.isoDate': 'fecha_hasta debe tener formato YYYY-MM-DD'
            }),

            profesional_id: Joi.number().integer().positive().optional().messages({
                'number.base': 'profesional_id debe ser un número',
                'number.positive': 'profesional_id debe ser positivo'
            })
        })
    }
};

module.exports = comisionesSchemas;
