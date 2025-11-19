/**
 * Index de Controllers de Comisiones - Módulos especializados combinados
 * Combina configuración, comisiones y estadísticas en una interfaz unificada
 */

const ConfiguracionComisionesController = require('./configuracion.controller');
const ComisionesController = require('./comisiones.controller');
const EstadisticasComisionesController = require('./estadisticas.controller');

/**
 * Controller principal que combina todos los módulos especializados
 * Exporta métodos de todos los sub-controllers
 */
class ComisionesMainController {

    // ===================================================================
    // 🛡️ ENDPOINTS CONFIGURACIÓN
    // ===================================================================

    static crearOActualizarConfiguracion(req, res) {
        return ConfiguracionComisionesController.crearOActualizar(req, res);
    }

    static listarConfiguracion(req, res) {
        return ConfiguracionComisionesController.listar(req, res);
    }

    static obtenerConfiguracionPorId(req, res) {
        return ConfiguracionComisionesController.obtenerPorId(req, res);
    }

    static eliminarConfiguracion(req, res) {
        return ConfiguracionComisionesController.eliminar(req, res);
    }

    static obtenerHistorialConfiguracion(req, res) {
        return ConfiguracionComisionesController.obtenerHistorial(req, res);
    }

    // ===================================================================
    // 💰 ENDPOINTS CONSULTAS Y OPERACIONES
    // ===================================================================

    static listarPorProfesional(req, res) {
        return ComisionesController.listarPorProfesional(req, res);
    }

    static consultarPorPeriodo(req, res) {
        return ComisionesController.consultarPorPeriodo(req, res);
    }

    static marcarComoPagada(req, res) {
        return ComisionesController.marcarComoPagada(req, res);
    }

    static obtenerComisionPorId(req, res) {
        return ComisionesController.obtenerPorId(req, res);
    }

    static generarReporte(req, res) {
        return ComisionesController.generarReporte(req, res);
    }

    // ===================================================================
    // 📊 ENDPOINTS ESTADÍSTICAS Y DASHBOARD
    // ===================================================================

    static metricasDashboard(req, res) {
        return EstadisticasComisionesController.metricasDashboard(req, res);
    }

    static estadisticasBasicas(req, res) {
        return EstadisticasComisionesController.estadisticasBasicas(req, res);
    }

    static graficaPorDia(req, res) {
        return EstadisticasComisionesController.graficaPorDia(req, res);
    }
}

module.exports = ComisionesMainController;
