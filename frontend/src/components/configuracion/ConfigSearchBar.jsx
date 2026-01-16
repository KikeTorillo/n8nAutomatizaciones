import { Search } from 'lucide-react';

/**
 * Barra de búsqueda genérica para páginas de configuración
 * Soporta filtros adicionales via select
 *
 * @param {Object} props
 * @param {string} props.value - Valor actual del search
 * @param {function} props.onChange - Handler para cambio de search
 * @param {string} [props.placeholder="Buscar..."] - Placeholder del input
 * @param {Array} [props.filters] - Filtros adicionales
 * @param {string} props.filters[].name - Nombre del filtro (para key)
 * @param {string} props.filters[].value - Valor actual
 * @param {function} props.filters[].onChange - Handler de cambio
 * @param {Array} props.filters[].options - Opciones [{value, label}]
 * @param {string} [props.filters[].placeholder] - Placeholder del select
 */
function ConfigSearchBar({
  value,
  onChange,
  placeholder = 'Buscar...',
  filters = [],
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        />
      </div>

      {/* Filters */}
      {filters.map((filter) => (
        <select
          key={filter.name}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 transition-colors"
        >
          {filter.placeholder && (
            <option value="">{filter.placeholder}</option>
          )}
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}

export default ConfigSearchBar;
