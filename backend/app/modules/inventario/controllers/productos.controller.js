const { ProductosModel } = require('../models');
const { ResponseHelper, ParseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

/**
 * Controller para gestión de productos
 * CRUD completo con control de stock y precios
 */
class ProductosController {

    /**
     * Crear nuevo producto
     * POST /api/v1/inventario/productos
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const producto = await ProductosModel.crear(organizacionId, req.body);

        return ResponseHelper.success(
            res,
            producto,
            'Producto creado exitosamente',
            201
        );
    });

    /**
     * Obtener producto por ID
     * GET /api/v1/inventario/productos/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const producto = await ProductosModel.buscarPorId(organizacionId, parseInt(id));

        if (!producto) {
            return ResponseHelper.error(res, 'Producto no encontrado', 404);
        }

        return ResponseHelper.success(res, producto, 'Producto obtenido exitosamente');
    });

    /**
     * Listar productos con filtros
     * GET /api/v1/inventario/productos
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Parseo centralizado con ParseHelper
        const filtros = ParseHelper.parseFilters(req.query, {
            activo: 'boolean',
            categoria_id: 'int',
            proveedor_id: 'int',
            busqueda: 'string',
            sku: 'string',
            codigo_barras: 'string',
            stock_bajo: 'boolean',
            stock_agotado: 'boolean',
            permite_venta: 'boolean',
            orden_por: 'string',
            orden_dir: 'string'
        });

        const { limit, offset } = ParseHelper.parsePagination(req.query, { defaultLimit: 50 });

        const productos = await ProductosModel.listar(organizacionId, {
            ...filtros,
            orden_dir: filtros.orden_dir || 'asc',
            limit,
            offset
        });

        return ResponseHelper.success(res, productos, 'Productos obtenidos exitosamente');
    });

    /**
     * Actualizar producto
     * PUT /api/v1/inventario/productos/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const producto = await ProductosModel.actualizar(organizacionId, parseInt(id), req.body);

        return ResponseHelper.success(res, producto, 'Producto actualizado exitosamente');
    });

    /**
     * Eliminar producto (soft delete)
     * DELETE /api/v1/inventario/productos/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await ProductosModel.eliminar(organizacionId, parseInt(id));

        return ResponseHelper.success(res, resultado, 'Producto eliminado exitosamente');
    });

    /**
     * Obtener productos con stock crítico
     * GET /api/v1/inventario/productos/stock-critico
     */
    static obtenerStockCritico = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const productos = await ProductosModel.obtenerStockCritico(organizacionId);

        return ResponseHelper.success(
            res,
            productos,
            'Productos con stock crítico obtenidos exitosamente'
        );
    });

    /**
     * Crear múltiples productos (bulk)
     * POST /api/v1/inventario/productos/bulk
     */
    static bulkCrear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { productos } = req.body;

        const resultado = await ProductosModel.bulkCrear(productos, organizacionId);

        return ResponseHelper.success(
            res,
            resultado,
            `${resultado.total} productos creados exitosamente`,
            201
        );
    });

    /**
     * Ajustar stock manualmente
     * PATCH /api/v1/inventario/productos/:id/stock
     */
    static ajustarStock = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const producto = await ProductosModel.ajustarStock(
            parseInt(id),
            req.body,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            producto,
            'Stock ajustado exitosamente'
        );
    });

    /**
     * Búsqueda avanzada de productos
     * GET /api/v1/inventario/productos/buscar
     */
    static buscar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Parseo centralizado con ParseHelper
        const filtros = {
            q: ParseHelper.parseString(req.query.q),
            tipo_busqueda: ParseHelper.parseString(req.query.tipo_busqueda) || 'all',
            categoria_id: ParseHelper.parseInt(req.query.categoria_id),
            proveedor_id: ParseHelper.parseInt(req.query.proveedor_id),
            solo_activos: ParseHelper.parseBoolean(req.query.solo_activos, true),
            solo_con_stock: ParseHelper.parseBoolean(req.query.solo_con_stock, false),
            limit: ParseHelper.parseInt(req.query.limit, 20)
        };

        const productos = await ProductosModel.buscar(filtros, organizacionId);

        return ResponseHelper.success(
            res,
            productos,
            'Búsqueda completada exitosamente'
        );
    });
}

module.exports = ProductosController;
