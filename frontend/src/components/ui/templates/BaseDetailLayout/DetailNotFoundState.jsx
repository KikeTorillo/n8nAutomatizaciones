import { memo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { EmptyState } from '../../atoms/EmptyState';

/**
 * DetailNotFoundState - Estado cuando no se encuentra el recurso
 *
 * @param {Object} config - Configuración personalizada
 * @param {string} config.title - Título del mensaje
 * @param {string} config.description - Descripción
 * @param {string} config.backTo - Ruta para volver
 * @param {string} config.backLabel - Texto del botón volver
 */
const DetailNotFoundState = memo(function DetailNotFoundState({
  config = {},
}) {
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

DetailNotFoundState.propTypes = {
  config: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    backTo: PropTypes.string,
    backLabel: PropTypes.string,
  }),
};

export { DetailNotFoundState };
