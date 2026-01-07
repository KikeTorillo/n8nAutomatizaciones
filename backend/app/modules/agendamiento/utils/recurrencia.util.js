/**
 * ====================================================================
 * UTILIDAD DE RECURRENCIA PARA CITAS
 * ====================================================================
 *
 * Funciones auxiliares para generar y validar series de citas recurrentes.
 *
 * PATRONES SOPORTADOS:
 * - Semanal: Cada N semanas en días específicos (Lun, Mie, Vie)
 * - Quincenal: Cada 2 semanas
 * - Mensual: Cada N meses en el mismo día
 *
 * TERMINACIÓN:
 * - Por fecha: Hasta una fecha específica
 * - Por cantidad: Número fijo de citas
 *
 * @module recurrencia.util
 * @requires luxon
 */

const { DateTime } = require('luxon');
const logger = require('../../../utils/logger');

const DEFAULTS = {
  ZONA_HORARIA: 'America/Mexico_City',
  MAX_CITAS_SERIE: 52,         // Máximo 1 año de citas semanales
  MIN_CITAS_SERIE: 2,          // Mínimo 2 citas para ser serie
  MAX_DIAS_FUTURO: 365,        // Máximo 1 año hacia adelante
};

const FRECUENCIAS = {
  SEMANAL: 'semanal',
  QUINCENAL: 'quincenal',
  MENSUAL: 'mensual',
};

const DIAS_SEMANA = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábado',
};

class RecurrenciaUtil {
  /**
   * Genera todas las fechas de una serie recurrente
   *
   * @param {Object} patron - Patrón de recurrencia
   * @param {string} patron.frecuencia - 'semanal' | 'quincenal' | 'mensual'
   * @param {number[]} [patron.dias_semana] - Días de la semana [0-6] (solo para semanal/quincenal)
   * @param {number} [patron.intervalo=1] - Cada cuántas semanas/meses
   * @param {string} patron.termina_en - 'fecha' | 'cantidad'
   * @param {string} [patron.fecha_fin] - Fecha fin si termina_en='fecha' (YYYY-MM-DD)
   * @param {number} [patron.cantidad_citas] - Número de citas si termina_en='cantidad'
   * @param {string} fechaInicio - Fecha de la primera cita (YYYY-MM-DD)
   * @returns {string[]} Array de fechas en formato YYYY-MM-DD
   *
   * @example
   * // Cada miércoles por 12 semanas
   * generarFechasRecurrentes({
   *   frecuencia: 'semanal',
   *   dias_semana: [3],
   *   intervalo: 1,
   *   termina_en: 'cantidad',
   *   cantidad_citas: 12
   * }, '2026-01-15');
   * // => ['2026-01-15', '2026-01-22', '2026-01-29', ...]
   */
  static generarFechasRecurrentes(patron, fechaInicio) {
    const validacion = this.validarPatronRecurrencia(patron);
    if (!validacion.valido) {
      throw new Error(`Patrón de recurrencia inválido: ${validacion.errores.join(', ')}`);
    }

    const fechas = [];
    const fechaInicioObj = DateTime.fromISO(fechaInicio, { zone: DEFAULTS.ZONA_HORARIA });

    if (!fechaInicioObj.isValid) {
      throw new Error(`Fecha de inicio inválida: ${fechaInicio}`);
    }

    // La primera fecha siempre es la fecha de inicio
    fechas.push(fechaInicio);

    const { frecuencia, dias_semana, intervalo = 1, termina_en, fecha_fin, cantidad_citas } = patron;

    // Calcular límite
    let limiteFecha = null;
    let limiteCantidad = cantidad_citas || DEFAULTS.MAX_CITAS_SERIE;

    if (termina_en === 'fecha' && fecha_fin) {
      limiteFecha = DateTime.fromISO(fecha_fin, { zone: DEFAULTS.ZONA_HORARIA });
    } else {
      // Límite máximo de 1 año hacia adelante
      limiteFecha = fechaInicioObj.plus({ days: DEFAULTS.MAX_DIAS_FUTURO });
    }

    // Generar fechas según frecuencia
    let fechaActual = fechaInicioObj;
    let contador = 1; // Ya tenemos la primera

    while (contador < limiteCantidad) {
      fechaActual = this._calcularSiguienteFecha(fechaActual, frecuencia, dias_semana, intervalo);

      // Verificar límites
      if (limiteFecha && fechaActual > limiteFecha) {
        break;
      }

      if (fechaActual > fechaInicioObj.plus({ days: DEFAULTS.MAX_DIAS_FUTURO })) {
        logger.warn('[RecurrenciaUtil] Alcanzado límite máximo de días futuros', {
          fecha_actual: fechaActual.toISODate(),
          limite: DEFAULTS.MAX_DIAS_FUTURO
        });
        break;
      }

      fechas.push(fechaActual.toISODate());
      contador++;
    }

    logger.info('[RecurrenciaUtil.generarFechasRecurrentes] Serie generada', {
      frecuencia,
      fecha_inicio: fechaInicio,
      total_fechas: fechas.length,
      fecha_final: fechas[fechas.length - 1]
    });

    return fechas;
  }

