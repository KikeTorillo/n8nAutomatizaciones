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

    /**
     * Generar recomendación IA basada en disponibilidad de profesionales
     * @param {Array} profesionales - Array de profesionales con disponibilidad
     * @returns {Object} Recomendación estructurada para IA
     */
    static generarRecomendacionIA(profesionales) {
        if (profesionales.length === 0) {
            return {
                tipo: 'sin_disponibilidad',
                mensaje: 'No hay horarios disponibles en el rango consultado',
                sugerencia: 'Ampliar el rango de fechas o considerar otros profesionales'
            };
        }

        // Ordenar profesionales por disponibilidad
        const profesionalesOrdenados = profesionales.sort((a, b) => {
            // Priorizar por proximidad de disponibilidad, luego por total de slots
            const diffA = a.proxima_disponibilidad ? new Date(a.proxima_disponibilidad) - new Date() : Infinity;
            const diffB = b.proxima_disponibilidad ? new Date(b.proxima_disponibilidad) - new Date() : Infinity;

            if (diffA !== diffB) return diffA - diffB;
            return b.total_slots_libres - a.total_slots_libres;
        });

        const mejorProfesional = profesionalesOrdenados[0];
        const horasHastaProxima = mejorProfesional.proxima_disponibilidad ?
            Math.ceil((new Date(mejorProfesional.proxima_disponibilidad) - new Date()) / (1000 * 60 * 60)) : 0;

        return {
            tipo: 'recomendacion_disponible',
            profesional_recomendado: {
                id: mejorProfesional.profesional_id,
                nombre: mejorProfesional.nombre,
                tipo: mejorProfesional.tipo,
                total_slots_libres: mejorProfesional.total_slots_libres,
                dias_disponibles: mejorProfesional.dias_disponibles,
                proxima_disponibilidad: mejorProfesional.proxima_disponibilidad,
                horas_hasta_proxima: horasHastaProxima
            },
            alternativas: profesionalesOrdenados.slice(1, 3).map(prof => ({
                id: prof.profesional_id,
                nombre: prof.nombre,
                slots_libres: prof.total_slots_libres,
                proxima_disponibilidad: prof.proxima_disponibilidad
            })),
            mensaje_ia: horasHastaProxima <= 24 ?
                `${mejorProfesional.nombre} tiene disponibilidad hoy mismo` :
                horasHastaProxima <= 72 ?
                `${mejorProfesional.nombre} tiene disponibilidad en los próximos 3 días` :
                `${mejorProfesional.nombre} es la mejor opción con ${mejorProfesional.total_slots_libres} horarios disponibles`
        };
    }

    /**
     * Procesar y estructurar respuesta de disponibilidad
     * @param {Array} rows - Filas de resultado SQL
     * @param {Object} filtros - Filtros aplicados en la consulta
     * @param {string} fechaInicioFinal - Fecha inicio procesada
     * @param {string} fechaFinFinal - Fecha fin procesada
     * @param {number} duracion_servicio - Duración del servicio
     * @returns {Object} Respuesta estructurada con estadísticas y recomendaciones
     */
    static procesarRespuestaDisponibilidad(rows, filtros, fechaInicioFinal, fechaFinFinal, duracion_servicio) {
        const horariosPorFecha = {};
        const resumenProfesionales = {};

        rows.forEach(row => {
            const fecha = row.fecha.toISOString().split('T')[0];

            if (!horariosPorFecha[fecha]) {
                horariosPorFecha[fecha] = {
                    fecha: fecha,
                    dia_semana: row.dia_semana.trim(),
                    profesionales: {}
                };
            }

            horariosPorFecha[fecha].profesionales[row.profesional_id] = {
                profesional_id: row.profesional_id,
                nombre: row.profesional_nombre,
                tipo: row.tipo_profesional,
                slots_disponibles: row.slots_disponibles.filter(slot => slot.disponible),
                total_slots: parseInt(row.total_slots),
                slots_libres: parseInt(row.slots_libres),
                primer_slot: row.primer_slot,
                ultimo_slot: row.ultimo_slot
            };

            // Resumen por profesional
            if (!resumenProfesionales[row.profesional_id]) {
                resumenProfesionales[row.profesional_id] = {
                    profesional_id: row.profesional_id,
                    nombre: row.profesional_nombre,
                    tipo: row.tipo_profesional,
                    dias_disponibles: 0,
                    total_slots_libres: 0,
                    proxima_disponibilidad: null
                };
            }

            resumenProfesionales[row.profesional_id].dias_disponibles++;
            resumenProfesionales[row.profesional_id].total_slots_libres += parseInt(row.slots_libres);

            if (!resumenProfesionales[row.profesional_id].proxima_disponibilidad ||
                row.primer_slot < resumenProfesionales[row.profesional_id].proxima_disponibilidad) {
                resumenProfesionales[row.profesional_id].proxima_disponibilidad = row.primer_slot;
            }
        });

        // Calcular estadísticas generales
        const totalDiasConsultados = Object.keys(horariosPorFecha).length;
        const totalProfesionalesDisponibles = Object.keys(resumenProfesionales).length;
        const totalSlotsLibres = Object.values(resumenProfesionales)
            .reduce((sum, prof) => sum + prof.total_slots_libres, 0);

        return {
            consulta: {
                organizacion_id: filtros.organizacion_id,
                fecha_inicio: fechaInicioFinal,
                fecha_fin: fechaFinFinal,
                duracion_servicio: duracion_servicio,
                filtros_aplicados: {
                    profesional_id: filtros.profesional_id,
                    servicio_id: filtros.servicio_id,
                    dias_semana: filtros.dias_semana,
                    hora_inicio: filtros.hora_inicio,
                    hora_fin: filtros.hora_fin
                }
            },
            estadisticas: {
                total_dias_consultados: totalDiasConsultados,
                total_profesionales_disponibles: totalProfesionalesDisponibles,
                total_slots_libres: totalSlotsLibres,
                promedio_slots_por_dia: totalDiasConsultados > 0 ? Math.round(totalSlotsLibres / totalDiasConsultados) : 0
            },
            disponibilidad_por_fecha: horariosPorFecha,
            resumen_profesionales: Object.values(resumenProfesionales),
            recomendacion_ia: this.generarRecomendacionIA(Object.values(resumenProfesionales))
        };
    }
}

module.exports = HorarioHelpers;