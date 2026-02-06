import { memo, useEffect, useCallback, forwardRef, useId, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FocusTrap from 'focus-trap-react';
import { MODAL_SIZES } from '@/lib/uiConstants';
import { OverlayHeader } from '../molecules/OverlayHeader';
import type { ModalSize } from '@/types/organisms';

/**
 * Props del componente Modal
 */
export interface ModalProps {
  /** Estado del modal (abierto/cerrado) */
  isOpen: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Título del modal */
  title?: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Contenido del modal */
  children?: ReactNode;
  /** Contenido del footer (botones de acción) */
  footer?: ReactNode;
  /** Tamaño del modal */
  size?: ModalSize;
  /** Mostrar botón de cierre en el header */
  showCloseButton?: boolean;
  /** Deshabilitar cierre del modal (para estados de carga) */
  disableClose?: boolean;
  /** Rol ARIA del modal */
  role?: 'dialog' | 'alertdialog';
}

/**
 * Componente Modal reutilizable
 * USO: Confirmaciones y visualización de datos (solo lectura)
 * NOTA: Para formularios con inputs, usar Drawer en su lugar
 */
const Modal = memo(forwardRef<HTMLDivElement, ModalProps>(function Modal(
  {
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    footer,
    size = 'md',
    showCloseButton = true,
    disableClose = false,
    role = 'dialog',
  },
  ref
) {
  // Generar ID único para aria-labelledby
  const titleId = useId();

  // Bloquear scroll del body cuando el modal está abierto (usando CSS class)
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Memoizar handleEscape para evitar recrear listener en cada render
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !disableClose) {
        onClose();
      }
    },
    [isOpen, onClose, disableClose]
  );

  // Cerrar con ESC
  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={disableClose ? undefined : onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <FocusTrap
              active={isOpen && !disableClose}
              focusTrapOptions={{
                allowOutsideClick: true,
                escapeDeactivates: false, // Ya manejamos ESC manualmente
                fallbackFocus: '[role="dialog"]',
              }}
            >
              <motion.div
                ref={ref}
                role={role}
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className={`
                  bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${MODAL_SIZES[size]}
                  max-h-[90vh] overflow-hidden flex flex-col
                `}
              >
                {/* Header */}
                <OverlayHeader
                  title={title}
                  subtitle={subtitle}
                  titleId={titleId}
                  onClose={disableClose ? undefined : onClose}
                  showCloseButton={showCloseButton}
                  disableClose={disableClose}
                />

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-6">{children}</div>

                {/* Footer */}
                {footer && (
                  <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    {footer}
                  </div>
                )}
              </motion.div>
            </FocusTrap>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}));

Modal.displayName = 'Modal';

export { Modal };
