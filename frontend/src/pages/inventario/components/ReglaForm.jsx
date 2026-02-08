import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { TIPOS_ALCANCE, FRECUENCIAS, DIAS_SEMANA } from './ReglaCard';

export default function ReglaForm({ regla, rutas, proveedores, categorias, productos, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    nombre: regla?.nombre || '',
    tipo_alcance: regla?.tipo_alcance || 'producto',
    producto_id: regla?.producto_id || '',
    categoria_id: regla?.categoria_id || '',
    proveedor_id: regla?.proveedor_id || '',
    ruta_operacion_id: regla?.ruta_operacion_id || '',
    frecuencia: regla?.frecuencia || 'diario',
    dias_semana_aplicacion: regla?.dias_semana_aplicacion || [],
    stock_minimo_trigger: regla?.stock_minimo_trigger || '',
    cantidad_a_ordenar: regla?.cantidad_a_ordenar || '',
    lead_time_dias: regla?.lead_time_dias || '',
    prioridad: regla?.prioridad || 1,
    activo: regla?.activo ?? true,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDiaToggle = (dia) => {
    setFormData((prev) => ({
      ...prev,
      dias_semana_aplicacion: prev.dias_semana_aplicacion.includes(dia)
        ? prev.dias_semana_aplicacion.filter((d) => d !== dia)
        : [...prev.dias_semana_aplicacion, dia],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      nombre: formData.nombre,
      ruta_id: formData.ruta_operacion_id ? Number(formData.ruta_operacion_id) : undefined,
      stock_minimo_trigger: formData.stock_minimo_trigger ? Number(formData.stock_minimo_trigger) : 0,
      cantidad_fija: formData.cantidad_a_ordenar ? Number(formData.cantidad_a_ordenar) : undefined,
      dias_semana: formData.dias_semana_aplicacion?.length > 0 ? formData.dias_semana_aplicacion : undefined,
      producto_id: formData.tipo_alcance === 'producto' && formData.producto_id ? Number(formData.producto_id) : undefined,
      categoria_id: formData.tipo_alcance === 'categoria' && formData.categoria_id ? Number(formData.categoria_id) : undefined,
      activo: formData.activo,
      prioridad: formData.prioridad || 0,
    };

    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
    onSubmit(data);
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const hintClass = "mt-1 text-xs text-gray-500 dark:text-gray-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div>
        <label className={labelClass}>Nombre de la regla *</label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          className={inputClass}
          required
          placeholder="Ej: Reabastecer lacteos semanalmente"
        />
      </div>

      {/* Tipo de alcance */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Alcance de la regla
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS_ALCANCE.map((tipo) => {
            const Icon = tipo.icon;
            return (
              <button
                key={tipo.value}
                type="button"
                onClick={() => handleChange('tipo_alcance', tipo.value)}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  formData.tipo_alcance === tipo.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tipo.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector segun tipo */}
      {formData.tipo_alcance === 'producto' && (
        <div>
          <label className={labelClass}>Producto *</label>
          <select value={formData.producto_id} onChange={(e) => handleChange('producto_id', e.target.value)} className={inputClass} required>
            <option value="">Seleccionar producto...</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.sku ? `[${p.sku}] ` : ''}{p.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {formData.tipo_alcance === 'categoria' && (
        <div>
          <label className={labelClass}>Categoria *</label>
          <select value={formData.categoria_id} onChange={(e) => handleChange('categoria_id', e.target.value)} className={inputClass} required>
            <option value="">Seleccionar categoria...</option>
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {formData.tipo_alcance === 'proveedor' && (
        <div>
          <label className={labelClass}>Proveedor *</label>
          <select value={formData.proveedor_id} onChange={(e) => handleChange('proveedor_id', e.target.value)} className={inputClass} required>
            <option value="">Seleccionar proveedor...</option>
            {proveedores?.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {/* Ruta de operacion */}
      <div>
        <label className={labelClass}>Ruta de Operacion *</label>
        <select value={formData.ruta_operacion_id} onChange={(e) => handleChange('ruta_operacion_id', e.target.value)} className={inputClass} required>
          <option value="">Seleccionar ruta...</option>
          {rutas?.map((r) => (
            <option key={r.id} value={r.id}>{r.nombre} ({r.tipo})</option>
          ))}
        </select>
        <p className={hintClass}>Define como se reabastece el producto (compra, produccion, etc.)</p>
      </div>

      {/* Frecuencia */}
      <div>
        <label className={labelClass}>Frecuencia de evaluacion</label>
        <select value={formData.frecuencia} onChange={(e) => handleChange('frecuencia', e.target.value)} className={inputClass}>
          {FRECUENCIAS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Dias de la semana */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Dias de aplicacion (opcional)
        </label>
        <div className="flex flex-wrap gap-2">
          {DIAS_SEMANA.map((dia) => (
            <button
              key={dia.value}
              type="button"
              onClick={() => handleDiaToggle(dia.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                formData.dias_semana_aplicacion.includes(dia.value)
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {dia.label.slice(0, 3)}
            </button>
          ))}
        </div>
        <p className={hintClass}>Si no se selecciona ninguno, la regla aplica todos los dias</p>
      </div>

      {/* Parametros de stock */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Stock trigger *</label>
          <input type="number" value={formData.stock_minimo_trigger} onChange={(e) => handleChange('stock_minimo_trigger', e.target.value)} className={inputClass} min="0" required placeholder="Ej: 5" />
          <p className={hintClass}>Genera OC cuando stock &le; este valor</p>
        </div>
        <div>
          <label className={labelClass}>Cantidad a ordenar</label>
          <input type="number" value={formData.cantidad_a_ordenar} onChange={(e) => handleChange('cantidad_a_ordenar', e.target.value)} className={inputClass} min="1" placeholder="Hasta stock max." />
          <p className={hintClass}>Cantidad fija o dejar vacio para calcular</p>
        </div>
      </div>

      {/* Lead time */}
      <div>
        <label className={labelClass}>Lead time (dias)</label>
        <input type="number" value={formData.lead_time_dias} onChange={(e) => handleChange('lead_time_dias', e.target.value)} className={inputClass} min="0" placeholder="Dias de anticipacion" />
        <p className={hintClass}>Considera stock proyectado si se especifica</p>
      </div>

      {/* Prioridad y estado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="activo"
            checked={formData.activo}
            onChange={(e) => handleChange('activo', e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="activo" className="text-sm text-gray-700 dark:text-gray-300">
            Regla activa
          </label>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Prioridad:</label>
          <select value={formData.prioridad} onChange={(e) => handleChange('prioridad', Number(e.target.value))} className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm">
            {[1, 2, 3, 4, 5].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isLoading} className="inline-flex items-center gap-2">
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
          {regla ? 'Guardar Cambios' : 'Crear Regla'}
        </Button>
      </div>
    </form>
  );
}
