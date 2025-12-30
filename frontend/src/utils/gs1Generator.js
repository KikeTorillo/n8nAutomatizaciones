/**
 * Generador de códigos GS1-128
 * Construye códigos de barras con Application Identifiers
 *
 * Ejemplo de salida:
 * 0107501234567890172512311021-A → (01)07501234567890(17)251231(10)21-A
 */

// FNC1 - Group Separator (ASCII 29) para AIs de longitud variable
const FNC1 = '\x1D';

// Definición de AIs con sus características
const AI_CONFIG = {
  '01': { name: 'gtin', length: 14, fixed: true, label: 'GTIN' },
  '02': { name: 'content', length: 14, fixed: true, label: 'Contenido' },
  '10': { name: 'lot', length: 20, fixed: false, label: 'Lote' },
  '11': { name: 'productionDate', length: 6, fixed: true, label: 'Fecha Producción' },
  '13': { name: 'packagingDate', length: 6, fixed: true, label: 'Fecha Empaque' },
  '15': { name: 'bestBeforeDate', length: 6, fixed: true, label: 'Consumir Antes' },
  '17': { name: 'expirationDate', length: 6, fixed: true, label: 'Fecha Vencimiento' },
  '21': { name: 'serial', length: 20, fixed: false, label: 'Número Serie' },
  '30': { name: 'varCount', length: 8, fixed: false, label: 'Cantidad Variable' },
  '37': { name: 'count', length: 8, fixed: false, label: 'Cantidad' },
  '00': { name: 'sscc', length: 18, fixed: true, label: 'SSCC' },
};

// Orden estándar de AIs en código GS1
const AI_ORDER = ['00', '01', '02', '17', '15', '13', '11', '10', '21', '37', '30'];

/**
 * Convierte fecha ISO (YYYY-MM-DD) a formato GS1 (YYMMDD)
 * @param {string} isoDate - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha en formato YYMMDD
 */
