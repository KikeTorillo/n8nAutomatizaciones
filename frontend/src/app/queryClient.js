import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Constantes de staleTime para diferentes tipos de datos
 * Ene 2026: Estandarización de tiempos de cache
 */
export const STALE_TIMES = {
  VERY_STATIC: 60 * 60 * 1000,  // 1 hora - datos casi inmutables (países, monedas)
  LONG: 30 * 60 * 1000,         // 30 min - configuraciones que cambian poco
  STATIC_DATA: 10 * 60 * 1000,  // 10 min - categorías, tipos, catálogos
  SEMI_STATIC: 5 * 60 * 1000,   // 5 min - default, datos que cambian poco
  MEDIUM: 3 * 60 * 1000,        // 3 min - datos intermedios
  DYNAMIC: 2 * 60 * 1000,       // 2 min - citas, ventas, datos frecuentes
  FREQUENT: 1 * 60 * 1000,      // 1 min - actividades, búsquedas
  REAL_TIME: 30 * 1000,         // 30 seg - stock, disponibilidad, notificaciones
};

/**
 * Handler global de errores para queries
 * Se ejecuta cuando una query falla después de todos los reintentos
 */
const handleQueryError = (error) => {
  // Evitar mostrar toast para errores 401 (manejados por interceptor de auth)
  if (error?.response?.status === 401) {
    return;
  }

  // Evitar mostrar toast para errores cancelados (navegación, unmount)
  if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
    return;
  }

  // Extraer mensaje de error
  const message = error?.response?.data?.error
    || error?.response?.data?.message
    || error?.message
    || 'Error al cargar datos';

  // Log en desarrollo
  if (import.meta.env.DEV) {
    console.error('[React Query] Error en query:', error);
  }

  // Mostrar toast solo para errores significativos
  // No mostrar para errores de red cuando el usuario está offline
  if (!navigator.onLine) {
    toast.error('Sin conexión a internet', {
      id: 'offline-error', // Evitar duplicados
      description: 'Verifica tu conexión e intenta de nuevo',
    });
    return;
  }

  // Para errores 5xx del servidor
  if (error?.response?.status >= 500) {
    toast.error('Error del servidor', {
      description: 'Intenta de nuevo en unos momentos',
    });
    return;
  }

  // Para errores 404, no mostrar toast (puede ser navegación normal)
  if (error?.response?.status === 404) {
    return;
  }

  // Otros errores 4xx
  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    toast.error(message);
    return;
  }
};

/**
 * Handler global de errores para mutations
 * Se ejecuta cuando una mutation falla
 */
const handleMutationError = (error) => {
  // Evitar mostrar toast para errores 401 (manejados por interceptor)
  if (error?.response?.status === 401) {
    return;
  }

  const message = error?.response?.data?.error
    || error?.response?.data?.message
    || error?.message
    || 'Error al realizar la operación';

  // Log en desarrollo
  if (import.meta.env.DEV) {
    console.error('[React Query] Error en mutation:', error);
  }

  // El toast para mutations generalmente se maneja en el componente
  // para tener más contexto, pero podemos manejar casos genéricos aquí

  // Error de validación (400)
  if (error?.response?.status === 400) {
    // No mostrar toast aquí - se maneja en el formulario
    return;
  }

  // Error de permisos (403)
  if (error?.response?.status === 403) {
    toast.error('Sin permisos', {
      description: 'No tienes permisos para realizar esta acción',
    });
    return;
  }

  // Error del servidor (5xx)
  if (error?.response?.status >= 500) {
    toast.error('Error del servidor', {
      description: 'No se pudo completar la operación',
    });
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // No reintentar para errores de auth
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        // No reintentar para errores 404
        if (error?.response?.status === 404) {
          return false;
        }
        // Máximo 1 reintento para otros errores
        return failureCount < 1;
      },
      staleTime: STALE_TIMES.SEMI_STATIC,
    },
    mutations: {
      // Las mutations no deberían reintentar automáticamente
      retry: false,
    },
  },
});

// Configurar handlers globales
queryClient.getQueryCache().config.onError = handleQueryError;
queryClient.getMutationCache().config.onError = handleMutationError;
