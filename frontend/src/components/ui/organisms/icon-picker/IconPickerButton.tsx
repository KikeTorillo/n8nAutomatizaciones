import { memo, forwardRef, useCallback } from 'react';
import { ICONOS_MAP } from './constants';

/**
 * Props del componente IconPickerButton
 */
export interface IconPickerButtonProps {
  /** Nombre del icono */
  nombreIcono: string;
  /** Si está seleccionado */
  isSelected: boolean;
  /** Callback al seleccionar */
  onSelect: (nombre: string) => void;
}

/**
 * IconPickerButton - Botón de icono memoizado para el IconPicker
 * Componente optimizado para evitar re-renders innecesarios
 */
const IconPickerButton = memo(
  forwardRef<HTMLButtonElement, IconPickerButtonProps>(function IconPickerButton({
  nombreIcono,
  isSelected,
  onSelect,
}, ref) {
  const IconComponent = ICONOS_MAP[nombreIcono];
  if (!IconComponent) return null;

  const handleClick = useCallback(() => {
    onSelect(nombreIcono);
  }, [onSelect, nombreIcono]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={`p-2.5 rounded-lg transition-all flex items-center justify-center ${
        isSelected
          ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
      }`}
      title={nombreIcono}
      aria-label={`Seleccionar icono ${nombreIcono}`}
    >
      <IconComponent size={20} />
    </button>
  );
  })
);

IconPickerButton.displayName = 'IconPickerButton';

export default IconPickerButton;
