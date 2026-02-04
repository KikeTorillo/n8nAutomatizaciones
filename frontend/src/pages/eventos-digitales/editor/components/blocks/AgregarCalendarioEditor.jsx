/**
 * ====================================================================
 * AGREGAR CALENDARIO EDITOR (INVITACIONES)
 * ====================================================================
 * Editor del bloque para agregar evento al calendario.
 * Permite configurar botones de Google Calendar y descarga .ics.
 *
 * GUARDADO AUTOMÁTICO: Los cambios se propagan inmediatamente al store
 * y se guardan automáticamente después de 2s de inactividad.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import { Input, Select, ToggleSwitch } from '@/components/ui';
import { AlignmentField, BaseAutoSaveEditor } from '@/components/editor-framework';
import { CalendarPlus, Download } from 'lucide-react';
import { useInvitacionBlockEditor } from '../../hooks';
import { BLOCK_DEFAULTS } from '../../config';

/**
 * AgregarCalendarioEditor - Editor del bloque Agregar al Calendario
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque
 * @param {Function} props.onChange - Callback para cambios (guardado automático)
 * @param {Object} props.tema - Tema de la invitación
 */
function AgregarCalendarioEditor({ contenido, estilos, onChange, tema }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.agregar_calendario,
    }),
    []
  );

  // Hook para manejo del formulario con guardado automático
  const { form, handleFieldChange } = useInvitacionBlockEditor(
    contenido,
    estilos,
    defaultValues,
    onChange
  );

  // Opciones de variante
  const varianteOptions = [
    { value: 'default', label: 'Por defecto' },
    { value: 'minimal', label: 'Minimalista' },
    { value: 'hero', label: 'Hero (fondo oscuro)' },
  ];

  // Estilos de botón según variante
  const getButtonStyles = (variante) => {
    if (variante === 'hero') {
      return {
        backgroundColor: 'rgba(0,0,0,0.4)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.3)',
      };
    }
    if (variante === 'minimal') {
      return {
        backgroundColor: 'transparent',
        color: tema?.color_primario || '#753572',
        border: `1px solid ${tema?.color_primario || '#753572'}`,
      };
    }
    return {
      backgroundColor: tema?.color_secundario || '#fce7f3',
      color: tema?.color_primario || '#753572',
      border: `1px solid ${tema?.color_primario || '#753572'}30`,
    };
  };

  // Componente de preview
  const preview = useMemo(() => {
    const buttonStyles = getButtonStyles(form.variante);
    const alignClass = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    }[form.alineacion || 'center'];

    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
        {form.titulo && (
          <p
            className={`text-sm font-medium mb-3 ${form.alineacion === 'center' ? 'text-center' : form.alineacion === 'right' ? 'text-right' : 'text-left'}`}
            style={{ color: tema?.color_texto || '#1f2937' }}
          >
            {form.titulo}
          </p>
        )}
        <div className={`flex flex-wrap gap-3 ${alignClass}`}>
          {form.mostrar_google !== false && (
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={buttonStyles}
            >
              <CalendarPlus className="w-4 h-4" />
              Google Calendar
            </span>
          )}
          {form.mostrar_ics !== false && (
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={buttonStyles}
            >
              <Download className="w-4 h-4" />
              Descargar .ics
            </span>
          )}
        </div>
        {!form.mostrar_google && !form.mostrar_ics && (
          <p className="text-sm text-gray-400 text-center italic">
            Activa al menos un botón para mostrar
          </p>
        )}
      </div>
    );
  }, [form, tema]);

  return (
    <BaseAutoSaveEditor preview={preview}>
      <Input
        label="Título (opcional)"
        value={form.titulo || ''}
        onChange={(e) => handleFieldChange('titulo', e.target.value)}
        placeholder="Añade a tu calendario"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mostrar Google Calendar
          </span>
          <ToggleSwitch
            enabled={form.mostrar_google !== false}
            onChange={(val) => handleFieldChange('mostrar_google', val)}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mostrar descarga .ics
          </span>
          <ToggleSwitch
            enabled={form.mostrar_ics !== false}
            onChange={(val) => handleFieldChange('mostrar_ics', val)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Estilo visual"
          value={form.variante || 'default'}
          onChange={(e) => handleFieldChange('variante', e.target.value)}
          options={varianteOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />

        <AlignmentField
          label="Alineación"
          value={form.alineacion || 'center'}
          onChange={(val) => handleFieldChange('alineacion', val)}
        />
      </div>

      {/* Info */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Permite a tus invitados agregar el evento a su calendario personal.
          Google Calendar abre una nueva pestaña, mientras que .ics descarga un archivo
          compatible con Outlook, Apple Calendar y otros.
        </p>
      </div>
    </BaseAutoSaveEditor>
  );
}

export default memo(AgregarCalendarioEditor);
