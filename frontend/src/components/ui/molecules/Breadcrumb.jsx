import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Breadcrumb - Navegación de migas de pan
 * Muestra la ruta jerárquica actual con enlaces a niveles superiores
 *
 * @param {Array} items - Array de items: { label, href?, icon? }
 * @param {string} className - Clases adicionales
 * @param {boolean} homeLink - Mostrar enlace a Home al inicio
 */
export function Breadcrumb({ items = [], className, homeLink = false }) {
  if (!items.length && !homeLink) return null;

  return (
    <nav className={cn('flex items-center text-sm', className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 flex-wrap">
        {homeLink && (
          <>
            <li>
              <Link
                to="/home"
                className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-1 -m-1"
                aria-label="Inicio"
              >
                <Home className="h-4 w-4" />
              </Link>
            </li>
            {items.length > 0 && (
              <li aria-hidden="true">
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </li>
            )}
          </>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              )}

              {isLast || !item.href ? (
                <span
                  className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100 font-medium"
                  aria-current="page"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

Breadcrumb.displayName = 'Breadcrumb';

export default Breadcrumb;
