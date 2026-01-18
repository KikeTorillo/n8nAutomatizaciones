/**
 * Helper para fechas y horas
 * @module utils/helpers/DateHelper
 */

class DateHelper {
  /**
   * Obtiene fecha actual en zona horaria específica
   */
  static getCurrentDate(timezone = 'America/Mexico_City') {
    return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  }

  /**
   * Obtiene hora actual en zona horaria específica
   */
  static getCurrentTime(timezone = 'America/Mexico_City') {
    return new Date().toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Convierte fecha y hora a timestamp con zona horaria
   */
  static toTimestamp(date, time, timezone = 'America/Mexico_City') {
    const dateTime = `${date}T${time}:00`;
    return new Date(dateTime).toLocaleString('sv-SE', { timeZone: timezone });
  }

  /**
   * Calcula diferencia en minutos entre dos horas
   */
  static minutesBetween(startTime, endTime) {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    return Math.floor((end - start) / (1000 * 60));
  }

  /**
   * Suma minutos a una hora
   */
  static addMinutes(time, minutes) {
    const date = new Date(`1970-01-01T${time}:00`);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toTimeString().slice(0, 5);
  }

  /**
   * Obtiene el día de la semana (0=Domingo, 6=Sábado)
   */
  static getDayOfWeek(dateString) {
    return new Date(dateString).getDay();
  }

  /**
   * Formatea fecha para mostrar (DD/MM/YYYY)
   */
  static formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX');
  }

  /**
   * Formatea hora para mostrar (HH:MM AM/PM)
   */
  static formatTime(timeString, format12h = false) {
    if (!format12h) return timeString;

    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    return `${displayHour}:${minutes} ${ampm}`;
  }
}

module.exports = DateHelper;
