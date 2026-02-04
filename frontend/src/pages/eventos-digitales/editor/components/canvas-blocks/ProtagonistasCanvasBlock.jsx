/**
 * ====================================================================
 * PROTAGONISTAS CANVAS BLOCK
 * ====================================================================
 * Bloque de protagonistas (novios, quinceañera) para invitaciones.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Protagonistas Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 */
function ProtagonistasCanvasBlock({ bloque, tema }) {
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  // Usar || para fallbacks (strings vacíos necesitan ||, no default de desestructuración)
  const nombre_1 = contenido.nombre_1 || 'María';
  const nombre_2 = contenido.nombre_2 || 'Juan';
  const separador = contenido.separador || '&';
  const subtitulo_1 = contenido.subtitulo_1;
  const subtitulo_2 = contenido.subtitulo_2;
  const foto_1_url = contenido.foto_1_url;
  const foto_2_url = contenido.foto_2_url;

  // Fallback: estilos pueden venir en contenido o en estilos
  const layout = estilos.layout || contenido.layout || 'horizontal';
  const mostrar_fotos = estilos.mostrar_fotos ?? contenido.mostrar_fotos ?? false;

  const colorPrimario = tema?.color_primario || '#753572';

  return (
    <section className="py-16 px-6 bg-white dark:bg-gray-900">
      <div
        className={cn(
          'max-w-4xl mx-auto',
          layout === 'horizontal'
            ? 'flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16'
            : 'text-center space-y-8'
        )}
      >
        {/* Protagonista 1 */}
        <div className={cn('flex-1', layout === 'horizontal' ? 'text-center md:text-right' : '')}>
          {mostrar_fotos && foto_1_url && (
            <div className="w-32 h-32 mx-auto md:ml-auto md:mr-0 mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img
                src={foto_1_url}
                alt={nombre_1}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ color: colorPrimario, fontFamily: 'var(--fuente-titulos)' }}
          >
            {nombre_1}
          </h2>
          {subtitulo_1 && (
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base">
              {subtitulo_1}
            </p>
          )}
        </div>

        {/* Separador */}
        <div
          className="text-4xl md:text-5xl font-light"
          style={{ color: colorPrimario }}
        >
          {separador}
        </div>

        {/* Protagonista 2 */}
        <div className={cn('flex-1', layout === 'horizontal' ? 'text-center md:text-left' : '')}>
          {mostrar_fotos && foto_2_url && (
            <div className="w-32 h-32 mx-auto md:mr-auto md:ml-0 mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img
                src={foto_2_url}
                alt={nombre_2}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ color: colorPrimario, fontFamily: 'var(--fuente-titulos)' }}
          >
            {nombre_2}
          </h2>
          {subtitulo_2 && (
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base">
              {subtitulo_2}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default memo(ProtagonistasCanvasBlock);
