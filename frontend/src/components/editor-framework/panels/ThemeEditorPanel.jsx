/**
 * ====================================================================
 * THEME EDITOR PANEL
 * ====================================================================
 * Panel genérico de edición de tema para sidebar.
 * Configurable mediante props declarativas: colorFields, fontFields,
 * presetThemes, etc.
 *
 * Usado por Website Builder (4 colores + 2 fuentes) e Invitaciones (2 colores).
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Palette, Type } from 'lucide-react';
import FontSelect from './FontSelect';

/**
 * ThemeEditorPanel - Editor de tema genérico
 *
 * @param {Object} props
 * @param {Array<{key: string, label: string}>} props.colorFields - Campos de color a mostrar
 * @param {Object} props.currentColors - Colores actuales { [key]: '#hex' }
 * @param {Array<{key: string, label: string, options: Array}>} [props.fontFields] - Campos de fuentes (opcional)
 * @param {Object} [props.currentFonts] - Fuentes actuales { [key]: 'id' }
 * @param {Array<{id: string, nombre: string, colores: Object}>} props.presetThemes - Temas rápidos
 * @param {Function} props.onSave - Callback al guardar ({ colores, fuentes })
 * @param {string} [props.title] - Título del panel
 * @param {string} [props.subtitle] - Subtítulo del panel
 */

const AUTOSAVE_DEBOUNCE_MS = 1500;

function ThemeEditorPanel({
  colorFields,
  currentColors,
  fontFields,
  currentFonts,
  presetThemes = [],
  onSave,
  title = 'Tema',
  subtitle = 'Personaliza colores y tipografía',
  children,
}) {
  // Estado interno de colores editados
  const [colores, setColores] = useState(() => {
    const initial = {};
    colorFields.forEach(({ key }) => {
      initial[key] = currentColors?.[key] || '#000000';
    });
    return initial;
  });

  // Estado interno de fuentes editadas
  const [fuentes, setFuentes] = useState(() => {
    if (!fontFields) return null;
    const initial = {};
    fontFields.forEach(({ key, options }) => {
      initial[key] = currentFonts?.[key] || options?.[0]?.id || '';
    });
    return initial;
  });

  const [colorEditando, setColorEditando] = useState(null);
  const skipNextSave = useRef(true);

  // Sincronizar con props externas cuando cambian
  useEffect(() => {
    const updated = {};
    colorFields.forEach(({ key }) => {
      updated[key] = currentColors?.[key] || '#000000';
    });
    setColores(updated);
    skipNextSave.current = true;
  }, [currentColors, colorFields]);

  useEffect(() => {
    if (!fontFields) return;
    const updated = {};
    fontFields.forEach(({ key, options }) => {
      updated[key] = currentFonts?.[key] || options?.[0]?.id || '';
    });
    setFuentes(updated);
    skipNextSave.current = true;
  }, [currentFonts, fontFields]);

  // Autosave con debounce
  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    // Verificar si hay cambios reales vs props
    let hayCambios = false;
    for (const { key } of colorFields) {
      if (colores[key] !== (currentColors?.[key] || '#000000')) {
        hayCambios = true;
        break;
      }
    }
    if (!hayCambios && fontFields && fuentes) {
      for (const { key, options } of fontFields) {
        if (fuentes[key] !== (currentFonts?.[key] || options?.[0]?.id || '')) {
          hayCambios = true;
          break;
        }
      }
    }
    if (!hayCambios) return;

    const timer = setTimeout(() => {
      onSave({ colores, fuentes });
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [colores, fuentes, currentColors, currentFonts, colorFields, fontFields, onSave]);

  const handleColorChange = useCallback((color) => {
    if (!colorEditando) return;
    setColores(prev => ({ ...prev, [colorEditando]: color }));
  }, [colorEditando]);

  const handleAplicarTema = useCallback((tema) => {
    setColores(prev => {
      const updated = { ...prev };
      for (const key of Object.keys(tema.colores)) {
        if (key in updated) {
          updated[key] = tema.colores[key];
        }
      }
      return updated;
    });
    setColorEditando(null);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6" data-theme-editor-content>
        {/* Temas rápidos */}
        {presetThemes.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Temas rápidos
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {presetThemes.map((tema) => (
                <button
                  key={tema.id}
                  onClick={() => handleAplicarTema(tema)}
                  className="group relative"
                  title={tema.nombre}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
                    <div
                      className="w-full h-1/2"
                      style={{ backgroundColor: tema.colores.primario }}
                    />
                    <div
                      className="w-full h-1/2"
                      style={{ backgroundColor: tema.colores.secundario || tema.colores.fondo || '#F3F4F6' }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Colores personalizados */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Colores{fontFields ? ' personalizados' : ''}
          </h4>

          <div className="space-y-3">
            {colorFields.map(({ key, label }) => (
              <div key={key}>
                <button
                  onClick={() => setColorEditando(colorEditando === key ? null : key)}
                  className={`
                    w-full flex items-center justify-between p-2 rounded-lg border
                    transition-colors
                    ${colorEditando === key
                      ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 uppercase">
                      {colores[key]}
                    </span>
                    <div
                      className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: colores[key] }}
                    />
                  </div>
                </button>

                {/* Color picker expandido */}
                {colorEditando === key && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <HexColorPicker
                      color={colores[key]}
                      onChange={handleColorChange}
                      style={{ width: '100%' }}
                    />
                    <input
                      type="text"
                      value={colores[key]}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="mt-2 w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-center uppercase"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tipografía - Solo si fontFields está definido */}
        {fontFields && fuentes && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Type className="w-4 h-4" />
              Tipografía
            </h4>

            <div className="space-y-3">
              {fontFields.map(({ key, label, options }) => (
                <div key={key}>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                  </label>
                  <FontSelect
                    value={fuentes[key]}
                    options={options}
                    onChange={(val) => setFuentes(prev => ({ ...prev, [key]: val }))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contenido adicional inyectado por el consumidor */}
        {children}
      </div>
    </div>
  );
}

export const FUENTES_DISPONIBLES = [
  { id: 'Playfair Display', nombre: 'Playfair Display' },
  { id: 'Great Vibes', nombre: 'Great Vibes' },
  { id: 'Dancing Script', nombre: 'Dancing Script' },
  { id: 'Cormorant Garamond', nombre: 'Cormorant Garamond' },
  { id: 'Cinzel', nombre: 'Cinzel' },
  { id: 'Sacramento', nombre: 'Sacramento' },
  { id: 'Montserrat', nombre: 'Montserrat' },
  { id: 'Inter', nombre: 'Inter' },
  { id: 'Roboto', nombre: 'Roboto' },
  { id: 'Poppins', nombre: 'Poppins' },
  { id: 'Lato', nombre: 'Lato' },
  { id: 'Open Sans', nombre: 'Open Sans' },
];

export default memo(ThemeEditorPanel);
