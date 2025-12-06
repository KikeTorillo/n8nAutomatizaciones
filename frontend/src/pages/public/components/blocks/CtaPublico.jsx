/**
 * CtaPublico - Renderiza bloque Call-to-Action en sitio público
 */
export default function CtaPublico({ contenido }) {
  const {
    titulo = 'Comienza hoy',
    descripcion = '',
    textoBoton = 'Contactar',
    urlBoton = '#contacto',
    textoBotonSecundario = '',
    urlBotonSecundario = '',
    variante = 'primario', // primario, secundario, gradiente
  } = contenido;

  const estilosVariante = {
    primario: {
      background: 'var(--color-primario)',
      color: '#FFFFFF',
    },
    secundario: {
      background: 'var(--color-secundario)',
      color: '#FFFFFF',
    },
    gradiente: {
      background: `linear-gradient(135deg, var(--color-primario), var(--color-secundario))`,
      color: '#FFFFFF',
    },
  };

  const estilo = estilosVariante[variante] || estilosVariante.primario;

  return (
    <section
      className="py-16 sm:py-24"
      style={estilo}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2
          className="text-3xl sm:text-4xl font-bold mb-4"
          style={{ fontFamily: 'var(--font-titulos)' }}
        >
          {titulo}
        </h2>

        {descripcion && (
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            {descripcion}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {textoBoton && urlBoton && (
            <a
              href={urlBoton}
              className="inline-flex items-center justify-center px-8 py-4 bg-white rounded-lg font-semibold text-lg transition-all hover:scale-105"
              style={{ color: 'var(--color-primario)' }}
            >
              {textoBoton}
            </a>
          )}

          {textoBotonSecundario && urlBotonSecundario && (
            <a
              href={urlBotonSecundario}
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white rounded-lg font-semibold text-lg transition-all hover:bg-white/10"
            >
              {textoBotonSecundario}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
