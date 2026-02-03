import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Save, Plus, Trash2, GripVertical, Database, Edit3 } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Textarea,
  ToggleSwitch
} from '@/components/ui';
import { AIGenerateButton, AISuggestionBanner } from '../AIGenerator';
import { useBlockEditor, useArrayItems } from '../../hooks';
import ServiciosERPSelector from './ServiciosERPSelector';
import websiteApi from '@/services/api/modules/website.api';

/**
 * ServiciosEditor - Editor del bloque Servicios
 * Soporta dos modos:
 * - manual: Items definidos manualmente
 * - erp: Servicios cargados desde el módulo de Servicios del ERP
 */
function ServiciosEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    titulo_seccion: 'Nuestros Servicios',
    subtitulo_seccion: '',
    columnas: 3,
    origen: 'manual',
    filtro_erp: {
      modo: 'todos',
      categorias: [],
      servicio_ids: []
    },
    mostrar_precio: true,
    mostrar_duracion: false,
    items: [{ nombre: '', descripcion: '', icono: '', precio: '' }],
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

  // Hook para manejo del array de servicios manuales
  const {
    handleAgregar: handleAgregarServicio,
    handleEliminar: handleEliminarServicio,
    handleChange: handleServicioChange,
  } = useArrayItems(setForm, 'items', defaultServicio);

  // Query para servicios del ERP (solo si origen es 'erp')
  const { data: dataERP, isLoading: loadingERP } = useQuery({
    queryKey: ['website-servicios-erp'],
    queryFn: () => websiteApi.obtenerServiciosERP(),
    enabled: form.origen === 'erp',
    staleTime: 1000 * 60 * 5,
  });

  // Verificar si el contenido está esencialmente vacío
  const serviciosVacios = form.origen === 'manual' && (
    !form.items || form.items.length === 0 ||
    (form.items.length === 1 && !form.items[0]?.nombre)
  );

  // Callback para generación de IA de bloque completo
  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      titulo_seccion: generatedContent.titulo || prev.titulo_seccion,
      items: generatedContent.items ? generatedContent.items.map(item => ({
        nombre: item.nombre || '',
        descripcion: item.descripcion || '',
        icono: '',
        precio: item.precio || '',
      })) : prev.items,
    }));
  }, [setForm]);

  // Handler para cambio de origen
  const handleOrigenChange = useCallback((nuevoOrigen) => {
    setForm(prev => ({
      ...prev,
      origen: nuevoOrigen,
      // Limpiar items si cambia a ERP
      items: nuevoOrigen === 'erp' ? [] : (prev.items?.length ? prev.items : defaultValues.items),
    }));
  }, [setForm, defaultValues.items]);

  // Handler para cambio de filtro ERP
  const handleFiltroERPChange = useCallback((nuevoFiltro) => {
    setForm(prev => ({
      ...prev,
      filtro_erp: { ...prev.filtro_erp, ...nuevoFiltro }
    }));
  }, [setForm]);

  const columnasOptions = [
    { value: '2', label: '2 columnas' },
    { value: '3', label: '3 columnas' },
    { value: '4', label: '4 columnas' },
  ];

  const origenOptions = [
    { value: 'manual', label: 'Manual' },
    { value: 'erp', label: 'Desde ERP' },
  ];

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-4">
      {/* Banner de sugerencia IA para contenido vacío (solo modo manual) */}
      {serviciosVacios && form.origen === 'manual' && (
        <AISuggestionBanner
          tipo="servicios"
          industria={industria}
          onGenerate={handleAIGenerate}
        />
      )}

      {/* Selector de origen */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Origen de los servicios
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleOrigenChange('manual')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              form.origen === 'manual'
                ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Manual</span>
          </button>
          <button
            type="button"
            onClick={() => handleOrigenChange('erp')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              form.origen === 'erp'
                ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Desde ERP</span>
          </button>
        </div>
        {form.origen === 'erp' && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Los servicios se cargarán automáticamente desde el módulo de Servicios
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={
            <span className="flex items-center gap-2">
              Titulo de seccion
              <AIGenerateButton
                tipo="servicios"
                campo="titulo"
                industria={industria}
                onGenerate={(text) => handleFieldChange('titulo_seccion', text)}
                size="sm"
              />
            </span>
          }
          value={form.titulo_seccion}
          onChange={(e) => handleFieldChange('titulo_seccion', e.target.value)}
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
        label="Subtitulo (opcional)"
        value={form.subtitulo_seccion}
        onChange={(e) => handleFieldChange('subtitulo_seccion', e.target.value)}
        placeholder="Lo que podemos hacer por ti"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Opciones de visualizacion */}
      <div className="flex items-center gap-6 py-2">
        <ToggleSwitch
          label="Mostrar precio"
          checked={form.mostrar_precio}
          onChange={(checked) => handleFieldChange('mostrar_precio', checked)}
        />
        <ToggleSwitch
          label="Mostrar duracion"
          checked={form.mostrar_duracion}
          onChange={(checked) => handleFieldChange('mostrar_duracion', checked)}
        />
      </div>

      {/* Contenido segun origen */}
      {form.origen === 'erp' ? (
        <ServiciosERPSelector
          filtro={form.filtro_erp || defaultValues.filtro_erp}
          onFiltroChange={handleFiltroERPChange}
          servicios={dataERP?.servicios || []}
          categorias={dataERP?.categorias || []}
          isLoading={loadingERP}
        />
      ) : (
        <>
          {/* Lista de servicios manuales */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Servicios ({form.items?.length || 0})
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
              {(form.items || []).map((servicio, index) => (
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
                        placeholder="Descripcion breve"
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

          {/* Preview (solo modo manual) */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h4 className="font-bold text-center mb-1" style={{ color: tema?.colores?.texto || '#1F2937' }}>
              {form.titulo_seccion}
            </h4>
            {form.subtitulo_seccion && (
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">{form.subtitulo_seccion}</p>
            )}
            <div className={`grid gap-3 grid-cols-${Math.min(form.columnas, (form.items || []).length || 1)}`}>
              {(form.items || []).slice(0, 4).map((s, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                  <p className="text-sm font-medium dark:text-gray-100">{s.nombre || 'Servicio'}</p>
                  {s.precio && <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">{s.precio}</p>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Boton guardar */}
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
