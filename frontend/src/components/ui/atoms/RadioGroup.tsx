import { memo, useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Radio } from './Radio';
import type { UISize } from '@/types/ui';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** Opciones del grupo */
  options: RadioOption[];
  /** Valor seleccionado */
  value?: string;
  /** Callback cuando cambia la selección */
  onChange?: (value: string) => void;
  /** Nombre del grupo (para agrupar radios) */
  name?: string;
  /** Label del grupo para accesibilidad */
  label?: string;
  /** Orientación del grupo */
  orientation?: 'horizontal' | 'vertical';
  /** Tamaño de los radios */
  size?: UISize;
  /** Si tiene error */
  hasError?: boolean;
  /** Deshabilitado completo */
  disabled?: boolean;
  /** Clases CSS adicionales */
  className?: string;
  /** Children custom (alternativa a options) */
  children?: ReactNode;
}

/**
 * RadioGroup - Grupo de opciones radio accesible
 */
const RadioGroup = memo(function RadioGroup({
  options,
  value,
  onChange,
  name,
  label,
  orientation = 'vertical',
  size = 'md',
  hasError = false,
  disabled = false,
  className,
  children,
}: RadioGroupProps) {
  const groupId = useId();
  const groupName = name || groupId;

  return (
    <div
      role="radiogroup"
      aria-labelledby={label ? `${groupId}-label` : undefined}
      className={cn(
        'flex gap-3',
        orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        className
      )}
    >
      {label && (
        <span
          id={`${groupId}-label`}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </span>
      )}
      {children ||
        options.map((option) => (
          <Radio
            key={option.value}
            id={`${groupId}-${option.value}`}
            name={groupName}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange?.(option.value)}
            label={option.label}
            size={size}
            hasError={hasError}
            disabled={disabled || option.disabled}
          />
        ))}
    </div>
  );
});

RadioGroup.displayName = 'RadioGroup';

export { RadioGroup };
