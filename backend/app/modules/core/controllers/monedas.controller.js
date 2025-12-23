/**
 * ====================================================================
 * CONTROLLER - MONEDAS
 * ====================================================================
 *
 * Endpoints para gestión de monedas y tasas de cambio.
 * Módulo: Multi-Moneda (Fase 4)
 */

const MonedasModel = require('../models/monedas.model');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

class MonedasController {
    // ========================================================================
    // CATÁLOGO DE MONEDAS
    // ========================================================================

    /**
     * Listar monedas disponibles
     * GET /api/v1/monedas
     */
    static listar = asyncHandler(async (req, res) => {
        const { activas } = req.query;
        const soloActivas = activas !== 'false';

        const monedas = await MonedasModel.listar(soloActivas);

        return ResponseHelper.success(
            res,
            monedas,
            'Monedas obtenidas exitosamente'
        );
    });

    /**
     * Obtener moneda por código
     * GET /api/v1/monedas/:codigo
     */
    static obtenerPorCodigo = asyncHandler(async (req, res) => {
        const { codigo } = req.params;

        const moneda = await MonedasModel.obtenerPorCodigo(codigo);

        if (!moneda) {
            return ResponseHelper.error(res, 'Moneda no encontrada', 404);
        }

        return ResponseHelper.success(
            res,
            moneda,
            'Moneda obtenida exitosamente'
        );
    });

    // ========================================================================
    // TASAS DE CAMBIO
    // ========================================================================

    /**
     * Obtener tasa de cambio actual
     * GET /api/v1/monedas/tasas?origen=USD&destino=MXN
     */
    static obtenerTasa = asyncHandler(async (req, res) => {
        const { origen, destino, fecha } = req.query;

        if (!origen || !destino) {
            return ResponseHelper.error(
                res,
                'Se requieren los parámetros origen y destino',
                400
            );
        }

        const fechaRef = fecha ? new Date(fecha) : new Date();
        const tasa = await MonedasModel.obtenerTasa(origen, destino, fechaRef);

        if (!tasa) {
            return ResponseHelper.error(
                res,
                `No hay tasa de cambio disponible de ${origen} a ${destino}`,
                404
            );
        }

        return ResponseHelper.success(
            res,
            tasa,
            'Tasa de cambio obtenida exitosamente'
        );
    });

    /**
     * Obtener historial de tasas
     * GET /api/v1/monedas/tasas/historial?origen=USD&destino=MXN&dias=30
     */
    static obtenerHistorialTasas = asyncHandler(async (req, res) => {
        const { origen, destino, dias = 30 } = req.query;

        if (!origen || !destino) {
            return ResponseHelper.error(
                res,
                'Se requieren los parámetros origen y destino',
                400
            );
        }

        const historial = await MonedasModel.obtenerHistorialTasas(
            origen,
            destino,
            parseInt(dias)
        );

        return ResponseHelper.success(
            res,
            historial,
            'Historial de tasas obtenido exitosamente'
        );
    });

    /**
     * Guardar nueva tasa de cambio (admin)
     * POST /api/v1/monedas/tasas
     */
    static guardarTasa = asyncHandler(async (req, res) => {
        const { moneda_origen, moneda_destino, tasa, fuente } = req.body;

        // Validaciones básicas
        if (!moneda_origen || !moneda_destino || !tasa) {
            return ResponseHelper.error(
                res,
                'Se requieren moneda_origen, moneda_destino y tasa',
                400
            );
        }

        if (tasa <= 0) {
            return ResponseHelper.error(
                res,
                'La tasa debe ser mayor a 0',
                400
            );
        }

        const tasaGuardada = await MonedasModel.guardarTasa({
            moneda_origen,
            moneda_destino,
            tasa,
            fuente
        });

        return ResponseHelper.success(
            res,
            tasaGuardada,
            'Tasa de cambio guardada exitosamente',
            201
        );
    });

    // ========================================================================
    // CONVERSIÓN
    // ========================================================================

    /**
     * Convertir monto entre monedas
     * POST /api/v1/monedas/convertir
     */
    static convertir = asyncHandler(async (req, res) => {
        const { monto, origen, destino, fecha } = req.body;

        if (!monto || !origen || !destino) {
            return ResponseHelper.error(
                res,
                'Se requieren monto, origen y destino',
                400
            );
        }

        if (monto <= 0) {
            return ResponseHelper.error(
                res,
                'El monto debe ser mayor a 0',
                400
            );
        }

        try {
            const fechaRef = fecha ? new Date(fecha) : new Date();
            const conversion = await MonedasModel.convertir(
                monto,
                origen,
                destino,
                fechaRef
            );

            return ResponseHelper.success(
                res,
                conversion,
                'Conversión realizada exitosamente'
            );
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    });

    /**
     * Convertir múltiples montos
     * POST /api/v1/monedas/convertir/multiple
     */
    static convertirMultiple = asyncHandler(async (req, res) => {
        const { items, destino } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return ResponseHelper.error(
                res,
                'Se requiere un array de items con monto y moneda',
                400
            );
        }

        if (!destino) {
            return ResponseHelper.error(
                res,
                'Se requiere la moneda destino',
                400
            );
        }

        const conversiones = await MonedasModel.convertirMultiple(items, destino);

        return ResponseHelper.success(
            res,
            conversiones,
            'Conversiones realizadas exitosamente'
        );
    });
}

module.exports = MonedasController;
