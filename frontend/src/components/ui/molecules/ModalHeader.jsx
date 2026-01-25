import { memo } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ModalHeader - Header extraído del componente Modal
 *
 * Componente reutilizable para headers de modales con título, subtítulo
 * y botón de cerrar opcionales.
 *
 * @param {string} title - Título principal
 * @param {string} subtitle - Subtítulo opcional
 * @param {function} onClose - Callback para cerrar
 * @param {boolean} showCloseButton - Mostrar botón de cierre
 * @param {boolean} disableClose - Deshabilitar cierre (para estados de carga)
 * @param {string} className - Clases adicionales
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
}) {
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

ModalHeader.propTypes = {
  /** Título del modal */
  title: PropTypes.string,
  /** Subtítulo opcional */
  subtitle: PropTypes.string,
  /** Callback para cerrar el modal */
  onClose: PropTypes.func,
  /** Mostrar botón de cierre */
  showCloseButton: PropTypes.bool,
  /** Deshabilitar cierre */
  disableClose: PropTypes.bool,
  /** Clases CSS adicionales */
  className: PropTypes.string,
};

export { ModalHeader };
