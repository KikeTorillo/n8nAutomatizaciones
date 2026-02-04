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
import { Gift, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const colorPrimario = tema?.color_primario || '#753572';

  // Items a mostrar (del evento o personalizados)
  const itemsAMostrar = usar_mesa_evento && mesaRegalos?.tiendas
    ? mesaRegalos.tiendas
    : items;

  return (
    <section className="py-16 px-6 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: colorPrimario, fontFamily: 'var(--fuente-titulos)' }}
          >
            {titulo}
          </h2>
          {subtitulo && (
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
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
              <a
                key={idx}
                href={item.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'group bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden transition-all hover:shadow-lg',
                  layout === 'grid'
                    ? 'p-6 text-center'
                    : 'p-4 flex items-center gap-4'
                )}
              >
                {/* Logo o icono */}
                {item.logo_url ? (
                  <img
                    src={item.logo_url}
                    alt={item.nombre}
                    className={cn(
                      'object-contain',
                      layout === 'grid'
                        ? 'w-20 h-20 mx-auto mb-4'
                        : 'w-16 h-16 flex-shrink-0'
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      'rounded-lg flex items-center justify-center',
                      layout === 'grid'
                        ? 'w-20 h-20 mx-auto mb-4'
                        : 'w-16 h-16 flex-shrink-0'
                    )}
                    style={{ backgroundColor: `${colorPrimario}20` }}
                  >
                    <Gift className="w-8 h-8" style={{ color: colorPrimario }} />
                  </div>
                )}

                {/* Info */}
                <div className={layout === 'list' ? 'flex-1' : ''}>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {item.nombre || 'Tienda'}
                  </h3>
                  {item.descripcion && layout === 'list' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.descripcion}
                    </p>
                  )}
                </div>

                {/* Link icon */}
                {layout === 'list' && (
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay tiendas configuradas</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(MesaRegalosCanvasBlock);
