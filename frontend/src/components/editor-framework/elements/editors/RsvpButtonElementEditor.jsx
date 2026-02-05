/**
 * ====================================================================
 * RSVP BUTTON ELEMENT EDITOR
 * ====================================================================
 * Editor de propiedades para elementos de tipo rsvp_button.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  SelectField,
  ToggleField,
  TabContent,
} from '../../fields';
import { TABS } from '../../constants';

// ========== OPTIONS ==========

const VARIANTE_OPTIONS = [
  { value: 'primario', label: 'Primario (sólido)' },
  { value: 'secundario', label: 'Secundario' },
  { value: 'outline', label: 'Outline' },
  { value: 'minimal', label: 'Minimal (texto)' },
];

const TAMANO_OPTIONS = [
  { value: 'sm', label: 'Pequeño' },
  { value: 'md', label: 'Mediano' },
  { value: 'lg', label: 'Grande' },
  { value: 'xl', label: 'Extra grande' },
];

// ========== COMPONENT ==========

function RsvpButtonElementEditor({
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
    <div className="rsvp-button-element-editor space-y-4">
      {/* Tab Contenido */}
      <TabContent isActive={activeTab === TABS.CONTENIDO}>
        <div className="space-y-4">
          <TextField
            label="Texto del botón"
            value={contenido.texto || ''}
            onChange={(v) => handleContenidoChange('texto', v)}
            placeholder="Confirmar Asistencia"
          />

          <TextField
            label="Texto después de confirmar"
            value={contenido.texto_confirmado || ''}
            onChange={(v) => handleContenidoChange('texto_confirmado', v)}
            placeholder="¡Confirmado!"
          />

          <SelectField
            label="Variante"
            value={contenido.variante || 'primario'}
            onChange={(v) => handleContenidoChange('variante', v)}
            options={VARIANTE_OPTIONS}
          />

          <SelectField
            label="Tamaño"
            value={contenido.tamano || 'lg'}
            onChange={(v) => handleContenidoChange('tamano', v)}
            options={TAMANO_OPTIONS}
          />

          <ToggleField
            label="Mostrar icono"
            value={contenido.mostrar_icono !== false}
            onChange={(v) => handleContenidoChange('mostrar_icono', v)}
          />
        </div>
      </TabContent>

      {/* Tab Estilos */}
      <TabContent isActive={activeTab === TABS.ESTILOS}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Los colores se heredan del tema de la invitación.
          </p>
        </div>
      </TabContent>
    </div>
  );
}

RsvpButtonElementEditor.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      texto: PropTypes.string,
      texto_confirmado: PropTypes.string,
      variante: PropTypes.string,
      tamano: PropTypes.string,
      mostrar_icono: PropTypes.bool,
    }),
    estilos: PropTypes.object,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  activeTab: PropTypes.string,
};

export default memo(RsvpButtonElementEditor);
