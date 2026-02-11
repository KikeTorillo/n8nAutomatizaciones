import { useMemo, useCallback, useEffect } from 'react';

interface RecordWithId {
  id: string | number;
  [key: string]: unknown;
}

interface RecordNavigationOptions {
  enableKeyboard?: boolean;
}

interface RecordNavigationReturn<T extends RecordWithId> {
  currentIndex: number;
  totalRecords: number;
  hasPrev: boolean;
  hasNext: boolean;
  goToPrev: () => void;
  goToNext: () => void;
  goToIndex: (index: number) => void;
  currentRecord: T | null;
  prevRecord: T | null;
  nextRecord: T | null;
}

/**
 * Hook para gestionar navegación entre registros
 */
export function useRecordNavigation<T extends RecordWithId>(
  records: T[] = [],
  currentId: string | number | null | undefined,
  onNavigate: ((record: T) => void) | undefined,
  options: RecordNavigationOptions = {}
): RecordNavigationReturn<T> {
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

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < records.length && onNavigate) {
      onNavigate(records[index]);
    }
  }, [records, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if ((e.target as HTMLElement).closest('[role="dialog"]')?.querySelector('input:focus, textarea:focus')) return;

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
