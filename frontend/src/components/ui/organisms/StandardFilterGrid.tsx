import { memo, forwardRef, type ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { FilterField } from './FilterField';
import { FILTER_GRID_LAYOUTS } from '@/lib/uiConstants';
import type { FilterFieldType } from '@/types/organisms';
import type { SelectOption } from '@/types/ui';

/**
 * Configuración de un campo de filtro
 */
export interface FilterFieldConfig {
  /** Clave del filtro (debe coincidir con key en values) */
  key: string;
  /** Label del campo */
  label?: string;
  /** Tipo de campo */
  type?: FilterFieldType;
  /** Opciones para select */
  options?: SelectOption[];
  /** Placeholder */
  placeholder?: string;
  /** Icono (componente Lucide) */
  icon?: ComponentType<{ className?: string }>;
  /** Valor mínimo (date/number) */
  min?: string;
  /** Valor máximo (date/number) */
  max?: string;
  /** Incremento (number) */
  step?: number;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Clases adicionales para este campo */
  className?: string;
}

/** Layout del grid */
export type FilterGridLayout = 'default' | 'compact' | 'single';

/**
 * Props del componente StandardFilterGrid
 */
export interface StandardFilterGridProps {
  /** Configuración de campos de filtro */
  config?: FilterFieldConfig[];
  /** Valores actuales de los filtros */
  values?: Record<string, unknown>;
  /** Callback cuando cambia un filtro: (key, value) => void */
  onChange?: (key: string, value: unknown) => void;
  /** Layout del grid */
  layout?: FilterGridLayout;
  /** Clases adicionales */
  className?: string;
  /** Deshabilitar todos los campos */
  disabled?: boolean;
}

/**
 * StandardFilterGrid - Grid de filtros estandarizado
 *
 * Componente que renderiza un grid de filtros basado en una configuración declarativa.
 * Soporta múltiples tipos de campos y layouts responsivos.
 */
const StandardFilterGrid = memo(
  forwardRef<HTMLDivElement, StandardFilterGridProps>(function StandardFilterGrid({
  config = [],
  values = {},
  onChange,
  layout = 'default',
  className,
  disabled = false,
}, ref) {
  if (!config.length) return null;

  const handleChange = (key: string) => (value: unknown) => {
    onChange?.(key, value);
  };

  // Separar checkboxes para renderizarlos en fila aparte (mejor UX)
  const regularFields = config.filter((field) => field.type !== 'checkbox');
  const checkboxFields = config.filter((field) => field.type === 'checkbox');

  return (
    <div ref={ref} className={cn('space-y-4', className)}>
      {/* Campos regulares en grid */}
      {regularFields.length > 0 && (
        <div className={FILTER_GRID_LAYOUTS[layout] || FILTER_GRID_LAYOUTS.default}>
          {regularFields.map((field) => (
            <FilterField
              key={field.key}
              type={field.type || 'text'}
              label={field.label}
              value={values[field.key] as string | boolean | number | undefined}
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
              value={values[field.key] as boolean | undefined}
              onChange={handleChange(field.key)}
              icon={field.icon}
              disabled={disabled || field.disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
  })
);

StandardFilterGrid.displayName = 'StandardFilterGrid';

export { StandardFilterGrid };
