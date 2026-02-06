/**
 * ====================================================================
 * VIDEO CANVAS BLOCK
 * ====================================================================
 * Bloque de video para invitaciones digitales.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo, useMemo } from 'react';
import { Video, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

/**
 * Video Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 */
function VideoCanvasBlock({ bloque, tema }) {
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  // Usar || para fallbacks (strings vacíos necesitan ||, no default de desestructuración)
  const titulo_seccion = contenido.titulo_seccion;
  const subtitulo_seccion = contenido.subtitulo_seccion;
  const video_url = contenido.video_url;
  const video_tipo = contenido.video_tipo || 'youtube';

  // Fallback: estilos pueden venir en contenido o en estilos
  const autoplay = estilos.autoplay ?? contenido.autoplay ?? false;
  const mostrar_controles = estilos.mostrar_controles ?? contenido.mostrar_controles ?? true;

  const INV = THEME_FALLBACK_COLORS.invitacion;
  const colorPrimario = tema?.color_primario || INV.primario;
  const colorFondo = tema?.color_fondo || INV.fondo;
  const colorTextoClaro = tema?.color_texto_claro || INV.textoClaro;

  // Extraer ID de YouTube
  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/
    );
    return match ? match[1] : null;
  };

  // Extraer ID de Vimeo
  const getVimeoId = (url) => {
    if (!url) return null;
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  };

  // URL de embed
  const embedUrl = useMemo(() => {
    if (!video_url) return null;

    switch (video_tipo) {
      case 'youtube': {
        const id = getYouTubeId(video_url);
        if (!id) return null;
        const params = new URLSearchParams({
          autoplay: autoplay ? '1' : '0',
          controls: mostrar_controles ? '1' : '0',
          rel: '0',
        });
        return `https://www.youtube.com/embed/${id}?${params}`;
      }
      case 'vimeo': {
        const id = getVimeoId(video_url);
        if (!id) return null;
        const params = new URLSearchParams({
          autoplay: autoplay ? '1' : '0',
          controls: mostrar_controles ? '1' : '0',
        });
        return `https://player.vimeo.com/video/${id}?${params}`;
      }
      case 'mp4':
        return video_url;
      default:
        return null;
    }
  }, [video_url, video_tipo, autoplay, mostrar_controles]);

  return (
    <section className="py-20 px-6" style={{ backgroundColor: colorFondo }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {(titulo_seccion || subtitulo_seccion) && (
          <div className="text-center mb-8">
            {titulo_seccion && (
              <h2
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ color: colorPrimario, fontFamily: 'var(--fuente-titulos)' }}
              >
                {titulo_seccion}
              </h2>
            )}
            {subtitulo_seccion && (
              <p className="max-w-2xl mx-auto" style={{ color: colorTextoClaro }}>
                {subtitulo_seccion}
              </p>
            )}
          </div>
        )}

        {/* Video */}
        {embedUrl ? (
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            {video_tipo === 'mp4' ? (
              <video
                src={embedUrl}
                controls={mostrar_controles}
                autoPlay={autoplay}
                muted={autoplay}
                className="w-full h-full object-cover"
              />
            ) : (
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video"
              />
            )}
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay video configurado</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(VideoCanvasBlock);
