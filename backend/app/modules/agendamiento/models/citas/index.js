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

    static async noShow(citaId, datosNoShow, organizacionId) {
        return CitaOperacionalModel.noShow(citaId, datosNoShow, organizacionId);
    }

    static async cancelar(citaId, datosCancelacion, organizacionId) {
        return CitaOperacionalModel.cancelar(citaId, datosCancelacion, organizacionId);
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

    // ===================================================================
    // 🔄 MÉTODOS PROXY PARA CitaServicioModel (M:N)
    // ===================================================================
    // ⚠️ NOTA: Estos métodos estarán disponibles DESPUÉS de implementar
    // la tabla citas_servicios y crear CitaServicioModel

    /**
     * Crear múltiples servicios para una cita (tabla intermedia)
     * @param {number} citaId - ID de la cita
     * @param {Array} serviciosData - Array de servicios con {servicio_id, orden, precio, duracion, descuento}
     * @param {number} organizacionId - ID de organización
     */
    static async crearServiciosCita(citaId, serviciosData, organizacionId) {
        const CitaServicioModel = require('./cita-servicio.model');
        return CitaServicioModel.crearMultiples(citaId, serviciosData, organizacionId);
    }

    /**
     * Obtener servicios de una cita (con JOIN a tabla servicios)
     * @param {number} citaId - ID de la cita
     * @param {number} organizacionId - ID de organización
     */
    static async obtenerServiciosCita(citaId, organizacionId) {
        const CitaServicioModel = require('./cita-servicio.model');
        return CitaServicioModel.obtenerPorCita(citaId, organizacionId);
    }

    /**
     * Actualizar servicios de una cita (delete + insert)
     * @param {number} citaId - ID de la cita
     * @param {Array} serviciosData - Array de servicios nuevos
     * @param {number} organizacionId - ID de organización
     */
    static async actualizarServiciosCita(citaId, serviciosData, organizacionId) {
        const CitaServicioModel = require('./cita-servicio.model');
        return CitaServicioModel.actualizarPorCita(citaId, serviciosData, organizacionId);
    }

    /**
     * Calcular totales (precio + duración) de múltiples servicios
     * @param {Array} serviciosData - Array con servicios
     * @returns {Object} {precio_total, duracion_total_minutos}
     */
    static calcularTotalesServicios(serviciosData) {
        const CitaServicioModel = require('./cita-servicio.model');
        return CitaServicioModel.calcularTotales(serviciosData);
    }

    // ===================================================================
    // 🔄 MÉTODOS CITAS RECURRENTES
    // ===================================================================

    /**
     * Crear una serie de citas recurrentes
     * @param {Object} citaData - Datos de la cita base con patrón de recurrencia
     * @param {number} usuarioId - ID del usuario que crea la serie
     */
    static async crearRecurrente(citaData, usuarioId) {
        return CitaBaseModel.crearRecurrente(citaData, usuarioId);
    }

    /**
     * Obtener todas las citas de una serie recurrente
     * @param {string} serieId - UUID de la serie
     * @param {number} organizacionId - ID de organización
     * @param {Object} opciones - Opciones de filtro
     */
    static async obtenerSerie(serieId, organizacionId, opciones = {}) {
        return CitaBaseModel.obtenerSerie(serieId, organizacionId, opciones);
    }

    /**
     * Cancelar todas las citas pendientes de una serie
     * @param {string} serieId - UUID de la serie
     * @param {number} organizacionId - ID de organización
     * @param {Object} opciones - Opciones (motivo_cancelacion, etc.)
     * @param {number} usuarioId - ID del usuario que cancela
     */
    static async cancelarSerie(serieId, organizacionId, opciones, usuarioId) {
        return CitaBaseModel.cancelarSerie(serieId, organizacionId, opciones, usuarioId);
    }

    /**
     * Preview de fechas disponibles para una serie recurrente (sin crear)
     * @param {Object} datos - Datos del preview (profesional, fecha, hora, patrón)
     * @param {number} organizacionId - ID de organización
     */
    static async previewRecurrencia(datos, organizacionId) {
        return CitaBaseModel.previewRecurrencia(datos, organizacionId);
    }
}

module.exports = CitaModel;
