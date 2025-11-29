/**
 * Template HTML para email de activación de cuenta
 * Nov 2025 - Fase 2: Onboarding Simplificado
 *
 * Basado en: invitacionProfesional.js
 */

/**
 * Genera el HTML del email de activación
 * @param {Object} data - Datos del email
 * @param {string} data.nombre - Nombre del usuario
 * @param {string} data.activacionUrl - URL para activar la cuenta
 * @param {string} data.nombre_negocio - Nombre del negocio registrado
 * @param {string} data.expira_en - Fecha de expiración
 * @param {boolean} data.es_reenvio - Si es un reenvío
 * @returns {string} HTML del email
 */
function generateActivacionEmail({
    nombre,
    activacionUrl,
    nombre_negocio,
    expira_en,
    es_reenvio = false
}) {
    const fechaExpiracion = new Date(expira_en).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activa tu cuenta - ${nombre_negocio}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .email-header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .email-header .icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .email-header .subtitle {
            color: rgba(255,255,255,0.9);
            font-size: 16px;
            margin-top: 8px;
        }
        .email-body {
            padding: 40px 30px;
        }
        .email-body h2 {
            color: #1F2937;
            margin-top: 0;
            font-size: 20px;
        }
        .email-body p {
            color: #4B5563;
            margin: 16px 0;
        }
        .highlight-box {
            background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid #2563EB;
        }
        .highlight-box h3 {
            margin: 0 0 12px 0;
            color: #1E40AF;
            font-size: 16px;
        }
        .highlight-box p {
            margin: 8px 0;
            color: #1E40AF;
            font-size: 14px;
        }
        .highlight-box .negocio {
            font-size: 18px;
            font-weight: 600;
            color: #2563EB;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .activate-button {
            display: inline-block;
            padding: 16px 40px;
            background-color: #2563EB;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 18px;
            transition: background-color 0.3s ease;
        }
        .activate-button:hover {
            background-color: #1D4ED8;
        }
        .alternative-link {
            margin-top: 24px;
            padding: 16px;
            background-color: #F3F4F6;
            border-radius: 6px;
            font-size: 13px;
            color: #6B7280;
            word-break: break-all;
        }
        .alternative-link p {
            margin: 4px 0;
            font-size: 13px;
        }
        .alternative-link a {
            color: #2563EB;
            text-decoration: none;
        }
        .warning-box {
            margin: 24px 0;
            padding: 16px;
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            border-radius: 4px;
        }
        .warning-box p {
            margin: 0;
            color: #92400E;
            font-size: 14px;
        }
        .steps-box {
            margin: 24px 0;
            padding: 20px;
            background-color: #F0F9FF;
            border-radius: 6px;
        }
        .steps-box h3 {
            color: #1E40AF;
            margin-top: 0;
            font-size: 16px;
        }
        .steps-box ol {
            margin: 12px 0;
            padding-left: 24px;
            color: #1E40AF;
        }
        .steps-box li {
            margin: 10px 0;
            font-size: 14px;
        }
        .email-footer {
            padding: 30px;
            background-color: #F9FAFB;
            text-align: center;
            border-top: 1px solid #E5E7EB;
        }
        .email-footer p {
            margin: 8px 0;
            font-size: 13px;
            color: #6B7280;
        }
        .reenvio-badge {
            display: inline-block;
            background-color: #FEF3C7;
            color: #92400E;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <div class="icon">🚀</div>
            <h1>¡Activa tu cuenta!</h1>
            <p class="subtitle">Solo falta un paso</p>
        </div>

        <!-- Body -->
        <div class="email-body">
            ${es_reenvio ? '<span class="reenvio-badge">📨 Enlace reenviado</span>' : ''}

            <h2>Hola ${nombre},</h2>

            <p>Gracias por registrarte. Tu negocio está casi listo para comenzar.</p>

            <!-- Negocio registrado -->
            <div class="highlight-box">
                <h3>🏢 Tu negocio:</h3>
                <p class="negocio">${nombre_negocio}</p>
                <p>Haz clic en el botón para crear tu contraseña y acceder.</p>
            </div>

            <!-- CTA Button -->
            <div class="button-container">
                <a href="${activacionUrl}" class="activate-button">
                    Activar mi Cuenta
                </a>
            </div>

            <!-- Pasos -->
            <div class="steps-box">
                <h3>📝 Solo 2 pasos:</h3>
                <ol>
                    <li>Haz clic en el botón "Activar mi Cuenta"</li>
                    <li>Crea tu contraseña segura y ¡listo!</li>
                </ol>
            </div>

            <!-- Alternative Link -->
            <div class="alternative-link">
                <p><strong>¿No funciona el botón?</strong> Copia y pega este enlace en tu navegador:</p>
                <p><a href="${activacionUrl}">${activacionUrl}</a></p>
            </div>

            <!-- Warning Box -->
            <div class="warning-box">
                <p><strong>⏰ Este enlace expira el:</strong></p>
                <p>${fechaExpiracion}</p>
            </div>

            <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
        </div>

        <!-- Footer -->
        <div class="email-footer">
            <p><strong>SaaS Agendamiento</strong></p>
            <p>Sistema de Gestión de Citas y Agendamiento Empresarial</p>
            <p style="margin-top: 16px; font-size: 12px;">
                Este es un email automático, por favor no respondas a este mensaje.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Genera la versión de texto plano del email
 * @param {Object} data - Datos del email
 * @returns {string} Texto plano del email
 */
function generateActivacionText({
    nombre,
    activacionUrl,
    nombre_negocio,
    expira_en,
    es_reenvio = false
}) {
    const fechaExpiracion = new Date(expira_en).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
${es_reenvio ? '📨 ENLACE REENVIADO\n\n' : ''}¡Hola ${nombre}!

Gracias por registrarte. Tu negocio está casi listo para comenzar.

🏢 TU NEGOCIO:
${nombre_negocio}

Para activar tu cuenta, visita el siguiente enlace:
${activacionUrl}

📝 SOLO 2 PASOS:
1. Haz clic en el enlace de arriba
2. Crea tu contraseña segura y ¡listo!

⏰ Este enlace expira el: ${fechaExpiracion}

Si no creaste esta cuenta, puedes ignorar este mensaje.

---
SaaS Agendamiento
Sistema de Gestión de Citas y Agendamiento Empresarial

Este es un email automático, por favor no respondas a este mensaje.
    `.trim();
}

module.exports = {
    generateActivacionEmail,
    generateActivacionText
};
