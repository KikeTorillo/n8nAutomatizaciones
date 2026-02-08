/**
 * Factory para manejadores de error en mutaciones
 *
 * Ene 2026: Centraliza el manejo de errores HTTP en mutaciones.
 * Feb 2026: Migrado a TypeScript con tipos de retorno correctos.
 */

type ErrorMessages = Record<number, string>;

/** Error tipo Axios con response HTTP */
interface ApiError extends Error {
  response?: {
    status?: number;
    data?: {
      message?: string;
      mensaje?: string;
    };
  };
}

/** Handler compatible con useMutation onError (acepta params extra) */
export type MutationErrorHandler = (error: Error, ...args: unknown[]) => void;

/**
 * Crea un manejador de errores para mutaciones.
 * El handler re-lanza con un mensaje descriptivo basado en el código HTTP.
 */
export function createErrorHandler(
  errorMessages: ErrorMessages = {},
  defaultMessage: string = 'Error inesperado',
): MutationErrorHandler {
  return (error: Error) => {
    const apiError = error as ApiError;

    // Prioridad 1: Mensaje del backend
    const backendMessage = apiError.response?.data?.message;
    if (backendMessage) {
      throw new Error(backendMessage);
    }

    // Prioridad 2: Mensaje según código HTTP
    const statusCode = apiError.response?.status;
    if (statusCode && errorMessages[statusCode]) {
      throw new Error(errorMessages[statusCode]);
    }

    // Fallback: Mensaje por defecto
    throw new Error(defaultMessage);
  };
}

/** Mensajes de error comunes reutilizables */
export const COMMON_ERROR_MESSAGES = {
  NOT_FOUND: { 404: 'Recurso no encontrado' } as ErrorMessages,
  FORBIDDEN: { 403: 'No tienes permisos para esta acción' } as ErrorMessages,
  CONFLICT: { 409: 'Ya existe un registro con esos datos' } as ErrorMessages,
  BAD_REQUEST: { 400: 'Datos inválidos' } as ErrorMessages,
  SERVER_ERROR: { 500: 'Error del servidor' } as ErrorMessages,
  UNAUTHORIZED: { 401: 'Sesión expirada, vuelve a iniciar sesión' } as ErrorMessages,
};

/**
 * Combina múltiples grupos de mensajes de error
 */
export function combineErrorMessages(...groups: ErrorMessages[]): ErrorMessages {
  return Object.assign({}, ...groups);
}

/**
 * Extrae el mensaje de error de una excepción
 */
export function getErrorMessage(error: unknown, fallback: string = 'Ocurrió un error'): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  const apiError = error as ApiError | undefined;
  if (apiError?.response?.data?.message) {
    return apiError.response.data.message;
  }
  return fallback;
}

type CRUDOperation = 'create' | 'update' | 'delete' | 'fetch';

/**
 * Crea un manejador de errores especializado para operaciones CRUD.
 * Genera mensajes contextuales basados en la operación y entidad.
 */
export function createCRUDErrorHandler(
  operacion: CRUDOperation,
  entidad: string,
  customMessages: ErrorMessages = {},
): MutationErrorHandler {
  const operationLabels: Record<string, string> = {
    create: 'crear',
    update: 'actualizar',
    delete: 'eliminar',
    fetch: 'obtener',
  };

  const label = operationLabels[operacion] || operacion;

  const defaultMessages: ErrorMessages = {
    404: `${entidad} no encontrado`,
    409: `Ya existe un ${entidad.toLowerCase()} con esos datos`,
    400: 'Datos inválidos',
    403: `No tienes permisos para ${label} ${entidad.toLowerCase()}`,
    422: 'Error de validación',
    500: 'Error del servidor',
  };

  return createErrorHandler(
    { ...defaultMessages, ...customMessages },
    `Error al ${label} ${entidad.toLowerCase()}`,
  );
}

/** Presets de error handlers para operaciones comunes */
export const ErrorHandlers = {
  crear: (entidad: string, custom: ErrorMessages = {}) => createCRUDErrorHandler('create', entidad, custom),
  actualizar: (entidad: string, custom: ErrorMessages = {}) => createCRUDErrorHandler('update', entidad, custom),
  eliminar: (entidad: string, custom: ErrorMessages = {}) => createCRUDErrorHandler('delete', entidad, custom),
  obtener: (entidad: string, custom: ErrorMessages = {}) => createCRUDErrorHandler('fetch', entidad, custom),
};
