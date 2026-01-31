import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { BackButton } from '../../molecules/BackButton';
import { SEMANTIC_COLORS } from '@/lib/uiConstants';

/**
 * FormHeader - Header para páginas de formulario
 */
const FormHeader = memo(function FormHeader({
  title,
  subtitle,
  icon: Icon,
  backTo,
  backLabel,
  className,
}) {
  return (
    <div className={cn('mb-6', className)}>
      {backTo && (
        <div className="mb-4">
          <BackButton to={backTo} label={backLabel} />
        </div>
      )}

      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cn('flex-shrink-0 p-2 rounded-lg', SEMANTIC_COLORS.primary.bg)}>
            <Icon className={cn('w-6 h-6', SEMANTIC_COLORS.primary.icon)} />
          </div>
        )}

        <div>
          {title && (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

FormHeader.displayName = 'FormHeader';

FormHeader.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  backTo: PropTypes.string,
  backLabel: PropTypes.string,
  className: PropTypes.string,
};

export { FormHeader };
