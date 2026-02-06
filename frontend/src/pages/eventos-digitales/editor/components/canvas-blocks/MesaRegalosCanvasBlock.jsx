/**
 * ====================================================================
 * MESA REGALOS CANVAS BLOCK
 * ====================================================================
 * Bloque de mesa de regalos para invitaciones digitales.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { Gift, ExternalLink, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

/**
 * Mesa Regalos Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 * @param {Object} props.mesaRegalos - Mesa de regalos del evento
 */
function MesaRegalosCanvasBlock({ bloque, tema, mesaRegalos }) {
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  // Usar || para fallbacks (strings vacíos necesitan ||, no default de desestructuración)
  const titulo = contenido.titulo || 'Mesa de Regalos';
  const subtitulo = contenido.subtitulo || 'Tu presencia es nuestro mejor regalo';
  const usar_mesa_evento = contenido.usar_mesa_evento ?? true;
  const items = contenido.items || [];

  // Fallback: estilos pueden venir en contenido o en estilos
  const layout = estilos.layout || contenido.layout || 'grid';

  const INV = THEME_FALLBACK_COLORS.invitacion;
  const colorPrimario = tema?.color_primario || INV.primario;
  const colorSecundario = tema?.color_secundario || INV.acento;
  const colorTexto = tema?.color_texto || INV.texto;
  const colorTextoClaro = tema?.color_texto_claro || INV.textoClaro;

  // Items a mostrar (del evento o personalizados)
  const itemsAMostrar = usar_mesa_evento && mesaRegalos?.tiendas
    ? mesaRegalos.tiendas
    : items;

  return (
    <section
      className="py-20 px-6"
      style={{ backgroundColor: colorSecundario + '10' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Gift className="w-12 h-12 mx-auto mb-4" style={{ color: colorPrimario }} />
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: colorTexto, fontFamily: 'var(--fuente-titulos)' }}
          >
            {titulo}
          </h2>
          {subtitulo && (
            <p className="max-w-2xl mx-auto" style={{ color: colorTextoClaro }}>
              {subtitulo}
            </p>
          )}
        </div>

        {/* Tiendas */}
        {itemsAMostrar.length > 0 ? (
          <div
            className={cn(
              layout === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6'
                : 'space-y-4'
            )}
          >
            {itemsAMostrar.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl overflow-hidden"
                style={{ boxShadow: `0 4px 20px ${colorPrimario}10` }}
              >
                {/* Logo o icono */}
                {item.logo_url ? (
                  <div
                    className="h-32 flex items-center justify-center p-4"
                    style={{ backgroundColor: colorSecundario + '30' }}
                  >
                    <img
                      src={item.logo_url}
                      alt={item.nombre}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="h-32 flex items-center justify-center"
                    style={{ backgroundColor: colorSecundario + '30' }}
                  >
                    <Gift className="w-12 h-12" style={{ color: colorPrimario }} />
                  </div>
                )}

                {/* Info */}
                <div className="p-6">
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: colorTexto }}
                  >
                    {item.nombre || 'Tienda'}
                  </h3>
                  {item.descripcion && (
                    <p className="text-sm mb-4" style={{ color: colorTextoClaro }}>
                      {item.descripcion}
                    </p>
                  )}

                  {/* Número de cuenta */}
                  {item.numero_cuenta && (
                    <div
                      className="flex items-center gap-2 p-3 rounded-lg mb-4"
                      style={{ backgroundColor: colorSecundario + '30' }}
                    >
                      <CreditCard className="w-4 h-4" style={{ color: colorPrimario }} />
                      <span className="text-sm font-mono" style={{ color: colorTexto }}>
                        {item.numero_cuenta}
                      </span>
                    </div>
                  )}

                  {/* Link externo */}
                  {item.url && (
                    <span
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white w-full justify-center"
                      style={{ backgroundColor: colorPrimario }}
                    >
                      Ver lista
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12" style={{ color: colorTextoClaro }}>
            <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay tiendas configuradas</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(MesaRegalosCanvasBlock);
