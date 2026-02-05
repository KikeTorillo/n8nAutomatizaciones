import { memo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalHeaderProps {
  /** Título del modal */
  title?: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Callback para cerrar el modal */
  onClose?: () => void;
  /** Mostrar botón de cierre */
  showCloseButton?: boolean;
  /** Deshabilitar cierre */
  disableClose?: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * ModalHeader - Header extraído del componente Modal
 *
 * Componente reutilizable para headers de modales con título, subtítulo
 * y botón de cerrar opcionales.
 *
 * @example
 * <ModalHeader
 *   title="Editar Cliente"
 *   subtitle="Modifica los datos del cliente"
 *   onClose={handleClose}
 * />
 */
const ModalHeader = memo(function ModalHeader({
  title,
  subtitle,
  onClose,
  showCloseButton = true,
  disableClose = false,
  className,
}: ModalHeaderProps) {
  if (!title && !showCloseButton) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div>
        {title && (
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>

      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          disabled={disableClose}
          className={cn(
            'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors',
            disableClose && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Cerrar modal"
        >
          <X className="w-6 h-6" />
        </button>
      )}
    </div>
  );
});

ModalHeader.displayName = 'ModalHeader';

export { ModalHeader };
