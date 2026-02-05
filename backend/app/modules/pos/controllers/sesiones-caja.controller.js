const SesionesCajaModel = require('../models/sesiones-caja.model');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const logger = require('../../../utils/logger');

/**
 * Controller para gestión de Sesiones de Caja POS
 * Ene 2026: Implementación inicial
 */
class SesionesCajaController {

    /**
     * Abrir nueva sesión de caja
     * POST /api/v1/pos/sesiones-caja/abrir
     */
    static abrir = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id;
        const sucursalId = req.sucursal?.id || req.body.sucursal_id;

        if (!sucursalId) {
            return ResponseHelper.error(
                res,
                'Se requiere sucursal_id para abrir la caja',
                400
            );
        }

        const data = {
            sucursal_id: sucursalId,
            usuario_id: usuarioId,
            monto_inicial: req.body.monto_inicial || 0,
            nota_apertura: req.body.nota_apertura
        };

        const sesion = await SesionesCajaModel.abrirSesion(data, organizacionId);

        return ResponseHelper.success(
            res,
            sesion,
            'Sesión de caja abierta exitosamente',
            201
        );
    });

    /**
     * Obtener sesión activa del usuario
     * GET /api/v1/pos/sesiones-caja/activa
     */
    static obtenerActiva = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id;
        const sucursalId = req.sucursal?.id || req.query.sucursal_id;

        if (!sucursalId) {
            return ResponseHelper.error(
                res,
                'Se requiere sucursal_id para verificar sesión activa',
                400
            );
        }

        const sesion = await SesionesCajaModel.obtenerSesionActiva(
            sucursalId,
            usuarioId,
            organizacionId
        );

        if (!sesion) {
            return ResponseHelper.success(
                res,
                { activa: false, sesion: null },
                'No hay sesión de caja activa'
            );
        }

        // Calcular totales actuales
        const totales = await SesionesCajaModel.calcularTotalesSesion(
            sesion.id,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            {
                activa: true,
                sesion,
                totales
            },
            'Sesión de caja activa encontrada'
        );
    });

    /**
     * Obtener resumen de sesión para cierre
     * GET /api/v1/pos/sesiones-caja/:id/resumen
     */
    static obtenerResumen = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const sesionId = parseInt(req.params.id);

        const resumen = await SesionesCajaModel.obtenerResumen(
            sesionId,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            resumen,
            'Resumen de sesión obtenido exitosamente'
        );
    });

    /**
     * Cerrar sesión de caja
     * POST /api/v1/pos/sesiones-caja/cerrar
     */
    static cerrar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const sesionId = parseInt(req.body.sesion_id);

        if (!sesionId) {
            return ResponseHelper.error(
                res,
                'Se requiere sesion_id para cerrar la caja',
                400
            );
        }

        const data = {
            monto_contado: req.body.monto_contado,
            nota_cierre: req.body.nota_cierre,
            desglose: req.body.desglose
        };

        if (data.monto_contado === undefined || data.monto_contado === null) {
            return ResponseHelper.error(
                res,
                'Se requiere monto_contado para cerrar la caja',
                400
            );
        }

        const resultado = await SesionesCajaModel.cerrarSesion(
            sesionId,
            data,
            organizacionId
        );

        // Mensaje diferente según la diferencia
        let mensaje = 'Sesión de caja cerrada exitosamente';
        if (resultado.diferencia !== 0) {
            const tipo = resultado.diferencia > 0 ? 'sobrante' : 'faltante';
            const monto = Math.abs(resultado.diferencia).toFixed(2);
            mensaje = `Sesión cerrada con ${tipo} de $${monto}`;
        }

        return ResponseHelper.success(
            res,
            resultado,
            mensaje
        );
    });

    /**
     * Registrar movimiento de efectivo (entrada/salida)
     * POST /api/v1/pos/sesiones-caja/:id/movimiento
     */
    static registrarMovimiento = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const sesionId = parseInt(req.params.id);
        const usuarioId = req.user?.id;

        const data = {
            tipo: req.body.tipo,
            monto: req.body.monto,
            motivo: req.body.motivo,
            usuario_id: usuarioId
        };

        const movimiento = await SesionesCajaModel.registrarMovimiento(
            sesionId,
            data,
            organizacionId
        );

        const tipoTexto = data.tipo === 'entrada' ? 'Entrada' : 'Salida';

        return ResponseHelper.success(
            res,
            movimiento,
            `${tipoTexto} de efectivo registrada exitosamente`,
            201
        );
    });

    /**
     * Listar movimientos de una sesión
     * GET /api/v1/pos/sesiones-caja/:id/movimientos
     */
    static listarMovimientos = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const sesionId = parseInt(req.params.id);

        const movimientos = await SesionesCajaModel.listarMovimientos(
            sesionId,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            movimientos,
            'Movimientos obtenidos exitosamente'
        );
    });

    /**
     * Listar sesiones de caja con filtros
     * GET /api/v1/pos/sesiones-caja
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            sucursal_id: req.query.sucursal_id ? parseInt(req.query.sucursal_id) : null,
            usuario_id: req.query.usuario_id ? parseInt(req.query.usuario_id) : null,
            estado: req.query.estado,
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };

        const resultado = await SesionesCajaModel.listar(filtros, organizacionId);

        return ResponseHelper.success(
            res,
            resultado,
            'Sesiones de caja obtenidas exitosamente'
        );
    });

    /**
     * Obtener sesión por ID
     * GET /api/v1/pos/sesiones-caja/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const sesionId = parseInt(req.params.id);

        const sesion = await SesionesCajaModel.obtenerPorId(
            sesionId,
            organizacionId
        );

        if (!sesion) {
            return ResponseHelper.error(
                res,
                'Sesión de caja no encontrada',
                404
            );
        }

        return ResponseHelper.success(
            res,
            sesion,
            'Sesión de caja obtenida exitosamente'
        );
    });
}

module.exports = SesionesCajaController;
