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
 * @param {boolean} iconOnly - Solo mostrar icono sin texto (útil para móvil)
 * @param {string} className - Clases adicionales
 */
const BackButton = memo(function BackButton({
  to,
  label = 'Volver',
  variant = 'outline',
  size = 'sm',
  iconOnly = false,
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
      aria-label={iconOnly ? label : undefined}
    >
      <ArrowLeft className={`w-4 h-4 ${iconOnly ? '' : 'mr-2'}`} />
      {!iconOnly && label}
    </Button>
  );
});

BackButton.displayName = 'BackButton';

BackButton.propTypes = {
  to: PropTypes.string,
  label: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'danger', 'ghost', 'warning', 'success', 'link']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  iconOnly: PropTypes.bool,
  className: PropTypes.string,
};

export { BackButton };
