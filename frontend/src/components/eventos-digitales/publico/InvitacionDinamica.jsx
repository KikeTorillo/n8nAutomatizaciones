/**
 * ====================================================================
 * INVITACIÓN DINÁMICA - RENDERIZADO DE BLOQUES
 * ====================================================================
 * Renderiza los bloques personalizados del editor de invitaciones.
 * Si no hay bloques personalizados, devuelve null para usar layout legacy.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo, useMemo, useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { Heart, ChevronDown } from 'lucide-react';
import { BloqueRenderer, BLOQUES_PUBLICOS } from './bloques';
import { GaleriaCompartida } from '../galeria';

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
  configuracion,
  slug,
  token,
}) {
  const [visibleSections, setVisibleSections] = useState(new Set(['inicio']));
  const [activeSection, setActiveSection] = useState('inicio');
  const sectionRefs = useRef({});

  // Si no hay bloques o están vacíos, retornar null para usar layout legacy
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
        const sectionId = entry.target.getAttribute('data-bloque-id');
        if (entry.isIntersecting) {
          setActiveSection(sectionId);
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

  // Generar navegación basada en bloques
  const navItems = useMemo(() => {
    return bloquesVisibles
      .filter((b) => {
        // Solo ciertos tipos generan items de nav
        const tiposConNav = [
          'hero_invitacion',
          'countdown',
          'timeline',
          'ubicacion',
          'rsvp',
          'mesa_regalos',
          'galeria',
          'faq',
        ];
        return tiposConNav.includes(b.tipo);
      })
      .map((b) => ({
        id: b.id,
        label: b.contenido?.titulo || getDefaultLabel(b.tipo),
        tipo: b.tipo,
      }));
  }, [bloquesVisibles]);

  const scrollToSection = useCallback((id) => {
    if (sectionRefs.current[id]) {
      const navHeight = 60;
      const element = sectionRefs.current[id];
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: tema?.color_fondo,
        fontFamily: tema?.fuente_cuerpo,
      }}
    >
      {/* Renderizar bloques */}
      {bloquesVisibles.map((bloque, index) => (
        <div
          key={bloque.id}
          ref={(el) => (sectionRefs.current[bloque.id] = el)}
          data-bloque-id={bloque.id}
          data-bloque-tipo={bloque.tipo}
        >
          <Suspense
            fallback={
              <div className="py-20 flex items-center justify-center">
                <div
                  className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: tema?.color_secundario,
                    borderTopColor: tema?.color_primario,
                  }}
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
      ))}

      {/* Navegación sticky (si hay más de un bloque) */}
      {navItems.length > 1 && (
        <nav
          className="sticky top-0 z-50 backdrop-blur-md border-b transition-all"
          style={{
            backgroundColor: `${tema?.color_fondo}ee`,
            borderColor: tema?.color_secundario,
          }}
        >
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-center gap-2 sm:gap-8 overflow-x-auto py-4 scrollbar-hide">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="relative px-4 py-2 text-sm sm:text-base font-medium whitespace-nowrap transition-all duration-300"
                  style={{
                    color:
                      activeSection === item.id
                        ? tema?.color_primario
                        : tema?.color_texto_claro,
                  }}
                >
                  {item.label}
                  {activeSection === item.id && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full transition-all"
                      style={{ backgroundColor: tema?.color_primario }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Galería compartida (si está habilitada) */}
      {configuracion?.habilitar_galeria_compartida !== false && (
        <section
          className="py-20"
          style={{ backgroundColor: tema?.color_secundario + '20' }}
        >
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2
                className="text-4xl sm:text-5xl font-bold mb-4"
                style={{ color: tema?.color_texto, fontFamily: tema?.fuente_titulo }}
              >
                Fotos del Evento
              </h2>
              <p className="text-lg" style={{ color: tema?.color_texto_claro }}>
                {token
                  ? '¡Comparte tus mejores momentos!'
                  : 'Momentos capturados por los invitados'}
              </p>
            </div>

            <div
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8"
              style={{ boxShadow: `0 10px 40px ${tema?.color_primario}15` }}
            >
              <GaleriaCompartida
                slug={slug}
                token={token}
                isAdmin={false}
                permitirSubida={configuracion?.permitir_subida_invitados !== false}
              />
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        className="py-8 text-center border-t"
        style={{
          borderColor: tema?.color_secundario,
          backgroundColor: tema?.color_fondo,
        }}
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

/**
 * Obtener label por defecto para navegación según tipo de bloque
 */
function getDefaultLabel(tipo) {
  const labels = {
    hero_invitacion: 'Inicio',
    countdown: 'Cuenta Regresiva',
    timeline: 'Itinerario',
    ubicacion: 'Ubicación',
    rsvp: 'Confirmar',
    mesa_regalos: 'Regalos',
    galeria: 'Galería',
    video: 'Video',
    texto: 'Info',
    faq: 'FAQ',
    separador: '',
    agregar_calendario: 'Calendario',
  };
  return labels[tipo] || 'Sección';
}

export default memo(InvitacionDinamica);
