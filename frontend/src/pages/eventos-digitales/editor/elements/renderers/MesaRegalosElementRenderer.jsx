/**
 * ====================================================================
 * MESA REGALOS ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo mesa_regalos en el canvas.
 * Muestra la mesa de regalos con links a tiendas.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import { Gift, ExternalLink, CreditCard, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

function MesaRegalosElementRenderer({
  elemento,
  tema,
  evento,
  isEditing = false,
}) {
  const { contenido = {} } = elemento;

  const titulo = contenido.titulo || 'Mesa de Regalos';
  const subtitulo = contenido.subtitulo || 'Tu presencia es nuestro mejor regalo';
  const layout = contenido.layout || 'grid';

  // Usar items del elemento o los del evento
  const mesaEvento = Array.isArray(evento?.mesa_regalos)
    ? evento.mesa_regalos
    : evento?.mesa_regalos?.tiendas || evento?.regalos || [];
  const regalos = contenido.items?.length > 0
    ? contenido.items
    : contenido.regalos?.length > 0
      ? contenido.regalos
      : mesaEvento;

  // Estilos del tema
  const INV = THEME_FALLBACK_COLORS.invitacion;
  const colorPrimario = tema?.color_primario || INV.primario;
  const colorSecundario = tema?.color_secundario || INV.secundario;
  const colorTexto = tema?.color_texto || INV.texto;
  const colorTextoClaro = tema?.color_texto_claro || INV.textoClaro;
  const fuenteTitulo = tema?.fuente_titulos || 'inherit';

  const handleCopy = (text) => {
    if (isEditing) return;
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  // Mostrar placeholder si no hay regalos en modo edición
  if (regalos.length === 0) {
    if (isEditing) {
      return (
        <div
          className="mesa-regalos-element w-full py-6"
          style={{ backgroundColor: colorSecundario + '10' }}
        >
          <div className="text-center mb-6">
            <Gift className="w-8 h-8 mx-auto mb-2" style={{ color: colorPrimario }} />
            <h2
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: colorTexto, fontFamily: fuenteTitulo }}
            >
              {titulo}
            </h2>
            {subtitulo && (
              <p className="text-sm max-w-md mx-auto" style={{ color: colorTextoClaro }}>
                {subtitulo}
              </p>
            )}
          </div>
          <div
            className="text-center py-6 rounded-xl mx-4"
            style={{ backgroundColor: colorSecundario + '30' }}
          >
            <p className="text-sm" style={{ color: colorTextoClaro }}>
              Los enlaces de la mesa de regalos se mostrarán aquí
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      className="mesa-regalos-element w-full py-6"
      style={{ backgroundColor: colorSecundario + '10' }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <Gift className="w-8 h-8 mx-auto mb-2" style={{ color: colorPrimario }} />
        <h2
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: colorTexto, fontFamily: fuenteTitulo }}
        >
          {titulo}
        </h2>
        {subtitulo && (
          <p className="text-sm max-w-md mx-auto" style={{ color: colorTextoClaro }}>
            {subtitulo}
          </p>
        )}
      </div>

      {/* Lista de regalos */}
      <div
        className={`grid gap-3 px-4 ${
          layout === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'
        }`}
      >
        {regalos.slice(0, 4).map((regalo, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl overflow-hidden"
            style={{ boxShadow: `0 2px 10px ${colorPrimario}10` }}
          >
            {/* Logo/Imagen */}
            {regalo.logo_url || regalo.imagen_url ? (
              <div
                className="h-20 flex items-center justify-center p-3"
                style={{ backgroundColor: colorSecundario + '30' }}
              >
                <img
                  src={regalo.logo_url || regalo.imagen_url}
                  alt={regalo.nombre}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div
                className="h-20 flex items-center justify-center"
                style={{ backgroundColor: colorSecundario + '30' }}
              >
                <Gift className="w-8 h-8" style={{ color: colorPrimario }} />
              </div>
            )}

            {/* Info */}
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-1" style={{ color: colorTexto }}>
                {regalo.nombre || regalo.tienda}
              </h3>

              {regalo.descripcion && (
                <p className="text-xs mb-2 line-clamp-2" style={{ color: colorTextoClaro }}>
                  {regalo.descripcion}
                </p>
              )}

              {/* Número de cuenta */}
              {regalo.numero_cuenta && (
                <div
                  className="flex items-center justify-between p-2 rounded-lg mb-2"
                  style={{ backgroundColor: colorSecundario + '30' }}
                >
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3 h-3" style={{ color: colorPrimario }} />
                    <span className="text-xs font-mono truncate" style={{ color: colorTexto }}>
                      {regalo.numero_cuenta}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(regalo.numero_cuenta)}
                    className="p-1 rounded hover:bg-white/50 transition-colors"
                  >
                    <Copy className="w-3 h-3" style={{ color: colorPrimario }} />
                  </button>
                </div>
              )}

              {/* Link */}
              {regalo.url && (
                <a
                  href={isEditing ? '#' : regalo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 w-full justify-center"
                  style={{ backgroundColor: colorPrimario, color: 'white' }}
                  onClick={(e) => isEditing && e.preventDefault()}
                >
                  Ver lista
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Indicador de más items */}
      {regalos.length > 4 && (
        <p className="text-center text-xs mt-3" style={{ color: colorTextoClaro }}>
          +{regalos.length - 4} tiendas más
        </p>
      )}
    </div>
  );
}

MesaRegalosElementRenderer.propTypes = {
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
  evento: PropTypes.shape({
    regalos: PropTypes.array,
  }),
  isEditing: PropTypes.bool,
};

export default memo(MesaRegalosElementRenderer);
