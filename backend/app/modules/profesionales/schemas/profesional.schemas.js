const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');
const {
    FORMAS_PAGO,
    ROLES_SUPERVISORES,
    ESTADOS_LABORALES,
    TIPOS_CONTRATACION,
    GENEROS,
    ESTADOS_CIVILES,
    TIPOS_DOCUMENTO_EMPLEADO,
    TIPOS_CUENTA_BANCARIA,
    USOS_CUENTA_BANCARIA,
    MONEDAS_CUENTA,
    // Fase 4: Currículum y Habilidades
    NIVELES_EDUCACION,
    CATEGORIAS_HABILIDAD,
    NIVELES_HABILIDAD,
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

        // === INFORMACIÓN PERSONAL ADICIONAL (Fase 1 - Enero 2026) ===
        numero_pasaporte: Joi.string()
            .max(50)
            .optional()
            .allow(null)
            .trim(),
        numero_seguro_social: Joi.string()
            .max(50)
            .optional()
            .allow(null)
            .trim(),
        nacionalidad: Joi.string()
            .max(50)
            .optional()
            .allow(null)
            .trim(),
        lugar_nacimiento_ciudad: Joi.string()
            .max(100)
            .optional()
            .allow(null)
            .trim(),
        lugar_nacimiento_pais: Joi.string()
            .max(50)
            .optional()
            .allow(null)
            .trim(),
        email_privado: Joi.string()
            .email()
            .max(150)
            .optional()
            .allow(null),
        telefono_privado: commonSchemas.mexicanPhone
            .optional()
            .allow(null),
        distancia_casa_trabajo_km: Joi.number()
            .min(0)
            .max(9999.99)
            .precision(2)
            .optional()
            .allow(null),
        hijos_dependientes: Joi.number()
            .integer()
            .min(0)
            .max(50)
            .optional()
            .default(0),

        // === CLASIFICACIÓN LABORAL ===
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

        // === INFORMACIÓN PROFESIONAL ===
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

        // === COMPENSACIÓN (Info contractual - HR/Nómina) ===
        // NOTA: Las comisiones operativas se configuran en Módulo Comisiones
        // (tabla configuracion_comisiones) por servicio/producto específico.
        salario_base: Joi.number()
            .min(0)
            .optional()
            .allow(null),
        forma_pago: Joi.string()
            .valid(...FORMAS_PAGO)
            .optional()
            .default('comision'),

        // === CONTROL DE ACCESO ===
        // NOTA: modulos_acceso eliminado (Dic 2025)
        // Los permisos se gestionan via permisos_catalogo, permisos_rol, permisos_usuario_sucursal

        // === CONFIGURACIÓN DE SISTEMA (Fase 1 - Enero 2026) ===
        zona_horaria: Joi.string()
            .max(50)
            .optional()
            .default('America/Mexico_City'),
        responsable_rrhh_id: commonSchemas.id
            .optional()
            .allow(null),
        codigo_nip: Joi.string()
            .max(10)
            .pattern(/^[0-9]+$/)
            .optional()
            .allow(null)
            .messages({ 'string.pattern.base': 'El código NIP debe contener solo números' }),
        id_credencial: Joi.string()
            .max(50)
            .optional()
            .allow(null)
            .trim(),

        // === LEGACY ===
        activo: Joi.boolean()
            .optional()
            .default(true),

        // === VINCULACIÓN A USUARIO EXISTENTE (Dic 2025) ===
        usuario_id: commonSchemas.id
            .optional()
            .allow(null)
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

        // === INFORMACIÓN PERSONAL ADICIONAL (Fase 1 - Enero 2026) ===
        numero_pasaporte: Joi.string().max(50).trim().allow(null),
        numero_seguro_social: Joi.string().max(50).trim().allow(null),
        nacionalidad: Joi.string().max(50).trim().allow(null),
        lugar_nacimiento_ciudad: Joi.string().max(100).trim().allow(null),
        lugar_nacimiento_pais: Joi.string().max(50).trim().allow(null),
        email_privado: Joi.string().email().max(150).allow(null),
        telefono_privado: commonSchemas.mexicanPhone.allow(null),
        distancia_casa_trabajo_km: Joi.number().min(0).max(9999.99).precision(2).allow(null),
        hijos_dependientes: Joi.number().integer().min(0).max(50),

        // === CLASIFICACIÓN LABORAL ===
        estado: Joi.string().valid(...ESTADOS_LABORALES),
        tipo_contratacion: Joi.string().valid(...TIPOS_CONTRATACION),

        // === JERARQUÍA ===
        supervisor_id: commonSchemas.id.optional().allow(null),
        departamento_id: commonSchemas.id.optional().allow(null),
        puesto_id: commonSchemas.id.optional().allow(null),

        // === FECHAS LABORALES ===
        fecha_ingreso: Joi.date().iso().allow(null),
        fecha_baja: Joi.date().iso().allow(null),
        motivo_baja: Joi.string().max(LIMITES.MOTIVO_MAX).allow(null),

        // === INFORMACIÓN PROFESIONAL ===
        licencias_profesionales: Joi.object(),
        años_experiencia: Joi.number().integer().min(LIMITES.EXPERIENCIA_MIN).max(LIMITES.EXPERIENCIA_MAX),
        idiomas: Joi.array().items(Joi.string()),

        // === CONFIGURACIÓN DE AGENDAMIENTO ===
        disponible_online: Joi.boolean(),
        color_calendario: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
        biografia: Joi.string().allow(null),
        configuracion_horarios: Joi.object(),
        configuracion_servicios: Joi.object(),

        // === COMPENSACIÓN (Info contractual - HR/Nómina) ===
        salario_base: Joi.number().min(0).allow(null),
        forma_pago: Joi.string().valid(...FORMAS_PAGO),

        // === VINCULACIÓN CON USUARIO ===
        // NOTA: modulos_acceso eliminado (Dic 2025) - usar sistema de permisos normalizado
        usuario_id: Joi.number().integer().positive().optional().allow(null),

        // === CONFIGURACIÓN DE SISTEMA (Fase 1 - Enero 2026) ===
        zona_horaria: Joi.string().max(50),
        responsable_rrhh_id: commonSchemas.id.optional().allow(null),
        codigo_nip: Joi.string().max(10).pattern(/^[0-9]+$/).allow(null)
            .messages({ 'string.pattern.base': 'El código NIP debe contener solo números' }),
        id_credencial: Joi.string().max(50).trim().allow(null),

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
        busqueda: Joi.string().min(2).max(100).trim().optional(),

        // Filtros de módulo (Nov 2025)
        modulo: Joi.string().valid('agendamiento', 'pos', 'inventario').optional(),
        con_usuario: Joi.string().valid('true', 'false').optional(),

        // Filtros de clasificación (Dic 2025)
        // rol_usuario puede ser string o array para filtrar por rol del usuario vinculado (ej: supervisores)
        rol_usuario: Joi.alternatives().try(
            Joi.string().valid(...ROLES_SUPERVISORES, 'empleado', 'bot'),
            Joi.array().items(Joi.string().valid(...ROLES_SUPERVISORES, 'empleado', 'bot'))
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

// Schema buscarPorTipo eliminado - usar listar con filtro de categorías

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
// @deprecated Dic 2025 - Usar sistema de permisos normalizado
const actualizarModulos = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        // Schema mantenido por compatibilidad, pero endpoint devuelve 410 Gone
        _deprecated: Joi.string().optional()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// GET /profesionales/por-modulo/:modulo
// @deprecated Dic 2025 - Usar sistema de permisos normalizado
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

// ====================================================================
// SCHEMAS PARA DOCUMENTOS DE EMPLEADO (Enero 2026)
// ====================================================================

// GET /profesionales/:id/documentos
const listarDocumentos = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
        tipo: Joi.string().valid(...TIPOS_DOCUMENTO_EMPLEADO).optional(),
        verificado: Joi.string().valid('true', 'false').optional(),
        estado_vencimiento: Joi.string().valid('vigente', 'por_vencer', 'vencido', 'sin_vencimiento').optional(),
        limit: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
    })
};

