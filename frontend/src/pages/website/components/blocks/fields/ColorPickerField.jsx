/**
 * ====================================================================
 * COLOR PICKER FIELD
 * ====================================================================
 *
 * Campo reutilizable para selección de color.
 * Incluye input de color nativo + input de texto para valor hex.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { Button, Input } from '@/components/ui';

/**
 * Campo de selección de color
 *
 * @param {Object} props
 * @param {string} props.label - Label del campo
 * @param {string} props.value - Valor actual del color
 * @param {Function} props.onChange - Callback al cambiar (recibe el color)
 * @param {string} props.defaultColor - Color por defecto si value está vacío
 * @param {string} props.placeholder - Placeholder del input de texto
 * @param {boolean} props.disabled - Si está deshabilitado
 * @param {boolean} props.showReset - Mostrar botón de reset
 * @param {string} props.resetLabel - Label del botón de reset
 * @param {string} props.className - Clases adicionales
 */
export function ColorPickerField({
  label = 'Color',
  value = '',
  onChange,
  defaultColor = '#E5E7EB',
  placeholder = 'Usar color del tema',
  disabled = false,
  showReset = true,
  resetLabel = 'Resetear',
  className = '',
}) {
  const displayColor = value || defaultColor;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={displayColor}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        {showReset && value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            disabled={disabled}
          >
            {resetLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export default ColorPickerField;
