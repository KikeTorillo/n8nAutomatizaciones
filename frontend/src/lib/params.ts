/**
 * Utilidades para sanitización de parámetros antes de enviar a la API.
 * Evita enviar valores vacíos que el backend (Joi) rechazaría.
 *
 * Ene 2026 - Optimización Frontend
 */

/**
 * Sanitiza parámetros eliminando valores vacíos, null y undefined.
 * Preserva el tipo de entrada para compatibilidad con APIs tipadas.
 */
export function sanitizeParams<T extends Record<string, unknown> | object>(params: T = {} as T): T {
  return Object.entries(params).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {}) as T;
}

/**
 * Sanitiza parámetros excluyendo también valores falsy específicos.
 * Útil para formularios donde 0 y false son valores válidos pero strings vacíos no.
 */
export function sanitizeParamsStrict<T extends Record<string, unknown> | object>(
  params: T = {} as T,
  excludeValues: unknown[] = [],
): T {
  const baseExclude: unknown[] = ['', null, undefined];
  const allExclude = [...baseExclude, ...excludeValues];

  return Object.entries(params).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (!allExclude.includes(value)) {
      acc[key] = value;
    }
    return acc;
  }, {}) as T;
}

export default sanitizeParams;
