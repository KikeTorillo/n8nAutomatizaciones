/**
 * ====================================================================
 * PRICING EDITOR (Refactorizado)
 * ====================================================================
 *
 * Editor del bloque Pricing (Tablas de Precios).
 * Usa BaseBlockEditor y ArrayItemsEditor.
 * Mantiene funciones custom para arrays anidados (caracteristicas).
 *
 * @version 2.0.0
 * @since 2026-02-03
 */

import { memo, useCallback, useMemo } from 'react';
import { DollarSign, Plus, Trash2, Star } from 'lucide-react';
import { Button, Input, Select, ToggleSwitch } from '@/components/ui';
import { AIGenerateButton } from '../AIGenerator';
import { useBlockEditor, useArrayItems } from '../../hooks';
import BaseBlockEditor from './BaseBlockEditor';
import { SectionTitleField, ArrayItemsEditor } from './fields';

/**
 * PricingEditor - Editor del bloque Pricing
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Function} props.onGuardar - Callback para guardar
 * @param {Object} props.tema - Tema del sitio
 * @param {boolean} props.isSaving - Estado de guardado
 * @param {string} props.industria - Industria para AI
 */
function PricingEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    titulo_seccion: 'Nuestros Planes',
    subtitulo_seccion: 'Elige el plan perfecto para ti',
    columnas: 3,
    moneda: 'USD',
    mostrar_toggle_anual: false,
    descuento_anual: 20,
    planes: [{
      nombre: 'Basico',
      precio: 29,
      periodo: 'mes',
      descripcion: 'Ideal para empezar',
      caracteristicas: ['Caracteristica 1', 'Caracteristica 2', 'Caracteristica 3'],
      es_popular: false,
      boton_texto: 'Comenzar',
      boton_url: '#contacto'
    }],
  }), []);

  // Default item para nuevos planes
  const defaultPlan = useMemo(() => ({
    nombre: 'Nuevo Plan',
    precio: 0,
    periodo: 'mes',
    descripcion: '',
    caracteristicas: [],
    es_popular: false,
    boton_texto: 'Comenzar',
    boton_url: '#contacto'
  }), []);

  // Hook para manejo del formulario
  const { form, setForm, cambios, handleSubmit, handleFieldChange } = useBlockEditor(
    contenido,
    defaultValues
  );

  // Hook para manejo del array de planes
  const {
    handleAgregar: handleAgregarPlan,
    handleEliminar: handleEliminarPlan,
    handleChange: handleChangePlan,
  } = useArrayItems(setForm, 'planes', defaultPlan);

  const planesVacios = !contenido.planes || contenido.planes.length === 0;

  // Callback para generación de IA de bloque completo
  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      titulo_seccion: generatedContent.titulo_seccion || prev.titulo_seccion,
      subtitulo_seccion: generatedContent.subtitulo_seccion || prev.subtitulo_seccion,
      planes: generatedContent.planes || prev.planes,
    }));
  }, [setForm]);

  // Funciones para arrays anidados (caracteristicas)
  const handleAgregarCaracteristica = useCallback((planIndex) => {
    setForm(prev => {
      const nuevos = [...prev.planes];
      nuevos[planIndex].caracteristicas = [...(nuevos[planIndex].caracteristicas || []), ''];
      return { ...prev, planes: nuevos };
    });
  }, [setForm]);

  const handleCambiarCaracteristica = useCallback((planIndex, featIndex, valor) => {
    setForm(prev => {
      const nuevos = [...prev.planes];
      nuevos[planIndex].caracteristicas[featIndex] = valor;
      return { ...prev, planes: nuevos };
    });
  }, [setForm]);

  const handleEliminarCaracteristica = useCallback((planIndex, featIndex) => {
    setForm(prev => {
      const nuevos = [...prev.planes];
      nuevos[planIndex].caracteristicas = nuevos[planIndex].caracteristicas.filter((_, i) => i !== featIndex);
      return { ...prev, planes: nuevos };
    });
  }, [setForm]);

  const columnasOptions = [
    { value: 2, label: '2 columnas' },
    { value: 3, label: '3 columnas' },
    { value: 4, label: '4 columnas' },
  ];

  const monedaOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR' },
    { value: 'MXN', label: 'MXN' },
    { value: 'COP', label: 'COP' },
    { value: 'ARS', label: 'ARS' },
  ];

  const periodoOptions = [
    { value: 'mes', label: 'por mes' },
    { value: 'ano', label: 'por ano' },
    { value: 'unico', label: 'pago unico' },
  ];

  // Renderizador de cada plan
  const renderPlanItem = useCallback((plan, planIndex) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Nombre"
          value={plan.nombre}
          onChange={(e) => handleChangePlan(planIndex, 'nombre', e.target.value)}
          className="dark:bg-gray-600 dark:border-gray-500"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Precio"
            type="number"
            value={plan.precio}
            onChange={(e) => handleChangePlan(planIndex, 'precio', parseFloat(e.target.value))}
            className="dark:bg-gray-600 dark:border-gray-500"
          />
          <Select
            label="Periodo"
            value={plan.periodo}
            onChange={(e) => handleChangePlan(planIndex, 'periodo', e.target.value)}
            options={periodoOptions}
            className="dark:bg-gray-600 dark:border-gray-500"
          />
        </div>
      </div>

      <Input
        label="Descripcion"
        value={plan.descripcion}
        onChange={(e) => handleChangePlan(planIndex, 'descripcion', e.target.value)}
        placeholder="Ideal para..."
        className="dark:bg-gray-600 dark:border-gray-500"
      />

      <div className="flex items-center gap-4">
        <ToggleSwitch
          checked={plan.es_popular}
          onChange={(checked) => handleChangePlan(planIndex, 'es_popular', checked)}
          label="Destacar como popular"
        />
        {plan.es_popular && (
          <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" />
            Popular
          </span>
        )}
      </div>

      {/* Caracteristicas (array anidado) */}
      <div className="p-3 bg-gray-100 dark:bg-gray-600 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Caracteristicas ({(plan.caracteristicas || []).length})
          </span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => handleAgregarCaracteristica(planIndex)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Agregar
          </Button>
        </div>
        <div className="space-y-2">
          {(plan.caracteristicas || []).map((feat, featIndex) => (
            <div key={featIndex} className="flex gap-2">
              <Input
                value={feat}
                onChange={(e) => handleCambiarCaracteristica(planIndex, featIndex, e.target.value)}
                placeholder="Caracteristica"
                size="sm"
                className="flex-1 dark:bg-gray-500 dark:border-gray-400"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleEliminarCaracteristica(planIndex, featIndex)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          {(plan.caracteristicas || []).length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
              Sin caracteristicas
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Texto boton"
          value={plan.boton_texto}
          onChange={(e) => handleChangePlan(planIndex, 'boton_texto', e.target.value)}
          className="dark:bg-gray-600 dark:border-gray-500"
        />
        <Input
          label="URL boton"
          value={plan.boton_url}
          onChange={(e) => handleChangePlan(planIndex, 'boton_url', e.target.value)}
          className="dark:bg-gray-600 dark:border-gray-500"
        />
      </div>
    </div>
  ), [handleChangePlan, handleAgregarCaracteristica, handleCambiarCaracteristica, handleEliminarCaracteristica, periodoOptions]);

  // Componente de preview
  const preview = useMemo(() => (
    <>
      <h4 className="font-bold text-center mb-4 text-gray-900 dark:text-white">
        {form.titulo_seccion}
      </h4>
      {form.subtitulo_seccion && (
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">
          {form.subtitulo_seccion}
        </p>
      )}
      <div className={`grid gap-3 grid-cols-${Math.min(form.planes.length, form.columnas)}`}>
        {form.planes.slice(0, 3).map((plan, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              plan.es_popular
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
            }`}
          >
            {plan.es_popular && (
              <div className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-1">
                Mas popular
              </div>
            )}
            <p className="font-medium text-sm dark:text-gray-100">{plan.nombre}</p>
            <p className="text-xl font-bold dark:text-white">
              ${plan.precio}<span className="text-xs font-normal text-gray-500">/{plan.periodo}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{plan.descripcion}</p>
          </div>
        ))}
      </div>
    </>
  ), [form]);

  return (
    <BaseBlockEditor
      tipo="pricing"
      industria={industria}
      mostrarAIBanner={planesVacios}
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
          tipo="pricing"
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

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Moneda"
          value={form.moneda}
          onChange={(e) => handleFieldChange('moneda', e.target.value)}
          options={monedaOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <div className="flex items-center gap-4 pt-6">
          <ToggleSwitch
            checked={form.mostrar_toggle_anual}
            onChange={(checked) => handleFieldChange('mostrar_toggle_anual', checked)}
            label="Toggle mensual/anual"
          />
        </div>
      </div>

      {/* Lista de planes */}
      <ArrayItemsEditor
        items={form.planes}
        label="Planes"
        onAgregar={handleAgregarPlan}
        onEliminar={handleEliminarPlan}
        itemName="Plan"
        itemIcon={DollarSign}
        iconColor="text-green-500"
        renderItem={renderPlanItem}
      />
    </BaseBlockEditor>
  );
}

export default memo(PricingEditor);
