const { AlertasInventarioModel } = require('../models');
const { ResponseHelper, ParseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

/**
 * Controller para gestión de alertas de inventario
 * Consulta y gestión de alertas automáticas
 */
class AlertasInventarioController {

    /**
     * Listar alertas con filtros y stock proyectado
     * GET /api/v1/inventario/alertas
     * Query params:
     *   - solo_necesitan_accion: true/false - Filtrar solo alertas que necesitan acción (sin OC pendiente)
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const { pagination, filters } = ParseHelper.parseListParams(
            req.query,
            {
                tipo_alerta: 'string',
                nivel: 'string',
                leida: 'boolean',
                producto_id: 'int',
                fecha_desde: 'string',
                fecha_hasta: 'string',
                solo_necesitan_accion: 'boolean'
            },
            { defaultLimit: 50 }
        );

        const filtros = {
            ...filters,
            limit: pagination.limit,
            offset: pagination.offset
        };

        // Usar la nueva versión con stock proyectado
        const alertas = await AlertasInventarioModel.listarConProyeccion(organizacionId, filtros);

        return ResponseHelper.success(res, alertas, 'Alertas obtenidas exitosamente');
    });

    /**
     * Obtener alerta por ID
     * GET /api/v1/inventario/alertas/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const alerta = await AlertasInventarioModel.buscarPorId(organizacionId, parseInt(id));

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
