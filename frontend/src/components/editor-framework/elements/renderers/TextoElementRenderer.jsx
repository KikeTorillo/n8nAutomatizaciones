/**
 * ====================================================================
 * TEXTO ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo texto en el canvas.
 * Soporta variantes: titulo, subtitulo, parrafo, cita, etiqueta.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

// ========== VARIANTE STYLES ==========

const VARIANTE_CLASSES = {
  titulo: 'text-4xl md:text-5xl lg:text-6xl font-bold',
  subtitulo: 'text-xl md:text-2xl lg:text-3xl font-medium',
  parrafo: 'text-base md:text-lg',
  cita: 'text-lg md:text-xl italic border-l-4 pl-4',
  etiqueta: 'text-xs md:text-sm uppercase tracking-widest font-semibold',
};

const TAMANIO_CLASSES = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
};

const PESO_CLASSES = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
};

const ALINEACION_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

// ========== COMPONENT ==========

function TextoElementRenderer({
  elemento,
  tema,
  isEditing = false,
  onTextChange,
}) {
  const { contenido = {}, estilos = {} } = elemento;
  const { texto = '', variante = 'parrafo' } = contenido;
  const {
    fuente,
    tamano,
    color,
    alineacion = 'center',
    peso,
    espaciadoLetras = 0,
    espaciadoLineas = 1.5,
  } = estilos;

  // Calcular estilos inline
  const inlineStyles = useMemo(() => {
    const styles = {};

    // Fuente - usar tema si no está especificada
    if (fuente) {
      styles.fontFamily = fuente;
    } else if (tema) {
      styles.fontFamily = variante === 'titulo' || variante === 'subtitulo'
        ? (tema.fuente_titulo || tema.fuente_titulos)
        : tema.fuente_cuerpo;
    }

    // Color - usar tema si no está especificado
    if (color) {
      styles.color = color;
    } else if (tema?.color_primario && (variante === 'titulo' || variante === 'etiqueta')) {
      // Los títulos pueden usar el color primario del tema
      // Por defecto dejamos que hereden el color del padre
    }

    // Espaciado
    if (espaciadoLetras) {
      styles.letterSpacing = `${espaciadoLetras}em`;
    }
    if (espaciadoLineas) {
      styles.lineHeight = espaciadoLineas;
    }

    return styles;
  }, [fuente, color, espaciadoLetras, espaciadoLineas, tema, variante]);

  // Clases CSS
  const className = useMemo(() => {
    return cn(
      'texto-element w-full',
      // Variante base (si no hay tamaño específico)
      !tamano && VARIANTE_CLASSES[variante],
      // Tamaño específico sobrescribe variante
      tamano && TAMANIO_CLASSES[tamano],
      // Peso
      peso && PESO_CLASSES[peso],
      // Alineación
      ALINEACION_CLASSES[alineacion],
      // Cita especial
      variante === 'cita' && 'border-current/30',
    );
  }, [variante, tamano, peso, alineacion]);

  // En modo edición, renderizar input editable
  if (isEditing) {
    return (
      <div
        className={className}
        style={inlineStyles}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onTextChange?.(e.target.innerText)}
        dangerouslySetInnerHTML={{ __html: texto }}
      />
    );
  }

  // Determinar el tag HTML según variante
  const Tag = useMemo(() => {
    switch (variante) {
      case 'titulo':
        return 'h1';
      case 'subtitulo':
        return 'h2';
      case 'cita':
        return 'blockquote';
      case 'etiqueta':
        return 'span';
      default:
        return 'p';
    }
  }, [variante]);

  return (
    <Tag
      className={className}
      style={inlineStyles}
    >
      {texto}
    </Tag>
  );
}

TextoElementRenderer.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      texto: PropTypes.string,
      variante: PropTypes.oneOf(['titulo', 'subtitulo', 'parrafo', 'cita', 'etiqueta']),
    }),
    estilos: PropTypes.shape({
      fuente: PropTypes.string,
      tamano: PropTypes.string,
      color: PropTypes.string,
      alineacion: PropTypes.oneOf(['left', 'center', 'right', 'justify']),
      peso: PropTypes.string,
      espaciadoLetras: PropTypes.number,
      espaciadoLineas: PropTypes.number,
    }),
  }).isRequired,
  tema: PropTypes.shape({
    color_primario: PropTypes.string,
    fuente_titulos: PropTypes.string,
    fuente_cuerpo: PropTypes.string,
  }),
  isEditing: PropTypes.bool,
  onTextChange: PropTypes.func,
};

export default memo(TextoElementRenderer);
