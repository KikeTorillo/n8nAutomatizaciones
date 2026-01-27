/**
 * Catálogo de Feriados LATAM
 *
 * Países incluidos: México, Colombia, Argentina, Chile, Perú
 *
 * Formato:
 * - fecha: 'MM-DD' - Día y mes (permite calcular para cualquier año)
 * - nombre: string - Nombre del feriado
 * - fijo: boolean - true = siempre mismo día, false = fecha móvil
 * - descripcion: string (opcional) - Descripción adicional
 */

export const FERIADOS_LATAM = {
  MX: {
    codigo: 'MX',
    nombre: 'México',
    bandera: '🇲🇽',
    feriados: [
      { fecha: '01-01', nombre: 'Año Nuevo', fijo: true },
      { fecha: '02-05', nombre: 'Día de la Constitución', fijo: false, descripcion: 'Primer lunes de febrero' },
      { fecha: '03-21', nombre: 'Natalicio de Benito Juárez', fijo: false, descripcion: 'Tercer lunes de marzo' },
      { fecha: '05-01', nombre: 'Día del Trabajo', fijo: true },
      { fecha: '09-16', nombre: 'Día de la Independencia', fijo: true },
      { fecha: '11-20', nombre: 'Revolución Mexicana', fijo: false, descripcion: 'Tercer lunes de noviembre' },
      { fecha: '12-01', nombre: 'Transmisión del Poder Ejecutivo', fijo: false, descripcion: 'Cada 6 años' },
      { fecha: '12-25', nombre: 'Navidad', fijo: true },
    ],
  },

  CO: {
    codigo: 'CO',
    nombre: 'Colombia',
    bandera: '🇨🇴',
    feriados: [
      { fecha: '01-01', nombre: 'Año Nuevo', fijo: true },
      { fecha: '01-06', nombre: 'Día de los Reyes Magos', fijo: false, descripcion: 'Lunes siguiente si cae en otro día' },
      { fecha: '03-19', nombre: 'Día de San José', fijo: false, descripcion: 'Lunes siguiente si cae en otro día' },
      // Semana Santa - fechas variables
      { fecha: '05-01', nombre: 'Día del Trabajo', fijo: true },
      { fecha: '05-25', nombre: 'Ascensión del Señor', fijo: false, descripcion: 'Fecha variable (39 días después de Pascua)' },
      { fecha: '06-15', nombre: 'Corpus Christi', fijo: false, descripcion: 'Fecha variable (60 días después de Pascua)' },
      { fecha: '06-22', nombre: 'Sagrado Corazón', fijo: false, descripcion: 'Fecha variable (68 días después de Pascua)' },
      { fecha: '06-29', nombre: 'San Pedro y San Pablo', fijo: false, descripcion: 'Lunes siguiente si cae en otro día' },
      { fecha: '07-20', nombre: 'Día de la Independencia', fijo: true },
      { fecha: '08-07', nombre: 'Batalla de Boyacá', fijo: true },
      { fecha: '08-15', nombre: 'Asunción de la Virgen', fijo: false, descripcion: 'Lunes siguiente si cae en otro día' },
      { fecha: '10-12', nombre: 'Día de la Raza', fijo: false, descripcion: 'Lunes siguiente si cae en otro día' },
      { fecha: '11-01', nombre: 'Todos los Santos', fijo: false, descripcion: 'Lunes siguiente si cae en otro día' },
      { fecha: '11-11', nombre: 'Independencia de Cartagena', fijo: false, descripcion: 'Lunes siguiente si cae en otro día' },
      { fecha: '12-08', nombre: 'Inmaculada Concepción', fijo: true },
      { fecha: '12-25', nombre: 'Navidad', fijo: true },
    ],
  },

  AR: {
    codigo: 'AR',
    nombre: 'Argentina',
    bandera: '🇦🇷',
    feriados: [
      { fecha: '01-01', nombre: 'Año Nuevo', fijo: true },
      { fecha: '02-20', nombre: 'Carnaval', fijo: false, descripcion: 'Fecha variable' },
      { fecha: '02-21', nombre: 'Carnaval', fijo: false, descripcion: 'Fecha variable' },
      { fecha: '03-24', nombre: 'Día Nacional de la Memoria', fijo: true },
      { fecha: '04-02', nombre: 'Día del Veterano y de los Caídos', fijo: true },
      // Semana Santa - fechas variables
      { fecha: '05-01', nombre: 'Día del Trabajador', fijo: true },
      { fecha: '05-25', nombre: 'Día de la Revolución de Mayo', fijo: true },
      { fecha: '06-17', nombre: 'Paso a la Inmortalidad del Gral. Güemes', fijo: false, descripcion: 'Feriado puente movible' },
      { fecha: '06-20', nombre: 'Día de la Bandera', fijo: true },
      { fecha: '07-09', nombre: 'Día de la Independencia', fijo: true },
      { fecha: '08-17', nombre: 'Paso a la Inmortalidad del Gral. San Martín', fijo: false, descripcion: 'Tercer lunes de agosto' },
      { fecha: '10-12', nombre: 'Día del Respeto a la Diversidad Cultural', fijo: false, descripcion: 'Segundo lunes de octubre' },
      { fecha: '11-20', nombre: 'Día de la Soberanía Nacional', fijo: false, descripcion: 'Cuarto lunes de noviembre' },
      { fecha: '12-08', nombre: 'Inmaculada Concepción', fijo: true },
      { fecha: '12-25', nombre: 'Navidad', fijo: true },
    ],
  },

  CL: {
    codigo: 'CL',
    nombre: 'Chile',
    bandera: '🇨🇱',
    feriados: [
      { fecha: '01-01', nombre: 'Año Nuevo', fijo: true },
      // Viernes y Sábado Santo - fechas variables
      { fecha: '05-01', nombre: 'Día del Trabajo', fijo: true },
      { fecha: '05-21', nombre: 'Día de las Glorias Navales', fijo: true },
      { fecha: '06-07', nombre: 'San Pedro y San Pablo', fijo: false, descripcion: 'Se traslada al lunes más cercano' },
      { fecha: '06-26', nombre: 'Día de los Pueblos Indígenas', fijo: false, descripcion: 'Solsticio de invierno' },
      { fecha: '07-16', nombre: 'Día de la Virgen del Carmen', fijo: true },
      { fecha: '08-15', nombre: 'Asunción de la Virgen', fijo: true },
      { fecha: '09-18', nombre: 'Fiestas Patrias', fijo: true },
      { fecha: '09-19', nombre: 'Día de las Glorias del Ejército', fijo: true },
      { fecha: '10-12', nombre: 'Encuentro de Dos Mundos', fijo: false, descripcion: 'Se traslada al lunes más cercano' },
      { fecha: '10-31', nombre: 'Día de las Iglesias Evangélicas', fijo: true },
      { fecha: '11-01', nombre: 'Día de Todos los Santos', fijo: true },
      { fecha: '12-08', nombre: 'Inmaculada Concepción', fijo: true },
      { fecha: '12-25', nombre: 'Navidad', fijo: true },
    ],
  },

  PE: {
    codigo: 'PE',
    nombre: 'Perú',
    bandera: '🇵🇪',
    feriados: [
      { fecha: '01-01', nombre: 'Año Nuevo', fijo: true },
      // Jueves y Viernes Santo - fechas variables
      { fecha: '05-01', nombre: 'Día del Trabajo', fijo: true },
      { fecha: '06-07', nombre: 'Día de la Bandera', fijo: true },
      { fecha: '06-29', nombre: 'San Pedro y San Pablo', fijo: true },
      { fecha: '07-23', nombre: 'Día de la Fuerza Aérea', fijo: true },
      { fecha: '07-28', nombre: 'Fiestas Patrias', fijo: true },
      { fecha: '07-29', nombre: 'Fiestas Patrias', fijo: true },
      { fecha: '08-06', nombre: 'Batalla de Junín', fijo: true },
      { fecha: '08-30', nombre: 'Santa Rosa de Lima', fijo: true },
      { fecha: '10-08', nombre: 'Combate de Angamos', fijo: true },
      { fecha: '11-01', nombre: 'Día de Todos los Santos', fijo: true },
      { fecha: '12-08', nombre: 'Inmaculada Concepción', fijo: true },
      { fecha: '12-09', nombre: 'Batalla de Ayacucho', fijo: true },
      { fecha: '12-25', nombre: 'Navidad', fijo: true },
    ],
  },
};

