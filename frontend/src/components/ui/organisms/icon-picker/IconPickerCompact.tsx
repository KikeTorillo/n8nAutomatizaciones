/**
 * ====================================================================
 * ICON PICKER COMPACT
 * ====================================================================
 * Versión compacta del IconPicker que se expande en un popover.
 * Ideal para uso en formularios donde el espacio es limitado.
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import { memo, useState, useMemo, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { ICONOS_MAP, CATEGORIAS_ICONOS } from './constants';
import IconButton from './IconButton';

export interface IconPickerCompactProps {
  /** Valor seleccionado (nombre del icono) */
  value?: string;
  /** Callback al cambiar selección */
  onChange: (nombre: string) => void;
  /** Placeholder cuando no hay selección */
  placeholder?: string;
  /** Tamaño del icono en el botón */
  iconSize?: number;
}

/**
 * IconPickerCompact - Selector de iconos compacto con popover
 */
export const IconPickerCompact = memo(function IconPickerCompact({
  value,
  onChange,
  placeholder = 'Seleccionar icono',
  iconSize = 20,
}: IconPickerCompactProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lista plana de todos los iconos
  const todosLosIconos = useMemo(() => Object.keys(ICONOS_MAP), []);

  // Filtrar iconos según búsqueda y categoría
  const iconosFiltrados = useMemo(() => {
    let lista = todosLosIconos;

    if (categoriaActiva) {
      const cat = CATEGORIAS_ICONOS.find((c) => c.nombre === categoriaActiva);
      if (cat) lista = cat.iconos.filter((i) => ICONOS_MAP[i]);
    }

    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      lista = lista.filter((nombre) => nombre.toLowerCase().includes(termino));
    }

    return lista;
  }, [busqueda, categoriaActiva, todosLosIconos]);

  // Renderizar icono
  const renderIcon = useCallback((nombreIcono: string, size = 20): ReactNode => {
    const IconComponent = ICONOS_MAP[nombreIcono];
    if (!IconComponent) return null;
    return <IconComponent size={size} />;
  }, []);

  // Seleccionar icono
  const handleSelect = useCallback(
    (nombreIcono: string) => {
      onChange(nombreIcono);
      setIsOpen(false);
      setBusqueda('');
    },
    [onChange]
  );

  // Limpiar selección
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
    },
    [onChange]
  );

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus en el input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Botón trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {value ? (
            <>
              <span className="text-gray-700 dark:text-gray-200 flex-shrink-0">
                {renderIcon(value, iconSize)}
              </span>
              <span className="text-gray-700 dark:text-gray-200 truncate text-xs">
                {value}
              </span>
            </>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <span
              onClick={handleClear}
              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="p-2 space-y-2">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Categorías (scroll horizontal) */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setCategoriaActiva(null)}
                className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                  !categoriaActiva
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Todos
              </button>
              {CATEGORIAS_ICONOS.slice(0, 6).map((cat) => (
                <button
                  key={cat.nombre}
                  type="button"
                  onClick={() => setCategoriaActiva(cat.nombre)}
                  className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                    categoriaActiva === cat.nombre
                      ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>

            {/* Grid de iconos */}
            <div className="max-h-40 overflow-y-auto">
              {iconosFiltrados.length > 0 ? (
                <div className="grid grid-cols-7 gap-1">
                  {iconosFiltrados.slice(0, 49).map((nombreIcono) => (
                    <IconButton
                      key={nombreIcono}
                      nombreIcono={nombreIcono}
                      isSelected={value === nombreIcono}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-gray-500 dark:text-gray-400 py-3">
                  No encontrado
                </p>
              )}
            </div>

            {/* Contador */}
            <p className="text-xs text-gray-400 text-center">
              {Math.min(iconosFiltrados.length, 49)} de {iconosFiltrados.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

IconPickerCompact.displayName = 'IconPickerCompact';

export default IconPickerCompact;
