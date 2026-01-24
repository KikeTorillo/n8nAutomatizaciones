/**
 * @fileoverview Middleware de Validación Enterprise con Joi
 *
 * Sistema completo de validación de datos de entrada para APIs REST.
 * Utiliza esquemas Joi para validar y sanitizar todos los datos del request
 * incluyendo body, parámetros de URL, query strings y headers específicos.
 *
 * Características principales:
 * - Validación comprehensiva con esquemas Joi predefinidos
 * - Sanitización automática contra inyecciones SQL
 * - Schemas reutilizables para casos comunes (fechas, teléfonos, etc.)
 * - Validación de archivos subidos con restricciones de tipo y tamaño
 * - Manejo de errores estructurado con detalles específicos
 * - Transformación automática de datos (lowercase emails, etc.)
 *
 * @author Backend Team
 * @version 1.0.0
 * @since 2025-09-17
 */

const Joi = require('joi');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');
const { passwordSchemas } = require('../schemas/shared');

/**
 * Factory para crear middleware de validación Joi comprehensivo
 *
 * Crea un middleware Express que valida múltiples partes del request usando
 * esquemas Joi. Soporta validación simultánea de body, parámetros, query y headers.
 *
 * @param {Object} schemas - Objeto con esquemas Joi para diferentes partes del request
 * @param {Joi.Schema} [schemas.body] - Esquema para req.body
 * @param {Joi.Schema} [schemas.params] - Esquema para req.params
 * @param {Joi.Schema} [schemas.query] - Esquema para req.query
 * @param {Joi.Schema} [schemas.headers] - Esquema para req.headers específicos
 * @param {Object} [options={}] - Opciones de validación Joi
 * @param {boolean} [options.abortEarly=false] - Si debe parar en el primer error
 * @param {boolean} [options.allowUnknown=false] - Si permite campos no definidos
 * @param {boolean} [options.stripUnknown=true] - Si remueve campos no definidos
 * @returns {Function} Middleware Express de validación
 *
 * @example
 * // Validación completa de creación de cita
 * const citaValidation = validate({
 *   body: Joi.object({
 *     cliente_id: commonSchemas.id,
 *     servicio_id: commonSchemas.id,
 *     fecha: commonSchemas.futureDateRequired,
 *     hora: commonSchemas.time
 *   }),
 *   params: Joi.object({
 *     organizacion_id: commonSchemas.id
 *   }),
 *   query: Joi.object({
 *     notify: Joi.boolean().default(true)
 *   })
 * });
 * router.post('/organizaciones/:organizacion_id/citas', citaValidation, controller);
 */
const validate = (schemas, options = {}) => {
  const defaultOptions = {
    abortEarly: false,     // Mostrar todos los errores, no solo el primero
    allowUnknown: false,   // No permitir campos no definidos en el schema
    stripUnknown: true,    // Remover campos no definidos del resultado
    ...options
  };

  return (req, res, next) => {
    const errors = {};

    // Contexto para validaciones condicionales (ej: validar según rol de usuario)
    const context = {
      userRole: req.user?.rol_codigo,
      userId: req.user?.id,
      organizacionId: req.user?.organizacion_id
    };

    const validationOptions = {
      ...defaultOptions,
      context
    };

    // Validar body
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, validationOptions);
      if (error) {
        errors.body = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
      } else {
        req.body = value;
      }
    }

    // Validar params
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, validationOptions);
      if (error) {
        errors.params = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
      } else {
        req.params = value;
      }
    }

    // Validar query
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, validationOptions);
      if (error) {
        errors.query = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
      } else {
        req.query = value;
      }
    }

    // Validar headers específicos
    if (schemas.headers) {
      const { error, value } = schemas.headers.validate(req.headers, validationOptions);
      if (error) {
        errors.headers = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
      } else {
        req.headers = { ...req.headers, ...value };
      }
    }

    // Si hay errores, devolver respuesta de error
    if (Object.keys(errors).length > 0) {
      logger.warn('Errores de validación en request', {
        errors,
        path: req.path,
        method: req.method,
        userId: req.user?.id
      });

      return ResponseHelper.validationError(res, errors);
    }

    next();
  };
};

/**
 * Middleware específico para validar solo el body
 * @param {Joi.Schema} schema - Schema de validación para el body
 * @param {Object} options - Opciones de validación
 */
const validateBody = (schema, options = {}) => {
  return validate({ body: schema }, options);
};

/**
 * Middleware específico para validar solo los params
 * @param {Joi.Schema} schema - Schema de validación para los params
 * @param {Object} options - Opciones de validación
 */
const validateParams = (schema, options = {}) => {
  return validate({ params: schema }, options);
};

/**
 * Middleware específico para validar solo la query
 * @param {Joi.Schema} schema - Schema de validación para la query
 * @param {Object} options - Opciones de validación
 */
