import { memo, forwardRef, type ReactNode, type ElementType } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/cn';
import { IconButton } from '../atoms/IconButton';
import { useUIMessages } from '../providers';

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
  forwardRef<HTMLDivElement, OverlayHeaderProps>(function OverlayHeader(
    {
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
    },
    ref
  ) {
    const { actions: messageActions } = useUIMessages();
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
            <IconButton
              icon={X}
              label={messageActions.close}
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={disableClose}
              className="-mr-2"
            />
          )}
        </div>
      </div>
    );
  })
);

OverlayHeader.displayName = 'OverlayHeader';

export { OverlayHeader };
