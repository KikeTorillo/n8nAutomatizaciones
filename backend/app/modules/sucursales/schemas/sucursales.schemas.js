const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

/**
 * Schema para crear sucursal
 */
const crearSucursalSchema = Joi.object({
    codigo: Joi.string().min(2).max(20).optional(),
    nombre: Joi.string().min(2).max(150).required(),
    es_matriz: Joi.boolean().optional().default(false),
    direccion: Joi.string().max(500).optional().allow('', null),
    estado_id: Joi.number().integer().positive().optional().allow(null),
    ciudad_id: Joi.number().integer().positive().optional().allow(null),
    codigo_postal: Joi.string().max(10).optional().allow('', null),
    latitud: Joi.number().min(-90).max(90).optional().allow(null),
    longitud: Joi.number().min(-180).max(180).optional().allow(null),
    telefono: Joi.string().max(20).optional().allow('', null),
    email: fields.email.optional().allow('', null),
    whatsapp: Joi.string().max(20).optional().allow('', null),
    zona_horaria: Joi.string().max(50).optional().default('America/Mexico_City'),
    horario_apertura: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().default('09:00'),
    horario_cierre: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().default('20:00'),
    dias_laborales: Joi.array().items(
        Joi.string().valid('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')
    ).optional(),
    inventario_compartido: Joi.boolean().optional().default(true),
    servicios_heredados: Joi.boolean().optional().default(true),
    activo: Joi.boolean().optional().default(true)
});

/**
 * Schema para actualizar sucursal
 */
const actualizarSucursalSchema = Joi.object({
    codigo: Joi.string().min(2).max(20).optional(),
    nombre: Joi.string().min(2).max(150).optional(),
    direccion: Joi.string().max(500).optional().allow('', null),
    estado_id: Joi.number().integer().positive().optional().allow(null),
    ciudad_id: Joi.number().integer().positive().optional().allow(null),
    codigo_postal: Joi.string().max(10).optional().allow('', null),
    latitud: Joi.number().min(-90).max(90).optional().allow(null),
    longitud: Joi.number().min(-180).max(180).optional().allow(null),
    telefono: Joi.string().max(20).optional().allow('', null),
    email: fields.email.optional().allow('', null),
    whatsapp: Joi.string().max(20).optional().allow('', null),
    zona_horaria: Joi.string().max(50).optional(),
    horario_apertura: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    horario_cierre: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    dias_laborales: Joi.array().items(
        Joi.string().valid('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')
    ).optional(),
    inventario_compartido: Joi.boolean().optional(),
    servicios_heredados: Joi.boolean().optional(),
    activo: Joi.boolean().optional()
}).min(1);

/**
 * Schema para asignar usuario a sucursal
 */
const asignarUsuarioSchema = Joi.object({
    usuario_id: Joi.number().integer().positive().required(),
    es_gerente: Joi.boolean().optional().default(false),
    rol_sucursal: Joi.string().valid('admin', 'propietario', 'empleado', 'bot').optional().allow(null),
    permisos_override: Joi.object().optional().default({}),
    activo: Joi.boolean().optional().default(true)
});

/**
 * Schema para asignar profesional a sucursal
 */
const asignarProfesionalSchema = Joi.object({
    profesional_id: Joi.number().integer().positive().required(),
    horarios_personalizados: Joi.object().optional().allow(null),
    activo: Joi.boolean().optional().default(true)
});

/**
 * Schema para crear transferencia
 */
const crearTransferenciaSchema = Joi.object({
    codigo: Joi.string().max(30).optional(),
    sucursal_origen_id: Joi.number().integer().positive().required(),
    sucursal_destino_id: Joi.number().integer().positive().required(),
    notas: Joi.string().max(500).optional().allow('', null),
    items: Joi.array().items(
        Joi.object({
            producto_id: Joi.number().integer().positive().required(),
            cantidad_enviada: Joi.number().integer().positive().required(),
            notas: Joi.string().max(200).optional().allow('', null)
        })
    ).optional()
});

/**
 * Schema para item de transferencia
 */
const itemTransferenciaSchema = Joi.object({
    producto_id: Joi.number().integer().positive().required(),
    cantidad_enviada: Joi.number().integer().positive().required(),
    notas: Joi.string().max(200).optional().allow('', null)
});

/**
 * Schema para recibir transferencia
 */
const recibirTransferenciaSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            id: Joi.number().integer().positive().required(),
            cantidad_recibida: Joi.number().integer().min(0).required(),
            notas: Joi.string().max(200).optional().allow('', null)
        })
    ).optional()
});

module.exports = {
    crearSucursalSchema,
    actualizarSucursalSchema,
    asignarUsuarioSchema,
    asignarProfesionalSchema,
    crearTransferenciaSchema,
    itemTransferenciaSchema,
    recibirTransferenciaSchema
};
