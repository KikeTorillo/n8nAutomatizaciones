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
import { Input, Textarea, Select } from '@/components/ui';
import {
  ImageField,
  AlignmentField,
  RangeField,
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
 */
function HeroInvitacionEditor({ contenido, estilos, onChange, tema }) {
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

  // Componente de preview
  const preview = useMemo(
    () => (
      <div
        className="relative min-h-[200px]"
        style={{
          backgroundColor: tema?.color_primario || '#753572',
          backgroundImage: form.imagen_url ? `url(${form.imagen_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {form.imagen_url && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${form.imagen_overlay || 0.3})` }}
          />
        )}
        <div className={`relative p-8 text-${form.alineacion || 'center'}`}>
          <h3 className="text-2xl font-bold text-white mb-2">
            {form.titulo || 'Título de la Invitación'}
          </h3>
          <p className="text-white/90 text-lg mb-4">
            {form.subtitulo || 'Subtítulo descriptivo'}
          </p>
          {form.fecha_texto && (
            <p className="text-white/80 text-sm font-medium tracking-wider uppercase">
              {form.fecha_texto}
            </p>
          )}
        </div>
      </div>
    ),
    [form, tema?.color_primario]
  );

  return (
    <BaseAutoSaveEditor preview={preview}>
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

      <Input
        label="Texto de fecha"
        value={form.fecha_texto || ''}
        onChange={(e) => handleFieldChange('fecha_texto', e.target.value)}
        placeholder="15 de Junio, 2026"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <ImageField
        label="Imagen de fondo"
        value={form.imagen_url || ''}
        onChange={(val) => handleFieldChange('imagen_url', val)}
      />

      <div className="grid grid-cols-2 gap-4">
        <AlignmentField
          label="Alineación del texto"
          value={form.alineacion || 'center'}
          onChange={(val) => handleFieldChange('alineacion', val)}
        />

        <Select
          label="Altura de sección"
          value={form.altura || 'full'}
          onChange={(e) => handleFieldChange('altura', e.target.value)}
          options={alturaOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      {form.imagen_url && (
        <RangeField
          label="Oscurecer imagen"
          value={form.imagen_overlay || 0.3}
          onChange={(val) => handleFieldChange('imagen_overlay', val)}
          min={0}
          max={1}
          step={0.1}
        />
      )}
    </BaseAutoSaveEditor>
  );
}

export default memo(HeroInvitacionEditor);
