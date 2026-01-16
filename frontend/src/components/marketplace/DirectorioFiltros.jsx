import { X, Loader2 } from 'lucide-react';
import { Button, Select } from '@/components/ui';
import EstrellaRating from './EstrellaRating';
import { useCategoriasMarketplace } from '@/hooks/useMarketplace';

/**
 * Componente de filtros para el directorio de marketplace
 * Sidebar con filtros de ciudad, categoría y rating mínimo
 *
 * @param {Object} filtros - Valores actuales de filtros
 * @param {string} filtros.ciudad - Ciudad seleccionada
 * @param {number} filtros.categoria_id - ID de categoría seleccionada
 * @param {number} filtros.rating_min - Rating mínimo (1-5)
 * @param {function} onChange - Callback cuando cambia un filtro: (key, value) => void
 * @param {function} onLimpiar - Callback para limpiar todos los filtros
 * @param {string} className - Clases adicionales
 *
 * @example
 * <DirectorioFiltros
 *   filtros={filtros}
 *   onChange={(key, value) => setFiltros(prev => ({ ...prev, [key]: value }))}
 *   onLimpiar={() => setFiltros({ ciudad: '', categoria_id: '', rating_min: '' })}
 * />
 */
function DirectorioFiltros({ filtros, onChange, onLimpiar, className }) {
  // Cargar categorías dinámicamente desde el backend
  const { data: categorias, isLoading: isLoadingCategorias } = useCategoriasMarketplace();

  // Opciones de ciudades (TODO: Obtener dinámicamente del backend)
  const ciudadesOpciones = [
    { value: '', label: 'Todas las ciudades' },
    { value: 'CDMX', label: 'Ciudad de México' },
    { value: 'Guadalajara', label: 'Guadalajara' },
    { value: 'Monterrey', label: 'Monterrey' },
    { value: 'Puebla', label: 'Puebla' },
    { value: 'Querétaro', label: 'Querétaro' },
    { value: 'Cancún', label: 'Cancún' },
    { value: 'Mérida', label: 'Mérida' },
    { value: 'Tijuana', label: 'Tijuana' },
  ];

  // Opciones de categorías (cargadas dinámicamente desde tabla categorias)
  const categoriasOpciones = [
    { value: '', label: 'Todas las categorías' },
    ...(categorias?.map((cat) => ({
      value: cat.id.toString(),
      label: cat.nombre,
    })) || []),
  ];

  // Opciones de rating mínimo
  const ratingsOpciones = [
    { value: '', label: 'Cualquier rating' },
    { value: '4', label: '4+ estrellas' },
    { value: '3', label: '3+ estrellas' },
    { value: '2', label: '2+ estrellas' },
    { value: '1', label: '1+ estrellas' },
  ];

  // Contar filtros activos
  const filtrosActivos = Object.values(filtros).filter((v) => v !== '' && v !== null && v !== undefined).length;

  return (
    <div className={className}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-4">
        {/* Header con contador */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filtros</h3>
          {filtrosActivos > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300">
              {filtrosActivos}
            </span>
          )}
        </div>

        {/* Filtros */}
        <div className="space-y-6">
          {/* Ciudad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ciudad
            </label>
            <Select
              value={filtros.ciudad || ''}
              onChange={(e) => onChange('ciudad', e.target.value)}
              options={ciudadesOpciones}
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoría
              {isLoadingCategorias && (
                <Loader2 className="inline-block w-3 h-3 ml-2 animate-spin text-gray-400" />
              )}
            </label>
            <Select
              value={filtros.categoria_id || ''}
              onChange={(e) => onChange('categoria_id', e.target.value)}
              options={categoriasOpciones}
              disabled={isLoadingCategorias}
            />
          </div>

          {/* Rating mínimo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rating mínimo
            </label>
            <Select
              value={filtros.rating_min || ''}
              onChange={(e) => onChange('rating_min', e.target.value)}
              options={ratingsOpciones}
            />

            {/* Vista visual del rating seleccionado */}
            {filtros.rating_min && (
              <div className="mt-2 flex items-center">
                <EstrellaRating rating={parseInt(filtros.rating_min)} size="sm" />
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">o superior</span>
              </div>
            )}
          </div>
        </div>

        {/* Botón limpiar filtros */}
        {filtrosActivos > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLimpiar}
              className="w-full justify-center"
            >
              <X className="w-4 h-4 mr-2" />
              Limpiar filtros
            </Button>
          </div>
        )}

        {/* Info adicional */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Los resultados se actualizan automáticamente al cambiar los filtros.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DirectorioFiltros;
