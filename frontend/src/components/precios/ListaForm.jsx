import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';

/**
 * Formulario de Lista de Precios
 */
export default function ListaForm({ lista, monedas, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    codigo: lista?.codigo || '',
    nombre: lista?.nombre || '',
    descripcion: lista?.descripcion || '',
    moneda: lista?.moneda || 'MXN',
    descuento_global_pct: lista?.descuento_global_pct || 0,
    es_default: lista?.es_default || false,
    activo: lista?.activo !== false,
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.codigo || !formData.nombre) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Codigo *
          </label>
          <Input
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value.toUpperCase())}
            placeholder="Ej: MAYOREO"
            maxLength={20}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Moneda
          </label>
          <select
            value={formData.moneda}
            onChange={(e) => handleChange('moneda', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          >
            {monedas.map(m => (
              <option key={m.codigo} value={m.codigo}>
                {m.codigo} ({m.simbolo})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nombre *
        </label>
        <Input
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          placeholder="Ej: Precios Mayoreo"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descripcion
        </label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripcion opcional..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descuento Global (%)
        </label>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={formData.descuento_global_pct}
          onChange={(e) => handleChange('descuento_global_pct', parseFloat(e.target.value) || 0)}
          placeholder="0"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Se aplica a todos los productos de esta lista
        </p>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.activo}
            onChange={(e) => handleChange('activo', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Activa</span>
        </label>
        {!lista?.es_default && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.es_default}
              onChange={(e) => handleChange('es_default', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Es lista por defecto</span>
          </label>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !formData.codigo || !formData.nombre}>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {lista ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
