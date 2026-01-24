import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../atoms/Button';

/**
 * Componente BackButton reutilizable
 * Botón de navegación "Volver" con estilo consistente en toda la app
 *
 * @param {string} to - Ruta a navegar (opcional, default: navigate(-1))
 * @param {string} label - Texto del botón (default: "Volver")
 * @param {string} className - Clases adicionales
 */
const BackButton = memo(function BackButton({ to, label = 'Volver', className = '' }) {
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
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={className}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
});

BackButton.displayName = 'BackButton';

export { BackButton };
export default BackButton;
