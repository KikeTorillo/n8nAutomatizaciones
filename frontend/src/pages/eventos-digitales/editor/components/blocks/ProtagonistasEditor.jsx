/**
 * ====================================================================
 * PROTAGONISTAS EDITOR
 * ====================================================================
 * Editor del bloque de protagonistas (novios, quinceañera, etc.).
 * Permite configurar nombres, subtítulos y fotos.
 *
 * GUARDADO AUTOMÁTICO: Los cambios se propagan inmediatamente al store
 * y se guardan automáticamente después de 2s de inactividad.
 *
 * @version 2.0.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Migrado a guardado automático
 */

import { memo, useMemo } from 'react';
import { Heart } from 'lucide-react';
import { Input, Select, ToggleSwitch } from '@/components/ui';
import { ImageField, BaseAutoSaveEditor } from '@/components/editor-framework';
import { useInvitacionBlockEditor } from '../../hooks';
import { BLOCK_DEFAULTS } from '../../config';

/**
 * ProtagonistasEditor - Editor del bloque de protagonistas
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque
 * @param {Function} props.onChange - Callback para cambios (guardado automático)
 * @param {Object} props.tema - Tema de la invitación
 */
function ProtagonistasEditor({ contenido, estilos, onChange, tema }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.protagonistas,
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

  // Opciones de separador
  const separadorOptions = [
    { value: '&', label: '&' },
    { value: 'y', label: 'y' },
    { value: '♥', label: '♥' },
    { value: '+', label: '+' },
  ];

  // Opciones de layout
  const layoutOptions = [
    { value: 'horizontal', label: 'Horizontal' },
    { value: 'vertical', label: 'Vertical' },
  ];

  // Componente de preview
  const preview = useMemo(
    () => (
      <div
        className={`p-6 text-center ${
          form.layout === 'horizontal' ? 'flex items-center justify-center gap-8' : 'space-y-4'
        }`}
      >
        {/* Protagonista 1 */}
        <div className={form.layout === 'horizontal' ? 'flex-1' : ''}>
          {form.mostrar_fotos && form.foto_1_url && (
            <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden">
              <img
                src={form.foto_1_url}
                alt={form.nombre_1}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h3
            className="text-2xl font-bold"
            style={{ color: tema?.color_primario || '#753572' }}
          >
            {form.nombre_1 || 'María'}
          </h3>
          {form.subtitulo_1 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {form.subtitulo_1}
            </p>
          )}
        </div>

        {/* Separador */}
        <div
          className="text-3xl font-light"
          style={{ color: tema?.color_primario || '#753572' }}
        >
          {form.separador || '&'}
        </div>

        {/* Protagonista 2 */}
        <div className={form.layout === 'horizontal' ? 'flex-1' : ''}>
          {form.mostrar_fotos && form.foto_2_url && (
            <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden">
              <img
                src={form.foto_2_url}
                alt={form.nombre_2}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h3
            className="text-2xl font-bold"
            style={{ color: tema?.color_primario || '#753572' }}
          >
            {form.nombre_2 || 'Juan'}
          </h3>
          {form.subtitulo_2 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {form.subtitulo_2}
            </p>
          )}
        </div>
      </div>
    ),
    [form, tema?.color_primario]
  );

  return (
    <BaseAutoSaveEditor preview={preview}>
      {/* Primer protagonista */}
      <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg space-y-3">
        <h4 className="text-sm font-medium text-pink-700 dark:text-pink-300 flex items-center gap-2">
          <Heart className="w-4 h-4" />
          Primer protagonista
        </h4>

        <Input
          label="Nombre"
          value={form.nombre_1 || ''}
          onChange={(e) => handleFieldChange('nombre_1', e.target.value)}
          placeholder="María"
          className="dark:bg-gray-700 dark:border-gray-600"
        />

        <Input
          label="Subtítulo (opcional)"
          value={form.subtitulo_1 || ''}
          onChange={(e) => handleFieldChange('subtitulo_1', e.target.value)}
          placeholder="Hija de Roberto y Carmen"
          className="dark:bg-gray-700 dark:border-gray-600"
        />

        {form.mostrar_fotos && (
          <ImageField
            label="Foto"
            value={form.foto_1_url || ''}
            onChange={(val) => handleFieldChange('foto_1_url', val)}
          />
        )}
      </div>

      {/* Separador */}
      <Select
        label="Separador entre nombres"
        value={form.separador || '&'}
        onChange={(e) => handleFieldChange('separador', e.target.value)}
        options={separadorOptions}
        className="dark:bg-gray-700 dark:border-gray-600"
      />

      {/* Segundo protagonista */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3">
        <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <Heart className="w-4 h-4" />
          Segundo protagonista
        </h4>

        <Input
          label="Nombre"
          value={form.nombre_2 || ''}
          onChange={(e) => handleFieldChange('nombre_2', e.target.value)}
          placeholder="Juan"
          className="dark:bg-gray-700 dark:border-gray-600"
        />

        <Input
          label="Subtítulo (opcional)"
          value={form.subtitulo_2 || ''}
          onChange={(e) => handleFieldChange('subtitulo_2', e.target.value)}
          placeholder="Hijo de Miguel y Laura"
          className="dark:bg-gray-700 dark:border-gray-600"
        />

        {form.mostrar_fotos && (
          <ImageField
            label="Foto"
            value={form.foto_2_url || ''}
            onChange={(val) => handleFieldChange('foto_2_url', val)}
          />
        )}
      </div>

      {/* Opciones de estilo */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Disposición"
          value={form.layout || 'horizontal'}
          onChange={(e) => handleFieldChange('layout', e.target.value)}
          options={layoutOptions}
          className="dark:bg-gray-700 dark:border-gray-600"
        />

        <div className="flex items-center pt-6">
          <ToggleSwitch
            checked={form.mostrar_fotos || false}
            onChange={(checked) => handleFieldChange('mostrar_fotos', checked)}
            label="Mostrar fotos"
          />
        </div>
      </div>
    </BaseAutoSaveEditor>
  );
}

export default memo(ProtagonistasEditor);
