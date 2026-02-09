/**
 * Mini-preview de la invitación para la card de evento.
 * Renderiza InvitacionDinamica escalada con lazy loading (IntersectionObserver).
 * Si hay portada_url usa imagen, si no hay bloques muestra fallback gradiente.
 */

import { memo, useRef, useState, useEffect, useMemo } from 'react';
import { PartyPopper } from 'lucide-react';
import { InvitacionDinamica } from '@/pages/eventos-digitales/components';
import { useGoogleFonts } from '@/hooks/utils';
import { INVITACION_TEMA_DEFAULT } from '../constants';

const MAX_BLOQUES_PREVIEW = 3;

function EventoInvitacionPreview({ evento }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const bloques = useMemo(() => {
    const raw = evento.bloques_invitacion;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw
      .filter((b) => b.visible !== false)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .slice(0, MAX_BLOQUES_PREVIEW);
  }, [evento.bloques_invitacion]);

  const tema = useMemo(
    () => ({ ...INVITACION_TEMA_DEFAULT, ...(evento.plantilla?.tema || {}) }),
    [evento.plantilla]
  );

  const hasBloques = bloques && bloques.length > 0;

  useGoogleFonts(
    hasBloques ? [tema.fuente_titulo, tema.fuente_cuerpo] : [],
    { enabled: hasBloques && isVisible }
  );

  useEffect(() => {
    if (!hasBloques) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasBloques]);

  // Caso 1: portada_url → imagen
  if (evento.portada_url) {
    return (
      <div className="h-40 bg-gradient-to-br from-pink-100 to-secondary-100 dark:from-pink-900/30 dark:to-secondary-900/30 overflow-hidden">
        <img
          src={evento.portada_url}
          alt={evento.nombre}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Caso 2: bloques → mini-preview de InvitacionDinamica
  if (hasBloques) {
    return (
      <div
        ref={ref}
        className="h-40 relative overflow-hidden bg-gray-100 dark:bg-gray-800"
      >
        {isVisible ? (
          <div
            className="pointer-events-none select-none origin-top-left"
            style={{ transform: 'scale(0.4)', width: '250%', height: '250%' }}
          >
            <InvitacionDinamica
              evento={evento}
              invitado={null}
              bloques={bloques}
              tema={tema}
              onConfirmRSVP={() => {}}
              isLoadingRSVP={false}
              isPreview
            />
          </div>
        ) : (
          <div
            className="w-full h-full animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${tema.color_primario}22, ${tema.color_secundario}44)`,
            }}
          />
        )}
      </div>
    );
  }

  // Caso 3: fallback gradiente + ícono
  return (
    <div className="h-40 bg-gradient-to-br from-pink-100 to-secondary-100 dark:from-pink-900/30 dark:to-secondary-900/30 flex items-center justify-center">
      <PartyPopper className="w-16 h-16 text-pink-300 dark:text-pink-500" />
    </div>
  );
}

export default memo(EventoInvitacionPreview);
