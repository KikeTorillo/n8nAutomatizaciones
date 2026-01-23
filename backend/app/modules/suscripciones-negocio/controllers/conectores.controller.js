/**
 * ====================================================================
 * CONTROLLER: CONECTORES DE PAGO
 * ====================================================================
 * Endpoints para gestionar conectores de pago multi-tenant.
 * Cada organización puede configurar sus propios gateways (Stripe, MercadoPago).
 *
 * @module suscripciones-negocio/controllers/conectores
 * @version 1.0.0
 * @date Enero 2026
 */

const ConectoresModel = require('../models/conectores.model');
const MercadoPagoService = require('../../../services/mercadopago.service');
const { ErrorHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const logger = require('../../../utils/logger');

/**
 * GET /conectores
 * Listar conectores de la organización (sin credenciales)
 */
const listar = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId } = req.user;
    const { gateway, entorno, activo } = req.query;

    const filtros = {};
    if (gateway) filtros.gateway = gateway;
    if (entorno) filtros.entorno = entorno;
    if (activo !== undefined) filtros.activo = activo === 'true';

    const conectores = await ConectoresModel.listar(organizacionId, filtros);

    res.json({
        success: true,
        data: conectores
    });
});

/**
 * GET /conectores/:id
 * Obtener un conector por ID (sin credenciales)
 */
const obtenerPorId = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId } = req.user;
    const { id } = req.params;

    const conector = await ConectoresModel.buscarPorId(organizacionId, parseInt(id));
    ErrorHelper.throwIfNotFound(conector, 'Conector de pago');

    res.json({
        success: true,
        data: conector
    });
});

/**
 * POST /conectores
 * Crear nuevo conector de pago
 */
const crear = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId, id: usuarioId } = req.user;
    const { gateway, entorno, credenciales, nombre_display, webhook_url, webhook_secret, es_principal } = req.body;

    // Validar que el gateway no esté ya configurado para ese entorno
    const existente = await ConectoresModel.existeConector(organizacionId, gateway, entorno);
    if (existente) {
        ErrorHelper.throwConflict(`Ya existe un conector de ${gateway} para el entorno ${entorno || 'sandbox'}`);
    }

    const conector = await ConectoresModel.crear(organizacionId, {
        gateway,
        entorno: entorno || 'sandbox',
        credenciales,
        nombre_display,
        webhook_url,
        webhook_secret,
        es_principal: es_principal || false
    }, usuarioId);

    logger.info('[ConectoresController] Conector creado', {
        id: conector.id,
        organizacionId,
        gateway,
        entorno
    });

    res.status(201).json({
        success: true,
        data: conector,
        message: `Conector de ${gateway} creado exitosamente`
    });
});

/**
 * PUT /conectores/:id
 * Actualizar conector
 */
const actualizar = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId, id: usuarioId } = req.user;
    const { id } = req.params;
    const { nombre_display, credenciales, webhook_url, webhook_secret, activo, es_principal, entorno } = req.body;

    const conector = await ConectoresModel.actualizar(
        organizacionId,
        parseInt(id),
        { nombre_display, credenciales, webhook_url, webhook_secret, activo, es_principal, entorno },
        usuarioId
    );

    // Si se actualizaron credenciales, limpiar cache del servicio
    if (credenciales) {
        MercadoPagoService.clearCache(organizacionId);
    }

    res.json({
        success: true,
        data: conector,
        message: 'Conector actualizado exitosamente'
    });
});

/**
 * DELETE /conectores/:id
 * Eliminar conector
 */
const eliminar = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId } = req.user;
    const { id } = req.params;

    const eliminado = await ConectoresModel.eliminar(organizacionId, parseInt(id));

    if (!eliminado) {
        ErrorHelper.throwNotFound('Conector de pago');
    }

    // Limpiar cache del servicio
    MercadoPagoService.clearCache(organizacionId);

    res.json({
        success: true,
        message: 'Conector eliminado exitosamente'
    });
});

/**
 * POST /conectores/:id/verificar
 * Verificar conectividad del conector
 */
const verificarConectividad = asyncHandler(async (req, res) => {
    const { organizacion_id: organizacionId } = req.user;
    const { id } = req.params;

    // Verificar que el conector existe
    const conector = await ConectoresModel.buscarPorId(organizacionId, parseInt(id));
    ErrorHelper.throwIfNotFound(conector, 'Conector de pago');

    let resultado;

    // Verificar según gateway
    switch (conector.gateway) {
        case 'mercadopago':
            const mpService = await MercadoPagoService.getForOrganization(organizacionId);
            resultado = await mpService.verificarConectividad();
            break;

        case 'stripe':
            // TODO: Implementar verificación Stripe
            resultado = {
                success: false,
                message: 'Verificación de Stripe no implementada aún'
            };
            break;

        default:
            resultado = {
                success: false,
                message: `Verificación no soportada para gateway: ${conector.gateway}`
            };
    }

    // Registrar resultado de verificación
    await ConectoresModel.registrarVerificacion(
        parseInt(id),
        resultado.success,
        resultado.details || {}
    );

    res.json({
        success: true,
        data: {
            verificado: resultado.success,
            mensaje: resultado.message,
            detalles: resultado.details
        }
    });
});

/**
 * GET /conectores/gateways
 * Obtener lista de gateways soportados
 */
const listarGateways = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        data: ConectoresModel.GATEWAYS_SOPORTADOS
    });
});

module.exports = {
    listar,
    obtenerPorId,
    crear,
    actualizar,
    eliminar,
    verificarConectividad,
    listarGateways
};
