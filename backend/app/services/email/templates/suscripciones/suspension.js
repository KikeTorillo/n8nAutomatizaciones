/**
 * Template HTML para email de suspensión de cuenta
 * Ene 2026 - Módulo Suscripciones
 */

/**
 * Genera el HTML del email de suspensión
 * @param {Object} data - Datos del email
 * @param {string} data.nombre - Nombre del suscriptor
 * @param {string} data.planNombre - Nombre del plan
 * @param {string} data.fechaSuspension - Fecha de suspensión
 * @param {number} data.diasConservacion - Días que se conservarán los datos
 * @param {string} data.urlReactivar - URL para reactivar la cuenta
 * @returns {string} HTML del email
 */
function generateSuspensionEmail({
    nombre,
    planNombre,
    fechaSuspension,
    diasConservacion = 30,
    urlReactivar
}) {
    const fechaFormateada = new Date(fechaSuspension).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const fechaEliminacion = new Date(fechaSuspension);
    fechaEliminacion.setDate(fechaEliminacion.getDate() + diasConservacion);
    const fechaEliminacionFormateada = fechaEliminacion.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cuenta Suspendida - Nexo</title>
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
        .email-header .icon-danger {
            display: inline-block;
            width: 60px;
            height: 60px;
            background-color: #EF4444;
            border-radius: 50%;
            line-height: 60px;
            font-size: 32px;
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
        .status-box {
            background: #FEF2F2;
            border-radius: 12px;
            padding: 30px;
            margin: 24px 0;
            text-align: center;
            border: 2px solid #EF4444;
        }
        .status-box .status {
            font-size: 24px;
            font-weight: 700;
            color: #991B1B;
            margin-bottom: 8px;
        }
        .status-box .date {
            font-size: 14px;
            color: #991B1B;
        }
        .info-box {
            background: #F9FAFB;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            border: 1px solid #E5E7EB;
        }
        .info-box h3 {
            margin: 0 0 16px 0;
            color: #1F2937;
            font-size: 16px;
        }
        .info-box ul {
            margin: 0;
            padding-left: 20px;
            color: #4B5563;
        }
        .info-box li {
            margin: 8px 0;
            font-size: 14px;
        }
        .warning-box {
            background: #FEF3C7;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid #F59E0B;
            text-align: center;
        }
        .warning-box p {
            margin: 0;
            color: #92400E;
            font-size: 14px;
        }
        .warning-box .date {
            font-size: 18px;
            font-weight: 600;
            color: #92400E;
            margin-top: 8px;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .reactivate-button {
            display: inline-block;
            padding: 18px 48px;
            background-color: #753572;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            font-size: 18px;
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
            <div class="icon-danger">&#128683;</div>
            <h1>Cuenta Suspendida</h1>
            <p class="subtitle">Tu acceso ha sido desactivado</p>
        </div>

        <!-- Body -->
        <div class="email-body">
            <h2>Hola ${nombre},</h2>

            <p>Lamentamos informarte que tu cuenta ha sido suspendida debido a falta de pago.</p>

            <!-- Status -->
            <div class="status-box">
                <div class="status">Cuenta Suspendida</div>
                <div class="date">Plan: ${planNombre} | Desde: ${fechaFormateada}</div>
            </div>

            <!-- Info -->
            <div class="info-box">
                <h3>Qué significa esto:</h3>
                <ul>
                    <li>No puedes acceder a tu cuenta ni a tus datos</li>
                    <li>Todos tus datos están seguros y se conservan temporalmente</li>
                    <li>Puedes reactivar tu cuenta en cualquier momento pagando</li>
                    <li>No se realizarán cobros mientras la cuenta esté suspendida</li>
                </ul>
            </div>

            <!-- Warning -->
            <div class="warning-box">
                <p><strong>Importante:</strong> Tus datos se conservarán hasta:</p>
                <div class="date">${fechaEliminacionFormateada}</div>
                <p style="margin-top: 8px;">Después de esta fecha, los datos serán eliminados permanentemente.</p>
            </div>

            <!-- CTA -->
            <div class="button-container">
                <a href="${urlReactivar || '#'}" class="reactivate-button">
                    Reactivar mi Cuenta
                </a>
            </div>

            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. Queremos ayudarte a recuperar tu cuenta.</p>
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
 */
function generateSuspensionText({
    nombre,
    planNombre,
    fechaSuspension,
    diasConservacion = 30,
    urlReactivar
}) {
    const fechaFormateada = new Date(fechaSuspension).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const fechaEliminacion = new Date(fechaSuspension);
    fechaEliminacion.setDate(fechaEliminacion.getDate() + diasConservacion);
    const fechaEliminacionFormateada = fechaEliminacion.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
CUENTA SUSPENDIDA

Hola ${nombre},

Lamentamos informarte que tu cuenta ha sido suspendida debido a falta de pago.

ESTADO: CUENTA SUSPENDIDA
Plan: ${planNombre}
Desde: ${fechaFormateada}

QUE SIGNIFICA ESTO:
- No puedes acceder a tu cuenta ni a tus datos
- Todos tus datos están seguros y se conservan temporalmente
- Puedes reactivar tu cuenta en cualquier momento pagando
- No se realizarán cobros mientras la cuenta esté suspendida

IMPORTANTE: Tus datos se conservarán hasta:
${fechaEliminacionFormateada}
Después de esta fecha, los datos serán eliminados permanentemente.

Para reactivar tu cuenta, visita:
${urlReactivar || '[URL no disponible]'}

Si tienes alguna pregunta, no dudes en contactarnos.

---
Nexo
Sistema de Gestión Empresarial

Este es un email automático, por favor no respondas a este mensaje.
    `.trim();
}

module.exports = {
    generateSuspensionEmail,
    generateSuspensionText
};
