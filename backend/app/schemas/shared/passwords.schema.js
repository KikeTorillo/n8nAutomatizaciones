/**
 * Schemas compartidos de validación de contraseñas
 * Centraliza la política de contraseñas del sistema
 *
 * @module schemas/shared/passwords
 *
 * Política de Contraseñas:
 * - Mínimo 8 caracteres
 * - Al menos 1 mayúscula (A-Z)
 * - Al menos 1 minúscula (a-z)
 * - Al menos 1 número (0-9)
 * - Caracteres especiales: OPCIONALES
 *
 * @example
 * const { passwordSchemas } = require('../../schemas/shared');
 *
 * // Para login (solo mínimo requerido)
 * password: passwordSchemas.basic.required()
 *
 * // Para registro/cambio (complejidad requerida)
 * password: passwordSchemas.strong.required()
 */

const Joi = require('joi');

// ============================================================
// CONSTANTES DE POLÍTICA DE CONTRASEÑAS
// ============================================================
const PASSWORD_POLICY = {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    /**
     * Regex que verifica:
     * - Al menos una minúscula (?=.*[a-z])
     * - Al menos una mayúscula (?=.*[A-Z])
     * - Al menos un número (?=.*\d)
     * - NO requiere caracteres especiales
     */
    STRONG_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
};

// ============================================================
// MENSAJES DE ERROR ESTANDARIZADOS
// ============================================================
const PASSWORD_MESSAGES = {
    minLength: 'Contraseña debe tener al menos 8 caracteres',
    maxLength: 'Contraseña no puede exceder 128 caracteres',
    pattern: 'Contraseña debe contener al menos una mayúscula, una minúscula y un número',
    required: 'Contraseña es requerida'
};

// ============================================================
// SCHEMAS DE CONTRASEÑA
// ============================================================
const passwordSchemas = {
    /**
     * Validación básica para login
     * Solo verifica longitud mínima (para no revelar política en errores de login)
     */
    basic: Joi.string()
        .min(PASSWORD_POLICY.MIN_LENGTH)
        .messages({
            'string.min': PASSWORD_MESSAGES.minLength,
            'any.required': PASSWORD_MESSAGES.required
        }),

    /**
     * Validación fuerte para registro/cambio de contraseña
     * Incluye todos los requisitos de complejidad
     */
    strong: Joi.string()
        .min(PASSWORD_POLICY.MIN_LENGTH)
        .max(PASSWORD_POLICY.MAX_LENGTH)
        .pattern(PASSWORD_POLICY.STRONG_PATTERN)
        .messages({
            'string.min': PASSWORD_MESSAGES.minLength,
            'string.max': PASSWORD_MESSAGES.maxLength,
            'string.pattern.base': PASSWORD_MESSAGES.pattern,
            'any.required': PASSWORD_MESSAGES.required
        }),

    /**
     * Validación fuerte con required() ya aplicado
     * Conveniencia para casos comunes
     */
    strongRequired: Joi.string()
        .min(PASSWORD_POLICY.MIN_LENGTH)
        .max(PASSWORD_POLICY.MAX_LENGTH)
        .pattern(PASSWORD_POLICY.STRONG_PATTERN)
        .required()
        .messages({
            'string.min': PASSWORD_MESSAGES.minLength,
            'string.max': PASSWORD_MESSAGES.maxLength,
            'string.pattern.base': PASSWORD_MESSAGES.pattern,
            'any.required': PASSWORD_MESSAGES.required
        })
};

module.exports = {
    PASSWORD_POLICY,
    PASSWORD_MESSAGES,
    passwordSchemas
};
