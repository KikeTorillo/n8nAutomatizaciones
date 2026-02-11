/**
 * Helpers para extraer datos tipados de respuestas API
 *
 * El backend wrappea respuestas en { success, data, message, timestamp }
 * Axios agrega su propio .data → response.data.data = payload real
 *
 * Estos helpers eliminan el patrón (response as any).data.data
 */

interface ApiResponseWrapper<T = unknown> {
  data: {
    success?: boolean;
    data: T;
    message?: string;
    timestamp?: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    meta?: Record<string, unknown>;
  };
}

/**
 * Extrae el payload tipado de una respuesta API.
 * Reemplaza `(response as any).data.data`
 *
 * @example
 * const response = await api.obtener(id);
 * const producto = extractData<Producto>(response);
 */
export function extractData<T>(response: ApiResponseWrapper<T>): T {
  return response.data.data;
}

/**
 * Extrae el payload tipado con valor por defecto.
 *
 * @example
 * const items = extractDataOr<Producto[]>(response, []);
 */
export function extractDataOr<T>(
  response: ApiResponseWrapper<T>,
  defaultValue: T
): T {
  return response.data?.data ?? defaultValue;
}

/**
 * Extrae datos y paginación de una respuesta de lista.
 *
 * @example
 * const { data, pagination } = extractListData<Producto>(response);
 */
export function extractListData<T>(response: ApiResponseWrapper<T>): {
  data: T;
  pagination: ApiResponseWrapper<T>['data']['pagination'];
} {
  return {
    data: response.data.data,
    pagination:
      response.data.pagination ||
      (response.data.meta as ApiResponseWrapper<T>['data']['pagination']),
  };
}
