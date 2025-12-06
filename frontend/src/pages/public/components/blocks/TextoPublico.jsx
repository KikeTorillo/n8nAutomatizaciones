/**
 * TextoPublico - Renderiza bloque de texto/contenido en sitio público
 */
export default function TextoPublico({ contenido }) {
  const {
    titulo = '',
    subtitulo = '',
    contenido: textoContenido = '',
    alineacion = 'izquierda',
    anchoMaximo = 'normal', // estrecho, normal, ancho, completo
  } = contenido;

  const alineacionClases = {
    izquierda: 'text-left',
    centro: 'text-center',
    derecha: 'text-right',
  };

  const anchoClases = {
    estrecho: 'max-w-2xl',
    normal: 'max-w-4xl',
    ancho: 'max-w-6xl',
    completo: 'max-w-7xl',
  };

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${anchoClases[anchoMaximo] || anchoClases.normal} ${alineacionClases[alineacion] || alineacionClases.izquierda}`}>
        {subtitulo && (
          <span
            className="text-sm font-medium uppercase tracking-wider mb-2 block"
            style={{ color: 'var(--color-primario)' }}
          >
            {subtitulo}
          </span>
        )}

        {titulo && (
          <h2
            className="text-3xl sm:text-4xl font-bold mb-6"
            style={{ color: 'var(--color-texto)', fontFamily: 'var(--font-titulos)' }}
          >
            {titulo}
          </h2>
        )}

        {textoContenido && (
          <div
            className="prose prose-lg max-w-none"
            style={{ color: 'var(--color-texto)' }}
            dangerouslySetInnerHTML={{ __html: textoContenido }}
          />
        )}
      </div>
    </section>
  );
}
