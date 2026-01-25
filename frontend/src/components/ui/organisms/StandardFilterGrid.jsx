import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { FilterField } from '../molecules/FilterField';
import { FILTER_GRID_LAYOUTS } from '@/lib/uiConstants';

/**
 * StandardFilterGrid - Grid de filtros estandarizado
 *
 * Componente que renderiza un grid de filtros basado en una configuración declarativa.
 * Soporta múltiples tipos de campos y layouts responsivos.
 *
 * @param {Array} config - Configuración de campos de filtro
 * @param {Object} values - Valores actuales de los filtros
 * @param {function} onChange - Callback (key, value) => void
 * @param {string} layout - Layout del grid: 'default' | 'compact' | 'single'
 * @param {string} className - Clases adicionales
 *
 * @example
 * const filterConfig = [
 *   { key: 'busqueda', label: 'Buscar', type: 'text', placeholder: 'Nombre o email...' },
 *   { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS_OPTIONS },
 *   { key: 'fechaDesde', label: 'Desde', type: 'date' },
 *   { key: 'fechaHasta', label: 'Hasta', type: 'date' },
 *   { key: 'soloActivos', label: 'Solo activos', type: 'checkbox' },
 * ];
 *
 * <StandardFilterGrid
 *   config={filterConfig}
 *   values={filtros}
 *   onChange={(key, value) => setFiltros({ ...filtros, [key]: value })}
 * />
 *
 * @example
 * // Con layout compacto
 * <StandardFilterGrid
 *   config={filterConfig}
 *   values={filtros}
 *   onChange={handleFilterChange}
 *   layout="compact"
 * />
 *
 * @example
 * // Con icono y opciones personalizadas
 * const config = [
 *   {
 *     key: 'categoria',
 *     label: 'Categoría',
 *     type: 'select',
 *     icon: FolderIcon,
 *     options: categorias.map(c => ({ value: c.id, label: c.nombre })),
 *     placeholder: 'Todas las categorías',
 *   },
 * ];
 */
const StandardFilterGrid = memo(function StandardFilterGrid({
  config = [],
  values = {},
  onChange,
  layout = 'default',
  className,
  disabled = false,
}) {
  if (!config.length) return null;

  const handleChange = (key) => (value) => {
    onChange?.(key, value);
  };

  // Separar checkboxes para renderizarlos en fila aparte (mejor UX)
  const regularFields = config.filter(field => field.type !== 'checkbox');
  const checkboxFields = config.filter(field => field.type === 'checkbox');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Campos regulares en grid */}
      {regularFields.length > 0 && (
        <div className={FILTER_GRID_LAYOUTS[layout] || FILTER_GRID_LAYOUTS.default}>
          {regularFields.map((field) => (
            <FilterField
              key={field.key}
              type={field.type || 'text'}
              label={field.label}
              value={values[field.key]}
              onChange={handleChange(field.key)}
              options={field.options}
              placeholder={field.placeholder}
              icon={field.icon}
              min={field.min}
              max={field.max}
              step={field.step}
              disabled={disabled || field.disabled}
              className={field.className}
            />
          ))}
        </div>
      )}

      {/* Checkboxes en fila separada */}
      {checkboxFields.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          {checkboxFields.map((field) => (
            <FilterField
              key={field.key}
              type="checkbox"
              label={field.label}
              value={values[field.key]}
              onChange={handleChange(field.key)}
              icon={field.icon}
              disabled={disabled || field.disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
});

StandardFilterGrid.displayName = 'StandardFilterGrid';

StandardFilterGrid.propTypes = {
  /** Configuración de campos de filtro */
  config: PropTypes.arrayOf(PropTypes.shape({
    /** Clave del filtro (debe coincidir con key en values) */
    key: PropTypes.string.isRequired,
    /** Label del campo */
    label: PropTypes.string,
    /** Tipo de campo */
    type: PropTypes.oneOf(['text', 'select', 'date', 'number', 'checkbox']),
    /** Opciones para select */
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })),
    /** Placeholder */
    placeholder: PropTypes.string,
    /** Icono (componente Lucide) */
    icon: PropTypes.elementType,
    /** Valor mínimo (date/number) */
    min: PropTypes.string,
    /** Valor máximo (date/number) */
    max: PropTypes.string,
    /** Incremento (number) */
    step: PropTypes.number,
    /** Si está deshabilitado */
    disabled: PropTypes.bool,
    /** Clases adicionales para este campo */
    className: PropTypes.string,
  })).isRequired,
  /** Valores actuales de los filtros */
  values: PropTypes.object,
  /** Callback cuando cambia un filtro: (key, value) => void */
  onChange: PropTypes.func.isRequired,
  /** Layout del grid */
  layout: PropTypes.oneOf(['default', 'compact', 'single']),
  /** Clases adicionales */
  className: PropTypes.string,
  /** Deshabilitar todos los campos */
  disabled: PropTypes.bool,
};

export { StandardFilterGrid };
