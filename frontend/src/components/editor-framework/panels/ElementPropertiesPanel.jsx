/**
 * ====================================================================
 * ELEMENT PROPERTIES PANEL
 * ====================================================================
 * Panel de propiedades para editar el elemento seleccionado.
 * Muestra el editor específico según el tipo de elemento.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import {
  X,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Layers,
  ChevronUp,
  ChevronDown,
  Move,
} from 'lucide-react';
import { getElementType } from '../elements/elementTypes';
import { TABS } from '../constants';

// ========== LAZY LOADED EDITORS ==========

const TextoElementEditor = lazy(() => import('../elements/editors/TextoElementEditor'));
const ImagenElementEditor = lazy(() => import('../elements/editors/ImagenElementEditor'));
const BotonElementEditor = lazy(() => import('../elements/editors/BotonElementEditor'));

// ========== EDITOR MAP ==========

const EDITOR_MAP = {
  texto: TextoElementEditor,
  imagen: ImagenElementEditor,
  boton: BotonElementEditor,
};

// ========== TAB BUTTONS ==========

function TabButton({ isActive, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 py-2 px-3 text-sm font-medium transition-colors duration-150',
        isActive
          ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
      )}
    >
      {children}
    </button>
  );
}

// ========== POSITION EDITOR ==========

function PositionEditor({ elemento, onChange }) {
  const posicion = elemento.posicion || {};

  const handleChange = (field, value) => {
    onChange({
      posicion: {
        ...posicion,
        [field]: value,
      },
    });
  };

  return (
    <div className="position-editor space-y-4 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Posición X (%)
          </label>
          <input
            type="number"
            value={posicion.x ?? 50}
            onChange={(e) => handleChange('x', Number(e.target.value))}
            min={0}
            max={100}
            step={1}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Posición Y (%)
          </label>
          <input
            type="number"
            value={posicion.y ?? 50}
            onChange={(e) => handleChange('y', Number(e.target.value))}
            min={0}
            max={100}
            step={1}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Ancho (%)
          </label>
          <input
            type="number"
            value={typeof posicion.ancho === 'number' ? posicion.ancho : 50}
            onChange={(e) => handleChange('ancho', Number(e.target.value))}
            min={5}
            max={100}
            step={1}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Capa (z-index)
          </label>
          <input
            type="number"
            value={elemento.capa ?? 1}
            onChange={(e) => onChange({ capa: Number(e.target.value) })}
            min={1}
            max={100}
            step={1}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Ancla
        </label>
        <select
          value={posicion.ancla || 'center'}
          onChange={(e) => handleChange('ancla', e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
        >
          <option value="top-left">Arriba izquierda</option>
          <option value="top-center">Arriba centro</option>
          <option value="top-right">Arriba derecha</option>
          <option value="center-left">Centro izquierda</option>
          <option value="center">Centro</option>
          <option value="center-right">Centro derecha</option>
          <option value="bottom-left">Abajo izquierda</option>
          <option value="bottom-center">Abajo centro</option>
          <option value="bottom-right">Abajo derecha</option>
        </select>
      </div>
    </div>
  );
}

// ========== LOADING FALLBACK ==========

function EditorFallback() {
  return (
    <div className="p-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========

function ElementPropertiesPanel({
  elemento,
  onChange,
  onDelete,
  onDuplicate,
  onToggleVisibility,
  onMoveLayer,
  onClose,
  className,
}) {
  const [activeTab, setActiveTab] = useState(TABS.CONTENIDO);

  // Obtener info del tipo de elemento
  const elementType = useMemo(
    () => getElementType(elemento?.tipo),
    [elemento?.tipo]
  );

  // Obtener editor específico
  const Editor = useMemo(
    () => EDITOR_MAP[elemento?.tipo],
    [elemento?.tipo]
  );

  // Handler para cambios
  const handleChange = useCallback((changes) => {
    onChange?.(elemento.id, changes);
  }, [elemento?.id, onChange]);

  if (!elemento) {
    return (
      <div className={cn('element-properties-panel h-full flex items-center justify-center text-gray-400', className)}>
        <p className="text-sm">Selecciona un elemento para editar</p>
      </div>
    );
  }

  return (
    <div className={cn('element-properties-panel h-full flex flex-col bg-white dark:bg-gray-800', className)}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {elementType?.icon && (
            <elementType.icon className="w-4 h-4 text-gray-500" />
          )}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {elementType?.label || elemento.tipo}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => onToggleVisibility?.(elemento.id)}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title={elemento.visible !== false ? 'Ocultar' : 'Mostrar'}
        >
          {elemento.visible !== false ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onDuplicate?.(elemento.id)}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Duplicar"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onMoveLayer?.(elemento.id, 'up')}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Subir capa"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onMoveLayer?.(elemento.id, 'down')}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Bajar capa"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => onDelete?.(elemento.id)}
          className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-gray-700">
        <TabButton
          isActive={activeTab === TABS.CONTENIDO}
          onClick={() => setActiveTab(TABS.CONTENIDO)}
        >
          Contenido
        </TabButton>
        <TabButton
          isActive={activeTab === TABS.ESTILOS}
          onClick={() => setActiveTab(TABS.ESTILOS)}
        >
          Estilos
        </TabButton>
        <TabButton
          isActive={activeTab === 'posicion'}
          onClick={() => setActiveTab('posicion')}
        >
          <Move className="w-3.5 h-3.5 inline mr-1" />
          Posición
        </TabButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'posicion' ? (
          <PositionEditor elemento={elemento} onChange={handleChange} />
        ) : Editor ? (
          <Suspense fallback={<EditorFallback />}>
            <div className="p-4">
              <Editor
                elemento={elemento}
                onChange={handleChange}
                activeTab={activeTab}
              />
            </div>
          </Suspense>
        ) : (
          <div className="p-4 text-center text-gray-400">
            <p className="text-sm">
              No hay editor disponible para este tipo de elemento
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

ElementPropertiesPanel.propTypes = {
  elemento: PropTypes.shape({
    id: PropTypes.string.isRequired,
    tipo: PropTypes.string.isRequired,
    contenido: PropTypes.object,
    estilos: PropTypes.object,
    posicion: PropTypes.object,
    capa: PropTypes.number,
    visible: PropTypes.bool,
  }),
  onChange: PropTypes.func,
  onDelete: PropTypes.func,
  onDuplicate: PropTypes.func,
  onToggleVisibility: PropTypes.func,
  onMoveLayer: PropTypes.func,
  onClose: PropTypes.func,
  className: PropTypes.string,
};

export default memo(ElementPropertiesPanel);
