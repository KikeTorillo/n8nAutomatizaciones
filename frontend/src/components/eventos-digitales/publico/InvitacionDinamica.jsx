/**
 * ====================================================================
 * INVITACIÓN DINÁMICA - RENDERIZADO DE BLOQUES
 * ====================================================================
 * Renderiza los bloques personalizados del editor de invitaciones.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo, useMemo, useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { Heart } from 'lucide-react';
import { BloqueRenderer, BLOQUES_PUBLICOS } from './bloques';

/**
 * Obtener clases CSS de animación según tipo y estado de visibilidad
 */
function getAnimacionClasses(animacion, isVisible) {
  if (!animacion || animacion === 'none') return '';

  const base = 'transition-all duration-700 ease-out';

  if (isVisible) return `${base} opacity-100 translate-y-0 translate-x-0 scale-100 rotate-0`;

  const initial = {
    fade: 'opacity-0',
    bounce: 'opacity-0 translate-y-8',
    slide: 'opacity-0 -translate-x-8',
    zoom: 'opacity-0 scale-90',
    flip: 'opacity-0',
  };

  return `${base} ${initial[animacion] || 'opacity-0'}`;
}

/**
 * Obtener estilos inline para animaciones que CSS classes no cubren
 */
function getAnimacionStyle(animacion, isVisible) {
  if (animacion === 'flip' && !isVisible) {
    return { transform: 'perspective(800px) rotateX(15deg)', opacity: 0 };
  }
  if (animacion === 'flip' && isVisible) {
    return { transform: 'perspective(800px) rotateX(0deg)', opacity: 1 };
  }
  return {};
}

/**
 * InvitacionDinamica - Renderiza bloques del editor
 */
function InvitacionDinamica({
  evento,
  invitado,
  bloques,
  tema,
  onConfirmRSVP,
  isLoadingRSVP,
  qrImage,
  loadingQR,
}) {
  const [visibleSections, setVisibleSections] = useState(new Set(['inicio']));
  const sectionRefs = useRef({});

  // Seguridad: si no hay bloques, no renderizar nada
  if (!bloques || bloques.length === 0) {
    return null;
  }

  // Filtrar solo bloques visibles y ordenarlos
  const bloquesVisibles = useMemo(() => {
    return bloques
      .filter((b) => b.visible !== false)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }, [bloques]);

  // Intersection Observer para animaciones
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-bloque-id');
          setVisibleSections((prev) => new Set([...prev, sectionId]));
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observar todas las secciones
    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [bloquesVisibles]);

  // Scroll to content (desde hero)
  const scrollToContent = useCallback(() => {
    const primerBloqueNoHero = bloquesVisibles.find(
      (b) => b.tipo !== 'hero_invitacion'
    );
    if (primerBloqueNoHero && sectionRefs.current[primerBloqueNoHero.id]) {
      sectionRefs.current[primerBloqueNoHero.id].scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [bloquesVisibles]);

  // Memoizar estilos inline para evitar recrear objetos en cada render
  const containerStyle = useMemo(() => ({
    backgroundColor: tema?.color_fondo,
    fontFamily: tema?.fuente_cuerpo,
  }), [tema?.color_fondo, tema?.fuente_cuerpo]);

  const footerStyle = useMemo(() => ({
    borderColor: tema?.color_secundario,
    backgroundColor: tema?.color_fondo,
  }), [tema?.color_secundario, tema?.color_fondo]);

  const spinnerStyle = useMemo(() => ({
    borderColor: tema?.color_secundario,
    borderTopColor: tema?.color_primario,
  }), [tema?.color_secundario, tema?.color_primario]);

  return (
    <div
      className="min-h-screen"
      style={containerStyle}
    >
      {/* Renderizar bloques */}
      {bloquesVisibles.map((bloque, index) => {
        const animacion = tema?.animacion_entrada || 'none';
        const isVisible = visibleSections.has(bloque.id);
        return (
        <div
          key={bloque.id}
          ref={(el) => (sectionRefs.current[bloque.id] = el)}
          data-bloque-id={bloque.id}
          data-bloque-tipo={bloque.tipo}
          className={getAnimacionClasses(animacion, isVisible)}
          style={getAnimacionStyle(animacion, isVisible)}
        >
          <Suspense
            fallback={
              <div className="py-20 flex items-center justify-center">
                <div
                  className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={spinnerStyle}
                />
              </div>
            }
          >
            <BloqueRenderer
              bloque={bloque}
              evento={evento}
              invitado={invitado}
              tema={tema}
              ubicaciones={evento?.ubicaciones}
              isVisible={visibleSections.has(bloque.id)}
              onScrollToContent={index === 0 ? scrollToContent : undefined}
              onConfirmRSVP={onConfirmRSVP}
              isLoadingRSVP={isLoadingRSVP}
              qrImage={qrImage}
              loadingQR={loadingQR}
            />
          </Suspense>
        </div>
        );
      })}

      {/* Footer */}
      <footer
        className="py-8 text-center border-t"
        style={footerStyle}
      >
        <p
          className="text-sm flex items-center justify-center gap-1"
          style={{ color: tema?.color_texto_claro }}
        >
          Hecho con{' '}
          <Heart
            className="w-4 h-4 fill-current"
            style={{ color: tema?.color_primario }}
          />{' '}
          usando{' '}
          <span className="font-semibold" style={{ color: tema?.color_primario }}>
            Nexo
          </span>
        </p>
      </footer>
    </div>
  );
}

export default memo(InvitacionDinamica);
