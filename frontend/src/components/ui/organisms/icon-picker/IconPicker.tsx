import { memo, useCallback, forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { useIconPickerLogic } from '@/hooks/ui/useIconPickerLogic';
import IconPickerButton from './IconPickerButton';

/**
 * Props del componente IconPicker
 */
export interface IconPickerProps {
  /** Valor seleccionado (nombre del icono) */
  value?: string;
  /** Callback al cambiar selección */
  onChange: (nombre: string) => void;
  /** Mensaje de error */
  error?: string;
}

/**
 * IconPicker - Componente selector visual de iconos Lucide
 * Fragmentado en Ene 2026 para mejor mantenibilidad
 */
export const IconPicker = memo(
  forwardRef<HTMLDivElement, IconPickerProps>(function IconPicker({
  value,
  onChange,
  error,
}, ref) {
  const {
    busqueda,
    setBusqueda,
    categoriaActiva,
    setCategoriaActiva,
    todosLosIconos,
    categorias,
    iconosFiltrados,
    renderIcon,
  } = useIconPickerLogic();

  const handleSelect = useCallback(
    (nombreIcono: string) => onChange(nombreIcono),
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange('');
    setBusqueda('');
  }, [onChange, setBusqueda]);

  return (
    <div ref={ref} className="space-y-3">
      {/* Icono seleccionado */}
      {value && (
        <div className="flex items-center gap-2 p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg border border-primary-200 dark:border-primary-800">
          <div className="p-2 bg-primary-100 dark:bg-primary-800 rounded-lg text-primary-600 dark:text-primary-400">
            {renderIcon(value, 24)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
              Icono seleccionado
            </p>
            <p className="text-xs text-primary-600 dark:text-primary-400 font-mono">{value}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-800 rounded"
            title="Quitar icono"
            aria-label="Quitar icono seleccionado"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar icono..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Filtro por categorías */}
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setCategoriaActiva(null)}
          className={`px-2 py-1 text-xs rounded-full transition-colors ${
            !categoriaActiva
              ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Todos ({todosLosIconos.length})
        </button>
        {categorias.map((cat) => (
          <button
            key={cat.nombre}
            type="button"
            onClick={() => setCategoriaActiva(cat.nombre)}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${
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
      <div className="max-h-52 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
        {iconosFiltrados.length > 0 ? (
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
            {iconosFiltrados.map((nombreIcono) => (
              <IconPickerButton
                key={nombreIcono}
                nombreIcono={nombreIcono}
                isSelected={value === nombreIcono}
                onSelect={handleSelect}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
            No se encontraron iconos con "{busqueda}"
          </p>
        )}
      </div>

      {/* Contador */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {iconosFiltrados.length} iconos {categoriaActiva ? `en ${categoriaActiva}` : 'disponibles'}
      </p>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
  })
);

IconPicker.displayName = 'IconPicker';

export default IconPicker;
