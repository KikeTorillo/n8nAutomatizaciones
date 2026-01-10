/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - DOCUMENTOS CLIENTE
 * ====================================================================
 *
 * Fase 4B - Documentos de Cliente (Ene 2026)
 * Schemas Joi para validación de endpoints de documentos
 *
 * ====================================================================
 */

const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');

// ====================================================================
// CONSTANTES
// ====================================================================

const TIPOS_DOCUMENTO = [
    'ine',
    'pasaporte',
    'curp',
    'rfc',
    'comprobante_domicilio',
    'contrato',
    'consentimiento',
    'historia_clinica',
    'receta_medica',
    'estudios_laboratorio',
    'radiografia',
    'poliza_seguro',
    'factura',
    'comprobante_pago',
    'foto',
    'otro'
];

const ESTADOS_VENCIMIENTO = ['vencido', 'por_vencer', 'vigente', 'sin_vencimiento'];

// ====================================================================
// LISTAR DOCUMENTOS
// ====================================================================

const listar = {
    params: Joi.object({
        clienteId: commonSchemas.id
    }),
    query: Joi.object({
        tipo: Joi.string().valid(...TIPOS_DOCUMENTO),
        verificado: Joi.string().valid('true', 'false'),
        estado_vencimiento: Joi.string().valid(...ESTADOS_VENCIMIENTO),
        limite: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
    })
};

// ====================================================================
// CREAR DOCUMENTO
// ====================================================================

const crear = {
    params: Joi.object({
        clienteId: commonSchemas.id
    }),
    body: Joi.object({
        tipo_documento: Joi.string()
            .valid(...TIPOS_DOCUMENTO)
            .required()
            .messages({
                'any.only': `Tipo debe ser uno de: ${TIPOS_DOCUMENTO.join(', ')}`,
                'any.required': 'Tipo de documento es requerido'
            }),
        nombre: Joi.string()
            .min(3)
            .max(150)
            .required()
            .trim()
            .messages({
                'string.min': 'El nombre debe tener al menos 3 caracteres',
                'string.max': 'El nombre no puede exceder 150 caracteres',
                'any.required': 'Nombre es requerido'
            }),
        descripcion: Joi.string()
            .max(1000)
            .trim()
            .allow(null, ''),
        fecha_emision: Joi.date()
            .iso()
            .allow(null),
        fecha_vencimiento: Joi.date()
            .iso()
            .allow(null)
            .when('fecha_emision', {
                is: Joi.exist(),
                then: Joi.date().min(Joi.ref('fecha_emision'))
            })
            .messages({
                'date.min': 'La fecha de vencimiento debe ser posterior a la fecha de emisión'
            })
    })
};

// ====================================================================
// ACTUALIZAR DOCUMENTO
// ====================================================================

const actualizar = {
    params: Joi.object({
        clienteId: commonSchemas.id,
        documentoId: commonSchemas.id
    }),
    body: Joi.object({
        tipo_documento: Joi.string()
            .valid(...TIPOS_DOCUMENTO),
        nombre: Joi.string()
            .min(3)
            .max(150)
            .trim(),
        descripcion: Joi.string()
            .max(1000)
            .trim()
            .allow(null, ''),
        fecha_emision: Joi.date()
            .iso()
            .allow(null),
        fecha_vencimiento: Joi.date()
            .iso()
            .allow(null)
    }).min(1)
};

// ====================================================================
// OBTENER/ELIMINAR POR ID
// ====================================================================

const obtenerPorId = {
    params: Joi.object({
        clienteId: commonSchemas.id,
        documentoId: commonSchemas.id
    })
};

const eliminar = {
    params: Joi.object({
        clienteId: commonSchemas.id,
        documentoId: commonSchemas.id
    })
};

// ====================================================================
// VERIFICAR
// ====================================================================

const verificar = {
    params: Joi.object({
        clienteId: commonSchemas.id,
        documentoId: commonSchemas.id
    }),
    body: Joi.object({
        verificado: Joi.boolean().required()
    })
};

// ====================================================================
// CONTEO
// ====================================================================

const conteo = {
    params: Joi.object({
        clienteId: commonSchemas.id
    })
};

// ====================================================================
// PRESIGNED URL
// ====================================================================

const presigned = {
    params: Joi.object({
        clienteId: commonSchemas.id,
        documentoId: commonSchemas.id
    }),
    query: Joi.object({
        expiry: Joi.number().integer().min(60).max(86400).default(3600) // 1 min a 24 horas
    })
};

// ====================================================================
// POR VENCER
// ====================================================================

const porVencer = {
    query: Joi.object({
        dias: Joi.number().integer().min(1).max(365).default(30)
    })
};

// ====================================================================
// SUBIR ARCHIVO
// ====================================================================

const subirArchivo = {
    params: Joi.object({
        clienteId: commonSchemas.id,
        documentoId: commonSchemas.id
    })
};

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
    listar,
    crear,
    actualizar,
    obtenerPorId,
    eliminar,
    verificar,
    conteo,
    presigned,
    porVencer,
    subirArchivo,
    TIPOS_DOCUMENTO,
    ESTADOS_VENCIMIENTO
};