// POST /profesionales/:id/documentos
const crearDocumento = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        tipo_documento: Joi.string()
            .valid(...TIPOS_DOCUMENTO_EMPLEADO)
            .required()
            .messages({
                'any.required': 'El tipo de documento es requerido',
                'any.only': 'Tipo de documento inválido'
            }),
        nombre: Joi.string()
            .min(3)
            .max(150)
            .required()
            .trim()
            .messages({
                'string.min': 'El nombre debe tener al menos 3 caracteres',
                'any.required': 'El nombre del documento es requerido'
            }),
        descripcion: Joi.string()
            .max(500)
            .optional()
            .allow(null, ''),
        numero_documento: Joi.string()
            .max(100)
            .optional()
            .allow(null, '')
            .trim(),
        fecha_emision: Joi.date()
            .iso()
            .optional()
            .allow(null),
        fecha_vencimiento: Joi.date()
            .iso()
            .optional()
            .allow(null)
            .when('fecha_emision', {
                is: Joi.exist(),
                then: Joi.date().min(Joi.ref('fecha_emision')).messages({
                    'date.min': 'La fecha de vencimiento debe ser posterior a la fecha de emisión'
                })
            })
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// GET /profesionales/:profId/documentos/:docId
const obtenerDocumento = {
    params: Joi.object({
        id: commonSchemas.id,
        docId: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// PUT /profesionales/:profId/documentos/:docId
const actualizarDocumento = {
    params: Joi.object({
        id: commonSchemas.id,
        docId: commonSchemas.id
    }),
    body: Joi.object({
        tipo_documento: Joi.string().valid(...TIPOS_DOCUMENTO_EMPLEADO),
        nombre: Joi.string().min(3).max(150).trim(),
        descripcion: Joi.string().max(500).allow(null, ''),
        numero_documento: Joi.string().max(100).allow(null, '').trim(),
        fecha_emision: Joi.date().iso().allow(null),
        fecha_vencimiento: Joi.date().iso().allow(null)
    }).min(1),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// DELETE /profesionales/:profId/documentos/:docId
const eliminarDocumento = {
    params: Joi.object({
        id: commonSchemas.id,
        docId: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// PATCH /profesionales/:profId/documentos/:docId/verificar
const verificarDocumento = {
    params: Joi.object({
        id: commonSchemas.id,
        docId: commonSchemas.id
    }),
    body: Joi.object({
        verificado: Joi.boolean()
            .required()
            .messages({
                'any.required': 'El estado de verificación es requerido'
            }),
        notas_verificacion: Joi.string()
            .max(500)
            .optional()
            .allow(null, '')
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// GET /profesionales/:profId/documentos/:docId/presigned
const obtenerUrlPresigned = {
    params: Joi.object({
        id: commonSchemas.id,
        docId: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
        expiry: Joi.number().integer().min(60).max(86400).default(3600) // 1 min - 24 hrs, default 1 hr
    })
};

// GET /documentos-empleado/proximos-vencer
const listarProximosVencer = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
        dias: Joi.number().integer().min(1).max(365).default(30),
        limit: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
    })
};

// ====================================================================
// SCHEMAS PARA CUENTAS BANCARIAS (Fase 1 - Enero 2026)
// ====================================================================

// GET /profesionales/:id/cuentas-bancarias
const listarCuentasBancarias = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
        uso: Joi.string().valid(...USOS_CUENTA_BANCARIA).optional(),
        activo: Joi.string().valid('true', 'false').optional(),
        limit: Joi.number().integer().min(1).max(50).default(20),
        offset: Joi.number().integer().min(0).default(0)
    })
};

// POST /profesionales/:id/cuentas-bancarias
const crearCuentaBancaria = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        banco: Joi.string()
            .min(2)
            .max(100)
            .required()
            .trim()
            .messages({
                'string.min': 'El nombre del banco debe tener al menos 2 caracteres',
                'any.required': 'El nombre del banco es requerido'
            }),
        numero_cuenta: Joi.string()
            .min(4)
            .max(50)
            .required()
            .trim()
            .messages({
                'any.required': 'El número de cuenta es requerido'
            }),
        clabe: Joi.string()
            .length(18)
            .pattern(/^[0-9]+$/)
            .optional()
            .allow(null, '')
            .messages({
                'string.length': 'La CLABE debe tener exactamente 18 dígitos',
                'string.pattern.base': 'La CLABE debe contener solo números'
            }),
        tipo_cuenta: Joi.string()
            .valid(...TIPOS_CUENTA_BANCARIA)
            .optional()
            .default('debito'),
        moneda: Joi.string()
            .valid(...MONEDAS_CUENTA)
            .optional()
            .default('MXN'),
        titular_nombre: Joi.string()
            .max(150)
            .optional()
            .allow(null, '')
            .trim(),
        titular_documento: Joi.string()
            .max(30)
            .optional()
            .allow(null, '')
            .trim(),
        es_principal: Joi.boolean()
            .optional()
            .default(false),
        uso: Joi.string()
            .valid(...USOS_CUENTA_BANCARIA)
            .optional()
            .default('nomina')
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// GET /profesionales/:id/cuentas-bancarias/:cuentaId
const obtenerCuentaBancaria = {
    params: Joi.object({
        id: commonSchemas.id,
        cuentaId: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// PUT /profesionales/:id/cuentas-bancarias/:cuentaId
const actualizarCuentaBancaria = {
    params: Joi.object({
        id: commonSchemas.id,
        cuentaId: commonSchemas.id
    }),
    body: Joi.object({
        banco: Joi.string().min(2).max(100).trim(),
        numero_cuenta: Joi.string().min(4).max(50).trim(),
        clabe: Joi.string().length(18).pattern(/^[0-9]+$/).allow(null, '')
            .messages({
                'string.length': 'La CLABE debe tener exactamente 18 dígitos',
                'string.pattern.base': 'La CLABE debe contener solo números'
            }),
        tipo_cuenta: Joi.string().valid(...TIPOS_CUENTA_BANCARIA),
        moneda: Joi.string().valid(...MONEDAS_CUENTA),
        titular_nombre: Joi.string().max(150).allow(null, '').trim(),
        titular_documento: Joi.string().max(30).allow(null, '').trim(),
        es_principal: Joi.boolean(),
        uso: Joi.string().valid(...USOS_CUENTA_BANCARIA)
    }).min(1),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// DELETE /profesionales/:id/cuentas-bancarias/:cuentaId
const eliminarCuentaBancaria = {
    params: Joi.object({
        id: commonSchemas.id,
        cuentaId: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// PATCH /profesionales/:id/cuentas-bancarias/:cuentaId/principal
const establecerCuentaPrincipal = {
    params: Joi.object({
        id: commonSchemas.id,
        cuentaId: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// GET /cuentas-bancarias/sin-principal
const listarSinCuentaPrincipal = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
        limit: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
    })
};

// ====================================================================
// SCHEMAS PARA EXPERIENCIA LABORAL (Fase 4 - Enero 2026)
// ====================================================================

// GET /profesionales/:id/experiencia
const listarExperiencia = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
        es_empleo_actual: Joi.string().valid('true', 'false').optional(),
        limit: Joi.number().integer().min(1).max(50).default(20),
        offset: Joi.number().integer().min(0).default(0)
    })
};

// POST /profesionales/:id/experiencia
const crearExperiencia = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        empresa: Joi.string()
            .min(2)
            .max(200)
            .required()
            .trim()
            .messages({
                'string.min': 'El nombre de la empresa debe tener al menos 2 caracteres',
                'any.required': 'El nombre de la empresa es requerido'
            }),
        puesto: Joi.string()
            .min(2)
            .max(150)
            .required()
            .trim()
            .messages({
                'string.min': 'El puesto debe tener al menos 2 caracteres',
                'any.required': 'El puesto es requerido'
            }),
        descripcion: Joi.string()
            .max(2000)
            .optional()
            .allow(null, ''),
        ubicacion: Joi.string()
            .max(200)
            .optional()
            .allow(null, '')
            .trim(),
        fecha_inicio: Joi.date()
            .iso()
            .required()
            .messages({
                'any.required': 'La fecha de inicio es requerida'
            }),
        fecha_fin: Joi.date()
            .iso()
            .optional()
            .allow(null)
            .when('es_empleo_actual', {
                is: true,
                then: Joi.forbidden().messages({
                    'any.unknown': 'No se puede especificar fecha de fin si es el empleo actual'
                })
            }),
        es_empleo_actual: Joi.boolean()
            .optional()
            .default(false),
        sector_industria: Joi.string()
            .max(100)
            .optional()
            .allow(null, '')
            .trim(),
        tamanio_empresa: Joi.string()
            .valid('startup', 'pequena', 'mediana', 'grande', 'corporativo')
            .optional()
            .allow(null),
        motivo_salida: Joi.string()
            .max(200)
            .optional()
            .allow(null, '')
            .trim(),
        contacto_referencia: Joi.string()
            .max(200)
            .optional()
            .allow(null, '')
            .trim(),
        telefono_referencia: Joi.string()
            .max(30)
            .optional()
            .allow(null, '')
            .trim()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// GET /profesionales/:id/experiencia/:expId
const obtenerExperiencia = {
    params: Joi.object({
        id: commonSchemas.id,
        expId: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// PUT /profesionales/:id/experiencia/:expId
const actualizarExperiencia = {
    params: Joi.object({
        id: commonSchemas.id,
        expId: commonSchemas.id
    }),
    body: Joi.object({
        empresa: Joi.string().min(2).max(200).trim(),
        puesto: Joi.string().min(2).max(150).trim(),
        descripcion: Joi.string().max(2000).allow(null, ''),
        ubicacion: Joi.string().max(200).allow(null, '').trim(),
        fecha_inicio: Joi.date().iso(),
        fecha_fin: Joi.date().iso().allow(null),
        es_empleo_actual: Joi.boolean(),
        sector_industria: Joi.string().max(100).allow(null, '').trim(),
        tamanio_empresa: Joi.string().valid('startup', 'pequena', 'mediana', 'grande', 'corporativo').allow(null),
        motivo_salida: Joi.string().max(200).allow(null, '').trim(),
        contacto_referencia: Joi.string().max(200).allow(null, '').trim(),
        telefono_referencia: Joi.string().max(30).allow(null, '').trim()
    }).min(1),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// DELETE /profesionales/:id/experiencia/:expId
const eliminarExperiencia = {
    params: Joi.object({
        id: commonSchemas.id,
        expId: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// PATCH /profesionales/:id/experiencia/reordenar
const reordenarExperiencia = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        orden: Joi.array()
            .items(Joi.object({
                id: commonSchemas.id,
                orden: Joi.number().integer().min(0).required()
            }))
            .min(1)
            .required()
            .messages({
                'array.min': 'Debe proporcionar al menos un elemento para reordenar',
                'any.required': 'El orden es requerido'
            })
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// ====================================================================
// SCHEMAS PARA EDUCACIÓN FORMAL (Fase 4 - Enero 2026)
// ====================================================================

// Valores válidos para el ENUM nivel_educacion
const NIVELES_EDUCACION_VALORES = Object.keys(NIVELES_EDUCACION);

// GET /profesionales/:id/educacion
const listarEducacion = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
        nivel: Joi.string().valid(...NIVELES_EDUCACION_VALORES).optional(),
        en_curso: Joi.string().valid('true', 'false').optional(),
        limit: Joi.number().integer().min(1).max(50).default(20),
        offset: Joi.number().integer().min(0).default(0)
    })
};

// POST /profesionales/:id/educacion
const crearEducacion = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        institucion: Joi.string()
            .min(2)
            .max(200)
            .required()
            .trim()
            .messages({
                'string.min': 'El nombre de la institución debe tener al menos 2 caracteres',
                'any.required': 'El nombre de la institución es requerido'
            }),
        titulo: Joi.string()
            .min(2)
            .max(200)
            .required()
            .trim()
            .messages({
                'string.min': 'El título debe tener al menos 2 caracteres',
                'any.required': 'El título es requerido'
            }),
        nivel: Joi.string()
            .valid(...NIVELES_EDUCACION_VALORES)
            .required()
            .messages({
                'any.required': 'El nivel de educación es requerido',
                'any.only': 'Nivel de educación inválido'
            }),
        campo_estudio: Joi.string()
            .max(150)
            .optional()
            .allow(null, '')
            .trim(),
        fecha_inicio: Joi.date()
            .iso()
            .required()
            .messages({
                'any.required': 'La fecha de inicio es requerida'
            }),
        fecha_fin: Joi.date()
            .iso()
            .optional()
            .allow(null)
            .when('en_curso', {
                is: true,
                then: Joi.forbidden().messages({
                    'any.unknown': 'No se puede especificar fecha de fin si está en curso'
                })
            }),
        en_curso: Joi.boolean()
            .optional()
            .default(false),
        descripcion: Joi.string()
            .max(1000)
            .optional()
            .allow(null, ''),
        promedio: Joi.string()
            .max(10)
            .optional()
            .allow(null, '')
            .trim(),
        numero_cedula: Joi.string()
            .max(50)
            .optional()
            .allow(null, '')
            .trim(),
        ubicacion: Joi.string()
            .max(200)
            .optional()
            .allow(null, '')
            .trim()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// GET /profesionales/:id/educacion/:eduId
const obtenerEducacion = {
    params: Joi.object({
        id: commonSchemas.id,
        eduId: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// PUT /profesionales/:id/educacion/:eduId
const actualizarEducacion = {
    params: Joi.object({
        id: commonSchemas.id,
        eduId: commonSchemas.id
    }),
    body: Joi.object({
        institucion: Joi.string().min(2).max(200).trim(),
        titulo: Joi.string().min(2).max(200).trim(),
        nivel: Joi.string().valid(...NIVELES_EDUCACION_VALORES),
        campo_estudio: Joi.string().max(150).allow(null, '').trim(),
        fecha_inicio: Joi.date().iso(),
        fecha_fin: Joi.date().iso().allow(null),
        en_curso: Joi.boolean(),
        descripcion: Joi.string().max(1000).allow(null, ''),
        promedio: Joi.string().max(10).allow(null, '').trim(),
        numero_cedula: Joi.string().max(50).allow(null, '').trim(),
        ubicacion: Joi.string().max(200).allow(null, '').trim()
    }).min(1),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// DELETE /profesionales/:id/educacion/:eduId
const eliminarEducacion = {
    params: Joi.object({
        id: commonSchemas.id,
        eduId: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// PATCH /profesionales/:id/educacion/reordenar
const reordenarEducacion = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        orden: Joi.array()
            .items(Joi.object({
                id: commonSchemas.id,
                orden: Joi.number().integer().min(0).required()
            }))
            .min(1)
            .required()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// ====================================================================
// SCHEMAS PARA CATÁLOGO DE HABILIDADES (Fase 4 - Enero 2026)
// ====================================================================

// Valores válidos para ENUMs
const CATEGORIAS_HABILIDAD_VALORES = Object.keys(CATEGORIAS_HABILIDAD);
const NIVELES_HABILIDAD_VALORES = Object.keys(NIVELES_HABILIDAD);

// GET /habilidades/catalogo
const listarCatalogoHabilidades = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
        categoria: Joi.string().valid(...CATEGORIAS_HABILIDAD_VALORES).optional(),
        busqueda: Joi.string().min(2).max(100).trim().optional(),
        activo: Joi.string().valid('true', 'false').optional(),
        limit: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
    })
};

// POST /habilidades/catalogo
const crearHabilidadCatalogo = {
    body: Joi.object({
        nombre: Joi.string()
            .min(2)
            .max(100)
            .required()
            .trim()
            .messages({
                'string.min': 'El nombre debe tener al menos 2 caracteres',
                'any.required': 'El nombre de la habilidad es requerido'
            }),
        categoria: Joi.string()
            .valid(...CATEGORIAS_HABILIDAD_VALORES)
            .required()
            .messages({
                'any.required': 'La categoría es requerida',
                'any.only': 'Categoría inválida'
            }),
        descripcion: Joi.string()
            .max(500)
            .optional()
            .allow(null, ''),
        icono: Joi.string()
            .max(50)
            .optional()
            .allow(null, '')
            .trim(),
        color: Joi.string()
            .max(20)
            .optional()
            .allow(null, '')
            .trim()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// GET /habilidades/catalogo/:id
const obtenerHabilidadCatalogo = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// PUT /habilidades/catalogo/:id
const actualizarHabilidadCatalogo = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        nombre: Joi.string().min(2).max(100).trim(),
        categoria: Joi.string().valid(...CATEGORIAS_HABILIDAD_VALORES),
        descripcion: Joi.string().max(500).allow(null, ''),
        icono: Joi.string().max(50).allow(null, '').trim(),
        color: Joi.string().max(20).allow(null, '').trim()
    }).min(1),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// DELETE /habilidades/catalogo/:id
const eliminarHabilidadCatalogo = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// ====================================================================
// SCHEMAS PARA HABILIDADES DE EMPLEADO (Fase 4 - Enero 2026)
// ====================================================================

// GET /profesionales/:id/habilidades
const listarHabilidadesEmpleado = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
        categoria: Joi.string().valid(...CATEGORIAS_HABILIDAD_VALORES).optional(),
        nivel: Joi.string().valid(...NIVELES_HABILIDAD_VALORES).optional(),
        verificado: Joi.string().valid('true', 'false').optional(),
        limit: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
    })
};

// POST /profesionales/:id/habilidades
const asignarHabilidad = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        habilidad_id: commonSchemas.id
            .required()
            .messages({
                'any.required': 'El ID de la habilidad es requerido'
            }),
        nivel: Joi.string()
            .valid(...NIVELES_HABILIDAD_VALORES)
            .optional()
            .default('basico'),
        anios_experiencia: Joi.number()
            .min(0)
            .max(70)
            .precision(1)
            .optional()
            .default(0),
        notas: Joi.string()
            .max(500)
            .optional()
            .allow(null, ''),
        certificaciones: Joi.string()
            .max(1000)
            .optional()
            .allow(null, '')
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// GET /profesionales/:id/habilidades/:habId
const obtenerHabilidadEmpleado = {
    params: Joi.object({
        id: commonSchemas.id,
        habId: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// PUT /profesionales/:id/habilidades/:habId
const actualizarHabilidadEmpleado = {
    params: Joi.object({
        id: commonSchemas.id,
        habId: commonSchemas.id
    }),
    body: Joi.object({
        nivel: Joi.string().valid(...NIVELES_HABILIDAD_VALORES),
        anios_experiencia: Joi.number().min(0).max(70).precision(1),
        notas: Joi.string().max(500).allow(null, ''),
        certificaciones: Joi.string().max(1000).allow(null, '')
    }).min(1),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// PATCH /profesionales/:id/habilidades/:habId/verificar
const verificarHabilidadEmpleado = {
    params: Joi.object({
        id: commonSchemas.id,
        habId: commonSchemas.id
    }),
    body: Joi.object({
        verificado: Joi.boolean()
            .required()
            .messages({
                'any.required': 'El estado de verificación es requerido'
            })
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

// DELETE /profesionales/:id/habilidades/:habId
const eliminarHabilidadEmpleado = {
    params: Joi.object({
        id: commonSchemas.id,
        habId: commonSchemas.id
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
    sincronizarCategorias,
    // Enero 2026 - Documentos de Empleado
    listarDocumentos,
    crearDocumento,
    obtenerDocumento,
    actualizarDocumento,
    eliminarDocumento,
    verificarDocumento,
    obtenerUrlPresigned,
    listarProximosVencer,
    // Fase 1 Enero 2026 - Cuentas Bancarias
    listarCuentasBancarias,
    crearCuentaBancaria,
    obtenerCuentaBancaria,
    actualizarCuentaBancaria,
    eliminarCuentaBancaria,
    establecerCuentaPrincipal,
    listarSinCuentaPrincipal,
    // Fase 4 Enero 2026 - Experiencia Laboral
    listarExperiencia,
    crearExperiencia,
    obtenerExperiencia,
    actualizarExperiencia,
    eliminarExperiencia,
    reordenarExperiencia,
    // Fase 4 Enero 2026 - Educación Formal
    listarEducacion,
    crearEducacion,
    obtenerEducacion,
    actualizarEducacion,
    eliminarEducacion,
    reordenarEducacion,
    // Fase 4 Enero 2026 - Catálogo de Habilidades
    listarCatalogoHabilidades,
    crearHabilidadCatalogo,
    obtenerHabilidadCatalogo,
    actualizarHabilidadCatalogo,
    eliminarHabilidadCatalogo,
    // Fase 4 Enero 2026 - Habilidades de Empleado
    listarHabilidadesEmpleado,
    asignarHabilidad,
    obtenerHabilidadEmpleado,
    actualizarHabilidadEmpleado,
    verificarHabilidadEmpleado,
    eliminarHabilidadEmpleado
};
