import { Check, Star } from 'lucide-react';

/**
 * PricingPublico - Renderiza bloque de tabla de precios en sitio público
 */
export default function PricingPublico({ contenido }) {
  const {
    titulo_seccion = 'Nuestros Planes',
    subtitulo_seccion = 'Elige el plan perfecto para ti',
    columnas = 3,
    moneda = 'USD',
    planes = [],
  } = contenido;

  // Default plans if empty
  const planesDisplay =
    planes.length > 0
      ? planes
      : [
          {
            nombre: 'Basico',
            precio: 29,
            periodo: 'mes',
            descripcion: 'Ideal para empezar',
            caracteristicas: ['Caracteristica 1', 'Caracteristica 2', 'Caracteristica 3'],
            es_popular: false,
            boton_texto: 'Comenzar',
          },
          {
            nombre: 'Profesional',
            precio: 59,
            periodo: 'mes',
            descripcion: 'Para negocios en crecimiento',
            caracteristicas: ['Todo del Basico', 'Caracteristica 4', 'Caracteristica 5', 'Caracteristica 6'],
            es_popular: true,
            boton_texto: 'Elegir Plan',
          },
          {
            nombre: 'Empresarial',
            precio: 99,
            periodo: 'mes',
            descripcion: 'Solucion completa',
            caracteristicas: ['Todo del Profesional', 'Caracteristica 7', 'Caracteristica 8', 'Soporte prioritario'],
            es_popular: false,
            boton_texto: 'Contactar',
          },
        ];

  const columnasClases = {
    '2': 'md:grid-cols-2',
    '3': 'md:grid-cols-2 lg:grid-cols-3',
    '4': 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: 'var(--color-texto)', fontFamily: 'var(--font-titulos)' }}
          >
            {titulo_seccion}
          </h2>
          <p className="text-lg text-gray-600">{subtitulo_seccion}</p>
        </div>

        {/* Grid de planes */}
        <div className={`grid grid-cols-1 gap-8 ${columnasClases[String(columnas)] || columnasClases['3']}`}>
          {planesDisplay.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl p-6 shadow-lg transition-all ${
                plan.es_popular ? 'ring-2 scale-105 z-10' : ''
              }`}
              style={plan.es_popular ? { '--tw-ring-color': 'var(--color-primario)' } : {}}
            >
              {/* Badge Popular */}
              {plan.es_popular && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-sm font-medium flex items-center gap-1"
                  style={{ backgroundColor: 'var(--color-primario)' }}
                >
                  <Star className="w-4 h-4 fill-current" />
                  Mas Popular
                </div>
              )}

              {/* Nombre del plan */}
              <div className="text-center mb-6 pt-2">
                <h3
                  className="text-xl font-bold mb-1"
                  style={{ color: 'var(--color-texto)' }}
                >
                  {plan.nombre}
                </h3>
                <p className="text-gray-500 text-sm">{plan.descripcion}</p>
              </div>

              {/* Precio */}
              <div className="text-center mb-6">
                <span
                  className="text-4xl font-bold"
                  style={{ color: 'var(--color-texto)' }}
                >
                  {moneda === 'USD' ? '$' : moneda}
                  {plan.precio}
                </span>
                <span className="text-gray-500">/{plan.periodo}</span>
              </div>

              {/* Caracteristicas */}
              <ul className="space-y-3 mb-6">
                {plan.caracteristicas?.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <Check
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{ color: 'var(--color-primario)' }}
                    />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Boton CTA */}
              <button
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  plan.es_popular
                    ? 'text-white hover:opacity-90'
                    : 'border-2 hover:bg-gray-50'
                }`}
                style={
                  plan.es_popular
                    ? { backgroundColor: 'var(--color-primario)' }
                    : { borderColor: 'var(--color-primario)', color: 'var(--color-primario)' }
                }
              >
                {plan.boton_texto || 'Comenzar'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
