/**
 * ====================================================================
 * PREVIEW RENDERER
 * ====================================================================
 * Renderiza mini-versiones visuales de cada tipo de bloque
 * para mostrar durante el drag desde la paleta.
 *
 * Incluye previews para bloques de website e invitaciones.
 */

import { memo } from 'react';

/**
 * Renderiza un preview visual del tipo de bloque
 * @param {Object} props
 * @param {string} props.tipo - Tipo de bloque
 * @param {Object} props.tema - Tema del sitio (colores)
 */
function PreviewRenderer({ tipo, tema }) {
  const primaryColor = tema?.color_primario || '#753572';
  const secondaryColor = tema?.color_secundario || '#1F2937';

  switch (tipo) {
    // ========== BLOQUES WEBSITE ==========
    case 'hero':
      return (
        <div className="w-full h-24 bg-gradient-to-r from-primary-600 to-primary-700 rounded-md flex flex-col items-center justify-center text-white p-2">
          <div className="w-16 h-2 bg-white/80 rounded mb-1.5" />
          <div className="w-24 h-1.5 bg-white/50 rounded mb-2" />
          <div className="w-12 h-4 bg-white rounded text-[8px] flex items-center justify-center font-medium text-primary-600">
            CTA
          </div>
        </div>
      );

    case 'servicios':
      return (
        <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-1.5 bg-primary-500 rounded mx-auto mb-2" />
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-1" />
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'testimonios':
      return (
        <div className="w-full h-24 bg-gray-50 dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded mb-1" />
              <div className="w-3/4 h-1.5 bg-gray-200 dark:bg-gray-600 rounded mb-1" />
              <div className="w-1/2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded" />
              <div className="flex gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-2 h-2 bg-amber-400 rounded-sm" />
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'equipo':
      return (
        <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-1.5 bg-primary-500 rounded mx-auto mb-2" />
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full mb-1" />
                <div className="w-8 h-1 bg-gray-200 dark:bg-gray-600 rounded" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className="w-full h-24 rounded-md flex flex-col items-center justify-center p-2" style={{ backgroundColor: primaryColor }}>
          <div className="w-20 h-2 bg-white/80 rounded mb-1.5" />
          <div className="w-28 h-1.5 bg-white/50 rounded mb-2" />
          <div className="w-16 h-5 bg-white rounded text-[8px] flex items-center justify-center font-medium" style={{ color: primaryColor }}>
            Accion
          </div>
        </div>
      );

    case 'contacto':
      return (
        <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-1.5 bg-primary-500 rounded mx-auto mb-2" />
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded" />
            <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded" />
            <div className="w-1/3 h-4 bg-primary-500 rounded" />
          </div>
        </div>
      );

    case 'footer':
      return (
        <div className="w-full h-24 rounded-md p-2" style={{ backgroundColor: secondaryColor }}>
          <div className="flex justify-between items-start">
            <div className="w-12 h-4 bg-white/20 rounded" />
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-4 h-4 bg-white/20 rounded-full" />
              ))}
            </div>
          </div>
          <div className="mt-auto pt-4">
            <div className="w-full h-px bg-white/10" />
            <div className="w-24 h-1 bg-white/20 rounded mx-auto mt-2" />
          </div>
        </div>
      );

    case 'texto':
      return (
        <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
          <div className="space-y-1.5">
            <div className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded" />
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-3/4 h-1.5 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-1/2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      );

    case 'galeria':
      return (
        <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-1 h-full">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      );

    case 'video':
      return (
        <div className="w-full h-24 bg-gray-900 rounded-md flex items-center justify-center">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ml-1" />
          </div>
        </div>
      );

    case 'separador':
      return (
        <div className="w-full h-16 bg-white dark:bg-gray-800 rounded-md flex items-center justify-center border border-gray-200 dark:border-gray-700">
          <div className="w-2/3 h-px bg-gray-300 dark:bg-gray-600" />
        </div>
      );

    case 'pricing':
      return (
        <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
          <div className="flex gap-1 h-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex-1 rounded p-1 border ${i === 2 ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded mb-1" />
                <div className="w-2/3 h-2 bg-gray-300 dark:bg-gray-500 rounded mb-1 mx-auto" />
                <div className="w-full h-8 bg-gray-100 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'faq':
      return (
        <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="w-3 h-3 bg-primary-200 dark:bg-primary-800 rounded-full flex-shrink-0" />
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'countdown':
      return (
        <div className="w-full h-24 rounded-md flex flex-col items-center justify-center p-2" style={{ backgroundColor: primaryColor }}>
          <div className="w-16 h-1.5 bg-white/80 rounded mb-2" />
          <div className="flex gap-2">
            {['00', '12', '45', '30'].map((num, i) => (
              <div key={i} className="w-6 h-8 bg-white/20 rounded flex items-center justify-center text-[8px] text-white font-bold">
                {num}
              </div>
            ))}
          </div>
        </div>
      );

    case 'stats':
      return (
        <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-around items-center h-full">
            {['+500', '10', '98%', '24/7'].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-sm font-bold" style={{ color: primaryColor }}>{stat}</div>
                <div className="w-8 h-1 bg-gray-200 dark:bg-gray-600 rounded mt-1" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'timeline':
      return (
        <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2 h-full">
            <div className="flex flex-col items-center h-full">
              <div className="w-3 h-3 bg-primary-500 rounded-full" />
              <div className="w-0.5 flex-1 bg-primary-200 dark:bg-primary-800" />
              <div className="w-3 h-3 bg-primary-300 rounded-full" />
              <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" />
              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="flex-1 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1">
                  <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    // ========== BLOQUES INVITACIONES ==========
    case 'hero_invitacion':
      return (
        <div className="w-full h-24 bg-gradient-to-br from-pink-400 to-rose-500 rounded-md flex flex-col items-center justify-center text-white p-2">
          <div className="text-[10px] font-serif mb-1">Maria & Juan</div>
          <div className="w-20 h-1 bg-white/50 rounded mb-1" />
          <div className="text-[8px] opacity-75">15 de Junio, 2026</div>
        </div>
      );

    case 'protagonistas':
      return (
        <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="w-8 h-1.5 bg-pink-300 rounded mb-1" />
              <div className="w-6 h-1 bg-gray-200 rounded" />
            </div>
            <div className="text-pink-400 text-lg">&</div>
            <div className="text-center">
              <div className="w-8 h-1.5 bg-pink-300 rounded mb-1" />
              <div className="w-6 h-1 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      );

    case 'ubicacion':
      return (
        <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-1.5 bg-primary-500 rounded mx-auto mb-2" />
          <div className="flex gap-2 h-14">
            <div className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-red-500 rounded-full" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded" />
              <div className="w-3/4 h-1 bg-gray-200 dark:bg-gray-600 rounded" />
              <div className="w-1/2 h-1 bg-gray-200 dark:bg-gray-600 rounded" />
            </div>
          </div>
        </div>
      );

    case 'rsvp':
      return (
        <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-1.5 bg-primary-500 rounded mx-auto mb-2" />
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded" />
            <div className="flex gap-2">
              <div className="flex-1 h-5 bg-green-500 rounded text-[8px] text-white flex items-center justify-center">Asistire</div>
              <div className="flex-1 h-5 bg-gray-300 rounded text-[8px] flex items-center justify-center">No asistire</div>
            </div>
          </div>
        </div>
      );

    case 'mesa_regalos':
      return (
        <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-1.5 bg-primary-500 rounded mx-auto mb-2" />
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'itinerario':
      return (
        <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2 h-full">
            <div className="flex flex-col items-center h-full">
              <div className="text-[8px] text-primary-500 font-bold">16:00</div>
              <div className="w-0.5 flex-1 bg-primary-200" />
              <div className="text-[8px] text-primary-400">18:00</div>
              <div className="w-0.5 flex-1 bg-gray-200" />
              <div className="text-[8px] text-gray-400">20:00</div>
            </div>
            <div className="flex-1 space-y-1">
              <div className="w-12 h-1 bg-primary-300 rounded" />
              <div className="w-10 h-1 bg-primary-200 rounded" />
              <div className="w-8 h-1 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
          <span className="text-xs text-gray-400">Preview</span>
        </div>
      );
  }
}

export default memo(PreviewRenderer);

export { PreviewRenderer };
