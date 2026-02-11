import { memo, forwardRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../atoms/Button';
import { useUILibraryRouter, useUIMessages } from '../providers';
import type { ButtonVariant, Size } from '../types';

type ButtonSize = Size | 'xl';

export interface BackButtonProps {
  /** Ruta a navegar (opcional, default: navigate(-1)) */
  to?: string;
  /** Handler personalizado de click (prioridad sobre to y navigate(-1)) */
  onClick?: () => void;
  /** Handler de navegación inyectable (prioridad sobre provider) */
  onNavigate?: (to: string | number) => void;
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
 *
 * Prioridad de navegación: onClick > onNavigate prop > provider navigate > console.warn
 */
const BackButton = memo(
  forwardRef<HTMLButtonElement, BackButtonProps>(function BackButton(
    {
      to,
      onClick,
      onNavigate,
      label,
      variant = 'outline',
      size = 'sm',
      iconOnly = false,
      className = '',
    },
    ref
  ) {
    const router = useUILibraryRouter();
    const { actions } = useUIMessages();
    const resolvedLabel = label ?? actions.back;

    const handleClick = () => {
      if (onClick) {
        onClick();
      } else {
        const nav = onNavigate || router?.navigate;
        if (nav) {
          nav(to || -1);
        } else {
          console.warn(
            '[BackButton] No navigate function available. Provide onClick, onNavigate, or wrap in UILibraryProvider.'
          );
        }
      }
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
        aria-label={iconOnly ? resolvedLabel : undefined}
      >
        <ArrowLeft className={`w-4 h-4 ${iconOnly ? '' : 'mr-2'}`} />
        {!iconOnly && resolvedLabel}
      </Button>
    );
  })
);

BackButton.displayName = 'BackButton';

export { BackButton };
