const { ProductosModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
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

        const filtros = {
            activo: req.query.activo !== undefined ? (req.query.activo === 'true' || req.query.activo === true) : undefined,
            categoria_id: req.query.categoria_id ? parseInt(req.query.categoria_id) : undefined,
            proveedor_id: req.query.proveedor_id ? parseInt(req.query.proveedor_id) : undefined,
            busqueda: req.query.busqueda || undefined,
            sku: req.query.sku || undefined,
            codigo_barras: req.query.codigo_barras || undefined,
            stock_bajo: req.query.stock_bajo !== undefined ? (req.query.stock_bajo === 'true' || req.query.stock_bajo === true) : undefined,
            stock_agotado: req.query.stock_agotado !== undefined ? (req.query.stock_agotado === 'true' || req.query.stock_agotado === true) : undefined,
            permite_venta: req.query.permite_venta !== undefined ? (req.query.permite_venta === 'true' || req.query.permite_venta === true) : undefined,
            orden_por: req.query.orden_por || undefined,
            orden_dir: req.query.orden_dir || 'asc',
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const productos = await ProductosModel.listar(organizacionId, filtros);

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

        const filtros = {
            q: req.query.q,
            tipo_busqueda: req.query.tipo_busqueda || 'all',
            categoria_id: req.query.categoria_id ? parseInt(req.query.categoria_id) : undefined,
            proveedor_id: req.query.proveedor_id ? parseInt(req.query.proveedor_id) : undefined,
            solo_activos: req.query.solo_activos !== 'false',
            solo_con_stock: req.query.solo_con_stock === 'true',
            limit: req.query.limit ? parseInt(req.query.limit) : 20
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
