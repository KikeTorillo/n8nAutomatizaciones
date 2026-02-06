/**
 * ====================================================================
 * VIDEO CANVAS BLOCK
 * ====================================================================
 * Bloque de video embebido para el canvas WYSIWYG.
 */

import { memo, useMemo } from 'react';
import { Play } from 'lucide-react';
import { InlineText } from '../InlineEditor';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

/**
 * Video Canvas Block
 */
function VideoCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const WEB = THEME_FALLBACK_COLORS.website;
  const contenido = bloque.contenido || {};
  const {
    titulo_seccion = '',
    tipo = 'youtube', // 'youtube' | 'vimeo' | 'mp4'
    url = '',
    autoplay = false,
    mostrar_controles = true,
  } = contenido;

  /**
   * Get embed URL based on video type
   */
  const embedUrl = useMemo(() => {
    if (!url) return null;

    try {
      // YouTube
      if (tipo === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';

        if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1]?.split('?')[0];
        } else if (url.includes('watch?v=')) {
          videoId = url.split('watch?v=')[1]?.split('&')[0];
        } else if (url.includes('/embed/')) {
          videoId = url.split('/embed/')[1]?.split('?')[0];
        }

        if (videoId) {
          const params = new URLSearchParams();
          if (autoplay) params.set('autoplay', '1');
          if (!mostrar_controles) params.set('controls', '0');
          return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
        }
      }

      // Vimeo
      if (tipo === 'vimeo' || url.includes('vimeo.com')) {
        const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
        if (videoId) {
          const params = new URLSearchParams();
          if (autoplay) params.set('autoplay', '1');
          return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
        }
      }

      // MP4 direct link
      if (tipo === 'mp4' || url.endsWith('.mp4')) {
        return url;
      }

      return url;
    } catch (e) {
      return null;
    }
  }, [url, tipo, autoplay, mostrar_controles]);

  const isDirectVideo = tipo === 'mp4' || url?.endsWith('.mp4');

  return (
    <section className="py-16 px-6 bg-white dark:bg-gray-800">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        {titulo_seccion && (
          <div className="text-center mb-8">
            {isEditing ? (
              <InlineText
                value={titulo_seccion}
                onChange={(value) => onContentChange({ titulo_seccion: value })}
                placeholder="Título de sección"
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white block"
                as="h2"
              />
            ) : (
              <h2
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
                style={{ fontFamily: 'var(--fuente-titulos)' }}
              >
                {titulo_seccion}
              </h2>
            )}
          </div>
        )}

        {/* Video Container */}
        <div className="aspect-video rounded-xl overflow-hidden bg-gray-900 shadow-xl">
          {embedUrl ? (
            isDirectVideo ? (
              // Direct video
              <video
                src={embedUrl}
                controls={mostrar_controles}
                autoPlay={autoplay}
                className="w-full h-full object-contain"
              >
                Tu navegador no soporta videos.
              </video>
            ) : (
              // Embedded iframe
              <iframe
                src={embedUrl}
                title={titulo_seccion || 'Video'}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          ) : (
            // Placeholder
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <div
                className="p-4 rounded-full mb-4"
                style={{
                  backgroundColor: `var(--color-primario, ${tema?.color_primario || WEB.primario})20`,
                }}
              >
                <Play
                  className="w-12 h-12"
                  style={{ color: `var(--color-primario, ${tema?.color_primario || WEB.primario})` }}
                />
              </div>
              <p className="text-sm">
                {isEditing
                  ? 'Configura la URL del video en el panel de propiedades'
                  : 'Video no disponible'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default memo(VideoCanvasBlock);
