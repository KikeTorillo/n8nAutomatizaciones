/**
 * ====================================================================
 * STATS EDITOR (Refactorizado)
 * ====================================================================
 *
 * Editor del bloque Stats (Estadisticas/Numeros).
 * Usa BaseBlockEditor, ArrayItemsEditor, SectionTitleField e IconPickerField.
 *
 * @version 2.0.0
 * @since 2026-02-03
 */

import { useCallback, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { Input, Select, ToggleSwitch } from '@/components/ui';
import { IconPicker } from '@/components/ui';
import { useBlockEditor, useArrayItems } from '../../hooks';
import BaseBlockEditor from './BaseBlockEditor';
import { SectionTitleField, ArrayItemsEditor } from './fields';

// Mapeo de iconos para preview (subset de los más comunes en stats)
const ICONOS_MAP = {
  users: () => <span className="text-lg">👥</span>,
  calendar: () => <span className="text-lg">📅</span>,
  briefcase: () => <span className="text-lg">💼</span>,
  star: () => <span className="text-lg">⭐</span>,
  award: () => <span className="text-lg">🏆</span>,
  heart: () => <span className="text-lg">❤️</span>,
  zap: () => <span className="text-lg">⚡</span>,
  trending: () => <span className="text-lg">📈</span>,
};

/**
 * StatsEditor - Editor del bloque Stats
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Function} props.onGuardar - Callback para guardar
 * @param {Object} props.tema - Tema del sitio
 * @param {boolean} props.isSaving - Estado de guardado
 * @param {string} props.industria - Industria para AI
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
      { numero: 500, sufijo: '+', prefijo: '', titulo: 'Clientes Satisfechos', icono: 'Users' },
      { numero: 10, sufijo: '', prefijo: '', titulo: 'Anos de Experiencia', icono: 'Calendar' },
      { numero: 1000, sufijo: '+', prefijo: '', titulo: 'Proyectos Completados', icono: 'Briefcase' },
      { numero: 98, sufijo: '%', prefijo: '', titulo: 'Satisfaccion', icono: 'Star' },
    ],
  }), []);

  // Default item para nuevas estadísticas
  const defaultStat = useMemo(() => ({
    numero: 0,
    sufijo: '',
    prefijo: '',
    titulo: 'Nueva Estadistica',
    icono: 'Star'
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

  // Renderizador de cada stat item
  const renderStatItem = useCallback((stat, index) => (
    <div className="space-y-3">
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

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Icono
        </label>
        <IconPicker
          value={stat.icono}
          onChange={(val) => handleChangeStat(index, 'icono', val)}
        />
      </div>
    </div>
  ), [handleChangeStat]);

  // Componente de preview
  const preview = useMemo(() => (
    <>
      <h4 className="font-bold text-center mb-4 text-gray-900 dark:text-white">
        {form.titulo_seccion}
      </h4>
      <div className={`grid gap-4 grid-cols-${Math.min(form.items.length, form.columnas)}`}>
        {form.items.slice(0, 4).map((stat, index) => {
          const IconFn = ICONOS_MAP[stat.icono?.toLowerCase()];
          return (
            <div key={index} className="text-center">
              {IconFn ? <IconFn /> : <span className="text-lg">📊</span>}
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.prefijo}{stat.numero}{stat.sufijo}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stat.titulo}</div>
            </div>
          );
        })}
      </div>
    </>
  ), [form]);

  return (
    <BaseBlockEditor
      tipo="stats"
      industria={industria}
      mostrarAIBanner={statsVacios}
      onAIGenerate={handleAIGenerate}
      cambios={cambios}
      handleSubmit={handleSubmit}
      onGuardar={onGuardar}
      isSaving={isSaving}
      preview={preview}
    >
      {/* Configuracion general */}
      <div className="grid grid-cols-2 gap-4">
        <SectionTitleField
          value={form.titulo_seccion}
          onChange={(val) => handleFieldChange('titulo_seccion', val)}
          tipo="stats"
          industria={industria}
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
      <ArrayItemsEditor
        items={form.items}
        label="Estadisticas"
        onAgregar={handleAgregarStat}
        onEliminar={handleEliminarStat}
        itemName="Stat"
        itemIcon={BarChart3}
        iconColor="text-green-500"
        renderItem={renderStatItem}
      />
    </BaseBlockEditor>
  );
}

export default StatsEditor;
