import { Facebook, Instagram, Twitter, Linkedin, Youtube, Globe } from 'lucide-react';

/**
 * FooterPublico - Renderiza bloque footer en sitio público
 */
export default function FooterPublico({ contenido, tema }) {
  const {
    logo = '',
    texto = '',
    copyright = `${new Date().getFullYear()} Todos los derechos reservados`,
    redesSociales = [],
    enlaces = [],
    mostrarCreditos = true,
  } = contenido;

  const iconosRedes = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo y texto */}
          <div className="col-span-1">
            {logo ? (
              <img src={logo} alt="Logo" className="h-10 w-auto mb-4" />
            ) : (
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-6 h-6" style={{ color: 'var(--color-primario)' }} />
                <span className="text-xl font-bold">Mi Sitio</span>
              </div>
            )}

            {texto && (
              <p className="text-gray-400 text-sm">{texto}</p>
            )}

            {/* Redes sociales */}
            {redesSociales.length > 0 && (
              <div className="flex gap-4 mt-4">
                {redesSociales.map((red, index) => {
                  const Icon = iconosRedes[red.tipo?.toLowerCase()] || Globe;
                  return (
                    <a
                      key={index}
                      href={red.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enlaces */}
          {enlaces.length > 0 && (
            <div className="col-span-1 md:col-span-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {enlaces.map((grupo, gIndex) => (
                  <div key={gIndex}>
                    {grupo.titulo && (
                      <h4 className="font-semibold text-white mb-3">{grupo.titulo}</h4>
                    )}
                    <ul className="space-y-2">
                      {grupo.items?.map((item, iIndex) => (
                        <li key={iIndex}>
                          <a
                            href={item.url}
                            className="text-gray-400 hover:text-white text-sm transition-colors"
                          >
                            {item.texto}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>{copyright}</p>
          {mostrarCreditos && (
            <p className="mt-2">
              Creado con{' '}
              <a
                href="https://nexo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                style={{ color: 'var(--color-primario)' }}
              >
                Nexo
              </a>
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
