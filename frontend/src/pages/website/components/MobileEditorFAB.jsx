/**
 * ====================================================================
 * MOBILE EDITOR FAB
 * ====================================================================
 * Floating Action Button para el editor de website en móvil.
 * Expande opciones para acceder a Bloques, Páginas y Tema
 * cuando los paneles laterales están ocultos.
 */

import { memo, useState, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  FileText,
  Palette,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PANEL_TYPES } from '@/components/editor-framework';

/**
 * Opciones del FAB
 */
const FAB_OPTIONS = [
  {
    id: PANEL_TYPES.BLOQUES,
    label: 'Bloques',
    icon: Plus,
    color: 'bg-primary-500',
  },
  {
    id: PANEL_TYPES.PAGINAS,
    label: 'Páginas',
    icon: FileText,
    color: 'bg-blue-500',
  },
  {
    id: PANEL_TYPES.TEMA,
    label: 'Tema',
    icon: Palette,
    color: 'bg-purple-500',
  },
];

/**
 * MobileEditorFAB - Floating Action Button para móvil
 *
 * @param {Object} props
 * @param {Function} props.onOpenPanel - Callback para abrir panel/drawer
 * @param {Function} props.onOpenTemplates - Callback para abrir galería de templates
 * @param {boolean} props.disabledBloques - Si la opción Bloques está deshabilitada (no hay página activa)
 * @param {boolean} props.disabledTemplates - Si la opción Templates está deshabilitada (no hay sitio)
 */
function MobileEditorFAB({ onOpenPanel, onOpenTemplates, disabledBloques = false, disabledTemplates = false }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleOptionClick = useCallback((optionId) => {
    onOpenPanel?.(optionId);
    setIsExpanded(false);
  }, [onOpenPanel]);

  const handleTemplatesClick = useCallback(() => {
    onOpenTemplates?.();
    setIsExpanded(false);
  }, [onOpenTemplates]);

  return (
    <div className="fixed bottom-6 right-6 z-40 md:hidden">
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
            {/* Templates option - disabled si no hay sitio */}
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ duration: 0.15, delay: 0.05 * FAB_OPTIONS.length }}
              onClick={handleTemplatesClick}
              disabled={disabledTemplates}
              className={cn(
                'flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full shadow-lg',
                'bg-gradient-to-r from-primary-600 to-secondary-600 text-white',
                'hover:from-primary-700 hover:to-secondary-700',
                'transition-colors',
                disabledTemplates && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-sm font-medium whitespace-nowrap">Plantillas</span>
              <Sparkles className="w-5 h-5" />
            </motion.button>

            {/* Main options - Solo Bloques se deshabilita cuando no hay página */}
            {FAB_OPTIONS.map((option, index) => {
              // Solo Bloques necesita página activa, Páginas y Tema siempre habilitados
              const isDisabled = option.id === PANEL_TYPES.BLOQUES && disabledBloques;

              return (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{ duration: 0.15, delay: 0.05 * (FAB_OPTIONS.length - 1 - index) }}
                  onClick={() => handleOptionClick(option.id)}
                  disabled={isDisabled}
                  className={cn(
                    'flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full shadow-lg',
                    option.color, 'text-white',
                    'hover:brightness-110 transition-all',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="text-sm font-medium whitespace-nowrap">{option.label}</span>
                  <option.icon className="w-5 h-5" />
                </motion.button>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB Button - siempre habilitado */}
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

export default memo(MobileEditorFAB);
