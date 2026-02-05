/**
 * ====================================================================
 * CALENDARIO ELEMENT EDITOR
 * ====================================================================
 * Editor de propiedades para elementos de tipo calendario.
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
  AlignmentField,
  TabContent,
} from '../../fields';
import { TABS } from '../../constants';

// ========== OPTIONS ==========

const VARIANTE_OPTIONS = [
  { value: 'default', label: 'Por defecto' },
  { value: 'hero', label: 'Hero (oscuro)' },
  { value: 'minimal', label: 'Minimal (outline)' },
];

// ========== COMPONENT ==========

function CalendarioElementEditor({
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
    <div className="calendario-element-editor space-y-4">
      {/* Tab Contenido */}
      <TabContent isActive={activeTab === TABS.CONTENIDO}>
        <div className="space-y-4">
          <TextField
            label="Título"
            value={contenido.titulo || ''}
            onChange={(v) => handleContenidoChange('titulo', v)}
            placeholder="Ej: Guarda la fecha"
          />

          <SelectField
            label="Variante"
            value={contenido.variante || 'default'}
            onChange={(v) => handleContenidoChange('variante', v)}
            options={VARIANTE_OPTIONS}
          />

          <AlignmentField
            label="Alineación"
            value={contenido.alineacion || 'center'}
            onChange={(v) => handleContenidoChange('alineacion', v)}
          />

          {/* Botones */}
          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Botones a mostrar
            </p>
            <div className="space-y-3">
              <div className="space-y-2">
                <ToggleField
                  label="Google Calendar"
                  value={contenido.mostrar_google !== false}
                  onChange={(v) => handleContenidoChange('mostrar_google', v)}
                />
                {contenido.mostrar_google !== false && (
                  <TextField
                    label="Texto del botón"
                    value={contenido.texto_google || ''}
                    onChange={(v) => handleContenidoChange('texto_google', v)}
                    placeholder="Google Calendar"
                    className="ml-4"
                  />
                )}
              </div>

              <div className="space-y-2">
                <ToggleField
                  label="Descargar .ics"
                  value={contenido.mostrar_ics !== false}
                  onChange={(v) => handleContenidoChange('mostrar_ics', v)}
                />
                {contenido.mostrar_ics !== false && (
                  <TextField
                    label="Texto del botón"
                    value={contenido.texto_ics || ''}
                    onChange={(v) => handleContenidoChange('texto_ics', v)}
                    placeholder="Descargar .ics"
                    className="ml-4"
                  />
                )}
              </div>
            </div>
          </div>
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

CalendarioElementEditor.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      titulo: PropTypes.string,
      mostrar_google: PropTypes.bool,
      mostrar_ics: PropTypes.bool,
      variante: PropTypes.string,
      alineacion: PropTypes.string,
      texto_google: PropTypes.string,
      texto_ics: PropTypes.string,
    }),
    estilos: PropTypes.object,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  activeTab: PropTypes.string,
};

export default memo(CalendarioElementEditor);
