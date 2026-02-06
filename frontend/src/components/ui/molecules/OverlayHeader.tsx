import { memo, forwardRef, type ReactNode, type ElementType } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OverlayHeaderProps {
  /** Titulo del overlay */
  title?: string;
  /** Subtitulo/descripcion opcional */
  subtitle?: string;
  /** Callback para cerrar */
  onClose?: () => void;
  /** Mostrar boton de cierre */
  showCloseButton?: boolean;
  /** Deshabilitar cierre */
  disableClose?: boolean;
  /** Elemento HTML para el titulo (default: 'h2') */
  titleAs?: ElementType;
  /** Elemento HTML para el subtitulo (default: 'p') */
  subtitleAs?: ElementType;
  /** ID del titulo para aria-labelledby */
  titleId?: string;
  /** ID del subtitulo */
  subtitleId?: string;
  /** Clases CSS adicionales */
  className?: string;
  /** Acciones adicionales en el header */
  actions?: ReactNode;
}

/**
 * OverlayHeader - Header compartido para Modal y Drawer
 *
 * Soporta componentes polimorficos para titulo/subtitulo,
 * permitiendo que Drawer pase VaulDrawer.Title/Description.
 *
 * @example
 * // En Modal
 * <OverlayHeader title="Editar" onClose={onClose} titleId={titleId} />
 *
 * @example
 * // En Drawer (con componentes Vaul)
 * <OverlayHeader
 *   title="Nuevo Cliente"
 *   titleAs={VaulDrawer.Title}
 *   subtitleAs={VaulDrawer.Description}
 *   onClose={onClose}
 * />
 */
const OverlayHeader = memo(
  forwardRef<HTMLDivElement, OverlayHeaderProps>(function OverlayHeader({
  title,
  subtitle,
  onClose,
  showCloseButton = true,
  disableClose = false,
  titleAs: TitleComponent = 'h2',
  subtitleAs: SubtitleComponent = 'p',
  titleId,
  subtitleId,
  className,
  actions,
}, ref) {
  if (!title && !showCloseButton) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="flex-1">
        {title && (
          <TitleComponent
            id={titleId}
            className="text-xl font-semibold text-gray-900 dark:text-gray-100"
          >
            {title}
          </TitleComponent>
        )}
        {subtitle && (
          <SubtitleComponent
            id={subtitleId}
            className="mt-1 text-sm text-gray-500 dark:text-gray-400"
          >
            {subtitle}
          </SubtitleComponent>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4">
        {actions}
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={disableClose}
            className={cn(
              'p-2 -mr-2 text-gray-400 rounded-lg transition-colors',
              'hover:text-gray-600 dark:hover:text-gray-300',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              disableClose && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}));

OverlayHeader.displayName = 'OverlayHeader';

export { OverlayHeader };
