/**
 * ====================================================================
 * CONTROLLER - PROMOCIONES AUTOMATICAS
 * ====================================================================
 *
 * Controller para gestion de promociones automaticas en POS
 * - CRUD completo
 * - Evaluacion de promociones (motor)
 * - Aplicacion y tracking de uso
 * - Estadisticas
 *
 * Ene 2026 - Fase 3 POS
 * ====================================================================
 */

const PromocionesModel = require('../models/promociones.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');

class PromocionesController {

    /**
     * Crear promocion
     * POST /api/v1/pos/promociones
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id;

        const promocion = await PromocionesModel.crear(req.body, organizacionId, usuarioId);

        return ResponseHelper.success(res, promocion, 'Promocion creada exitosamente', 201);
    });

    /**
     * Obtener promocion por ID
     * GET /api/v1/pos/promociones/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const promocion = await PromocionesModel.obtenerPorId(parseInt(id), organizacionId);

        if (!promocion) {
            return ResponseHelper.notFound(res, 'Promocion no encontrada');
        }

        return ResponseHelper.success(res, promocion, 'Promocion obtenida exitosamente');
    });

    /**
     * Listar promociones con paginacion
     * GET /api/v1/pos/promociones
     */
    static listar = asyncHandler(async (req, res) => {
        const {
            page = 1,
            limit = 20,
            busqueda,
            activo,
            vigente,
            tipo,
            ordenPor,
            orden
        } = req.query;

        const options = {
            organizacionId: req.tenant.organizacionId,
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 100),
            busqueda,
            activo: activo !== undefined ? activo === 'true' : undefined,
            vigente: vigente !== undefined ? vigente === 'true' : undefined,
            tipo,
            ordenPor,
            orden
        };

        const resultado = await PromocionesModel.listar(options);

        return ResponseHelper.paginated(
            res,
            resultado.promociones,
            resultado.paginacion,
            'Promociones listadas exitosamente'
        );
    });

    /**
     * Listar promociones vigentes (para POS)
     * GET /api/v1/pos/promociones/vigentes
     */
    static listarVigentes = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { sucursal_id } = req.query;

        const promociones = await PromocionesModel.listarVigentes(
            organizacionId,
            sucursal_id ? parseInt(sucursal_id) : null
        );

        return ResponseHelper.success(res, promociones, 'Promociones vigentes obtenidas');
    });

    /**
     * Actualizar promocion
     * PUT /api/v1/pos/promociones/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const promocionActualizada = await PromocionesModel.actualizar(
            parseInt(id),
            req.body,
            organizacionId
        );

        if (!promocionActualizada) {
            return ResponseHelper.notFound(res, 'Promocion no encontrada');
        }

        return ResponseHelper.success(res, promocionActualizada, 'Promocion actualizada exitosamente');
    });

    /**
     * Eliminar promocion
     * DELETE /api/v1/pos/promociones/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        try {
            const eliminado = await PromocionesModel.eliminar(parseInt(id), organizacionId);

            if (!eliminado) {
                return ResponseHelper.notFound(res, 'Promocion no encontrada');
            }

            return ResponseHelper.success(res, null, 'Promocion eliminada exitosamente');
        } catch (error) {
            if (error.message.includes('ya ha sido utilizada')) {
                return ResponseHelper.badRequest(res, error.message);
            }
            throw error;
        }
    });

    /**
     * Evaluar promociones para un carrito
     * POST /api/v1/pos/promociones/evaluar
     */
    static evaluar = asyncHandler(async (req, res) => {
        const { items, subtotal, cliente_id, sucursal_id } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const promociones = await PromocionesModel.evaluar({
            organizacionId,
            items,
            subtotal,
            clienteId: cliente_id,
            sucursalId: sucursal_id || req.user?.sucursalId
        });

        // Calcular descuento total
        let descuentoTotal = 0;
        let hayExclusiva = false;

        for (const promo of promociones) {
            if (promo.exclusiva) {
                hayExclusiva = true;
                descuentoTotal = promo.descuento;
                break;
            }
            descuentoTotal += promo.descuento;
        }

        return ResponseHelper.success(res, {
            promociones,
            descuento_total: descuentoTotal,
            hay_exclusiva: hayExclusiva,
            cantidad_aplicables: promociones.length
        }, 'Promociones evaluadas');
    });

    /**
     * Aplicar promocion a una venta
     * POST /api/v1/pos/promociones/aplicar
     */
    static aplicar = asyncHandler(async (req, res) => {
        const { promocion_id, venta_pos_id, cliente_id, descuento_total, productos_aplicados } = req.body;
        const organizacionId = req.tenant.organizacionId;

        // Verificar que la promocion existe
        const promocion = await PromocionesModel.obtenerPorId(promocion_id, organizacionId);
        if (!promocion) {
            return ResponseHelper.notFound(res, 'Promocion no encontrada');
        }

        try {
            const uso = await PromocionesModel.aplicar({
                promocionId: promocion_id,
                ventaPosId: venta_pos_id,
                clienteId: cliente_id,
                descuentoTotal: descuento_total,
                productosAplicados: productos_aplicados
            });

            return ResponseHelper.success(res, uso, 'Promocion aplicada exitosamente');
        } catch (error) {
            return ResponseHelper.badRequest(res, error.message);
        }
    });

    /**
     * Obtener historial de uso de una promocion
     * GET /api/v1/pos/promociones/:id/historial
     */
    static obtenerHistorial = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const organizacionId = req.tenant.organizacionId;

        // Verificar que la promocion existe
        const promocion = await PromocionesModel.obtenerPorId(parseInt(id), organizacionId);
        if (!promocion) {
            return ResponseHelper.notFound(res, 'Promocion no encontrada');
        }

        const historial = await PromocionesModel.obtenerHistorialUso(
            parseInt(id),
            organizacionId,
            { limit: parseInt(limit), offset: parseInt(offset) }
        );

        return ResponseHelper.success(res, historial, 'Historial de uso obtenido');
    });

    /**
     * Obtener estadisticas de una promocion
     * GET /api/v1/pos/promociones/:id/estadisticas
     */
    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const estadisticas = await PromocionesModel.obtenerEstadisticas(
            parseInt(id),
            organizacionId
        );

        if (!estadisticas) {
            return ResponseHelper.notFound(res, 'Promocion no encontrada');
        }

        return ResponseHelper.success(res, estadisticas, 'Estadisticas obtenidas');
    });

    /**
     * Cambiar estado de promocion (activar/desactivar)
     * PATCH /api/v1/pos/promociones/:id/estado
     */
    static cambiarEstado = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { activo } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const promocionActualizada = await PromocionesModel.cambiarEstado(
            parseInt(id),
            activo,
            organizacionId
        );

        if (!promocionActualizada) {
            return ResponseHelper.notFound(res, 'Promocion no encontrada');
        }

        return ResponseHelper.success(
            res,
            promocionActualizada,
            `Promocion ${activo ? 'activada' : 'desactivada'} exitosamente`
        );
    });

    /**
     * Duplicar promocion
     * POST /api/v1/pos/promociones/:id/duplicar
     */
    static duplicar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id;

        // Verificar que la promocion existe
        const promocion = await PromocionesModel.obtenerPorId(parseInt(id), organizacionId);
        if (!promocion) {
            return ResponseHelper.notFound(res, 'Promocion no encontrada');
        }

        const nuevaPromocion = await PromocionesModel.duplicar(
            parseInt(id),
            organizacionId,
            usuarioId
        );

        return ResponseHelper.success(res, nuevaPromocion, 'Promocion duplicada exitosamente', 201);
    });
}

module.exports = PromocionesController;
