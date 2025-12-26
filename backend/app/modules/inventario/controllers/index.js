/**
 * Index de Controllers de Inventario - Módulos especializados combinados
 * Combina categorías, proveedores, productos, movimientos, alertas y órdenes de compra
 */

const CategoriasProductosController = require('./categorias.controller');
const ProveedoresController = require('./proveedores.controller');
const ProductosController = require('./productos.controller');
const MovimientosInventarioController = require('./movimientos.controller');
const AlertasInventarioController = require('./alertas.controller');
const ReportesInventarioController = require('./reportes.controller');
const OrdenesCompraController = require('./ordenes-compra.controller');
const ReservasController = require('./reservas.controller');
const UbicacionesAlmacenController = require('./ubicaciones.controller');

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

    // ===================================================================
    // 📋 ENDPOINTS ÓRDENES DE COMPRA
    // ===================================================================

    static crearOrdenCompra(req, res) {
        return OrdenesCompraController.crear(req, res);
    }

    static obtenerOrdenCompraPorId(req, res) {
        return OrdenesCompraController.obtenerPorId(req, res);
    }

    static listarOrdenesCompra(req, res) {
        return OrdenesCompraController.listar(req, res);
    }

    static actualizarOrdenCompra(req, res) {
        return OrdenesCompraController.actualizar(req, res);
    }

    static eliminarOrdenCompra(req, res) {
        return OrdenesCompraController.eliminar(req, res);
    }

    static agregarItemsOrdenCompra(req, res) {
        return OrdenesCompraController.agregarItems(req, res);
    }

    static actualizarItemOrdenCompra(req, res) {
        return OrdenesCompraController.actualizarItem(req, res);
    }

    static eliminarItemOrdenCompra(req, res) {
        return OrdenesCompraController.eliminarItem(req, res);
    }

    static enviarOrdenCompra(req, res) {
        return OrdenesCompraController.enviar(req, res);
    }

    static cancelarOrdenCompra(req, res) {
        return OrdenesCompraController.cancelar(req, res);
    }

    static recibirMercanciaOrdenCompra(req, res) {
        return OrdenesCompraController.recibirMercancia(req, res);
    }

    static obtenerOrdenesCompraPendientes(req, res) {
        return OrdenesCompraController.obtenerPendientes(req, res);
    }

    static obtenerOrdenesCompraPendientesPago(req, res) {
        return OrdenesCompraController.obtenerPendientesPago(req, res);
    }

    static registrarPagoOrdenCompra(req, res) {
        return OrdenesCompraController.registrarPago(req, res);
    }

    static obtenerEstadisticasComprasPorProveedor(req, res) {
        return OrdenesCompraController.estadisticasPorProveedor(req, res);
    }

    static generarOCDesdeProducto(req, res) {
        return OrdenesCompraController.generarDesdeProducto(req, res);
    }

    static autoGenerarOCs(req, res) {
        return OrdenesCompraController.autoGenerarOCs(req, res);
    }

    static obtenerSugerenciasOC(req, res) {
        return OrdenesCompraController.obtenerSugerenciasOC(req, res);
    }

    // ===================================================================
    // 🔒 ENDPOINTS RESERVAS DE STOCK (Dic 2025 - Fase 1 Gaps)
    // ===================================================================

    static crearReserva(req, res) {
        return ReservasController.crear(req, res);
    }

    static crearReservaMultiple(req, res) {
        return ReservasController.crearMultiple(req, res);
    }

    static obtenerReservaPorId(req, res) {
        return ReservasController.obtenerPorId(req, res);
    }

    static listarReservas(req, res) {
        return ReservasController.listar(req, res);
    }

    static confirmarReserva(req, res) {
        return ReservasController.confirmar(req, res);
    }

    static confirmarReservaMultiple(req, res) {
        return ReservasController.confirmarMultiple(req, res);
    }

    static cancelarReserva(req, res) {
        return ReservasController.cancelar(req, res);
    }

    static cancelarReservaPorOrigen(req, res) {
        return ReservasController.cancelarPorOrigen(req, res);
    }

    static stockDisponible(req, res) {
        return ReservasController.stockDisponible(req, res);
    }

    static stockDisponibleMultiple(req, res) {
        return ReservasController.stockDisponibleMultiple(req, res);
    }

    static verificarDisponibilidad(req, res) {
        return ReservasController.verificarDisponibilidad(req, res);
    }

    static extenderReserva(req, res) {
        return ReservasController.extenderExpiracion(req, res);
    }

    // ===================================================================
    // 📍 ENDPOINTS UBICACIONES DE ALMACÉN (Dic 2025 - Fase 3 Gaps)
    // ===================================================================

    static crearUbicacion(req, res) {
        return UbicacionesAlmacenController.crear(req, res);
    }

    static obtenerUbicacionPorId(req, res) {
        return UbicacionesAlmacenController.obtenerPorId(req, res);
    }

    static listarUbicaciones(req, res) {
        return UbicacionesAlmacenController.listar(req, res);
    }

    static obtenerArbolUbicaciones(req, res) {
        return UbicacionesAlmacenController.obtenerArbol(req, res);
    }

    static actualizarUbicacion(req, res) {
        return UbicacionesAlmacenController.actualizar(req, res);
    }

    static eliminarUbicacion(req, res) {
        return UbicacionesAlmacenController.eliminar(req, res);
    }

    static toggleBloqueoUbicacion(req, res) {
        return UbicacionesAlmacenController.toggleBloqueo(req, res);
    }

    static obtenerStockUbicacion(req, res) {
        return UbicacionesAlmacenController.obtenerStock(req, res);
    }

    static obtenerUbicacionesProducto(req, res) {
        return UbicacionesAlmacenController.obtenerUbicacionesProducto(req, res);
    }

    static obtenerUbicacionesDisponibles(req, res) {
        return UbicacionesAlmacenController.obtenerDisponibles(req, res);
    }

    static agregarStockUbicacion(req, res) {
        return UbicacionesAlmacenController.agregarStock(req, res);
    }

    static moverStockUbicacion(req, res) {
        return UbicacionesAlmacenController.moverStock(req, res);
    }

    static obtenerEstadisticasUbicaciones(req, res) {
        return UbicacionesAlmacenController.obtenerEstadisticas(req, res);
    }
}

module.exports = InventarioMainController;
