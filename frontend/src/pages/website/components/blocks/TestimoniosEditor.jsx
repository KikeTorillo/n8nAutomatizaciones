import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Star, Loader2 } from 'lucide-react';

/**
 * TestimoniosEditor - Editor del bloque Testimonios
 */
function TestimoniosEditor({ contenido, onGuardar, tema, isSaving }) {
  const [form, setForm] = useState({
    titulo: contenido.titulo || 'Lo que dicen nuestros clientes',
    subtitulo: contenido.subtitulo || '',
    testimonios: contenido.testimonios || [
      { autor: '', cargo: '', texto: '', estrellas: 5, foto: '' }
    ],
    estilo: contenido.estilo || 'cards', // cards, carousel, simple
  });

  const [cambios, setCambios] = useState(false);

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      titulo: contenido.titulo || 'Lo que dicen nuestros clientes',
      subtitulo: contenido.subtitulo || '',
      testimonios: contenido.testimonios || [
        { autor: '', cargo: '', texto: '', estrellas: 5, foto: '' }
      ],
      estilo: contenido.estilo || 'cards',
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
      testimonios: [...form.testimonios, { autor: '', cargo: '', texto: '', estrellas: 5, foto: '' }]
    });
  };

  const handleEliminar = (index) => {
    setForm({
      ...form,
      testimonios: form.testimonios.filter((_, i) => i !== index)
    });
  };

  const handleChange = (index, campo, valor) => {
    const nuevos = [...form.testimonios];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setForm({ ...form, testimonios: nuevos });
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
            placeholder="Lo que dicen nuestros clientes"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estilo de presentación
          </label>
          <select
            value={form.estilo}
            onChange={(e) => setForm({ ...form, estilo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="cards">Tarjetas</option>
            <option value="carousel">Carrusel</option>
            <option value="simple">Simple</option>
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
          placeholder="Opiniones reales de clientes satisfechos"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Lista de testimonios */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Testimonios ({form.testimonios.length})
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
          {form.testimonios.map((testimonio, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-gray-500">Testimonio {index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleEliminar(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <textarea
                  value={testimonio.texto}
                  onChange={(e) => handleChange(index, 'texto', e.target.value)}
                  placeholder="El texto del testimonio..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={testimonio.autor}
                    onChange={(e) => handleChange(index, 'autor', e.target.value)}
                    placeholder="Nombre del cliente"
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={testimonio.cargo}
                    onChange={(e) => handleChange(index, 'cargo', e.target.value)}
                    placeholder="Cargo o ubicación"
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 mr-2">Estrellas:</span>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleChange(index, 'estrellas', n)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            n <= testimonio.estrellas
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <input
                    type="url"
                    value={testimonio.foto}
                    onChange={(e) => handleChange(index, 'foto', e.target.value)}
                    placeholder="URL foto (opcional)"
                    className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
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
        {form.testimonios[0] && (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="flex justify-center mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-4 h-4 ${
                    n <= (form.testimonios[0].estrellas || 5)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm italic text-gray-600 mb-2">
              "{form.testimonios[0].texto || 'Excelente servicio...'}"
            </p>
            <p className="text-xs font-medium" style={{ color: tema?.colores?.primario }}>
              - {form.testimonios[0].autor || 'Cliente'}
              {form.testimonios[0].cargo && `, ${form.testimonios[0].cargo}`}
            </p>
          </div>
        )}
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

export default TestimoniosEditor;
