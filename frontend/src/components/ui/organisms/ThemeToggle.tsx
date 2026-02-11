import { memo, forwardRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '../lib/cn';

/** Tamaños soportados por ThemeToggle */
type ThemeToggleSize = 'sm' | 'md' | 'lg';

/**
 * Props del componente ThemeToggle
 */
export interface ThemeToggleProps {
  /** Si el tema oscuro está activo */
  isDark: boolean;
  /** Callback para alternar tema */
  onToggle: () => void;
  /** Clases adicionales */
  className?: string;
  /** Tamaño del botón */
  size?: ThemeToggleSize;
}

/**
 * ThemeToggle - Componente para alternar entre tema claro y oscuro
 *
 * Componente controlado: recibe isDark y onToggle como props.
 * Usar ThemeToggleConnected para integración con useTheme store.
 */
const ThemeToggle = memo(
  forwardRef<HTMLButtonElement, ThemeToggleProps>(function ThemeToggle(
    { isDark, onToggle, className, size = 'md' },
    ref
  ) {
    const sizes: Record<ThemeToggleSize, string> = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3',
    };

    const iconSizes: Record<ThemeToggleSize, string> = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    return (
      <button
        ref={ref}
        onClick={onToggle}
        className={cn(
          'rounded-lg transition-colors',
          'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
          'dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'dark:focus-visible:ring-offset-gray-900',
          sizes[size],
          className
        )}
        aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        title={isDark ? 'Tema claro' : 'Tema oscuro'}
      >
        {isDark ? (
          <Sun className={cn(iconSizes[size], 'transition-transform')} />
        ) : (
          <Moon className={cn(iconSizes[size], 'transition-transform')} />
        )}
      </button>
    );
  })
);

ThemeToggle.displayName = 'ThemeToggle';

export { ThemeToggle };
