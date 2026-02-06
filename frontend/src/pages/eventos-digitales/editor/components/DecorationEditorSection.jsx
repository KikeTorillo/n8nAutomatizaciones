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
 * @version 3.0.0 - Reducido a solo animacion_entrada
 * @since 2026-02-05
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { Check, RotateCcw, Loader2, Sparkles } from 'lucide-react';
import { ANIMACIONES_ENTRADA } from '../config';

/**
 * DecorationEditorSection
 *
 * @param {Object} props
 * @param {Object} props.currentDecoration - Decoraciones actuales { animacion_entrada }
 * @param {Function} props.onSave - Callback al guardar
 * @param {boolean} props.isLoading - Estado de carga
 */
function DecorationEditorSection({ currentDecoration, onSave, isLoading = false }) {
  const [animacion, setAnimacion] = useState(currentDecoration?.animacion_entrada || 'none');
  const [cambiosPendientes, setCambiosPendientes] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setAnimacion(currentDecoration?.animacion_entrada || 'none');
  }, [currentDecoration?.animacion_entrada]);

  useEffect(() => {
    setCambiosPendientes(animacion !== (currentDecoration?.animacion_entrada || 'none'));
  }, [animacion, currentDecoration?.animacion_entrada]);

  const handleGuardar = useCallback(async () => {
    setGuardando(true);
    try {
      await onSave({ animacion_entrada: animacion });
      setCambiosPendientes(false);
    } catch {
      // El consumidor maneja el error
    } finally {
      setGuardando(false);
    }
  }, [animacion, onSave]);

  const handleRestaurar = useCallback(() => {
    setAnimacion(currentDecoration?.animacion_entrada || 'none');
  }, [currentDecoration?.animacion_entrada]);

  const loading = isLoading || guardando;

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

      {/* Footer con acciones */}
      {cambiosPendientes && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={handleRestaurar}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Descartar
            </button>
            <button
              onClick={handleGuardar}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(DecorationEditorSection);
