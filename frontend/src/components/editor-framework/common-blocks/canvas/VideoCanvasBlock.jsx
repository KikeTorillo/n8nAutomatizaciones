/**
 * ====================================================================
 * VIDEO CANVAS BLOCK (Compartido)
 * ====================================================================
 * Renderer de video compartido entre Website e Invitaciones.
 * Cada módulo pasa sus props específicas.
 */

import { memo, useMemo } from 'react';
import { Play, Video } from 'lucide-react';
import { InlineText } from '../../inline';
import { buildEmbedUrl, isDirectVideo } from '../../utils/videoEmbedUtils';
import { getThemeColors } from '../../utils/themeColors';

/**
 * VideoCanvasBlock compartido
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema del editor
 * @param {boolean} [props.isEditing] - Modo edición inline (website)
 * @param {Function} [props.onContentChange] - Callback cambio contenido
 * @param {'website'|'invitacion'} [props.fallbackContext='website'] - Contexto para fallbacks
 * @param {Object} [props.fieldMapping] - Mapeo de campos {url, tipo}
 * @param {boolean} [props.showSubtitle] - Mostrar subtítulo
 * @param {boolean} [props.muteOnAutoplay] - Silenciar en autoplay
 */
function VideoCanvasBlock({
  bloque,
  tema,
  isEditing,
  onContentChange,
  fallbackContext = 'website',
  fieldMapping = { url: 'url', tipo: 'tipo' },
  showSubtitle = false,
  muteOnAutoplay = false,
}) {
  const colors = getThemeColors(tema, fallbackContext);
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  const titulo_seccion = contenido.titulo_seccion;
  const subtitulo_seccion = showSubtitle ? contenido.subtitulo_seccion : null;
  const videoUrl = contenido[fieldMapping.url] || '';
  const videoTipo = contenido[fieldMapping.tipo] || estilos[fieldMapping.tipo] || 'youtube';
  const autoplay = estilos.autoplay ?? contenido.autoplay ?? false;
  const mostrar_controles = estilos.mostrar_controles ?? contenido.mostrar_controles ?? true;

  const embedUrl = useMemo(
    () => buildEmbedUrl({ url: videoUrl, tipo: videoTipo, autoplay, mostrar_controles }),
    [videoUrl, videoTipo, autoplay, mostrar_controles]
  );

  const directVideo = isDirectVideo(videoUrl, videoTipo);

  // Estilos de sección según contexto
  const sectionStyle = fallbackContext === 'invitacion'
    ? { backgroundColor: colors.fondo }
    : undefined;
  const sectionClass = fallbackContext === 'invitacion'
    ? 'py-20 px-6'
    : 'py-16 px-6 bg-white dark:bg-gray-800';

  return (
    <section className={sectionClass} style={sectionStyle}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {(titulo_seccion || subtitulo_seccion) && (
          <div className="text-center mb-8">
            {titulo_seccion && (
              isEditing ? (
                <InlineText
                  value={titulo_seccion}
                  onChange={(value) => onContentChange?.({ titulo_seccion: value })}
                  placeholder="Título de sección"
                  className="text-3xl md:text-4xl font-bold block"
                  style={
                    fallbackContext === 'invitacion'
                      ? { color: colors.primario, fontFamily: 'var(--fuente-titulos)' }
                      : undefined
                  }
                  as="h2"
                />
              ) : (
                <h2
                  className={`text-3xl md:text-4xl font-bold ${fallbackContext === 'invitacion' ? 'mb-4' : 'text-gray-900 dark:text-white'}`}
                  style={
                    fallbackContext === 'invitacion'
                      ? { color: colors.primario, fontFamily: 'var(--fuente-titulos)' }
                      : { fontFamily: 'var(--fuente-titulos)' }
                  }
                >
                  {titulo_seccion}
                </h2>
              )
            )}
            {subtitulo_seccion && (
              <p className="max-w-2xl mx-auto" style={{ color: colors.textoClaro }}>
                {subtitulo_seccion}
              </p>
            )}
          </div>
        )}

        {/* Video */}
        {embedUrl ? (
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            {directVideo ? (
              <video
                src={embedUrl}
                controls={mostrar_controles}
                autoPlay={autoplay}
                muted={muteOnAutoplay ? autoplay : undefined}
                className={`w-full h-full ${fallbackContext === 'invitacion' ? 'object-cover' : 'object-contain'}`}
              >
                Tu navegador no soporta videos.
              </video>
            ) : (
              <iframe
                src={embedUrl}
                title={titulo_seccion || 'Video'}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        ) : (
          /* Placeholder */
          fallbackContext === 'invitacion' ? (
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay video configurado</p>
              </div>
            </div>
          ) : (
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-900 shadow-xl">
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <div
                  className="p-4 rounded-full mb-4"
                  style={{ backgroundColor: `${colors.primario}20` }}
                >
                  <Play className="w-12 h-12" style={{ color: colors.primario }} />
                </div>
                <p className="text-sm">
                  {isEditing
                    ? 'Configura la URL del video en el panel de propiedades'
                    : 'Video no disponible'}
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

export default memo(VideoCanvasBlock);
