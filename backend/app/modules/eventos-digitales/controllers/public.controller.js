/**
 * ====================================================================
 * CONTROLLER - RUTAS PÚBLICAS DE EVENTOS
 * ====================================================================
 * Controlador para rutas públicas sin autenticación.
 * Maneja vista de invitación y confirmación RSVP.
 *
 * ENDPOINTS (14):
 * - GET  /evento/:slug                    - Obtener evento público
 * - GET  /evento/:slug/:token             - Obtener invitación personalizada
 * - POST /evento/:slug/:token/rsvp        - Confirmar RSVP
 * - GET  /evento/:slug/ubicaciones        - Obtener ubicaciones
 * - GET  /evento/:slug/regalos            - Obtener mesa de regalos
 * - GET  /evento/:slug/calendario         - Generar .ics
 * - GET  /evento/:slug/:token/whatsapp    - Mensaje WhatsApp
 * - GET  /evento/:slug/:token/qr          - QR de invitación
 * - GET  /evento/:slug/galeria            - Galería pública
 * - POST /evento/:slug/:token/galeria     - Subir foto (invitado)
 * - POST /galeria/:id/reportar            - Reportar foto
 *
 * NO MIGRADO A BaseCrudController - Ene 2026
 * Razón: Endpoints públicos sin autenticación, no es CRUD,
 * múltiples funcionalidades especializadas (RSVP, QR, calendario).
 *
 * REFACTORIZADO Feb 2026: Migrado a asyncHandler + servicios
 *
 * Fecha creación: 4 Diciembre 2025
 */

const EventoModel = require('../models/evento.model');
const InvitadoModel = require('../models/invitado.model');
const MesaRegalosModel = require('../models/mesa-regalos.model');
const FelicitacionModel = require('../models/felicitacion.model');
const FotoEventoModel = require('../models/foto.model');
const storageService = require('../../../services/storage');
const logger = require('../../../utils/logger');
const { ResponseHelper, LimitesHelper } = require('../../../utils/helpers');
const { ResourceNotFoundError, ValidationError } = require('../../../utils/errors');
const asyncHandler = require('../../../middleware/asyncHandler');

// Servicios centralizados
const { generarQRInvitado, generarUrlInvitacion } = require('../services/qr.service');
const { generarICS, enviarArchivoICS } = require('../services/calendar.service');

class PublicController {
    /**
     * Valida que la galería y la subida de fotos estén habilitadas para el evento.
     * @param {Object} evento - Evento con configuración
     * @throws {ValidationError}
     */
    static _validarPermisoGaleria(evento) {
        if (evento.configuracion?.habilitar_galeria_compartida === false) {
            throw new ValidationError('La galería no está habilitada para este evento');
        }
        if (evento.configuracion?.permitir_subida_invitados === false) {
            throw new ValidationError('No está permitido subir fotos en este evento');
        }
    }


    /**
     * Obtener evento público por slug
     * GET /api/v1/public/evento/:slug
     */
    static obtenerEvento = asyncHandler(async (req, res) => {
        const { slug } = req.params;

        const evento = await EventoModel.obtenerPorSlug(slug);

        if (!evento) {
            throw new ResourceNotFoundError('Evento');
        }

        logger.info('[PublicController.obtenerEvento] Evento público consultado', {
            slug,
            evento_id: evento.id
        });

        return ResponseHelper.success(res, evento);
    });

