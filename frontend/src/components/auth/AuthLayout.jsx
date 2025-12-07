import { Link } from 'react-router-dom';

/**
 * AuthLayout - Layout reutilizable para páginas de autenticación
 *
 * Estilo: Minimalista con fondo gris claro y card centrada
 * Branding: Nexo
 *
 * @param {string} title - Título principal de la página
 * @param {string} subtitle - Subtítulo descriptivo
 * @param {React.ReactNode} children - Contenido del formulario
 * @param {React.ReactNode} footer - Contenido del footer (links adicionales)
 * @param {string} maxWidth - Ancho máximo de la card (default: 'max-w-md')
 */
function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-md'
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className={`${maxWidth} w-full bg-white rounded-lg shadow-lg p-8`}>
        {/* Logo/Branding */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <h2 className="text-2xl font-bold text-primary-600">Nexo</h2>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-600">
              {subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        {children}

        {/* Footer */}
        {footer && (
          <div className="mt-6 text-center">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthLayout;
