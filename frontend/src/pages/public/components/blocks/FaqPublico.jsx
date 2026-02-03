import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

/**
 * FaqPublico - Renderiza bloque de preguntas frecuentes en sitio público
 */
export default function FaqPublico({ contenido }) {
  const {
    titulo_seccion = 'Preguntas Frecuentes',
    subtitulo_seccion = 'Encuentra respuestas a las preguntas mas comunes',
    permitir_multiple = false,
    items = [],
  } = contenido;

  const [openItems, setOpenItems] = useState([0]);

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

  const toggleItem = (index) => {
    if (permitir_multiple) {
      setOpenItems((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenItems((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-primario) 20%, transparent)' }}
          >
            <HelpCircle className="w-8 h-8" style={{ color: 'var(--color-primario)' }} />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: 'var(--color-texto)', fontFamily: 'var(--font-titulos)' }}
          >
            {titulo_seccion}
          </h2>
          <p className="text-lg text-gray-600">{subtitulo_seccion}</p>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openItems.includes(index);

            return (
              <div
                key={index}
                className={`bg-gray-50 rounded-xl overflow-hidden transition-all ${
                  isOpen ? 'ring-2' : ''
                }`}
                style={isOpen ? { '--tw-ring-color': 'color-mix(in srgb, var(--color-primario) 40%, transparent)' } : {}}
              >
                {/* Pregunta */}
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span
                    className="font-semibold pr-4"
                    style={{ color: 'var(--color-texto)' }}
                  >
                    {faq.pregunta}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Respuesta */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.respuesta}</p>
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
