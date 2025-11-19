const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');

// ===================================================================
// CRUD
// ===================================================================

const crear = {
    body: Joi.object({
        // ✅ FEATURE: Agendamiento público
        // - Con auth: Forbidden (usa organizacion_id del JWT)
        // - Sin auth: Requerido (marketplace público necesita especificar organización)
        // - Super admin: Opcional (puede especificar organización diferente)
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.when('$userRole', {
                is: Joi.exist(),  // Si existe userRole (usuario autenticado)
                then: Joi.forbidden(),  // No permitir override
                otherwise: commonSchemas.id.required()  // Request público: requerido
            })
        }),
        // ✅ FEATURE: Agendamiento público - permite crear cliente automáticamente
        cliente_id: commonSchemas.id.optional(),
        cliente: Joi.object({
            nombre: Joi.string().trim().min(1).max(100).required(),
            apellidos: Joi.string().trim().max(100).optional(),
            email: Joi.string().trim().email().max(255).required(),
            telefono: Joi.string().trim().pattern(/^\+?[0-9]{10,15}$/).required()
                .messages({
                    'string.pattern.base': 'Teléfono debe tener entre 10 y 15 dígitos'
                })
        }).optional(),
        // ✅ FEATURE: Agendamiento público - profesional opcional (se asigna automáticamente)
        profesional_id: commonSchemas.id.optional(),
        // ✅ FEATURE: Múltiples servicios (backward compatibility con servicio_id)
        servicios_ids: Joi.array()
            .items(commonSchemas.id)
            .min(1)
            .max(10)
            .optional()
            .messages({
                'array.min': 'Debe proporcionar al menos un servicio',
                'array.max': 'No puede agregar más de 10 servicios por cita'
            }),
        servicio_id: commonSchemas.id.optional(), // Deprecated - usar servicios_ids
        // ✅ Datos opcionales por servicio (si no se proporcionan, se usan defaults del catálogo)
        servicios_data: Joi.array()
            .items(Joi.object({
                precio_aplicado: commonSchemas.price.optional(),
                duracion_minutos: Joi.number().integer().min(5).max(480).optional(),
                descuento: Joi.number().min(0).max(100).default(0),
                notas: Joi.string().max(500).optional()
            }))
            .optional(),
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
        metodo_pago: Joi.string()
            .valid('efectivo', 'tarjeta', 'transferencia')
            .optional()
            .allow(null),
        notas_cliente: Joi.string().max(1000).optional(),
        notas: Joi.string().max(1000).optional() // Alias para compatibilidad
    })
    .custom((value, helpers) => {
        // Validar que proporcione servicios_ids O servicio_id (no ambos)
        if (value.servicios_ids && value.servicio_id) {
            return helpers.error('custom.solo_un_tipo_servicio');
        }
        if (!value.servicios_ids && !value.servicio_id) {
            return helpers.error('custom.servicio_requerido');
        }
        // Validar que proporcione cliente_id O cliente (no ambos, al menos uno)
        if (value.cliente_id && value.cliente) {
            return helpers.error('custom.solo_un_tipo_cliente');
        }
        if (!value.cliente_id && !value.cliente) {
            return helpers.error('custom.cliente_requerido');
        }
        return value;
    })
    .messages({
        'custom.solo_un_tipo_servicio': 'Use servicios_ids (array) O servicio_id (deprecated), no ambos',
        'custom.servicio_requerido': 'Debe proporcionar servicios_ids (array) o servicio_id',
        'custom.solo_un_tipo_cliente': 'Use cliente_id (existente) O cliente (nuevo), no ambos',
        'custom.cliente_requerido': 'Debe proporcionar cliente_id o cliente'
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
        // ✅ FEATURE: Múltiples servicios (reemplaza servicio_id deprecated)
        servicios_ids: Joi.array()
            .items(commonSchemas.id)
            .min(1)
            .max(10)
            .optional()
            .messages({
                'array.min': 'Debe proporcionar al menos un servicio',
                'array.max': 'No puede agregar más de 10 servicios por cita'
            }),
        servicios_data: Joi.array()
            .items(Joi.object({
                precio_aplicado: commonSchemas.price.optional(),
                duracion_minutos: Joi.number().integer().min(5).max(480).optional(),
                descuento: Joi.number().min(0).max(100).default(0),
                notas: Joi.string().max(500).optional()
            }))
            .optional(),
        fecha_cita: Joi.date().iso().optional(),
        hora_inicio: commonSchemas.time.optional(),
        hora_fin: commonSchemas.time.optional(),
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
        // ✅ FEATURE: Filtro por múltiples servicios (backward compatibility con servicio_id)
        servicio_id: commonSchemas.id.optional(), // Busca citas que contengan este servicio
        servicios_ids: Joi.alternatives()
            .try(
                commonSchemas.id, // Si viene un solo ID como string
                Joi.array().items(commonSchemas.id).min(1).max(10) // Si viene array
            )
            .optional(),
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
        // ✅ precio_final_real → precio_total_real (backward compatibility mantenida)
        precio_total_real: commonSchemas.price.optional(),
        precio_final_real: commonSchemas.price.optional(), // Deprecated - usar precio_total_real
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

        // ✅ FEATURE: Servicios - Acepta servicio_id (único) O servicios_ids (array)
        // Walk-ins típicamente usan 1 servicio, pero se permite múltiples
        servicio_id: commonSchemas.id.optional(), // Deprecated - usar servicios_ids
        servicios_ids: Joi.array()
            .items(commonSchemas.id)
            .min(1)
            .max(10)
            .optional()
            .messages({
                'array.min': 'Debe proporcionar al menos un servicio',
                'array.max': 'No puede agregar más de 10 servicios por cita'
            }),

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

        // Validación 2: Debe tener servicio_id O servicios_ids (no ambos)
        if (value.servicios_ids && value.servicio_id) {
            return helpers.error('custom.solo_un_tipo_servicio');
        }
        if (!value.servicios_ids && !value.servicio_id) {
            return helpers.error('custom.servicio_requerido');
        }

        return value;
    })
    .messages({
        'custom.cliente_requerido': 'Debe proporcionar cliente_id (existente) O nombre_cliente (nuevo). Teléfono opcional.',
        'custom.cliente_duplicado': 'No puede enviar cliente_id Y nombre_cliente simultáneamente',
        'custom.solo_un_tipo_servicio': 'Use servicios_ids (array) O servicio_id (deprecated), no ambos',
        'custom.servicio_requerido': 'Debe proporcionar servicios_ids (array) o servicio_id'
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
