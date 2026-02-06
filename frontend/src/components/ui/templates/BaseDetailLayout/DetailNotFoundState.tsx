import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { EmptyState } from '../../molecules/EmptyState';

interface NotFoundConfig {
  title?: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
}

interface DetailNotFoundStateProps {
  config?: NotFoundConfig;
}

const DetailNotFoundState = memo(function DetailNotFoundState({
  config = {},
}: DetailNotFoundStateProps) {
  const navigate = useNavigate();

  const {
    title = 'No encontrado',
    description = 'El recurso que buscas no existe o fue eliminado.',
    backTo,
    backLabel = 'Volver',
  } = config;

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <EmptyState
        icon={AlertCircle}
        title={title}
        description={description}
        actionLabel={backTo ? backLabel : undefined}
        onAction={backTo ? () => navigate(backTo) : undefined}
      />
    </div>
  );
});

DetailNotFoundState.displayName = 'DetailNotFoundState';

export { DetailNotFoundState };
