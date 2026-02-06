/**
 * ====================================================================
 * APERTURA SETTINGS SECTION
 * ====================================================================
 * Sección compacta para configurar la animación de apertura de la
 * invitación. Se integra dentro del panel "Tema" del sidebar.
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import { memo, useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ANIMACIONES_DECORATIVAS } from '../../config/animacionesDecorativas';
import { useLottieAnimation } from '../../hooks/useLottieAnimation';

const Lottie = lazy(() => import('lottie-react'));

/**
 * Preview miniatura de la animación Lottie
 */
function LottiePreview({ tipo }) {
  const { animationData, loading } = useLottieAnimation(tipo);

  if (loading || !animationData) {
    return (
      <div className="w-full h-32 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
    );
  }

  return (
    <div className="w-full h-32 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center overflow-hidden">
      <Suspense fallback={<div className="w-24 h-24" />}>
        <Lottie
          animationData={animationData}
          loop
          autoplay
          style={{ width: 120, height: 120 }}
        />
      </Suspense>
    </div>
  );
}

/**
 * AperturaSettingsSection - Panel de configuración de animación de apertura
 *
 * @param {Object} props
 * @param {Object} props.configuracion - configuracion del evento
 * @param {Function} props.onSave - callback(config) para guardar
 * @param {boolean} props.saving - si está guardando
 */
function AperturaSettingsSection({ configuracion = {}, onSave, saving = false }) {
  const [expanded, setExpanded] = useState(false);
  const [tipo, setTipo] = useState(configuracion.animacion_apertura || 'none');
  const [texto, setTexto] = useState(configuracion.texto_apertura || '');

  // Sincronizar con datos del servidor
  useEffect(() => {
    setTipo(configuracion.animacion_apertura || 'none');
    setTexto(configuracion.texto_apertura || '');
  }, [configuracion.animacion_apertura, configuracion.texto_apertura]);

  const hasChanges =
    tipo !== (configuracion.animacion_apertura || 'none') ||
    texto !== (configuracion.texto_apertura || '');

  const handleGuardar = useCallback(() => {
    onSave?.({
      animacion_apertura: tipo,
      texto_apertura: texto || undefined,
    });
  }, [tipo, texto, onSave]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      {/* Header colapsable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span>Animación de Apertura</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Contenido expandible */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Select tipo animación */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Animación
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="none">Sin animación</option>
              {ANIMACIONES_DECORATIVAS.map((anim) => (
                <option key={anim.id} value={anim.id}>
                  {anim.label}
                </option>
              ))}
            </select>
          </div>

          {/* Preview Lottie */}
          {tipo !== 'none' && <LottiePreview tipo={tipo} />}

          {/* Input texto personalizable */}
          {tipo !== 'none' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Texto
              </label>
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Desliza para abrir"
                maxLength={100}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}

          {/* Botón guardar */}
          <button
            onClick={handleGuardar}
            disabled={saving || !hasChanges}
            className={cn(
              'w-full py-2 px-4 text-sm font-medium rounded-lg transition-colors',
              hasChanges && !saving
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            )}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(AperturaSettingsSection);
