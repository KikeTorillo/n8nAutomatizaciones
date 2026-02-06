import { memo, forwardRef, type ComponentType, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { CheckboxField } from '../molecules/CheckboxField';

/**
 * Opción individual del grupo de checkboxes
 */
export interface CheckboxGroupOption {
  /** Nombre del campo (requerido) */
  field: string;
  /** Etiqueta visible (requerido) */
  label: string;
  /** Descripción secundaria */
  description?: string;
  /** Icono (lucide-react) */
  icon?: ComponentType<{ className?: string }>;
  /** Deshabilitado */
  disabled?: boolean;
  /** Valor alternativo (deprecated, usar field) */
  value?: string;
}

/** Layout del grupo */
export type CheckboxGroupLayout = 'vertical' | 'horizontal' | 'grid';

/**
 * Props del componente CheckboxGroup
 */
export interface CheckboxGroupProps {
  /** Configuración de opciones */
  options?: CheckboxGroupOption[];
  /** Estado actual { [fieldName]: boolean } */
  values?: Record<string, boolean>;
  /** Callback (fieldName, checked) => void */
  onChange?: (fieldName: string, checked: boolean) => void;
  /** Título del grupo */
  title?: string;
  /** Layout del grupo */
  layout?: CheckboxGroupLayout;
  /** Columnas para layout grid */
  columns?: number;
  /** Clases adicionales */
  className?: string;
}

/**
 * CheckboxGroup - Grupo de checkboxes con título opcional
 * Reutilizable en filtros, formularios y configuraciones
 *
 * NOTA: Movido a organisms (Ene 2026) porque compone CheckboxField (molecule)
 */
export const CheckboxGroup = memo(
  forwardRef<HTMLFieldSetElement, CheckboxGroupProps>(function CheckboxGroup({
  options = [],
  values = {},
  onChange,
  title,
  layout = 'vertical',
  columns = 2,
  className,
}, ref) {
  if (!options.length) return null;

  const layoutClasses: Record<CheckboxGroupLayout, string> = {
    vertical: 'flex flex-col space-y-2',
    horizontal: 'flex flex-wrap gap-4',
    grid: 'grid gap-2',
  };

  const gridStyle =
    layout === 'grid'
      ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
      : undefined;

  return (
    <fieldset ref={ref} className={cn('space-y-2', className)}>
      {title && (
        <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {title}
        </legend>
      )}

      <div className={layoutClasses[layout]} style={gridStyle}>
        {options.map((option) => {
          const Icon = option.icon;
          const fieldKey = option.field || option.value || '';

          return (
            <div
              key={fieldKey}
              className={cn('flex items-start gap-2', option.disabled && 'opacity-50')}
            >
              {Icon && (
                <Icon
                  className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0"
                  aria-hidden="true"
                />
              )}
              <CheckboxField
                id={fieldKey}
                label={option.label}
                description={option.description}
                checked={!!values[fieldKey]}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onChange?.(fieldKey, e.target.checked)
                }
                disabled={option.disabled}
                className="flex-1"
              />
            </div>
          );
        })}
      </div>
    </fieldset>
  );
  })
);

CheckboxGroup.displayName = 'CheckboxGroup';
