import { memo, forwardRef, type ReactNode } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types/ui';

export interface BreadcrumbProps {
  /** Array de items: { label, href?, icon? } */
  items?: BreadcrumbItem[];
  /** Clases adicionales */
  className?: string;
  /** Mostrar enlace a Home al inicio */
  homeLink?: boolean;
  /** Render prop para links (desacopla de router) — default: <a href> */
  renderLink?: (props: { to: string; children: ReactNode; className?: string }) => ReactNode;
}

/**
 * Breadcrumb - Navegación de migas de pan
 * Muestra la ruta jerárquica actual con enlaces a niveles superiores
 */
const defaultRenderLink = ({ to, children, className: cls }: { to: string; children: ReactNode; className?: string }) => (
  <a href={to} className={cls}>{children}</a>
);

export const Breadcrumb = memo(
  forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb({
  items = [],
  className,
  homeLink = false,
  renderLink = defaultRenderLink,
}, ref) {
  if (!items.length && !homeLink) return null;

  const linkClass = 'text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors';

  return (
    <nav ref={ref} className={cn('flex items-center text-sm', className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 flex-wrap">
        {homeLink && (
          <>
            <li>
              {renderLink({
                to: '/home',
                className: `${linkClass} p-1 -m-1`,
                children: <Home className="h-4 w-4" aria-label="Inicio" />,
              })}
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
                renderLink({
                  to: item.href,
                  className: `flex items-center gap-1.5 ${linkClass}`,
                  children: <>{Icon && <Icon className="h-4 w-4" />}{item.label}</>,
                })
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}));

Breadcrumb.displayName = 'Breadcrumb';
