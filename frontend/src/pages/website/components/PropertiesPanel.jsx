/**
 * ====================================================================
 * PROPERTIES PANEL
 * ====================================================================
 * Panel lateral derecho para editar propiedades del bloque seleccionado.
 * Muestra configuraciones que no se pueden editar inline (URLs, colores, etc.)
 */

import { useState, useEffect, memo, useCallback } from 'react';
import {
  X,
  Settings,
  Paintbrush,
  Code,
  Image as ImageIcon,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Loader2,
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWebsiteEditorStore } from '@/store';

// ========== TABS CONFIG ==========

const TABS = [
  { id: 'contenido', label: 'Contenido', icon: Settings },
  { id: 'estilo', label: 'Estilo', icon: Paintbrush },
  { id: 'avanzado', label: 'Avanzado', icon: Code },
];

// ========== BLOCK TYPE CONFIGS ==========

const BLOCK_CONFIGS = {
  hero: {
    contenido: [
      { key: 'imagen_url', label: 'Imagen de fondo', type: 'image' },
      { key: 'boton_url', label: 'URL del botón', type: 'url' },
      { key: 'boton_tipo', label: 'Tipo de botón', type: 'select', options: [
        { value: 'link', label: 'Enlace' },
        { value: 'agendar', label: 'Agendar cita' },
        { value: 'whatsapp', label: 'WhatsApp' },
      ]},
      { key: 'alineacion', label: 'Alineación', type: 'alignment' },
    ],
    estilo: [
      { key: 'imagen_overlay', label: 'Oscurecer imagen', type: 'range', min: 0, max: 1, step: 0.1 },
    ],
  },
  servicios: {
    contenido: [
      { key: 'columnas', label: 'Columnas', type: 'select', options: [
        { value: 2, label: '2 columnas' },
        { value: 3, label: '3 columnas' },
        { value: 4, label: '4 columnas' },
      ]},
      { key: 'mostrar_precio', label: 'Mostrar precios', type: 'toggle' },
      { key: 'origen', label: 'Origen de datos', type: 'select', options: [
        { value: 'manual', label: 'Manual' },
        { value: 'modulo', label: 'Módulo Servicios' },
      ]},
    ],
  },
  testimonios: {
    contenido: [
      { key: 'layout', label: 'Diseño', type: 'select', options: [
        { value: 'grid', label: 'Grid' },
        { value: 'carousel', label: 'Carrusel' },
      ]},
      { key: 'origen', label: 'Origen de datos', type: 'select', options: [
        { value: 'manual', label: 'Manual' },
        { value: 'resenas', label: 'Reseñas del Marketplace' },
      ]},
    ],
  },
  equipo: {
    contenido: [
      { key: 'mostrar_redes', label: 'Mostrar redes sociales', type: 'toggle' },
      { key: 'origen', label: 'Origen de datos', type: 'select', options: [
        { value: 'manual', label: 'Manual' },
        { value: 'profesionales', label: 'Módulo Profesionales' },
      ]},
    ],
  },
  cta: {
    contenido: [
      { key: 'boton_url', label: 'URL del botón', type: 'url' },
      { key: 'boton_tipo', label: 'Tipo de botón', type: 'select', options: [
        { value: 'link', label: 'Enlace' },
        { value: 'agendar', label: 'Agendar cita' },
        { value: 'whatsapp', label: 'WhatsApp' },
      ]},
    ],
    estilo: [
      { key: 'fondo_tipo', label: 'Tipo de fondo', type: 'select', options: [
        { value: 'color', label: 'Color sólido' },
        { value: 'imagen', label: 'Imagen' },
        { value: 'gradiente', label: 'Gradiente' },
      ]},
      { key: 'fondo_valor', label: 'Valor del fondo', type: 'text', placeholder: 'Color, URL o gradiente CSS' },
    ],
  },
  contacto: {
    contenido: [
      { key: 'mostrar_formulario', label: 'Mostrar formulario', type: 'toggle' },
      { key: 'mostrar_info', label: 'Mostrar información', type: 'toggle' },
      { key: 'mostrar_mapa', label: 'Mostrar mapa', type: 'toggle' },
    ],
  },
  footer: {
    contenido: [
      { key: 'logo_url', label: 'URL del logo', type: 'image' },
      { key: 'mostrar_redes', label: 'Mostrar redes sociales', type: 'toggle' },
    ],
  },
  texto: {
    contenido: [
      { key: 'alineacion', label: 'Alineación', type: 'alignment' },
    ],
  },
  galeria: {
    contenido: [
      { key: 'layout', label: 'Diseño', type: 'select', options: [
        { value: 'grid', label: 'Grid' },
        { value: 'masonry', label: 'Masonry' },
        { value: 'carousel', label: 'Carrusel' },
      ]},
      { key: 'columnas', label: 'Columnas', type: 'select', options: [
        { value: 2, label: '2 columnas' },
        { value: 3, label: '3 columnas' },
        { value: 4, label: '4 columnas' },
      ]},
    ],
  },
  video: {
    contenido: [
      { key: 'url', label: 'URL del video', type: 'url', placeholder: 'YouTube, Vimeo o MP4' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: [
        { value: 'youtube', label: 'YouTube' },
        { value: 'vimeo', label: 'Vimeo' },
        { value: 'mp4', label: 'MP4 directo' },
      ]},
      { key: 'autoplay', label: 'Reproducción automática', type: 'toggle' },
      { key: 'mostrar_controles', label: 'Mostrar controles', type: 'toggle' },
    ],
  },
  separador: {
    contenido: [
      { key: 'tipo', label: 'Tipo', type: 'select', options: [
        { value: 'linea', label: 'Línea' },
        { value: 'espacio', label: 'Espacio' },
        { value: 'ondas', label: 'Ondas' },
      ]},
      { key: 'altura', label: 'Altura (px)', type: 'number', min: 10, max: 200 },
      { key: 'color', label: 'Color', type: 'color' },
    ],
  },
};

