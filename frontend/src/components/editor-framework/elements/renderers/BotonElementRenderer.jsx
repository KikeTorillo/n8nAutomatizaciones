/**
 * ====================================================================
 * BOTON ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo botón en el canvas.
 * Soporta variantes: primario, secundario, outline, ghost, link.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

// ========== VARIANTE STYLES ==========

const VARIANTE_CLASSES = {
  primario: 'bg-primary-600 hover:bg-primary-700 text-white border-transparent',
  secundario: 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 border-transparent',
  outline: 'bg-transparent hover:bg-primary-50 text-primary-600 border-primary-600 dark:hover:bg-primary-950',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-300 border-transparent',
  link: 'bg-transparent text-primary-600 hover:underline border-transparent p-0',
};

const TAMANIO_CLASSES = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2.5',
  xl: 'px-8 py-4 text-xl gap-3',
};

// ========== HELPERS ==========

function getIconComponent(iconName) {
  if (!iconName) return null;
  return LucideIcons[iconName] || null;
}

// ========== COMPONENT ==========

function BotonElementRenderer({
  elemento,
  tema,
  onClick,
  disabled = false,
}) {
  const { contenido = {}, estilos = {} } = elemento;
  const {
    texto = 'Botón',
    variante = 'primario',
    url = '',
    accion = 'link',
  } = contenido;
  const {
    tamano = 'md',
    fullWidth = false,
    icono = null,
    iconoPosicion = 'left',
    borderRadius = 6,
  } = estilos;

  // Obtener componente de icono
  const IconComponent = useMemo(() => getIconComponent(icono), [icono]);

  // Estilos inline
  const inlineStyles = useMemo(() => {
    const styles = {};

    // Usar color primario del tema si existe
    if (tema?.color_primario && variante === 'primario') {
      styles.backgroundColor = tema.color_primario;
    }
    if (tema?.color_primario && variante === 'outline') {
      styles.borderColor = tema.color_primario;
      styles.color = tema.color_primario;
    }
    if (tema?.color_primario && variante === 'link') {
      styles.color = tema.color_primario;
    }

    if (borderRadius) {
      styles.borderRadius = typeof borderRadius === 'number'
        ? `${borderRadius}px`
        : borderRadius;
    }

    return styles;
  }, [tema, variante, borderRadius]);

  // Clases CSS
  const className = useMemo(() => {
    return cn(
      'boton-element inline-flex items-center justify-center',
      'font-medium transition-colors duration-200',
      'border-2 cursor-pointer',
      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      VARIANTE_CLASSES[variante],
      TAMANIO_CLASSES[tamano],
      fullWidth && 'w-full',
      disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    );
  }, [variante, tamano, fullWidth, disabled]);

  // Tamaño del icono según tamaño del botón
  const iconSize = useMemo(() => {
    switch (tamano) {
      case 'sm': return 14;
      case 'md': return 16;
      case 'lg': return 20;
      case 'xl': return 24;
      default: return 16;
    }
  }, [tamano]);

  // Handler de click
  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    if (onClick) {
      onClick(e);
      return;
    }

    // Comportamiento por defecto según acción
    if (accion === 'link' && url) {
      // En el canvas del editor no navegamos
      e.preventDefault();
    } else if (accion === 'scroll' && url) {
      // Scroll a elemento
      e.preventDefault();
    }
  };

  // Contenido del botón
  const buttonContent = (
    <>
      {IconComponent && iconoPosicion === 'left' && (
        <IconComponent size={iconSize} />
      )}
      <span>{texto}</span>
      {IconComponent && iconoPosicion === 'right' && (
        <IconComponent size={iconSize} />
      )}
    </>
  );

  // Renderizar como link o botón según configuración
  if (accion === 'link' && url && !disabled) {
    return (
      <a
        href={url}
        className={className}
        style={inlineStyles}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
      >
        {buttonContent}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={inlineStyles}
      onClick={handleClick}
      disabled={disabled}
    >
      {buttonContent}
    </button>
  );
}

BotonElementRenderer.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      texto: PropTypes.string,
      variante: PropTypes.oneOf(['primario', 'secundario', 'outline', 'ghost', 'link']),
      url: PropTypes.string,
      accion: PropTypes.oneOf(['link', 'scroll', 'modal']),
    }),
    estilos: PropTypes.shape({
      tamano: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
      fullWidth: PropTypes.bool,
      icono: PropTypes.string,
      iconoPosicion: PropTypes.oneOf(['left', 'right']),
      borderRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  }).isRequired,
  tema: PropTypes.shape({
    color_primario: PropTypes.string,
  }),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};

export default memo(BotonElementRenderer);
