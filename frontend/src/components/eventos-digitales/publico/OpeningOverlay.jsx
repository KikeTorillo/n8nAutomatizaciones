/**
 * ====================================================================
 * OPENING OVERLAY - INVITACIONES DIGITALES
 * ====================================================================
 * Overlay fullscreen que cubre la invitación al cargar.
 * Muestra animación Lottie + texto "Desliza para abrir".
 * El usuario desliza hacia arriba (o toca) para revelar la invitación.
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import { useState, useRef, useCallback, useEffect, Suspense, lazy } from 'react';
import { ChevronUp } from 'lucide-react';

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
    if (!tipo || !LOTTIE_LOADERS[tipo]) return;

    let cancelled = false;
    LOTTIE_LOADERS[tipo]().then((mod) => {
      if (!cancelled) setData(mod.default || mod);
    });

    return () => { cancelled = true; };
  }, [tipo]);

  return data;
}

/**
 * OpeningOverlay - Overlay de apertura con animación Lottie
 *
 * @param {Object} props
 * @param {string} props.tipo - Tipo de animación ('sobre' | 'globos' | 'flores')
 * @param {string} props.texto - Texto a mostrar (default: 'Desliza para abrir')
 * @param {Object} props.tema - Tema de la invitación (color_primario, color_fondo, etc.)
 * @param {Function} props.onOpen - Callback cuando se abre el overlay
 */
// Umbral mínimo de drag para activar apertura (px)
const SWIPE_THRESHOLD = 80;

function OpeningOverlay({ tipo, texto = 'Desliza para abrir', tema = {}, onOpen }) {
  const [opened, setOpened] = useState(false);
  const [sliding, setSliding] = useState(false);
  // Offset en tiempo real mientras el usuario arrastra (px negativos = hacia arriba)
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartRef = useRef(null);
  const isDraggingRef = useRef(false);

  const animationData = useLottieData(tipo);

  const colorFondo = tema.color_primario || '#ec4899';
  const colorTexto = '#ffffff';

  const triggerOpen = useCallback(() => {
    if (sliding) return;
    setDragOffset(0);
    setSliding(true);
  }, [sliding]);

  const handleTransitionEnd = useCallback(() => {
    if (sliding) {
      setOpened(true);
      onOpen?.();
    }
  }, [sliding, onOpen]);

  // ========== TOUCH (móvil) ==========

  const handleTouchStart = useCallback((e) => {
    dragStartRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (dragStartRef.current === null) return;
    const deltaY = dragStartRef.current - e.touches[0].clientY;
    // Solo permitir arrastrar hacia arriba
    if (deltaY > 0) setDragOffset(-deltaY);
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (dragStartRef.current === null) return;
    const deltaY = dragStartRef.current - e.changedTouches[0].clientY;
    if (deltaY > SWIPE_THRESHOLD) {
      triggerOpen();
    } else {
      setDragOffset(0);
    }
    dragStartRef.current = null;
  }, [triggerOpen]);

  // ========== MOUSE (desktop) ==========

  const handleMouseDown = useCallback((e) => {
    e.preventDefault(); // Prevenir drag nativo del browser
    dragStartRef.current = e.clientY;
    isDraggingRef.current = false;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (dragStartRef.current === null) return;
    e.preventDefault();
    const deltaY = dragStartRef.current - e.clientY;
    if (deltaY > 5) isDraggingRef.current = true;
    if (deltaY > 0) setDragOffset(-deltaY);
  }, []);

  const handleMouseUp = useCallback((e) => {
    if (dragStartRef.current === null) return;
    const deltaY = dragStartRef.current - e.clientY;
    if (deltaY > SWIPE_THRESHOLD) {
      triggerOpen();
    } else {
      setDragOffset(0);
    }
    dragStartRef.current = null;
  }, [triggerOpen]);

  // Click solo si NO hubo drag (fallback para quienes prefieran un click)
  const handleClick = useCallback(() => {
    if (isDraggingRef.current) return;
    triggerOpen();
  }, [triggerOpen]);

  // Prevenir scroll del body mientras el overlay está visible
  useEffect(() => {
    if (!opened) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [opened]);

  if (opened) return null;

  // Calcular transform: drag en tiempo real o slide-out final
  const translateY = sliding ? '-100vh' : `${dragOffset}px`;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none"
      style={{
        backgroundColor: colorFondo,
        transform: `translateY(${translateY})`,
        transition: sliding ? 'transform 600ms ease-out' : dragOffset !== 0 ? 'none' : 'transform 300ms ease-out',
        cursor: 'grab',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* Animación Lottie centrada */}
      <div className="w-64 h-64 sm:w-80 sm:h-80 pointer-events-none">
        {animationData && (
          <Suspense fallback={<div className="w-full h-full" />}>
            <Lottie
              animationData={animationData}
              loop
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
          </Suspense>
        )}
      </div>

      {/* Texto + icono chevron animado */}
      <div className="absolute bottom-16 flex flex-col items-center gap-2 pointer-events-none">
        <ChevronUp
          className="w-6 h-6 animate-bounce"
          style={{ color: colorTexto }}
        />
        <p
          className="text-base font-medium tracking-wide"
          style={{
            color: colorTexto,
            fontFamily: tema.fuente_cuerpo || 'Inter',
          }}
        >
          {texto}
        </p>
      </div>
    </div>
  );
}

export default OpeningOverlay;
