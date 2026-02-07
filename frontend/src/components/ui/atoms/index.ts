/**
 * UI Atoms
 * Elementos básicos de interfaz sin dependencias internas
 */

// Componentes
export { Button } from './Button';
export { Input } from './Input';
export { Textarea } from './Textarea';
export { Select } from './Select';
export { Checkbox } from './Checkbox';
export { Badge } from './Badge';
export { LoadingSpinner } from './LoadingSpinner';
export { Label } from './Label';
export { Spinner } from './Spinner';
export { Divider } from './Divider';
export { Radio } from './Radio';
// NOTA: RadioGroup movido a molecules/ (Feb 2026) - compone Radio + label = molecule
// NOTA: Tooltip movido a molecules/ (Feb 2026) - portal + posicionamiento + hooks = molecule
export { Avatar } from './Avatar';
export { Text } from './Text';

// Tipos
export type { ButtonProps } from './Button';
export type { InputProps } from './Input';
export type { TextareaProps } from './Textarea';
export type { SelectProps } from './Select';
export type { CheckboxProps } from './Checkbox';
export type { BadgeProps } from './Badge';
export type { LoadingSpinnerProps } from './LoadingSpinner';
export type { LabelProps } from './Label';
export type { SpinnerProps } from './Spinner';
export type { DividerProps } from './Divider';
export type { RadioProps } from './Radio';
// RadioGroup types re-exported from molecules/
export type { AvatarProps } from './Avatar';
export type { TextProps } from './Text';

export { Card } from './Card';
export type { CardProps } from './Card';
