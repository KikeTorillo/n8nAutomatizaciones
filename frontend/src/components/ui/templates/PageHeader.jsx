import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { BackButton } from '../molecules/BackButton';
import { Badge } from '../atoms/Badge';
import { PAGE_HEADER_STYLES, getPageHeaderIconColor } from '@/lib/uiConstants/pageHeader';

/**
 * PageHeader - Header reutilizable para páginas de detalle/edición
 *
 * Incluye navegación (back button), título con icono temático, badges,
 * metadata y área de acciones.
 *
 * @example
 * <PageHeader
 *   backTo="/productos"
 *   backLabel="Volver a productos"
 *   icon={Package}
 *   iconColor="green"
 *   title="Laptop Gaming Pro"
 *   subtitle="SKU: LAP-001"
 *   badges={[{ label: 'Activo', variant: 'success' }]}
 *   metadata={[
 *     { icon: Tag, label: '$1,299.00' },
 *     { icon: Box, label: '25 unidades' }
 *   ]}
 *   actions={<Button>Editar</Button>}
 * />
 *
 * @param {Object} props
 * @param {string} [props.backTo] - Ruta para el botón volver
 * @param {string} [props.backLabel] - Texto del botón volver
 * @param {React.ComponentType} [props.icon] - Icono principal (componente Lucide)
 * @param {string} [props.iconColor] - Color del icono: 'primary'|'pink'|'green'|'blue'|'purple'|'orange'|'red'|'yellow'|'cyan'|'neutral'
 * @param {string} props.title - Título principal
 * @param {string} [props.subtitle] - Subtítulo/descripción
 * @param {Array<{label: string, variant?: string}>} [props.badges] - Array de badges
 * @param {Array<{icon: React.ComponentType, label: string}>} [props.metadata] - Array de metadata items
 * @param {React.ReactNode} [props.actions] - Botones de acción
 * @param {string} [props.className] - Clases adicionales
 */
const PageHeader = memo(function PageHeader({
  backTo,
  backLabel,
  icon: Icon,
  iconColor = 'primary',
  title,
  subtitle,
  badges = [],
  metadata = [],
  actions,
  className,
}) {
  const iconColors = getPageHeaderIconColor(iconColor);

  return (
    <div className={cn(PAGE_HEADER_STYLES.container, className)}>
      {/* Back button */}
      {backTo && (
        <div className={PAGE_HEADER_STYLES.backButton}>
          <BackButton to={backTo} label={backLabel} />
        </div>
      )}

      {/* Title row */}
      <div className={PAGE_HEADER_STYLES.titleRow}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          {Icon && (
            <div className={cn(PAGE_HEADER_STYLES.iconWrapper, iconColors.bg)}>
              <Icon className={cn('w-6 h-6', iconColors.icon)} />
            </div>
          )}

          {/* Title content */}
          <div className={PAGE_HEADER_STYLES.titleContainer}>
            {/* Title + Badges row */}
            <div className={PAGE_HEADER_STYLES.titleBadgeRow}>
              {title && (
                <h1 className={cn(PAGE_HEADER_STYLES.title, 'truncate')}>
                  {title}
                </h1>
              )}

              {badges.map((badge, idx) => (
                <Badge key={idx} variant={badge.variant || 'default'}>
                  {badge.label}
                </Badge>
              ))}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p className={PAGE_HEADER_STYLES.subtitle}>
                {subtitle}
              </p>
            )}

            {/* Metadata */}
            {metadata.length > 0 && (
              <div className={PAGE_HEADER_STYLES.metadataContainer}>
                {metadata.map((item, idx) => {
                  const MetaIcon = item.icon;
                  return (
                    <span key={idx} className={PAGE_HEADER_STYLES.metadataItem}>
                      {MetaIcon && (
                        <MetaIcon className={PAGE_HEADER_STYLES.metadataIcon} />
                      )}
                      {item.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className={PAGE_HEADER_STYLES.actionsContainer}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
});

PageHeader.displayName = 'PageHeader';

PageHeader.propTypes = {
  /** Ruta para el botón volver */
  backTo: PropTypes.string,
  /** Texto del botón volver */
  backLabel: PropTypes.string,
  /** Icono principal (componente Lucide) */
  icon: PropTypes.elementType,
  /** Color del icono */
  iconColor: PropTypes.oneOf([
    'primary', 'pink', 'green', 'blue', 'purple',
    'orange', 'red', 'yellow', 'cyan', 'neutral'
  ]),
  /** Título principal */
  title: PropTypes.string.isRequired,
  /** Subtítulo/descripción */
  subtitle: PropTypes.string,
  /** Array de badges */
  badges: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    variant: PropTypes.string,
  })),
  /** Array de metadata items */
  metadata: PropTypes.arrayOf(PropTypes.shape({
    icon: PropTypes.elementType,
    label: PropTypes.string.isRequired,
  })),
  /** Botones de acción */
  actions: PropTypes.node,
  /** Clases adicionales */
  className: PropTypes.string,
};

export { PageHeader };
