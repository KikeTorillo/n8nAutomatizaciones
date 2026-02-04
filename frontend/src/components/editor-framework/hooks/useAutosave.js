/**
 * ====================================================================
 * USE AUTOSAVE HOOK (GENERICO)
 * ====================================================================
 * Hook genérico para autosave con debounce.
 * Usado por Website Builder e Invitaciones.
 *
 * No depende de ningún store específico - recibe todo como parámetros.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// Constantes por defecto
const DEFAULT_DEBOUNCE_MS = 3000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * useAutosave - Hook genérico para autosave con debounce
 *
 * @param {Object} options - Opciones del hook
 * @param {Function} options.onSave - Función async para guardar (recibe items)
 * @param {boolean} options.enabled - Si el autosave está habilitado
 * @param {number} options.debounceMs - Tiempo de debounce en ms (default: 3000)
 * @param {Array} options.items - Items a guardar (bloques, etc.)
 * @param {boolean} options.hasChanges - Si hay cambios pendientes
 * @param {Function} options.computeHash - Función para calcular hash de items (opcional)
 * @param {Function} options.onSaving - Callback cuando empieza a guardar
 * @param {Function} options.onSaved - Callback cuando termina de guardar (éxito)
 * @param {Function} options.onError - Callback cuando hay error
 * @param {Function} options.onConflict - Callback para error 409 (conflicto de versión)
 * @returns {Object} - { guardarAhora, cancelar, estaGuardando }
 */
export function useAutosave({
  onSave,
  enabled = true,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  items,
  hasChanges,
  computeHash,
  onSaving,
  onSaved,
  onError,
  onConflict,
}) {
  // Refs para evitar re-renders
  const timeoutRef = useRef(null);
  const mutexRef = useRef(false);
  const retryCountRef = useRef(0);
  const lastSavedHashRef = useRef(null);
  const estaGuardandoRef = useRef(false);

  /**
   * Guarda los cambios con mutex para evitar conflictos
   */
  const guardar = useCallback(async () => {
    // Si ya hay un save en progreso, ignorar
    if (mutexRef.current) {
      return;
    }

    // Si no hay cambios, no guardar
    if (!hasChanges) {
      return;
    }

    // Verificar si los items realmente cambiaron (si hay función de hash)
    if (computeHash) {
      const currentHash = computeHash(items);
      if (lastSavedHashRef.current === currentHash) {
        onSaved?.();
        return;
      }
    }

    mutexRef.current = true;
    estaGuardandoRef.current = true;
    onSaving?.();

    try {
      await onSave(items);

      // Guardar hash si hay función
      if (computeHash) {
        lastSavedHashRef.current = computeHash(items);
      }

      retryCountRef.current = 0;
      onSaved?.();
    } catch (error) {
      console.error('[useAutosave] Error al guardar:', error);

      // Error 409: Conflicto de versión
      const status = error.response?.status;
      if (status === 409) {
        const mensaje =
          error.response?.data?.message ||
          'Otro usuario modificó este contenido. Recarga la página para ver los cambios.';
        toast.error(mensaje, { duration: 6000 });

        onConflict?.({
          mensaje,
          timestamp: new Date().toISOString(),
          error,
        });

        retryCountRef.current = 0;
        return; // No reintentar conflictos de versión
      }

      // Reintentar si no hemos excedido el límite
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        mutexRef.current = false;

        // Programar reintento
        setTimeout(() => {
          guardar();
        }, RETRY_DELAY_MS * retryCountRef.current);
      } else {
        const mensaje = error.response?.data?.message || 'Error al guardar cambios';
        toast.error(mensaje);
        onError?.(error);
        retryCountRef.current = 0;
      }
    } finally {
      mutexRef.current = false;
      estaGuardandoRef.current = false;
    }
  }, [items, hasChanges, onSave, computeHash, onSaving, onSaved, onError, onConflict]);

  /**
   * Efecto para debounce de cambios
   */
  useEffect(() => {
    if (!enabled || !hasChanges) {
      return;
    }

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Programar nuevo save
    timeoutRef.current = setTimeout(() => {
      guardar();
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [items, enabled, hasChanges, guardar, debounceMs]);

  /**
   * Guardar manualmente (bypass debounce)
   */
  const guardarAhora = useCallback(async () => {
    // Cancelar cualquier debounce pendiente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await guardar();
  }, [guardar]);

  /**
   * Cancelar autosave pendiente
   */
  const cancelar = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    guardarAhora,
    cancelar,
    estaGuardando: estaGuardandoRef.current,
  };
}

export default useAutosave;
