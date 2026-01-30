import { useMemo } from 'react';
import { Save, Plus, Trash2, Image, GripVertical } from 'lucide-react';
import {
  Button,
  Checkbox,
  Input,
  Select
} from '@/components/ui';
import { useBlockEditor, useArrayItems } from '../../hooks';

/**
 * GaleriaEditor - Editor del bloque Galería
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

  // Default item para nuevas imágenes
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

  // Hook para manejo del array de imágenes
  const {
    handleAgregar,
    handleEliminar,
    handleChange,
  } = useArrayItems(setForm, 'imagenes', defaultImagen);

  const columnasOptions = [
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
  ];

  const espaciadoOptions = [
    { value: 'none', label: 'Sin espacio' },
    { value: 'small', label: 'Pequeño' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Grande' },
  ];

  const estiloOptions = [
    { value: 'grid', label: 'Cuadrícula' },
    { value: 'masonry', label: 'Masonry' },
    { value: 'carousel', label: 'Carrusel' },
  ];

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Título (opcional)"
          value={form.titulo}
          onChange={(e) => handleFieldChange('titulo', e.target.value)}
          placeholder="Nuestra Galería"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Input
          label="Subtítulo (opcional)"
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

      {/* Lista de imágenes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Imágenes ({form.imagenes.length})
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAgregar}
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {form.imagenes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600">
              <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay imágenes</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAgregar}
                className="mt-2"
              >
                Agregar primera imagen
              </Button>
            </div>
          ) : (
            form.imagenes.map((imagen, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <GripVertical className="w-5 h-5 text-gray-400 mt-2 cursor-grab flex-shrink-0" />

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

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEliminar(index)}
                  className="text-gray-400 hover:text-red-500 dark:hover:bg-gray-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
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
      </div>

      {/* Botón guardar */}
      {cambios && (
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        </div>
      )}
    </form>
  );
}

export default GaleriaEditor;
