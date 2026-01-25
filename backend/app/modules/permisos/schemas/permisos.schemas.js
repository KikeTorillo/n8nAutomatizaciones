/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - PERMISOS
 * ====================================================================
 *
 * Schemas Joi para validación de endpoints del sistema de permisos.
 *
 * @version 1.1.0
 * @date Enero 2026
 * ====================================================================
 */

const Joi = require('joi');
const { idRequired, idOptional } = require('../../../schemas/shared');

// ========================================
// CONSTANTES DE VALIDACIÓN
// ========================================

const ROLES_VALIDOS = ['admin', 'empleado', 'bot', 'recepcionista', 'cliente'];

// Patrón para código de permiso: letras minúsculas, números, guión bajo y punto
// Ejemplos válidos: pos.ventas.crear, inventario.productos.ver
const CODIGO_PERMISO_PATTERN = /^[a-z][a-z0-9_\.]*$/;

// ========================================
// SCHEMAS DE QUERY PARAMS
// ========================================

/**
 * Query para listar catálogo de permisos
 * GET /api/v1/permisos/catalogo
 */
const catalogoQuerySchema = Joi.object({
  modulo: Joi.string().max(50).optional(),
  categoria: Joi.string().max(50).optional()
});

/**
 * Query con sucursal opcional
 * Usado en: mis-permisos, resumen, verificar/:codigo, valor/:codigo
 */
const sucursalQuerySchema = Joi.object({
  sucursalId: idOptional
});

// ========================================
// SCHEMAS DE URL PARAMS
// ========================================

/**
 * Params para código de permiso
 * GET /api/v1/permisos/verificar/:codigo
 * GET /api/v1/permisos/valor/:codigo
 */
const codigoParamsSchema = Joi.object({
  codigo: Joi.string()
    .pattern(CODIGO_PERMISO_PATTERN)
    .max(100)
    .required()
    .messages({
      'string.pattern.base': 'El código del permiso debe contener solo letras minúsculas, números, guiones bajos y puntos',
      'string.max': 'El código del permiso no puede exceder 100 caracteres',
      'any.required': 'El código del permiso es requerido'
    })
});

/**
 * Params para rol
 * GET /api/v1/permisos/roles/:rol
 * PUT /api/v1/permisos/roles/:rol
 * POST /api/v1/permisos/roles/:rol/permisos
 */
const rolParamsSchema = Joi.object({
  rol: Joi.string()
    .valid(...ROLES_VALIDOS)
    .required()
    .messages({
      'any.only': `Rol no válido. Roles permitidos: ${ROLES_VALIDOS.join(', ')}`,
      'any.required': 'El rol es requerido'
    })
});

/**
 * Params para módulo
 * GET /api/v1/permisos/modulos/:modulo
 */
const moduloParamsSchema = Joi.object({
  modulo: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.max': 'El nombre del módulo no puede exceder 50 caracteres',
      'any.required': 'El módulo es requerido'
    })
});

/**
 * Params para rol + permisoId
 * DELETE /api/v1/permisos/roles/:rol/permisos/:permisoId
 */
const rolPermisoParamsSchema = Joi.object({
  rol: Joi.string()
    .valid(...ROLES_VALIDOS)
    .required()
    .messages({
      'any.only': `Rol no válido. Roles permitidos: ${ROLES_VALIDOS.join(', ')}`,
      'any.required': 'El rol es requerido'
    }),
  permisoId: idRequired.messages({
    'number.base': 'El ID del permiso debe ser un número',
    'number.positive': 'El ID del permiso debe ser positivo',
    'any.required': 'El ID del permiso es requerido'
  })
});

/**
 * Params para usuario + sucursal
 * GET/POST /api/v1/permisos/usuarios/:usuarioId/sucursales/:sucursalId
 */
const usuarioSucursalParamsSchema = Joi.object({
  usuarioId: idRequired.messages({
    'number.base': 'El ID del usuario debe ser un número',
    'number.positive': 'El ID del usuario debe ser positivo',
    'any.required': 'El ID del usuario es requerido'
  }),
  sucursalId: idRequired.messages({
    'number.base': 'El ID de la sucursal debe ser un número',
    'number.positive': 'El ID de la sucursal debe ser positivo',
    'any.required': 'El ID de la sucursal es requerido'
  })
});

/**
 * Params para usuario + sucursal + permisoId
 * DELETE /api/v1/permisos/usuarios/:usuarioId/sucursales/:sucursalId/permisos/:permisoId
 */
const usuarioSucursalPermisoParamsSchema = Joi.object({
  usuarioId: idRequired.messages({
    'number.base': 'El ID del usuario debe ser un número',
    'number.positive': 'El ID del usuario debe ser positivo',
    'any.required': 'El ID del usuario es requerido'
  }),
  sucursalId: idRequired.messages({
    'number.base': 'El ID de la sucursal debe ser un número',
    'number.positive': 'El ID de la sucursal debe ser positivo',
    'any.required': 'El ID de la sucursal es requerido'
  }),
  permisoId: idRequired.messages({
    'number.base': 'El ID del permiso debe ser un número',
    'number.positive': 'El ID del permiso debe ser positivo',
    'any.required': 'El ID del permiso es requerido'
  })
});

// ========================================
// SCHEMAS COMBINADOS PARA RUTAS
// ========================================

/**
 * Schema para GET /catalogo
 */
const listarCatalogoSchema = {
  query: catalogoQuerySchema
};

