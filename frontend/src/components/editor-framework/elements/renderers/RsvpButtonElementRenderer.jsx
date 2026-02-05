/**
 * ====================================================================
 * RSVP BUTTON ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo rsvp_button (botón de confirmación) en el canvas.
 * Versión simplificada del RSVP - solo el botón de llamada a la acción.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { UserCheck, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ========== COMPONENT ==========

function RsvpButtonElementRenderer({
  elemento,
  tema,
  invitado,
  onRsvpClick,
  isEditing = false,
}) {
  const { contenido = {}, estilos = {} } = elemento;

  // Configuración
  const texto = contenido.texto || 'Confirmar Asistencia';
  const textoConfirmado = contenido.texto_confirmado || '¡Confirmado!';
  const variante = contenido.variante || 'primario';
  const mostrarIcono = contenido.mostrar_icono !== false;
  const tamano = contenido.tamano || 'lg';

  // Colores
  const colorPrimario = estilos.color_primario || tema?.color_primario || '#753572';
  const colorSecundario = estilos.color_secundario || tema?.color_secundario || '#fce7f3';

  // Estado del invitado
  const yaConfirmado = invitado?.estado_rsvp === 'confirmado';
  const yaRespondio = invitado?.estado_rsvp && invitado.estado_rsvp !== 'pendiente';

  // Tamaños
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  // Estilos de botón según variante
  const buttonStyles = useMemo(() => {
    if (yaConfirmado && !isEditing) {
      return {
        backgroundColor: '#10b981',
        color: 'white',
        cursor: 'default',
      };
    }

    switch (variante) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: colorPrimario,
          border: `2px solid ${colorPrimario}`,
        };
      case 'minimal':
        return {
          backgroundColor: 'transparent',
          color: colorPrimario,
          textDecoration: 'underline',
          textUnderlineOffset: '4px',
        };
      case 'secundario':
        return {
          backgroundColor: colorSecundario,
          color: colorPrimario,
        };
      case 'primario':
      default:
        return {
          backgroundColor: colorPrimario,
          color: 'white',
        };
    }
  }, [variante, colorPrimario, colorSecundario, yaConfirmado, isEditing]);

  // Handler de click
  const handleClick = (e) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    if (yaRespondio) {
      e.preventDefault();
      return;
    }
    if (onRsvpClick) {
      onRsvpClick();
    }
  };

  // Icono a mostrar
  const Icon = yaConfirmado && !isEditing ? Check : UserCheck;

  return (
    <div className="rsvp-button-element w-full flex justify-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={yaRespondio && !isEditing}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-full',
          'transition-all duration-200',
          !isEditing && !yaRespondio && 'hover:scale-105 hover:shadow-lg',
          sizeClasses[tamano],
          variante === 'minimal' && 'rounded-none',
        )}
        style={buttonStyles}
      >
        {mostrarIcono && <Icon className="w-5 h-5" />}
        {yaConfirmado && !isEditing ? textoConfirmado : texto}
        {!yaRespondio && variante === 'minimal' && (
          <ArrowRight className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

RsvpButtonElementRenderer.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      texto: PropTypes.string,
      texto_confirmado: PropTypes.string,
      variante: PropTypes.oneOf(['primario', 'secundario', 'outline', 'minimal']),
      mostrar_icono: PropTypes.bool,
      tamano: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
    }),
    estilos: PropTypes.object,
  }).isRequired,
  tema: PropTypes.shape({
    color_primario: PropTypes.string,
    color_secundario: PropTypes.string,
  }),
  invitado: PropTypes.shape({
    estado_rsvp: PropTypes.string,
  }),
  onRsvpClick: PropTypes.func,
  isEditing: PropTypes.bool,
};

export default memo(RsvpButtonElementRenderer);
