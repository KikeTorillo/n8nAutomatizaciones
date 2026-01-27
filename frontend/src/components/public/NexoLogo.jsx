/**
 * NexoLogo - Componente reutilizable del logo de Nexo
 *
 * Usado en: Header, Footer, páginas públicas
 */
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function NexoLogo({
  size = 'md',
  showText = true,
  linkTo = '/',
  className
}) {
  const sizes = {
    sm: { container: 'w-6 h-6', text: 'text-sm', logo: 'text-base' },
    md: { container: 'w-8 h-8', text: 'text-xl', logo: 'text-lg' },
    lg: { container: 'w-12 h-12', text: 'text-2xl', logo: 'text-2xl' },
    xl: { container: 'w-20 h-20', text: 'text-4xl', logo: 'text-3xl' },
  };

  const s = sizes[size] || sizes.md;

  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        s.container,
        'bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center'
      )}>
        <span className={cn('text-white font-bold', s.logo)}>N</span>
      </div>
      {showText && (
        <span className={cn('font-bold text-gray-900 dark:text-white', s.text)}>
          Nexo
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

export default NexoLogo;
