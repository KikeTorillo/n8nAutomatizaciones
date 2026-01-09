import { useMemo, useCallback, useEffect } from 'react';

/**
 * Hook para gestionar navegación entre registros
 *
 * @param {Array} records - Array de registros
 * @param {string|number} currentId - ID del registro actual
 * @param {Function} onNavigate - Callback cuando se navega (recibe nuevo record)
 * @param {Object} options - Opciones adicionales
 * @param {boolean} [options.enableKeyboard=true] - Habilitar atajos de teclado (← →)
 * @returns {Object} - Estado y funciones de navegación
 */
export function useRecordNavigation(records = [], currentId, onNavigate, options = {}) {
  const { enableKeyboard = true } = options;

  const currentIndex = useMemo(() => {
    if (!records.length || currentId === null || currentId === undefined) return -1;
    return records.findIndex(r => r.id === currentId);
  }, [records, currentId]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < records.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev && onNavigate) {
      onNavigate(records[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, records, onNavigate]);

  const goToNext = useCallback(() => {
    if (hasNext && onNavigate) {
      onNavigate(records[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, records, onNavigate]);

  const goToIndex = useCallback((index) => {
    if (index >= 0 && index < records.length && onNavigate) {
      onNavigate(records[index]);
    }
  }, [records, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (e) => {
      // Solo si no hay input/textarea/select enfocado
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      // Solo si no hay modal con formulario activo (evitar conflictos)
      if (e.target.closest('[role="dialog"]')?.querySelector('input:focus, textarea:focus')) return;

      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard, hasPrev, hasNext, goToPrev, goToNext]);

  return {
    currentIndex,
    totalRecords: records.length,
    hasPrev,
    hasNext,
    goToPrev,
    goToNext,
    goToIndex,
    currentRecord: currentIndex >= 0 ? records[currentIndex] : null,
    prevRecord: hasPrev ? records[currentIndex - 1] : null,
    nextRecord: hasNext ? records[currentIndex + 1] : null,
  };
}

export default useRecordNavigation;
