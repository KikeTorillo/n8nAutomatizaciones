/**
 * Template HTML para email de recuperación de contraseña
 */

/**
 * Genera el HTML del email de recuperación de contraseña
 * @param {Object} data - Datos del email
 * @param {string} data.nombre - Nombre del usuario
 * @param {string} data.resetUrl - URL completa para resetear contraseña
 * @param {number} data.expirationHours - Horas de expiración del token (default: 1)
 * @returns {string} HTML del email
 */
function generatePasswordResetEmail({ nombre, resetUrl, expirationHours = 1 }) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña</title>
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
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
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
        .reset-button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #3B82F6;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        .reset-button:hover {
            background-color: #2563EB;
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
            color: #3B82F6;
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
        .security-tips {
            margin-top: 24px;
            padding: 20px;
            background-color: #F0F9FF;
            border-radius: 6px;
        }
        .security-tips h3 {
            color: #1E40AF;
            margin-top: 0;
            font-size: 16px;
        }
        .security-tips ul {
            margin: 12px 0;
            padding-left: 20px;
            color: #1E40AF;
        }
        .security-tips li {
            margin: 8px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <div class="icon">🔐</div>
            <h1>Recuperación de Contraseña</h1>
        </div>

        <!-- Body -->
        <div class="email-body">
            <h2>Hola ${nombre},</h2>

            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>SaaS Agendamiento</strong>.</p>

            <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>

            <!-- CTA Button -->
            <div class="button-container">
                <a href="${resetUrl}" class="reset-button">
                    Restablecer Contraseña
                </a>
            </div>

            <!-- Alternative Link -->
            <div class="alternative-link">
                <p><strong>¿No funciona el botón?</strong> Copia y pega este enlace en tu navegador:</p>
                <p><a href="${resetUrl}">${resetUrl}</a></p>
            </div>

            <!-- Warning Box -->
            <div class="warning-box">
                <p><strong>⏰ Este enlace expirará en ${expirationHours} hora${expirationHours > 1 ? 's' : ''}.</strong></p>
            </div>

            <p>Si <strong>NO solicitaste</strong> este cambio, puedes ignorar este email de forma segura. Tu contraseña no será modificada.</p>

            <!-- Security Tips -->
            <div class="security-tips">
                <h3>🛡️ Consejos de Seguridad:</h3>
                <ul>
                    <li>Nunca compartas tu contraseña con nadie</li>
                    <li>Usa una contraseña única y robusta</li>
                    <li>Combina letras mayúsculas, minúsculas, números y símbolos</li>
                    <li>Considera usar un gestor de contraseñas</li>
                </ul>
            </div>
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
function generatePasswordResetText({ nombre, resetUrl, expirationHours = 1 }) {
    return `
Hola ${nombre},

Recibimos una solicitud para restablecer la contraseña de tu cuenta en SaaS Agendamiento.

Para crear una nueva contraseña, visita el siguiente enlace:
${resetUrl}

⏰ Este enlace expirará en ${expirationHours} hora${expirationHours > 1 ? 's' : ''}.

Si NO solicitaste este cambio, puedes ignorar este email de forma segura. Tu contraseña no será modificada.

🛡️ Consejos de Seguridad:
- Nunca compartas tu contraseña con nadie
- Usa una contraseña única y robusta
- Combina letras mayúsculas, minúsculas, números y símbolos
- Considera usar un gestor de contraseñas

---
SaaS Agendamiento
Sistema de Gestión de Citas y Agendamiento Empresarial

Este es un email automático, por favor no respondas a este mensaje.
    `.trim();
}

module.exports = {
    generatePasswordResetEmail,
    generatePasswordResetText
};
