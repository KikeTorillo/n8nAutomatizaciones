import { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Trash2, Star, DollarSign, GripVertical } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Textarea,
  ToggleSwitch
} from '@/components/ui';
import { AIGenerateButton, AISuggestionBanner } from '../AIGenerator';

/**
 * PricingEditor - Editor del bloque Pricing (Tablas de Precios)
 */
function PricingEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  const [form, setForm] = useState({
    titulo_seccion: contenido.titulo_seccion || 'Nuestros Planes',
    subtitulo_seccion: contenido.subtitulo_seccion || 'Elige el plan perfecto para ti',
    columnas: contenido.columnas || 3,
    moneda: contenido.moneda || 'USD',
    mostrar_toggle_anual: contenido.mostrar_toggle_anual || false,
    descuento_anual: contenido.descuento_anual || 20,
    planes: contenido.planes || [
      {
        nombre: 'Basico',
        precio: 29,
        periodo: 'mes',
        descripcion: 'Ideal para empezar',
        caracteristicas: ['Caracteristica 1', 'Caracteristica 2', 'Caracteristica 3'],
        es_popular: false,
        boton_texto: 'Comenzar',
        boton_url: '#contacto'
      }
    ],
  });

  const [cambios, setCambios] = useState(false);

  const planesVacios = !contenido.planes || contenido.planes.length === 0;

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      titulo_seccion: contenido.titulo_seccion || 'Nuestros Planes',
      subtitulo_seccion: contenido.subtitulo_seccion || 'Elige el plan perfecto para ti',
      columnas: contenido.columnas || 3,
      moneda: contenido.moneda || 'USD',
      mostrar_toggle_anual: contenido.mostrar_toggle_anual || false,
      descuento_anual: contenido.descuento_anual || 20,
      planes: contenido.planes || [],
    }));
  }, [form, contenido]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(form);
    setCambios(false);
  };

  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      titulo_seccion: generatedContent.titulo_seccion || prev.titulo_seccion,
      subtitulo_seccion: generatedContent.subtitulo_seccion || prev.subtitulo_seccion,
      planes: generatedContent.planes || prev.planes,
    }));
  }, []);

  const handleAgregarPlan = () => {
    setForm({
      ...form,
      planes: [...form.planes, {
        nombre: 'Nuevo Plan',
        precio: 0,
        periodo: 'mes',
        descripcion: '',
        caracteristicas: [],
        es_popular: false,
        boton_texto: 'Comenzar',
        boton_url: '#contacto'
      }]
    });
  };

  const handleEliminarPlan = (index) => {
    setForm({
      ...form,
      planes: form.planes.filter((_, i) => i !== index)
    });
  };

  const handleChangePlan = (index, campo, valor) => {
    const nuevos = [...form.planes];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setForm({ ...form, planes: nuevos });
  };

  const handleAgregarCaracteristica = (planIndex) => {
    const nuevos = [...form.planes];
    nuevos[planIndex].caracteristicas = [...(nuevos[planIndex].caracteristicas || []), ''];
    setForm({ ...form, planes: nuevos });
  };

  const handleCambiarCaracteristica = (planIndex, featIndex, valor) => {
    const nuevos = [...form.planes];
    nuevos[planIndex].caracteristicas[featIndex] = valor;
    setForm({ ...form, planes: nuevos });
  };

  const handleEliminarCaracteristica = (planIndex, featIndex) => {
    const nuevos = [...form.planes];
    nuevos[planIndex].caracteristicas = nuevos[planIndex].caracteristicas.filter((_, i) => i !== featIndex);
    setForm({ ...form, planes: nuevos });
  };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {planesVacios && (
        <AISuggestionBanner
          tipo="pricing"
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
                tipo="pricing"
                campo="titulo"
                industria={industria}
                onGenerate={(text) => setForm({ ...form, titulo_seccion: text })}
                size="sm"
              />
            </span>
          }
          value={form.titulo_seccion}
          onChange={(e) => setForm({ ...form, titulo_seccion: e.target.value })}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Select
          label="Columnas"
          value={form.columnas}
          onChange={(e) => setForm({ ...form, columnas: parseInt(e.target.value) })}
          options={columnasOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <Input
        label="Subtitulo (opcional)"
        value={form.subtitulo_seccion}
        onChange={(e) => setForm({ ...form, subtitulo_seccion: e.target.value })}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Moneda"
          value={form.moneda}
          onChange={(e) => setForm({ ...form, moneda: e.target.value })}
          options={monedaOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <div className="flex items-center gap-4 pt-6">
          <ToggleSwitch
            checked={form.mostrar_toggle_anual}
            onChange={(checked) => setForm({ ...form, mostrar_toggle_anual: checked })}
            label="Toggle mensual/anual"
          />
        </div>
      </div>

      {/* Lista de planes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Planes ({form.planes.length})
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={handleAgregarPlan}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar Plan
          </Button>
        </div>

        <div className="space-y-4">
          {form.planes.map((plan, planIndex) => (
            <div
              key={planIndex}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plan {planIndex + 1}
                  </span>
                  {plan.es_popular && (
                    <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Popular
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEliminarPlan(planIndex)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
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
                className="mb-3 dark:bg-gray-600 dark:border-gray-500"
              />

              <div className="flex items-center gap-4 mb-3">
                <ToggleSwitch
                  checked={plan.es_popular}
                  onChange={(checked) => handleChangePlan(planIndex, 'es_popular', checked)}
                  label="Destacar como popular"
                />
              </div>

              {/* Caracteristicas */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Caracteristicas</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => handleAgregarCaracteristica(planIndex)}
                  >
                    <Plus className="w-3 h-3" />
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
                        className="flex-1 dark:bg-gray-600 dark:border-gray-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminarCaracteristica(planIndex, featIndex)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
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
          ))}
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

export default PricingEditor;
