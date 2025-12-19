const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');
const {
    FORMAS_PAGO,
    TIPOS_EMPLEADO,
    ESTADOS_LABORALES,
    TIPOS_CONTRATACION,
    GENEROS,
    ESTADOS_CIVILES,
    LIMITES
} = require('../constants/profesionales.constants');

// POST /profesionales
const crear = {
    body: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin lo envía

        // === IDENTIFICACIÓN ===
        codigo: Joi.string()
            .max(LIMITES.CODIGO_MAX)
            .optional()
            .allow(null)
            .trim(),
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
        foto_url: Joi.string()
            .uri()
            .optional()
            .allow(null),

        // === INFORMACIÓN PERSONAL ===
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
        genero: Joi.string()
            .valid(...GENEROS)
            .optional()
            .default('no_especificado'),
        direccion: Joi.string()
            .max(LIMITES.DIRECCION_MAX)
            .optional()
            .allow(null),
        estado_civil: Joi.string()
            .valid(...ESTADOS_CIVILES)
            .optional()
            .allow(null),
        contacto_emergencia_nombre: Joi.string()
            .max(100)
            .optional()
            .allow(null),
        contacto_emergencia_telefono: commonSchemas.mexicanPhone
            .optional()
            .allow(null),

        // === CLASIFICACIÓN ORGANIZACIONAL ===
        tipo: Joi.string()
            .valid(...TIPOS_EMPLEADO)
            .optional()
            .default('operativo'),
        estado: Joi.string()
            .valid(...ESTADOS_LABORALES)
            .optional()
            .default('activo'),
        tipo_contratacion: Joi.string()
            .valid(...TIPOS_CONTRATACION)
            .optional()
            .default('tiempo_completo'),

        // === JERARQUÍA ===
        supervisor_id: commonSchemas.id.optional().allow(null),
        departamento_id: commonSchemas.id.optional().allow(null),
        puesto_id: commonSchemas.id.optional().allow(null),

        // === FECHAS LABORALES ===
        fecha_ingreso: Joi.date()
            .iso()
            .optional()
            .allow(null),
        fecha_baja: Joi.date()
            .iso()
            .optional()
            .allow(null),
        motivo_baja: Joi.string()
            .max(LIMITES.MOTIVO_MAX)
            .optional()
            .allow(null),

        // === INFORMACIÓN PROFESIONAL (LEGACY) ===
        tipo_profesional_id: Joi.number()
            .integer()
            .positive()
            .optional()
            .allow(null),
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

        // === CONFIGURACIÓN DE AGENDAMIENTO ===
        disponible_online: Joi.boolean()
            .optional()
            .default(false),
        color_calendario: Joi.string()
            .pattern(/^#[0-9A-Fa-f]{6}$/)
            .optional()
            .default('#753572')
            .messages({ 'string.pattern.base': 'Color debe ser hexadecimal válido (ej: #753572)' }),
        biografia: Joi.string()
            .optional()
            .allow(null),
        configuracion_horarios: Joi.object()
            .optional()
            .default({}),
        configuracion_servicios: Joi.object()
            .optional()
            .default({}),

        // === COMPENSACIÓN ===
        salario_base: Joi.number()
            .min(0)
            .optional()
            .allow(null),
        comision_porcentaje: Joi.number()
            .min(LIMITES.COMISION_MIN)
            .max(LIMITES.COMISION_MAX)
            .optional()
            .default(0),
        forma_pago: Joi.string()
            .valid(...FORMAS_PAGO)
            .optional()
            .default('comision'),

        // === CONTROL DE ACCESO ===
        modulos_acceso: Joi.object({
            agendamiento: Joi.boolean().optional(),
            pos: Joi.boolean().optional(),
            inventario: Joi.boolean().optional()
        }).optional().default({ agendamiento: true, pos: false, inventario: false }),

        // === LEGACY ===
        activo: Joi.boolean()
            .optional()
            .default(true)
    })
};

