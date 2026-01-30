import { useCallback, useMemo } from 'react';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Textarea
} from '@/components/ui';
import { AIGenerateButton, AISuggestionBanner } from '../AIGenerator';
import { useBlockEditor, useArrayItems } from '../../hooks';

/**
 * ServiciosEditor - Editor del bloque Servicios
 */
function ServiciosEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    titulo: 'Nuestros Servicios',
    subtitulo: '',
    servicios: [{ nombre: '', descripcion: '', icono: '', precio: '' }],
    columnas: 3,
  }), []);

  // Default item para nuevos servicios
  const defaultServicio = useMemo(() => ({
    nombre: '',
    descripcion: '',
    icono: '',
    precio: '',
  }), []);

  // Hook para manejo del formulario
  const { form, setForm, cambios, handleSubmit, handleFieldChange } = useBlockEditor(
    contenido,
    defaultValues
  );

  // Hook para manejo del array de servicios
  const {
    handleAgregar: handleAgregarServicio,
    handleEliminar: handleEliminarServicio,
    handleChange: handleServicioChange,
  } = useArrayItems(setForm, 'servicios', defaultServicio);

  // Verificar si el contenido está esencialmente vacío
  const serviciosVacios = !contenido.servicios || contenido.servicios.length === 0 ||
    (contenido.servicios.length === 1 && !contenido.servicios[0]?.nombre);

  // Callback para generación de IA de bloque completo
  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      titulo: generatedContent.titulo || prev.titulo,
      servicios: generatedContent.items ? generatedContent.items.map(item => ({
        nombre: item.nombre || '',
        descripcion: item.descripcion || '',
        icono: '',
        precio: item.precio || '',
      })) : prev.servicios,
    }));
  }, [setForm]);

  const columnasOptions = [
    { value: '2', label: '2 columnas' },
    { value: '3', label: '3 columnas' },
    { value: '4', label: '4 columnas' },
  ];

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-4">
      {/* Banner de sugerencia IA para contenido vacío */}
      {serviciosVacios && (
        <AISuggestionBanner
          tipo="servicios"
          industria={industria}
          onGenerate={handleAIGenerate}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={
            <span className="flex items-center gap-2">
              Título de sección
              <AIGenerateButton
                tipo="servicios"
                campo="titulo"
                industria={industria}
                onGenerate={(text) => handleFieldChange('titulo', text)}
                size="sm"
              />
            </span>
          }
          value={form.titulo}
          onChange={(e) => handleFieldChange('titulo', e.target.value)}
          placeholder="Nuestros Servicios"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Select
          label="Columnas"
          value={String(form.columnas)}
          onChange={(e) => handleFieldChange('columnas', parseInt(e.target.value))}
          options={columnasOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <Input
        label="Subtítulo (opcional)"
        value={form.subtitulo}
        onChange={(e) => handleFieldChange('subtitulo', e.target.value)}
        placeholder="Lo que podemos hacer por ti"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Lista de servicios */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Servicios ({form.servicios.length})
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAgregarServicio}
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>

        <div className="space-y-3">
          {form.servicios.map((servicio, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start gap-2">
                <GripVertical className="w-5 h-5 text-gray-400 mt-2 cursor-grab" />
                <div className="flex-1 space-y-2">
                  <Input
                    value={servicio.nombre}
                    onChange={(e) => handleServicioChange(index, 'nombre', e.target.value)}
                    placeholder="Nombre del servicio"
                    size="sm"
                    className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                  />
                  <Textarea
                    value={servicio.descripcion}
                    onChange={(e) => handleServicioChange(index, 'descripcion', e.target.value)}
                    placeholder="Descripción breve"
                    rows={2}
                    className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={servicio.icono}
                      onChange={(e) => handleServicioChange(index, 'icono', e.target.value)}
                      placeholder="Icono (ej: Scissors)"
                      size="sm"
                      className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    />
                    <Input
                      value={servicio.precio}
                      onChange={(e) => handleServicioChange(index, 'precio', e.target.value)}
                      placeholder="Precio (opcional)"
                      size="sm"
                      className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEliminarServicio(index)}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
        <h4 className="font-bold text-center mb-1" style={{ color: tema?.colores?.texto || '#1F2937' }}>
          {form.titulo}
        </h4>
        {form.subtitulo && (
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">{form.subtitulo}</p>
        )}
        <div className={`grid gap-3 grid-cols-${Math.min(form.columnas, form.servicios.length)}`}>
          {form.servicios.slice(0, 4).map((s, i) => (
            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <p className="text-sm font-medium dark:text-gray-100">{s.nombre || 'Servicio'}</p>
              {s.precio && <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">{s.precio}</p>}
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

export default ServiciosEditor;
