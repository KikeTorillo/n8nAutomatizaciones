/**
 * Template HTML para email de confirmación de pago exitoso
 * Ene 2026 - Módulo Suscripciones
 */

/**
 * Genera el HTML del email de pago exitoso
 * @param {Object} data - Datos del email
 * @param {string} data.nombre - Nombre del suscriptor
 * @param {string} data.planNombre - Nombre del plan
 * @param {string} data.periodo - Período de facturación
 * @param {number} data.monto - Monto pagado
 * @param {string} data.moneda - Código de moneda (MXN, USD)
 * @param {string} data.fechaPago - Fecha del pago
 * @param {string} data.fechaProximoCobro - Fecha del próximo cobro
 * @param {string} data.transaccionId - ID de la transacción (opcional)
 * @returns {string} HTML del email
 */
function generatePagoExitosoEmail({
    nombre,
    planNombre,
    periodo,
    monto,
    moneda = 'MXN',
    fechaPago,
    fechaProximoCobro,
    transaccionId
}) {
    const fechaPagoFormateada = new Date(fechaPago).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const fechaProximoFormateada = fechaProximoCobro
        ? new Date(fechaProximoCobro).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Pendiente';

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
    <title>Pago Confirmado - ${planNombre}</title>
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
        .email-header .icon-success {
            display: inline-block;
            width: 60px;
            height: 60px;
            background-color: #10B981;
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
        .receipt-box {
            background: #F9FAFB;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
            border: 1px solid #E5E7EB;
        }
        .receipt-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #E5E7EB;
        }
        .receipt-row:last-child {
            border-bottom: none;
            font-weight: 600;
            font-size: 18px;
        }
        .receipt-label {
            color: #6B7280;
        }
        .receipt-value {
            color: #1F2937;
            font-weight: 500;
        }
        .success-badge {
            display: inline-block;
            background-color: #D1FAE5;
            color: #065F46;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin: 16px 0;
        }
        .next-payment-box {
            background: linear-gradient(135deg, #f5eef5 0%, #ebe0eb 100%);
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid #753572;
            text-align: center;
        }
        .next-payment-box p {
            margin: 0;
            color: #5a2958;
        }
        .next-payment-box .date {
            font-size: 18px;
            font-weight: 600;
            color: #753572;
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
            <div class="icon-success">&#10003;</div>
            <h1>Pago Confirmado</h1>
            <p class="subtitle">Tu suscripción está activa</p>
        </div>

        <!-- Body -->
        <div class="email-body">
            <h2>Hola ${nombre},</h2>

            <p>Tu pago ha sido procesado exitosamente. Aquí tienes los detalles de tu transacción:</p>

            <span class="success-badge">Pago completado</span>

            <!-- Recibo -->
            <div class="receipt-box">
                <div class="receipt-row">
                    <span class="receipt-label">Plan</span>
                    <span class="receipt-value">${planNombre}</span>
                </div>
                <div class="receipt-row">
                    <span class="receipt-label">Período</span>
                    <span class="receipt-value">${periodo}</span>
                </div>
                <div class="receipt-row">
                    <span class="receipt-label">Fecha de pago</span>
                    <span class="receipt-value">${fechaPagoFormateada}</span>
                </div>
                ${transaccionId ? `
                <div class="receipt-row">
                    <span class="receipt-label">ID Transacción</span>
                    <span class="receipt-value">${transaccionId}</span>
                </div>
                ` : ''}
                <div class="receipt-row">
                    <span class="receipt-label">Total pagado</span>
                    <span class="receipt-value">${montoFormateado}</span>
                </div>
            </div>

            <!-- Próximo cobro -->
            <div class="next-payment-box">
                <p>Tu próximo cobro será el:</p>
                <p class="date">${fechaProximoFormateada}</p>
            </div>

            <p>Si tienes alguna pregunta sobre tu suscripción, no dudes en contactarnos.</p>

            <p>Gracias por confiar en nosotros.</p>
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
function generatePagoExitosoText({
    nombre,
    planNombre,
    periodo,
    monto,
    moneda = 'MXN',
    fechaPago,
    fechaProximoCobro,
    transaccionId
}) {
    const fechaPagoFormateada = new Date(fechaPago).toLocaleDateString('es-MX', {
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
PAGO CONFIRMADO

Hola ${nombre},

Tu pago ha sido procesado exitosamente.

DETALLES DE LA TRANSACCION:
- Plan: ${planNombre}
- Período: ${periodo}
- Fecha de pago: ${fechaPagoFormateada}
${transaccionId ? `- ID Transacción: ${transaccionId}` : ''}
- Total pagado: ${montoFormateado}

Tu próximo cobro será el: ${fechaProximoCobro ? new Date(fechaProximoCobro).toLocaleDateString('es-MX') : 'Pendiente'}

Si tienes alguna pregunta, no dudes en contactarnos.

Gracias por confiar en nosotros.

---
Nexo
Sistema de Gestión Empresarial

Este es un email automático, por favor no respondas a este mensaje.
    `.trim();
}

module.exports = {
    generatePagoExitosoEmail,
    generatePagoExitosoText
};
