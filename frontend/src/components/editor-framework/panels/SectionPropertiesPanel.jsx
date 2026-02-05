/**
 * ====================================================================
 * SECTION PROPERTIES PANEL
 * ====================================================================
 * Panel de propiedades para editar la sección seleccionada.
 * Permite configurar altura, fondo, padding y overlay.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { X, Trash2, Copy, ChevronUp, ChevronDown, Layers } from 'lucide-react';
import {
  SelectField,
  NumberField,
  RangeField,
  ColorField,
  ImageField,
  ToggleField,
  TextField,
} from '../fields';
import { TABS } from '../constants';

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

// ========== CONSTANTS ==========

const ALTURA_UNIDAD_OPTIONS = [
  { value: 'vh', label: 'Viewport (vh)' },
  { value: 'px', label: 'Píxeles (px)' },
  { value: 'auto', label: 'Automático' },
];

const FONDO_TIPO_OPTIONS = [
  { value: 'color', label: 'Color sólido' },
  { value: 'imagen', label: 'Imagen' },
  { value: 'gradiente', label: 'Gradiente' },
  { value: 'video', label: 'Video' },
];

const PRESET_OPTIONS = [
  { value: '', label: 'Ninguno' },
  { value: 'hero', label: 'Hero' },
  { value: 'features', label: 'Características' },
  { value: 'cta', label: 'Call to Action' },
  { value: 'testimonials', label: 'Testimonios' },
  { value: 'gallery', label: 'Galería' },
  { value: 'contact', label: 'Contacto' },
];

// ========== MAIN COMPONENT ==========

function SectionPropertiesPanel({
  seccion,
  onChange,
  onDelete,
  onDuplicate,
  onMoveSection,
  onClose,
  className,
}) {
  const [activeTab, setActiveTab] = useState(TABS.CONTENIDO);

  const config = seccion?.config || {};
  const { altura = { valor: 100, unidad: 'vh' }, padding = { top: 40, bottom: 40 }, fondo = {} } = config;

  // Handler para cambios de config
  const handleConfigChange = useCallback((field, value) => {
    onChange?.(seccion.id, {
      config: {
        ...config,
        [field]: value,
      },
    });
  }, [seccion?.id, config, onChange]);

  // Handler para cambios de fondo
  const handleFondoChange = useCallback((field, value) => {
    handleConfigChange('fondo', {
      ...fondo,
      [field]: value,
    });
  }, [fondo, handleConfigChange]);

  // Handler para cambios de overlay
  const handleOverlayChange = useCallback((field, value) => {
    handleConfigChange('fondo', {
      ...fondo,
      overlay: {
        ...(fondo.overlay || {}),
        [field]: value,
      },
    });
  }, [fondo, handleConfigChange]);

  // Handler para cambios de altura
  const handleAlturaChange = useCallback((field, value) => {
    handleConfigChange('altura', {
      ...altura,
      [field]: value,
    });
  }, [altura, handleConfigChange]);

  // Handler para cambios de padding
  const handlePaddingChange = useCallback((field, value) => {
    handleConfigChange('padding', {
      ...padding,
      [field]: value,
    });
  }, [padding, handleConfigChange]);

  if (!seccion) {
    return (
      <div className={cn('section-properties-panel h-full flex items-center justify-center text-gray-400', className)}>
        <p className="text-sm">Selecciona una sección para editar</p>
      </div>
    );
  }

  return (
    <div className={cn('section-properties-panel h-full flex flex-col bg-white dark:bg-gray-800', className)}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            Sección
          </span>
          {seccion.preset && (
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {seccion.preset}
            </span>
          )}
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
          onClick={() => onDuplicate?.(seccion.id)}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Duplicar sección"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onMoveSection?.(seccion.id, 'up')}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Mover arriba"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onMoveSection?.(seccion.id, 'down')}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Mover abajo"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => onDelete?.(seccion.id)}
          className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Eliminar sección"
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
          Layout
        </TabButton>
        <TabButton
          isActive={activeTab === TABS.ESTILOS}
          onClick={() => setActiveTab(TABS.ESTILOS)}
        >
          Fondo
        </TabButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === TABS.CONTENIDO ? (
          <div className="space-y-4">
            {/* Preset */}
            <SelectField
              label="Preset"
              value={seccion.preset || ''}
              onChange={(v) => onChange?.(seccion.id, { preset: v || null })}
              options={PRESET_OPTIONS}
              helperText="Plantilla predefinida (opcional)"
            />

            {/* Altura */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Altura
              </label>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  value={altura.valor}
                  onChange={(v) => handleAlturaChange('valor', v)}
                  min={0}
                  max={altura.unidad === 'vh' ? 200 : 2000}
                  disabled={altura.unidad === 'auto'}
                />
                <SelectField
                  value={altura.unidad}
                  onChange={(v) => handleAlturaChange('unidad', v)}
                  options={ALTURA_UNIDAD_OPTIONS}
                />
              </div>
            </div>

            {/* Padding */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Padding vertical
              </label>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="Superior"
                  value={padding.top}
                  onChange={(v) => handlePaddingChange('top', v)}
                  min={0}
                  max={200}
                  suffix="px"
                />
                <NumberField
                  label="Inferior"
                  value={padding.bottom}
                  onChange={(v) => handlePaddingChange('bottom', v)}
                  min={0}
                  max={200}
                  suffix="px"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tipo de fondo */}
            <SelectField
              label="Tipo de fondo"
              value={fondo.tipo || 'color'}
              onChange={(v) => handleFondoChange('tipo', v)}
              options={FONDO_TIPO_OPTIONS}
            />

            {/* Color de fondo */}
            {fondo.tipo === 'color' && (
              <ColorField
                label="Color"
                value={fondo.valor || '#ffffff'}
                onChange={(v) => handleFondoChange('valor', v)}
              />
            )}

            {/* Imagen de fondo */}
            {fondo.tipo === 'imagen' && (
              <>
                <ImageField
                  label="Imagen"
                  value={fondo.valor || ''}
                  onChange={(v) => handleFondoChange('valor', v)}
                />
                <TextField
                  label="Posición"
                  value={fondo.posicion || 'center center'}
                  onChange={(v) => handleFondoChange('posicion', v)}
                  placeholder="ej: center center, top left"
                />
              </>
            )}

            {/* Gradiente */}
            {fondo.tipo === 'gradiente' && (
              <TextField
                label="CSS Gradiente"
                value={fondo.valor || 'linear-gradient(135deg, #753572, #F59E0B)'}
                onChange={(v) => handleFondoChange('valor', v)}
                placeholder="linear-gradient(...)"
              />
            )}

            {/* Video de fondo */}
            {fondo.tipo === 'video' && (
              <TextField
                label="URL del video"
                value={fondo.valor || ''}
                onChange={(v) => handleFondoChange('valor', v)}
                placeholder="https://..."
              />
            )}

            {/* Overlay (para imagen y video) */}
            {(fondo.tipo === 'imagen' || fondo.tipo === 'video') && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Overlay
                </p>
                <ColorField
                  label="Color del overlay"
                  value={fondo.overlay?.color || '#000000'}
                  onChange={(v) => handleOverlayChange('color', v)}
                />
                <RangeField
                  label="Opacidad"
                  value={fondo.overlay?.opacidad ?? 0.4}
                  onChange={(v) => handleOverlayChange('opacidad', v)}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

SectionPropertiesPanel.propTypes = {
  seccion: PropTypes.shape({
    id: PropTypes.string.isRequired,
    tipo: PropTypes.string,
    preset: PropTypes.string,
    config: PropTypes.shape({
      altura: PropTypes.object,
      padding: PropTypes.object,
      fondo: PropTypes.object,
    }),
  }),
  onChange: PropTypes.func,
  onDelete: PropTypes.func,
  onDuplicate: PropTypes.func,
  onMoveSection: PropTypes.func,
  onClose: PropTypes.func,
  className: PropTypes.string,
};

export default memo(SectionPropertiesPanel);
