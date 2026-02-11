import { isValidElement, createElement, type ReactNode } from 'react';

type IconComponent = React.ComponentType<{ className?: string }>;

/**
 * Resuelve un icon prop como componente Lucide o JSX existente.
 * Acepta sizeClass opcional para controlar el tamaño del icono renderizado.
 */
export function resolveIcon(
  icon: ReactNode | IconComponent,
  sizeClass = 'h-4 w-4'
): ReactNode {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  if (
    typeof icon === 'function' ||
    (typeof icon === 'object' && '$$typeof' in icon)
  ) {
    return createElement(icon as IconComponent, { className: sizeClass });
  }
  return icon as ReactNode;
}
