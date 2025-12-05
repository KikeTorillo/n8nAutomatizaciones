/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - CONTABILIDAD
 * ====================================================================
 *
 * Schemas Joi para validación de requests del módulo de contabilidad.
 * Basado en el Código Agrupador SAT México (Anexo 24).
 */

const Joi = require('joi');

const contabilidadSchemas = {
    // ========================================================================
    // CUENTAS CONTABLES
    // ========================================================================

    /**
     * Schema para crear cuenta contable
     * POST /api/v1/contabilidad/cuentas
     */
    crearCuenta: {
        body: Joi.object({
            codigo: Joi.string().max(20).required().messages({
                'any.required': 'El código es requerido',
                'string.max': 'El código no puede exceder 20 caracteres'
            }),

            nombre: Joi.string().max(200).required().messages({
                'any.required': 'El nombre es requerido',
                'string.max': 'El nombre no puede exceder 200 caracteres'
            }),

            tipo: Joi.string()
                .valid('activo', 'pasivo', 'capital', 'ingreso', 'gasto', 'orden')
                .required()
                .messages({
                    'any.required': 'El tipo es requerido',
                    'any.only': 'tipo debe ser activo, pasivo, capital, ingreso, gasto u orden'
                }),

            naturaleza: Joi.string()
                .valid('deudora', 'acreedora')
                .required()
                .messages({
                    'any.required': 'La naturaleza es requerida',
                    'any.only': 'naturaleza debe ser deudora o acreedora'
                }),

            cuenta_padre_id: Joi.number().integer().positive().optional().allow(null).messages({
                'number.base': 'cuenta_padre_id debe ser un número',
                'number.positive': 'cuenta_padre_id debe ser positivo'
            }),

            codigo_sat: Joi.string().max(20).optional().allow(null, '').messages({
                'string.max': 'codigo_sat no puede exceder 20 caracteres'
            }),

            afectable: Joi.boolean().optional().default(true),

            activo: Joi.boolean().optional().default(true)
        })
    },

    /**
     * Schema para actualizar cuenta contable
     * PUT /api/v1/contabilidad/cuentas/:id
     */
    actualizarCuenta: {
        params: Joi.object({
            id: Joi.number().integer().positive().required().messages({
                'any.required': 'El ID es requerido',
                'number.base': 'El ID debe ser un número',
                'number.positive': 'El ID debe ser positivo'
            })
        }),

        body: Joi.object({
            codigo: Joi.string().max(20).optional().messages({
                'string.max': 'El código no puede exceder 20 caracteres'
            }),

            nombre: Joi.string().max(200).optional().messages({
                'string.max': 'El nombre no puede exceder 200 caracteres'
            }),

            tipo: Joi.string()
                .valid('activo', 'pasivo', 'capital', 'ingreso', 'gasto', 'orden')
                .optional()
                .messages({
                    'any.only': 'tipo debe ser activo, pasivo, capital, ingreso, gasto u orden'
                }),

            naturaleza: Joi.string()
                .valid('deudora', 'acreedora')
                .optional()
                .messages({
                    'any.only': 'naturaleza debe ser deudora o acreedora'
                }),

            codigo_sat: Joi.string().max(20).optional().allow(null, '').messages({
                'string.max': 'codigo_sat no puede exceder 20 caracteres'
            }),

            afectable: Joi.boolean().optional(),

            activo: Joi.boolean().optional()
        }).min(1).messages({
            'object.min': 'Debe proporcionar al menos un campo para actualizar'
        })
    },

    /**
     * Schema para listar cuentas
     * GET /api/v1/contabilidad/cuentas
     */
    listarCuentas: {
        query: Joi.object({
            tipo: Joi.string()
                .valid('activo', 'pasivo', 'capital', 'ingreso', 'gasto', 'orden')
                .optional(),

            naturaleza: Joi.string()
                .valid('deudora', 'acreedora')
                .optional(),

            nivel: Joi.number().integer().min(1).max(5).optional(),

            cuenta_padre_id: Joi.number().integer().positive().optional(),

            activo: Joi.boolean().optional(),

            afectable: Joi.boolean().optional(),

            busqueda: Joi.string().max(100).optional(),

            pagina: Joi.number().integer().min(1).optional().default(1),

            limite: Joi.number().integer().min(1).max(200).optional().default(50)
        })
    },

    // ========================================================================
    // ASIENTOS CONTABLES
    // ========================================================================

    /**
     * Schema para crear asiento contable
     * POST /api/v1/contabilidad/asientos
     */
    crearAsiento: {
        body: Joi.object({
            fecha: Joi.string().isoDate().required().messages({
                'any.required': 'La fecha es requerida',
                'string.isoDate': 'fecha debe tener formato YYYY-MM-DD'
            }),

            concepto: Joi.string().max(500).required().messages({
                'any.required': 'El concepto es requerido',
                'string.max': 'El concepto no puede exceder 500 caracteres'
            }),

            tipo: Joi.string()
                .valid('manual', 'venta_pos', 'compra', 'nomina', 'depreciacion', 'ajuste', 'cierre')
                .optional()
                .default('manual')
                .messages({
                    'any.only': 'tipo inválido'
                }),

            notas: Joi.string().max(1000).optional().allow(null, ''),

            estado: Joi.string()
                .valid('borrador', 'publicado')
                .optional()
                .default('borrador'),

            referencia_tipo: Joi.string().max(50).optional().allow(null, ''),

            referencia_id: Joi.number().integer().positive().optional().allow(null),

            periodo_id: Joi.number().integer().positive().optional().allow(null),

            movimientos: Joi.array().items(
                Joi.object({
                    cuenta_id: Joi.number().integer().positive().required().messages({
                        'any.required': 'cuenta_id es requerido en cada movimiento'
                    }),

                    concepto: Joi.string().max(500).optional().allow(null, ''),

                    debe: Joi.number().min(0).optional().default(0).messages({
                        'number.min': 'debe no puede ser negativo'
                    }),

                    haber: Joi.number().min(0).optional().default(0).messages({
                        'number.min': 'haber no puede ser negativo'
                    }),

                    tercero_tipo: Joi.string()
                        .valid('cliente', 'proveedor')
                        .optional()
                        .allow(null),

                    tercero_id: Joi.number().integer().positive().optional().allow(null)
                }).custom((value, helpers) => {
                    // Al menos uno debe tener valor
                    if ((value.debe || 0) === 0 && (value.haber || 0) === 0) {
                        return helpers.error('any.custom', {
                            message: 'Cada movimiento debe tener un valor en debe o haber'
                        });
                    }
                    // No ambos
                    if ((value.debe || 0) > 0 && (value.haber || 0) > 0) {
                        return helpers.error('any.custom', {
                            message: 'Un movimiento no puede tener valores en debe y haber simultáneamente'
                        });
                    }
                    return value;
                })
            ).min(2).required().messages({
                'any.required': 'Se requieren movimientos',
                'array.min': 'Un asiento debe tener al menos 2 movimientos'
            })
        }).custom((value, helpers) => {
            // Validar cuadre si se quiere publicar
            if (value.estado === 'publicado') {
                const totalDebe = value.movimientos.reduce((acc, m) => acc + (m.debe || 0), 0);
                const totalHaber = value.movimientos.reduce((acc, m) => acc + (m.haber || 0), 0);

                if (Math.abs(totalDebe - totalHaber) > 0.01) {
                    return helpers.error('any.custom', {
                        message: `El asiento no cuadra. Debe: ${totalDebe}, Haber: ${totalHaber}`
                    });
                }
            }
            return value;
        })
    },

    /**
     * Schema para actualizar asiento
     * PUT /api/v1/contabilidad/asientos/:id
     */
    actualizarAsiento: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        query: Joi.object({
            fecha: Joi.string().isoDate().required().messages({
                'any.required': 'Se requiere el parámetro fecha'
            })
        }),

        body: Joi.object({
            concepto: Joi.string().max(500).optional(),

            notas: Joi.string().max(1000).optional().allow(null, ''),

            movimientos: Joi.array().items(
                Joi.object({
                    cuenta_id: Joi.number().integer().positive().required(),
                    concepto: Joi.string().max(500).optional().allow(null, ''),
                    debe: Joi.number().min(0).optional().default(0),
                    haber: Joi.number().min(0).optional().default(0),
                    tercero_tipo: Joi.string().valid('cliente', 'proveedor').optional().allow(null),
                    tercero_id: Joi.number().integer().positive().optional().allow(null)
                })
            ).min(2).optional()
        })
    },

    /**
     * Schema para listar asientos
     * GET /api/v1/contabilidad/asientos
     */
    listarAsientos: {
        query: Joi.object({
            estado: Joi.string()
                .valid('borrador', 'publicado', 'anulado')
                .optional(),

            tipo: Joi.string()
                .valid('manual', 'venta_pos', 'compra', 'nomina', 'depreciacion', 'ajuste', 'cierre')
                .optional(),

            periodo_id: Joi.number().integer().positive().optional(),

            fecha_desde: Joi.string().isoDate().optional(),

            fecha_hasta: Joi.string().isoDate().optional(),

            busqueda: Joi.string().max(100).optional(),

            pagina: Joi.number().integer().min(1).optional().default(1),

            limite: Joi.number().integer().min(1).max(100).optional().default(20)
        })
    },

    /**
     * Schema para obtener asiento por ID
     * GET /api/v1/contabilidad/asientos/:id
     */
    obtenerAsiento: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        query: Joi.object({
            fecha: Joi.string().isoDate().required().messages({
                'any.required': 'Se requiere el parámetro fecha'
            })
        })
    },

    /**
     * Schema para anular asiento
     * POST /api/v1/contabilidad/asientos/:id/anular
     */
    anularAsiento: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        query: Joi.object({
            fecha: Joi.string().isoDate().required()
        }),

        body: Joi.object({
            motivo: Joi.string().min(10).max(500).required().messages({
                'any.required': 'El motivo de anulación es requerido',
                'string.min': 'El motivo debe tener al menos 10 caracteres',
                'string.max': 'El motivo no puede exceder 500 caracteres'
            })
        })
    },

    // ========================================================================
    // REPORTES
    // ========================================================================

    /**
     * Schema para balanza de comprobación
     * GET /api/v1/contabilidad/reportes/balanza
     */
    balanza: {
        query: Joi.object({
            periodo_id: Joi.number().integer().positive().required().messages({
                'any.required': 'Se requiere periodo_id'
            })
        })
    },

    /**
     * Schema para libro mayor
     * GET /api/v1/contabilidad/reportes/libro-mayor
     */
    libroMayor: {
        query: Joi.object({
            cuenta_id: Joi.number().integer().positive().required().messages({
                'any.required': 'Se requiere cuenta_id'
            }),

            fecha_inicio: Joi.string().isoDate().required().messages({
                'any.required': 'Se requiere fecha_inicio'
            }),

            fecha_fin: Joi.string().isoDate().required().messages({
                'any.required': 'Se requiere fecha_fin'
            })
        })
    },

    /**
     * Schema para estado de resultados
     * GET /api/v1/contabilidad/reportes/estado-resultados
     */
    estadoResultados: {
        query: Joi.object({
            fecha_inicio: Joi.string().isoDate().required().messages({
                'any.required': 'Se requiere fecha_inicio'
            }),

            fecha_fin: Joi.string().isoDate().required().messages({
                'any.required': 'Se requiere fecha_fin'
            })
        })
    },

    /**
     * Schema para balance general
     * GET /api/v1/contabilidad/reportes/balance-general
     */
    balanceGeneral: {
        query: Joi.object({
            fecha: Joi.string().isoDate().required().messages({
                'any.required': 'Se requiere fecha'
            })
        })
    },

    /**
     * Schema para listar períodos
     * GET /api/v1/contabilidad/periodos
     */
    listarPeriodos: {
        query: Joi.object({
            anio: Joi.number().integer().min(2020).max(2100).optional()
        })
    },

    /**
     * Schema para cerrar período
     * POST /api/v1/contabilidad/periodos/:id/cerrar
     */
    cerrarPeriodo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    }
};

module.exports = contabilidadSchemas;