  /**
   * Calcula la siguiente fecha según el patrón
   * @private
   */
  static _calcularSiguienteFecha(fechaActual, frecuencia, diasSemana, intervalo) {
    switch (frecuencia) {
      case FRECUENCIAS.SEMANAL:
        return this._siguienteFechaSemanal(fechaActual, diasSemana, intervalo);

      case FRECUENCIAS.QUINCENAL:
        return this._siguienteFechaSemanal(fechaActual, diasSemana, 2);

      case FRECUENCIAS.MENSUAL:
        return fechaActual.plus({ months: intervalo });

      default:
        throw new Error(`Frecuencia no soportada: ${frecuencia}`);
    }
  }

  /**
   * Calcula siguiente fecha semanal considerando días específicos
   * @private
   */
  static _siguienteFechaSemanal(fechaActual, diasSemana, intervalo) {
    // Si no hay días específicos, simplemente avanzar N semanas
    if (!diasSemana || diasSemana.length === 0) {
      return fechaActual.plus({ weeks: intervalo });
    }

    // Si hay días específicos, encontrar el siguiente día válido
    const diaActual = fechaActual.weekday % 7; // Convertir a 0-6 (domingo=0)

    // Ordenar días de la semana
    const diasOrdenados = [...diasSemana].sort((a, b) => a - b);

    // Buscar siguiente día en la misma semana
    for (const dia of diasOrdenados) {
      if (dia > diaActual) {
        const diasHasta = dia - diaActual;
        return fechaActual.plus({ days: diasHasta });
      }
    }

    // Si no hay más días esta semana, ir a la siguiente semana
    const primerDia = diasOrdenados[0];
    const diasHastaPrimerDia = (7 - diaActual + primerDia) + (7 * (intervalo - 1));
    return fechaActual.plus({ days: diasHastaPrimerDia });
  }

