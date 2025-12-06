import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';

/**
 * ServiciosEditor - Editor del bloque Servicios
 */
function ServiciosEditor({ contenido, onGuardar, tema, isSaving }) {
  const [form, setForm] = useState({
    titulo: contenido.titulo || 'Nuestros Servicios',
    subtitulo: contenido.subtitulo || '',
    servicios: contenido.servicios || [
      { nombre: '', descripcion: '', icono: '', precio: '' }
    ],
    columnas: contenido.columnas || 3,
  });

  const [cambios, setCambios] = useState(false);

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      titulo: contenido.titulo || 'Nuestros Servicios',
      subtitulo: contenido.subtitulo || '',
      servicios: contenido.servicios || [
        { nombre: '', descripcion: '', icono: '', precio: '' }
      ],
      columnas: contenido.columnas || 3,
    }));
  }, [form, contenido]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(form);
    setCambios(false);
  };

  const handleAgregarServicio = () => {
    setForm({
      ...form,
      servicios: [...form.servicios, { nombre: '', descripcion: '', icono: '', precio: '' }]
    });
  };

  const handleEliminarServicio = (index) => {
    setForm({
      ...form,
      servicios: form.servicios.filter((_, i) => i !== index)
    });
  };

  const handleServicioChange = (index, campo, valor) => {
    const nuevosServicios = [...form.servicios];
    nuevosServicios[index] = { ...nuevosServicios[index], [campo]: valor };
    setForm({ ...form, servicios: nuevosServicios });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título de sección
          </label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Nuestros Servicios"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Columnas
          </label>
          <select
            value={form.columnas}
            onChange={(e) => setForm({ ...form, columnas: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={2}>2 columnas</option>
            <option value={3}>3 columnas</option>
            <option value={4}>4 columnas</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subtítulo (opcional)
        </label>
        <input
          type="text"
          value={form.subtitulo}
          onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
          placeholder="Lo que podemos hacer por ti"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Lista de servicios */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Servicios ({form.servicios.length})
          </label>
          <button
            type="button"
            onClick={handleAgregarServicio}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>

        <div className="space-y-3">
          {form.servicios.map((servicio, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start gap-2">
                <GripVertical className="w-5 h-5 text-gray-400 mt-2 cursor-grab" />
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={servicio.nombre}
                    onChange={(e) => handleServicioChange(index, 'nombre', e.target.value)}
                    placeholder="Nombre del servicio"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <textarea
                    value={servicio.descripcion}
                    onChange={(e) => handleServicioChange(index, 'descripcion', e.target.value)}
                    placeholder="Descripción breve"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={servicio.icono}
                      onChange={(e) => handleServicioChange(index, 'icono', e.target.value)}
                      placeholder="Icono (ej: Scissors)"
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={servicio.precio}
                      onChange={(e) => handleServicioChange(index, 'precio', e.target.value)}
                      placeholder="Precio (opcional)"
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleEliminarServicio(index)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-bold text-center mb-1" style={{ color: tema?.colores?.texto || '#1F2937' }}>
          {form.titulo}
        </h4>
        {form.subtitulo && (
          <p className="text-sm text-center text-gray-500 mb-4">{form.subtitulo}</p>
        )}
        <div className={`grid gap-3 grid-cols-${Math.min(form.columnas, form.servicios.length)}`}>
          {form.servicios.slice(0, 4).map((s, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-sm font-medium">{s.nombre || 'Servicio'}</p>
              {s.precio && <p className="text-xs text-indigo-600 mt-1">{s.precio}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Botón guardar */}
      {cambios && (
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar cambios
          </button>
        </div>
      )}
    </form>
  );
}

export default ServiciosEditor;
