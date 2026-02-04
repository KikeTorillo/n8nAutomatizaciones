/**
 * ====================================================================
 * TEXTO EDITOR (INVITACIONES)
 * ====================================================================
 * Editor del bloque de texto libre para invitaciones digitales.
 *
 * GUARDADO AUTOMÁTICO: Los cambios se propagan inmediatamente al store
 * y se guardan automáticamente después de 2s de inactividad.
 *
 * @version 2.0.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Migrado a guardado automático
 */

import { memo, useMemo } from 'react';
import { Type } from 'lucide-react';
import { Textarea, Select } from '@/components/ui';
import { AlignmentField, BaseAutoSaveEditor } from '@/components/editor-framework';
import { useInvitacionBlockEditor } from '../../hooks';
import { BLOCK_DEFAULTS } from '../../config';

/**
 * TextoEditor - Editor del bloque de texto
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque
 * @param {Function} props.onChange - Callback para cambios (guardado automático)
 * @param {Object} props.tema - Tema de la invitación
 */
function TextoEditor({ contenido, estilos, onChange }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.texto,
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

  // Opciones de tamaño de fuente
  const tamanoOptions = [
    { value: 'small', label: 'Pequeño' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Grande' },
  ];

  // Mapeo de tamaños a clases
  const tamanoClasses = {
    small: 'text-sm',
    normal: 'text-base',
    large: 'text-lg',
  };

  // Componente de preview
  const preview = useMemo(() => {
    const alineacion = form.alineacion || 'center';
    const tamano = form.tamano_fuente || 'normal';

    return (
      <div className="p-4">
        <div
          className={`${tamanoClasses[tamano]} text-gray-700 dark:text-gray-300 text-${alineacion} whitespace-pre-wrap`}
        >
          {form.contenido || (
            <span className="text-gray-400 dark:text-gray-500 italic">
              Escribe el contenido del texto aquí...
            </span>
          )}
        </div>
      </div>
    );
  }, [form]);

  return (
    <BaseAutoSaveEditor preview={preview}>
      <Textarea
        label={
          <span className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Contenido
          </span>
        }
        value={form.contenido || ''}
        onChange={(e) => handleFieldChange('contenido', e.target.value)}
        placeholder="Escribe aquí el contenido del bloque de texto...

Puedes usar varias líneas para dar formato a tu mensaje.

Por ejemplo, información sobre el dress code, indicaciones especiales, o cualquier mensaje que quieras compartir con tus invitados."
        rows={8}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <div className="grid grid-cols-2 gap-4">
        <AlignmentField
          label="Alineación"
          value={form.alineacion || 'center'}
          onChange={(val) => handleFieldChange('alineacion', val)}
        />

        <Select
          label="Tamaño de texto"
          value={form.tamano_fuente || 'normal'}
          onChange={(e) => handleFieldChange('tamano_fuente', e.target.value)}
          options={tamanoOptions}
          className="dark:bg-gray-700 dark:border-gray-600"
        />
      </div>

      {/* Tips de uso */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Tip:</strong> Usa este bloque para agregar información adicional como:
        </p>
        <ul className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-4 list-disc space-y-1">
          <li>Código de vestimenta (dress code)</li>
          <li>Indicaciones especiales</li>
          <li>Mensaje de los anfitriones</li>
          <li>Información sobre el evento</li>
        </ul>
      </div>
    </BaseAutoSaveEditor>
  );
}

export default memo(TextoEditor);
