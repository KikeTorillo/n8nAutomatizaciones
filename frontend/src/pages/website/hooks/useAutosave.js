/**
 * ====================================================================
 * USE AUTOSAVE HOOK
 * ====================================================================
 * Hook para autosave con debounce del editor de website.
 * Detecta cambios en el store y guarda automáticamente.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useWebsiteEditorStore } from '@/store';
import { toast } from 'sonner';

// Constantes
const DEBOUNCE_MS = 3000; // 3 segundos de debounce
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Hook para autosave con debounce
 * @param {Object} options - Opciones del hook
 * @param {Function} options.onSave - Función para guardar (async)
 * @param {boolean} options.enabled - Si el autosave está habilitado
 * @param {number} options.debounceMs - Tiempo de debounce en ms (default: 3000)
 * @returns {Object} - Estado y controles del autosave
 */
export function useAutosave({ onSave, enabled = true, debounceMs = DEBOUNCE_MS }) {
  // Refs para evitar re-renders
  const timeoutRef = useRef(null);
  const mutexRef = useRef(false);
  const retryCountRef = useRef(0);
  const lastSavedBloquesRef = useRef(null);

  // Acceso al store
  const bloques = useWebsiteEditorStore((state) => state.bloques);
  const tieneClambiosLocales = useWebsiteEditorStore((state) => state.tieneClambiosLocales);
  const estadoGuardado = useWebsiteEditorStore((state) => state.estadoGuardado);
  const setGuardando = useWebsiteEditorStore((state) => state.setGuardando);
  const setGuardado = useWebsiteEditorStore((state) => state.setGuardado);
  const setErrorGuardado = useWebsiteEditorStore((state) => state.setErrorGuardado);
  const setConflictoVersion = useWebsiteEditorStore((state) => state.setConflictoVersion);

  /**
   * Guarda los cambios con mutex para evitar conflictos
   */
  const guardar = useCallback(async () => {
    // Si ya hay un save en progreso, ignorar
    if (mutexRef.current) {
      return;
    }

    // Si no hay cambios, no guardar
    if (!tieneClambiosLocales) {
      return;
    }

    // Verificar si los bloques realmente cambiaron
    const bloquesJSON = JSON.stringify(bloques);
    if (lastSavedBloquesRef.current === bloquesJSON) {
      setGuardado();
      return;
    }

    mutexRef.current = true;
    setGuardando();

    try {
      await onSave(bloques);
      lastSavedBloquesRef.current = bloquesJSON;
      retryCountRef.current = 0;
      setGuardado();
    } catch (error) {
      console.error('[Autosave] Error al guardar:', error);

      // Error 409: Conflicto de versión (otro usuario modificó el bloque)
      const status = error.response?.status;
      if (status === 409) {
        const mensaje = error.response?.data?.message || 'Otro usuario modificó este bloque. Recarga la página para ver los cambios.';
        toast.error(mensaje, { duration: 6000 });
        setConflictoVersion({
          mensaje,
          timestamp: new Date().toISOString(),
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
        setErrorGuardado();
        retryCountRef.current = 0;
      }
    } finally {
      mutexRef.current = false;
    }
  }, [bloques, tieneClambiosLocales, onSave, setGuardando, setGuardado, setErrorGuardado, setConflictoVersion]);

  /**
   * Efecto para debounce de cambios
   */
  useEffect(() => {
    if (!enabled || !tieneClambiosLocales) {
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
  }, [bloques, enabled, tieneClambiosLocales, guardar, debounceMs]);

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
    // Estado
    estadoGuardado,
    estaGuardando: estadoGuardado === 'saving',
    tieneClambiosLocales,

    // Acciones
    guardarAhora,
    cancelar,
  };
}

/**
 * Hook para mostrar indicador de estado de guardado
 * @returns {Object} - Props para el indicador
 */
export function useEstadoGuardado() {
  const estadoGuardado = useWebsiteEditorStore((state) => state.estadoGuardado);
  const ultimoGuardado = useWebsiteEditorStore((state) => state.ultimoGuardado);

  // Formatear tiempo relativo
  const formatearTiempoRelativo = useCallback((fecha) => {
    if (!fecha) return null;

    const ahora = new Date();
    const guardado = new Date(fecha);
    const diffMs = ahora - guardado;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    if (diffSec < 5) return 'Justo ahora';
    if (diffSec < 60) return `Hace ${diffSec}s`;
    if (diffMin < 60) return `Hace ${diffMin}min`;
    return guardado.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Estado visual
  const getEstadoVisual = useCallback(() => {
    switch (estadoGuardado) {
      case 'saving':
        return {
          texto: 'Guardando...',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          icono: 'loader',
        };
      case 'saved':
        return {
          texto: ultimoGuardado
            ? `Guardado ${formatearTiempoRelativo(ultimoGuardado)}`
            : 'Guardado',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          icono: 'check',
        };
      case 'unsaved':
        return {
          texto: 'Sin guardar',
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          icono: 'circle',
        };
      case 'error':
        return {
          texto: 'Error al guardar',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          icono: 'alert',
        };
      default:
        return {
          texto: '',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          icono: null,
        };
    }
  }, [estadoGuardado, ultimoGuardado, formatearTiempoRelativo]);

  return {
    estadoGuardado,
    ultimoGuardado,
    ...getEstadoVisual(),
  };
}

/**
 * Función utilitaria para recargar datos del servidor
 * Usada por ConflictAlert para rollback visual en conflictos 409
 * @param {string} paginaId - ID de la página a recargar
 * @param {QueryClient} queryClient - Instancia de TanStack Query
 * @param {Function} setBloques - Función del store para actualizar bloques
 * @param {Function} clearConflictoVersion - Función para limpiar conflicto
 */
export async function recargarDatosServidor(paginaId, queryClient, setBloques, clearConflictoVersion) {
  if (!paginaId) {
    console.warn('[recargarDatosServidor] No hay paginaId especificado');
    return false;
  }

  try {
    // Invalidar cache para forzar re-fetch
    await queryClient.invalidateQueries({
      queryKey: ['bloques', paginaId],
      refetchType: 'active',
    });

    // Obtener datos frescos del cache después del refetch
    const bloquesActualizados = queryClient.getQueryData(['bloques', paginaId]);

    if (bloquesActualizados) {
      // Actualizar el store con los datos del servidor
      setBloques(bloquesActualizados, paginaId);
    }

    // Limpiar el estado de conflicto
    if (clearConflictoVersion) {
      clearConflictoVersion();
    }

    return true;
  } catch (error) {
    console.error('[recargarDatosServidor] Error:', error);
    return false;
  }
}

export default useAutosave;
