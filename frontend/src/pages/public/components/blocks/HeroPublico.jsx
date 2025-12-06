/**
 * HeroPublico - Renderiza bloque Hero en sitio público
 */
export default function HeroPublico({ contenido, tema }) {
  const {
    titulo = 'Bienvenido',
    subtitulo = '',
    descripcion = '',
    textoBoton = '',
    urlBoton = '',
    imagenFondo = '',
    alineacion = 'centro',
  } = contenido;

  const alineacionClases = {
    izquierda: 'text-left items-start',
    centro: 'text-center items-center',
    derecha: 'text-right items-end',
  };

  return (
    <section
      className="relative min-h-[70vh] flex items-center justify-center"
      style={{
        backgroundImage: imagenFondo ? `url(${imagenFondo})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: imagenFondo ? undefined : 'var(--color-primario)',
      }}
    >
      {/* Overlay */}
      {imagenFondo && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      {/* Contenido */}
      <div className={`relative z-10 max-w-4xl mx-auto px-4 py-20 flex flex-col ${alineacionClases[alineacion] || alineacionClases.centro}`}>
        {subtitulo && (
          <span className="text-sm font-medium text-white/80 uppercase tracking-wider mb-4">
            {subtitulo}
          </span>
        )}

        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6"
          style={{ fontFamily: 'var(--font-titulos)' }}
        >
          {titulo}
        </h1>

        {descripcion && (
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl">
            {descripcion}
          </p>
        )}

        {textoBoton && urlBoton && (
          <a
            href={urlBoton}
            className="inline-flex items-center px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--color-secundario)',
              color: '#FFFFFF',
            }}
          >
            {textoBoton}
          </a>
        )}
      </div>
    </section>
  );
}
