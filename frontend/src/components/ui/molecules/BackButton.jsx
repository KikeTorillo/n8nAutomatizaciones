import { memo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../atoms/Button';

/**
 * Componente BackButton reutilizable
 * Botón de navegación "Volver" con estilo consistente en toda la app
 *
 * @param {string} to - Ruta a navegar (opcional, default: navigate(-1))
 * @param {string} label - Texto del botón (default: "Volver")
 * @param {string} variant - Variante del botón (default: "outline")
 * @param {string} size - Tamaño del botón (default: "sm")
 * @param {string} className - Clases adicionales
 */
const BackButton = memo(function BackButton({
  to,
  label = 'Volver',
  variant = 'outline',
  size = 'sm',
  className = ''
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
});

BackButton.displayName = 'BackButton';

BackButton.propTypes = {
  to: PropTypes.string,
  label: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'danger', 'ghost', 'warning', 'success', 'link']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
};

export { BackButton };
export default BackButton;
