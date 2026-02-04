/**
 * ====================================================================
 * PROPERTIES PANEL (GENERIC)
 * ====================================================================
 * Panel lateral derecho para editar propiedades del bloque seleccionado.
 * Versión genérica del framework compartido.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import {
  X,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  Copy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Componentes internos
import { usePropertiesState } from '../hooks/usePropertiesState';
import TabContent from '../fields/TabContent';
import { TABS, TABS_SIMPLE } from '../constants';

/**
 * PropertiesPanel genérico
 *
 * @param {Object} props
 * @param {Object} props.bloque - Bloque seleccionado
 * @param {Function} props.onUpdate - Callback para actualizar
 * @param {Function} props.onDuplicate - Callback para duplicar
 * @param {Function} props.onDelete - Callback para eliminar
 * @param {Function} props.onClose - Callback para cerrar panel
 * @param {boolean} props.isLoading - Si esta guardando
 * @param {boolean} props.isInDrawer - Si se renderiza dentro de un drawer (movil/tablet)
 * @param {Object} props.blockConfigs - Configuración de campos por tipo de bloque
 * @param {Array} props.tabs - Tabs a mostrar (default: TABS_SIMPLE)
 * @param {React.ReactNode} props.extraComponents - Componentes adicionales (modales, drawers)
 * @param {string} props.breakpoint - Breakpoint actual (opcional)
 */
function PropertiesPanel({
  bloque,
  onUpdate,
  onDuplicate,
  onDelete,
  onClose,
  isLoading = false,
  isInDrawer = false,
  blockConfigs = {},
  tabs = TABS_SIMPLE,
  extraComponents,
  breakpoint = 'desktop',
}) {
  // Hook centralizado para estado
  const {
    activeTab,
    setActiveTab,
    localContent,
    handleChange,
    aiWriterState,
    openAIWriter,
    closeAIWriter,
    handleAIGenerate,
    unsplashState,
    openUnsplash,
    closeUnsplash,
    handleUnsplashSelect,
    itemsEditorState,
    openItemsEditor,
    closeItemsEditor,
    handleItemsChange,
  } = usePropertiesState(bloque, onUpdate);

  // Get config for this block type
  const blockConfig = bloque ? blockConfigs[bloque.tipo] : null;

  if (!bloque) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center p-6 text-center',
        isInDrawer ? 'py-12' : 'h-full'
      )}>
        <Settings className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Sin seleccion
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selecciona un bloque para ver y editar sus propiedades
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col bg-white dark:bg-gray-800',
      !isInDrawer && 'h-full border-l border-gray-200 dark:border-gray-700'
    )}>
      {/* Header - oculto en drawer porque el Drawer ya tiene titulo */}
      {!isInDrawer && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                {bloque.tipo?.replace(/_/g, ' ')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isLoading ? 'Guardando...' : 'Propiedades'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tipo de bloque e indicador de guardado en drawer */}
      {isInDrawer && (
        <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-sm font-medium capitalize">
              {bloque.tipo?.replace(/_/g, ' ')}
            </span>
          </div>
          {isLoading && (
            <span className="text-xs text-gray-500 dark:text-gray-400">Guardando...</span>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {isInDrawer && <span>{tab.label}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {activeTab === 'contenido' && (
              <TabContent
                fields={blockConfig?.contenido || []}
                values={localContent}
                onChange={handleChange}
                onOpenAIWriter={openAIWriter}
                onOpenUnsplash={openUnsplash}
                onOpenItemsEditor={openItemsEditor}
              />
            )}

            {activeTab === 'estilo' && (
              <TabContent
                fields={blockConfig?.estilo || []}
                values={localContent}
                onChange={handleChange}
                onOpenAIWriter={openAIWriter}
                onOpenUnsplash={openUnsplash}
                onOpenItemsEditor={openItemsEditor}
              />
            )}

            {activeTab === 'avanzado' && (
              <AdvancedTab
                bloque={bloque}
                handleChange={handleChange}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={() => onDuplicate?.(bloque.id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Copy className="w-4 h-4" />
          Duplicar bloque
        </button>
        <button
          onClick={() => onDelete?.(bloque.id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar bloque
        </button>
      </div>

      {/* Extra Components (modales, drawers específicos del módulo) */}
      {extraComponents && typeof extraComponents === 'function'
        ? extraComponents({
            aiWriterState,
            closeAIWriter,
            handleAIGenerate,
            unsplashState,
            closeUnsplash,
            handleUnsplashSelect,
            itemsEditorState,
            closeItemsEditor,
            handleItemsChange,
            localContent,
          })
        : extraComponents
      }
    </div>
  );
}

/**
 * AdvancedTab - Tab de configuracion avanzada
 */
const AdvancedTab = memo(function AdvancedTab({ bloque, handleChange }) {
  return (
    <div className="space-y-4">
      {/* Visibility */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Visibilidad
        </span>
        <button
          type="button"
          onClick={() => handleChange('visible', !bloque.visible)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
            bloque.visible
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          )}
        >
          {bloque.visible ? (
            <>
              <Eye className="w-4 h-4" />
              Visible
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              Oculto
            </>
          )}
        </button>
      </div>

      {/* ID */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          ID del bloque
        </label>
        <code className="block px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 break-all">
          {bloque.id}
        </code>
      </div>
    </div>
  );
});

export default memo(PropertiesPanel);
