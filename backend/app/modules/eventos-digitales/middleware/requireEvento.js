/**
 * ====================================================================
 * MIDDLEWARE: requireEvento
 * ====================================================================
 * Verifica que el evento padre existe y pertenece a la organización.
 * Adjunta el evento a req.evento para uso posterior en controllers.
 *
 * USO:
 * router.post('/:eventoId/mesas', requireEvento, controller.crear);
 *
 * ACCESO EN CONTROLLER:
 * const evento = req.evento;      // Evento completo
 * const eventoId = req.eventoId;  // ID parseado
 *
 * Feb 2026: Creado para eliminar duplicación de verificación de evento
 * en controllers de mesas, galeria, mesa-regalos y felicitaciones.
 */

const EventoModel = require('../models/evento.model');
const { ErrorHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');

/**
 * Middleware que verifica existencia del evento padre
 * Busca eventoId en req.params.eventoId o req.params.evento_id
 */
const requireEvento = asyncHandler(async (req, res, next) => {
    const eventoId = req.params.eventoId || req.params.evento_id;

    // Si no hay eventoId en params, continuar (rutas sin dependencia de evento)
    if (!eventoId) {
        return next();
    }

    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
        throw new Error('No se pudo determinar la organización');
    }

    const evento = await EventoModel.obtenerPorId(parseInt(eventoId), organizacionId);
    ErrorHelper.throwIfNotFound(evento, 'Evento');

    // Adjuntar evento a request para uso en controller
    req.evento = evento;
    req.eventoId = parseInt(eventoId);

    next();
});

module.exports = requireEvento;
