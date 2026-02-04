/**
 * ====================================================================
 * PROTAGONISTAS PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza los nombres de los protagonistas (novios, quinceañera, etc.)
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { Heart, Sparkles } from 'lucide-react';

function ProtagonistasPublico({ bloque, tema, isVisible, className = '' }) {
  const { contenido = {}, estilos = {} } = bloque;

  // Fallbacks: Editor guarda nombre_1/nombre_2, antes se usaba nombre1/nombre2
  const nombre1 = contenido.nombre_1 || contenido.nombre1 || 'Nombre 1';
  const nombre2 = contenido.nombre_2 || contenido.nombre2;
  const subtitulo1 = contenido.subtitulo_1 || contenido.subtitulo;
  const subtitulo2 = contenido.subtitulo_2;
  const separador = contenido.separador || '&';
  // Editor guarda foto_1_url/foto_2_url, antes se usaba imagen1/imagen2
  const imagen1 = contenido.foto_1_url || contenido.imagen1;
  const imagen2 = contenido.foto_2_url || contenido.imagen2;

  const layout = estilos.layout || contenido.layout || 'horizontal';
  const mostrarFotos = (estilos.mostrar_fotos ?? contenido.mostrar_fotos) !== false && (imagen1 || imagen2);

  const animationClass = isVisible ? 'animate-fadeInUp' : 'opacity-0';

  return (
    <section
      className={`py-20 ${className}`}
      style={{ backgroundColor: tema?.color_secundario + '20' }}
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className={`text-center ${animationClass}`}>
          {/* Subtítulo general (solo si no hay subtítulos individuales) */}
          {subtitulo1 && !subtitulo2 && !nombre2 && (
            <p
              className="text-lg mb-4 font-light"
              style={{ color: tema?.color_texto_claro }}
            >
              {subtitulo1}
            </p>
          )}

          {/* Nombres */}
          {layout === 'horizontal' ? (
            <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
              {/* Nombre 1 con foto opcional */}
              <div className="flex flex-col items-center">
                {mostrarFotos && imagen1 && (
                  <div
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden mb-4 ring-4"
                    style={{ ringColor: tema?.color_primario + '30' }}
                  >
                    <img
                      src={imagen1}
                      alt={nombre1}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h2
                  className="text-4xl sm:text-5xl md:text-6xl font-bold"
                  style={{
                    fontFamily: tema?.fuente_titulo,
                    color: tema?.color_texto,
                  }}
                >
                  {nombre1}
                </h2>
                {subtitulo1 && nombre2 && (
                  <p className="text-sm mt-1" style={{ color: tema?.color_texto_claro }}>
                    {subtitulo1}
                  </p>
                )}
              </div>

              {/* Separador */}
              {nombre2 && (
                <div className="flex items-center justify-center">
                  {separador === '&' ? (
                    <span
                      className="text-4xl sm:text-5xl font-script"
                      style={{ color: tema?.color_primario }}
                    >
                      &
                    </span>
                  ) : separador === 'heart' ? (
                    <Heart
                      className="w-10 h-10 sm:w-12 sm:h-12 fill-current"
                      style={{ color: tema?.color_primario }}
                    />
                  ) : separador === 'sparkles' ? (
                    <Sparkles
                      className="w-10 h-10 sm:w-12 sm:h-12"
                      style={{ color: tema?.color_primario }}
                    />
                  ) : (
                    <span
                      className="text-4xl sm:text-5xl font-script"
                      style={{ color: tema?.color_primario }}
                    >
                      {separador}
                    </span>
                  )}
                </div>
              )}

              {/* Nombre 2 con foto opcional */}
              {nombre2 && (
                <div className="flex flex-col items-center">
                  {mostrarFotos && imagen2 && (
                    <div
                      className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden mb-4 ring-4"
                      style={{ ringColor: tema?.color_primario + '30' }}
                    >
                      <img
                        src={imagen2}
                        alt={nombre2}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h2
                    className="text-4xl sm:text-5xl md:text-6xl font-bold"
                    style={{
                      fontFamily: tema?.fuente_titulo,
                      color: tema?.color_texto,
                    }}
                  >
                    {nombre2}
                  </h2>
                  {subtitulo2 && (
                    <p className="text-sm mt-1" style={{ color: tema?.color_texto_claro }}>
                      {subtitulo2}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Layout vertical */
            <div className="flex flex-col items-center gap-4">
              {mostrarFotos && (imagen1 || imagen2) && (
                <div className="flex items-center justify-center gap-4 mb-4">
                  {imagen1 && (
                    <div
                      className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden ring-4"
                      style={{ ringColor: tema?.color_primario + '30' }}
                    >
                      <img
                        src={imagen1}
                        alt={nombre1}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {imagen2 && (
                    <div
                      className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden ring-4"
                      style={{ ringColor: tema?.color_primario + '30' }}
                    >
                      <img
                        src={imagen2}
                        alt={nombre2}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
              <h2
                className="text-4xl sm:text-5xl md:text-6xl font-bold"
                style={{
                  fontFamily: tema?.fuente_titulo,
                  color: tema?.color_texto,
                }}
              >
                {nombre1}
              </h2>
              {nombre2 && (
                <>
                  <div className="flex items-center justify-center">
                    {separador === '&' ? (
                      <span
                        className="text-3xl font-script"
                        style={{ color: tema?.color_primario }}
                      >
                        &
                      </span>
                    ) : separador === 'heart' ? (
                      <Heart
                        className="w-8 h-8 fill-current"
                        style={{ color: tema?.color_primario }}
                      />
                    ) : (
                      <span
                        className="text-3xl font-script"
                        style={{ color: tema?.color_primario }}
                      >
                        {separador}
                      </span>
                    )}
                  </div>
                  <h2
                    className="text-4xl sm:text-5xl md:text-6xl font-bold"
                    style={{
                      fontFamily: tema?.fuente_titulo,
                      color: tema?.color_texto,
                    }}
                  >
                    {nombre2}
                  </h2>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default memo(ProtagonistasPublico);
