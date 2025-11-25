/**
 * Index de Controllers de Inventario - Módulos especializados combinados
 * Combina categorías, proveedores, productos, movimientos y alertas
 */

const CategoriasProductosController = require('./categorias.controller');
const ProveedoresController = require('./proveedores.controller');
const ProductosController = require('./productos.controller');
const MovimientosInventarioController = require('./movimientos.controller');
const AlertasInventarioController = require('./alertas.controller');
const ReportesInventarioController = require('./reportes.controller');

/**
 * Controller principal que combina todos los módulos especializados
 * Exporta métodos de todos los sub-controllers
 */
class InventarioMainController {

    // ===================================================================
    // 🏷️ ENDPOINTS CATEGORÍAS
    // ===================================================================

    static crearCategoria(req, res) {
        return CategoriasProductosController.crear(req, res);
    }

    static obtenerCategoriaPorId(req, res) {
        return CategoriasProductosController.obtenerPorId(req, res);
    }

    static listarCategorias(req, res) {
        return CategoriasProductosController.listar(req, res);
    }

    static obtenerArbolCategorias(req, res) {
        return CategoriasProductosController.obtenerArbol(req, res);
    }

    static actualizarCategoria(req, res) {
        return CategoriasProductosController.actualizar(req, res);
    }

    static eliminarCategoria(req, res) {
        return CategoriasProductosController.eliminar(req, res);
    }

    // ===================================================================
    // 🏢 ENDPOINTS PROVEEDORES
    // ===================================================================

    static crearProveedor(req, res) {
        return ProveedoresController.crear(req, res);
    }

    static obtenerProveedorPorId(req, res) {
        return ProveedoresController.obtenerPorId(req, res);
    }

    static listarProveedores(req, res) {
        return ProveedoresController.listar(req, res);
    }

    static actualizarProveedor(req, res) {
        return ProveedoresController.actualizar(req, res);
    }

    static eliminarProveedor(req, res) {
        return ProveedoresController.eliminar(req, res);
    }

    // ===================================================================
    // 📦 ENDPOINTS PRODUCTOS
    // ===================================================================

    static crearProducto(req, res) {
        return ProductosController.crear(req, res);
    }

    static obtenerProductoPorId(req, res) {
        return ProductosController.obtenerPorId(req, res);
    }

    static listarProductos(req, res) {
        return ProductosController.listar(req, res);
    }

    static actualizarProducto(req, res) {
        return ProductosController.actualizar(req, res);
    }

    static eliminarProducto(req, res) {
        return ProductosController.eliminar(req, res);
    }

    static obtenerStockCritico(req, res) {
        return ProductosController.obtenerStockCritico(req, res);
    }

    static bulkCrearProductos(req, res) {
        return ProductosController.bulkCrear(req, res);
    }

    static ajustarStockProducto(req, res) {
        return ProductosController.ajustarStock(req, res);
    }

    static buscarProductos(req, res) {
        return ProductosController.buscar(req, res);
    }

    // ===================================================================
    // 📊 ENDPOINTS MOVIMIENTOS
    // ===================================================================

    static registrarMovimiento(req, res) {
        return MovimientosInventarioController.registrar(req, res);
    }

    static obtenerKardex(req, res) {
        return MovimientosInventarioController.obtenerKardex(req, res);
    }

    static listarMovimientos(req, res) {
        return MovimientosInventarioController.listar(req, res);
    }

    static obtenerEstadisticasMovimientos(req, res) {
        return MovimientosInventarioController.obtenerEstadisticas(req, res);
    }

    // ===================================================================
    // 🔔 ENDPOINTS ALERTAS
    // ===================================================================

    static listarAlertas(req, res) {
        return AlertasInventarioController.listar(req, res);
    }

    static obtenerAlertaPorId(req, res) {
        return AlertasInventarioController.obtenerPorId(req, res);
    }

    static marcarAlertaLeida(req, res) {
        return AlertasInventarioController.marcarLeida(req, res);
    }

    static marcarVariasAlertasLeidas(req, res) {
        return AlertasInventarioController.marcarVariasLeidas(req, res);
    }

    static obtenerDashboardAlertas(req, res) {
        return AlertasInventarioController.obtenerDashboard(req, res);
    }

    // ===================================================================
    // 📈 ENDPOINTS REPORTES
    // ===================================================================

    static obtenerValorInventario(req, res) {
        return ReportesInventarioController.obtenerValorInventario(req, res);
    }

    static obtenerAnalisisABC(req, res) {
        return ReportesInventarioController.obtenerAnalisisABC(req, res);
    }

    static obtenerRotacionInventario(req, res) {
        return ReportesInventarioController.obtenerRotacion(req, res);
    }

    static obtenerResumenAlertas(req, res) {
        return ReportesInventarioController.obtenerResumenAlertas(req, res);
    }
}

module.exports = InventarioMainController;
