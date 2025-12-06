import { Play } from 'lucide-react';
import { useState } from 'react';

/**
 * VideoPublico - Renderiza bloque de video en sitio público
 */
export default function VideoPublico({ contenido }) {
  const {
    titulo = '',
    subtitulo = '',
    videoUrl = '',
    thumbnailUrl = '',
    autoplay = false,
    tipo = 'youtube', // youtube, vimeo, directo
  } = contenido;

  const [playing, setPlaying] = useState(autoplay);

  // Extraer ID de YouTube
  const getYoutubeId = (url) => {
    const match = url?.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
    return match?.[1];
  };

  // Extraer ID de Vimeo
  const getVimeoId = (url) => {
    const match = url?.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match?.[1];
  };

  const renderVideo = () => {
    if (tipo === 'youtube') {
      const youtubeId = getYoutubeId(videoUrl);
      if (!youtubeId) return null;

      return (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}${autoplay ? '?autoplay=1' : ''}`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (tipo === 'vimeo') {
      const vimeoId = getVimeoId(videoUrl);
      if (!vimeoId) return null;

      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}${autoplay ? '?autoplay=1' : ''}`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // Video directo
    return (
      <video
        src={videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        controls
        autoPlay={autoplay}
      />
    );
  };

  return (
    <section className="py-16 sm:py-24 bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        {(titulo || subtitulo) && (
          <div className="text-center mb-8">
            {subtitulo && (
              <span className="text-sm font-medium uppercase tracking-wider mb-2 block text-gray-400">
                {subtitulo}
              </span>
            )}
            {titulo && (
              <h2
                className="text-3xl sm:text-4xl font-bold text-white"
                style={{ fontFamily: 'var(--font-titulos)' }}
              >
                {titulo}
              </h2>
            )}
          </div>
        )}

        {/* Video container */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
          {!playing && thumbnailUrl ? (
            <div
              className="absolute inset-0 cursor-pointer group"
              onClick={() => setPlaying(true)}
            >
              <img
                src={thumbnailUrl}
                alt={titulo || 'Video thumbnail'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: 'var(--color-primario)' }}
                >
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
              </div>
            </div>
          ) : (
            renderVideo()
          )}
        </div>
      </div>
    </section>
  );
}
