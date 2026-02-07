/**
 * IconPicker - Selector visual de iconos Lucide
 * Fragmentado en Ene 2026 para mejor mantenibilidad
 */
export { IconPicker, IconPicker as default } from './IconPicker';
export type { IconPickerProps } from './IconPicker';

export { IconPickerCompact } from './IconPickerCompact';
export type { IconPickerCompactProps } from './IconPickerCompact';

export { ICONOS_MAP, CATEGORIAS_ICONOS } from './constants';
export type { IconoNombre, CategoriaIconos } from './constants';

export { default as IconPickerButton } from './IconPickerButton';
export type { IconPickerButtonProps } from './IconPickerButton';

// Retrocompatibilidad: re-exportar IconPickerButton como IconButton
export { default as IconButton } from './IconPickerButton';
export type { IconPickerButtonProps as IconButtonProps } from './IconPickerButton';
