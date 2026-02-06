/**
 * ====================================================================
 * VIDEO PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza un video embebido (YouTube, Vimeo, etc.)
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { Play } from 'lucide-react';

function VideoPublico({ bloque, tema, isVisible, className = '' }) {
  const { contenido = {}, estilos = {} } = bloque;

  // Editor guarda titulo_seccion/subtitulo_seccion, antes se usaba titulo/subtitulo
  const titulo = contenido.titulo_seccion || contenido.titulo;
  const subtitulo = contenido.subtitulo_seccion || contenido.subtitulo;
  const videoUrl = contenido.video_url;

  const aspectRatio = estilos.aspect_ratio || '16:9';
  // Fallback: opciones de reproducción pueden venir en contenido o estilos
  const autoplay = estilos.autoplay || contenido.autoplay || false;
  const muted = (estilos.muted ?? contenido.muted) !== false;
  const loop = estilos.loop || contenido.loop || false;

  const animationClass = isVisible ? 'animate-fadeInUp' : 'opacity-0';

  if (!videoUrl) return null;

  // Convertir URL a embed URL
  const getEmbedUrl = (url) => {
    // YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (youtubeMatch) {
      const params = new URLSearchParams({
        autoplay: autoplay ? '1' : '0',
        mute: muted ? '1' : '0',
        loop: loop ? '1' : '0',
      });
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?${params.toString()}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      const params = new URLSearchParams({
        autoplay: autoplay ? '1' : '0',
        muted: muted ? '1' : '0',
        loop: loop ? '1' : '0',
      });
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?${params.toString()}`;
    }

    // Si ya es una URL de embed o directa, retornarla
    return url;
  };

  // Calcular padding para aspect ratio
  const getAspectRatioPadding = () => {
    switch (aspectRatio) {
      case '16:9':
        return 'pb-[56.25%]';
      case '4:3':
        return 'pb-[75%]';
      case '1:1':
        return 'pb-[100%]';
      case '9:16':
        return 'pb-[177.78%]';
      default:
        return 'pb-[56.25%]';
    }
  };

  const embedUrl = getEmbedUrl(videoUrl);
  const isDirectVideo = videoUrl.match(/\.(mp4|webm|ogg)$/i);

  return (
    <section className={`py-20 ${className}`} style={{ backgroundColor: tema?.color_fondo || '#FFFFFF' }}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        {(titulo || subtitulo) && (
          <div className={`text-center mb-12 ${animationClass}`}>
            {titulo && (
              <h2
                className="text-4xl sm:text-5xl font-bold mb-4"
                style={{ color: tema?.color_texto, fontFamily: tema?.fuente_titulo }}
              >
                {titulo}
              </h2>
            )}
            {subtitulo && (
              <p className="text-lg" style={{ color: tema?.color_texto_claro }}>
                {subtitulo}
              </p>
            )}
          </div>
        )}

        {/* Video container */}
        <div
          className={`relative rounded-2xl overflow-hidden shadow-2xl ${animationClass}`}
          style={{ boxShadow: `0 20px 60px ${tema?.color_primario}20` }}
        >
          <div className={`relative ${getAspectRatioPadding()}`}>
            {isDirectVideo ? (
              <video
                src={videoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay={autoplay}
                muted={muted}
                loop={loop}
                controls
                playsInline
              />
            ) : (
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={titulo || 'Video'}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(VideoPublico);
