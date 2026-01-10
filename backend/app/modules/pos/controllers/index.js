/**
 * Index de Controllers de POS - Punto de Venta
 * Combina todos los módulos de ventas POS
 */

const VentasPOSController = require('./ventas.controller');
const ReportesPOSController = require('./reportes.controller');
const SesionesCajaController = require('./sesiones-caja.controller');

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
    // 🧾 TICKETS PDF
    // ===================================================================

    static generarTicket(req, res) {
        return VentasPOSController.generarTicket(req, res);
    }

    // ===================================================================
    // 📈 ENDPOINTS REPORTES POS
    // ===================================================================

    static obtenerVentasDiarias(req, res) {
        return ReportesPOSController.obtenerVentasDiarias(req, res);
    }

    // ===================================================================
    // 💵 ENDPOINTS SESIONES DE CAJA
    // ===================================================================

    static abrirSesionCaja(req, res) {
        return SesionesCajaController.abrir(req, res);
    }

    static obtenerSesionActiva(req, res) {
        return SesionesCajaController.obtenerActiva(req, res);
    }

    static obtenerResumenSesion(req, res) {
        return SesionesCajaController.obtenerResumen(req, res);
    }

    static cerrarSesionCaja(req, res) {
        return SesionesCajaController.cerrar(req, res);
    }

    static registrarMovimientoCaja(req, res) {
        return SesionesCajaController.registrarMovimiento(req, res);
    }

    static listarMovimientosCaja(req, res) {
        return SesionesCajaController.listarMovimientos(req, res);
    }

    static listarSesionesCaja(req, res) {
        return SesionesCajaController.listar(req, res);
    }

    static obtenerSesionPorId(req, res) {
        return SesionesCajaController.obtenerPorId(req, res);
    }

    // ===================================================================
    // 💳 PAGO SPLIT (Ene 2026)
    // ===================================================================

    static registrarPagosSplit(req, res) {
        return VentasPOSController.registrarPagosSplit(req, res);
    }

    static obtenerPagosVenta(req, res) {
        return VentasPOSController.obtenerPagosVenta(req, res);
    }
}

module.exports = POSMainController;
