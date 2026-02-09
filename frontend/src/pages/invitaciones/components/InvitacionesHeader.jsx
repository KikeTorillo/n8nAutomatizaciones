/**
 * InvitacionesHeader — Header B2C para invitaciones digitales
 * Tema rosa (#ec4899), navegación horizontal, CTAs contextuales
 */
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Heart } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ui';
import { useAuthStore, selectUser, selectIsAuthenticated, selectLogout } from '@/store';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Ejemplos', to: '/invitaciones/ejemplos' },
  { label: 'Precios', to: '/invitaciones/precios' },
];

export default function InvitacionesHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const logout = useAuthStore(selectLogout);

  const handleLogout = () => {
    logout();
    navigate('/invitaciones');
  };

  return (
    <header className="sticky top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-50 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/invitaciones" className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Invitaciones <span className="text-pink-500">Nexo</span>
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="hidden sm:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/invitaciones/mis-eventos"
                    className="px-4 py-2 text-pink-600 dark:text-pink-400 font-medium hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                  >
                    Mis eventos
                  </Link>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                      {user?.nombre || user?.email?.split('@')[0] || 'Usuario'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/invitaciones/crear"
                    className="px-4 py-2 bg-pink-500 text-white font-medium rounded-lg hover:bg-pink-600 transition-colors"
                  >
                    Crear invitación
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-gray-600 dark:text-gray-300"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden py-4 border-t border-gray-100 dark:border-gray-800">
            <nav className="flex flex-col gap-2 mb-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/invitaciones/mis-eventos"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-pink-600 dark:text-pink-400 font-medium hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                  >
                    Mis eventos
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/invitaciones/crear"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 bg-pink-500 text-white font-medium rounded-lg hover:bg-pink-600 transition-colors text-center"
                  >
                    Crear invitación
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
