const Joi = require('joi');
const { commonSchemas } = require('../middleware/validation');

// ===================================================================
// CRUD
// ===================================================================

const crear = {
    body: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        }),
        cliente_id: commonSchemas.id,
        profesional_id: commonSchemas.id,
        servicio_id: commonSchemas.id,
        fecha_cita: Joi.date().iso().required(),
        hora_inicio: commonSchemas.time,
        hora_fin: commonSchemas.time
            .custom((value, helpers) => {
                const hora_inicio = helpers.state.ancestors[0].hora_inicio;
                if (hora_inicio && value <= hora_inicio) {
                    return helpers.error('custom.hora_fin_posterior');
                }
                return value;
            })
            .messages({ 'custom.hora_fin_posterior': 'hora_fin debe ser posterior a hora_inicio' }),
        precio_servicio: commonSchemas.price.optional()
            .messages({
                'any.optional': 'Si no se proporciona, se calculará automáticamente desde el servicio'
            }),
        descuento: commonSchemas.price.default(0.00),
        precio_final: commonSchemas.price.optional()
            .custom((value, helpers) => {
                const precio_servicio = helpers.state.ancestors[0].precio_servicio;
                const descuento = helpers.state.ancestors[0].descuento || 0;

                // Si hay precio_servicio y precio_final, validar que sean consistentes
                if (precio_servicio && value) {
                    const esperado = precio_servicio - descuento;
                    if (Math.abs(value - esperado) > 0.01) {
                        return helpers.error('custom.precio_final_invalido');
                    }
                }
                return value;
            })
            .messages({
                'custom.precio_final_invalido': 'precio_final no coincide con precio_servicio - descuento',
                'any.optional': 'Si no se proporciona, se calculará automáticamente desde el servicio'
            }),
        metodo_pago: Joi.string()
            .valid('efectivo', 'tarjeta', 'transferencia')
            .optional()
            .allow(null),
        notas_cliente: Joi.string().max(1000).optional()
    }),
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        })
    })
};

const obtener = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        })
    })
};

const actualizar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        profesional_id: commonSchemas.id.optional(),
        servicio_id: commonSchemas.id.optional(),
        fecha_cita: Joi.date().iso().optional(),
        hora_inicio: commonSchemas.time.optional(),
        hora_fin: commonSchemas.time.optional(),
        precio_servicio: commonSchemas.price.optional(),
        descuento: commonSchemas.price.optional(),
        estado: Joi.string()
            .valid('pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio')
            .optional(),
        motivo_cancelacion: Joi.string().max(500).optional(),
        metodo_pago: Joi.string()
            .valid('efectivo', 'tarjeta', 'transferencia')
            .optional(),
        pagado: Joi.boolean().optional(),
        notas_cliente: Joi.string().max(1000).optional()
    }).min(1),
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        })
    })
};

const eliminar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        })
    })
};

const confirmarAsistencia = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        })
    })
};

const listar = {
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        }),
        fecha_desde: Joi.date().iso().optional(),
        fecha_hasta: Joi.date().iso().optional(),
        profesional_id: commonSchemas.id.optional(),
        cliente_id: commonSchemas.id.optional(),
        servicio_id: commonSchemas.id.optional(),
        estado: Joi.string()
            .valid('pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio')
            .optional(),
        busqueda: Joi.string().max(100).optional(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        orden: Joi.string().default('fecha_cita'),
        direccion: Joi.string().valid('ASC', 'DESC').default('DESC')
    })
};

// ===================================================================
// OPERACIONALES
// ===================================================================

const checkIn = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        notas_llegada: Joi.string().max(200).optional()
    }),
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        })
    })
};

const startService = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        notas_inicio: Joi.string().max(500).optional()
    }),
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        })
    })
};

const complete = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        calificacion_profesional: Joi.number().integer().min(1).max(5).optional(),
        comentario_profesional: Joi.string().max(500).optional(),
        notas_profesional: Joi.string().max(1000).optional(),
        precio_final_real: commonSchemas.price.optional(),
        metodo_pago: Joi.string()
            .valid('efectivo', 'tarjeta', 'transferencia')
            .optional(),
        pagado: Joi.boolean().optional()
    }),
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        })
    })
};

