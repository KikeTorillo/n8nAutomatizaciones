/**
 * ====================================================================
 * CONTROLLER - PROGRAMA DE LEALTAD
 * ====================================================================
 *
 * Controller para gestión del programa de puntos de fidelización
 * - Configuración del programa
 * - Niveles de membresía
 * - Acumulación y canje de puntos
 * - Historial y estadísticas
 *
 * Ene 2026 - Fase 3 POS
 * ====================================================================
 */

const LealtadModel = require('../models/lealtad.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');

class LealtadController {

    // ========================================================================
    // CONFIGURACIÓN DEL PROGRAMA
    // ========================================================================

    /**
     * Obtener configuración del programa de lealtad
     * GET /api/v1/pos/lealtad/configuracion
     */
    static obtenerConfiguracion = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const config = await LealtadModel.obtenerConfiguracion(organizacionId);

        // Si no existe configuración, retornar valores por defecto
        if (!config) {
            return ResponseHelper.success(res, {
                activo: false,
                puntos_por_peso: 1,
                puntos_por_peso_descuento: 100,
                meses_expiracion: 12
            }, 'Programa de lealtad no configurado');
        }

        return ResponseHelper.success(res, config, 'Configuración obtenida exitosamente');
    });

    /**
     * Guardar configuración del programa de lealtad
     * PUT /api/v1/pos/lealtad/configuracion
     */
    static guardarConfiguracion = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const config = await LealtadModel.guardarConfiguracion(req.body, organizacionId);

        // Si es primera vez, crear niveles por defecto
        const niveles = await LealtadModel.listarNiveles(organizacionId);
        if (niveles.length === 0) {
            await LealtadModel.crearNivelesDefault(organizacionId);
        }

        return ResponseHelper.success(res, config, 'Configuración guardada exitosamente');
    });

    // ========================================================================
    // NIVELES DE MEMBRESÍA
    // ========================================================================

    /**
     * Listar niveles de lealtad
     * GET /api/v1/pos/lealtad/niveles
     */
    static listarNiveles = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { incluir_inactivos } = req.query;

        const niveles = await LealtadModel.listarNiveles(
            organizacionId,
            incluir_inactivos !== 'true'
        );

        return ResponseHelper.success(res, niveles, 'Niveles obtenidos exitosamente');
    });

    /**
     * Crear nivel de lealtad
     * POST /api/v1/pos/lealtad/niveles
     */
    static crearNivel = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const nivel = await LealtadModel.crearNivel(req.body, organizacionId);

        return ResponseHelper.success(res, nivel, 'Nivel creado exitosamente', 201);
    });

    /**
     * Actualizar nivel de lealtad
     * PUT /api/v1/pos/lealtad/niveles/:id
     */
    static actualizarNivel = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const nivel = await LealtadModel.actualizarNivel(
            parseInt(id),
            req.body,
            organizacionId
        );

        if (!nivel) {
            return ResponseHelper.notFound(res, 'Nivel no encontrado');
        }

        return ResponseHelper.success(res, nivel, 'Nivel actualizado exitosamente');
    });

    /**
     * Eliminar nivel de lealtad
     * DELETE /api/v1/pos/lealtad/niveles/:id
     */
    static eliminarNivel = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        try {
            const nivel = await LealtadModel.eliminarNivel(parseInt(id), organizacionId);

            if (!nivel) {
                return ResponseHelper.notFound(res, 'Nivel no encontrado');
            }

            return ResponseHelper.success(res, nivel, 'Nivel eliminado exitosamente');
        } catch (error) {
            if (error.message.includes('clientes asignados')) {
                return ResponseHelper.badRequest(res, error.message);
            }
            throw error;
        }
    });

    /**
     * Crear niveles por defecto
     * POST /api/v1/pos/lealtad/niveles/default
     */
    static crearNivelesDefault = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const niveles = await LealtadModel.crearNivelesDefault(organizacionId);

        return ResponseHelper.success(res, niveles, 'Niveles por defecto creados exitosamente', 201);
    });

    // ========================================================================
    // PUNTOS DEL CLIENTE
    // ========================================================================

    /**
     * Obtener puntos de un cliente
     * GET /api/v1/pos/lealtad/clientes/:clienteId/puntos
     */
    static obtenerPuntosCliente = asyncHandler(async (req, res) => {
        const { clienteId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const puntos = await LealtadModel.obtenerPuntosCliente(
            parseInt(clienteId),
            organizacionId
        );

        return ResponseHelper.success(res, puntos, 'Puntos obtenidos exitosamente');
    });

    /**
     * Calcular puntos que ganaría una venta (preview)
     * POST /api/v1/pos/lealtad/calcular
     */
    static calcularPuntosVenta = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const resultado = await LealtadModel.calcularPuntosVenta(req.body, organizacionId);

        return ResponseHelper.success(res, resultado, 'Cálculo realizado exitosamente');
    });

    /**
     * Validar canje de puntos (preview)
     * POST /api/v1/pos/lealtad/validar-canje
     */
    static validarCanje = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const resultado = await LealtadModel.validarCanje(req.body, organizacionId);

        return ResponseHelper.success(res, resultado, 'Validación realizada exitosamente');
    });

    /**
     * Canjear puntos por descuento
     * POST /api/v1/pos/lealtad/canjear
     */
    static canjearPuntos = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id;

        const transaccion = await LealtadModel.canjearPuntos(
            req.body,
            organizacionId,
            usuarioId
        );

        return ResponseHelper.success(res, transaccion, 'Puntos canjeados exitosamente');
    });

    /**
     * Acumular puntos por una venta
     * POST /api/v1/pos/lealtad/acumular
     */
    static acumularPuntos = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id;

        const transaccion = await LealtadModel.acumularPuntos(
            req.body,
            organizacionId,
            usuarioId
        );

        return ResponseHelper.success(res, transaccion, 'Puntos acumulados exitosamente');
    });

    /**
     * Ajuste manual de puntos (admin)
     * POST /api/v1/pos/lealtad/ajustar
     */
    static ajustarPuntos = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id;

        try {
            const transaccion = await LealtadModel.ajustarPuntos(
                req.body,
                organizacionId,
                usuarioId
            );

            return ResponseHelper.success(res, transaccion, 'Ajuste realizado exitosamente');
        } catch (error) {
            if (error.message.includes('saldo negativo')) {
                return ResponseHelper.badRequest(res, error.message);
            }
            throw error;
        }
    });

    // ========================================================================
    // HISTORIAL Y REPORTES
    // ========================================================================

    /**
     * Obtener historial de transacciones de un cliente
     * GET /api/v1/pos/lealtad/clientes/:clienteId/historial
     */
    static obtenerHistorial = asyncHandler(async (req, res) => {
        const { clienteId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const { limit = 50, offset = 0, tipo, fecha_desde, fecha_hasta } = req.query;

        const resultado = await LealtadModel.obtenerHistorial(
            parseInt(clienteId),
            {
                limit: Math.min(parseInt(limit), 100),
                offset: parseInt(offset),
                tipo,
                fecha_desde,
                fecha_hasta
            },
            organizacionId
        );

        return ResponseHelper.paginated(
            res,
            resultado.data,
            resultado.total,
            Math.ceil(resultado.total / resultado.limit),
            Math.floor(resultado.offset / resultado.limit) + 1,
            'Historial obtenido exitosamente'
        );
    });

    /**
     * Listar clientes con puntos
     * GET /api/v1/pos/lealtad/clientes
     */
    static listarClientesConPuntos = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const { limit = 50, offset = 0, busqueda, nivel_id, orden } = req.query;

        const resultado = await LealtadModel.listarClientesConPuntos(
            {
                limit: Math.min(parseInt(limit), 100),
                offset: parseInt(offset),
                busqueda,
                nivel_id: nivel_id ? parseInt(nivel_id) : null,
                orden
            },
            organizacionId
        );

        return ResponseHelper.paginated(
            res,
            resultado.data,
            resultado.total,
            Math.ceil(resultado.total / resultado.limit),
            Math.floor(resultado.offset / resultado.limit) + 1,
            'Clientes obtenidos exitosamente'
        );
    });

    /**
     * Obtener estadísticas del programa
     * GET /api/v1/pos/lealtad/estadisticas
     */
    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const stats = await LealtadModel.obtenerEstadisticas(organizacionId);

        return ResponseHelper.success(res, stats, 'Estadísticas obtenidas exitosamente');
    });
}

module.exports = LealtadController;
