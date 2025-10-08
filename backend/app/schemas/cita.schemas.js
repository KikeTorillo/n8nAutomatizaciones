const Joi = require('joi');
const { commonSchemas } = require('../middleware/validation');

// ===================================================================
// IA CONVERSACIONAL
// ===================================================================

const crearAutomatica = {
    body: Joi.object({
        telefono_cliente: Joi.string()
            .pattern(/^[+]?[\d\s\-()]+$/)
            .required()
            .messages({ 'string.pattern.base': 'Formato de teléfono inválido' }),
        organizacion_id: commonSchemas.id,
        servicio_id: commonSchemas.id,
        fecha_solicitada: Joi.string().default('mañana'),
        turno_preferido: Joi.string()
            .valid('mañana', 'tarde', 'noche', 'cualquiera')
            .optional(),
        profesional_preferido: commonSchemas.id.optional().allow(null),
        crear_cliente_si_no_existe: Joi.boolean().default(true),
        nombre_cliente_nuevo: Joi.string().trim().max(100).optional(),
        email_cliente_nuevo: Joi.string().email().lowercase().optional(),
        metadata: Joi.object().optional()
    })
};

const buscarPorTelefono = {
    query: Joi.object({
        telefono: Joi.string()
            .pattern(/^[+]?[\d\s\-()]+$/)
            .required()
            .messages({ 'string.pattern.base': 'Formato de teléfono inválido' }),
        organizacion_id: commonSchemas.id.required()
            .messages({ 'any.required': 'organizacion_id es requerido' }),
        estados: Joi.alternatives().try(
            Joi.array().items(Joi.string()),
            Joi.string()
        ).optional(),
        incluir_historicas: Joi.alternatives().try(
            Joi.boolean(),
            Joi.string().valid('true', 'false')
        ).default(false)
    })
};

const modificarAutomatica = {
    params: Joi.object({
        codigo: Joi.string().trim().min(3).max(50).required()
    }),
    body: Joi.object({
        organizacion_id: commonSchemas.id,
        nueva_fecha: Joi.string().optional(), // Formato flexible para IA ("mañana", "2025-10-10", etc)
        nuevo_servicio_id: commonSchemas.id.optional(),
        nuevo_turno: Joi.string()
            .valid('mañana', 'tarde', 'noche', 'cualquiera')
            .optional(),
        motivo: Joi.string().max(500).optional()
    })
};

const cancelarAutomatica = {
    params: Joi.object({
        codigo: Joi.string().trim().min(3).max(50).required()
    }),
    body: Joi.object({
        organizacion_id: commonSchemas.id,
        motivo: Joi.string().max(500).optional()
    })
};

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
        precio_servicio: commonSchemas.price,
        descuento: commonSchemas.price.default(0.00),
        precio_final: commonSchemas.price
            .custom((value, helpers) => {
                const precio_servicio = helpers.state.ancestors[0].precio_servicio || 0;
                const descuento = helpers.state.ancestors[0].descuento || 0;
                const esperado = precio_servicio - descuento;
                if (Math.abs(value - esperado) > 0.01) {
                    return helpers.error('custom.precio_final_invalido');
                }
                return value;
            })
            .messages({ 'custom.precio_final_invalido': 'precio_final no coincide con precio_servicio - descuento' }),
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
        cliente_id: commonSchemas.id.required()
            .messages({'any.required': 'cliente_id es requerido'}),
        profesional_id: commonSchemas.id.required()
            .messages({'any.required': 'profesional_id es requerido para walk-in'}),
        servicio_id: commonSchemas.id.required()
            .messages({'any.required': 'servicio_id es requerido'}),
        nombre_cliente: Joi.string().max(100).optional(),
        tiempo_espera_aceptado: Joi.number().integer().min(0).max(120).optional()
            .messages({'number.max': 'Tiempo de espera no puede exceder 120 minutos'}),
        notas_walk_in: Joi.string().max(500).optional()
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
    // IA
    crearAutomatica,
    buscarPorTelefono,
    modificarAutomatica,
    cancelarAutomatica,

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
