/**
 * ====================================================================
 * TEMPLATE GALLERY PANEL
 * ====================================================================
 * Panel compacto de plantillas para sidebar.
 * Muestra plantillas con búsqueda, filtro por categoría, y grid de cards.
 *
 * Usado por Website Builder e Invitaciones con distintas configuraciones.
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import { useState, useMemo, memo } from 'react';
import { Search, ExternalLink, Loader2, Check } from 'lucide-react';

/**
 * Card de plantilla por defecto
 */
function DefaultTemplateCard({ template, isSelected, onSelect }) {
  const primario = template.tema?.color_primario || template.colores?.primario || '#4F46E5';
  const secundario = template.tema?.color_secundario || template.colores?.secundario || '#6366F1';

  return (
    <button
      onClick={() => onSelect(template)}
      className={`
        relative w-full text-left rounded-lg border-2 overflow-hidden transition-all
        ${isSelected
          ? 'border-primary-500 dark:border-primary-400 ring-1 ring-primary-500/30'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      {/* Gradient header */}
      <div
        className="h-20 w-full"
        style={{
          background: `linear-gradient(135deg, ${primario} 0%, ${secundario} 100%)`,
        }}
      />

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
          {template.nombre}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <div
            className="w-3 h-3 rounded-full border border-gray-200 dark:border-gray-600"
            style={{ backgroundColor: primario }}
          />
          <div
            className="w-3 h-3 rounded-full border border-gray-200 dark:border-gray-600"
            style={{ backgroundColor: secundario }}
          />
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center">
          <Check className="w-3 h-3" />
        </div>
      )}
    </button>
  );
}

/**
 * TemplateGalleryPanel - Panel de plantillas para sidebar
 *
 * @param {Object} props
 * @param {Array} props.templates - Lista de plantillas
 * @param {boolean} [props.isLoading] - Cargando plantillas
 * @param {Array<{key: string, label: string}>} [props.categories] - Categorías para filtrar
 * @param {string} [props.categoryField] - Campo de la plantilla a usar para filtrar
 * @param {Function} props.onApply - Callback al aplicar plantilla
 * @param {boolean} [props.isApplying] - Aplicando plantilla
 * @param {Function} [props.renderCard] - Render prop para card custom
 * @param {Function} [props.onViewFullGallery] - Callback para ver galería completa
 * @param {string} [props.title] - Título del panel
 * @param {string} [props.emptyMessage] - Mensaje cuando no hay plantillas
 */
function TemplateGalleryPanel({
  templates = [],
  isLoading = false,
  categories = [],
  categoryField = 'categoria',
  onApply,
  isApplying = false,
  renderCard,
  onViewFullGallery,
  title = 'Plantillas',
  emptyMessage = 'No hay plantillas disponibles',
}) {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);

  // Filtrar plantillas
  const plantillasFiltradas = useMemo(() => {
    let resultado = templates;

    // Filtrar por categoría
    if (categoriaActiva) {
      resultado = resultado.filter(t => t[categoryField] === categoriaActiva);
    }

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      const query = busqueda.toLowerCase();
      resultado = resultado.filter(t =>
        t.nombre?.toLowerCase().includes(query) ||
        t.descripcion?.toLowerCase().includes(query)
      );
    }

    return resultado;
  }, [templates, categoriaActiva, busqueda, categoryField]);

  const handleSelect = (template) => {
    setSeleccionada(seleccionada?.id === template.id ? null : template);
  };

  const handleApply = () => {
    if (seleccionada && onApply) {
      onApply(seleccionada);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>

        {/* Búsqueda */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar plantilla..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Filtro por categorías */}
      {categories.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setCategoriaActiva(null)}
              className={`
                flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                ${!categoriaActiva
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoriaActiva(categoriaActiva === cat.key ? null : cat.key)}
                className={`
                  flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                  ${categoriaActiva === cat.key
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid de plantillas */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : plantillasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {plantillasFiltradas.map((template) => (
              renderCard ? (
                <div key={template.id}>
                  {renderCard(template, seleccionada?.id === template.id, () => handleSelect(template))}
                </div>
              ) : (
                <DefaultTemplateCard
                  key={template.id}
                  template={template}
                  isSelected={seleccionada?.id === template.id}
                  onSelect={handleSelect}
                />
              )
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        {/* Botón aplicar - visible solo cuando hay selección */}
        {seleccionada && (
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50"
          >
            {isApplying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Usar esta plantilla
          </button>
        )}

        {/* Link a galería completa */}
        {onViewFullGallery && (
          <button
            onClick={onViewFullGallery}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver galería completa
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(TemplateGalleryPanel);
