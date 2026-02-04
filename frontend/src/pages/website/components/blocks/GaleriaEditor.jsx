/**
 * ====================================================================
 * GALERIA EDITOR (Refactorizado)
 * ====================================================================
 *
 * Editor del bloque Galeria.
 * Usa BaseBlockEditor y ArrayItemsEditor para imagenes.
 *
 * @version 2.0.0
 * @since 2026-02-03
 */

import { memo, useCallback, useMemo } from 'react';
import { Image } from 'lucide-react';
import { Checkbox, Input, Select } from '@/components/ui';
import { BaseBlockEditor, useBlockEditor, useArrayItems } from '@/components/editor-framework';
import { ArrayItemsEditor } from './fields';

/**
 * GaleriaEditor - Editor del bloque Galeria
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Function} props.onGuardar - Callback para guardar
 * @param {Object} props.tema - Tema del sitio
 * @param {boolean} props.isSaving - Estado de guardado
 */
function GaleriaEditor({ contenido, onGuardar, tema, isSaving }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    titulo: '',
    subtitulo: '',
    imagenes: [],
    columnas: 3,
    espaciado: 'normal',
    estilo: 'grid',
    lightbox: true,
  }), []);

  // Default item para nuevas imagenes
  const defaultImagen = useMemo(() => ({
    url: '',
    alt: '',
    titulo: '',
  }), []);

  // Hook para manejo del formulario
  const { form, setForm, cambios, handleSubmit, handleFieldChange } = useBlockEditor(
    contenido,
    defaultValues
  );

  // Hook para manejo del array de imagenes
  const {
    handleAgregar,
    handleEliminar,
    handleChange,
  } = useArrayItems(setForm, 'imagenes', defaultImagen);

  // Opciones de select
  const columnasOptions = [
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
  ];

  const espaciadoOptions = [
    { value: 'none', label: 'Sin espacio' },
    { value: 'small', label: 'Pequeno' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Grande' },
  ];

  const estiloOptions = [
    { value: 'grid', label: 'Cuadricula' },
    { value: 'masonry', label: 'Masonry' },
    { value: 'carousel', label: 'Carrusel' },
  ];

  // Renderizador de cada imagen
  const renderImagenItem = useCallback((imagen, index) => (
    <div className="flex items-start gap-2">
      {imagen.url ? (
        <img
          src={imagen.url}
          alt={imagen.alt}
          className="w-16 h-16 object-cover rounded flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
          <Image className="w-6 h-6 text-gray-400" />
        </div>
      )}
      <div className="flex-1 space-y-1">
        <Input
          type="url"
          value={imagen.url}
          onChange={(e) => handleChange(index, 'url', e.target.value)}
          placeholder="URL de la imagen"
          size="sm"
          className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
        />
        <Input
          value={imagen.alt}
          onChange={(e) => handleChange(index, 'alt', e.target.value)}
          placeholder="Texto alternativo"
          size="sm"
          className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
        />
      </div>
    </div>
  ), [handleChange]);

  // Componente de preview
  const preview = useMemo(() => (
    <>
      {form.titulo && (
        <h4 className="font-bold text-center mb-3" style={{ color: tema?.colores?.texto }}>
          {form.titulo}
        </h4>
      )}
      <div
        className={`grid gap-${form.espaciado === 'none' ? '0' : form.espaciado === 'small' ? '1' : form.espaciado === 'large' ? '4' : '2'}`}
        style={{ gridTemplateColumns: `repeat(${Math.min(form.columnas, form.imagenes.length || 3)}, 1fr)` }}
      >
        {(form.imagenes.length > 0 ? form.imagenes.slice(0, 6) : [1, 2, 3]).map((img, i) => (
          <div
            key={i}
            className="aspect-square bg-gray-200 dark:bg-gray-700 rounded overflow-hidden"
          >
            {typeof img === 'object' && img.url ? (
              <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  ), [form.titulo, form.imagenes, form.columnas, form.espaciado, tema?.colores?.texto]);

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
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Titulo (opcional)"
          value={form.titulo}
          onChange={(e) => handleFieldChange('titulo', e.target.value)}
          placeholder="Nuestra Galeria"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Input
          label="Subtitulo (opcional)"
          value={form.subtitulo}
          onChange={(e) => handleFieldChange('subtitulo', e.target.value)}
          placeholder="Nuestros mejores trabajos"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Select
          label="Columnas"
          value={String(form.columnas)}
          onChange={(e) => handleFieldChange('columnas', parseInt(e.target.value))}
          options={columnasOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Select
          label="Espaciado"
          value={form.espaciado}
          onChange={(e) => handleFieldChange('espaciado', e.target.value)}
          options={espaciadoOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Select
          label="Estilo"
          value={form.estilo}
          onChange={(e) => handleFieldChange('estilo', e.target.value)}
          options={estiloOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <Checkbox
        label="Abrir en lightbox al hacer clic"
        checked={form.lightbox}
        onChange={(e) => handleFieldChange('lightbox', e.target.checked)}
      />

      {/* Lista de imagenes */}
      <ArrayItemsEditor
        items={form.imagenes}
        label="Imagenes"
        onAgregar={handleAgregar}
        onEliminar={handleEliminar}
        itemName="Imagen"
        itemIcon={Image}
        iconColor="text-green-500"
        showDragHandle={true}
        renderItem={renderImagenItem}
      />
    </BaseBlockEditor>
  );
}

export default memo(GaleriaEditor);
