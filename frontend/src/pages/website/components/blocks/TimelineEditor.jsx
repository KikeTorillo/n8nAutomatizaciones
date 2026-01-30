import { useCallback, useMemo } from 'react';
import { Save, Plus, Trash2, Clock, GripVertical, Calendar, Flag, Star, Zap, CheckCircle } from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Select,
  ToggleSwitch
} from '@/components/ui';
import { AIGenerateButton, AISuggestionBanner } from '../AIGenerator';
import { useBlockEditor, useArrayItems } from '../../hooks';

// Iconos disponibles para los items del timeline
const ICON_OPTIONS = [
  { value: 'calendar', label: 'Calendario', Icon: Calendar },
  { value: 'flag', label: 'Bandera', Icon: Flag },
  { value: 'star', label: 'Estrella', Icon: Star },
  { value: 'zap', label: 'Rayo', Icon: Zap },
  { value: 'check', label: 'Check', Icon: CheckCircle },
  { value: 'clock', label: 'Reloj', Icon: Clock },
];

/**
 * TimelineEditor - Editor del bloque Timeline (Linea de Tiempo)
 */
function TimelineEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    titulo_seccion: 'Nuestra Historia',
    subtitulo_seccion: 'Un recorrido por nuestros logros',
    orientacion: 'vertical',
    mostrar_linea: true,
    alternar_lados: true,
    items: [
      { fecha: '2020', titulo: 'Fundacion', descripcion: 'Iniciamos operaciones con un pequeno equipo.', icono: 'flag' },
      { fecha: '2022', titulo: 'Expansion', descripcion: 'Abrimos nuestra segunda oficina.', icono: 'star' },
      { fecha: '2024', titulo: 'Reconocimiento', descripcion: 'Recibimos premio a la innovacion.', icono: 'zap' },
    ],
  }), []);

  // Default item para nuevos eventos
  const defaultItem = useMemo(() => ({
    fecha: '',
    titulo: 'Nuevo Evento',
    descripcion: '',
    icono: 'calendar'
  }), []);

  // Hook para manejo del formulario
  const { form, setForm, cambios, handleSubmit, handleFieldChange } = useBlockEditor(
    contenido,
    defaultValues
  );

  // Hook para manejo del array de items
  const {
    handleAgregar: handleAgregarItem,
    handleEliminar: handleEliminarItem,
    handleChange: handleChangeItem,
  } = useArrayItems(setForm, 'items', defaultItem);

  const timelineVacio = !contenido.items || contenido.items.length === 0;

  // Callback para generación de IA de bloque completo
  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      titulo_seccion: generatedContent.titulo_seccion || prev.titulo_seccion,
      subtitulo_seccion: generatedContent.subtitulo_seccion || prev.subtitulo_seccion,
      items: generatedContent.items || prev.items,
    }));
  }, [setForm]);

  const orientacionOptions = [
    { value: 'vertical', label: 'Vertical' },
    { value: 'horizontal', label: 'Horizontal' },
  ];

  const iconoOptions = ICON_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }));

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-4">
      {timelineVacio && (
        <AISuggestionBanner
          tipo="timeline"
          industria={industria}
          onGenerate={handleAIGenerate}
        />
      )}

      {/* Configuracion general */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={
            <span className="flex items-center gap-2">
              Titulo de seccion
              <AIGenerateButton
                tipo="timeline"
                campo="titulo"
                industria={industria}
                onGenerate={(text) => handleFieldChange('titulo_seccion', text)}
                size="sm"
              />
            </span>
          }
          value={form.titulo_seccion}
          onChange={(e) => handleFieldChange('titulo_seccion', e.target.value)}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Select
          label="Orientacion"
          value={form.orientacion}
          onChange={(e) => handleFieldChange('orientacion', e.target.value)}
          options={orientacionOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <Input
        label="Subtitulo (opcional)"
        value={form.subtitulo_seccion}
        onChange={(e) => handleFieldChange('subtitulo_seccion', e.target.value)}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Opciones de visualizacion */}
      <div className="flex items-center gap-6">
        <ToggleSwitch
          checked={form.mostrar_linea}
          onChange={(checked) => handleFieldChange('mostrar_linea', checked)}
          label="Mostrar linea conectora"
        />
        {form.orientacion === 'vertical' && (
          <ToggleSwitch
            checked={form.alternar_lados}
            onChange={(checked) => handleFieldChange('alternar_lados', checked)}
            label="Alternar lados"
          />
        )}
      </div>

      {/* Lista de eventos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Eventos ({form.items.length})
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={handleAgregarItem}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar Evento
          </Button>
        </div>

        <div className="space-y-3">
          {form.items.map((item, index) => {
            const IconComponent = ICON_OPTIONS.find(opt => opt.value === item.icono)?.Icon || Calendar;

            return (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <IconComponent className="w-4 h-4" style={{ color: tema?.color_primario || '#753572' }} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Evento {index + 1}
                    </span>
                  </div>
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

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Input
                    label="Fecha/Periodo"
                    value={item.fecha}
                    onChange={(e) => handleChangeItem(index, 'fecha', e.target.value)}
                    placeholder="2024, Enero 2024, Q1 2024..."
                    className="dark:bg-gray-600 dark:border-gray-500"
                  />
                  <Select
                    label="Icono"
                    value={item.icono}
                    onChange={(e) => handleChangeItem(index, 'icono', e.target.value)}
                    options={iconoOptions}
                    className="dark:bg-gray-600 dark:border-gray-500"
                  />
                </div>

                <Input
                  label={
                    <span className="flex items-center gap-2">
                      Titulo
                      <AIGenerateButton
                        tipo="timeline"
                        campo="titulo_item"
                        industria={industria}
                        onGenerate={(text) => handleChangeItem(index, 'titulo', text)}
                        size="sm"
                      />
                    </span>
                  }
                  value={item.titulo}
                  onChange={(e) => handleChangeItem(index, 'titulo', e.target.value)}
                  placeholder="Titulo del evento"
                  className="mb-3 dark:bg-gray-600 dark:border-gray-500"
                />

                <Textarea
                  label={
                    <span className="flex items-center gap-2">
                      Descripcion
                      <AIGenerateButton
                        tipo="timeline"
                        campo="descripcion"
                        industria={industria}
                        contexto={{ titulo: item.titulo, fecha: item.fecha }}
                        onGenerate={(text) => handleChangeItem(index, 'descripcion', text)}
                        size="sm"
                      />
                    </span>
                  }
                  value={item.descripcion}
                  onChange={(e) => handleChangeItem(index, 'descripcion', e.target.value)}
                  placeholder="Descripcion del evento..."
                  rows={2}
                  className="dark:bg-gray-600 dark:border-gray-500"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
        <h4 className="font-bold text-center mb-4 text-gray-900 dark:text-white">
          {form.titulo_seccion}
        </h4>
        <div className={`relative ${form.orientacion === 'horizontal' ? 'flex gap-4 overflow-x-auto pb-2' : 'space-y-4'}`}>
          {/* Linea conectora */}
          {form.mostrar_linea && form.orientacion === 'vertical' && (
            <div
              className="absolute left-4 top-0 bottom-0 w-0.5"
              style={{ backgroundColor: tema?.color_primario || '#753572' }}
            />
          )}

          {form.items.slice(0, 3).map((item, index) => {
            const IconComponent = ICON_OPTIONS.find(opt => opt.value === item.icono)?.Icon || Calendar;
            const isLeft = form.alternar_lados && index % 2 === 1;

            return (
              <div
                key={index}
                className={`
                  ${form.orientacion === 'horizontal' ? 'flex-shrink-0 w-40' : 'pl-10 relative'}
                  ${isLeft && form.orientacion === 'vertical' ? 'text-right pr-10 pl-0' : ''}
                `}
              >
                {/* Punto del timeline */}
                {form.orientacion === 'vertical' && (
                  <div
                    className={`absolute top-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${isLeft ? 'right-[6px]' : 'left-[6px]'}`}
                    style={{ backgroundColor: tema?.color_primario || '#753572' }}
                  />
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {item.fecha || 'Fecha'}
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <IconComponent className="w-3 h-3" style={{ color: tema?.color_primario || '#753572' }} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.titulo || 'Titulo'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {item.descripcion || 'Descripcion...'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Boton guardar */}
      {cambios && (
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" isLoading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        </div>
      )}
    </form>
  );
}

export default TimelineEditor;