const reagendar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        nueva_fecha: Joi.date().iso().required(),
        nueva_hora_inicio: commonSchemas.time.required(),
        nueva_hora_fin: commonSchemas.time.optional(),
        nuevo_profesional_id: commonSchemas.id.optional(),
        motivo_reagenda: Joi.string().max(500).optional()
    }),
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        })
    })
};

// ===================================================================
// DASHBOARD Y MÉTRICAS
// ===================================================================

const dashboardToday = {
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        }),
        profesional_id: commonSchemas.id.optional()
    })
};

const colaEspera = {
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        }),
        profesional_id: commonSchemas.id.optional()
    })
};

const metricasTiempoReal = {
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        })
    })
};

// ===================================================================
// WALK-IN Y DISPONIBILIDAD
// ===================================================================

const crearWalkIn = {
    body: Joi.object({
        // Cliente: PUEDE ser existente (cliente_id) O nuevo (nombre_cliente, telefono opcional)
        cliente_id: commonSchemas.id.optional(),
        nombre_cliente: Joi.string().min(2).max(150).trim().optional(),
        telefono: commonSchemas.mexicanPhone.optional().allow(null, ''),

        // Profesional: OPCIONAL (se auto-asigna si no se especifica)
        profesional_id: commonSchemas.id.optional().allow(null),

        // Servicio: SIEMPRE requerido
        servicio_id: commonSchemas.id.required()
            .messages({'any.required': 'servicio_id es requerido'}),

        tiempo_espera_aceptado: Joi.number().integer().min(0).max(120).optional()
            .messages({'number.max': 'Tiempo de espera no puede exceder 120 minutos'}),
        notas_walk_in: Joi.string().max(500).optional()
    })
    .custom((value, helpers) => {
        // Validación 1: Debe tener cliente_id O nombre_cliente (telefono es opcional)
        const tieneClienteExistente = !!value.cliente_id;
        const tieneClienteNuevo = !!value.nombre_cliente;

        if (!tieneClienteExistente && !tieneClienteNuevo) {
            return helpers.error('custom.cliente_requerido');
        }

        if (tieneClienteExistente && tieneClienteNuevo) {
            return helpers.error('custom.cliente_duplicado');
        }

        return value;
    })
    .messages({
        'custom.cliente_requerido': 'Debe proporcionar cliente_id (existente) O nombre_cliente (nuevo). Teléfono opcional.',
        'custom.cliente_duplicado': 'No puede enviar cliente_id Y nombre_cliente simultáneamente'
    }),

    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        })
    })
};

const disponibilidadInmediata = {
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        }),
        servicio_id: commonSchemas.id,
        profesional_id: commonSchemas.id.optional()
    })
};

// ===================================================================
// RECORDATORIOS
// ===================================================================

const obtenerRecordatorios = {
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        }),
        horas_anticipacion: Joi.number().integer().min(1).max(48).default(2)
    })
};

const marcarRecordatorioEnviado = {
    params: Joi.object({
        codigo: Joi.string().trim().min(3).max(50).required()
    }),
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        })
    })
};

const calificarCliente = {
    params: Joi.object({
        codigo: Joi.string().trim().min(3).max(50).required()
    }),
    body: Joi.object({
        puntuacion: Joi.number().integer().min(1).max(5).required(),
        comentario: Joi.string().max(500).optional()
    }),
    query: Joi.object({
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        })
    })
};

module.exports = {
    // CRUD
    crear,
    obtener,
    actualizar,
    eliminar,
    confirmarAsistencia,
    listar,

    // Operacionales
    checkIn,
    startService,
    complete,
    reagendar,

    // Dashboard
    dashboardToday,
    colaEspera,
    metricasTiempoReal,

    // Walk-in
    crearWalkIn,
    disponibilidadInmediata,

    // Recordatorios
    obtenerRecordatorios,
    marcarRecordatorioEnviado,
    calificarCliente
};
