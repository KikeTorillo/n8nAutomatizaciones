/**
 * ====================================================================
 * PROTAGONISTAS ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo protagonistas en el canvas.
 * Muestra los nombres de los protagonistas (novios, quinceañera, etc.)
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import { Heart, Sparkles } from 'lucide-react';

function ProtagonistasElementRenderer({
  elemento,
  tema,
  isEditing = false,
}) {
  const { contenido = {} } = elemento;

  const nombre1 = contenido.nombre_1 || contenido.nombre1 || (isEditing ? 'Nombre 1' : '');
  const nombre2 = contenido.nombre_2 || contenido.nombre2 || '';
  const subtitulo1 = contenido.subtitulo_1 || contenido.subtitulo || '';
  const subtitulo2 = contenido.subtitulo_2 || '';
  const separador = contenido.separador || '&';
  const imagen1 = contenido.foto_1_url || contenido.imagen1 || '';
  const imagen2 = contenido.foto_2_url || contenido.imagen2 || '';
  const layout = contenido.layout || 'horizontal';
  const mostrarFotos = contenido.mostrar_fotos !== false && (imagen1 || imagen2);

  // Estilos del tema
  const colorPrimario = tema?.color_primario || '#753572';
  const colorSecundario = tema?.color_secundario || '#fce7f3';
  const colorTexto = tema?.color_texto || '#1f2937';
  const colorTextoClaro = tema?.color_texto_claro || '#6b7280';
  const fuenteTitulo = tema?.fuente_titulos || 'inherit';

  // Renderizar separador
  const renderSeparador = () => {
    if (separador === '&') {
      return <span className="text-3xl sm:text-4xl font-script" style={{ color: colorPrimario }}>&</span>;
    }
    if (separador === 'heart' || separador === '♥') {
      return <Heart className="w-8 h-8 sm:w-10 sm:h-10 fill-current" style={{ color: colorPrimario }} />;
    }
    if (separador === 'sparkles') {
      return <Sparkles className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: colorPrimario }} />;
    }
    return <span className="text-3xl sm:text-4xl font-script" style={{ color: colorPrimario }}>{separador}</span>;
  };

  if (!nombre1 && !nombre2 && !isEditing) return null;

  return (
    <div
      className="protagonistas-element w-full py-6"
      style={{ backgroundColor: colorSecundario + '20' }}
    >
      <div className="text-center">
        {/* Subtítulo general (solo si no hay subtítulos individuales) */}
        {subtitulo1 && !subtitulo2 && !nombre2 && (
          <p className="text-base mb-3 font-light" style={{ color: colorTextoClaro }}>
            {subtitulo1}
          </p>
        )}

        {layout === 'horizontal' ? (
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
            {/* Nombre 1 */}
            <div className="flex flex-col items-center">
              {mostrarFotos && imagen1 && (
                <div
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-3 ring-4"
                  style={{ ringColor: colorPrimario + '30' }}
                >
                  <img src={imagen1} alt={nombre1} className="w-full h-full object-cover" />
                </div>
              )}
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold"
                style={{ fontFamily: fuenteTitulo, color: colorTexto }}
              >
                {nombre1}
              </h2>
              {subtitulo1 && nombre2 && (
                <p className="text-xs mt-1" style={{ color: colorTextoClaro }}>{subtitulo1}</p>
              )}
            </div>

            {/* Separador */}
            {nombre2 && (
              <div className="flex items-center justify-center">
                {renderSeparador()}
              </div>
            )}

            {/* Nombre 2 */}
            {nombre2 && (
              <div className="flex flex-col items-center">
                {mostrarFotos && imagen2 && (
                  <div
                    className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-3 ring-4"
                    style={{ ringColor: colorPrimario + '30' }}
                  >
                    <img src={imagen2} alt={nombre2} className="w-full h-full object-cover" />
                  </div>
                )}
                <h2
                  className="text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{ fontFamily: fuenteTitulo, color: colorTexto }}
                >
                  {nombre2}
                </h2>
                {subtitulo2 && (
                  <p className="text-xs mt-1" style={{ color: colorTextoClaro }}>{subtitulo2}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Layout vertical */
          <div className="flex flex-col items-center gap-3">
            {mostrarFotos && (imagen1 || imagen2) && (
              <div className="flex items-center justify-center gap-3 mb-3">
                {imagen1 && (
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4"
                    style={{ ringColor: colorPrimario + '30' }}
                  >
                    <img src={imagen1} alt={nombre1} className="w-full h-full object-cover" />
                  </div>
                )}
                {imagen2 && (
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4"
                    style={{ ringColor: colorPrimario + '30' }}
                  >
                    <img src={imagen2} alt={nombre2} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold"
              style={{ fontFamily: fuenteTitulo, color: colorTexto }}
            >
              {nombre1}
            </h2>
            {nombre2 && (
              <>
                <div className="flex items-center justify-center">
                  {renderSeparador()}
                </div>
                <h2
                  className="text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{ fontFamily: fuenteTitulo, color: colorTexto }}
                >
                  {nombre2}
                </h2>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

ProtagonistasElementRenderer.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.object,
  }).isRequired,
  tema: PropTypes.shape({
    color_primario: PropTypes.string,
    color_secundario: PropTypes.string,
    color_texto: PropTypes.string,
    color_texto_claro: PropTypes.string,
    fuente_titulos: PropTypes.string,
  }),
  isEditing: PropTypes.bool,
};

export default memo(ProtagonistasElementRenderer);
