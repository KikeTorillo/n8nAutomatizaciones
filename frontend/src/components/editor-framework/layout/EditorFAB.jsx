/**
 * ====================================================================
 * EDITOR FAB
 * ====================================================================
 * Floating Action Button configurable para editores en móvil.
 * Expande opciones para acceder a paneles cuando están ocultos.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorLayoutContext } from './EditorLayoutContext';

/**
 * EditorFAB - Floating Action Button configurable para móvil
 *
 * @param {Object} props
 * @param {Array} props.options - Opciones principales del FAB
 * @param {Array} props.extraOptions - Opciones adicionales (al final, con estilos custom)
 * @param {Object} props.disabledOptions - Map de opciones deshabilitadas { bloques: true }
 *
 * @example
 * // Invitaciones (simple)
 * <EditorFAB
 *   options={[
 *     { id: 'bloques', label: 'Bloques', icon: Plus, color: 'bg-primary-500' },
 *   ]}
 * />
 *
 * @example
 * // Website (completo)
 * <EditorFAB
 *   options={[
 *     { id: 'bloques', label: 'Bloques', icon: Plus, color: 'bg-primary-500' },
 *     { id: 'paginas', label: 'Páginas', icon: FileText, color: 'bg-blue-500' },
 *     { id: 'tema', label: 'Tema', icon: Palette, color: 'bg-purple-500' },
 *   ]}
 *   extraOptions={[
 *     { id: 'templates', label: 'Templates', icon: Sparkles, onClick: handleOpenTemplates },
 *   ]}
 *   disabledOptions={{ bloques: !paginaActiva, templates: !sitio }}
 * />
 */
function EditorFAB({ options = [], extraOptions = [], disabledOptions = {} }) {
  const { isMobile, openPanel } = useEditorLayoutContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleOptionClick = useCallback(
    (option) => {
      if (option.onClick) {
        // Opción con handler custom
        option.onClick();
      } else {
        // Opción estándar: abrir panel
        openPanel(option.id);
      }
      setIsExpanded(false);
    },
    [openPanel]
  );

  // Solo mostrar en móvil
  if (!isMobile) return null;

  // Todas las opciones combinadas (main + extra)
  const allOptions = [...options, ...extraOptions];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 -z-10"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Options */}
      <AnimatePresence>
        {isExpanded && (
          <div className="absolute bottom-16 right-0 flex flex-col-reverse items-end gap-3 mb-2">
            {allOptions.map((option, index) => {
              const isDisabled = disabledOptions[option.id];
              const Icon = option.icon;
              const isExtra = extraOptions.includes(option);

              return (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{
                    duration: 0.15,
                    delay: 0.05 * (allOptions.length - 1 - index),
                  }}
                  onClick={() => handleOptionClick(option)}
                  disabled={isDisabled}
                  className={cn(
                    'flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full shadow-lg',
                    'transition-all',
                    // Estilos según tipo
                    isExtra
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700'
                      : cn(option.color, 'text-white hover:brightness-110'),
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="text-sm font-medium whitespace-nowrap">
                    {option.label}
                  </span>
                  <Icon className="w-5 h-5" />
                </motion.button>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        onClick={toggleExpanded}
        className={cn(
          'w-14 h-14 rounded-full shadow-lg flex items-center justify-center',
          'transition-colors',
          isExpanded
            ? 'bg-gray-800 dark:bg-gray-700'
            : 'bg-primary-600 hover:bg-primary-700'
        )}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isExpanded ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {isExpanded ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </motion.button>
    </div>
  );
}

EditorFAB.propTypes = {
  /** Opciones principales del FAB */
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      color: PropTypes.string,
      onClick: PropTypes.func,
    })
  ),
  /** Opciones adicionales con estilo gradiente */
  extraOptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      onClick: PropTypes.func,
    })
  ),
  /** Map de opciones deshabilitadas */
  disabledOptions: PropTypes.object,
};

export default memo(EditorFAB);
