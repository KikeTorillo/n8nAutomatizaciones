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
const MesaRegalosModel = require('../models/mesa-regalos.model');
const FotoEventoModel = require('../models/foto.model');
const storageService = require('../../../services/storage');
const logger = require('../../../utils/logger');
const { ResponseHelper } = require('../../../utils/helpers');
const QRCode = require('qrcode');

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

            // Obtener evento completo con ubicaciones, regalos y felicitaciones
            const eventoCompleto = await EventoModel.obtenerPorSlug(slug);

            logger.info('[PublicController.obtenerInvitacion] Invitación consultada', {
                token: token.substring(0, 8) + '...',
                evento_id: invitacion.evento_id,
                invitado_nombre: invitacion.nombre
            });

            // Estructurar respuesta para el frontend (usar datos completos del evento)
            const evento = {
                id: eventoCompleto.id,
                nombre: eventoCompleto.nombre,
                tipo: eventoCompleto.tipo,
                slug: eventoCompleto.slug,
                descripcion: eventoCompleto.descripcion,
                fecha_evento: eventoCompleto.fecha_evento,
                hora_evento: eventoCompleto.hora_evento,
                fecha_limite_rsvp: eventoCompleto.fecha_limite_rsvp,
                protagonistas: eventoCompleto.protagonistas,
                portada_url: eventoCompleto.portada_url,
                galeria_urls: eventoCompleto.galeria_urls,
                configuracion: eventoCompleto.configuracion,
                estado: eventoCompleto.estado,
                tema: eventoCompleto.tema,
                plantilla_nombre: eventoCompleto.plantilla_nombre,
                // Incluir ubicaciones, regalos y felicitaciones
                ubicaciones: eventoCompleto.ubicaciones || [],
                regalos: eventoCompleto.regalos || [],
                felicitaciones: eventoCompleto.felicitaciones || []
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
                restricciones_dieteticas: invitacion.restricciones_dieteticas,
                // Mesa asignada (seating chart)
                mesa_id: invitacion.mesa_id || null,
                mesa_nombre: invitacion.mesa_nombre || null,
                mesa_numero: invitacion.mesa_numero || null
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
     * Obtener mesa de regalos del evento
     * GET /api/v1/public/evento/:slug/regalos
     */
    static async obtenerRegalos(req, res) {
        try {
            const { slug } = req.params;

            const evento = await EventoModel.obtenerPorSlug(slug);

            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            // Verificar si la mesa de regalos está habilitada
            if (evento.configuracion?.mostrar_mesa_regalos === false) {
                return ResponseHelper.success(res, []);
            }

            const regalos = await MesaRegalosModel.obtenerPublica(evento.id);

            logger.info('[PublicController.obtenerRegalos] Mesa de regalos consultada', {
                slug,
                evento_id: evento.id,
                total_regalos: regalos.length
            });

            return ResponseHelper.success(res, regalos);

        } catch (error) {
            logger.error('[PublicController.obtenerRegalos] Error', { error: error.message });
            return ResponseHelper.error(res, 'Error obteniendo mesa de regalos', 500);
        }
    }

    /**
     * Generar archivo iCalendar (.ics) para agregar al calendario
     * GET /api/v1/public/evento/:slug/calendario
     */
    static async generarCalendario(req, res) {
        try {
            const { slug } = req.params;

            const evento = await EventoModel.obtenerPorSlug(slug);

            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            // Nota: La función SQL obtener_evento_publico_por_slug ya filtra solo eventos publicados

            // Construir fecha/hora del evento
            const fechaEvento = new Date(evento.fecha_evento);
            let horaInicio = '12:00';
            if (evento.hora_evento) {
                horaInicio = evento.hora_evento.substring(0, 5);
            }
            const [horas, minutos] = horaInicio.split(':').map(Number);
            fechaEvento.setHours(horas, minutos, 0, 0);

            // Fecha fin (asumimos 4 horas de duración por defecto)
            const fechaFin = new Date(fechaEvento.getTime() + 4 * 60 * 60 * 1000);

            // Formatear fechas para iCal (formato: YYYYMMDDTHHMMSS)
            const formatearFechaICal = (fecha) => {
                return fecha.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            };

            // Obtener ubicación principal si existe
            let ubicacion = '';
            if (evento.ubicaciones && evento.ubicaciones.length > 0) {
                const ubPrincipal = evento.ubicaciones[0];
                ubicacion = ubPrincipal.direccion || ubPrincipal.nombre || '';
            }

            // Generar URL de la invitación
            const baseUrl = process.env.FRONTEND_URL || 'https://nexo.app';
            const invitacionUrl = `${baseUrl}/e/${slug}`;

            // Generar UID único para el evento
            const uid = `${evento.id}-${slug}@nexo.app`;

            // Construir contenido iCal
            const icsContent = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//Nexo//Eventos Digitales//ES',
                'CALSCALE:GREGORIAN',
                'METHOD:PUBLISH',
                'BEGIN:VEVENT',
                `UID:${uid}`,
                `DTSTAMP:${formatearFechaICal(new Date())}`,
                `DTSTART:${formatearFechaICal(fechaEvento)}`,
                `DTEND:${formatearFechaICal(fechaFin)}`,
                `SUMMARY:${evento.nombre.replace(/[,;]/g, ' ')}`,
                `DESCRIPTION:${(evento.descripcion || '').replace(/\n/g, '\\n').replace(/[,;]/g, ' ')}\\n\\nMás información: ${invitacionUrl}`,
                ubicacion ? `LOCATION:${ubicacion.replace(/[,;]/g, ' ')}` : '',
                `URL:${invitacionUrl}`,
                'STATUS:CONFIRMED',
                'BEGIN:VALARM',
                'TRIGGER:-P1D',
                'ACTION:DISPLAY',
                `DESCRIPTION:Recordatorio: ${evento.nombre} es mañana`,
                'END:VALARM',
                'BEGIN:VALARM',
                'TRIGGER:-PT2H',
                'ACTION:DISPLAY',
                `DESCRIPTION:Recordatorio: ${evento.nombre} es en 2 horas`,
                'END:VALARM',
                'END:VEVENT',
                'END:VCALENDAR'
            ].filter(line => line).join('\r\n');

            logger.info('[PublicController.generarCalendario] Calendario generado', {
                slug,
                evento_id: evento.id
            });

            // Enviar archivo .ics
            res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${slug}.ics"`);
            return res.send(icsContent);

        } catch (error) {
            logger.error('[PublicController.generarCalendario] Error', { error: error.message });
            return ResponseHelper.error(res, 'Error generando calendario', 500);
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

    /**
     * Generar QR para invitación pública
     * GET /api/v1/public/evento/:slug/:token/qr
     */
    static async generarQR(req, res) {
        try {
            const { slug, token } = req.params;
            const { formato = 'png' } = req.query;

            // Verificar que el token es válido
            const invitacion = await InvitadoModel.obtenerPorToken(token);

            if (!invitacion) {
                return ResponseHelper.error(res, 'Invitación no encontrada', 404);
            }

            if (invitacion.evento_slug !== slug) {
                return ResponseHelper.error(res, 'Invitación no corresponde a este evento', 400);
            }

            // Verificar si QR está habilitado en la configuración del evento
            const evento = await EventoModel.obtenerPorSlug(slug);
            if (evento?.configuracion?.habilitar_qr_checkin === false) {
                return ResponseHelper.error(res, 'QR no habilitado para este evento', 400);
            }

            // Generar URL de la invitación
            const baseUrl = process.env.FRONTEND_URL || 'https://nexo.app';
            const invitacionUrl = `${baseUrl}/e/${slug}/${token}`;

            // Opciones del QR
            const qrOptions = {
                errorCorrectionLevel: 'M',
                type: 'png',
                margin: 2,
                width: 400,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            };

            if (formato === 'base64') {
                const qrDataUrl = await QRCode.toDataURL(invitacionUrl, qrOptions);
                return ResponseHelper.success(res, {
                    qr: qrDataUrl,
                    url: invitacionUrl,
                    invitado: invitacion.nombre
                });
            } else {
                const qrBuffer = await QRCode.toBuffer(invitacionUrl, qrOptions);

                res.setHeader('Content-Type', 'image/png');
                res.setHeader('Content-Disposition', `inline; filename="qr-${invitacion.nombre.replace(/\s+/g, '-')}.png"`);
                return res.send(qrBuffer);
            }

        } catch (error) {
            logger.error('[PublicController.generarQR] Error', { error: error.message });
            return ResponseHelper.error(res, 'Error generando QR', 500);
        }
    }

    // ========================================================================
    // GALERÍA PÚBLICA
    // ========================================================================

    /**
     * Obtener galería pública del evento
     * GET /api/v1/public/evento/:slug/galeria
     */
    static async obtenerGaleria(req, res) {
        try {
            const { slug } = req.params;
            const { limit = 100 } = req.query;

            const evento = await EventoModel.obtenerPorSlug(slug);

            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            // Verificar si la galería compartida está habilitada
            if (evento.configuracion?.habilitar_galeria_compartida === false) {
                return ResponseHelper.success(res, {
                    fotos: [],
                    total: 0,
                    mensaje: 'Galería no habilitada para este evento'
                });
            }

            const fotos = await FotoEventoModel.obtenerPublicas(evento.id, parseInt(limit));

            logger.info('[PublicController.obtenerGaleria] Galería consultada', {
                slug,
                evento_id: evento.id,
                total_fotos: fotos.length
            });

            return ResponseHelper.success(res, {
                fotos,
                total: fotos.length
            });

        } catch (error) {
            logger.error('[PublicController.obtenerGaleria] Error', { error: error.message });
            return ResponseHelper.error(res, 'Error obteniendo galería', 500);
        }
    }

    /**
     * Subir foto como invitado
     * POST /api/v1/public/evento/:slug/:token/galeria
     */
    static async subirFoto(req, res) {
        try {
            const { slug, token } = req.params;
            const datos = req.body;

            // Verificar invitado por token
            const invitado = await InvitadoModel.obtenerPorToken(token);

            if (!invitado) {
                return ResponseHelper.error(res, 'Invitación no encontrada', 404);
            }

            if (invitado.evento_slug !== slug) {
                return ResponseHelper.error(res, 'Invitación no corresponde a este evento', 400);
            }

            // Obtener evento para verificar configuración
            const evento = await EventoModel.obtenerPorSlug(slug);

            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            // Verificar si la galería compartida está habilitada
            if (evento.configuracion?.habilitar_galeria_compartida === false) {
                return ResponseHelper.error(res, 'La galería no está habilitada para este evento', 400);
            }

            // Verificar si invitados pueden subir fotos
            if (evento.configuracion?.permitir_subida_invitados === false) {
                return ResponseHelper.error(res, 'No está permitido subir fotos en este evento', 400);
            }

            // Crear foto
            const foto = await FotoEventoModel.crearPublica({
                ...datos,
                evento_id: evento.id,
                invitado_id: invitado.id,
                nombre_autor: invitado.nombre
            });

            logger.info('[PublicController.subirFoto] Foto subida por invitado', {
                slug,
                evento_id: evento.id,
                invitado_id: invitado.id,
                foto_id: foto.id
            });

            return ResponseHelper.success(res, foto, '¡Foto subida exitosamente!', 201);

        } catch (error) {
            logger.error('[PublicController.subirFoto] Error', { error: error.message });
            return ResponseHelper.error(res, 'Error subiendo foto', 500);
        }
    }

    /**
     * Subir foto con archivo (multipart/form-data)
     * POST /api/v1/public/evento/:slug/:token/galeria
     * Recibe: campo 'foto' con el archivo, opcionalmente 'caption'
     */
    static async subirFotoConArchivo(req, res) {
        try {
            const { slug, token } = req.params;
            const { caption } = req.body;

            // Verificar que se subió un archivo
            if (!req.file) {
                return ResponseHelper.error(res, 'No se proporcionó ninguna imagen', 400);
            }

            // Verificar invitado por token
            const invitado = await InvitadoModel.obtenerPorToken(token);

            if (!invitado) {
                return ResponseHelper.error(res, 'Invitación no encontrada', 404);
            }

            if (invitado.evento_slug !== slug) {
                return ResponseHelper.error(res, 'Invitación no corresponde a este evento', 400);
            }

            // Obtener evento para verificar configuración
            const evento = await EventoModel.obtenerPorSlug(slug);

            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            // Verificar si la galería compartida está habilitada
            if (evento.configuracion?.habilitar_galeria_compartida === false) {
                return ResponseHelper.error(res, 'La galería no está habilitada para este evento', 400);
            }

            // Verificar si invitados pueden subir fotos
            if (evento.configuracion?.permitir_subida_invitados === false) {
                return ResponseHelper.error(res, 'No está permitido subir fotos en este evento', 400);
            }

            // Subir archivo a MinIO
            const uploadResult = await storageService.upload({
                buffer: req.file.buffer,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                organizacionId: evento.organizacion_id,
                folder: `eventos/${evento.id}/galeria`,
                isPublic: true,
                generateThumbnail: true,
                entidadTipo: 'foto_evento',
                entidadId: evento.id
            });

            // Crear registro de foto
            const foto = await FotoEventoModel.crearPublica(evento.id, invitado.id, {
                url: uploadResult.url,
                thumbnail_url: uploadResult.thumbnailUrl || uploadResult.url,
                nombre_autor: invitado.nombre,
                caption: caption || null,
                tamanio_bytes: req.file.size,
                tipo_mime: req.file.mimetype
            });

            logger.info('[PublicController.subirFotoConArchivo] Foto subida por invitado', {
                slug,
                evento_id: evento.id,
                invitado_id: invitado.id,
                foto_id: foto.id,
                archivo: req.file.originalname
            });

            return ResponseHelper.success(res, foto, '¡Foto subida exitosamente!', 201);

        } catch (error) {
            logger.error('[PublicController.subirFotoConArchivo] Error', { error: error.message, stack: error.stack });

            // Manejar error de multer
            if (error.message?.includes('Tipo de archivo no permitido')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            return ResponseHelper.error(res, 'Error subiendo foto', 500);
        }
    }

    /**
     * Reportar foto inapropiada
     * POST /api/v1/public/galeria/:id/reportar
     */
    static async reportarFoto(req, res) {
        try {
            const { id } = req.params;
            const { motivo } = req.body;

            const foto = await FotoEventoModel.reportar(id, motivo);

            if (!foto) {
                return ResponseHelper.error(res, 'Foto no encontrada', 404);
            }

            logger.info('[PublicController.reportarFoto] Foto reportada', {
                foto_id: id,
                motivo
            });

            return ResponseHelper.success(res, { id: parseInt(id) }, 'Reporte enviado. Gracias por ayudarnos a mantener la galería segura.');

        } catch (error) {
            logger.error('[PublicController.reportarFoto] Error', { error: error.message });
            return ResponseHelper.error(res, 'Error reportando foto', 500);
        }
    }
}

module.exports = PublicController;
