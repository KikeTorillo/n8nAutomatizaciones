/**
 * ====================================================================
 * BLOCK CATEGORY GROUP
 * ====================================================================
 * Grupo de bloques con título de categoría.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * BlockCategoryGroup - Grupo de bloques con título de categoría
 *
 * @param {Object} props
 * @param {string} props.titulo - Título de la categoría
 * @param {React.ReactNode} props.children - Bloques a renderizar
 * @param {string} props.variant - 'grid' | 'list'
 * @param {boolean} props.isInDrawer - Si está en drawer (más columnas en grid)
 * @param {string} props.className - Clases adicionales
 */
function BlockCategoryGroup({
  titulo,
  children,
  variant = 'grid',
  isInDrawer = false,
  className,
}) {
  return (
    <div className={cn('mb-6', className)}>
      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
        {titulo}
      </h4>

      {variant === 'grid' ? (
        <div
          className={cn(
            'grid gap-2',
            isInDrawer ? 'grid-cols-3' : 'grid-cols-2'
          )}
        >
          {children}
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}

export default memo(BlockCategoryGroup);
