/**
 * PublicHeader - Header reutilizable para páginas públicas
 *
 * Variantes:
 * - landing: Links de navegación scroll (#modulos, #ia, etc.)
 * - simple: Solo logo + acciones (login/registro)
 * - back: Logo + botón volver + acciones
 *
 * Detecta automáticamente si el usuario está autenticado y muestra:
 * - Si NO autenticado: Iniciar Sesión + Empezar Gratis
 * - Si autenticado: Nombre usuario + Cerrar Sesión
 */
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle, BackButton } from '@/components/ui';
import { NexoLogo } from './NexoLogo';
import { useAuthStore, selectUser, selectIsAuthenticated, selectLogout } from '@/store';
import { cn } from '@/lib/utils';

const LANDING_NAV_ITEMS = [
  { label: 'Módulos', href: '#modulos' },
  { label: 'IA Conversacional', href: '#ia' },
  { label: 'Beneficios', href: '#beneficios' },
  { label: 'Planes', href: '#planes' },
];

export function PublicHeader({
  variant = 'landing',
  backTo = '/',
  backLabel = 'Volver',
  position = 'fixed', // 'fixed' | 'sticky'
  navItems = LANDING_NAV_ITEMS,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Detectar autenticación desde el store
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const logout = useAuthStore(selectLogout);

  const isLanding = variant === 'landing';
  const showBack = variant === 'back';

  // Determinar a dónde va "Volver" según el contexto
  const getBackDestination = () => {
    // Siempre respetar el backTo que se pasa como prop
    return backTo;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={cn(
      'top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-50',
      'border-b border-gray-100 dark:border-gray-800',
      position === 'fixed' ? 'fixed' : 'sticky'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Lado izquierdo: Logo o Back + Logo */}
          <div className="flex items-center gap-4">
            {showBack && (
              <>
                <BackButton
                  to={getBackDestination()}
                  label={backLabel}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-transparent"
                />
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
              </>
            )}
            <NexoLogo />
          </div>

          {/* Centro: Navegación (solo landing) */}
          {isLanding && (
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}

          {/* Lado derecho: Acciones */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Desktop - Acciones según autenticación */}
            <div className="hidden sm:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* Usuario autenticado */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                      {user?.nombre || user?.email?.split('@')[0] || 'Usuario'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  {/* Usuario no autenticado */}
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/registro"
                    className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Empezar Gratis
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
            {isLanding && (
              <nav className="flex flex-col gap-2 mb-4">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            )}

            {/* Acciones móvil según autenticación */}
            <div className="flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user?.nombre || user?.email?.split('@')[0] || 'Usuario'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
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
                    to="/registro"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-center"
                  >
                    Empezar Gratis
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

export default PublicHeader;
