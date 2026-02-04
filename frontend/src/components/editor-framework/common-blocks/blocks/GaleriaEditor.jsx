/**
 * ====================================================================
 * GALERIA EDITOR (COMMON BLOCK)
 * ====================================================================
 * Editor de bloque de galería de imágenes compartido entre editores.
 * Configurable para diferentes opciones según el editor.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useCallback, useMemo } from 'react';
import { Image as ImageIcon, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Button, Input, Textarea, Select, ToggleSwitch, Checkbox } from '@/components/ui';
import { ImageField } from '../../fields';
import BaseBlockEditor from '../../blocks/BaseBlockEditor';
import BaseAutoSaveEditor from '../../blocks/BaseAutoSaveEditor';
import { useCommonBlockEditor } from '../hooks';

// ========== OPCIONES DE SELECT ==========

const LAYOUT_OPTIONS = [
  { value: 'grid', label: 'Cuadrícula' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'carousel', label: 'Carrusel' },
];

const ESPACIADO_OPTIONS = [
  { value: 'none', label: 'Sin espacio' },
  { value: 'small', label: 'Pequeño' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Grande' },
];

// ========== COMPONENTE PRINCIPAL ==========

/**
 * GaleriaEditor - Editor del bloque de galería
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque (solo autoSave mode)
 * @param {Function} props.onChange - Callback para autoSave mode
 * @param {Function} props.onGuardar - Callback para manualSave mode
 * @param {Object} props.tema - Tema del editor
 * @param {boolean} props.isSaving - Estado de guardado (solo manualSave)
 * @param {Array} props.galeria - Galería del evento (solo invitaciones)
 * @param {Object} props.config - Configuración personalizada
 * @param {boolean} props.config.showUsarGaleriaEvento - Mostrar toggle de galería del evento
 * @param {boolean} props.config.showEspaciado - Mostrar selector de espaciado
 * @param {boolean} props.config.showLightbox - Mostrar toggle de lightbox
 * @param {boolean} props.config.showImagenTitulo - Mostrar campo de título por imagen
 * @param {Array} props.config.columnasOptions - Opciones de columnas disponibles
 * @param {Array} props.config.layoutOptions - Opciones de layout disponibles
 * @param {Object} props.config.fieldMapping - Mapeo de nombres de campos
 * @param {Function} props.ArrayItemsEditorComponent - Componente para renderizar items (website)
 */
