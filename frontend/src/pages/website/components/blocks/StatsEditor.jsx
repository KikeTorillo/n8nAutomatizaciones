import { useCallback, useMemo } from 'react';
import { Save, Plus, Trash2, TrendingUp, GripVertical, Users, Calendar, Briefcase, Star, Award, Heart, Zap } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  ToggleSwitch
} from '@/components/ui';
import { AIGenerateButton, AISuggestionBanner } from '../AIGenerator';
import { useBlockEditor, useArrayItems } from '../../hooks';

// Iconos disponibles
const ICON_OPTIONS = [
  { value: 'users', label: 'Usuarios', Icon: Users },
  { value: 'calendar', label: 'Calendario', Icon: Calendar },
  { value: 'briefcase', label: 'Portafolio', Icon: Briefcase },
  { value: 'star', label: 'Estrella', Icon: Star },
  { value: 'award', label: 'Premio', Icon: Award },
  { value: 'heart', label: 'Corazon', Icon: Heart },
  { value: 'zap', label: 'Rayo', Icon: Zap },
  { value: 'trending', label: 'Tendencia', Icon: TrendingUp },
];

/**
 * StatsEditor - Editor del bloque Stats (Estadisticas/Numeros)
 */
function StatsEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    titulo_seccion: 'Nuestros Numeros',
    subtitulo_seccion: 'Lo que hemos logrado',
    columnas: 4,
    animar: true,
    duracion_animacion: 2000,
    items: [
      { numero: 500, sufijo: '+', prefijo: '', titulo: 'Clientes Satisfechos', icono: 'users' },
      { numero: 10, sufijo: '', prefijo: '', titulo: 'Anos de Experiencia', icono: 'calendar' },
      { numero: 1000, sufijo: '+', prefijo: '', titulo: 'Proyectos Completados', icono: 'briefcase' },
      { numero: 98, sufijo: '%', prefijo: '', titulo: 'Satisfaccion', icono: 'star' },
    ],
  }), []);

  // Default item para nuevas estadísticas
  const defaultStat = useMemo(() => ({
    numero: 0,
    sufijo: '',
    prefijo: '',
    titulo: 'Nueva Estadistica',
    icono: 'star'
  }), []);

  // Hook para manejo del formulario
  const { form, setForm, cambios, handleSubmit, handleFieldChange } = useBlockEditor(
    contenido,
    defaultValues
  );

  // Hook para manejo del array de items
  const {
    handleAgregar: handleAgregarStat,
    handleEliminar: handleEliminarStat,
    handleChange: handleChangeStat,
  } = useArrayItems(setForm, 'items', defaultStat);

  const statsVacios = !contenido.items || contenido.items.length === 0;

  // Callback para generación de IA de bloque completo
  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      titulo_seccion: generatedContent.titulo_seccion || prev.titulo_seccion,
      subtitulo_seccion: generatedContent.subtitulo_seccion || prev.subtitulo_seccion,
      items: generatedContent.items || prev.items,
    }));
  }, [setForm]);

  const columnasOptions = [
    { value: 2, label: '2 columnas' },
    { value: 3, label: '3 columnas' },
    { value: 4, label: '4 columnas' },
  ];

  const iconoOptions = ICON_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }));

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-4">
      {statsVacios && (
        <AISuggestionBanner
          tipo="stats"
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
                tipo="stats"
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
          label="Columnas"
          value={form.columnas}
          onChange={(e) => handleFieldChange('columnas', parseInt(e.target.value))}
          options={columnasOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <Input
        label="Subtitulo (opcional)"
        value={form.subtitulo_seccion}
        onChange={(e) => handleFieldChange('subtitulo_seccion', e.target.value)}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Opciones de animacion */}
      <div className="flex items-center gap-6">
        <ToggleSwitch
          checked={form.animar}
          onChange={(checked) => handleFieldChange('animar', checked)}
          label="Animar numeros"
        />
        {form.animar && (
          <Input
            label="Duracion (ms)"
            type="number"
            value={form.duracion_animacion}
            onChange={(e) => handleFieldChange('duracion_animacion', parseInt(e.target.value))}
            className="w-32 dark:bg-gray-700 dark:border-gray-600"
            min={500}
            max={5000}
            step={100}
          />
        )}
      </div>

      {/* Lista de estadisticas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Estadisticas ({form.items.length})
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={handleAgregarStat}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar Stat
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {form.items.map((stat, index) => {
            const IconComponent = ICON_OPTIONS.find(opt => opt.value === stat.icono)?.Icon || Star;

            return (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <IconComponent className="w-4 h-4" style={{ color: tema?.color_primario || '#753572' }} />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEliminarStat(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      label="Prefijo"
                      value={stat.prefijo}
                      onChange={(e) => handleChangeStat(index, 'prefijo', e.target.value)}
                      placeholder="$"
                      size="sm"
                      className="dark:bg-gray-600 dark:border-gray-500"
                    />
                    <Input
                      label="Numero"
                      type="number"
                      value={stat.numero}
                      onChange={(e) => handleChangeStat(index, 'numero', parseInt(e.target.value) || 0)}
                      size="sm"
                      className="dark:bg-gray-600 dark:border-gray-500"
                    />
                    <Input
                      label="Sufijo"
                      value={stat.sufijo}
                      onChange={(e) => handleChangeStat(index, 'sufijo', e.target.value)}
                      placeholder="+, %, K"
                      size="sm"
                      className="dark:bg-gray-600 dark:border-gray-500"
                    />
                  </div>

                  <Input
                    label="Titulo"
                    value={stat.titulo}
                    onChange={(e) => handleChangeStat(index, 'titulo', e.target.value)}
                    placeholder="Clientes"
                    size="sm"
                    className="dark:bg-gray-600 dark:border-gray-500"
                  />

                  <Select
                    label="Icono"
                    value={stat.icono}
                    onChange={(e) => handleChangeStat(index, 'icono', e.target.value)}
                    options={iconoOptions}
                    size="sm"
                    className="dark:bg-gray-600 dark:border-gray-500"
                  />
                </div>
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
        <div className={`grid gap-4 grid-cols-${Math.min(form.items.length, form.columnas)}`}>
          {form.items.slice(0, 4).map((stat, index) => {
            const IconComponent = ICON_OPTIONS.find(opt => opt.value === stat.icono)?.Icon || Star;
            return (
              <div key={index} className="text-center">
                <IconComponent className="w-6 h-6 mx-auto mb-1" style={{ color: tema?.color_primario || '#753572' }} />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.prefijo}{stat.numero}{stat.sufijo}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{stat.titulo}</div>
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

export default StatsEditor;
