/**
 * ====================================================================
 * SCHEMAS - BLOQUES INVITACIÓN
 * ====================================================================
 * Validación de datos para bloques del editor de invitaciones.
 *
 * Fecha creación: 3 Febrero 2026
 */

const Joi = require('joi');

// Schema para un bloque individual
const bloqueSchema = Joi.object({
    id: Joi.string().uuid(),
    tipo: Joi.string().required().valid(
        'apertura',
        'hero_invitacion',
        'countdown',
        'timeline',
        'ubicacion',
        'galeria',
        'rsvp',
        'mesa_regalos',
        'video',
        'texto',
        'faq',
        'felicitaciones',
        'separador',
        'animacion_decorativa',
        'seccion_libre' // Modo libre (Wix-style)
    ),
    orden: Joi.number().integer(),
    visible: Joi.boolean().default(true),
    contenido: Joi.object().default({}),
    estilos: Joi.object().default({}),
    version: Joi.number().integer().min(0),
});

// Schema para guardar todos los bloques
const guardarBloquesSchema = Joi.object({
    bloques: Joi.array().items(bloqueSchema).default([]),
});

// Schema para agregar un bloque
const agregarBloqueSchema = Joi.object({
    tipo: Joi.string().required().valid(
        'apertura',
        'hero_invitacion',
        'countdown',
        'timeline',
        'ubicacion',
        'galeria',
        'rsvp',
        'mesa_regalos',
        'video',
        'texto',
        'faq',
        'felicitaciones',
        'separador',
        'animacion_decorativa',
        'seccion_libre' // Modo libre (Wix-style)
    ),
    orden: Joi.number().integer().min(0),
    contenido: Joi.object().default({}),
    estilos: Joi.object().default({}),
});

// Schema para actualizar un bloque
const actualizarBloqueSchema = Joi.object({
    contenido: Joi.object().required(),
});

// Schema para reordenar bloques
const reordenarBloquesSchema = Joi.object({
    orden: Joi.array().items(Joi.string().uuid()).required(),
});

module.exports = {
    bloqueSchema,
    guardarBloquesSchema,
    agregarBloqueSchema,
    actualizarBloqueSchema,
    reordenarBloquesSchema,
};