    /**
     * Obtener invitación personalizada por token
     * GET /api/v1/public/evento/:slug/:token
     */
    static obtenerInvitacion = asyncHandler(async (req, res) => {
        const { slug, token } = req.params;

        // Obtener invitado por token (incluye datos del evento)
        const invitacion = await InvitadoModel.obtenerPorToken(token);

        if (!invitacion) {
            throw new ResourceNotFoundError('Invitación');
        }

        // Verificar que el slug coincide con el evento
        if (invitacion.evento_slug !== slug) {
            throw new ValidationError('Invitación no corresponde a este evento');
        }

        // Verificar que el evento esté publicado
        if (invitacion.evento_estado !== 'publicado') {
            throw new ValidationError('Este evento no está disponible');
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
            felicitaciones: eventoCompleto.felicitaciones || [],
            // Incluir bloques del editor de invitaciones
            bloques_invitacion: eventoCompleto.bloques_invitacion || []
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
    });

    /**
     * Confirmar RSVP
     * POST /api/v1/public/evento/:slug/:token/rsvp
     */
    static confirmarRSVP = asyncHandler(async (req, res) => {
        const { slug, token } = req.params;
        const datos = req.body;

        // Primero verificar que el token corresponde al evento
        const invitado = await InvitadoModel.obtenerPorToken(token);

        if (!invitado) {
            throw new ResourceNotFoundError('Invitación');
        }

        if (invitado.evento_slug !== slug) {
            throw new ValidationError('Invitación no corresponde a este evento');
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
    });

    /**
     * Obtener ubicaciones del evento
     * GET /api/v1/public/evento/:slug/ubicaciones
     */
    static obtenerUbicaciones = asyncHandler(async (req, res) => {
        const { slug } = req.params;

        const evento = await EventoModel.obtenerPorSlug(slug);

        if (!evento) {
            throw new ResourceNotFoundError('Evento');
        }

        // Las ubicaciones vienen incluidas en obtenerPorSlug
        return ResponseHelper.success(res, evento.ubicaciones || []);
    });

    /**
     * Obtener mesa de regalos del evento
     * GET /api/v1/public/evento/:slug/regalos
     */
    static obtenerRegalos = asyncHandler(async (req, res) => {
        const { slug } = req.params;

        const evento = await EventoModel.obtenerPorSlug(slug);

        if (!evento) {
            throw new ResourceNotFoundError('Evento');
        }

        const regalos = await MesaRegalosModel.obtenerPublica(evento.id);

        logger.info('[PublicController.obtenerRegalos] Mesa de regalos consultada', {
            slug,
            evento_id: evento.id,
            total_regalos: regalos.length
        });

        return ResponseHelper.success(res, regalos);
    });

    /**
     * Generar archivo iCalendar (.ics) para agregar al calendario
     * GET /api/v1/public/evento/:slug/calendario
     */
    static generarCalendario = asyncHandler(async (req, res) => {
        const { slug } = req.params;

        const evento = await EventoModel.obtenerPorSlug(slug);

        if (!evento) {
            throw new ResourceNotFoundError('Evento');
        }

        // Usar servicio de calendario
        const icsContent = generarICS(evento);

        logger.info('[PublicController.generarCalendario] Calendario generado', {
            slug,
            evento_id: evento.id
        });

        return enviarArchivoICS(res, icsContent, slug);
    });

    /**
     * Generar mensaje para compartir por WhatsApp
     * GET /api/v1/public/evento/:slug/:token/whatsapp
     */
    static generarMensajeWhatsApp = asyncHandler(async (req, res) => {
        const { slug, token } = req.params;

        const invitado = await InvitadoModel.obtenerPorToken(token);

        if (!invitado) {
            throw new ResourceNotFoundError('Invitación');
        }

        // Generar URL de la invitación
        const invitacionUrl = generarUrlInvitacion(slug, token);

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
    });

    /**
     * Generar QR para invitación pública
     * GET /api/v1/public/evento/:slug/:token/qr
     */
    static generarQR = asyncHandler(async (req, res) => {
        const { slug, token } = req.params;
        const { formato = 'png' } = req.query;

        // Verificar que el token es válido
        const invitacion = await InvitadoModel.obtenerPorToken(token);

        if (!invitacion) {
            throw new ResourceNotFoundError('Invitación');
        }

        if (invitacion.evento_slug !== slug) {
            throw new ValidationError('Invitación no corresponde a este evento');
        }

        // Usar servicio de QR
        const resultado = await generarQRInvitado(
            {
                slug,
                token,
                nombre: invitacion.nombre,
                grupoFamiliar: invitacion.grupo_familiar
            },
            formato
        );

        if (formato === 'base64') {
            return ResponseHelper.success(res, {
                qr: resultado.qr,
                url: resultado.url,
                invitado: invitacion.nombre
            });
        }

        res.setHeader('Content-Type', resultado.contentType);
        res.setHeader('Content-Disposition', `inline; filename="${resultado.filename}"`);
        return res.send(resultado.buffer);
    });

    // ========================================================================
    // FELICITACIONES PÚBLICAS
    // ========================================================================

    /**
     * Obtener felicitaciones aprobadas del evento
     * GET /api/v1/public/evento/:slug/felicitaciones
     */
    static obtenerFelicitacionesPublicas = asyncHandler(async (req, res) => {
        const { slug } = req.params;
        const { pagina = 1, limite = 20 } = req.query;

        const evento = await EventoModel.obtenerPorSlug(slug);

        if (!evento) {
            throw new ResourceNotFoundError('Evento');
        }

        const felicitaciones = await FelicitacionModel.obtenerPublicas(
            evento.id,
            parseInt(limite)
        );

        return ResponseHelper.success(res, {
            felicitaciones,
            total: felicitaciones.length
        });
    });

    /**
     * Enviar felicitación como invitado
     * POST /api/v1/public/evento/:slug/:token/felicitacion
     */
    static crearFelicitacionPublica = asyncHandler(async (req, res) => {
        const { slug, token } = req.params;
        const { mensaje } = req.body;

        // Verificar invitado por token
        const invitado = await InvitadoModel.obtenerPorToken(token);

        if (!invitado) {
            throw new ResourceNotFoundError('Invitación');
        }

        if (invitado.evento_slug !== slug) {
            throw new ValidationError('Invitación no corresponde a este evento');
        }

        const evento = await EventoModel.obtenerPorSlug(slug);

        if (!evento) {
            throw new ResourceNotFoundError('Evento');
        }

        const felicitacion = await FelicitacionModel.crearPublica(
            evento.id,
            invitado.id,
            invitado.nombre,
            mensaje
        );

        if (!felicitacion) {
            throw new ValidationError('No se pudo enviar la felicitación');
        }

        logger.info('[PublicController.crearFelicitacionPublica] Felicitación enviada', {
            slug,
            evento_id: evento.id,
            invitado_id: invitado.id
        });

        return ResponseHelper.success(res, felicitacion, '¡Felicitación enviada!', 201);
    });

    // ========================================================================
    // GALERÍA PÚBLICA
    // ========================================================================

    /**
     * Obtener galería pública del evento
     * GET /api/v1/public/evento/:slug/galeria
     */
    static obtenerGaleria = asyncHandler(async (req, res) => {
        const { slug } = req.params;
        const { limit = 100 } = req.query;

        const evento = await EventoModel.obtenerPorSlug(slug);

        if (!evento) {
            throw new ResourceNotFoundError('Evento');
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
    });

    /**
     * Subir foto como invitado
     * POST /api/v1/public/evento/:slug/:token/galeria
     */
    static subirFoto = asyncHandler(async (req, res) => {
        const { slug, token } = req.params;
        const datos = req.body;

        // Verificar invitado por token
        const invitado = await InvitadoModel.obtenerPorToken(token);

        if (!invitado) {
            throw new ResourceNotFoundError('Invitación');
        }

        if (invitado.evento_slug !== slug) {
            throw new ValidationError('Invitación no corresponde a este evento');
        }

        // Obtener evento para verificar configuración
        const evento = await EventoModel.obtenerPorSlug(slug);

        if (!evento) {
            throw new ResourceNotFoundError('Evento');
        }

        PublicController._validarPermisoGaleria(evento);

        // Verificar límite de fotos del plan
        await LimitesHelper.verificarLimiteFotosGaleriaOLanzar(evento.organizacion_id, evento.id, 1);

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
    });

    /**
     * Subir foto con archivo (multipart/form-data)
     * POST /api/v1/public/evento/:slug/:token/galeria
     * Recibe: campo 'foto' con el archivo, opcionalmente 'caption'
     */
    static subirFotoConArchivo = asyncHandler(async (req, res) => {
        const { slug, token } = req.params;
        const { caption } = req.body;

        // Verificar que se subió un archivo
        if (!req.file) {
            throw new ValidationError('No se proporcionó ninguna imagen');
        }

        // Verificar invitado por token
        const invitado = await InvitadoModel.obtenerPorToken(token);

        if (!invitado) {
            throw new ResourceNotFoundError('Invitación');
        }

        if (invitado.evento_slug !== slug) {
            throw new ValidationError('Invitación no corresponde a este evento');
        }

        // Obtener evento para verificar configuración
        const evento = await EventoModel.obtenerPorSlug(slug);

        if (!evento) {
            throw new ResourceNotFoundError('Evento');
        }

        PublicController._validarPermisoGaleria(evento);

        // Verificar límite de fotos del plan
        await LimitesHelper.verificarLimiteFotosGaleriaOLanzar(evento.organizacion_id, evento.id, 1);

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
    });

    /**
     * Reportar foto inapropiada
     * POST /api/v1/public/galeria/:id/reportar
     */
    static reportarFoto = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { motivo } = req.body;

        const foto = await FotoEventoModel.reportar(id, motivo);

        if (!foto) {
            throw new ResourceNotFoundError('Foto', id);
        }

        logger.info('[PublicController.reportarFoto] Foto reportada', {
            foto_id: id,
            motivo
        });

        return ResponseHelper.success(res, { id: parseInt(id) }, 'Reporte enviado. Gracias por ayudarnos a mantener la galería segura.');
    });
}

module.exports = PublicController;
