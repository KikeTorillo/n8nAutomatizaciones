import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, User, Loader2 } from 'lucide-react';

/**
 * EquipoEditor - Editor del bloque Equipo
 */
function EquipoEditor({ contenido, onGuardar, tema, isSaving }) {
  const [form, setForm] = useState({
    titulo: contenido.titulo || 'Nuestro Equipo',
    subtitulo: contenido.subtitulo || '',
    miembros: contenido.miembros || [
      { nombre: '', cargo: '', foto: '', bio: '' }
    ],
    columnas: contenido.columnas || 3,
    mostrar_redes: contenido.mostrar_redes !== false,
  });

  const [cambios, setCambios] = useState(false);

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      titulo: contenido.titulo || 'Nuestro Equipo',
      subtitulo: contenido.subtitulo || '',
      miembros: contenido.miembros || [
        { nombre: '', cargo: '', foto: '', bio: '' }
      ],
      columnas: contenido.columnas || 3,
      mostrar_redes: contenido.mostrar_redes !== false,
    }));
  }, [form, contenido]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(form);
    setCambios(false);
  };

  const handleAgregar = () => {
    setForm({
      ...form,
      miembros: [...form.miembros, { nombre: '', cargo: '', foto: '', bio: '' }]
    });
  };

  const handleEliminar = (index) => {
    setForm({
      ...form,
      miembros: form.miembros.filter((_, i) => i !== index)
    });
  };

  const handleChange = (index, campo, valor) => {
    const nuevos = [...form.miembros];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setForm({ ...form, miembros: nuevos });
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
            placeholder="Nuestro Equipo"
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
          placeholder="Los profesionales que te atenderán"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Lista de miembros */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Miembros ({form.miembros.length})
          </label>
          <button
            type="button"
            onClick={handleAgregar}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>

        <div className="space-y-3">
          {form.miembros.map((miembro, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {miembro.foto ? (
                    <img
                      src={miembro.foto}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {miembro.nombre || `Miembro ${index + 1}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleEliminar(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={miembro.nombre}
                    onChange={(e) => handleChange(index, 'nombre', e.target.value)}
                    placeholder="Nombre completo"
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={miembro.cargo}
                    onChange={(e) => handleChange(index, 'cargo', e.target.value)}
                    placeholder="Cargo o especialidad"
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <input
                  type="url"
                  value={miembro.foto}
                  onChange={(e) => handleChange(index, 'foto', e.target.value)}
                  placeholder="URL de foto"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />

                <textarea
                  value={miembro.bio}
                  onChange={(e) => handleChange(index, 'bio', e.target.value)}
                  placeholder="Biografía breve (opcional)"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-bold text-center mb-4" style={{ color: tema?.colores?.texto }}>
          {form.titulo}
        </h4>
        <div className="flex justify-center gap-6">
          {form.miembros.slice(0, 3).map((miembro, i) => (
            <div key={i} className="text-center">
              {miembro.foto ? (
                <img
                  src={miembro.foto}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <p className="text-sm font-medium" style={{ color: tema?.colores?.texto }}>
                {miembro.nombre || 'Nombre'}
              </p>
              <p className="text-xs" style={{ color: tema?.colores?.primario }}>
                {miembro.cargo || 'Cargo'}
              </p>
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

export default EquipoEditor;
