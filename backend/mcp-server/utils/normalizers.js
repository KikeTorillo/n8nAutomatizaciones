/**
 * ====================================================================
 * NORMALIZADORES DE ENTRADA PARA MCP TOOLS
 * ====================================================================
 *
 * Funciones para normalizar inputs de modelos de IA antes de validar
 * con Joi schemas. Los modelos pueden enviar formatos variados.
 */

/**
 * Normaliza hora a formato HH:MM
 *
 * Acepta:
 * - "14:0" → "14:00"
 * - "9:30" → "09:30"
 * - "2pm" → "14:00"
 * - "2:30pm" → "14:30"
 * - "9am" → "09:00"
 * - "14:00" → "14:00" (ya válido)
 * - "2 pm" → "14:00" (con espacio)
 * - "02:00" → "02:00" (ya válido)
 *
 * @param {string} hora - Hora en formato variado
 * @returns {string} - Hora normalizada en formato HH:MM o null si inválida
 */
function normalizarHora(hora) {
  if (!hora || typeof hora !== 'string') {
    return null;
  }

  // Limpiar espacios
  hora = hora.trim().toLowerCase();

  // Caso 1: Formato con AM/PM (ej: "2pm", "2:30pm", "9am", "2 pm")
  const ampmRegex = /^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)$/i;
  const ampmMatch = hora.match(ampmRegex);

  if (ampmMatch) {
    let horas = parseInt(ampmMatch[1], 10);
    const minutos = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const periodo = ampmMatch[3].toLowerCase();

    // Validar rangos
    if (horas < 1 || horas > 12 || minutos < 0 || minutos >= 60) {
      return null;
    }

    // Convertir a formato 24h
    if (periodo === 'pm' && horas !== 12) {
      horas += 12;
    } else if (periodo === 'am' && horas === 12) {
      horas = 0;
    }

    // Formatear con padding
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  }

  // Caso 2: Formato 24h (ej: "14:0", "9:30", "14:00")
  const formato24Regex = /^(\d{1,2}):(\d{1,2})$/;
  const formato24Match = hora.match(formato24Regex);

  if (formato24Match) {
    const horas = parseInt(formato24Match[1], 10);
    const minutos = parseInt(formato24Match[2], 10);

    // Validar rangos
    if (horas < 0 || horas >= 24 || minutos < 0 || minutos >= 60) {
      return null;
    }

    // Formatear con padding
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  }

  // Caso 3: Solo horas sin minutos (ej: "14", "9")
  const soloHoraRegex = /^(\d{1,2})$/;
  const soloHoraMatch = hora.match(soloHoraRegex);

  if (soloHoraMatch) {
    const horas = parseInt(soloHoraMatch[1], 10);

    // Validar rangos
    if (horas < 0 || horas >= 24) {
      return null;
    }

    // Asumir minutos = 00
    return `${String(horas).padStart(2, '0')}:00`;
  }

  // No se pudo normalizar
  return null;
}

/**
 * Normaliza fecha a formato DD/MM/YYYY
 *
 * Acepta:
 * - "23/11/2025" → "23/11/2025" (ya válido)
 * - "2025-11-23" → "23/11/2025" (ISO)
 * - "23-11-2025" → "23/11/2025" (con guiones)
 * - "23/11/25" → "23/11/2025" (año corto)
 *
 * @param {string} fecha - Fecha en formato variado
 * @returns {string} - Fecha normalizada DD/MM/YYYY o null si inválida
 */
function normalizarFecha(fecha) {
  if (!fecha || typeof fecha !== 'string') {
    return null;
  }

  // Limpiar espacios
  fecha = fecha.trim();

  // Caso 1: Ya está en formato DD/MM/YYYY
  const formatoDDMMYYYY = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (formatoDDMMYYYY.test(fecha)) {
    return fecha; // Ya válido
  }

  // Caso 2: Formato ISO YYYY-MM-DD
  const formatoISO = /^(\d{4})-(\d{2})-(\d{2})$/;
  const isoMatch = fecha.match(formatoISO);
  if (isoMatch) {
    const [, anio, mes, dia] = isoMatch;
    return `${dia}/${mes}/${anio}`;
  }

  // Caso 3: Formato DD-MM-YYYY (guiones)
  const formatoGuiones = /^(\d{2})-(\d{2})-(\d{4})$/;
  const guionesMatch = fecha.match(formatoGuiones);
  if (guionesMatch) {
    const [, dia, mes, anio] = guionesMatch;
    return `${dia}/${mes}/${anio}`;
  }

  // Caso 4: Formato DD/MM/YY (año corto)
  const formatoAnioCorto = /^(\d{2})\/(\d{2})\/(\d{2})$/;
  const anioCortoMatch = fecha.match(formatoAnioCorto);
  if (anioCortoMatch) {
    const [, dia, mes, anioCorto] = anioCortoMatch;
    // Asumir que años < 50 son 20XX, >= 50 son 19XX
    const anio = parseInt(anioCorto, 10) < 50 ? `20${anioCorto}` : `19${anioCorto}`;
    return `${dia}/${mes}/${anio}`;
  }

  // No se pudo normalizar
  return null;
}

/**
 * Normaliza múltiples campos en un objeto de argumentos
 *
 * @param {Object} args - Argumentos del tool
 * @param {Array<string>} camposHora - Nombres de campos que son horas (ej: ['hora', 'nueva_hora'])
 * @param {Array<string>} camposFecha - Nombres de campos que son fechas (ej: ['fecha', 'nueva_fecha'])
 * @returns {Object} - Objeto con campos normalizados
 */
function normalizarArgumentos(args, camposHora = [], camposFecha = []) {
  const argsNormalizados = { ...args };

  // Normalizar horas
  camposHora.forEach(campo => {
    if (argsNormalizados[campo]) {
      const horaNormalizada = normalizarHora(argsNormalizados[campo]);
      if (horaNormalizada) {
        argsNormalizados[campo] = horaNormalizada;
      }
      // Si no se pudo normalizar, dejar el valor original para que Joi lo rechace
    }
  });

  // Normalizar fechas
  camposFecha.forEach(campo => {
    if (argsNormalizados[campo]) {
      const fechaNormalizada = normalizarFecha(argsNormalizados[campo]);
      if (fechaNormalizada) {
        argsNormalizados[campo] = fechaNormalizada;
      }
      // Si no se pudo normalizar, dejar el valor original para que Joi lo rechace
    }
  });

  return argsNormalizados;
}

module.exports = {
  normalizarHora,
  normalizarFecha,
  normalizarArgumentos,
};
