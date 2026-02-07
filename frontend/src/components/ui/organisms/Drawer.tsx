import { memo, forwardRef, type ReactNode } from 'react';
import { Drawer as VaulDrawer } from 'vaul';
import { cn } from '@/lib/utils';
import { DRAWER_SIZES } from '@/lib/uiConstants';
import { OverlayHeader } from '../molecules/OverlayHeader';

/**
 * Tamaño del drawer
 */
type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Props del componente Drawer
 */
export interface DrawerProps {
  /** Estado del drawer (abierto/cerrado) */
  isOpen: boolean;
  /** Callback para cerrar el drawer */
  onClose: () => void;
  /** Título del drawer */
  title?: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Contenido del drawer */
  children?: ReactNode;
  /** Contenido del footer (botones de acción) */
  footer?: ReactNode;
  /** Tamaño del drawer */
  size?: DrawerSize;
  /** Mostrar botón de cierre en el header */
  showCloseButton?: boolean;
  /** Deshabilitar cierre por drag/overlay */
  disableClose?: boolean;
  /** Desactivar padding del contenido (para layouts con tabs) */
  noPadding?: boolean;
}

/**
 * Componente Drawer (Bottom Sheet) para formularios en móvil
 * Basado en Vaul - maneja correctamente el teclado en iOS/Android
 */
const DrawerComponent = memo(forwardRef<HTMLDivElement, DrawerProps>(function Drawer(
  {
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
  },
  ref
) {
  const handleOpenChange = (open: boolean) => {
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
          aria-describedby={undefined}
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
            {/* a11y: Radix requiere DialogTitle directo dentro de DialogContent */}
            <VaulDrawer.Title className="sr-only">
              {title || 'Panel'}
            </VaulDrawer.Title>

            {/* Handle para arrastrar */}
            {!disableClose && (
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>
            )}

            {/* Header */}
            <OverlayHeader
              title={title}
              subtitle={subtitle}
              onClose={disableClose ? undefined : onClose}
              showCloseButton={showCloseButton}
              disableClose={disableClose}
              className="px-6 pb-4 pt-0"
            />

            {/* Contenido scrollable */}
            <div
              className={`flex-1 overflow-y-auto overscroll-contain ${noPadding ? '' : 'p-6'}`}
            >
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

DrawerComponent.displayName = 'Drawer';

// Crear objeto Drawer con subcomponentes
interface DrawerWithSubcomponents
  extends React.MemoExoticComponent<
    React.ForwardRefExoticComponent<DrawerProps & React.RefAttributes<HTMLDivElement>>
  > {
  Root: typeof VaulDrawer.Root;
  Trigger: typeof VaulDrawer.Trigger;
  Portal: typeof VaulDrawer.Portal;
  Overlay: typeof VaulDrawer.Overlay;
  Content: typeof VaulDrawer.Content;
  Title: typeof VaulDrawer.Title;
  Description: typeof VaulDrawer.Description;
  Close: typeof VaulDrawer.Close;
}

const Drawer = DrawerComponent as DrawerWithSubcomponents;

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
export type { DrawerSize };
