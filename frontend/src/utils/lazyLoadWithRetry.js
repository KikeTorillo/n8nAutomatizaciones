/**
 * lazyLoadWithRetry - Wrapper para React.lazy con reintentos automáticos
 * BUG-003 FIX: Implementa retry con backoff exponencial para chunks
 * Fase de Corrección de Bugs - Enero 2026
 */
import { lazy } from 'react';

/**
 * Crea un componente lazy con reintentos automáticos
 *
 * @param {Function} importFunc - Función de importación dinámica (ej: () => import('./Component'))
 * @param {string} componentName - Nombre del componente para logging
 * @param {Object} options - Opciones de configuración
 * @param {number} options.maxRetries - Número máximo de reintentos (default: 3)
 * @param {number} options.baseDelay - Delay base en ms para backoff (default: 1000)
 * @returns {React.LazyExoticComponent} Componente lazy con retry
 *
 * @example
 * // Uso básico
 * const MyPage = lazyLoadWithRetry(
 *   () => import('./pages/MyPage'),
 *   'MyPage'
 * );
 *
 * @example
 * // Con opciones personalizadas
 * const HeavyComponent = lazyLoadWithRetry(
 *   () => import('./components/HeavyComponent'),
 *   'HeavyComponent',
 *   { maxRetries: 5, baseDelay: 500 }
 * );
 */
export function lazyLoadWithRetry(
  importFunc,
  componentName,
  { maxRetries = 3, baseDelay = 1000 } = {}
) {
  return lazy(async () => {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Intentar cargar el módulo
        const module = await importFunc();

        // Si llegamos aquí, la carga fue exitosa
        if (attempt > 0) {
          console.info(
            `[LazyLoad] ${componentName} cargado exitosamente en intento ${attempt + 1}`
          );
        }

        return module;
      } catch (error) {
        lastError = error;

        // Log del intento fallido
        console.warn(
          `[LazyLoad] Intento ${attempt + 1}/${maxRetries} para ${componentName} falló:`,
          error.message
        );

        // Si no es el último intento, esperar antes de reintentar
        if (attempt < maxRetries - 1) {
          // Backoff exponencial: 1s, 2s, 4s, ...
          const delay = baseDelay * Math.pow(2, attempt);

          console.info(
            `[LazyLoad] Reintentando ${componentName} en ${delay}ms...`
          );

          await new Promise((resolve) => setTimeout(resolve, delay));

          // Intentar limpiar el cache del módulo fallido
          // Esto fuerza a Vite/browser a re-solicitar el chunk
          if (typeof window !== 'undefined' && 'caches' in window) {
            try {
              const cacheNames = await caches.keys();
              for (const cacheName of cacheNames) {
                const cache = await caches.open(cacheName);
                // Eliminar entradas de chunks JS
                const requests = await cache.keys();
                for (const request of requests) {
                  if (request.url.includes('.js') || request.url.includes('chunk')) {
                    await cache.delete(request);
                  }
                }
              }
            } catch (cacheError) {
              // Ignorar errores de cache, no es crítico
              console.debug('[LazyLoad] No se pudo limpiar cache:', cacheError.message);
            }
          }
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    console.error(
      `[LazyLoad] ${componentName} falló después de ${maxRetries} intentos`
    );

    // Lanzar error con mensaje descriptivo
    const enhancedError = new Error(
      `Failed to load ${componentName} after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
    );
    enhancedError.name = 'ChunkLoadError';
    enhancedError.originalError = lastError;

    throw enhancedError;
  });
}

/**
 * Verifica si un error es de carga de chunk
 * @param {Error} error - Error a verificar
 * @returns {boolean} true si es error de chunk
 */
export function isChunkLoadError(error) {
  if (!error) return false;

  return (
    error.name === 'ChunkLoadError' ||
    error.message?.includes('Failed to fetch dynamically imported module') ||
    error.message?.includes('Loading chunk') ||
    error.message?.includes('Loading CSS chunk') ||
    error.message?.includes('Unable to preload CSS')
  );
}

/**
 * Precarga un componente lazy para mejorar UX
 * Útil para precargar rutas que el usuario probablemente visitará
 *
 * @param {Function} importFunc - Función de importación dinámica
 * @param {string} componentName - Nombre para logging
 *
 * @example
 * // Precargar al hacer hover sobre un link
 * <Link
 *   to="/dashboard"
 *   onMouseEnter={() => preloadComponent(() => import('./Dashboard'), 'Dashboard')}
 * >
 *   Dashboard
 * </Link>
 */
export async function preloadComponent(importFunc, componentName) {
  try {
    await importFunc();
    console.debug(`[LazyLoad] Precargado: ${componentName}`);
  } catch (error) {
    console.warn(`[LazyLoad] Error precargando ${componentName}:`, error.message);
    // No lanzamos el error, la precarga es best-effort
  }
}

export default lazyLoadWithRetry;
