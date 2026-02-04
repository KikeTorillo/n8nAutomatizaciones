/**
 * ====================================================================
 * CONTACTOS SERVICE
 * ====================================================================
 * Servicio para gestionar los contactos recibidos desde el website público.
 * Extrae la lógica de contactos del controller para mejor separación de responsabilidades.
 *
 * Responsabilidades:
 * - Sanitizar datos de entrada
 * - Crear contacto en BD
 * - Enviar notificaciones a admins (async, no bloqueante)
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

const { WebsiteContactosModel } = require('../models');
const { SanitizeHelper } = require('../../../utils/helpers');
const NotificacionesService = require('../../notificaciones/services/notificaciones.service');

/**
 * ContactosService - Gestión de contactos del website
 */
class ContactosService {
    /**
     * Crear un nuevo contacto desde el formulario público
     *
     * @param {Object} params - Parámetros del contacto
     * @param {string} params.websiteId - ID del website
     * @param {string} params.organizacionId - ID de la organización
     * @param {string} params.nombre - Nombre del contacto
     * @param {string} [params.email] - Email (opcional si hay teléfono)
     * @param {string} [params.telefono] - Teléfono (opcional si hay email)
     * @param {string} [params.mensaje] - Mensaje del contacto
     * @param {string} [params.paginaOrigen] - Página desde donde se envió
     * @param {Object} metadata - Metadatos del request
     * @param {string} [metadata.ipOrigen] - IP del visitante
     * @param {string} [metadata.userAgent] - User agent del navegador
     * @returns {Promise<Object>} Contacto creado
     */
    static async crearContacto(params, metadata = {}) {
        const {
            websiteId,
            organizacionId,
            nombre,
            email,
            telefono,
            mensaje,
            paginaOrigen
        } = params;

        const { ipOrigen, userAgent } = metadata;

        // Sanitizar campos para prevenir XSS
        const nombreSanitizado = SanitizeHelper.escapeHtml(nombre.trim());
        const mensajeSanitizado = mensaje ? SanitizeHelper.escapeHtml(mensaje.trim()) : null;

        // Crear contacto en la base de datos
        const contacto = await WebsiteContactosModel.crear({
            website_id: websiteId,
            organizacion_id: organizacionId,
            nombre: nombreSanitizado,
            email: email?.trim() || null,
            telefono: telefono?.trim() || null,
            mensaje: mensajeSanitizado,
            pagina_origen: paginaOrigen || null,
            ip_origen: ipOrigen,
            user_agent: userAgent,
        });

        console.log('[ContactosService.crearContacto] Contacto guardado', {
            contacto_id: contacto.id,
            organizacion_id: organizacionId,
            nombre: nombreSanitizado,
        });

        return {
            contacto,
            nombreSanitizado,
            mensajeSanitizado
        };
    }

    /**
     * Enviar notificación a los administradores de la organización
     * Este método es async y no bloqueante - no falla si la notificación falla
     *
     * @param {Object} params - Parámetros de la notificación
     * @param {string} params.organizacionId - ID de la organización
     * @param {string} params.nombreSitio - Nombre del sitio web
     * @param {Object} params.contacto - Datos del contacto
     * @param {string} params.contactoId - ID del contacto creado
     * @returns {Promise<void>}
     */
    static async notificarAdmins(params) {
        const {
            organizacionId,
            nombreSitio,
            contacto,
            contactoId
        } = params;

        try {
            await NotificacionesService.enviarNotificacion({
                organizacionId,
                tipo: 'website_contacto',
                titulo: `Nuevo contacto desde ${nombreSitio || 'tu sitio web'}`,
                mensaje: this._construirMensajeNotificacion(contacto),
                datos: {
                    contacto_id: contactoId,
                    nombre: contacto.nombre,
                    email: contacto.email,
                    telefono: contacto.telefono,
                    mensaje: contacto.mensaje?.substring(0, 200),
                },
                canales: ['app', 'email'],
                destinatarios: 'admins',
            });
        } catch (error) {
            // No fallar si la notificación falla - solo loguear
            console.warn('[ContactosService.notificarAdmins] Error enviando notificación:', error.message);
        }
    }

    /**
     * Construir mensaje de notificación
     * @private
     */
    static _construirMensajeNotificacion(contacto) {
        let mensaje = `${contacto.nombre} te ha enviado un mensaje`;

        if (contacto.email) {
            mensaje += ` (${contacto.email})`;
        }

        if (contacto.telefono) {
            mensaje += ` - Tel: ${contacto.telefono}`;
        }

        return mensaje;
    }

    /**
     * Extraer metadatos del request HTTP
     *
     * @param {Object} req - Objeto request de Express
     * @returns {Object} Metadatos extraídos
     */
    static extraerMetadatos(req) {
        return {
            ipOrigen: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent']
        };
    }
}

module.exports = ContactosService;
