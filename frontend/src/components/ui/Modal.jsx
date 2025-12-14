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
  // Solución: forzar repaint cada vez que un input pierde el foco
  useEffect(() => {
    if (!isOpen) return;

    // Detectar si es iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) return;

    // Función agresiva para forzar repaint
    const forceRepaint = () => {
      if (!modalContentRef.current) return;

      // Método 1: micro-scroll en el contenedor del modal
      const scrollContainer = modalContentRef.current.querySelector('.overflow-y-auto');
      if (scrollContainer) {
        const currentScroll = scrollContainer.scrollTop;
        scrollContainer.scrollTop = currentScroll + 1;
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = currentScroll;
        });
      }

      // Método 2: forzar reflow via getBoundingClientRect
      modalContentRef.current.getBoundingClientRect();

      // Método 3: toggle de una propiedad CSS para forzar repaint
      modalContentRef.current.style.transform = 'translateZ(0)';
      requestAnimationFrame(() => {
        if (modalContentRef.current) {
          modalContentRef.current.style.transform = '';
        }
      });
    };

    // Escuchar cuando cualquier input pierde el foco
    const handleFocusOut = (e) => {
      const isFormElement = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      if (!isFormElement) return;

      // El teclado tarda ~300ms en cerrar completamente en iOS
      // Disparar el repaint múltiples veces para asegurar
      setTimeout(forceRepaint, 50);
      setTimeout(forceRepaint, 150);
      setTimeout(forceRepaint, 300);
    };

    // Escuchar cambios de visualViewport (más confiable para detectar teclado)
    const handleViewportChange = () => {
      setTimeout(forceRepaint, 50);
      setTimeout(forceRepaint, 150);
    };

    // Registrar listeners
    document.addEventListener('focusout', handleFocusOut, true);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }

    return () => {
      document.removeEventListener('focusout', handleFocusOut, true);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
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
