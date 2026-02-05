/**
 * ====================================================================
 * IMAGEN ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo imagen en el canvas.
 * Soporta variantes: foto, icono, avatar, logo, decoracion.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react';

// ========== VARIANTE STYLES ==========

const VARIANTE_STYLES = {
  foto: {
    className: 'object-cover',
  },
  icono: {
    className: 'object-contain max-w-16 max-h-16',
  },
  avatar: {
    className: 'object-cover rounded-full aspect-square',
  },
  logo: {
    className: 'object-contain',
  },
  decoracion: {
    className: 'object-contain opacity-50',
  },
};

const SOMBRA_CLASSES = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
};

const OBJETO_FIT_CLASSES = {
  cover: 'object-cover',
  contain: 'object-contain',
  fill: 'object-fill',
  none: 'object-none',
  'scale-down': 'object-scale-down',
};

// ========== PLACEHOLDER ==========

function ImagePlaceholder({ className }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center w-full h-full min-h-[100px]',
        'bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600',
        'rounded-lg',
        className
      )}
    >
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <ImageIcon className="w-8 h-8" />
        <span className="text-sm">Agregar imagen</span>
      </div>
    </div>
  );
}

// ========== COMPONENT ==========

function ImagenElementRenderer({
  elemento,
  tema,
}) {
  const { contenido = {}, estilos = {} } = elemento;
  const { url = '', alt = '', variante = 'foto' } = contenido;
  const {
    objetoFit = 'cover',
    borderRadius = 0,
    sombra = 'none',
    opacidad = 100,
  } = estilos;

  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estilos inline
  const inlineStyles = useMemo(() => {
    const styles = {};

    if (borderRadius) {
      styles.borderRadius = typeof borderRadius === 'number'
        ? `${borderRadius}px`
        : borderRadius;
    }

    if (opacidad < 100) {
      styles.opacity = opacidad / 100;
    }

    return styles;
  }, [borderRadius, opacidad]);

  // Clases CSS
  const className = useMemo(() => {
    return cn(
      'imagen-element w-full h-full',
      VARIANTE_STYLES[variante]?.className,
      !VARIANTE_STYLES[variante] && OBJETO_FIT_CLASSES[objetoFit],
      SOMBRA_CLASSES[sombra],
    );
  }, [variante, objetoFit, sombra]);

  // Si no hay URL o hay error, mostrar placeholder
  if (!url || hasError) {
    return <ImagePlaceholder className={className} />;
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <img
        src={url}
        alt={alt || 'Imagen'}
        className={className}
        style={inlineStyles}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        loading="lazy"
      />
    </div>
  );
}

ImagenElementRenderer.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      url: PropTypes.string,
      alt: PropTypes.string,
      variante: PropTypes.oneOf(['foto', 'icono', 'avatar', 'logo', 'decoracion']),
    }),
    estilos: PropTypes.shape({
      objetoFit: PropTypes.oneOf(['cover', 'contain', 'fill', 'none', 'scale-down']),
      borderRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      sombra: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl', '2xl']),
      opacidad: PropTypes.number,
    }),
  }).isRequired,
  tema: PropTypes.shape({
    color_primario: PropTypes.string,
  }),
};

export default memo(ImagenElementRenderer);
