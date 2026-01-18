/**
 * Custom Error Types para Nexo
 * Elimina detección de errores basada en string.includes()
 *
 * @module utils/errors
 *
 * @example
 * const { BusinessError, PlanLimitExceededError } = require('../../utils/errors');
 *
 * // Lanzar error de límite de plan
 * throw new PlanLimitExceededError('profesionales', 5, 5, 'Básico');
 *
 * // Lanzar error de duplicado
 * throw new DuplicateResourceError('Proveedor', 'RFC', 'XAXX010101000');
 */

/**
 * Error base de negocio
 * Todos los errores custom heredan de esta clase
 */
class BusinessError extends Error {
  /**
   * @param {string} message - Mensaje descriptivo del error
   * @param {string} code - Código único del error (ej: 'PLAN_LIMIT_EXCEEDED')
   * @param {number} [statusCode=400] - Código HTTP
   * @param {Object} [details=null] - Detalles adicionales para el cliente
   */
  constructor(message, code, statusCode = 400, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serializa el error para respuesta JSON
   */
  toJSON() {
    return {
      error: this.name,
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details })
    };
  }
}

/**
 * Error cuando se excede el límite del plan
 * @statusCode 403
 */
class PlanLimitExceededError extends BusinessError {
  /**
   * @param {string} recurso - Tipo de recurso (ej: 'profesionales', 'productos')
   * @param {number} limite - Límite del plan
   * @param {number} usoActual - Uso actual
   * @param {string} nombrePlan - Nombre del plan (ej: 'Básico', 'Pro')
   */
  constructor(recurso, limite, usoActual, nombrePlan) {
    super(
      `Has alcanzado el límite de ${recurso} para tu plan ${nombrePlan} (${usoActual}/${limite})`,
      'PLAN_LIMIT_EXCEEDED',
      403,
      {
        recurso,
        limite,
        uso_actual: usoActual,
        plan: nombrePlan
      }
    );
  }
}

/**
 * Error cuando un recurso ya existe (duplicado)
 * @statusCode 409
 */
class DuplicateResourceError extends BusinessError {
  /**
   * @param {string} recurso - Tipo de recurso (ej: 'Proveedor', 'Cliente')
   * @param {string} campo - Campo duplicado (ej: 'RFC', 'email')
   * @param {string} [valor] - Valor duplicado (opcional, para mensajes más descriptivos)
   */
  constructor(recurso, campo, valor = null) {
    const message = valor
      ? `Ya existe un ${recurso.toLowerCase()} con ${campo} "${valor}"`
      : `Ya existe un ${recurso.toLowerCase()} con ese ${campo}`;

    super(message, 'DUPLICATE_RESOURCE', 409, {
      recurso,
      campo,
      ...(valor && { valor })
    });
  }
}

/**
 * Error cuando profesionales referenciados no son válidos
 * @statusCode 400
 */
class InvalidProfessionalsError extends BusinessError {
  /**
   * @param {number[]} invalidIds - IDs de profesionales no encontrados/inactivos
   */
  constructor(invalidIds) {
    super(
      `Los siguientes profesionales no existen o están inactivos: ${invalidIds.join(', ')}`,
      'INVALID_PROFESSIONALS',
      400,
      { ids_invalidos: invalidIds }
    );
  }
}

/**
 * Error cuando un recurso no se encuentra
 * @statusCode 404
 */
class ResourceNotFoundError extends BusinessError {
  /**
   * @param {string} recurso - Tipo de recurso (ej: 'Cliente', 'Producto')
   * @param {string|number} [identificador] - ID o identificador del recurso
   */
  constructor(recurso, identificador = null) {
    const message = identificador
      ? `${recurso} con ID ${identificador} no encontrado`
      : `${recurso} no encontrado`;

    super(message, 'RESOURCE_NOT_FOUND', 404, {
      recurso,
      ...(identificador && { identificador })
    });
  }
}

/**
 * Error cuando no hay suficiente stock
 * @statusCode 409
 */
class InsufficientStockError extends BusinessError {
  /**
   * @param {string} producto - Nombre o SKU del producto
   * @param {number} solicitado - Cantidad solicitada
   * @param {number} disponible - Cantidad disponible
   * @param {string} [ubicacion] - Ubicación del inventario
   */
  constructor(producto, solicitado, disponible, ubicacion = null) {
    super(
      `Stock insuficiente para "${producto}". Solicitado: ${solicitado}, Disponible: ${disponible}`,
      'INSUFFICIENT_STOCK',
      409,
      {
        producto,
        cantidad_solicitada: solicitado,
        cantidad_disponible: disponible,
        ...(ubicacion && { ubicacion })
      }
    );
  }
}

/**
 * Error de validación de negocio (diferente de validación Joi)
 * @statusCode 400
 */
class ValidationError extends BusinessError {
  /**
   * @param {string} message - Mensaje de validación
   * @param {Object} [errores] - Objeto con errores por campo
   */
  constructor(message, errores = null) {
    super(message, 'VALIDATION_ERROR', 400, errores ? { errores } : null);
  }
}

/**
 * Error de transición de estado inválida (máquina de estados)
 * @statusCode 400
 */
