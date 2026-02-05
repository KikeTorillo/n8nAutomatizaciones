import { memo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../atoms/Button';
import type { ButtonVariant, Size } from '@/types/ui';

type ButtonSize = Size | 'xl';

export interface BackButtonProps {
  /** Ruta a navegar (opcional, default: navigate(-1)) */
  to?: string;
  /** Texto del botón (default: "Volver") */
  label?: string;
  /** Variante del botón (default: "outline") */
  variant?: ButtonVariant;
  /** Tamaño del botón (default: "sm") */
  size?: ButtonSize;
  /** Solo mostrar icono sin texto (útil para móvil) */
  iconOnly?: boolean;
  /** Clases adicionales */
  className?: string;
}

/**
 * Componente BackButton reutilizable
 * Botón de navegación "Volver" con estilo consistente en toda la app
 */
const BackButton = memo(forwardRef<HTMLButtonElement, BackButtonProps>(function BackButton({
  to,
  label = 'Volver',
  variant = 'outline',
  size = 'sm',
  iconOnly = false,
  className = ''
}, ref) {
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
      ref={ref}
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
}));

BackButton.displayName = 'BackButton';

export { BackButton };
