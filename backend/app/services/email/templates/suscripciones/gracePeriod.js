/**
 * Template HTML para email de entrada a período de gracia
 * Ene 2026 - Módulo Suscripciones
 */

/**
 * Genera el HTML del email de grace period
 * @param {Object} data - Datos del email
 * @param {string} data.nombre - Nombre del suscriptor
 * @param {string} data.planNombre - Nombre del plan
 * @param {number} data.diasGracia - Días de gracia restantes
 * @param {string} data.fechaLimite - Fecha límite para renovar
 * @param {string} data.urlRenovar - URL para renovar/pagar
 * @returns {string} HTML del email
 */
function generateGracePeriodEmail({
    nombre,
    planNombre,
    diasGracia = 7,
    fechaLimite,
    urlRenovar
}) {
    const fechaFormateada = new Date(fechaLimite).toLocaleDateString('es-MX', {
        weekday: 'long',
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
    <title>Período de Gracia - Acción Urgente</title>
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
        .email-header .icon-warning {
            display: inline-block;
            width: 60px;
            height: 60px;
            background-color: #F59E0B;
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
        .urgente-badge {
            display: inline-block;
            background-color: #FEF3C7;
            color: #92400E;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .countdown-box {
            background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
            border-radius: 12px;
            padding: 30px;
            margin: 24px 0;
            text-align: center;
            border: 2px solid #F59E0B;
        }
        .countdown-box .days {
            font-size: 56px;
            font-weight: 700;
            color: #92400E;
            line-height: 1;
        }
        .countdown-box .label {
            font-size: 16px;
            color: #92400E;
            margin-top: 8px;
        }
        .warning-box {
            background: #FEF2F2;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid #EF4444;
        }
        .warning-box h3 {
            margin: 0 0 12px 0;
            color: #991B1B;
            font-size: 16px;
        }
        .warning-box ul {
            margin: 0;
            padding-left: 20px;
            color: #991B1B;
        }
        .warning-box li {
            margin: 8px 0;
            font-size: 14px;
        }
        .deadline-box {
            background: #1F2937;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
        }
        .deadline-box p {
            margin: 0;
            color: #9CA3AF;
            font-size: 14px;
        }
        .deadline-box .date {
            font-size: 20px;
            font-weight: 600;
            color: #F59E0B;
            margin-top: 8px;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .renew-button {
            display: inline-block;
            padding: 18px 48px;
            background-color: #F59E0B;
            color: #1F2937 !important;
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
            <div class="icon-warning">&#9888;</div>
            <h1>Período de Gracia</h1>
            <p class="subtitle">Tu cuenta tiene acceso limitado</p>
        </div>

        <!-- Body -->
        <div class="email-body">
            <span class="urgente-badge">&#128680; Acción urgente requerida</span>

            <h2>Hola ${nombre},</h2>

            <p>No hemos podido procesar el pago de tu suscripción <strong>${planNombre}</strong>. Tu cuenta ha entrado en período de gracia.</p>

            <!-- Countdown -->
            <div class="countdown-box">
                <div class="days">${diasGracia}</div>
                <div class="label">día${diasGracia !== 1 ? 's' : ''} para renovar tu suscripción</div>
            </div>

            <!-- Warning -->
            <div class="warning-box">
                <h3>Durante el período de gracia:</h3>
                <ul>
                    <li>Tu acceso está <strong>limitado a solo lectura</strong></li>
                    <li>No puedes crear, editar o eliminar registros</li>
                    <li>Tus datos se conservan, pero no puedes modificarlos</li>
                    <li>Si no renuevas, tu cuenta será <strong>suspendida</strong></li>
                </ul>
            </div>

            <!-- Deadline -->
            <div class="deadline-box">
                <p>Fecha límite para renovar:</p>
                <div class="date">${fechaFormateada}</div>
            </div>

            <!-- CTA -->
            <div class="button-container">
                <a href="${urlRenovar || '#'}" class="renew-button">
                    Renovar Ahora
                </a>
            </div>

            <p>Si ya realizaste el pago, este puede tardar unos minutos en reflejarse. Si tienes problemas, contáctanos.</p>
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
function generateGracePeriodText({
    nombre,
    planNombre,
    diasGracia = 7,
    fechaLimite,
    urlRenovar
}) {
    const fechaFormateada = new Date(fechaLimite).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
PERIODO DE GRACIA - ACCION URGENTE REQUERIDA

Hola ${nombre},

No hemos podido procesar el pago de tu suscripción ${planNombre}. Tu cuenta ha entrado en período de gracia.

TIENES ${diasGracia} DIA${diasGracia !== 1 ? 'S' : ''} PARA RENOVAR

DURANTE EL PERIODO DE GRACIA:
- Tu acceso está limitado a solo lectura
- No puedes crear, editar o eliminar registros
- Tus datos se conservan, pero no puedes modificarlos
- Si no renuevas, tu cuenta será suspendida

FECHA LIMITE PARA RENOVAR:
${fechaFormateada}

Para renovar tu suscripción, visita:
${urlRenovar || '[URL no disponible]'}

Si ya realizaste el pago, puede tardar unos minutos en reflejarse.

---
Nexo
Sistema de Gestión Empresarial

Este es un email automático, por favor no respondas a este mensaje.
    `.trim();
}

module.exports = {
    generateGracePeriodEmail,
    generateGracePeriodText
};
