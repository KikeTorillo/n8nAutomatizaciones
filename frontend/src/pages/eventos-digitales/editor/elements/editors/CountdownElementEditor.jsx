/**
 * ====================================================================
 * COUNTDOWN ELEMENT EDITOR
 * ====================================================================
 * Editor de propiedades para elementos de tipo countdown.
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
  DateField,
  TabContent,
} from '@/components/editor-framework';
import { TABS } from '@/components/editor-framework';

// ========== OPTIONS ==========

const VARIANTE_OPTIONS = [
  { value: 'cajas', label: 'Cajas' },
  { value: 'inline', label: 'En línea' },
  { value: 'circular', label: 'Circular' },
];

// ========== COMPONENT ==========

function CountdownElementEditor({
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
    <div className="countdown-element-editor space-y-4">
      {/* Tab Contenido */}
      <TabContent isActive={activeTab === TABS.CONTENIDO}>
        <div className="space-y-4">
          <TextField
            label="Título"
            value={contenido.titulo || ''}
            onChange={(v) => handleContenidoChange('titulo', v)}
            placeholder="Ej: Faltan"
          />

          <SelectField
            label="Variante"
            value={contenido.variante || 'cajas'}
            onChange={(v) => handleContenidoChange('variante', v)}
            options={VARIANTE_OPTIONS}
          />

          <DateField
            label="Fecha objetivo"
            value={contenido.fecha || ''}
            onChange={(v) => handleContenidoChange('fecha', v)}
            description="Dejar vacío para usar la fecha del evento"
          />

          <TextField
            label="Hora objetivo"
            value={contenido.hora || ''}
            onChange={(v) => handleContenidoChange('hora', v)}
            placeholder="12:00"
            description="Formato 24h (HH:MM). Dejar vacío para usar la hora del evento"
          />

          <TextField
            label="Texto al finalizar"
            value={contenido.texto_finalizado || ''}
            onChange={(v) => handleContenidoChange('texto_finalizado', v)}
            placeholder="¡Es hoy!"
          />

          {/* Opciones de visualización */}
          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Mostrar unidades
            </p>
            <div className="space-y-2">
              <ToggleField
                label="Días"
                value={contenido.mostrar_dias !== false}
                onChange={(v) => handleContenidoChange('mostrar_dias', v)}
              />
              <ToggleField
                label="Horas"
                value={contenido.mostrar_horas !== false}
                onChange={(v) => handleContenidoChange('mostrar_horas', v)}
              />
              <ToggleField
                label="Minutos"
                value={contenido.mostrar_minutos !== false}
                onChange={(v) => handleContenidoChange('mostrar_minutos', v)}
              />
              <ToggleField
                label="Segundos"
                value={contenido.mostrar_segundos !== false}
                onChange={(v) => handleContenidoChange('mostrar_segundos', v)}
              />
            </div>
          </div>
        </div>
      </TabContent>

      {/* Tab Estilos */}
      <TabContent isActive={activeTab === TABS.ESTILOS}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Los colores se heredan del tema de la invitación.
            Puedes sobrescribirlos aquí si lo deseas.
          </p>
          {/* Los estilos de color se pueden agregar aquí si es necesario */}
        </div>
      </TabContent>
    </div>
  );
}

CountdownElementEditor.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      titulo: PropTypes.string,
      fecha: PropTypes.string,
      hora: PropTypes.string,
      variante: PropTypes.string,
      mostrar_dias: PropTypes.bool,
      mostrar_horas: PropTypes.bool,
      mostrar_minutos: PropTypes.bool,
      mostrar_segundos: PropTypes.bool,
      texto_finalizado: PropTypes.string,
    }),
    estilos: PropTypes.object,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  activeTab: PropTypes.string,
};

export default memo(CountdownElementEditor);
