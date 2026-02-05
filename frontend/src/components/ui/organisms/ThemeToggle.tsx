import { memo } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/sistema';
import { cn } from '@/lib/utils';
import type { Size } from '@/types/ui';

/**
 * Props del componente ThemeToggle
 */
export interface ThemeToggleProps {
  /** Clases adicionales */
  className?: string;
  /** Tamaño del botón */
  size?: Size;
}

/**
 * ThemeToggle - Componente para alternar entre tema claro y oscuro
 *
 * Ene 2026: Movido de molecules/ a organisms/ porque accede a store global (useTheme)
 * Los molecules no deberían conocer stores/contextos de aplicación.
 */
const ThemeToggle = memo(function ThemeToggle({
  className,
  size = 'md',
}: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme() as { isDark: boolean; toggleTheme: () => void };

  const sizes: Record<Size, string> = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizes: Record<Size, string> = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'rounded-lg transition-colors',
        'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
        'dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'dark:focus:ring-offset-gray-900',
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
});

ThemeToggle.displayName = 'ThemeToggle';

export { ThemeToggle };
