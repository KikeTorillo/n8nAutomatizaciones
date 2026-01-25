/**
 * Template HTML para email de recordatorio de cobro (3 días antes)
 * Ene 2026 - Módulo Suscripciones
 */

/**
 * Genera el HTML del email de recordatorio
 * @param {Object} data - Datos del email
 * @param {string} data.nombre - Nombre del suscriptor
 * @param {string} data.planNombre - Nombre del plan
 * @param {number} data.monto - Monto a cobrar
 * @param {string} data.moneda - Código de moneda
 * @param {string} data.fechaCobro - Fecha del próximo cobro
 * @param {number} data.diasRestantes - Días hasta el cobro
 * @returns {string} HTML del email
 */
function generateRecordatorioCobroEmail({
    nombre,
    planNombre,
    monto,
    moneda = 'MXN',
    fechaCobro,
    diasRestantes = 3
}) {
    const fechaFormateada = new Date(fechaCobro).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

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
    <title>Recordatorio de Cobro - ${planNombre}</title>
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
        .countdown-box {
            background: linear-gradient(135deg, #f5eef5 0%, #ebe0eb 100%);
            border-radius: 12px;
            padding: 30px;
            margin: 24px 0;
            text-align: center;
            border: 2px solid #753572;
        }
        .countdown-box .days {
            font-size: 48px;
            font-weight: 700;
            color: #753572;
            line-height: 1;
        }
        .countdown-box .label {
            font-size: 16px;
            color: #5a2958;
            margin-top: 8px;
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
            padding: 12px 0;
            border-bottom: 1px solid #E5E7EB;
        }
        .details-row:last-child {
            border-bottom: none;
            font-weight: 600;
        }
        .details-label {
            color: #6B7280;
        }
        .details-value {
            color: #1F2937;
            font-weight: 500;
        }
        .info-box {
            background: #EFF6FF;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            border-left: 4px solid #3B82F6;
        }
        .info-box p {
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
            <div class="icon">&#128197;</div>
            <h1>Recordatorio de Cobro</h1>
            <p class="subtitle">Tu suscripción se renovará pronto</p>
        </div>

        <!-- Body -->
        <div class="email-body">
            <h2>Hola ${nombre},</h2>

            <p>Te recordamos que tu suscripción se renovará automáticamente en los próximos días.</p>

            <!-- Countdown -->
            <div class="countdown-box">
                <div class="days">${diasRestantes}</div>
                <div class="label">día${diasRestantes !== 1 ? 's' : ''} para tu próximo cobro</div>
            </div>

            <!-- Detalles -->
            <div class="details-box">
                <div class="details-row">
                    <span class="details-label">Plan</span>
                    <span class="details-value">${planNombre}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Fecha de cobro</span>
                    <span class="details-value">${fechaFormateada}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Monto a cobrar</span>
                    <span class="details-value">${montoFormateado}</span>
                </div>
            </div>

            <!-- Info -->
            <div class="info-box">
                <p>Asegúrate de tener fondos suficientes en tu método de pago registrado para evitar interrupciones en el servicio.</p>
            </div>

            <p>Si deseas cambiar de plan o actualizar tu método de pago, puedes hacerlo desde tu panel de control.</p>

            <p>Gracias por ser parte de Nexo.</p>
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
function generateRecordatorioCobroText({
    nombre,
    planNombre,
    monto,
    moneda = 'MXN',
    fechaCobro,
    diasRestantes = 3
}) {
    const fechaFormateada = new Date(fechaCobro).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const montoFormateado = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: moneda
    }).format(monto);

    return `
RECORDATORIO DE COBRO

Hola ${nombre},

Te recordamos que tu suscripción se renovará automáticamente en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}.

DETALLES:
- Plan: ${planNombre}
- Fecha de cobro: ${fechaFormateada}
- Monto a cobrar: ${montoFormateado}

Asegúrate de tener fondos suficientes en tu método de pago registrado.

Si deseas cambiar de plan o actualizar tu método de pago, puedes hacerlo desde tu panel de control.

Gracias por ser parte de Nexo.

---
Nexo
Sistema de Gestión Empresarial

Este es un email automático, por favor no respondas a este mensaje.
    `.trim();
}

module.exports = {
    generateRecordatorioCobroEmail,
    generateRecordatorioCobroText
};
