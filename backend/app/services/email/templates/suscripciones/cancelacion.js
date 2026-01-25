/**
 * Template HTML para email de confirmación de cancelación
 * Ene 2026 - Módulo Suscripciones
 */

/**
 * Genera el HTML del email de cancelación
 * @param {Object} data - Datos del email
 * @param {string} data.nombre - Nombre del suscriptor
 * @param {string} data.planNombre - Nombre del plan cancelado
 * @param {string} data.fechaCancelacion - Fecha de cancelación
 * @param {string} data.fechaAccesoHasta - Fecha hasta la cual tendrá acceso
 * @param {string} data.motivoCancelacion - Motivo proporcionado por el usuario
 * @param {string} data.urlReactivar - URL para reactivar si cambia de opinión
 * @returns {string} HTML del email
 */
function generateCancelacionEmail({
    nombre,
    planNombre,
    fechaCancelacion,
    fechaAccesoHasta,
    motivoCancelacion,
    urlReactivar
}) {
    const fechaCancelacionFormateada = new Date(fechaCancelacion).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const fechaAccesoFormateada = fechaAccesoHasta
        ? new Date(fechaAccesoHasta).toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Inmediato';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Suscripción Cancelada - Nexo</title>
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
        .cancelled-badge {
            display: inline-block;
            background-color: #F3F4F6;
            color: #4B5563;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
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
        }
        .details-label {
            color: #6B7280;
        }
        .details-value {
            color: #1F2937;
            font-weight: 500;
        }
        .access-box {
            background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid #3B82F6;
            text-align: center;
        }
        .access-box p {
            margin: 0;
            color: #1E40AF;
            font-size: 14px;
        }
        .access-box .date {
            font-size: 18px;
            font-weight: 600;
            color: #1D4ED8;
            margin-top: 8px;
        }
        .motivo-box {
            background: #F3F4F6;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            font-style: italic;
        }
        .motivo-box p {
            margin: 0;
            color: #4B5563;
            font-size: 14px;
        }
        .motivo-box .label {
            font-style: normal;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
        }
        .comeback-box {
            background: linear-gradient(135deg, #f5eef5 0%, #ebe0eb 100%);
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
            text-align: center;
            border: 1px solid #753572;
        }
        .comeback-box h3 {
            margin: 0 0 12px 0;
            color: #5a2958;
            font-size: 18px;
        }
        .comeback-box p {
            margin: 0 0 16px 0;
            color: #5a2958;
            font-size: 14px;
        }
        .reactivate-button {
            display: inline-block;
            padding: 12px 32px;
            background-color: #753572;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
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
            <div class="icon">&#128075;</div>
            <h1>Suscripción Cancelada</h1>
            <p class="subtitle">Confirmación de cancelación</p>
        </div>

        <!-- Body -->
        <div class="email-body">
            <span class="cancelled-badge">Cancelación confirmada</span>

            <h2>Hola ${nombre},</h2>

            <p>Hemos procesado la cancelación de tu suscripción. Lamentamos verte partir.</p>

            <!-- Detalles -->
            <div class="details-box">
                <div class="details-row">
                    <span class="details-label">Plan cancelado</span>
                    <span class="details-value">${planNombre}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Fecha de cancelación</span>
                    <span class="details-value">${fechaCancelacionFormateada}</span>
                </div>
            </div>

            <!-- Acceso hasta -->
            <div class="access-box">
                <p>Mantendrás acceso completo hasta:</p>
                <div class="date">${fechaAccesoFormateada}</div>
            </div>

            <!-- Motivo (si se proporcionó) -->
            ${motivoCancelacion ? `
            <div class="motivo-box">
                <p class="label">Tu motivo de cancelación:</p>
                <p>"${motivoCancelacion}"</p>
            </div>
            ` : ''}

            <p>Tus datos se conservarán durante 30 días después de que termine tu acceso. Puedes volver en cualquier momento.</p>

            <!-- Comeback box -->
            <div class="comeback-box">
                <h3>¿Cambiaste de opinión?</h3>
                <p>Siempre eres bienvenido de vuelta. Puedes reactivar tu suscripción en cualquier momento.</p>
                <a href="${urlReactivar || '#'}" class="reactivate-button">
                    Reactivar Suscripción
                </a>
            </div>

            <p>Gracias por haber sido parte de Nexo. Esperamos verte pronto.</p>
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
function generateCancelacionText({
    nombre,
    planNombre,
    fechaCancelacion,
    fechaAccesoHasta,
    motivoCancelacion,
    urlReactivar
}) {
    const fechaCancelacionFormateada = new Date(fechaCancelacion).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const fechaAccesoFormateada = fechaAccesoHasta
        ? new Date(fechaAccesoHasta).toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Inmediato';

    return `
SUSCRIPCION CANCELADA

Hola ${nombre},

Hemos procesado la cancelación de tu suscripción. Lamentamos verte partir.

DETALLES:
- Plan cancelado: ${planNombre}
- Fecha de cancelación: ${fechaCancelacionFormateada}

ACCESO HASTA:
${fechaAccesoFormateada}

${motivoCancelacion ? `TU MOTIVO DE CANCELACION:
"${motivoCancelacion}"

` : ''}Tus datos se conservarán durante 30 días después de que termine tu acceso.

CAMBIASTE DE OPINION?
Siempre eres bienvenido de vuelta. Puedes reactivar tu suscripción en:
${urlReactivar || '[URL no disponible]'}

Gracias por haber sido parte de Nexo. Esperamos verte pronto.

---
Nexo
Sistema de Gestión Empresarial

Este es un email automático, por favor no respondas a este mensaje.
    `.trim();
}

module.exports = {
    generateCancelacionEmail,
    generateCancelacionText
};
