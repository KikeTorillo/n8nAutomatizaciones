/**
 * ====================================================================
 * INVITACION PREVIEW CARD
 * ====================================================================
 * Card con mini-preview real de InvitacionDinamica para las galerías
 * de plantillas (sidebar y modal). Usa IntersectionObserver para
 * lazy-rendering y evitar montar todas las previews a la vez.
 *
 * @version 1.0.0
 * @since 2026-02-07
 */

import { memo, useRef, useState, useEffect } from 'react';
import { Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InvitacionDinamica } from '@/components/eventos-digitales';
import { usePlantillaPreview } from '@/hooks/otros/eventos-digitales';
import { useGoogleFonts } from '@/hooks/utils';

function InvitacionPreviewCard({ template, isSelected, onClick }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const { tema, evento, bloques } = usePlantillaPreview(template);

  useGoogleFonts([tema.fuente_titulo, tema.fuente_cuerpo]);

  // Lazy: solo renderizar InvitacionDinamica cuando la card esté cerca del viewport
  useEffect(() => {
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
  }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        'text-left w-full rounded-xl overflow-hidden border-2 transition-all',
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
      )}
    >
      {/* Preview area */}
      <div className="aspect-[3/4] relative overflow-hidden bg-gray-100 dark:bg-gray-800">
        {isVisible ? (
          <div
            className="pointer-events-none select-none origin-top-left"
            style={{ transform: 'scale(0.24)', width: '416%', height: '416%' }}
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

        {/* Badges */}
        {template.es_destacado && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-medium rounded-full flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-current" /> Destacado
          </div>
        )}
        {isSelected && !template.es_destacado && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center">
            <Check className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
          {template.nombre}
        </p>
      </div>
    </button>
  );
}

export default memo(InvitacionPreviewCard);
