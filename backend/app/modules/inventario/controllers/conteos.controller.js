const { ConteosModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const logger = require('../../../utils/logger');

/**
 * Controller para gestión de Conteos de Inventario (Conteo Físico)
 * CRUD completo + flujo de estados + aplicación de ajustes
 */
class ConteosController {

    // ========================================================================
    // CRUD BÁSICO
    // ========================================================================

    /**
     * Crear nuevo conteo de inventario
     * POST /api/v1/inventario/conteos
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const conteo = await ConteosModel.crear(organizacionId, {
            ...req.body,
            usuario_creador_id: req.user.id
        });

        return ResponseHelper.success(
            res,
            conteo,
            'Conteo de inventario creado exitosamente',
            201
        );
    });

    /**
     * Obtener conteo por ID con items
     * GET /api/v1/inventario/conteos/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const conteo = await ConteosModel.buscarPorId(organizacionId, parseInt(id));

        if (!conteo) {
            return ResponseHelper.error(res, 'Conteo no encontrado', 404);
        }

        return ResponseHelper.success(res, conteo, 'Conteo obtenido exitosamente');
    });

    /**
     * Listar conteos con filtros
     * GET /api/v1/inventario/conteos
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            sucursal_id: req.query.sucursal_id ? parseInt(req.query.sucursal_id) : undefined,
            estado: req.query.estado || undefined,
            tipo_conteo: req.query.tipo_conteo || undefined,
            fecha_desde: req.query.fecha_desde || undefined,
            fecha_hasta: req.query.fecha_hasta || undefined,
            folio: req.query.folio || undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const resultado = await ConteosModel.listar(organizacionId, filtros);

        return ResponseHelper.success(res, resultado, 'Conteos obtenidos exitosamente');
    });

    // ========================================================================
    // FLUJO DE ESTADOS
    // ========================================================================

    /**
     * Iniciar conteo (genera items y cambia a en_proceso)
     * POST /api/v1/inventario/conteos/:id/iniciar
     */
    static iniciar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const conteo = await ConteosModel.iniciar(parseInt(id), organizacionId);

        return ResponseHelper.success(
            res,
            conteo,
            `Conteo iniciado. ${conteo.resumen.total} productos para contar.`
        );
    });

    /**
     * Registrar cantidad contada para un item
     * PUT /api/v1/inventario/conteos/items/:itemId
     */
    static registrarConteo = asyncHandler(async (req, res) => {
        const { itemId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const item = await ConteosModel.registrarConteo(
            parseInt(itemId),
            {
                ...req.body,
                usuario_id: req.user.id
            },
            organizacionId
        );

        const diferencia = item.cantidad_contada - item.cantidad_sistema;
        const mensajeDiferencia = diferencia === 0
            ? 'Sin diferencia'
            : `Diferencia: ${diferencia > 0 ? '+' : ''}${diferencia}`;

        return ResponseHelper.success(
            res,
            item,
            `Conteo registrado. ${mensajeDiferencia}`
        );
    });

    /**
     * Completar conteo (validar que todos estén contados)
     * POST /api/v1/inventario/conteos/:id/completar
     */
    static completar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const conteo = await ConteosModel.completar(parseInt(id), organizacionId);

        return ResponseHelper.success(
            res,
            conteo,
            `Conteo completado. ${conteo.resumen.con_diferencia} item(s) con diferencia.`
        );
    });

    /**
     * Aplicar ajustes de inventario basados en el conteo
     * POST /api/v1/inventario/conteos/:id/aplicar-ajustes
     */
    static aplicarAjustes = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await ConteosModel.aplicarAjustes(
            parseInt(id),
            req.user.id,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            resultado,
            `Ajustes aplicados. ${resultado.ajustes_realizados.length} movimiento(s) de inventario creado(s).`
        );
    });

    /**
     * Cancelar conteo
     * POST /api/v1/inventario/conteos/:id/cancelar
     */
    static cancelar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { motivo } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const conteo = await ConteosModel.cancelar(
            parseInt(id),
            motivo,
            req.user.id,
            organizacionId
        );

        return ResponseHelper.success(res, conteo, 'Conteo cancelado exitosamente');
    });

    // ========================================================================
    // UTILIDADES
    // ========================================================================

    /**
     * Buscar item por código de barras o SKU
     * GET /api/v1/inventario/conteos/:id/buscar-item
     */
    static buscarItem = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { codigo } = req.query;
        const organizacionId = req.tenant.organizacionId;

        if (!codigo) {
            return ResponseHelper.error(res, 'Debe proporcionar un código de barras o SKU', 400);
        }

        const item = await ConteosModel.buscarItemPorCodigo(
            parseInt(id),
            codigo,
            organizacionId
        );

        if (!item) {
            return ResponseHelper.error(
                res,
                `Producto con código "${codigo}" no encontrado en este conteo`,
                404
            );
        }

        return ResponseHelper.success(res, item, 'Producto encontrado');
    });

    /**
     * Obtener estadísticas de conteos
     * GET /api/v1/inventario/conteos/estadisticas
     */
    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const fechaDesde = req.query.fecha_desde || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const fechaHasta = req.query.fecha_hasta || new Date().toISOString();

        const estadisticas = await ConteosModel.obtenerEstadisticas(
            organizacionId,
            fechaDesde,
            fechaHasta
        );

        return ResponseHelper.success(res, estadisticas, 'Estadísticas obtenidas exitosamente');
    });
}

module.exports = ConteosController;