export function formatDateToGS1(isoDate) {
  if (!isoDate) return null;

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return null;

  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yy}${mm}${dd}`;
}

/**
 * Convierte fecha GS1 (YYMMDD) a formato ISO (YYYY-MM-DD)
 * @param {string} gs1Date - Fecha en formato YYMMDD
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function formatGS1ToDate(gs1Date) {
  if (!gs1Date || gs1Date.length !== 6) return null;

  const yy = parseInt(gs1Date.substring(0, 2), 10);
  const mm = gs1Date.substring(2, 4);
  const dd = gs1Date.substring(4, 6);

  // Asumir 2000+ para años < 50, 1900+ para >= 50
  const yyyy = yy < 50 ? 2000 + yy : 1900 + yy;

  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Normaliza un GTIN a 14 dígitos (añade ceros a la izquierda)
 * @param {string} code - Código de producto (EAN-13, UPC-A, etc.)
 * @returns {string} GTIN de 14 dígitos
 */
export function normalizeToGTIN14(code) {
  if (!code) return null;
  const clean = code.replace(/\D/g, '');
  return clean.padStart(14, '0');
}

/**
 * Calcula el dígito de verificación para un código
 * @param {string} code - Código sin dígito de verificación
 * @returns {number} Dígito de verificación
 */
export function calculateCheckDigit(code) {
  const digits = code.replace(/\D/g, '').split('').map(Number);
  let sum = 0;

  for (let i = 0; i < digits.length; i++) {
    const multiplier = (digits.length - i) % 2 === 0 ? 1 : 3;
    sum += digits[i] * multiplier;
  }

  return (10 - (sum % 10)) % 10;
}

/**
 * Valida los parámetros para generación de código GS1
 * @param {Object} params - Parámetros del código
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateGS1Params(params) {
  const errors = [];

  // GTIN es obligatorio
  if (!params.gtin) {
    errors.push('GTIN es obligatorio');
  } else {
    const cleanGtin = params.gtin.replace(/\D/g, '');
    if (cleanGtin.length < 8 || cleanGtin.length > 14) {
      errors.push('GTIN debe tener entre 8 y 14 dígitos');
    }
  }

  // Lote: alfanumérico, máximo 20 caracteres
  if (params.lot && params.lot.length > 20) {
    errors.push('Lote: máximo 20 caracteres');
  }

  // Serial: alfanumérico, máximo 20 caracteres
  if (params.serial && params.serial.length > 20) {
    errors.push('Número de serie: máximo 20 caracteres');
  }

  // Fechas válidas
  if (params.expirationDate) {
    const date = new Date(params.expirationDate);
    if (isNaN(date.getTime())) {
      errors.push('Fecha de vencimiento inválida');
    }
  }

  if (params.productionDate) {
    const date = new Date(params.productionDate);
    if (isNaN(date.getTime())) {
      errors.push('Fecha de producción inválida');
    }
  }

  // Cantidad: número positivo
  if (params.count !== undefined && params.count !== null && params.count !== '') {
    const count = parseInt(params.count, 10);
    if (isNaN(count) || count < 1 || count > 99999999) {
      errors.push('Cantidad debe ser entre 1 y 99999999');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Genera un código GS1-128 a partir de los parámetros
 * @param {Object} params - Parámetros del código
 * @param {string} params.gtin - GTIN del producto (obligatorio)
 * @param {string} [params.lot] - Número de lote
 * @param {string} [params.serial] - Número de serie
 * @param {string} [params.expirationDate] - Fecha vencimiento (YYYY-MM-DD)
 * @param {string} [params.productionDate] - Fecha producción (YYYY-MM-DD)
 * @param {number} [params.count] - Cantidad
 * @param {string} [params.sscc] - SSCC para logística
 * @returns {Object} { code: string, humanReadable: string, errors: string[] }
 */
export function generateGS1Code(params) {
  const validation = validateGS1Params(params);
  if (!validation.valid) {
    return { code: null, humanReadable: null, errors: validation.errors };
  }

  const parts = [];
  const humanParts = [];

  // Construir código en orden estándar
  for (const ai of AI_ORDER) {
    const config = AI_CONFIG[ai];
    if (!config) continue;

    let value = null;

    switch (ai) {
      case '01':
        if (params.gtin) {
          value = normalizeToGTIN14(params.gtin);
        }
        break;
      case '10':
        if (params.lot) {
          value = params.lot;
        }
        break;
      case '21':
        if (params.serial) {
          value = params.serial;
        }
        break;
      case '17':
        if (params.expirationDate) {
          value = formatDateToGS1(params.expirationDate);
        }
        break;
      case '11':
        if (params.productionDate) {
          value = formatDateToGS1(params.productionDate);
        }
        break;
      case '37':
        if (params.count !== undefined && params.count !== null && params.count !== '') {
          value = String(params.count);
        }
        break;
      case '00':
        if (params.sscc) {
          value = params.sscc.padStart(18, '0');
        }
        break;
    }

    if (value) {
      // Para AIs de longitud variable, añadir FNC1 al final (excepto el último)
      if (!config.fixed) {
        parts.push(`${ai}${value}${FNC1}`);
      } else {
        parts.push(`${ai}${value}`);
      }
      humanParts.push(`(${ai})${value}`);
    }
  }

  // Unir partes (quitar FNC1 final si existe)
  let code = parts.join('');
  if (code.endsWith(FNC1)) {
    code = code.slice(0, -1);
  }

  return {
    code,
    humanReadable: humanParts.join(' '),
    errors: [],
  };
}

/**
 * Formatea un código GS1 para mostrar human-readable
 * @param {string} code - Código GS1 raw
 * @returns {string} Código con AIs entre paréntesis
 */
export function formatGS1HumanReadable(code) {
  if (!code) return '';

  // Limpiar prefijos GS1 si existen
  let clean = code;
  const prefixes = [']C1', ']e0', ']d2', ']Q3', ']J1'];
  for (const prefix of prefixes) {
    if (clean.startsWith(prefix)) {
      clean = clean.substring(prefix.length);
      break;
    }
  }

  // Parsear y formatear
  const parts = [];
  let pos = 0;

  while (pos < clean.length) {
    // Buscar AI de 2 o 3 dígitos
    let ai = clean.substring(pos, pos + 2);
    let config = AI_CONFIG[ai];

    if (!config) {
      ai = clean.substring(pos, pos + 3);
      config = AI_CONFIG[ai];
    }

    if (!config) {
      pos++;
      continue;
    }

    pos += ai.length;

    if (config.fixed) {
      const value = clean.substring(pos, pos + config.length);
      parts.push(`(${ai})${value}`);
      pos += config.length;
    } else {
      // Buscar FNC1 o fin
      let endPos = clean.indexOf(FNC1, pos);
      if (endPos === -1) endPos = clean.length;

      const value = clean.substring(pos, endPos);
      parts.push(`(${ai})${value}`);
      pos = endPos + 1;
    }
  }

  return parts.join(' ');
}

/**
 * Plantillas predefinidas para diferentes industrias
 */
export const GS1_TEMPLATES = {
  FARMACEUTICA: {
    name: 'Farmacéutica',
    description: 'Medicamentos con lote y vencimiento',
    fields: ['gtin', 'lot', 'expirationDate'],
    required: ['gtin', 'lot', 'expirationDate'],
    icon: 'Pill',
  },
  ELECTRONICOS: {
    name: 'Electrónicos',
    description: 'Dispositivos con número de serie',
    fields: ['gtin', 'serial'],
    required: ['gtin', 'serial'],
    icon: 'Smartphone',
  },
  ALIMENTOS: {
    name: 'Alimentos',
    description: 'Productos con lote y fecha de producción',
    fields: ['gtin', 'lot', 'productionDate', 'expirationDate'],
    required: ['gtin', 'lot'],
    icon: 'Apple',
  },
  LOGISTICA: {
    name: 'Logística',
    description: 'Contenedores y pallets',
    fields: ['sscc', 'count'],
    required: ['sscc'],
    icon: 'Package',
  },
  PERSONALIZADO: {
    name: 'Personalizado',
    description: 'Configura los campos manualmente',
    fields: ['gtin', 'lot', 'serial', 'expirationDate', 'productionDate', 'count'],
    required: ['gtin'],
    icon: 'Settings',
  },
};

/**
 * Obtiene la configuración de un AI
 * @param {string} ai - Application Identifier
 * @returns {Object|null} Configuración del AI
 */
export function getAIConfig(ai) {
  return AI_CONFIG[ai] || null;
}

/**
 * Lista todos los AIs soportados
 * @returns {Array} Lista de AIs con su configuración
 */
export function listSupportedAIs() {
  return Object.entries(AI_CONFIG).map(([ai, config]) => ({
    ai,
    ...config,
  }));
}
