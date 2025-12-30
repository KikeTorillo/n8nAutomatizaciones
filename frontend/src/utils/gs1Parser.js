/**
 * Parser de códigos GS1-128
 * Extrae Application Identifiers de un código de barras
 *
 * GS1-128 codifica múltiples datos en un código usando AIs:
 * ]C10107501234567890172512311021-A2115678
 *      ↑              ↑      ↑     ↑
 *     (01) GTIN    (17) Exp  (10) Lote  (21) Serie
 */

// Definición de AIs con longitudes
const AI_DEFINITIONS = {
  '00': { name: 'sscc', length: 18, fixed: true },
  '01': { name: 'gtin', length: 14, fixed: true },
  '02': { name: 'content', length: 14, fixed: true },
  '10': { name: 'lot', length: 20, fixed: false },
  '11': { name: 'productionDate', length: 6, fixed: true },
  '13': { name: 'packagingDate', length: 6, fixed: true },
  '15': { name: 'bestBeforeDate', length: 6, fixed: true },
  '17': { name: 'expirationDate', length: 6, fixed: true },
  '21': { name: 'serial', length: 20, fixed: false },
  '30': { name: 'varCount', length: 8, fixed: false },
  '37': { name: 'count', length: 8, fixed: false },
  '310': { name: 'netWeightKg', length: 6, fixed: true },
  '320': { name: 'netWeightLb', length: 6, fixed: true },
};

// Caracteres de inicio GS1 (Symbology Identifiers)
const GS1_PREFIXES = [']C1', ']e0', ']d2', ']Q3', ']J1'];

// FNC1 - Group Separator (ASCII 29)
const FNC1 = '\x1D';

/**
 * Detecta si un código es GS1
 * @param {string} code - Código a evaluar
 * @returns {boolean}
 */
export function isGS1(code) {
  if (!code || code.length < 16) return false;

  // Tiene prefijo GS1 (Symbology Identifier)
  if (GS1_PREFIXES.some(p => code.startsWith(p))) return true;

  // Empieza con AI conocido (01, 02, 10, etc.)
  const first2 = code.substring(0, 2);
  const first3 = code.substring(0, 3);

  return !!(AI_DEFINITIONS[first2] || AI_DEFINITIONS[first3]);
}

/**
 * Convierte fecha GS1 (YYMMDD) a ISO (YYYY-MM-DD)
 * @param {string} gs1Date - Fecha en formato YYMMDD
 * @returns {string|null} Fecha en formato YYYY-MM-DD
 */
function formatGS1Date(gs1Date) {
  if (!gs1Date || gs1Date.length !== 6) return null;

  const yy = parseInt(gs1Date.substring(0, 2), 10);
  const mm = gs1Date.substring(2, 4);
  const dd = gs1Date.substring(4, 6);

  // Asumir 2000+ para años < 50, 1900+ para >= 50
  const yyyy = yy < 50 ? 2000 + yy : 1900 + yy;

  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parsea un código GS1 y extrae los campos
 * @param {string} code - Código de barras escaneado
 * @returns {Object} Objeto con campos extraídos:
 *   - isGS1: boolean - Si es código GS1
 *   - raw: string - Código original
 *   - gtin: string - Código de producto (GTIN o código normal)
 *   - lot: string - Número de lote (si existe)
 *   - serial: string - Número de serie (si existe)
 *   - expirationDate: string - Fecha vencimiento YYMMDD (si existe)
 *   - expirationDateFormatted: string - Fecha vencimiento YYYY-MM-DD
 *   - productionDate: string - Fecha producción YYMMDD (si existe)
 *   - productionDateFormatted: string - Fecha producción YYYY-MM-DD
 */
export function parseGS1(code) {
  if (!code) return { isGS1: false, raw: code };

  // Limpiar prefijo GS1 si existe
  let cleanCode = code;
  for (const prefix of GS1_PREFIXES) {
    if (cleanCode.startsWith(prefix)) {
      cleanCode = cleanCode.substring(prefix.length);
      break;
    }
  }

  // Si no parece GS1, retornar como código normal
  if (!isGS1(cleanCode) && !isGS1(code)) {
    return { isGS1: false, raw: code, gtin: code };
  }

  const result = { isGS1: true, raw: code };
  let pos = 0;

  while (pos < cleanCode.length) {
    // Buscar AI de 2 dígitos primero
    let ai = cleanCode.substring(pos, pos + 2);
    let aiDef = AI_DEFINITIONS[ai];

    // Si no existe, buscar AI de 3 dígitos
    if (!aiDef) {
      ai = cleanCode.substring(pos, pos + 3);
      aiDef = AI_DEFINITIONS[ai];
    }

    if (!aiDef) {
      // AI no reconocido, avanzar un caracter
      pos++;
      continue;
    }

    pos += ai.length;

    if (aiDef.fixed) {
      // Longitud fija - tomar exactamente esa cantidad
      result[aiDef.name] = cleanCode.substring(pos, pos + aiDef.length);
      pos += aiDef.length;
    } else {
      // Longitud variable - buscar FNC1 (separador) o fin de string
      let endPos = cleanCode.indexOf(FNC1, pos);
      if (endPos === -1) endPos = cleanCode.length;

      result[aiDef.name] = cleanCode.substring(pos, endPos);
      pos = endPos + 1; // Saltar FNC1
    }
  }

  // Formatear fechas si existen
  if (result.expirationDate) {
    result.expirationDateFormatted = formatGS1Date(result.expirationDate);
  }
  if (result.productionDate) {
    result.productionDateFormatted = formatGS1Date(result.productionDate);
  }
  if (result.bestBeforeDate) {
    result.bestBeforeDateFormatted = formatGS1Date(result.bestBeforeDate);
  }
  if (result.packagingDate) {
    result.packagingDateFormatted = formatGS1Date(result.packagingDate);
  }

  return result;
}

/**
 * Extrae solo el GTIN/código de producto de un código (GS1 o normal)
 * Útil para búsqueda de productos
 * @param {string} code - Código de barras escaneado
 * @returns {string} Código de producto limpio (EAN-13 si es GTIN-14 con indicador 0)
 */
export function extractProductCode(code) {
  const parsed = parseGS1(code);
  const gtin = parsed.gtin || parsed.raw || code;

  // Si es GTIN-14 que empieza con 0 (indicador de unidad), convertir a EAN-13
  // Ejemplo: 07501234567890 → 7501234567890
  if (gtin && gtin.length === 14 && gtin.startsWith('0')) {
    return gtin.substring(1); // Retorna EAN-13
  }

  return gtin;
}

/**
 * Normaliza un GTIN a 14 dígitos (añade ceros a la izquierda)
 * @param {string} gtin - GTIN de cualquier longitud
 * @returns {string} GTIN de 14 dígitos
 */
export function normalizeGTIN(gtin) {
  if (!gtin) return gtin;
  const clean = gtin.replace(/\D/g, '');
  return clean.padStart(14, '0');
}

/**
 * Extrae el EAN-13 de un GTIN-14 (quita el dígito de empaque)
 * @param {string} gtin14 - GTIN de 14 dígitos
 * @returns {string} EAN-13 (últimos 13 dígitos)
 */
export function gtinToEAN13(gtin14) {
  if (!gtin14 || gtin14.length < 13) return gtin14;
  return gtin14.slice(-13);
}
