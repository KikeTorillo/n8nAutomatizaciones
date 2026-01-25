import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { BackButton } from '../../molecules/BackButton';
import { Badge } from '../../atoms/Badge';

/**
 * DetailHeader - Header para páginas de detalle
 *
 * Incluye botón volver, título, subtítulo, badges y acciones.
 *
 * @param {string} backTo - Ruta para volver
 * @param {string} backLabel - Texto del botón volver
 * @param {string} title - Título principal
 * @param {string} subtitle - Subtítulo
 * @param {React.ComponentType} icon - Icono junto al título
 * @param {Array} badges - Array de badges [{label, variant}]
 * @param {ReactNode} actions - Botones de acción
 * @param {string} className - Clases adicionales
 */
const DetailHeader = memo(function DetailHeader({
  backTo,
  backLabel,
  title,
  subtitle,
  icon: Icon,
  badges = [],
  actions,
  className,
}) {
  return (
    <div className={cn('mb-6', className)}>
      {/* Back button */}
      {backTo && (
        <div className="mb-4">
          <BackButton to={backTo} label={backLabel} />
        </div>
      )}

      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex-shrink-0 p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {title && (
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {title}
                </h1>
              )}

              {badges.map((badge, idx) => (
                <Badge key={idx} variant={badge.variant || 'default'}>
                  {badge.label}
                </Badge>
              ))}
            </div>

            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
});

DetailHeader.displayName = 'DetailHeader';

DetailHeader.propTypes = {
  /** Ruta para volver */
  backTo: PropTypes.string,
  /** Texto del botón volver */
  backLabel: PropTypes.string,
  /** Título principal */
  title: PropTypes.string,
  /** Subtítulo */
  subtitle: PropTypes.string,
  /** Icono (componente Lucide) */
  icon: PropTypes.elementType,
  /** Array de badges */
  badges: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    variant: PropTypes.string,
  })),
  /** Botones de acción */
  actions: PropTypes.node,
  /** Clases adicionales */
  className: PropTypes.string,
};

export { DetailHeader };