// POST /profesionales/bulk-create
const bulkCrear = {
    body: Joi.object({
        profesionales: Joi.array()
            .items(
                Joi.object({
                    nombre_completo: Joi.string()
                        .min(LIMITES.NOMBRE_MIN)
                        .max(LIMITES.NOMBRE_MAX)
                        .required()
                        .trim(),
                    email: Joi.string()
                        .email()
                        .max(LIMITES.NOMBRE_MAX)
                        .optional()
                        .allow(null, ''),
                    telefono: commonSchemas.mexicanPhone
                        .optional()
                        .allow(null, ''),
                    tipo_profesional_id: Joi.number()
                        .integer()
                        .positive()
                        .required(),
                    color_calendario: Joi.string()
                        .pattern(/^#[0-9A-Fa-f]{6}$/)
                        .optional()
                        .default('#3B82F6')
                        .messages({ 'string.pattern.base': 'Color debe ser hexadecimal válido (ej: #3B82F6)' }),
                    servicios_asignados: Joi.array()
                        .items(Joi.number().integer().positive())
                        .optional()
                        .default([]),
                    // Campos opcionales adicionales
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
                    biografia: Joi.string()
                        .optional()
                        .allow(null),
                    foto_url: Joi.string()
                        .uri()
                        .optional()
                        .allow(null)
                })
            )
            .min(1)
            .max(50)
            .required()
            .messages({
                'array.min': 'Debe proporcionar al menos 1 profesional',
                'array.max': 'No se pueden crear más de 50 profesionales a la vez'
            })
    })
};

// PUT /profesionales/:id
const actualizar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        // === IDENTIFICACIÓN ===
        codigo: Joi.string().max(LIMITES.CODIGO_MAX).trim().allow(null),
        nombre_completo: Joi.string().min(LIMITES.NOMBRE_MIN).max(LIMITES.NOMBRE_MAX).trim(),
        email: Joi.string().email().max(LIMITES.NOMBRE_MAX).allow(null),
        telefono: commonSchemas.mexicanPhone.allow(null),
        foto_url: Joi.string().uri().allow(null),

        // === INFORMACIÓN PERSONAL ===
        fecha_nacimiento: Joi.date().iso().max('now').allow(null),
        documento_identidad: Joi.string().max(LIMITES.DOCUMENTO_MAX).trim().allow(null),
        genero: Joi.string().valid(...GENEROS),
        direccion: Joi.string().max(LIMITES.DIRECCION_MAX).allow(null),
        estado_civil: Joi.string().valid(...ESTADOS_CIVILES).allow(null),
        contacto_emergencia_nombre: Joi.string().max(100).allow(null),
        contacto_emergencia_telefono: commonSchemas.mexicanPhone.allow(null),

        // === CLASIFICACIÓN ORGANIZACIONAL ===
        tipo: Joi.string().valid(...TIPOS_EMPLEADO),
        estado: Joi.string().valid(...ESTADOS_LABORALES),
        tipo_contratacion: Joi.string().valid(...TIPOS_CONTRATACION),

        // === JERARQUÍA ===
        supervisor_id: commonSchemas.id.allow(null),
        departamento_id: commonSchemas.id.allow(null),
        puesto_id: commonSchemas.id.allow(null),

        // === FECHAS LABORALES ===
        fecha_ingreso: Joi.date().iso().allow(null),
        fecha_baja: Joi.date().iso().allow(null),
        motivo_baja: Joi.string().max(LIMITES.MOTIVO_MAX).allow(null),

        // === INFORMACIÓN PROFESIONAL (LEGACY) ===
        tipo_profesional_id: Joi.number().integer().positive().allow(null),
        licencias_profesionales: Joi.object(),
        años_experiencia: Joi.number().integer().min(LIMITES.EXPERIENCIA_MIN).max(LIMITES.EXPERIENCIA_MAX),
        idiomas: Joi.array().items(Joi.string()),

        // === CONFIGURACIÓN DE AGENDAMIENTO ===
        disponible_online: Joi.boolean(),
        color_calendario: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
        biografia: Joi.string().allow(null),
        configuracion_horarios: Joi.object(),
        configuracion_servicios: Joi.object(),

        // === COMPENSACIÓN ===
        salario_base: Joi.number().min(0).allow(null),
        comision_porcentaje: Joi.number().min(LIMITES.COMISION_MIN).max(LIMITES.COMISION_MAX),
        forma_pago: Joi.string().valid(...FORMAS_PAGO),

        // === CONTROL DE ACCESO ===
        modulos_acceso: Joi.object({
            agendamiento: Joi.boolean().optional(),
            pos: Joi.boolean().optional(),
            inventario: Joi.boolean().optional()
        }),
        usuario_id: Joi.number().integer().positive().optional().allow(null),

        // === LEGACY ===
        activo: Joi.boolean(),
        fecha_salida: Joi.date().iso().allow(null),
        motivo_inactividad: Joi.string().max(LIMITES.MOTIVO_MAX).allow(null)
    }).min(1),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// GET /profesionales
