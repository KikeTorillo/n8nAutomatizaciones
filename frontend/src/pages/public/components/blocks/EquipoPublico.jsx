/**
 * EquipoPublico - Renderiza bloque de equipo/profesionales en sitio público
 */
export default function EquipoPublico({ contenido }) {
  const {
    titulo = 'Nuestro Equipo',
    subtitulo = '',
    miembros = [],
    columnas = 4,
  } = contenido;

  const columnasClases = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="py-16 sm:py-24 bg-white">
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

        {/* Grid de miembros */}
        <div className={`grid grid-cols-1 gap-8 ${columnasClases[columnas] || columnasClases[4]}`}>
          {miembros.map((miembro, index) => (
            <div
              key={index}
              className="text-center group"
            >
              {/* Foto */}
              <div className="relative mb-4 overflow-hidden rounded-xl">
                {miembro.foto ? (
                  <img
                    src={miembro.foto}
                    alt={miembro.nombre}
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div
                    className="w-full aspect-square flex items-center justify-center text-6xl font-bold text-white"
                    style={{ backgroundColor: 'var(--color-primario)' }}
                  >
                    {miembro.nombre?.charAt(0) || '?'}
                  </div>
                )}
              </div>

              {/* Info */}
              <h3
                className="text-lg font-semibold mb-1"
                style={{ color: 'var(--color-texto)' }}
              >
                {miembro.nombre}
              </h3>

              {miembro.cargo && (
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: 'var(--color-primario)' }}
                >
                  {miembro.cargo}
                </p>
              )}

              {miembro.descripcion && (
                <p className="text-gray-600 text-sm">
                  {miembro.descripcion}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
