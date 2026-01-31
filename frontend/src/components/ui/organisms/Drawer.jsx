import { memo, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Drawer as VaulDrawer } from 'vaul';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DRAWER_SIZES } from '@/lib/uiConstants';

/**
 * Componente Drawer (Bottom Sheet) para formularios en móvil
 * Basado en Vaul - maneja correctamente el teclado en iOS/Android
 *
 * @param {boolean} isOpen - Estado del drawer
 * @param {function} onClose - Callback para cerrar
 * @param {string} title - Título del drawer
 * @param {string} subtitle - Subtítulo opcional
 * @param {ReactNode} children - Contenido del drawer
 * @param {ReactNode} footer - Contenido del footer (botones de acción)
 * @param {'sm'|'md'|'lg'|'xl'|'full'} size - Tamaño del drawer (default: 'xl')
 * @param {boolean} showCloseButton - Mostrar botón de cerrar en el header
 * @param {boolean} disableClose - Deshabilitar cierre por drag/overlay
 * @param {boolean} noPadding - Desactivar padding del contenido (para layouts con tabs)
 * @param {React.Ref} ref - Ref para acceder al contenedor del drawer
 */
const Drawer = memo(forwardRef(function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'xl',
  showCloseButton = false,
  disableClose = false,
  noPadding = false,
}, ref) {
  const handleOpenChange = (open) => {
    if (!open && !disableClose) {
      onClose();
    }
  };
  return (
    <VaulDrawer.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      modal={true}
      dismissible={!disableClose}
    >
      <VaulDrawer.Portal>
        {/* Overlay oscuro */}
        <VaulDrawer.Overlay
          className={cn(
            'fixed inset-0 bg-black/50 z-40',
            disableClose && 'pointer-events-none'
          )}
        />

        {/* Contenido del Drawer */}
        <VaulDrawer.Content
          ref={ref}
          role="dialog"
          aria-modal="true"
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white dark:bg-gray-800',
            DRAWER_SIZES[size] || DRAWER_SIZES.xl
          )}
        >
          {/*
            IMPORTANTE: Estructura recomendada por Vaul
            El padding y overflow deben estar en este div interno
          */}
          <div className="flex flex-col overflow-hidden rounded-t-2xl h-full">
            {/* Handle para arrastrar */}
            {!disableClose && (
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
                <div className="flex-1">
                  <VaulDrawer.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {title}
                  </VaulDrawer.Title>
                  {subtitle && (
                    <VaulDrawer.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {subtitle}
                    </VaulDrawer.Description>
                  )}
                </div>
                {showCloseButton && !disableClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Contenido scrollable */}
            <div className={`flex-1 overflow-y-auto overscroll-contain ${noPadding ? '' : 'p-6'}`}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                {footer}
              </div>
            )}
          </div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}));

Drawer.displayName = 'Drawer';

Drawer.propTypes = {
  /** Estado del drawer (abierto/cerrado) */
  isOpen: PropTypes.bool.isRequired,
  /** Callback para cerrar el drawer */
  onClose: PropTypes.func.isRequired,
  /** Título del drawer */
  title: PropTypes.string,
  /** Subtítulo opcional */
  subtitle: PropTypes.string,
  /** Contenido del drawer */
  children: PropTypes.node,
  /** Contenido del footer (botones de acción) */
  footer: PropTypes.node,
  /** Tamaño del drawer */
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  /** Mostrar botón de cierre en el header */
  showCloseButton: PropTypes.bool,
  /** Deshabilitar cierre por drag/overlay */
  disableClose: PropTypes.bool,
  /** Desactivar padding del contenido (para layouts con tabs) */
  noPadding: PropTypes.bool,
};

// Exportar también los subcomponentes de Vaul por si se necesita más control
Drawer.Root = VaulDrawer.Root;
Drawer.Trigger = VaulDrawer.Trigger;
Drawer.Portal = VaulDrawer.Portal;
Drawer.Overlay = VaulDrawer.Overlay;
Drawer.Content = VaulDrawer.Content;
Drawer.Title = VaulDrawer.Title;
Drawer.Description = VaulDrawer.Description;
Drawer.Close = VaulDrawer.Close;

export { Drawer };
