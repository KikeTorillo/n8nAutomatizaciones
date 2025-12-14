import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Componente Modal reutilizable
 * @param {boolean} isOpen - Estado del modal
 * @param {function} onClose - Callback para cerrar el modal
 * @param {string} title - Título del modal
 * @param {string} subtitle - Subtítulo opcional del modal
 * @param {ReactNode} children - Contenido del modal
 * @param {ReactNode} footer - Contenido del footer (botones de acción)
 * @param {string} size - Tamaño del modal ('sm', 'md', 'lg', 'xl')
 * @param {boolean} showCloseButton - Mostrar botón de cierre (default: true)
 * @param {boolean} disableClose - Deshabilitar cierre del modal (para estados de carga)
 */
function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  disableClose = false
}) {
  const scrollYRef = useRef(0);
  const modalContentRef = useRef(null);

  // Bloquear scroll del body cuando el modal está abierto (fix iOS)
  useEffect(() => {
    if (isOpen) {
      // Guardar posición de scroll actual
      scrollYRef.current = window.scrollY;

      // Enfoque simplificado - solo overflow hidden (evita problemas con teclado iOS)
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      // Restaurar estilos
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';

      // Restaurar posición de scroll
      window.scrollTo(0, scrollYRef.current);
    }

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  // Fix iOS: forzar recálculo de layout cuando el teclado se cierra
  // El problema: iOS Safari no recalcula touch targets después de cerrar el teclado
  // Solución: forzar un micro-scroll que dispara el repaint del layout
  useEffect(() => {
    if (!isOpen) return;

    // Detectar si es iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) return;

    let lastHeight = window.visualViewport?.height || window.innerHeight;

    const handleViewportResize = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;

      // El teclado se cerró (viewport creció)
      if (currentHeight > lastHeight) {
        // Forzar recálculo de layout con micro-scroll
        // Esto es lo que hace que los touch targets se realineen
        requestAnimationFrame(() => {
          // Obtener el contenedor scrollable del modal
          const scrollContainer = modalContentRef.current?.querySelector('.overflow-y-auto');
          if (scrollContainer) {
            const currentScroll = scrollContainer.scrollTop;
            scrollContainer.scrollTop = currentScroll + 1;
            scrollContainer.scrollTop = currentScroll;
          }

          // También forzar repaint del modal
          if (modalContentRef.current) {
            // getBoundingClientRect fuerza un layout recalculation
            modalContentRef.current.getBoundingClientRect();
          }
        });
      }

      lastHeight = currentHeight;
    };

    // Función para forzar repaint
    const forceRepaint = () => {
      requestAnimationFrame(() => {
        const scrollContainer = modalContentRef.current?.querySelector('.overflow-y-auto');
        if (scrollContainer) {
          const currentScroll = scrollContainer.scrollTop;
          scrollContainer.scrollTop = currentScroll + 1;
          scrollContainer.scrollTop = currentScroll;
        }
        if (modalContentRef.current) {
          modalContentRef.current.getBoundingClientRect();
        }
      });
    };

    // Backup: también escuchar focusout de inputs (cuando se cierra el teclado al tocar fuera)
    const handleFocusOut = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        // Delay para dar tiempo al keyboard de cerrar
        setTimeout(forceRepaint, 100);
      }
    };

    // visualViewport.resize se dispara cuando el teclado abre/cierra en iOS
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
    }

    // Agregar listener de focusout como backup
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
      }
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [isOpen]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={disableClose ? undefined : onClose}
            onTouchMove={(e) => e.preventDefault()}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 touch-none"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <motion.div
              ref={modalContentRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className={`
                bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size]}
                max-h-[90vh] overflow-hidden flex flex-col
              `}
            >
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {title}
                    </h2>
                    {subtitle && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      disabled={disableClose}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                      aria-label="Cerrar modal"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="overflow-y-auto flex-1 p-6 overscroll-contain">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default Modal;
