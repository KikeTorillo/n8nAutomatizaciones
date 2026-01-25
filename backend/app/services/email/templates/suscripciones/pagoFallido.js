/**
 * Template HTML para email de pago fallido
 * Ene 2026 - Módulo Suscripciones
 */

/**
 * Genera el HTML del email de pago fallido
 * @param {Object} data - Datos del email
 * @param {string} data.nombre - Nombre del suscriptor
 * @param {string} data.planNombre - Nombre del plan
 * @param {number} data.monto - Monto que no se pudo cobrar
 * @param {string} data.moneda - Código de moneda
 * @param {string} data.razonFallo - Razón del fallo
 * @param {string} data.urlActualizar - URL para actualizar método de pago
 * @param {number} data.intentosRestantes - Intentos de cobro restantes
 * @returns {string} HTML del email
 */
function generatePagoFallidoEmail({
    nombre,
    planNombre,
    monto,
    moneda = 'MXN',
    razonFallo,
    urlActualizar,
    intentosRestantes = 2
}) {
    const montoFormateado = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: moneda
    }).format(monto);

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pago Fallido - Acción Requerida</title>
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
        .email-header .icon-error {
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
        .error-box {
            background: #FEF2F2;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid #EF4444;
        }
        .error-box h3 {
            margin: 0 0 8px 0;
            color: #991B1B;
            font-size: 16px;
        }
        .error-box p {
            margin: 0;
            color: #991B1B;
            font-size: 14px;
        }
        .details-box {
            background: #F9FAFB;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            border: 1px solid #E5E7EB;
        }
        .details-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
        }
        .details-label {
            color: #6B7280;
        }
        .details-value {
            color: #1F2937;
            font-weight: 500;
        }
        .warning-box {
            background: #FEF3C7;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            border-left: 4px solid #F59E0B;
        }
        .warning-box p {
            margin: 0;
            color: #92400E;
            font-size: 14px;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .update-button {
            display: inline-block;
            padding: 16px 40px;
            background-color: #753572;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
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
            <div class="icon-error">&#9888;</div>
            <h1>Pago Fallido</h1>
            <p class="subtitle">Acción requerida</p>
        </div>

        <!-- Body -->
        <div class="email-body">
            <h2>Hola ${nombre},</h2>

            <p>No pudimos procesar el pago de tu suscripción. Por favor, revisa los detalles a continuación:</p>

            <!-- Error -->
            <div class="error-box">
                <h3>Razón del fallo:</h3>
                <p>${razonFallo || 'Error en el procesamiento del pago'}</p>
            </div>

            <!-- Detalles -->
            <div class="details-box">
                <div class="details-row">
                    <span class="details-label">Plan</span>
                    <span class="details-value">${planNombre}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Monto</span>
                    <span class="details-value">${montoFormateado}</span>
                </div>
            </div>

            <!-- Warning -->
            <div class="warning-box">
                <p><strong>Importante:</strong> ${intentosRestantes > 0
                    ? `Intentaremos cobrar nuevamente. Tienes ${intentosRestantes} intento(s) restante(s) antes de que tu cuenta entre en período de gracia.`
                    : 'Este fue el último intento. Tu cuenta entrará en período de gracia si no actualizas tu método de pago.'
                }</p>
            </div>

            <!-- CTA -->
            <div class="button-container">
                <a href="${urlActualizar || '#'}" class="update-button">
                    Actualizar Método de Pago
                </a>
            </div>

            <p>Si necesitas ayuda, no dudes en contactarnos.</p>
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
function generatePagoFallidoText({
    nombre,
    planNombre,
    monto,
    moneda = 'MXN',
    razonFallo,
    urlActualizar,
    intentosRestantes = 2
}) {
    const montoFormateado = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: moneda
    }).format(monto);

    return `
PAGO FALLIDO - ACCION REQUERIDA

Hola ${nombre},

No pudimos procesar el pago de tu suscripción.

RAZON DEL FALLO:
${razonFallo || 'Error en el procesamiento del pago'}

DETALLES:
- Plan: ${planNombre}
- Monto: ${montoFormateado}

IMPORTANTE: ${intentosRestantes > 0
    ? `Intentaremos cobrar nuevamente. Tienes ${intentosRestantes} intento(s) restante(s).`
    : 'Este fue el último intento. Tu cuenta entrará en período de gracia.'
}

Para actualizar tu método de pago, visita:
${urlActualizar || '[URL no disponible]'}

Si necesitas ayuda, no dudes en contactarnos.

---
Nexo
Sistema de Gestión Empresarial

Este es un email automático, por favor no respondas a este mensaje.
    `.trim();
}

module.exports = {
    generatePagoFallidoEmail,
    generatePagoFallidoText
};
