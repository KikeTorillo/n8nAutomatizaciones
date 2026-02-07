/**
 * ====================================================================
 * SERVICE: GENERACIÓN DE CALENDARIO
 * ====================================================================
 * Servicio para generación de archivos iCalendar (.ics).
 * Centraliza la lógica de generación de calendarios para eventos.
 *
 * Fecha creación: 3 Febrero 2026
 */

/**
 * Configuración predeterminada
 */
const CONFIG = {
    PRODID: '-//Nexo//Eventos Digitales//ES',
    DURACION_DEFECTO_HORAS: 4,
    HORA_DEFECTO: '12:00'
};

/**
 * Formatea una fecha al formato iCalendar (YYYYMMDDTHHMMSSZ)
 * @param {Date} fecha - Fecha a formatear
 * @returns {string} Fecha en formato iCal
 */
function formatearFechaICal(fecha) {
    return fecha.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Escapa caracteres especiales para iCal
 * @param {string} texto - Texto a escapar
 * @returns {string} Texto escapado
 */
function escaparTextoICal(texto) {
    if (!texto) return '';
    return texto
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

/**
 * Genera fechas de inicio y fin del evento
 * @param {string} fechaEvento - Fecha del evento (ISO string o Date)
 * @param {string} horaEvento - Hora del evento (formato HH:MM o HH:MM:SS)
 * @param {number} duracionHoras - Duración en horas
 * @returns {Object} { fechaInicio: Date, fechaFin: Date }
 */
function calcularFechasEvento(fechaEvento, horaEvento, duracionHoras = CONFIG.DURACION_DEFECTO_HORAS) {
    if (!fechaEvento) {
        throw new Error('fechaEvento es requerida para generar calendario');
    }

    const fechaInicio = new Date(fechaEvento);
    if (isNaN(fechaInicio.getTime())) {
        throw new Error(`Fecha de evento inválida: ${fechaEvento}`);
    }

    // Parsear hora
    let hora = CONFIG.HORA_DEFECTO;
    if (horaEvento) {
        hora = horaEvento.substring(0, 5);
    }
    const [horas, minutos] = hora.split(':').map(Number);
    fechaInicio.setHours(horas || 0, minutos || 0, 0, 0);

    // Calcular fin
    const fechaFin = new Date(fechaInicio.getTime() + duracionHoras * 60 * 60 * 1000);

    return { fechaInicio, fechaFin };
}

/**
 * Genera contenido iCalendar para un evento
 * @param {Object} evento - Datos del evento
 * @param {number} evento.id - ID del evento
 * @param {string} evento.nombre - Nombre del evento
 * @param {string} evento.slug - Slug del evento
 * @param {string} evento.descripcion - Descripción (opcional)
 * @param {string} evento.fecha_evento - Fecha del evento
 * @param {string} evento.hora_evento - Hora del evento (opcional)
 * @param {Array} evento.ubicaciones - Array de ubicaciones (opcional)
 * @param {Object} options - Opciones adicionales
 * @param {number} options.duracionHoras - Duración del evento en horas
 * @param {boolean} options.incluirAlarmas - Si incluir alarmas/recordatorios
 * @returns {string} Contenido del archivo .ics
 */
function generarICS(evento, options = {}) {
    const {
        duracionHoras = CONFIG.DURACION_DEFECTO_HORAS,
        incluirAlarmas = true
    } = options;

    const baseUrl = process.env.FRONTEND_URL?.replace(/\/+$/, '') || 'https://nexo.app';
    const invitacionUrl = `${baseUrl}/e/${evento.slug}`;

    // Calcular fechas
    const { fechaInicio, fechaFin } = calcularFechasEvento(
        evento.fecha_evento,
        evento.hora_evento,
        duracionHoras
    );

    // Obtener ubicación principal
    let ubicacion = '';
    if (evento.ubicaciones && evento.ubicaciones.length > 0) {
        const ubPrincipal = evento.ubicaciones[0];
        ubicacion = ubPrincipal.direccion || ubPrincipal.nombre || '';
    }

    // Generar UID único
    const uid = `${evento.id}-${evento.slug}@nexo.app`;

    // Construir líneas del archivo iCal
    const lineas = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:${CONFIG.PRODID}`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatearFechaICal(new Date())}`,
        `DTSTART:${formatearFechaICal(fechaInicio)}`,
        `DTEND:${formatearFechaICal(fechaFin)}`,
        `SUMMARY:${escaparTextoICal(evento.nombre)}`,
        `DESCRIPTION:${escaparTextoICal(evento.descripcion || '')}\\n\\nMás información: ${invitacionUrl}`,
    ];

    // Agregar ubicación si existe
    if (ubicacion) {
        lineas.push(`LOCATION:${escaparTextoICal(ubicacion)}`);
    }

    lineas.push(`URL:${invitacionUrl}`);
    lineas.push('STATUS:CONFIRMED');

    // Agregar alarmas si están habilitadas
    if (incluirAlarmas) {
        // Alarma 1 día antes
        lineas.push(
            'BEGIN:VALARM',
            'TRIGGER:-P1D',
            'ACTION:DISPLAY',
            `DESCRIPTION:Recordatorio: ${escaparTextoICal(evento.nombre)} es mañana`,
            'END:VALARM'
        );

        // Alarma 2 horas antes
        lineas.push(
            'BEGIN:VALARM',
            'TRIGGER:-PT2H',
            'ACTION:DISPLAY',
            `DESCRIPTION:Recordatorio: ${escaparTextoICal(evento.nombre)} es en 2 horas`,
            'END:VALARM'
        );
    }

    lineas.push('END:VEVENT');
    lineas.push('END:VCALENDAR');

    return lineas.join('\r\n');
}

/**
 * Genera respuesta HTTP para descarga de archivo .ics
 * @param {Object} res - Objeto response de Express
 * @param {string} icsContent - Contenido del archivo .ics
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
function enviarArchivoICS(res, icsContent, filename) {
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.ics"`);
    return res.send(icsContent);
}

module.exports = {
    CONFIG,
    formatearFechaICal,
    escaparTextoICal,
    calcularFechasEvento,
    generarICS,
    enviarArchivoICS
};
