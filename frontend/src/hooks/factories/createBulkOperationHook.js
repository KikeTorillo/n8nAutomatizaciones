/**
 * ====================================================================
 * FACTORY PARA HOOKS DE OPERACIONES MASIVAS
 * ====================================================================
 *
 * Genera hooks para operaciones que afectan múltiples registros,
 * con soporte para tracking de progreso y manejo de errores parciales.
 *
 * Ene 2026 - Mejoras Frontend
 *
 * @example
 * // Eliminar múltiples registros
 * export const useEliminarProductosMasivo = createBulkOperationHook({
 *   name: 'eliminar-productos',
 *   mutationFn: (ids) => inventarioApi.eliminarMasivo(ids),
 *   invalidateKeys: ['productos'],
 * });
 *
 * @example
 * // Con tracking de progreso
 * export const useActualizarPreciosMasivo = createBulkOperationHook({
 *   name: 'actualizar-precios',
 *   mutationFn: async (items, onProgress) => {
 *     const results = [];
 *     for (let i = 0; i < items.length; i++) {
 *       const result = await inventarioApi.actualizarPrecio(items[i]);
 *       results.push(result);
 *       onProgress?.((i + 1) / items.length);
 *     }
 *     return results;
 *   },
 *   trackProgress: true,
 *   invalidateKeys: ['productos', 'precios'],
 * });
 *
 * // Uso en componente:
 * const { mutate, progress, resetProgress } = useActualizarPreciosMasivo();
 * ====================================================================
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Factory para crear hooks de operaciones masivas
 *
 * @param {Object} config - Configuración del hook
 * @param {string} config.name - Nombre de la operación (para identificación)
 * @param {Function} config.mutationFn - Función que ejecuta la operación
 * @param {string[]} [config.invalidateKeys=[]] - Query keys a invalidar al completar
 * @param {boolean} [config.trackProgress=false] - Habilitar tracking de progreso
 * @param {Function} [config.onSuccess] - Callback al completar exitosamente
 * @param {Function} [config.onError] - Callback al fallar
 * @param {Function} [config.onPartialError] - Callback cuando hay errores parciales
 *
 * @returns {Function} Hook de operación masiva
 */
export function createBulkOperationHook(config) {
  const {
    name,
    mutationFn,
    invalidateKeys = [],
    trackProgress = false,
    onSuccess: configOnSuccess,
    onError: configOnError,
    onPartialError,
  } = config;

  /**
   * Hook de operación masiva generado
   *
   * @param {Object} options - Opciones adicionales de useMutation
   * @returns {Object} Hook con mutation y estado de progreso
   */
  return function useBulkOperation(options = {}) {
    const queryClient = useQueryClient();

    // Estado de progreso
    const [progress, setProgress] = useState({
      total: 0,
      processed: 0,
      percentage: 0,
      errors: [],
      isRunning: false,
    });

    // Reset del progreso
    const resetProgress = useCallback(() => {
      setProgress({
        total: 0,
        processed: 0,
        percentage: 0,
        errors: [],
        isRunning: false,
      });
    }, []);

    // Callback para actualizar progreso
    const handleProgress = useCallback((percentage, details = {}) => {
      setProgress(prev => ({
        ...prev,
        percentage: Math.round(percentage * 100),
        processed: details.processed ?? prev.processed,
        errors: details.errors ?? prev.errors,
      }));
    }, []);

    const mutation = useMutation({
      mutationFn: async (data) => {
        if (trackProgress) {
          setProgress(prev => ({
            ...prev,
            total: Array.isArray(data) ? data.length : 1,
            isRunning: true,
          }));
        }

        // Pasar callback de progreso si está habilitado
        const result = await mutationFn(data, trackProgress ? handleProgress : undefined);

        return result;
      },
      onSuccess: (data, variables, context) => {
        // Invalidar queries
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' });
        });

        // Reset progreso
        if (trackProgress) {
          setProgress(prev => ({
            ...prev,
            isRunning: false,
            percentage: 100,
          }));
        }

        // Callbacks
        configOnSuccess?.(data, variables, context);
        options.onSuccess?.(data, variables, context);
      },
      onError: (error, variables, context) => {
        if (trackProgress) {
          setProgress(prev => ({
            ...prev,
            isRunning: false,
            errors: [...prev.errors, error],
          }));
        }

        configOnError?.(error, variables, context);
        options.onError?.(error, variables, context);
      },
      ...options,
    });

    return {
      ...mutation,
      progress,
      resetProgress,
      // Helpers
      isRunning: progress.isRunning,
      hasErrors: progress.errors.length > 0,
    };
  };
}

export default createBulkOperationHook;