class InvalidStateTransitionError extends BusinessError {
  /**
   * @param {string} recurso - Tipo de recurso (ej: 'Cita', 'Orden')
   * @param {string} estadoActual - Estado actual
   * @param {string} estadoDeseado - Estado al que se intenta transicionar
   * @param {string[]} [estadosPermitidos] - Estados a los que sí se puede transicionar
   */
  constructor(recurso, estadoActual, estadoDeseado, estadosPermitidos = null) {
    const message = `No se puede pasar ${recurso.toLowerCase()} de "${estadoActual}" a "${estadoDeseado}"`;

    super(message, 'INVALID_STATE_TRANSITION', 400, {
      recurso,
      estado_actual: estadoActual,
      estado_deseado: estadoDeseado,
      ...(estadosPermitidos && { estados_permitidos: estadosPermitidos })
    });
  }
}

/**
 * Error de conflicto de horario (solapamiento)
 * @statusCode 409
 */
class ScheduleConflictError extends BusinessError {
  /**
   * @param {string} mensaje - Descripción del conflicto
   * @param {Object} [conflicto] - Detalles del conflicto (horarios, profesionales, etc.)
   */
  constructor(mensaje, conflicto = null) {
    super(mensaje, 'SCHEDULE_CONFLICT', 409, conflicto ? { conflicto } : null);
  }
}

/**
 * Error de autenticación
 * @statusCode 401
 */
class AuthenticationError extends BusinessError {
  /**
   * @param {string} [message='Credenciales inválidas']
   */
  constructor(message = 'Credenciales inválidas') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

/**
 * Error de autorización/permisos
 * @statusCode 403
 */
class AuthorizationError extends BusinessError {
  /**
   * @param {string} [message='No tienes permisos para realizar esta acción']
   * @param {string} [permiso] - Permiso requerido
   */
  constructor(message = 'No tienes permisos para realizar esta acción', permiso = null) {
    super(message, 'AUTHORIZATION_ERROR', 403, permiso ? { permiso_requerido: permiso } : null);
  }
}

/**
 * Error cuando un recurso está en uso y no puede eliminarse
 * @statusCode 409
 */
class ResourceInUseError extends BusinessError {
  /**
   * @param {string} recurso - Tipo de recurso
   * @param {string} usadoPor - Qué lo está usando
   * @param {number} [cantidad] - Cantidad de dependencias
   */
  constructor(recurso, usadoPor, cantidad = null) {
    const message = cantidad
      ? `No se puede eliminar ${recurso.toLowerCase()}. Tiene ${cantidad} ${usadoPor} asociados`
      : `No se puede eliminar ${recurso.toLowerCase()}. Está siendo usado por ${usadoPor}`;

    super(message, 'RESOURCE_IN_USE', 409, {
      recurso,
      usado_por: usadoPor,
      ...(cantidad && { cantidad })
    });
  }
}

/**
 * Error de operación no permitida en recurso del sistema
 * @statusCode 403
 */
class SystemResourceError extends BusinessError {
  /**
   * @param {string} operacion - Operación intentada (ej: 'modificar', 'eliminar')
   * @param {string} recurso - Tipo de recurso del sistema
   */
  constructor(operacion, recurso) {
    super(
      `No se puede ${operacion} ${recurso.toLowerCase()} del sistema`,
      'SYSTEM_RESOURCE_PROTECTED',
      403,
      { operacion, recurso }
    );
  }
}

/**
 * Error de cuenta bloqueada
 * @statusCode 423
 */
class AccountLockedError extends BusinessError {
  /**
   * @param {string} [razon] - Razón del bloqueo
   * @param {Date} [hastaCuando] - Hasta cuándo está bloqueada
   */
  constructor(razon = null, hastaCuando = null) {
    super(
      razon || 'Tu cuenta está temporalmente bloqueada',
      'ACCOUNT_LOCKED',
      423,
      {
        ...(razon && { razon }),
        ...(hastaCuando && { bloqueado_hasta: hastaCuando })
      }
    );
  }
}

/**
 * Error de token inválido o expirado
 * @statusCode 401
 */
class TokenError extends BusinessError {
  /**
   * @param {string} tipo - Tipo de token (ej: 'acceso', 'refresco', 'recuperación')
   * @param {string} [razon='inválido'] - Razón (inválido, expirado, revocado)
   */
  constructor(tipo, razon = 'inválido') {
    super(
      `Token de ${tipo} ${razon}`,
      'TOKEN_ERROR',
      401,
      { tipo_token: tipo, razon }
    );
  }
}

/**
 * Error de contraseña
 * @statusCode 400
 */
class PasswordError extends BusinessError {
  /**
   * @param {string} message - Mensaje específico del error
   * @param {string} [tipo='validation'] - Tipo: 'validation', 'mismatch', 'weak'
   */
  constructor(message, tipo = 'validation') {
    super(message, 'PASSWORD_ERROR', 400, { tipo });
  }
}

module.exports = {
  BusinessError,
  PlanLimitExceededError,
  DuplicateResourceError,
  InvalidProfessionalsError,
  ResourceNotFoundError,
  InsufficientStockError,
  ValidationError,
  InvalidStateTransitionError,
  ScheduleConflictError,
  AuthenticationError,
  AuthorizationError,
  ResourceInUseError,
  SystemResourceError,
  AccountLockedError,
  TokenError,
  PasswordError
};
