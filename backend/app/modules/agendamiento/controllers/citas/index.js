/**
 * Index de Controllers de Citas - Módulos especializados combinados
 * Mantiene la misma interfaz que el controller monolítico original
 */

const CitaBaseController = require('./cita.base.controller');
const CitaOperacionalController = require('./cita.operacional.controller');
const CitaRecordatoriosController = require('./cita.recordatorios.controller');

/**
 * Controller principal que combina todos los módulos especializados
 * Mantiene exactamente la misma interfaz pública que el controller original
 */
class CitaController {

    // ===================================================================
    // 🛡️ ENDPOINTS CRUD ESTÁNDAR (AUTENTICADOS)
    // ===================================================================

    static async crear(req, res) {
        return CitaBaseController.crear(req, res);
    }

    static async obtener(req, res) {
        return CitaBaseController.obtener(req, res);
    }

    static async actualizar(req, res) {
        return CitaBaseController.actualizar(req, res);
    }

    static async eliminar(req, res) {
        return CitaBaseController.eliminar(req, res);
    }

    static async confirmarAsistencia(req, res) {
        return CitaBaseController.confirmarAsistencia(req, res);
    }

    static async listar(req, res) {
        return CitaBaseController.listar(req, res);
    }

    // ===================================================================
    // 🏥 ENDPOINTS OPERACIONALES CRÍTICOS
    // ===================================================================

    static async checkIn(req, res) {
        return CitaOperacionalController.checkIn(req, res);
    }

    static async startService(req, res) {
        return CitaOperacionalController.startService(req, res);
    }

    static async complete(req, res) {
        return CitaOperacionalController.complete(req, res);
    }

    static async reagendar(req, res) {
        return CitaOperacionalController.reagendar(req, res);
    }

    static async noShow(req, res) {
        return CitaOperacionalController.noShow(req, res);
    }

    static async cancelar(req, res) {
        return CitaOperacionalController.cancelar(req, res);
    }

    // ===================================================================
    // 📊 ENDPOINTS DASHBOARD Y MÉTRICAS
    // ===================================================================

    static async dashboardToday(req, res) {
        return CitaOperacionalController.dashboardToday(req, res);
    }

    static async colaEspera(req, res) {
        return CitaOperacionalController.colaEspera(req, res);
    }

    static async metricasTiempoReal(req, res) {
        return CitaOperacionalController.metricasTiempoReal(req, res);
    }

    // ===================================================================
    // 🚶 ENDPOINTS WALK-IN Y DISPONIBILIDAD INMEDIATA
    // ===================================================================

    static async crearWalkIn(req, res) {
        return CitaOperacionalController.crearWalkIn(req, res);
    }

    static async disponibilidadInmediata(req, res) {
        return CitaOperacionalController.disponibilidadInmediata(req, res);
    }

    // ===================================================================
    // 📨 ENDPOINTS RECORDATORIOS Y SISTEMAS AUXILIARES
    // ===================================================================

    static async obtenerRecordatorios(req, res) {
        return CitaRecordatoriosController.obtenerRecordatorios(req, res);
    }

    static async marcarRecordatorioEnviado(req, res) {
        return CitaRecordatoriosController.marcarRecordatorioEnviado(req, res);
    }

    static async calificarCliente(req, res) {
        return CitaRecordatoriosController.calificarCliente(req, res);
    }

    // ===================================================================
    // 🔄 ENDPOINTS CITAS RECURRENTES
    // ===================================================================

    static async crearRecurrente(req, res) {
        return CitaBaseController.crearRecurrente(req, res);
    }

    static async obtenerSerie(req, res) {
        return CitaBaseController.obtenerSerie(req, res);
    }

    static async cancelarSerie(req, res) {
        return CitaBaseController.cancelarSerie(req, res);
    }

    static async previewRecurrencia(req, res) {
        return CitaBaseController.previewRecurrencia(req, res);
    }
}

module.exports = CitaController;