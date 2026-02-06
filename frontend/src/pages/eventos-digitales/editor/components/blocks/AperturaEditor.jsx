/**
 * ====================================================================
 * APERTURA EDITOR (INVITACIONES)
 * ====================================================================
 * Editor del bloque de apertura. Soporta modo animación (Lottie),
 * modo imagen (Unsplash) y modo cortina (split image).
 *
 * @version 2.0.0
 * @since 2026-02-05
 */

import { memo, useMemo, useState, Suspense, lazy } from 'react';
import { ImagePlus, X, MoveHorizontal, MoveVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select } from '@/components/ui';
import { BaseAutoSaveEditor } from '@/components/editor-framework';
import { UnsplashModal } from '@/components/shared/media/UnsplashPicker';
import { useInvitacionBlockEditor } from '../../hooks';
import { BLOCK_DEFAULTS } from '../../config';
import { ANIMACIONES_DECORATIVAS } from '../../config/animacionesDecorativas';
import { MARCOS_PRESETS } from '../../config/marcosPresets';
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

const inputClasses = 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const MODOS = [
  { value: 'animacion', label: 'Animación' },
  { value: 'imagen', label: 'Imagen' },
  { value: 'cortina', label: 'Cortina' },
];

/**
 * AperturaEditor - Editor del bloque de apertura
 */
function AperturaEditor({ contenido, estilos, onChange, tema }) {
  const [unsplashOpen, setUnsplashOpen] = useState(false);
  const [unsplashTarget, setUnsplashTarget] = useState('imagen_url');

  const defaultValues = useMemo(
    () => ({ ...BLOCK_DEFAULTS.apertura }),
    []
  );

  const { form, handleFieldChange } = useInvitacionBlockEditor(
    contenido,
    estilos,
    defaultValues,
    onChange
  );

  const modo = form.modo || 'animacion';
  const animacion = form.animacion || 'sobre';
  const imagenUrl = form.imagen_url || '';
  const imagenMarco = form.imagen_marco || '';
  const direccionApertura = form.direccion_apertura || 'vertical';

  const tieneContenido =
    (modo === 'animacion' && animacion !== 'none') ||
    (modo === 'imagen' && imagenUrl) ||
    (modo === 'cortina' && imagenMarco);

  // Opciones de animación
  const animacionOptions = [
    { value: 'none', label: 'Sin animación' },
    ...ANIMACIONES_DECORATIVAS.map((anim) => ({
      value: anim.id,
      label: anim.label,
    })),
  ];

  const openUnsplash = (target) => {
    setUnsplashTarget(target);
    setUnsplashOpen(true);
  };

  return (
    <BaseAutoSaveEditor>
      {/* Toggle modo */}
      <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
        {MODOS.map((m) => (
          <button
            key={m.value}
            onClick={() => handleFieldChange('modo', m.value)}
            className={cn(
              'flex-1 py-2 text-xs font-medium transition-colors',
              modo === m.value
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* === MODO ANIMACIÓN === */}
      {modo === 'animacion' && (
        <>
          <Select
            label="Animación"
            value={animacion}
            onChange={(e) => handleFieldChange('animacion', e.target.value)}
            options={animacionOptions}
            className="dark:bg-gray-700 dark:border-gray-600"
          />

          {animacion !== 'none' && <LottiePreview tipo={animacion} />}
        </>
      )}

      {/* === MODO IMAGEN === */}
      {modo === 'imagen' && (
        <>
          {/* Preview de imagen seleccionada */}
          {imagenUrl && (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={imagenUrl}
                alt="Apertura"
                className="w-full h-32 object-cover"
              />
              <button
                onClick={() => handleFieldChange('imagen_url', '')}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Botón Unsplash */}
          <button
            onClick={() => openUnsplash('imagen_url')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            {imagenUrl ? 'Cambiar imagen' : 'Buscar en Unsplash'}
          </button>

          {/* Input URL manual */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              URL de imagen
            </label>
            <input
              type="text"
              value={imagenUrl}
              onChange={(e) => handleFieldChange('imagen_url', e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className={inputClasses}
            />
          </div>

          {/* Animación superpuesta opcional */}
          <Select
            label="Animación sobre la imagen"
            value={animacion}
            onChange={(e) => handleFieldChange('animacion', e.target.value)}
            options={animacionOptions}
            className="dark:bg-gray-700 dark:border-gray-600"
          />
        </>
      )}

      {/* === MODO CORTINA === */}
      {modo === 'cortina' && (
        <>
          {/* Galería de presets */}
          {MARCOS_PRESETS.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Marcos prediseñados
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MARCOS_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleFieldChange('imagen_marco', preset.url)}
                    className={cn(
                      'relative rounded-lg overflow-hidden border-2 transition-colors group',
                      imagenMarco === preset.url
                        ? 'border-primary-500'
                        : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'
                    )}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-20 object-cover"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] py-0.5 text-center">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview imagen seleccionada */}
          {imagenMarco && (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={imagenMarco}
                alt="Marco cortina"
                className="w-full h-32 object-cover"
              />
              <button
                onClick={() => handleFieldChange('imagen_marco', '')}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Botón Unsplash */}
          <button
            onClick={() => openUnsplash('imagen_marco')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            {imagenMarco ? 'Cambiar marco' : 'Buscar en Unsplash'}
          </button>

          {/* Input URL manual */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              URL de imagen
            </label>
            <input
              type="text"
              value={imagenMarco}
              onChange={(e) => handleFieldChange('imagen_marco', e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className={inputClasses}
            />
          </div>

          {/* Toggle dirección */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Dirección de apertura
            </label>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => handleFieldChange('direccion_apertura', 'vertical')}
                className={cn(
                  'flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors',
                  direccionApertura === 'vertical'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                )}
              >
                <MoveHorizontal className="w-3.5 h-3.5" />
                Izq / Der
              </button>
              <button
                onClick={() => handleFieldChange('direccion_apertura', 'horizontal')}
                className={cn(
                  'flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors',
                  direccionApertura === 'horizontal'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                )}
              >
                <MoveVertical className="w-3.5 h-3.5" />
                Arriba / Abajo
              </button>
            </div>
          </div>
        </>
      )}

      {/* Texto personalizable */}
      {tieneContenido && (
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Texto
          </label>
          <input
            type="text"
            value={form.texto || ''}
            onChange={(e) => handleFieldChange('texto', e.target.value)}
            placeholder="Desliza para abrir"
            maxLength={100}
            className={inputClasses}
          />
        </div>
      )}

      {/* Unsplash Modal */}
      <UnsplashModal
        isOpen={unsplashOpen}
        onClose={() => setUnsplashOpen(false)}
        onSelect={(url) => handleFieldChange(unsplashTarget, url)}
        industria="eventos"
      />
    </BaseAutoSaveEditor>
  );
}

export default memo(AperturaEditor);
