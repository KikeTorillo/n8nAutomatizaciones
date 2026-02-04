/**
 * ====================================================================
 * FAQ CANVAS BLOCK
 * ====================================================================
 * Bloque de preguntas frecuentes para invitaciones digitales.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo, useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FAQ Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 */
function FaqCanvasBlock({ bloque, tema }) {
  const contenido = bloque.contenido || {};

  // Usar || para fallbacks (strings vacíos necesitan ||, no default de desestructuración)
  const titulo_seccion = contenido.titulo_seccion || 'Preguntas Frecuentes';
  const subtitulo_seccion = contenido.subtitulo_seccion;
  const items = contenido.items || [];

  const colorPrimario = tema?.color_primario || '#753572';

  // Estado para items abiertos
  const [openItems, setOpenItems] = useState([0]); // Primer item abierto por defecto

  const toggleItem = (index) => {
    setOpenItems((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section className="py-16 px-6 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: colorPrimario, fontFamily: 'var(--fuente-titulos)' }}
          >
            {titulo_seccion}
          </h2>
          {subtitulo_seccion && (
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {subtitulo_seccion}
            </p>
          )}
        </div>

        {/* FAQ Items */}
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item, idx) => {
              const isOpen = openItems.includes(idx);
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm"
                >
                  {/* Pregunta */}
                  <button
                    onClick={() => toggleItem(idx)}
                    className={cn(
                      'w-full px-6 py-4 text-left flex items-center justify-between gap-4',
                      'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                    )}
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {item.pregunta || 'Pregunta'}
                    </span>
                    {isOpen ? (
                      <ChevronUp
                        className="w-5 h-5 flex-shrink-0"
                        style={{ color: colorPrimario }}
                      />
                    ) : (
                      <ChevronDown
                        className="w-5 h-5 flex-shrink-0 text-gray-400"
                      />
                    )}
                  </button>

                  {/* Respuesta */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                          {item.respuesta || 'Sin respuesta'}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay preguntas frecuentes</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(FaqCanvasBlock);
