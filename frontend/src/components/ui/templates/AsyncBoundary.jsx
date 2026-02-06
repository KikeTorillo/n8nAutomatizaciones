import { memo } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { SkeletonTable } from '../molecules/SkeletonTable';
import { Alert } from '../molecules/Alert';
import { EmptyState } from '../molecules/EmptyState';
import { Button } from '../atoms/Button';

/**
 * AsyncBoundary - Wrapper declarativo para estados async
 *
 * Maneja automáticamente la transición: loading → error → empty → content
 *
 * @example
 * <AsyncBoundary
 *   isLoading={isLoading}
 *   isError={!!error}
 *   error={error}
 *   isEmpty={!data?.length}
 *   loadingType="skeleton"
 *   skeletonProps={{ rows: 5 }}
 *   emptyTitle="Sin productos"
 *   emptyIcon={Package}
 *   onRetry={refetch}
 * >
 *   <DataTable data={data} />
 * </AsyncBoundary>
 *
 * @param {Object} props
 * @param {boolean} props.isLoading - Estado de carga
 * @param {boolean} [props.isError] - Si hay un error
 * @param {Error|Object} [props.error] - Objeto de error
 * @param {boolean} [props.isEmpty] - Si los datos están vacíos
 * @param {'spinner'|'skeleton'} [props.loadingType] - Tipo de loading (default: 'spinner')
 * @param {string} [props.loadingText] - Texto durante loading
 * @param {Object} [props.skeletonProps] - Props para SkeletonTable {rows, columns, showHeader}
 * @param {string} [props.errorTitle] - Título del error (default: 'Error al cargar')
 * @param {string} [props.errorMessage] - Mensaje de error personalizado
 * @param {Function} [props.onRetry] - Callback para reintentar
 * @param {React.ComponentType} [props.emptyIcon] - Icono del estado vacío
 * @param {string} [props.emptyTitle] - Título del estado vacío
 * @param {string} [props.emptyDescription] - Descripción del estado vacío
 * @param {string} [props.emptyActionLabel] - Texto del botón de acción vacío
 * @param {Function} [props.onEmptyAction] - Callback del botón de acción vacío
 * @param {React.ReactNode} props.children - Contenido a renderizar cuando hay datos
 * @param {string} [props.className] - Clases adicionales para el contenedor
 */
const AsyncBoundary = memo(function AsyncBoundary({
  isLoading,
  isError = false,
  error,
  isEmpty = false,
  loadingType = 'spinner',
  loadingText = 'Cargando...',
  skeletonProps = {},
  errorTitle = 'Error al cargar',
  errorMessage,
  onRetry,
  emptyIcon,
  emptyTitle = 'Sin datos',
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  children,
  className,
}) {
  // Estado: Loading
  if (isLoading) {
    if (loadingType === 'skeleton') {
      return (
        <SkeletonTable
          rows={skeletonProps.rows ?? 5}
          columns={skeletonProps.columns ?? 4}
          showHeader={skeletonProps.showHeader ?? true}
          columnWidths={skeletonProps.columnWidths}
          className={className}
        />
      );
    }

    return (
      <div className={`flex items-center justify-center py-12 ${className || ''}`}>
        <LoadingSpinner size="lg" text={loadingText} />
      </div>
    );
  }

  // Estado: Error
  if (isError) {
    const message = errorMessage || error?.message || 'Ocurrió un error inesperado';

    return (
      <div className={`py-8 ${className || ''}`}>
        <Alert
          variant="danger"
          icon={AlertCircle}
          title={errorTitle}
          action={onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          )}
        >
          {message}
        </Alert>
      </div>
    );
  }

  // Estado: Empty
  if (isEmpty) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        className={className}
      />
    );
  }

  // Estado: Content
  return children;
});

AsyncBoundary.displayName = 'AsyncBoundary';

AsyncBoundary.propTypes = {
  /** Estado de carga */
  isLoading: PropTypes.bool.isRequired,
  /** Si hay un error */
  isError: PropTypes.bool,
  /** Objeto de error */
  error: PropTypes.oneOfType([
    PropTypes.instanceOf(Error),
    PropTypes.shape({ message: PropTypes.string }),
  ]),
  /** Si los datos están vacíos */
  isEmpty: PropTypes.bool,
  /** Tipo de loading: 'spinner' o 'skeleton' */
  loadingType: PropTypes.oneOf(['spinner', 'skeleton']),
  /** Texto durante loading (para spinner) */
  loadingText: PropTypes.string,
  /** Props para SkeletonTable */
  skeletonProps: PropTypes.shape({
    rows: PropTypes.number,
    columns: PropTypes.number,
    showHeader: PropTypes.bool,
    columnWidths: PropTypes.arrayOf(PropTypes.oneOf(['sm', 'md', 'lg', 'xl'])),
  }),
  /** Título del error */
  errorTitle: PropTypes.string,
  /** Mensaje de error personalizado */
  errorMessage: PropTypes.string,
  /** Callback para reintentar */
  onRetry: PropTypes.func,
  /** Icono del estado vacío (componente Lucide) */
  emptyIcon: PropTypes.elementType,
  /** Título del estado vacío */
  emptyTitle: PropTypes.string,
  /** Descripción del estado vacío */
  emptyDescription: PropTypes.string,
  /** Texto del botón de acción vacío */
  emptyActionLabel: PropTypes.string,
  /** Callback del botón de acción vacío */
  onEmptyAction: PropTypes.func,
  /** Contenido a renderizar cuando hay datos */
  children: PropTypes.node.isRequired,
  /** Clases adicionales */
  className: PropTypes.string,
};

export { AsyncBoundary };
