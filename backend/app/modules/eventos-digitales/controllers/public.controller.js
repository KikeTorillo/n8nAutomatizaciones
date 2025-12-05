/**
 * ====================================================================
 * CONTROLLER - RUTAS PÚBLICAS DE EVENTOS
 * ====================================================================
 * Controlador para rutas públicas sin autenticación.
 * Maneja vista de invitación y confirmación RSVP.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const EventoModel = require('../models/evento.model');
const InvitadoModel = require('../models/invitado.model');
const logger = require('../../../utils/logger');
const { ResponseHelper } = require('../../../utils/helpers');

class PublicController {

    /**
     * Obtener evento público por slug
     * GET /api/v1/public/evento/:slug
     */
    static async obtenerEvento(req, res) {
        try {
            const { slug } = req.params;

            const evento = await EventoModel.obtenerPorSlug(slug);

            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            logger.info('[PublicController.obtenerEvento] Evento público consultado', {
                slug,
                evento_id: evento.id
            });

            return ResponseHelper.success(res, evento);

        } catch (error) {
            logger.error('[PublicController.obtenerEvento] Error', { error: error.message });
            return ResponseHelper.error(res, 'Error obteniendo evento', 500);
        }
    }

    /**
     * Obtener invitación personalizada por token
     * GET /api/v1/public/evento/:slug/:token
     */
    static async obtenerInvitacion(req, res) {
        try {
            const { slug, token } = req.params;

            // Obtener invitado por token (incluye datos del evento)
            const invitacion = await InvitadoModel.obtenerPorToken(token);

            if (!invitacion) {
                return ResponseHelper.error(res, 'Invitación no encontrada o inválida', 404);
            }

            // Verificar que el slug coincide con el evento
            if (invitacion.evento_slug !== slug) {
                return ResponseHelper.error(res, 'Invitación no corresponde a este evento', 400);
            }

            // Verificar que el evento esté publicado
            if (invitacion.evento_estado !== 'publicado') {
                return ResponseHelper.error(res, 'Este evento no está disponible', 400);
            }

            logger.info('[PublicController.obtenerInvitacion] Invitación consultada', {
                token: token.substring(0, 8) + '...',
                evento_id: invitacion.evento_id,
                invitado_nombre: invitacion.nombre
            });

            // Estructurar respuesta para el frontend
            const evento = {
                id: invitacion.evento_id,
                nombre: invitacion.evento_nombre,
                tipo: invitacion.evento_tipo,
                slug: invitacion.evento_slug,
                descripcion: invitacion.evento_descripcion,
                fecha_evento: invitacion.fecha_evento,
                hora_evento: invitacion.hora_evento,
                fecha_limite_rsvp: invitacion.fecha_limite_rsvp,
                protagonistas: invitacion.protagonistas,
                portada_url: invitacion.portada_url,
                galeria_urls: invitacion.galeria_urls,
                configuracion: invitacion.evento_configuracion,
                estado: invitacion.evento_estado,
                tema: invitacion.tema,
                plantilla_nombre: invitacion.plantilla_nombre
            };

            const invitado = {
                id: invitacion.id,
                nombre: invitacion.nombre,
                email: invitacion.email,
                telefono: invitacion.telefono,
                grupo_familiar: invitacion.grupo_familiar,
                max_acompanantes: invitacion.max_acompanantes,
                token: invitacion.token,
                estado_rsvp: invitacion.estado_rsvp,
                num_asistentes: invitacion.num_asistentes,
                mensaje_rsvp: invitacion.mensaje_rsvp,
                restricciones_dieteticas: invitacion.restricciones_dieteticas
            };

            return ResponseHelper.success(res, { evento, invitado });

        } catch (error) {
            logger.error('[PublicController.obtenerInvitacion] Error', { error: error.message });
            return ResponseHelper.error(res, 'Error obteniendo invitación', 500);
        }
    }

    /**
     * Confirmar RSVP
     * POST /api/v1/public/evento/:slug/:token/rsvp
     */
    static async confirmarRSVP(req, res) {
        try {
            const { slug, token } = req.params;
            const datos = req.body;

            // Primero verificar que el token corresponde al evento
            const invitado = await InvitadoModel.obtenerPorToken(token);

            if (!invitado) {
                return ResponseHelper.error(res, 'Invitación no encontrada', 404);
            }

            if (invitado.evento_slug !== slug) {
                return ResponseHelper.error(res, 'Invitación no corresponde a este evento', 400);
            }

            // Confirmar RSVP
            const resultado = await InvitadoModel.confirmarRSVP(token, datos);

            logger.info('[PublicController.confirmarRSVP] RSVP confirmado', {
                token: token.substring(0, 8) + '...',
                asistira: datos.asistira,
                num_asistentes: datos.num_asistentes
            });

            const mensaje = datos.asistira
                ? '¡Gracias por confirmar tu asistencia!'
                : 'Hemos registrado que no podrás asistir. ¡Gracias por avisarnos!';

            return ResponseHelper.success(res, resultado, mensaje);

        } catch (error) {
            logger.error('[PublicController.confirmarRSVP] Error', { error: error.message });

            // Errores de validación conocidos
            if (error.message.includes('fecha límite') ||
                error.message.includes('no está disponible') ||
                error.message.includes('asistentes permitidos')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            return ResponseHelper.error(res, 'Error confirmando asistencia', 500);
        }
    }

    /**
     * Obtener ubicaciones del evento
     * GET /api/v1/public/evento/:slug/ubicaciones
     */
    static async obtenerUbicaciones(req, res) {
        try {
            const { slug } = req.params;

            const evento = await EventoModel.obtenerPorSlug(slug);

            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            // Las ubicaciones vienen incluidas en obtenerPorSlug
            return ResponseHelper.success(res, evento.ubicaciones || []);

        } catch (error) {
            logger.error('[PublicController.obtenerUbicaciones] Error', { error: error.message });
            return ResponseHelper.error(res, 'Error obteniendo ubicaciones', 500);
        }
    }

    /**
     * Generar mensaje para compartir por WhatsApp
     * GET /api/v1/public/evento/:slug/:token/whatsapp
     */
    static async generarMensajeWhatsApp(req, res) {
        try {
            const { slug, token } = req.params;

            const invitado = await InvitadoModel.obtenerPorToken(token);

            if (!invitado) {
                return ResponseHelper.error(res, 'Invitación no encontrada', 404);
            }

            // Generar URL de la invitación
            const baseUrl = process.env.FRONTEND_URL || 'https://nexo.app';
            const invitacionUrl = `${baseUrl}/e/${slug}/${token}`;

            // Generar mensaje personalizado
            const mensaje = `¡Hola ${invitado.nombre}! 🎉\n\n` +
                `Estás cordialmente invitado/a a ${invitado.evento_nombre}.\n\n` +
                `📅 Fecha: ${new Date(invitado.fecha_evento).toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}\n\n` +
                `Confirma tu asistencia aquí:\n${invitacionUrl}\n\n` +
                `¡Te esperamos! 💕`;

            // URL para abrir WhatsApp
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

            return ResponseHelper.success(res, {
                mensaje,
                url_invitacion: invitacionUrl,
                url_whatsapp: whatsappUrl
            });

        } catch (error) {
            logger.error('[PublicController.generarMensajeWhatsApp] Error', { error: error.message });
            return ResponseHelper.error(res, 'Error generando mensaje', 500);
        }
    }
}

module.exports = PublicController;
