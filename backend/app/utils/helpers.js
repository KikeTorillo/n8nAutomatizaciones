/**
 * Utilidades y helpers generales
 */

const crypto = require('crypto');
const logger = require('./logger');

/**
 * Helpers para respuestas HTTP estandarizadas
 */
class ResponseHelper {
  /**
   * Respuesta exitosa
   */
  static success(res, data = null, message = 'Operación exitosa', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de recurso creado (201)
   */
  static created(res, data = null, message = 'Recurso creado exitosamente') {
    return res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de error
   */
  static error(res, message = 'Error interno del servidor', statusCode = 500, dataOrErrors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    if (dataOrErrors) {
      if (dataOrErrors.valido !== undefined || dataOrErrors.token_enviado !== undefined) {
        response.data = dataOrErrors;
      } else {
        response.errors = dataOrErrors;
      }
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Respuesta de validación
   */
  static validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de no autorizado
   */
  static unauthorized(res, message = 'No autorizado') {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de prohibido
   */
  static forbidden(res, message = 'Acceso prohibido') {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de no encontrado
   */
  static notFound(res, message = 'Recurso no encontrado') {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta paginada
   */
  static paginated(res, data, pagination, message = 'Datos obtenidos exitosamente') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page * pagination.limit < pagination.total,
        hasPrev: pagination.page > 1
      },
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Helpers para validaciones
 */
class ValidationHelper {
  /**
   * Valida formato de email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida formato de teléfono mexicano
   */
  static isValidMexicanPhone(phone) {
    // Acepta formato: XXXXXXXXXX (exactamente 10 dígitos, primer dígito 1-9)
    const phoneRegex = /^[1-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ''));
  }

  /**
   * Normaliza número de teléfono
   */
  static normalizePhone(phone) {
    // Remover espacios, guiones y paréntesis
    let normalized = phone.replace(/[\s\-\(\)]/g, '');

    // Si empieza con +52, quitarlo
    if (normalized.startsWith('+52')) {
      normalized = normalized.substring(3);
    }
    // Si empieza con 52, quitarlo
    else if (normalized.startsWith('52') && normalized.length === 12) {
      normalized = normalized.substring(2);
    }

    return normalized;
  }

  /**
   * Valida formato de fecha (YYYY-MM-DD)
   */
  static isValidDate(dateString) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Valida formato de hora (HH:MM)
   */
  static isValidTime(timeString) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }

  /**
   * Valida que una fecha sea futura
   */
  static isFutureDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }

  /**
   * Valida código de cita (8 caracteres alfanuméricos)
   */
  static isValidCitaCode(code) {
    const codeRegex = /^[A-Z0-9]{8}$/;
    return codeRegex.test(code);
  }
}

/**
 * Helpers para fechas y horas
 */
class DateHelper {
  /**
   * Obtiene fecha actual en zona horaria específica
   */
  static getCurrentDate(timezone = 'America/Mexico_City') {
    return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  }

  /**
   * Obtiene hora actual en zona horaria específica
   */
  static getCurrentTime(timezone = 'America/Mexico_City') {
    return new Date().toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Convierte fecha y hora a timestamp con zona horaria
   */
  static toTimestamp(date, time, timezone = 'America/Mexico_City') {
    const dateTime = `${date}T${time}:00`;
    return new Date(dateTime).toLocaleString('sv-SE', { timeZone: timezone });
  }

  /**
   * Calcula diferencia en minutos entre dos horas
   */
  static minutesBetween(startTime, endTime) {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    return Math.floor((end - start) / (1000 * 60));
  }

  /**
   * Suma minutos a una hora
   */
  static addMinutes(time, minutes) {
    const date = new Date(`1970-01-01T${time}:00`);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toTimeString().slice(0, 5);
  }

  /**
   * Obtiene el día de la semana (0=Domingo, 6=Sábado)
   */
  static getDayOfWeek(dateString) {
    return new Date(dateString).getDay();
  }

  /**
   * Formatea fecha para mostrar (DD/MM/YYYY)
   */
  static formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX');
  }

  /**
   * Formatea hora para mostrar (HH:MM AM/PM)
   */
  static formatTime(timeString, format12h = false) {
    if (!format12h) return timeString;

    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    return `${displayHour}:${minutes} ${ampm}`;
  }
}

/**
 * Helpers para generación de códigos únicos
 */
class CodeGenerator {
  /**
   * Genera código único para citas
   */
  static generateCitaCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /**
   * Genera slug para organización
   */
  static generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim()
      .substring(0, 50);
  }

  /**
   * Genera código de tenant
   */
  static generateTenantCode(name) {
    const slug = this.generateSlug(name);
    const randomSuffix = Math.random().toString(36).substring(2, 5);
    return `${slug}-${randomSuffix}`;
  }

  /**
   * Genera token seguro
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

/**
 * Helpers para sanitización
 */
class SanitizeHelper {
  /**
   * Sanitiza texto eliminando caracteres peligrosos
   */
  static sanitizeText(text) {
    if (!text) return '';
    return text.toString().trim().replace(/[<>]/g, '');
  }

  /**
   * Sanitiza número de teléfono
   */
  static sanitizePhone(phone) {
    if (!phone) return '';
    return phone.toString().replace(/[^\d+]/g, '');
  }

  /**
   * Sanitiza email
   */
  static sanitizeEmail(email) {
    if (!email) return '';
    return email.toString().toLowerCase().trim();
  }

  /**
   * Sanitiza entrada SQL (básico)
   */
  static sanitizeSqlInput(input) {
    if (!input) return '';
    return input.toString().replace(/['";\\]/g, '');
  }
}

/**
 * Helpers para paginación
 */
class PaginationHelper {
  /**
   * Calcula offset y limit para paginación
   */
  static calculatePagination(page = 1, limit = 20) {
    const currentPage = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (currentPage - 1) * pageSize;

    return {
      page: currentPage,
      limit: pageSize,
      offset
    };
  }

  /**
   * Genera información de paginación para respuesta
   */
  static getPaginationInfo(page, limit, total) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    };
  }
}

/**
 * Helpers para manejo de errores
 */
class ErrorHelper {
  /**
   * Maneja errores de base de datos
   */
  static handleDatabaseError(error) {
    logger.error('Error de base de datos', { error: error.message, stack: error.stack });

    if (error.code === '23505') { // Duplicate key
      return { message: 'El registro ya existe', statusCode: 409 };
    }
    if (error.code === '23503') { // Foreign key violation
      return { message: 'Referencia inválida', statusCode: 400 };
    }
    if (error.code === '23514') { // Check violation
      return { message: 'Datos inválidos', statusCode: 400 };
    }

    return { message: 'Error interno del servidor', statusCode: 500 };
  }

  /**
   * Maneja errores de validación
   */
  static handleValidationError(error) {
    const errors = {};

    if (error.details) {
      error.details.forEach(detail => {
        const field = detail.path.join('.');
        errors[field] = detail.message;
      });
    }

    return { message: 'Errores de validación', errors, statusCode: 400 };
  }
}

/**
 * Helpers para validación de organizaciones (endpoints públicos)
 * CRÍTICO para seguridad multi-tenant en webhooks/IA
 */
class OrganizacionHelper {
  /**
   * Valida que una organización existe y está activa
   * Usa para endpoints públicos que reciben organizacion_id sin autenticación
   *
   * @param {number} organizacionId - ID de la organización a validar
   * @returns {Promise<Object>} { valida: boolean, organizacion: Object|null }
   */
  static async validarOrganizacionActiva(organizacionId) {
    const { getDb } = require('../config/database');
    let db = null;

    try {
      // Validar que el ID es numérico
      const orgId = parseInt(organizacionId);
      if (isNaN(orgId) || orgId <= 0) {
        logger.warn('Intento de validación con organizacion_id inválido', {
          organizacionId,
          type: typeof organizacionId
        });
        return { valida: false, organizacion: null };
      }

      // Obtener conexión del pool
      db = await getDb();

      // Configurar bypass RLS para esta consulta específica
      // ✅ FIX: Usar set_config en lugar de SET para que sea local a la transacción
      await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'true']);

      // Consultar organización
      const result = await db.query(
        `SELECT id, nombre_comercial, activo, suspendido, plan_actual
         FROM organizaciones
         WHERE id = $1`,
        [orgId]
      );

      // Restaurar RLS (ya no es necesario porque set_config es local, pero lo dejamos por seguridad)
      await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'false']);

      if (result.rows.length === 0) {
        logger.warn('Organización no encontrada', { organizacionId: orgId });
        return { valida: false, organizacion: null };
      }

      const organizacion = result.rows[0];

      // Validar que esté activa y no suspendida
      if (!organizacion.activo || organizacion.suspendido) {
        logger.warn('Intento de acceso a organización inactiva o suspendida', {
          organizacionId: orgId,
          activo: organizacion.activo,
          suspendido: organizacion.suspendido
        });
        return { valida: false, organizacion };
      }

      logger.debug('Organización validada correctamente', {
        organizacionId: orgId,
        nombre: organizacion.nombre_comercial,
        plan: organizacion.plan_actual
      });

      return { valida: true, organizacion };

    } catch (error) {
      logger.error('Error validando organización', {
        error: error.message,
        organizacionId
      });
      return { valida: false, organizacion: null };
    } finally {
      if (db) {
        try {
          // ✅ FIX: Usar set_config en lugar de SET (aunque ya no es necesario porque set_config es local)
          await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'false']);
        } catch (e) {
          logger.warn('Error restaurando RLS en validación', { error: e.message });
        }
        db.release();
      }
    }
  }
}

module.exports = {
  ResponseHelper,
  ValidationHelper,
  DateHelper,
  CodeGenerator,
  SanitizeHelper,
  PaginationHelper,
  ErrorHelper,
  OrganizacionHelper
};