/**
 * Schema para GET /modulos (listar módulos)
 * No acepta parámetros para evitar inyección
 */
const listarModulosSchema = {
  query: Joi.object({}).unknown(false)
};

/**
 * Schema para GET /mis-permisos
 */
const misPermisosSchema = {
  query: sucursalQuerySchema
};

/**
 * Schema para GET /resumen
 */
const resumenSchema = {
  query: sucursalQuerySchema
};

/**
 * Schema para GET /verificar/:codigo
 */
const verificarPermisoSchema = {
  params: codigoParamsSchema,
  query: sucursalQuerySchema
};

/**
 * Schema para GET /valor/:codigo
 */
const valorPermisoSchema = {
  params: codigoParamsSchema,
  query: sucursalQuerySchema
};

/**
 * Schema para GET /modulos/:modulo
 */
const permisosModuloSchema = {
  params: moduloParamsSchema,
  query: sucursalQuerySchema
};

/**
 * Schema para GET /roles/:rol
 */
const listarPermisosPorRolSchema = {
  params: rolParamsSchema
};

/**
 * Schema para DELETE /roles/:rol/permisos/:permisoId
 */
const eliminarPermisoRolSchema = {
  params: rolPermisoParamsSchema
};

/**
 * Schema para GET /usuarios/:usuarioId/sucursales/:sucursalId
 */
const listarPermisosUsuarioSucursalSchema = {
  params: usuarioSucursalParamsSchema
};

/**
 * Schema para DELETE /usuarios/:usuarioId/sucursales/:sucursalId/permisos/:permisoId
 */
const eliminarPermisoUsuarioSucursalSchema = {
  params: usuarioSucursalPermisoParamsSchema
};

// ========================================
// SCHEMAS DE BODY (existentes refactorizados)
// ========================================

/**
 * Schema para asignar un permiso a un rol
 * POST /api/v1/permisos/roles/:rol/permisos
 */
const asignarPermisoRolSchema = {
    body: Joi.object({
        permisoId: idRequired.messages({
            'number.base': 'El ID del permiso debe ser un número',
            'number.positive': 'El ID del permiso debe ser positivo',
            'any.required': 'El ID del permiso es requerido'
        }),
        valor: Joi.alternatives().try(
            Joi.boolean(),
            Joi.number(),
            Joi.string(),
            Joi.array()
        ).required()
            .messages({
                'any.required': 'El valor del permiso es requerido'
            })
    }),
    params: rolParamsSchema
};

/**
 * Schema para actualizar múltiples permisos de un rol
 * PUT /api/v1/permisos/roles/:rol
 */
const actualizarPermisosRolSchema = {
    body: Joi.object({
        permisos: Joi.array().items(
            Joi.object({
                permisoId: idRequired,
                valor: Joi.alternatives().try(
                    Joi.boolean(),
                    Joi.number(),
                    Joi.string(),
                    Joi.array()
                ).required()
            })
        ).min(1).required()
            .messages({
                'array.min': 'Debe incluir al menos un permiso',
                'any.required': 'El array de permisos es requerido'
            })
    }),
    params: rolParamsSchema
};

/**
 * Schema para asignar override de permiso a usuario/sucursal
 * POST /api/v1/permisos/usuarios/:usuarioId/sucursales/:sucursalId
 */
const asignarPermisoUsuarioSucursalSchema = {
    body: Joi.object({
        permisoId: idRequired.messages({
            'number.base': 'El ID del permiso debe ser un número',
            'number.positive': 'El ID del permiso debe ser positivo',
            'any.required': 'El ID del permiso es requerido'
        }),
        valor: Joi.alternatives().try(
            Joi.boolean(),
            Joi.number(),
            Joi.string(),
            Joi.array()
        ).required()
            .messages({
                'any.required': 'El valor del permiso es requerido'
            }),
        motivo: Joi.string().max(500).allow(null, '')
            .messages({
                'string.max': 'El motivo no puede exceder 500 caracteres'
            }),
        fechaInicio: Joi.date().iso().allow(null)
            .messages({
                'date.format': 'La fecha de inicio debe estar en formato ISO'
            }),
        fechaFin: Joi.date().iso().min(Joi.ref('fechaInicio')).allow(null)
            .messages({
                'date.format': 'La fecha de fin debe estar en formato ISO',
                'date.min': 'La fecha de fin debe ser posterior a la fecha de inicio'
            })
    }),
    params: usuarioSucursalParamsSchema
};

module.exports = {
    // Schemas combinados para rutas (nuevos Ene 2026)
    listarCatalogoSchema,
    listarModulosSchema,
    misPermisosSchema,
    resumenSchema,
    verificarPermisoSchema,
    valorPermisoSchema,
    permisosModuloSchema,
    listarPermisosPorRolSchema,
    eliminarPermisoRolSchema,
    listarPermisosUsuarioSucursalSchema,
    eliminarPermisoUsuarioSucursalSchema,

    // Schemas con body (existentes)
    asignarPermisoRolSchema,
    actualizarPermisosRolSchema,
    asignarPermisoUsuarioSucursalSchema,

    // Re-exportar schemas individuales para uso directo
    catalogoQuerySchema,
    sucursalQuerySchema,
    codigoParamsSchema,
    rolParamsSchema,
    moduloParamsSchema,
    rolPermisoParamsSchema,
    usuarioSucursalParamsSchema,
    usuarioSucursalPermisoParamsSchema
};