const listar = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin
        activo: Joi.string().valid('true', 'false').optional(),
        disponible_online: Joi.string().valid('true', 'false').optional(),
        tipo_profesional_id: Joi.number().integer().positive().optional(),
        busqueda: Joi.string().min(2).max(100).trim().optional(),

        // Filtros de módulo (Nov 2025)
        modulo: Joi.string().valid('agendamiento', 'pos', 'inventario').optional(),
        con_usuario: Joi.string().valid('true', 'false').optional(),

        // Filtros de clasificación (Dic 2025)
        // tipo puede ser string o array para filtrar múltiples tipos (ej: supervisores)
        tipo: Joi.alternatives().try(
            Joi.string().valid(...TIPOS_EMPLEADO),
            Joi.array().items(Joi.string().valid(...TIPOS_EMPLEADO))
        ).optional(),
        estado: Joi.string().valid(...ESTADOS_LABORALES).optional(),
        tipo_contratacion: Joi.string().valid(...TIPOS_CONTRATACION).optional(),

        // Filtros de jerarquía (Dic 2025)
        departamento_id: Joi.number().integer().positive().optional(),
        puesto_id: Joi.number().integer().positive().optional(),
        supervisor_id: Joi.number().integer().positive().optional(),

        // Paginación
        limit: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
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

// GET /profesionales/tipo/:tipoId
const buscarPorTipo = {
    params: Joi.object({
        tipoId: Joi.number()
            .integer()
            .positive()
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

// ====================================================================
// SCHEMAS PARA MODELO UNIFICADO PROFESIONAL-USUARIO (Nov 2025)
// ====================================================================

// GET /profesionales/por-usuario/:usuarioId
const buscarPorUsuario = {
    params: Joi.object({
        usuarioId: Joi.number()
            .integer()
            .positive()
            .required()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// PATCH /profesionales/:id/vincular-usuario
const vincularUsuario = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        usuario_id: Joi.number()
            .integer()
            .positive()
            .allow(null) // null para desvincular
            .required()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// PATCH /profesionales/:id/modulos
const actualizarModulos = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        modulos_acceso: Joi.object({
            agendamiento: Joi.boolean().optional(),
            pos: Joi.boolean().optional(),
            inventario: Joi.boolean().optional()
        }).required()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// GET /profesionales/por-modulo/:modulo
const listarPorModulo = {
    params: Joi.object({
        modulo: Joi.string()
            .valid('agendamiento', 'pos', 'inventario')
            .required()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
        activos: Joi.string()
            .valid('true', 'false')
            .default('true')
    })
};

// ====================================================================
// SCHEMAS PARA JERARQUÍA ORGANIZACIONAL (Dic 2025)
// ====================================================================

// GET /profesionales/:id/subordinados
const obtenerSubordinados = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
        max_nivel: Joi.number().integer().min(1).max(10).optional().default(10),
        solo_directos: Joi.string().valid('true', 'false').optional()
    })
};

// GET /profesionales/:id/supervisores
const obtenerSupervisores = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// ====================================================================
// SCHEMAS PARA CATEGORÍAS DE PROFESIONAL (Dic 2025)
// ====================================================================

// GET /profesionales/:id/categorias
const obtenerCategoriasProfesional = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// POST /profesionales/:id/categorias
const asignarCategoria = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        categoria_id: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'any.required': 'El ID de la categoría es requerido',
                'number.positive': 'El ID de la categoría debe ser positivo'
            }),
        notas: Joi.string()
            .max(500)
            .optional()
            .allow(null, '')
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// DELETE /profesionales/:id/categorias/:categoriaId
const eliminarCategoria = {
    params: Joi.object({
        id: commonSchemas.id,
        categoriaId: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// PUT /profesionales/:id/categorias (sync)
const sincronizarCategorias = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        categoria_ids: Joi.array()
            .items(Joi.number().integer().positive())
            .default([])
            .messages({
                'array.base': 'categoria_ids debe ser un array de IDs'
            })
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

module.exports = {
    crear,
    bulkCrear,
    actualizar,
    listar,
    obtenerPorId,
    buscarPorTipo,
    cambiarEstado,
    actualizarMetricas,
    eliminar,
    obtenerEstadisticas,
    validarEmail,
    // Nov 2025 - Modelo Unificado
    buscarPorUsuario,
    vincularUsuario,
    actualizarModulos,
    listarPorModulo,
    // Dic 2025 - Jerarquía
    obtenerSubordinados,
    obtenerSupervisores,
    // Dic 2025 - Categorías
    obtenerCategoriasProfesional,
    asignarCategoria,
    eliminarCategoria,
    sincronizarCategorias
};