// ========== MAIN COMPONENT ==========

/**
 * PropertiesPanel
 *
 * @param {Object} props
 * @param {Object} props.bloque - Bloque seleccionado
 * @param {Function} props.onUpdate - Callback para actualizar
 * @param {Function} props.onDuplicate - Callback para duplicar
 * @param {Function} props.onDelete - Callback para eliminar
 * @param {Function} props.onClose - Callback para cerrar panel
 * @param {boolean} props.isLoading - Si está guardando
 */
// Iconos de breakpoint
const BREAKPOINT_ICONS = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

const BREAKPOINT_LABELS = {
  desktop: 'Escritorio',
  tablet: 'Tablet',
  mobile: 'Móvil',
};

function PropertiesPanel({
  bloque,
  onUpdate,
  onDuplicate,
  onDelete,
  onClose,
  isLoading = false,
}) {
  const [activeTab, setActiveTab] = useState('contenido');
  const [localContent, setLocalContent] = useState({});
  const breakpoint = useWebsiteEditorStore((state) => state.breakpoint);

  // Sync local content with bloque
  useEffect(() => {
    if (bloque) {
      setLocalContent(bloque.contenido || {});
    }
  }, [bloque?.id]);

  /**
   * Handle field change
   */
  const handleChange = useCallback(
    (key, value) => {
      const newContent = { ...localContent, [key]: value };
      setLocalContent(newContent);
      onUpdate?.(newContent);
    },
    [localContent, onUpdate]
  );

  // Get config for this block type
  const config = bloque ? BLOCK_CONFIGS[bloque.tipo] : null;

  if (!bloque) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Settings className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Sin selección
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selecciona un bloque para ver y editar sus propiedades
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
              {bloque.tipo}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isLoading ? 'Guardando...' : 'Propiedades'}
            </p>
          </div>
          {/* Breakpoint indicator */}
          {breakpoint !== 'desktop' && (
            <BreakpointBadge breakpoint={breakpoint} />
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
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
                fields={config?.contenido || []}
                values={localContent}
                onChange={handleChange}
              />
            )}

            {activeTab === 'estilo' && (
              <TabContent
                fields={config?.estilo || []}
                values={localContent}
                onChange={handleChange}
              />
            )}

            {activeTab === 'avanzado' && (
              <div className="space-y-4">
                {/* Visibility */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Visibilidad
                  </span>
                  <button
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
    </div>
  );
}

// ========== TAB CONTENT ==========

function TabContent({ fields, values, onChange }) {
  if (!fields || fields.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        No hay propiedades configurables
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={values[field.key]}
          onChange={(value) => onChange(field.key, value)}
        />
      ))}
    </div>
  );
}

// ========== FIELD RENDERER ==========

function FieldRenderer({ field, value, onChange }) {
  const { key, label, type, placeholder, options, min, max, step } = field;

  switch (type) {
    case 'text':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500"
          />
        </div>
      );

    case 'url':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
          <div className="relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="url"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || 'https://...'}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      );

    case 'image':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
          <div className="relative">
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="url"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="URL de la imagen"
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500"
            />
          </div>
          {value && (
            <img
              src={value}
              alt="Preview"
              className="mt-2 w-full h-20 object-cover rounded border border-gray-200 dark:border-gray-600"
              onError={(e) => (e.target.style.display = 'none')}
            />
          )}
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500"
          >
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'toggle':
      return (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors',
              value
                ? 'bg-primary-600'
                : 'bg-gray-200 dark:bg-gray-600'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow',
                value && 'translate-x-5'
              )}
            />
          </button>
        </div>
      );

    case 'number':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500"
          />
        </div>
      );

    case 'range':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}: {Math.round((value || 0) * 100)}%
          </label>
          <input
            type="range"
            value={value || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min || 0}
            max={max || 1}
            step={step || 0.1}
            className="w-full"
          />
        </div>
      );

    case 'color':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={value || '#E5E7EB'}
              onChange={(e) => onChange(e.target.value)}
              className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#FFFFFF"
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      );

    case 'alignment':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            {[
              { v: 'left', Icon: AlignLeft },
              { v: 'center', Icon: AlignCenter },
              { v: 'right', Icon: AlignRight },
            ].map(({ v, Icon }) => (
              <button
                key={v}
                onClick={() => onChange(v)}
                className={cn(
                  'flex-1 p-2 rounded transition-colors',
                  value === v
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                )}
              >
                <Icon className="w-4 h-4 mx-auto" />
              </button>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}

// ========== BREAKPOINT BADGE ==========

function BreakpointBadge({ breakpoint }) {
  const Icon = BREAKPOINT_ICONS[breakpoint] || Monitor;
  const label = BREAKPOINT_LABELS[breakpoint] || breakpoint;

  const colors = {
    tablet: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    mobile: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border',
        colors[breakpoint] || 'bg-gray-100 text-gray-700'
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default memo(PropertiesPanel);
