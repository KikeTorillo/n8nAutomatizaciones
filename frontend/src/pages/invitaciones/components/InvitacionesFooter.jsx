/**
 * InvitacionesFooter — Footer B2C con links relevantes a invitaciones
 */
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const FOOTER_LINKS = [
  { label: 'Ejemplos', to: '/invitaciones/ejemplos' },
  { label: 'Precios', to: '/invitaciones/precios' },
  { label: 'Bodas', to: '/invitaciones/bodas' },
  { label: 'XV Años', to: '/invitaciones/xv-anos' },
  { label: 'Bautizos', to: '/invitaciones/bautizos' },
  { label: 'Cumpleaños', to: '/invitaciones/cumpleanos' },
];

const LEGAL_LINKS = [
  { label: 'Términos', to: '/terminos' },
  { label: 'Privacidad', to: '/privacidad' },
  { label: 'Contacto', to: '/contacto' },
];

export default function InvitacionesFooter() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/invitaciones" className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-pink-500" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Invitaciones <span className="text-pink-500">Nexo</span>
              </span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Crea invitaciones digitales hermosas para tus eventos especiales. Personaliza, comparte y gestiona todo en un solo lugar.
            </p>
          </div>

          {/* Tipos de evento */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
              Invitaciones
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Nexo. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
