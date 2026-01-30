/**
 * ====================================================================
 * CONTROLLER: USO DE USUARIOS (SEAT-BASED BILLING)
 * ====================================================================
 * Endpoints para consultar uso de usuarios y proyecciones de facturación.
 *
 * @module controllers/uso
 * @version 1.0.0
 * @date Enero 2026
 */

const asyncHandler = require('../../../middleware/asyncHandler');
const UsageTrackingService = require('../services/usage-tracking.service');
const { SuscripcionesModel } = require('../models');
const { ResponseHelper, ErrorHelper } = require('../../../utils/helpers');

class UsoController {

    /**
     * Obtener resumen de uso de usuarios
     * GET /api/v1/suscripciones-negocio/uso/resumen
     *
     * Devuelve información sobre:
     * - Usuarios actuales vs incluidos en el plan
     * - Porcentaje de uso
     * - Costo adicional proyectado
     * - Estado (normal, advertencia, excedido)
     */
    static obtenerResumen = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Obtener resumen por organización
        const resumen = await UsageTrackingService.obtenerResumenUsoPorOrganizacion(organizacionId);

        if (!resumen) {
            return ResponseHelper.success(res, {
                tieneSuscripcion: false,
                mensaje: 'No hay suscripción activa'
            });
        }

        return ResponseHelper.success(res, resumen);
    });

    /**
     * Obtener historial de uso de usuarios
     * GET /api/v1/suscripciones-negocio/uso/historial
     *
     * Query params:
     * - dias: Número de días hacia atrás (default 30)
     *
     * Devuelve array con:
     * - fecha, usuarios_activos, usuarios_incluidos, usuarios_extra
     */
    static obtenerHistorial = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const dias = parseInt(req.query.dias) || 30;

        // Buscar suscripción activa
        const suscripcion = await SuscripcionesModel.buscarActivaPorOrganizacion(organizacionId);

        if (!suscripcion) {
            return ResponseHelper.success(res, {
                items: [],
                mensaje: 'No hay suscripción activa'
            });
        }

        const historial = await UsageTrackingService.obtenerHistorialUso(suscripcion.id, dias);

        return ResponseHelper.success(res, {
            items: historial,
            dias,
            suscripcionId: suscripcion.id
        });
    });

    /**
     * Obtener proyección del próximo cobro
     * GET /api/v1/suscripciones-negocio/uso/proyeccion
     *
     * Devuelve:
     * - Monto base del plan
     * - Ajuste por usuarios adicionales
     * - Créditos pendientes
     * - Total proyectado
     * - Fecha del próximo cobro
     */
    static obtenerProyeccion = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Buscar suscripción activa
        const suscripcion = await SuscripcionesModel.buscarActivaPorOrganizacion(organizacionId);

        if (!suscripcion) {
            return ResponseHelper.success(res, {
                tieneSuscripcion: false,
                mensaje: 'No hay suscripción activa'
            });
        }

        // Calcular ajuste por usuarios
        const ajusteUsuarios = await UsageTrackingService.calcularAjusteUsuarios(suscripcion.id);

        const precioBase = parseFloat(suscripcion.precio_actual) || 0;
        const creditoPendiente = parseFloat(suscripcion.credito_pendiente) || 0;
        const ajustePendiente = parseFloat(suscripcion.ajuste_pendiente) || 0;

        const totalProyectado = precioBase + ajusteUsuarios.monto + ajustePendiente - creditoPendiente;

        return ResponseHelper.success(res, {
            // Desglose
            precioBase,
            ajusteUsuarios: {
                monto: ajusteUsuarios.monto,
                usuariosIncluidos: ajusteUsuarios.usuariosIncluidos,
                usuariosMax: ajusteUsuarios.usuariosMax,
                usuariosExtra: ajusteUsuarios.usuariosExtra,
                precioUnitario: ajusteUsuarios.precioUnitario,
                mensaje: ajusteUsuarios.mensaje
            },
            ajustePendiente,
            creditoPendiente,

            // Total
            totalProyectado: Math.max(0, totalProyectado),

            // Contexto
            fechaProximoCobro: suscripcion.fecha_proximo_cobro,
            planNombre: suscripcion.plan_nombre,
            moneda: suscripcion.moneda || 'MXN',
            periodo: suscripcion.periodo
        });
    });

    /**
     * Verificar si se puede crear un usuario (para formularios)
     * GET /api/v1/suscripciones-negocio/uso/verificar-limite
     *
     * Query params:
     * - cantidad: Número de usuarios a crear (default 1)
     *
     * Usado por el frontend antes de mostrar formulario de creación de usuario
     * para advertir sobre costos adicionales o bloquear si es hard limit.
     */
    static verificarLimite = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const cantidad = parseInt(req.query.cantidad) || 1;

        const resultado = await UsageTrackingService.verificarLimiteConAjuste(organizacionId, cantidad);

        return ResponseHelper.success(res, resultado);
    });
}

module.exports = UsoController;
