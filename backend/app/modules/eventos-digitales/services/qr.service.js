/**
 * ====================================================================
 * SERVICE: GENERACIÓN DE QR
 * ====================================================================
 * Servicio para generación de códigos QR de invitaciones.
 * Centraliza la lógica de QR usada por controllers/invitados y
 * controllers/public.
 *
 * Fecha creación: 3 Febrero 2026
 */

const QRCode = require('qrcode');

/**
 * Opciones predeterminadas para generación de QR
 */
const QR_DEFAULT_OPTIONS = {
    errorCorrectionLevel: 'M',
    type: 'png',
    margin: 2,
    width: 400,
    color: {
        dark: '#000000',
        light: '#FFFFFF'
    }
};

/**
 * Genera la URL de invitación para un evento
 * @param {string} slug - Slug del evento
 * @param {string} token - Token del invitado
 * @returns {string} URL completa de la invitación
 */
function generarUrlInvitacion(slug, token) {
    const baseUrl = process.env.FRONTEND_URL?.replace(/\/+$/, '') || 'https://nexo.app';
    if (!slug || !token) {
        throw new Error('slug y token son requeridos para generar URL de invitación');
    }
    return `${baseUrl}/e/${slug}/${token}`;
}

/**
 * Genera un QR como imagen PNG (buffer)
 * @param {string} url - URL a codificar en el QR
 * @param {Object} options - Opciones adicionales (opcional)
 * @returns {Promise<Buffer>} Buffer de la imagen PNG
 */
async function generarQRBuffer(url, options = {}) {
    try {
        const qrOptions = { ...QR_DEFAULT_OPTIONS, ...options };
        return await QRCode.toBuffer(url, qrOptions);
    } catch (error) {
        throw new Error(`Error generando QR buffer: ${error.message}`);
    }
}

/**
 * Genera un QR como data URL (base64)
 * @param {string} url - URL a codificar en el QR
 * @param {Object} options - Opciones adicionales (opcional)
 * @returns {Promise<string>} Data URL del QR (formato: data:image/png;base64,...)
 */
async function generarQRDataURL(url, options = {}) {
    try {
        const qrOptions = { ...QR_DEFAULT_OPTIONS, ...options };
        return await QRCode.toDataURL(url, qrOptions);
    } catch (error) {
        throw new Error(`Error generando QR data URL: ${error.message}`);
    }
}

/**
 * Genera QR para un invitado específico
 * @param {Object} params - Parámetros
 * @param {string} params.slug - Slug del evento
 * @param {string} params.token - Token del invitado
 * @param {string} params.nombre - Nombre del invitado
 * @param {string} params.grupoFamiliar - Grupo familiar (opcional)
 * @param {string} formato - Formato de salida: 'png' o 'base64'
 * @returns {Promise<Object>} Resultado con QR y metadatos
 */
async function generarQRInvitado({ slug, token, nombre, grupoFamiliar }, formato = 'png') {
    const url = generarUrlInvitacion(slug, token);

    if (formato === 'base64') {
        const qrDataUrl = await generarQRDataURL(url);
        return {
            qr: qrDataUrl,
            url,
            invitado: {
                nombre,
                grupo_familiar: grupoFamiliar || null
            }
        };
    }

    const qrBuffer = await generarQRBuffer(url);
    return {
        buffer: qrBuffer,
        url,
        filename: generarNombreArchivoQR(nombre, grupoFamiliar),
        contentType: 'image/png'
    };
}

/**
 * Genera nombre de archivo para QR
 * @param {string} nombre - Nombre del invitado
 * @param {string} grupoFamiliar - Grupo familiar (opcional)
 * @returns {string} Nombre de archivo sanitizado
 */
function generarNombreArchivoQR(nombre, grupoFamiliar) {
    if (!nombre) return 'invitado.png';
    const nombreSanitizado = nombre.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '') || 'invitado';

    if (grupoFamiliar) {
        const grupoSanitizado = grupoFamiliar.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        return `${grupoSanitizado}_${nombreSanitizado}.png`;
    }

    return `${nombreSanitizado}.png`;
}

module.exports = {
    QR_DEFAULT_OPTIONS,
    generarUrlInvitacion,
    generarQRBuffer,
    generarQRDataURL,
    generarQRInvitado,
    generarNombreArchivoQR
};
