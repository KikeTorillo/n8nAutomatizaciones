/**
 * ====================================================================
 * TIMELINE EDITOR (Refactorizado)
 * ====================================================================
 *
 * Editor del bloque Timeline (Linea de Tiempo).
 * Usa BaseBlockEditor, ArrayItemsEditor, SectionTitleField e IconPicker.
 *
 * @version 2.0.0
 * @since 2026-02-03
 */

import { useCallback, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { Input, Textarea, Select, ToggleSwitch } from '@/components/ui';
import { IconPicker } from '@/components/ui';
import { AIGenerateButton } from '../AIGenerator';
import { useBlockEditor, useArrayItems } from '../../hooks';
import BaseBlockEditor from './BaseBlockEditor';
import { SectionTitleField, ArrayItemsEditor } from './fields';

/**
 * TimelineEditor - Editor del bloque Timeline
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Function} props.onGuardar - Callback para guardar
 * @param {Object} props.tema - Tema del sitio
 * @param {boolean} props.isSaving - Estado de guardado
 * @param {string} props.industria - Industria para AI
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
      { fecha: '2020', titulo: 'Fundacion', descripcion: 'Iniciamos operaciones con un pequeno equipo.', icono: 'Flag' },
      { fecha: '2022', titulo: 'Expansion', descripcion: 'Abrimos nuestra segunda oficina.', icono: 'Star' },
      { fecha: '2024', titulo: 'Reconocimiento', descripcion: 'Recibimos premio a la innovacion.', icono: 'Zap' },
    ],
  }), []);

  // Default item para nuevos eventos
  const defaultItem = useMemo(() => ({
    fecha: '',
    titulo: 'Nuevo Evento',
    descripcion: '',
    icono: 'Calendar'
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

  // Renderizador de cada timeline item
  const renderTimelineItem = useCallback((item, index) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Fecha/Periodo"
          value={item.fecha}
          onChange={(e) => handleChangeItem(index, 'fecha', e.target.value)}
          placeholder="2024, Enero 2024, Q1 2024..."
          className="dark:bg-gray-600 dark:border-gray-500"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Icono
          </label>
          <IconPicker
            value={item.icono}
            onChange={(val) => handleChangeItem(index, 'icono', val)}
          />
        </div>
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
        className="dark:bg-gray-600 dark:border-gray-500"
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
  ), [industria, handleChangeItem]);

  // Componente de preview
  const preview = useMemo(() => (
    <>
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
    </>
  ), [form, tema]);

  return (
    <BaseBlockEditor
      tipo="timeline"
      industria={industria}
      mostrarAIBanner={timelineVacio}
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
          tipo="timeline"
          industria={industria}
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
      <ArrayItemsEditor
        items={form.items}
        label="Eventos"
        onAgregar={handleAgregarItem}
        onEliminar={handleEliminarItem}
        itemName="Evento"
        itemIcon={Clock}
        iconColor="text-purple-500"
        renderItem={renderTimelineItem}
      />
    </BaseBlockEditor>
  );
}

export default TimelineEditor;
