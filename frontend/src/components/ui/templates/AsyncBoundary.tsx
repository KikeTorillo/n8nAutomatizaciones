import { memo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { SkeletonTable } from '../molecules/SkeletonTable';
import { Alert } from '../molecules/Alert';
import { EmptyState } from '../molecules/EmptyState';
import { Button } from '../atoms/Button';

type LucideIcon = React.ComponentType<{ className?: string }>;
type SkeletonColumnWidth = 'sm' | 'md' | 'lg' | 'xl';

interface SkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  columnWidths?: SkeletonColumnWidth[];
}

interface AsyncBoundaryProps {
  isLoading: boolean;
  isError?: boolean;
  error?: Error | { message?: string } | null;
  isEmpty?: boolean;
  loadingType?: 'spinner' | 'skeleton';
  loadingText?: string;
  skeletonProps?: SkeletonProps;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  children: React.ReactNode;
  className?: string;
}

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
}: AsyncBoundaryProps) {
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

export { AsyncBoundary };
export type { AsyncBoundaryProps, SkeletonProps, SkeletonColumnWidth };
