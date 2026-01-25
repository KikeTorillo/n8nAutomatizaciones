/**
 * ====================================================================
 * FOOTER CANVAS BLOCK
 * ====================================================================
 * Bloque de pie de página editable para el canvas WYSIWYG.
 */

import { memo } from 'react';
import { Instagram, Facebook, Twitter, Linkedin, Youtube } from 'lucide-react';
import { InlineText } from '../InlineEditor';

/**
 * Footer Canvas Block
 */
function FooterCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
  const {
    logo_url,
    descripcion = 'Tu negocio de confianza',
    columnas = [],
    mostrar_redes = true,
    copyright = '© 2024 Mi Negocio. Todos los derechos reservados.',
  } = contenido;

  // Default columns if empty
  const columnasFinal =
    columnas.length > 0
      ? columnas
      : [
          {
            titulo: 'Enlaces',
            links: [
              { texto: 'Inicio', url: '#' },
              { texto: 'Servicios', url: '#servicios' },
              { texto: 'Contacto', url: '#contacto' },
            ],
          },
          {
            titulo: 'Legal',
            links: [
              { texto: 'Privacidad', url: '#' },
              { texto: 'Términos', url: '#' },
            ],
          },
        ];

  // Social icons
  const socialIcons = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
  };

  // Get redes sociales from tema or default
  const redesSociales = tema?.redes_sociales || {};

  return (
    <footer
      className="py-12 px-6"
      style={{
        backgroundColor: `var(--color-secundario, ${tema?.color_secundario || '#1F2937'})`,
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description Column */}
          <div className="lg:col-span-2">
            {/* Logo */}
            {logo_url ? (
              <img
                src={logo_url}
                alt="Logo"
                className="h-10 w-auto mb-4 brightness-0 invert"
              />
            ) : (
              <div
                className="text-2xl font-bold mb-4"
                style={{ color: 'white' }}
              >
                {tema?.nombre_sitio || 'Mi Negocio'}
              </div>
            )}

            {/* Description */}
            {isEditing ? (
              <InlineText
                value={descripcion}
                onChange={(value) => onContentChange({ descripcion: value })}
                placeholder="Descripción del negocio"
                className="text-gray-300 max-w-md block"
                as="p"
                multiline
              />
            ) : (
              <p className="text-gray-300 max-w-md">{descripcion}</p>
            )}

            {/* Social Links */}
            {mostrar_redes && Object.keys(redesSociales).length > 0 && (
              <div className="flex gap-4 mt-6">
                {Object.entries(redesSociales).map(([red, url]) => {
                  if (!url) return null;
                  const Icon = socialIcons[red];
                  if (!Icon) return null;

                  return (
                    <a
                      key={red}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link Columns */}
          {columnasFinal.map((columna, index) => (
            <div key={index}>
              <h4 className="text-white font-semibold mb-4">{columna.titulo}</h4>
              <ul className="space-y-2">
                {columna.links?.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.url}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {link.texto}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8">
          {/* Copyright */}
          {isEditing ? (
            <InlineText
              value={copyright}
              onChange={(value) => onContentChange({ copyright: value })}
              placeholder="Texto de copyright"
              className="text-gray-400 text-sm text-center block"
              as="p"
            />
          ) : (
            <p className="text-gray-400 text-sm text-center">{copyright}</p>
          )}
        </div>
      </div>
    </footer>
  );
}

export default memo(FooterCanvasBlock);
