/**
 * ====================================================================
 * OPENING OVERLAY - INVITACIONES DIGITALES
 * ====================================================================
 * Sección fullscreen (100vh) que se muestra al inicio de la invitación.
 * Soporta tres modos:
 *   - Animación: Fondo sólido del tema + animación Lottie centrada
 *   - Imagen: Imagen de fondo fullscreen + Lottie opcional superpuesto
 *   - Cortina: Imagen dividida en dos mitades que se abren con animación
 *
 * Modos animación/imagen: sección normal, scroll revela la invitación.
 * Modo cortina: overlay fijo sobre todo, se abre con tap/scroll.
 *
 * @version 4.0.0
 * @since 2026-02-05
 */

import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const Lottie = lazy(() => import('lottie-react'));

// Loaders para dynamic import de JSON (sin dependencia al editor)
const LOTTIE_LOADERS = {
  sobre: () => import('@/assets/lottie/sobre.json'),
  globos: () => import('@/assets/lottie/globos.json'),
  flores: () => import('@/assets/lottie/flores.json'),
};

/**
 * Hook interno para cargar animación Lottie por tipo
 */
function useLottieData(tipo) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!tipo || tipo === 'none' || !LOTTIE_LOADERS[tipo]) {
      setData(null);
      return;
    }

    let cancelled = false;
    LOTTIE_LOADERS[tipo]().then((mod) => {
      if (!cancelled) setData(mod.default || mod);
    });

    return () => { cancelled = true; };
  }, [tipo]);

  return data;
}

/**
 * CurtinaOverlay - Overlay fijo con imagen split que se abre con tap/scroll
 *
 * Técnica espejo: La mitad 1 muestra la imagen original y la mitad 2 la muestra
 * volteada (scaleX/-Y). Al juntarse crean simetría perfecta (parece una sola
 * imagen). Al abrirse, ningún elemento se corta porque cada lado tiene su
 * propia copia completa espejada.
 *
 * - Scroll: parallax reversible (scroll abajo abre, arriba cierra)
 * - Tap: smooth scroll a la portada (la cortina se abre vía scroll, reversible)
 */
function CurtinaOverlay({ imagenMarco, direccionApertura = 'vertical', texto, tema }) {
  const [progress, setProgress] = useState(0); // 0=cerrado, 1=abierto

  // Tap → smooth scroll a la portada (la cortina se abre via el scroll handler)
  const handleTap = useCallback(() => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  }, []);

  // Scroll-linked: mapea scrollY 0→innerHeight a progress 0→1 (siempre reversible)
  useEffect(() => {
    function onScroll() {
      const p = Math.min(1, window.scrollY / window.innerHeight);
      setProgress(p);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const esVertical = direccionApertura === 'vertical';
  const colorTexto = '#ffffff';

  const overlayPointerEvents = progress > 0.5 ? 'none' : 'auto';

  // clip-path para cada mitad + transform para deslizar
  const half1Style = esVertical
    ? { clipPath: 'inset(0 50% 0 0)', transform: `translateX(${-50 * progress}%)` }
    : { clipPath: 'inset(0 0 50% 0)', transform: `translateY(${-50 * progress}%)` };

  const half2Style = esVertical
    ? { clipPath: 'inset(0 0 0 50%)', transform: `translateX(${50 * progress}%)` }
    : { clipPath: 'inset(50% 0 0 0)', transform: `translateY(${50 * progress}%)` };

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      style={{ pointerEvents: overlayPointerEvents, cursor: overlayPointerEvents === 'auto' ? 'pointer' : undefined }}
      onClick={handleTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTap(); }}
      aria-label="Toca para abrir la invitación"
    >
      {/* Mitad 1 — izquierda (vertical) o arriba (horizontal) */}
      <div
        className="absolute inset-0"
        style={half1Style}
      >
        <img
          src={imagenMarco}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Mitad 2 — derecha (vertical) o abajo (horizontal), imagen espejada */}
      <div
        className="absolute inset-0"
        style={half2Style}
      >
        <img
          src={imagenMarco}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: esVertical ? 'scaleX(-1)' : 'scaleY(-1)' }}
        />
      </div>

      {/* Texto + chevron */}
      <div
        className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-2 z-10"
        style={{
          opacity: 1 - progress,
          pointerEvents: 'none',
        }}
      >
        <p
          className="text-base font-medium tracking-wide uppercase"
          style={{
            color: colorTexto,
            fontFamily: tema?.fuente_cuerpo || 'Inter',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}
        >
          {texto || 'Toca para abrir'}
        </p>
        <ChevronDown
          className="w-6 h-6 animate-bounce"
          style={{
            color: colorTexto,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
          }}
        />
      </div>
    </div>,
    document.body
  );
}

/**
 * CurtinaPreview - Versión inline de la cortina para preview del editor.
 * Misma técnica espejo que CurtinaOverlay pero sin portal ni window.scrollY.
 * Animación de apertura activada por click/tap.
 */