function GaleriaEditor({
  contenido,
  estilos,
  onChange,
  onGuardar,
  tema,
  isSaving,
  galeria = [],
  config = {},
  ArrayItemsEditorComponent,
}) {
  const {
    showUsarGaleriaEvento = false,
    showEspaciado = false,
    showLightbox = false,
    showImagenTitulo = false,
    columnasOptions = [2, 3, 4],
    layoutOptions = LAYOUT_OPTIONS,
    fieldMapping = null,
  } = config;

  // Determinar modo
  const isAutoSaveMode = Boolean(onChange);

  // Mapear campos si es necesario
  const mapField = useCallback((standardName) => {
    if (!fieldMapping) return standardName;
    return fieldMapping[standardName] || standardName;
  }, [fieldMapping]);

  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    [mapField('titulo')]: '',
    [mapField('subtitulo')]: '',
    imagenes: [],
    columnas: 3,
    [mapField('layout')]: 'grid',
    ...(showUsarGaleriaEvento && { usar_galeria_evento: true }),
    ...(showEspaciado && { espaciado: 'normal' }),
    ...(showLightbox && { lightbox: true }),
  }), [mapField, showUsarGaleriaEvento, showEspaciado, showLightbox]);

  // Default item para nuevas imágenes
  const defaultItem = useMemo(() => ({
    url: '',
    alt: '',
    ...(showImagenTitulo && { titulo: '' }),
  }), [showImagenTitulo]);

  // Hook unificado
  const {
    form,
    handleFieldChange,
    handleSubmit,
    cambios,
    handleArrayItemAdd,
    handleArrayItemRemove,
    handleArrayItemChange,
  } = useCommonBlockEditor(contenido, {
    defaultValues,
    estilos,
    onChange,
    onGuardar,
  });

  // Obtener valores usando el mapeo
  const getValue = useCallback((standardName) => {
    const fieldName = mapField(standardName);
    return form[fieldName];
  }, [form, mapField]);

  const setValue = useCallback((standardName, value) => {
    const fieldName = mapField(standardName);
    handleFieldChange(fieldName, value);
  }, [handleFieldChange, mapField]);

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

  // Opciones de columnas formateadas
  const columnasOptionsFormatted = useMemo(() =>
    columnasOptions.map((c) => ({
      value: isAutoSaveMode ? c : String(c),
      label: `${c} columnas`,
    })),
  [columnasOptions, isAutoSaveMode]);

  // Imágenes a mostrar (del evento o personalizadas)
  const imagenesAMostrar = useMemo(() => {
    if (showUsarGaleriaEvento && form.usar_galeria_evento && galeria.length > 0) {
      return galeria;
    }
    return form.imagenes || [];
  }, [showUsarGaleriaEvento, form.usar_galeria_evento, form.imagenes, galeria]);

  // Colores del tema
  const colorPrimario = tema?.color_primario || tema?.colores?.primario || '#753572';

  // Componente de preview
  const preview = useMemo(() => {
    const titulo = getValue('titulo');
    const subtitulo = getValue('subtitulo');
    const columnas = parseInt(form.columnas) || 3;
    const espaciado = form.espaciado || 'normal';

    const getEspaciadoClass = () => {
      if (!showEspaciado) return 'gap-2';
      switch (espaciado) {
        case 'none': return 'gap-0';
        case 'small': return 'gap-1';
        case 'large': return 'gap-4';
        default: return 'gap-2';
      }
    };

    return (
      <div className="p-4">
        {titulo && (
          <h4 className="font-bold text-center mb-2 text-gray-900 dark:text-white">
            {titulo}
          </h4>
        )}

        {subtitulo && (
          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
            {subtitulo}
          </p>
        )}

        {imagenesAMostrar.length > 0 ? (
          <>
            <div
              className={`grid ${getEspaciadoClass()}`}
              style={{ gridTemplateColumns: `repeat(${Math.min(columnas, imagenesAMostrar.length, 3)}, 1fr)` }}
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

            {imagenesAMostrar.length > 6 && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                +{imagenesAMostrar.length - 6} imágenes más
              </p>
            )}
          </>
        ) : (
          <div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {showUsarGaleriaEvento && form.usar_galeria_evento
                ? 'Agrega fotos en la sección Galería del evento'
                : 'Agrega imágenes a la galería'}
            </p>
          </div>
        )}
      </div>
    );
  }, [getValue, form.columnas, form.espaciado, form.usar_galeria_evento, imagenesAMostrar, showEspaciado, showUsarGaleriaEvento]);

  // Campos del formulario
  const formFields = (
    <>
      {/* Título y subtítulo */}
      {isAutoSaveMode ? (
        <>
          <Input
            label="Título de sección"
            value={getValue('titulo') || ''}
            onChange={(e) => setValue('titulo', e.target.value)}
            placeholder="Galería"
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />

          <Textarea
            label="Subtítulo (opcional)"
            value={getValue('subtitulo') || ''}
            onChange={(e) => setValue('subtitulo', e.target.value)}
            placeholder="Momentos especiales que queremos compartir"
            rows={2}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Título (opcional)"
            value={getValue('titulo') || ''}
            onChange={(e) => setValue('titulo', e.target.value)}
            placeholder="Nuestra Galería"
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <Input
            label="Subtítulo (opcional)"
            value={getValue('subtitulo') || ''}
            onChange={(e) => setValue('subtitulo', e.target.value)}
            placeholder="Nuestros mejores trabajos"
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </div>
      )}

      {/* Fuente de datos (solo invitaciones) */}
      {showUsarGaleriaEvento && (
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
      )}

      {/* Opciones de estilo */}
      <div className={`grid ${showEspaciado ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
        <Select
          label="Diseño"
          value={getValue('layout') || 'grid'}
          onChange={(e) => setValue('layout', e.target.value)}
          options={layoutOptions}
          className="dark:bg-gray-700 dark:border-gray-600"
        />

        <Select
          label="Columnas"
          value={isAutoSaveMode ? (form.columnas || 3) : String(form.columnas || 3)}
          onChange={(e) => handleFieldChange('columnas', isAutoSaveMode ? parseInt(e.target.value) : parseInt(e.target.value))}
          options={columnasOptionsFormatted}
          className="dark:bg-gray-700 dark:border-gray-600"
        />

        {showEspaciado && (
          <Select
            label="Espaciado"
            value={form.espaciado || 'normal'}
            onChange={(e) => handleFieldChange('espaciado', e.target.value)}
            options={ESPACIADO_OPTIONS}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        )}
      </div>

      {/* Lightbox (solo website) */}
      {showLightbox && (
        <Checkbox
          label="Abrir en lightbox al hacer clic"
          checked={form.lightbox !== false}
          onChange={(e) => handleFieldChange('lightbox', e.target.checked)}
        />
      )}

      {/* Lista de imágenes personalizadas */}
      {(!showUsarGaleriaEvento || !form.usar_galeria_evento) && (
        <>
          {ArrayItemsEditorComponent ? (
            // Usar componente de website si está disponible
            <ArrayItemsEditorComponent
              items={form.imagenes || []}
              label="Imágenes"
              onAgregar={handleAgregarItem}
              onEliminar={handleEliminarItem}
              itemName="Imagen"
              itemIcon={ImageIcon}
              iconColor="text-green-500"
              showDragHandle={true}
              renderItem={(imagen, index) => (
                <div className="flex items-start gap-2">
                  {imagen.url ? (
                    <img
                      src={imagen.url}
                      alt={imagen.alt}
                      className="w-16 h-16 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <Input
                      type="url"
                      value={imagen.url}
                      onChange={(e) => handleChangeItem(index, 'url', e.target.value)}
                      placeholder="URL de la imagen"
                      size="sm"
                      className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    />
                    <Input
                      value={imagen.alt}
                      onChange={(e) => handleChangeItem(index, 'alt', e.target.value)}
                      placeholder="Texto alternativo"
                      size="sm"
                      className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    />
                  </div>
                </div>
              )}
            />
          ) : (
            // Lista simple para invitaciones
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
                        style={{ color: colorPrimario }}
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

                    {showImagenTitulo && (
                      <Input
                        label="Título (opcional)"
                        value={item.titulo || ''}
                        onChange={(e) => handleChangeItem(index, 'titulo', e.target.value)}
                        placeholder="Título de la imagen"
                        className="dark:bg-gray-600 dark:border-gray-500"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );

  // Renderizar según el modo
  if (isAutoSaveMode) {
    return (
      <BaseAutoSaveEditor preview={preview}>
        {formFields}
      </BaseAutoSaveEditor>
    );
  }

  return (
    <BaseBlockEditor
      tipo="galeria"
      mostrarAIBanner={false}
      cambios={cambios}
      handleSubmit={handleSubmit}
      onGuardar={onGuardar}
      isSaving={isSaving}
      preview={preview}
    >
      {formFields}
    </BaseBlockEditor>
  );
}

// ========== EXPORTS ==========

export default memo(GaleriaEditor);

// Configuraciones predefinidas para cada editor
export const GALERIA_CONFIG_INVITACIONES = {
  showUsarGaleriaEvento: true,
  showEspaciado: false,
  showLightbox: false,
  showImagenTitulo: false,
  columnasOptions: [2, 3, 4],
  layoutOptions: LAYOUT_OPTIONS,
  fieldMapping: {
    titulo: 'titulo_seccion',
    subtitulo: 'subtitulo_seccion',
    layout: 'layout',
  },
};

export const GALERIA_CONFIG_WEBSITE = {
  showUsarGaleriaEvento: false,
  showEspaciado: true,
  showLightbox: true,
  showImagenTitulo: true,
  columnasOptions: [2, 3, 4, 5],
  layoutOptions: [
    { value: 'grid', label: 'Cuadrícula' },
    { value: 'masonry', label: 'Masonry' },
    { value: 'carousel', label: 'Carrusel' },
  ],
  fieldMapping: null,
};
