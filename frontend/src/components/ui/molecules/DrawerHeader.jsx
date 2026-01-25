import { memo } from 'react';
import PropTypes from 'prop-types';
import { Drawer as VaulDrawer } from 'vaul';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * DrawerHeader - Header extraído del componente Drawer
 *
 * Componente reutilizable para headers de drawers, compatible con Vaul.
 * Usa VaulDrawer.Title y VaulDrawer.Description para accesibilidad.
 *
 * @param {string} title - Título principal
 * @param {string} subtitle - Subtítulo/descripción opcional
 * @param {function} onClose - Callback para cerrar
 * @param {boolean} showCloseButton - Mostrar botón de cierre
 * @param {boolean} disableClose - Deshabilitar cierre
 * @param {string} className - Clases adicionales
 *
 * @example
 * <DrawerHeader
 *   title="Nuevo Cliente"
 *   subtitle="Completa el formulario"
 *   onClose={handleClose}
 *   showCloseButton
 * />
 */
const DrawerHeader = memo(function DrawerHeader({
  title,
  subtitle,
  onClose,
  showCloseButton = false,
  disableClose = false,
  className,
}) {
  if (!title && !showCloseButton) return null;

  return (
    <div
      className={cn(
        'px-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between',
        className
      )}
    >
      <div className="flex-1">
        {title && (
          <VaulDrawer.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </VaulDrawer.Title>
        )}
        {subtitle && (
          <VaulDrawer.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </VaulDrawer.Description>
        )}
      </div>

      {showCloseButton && !disableClose && onClose && (
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'p-2 -mr-2 text-gray-400 rounded-lg transition-colors',
            'hover:text-gray-600 dark:hover:text-gray-300',
            'hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
});

DrawerHeader.displayName = 'DrawerHeader';

DrawerHeader.propTypes = {
  /** Título del drawer */
  title: PropTypes.string,
  /** Subtítulo/descripción opcional */
  subtitle: PropTypes.string,
  /** Callback para cerrar el drawer */
  onClose: PropTypes.func,
  /** Mostrar botón de cierre */
  showCloseButton: PropTypes.bool,
  /** Deshabilitar cierre */
  disableClose: PropTypes.bool,
  /** Clases CSS adicionales */
  className: PropTypes.string,
};

export { DrawerHeader };
