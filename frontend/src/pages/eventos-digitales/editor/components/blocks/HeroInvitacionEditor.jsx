/**
 * ====================================================================
 * HERO INVITACION EDITOR
 * ====================================================================
 * Editor del bloque de portada para invitaciones digitales.
 * Incluye título, subtítulo, fecha y imagen de fondo.
 *
 * GUARDADO AUTOMÁTICO: Los cambios se propagan inmediatamente al store
 * y se guardan automáticamente después de 2s de inactividad.
 *
 * @version 2.0.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Migrado a guardado automático
 */

import { memo, useMemo } from 'react';
import { Input, Textarea, Select, ToggleSwitch } from '@/components/ui';
import {
  ImageField,
  AlignmentField,
  RangeField,
  ImagePositionField,
  SelectField,
  ColorField,
  BaseAutoSaveEditor,
} from '@/components/editor-framework';
import { useInvitacionBlockEditor } from '../../hooks';
import { BLOCK_DEFAULTS } from '../../config';

/**
 * HeroInvitacionEditor - Editor del bloque Hero para Invitaciones
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque
 * @param {Function} props.onChange - Callback para cambios (guardado automático)
 * @param {Object} props.tema - Tema de la invitación
 * @param {Function} props.onOpenUnsplash - Callback para abrir Unsplash
 */
function HeroInvitacionEditor({ contenido, estilos, onChange, tema, onOpenUnsplash }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.hero_invitacion,
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

  // Opciones de altura
  const alturaOptions = [
    { value: 'auto', label: 'Automática' },
    { value: 'full', label: 'Pantalla completa' },
    { value: 'medium', label: 'Media pantalla' },
  ];

  return (
    <BaseAutoSaveEditor>
      <Input
        label="Título principal"
        value={form.titulo || ''}
        onChange={(e) => handleFieldChange('titulo', e.target.value)}
        placeholder="Nos Casamos"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Textarea
        label="Subtítulo"
        value={form.subtitulo || ''}
        onChange={(e) => handleFieldChange('subtitulo', e.target.value)}
        placeholder="Te invitamos a celebrar nuestro amor"
        rows={2}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <ImageField
        label="Imagen de fondo"
        value={form.imagen_url || ''}
        onChange={(val) => handleFieldChange('imagen_url', val)}
        onOpenUnsplash={onOpenUnsplash}
        fieldKey="imagen_url"
      />

      {form.imagen_url ? (
        <ImagePositionField
          label="Punto focal de la imagen"
          value={form.imagen_posicion || '50% 50%'}
          onChange={(val) => handleFieldChange('imagen_posicion', val)}
          imageUrl={form.imagen_url}
        />
      ) : (
        <ColorField
          label="Color de fondo"
          value={form.color_fondo_hero || tema?.color_secundario || '#fce7f3'}
          onChange={(val) => handleFieldChange('color_fondo_hero', val)}
          hint="Por defecto usa el color secundario del tema"
        />
      )}

      <AlignmentField
        label="Alineación del texto"
        value={form.alineacion || 'center'}
        onChange={(val) => handleFieldChange('alineacion', val)}
      />

      <Select
        label="Altura de la portada"
        value={form.altura || 'full'}
        onChange={(e) => handleFieldChange('altura', e.target.value)}
        options={alturaOptions}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {form.imagen_url && (
        <>
          <SelectField
            label="Tipo de overlay"
            value={form.tipo_overlay || 'uniforme'}
            onChange={(val) => handleFieldChange('tipo_overlay', val)}
            options={[
              { value: 'uniforme', label: 'Uniforme (solo oscurecer)' },
              { value: 'gradiente', label: 'Gradiente (transición al fondo)' },
            ]}
          />

          <ColorField
            label="Color del overlay"
            value={form.color_overlay || '#000000'}
            onChange={(val) => handleFieldChange('color_overlay', val)}
          />

          <RangeField
            label="Opacidad del overlay"
            value={form.imagen_overlay ?? 0.3}
            onChange={(val) => handleFieldChange('imagen_overlay', val)}
            min={0}
            max={1}
            step={0.1}
          />
        </>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Mostrar botones de calendario
        </span>
        <ToggleSwitch
          enabled={form.mostrar_calendario !== false}
          onChange={(val) => handleFieldChange('mostrar_calendario', val)}
        />
      </div>

      {form.mostrar_calendario !== false && (
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
          Los botones de "Google Calendar" y "Descargar .ics" aparecerán en la portada.
          Desactiva esta opción si prefieres usar el bloque "Agregar al Calendario" por separado.
        </p>
      )}
    </BaseAutoSaveEditor>
  );
}

export default memo(HeroInvitacionEditor);