const validateQuery = (schema, options = {}) => {
  return validate({ query: schema }, options);
};

/**
 * Schemas base comunes para reutilizar
 */
const commonSchemas = {
  // ID numérico positivo
  id: Joi.number().integer().positive().required(),

  // Paginación
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string().default('id')
  }),

  // Fechas
  date: Joi.date().iso(),
  dateRequired: Joi.date().iso().required(),
  futureDate: Joi.date().iso().min('now'),
  futureDateRequired: Joi.date().iso().min('now').required(),

  // Teléfonos mexicanos (10 dígitos exactos)
  mexicanPhone: Joi.string().pattern(/^[1-9]\d{9}$/).messages({
    'string.pattern.base': 'Debe ser un teléfono válido de 10 dígitos (ej: 5512345678)'
  }),

  // Email
  email: Joi.string().email().lowercase(),
  emailRequired: Joi.string().email().lowercase().required(),

  // Contraseñas (Ene 2026: usar schemas compartidos de passwords.schema.js)
  // Requisitos obligatorios: mayúscula, minúscula, número
  // Caracteres especiales: OPCIONALES (mejoran score pero no son requeridos)
  password: passwordSchemas.strong,
  passwordRequired: passwordSchemas.strongRequired,

  // Texto básico
  text: Joi.string().trim(),
  textRequired: Joi.string().trim().required(),
  name: Joi.string().trim().min(2).max(100),
  nameRequired: Joi.string().trim().min(2).max(100).required(),

  // Números
  positiveNumber: Joi.number().positive(),
  positiveInteger: Joi.number().integer().positive(),
  price: Joi.number().min(0).precision(2),

  // Estados
  status: Joi.string().valid('activo', 'inactivo'),
  citaStatus: Joi.string().valid('pendiente', 'confirmada', 'completada', 'cancelada', 'no_show'),

  // Horarios (formato HH:MM o HH:MM:SS)
  time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).messages({
    'string.pattern.base': 'Debe ser un horario válido (HH:MM o HH:MM:SS)'
  }),

  // Duración en minutos
  duration: Joi.number().integer().min(15).max(480), // 15 minutos a 8 horas

  // Códigos
  code: Joi.string().uppercase().alphanum(),
  verificationCode: Joi.string().pattern(/^\d{6}$/),

  // UUID
  uuid: Joi.string().uuid(),

  // URLs
  url: Joi.string().uri(),

  // Colores hexadecimales
  hexColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),

  // Roles del sistema
  userRole: Joi.string().valid('super_admin', 'admin', 'propietario', 'empleado', 'cliente'),

  // Planes de suscripción (Ene 2026: planes dinámicos en BD, solo trial/pro por defecto)
  plan: Joi.string().valid('trial', 'pro'),

  // Tipos de industria válidos para organizaciones
  tipoIndustria: Joi.string().valid(
    'barberia', 'salon_belleza', 'estetica', 'spa', 'podologia',
    'consultorio_medico', 'academia', 'taller_tecnico',
    'centro_fitness', 'veterinaria', 'otro'
  )
};

/**
 * Middleware específico para validar ID de organización en params
 * Reutilizable para todos los endpoints que requieren :id
 */
const validateOrganizacionId = validateParams(
  Joi.object({
    id: commonSchemas.id
  })
);

/**
 * Middleware para validar archivos subidos
 * @param {Object} options - Opciones de validación de archivos
 */
const validateFile = (options = {}) => {
  const defaultOptions = {
    required: false,
    maxSize: 5 * 1024 * 1024, // 5MB por defecto
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    fieldName: 'file'
  };

  const config = { ...defaultOptions, ...options };

  return (req, res, next) => {
    const file = req.files?.[config.fieldName];

    if (!file && config.required) {
      return ResponseHelper.validationError(res, {
        file: [{
          field: config.fieldName,
          message: 'Archivo requerido'
        }]
      });
    }

    if (file) {
      // Validar tamaño
      if (file.size > config.maxSize) {
        return ResponseHelper.validationError(res, {
          file: [{
            field: config.fieldName,
            message: `El archivo es demasiado grande. Máximo ${config.maxSize / 1024 / 1024}MB`
          }]
        });
      }

      // Validar tipo
      if (!config.allowedTypes.includes(file.mimetype)) {
        return ResponseHelper.validationError(res, {
          file: [{
            field: config.fieldName,
            message: `Tipo de archivo no permitido. Tipos permitidos: ${config.allowedTypes.join(', ')}`
          }]
        });
      }
    }

    next();
  };
};

/**
 * Middleware para procesar validaciones de express-validator
 * Compatible con validaciones de rutas existentes
 */
const { validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Errores de validación', 400, {
            errors: errors.array()
        });
    }
    next();
};

module.exports = {
  validate,
  validateBody,
  validateParams,
  validateQuery,
  validateFile,
  handleValidation,
  commonSchemas,
  validateOrganizacionId
};