function CurtinaPreview({ imagenMarco, direccionApertura = 'vertical', texto, tema }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const esVertical = direccionApertura === 'vertical';
  const colorTexto = '#ffffff';

  // Transform dinámico — la transición se aplica vía clase CSS (siempre activa)
  const half1Transform = esVertical
    ? `translateX(${isOpen ? -50 : 0}%)`
    : `translateY(${isOpen ? -50 : 0}%)`;

  const half2Transform = esVertical
    ? `translateX(${isOpen ? 50 : 0}%)`
    : `translateY(${isOpen ? 50 : 0}%)`;

  const half1Clip = esVertical ? 'inset(0 50% 0 0)' : 'inset(0 0 50% 0)';
  const half2Clip = esVertical ? 'inset(0 0 0 50%)' : 'inset(50% 0 0 0)';

  return (
    <section
      className="relative w-full overflow-hidden cursor-pointer select-none"
      style={{ height: '100vh', minHeight: '100svh', backgroundColor: tema?.color_secundario || '#ffffff' }}
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle(); }}
      aria-label={isOpen ? 'Toca para cerrar la cortina' : 'Toca para abrir la cortina'}
    >
      {/* Mitad 1 — izquierda (vertical) o arriba (horizontal) */}
      <div
        className="absolute inset-0 z-10 transition-transform duration-700 ease-out"
        style={{ clipPath: half1Clip, transform: half1Transform }}
      >
        <img src={imagenMarco} alt="" className="absolute inset-0 w-full h-full object-cover" />
      </div>

      {/* Mitad 2 — derecha (vertical) o abajo (horizontal), imagen espejada */}
      <div
        className="absolute inset-0 z-10 transition-transform duration-700 ease-out"
        style={{ clipPath: half2Clip, transform: half2Transform }}
      >
        <img
          src={imagenMarco}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: esVertical ? 'scaleX(-1)' : 'scaleY(-1)' }}
        />
      </div>

      {/* Texto + chevron (desaparece al abrir) */}
      <div
        className={cn(
          'absolute bottom-16 left-0 right-0 flex flex-col items-center gap-2 z-20 pointer-events-none transition-opacity duration-500',
          isOpen ? 'opacity-0' : 'opacity-100'
        )}
      >
        <p
          className="text-base font-medium tracking-wide uppercase"
          style={{ color: colorTexto, fontFamily: tema?.fuente_cuerpo || 'Inter', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
        >
          {texto || 'Toca para abrir'}
        </p>
        <ChevronDown
          className="w-6 h-6 animate-bounce"
          style={{ color: colorTexto, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
        />
      </div>

      {/* Indicador "click para cerrar" cuando está abierta */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center z-0 pointer-events-none transition-opacity duration-500 delay-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
      >
        <p className="text-sm text-gray-400" style={{ fontFamily: tema?.fuente_cuerpo || 'Inter' }}>
          Toca para cerrar
        </p>
      </div>
    </section>
  );
}

/**
 * OpeningOverlay - Sección de apertura con animación, imagen o cortina
 *
 * @param {Object} props
 * @param {'animacion'|'imagen'|'cortina'} props.modo - Modo visual del overlay
 * @param {string} props.tipo - Tipo de animación ('sobre' | 'globos' | 'flores')
 * @param {string} props.imagenUrl - URL de imagen de fondo (modo imagen)
 * @param {string} props.imagenMarco - URL de imagen del marco (modo cortina)
 * @param {'vertical'|'horizontal'} props.direccionApertura - Dirección de la cortina
 * @param {string} props.texto - Texto a mostrar
 * @param {Object} props.tema - Tema de la invitación
 */
function OpeningOverlay({ modo = 'animacion', tipo, imagenUrl, imagenMarco, direccionApertura = 'vertical', texto = 'Desliza para abrir', tema = {}, isPreview = false }) {
  const animationData = useLottieData(tipo);
  const esImagen = modo === 'imagen' && imagenUrl;
  const esCortina = modo === 'cortina' && imagenMarco;

  const colorFondo = tema.color_primario || '#ec4899';
  const colorTexto = '#ffffff';

  // Modo cortina: en preview renderizar inline con click-to-open (sin portal ni window.scrollY)
  // porque el portal cubre toda la página del editor y window.scrollY no funciona en el contenedor
  if (esCortina) {
    if (isPreview) {
      return (
        <CurtinaPreview
          imagenMarco={imagenMarco}
          direccionApertura={direccionApertura}
          texto={texto}
          tema={tema}
        />
      );
    }

    return (
      <>
        <div style={{ height: '100vh', minHeight: '100svh', backgroundColor: tema.color_secundario || '#ffffff' }} />
        <CurtinaOverlay
          imagenMarco={imagenMarco}
          direccionApertura={direccionApertura}
          texto={texto}
          tema={tema}
        />
      </>
    );
  }

  return (
    <section
      className="relative w-full flex flex-col items-center justify-center select-none overflow-hidden"
      style={{
        backgroundColor: esImagen ? '#000' : colorFondo,
        height: '100vh',
        minHeight: '100svh',
      }}
    >
      {/* Modo imagen: fondo fullscreen + gradient overlay */}
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
          className={cn(
            'pointer-events-none relative z-10',
            esImagen
              ? 'w-40 h-40 sm:w-48 sm:h-48'
              : 'w-64 h-64 sm:w-80 sm:h-80'
          )}
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

      {/* Texto + icono chevron animado */}
      <div className="absolute bottom-16 flex flex-col items-center gap-2 pointer-events-none z-10">
        <p
          className="text-base font-medium tracking-wide uppercase"
          style={{
            color: colorTexto,
            fontFamily: tema.fuente_cuerpo || 'Inter',
            ...(esImagen && { textShadow: '0 1px 4px rgba(0,0,0,0.5)' }),
          }}
        >
          {texto}
        </p>
        <ChevronDown
          className="w-6 h-6 animate-bounce"
          style={{
            color: colorTexto,
            ...(esImagen && { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }),
          }}
        />
      </div>
    </section>
  );
}

export default OpeningOverlay;
