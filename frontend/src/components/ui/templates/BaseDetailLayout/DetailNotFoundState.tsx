import { memo } from 'react';
import { AlertCircle } from 'lucide-react';
import { EmptyState } from '../../molecules/EmptyState';

interface NotFoundConfig {
  title?: string;
  description?: string;
  backLabel?: string;
}

interface DetailNotFoundStateProps {
  config?: NotFoundConfig;
  /** Callback para el botón de volver (modo controlado, sin router) */
  onBack?: () => void;
}

const DetailNotFoundState = memo(function DetailNotFoundState({
  config = {},
  onBack,
}: DetailNotFoundStateProps) {
  const {
    title = 'No encontrado',
    description = 'El recurso que buscas no existe o fue eliminado.',
    backLabel = 'Volver',
  } = config;

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <EmptyState
        icon={AlertCircle}
        title={title}
        description={description}
        actionLabel={onBack ? backLabel : undefined}
        onAction={onBack}
      />
    </div>
  );
});

DetailNotFoundState.displayName = 'DetailNotFoundState';

export { DetailNotFoundState };
