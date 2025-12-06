import { Star } from 'lucide-react';

/**
 * TestimoniosPublico - Renderiza bloque de testimonios en sitio público
 */
export default function TestimoniosPublico({ contenido }) {
  const {
    titulo = 'Lo que dicen nuestros clientes',
    subtitulo = '',
    testimonios = [],
  } = contenido;

  return (
    <section className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-12">
          {subtitulo && (
            <span
              className="text-sm font-medium uppercase tracking-wider mb-2 block"
              style={{ color: 'var(--color-primario)' }}
            >
              {subtitulo}
            </span>
          )}
          <h2
            className="text-3xl sm:text-4xl font-bold"
            style={{ color: 'var(--color-texto)', fontFamily: 'var(--font-titulos)' }}
          >
            {titulo}
          </h2>
        </div>

        {/* Grid de testimonios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonios.map((testimonio, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Estrellas */}
              {testimonio.calificacion && (
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonio.calificacion
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Texto */}
              <p className="text-gray-600 mb-6 italic">
                "{testimonio.texto}"
              </p>

              {/* Autor */}
              <div className="flex items-center gap-3">
                {testimonio.foto ? (
                  <img
                    src={testimonio.foto}
                    alt={testimonio.nombre}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: 'var(--color-primario)' }}
                  >
                    {testimonio.nombre?.charAt(0) || 'C'}
                  </div>
                )}

                <div>
                  <p
                    className="font-semibold"
                    style={{ color: 'var(--color-texto)' }}
                  >
                    {testimonio.nombre}
                  </p>
                  {testimonio.cargo && (
                    <p className="text-sm text-gray-500">
                      {testimonio.cargo}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
