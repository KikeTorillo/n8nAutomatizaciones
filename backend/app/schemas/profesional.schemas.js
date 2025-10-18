const Joi = require('joi');
const { commonSchemas } = require('../middleware/validation');
const { TIPOS_PROFESIONAL, FORMAS_PAGO, LIMITES } = require('../constants/profesionales.constants');

// POST /profesionales
const crear = {
    body: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin lo envía
        nombre_completo: Joi.string()
            .min(LIMITES.NOMBRE_MIN)
            .max(LIMITES.NOMBRE_MAX)
            .required()
            .trim(),
        email: Joi.string()
            .email()
            .max(LIMITES.NOMBRE_MAX)
            .optional()
            .allow(null),
        telefono: commonSchemas.mexicanPhone
            .optional()
            .allow(null),
        fecha_nacimiento: Joi.date()
            .iso()
            .max('now')
            .optional()
            .allow(null),
        documento_identidad: Joi.string()
            .max(LIMITES.DOCUMENTO_MAX)
            .optional()
            .allow(null)
            .trim(),
        tipo_profesional: Joi.string()
            .valid(...TIPOS_PROFESIONAL)
            .required(),
        licencias_profesionales: Joi.object()
            .optional()
            .default({}),
        años_experiencia: Joi.number()
            .integer()
            .min(LIMITES.EXPERIENCIA_MIN)
            .max(LIMITES.EXPERIENCIA_MAX)
            .optional()
            .default(0),
        idiomas: Joi.array()
            .items(Joi.string())
            .optional()
            .default(['es']),
        color_calendario: Joi.string()
            .pattern(/^#[0-9A-Fa-f]{6}$/)
            .optional()
            .default('#3498db')
            .messages({ 'string.pattern.base': 'Color debe ser hexadecimal válido (ej: #3498db)' }),
        biografia: Joi.string()
            .optional()
            .allow(null),
        foto_url: Joi.string()
            .uri()
            .optional()
            .allow(null),
        configuracion_horarios: Joi.object()
            .optional()
            .default({}),
        configuracion_servicios: Joi.object()
            .optional()
            .default({}),
        comision_porcentaje: Joi.number()
            .min(LIMITES.COMISION_MIN)
            .max(LIMITES.COMISION_MAX)
            .optional()
            .default(0),
        salario_base: Joi.number()
            .min(0)
            .optional()
            .allow(null),
        forma_pago: Joi.string()
            .valid(...FORMAS_PAGO)
            .optional()
            .default('comision'),
        activo: Joi.boolean()
            .optional()
            .default(true),
        disponible_online: Joi.boolean()
            .optional()
            .default(true),
        fecha_ingreso: Joi.date()
            .iso()
            .optional()
            .allow(null)
    })
};

// PUT /profesionales/:id
const actualizar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        nombre_completo: Joi.string()
            .min(LIMITES.NOMBRE_MIN)
            .max(LIMITES.NOMBRE_MAX)
            .trim(),
        email: Joi.string()
            .email()
            .max(LIMITES.NOMBRE_MAX)
            .allow(null),
        telefono: commonSchemas.mexicanPhone
            .allow(null),
        fecha_nacimiento: Joi.date()
            .iso()
            .max('now')
            .allow(null),
        documento_identidad: Joi.string()
            .max(LIMITES.DOCUMENTO_MAX)
            .trim()
            .allow(null),
        tipo_profesional: Joi.string()
            .valid(...TIPOS_PROFESIONAL),
        licencias_profesionales: Joi.object(),
        años_experiencia: Joi.number()
            .integer()
            .min(LIMITES.EXPERIENCIA_MIN)
            .max(LIMITES.EXPERIENCIA_MAX),
        idiomas: Joi.array()
            .items(Joi.string()),
        color_calendario: Joi.string()
            .pattern(/^#[0-9A-Fa-f]{6}$/),
        biografia: Joi.string()
            .allow(null),
        foto_url: Joi.string()
            .uri()
            .allow(null),
        configuracion_horarios: Joi.object(),
        configuracion_servicios: Joi.object(),
        comision_porcentaje: Joi.number()
            .min(LIMITES.COMISION_MIN)
            .max(LIMITES.COMISION_MAX),
        salario_base: Joi.number()
            .min(0)
            .allow(null),
        forma_pago: Joi.string()
            .valid(...FORMAS_PAGO),
        activo: Joi.boolean(),
        disponible_online: Joi.boolean(),
        fecha_salida: Joi.date()
            .iso()
            .allow(null),
        motivo_inactividad: Joi.string()
            .max(LIMITES.MOTIVO_MAX)
            .allow(null)
    }).min(1), // Al menos un campo debe estar presente
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

// GET /profesionales
const listar = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin
        activo: Joi.string()
            .valid('true', 'false')
            .optional(),
        disponible_online: Joi.string()
            .valid('true', 'false')
            .optional(),
        tipo_profesional: Joi.string()
            .valid(...TIPOS_PROFESIONAL)
            .optional(),
        busqueda: Joi.string()
            .min(2)
            .max(100)
            .trim()
            .optional(),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(50)
            .default(20),
        offset: Joi.number()
            .integer()
            .min(0)
            .default(0)
    })
};

// GET /profesionales/:id
const obtenerPorId = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

// GET /profesionales/tipo/:tipo
const buscarPorTipo = {
    params: Joi.object({
        tipo: Joi.string()
            .valid(...TIPOS_PROFESIONAL)
            .required()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin
        activos: Joi.string()
            .valid('true', 'false')
            .default('true')
    })
};

// PATCH /profesionales/:id/estado
const cambiarEstado = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        activo: Joi.boolean()
            .required(),
        motivo_inactividad: Joi.string()
            .max(LIMITES.MOTIVO_MAX)
            .trim()
            .optional()
            .allow(null)
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

// PATCH /profesionales/:id/metricas
const actualizarMetricas = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        citas_completadas_incremento: Joi.number()
            .integer()
            .min(0)
            .optional(),
        nuevos_clientes: Joi.number()
            .integer()
            .min(0)
            .optional(),
        nueva_calificacion: Joi.number()
            .min(LIMITES.CALIFICACION_MIN)
            .max(LIMITES.CALIFICACION_MAX)
            .optional()
    }).min(1), // Al menos un campo debe estar presente
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

// DELETE /profesionales/:id
const eliminar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        motivo: Joi.string()
            .max(LIMITES.MOTIVO_MAX)
            .trim()
            .optional()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

// GET /profesionales/estadisticas
const obtenerEstadisticas = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

// POST /profesionales/validar-email
const validarEmail = {
    body: Joi.object({
        email: Joi.string()
            .email()
            .required(),
        excluir_id: commonSchemas.id.optional()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

module.exports = {
    crear,
    actualizar,
    listar,
    obtenerPorId,
    buscarPorTipo,
    cambiarEstado,
    actualizarMetricas,
    eliminar,
    obtenerEstadisticas,
    validarEmail
};
