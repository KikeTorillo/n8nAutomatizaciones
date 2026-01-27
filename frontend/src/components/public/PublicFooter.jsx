/**
 * PublicFooter - Footer reutilizable para páginas públicas
 */
import { Link } from 'react-router-dom';
import { NexoLogo } from './NexoLogo';

const FOOTER_LINKS = [
  { label: 'Términos', to: '/terminos' },
  { label: 'Privacidad', to: '/privacidad' },
  { label: 'Contacto', to: '/contacto' },
];

export function PublicFooter({ links = FOOTER_LINKS }) {
  return (
    <footer className="py-12 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <NexoLogo linkTo={null} />

          <p className="text-gray-600 dark:text-gray-400 text-sm">
            © {new Date().getFullYear()} Nexo. Sistema de Gestión Empresarial.
          </p>

          <div className="flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
