/**
 * ====================================================================
 * TEXTO PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza un bloque de texto/contenido libre.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';

function TextoPublico({ bloque, tema, isVisible, className = '' }) {
  const { contenido = {}, estilos = {} } = bloque;

  const titulo = contenido.titulo;
  const subtitulo = contenido.subtitulo;
  // Editor guarda 'contenido', antes se usaba 'texto'
  const texto = contenido.contenido || contenido.texto;
  const imagenUrl = contenido.imagen_url;

  // Fallback: los estilos pueden venir en contenido o en estilos
  const alineacion = estilos.alineacion || contenido.alineacion || 'center';
  const layout = estilos.layout || contenido.layout || 'texto_solo';
  const tamanoTitulo = estilos.tamano_titulo || contenido.tamano_fuente || 'grande';

  const animationClass = isVisible ? 'animate-fadeInUp' : 'opacity-0';

  // Clases de alineación
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // Tamaño de título
  const tituloSizes = {
    pequeno: 'text-2xl sm:text-3xl',
    mediano: 'text-3xl sm:text-4xl',
    grande: 'text-4xl sm:text-5xl',
  };

  // Si no hay contenido, no renderizar
  if (!titulo && !texto && !imagenUrl) return null;

  return (
    <section className={`py-20 ${className}`}>
      <div className="max-w-4xl mx-auto px-4">
        {layout === 'imagen_izquierda' || layout === 'imagen_derecha' ? (
          <div
            className={`flex flex-col md:flex-row gap-8 items-center ${
              layout === 'imagen_derecha' ? 'md:flex-row-reverse' : ''
            } ${animationClass}`}
          >
            {/* Imagen */}
            {imagenUrl && (
              <div className="flex-1">
                <img
                  src={imagenUrl}
                  alt={titulo || 'Imagen'}
                  className="w-full rounded-2xl shadow-lg"
                  style={{ boxShadow: `0 10px 40px ${tema?.color_primario}15` }}
                />
              </div>
            )}

            {/* Contenido */}
            <div className={`flex-1 ${alignClasses[alineacion]}`}>
              {titulo && (
                <h2
                  className={`${tituloSizes[tamanoTitulo]} font-bold mb-4`}
                  style={{ color: tema?.color_texto, fontFamily: tema?.fuente_titulo }}
                >
                  {titulo}
                </h2>
              )}
              {subtitulo && (
                <p
                  className="text-lg mb-4 font-medium"
                  style={{ color: tema?.color_primario }}
                >
                  {subtitulo}
                </p>
              )}
              {texto && (
                <div
                  className="prose prose-lg"
                  style={{ color: tema?.color_texto_claro }}
                  dangerouslySetInnerHTML={{ __html: texto.replace(/\n/g, '<br />') }}
                />
              )}
            </div>
          </div>
        ) : layout === 'imagen_fondo' && imagenUrl ? (
          <div
            className={`relative rounded-3xl overflow-hidden min-h-[400px] flex items-center justify-center ${animationClass}`}
          >
            {/* Background image */}
            <img
              src={imagenUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />

            {/* Content */}
            <div className={`relative z-10 p-8 max-w-2xl ${alignClasses[alineacion]}`}>
              {titulo && (
                <h2
                  className={`${tituloSizes[tamanoTitulo]} font-bold mb-4 text-white`}
                  style={{ fontFamily: tema?.fuente_titulo }}
                >
                  {titulo}
                </h2>
              )}
              {subtitulo && (
                <p className="text-lg mb-4 font-medium text-white/90">{subtitulo}</p>
              )}
              {texto && (
                <div
                  className="text-white/80 text-lg"
                  dangerouslySetInnerHTML={{ __html: texto.replace(/\n/g, '<br />') }}
                />
              )}
            </div>
          </div>
        ) : (
          /* Layout texto solo */
          <div className={`${alignClasses[alineacion]} ${animationClass}`}>
            {titulo && (
              <h2
                className={`${tituloSizes[tamanoTitulo]} font-bold mb-4`}
                style={{ color: tema?.color_texto, fontFamily: tema?.fuente_titulo }}
              >
                {titulo}
              </h2>
            )}
            {subtitulo && (
              <p
                className="text-lg mb-6 font-medium"
                style={{ color: tema?.color_primario }}
              >
                {subtitulo}
              </p>
            )}
            {texto && (
              <div
                className="prose prose-lg max-w-none mx-auto"
                style={{ color: tema?.color_texto_claro }}
                dangerouslySetInnerHTML={{ __html: texto.replace(/\n/g, '<br />') }}
              />
            )}
            {imagenUrl && (
              <img
                src={imagenUrl}
                alt={titulo || 'Imagen'}
                className="mt-8 mx-auto rounded-2xl shadow-lg max-w-full"
                style={{ boxShadow: `0 10px 40px ${tema?.color_primario}15` }}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(TextoPublico);
