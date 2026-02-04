/**
 * ====================================================================
 * GALERIA EDITOR (INVITACIONES)
 * ====================================================================
 * Editor del bloque de galería de imágenes para invitaciones.
 *
 * GUARDADO AUTOMÁTICO: Los cambios se propagan inmediatamente al store
 * y se guardan automáticamente después de 2s de inactividad.
 *
 * @version 2.0.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Migrado a guardado automático
 */

import { memo, useCallback, useMemo } from 'react';
import { Image as ImageIcon, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Button, Input, Textarea, Select, ToggleSwitch } from '@/components/ui';
import { ImageField, BaseAutoSaveEditor } from '@/components/editor-framework';
import { useInvitacionBlockEditor } from '../../hooks';
import { BLOCK_DEFAULTS } from '../../config';

/**
 * GaleriaEditor - Editor del bloque de galería
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque
 * @param {Function} props.onChange - Callback para cambios (guardado automático)
 * @param {Object} props.tema - Tema de la invitación
 * @param {Array} props.galeria - Galería del evento (desde el backend)
 */
function GaleriaEditor({
  contenido,
  estilos,
  onChange,
  tema,
  galeria = [],
}) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.galeria,
    }),
    []
  );

  // Default item para nuevas imágenes
  const defaultItem = useMemo(
    () => ({
      url: '',
      alt: '',
    }),
    []
  );

  // Hook para manejo del formulario con guardado automático
  const { form, handleFieldChange, handleArrayItemAdd, handleArrayItemRemove, handleArrayItemChange } = useInvitacionBlockEditor(
    contenido,
    estilos,
    defaultValues,
    onChange
  );

  // Handlers para array de items
  const handleAgregarItem = useCallback(() => {
    handleArrayItemAdd('imagenes', defaultItem);
  }, [handleArrayItemAdd, defaultItem]);

  const handleEliminarItem = useCallback((index) => {
    handleArrayItemRemove('imagenes', index);
  }, [handleArrayItemRemove]);

  const handleChangeItem = useCallback((index, campo, valor) => {
    handleArrayItemChange('imagenes', index, campo, valor);
  }, [handleArrayItemChange]);

  // Opciones de layout
  const layoutOptions = [
    { value: 'grid', label: 'Grid' },
    { value: 'masonry', label: 'Masonry' },
    { value: 'carousel', label: 'Carrusel' },
  ];

  // Opciones de columnas
  const columnasOptions = [
    { value: 2, label: '2 columnas' },
    { value: 3, label: '3 columnas' },
    { value: 4, label: '4 columnas' },
  ];

  // Imágenes a mostrar (del evento o personalizadas)
  const imagenesAMostrar = useMemo(() => {
    if (form.usar_galeria_evento && galeria.length > 0) {
      return galeria;
    }
    return form.imagenes || [];
  }, [form.usar_galeria_evento, form.imagenes, galeria]);

  // Componente de preview
  const preview = useMemo(() => {
    const columnas = parseInt(form.columnas) || 3;

    return (
      <div className="p-4">
        <h4 className="font-bold text-center mb-2 text-gray-900 dark:text-white">
          {form.titulo_seccion || 'Galería'}
        </h4>

        {form.subtitulo_seccion && (
          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
            {form.subtitulo_seccion}
          </p>
        )}

        {/* Preview de imágenes */}
        {imagenesAMostrar.length > 0 ? (
          <div
            className={`grid gap-2`}
            style={{ gridTemplateColumns: `repeat(${Math.min(columnas, 3)}, 1fr)` }}
          >
            {imagenesAMostrar.slice(0, 6).map((img, idx) => (
              <div
                key={idx}
                className="aspect-square bg-gray-200 dark:bg-gray-700 rounded overflow-hidden"
              >
                {img.url ? (
                  <img
                    src={img.url}
                    alt={img.alt || `Imagen ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {form.usar_galeria_evento
                ? 'Agrega fotos en la sección Galería del evento'
                : 'Agrega imágenes a la galería'}
            </p>
          </div>
        )}

        {imagenesAMostrar.length > 6 && (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
            +{imagenesAMostrar.length - 6} imágenes más
          </p>
        )}
      </div>
    );
  }, [form, imagenesAMostrar]);

  return (
    <BaseAutoSaveEditor preview={preview}>
      <Input
        label="Título de sección"
        value={form.titulo_seccion || ''}
        onChange={(e) => handleFieldChange('titulo_seccion', e.target.value)}
        placeholder="Galería"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Textarea
        label="Subtítulo (opcional)"
        value={form.subtitulo_seccion || ''}
        onChange={(e) => handleFieldChange('subtitulo_seccion', e.target.value)}
        placeholder="Momentos especiales que queremos compartir"
        rows={2}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Fuente de datos */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Fuente de imágenes
          </h4>
          <ToggleSwitch
            checked={form.usar_galeria_evento || false}
            onChange={(checked) => handleFieldChange('usar_galeria_evento', checked)}
            label="Usar del evento"
          />
        </div>

        {form.usar_galeria_evento && (
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <ExternalLink className="w-3 h-3" />
            Las imágenes se toman de la sección "Galería" del evento
          </p>
        )}
      </div>

      {/* Lista de imágenes personalizadas */}
      {!form.usar_galeria_evento && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Imágenes ({(form.imagenes || []).length})
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={handleAgregarItem}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>

          {(form.imagenes || []).map((item, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <ImageIcon
                    className="w-4 h-4"
                    style={{ color: tema?.color_primario || '#753572' }}
                  />
                  Imagen {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEliminarItem(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <ImageField
                  label="Imagen"
                  value={item.url || ''}
                  onChange={(val) => handleChangeItem(index, 'url', val)}
                />

                <Input
                  label="Texto alternativo (opcional)"
                  value={item.alt || ''}
                  onChange={(e) => handleChangeItem(index, 'alt', e.target.value)}
                  placeholder="Descripción de la imagen"
                  className="dark:bg-gray-600 dark:border-gray-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Opciones de estilo */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Diseño"
          value={form.layout || 'grid'}
          onChange={(e) => handleFieldChange('layout', e.target.value)}
          options={layoutOptions}
          className="dark:bg-gray-700 dark:border-gray-600"
        />

        <Select
          label="Columnas"
          value={form.columnas || 3}
          onChange={(e) => handleFieldChange('columnas', parseInt(e.target.value))}
          options={columnasOptions}
          className="dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
    </BaseAutoSaveEditor>
  );
}

export default memo(GaleriaEditor);
