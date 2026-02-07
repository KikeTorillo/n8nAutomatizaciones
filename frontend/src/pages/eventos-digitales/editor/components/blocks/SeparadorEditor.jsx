/**
 * ====================================================================
 * SEPARADOR EDITOR (INVITACIONES)
 * ====================================================================
 * Editor del bloque separador/divisor para invitaciones digitales.
 *
 * GUARDADO AUTOMÁTICO: Los cambios se propagan inmediatamente al store
 * y se guardan automáticamente después de 2s de inactividad.
 *
 * @version 2.0.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Migrado a guardado automático
 */

import { memo, useMemo } from 'react';
import { Select } from '@/components/ui';
import { ColorField, NumberField, BaseAutoSaveEditor, useBlockEditor } from '@/components/editor-framework';
import { BLOCK_DEFAULTS } from '../../config';

/**
 * SeparadorEditor - Editor del bloque separador
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque
 * @param {Function} props.onChange - Callback para cambios (guardado automático)
 * @param {Object} props.tema - Tema de la invitación
 */
function SeparadorEditor({ contenido, estilos, onChange, tema }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.separador,
    }),
    []
  );

  // Hook para manejo del formulario con guardado automático
  const { form, handleFieldChange } = useBlockEditor(contenido, defaultValues, {
    estilos,
    onChange,
    bloqueIdKey: '_bloqueId',
  });

  // Opciones de estilo
  const estiloOptions = [
    { value: 'linea', label: 'Línea' },
    { value: 'espacio', label: 'Espacio en blanco' },
    { value: 'ondas', label: 'Ondas decorativas' },
    { value: 'flores', label: 'Flores' },
  ];

  // Renderizar el separador según el estilo
  const renderSeparador = (estilo, color, altura) => {
    const colorFinal = color || tema?.color_primario || '#753572';

    switch (estilo) {
      case 'linea':
        return (
          <div className="flex items-center justify-center" style={{ height: altura }}>
            <div
              className="w-full max-w-xs h-px"
              style={{ backgroundColor: colorFinal }}
            />
          </div>
        );

      case 'espacio':
        return <div style={{ height: altura }} />;

      case 'ondas':
        return (
          <div className="flex items-center justify-center" style={{ height: altura }}>
            <svg
              viewBox="0 0 200 20"
              className="w-full max-w-sm"
              style={{ height: Math.min(altura, 40) }}
            >
              <path
                d="M0 10 Q 25 0 50 10 T 100 10 T 150 10 T 200 10"
                fill="none"
                stroke={colorFinal}
                strokeWidth="2"
              />
            </svg>
          </div>
        );

      case 'flores':
        return (
          <div className="flex items-center justify-center" style={{ height: altura }}>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-px"
                style={{ backgroundColor: colorFinal }}
              />
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6"
                style={{ fill: colorFinal }}
              >
                <path d="M12 2C13.1 2 14 2.9 14 4C14 4.74 13.6 5.39 13 5.73V7H14C15.1 7 16 7.9 16 9V10C17.1 10 18 10.9 18 12C18 13.1 17.1 14 16 14V15C16 16.1 15.1 17 14 17H13V18.27C13.6 18.61 14 19.26 14 20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20C10 19.26 10.4 18.61 11 18.27V17H10C8.9 17 8 16.1 8 15V14C6.9 14 6 13.1 6 12C6 10.9 6.9 10 8 10V9C8 7.9 8.9 7 10 7H11V5.73C10.4 5.39 10 4.74 10 4C10 2.9 10.9 2 12 2Z" />
              </svg>
              <div
                className="w-16 h-px"
                style={{ backgroundColor: colorFinal }}
              />
            </div>
          </div>
        );

      default:
        return <div style={{ height: altura }} />;
    }
  };

  // Componente de preview
  const preview = useMemo(() => {
    const estilo = form.estilo || 'linea';
    const color = form.color;
    const altura = form.altura || 40;

    return (
      <div className="p-4">
        {renderSeparador(estilo, color, altura)}
      </div>
    );
  }, [form, tema?.color_primario]);

  return (
    <BaseAutoSaveEditor preview={preview}>
      <Select
        label="Estilo del separador"
        value={form.estilo || 'linea'}
        onChange={(e) => handleFieldChange('estilo', e.target.value)}
        options={estiloOptions}
        className="dark:bg-gray-700 dark:border-gray-600"
      />

      <NumberField
        label="Altura (px)"
        value={form.altura || 40}
        onChange={(val) => handleFieldChange('altura', val)}
        min={10}
        max={200}
        step={10}
      />

      {form.estilo !== 'espacio' && (
        <ColorField
          label="Color (opcional)"
          value={form.color || ''}
          onChange={(val) => handleFieldChange('color', val)}
          placeholder="Usa color del tema por defecto"
        />
      )}

      {/* Info */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          El separador agrega espacio visual entre secciones de tu invitación.
          {form.estilo === 'espacio' && ' El estilo "Espacio" solo agrega espacio en blanco.'}
        </p>
      </div>
    </BaseAutoSaveEditor>
  );
}

export default memo(SeparadorEditor);