  /**
   * Valida un patrón de recurrencia
   *
   * @param {Object} patron - Patrón a validar
   * @returns {Object} { valido: boolean, errores: string[] }
   */
  static validarPatronRecurrencia(patron) {
    const errores = [];

    if (!patron) {
      return { valido: false, errores: ['Patrón es requerido'] };
    }

    // Validar frecuencia
    if (!patron.frecuencia) {
      errores.push('Frecuencia es requerida');
    } else if (!Object.values(FRECUENCIAS).includes(patron.frecuencia)) {
      errores.push(`Frecuencia inválida: ${patron.frecuencia}. Debe ser: ${Object.values(FRECUENCIAS).join(', ')}`);
    }

    // Validar días de semana (solo para semanal/quincenal)
    if ((patron.frecuencia === FRECUENCIAS.SEMANAL || patron.frecuencia === FRECUENCIAS.QUINCENAL) && patron.dias_semana) {
      if (!Array.isArray(patron.dias_semana)) {
        errores.push('dias_semana debe ser un array');
      } else {
        for (const dia of patron.dias_semana) {
          if (typeof dia !== 'number' || dia < 0 || dia > 6) {
            errores.push(`Día de semana inválido: ${dia}. Debe ser 0-6`);
          }
        }
      }
    }

    // Validar intervalo
    if (patron.intervalo !== undefined) {
      if (typeof patron.intervalo !== 'number' || patron.intervalo < 1 || patron.intervalo > 4) {
        errores.push('Intervalo debe ser un número entre 1 y 4');
      }
    }

    // Validar terminación
    if (!patron.termina_en) {
      errores.push('termina_en es requerido (fecha o cantidad)');
    } else if (patron.termina_en === 'fecha') {
      if (!patron.fecha_fin) {
        errores.push('fecha_fin es requerida cuando termina_en=fecha');
      } else {
        const fechaFin = DateTime.fromISO(patron.fecha_fin);
        if (!fechaFin.isValid) {
          errores.push(`fecha_fin inválida: ${patron.fecha_fin}`);
        }
      }
    } else if (patron.termina_en === 'cantidad') {
      if (!patron.cantidad_citas) {
        errores.push('cantidad_citas es requerida cuando termina_en=cantidad');
      } else if (patron.cantidad_citas < DEFAULTS.MIN_CITAS_SERIE || patron.cantidad_citas > DEFAULTS.MAX_CITAS_SERIE) {
        errores.push(`cantidad_citas debe estar entre ${DEFAULTS.MIN_CITAS_SERIE} y ${DEFAULTS.MAX_CITAS_SERIE}`);
      }
    } else {
      errores.push(`termina_en inválido: ${patron.termina_en}. Debe ser: fecha o cantidad`);
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Genera un resumen legible del patrón de recurrencia
   *
   * @param {Object} patron - Patrón de recurrencia
   * @returns {string} Descripción legible
   *
   * @example
   * describirPatron({ frecuencia: 'semanal', dias_semana: [1, 3, 5], cantidad_citas: 12 })
   * // => "Cada semana los lunes, miércoles y viernes (12 citas)"
   */
  static describirPatron(patron) {
    if (!patron) return 'Sin recurrencia';

    const { frecuencia, dias_semana, intervalo = 1, termina_en, fecha_fin, cantidad_citas } = patron;

    let descripcion = '';

    // Frecuencia
    switch (frecuencia) {
      case FRECUENCIAS.SEMANAL:
        descripcion = intervalo === 1 ? 'Cada semana' : `Cada ${intervalo} semanas`;
        break;
      case FRECUENCIAS.QUINCENAL:
        descripcion = 'Cada 2 semanas';
        break;
      case FRECUENCIAS.MENSUAL:
        descripcion = intervalo === 1 ? 'Cada mes' : `Cada ${intervalo} meses`;
        break;
    }

    // Días de la semana
    if (dias_semana && dias_semana.length > 0) {
      const nombresDias = dias_semana.map(d => DIAS_SEMANA[d]).join(', ');
      descripcion += ` los ${nombresDias}`;
    }

    // Terminación
    if (termina_en === 'fecha' && fecha_fin) {
      const fechaFormateada = DateTime.fromISO(fecha_fin).toFormat('dd/MM/yyyy');
      descripcion += ` hasta ${fechaFormateada}`;
    } else if (termina_en === 'cantidad' && cantidad_citas) {
      descripcion += ` (${cantidad_citas} citas)`;
    }

    return descripcion;
  }

  /**
   * Calcula estadísticas de una serie de citas
   *
   * @param {string[]} fechas - Array de fechas
   * @param {number} precioTotal - Precio por cita
   * @param {number} duracionMinutos - Duración por cita
   * @returns {Object} Estadísticas de la serie
   */
  static calcularEstadisticasSerie(fechas, precioTotal, duracionMinutos) {
    if (!fechas || fechas.length === 0) {
      return {
        total_citas: 0,
        precio_total_serie: 0,
        duracion_total_minutos: 0,
        fecha_inicio: null,
        fecha_fin: null,
        duracion_semanas: 0
      };
    }

    const fechaInicio = DateTime.fromISO(fechas[0]);
    const fechaFin = DateTime.fromISO(fechas[fechas.length - 1]);
    const duracionSemanas = Math.ceil(fechaFin.diff(fechaInicio, 'weeks').weeks);

    return {
      total_citas: fechas.length,
      precio_total_serie: precioTotal * fechas.length,
      duracion_total_minutos: duracionMinutos * fechas.length,
      fecha_inicio: fechas[0],
      fecha_fin: fechas[fechas.length - 1],
      duracion_semanas: duracionSemanas
    };
  }
}

module.exports = {
  RecurrenciaUtil,
  FRECUENCIAS,
  DIAS_SEMANA,
  DEFAULTS
};
