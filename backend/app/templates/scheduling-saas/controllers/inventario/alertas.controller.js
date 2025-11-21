const { AlertasInventarioModel } = require('../../models/inventario');
const { ResponseHelper } = require('../../../../utils/helpers');
const { asyncHandler } = require('../../../../middleware');

/**
 * Controller para gestión de alertas de inventario
 * Consulta y gestión de alertas automáticas
 */
class AlertasInventarioController {

    /**
     * Listar alertas con filtros
     * GET /api/v1/inventario/alertas
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            tipo_alerta: req.query.tipo_alerta || undefined,
            nivel: req.query.nivel || undefined,
            leida: req.query.leida !== undefined ? req.query.leida === 'true' : undefined,
            producto_id: req.query.producto_id ? parseInt(req.query.producto_id) : undefined,
            fecha_desde: req.query.fecha_desde || undefined,
            fecha_hasta: req.query.fecha_hasta || undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const alertas = await AlertasInventarioModel.listar(filtros, organizacionId);

        return ResponseHelper.success(res, alertas, 'Alertas obtenidas exitosamente');
    });

    /**
     * Obtener alerta por ID
     * GET /api/v1/inventario/alertas/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const alerta = await AlertasInventarioModel.obtenerPorId(parseInt(id), organizacionId);

        if (!alerta) {
            return ResponseHelper.error(res, 'Alerta no encontrada', 404);
        }

        return ResponseHelper.success(res, alerta, 'Alerta obtenida exitosamente');
    });

    /**
     * Marcar alerta como leída
     * PATCH /api/v1/inventario/alertas/:id/marcar-leida
     */
    static marcarLeida = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const alerta = await AlertasInventarioModel.marcarLeida(parseInt(id), usuarioId, organizacionId);

        return ResponseHelper.success(res, alerta, 'Alerta marcada como leída');
    });

    /**
     * Marcar múltiples alertas como leídas
     * PATCH /api/v1/inventario/alertas/marcar-varias-leidas
     */
    static marcarVariasLeidas = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { alerta_ids } = req.body;

        if (!alerta_ids || !Array.isArray(alerta_ids) || alerta_ids.length === 0) {
            return ResponseHelper.error(
                res,
                'alerta_ids debe ser un array con al menos un ID',
                400
            );
        }

        const resultado = await AlertasInventarioModel.marcarVariasLeidas(
            alerta_ids,
            usuarioId,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            resultado,
            `${resultado.actualizadas} alerta(s) marcada(s) como leída(s)`
        );
    });

    /**
     * Obtener dashboard de alertas
     * GET /api/v1/inventario/alertas/dashboard
     */
    static obtenerDashboard = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const dashboard = await AlertasInventarioModel.obtenerDashboard(organizacionId);

        return ResponseHelper.success(res, dashboard, 'Dashboard de alertas obtenido exitosamente');
    });
}

module.exports = AlertasInventarioController;
