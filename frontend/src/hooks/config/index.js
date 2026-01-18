/**
 * Configuración centralizada para hooks
 * Ene 2026
 */

export {
  createErrorHandler,
  COMMON_ERROR_MESSAGES,
  combineErrorMessages,
  getErrorMessage,
} from './errorHandlerFactory';

export {
  CACHE_DURATIONS,
  DEFAULT_QUERY_OPTIONS,
  STATIC_QUERY_OPTIONS,
  REALTIME_QUERY_OPTIONS,
  LIST_QUERY_OPTIONS,
  createMutationOptions,
  buildQueryKey,
} from './queryConfig';

export { queryKeys, getDomainKeys } from './queryKeys';
