/**
 * ====================================================================
 * DECORATION EDITOR SECTION
 * ====================================================================
 * Sección de configuraciones globales de decoración (no ligadas a un bloque).
 * Solo contiene animación de entrada (global a todos los bloques).
 *
 * Las decoraciones específicas de portada se editan en HeroInvitacionEditor.
 * El marco de fotos se edita en GaleriaEditor.
 *
 * @version 4.0.0 - Autosave con debounce (sin botón guardar manual)
 * @since 2026-02-05
 */

import { useState, useEffect, useRef, memo } from 'react';
import { Sparkles } from 'lucide-react';
import { ANIMACIONES_ENTRADA } from '../config';

const AUTOSAVE_DEBOUNCE_MS = 1000;

/**
 * DecorationEditorSection
 *
 * @param {Object} props
 * @param {Object} props.currentDecoration - Decoraciones actuales { animacion_entrada }
 * @param {Function} props.onSave - Callback al guardar
 */
function DecorationEditorSection({ currentDecoration, onSave }) {
  const [animacion, setAnimacion] = useState(currentDecoration?.animacion_entrada || 'none');
  const skipNextSave = useRef(true);

  // Sincronizar con props externas
  useEffect(() => {
    setAnimacion(currentDecoration?.animacion_entrada || 'none');
    skipNextSave.current = true;
  }, [currentDecoration?.animacion_entrada]);

  // Autosave con debounce
  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    if (animacion === (currentDecoration?.animacion_entrada || 'none')) return;

    const timer = setTimeout(() => {
      onSave({ animacion_entrada: animacion });
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [animacion, currentDecoration?.animacion_entrada, onSave]);

  return (
    <div className="space-y-4">
      {/* Separador */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Header */}
      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        Animaciones
      </h4>

      {/* Selector de animación */}
      <div>
        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
          Animación de entrada
        </label>
        <select
          value={animacion}
          onChange={(e) => setAnimacion(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        >
          {ANIMACIONES_ENTRADA.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Los bloques se animan al hacer scroll en la vista pública.
        </p>
      </div>
    </div>
  );
}

export default memo(DecorationEditorSection);
