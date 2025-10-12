/**
 * Index de Models de Citas - Proxy puro a módulos especializados
 * Mantiene la misma interfaz que el modelo monolítico original
 */

const CitaBaseModel = require('./cita.base.model');
const CitaOperacionalModel = require('./cita.operacional.model');
const CitaRecordatoriosModel = require('./cita.recordatorios.model');
const { CitaHelpersModel } = require('./cita.helpers.model');

/**
 * Modelo principal que combina todos los módulos especializados
 * Actúa como proxy puro sin lógica de negocio directa
 */
class CitaModel {

    // ===================================================================
    // 🛡️ MÉTODOS CRUD ESTÁNDAR
    // ===================================================================

    static async crearEstandar(citaData, usuarioId) {
        return CitaBaseModel.crearEstandar(citaData, usuarioId);
    }

    static async obtenerPorId(citaId, organizacionId, db = null) {
        return CitaBaseModel.obtenerPorId(citaId, organizacionId, db);
    }

    static async actualizarEstandar(citaId, datosActualizacion, organizacionId, usuarioId) {
        return CitaBaseModel.actualizarEstandar(citaId, datosActualizacion, organizacionId, usuarioId);
    }

    static async eliminarEstandar(citaId, organizacionId, usuarioId) {
        return CitaBaseModel.eliminarEstandar(citaId, organizacionId, usuarioId);
    }

    static async confirmarAsistenciaEstandar(citaId, organizacionId, usuarioId) {
        return CitaBaseModel.confirmarAsistenciaEstandar(citaId, organizacionId, usuarioId);
    }

    static async listarConFiltros(filtros) {
        return CitaBaseModel.listarConFiltros(filtros);
    }

    // ===================================================================
    // 🏥 MÉTODOS OPERACIONALES CRÍTICOS
    // ===================================================================

    static async checkIn(citaId, datosCheckIn, organizacionId) {
        return CitaOperacionalModel.checkIn(citaId, datosCheckIn, organizacionId);
    }

    static async startService(citaId, datosInicio, organizacionId) {
        return CitaOperacionalModel.startService(citaId, datosInicio, organizacionId);
    }

    static async complete(citaId, datosCompletado, organizacionId) {
        return CitaOperacionalModel.complete(citaId, datosCompletado, organizacionId);
    }

    static async reagendar(citaId, datosReagenda, organizacionId) {
        return CitaOperacionalModel.reagendar(citaId, datosReagenda, organizacionId);
    }

    // ===================================================================
    // 📊 MÉTODOS DASHBOARD Y MÉTRICAS
    // ===================================================================

    static async obtenerDashboardToday(organizacionId, profesionalId = null) {
        return CitaOperacionalModel.obtenerDashboardToday(organizacionId, profesionalId);
    }

    static async obtenerColaEspera(organizacionId, profesionalId = null) {
        return CitaOperacionalModel.obtenerColaEspera(organizacionId, profesionalId);
    }

    static async obtenerMetricasTiempoReal(organizacionId) {
        return CitaOperacionalModel.obtenerMetricasTiempoReal(organizacionId);
    }

    // ===================================================================
    // 🚶 MÉTODOS WALK-IN
    // ===================================================================

    static async crearWalkIn(datosWalkIn, organizacionId) {
        return CitaOperacionalModel.crearWalkIn(datosWalkIn, organizacionId);
    }

    static async consultarDisponibilidadInmediata(servicioId, profesionalId, organizacionId) {
        return CitaOperacionalModel.consultarDisponibilidadInmediata(servicioId, profesionalId, organizacionId);
    }

    // ===================================================================
    // 📨 MÉTODOS DE RECORDATORIOS Y FEEDBACK
    // ===================================================================

    static async marcarRecordatorioEnviado(codigoCita, organizacionId) {
        return CitaRecordatoriosModel.marcarRecordatorioEnviado(codigoCita, organizacionId);
    }

    static async obtenerCitasParaRecordatorio(organizacionId, horasAnticipacion = 2) {
        return CitaRecordatoriosModel.obtenerCitasParaRecordatorio(organizacionId, horasAnticipacion);
    }

    static async calificarCliente(codigoCita, organizacionId, calificacion) {
        return CitaRecordatoriosModel.calificarCliente(codigoCita, organizacionId, calificacion);
    }

    // ===================================================================
    // 🔧 MÉTODOS AUXILIARES Y HELPERS
    // ===================================================================

    static async buscarOCrearCliente(datosIA) {
        return CitaHelpersModel.buscarOCrearCliente(datosIA);
    }

    static async obtenerServicioCompleto(servicioId, organizacionId, db) {
        return CitaHelpersModel.obtenerServicioCompleto(servicioId, organizacionId, db);
    }


    /**
     * @deprecated ⚠️ NO USAR - Genera códigos en formato incorrecto
     * La BD genera codigo_cita automáticamente via trigger
     */
    static async generarCodigoCita(organizacionId, db) {
        return CitaHelpersModel.generarCodigoCita(organizacionId, db);
    }

    static async insertarCitaCompleta(citaData, db) {
        return CitaHelpersModel.insertarCitaCompleta(citaData, db);
    }


    static async registrarEventoAuditoria(evento, db) {
        return CitaHelpersModel.registrarEventoAuditoria(evento, db);
    }

    static async validarEntidadesRelacionadas(clienteId, profesionalId, servicioId, organizacionId, db) {
        return CitaHelpersModel.validarEntidadesRelacionadas(clienteId, profesionalId, servicioId, organizacionId, db);
    }

    static async validarConflictoHorario(profesionalId, fecha, horaInicio, horaFin, citaIdExcluir, db) {
        return CitaHelpersModel.validarConflictoHorario(profesionalId, fecha, horaInicio, horaFin, citaIdExcluir, db);
    }
}

module.exports = CitaModel;
