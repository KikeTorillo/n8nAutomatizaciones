/**
 * ====================================================================
 * FAQ CANVAS BLOCK
 * ====================================================================
 * Bloque de preguntas frecuentes con accordion para el canvas WYSIWYG.
 */

import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { InlineText } from '../InlineEditor';

/**
 * FAQ Canvas Block
 */
function FaqCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
  const {
    titulo_seccion = 'Preguntas Frecuentes',
    subtitulo_seccion = 'Encuentra respuestas a las preguntas mas comunes',
    permitir_multiple = false,
    items = [],
  } = contenido;

  const [openItems, setOpenItems] = useState([0]); // First item open by default

  // Default items if empty
  const faqs =
    items.length > 0
      ? items
      : [
          {
            pregunta: 'Como puedo agendar una cita?',
            respuesta: 'Puedes agendar una cita facilmente a traves de nuestro formulario de contacto o llamando a nuestro numero de telefono.',
          },
          {
            pregunta: 'Cuales son los metodos de pago aceptados?',
            respuesta: 'Aceptamos efectivo, tarjetas de credito/debito y transferencias bancarias.',
          },
          {
            pregunta: 'Tienen politica de cancelacion?',
            respuesta: 'Si, puedes cancelar tu cita con al menos 24 horas de anticipacion sin ningun cargo.',
          },
        ];

  /**
   * Toggle item open/close
   */
  const toggleItem = (index) => {
    if (permitir_multiple) {
      setOpenItems((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenItems((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  /**
   * Update a single FAQ
   */
  const updateItem = (index, field, value) => {
    const newItems = [...faqs];
    newItems[index] = { ...newItems[index], [field]: value };
    onContentChange({ items: newItems });
  };

  const colorPrimario = tema?.color_primario || '#753572';

  return (
    <section className="py-16 px-6 bg-white dark:bg-gray-800">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colorPrimario}20` }}
          >
            <HelpCircle className="w-8 h-8" style={{ color: colorPrimario }} />
          </div>
          {isEditing ? (
            <>
              <InlineText
                value={titulo_seccion}
                onChange={(value) => onContentChange({ titulo_seccion: value })}
                placeholder="Titulo de seccion"
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white block mb-4"
                as="h2"
              />
              <InlineText
                value={subtitulo_seccion}
                onChange={(value) => onContentChange({ subtitulo_seccion: value })}
                placeholder="Subtitulo"
                className="text-lg text-gray-600 dark:text-gray-400 block"
                as="p"
              />
            </>
          ) : (
            <>
              <h2
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
                style={{ fontFamily: 'var(--fuente-titulos)' }}
              >
                {titulo_seccion}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">{subtitulo_seccion}</p>
            </>
          )}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openItems.includes(index);

            return (
              <div
                key={index}
                className={cn(
                  'bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden transition-all',
                  isOpen && 'ring-2'
                )}
                style={isOpen ? { ringColor: `${colorPrimario}40` } : {}}
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  {isEditing ? (
                    <InlineText
                      value={faq.pregunta}
                      onChange={(value) => updateItem(index, 'pregunta', value)}
                      placeholder="Pregunta"
                      className="font-semibold text-gray-900 dark:text-white pr-4 flex-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="font-semibold text-gray-900 dark:text-white pr-4">
                      {faq.pregunta}
                    </span>
                  )}
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-gray-500 transition-transform flex-shrink-0',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>

                {/* Answer */}
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300',
                    isOpen ? 'max-h-96' : 'max-h-0'
                  )}
                >
                  <div className="px-6 pb-4">
                    {isEditing ? (
                      <InlineText
                        value={faq.respuesta}
                        onChange={(value) => updateItem(index, 'respuesta', value)}
                        placeholder="Respuesta"
                        className="text-gray-600 dark:text-gray-300 block"
                        as="p"
                        multiline
                      />
                    ) : (
                      <p className="text-gray-600 dark:text-gray-300">{faq.respuesta}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default memo(FaqCanvasBlock);
