/**
 * Template HTML para email de Magic Link
 * Dic 2025 - OAuth y Magic Links
 *
 * Flujo: Usuario solicita magic link → recibe email → click → login automático
 */

/**
 * Genera el HTML del email de magic link
 * @param {Object} data - Datos del email
 * @param {string} data.nombre - Nombre del usuario
 * @param {string} data.magicLinkUrl - URL del magic link
 * @param {string} data.expira_en - Fecha de expiración
 * @returns {string} HTML del email
 */
function generateMagicLinkEmail({
    nombre,
    magicLinkUrl,
    expira_en
}) {
    // Calcular minutos restantes
    const ahora = new Date();
    const expiracion = new Date(expira_en);
    const minutosRestantes = Math.max(0, Math.round((expiracion - ahora) / (1000 * 60)));

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inicia sesión en Nexo</title>
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
            background: linear-gradient(135deg, #753572 0%, #5a2958 100%);
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
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .magic-button {
            display: inline-block;
            padding: 16px 48px;
            background-color: #753572;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 18px;
            transition: background-color 0.3s ease;
        }
        .magic-button:hover {
            background-color: #5a2958;
        }
        .timer-box {
            text-align: center;
            margin: 24px 0;
            padding: 16px;
            background: linear-gradient(135deg, #f5eef5 0%, #ebe0eb 100%);
            border-radius: 8px;
        }
        .timer-box .time {
            font-size: 32px;
            font-weight: 700;
            color: #753572;
        }
        .timer-box p {
            margin: 8px 0 0 0;
            color: #5a2958;
            font-size: 14px;
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
            color: #753572;
            text-decoration: none;
        }
        .security-box {
            margin: 24px 0;
            padding: 16px;
            background-color: #EFF6FF;
            border-left: 4px solid #3B82F6;
            border-radius: 4px;
        }
        .security-box p {
            margin: 0;
            color: #1E40AF;
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
        .email-footer .brand {
            color: #753572;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <div class="icon">🔐</div>
            <h1>Inicia sesión</h1>
            <p class="subtitle">Sin contraseña, solo un clic</p>
        </div>

        <!-- Body -->
        <div class="email-body">
            <h2>Hola ${nombre || 'Usuario'},</h2>

            <p>Recibimos una solicitud para iniciar sesión en tu cuenta de <strong>Nexo</strong>.</p>

            <p>Haz clic en el botón para acceder instantáneamente:</p>

            <!-- CTA Button -->
            <div class="button-container">
                <a href="${magicLinkUrl}" class="magic-button">
                    Iniciar Sesión
                </a>
            </div>

            <!-- Timer -->
            <div class="timer-box">
                <div class="time">${minutosRestantes} min</div>
                <p>Este enlace expira pronto</p>
            </div>

            <!-- Alternative Link -->
            <div class="alternative-link">
                <p><strong>¿No funciona el botón?</strong> Copia y pega este enlace:</p>
                <p><a href="${magicLinkUrl}">${magicLinkUrl}</a></p>
            </div>

            <!-- Security Box -->
            <div class="security-box">
                <p>🛡️ <strong>Consejo de seguridad:</strong> Si no solicitaste este enlace, puedes ignorar este email. Tu cuenta está segura.</p>
            </div>
        </div>

        <!-- Footer -->
        <div class="email-footer">
            <p><span class="brand">Nexo</span></p>
            <p>Sistema de Gestión Empresarial</p>
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
function generateMagicLinkText({
    nombre,
    magicLinkUrl,
    expira_en
}) {
    const ahora = new Date();
    const expiracion = new Date(expira_en);
    const minutosRestantes = Math.max(0, Math.round((expiracion - ahora) / (1000 * 60)));

    return `
🔐 INICIA SESIÓN EN NEXO

Hola ${nombre || 'Usuario'},

Recibimos una solicitud para iniciar sesión en tu cuenta de Nexo.

Haz clic en el siguiente enlace para acceder:
${magicLinkUrl}

⏰ Este enlace expira en ${minutosRestantes} minutos.

🛡️ CONSEJO DE SEGURIDAD:
Si no solicitaste este enlace, puedes ignorar este email. Tu cuenta está segura.

---
Nexo
Sistema de Gestión Empresarial

Este es un email automático, por favor no respondas a este mensaje.
    `.trim();
}

module.exports = {
    generateMagicLinkEmail,
    generateMagicLinkText
};
