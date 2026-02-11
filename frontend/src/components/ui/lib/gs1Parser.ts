/**
 * Parser de códigos GS1-128
 * Extrae Application Identifiers de un código de barras
 */

interface AIDefinition {
  name: string;
  length: number;
  fixed: boolean;
}

const AI_DEFINITIONS: Record<string, AIDefinition> = {
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

const GS1_PREFIXES = [']C1', ']e0', ']d2', ']Q3', ']J1'];
const FNC1 = '\x1D';

export interface GS1Result {
  isGS1: boolean;
  raw: string;
  gtin?: string;
  lot?: string;
  serial?: string;
  expirationDate?: string;
  expirationDateFormatted?: string;
  productionDate?: string;
  productionDateFormatted?: string;
  bestBeforeDate?: string;
  bestBeforeDateFormatted?: string;
  packagingDate?: string;
  packagingDateFormatted?: string;
  [key: string]: unknown;
}

function isGS1(code: string): boolean {
  if (!code || code.length < 16) return false;
  if (GS1_PREFIXES.some((p) => code.startsWith(p))) return true;
  const first2 = code.substring(0, 2);
  const first3 = code.substring(0, 3);
  return !!(AI_DEFINITIONS[first2] || AI_DEFINITIONS[first3]);
}

function formatGS1Date(gs1Date: string): string | null {
  if (!gs1Date || gs1Date.length !== 6) return null;
  const yy = parseInt(gs1Date.substring(0, 2), 10);
  const mm = gs1Date.substring(2, 4);
  const dd = gs1Date.substring(4, 6);
  const yyyy = yy < 50 ? 2000 + yy : 1900 + yy;
  return `${yyyy}-${mm}-${dd}`;
}

export function parseGS1(code: string): GS1Result {
  if (!code) return { isGS1: false, raw: code };

  let cleanCode = code;
  for (const prefix of GS1_PREFIXES) {
    if (cleanCode.startsWith(prefix)) {
      cleanCode = cleanCode.substring(prefix.length);
      break;
    }
  }

  if (!isGS1(cleanCode) && !isGS1(code)) {
    return { isGS1: false, raw: code, gtin: code };
  }

  const result: GS1Result = { isGS1: true, raw: code };
  let pos = 0;

  while (pos < cleanCode.length) {
    let ai = cleanCode.substring(pos, pos + 2);
    let aiDef = AI_DEFINITIONS[ai];

    if (!aiDef) {
      ai = cleanCode.substring(pos, pos + 3);
      aiDef = AI_DEFINITIONS[ai];
    }

    if (!aiDef) {
      pos++;
      continue;
    }

    pos += ai.length;

    if (aiDef.fixed) {
      (result as Record<string, unknown>)[aiDef.name] = cleanCode.substring(
        pos,
        pos + aiDef.length
      );
      pos += aiDef.length;
    } else {
      let endPos = cleanCode.indexOf(FNC1, pos);
      if (endPos === -1) endPos = cleanCode.length;
      (result as Record<string, unknown>)[aiDef.name] = cleanCode.substring(
        pos,
        endPos
      );
      pos = endPos + 1;
    }
  }

  if (result.expirationDate) {
    result.expirationDateFormatted =
      formatGS1Date(result.expirationDate) ?? undefined;
  }
  if (result.productionDate) {
    result.productionDateFormatted =
      formatGS1Date(result.productionDate) ?? undefined;
  }
  if (result.bestBeforeDate) {
    result.bestBeforeDateFormatted =
      formatGS1Date(result.bestBeforeDate) ?? undefined;
  }
  if (result.packagingDate) {
    result.packagingDateFormatted =
      formatGS1Date(result.packagingDate) ?? undefined;
  }

  return result;
}

export function extractProductCode(code: string): string {
  const parsed = parseGS1(code);
  const gtin = parsed.gtin || parsed.raw || code;
  if (gtin && gtin.length === 14 && gtin.startsWith('0')) {
    return gtin.substring(1);
  }
  return gtin;
}
