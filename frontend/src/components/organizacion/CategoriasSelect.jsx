import { forwardRef, useMemo, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useCategoriasAgrupadas, useCategoriasProfesional, TIPOS_CATEGORIA } from '@/hooks/useCategoriasProfesional';
import { Check, ChevronDown, X, Tag, Award, Layers, BookOpen, Star } from 'lucide-react';

// Iconos por tipo de categoría
const ICONOS_TIPO = {
  especialidad: Star,
  nivel: Layers,
  area: BookOpen,
  certificacion: Award,
  general: Tag,
};

// Colores por tipo de categoría
const COLORES_TIPO = {
  especialidad: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
  nivel: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  area: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
  certificacion: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
  general: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
};

/**
 * Selector múltiple de Categorías de Profesional
 * Muestra categorías agrupadas por tipo (especialidad, nivel, área, certificación)
 *
 * @param {Array} value - Array de IDs de categorías seleccionadas
 * @param {Function} onChange - Callback cuando cambia la selección
 * @param {string} tipoFiltro - Filtrar por un tipo específico (opcional)
 * @param {number} max - Máximo de categorías seleccionables
 */
const CategoriasSelect = forwardRef(
  (
    {
      className,
      value = [],
      onChange,
      error,
      label = 'Categorías',
      placeholder = 'Selecciona categorías',
      helper,
      required = false,
      tipoFiltro = null,
      max = null,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Fetch categorías
    const { data: categoriasAgrupadas = {}, isLoading: loadingAgrupadas } = useCategoriasAgrupadas();
    const { data: categoriasTodas = [], isLoading: loadingTodas } = useCategoriasProfesional(
      { activo: true, tipo_categoria: tipoFiltro },
      { enabled: !!tipoFiltro }
    );

    const isLoading = tipoFiltro ? loadingTodas : loadingAgrupadas;

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mapa de id -> categoria para lookup rápido
    const categoriasMap = useMemo(() => {
      const map = new Map();

      if (tipoFiltro && categoriasTodas.length > 0) {
        categoriasTodas.forEach(cat => map.set(cat.id, { ...cat, tipo_categoria: tipoFiltro }));
      } else {
        Object.entries(categoriasAgrupadas).forEach(([tipo, cats]) => {
          cats.forEach(cat => map.set(cat.id, { ...cat, tipo_categoria: tipo }));
        });
      }

      return map;
    }, [categoriasAgrupadas, categoriasTodas, tipoFiltro]);

    // Categorías seleccionadas con datos completos
    const selectedCategorias = useMemo(() => {
      return value.map(id => categoriasMap.get(id)).filter(Boolean);
    }, [value, categoriasMap]);

    // Handler para toggle de una categoría
    const handleToggle = (categoriaId) => {
      if (disabled) return;

      let newValue;
      if (value.includes(categoriaId)) {
        newValue = value.filter(v => v !== categoriaId);
      } else {
        if (max && value.length >= max) {
          return;
        }
        newValue = [...value, categoriaId];
      }

      onChange?.(newValue);
    };

    // Handler para remover un tag
    const handleRemove = (categoriaId, e) => {
      e.stopPropagation();
      if (disabled) return;

      const newValue = value.filter(v => v !== categoriaId);
      onChange?.(newValue);
    };

    // Handler para limpiar todo
    const handleClearAll = (e) => {
      e.stopPropagation();
      if (disabled) return;
      onChange?.([]);
    };

    const baseStyles = 'w-full min-h-[48px] px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 cursor-pointer';

    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400'
      : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 hover:border-gray-400 dark:hover:border-gray-500';

    return (
      <div className="w-full" ref={containerRef}>
        {label && (
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Tag className="w-4 h-4" />
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Campo principal */}
          <div
            className={cn(baseStyles, stateStyles, className)}
            onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
          >
            <div className="flex items-center flex-wrap gap-1.5 min-h-[32px] pr-16">
              {isLoading ? (
                <span className="text-gray-500 dark:text-gray-400 text-sm">Cargando...</span>
              ) : selectedCategorias.length > 0 ? (
                selectedCategorias.map((cat) => {
                  const IconoTipo = ICONOS_TIPO[cat.tipo_categoria] || Tag;
                  const colorClase = COLORES_TIPO[cat.tipo_categoria] || COLORES_TIPO.general;

                  return (
                    <span
                      key={cat.id}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 text-sm rounded-md border",
                        colorClase
                      )}
                    >
                      <IconoTipo className="w-3 h-3" />
                      {cat.nombre}
                      <button
                        type="button"
                        onClick={(e) => handleRemove(cat.id, e)}
                        className="hover:opacity-70 rounded-full p-0.5 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })
              ) : (
                <span className="text-gray-500 dark:text-gray-400 text-sm">{placeholder}</span>
              )}
            </div>

            {/* Iconos de la derecha */}
            <div className="absolute inset-y-0 right-0 flex items-center px-3 gap-1">
              {selectedCategorias.length > 0 && !disabled && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              )}
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform",
                  isOpen && "transform rotate-180"
                )}
              />
            </div>
          </div>

          {/* Dropdown de opciones agrupadas */}
          {isOpen && !disabled && !isLoading && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-72 overflow-y-auto">
              {max && (
                <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 sticky top-0">
                  {value.length}/{max} seleccionados
                </div>
              )}

              {/* Renderizar por grupos o lista plana */}
              {tipoFiltro ? (
                // Lista plana (filtrado por tipo)
                categoriasTodas.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No hay categorías disponibles
                  </div>
                ) : (
                  categoriasTodas.map((cat) => {
                    const isSelected = value.includes(cat.id);
                    const isDisabled = max && value.length >= max && !isSelected;

                    return (
                      <CategoriaItem
                        key={cat.id}
                        categoria={cat}
                        tipo={tipoFiltro}
                        isSelected={isSelected}
                        isDisabled={isDisabled}
                        onToggle={() => handleToggle(cat.id)}
                      />
                    );
                  })
                )
              ) : (
                // Agrupado por tipo
                Object.keys(categoriasAgrupadas).length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No hay categorías disponibles
                  </div>
                ) : (
                  Object.entries(categoriasAgrupadas).map(([tipo, cats]) => {
                    const IconoTipo = ICONOS_TIPO[tipo] || Tag;
                    const tipoInfo = TIPOS_CATEGORIA[tipo] || { label: tipo };

                    return (
                      <div key={tipo}>
                        {/* Header del grupo */}
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-600 sticky top-0">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            <IconoTipo className="w-3.5 h-3.5" />
                            {tipoInfo.label}
                            <span className="text-gray-400">({cats.length})</span>
                          </div>
                        </div>

                        {/* Categorías del grupo */}
                        {cats.map((cat) => {
                          const isSelected = value.includes(cat.id);
                          const isDisabled = max && value.length >= max && !isSelected;

                          return (
                            <CategoriaItem
                              key={cat.id}
                              categoria={cat}
                              tipo={tipo}
                              isSelected={isSelected}
                              isDisabled={isDisabled}
                              onToggle={() => handleToggle(cat.id)}
                            />
                          );
                        })}
                      </div>
                    );
                  })
                )
              )}
            </div>
          )}
        </div>

        {helper && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helper}</p>
        )}

        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

// Componente interno para cada item de categoría
function CategoriaItem({ categoria, tipo, isSelected, isDisabled, onToggle }) {
  const IconoTipo = ICONOS_TIPO[tipo] || Tag;

  return (
    <div
      className={cn(
        "px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors flex items-center justify-between",
        isDisabled && "opacity-50 cursor-not-allowed hover:bg-white dark:hover:bg-gray-800"
      )}
      onClick={() => !isDisabled && onToggle()}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Checkbox */}
        <div
          className={cn(
            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
            isSelected
              ? "bg-primary-700 border-primary-700 dark:bg-primary-600 dark:border-primary-600"
              : "border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800"
          )}
        >
          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
        </div>

        {/* Info de categoría */}
        <div className="flex items-center gap-2">
          <IconoTipo className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {categoria.nombre}
          </span>
          {categoria.color && (
            <span
              className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: categoria.color }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

CategoriasSelect.displayName = 'CategoriasSelect';

export default CategoriasSelect;
