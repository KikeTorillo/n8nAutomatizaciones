/**
 * Index de Controllers de POS - Punto de Venta
 * Combina todos los módulos de ventas POS
 */

const VentasPOSController = require('./ventas.controller');
const ReportesPOSController = require('./reportes.controller');

/**
 * Controller principal que combina todos los módulos especializados
 * Exporta métodos de todos los sub-controllers
 */
class POSMainController {

    // ===================================================================
    // 💰 ENDPOINTS VENTAS POS
    // ===================================================================

    static crearVenta(req, res) {
        return VentasPOSController.crear(req, res);
    }

    static obtenerVentaPorId(req, res) {
        return VentasPOSController.obtenerPorId(req, res);
    }

    static listarVentas(req, res) {
        return VentasPOSController.listar(req, res);
    }

    static actualizarEstadoVenta(req, res) {
        return VentasPOSController.actualizarEstado(req, res);
    }

    static registrarPago(req, res) {
        return VentasPOSController.registrarPago(req, res);
    }

    static cancelarVenta(req, res) {
        return VentasPOSController.cancelar(req, res);
    }

    static devolverItems(req, res) {
        return VentasPOSController.devolver(req, res);
    }

    static generarCorteCaja(req, res) {
        return VentasPOSController.corteCaja(req, res);
    }

    static agregarItems(req, res) {
        return VentasPOSController.agregarItems(req, res);
    }

    static actualizarVenta(req, res) {
        return VentasPOSController.actualizar(req, res);
    }

    static eliminarVenta(req, res) {
        return VentasPOSController.eliminar(req, res);
    }

    // ===================================================================
    // 📈 ENDPOINTS REPORTES POS
    // ===================================================================

    static obtenerVentasDiarias(req, res) {
        return ReportesPOSController.obtenerVentasDiarias(req, res);
    }
}

module.exports = POSMainController;
