import { memo } from 'react';
import { Star, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Búsqueda guardada
 */
export interface SavedSearch {
  id: string | number;
  nombre: string;
  es_default?: boolean;
  filtros?: Record<string, unknown>;
}

/**
 * Props del componente SavedSearchList
 */
export interface SavedSearchListProps {
  /** Lista de búsquedas guardadas */
  busquedas?: SavedSearch[];
  /** Callback al seleccionar una búsqueda */
  onSelect?: (busqueda: SavedSearch) => void;
  /** Callback al eliminar una búsqueda */
  onDelete?: (id: string | number) => void;
  /** Callback al marcar/desmarcar como default */
  onToggleDefault?: (id: string | number) => void;
  /** ID de búsqueda actualmente aplicada */
  currentSearchId?: string | number;
  /** Modo compacto para panel de filtros */
  compact?: boolean;
}

/**
 * SavedSearchList - Lista de búsquedas guardadas
 */
export const SavedSearchList = memo(function SavedSearchList({
  busquedas = [],
  onSelect,
  onDelete,
  onToggleDefault,
  currentSearchId,
  compact = false,
}: SavedSearchListProps) {
  if (busquedas.length === 0) {
    return (
      <div
        className={cn(
          'text-sm text-gray-500 dark:text-gray-400 text-center py-3',
          compact ? 'py-2' : 'py-4'
        )}
      >
        No hay búsquedas guardadas
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', compact && 'max-h-[200px] overflow-y-auto')}>
      {busquedas.map((busqueda) => {
        const isActive = busqueda.id === currentSearchId;
        const isDefault = busqueda.es_default;

        return (
          <div
            key={busqueda.id}
            className={cn(
              'group flex items-center gap-2 p-2 rounded-lg transition-colors',
              isActive
                ? 'bg-primary-50 dark:bg-primary-900/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            {/* Botón de estrella (default) */}
            <button
              type="button"
              onClick={() => onToggleDefault?.(busqueda.id)}
              className={cn(
                'flex-shrink-0 p-1 rounded transition-colors',
                isDefault
                  ? 'text-yellow-500'
                  : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
              )}
              aria-label={
                isDefault
                  ? 'Quitar como búsqueda predeterminada'
                  : 'Marcar como búsqueda predeterminada'
              }
              title={isDefault ? 'Búsqueda predeterminada' : 'Marcar como predeterminada'}
            >
              <Star className={cn('h-4 w-4', isDefault && 'fill-current')} />
            </button>

            {/* Nombre de la búsqueda */}
            <button
              type="button"
              onClick={() => onSelect?.(busqueda)}
              className={cn(
                'flex-1 text-left text-sm truncate',
                isActive
                  ? 'text-primary-700 dark:text-primary-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300'
              )}
              title={busqueda.nombre}
            >
              {busqueda.nombre}
            </button>

            {/* Indicador de activo */}
            {isActive && (
              <Check className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            )}

            {/* Botón eliminar */}
            <button
              type="button"
              onClick={() => onDelete?.(busqueda.id)}
              className={cn(
                'flex-shrink-0 p-1 rounded transition-colors',
                'text-gray-400 dark:text-gray-500',
                'opacity-0 group-hover:opacity-100',
                'hover:text-red-500 dark:hover:text-red-400',
                'hover:bg-red-50 dark:hover:bg-red-900/20'
              )}
              aria-label={`Eliminar búsqueda "${busqueda.nombre}"`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
});

SavedSearchList.displayName = 'SavedSearchList';

export default SavedSearchList;
