/**
 * ====================================================================
 * COMPONENTE - ETIQUETAS BADGES
 * ====================================================================
 *
 * Fase 2 - Segmentación de Clientes (Ene 2026)
 * Visualización de etiquetas como badges con colores
 *
 * ====================================================================
 */

import { X, Tag } from 'lucide-react';

/**
 * Badge individual de etiqueta
 */
function EtiquetaBadge({ etiqueta, onRemove, size = 'sm' }) {
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  // Calcular color de texto basado en luminosidad del fondo
  const getContrastColor = (hexColor) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
  };

  const backgroundColor = etiqueta.color || '#6366F1';
  const textColor = getContrastColor(backgroundColor);

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${sizeClasses[size]}
        ${onRemove ? 'pr-1' : ''}
      `}
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {etiqueta.nombre}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(etiqueta);
          }}
          className="flex-shrink-0 ml-0.5 rounded-full p-0.5 hover:opacity-75 focus:outline-none"
          style={{ color: textColor }}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

/**
 * Lista de badges de etiquetas
 */
export default function EtiquetasBadges({
  etiquetas = [],
  onRemove,
  size = 'sm',
  maxVisible = 5,
  showEmpty = false,
  emptyText = 'Sin etiquetas',
  className = '',
}) {
  if (!etiquetas || etiquetas.length === 0) {
    if (!showEmpty) return null;

    return (
      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
        <Tag className="h-3.5 w-3.5" />
        {emptyText}
      </span>
    );
  }

  const visibleEtiquetas = maxVisible ? etiquetas.slice(0, maxVisible) : etiquetas;
  const hiddenCount = maxVisible ? Math.max(0, etiquetas.length - maxVisible) : 0;

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {visibleEtiquetas.map((etiqueta) => (
        <EtiquetaBadge
          key={etiqueta.id}
          etiqueta={etiqueta}
          onRemove={onRemove}
          size={size}
        />
      ))}
      {hiddenCount > 0 && (
        <span className="text-xs text-gray-500 dark:text-gray-400 px-1">
          +{hiddenCount} más
        </span>
      )}
    </div>
  );
}

/**
 * Badge con contador (para filtros)
 */
export function EtiquetaBadgeWithCount({ etiqueta, count, selected, onClick }) {
  const backgroundColor = etiqueta.color || '#6366F1';
  const textColor = '#FFFFFF';

  return (
    <button
      type="button"
      onClick={() => onClick?.(etiqueta)}
      className={`
        inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium
        transition-all duration-150
        ${selected
          ? 'ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-gray-900'
          : 'opacity-80 hover:opacity-100'
        }
      `}
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {etiqueta.nombre}
      {count !== undefined && (
        <span
          className="rounded-full px-1.5 py-0.5 text-xs font-semibold"
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// Re-exportar componente individual
export { EtiquetaBadge };
