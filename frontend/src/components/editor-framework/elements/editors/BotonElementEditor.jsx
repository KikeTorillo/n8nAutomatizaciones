/**
 * ====================================================================
 * BOTON ELEMENT EDITOR
 * ====================================================================
 * Editor de propiedades para elementos de tipo botón.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  UrlField,
  SelectField,
  ToggleField,
  RangeField,
  TabContent,
} from '../../fields';
import { TABS } from '../../constants';

// ========== OPTIONS ==========

const VARIANTE_OPTIONS = [
  { value: 'primario', label: 'Primario' },
  { value: 'secundario', label: 'Secundario' },
  { value: 'outline', label: 'Outline' },
  { value: 'ghost', label: 'Ghost' },
  { value: 'link', label: 'Link' },
];

const TAMANO_OPTIONS = [
  { value: 'sm', label: 'Pequeño' },
  { value: 'md', label: 'Mediano' },
  { value: 'lg', label: 'Grande' },
  { value: 'xl', label: 'Extra grande' },
];

const ACCION_OPTIONS = [
  { value: 'link', label: 'Abrir enlace' },
  { value: 'scroll', label: 'Scroll a sección' },
  { value: 'modal', label: 'Abrir modal' },
];

const ICONO_POSICION_OPTIONS = [
  { value: 'left', label: 'Izquierda' },
  { value: 'right', label: 'Derecha' },
];

const ICONOS_COMUNES = [
  { value: '', label: 'Sin icono' },
  { value: 'ArrowRight', label: 'Flecha derecha' },
  { value: 'ArrowLeft', label: 'Flecha izquierda' },
  { value: 'ChevronRight', label: 'Chevron derecha' },
  { value: 'ChevronDown', label: 'Chevron abajo' },
  { value: 'ExternalLink', label: 'Enlace externo' },
  { value: 'Download', label: 'Descargar' },
  { value: 'Mail', label: 'Email' },
  { value: 'Phone', label: 'Teléfono' },
  { value: 'MapPin', label: 'Ubicación' },
  { value: 'Calendar', label: 'Calendario' },
  { value: 'Heart', label: 'Corazón' },
  { value: 'Star', label: 'Estrella' },
  { value: 'Play', label: 'Play' },
  { value: 'Send', label: 'Enviar' },
];

const BORDER_RADIUS_OPTIONS = [
  { value: 0, label: 'Ninguno' },
  { value: 4, label: 'Pequeño' },
  { value: 6, label: 'Mediano' },
  { value: 8, label: 'Grande' },
  { value: 12, label: 'Extra grande' },
  { value: 9999, label: 'Pill' },
];

// ========== COMPONENT ==========

function BotonElementEditor({
  elemento,
  onChange,
  activeTab = TABS.CONTENIDO,
}) {
  const { contenido = {}, estilos = {} } = elemento;

  // Handlers
  const handleContenidoChange = useCallback((field, value) => {
    onChange({
      contenido: {
        ...contenido,
        [field]: value,
      },
    });
  }, [contenido, onChange]);

  const handleEstilosChange = useCallback((field, value) => {
    onChange({
      estilos: {
        ...estilos,
        [field]: value,
      },
    });
  }, [estilos, onChange]);

  return (
    <div className="boton-element-editor space-y-4">
      {/* Tab Contenido */}
      <TabContent isActive={activeTab === TABS.CONTENIDO}>
        <div className="space-y-4">
          <TextField
            label="Texto del botón"
            value={contenido.texto || ''}
            onChange={(v) => handleContenidoChange('texto', v)}
            placeholder="Ej: Ver más"
          />

          <SelectField
            label="Variante"
            value={contenido.variante || 'primario'}
            onChange={(v) => handleContenidoChange('variante', v)}
            options={VARIANTE_OPTIONS}
          />

          <SelectField
            label="Acción"
            value={contenido.accion || 'link'}
            onChange={(v) => handleContenidoChange('accion', v)}
            options={ACCION_OPTIONS}
          />

          {contenido.accion === 'link' && (
            <UrlField
              label="URL de destino"
              value={contenido.url || ''}
              onChange={(v) => handleContenidoChange('url', v)}
              placeholder="https://ejemplo.com"
            />
          )}

          {contenido.accion === 'scroll' && (
            <TextField
              label="ID de sección"
              value={contenido.url || ''}
              onChange={(v) => handleContenidoChange('url', v)}
              placeholder="ej: seccion-contacto"
              helperText="El ID de la sección a la que hacer scroll"
            />
          )}
        </div>
      </TabContent>

      {/* Tab Estilos */}
      <TabContent isActive={activeTab === TABS.ESTILOS}>
        <div className="space-y-4">
          <SelectField
            label="Tamaño"
            value={estilos.tamano || 'md'}
            onChange={(v) => handleEstilosChange('tamano', v)}
            options={TAMANO_OPTIONS}
          />

          <SelectField
            label="Bordes redondeados"
            value={estilos.borderRadius || 6}
            onChange={(v) => handleEstilosChange('borderRadius', Number(v))}
            options={BORDER_RADIUS_OPTIONS}
          />

          <ToggleField
            label="Ancho completo"
            value={estilos.fullWidth || false}
            onChange={(v) => handleEstilosChange('fullWidth', v)}
            helperText="El botón ocupará todo el ancho disponible"
          />

          <SelectField
            label="Icono"
            value={estilos.icono || ''}
            onChange={(v) => handleEstilosChange('icono', v || null)}
            options={ICONOS_COMUNES}
          />

          {estilos.icono && (
            <SelectField
              label="Posición del icono"
              value={estilos.iconoPosicion || 'left'}
              onChange={(v) => handleEstilosChange('iconoPosicion', v)}
              options={ICONO_POSICION_OPTIONS}
            />
          )}
        </div>
      </TabContent>
    </div>
  );
}

BotonElementEditor.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      texto: PropTypes.string,
      variante: PropTypes.string,
      url: PropTypes.string,
      accion: PropTypes.string,
    }),
    estilos: PropTypes.shape({
      tamano: PropTypes.string,
      fullWidth: PropTypes.bool,
      icono: PropTypes.string,
      iconoPosicion: PropTypes.string,
      borderRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  activeTab: PropTypes.string,
};

export default memo(BotonElementEditor);
