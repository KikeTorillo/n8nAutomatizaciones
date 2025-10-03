/**
 * Utilidades para manejo de horarios y tiempo
 */
class HorarioHelpers {
    /**
     * Convertir tiempo string a minutos
     * @param {string} timeString - Tiempo en formato "HH:MM"
     * @returns {number} Minutos totales
     */
    static timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Convertir minutos a tiempo string
     * @param {number} totalMinutes - Minutos totales
     * @returns {string} Tiempo en formato "HH:MM"
     */
    static minutesToTime(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    /**
     * Obtener nombre del día en español
     * @param {number} diaNumero - Número del día (0=domingo, 6=sábado)
     * @returns {string} Nombre del día
     */
    static obtenerNombreDia(diaNumero) {
        const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        return dias[diaNumero];
    }

    /**
     * Procesar texto natural de fecha a rango de fechas
     * Usado por endpoint inteligente de IA
     * @param {string} fechaTexto - Texto natural: "hoy", "mañana", "próxima semana", "2024-10-15"
     * @returns {Object} { fecha_inicio, fecha_fin }
     */
    static procesarFechaTexto(fechaTexto) {
        if (!fechaTexto) {
            // Por defecto próximos 7 días
            const fecha_inicio = new Date().toISOString().split('T')[0];
            const futuro = new Date();
            futuro.setDate(futuro.getDate() + 7);
            const fecha_fin = futuro.toISOString().split('T')[0];
            return { fecha_inicio, fecha_fin };
        }

        const fecha = fechaTexto.toLowerCase();

        if (fecha === 'hoy') {
            const fecha_inicio = new Date().toISOString().split('T')[0];
            return { fecha_inicio, fecha_fin: fecha_inicio };
        }

        if (fecha === 'mañana') {
            const mañana = new Date();
            mañana.setDate(mañana.getDate() + 1);
            const fecha_inicio = mañana.toISOString().split('T')[0];
            return { fecha_inicio, fecha_fin: fecha_inicio };
        }

        if (fecha === 'pasado mañana') {
            const pasadoMañana = new Date();
            pasadoMañana.setDate(pasadoMañana.getDate() + 2);
            const fecha_inicio = pasadoMañana.toISOString().split('T')[0];
            return { fecha_inicio, fecha_fin: fecha_inicio };
        }

        if (fecha.includes('próxima semana')) {
            const proximaSemana = new Date();
            proximaSemana.setDate(proximaSemana.getDate() + 7);
            const fecha_inicio = proximaSemana.toISOString().split('T')[0];
            const finSemana = new Date(proximaSemana);
            finSemana.setDate(finSemana.getDate() + 7);
            const fecha_fin = finSemana.toISOString().split('T')[0];
            return { fecha_inicio, fecha_fin };
        }

        // Fecha específica en formato YYYY-MM-DD
        if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return { fecha_inicio: fecha, fecha_fin: fecha };
        }

        // Por defecto próximos 7 días
        const fecha_inicio = new Date().toISOString().split('T')[0];
        const futuro = new Date();
        futuro.setDate(futuro.getDate() + 7);
        const fecha_fin = futuro.toISOString().split('T')[0];
        return { fecha_inicio, fecha_fin };
    }

    /**
     * Formatear disponibilidad para respuesta IA
     * @param {Object} horarios - Resultado de consultarDisponibilidad
     * @returns {Object} Formato optimizado para IA
     */
    static formatearParaIA(horarios) {
        const horariosFormateados = Object.values(horarios.disponibilidad_por_fecha || {})
            .flatMap(fecha =>
                Object.values(fecha.profesionales || {})
                    .flatMap(prof =>
                        (prof.slots_disponibles || []).map(slot => ({
                            horario_id: slot.id,
                            fecha: fecha.fecha,
                            hora: slot.hora_inicio,
                            profesional: prof.nombre,
                            tipo_profesional: prof.tipo,
                            mensaje_ia: `Disponible ${fecha.dia_semana} a las ${slot.hora_inicio} con ${prof.nombre}`,
                            disponible: slot.disponible
                        }))
                    )
            );

        return {
            ...horarios,
            horarios_formateados: horariosFormateados,
            mensaje_general: horarios.recomendacion_ia?.mensaje_ia || 'Consulta de disponibilidad procesada'
        };
    }
}

module.exports = HorarioHelpers;