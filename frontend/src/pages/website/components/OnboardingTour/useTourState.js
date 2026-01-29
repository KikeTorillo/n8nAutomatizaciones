/**
 * ====================================================================
 * USE TOUR STATE HOOK
 * ====================================================================
 * Hook para manejar la persistencia del estado del tour en localStorage.
 * Detecta si es la primera visita del usuario al editor.
 */

import { useState, useEffect, useCallback } from 'react';

const TOUR_STORAGE_KEY = 'nexo_website_editor_tour_completed';

/**
 * Hook para manejar el estado del tour de onboarding
 * @returns {Object} Estado y funciones del tour
 */
export function useTourState() {
  const [hasSeenTour, setHasSeenTour] = useState(true); // Default true para evitar flash
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si el usuario ya vio el tour
  useEffect(() => {
    try {
      const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
      setHasSeenTour(tourCompleted === 'true');
    } catch (error) {
      console.warn('[useTourState] Error leyendo localStorage:', error);
      setHasSeenTour(true); // En caso de error, no mostrar tour
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Marcar el tour como completado
   */
  const completeTour = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      setHasSeenTour(true);
    } catch (error) {
      console.warn('[useTourState] Error guardando en localStorage:', error);
    }
  }, []);

  /**
   * Resetear el tour (para testing o configuración)
   */
  const resetTour = useCallback(() => {
    try {
      localStorage.removeItem(TOUR_STORAGE_KEY);
      setHasSeenTour(false);
    } catch (error) {
      console.warn('[useTourState] Error eliminando de localStorage:', error);
    }
  }, []);

  /**
   * Verificar si debe mostrar el tour
   */
  const shouldShowTour = !isLoading && !hasSeenTour;

  return {
    hasSeenTour,
    isLoading,
    shouldShowTour,
    completeTour,
    resetTour,
  };
}

export default useTourState;
