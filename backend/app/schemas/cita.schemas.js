/**
 * Schemas de Validación Joi para Citas
 * Valida todos los endpoints del módulo de citas
 */

const Joi = require('joi');
const { commonSchemas } = require('../middleware/validation');

// ===================================================================
// 🤖 SCHEMAS IA CONVERSACIONAL (WEBHOOKS)
// ===================================================================

/**
 * Schema para crear cita automáticamente desde IA
 * POST /citas/automatica
 */
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

/**
 * Schema para buscar citas por teléfono
 * GET /citas/buscar-por-telefono
 */
const buscarPorTelefono = {
    query: Joi.object({
        telefono: Joi.string()
            .pattern(/^[+]?[\d\s\-()]+$/)
            .required()
            .messages({ 'string.pattern.base': 'Formato de teléfono inválido' }),
        organizacion_id: commonSchemas.id,
        estados: Joi.array().items(Joi.string()).optional(),
        incluir_historicas: Joi.boolean().default(false)
    })
};

/**
 * Schema para modificar cita automáticamente desde IA
 * PUT /citas/automatica/:codigo
 */
const modificarAutomatica = {
    params: Joi.object({
        codigo: Joi.string().trim().min(3).max(50).required()
    }),
    body: Joi.object({
        organizacion_id: commonSchemas.id,
        fecha_nueva: Joi.date().iso().optional(),
        servicio_nuevo_id: commonSchemas.id.optional(),
        nuevo_turno: Joi.string()
            .valid('mañana', 'tarde', 'noche')
            .optional(),
        motivo: Joi.string().max(500).optional()
    })
};

/**
 * Schema para cancelar cita automáticamente desde IA
 * DELETE /citas/automatica/:codigo
 */
const cancelarAutomatica = {
    params: Joi.object({
        codigo: Joi.string().trim().min(3).max(50).required()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id
    }),
    body: Joi.object({
        motivo: Joi.string().max(500).optional()
    })
};

// ===================================================================
// 🛡️ SCHEMAS CRUD ESTÁNDAR (AUTENTICADOS)
// ===================================================================

/**
 * Schema para crear cita estándar
 * POST /citas
 */
const crear = {
    body: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin
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
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para obtener cita por ID
 * GET /citas/:id
 */
const obtener = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para actualizar cita
 * PUT /citas/:id
 */
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
    }).min(1), // Al menos un campo debe estar presente
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para eliminar cita
 * DELETE /citas/:id
 */
const eliminar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para confirmar asistencia
 * PATCH /citas/:id/confirmar-asistencia
 */
const confirmarAsistencia = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para listar citas con filtros
 * GET /citas
 */
const listar = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin
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
// 🏥 SCHEMAS OPERACIONALES CRÍTICOS
// ===================================================================

/**
 * Schema para check-in
 * POST /citas/:id/check-in
 */
const checkIn = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        notas_llegada: Joi.string().max(200).optional()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para iniciar servicio
 * POST /citas/:id/start-service
 */
const startService = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        notas_inicio: Joi.string().max(500).optional()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para completar servicio
 * POST /citas/:id/complete
 */
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
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para reagendar cita
 * POST /citas/:id/reagendar
 */
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
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

// ===================================================================
// 📊 SCHEMAS DASHBOARD Y MÉTRICAS
// ===================================================================

/**
 * Schema para dashboard del día
 * GET /citas/dashboard/today
 */
const dashboardToday = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin
        profesional_id: commonSchemas.id.optional()
    })
};

/**
 * Schema para cola de espera
 * GET /citas/cola-espera
 */
const colaEspera = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin
        profesional_id: commonSchemas.id.optional()
    })
};

/**
 * Schema para métricas en tiempo real
 * GET /citas/metricas-tiempo-real
 */
const metricasTiempoReal = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

// ===================================================================
// 🚶 SCHEMAS WALK-IN Y DISPONIBILIDAD
// ===================================================================

/**
 * Schema para crear cita walk-in (cliente sin cita previa)
 * POST /citas/walk-in
 * Patrón Enterprise: usa hora_inicio_real para tracking real
 */
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
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para consultar disponibilidad inmediata
 * GET /citas/disponibilidad-inmediata
 */
const disponibilidadInmediata = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin
        servicio_id: commonSchemas.id,
        profesional_id: commonSchemas.id.optional()
    })
};

// ===================================================================
// 📨 SCHEMAS RECORDATORIOS Y SISTEMAS AUXILIARES
// ===================================================================

/**
 * Schema para obtener recordatorios
 * GET /citas/recordatorios
 */
const obtenerRecordatorios = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin
        horas_anticipacion: Joi.number().integer().min(1).max(48).default(2)
    })
};

/**
 * Schema para marcar recordatorio enviado
 * PATCH /citas/:codigo/recordatorio-enviado
 */
const marcarRecordatorioEnviado = {
    params: Joi.object({
        codigo: Joi.string().trim().min(3).max(50).required()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para calificar cliente
 * PATCH /citas/:codigo/calificar-cliente
 */
const calificarCliente = {
    params: Joi.object({
        codigo: Joi.string().trim().min(3).max(50).required()
    }),
    body: Joi.object({
        puntuacion: Joi.number().integer().min(1).max(5).required(),
        comentario: Joi.string().max(500).optional()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
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