/**
 * Lista de países disponibles para select
 */
export const PAISES_DISPONIBLES = Object.values(FERIADOS_LATAM).map(pais => ({
  value: pais.codigo,
  label: `${pais.bandera} ${pais.nombre}`,
  nombre: pais.nombre,
  bandera: pais.bandera,
}));

/**
 * Obtener feriados de un país específico
 * @param {string} codigoPais - Código del país (MX, CO, AR, CL, PE)
 * @returns {Array} Lista de feriados
 */
export const obtenerFeriadosPais = (codigoPais) => {
  return FERIADOS_LATAM[codigoPais]?.feriados || [];
};

/**
 * Obtener información del país
 * @param {string} codigoPais - Código del país
 * @returns {Object} Info del país (nombre, bandera)
 */
export const obtenerInfoPais = (codigoPais) => {
  const pais = FERIADOS_LATAM[codigoPais];
  return pais ? { nombre: pais.nombre, bandera: pais.bandera } : null;
};

/**
 * Generar fecha completa para un feriado en un año específico
 * @param {string} fechaMM_DD - Fecha en formato MM-DD
 * @param {number} anio - Año
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const generarFechaCompleta = (fechaMM_DD, anio) => {
  const [mes, dia] = fechaMM_DD.split('-');
  return `${anio}-${mes}-${dia}`;
};

/**
 * Preparar feriados para importación masiva
 * @param {string} codigoPais - Código del país
 * @param {number} anio - Año para el cual importar
 * @returns {Array} Lista de feriados listos para crear como bloqueos
 */
export const prepararFeriadosParaImportacion = (codigoPais, anio) => {
  const pais = FERIADOS_LATAM[codigoPais];
  if (!pais) return [];

  return pais.feriados.map(feriado => {
    const fechaCompleta = generarFechaCompleta(feriado.fecha, anio);
    return {
      titulo: `${pais.bandera} ${feriado.nombre}`,
      descripcion: feriado.descripcion || `Feriado nacional - ${pais.nombre}`,
      fecha_inicio: fechaCompleta,
      fecha_fin: fechaCompleta,
      hora_inicio: null, // Día completo
      hora_fin: null,
      es_recurrente: feriado.fijo,
      fecha_fin_recurrencia: feriado.fijo ? `${anio + 10}-12-31` : null, // 10 años de recurrencia
      patron_recurrencia: feriado.fijo ? {
        tipo: 'anual',
        dia: parseInt(feriado.fecha.split('-')[1]),
        mes: parseInt(feriado.fecha.split('-')[0]),
      } : null,
      origen_bloqueo: 'feriados',
      auto_generado: true,
      profesional_id: null, // Organizacional
      pais_origen: codigoPais,
      feriado_original: feriado,
    };
  });
};

export default {
  FERIADOS_LATAM,
  PAISES_DISPONIBLES,
  obtenerFeriadosPais,
  obtenerInfoPais,
  generarFechaCompleta,
  prepararFeriadosParaImportacion,
};
