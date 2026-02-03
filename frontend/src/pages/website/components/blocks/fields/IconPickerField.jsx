/**
 * ====================================================================
 * ICON PICKER FIELD
 * ====================================================================
 *
 * Wrapper del IconPicker para uso en editores de bloques.
 * Proporciona un selector visual de iconos de Lucide.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { IconPicker } from '@/components/ui';

/**
 * IconPickerField - Campo selector de iconos
 *
 * @param {Object} props
 * @param {string} props.label - Label del campo
 * @param {string} props.value - Nombre del icono seleccionado
 * @param {Function} props.onChange - Callback cuando cambia el icono
 * @param {string} props.className - Clases adicionales
 */
export function IconPickerField({
  label = 'Icono',
  value,
  onChange,
  className = '',
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <IconPicker value={value} onChange={onChange} />
    </div>
  );
}

export default IconPickerField;
