/**
 * ====================================================================
 * APERTURA CANVAS BLOCK
 * ====================================================================
 * Preview compacto del bloque de apertura en el canvas del editor.
 * Muestra fondo (color tema o imagen), animación Lottie, texto,
 * y preview del modo cortina con línea de corte.
 *
 * @version 2.0.0
 * @since 2026-02-05
 */

import { memo, Suspense, lazy } from 'react';
import { ChevronDown, MoveHorizontal, MoveVertical, ImagePlus } from 'lucide-react';
import { useLottieAnimation } from '../../hooks/useLottieAnimation';

const Lottie = lazy(() => import('lottie-react'));

/**
 * AperturaCanvasBlock - Preview en el canvas del editor
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 */
function AperturaCanvasBlock({ bloque, tema }) {
  const contenido = bloque.contenido || {};
  const modo = contenido.modo || 'animacion';
  const animacion = contenido.animacion || 'sobre';
  const imagenUrl = contenido.imagen_url || '';
  const imagenMarco = contenido.imagen_marco || '';
  const direccionApertura = contenido.direccion_apertura || 'vertical';
  const texto = contenido.texto || 'Desliza para abrir';

  const esImagen = modo === 'imagen' && imagenUrl;
  const esCortina = modo === 'cortina';
  const colorFondo = tema?.color_primario || '#ec4899';

  const { animationData } = useLottieAnimation(
    animacion && animacion !== 'none' ? animacion : null
  );

  // Modo cortina
  if (esCortina) {
    const esVertical = direccionApertura === 'vertical';

    if (!imagenMarco) {
      return (
        <section className="relative w-full min-h-[250px] flex flex-col items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800">
          <ImagePlus className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecciona una imagen de marco
          </p>
        </section>
      );
    }

    return (
      <section className="relative w-full min-h-[250px] flex flex-col items-center justify-center overflow-hidden">
        {/* Imagen de fondo completa */}
        <img
          src={imagenMarco}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Línea punteada de corte */}
        <div
          className="absolute z-10"
          style={{
            ...(esVertical
              ? { top: 0, bottom: 0, left: '50%', width: 0, borderLeft: '2px dashed rgba(255,255,255,0.7)' }
              : { left: 0, right: 0, top: '50%', height: 0, borderTop: '2px dashed rgba(255,255,255,0.7)' }),
          }}
        />

        {/* Label del modo */}
        <div className="relative z-10 bg-black/50 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
          Cortina
          {esVertical
            ? <MoveHorizontal className="w-3 h-3" />
            : <MoveVertical className="w-3 h-3" />}
        </div>

        {/* Texto + chevron */}
        <div className="absolute bottom-8 flex flex-col items-center gap-1 pointer-events-none z-10">
          <p
            className="text-xs font-medium tracking-wide uppercase"
            style={{
              color: '#ffffff',
              fontFamily: tema?.fuente_cuerpo || 'Inter',
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
          >
            {texto}
          </p>
          <ChevronDown
            className="w-4 h-4 animate-bounce"
            style={{
              color: '#ffffff',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
            }}
          />
        </div>
      </section>
    );
  }

  // Modos animación e imagen (sin cambios)
  return (
    <section
      className="relative w-full min-h-[250px] flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: esImagen ? '#000' : colorFondo,
      }}
    >
      {/* Modo imagen: fondo + gradient overlay */}
      {esImagen && (
        <>
          <img
            src={imagenUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.3) 100%)',
            }}
          />
        </>
      )}

      {/* Animación Lottie */}
      {animationData && (
        <div
          className={`pointer-events-none relative z-10 ${
            esImagen ? 'w-24 h-24' : 'w-40 h-40'
          }`}
        >
          <Suspense fallback={<div className="w-full h-full" />}>
            <Lottie
              animationData={animationData}
              loop
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
          </Suspense>
        </div>
      )}

      {/* Texto + chevron */}
      <div className="absolute bottom-8 flex flex-col items-center gap-1 pointer-events-none z-10">
        <p
          className="text-xs font-medium tracking-wide uppercase"
          style={{
            color: '#ffffff',
            fontFamily: tema?.fuente_cuerpo || 'Inter',
            ...(esImagen && { textShadow: '0 1px 4px rgba(0,0,0,0.5)' }),
          }}
        >
          {texto}
        </p>
        <ChevronDown
          className="w-4 h-4 animate-bounce"
          style={{
            color: '#ffffff',
            ...(esImagen && { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }),
          }}
        />
      </div>
    </section>
  );
}

export default memo(AperturaCanvasBlock);
