import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Image, Loader2, GripVertical } from 'lucide-react';

/**
 * GaleriaEditor - Editor del bloque Galería
 */
function GaleriaEditor({ contenido, onGuardar, tema, isSaving }) {
  const [form, setForm] = useState({
    titulo: contenido.titulo || '',
    subtitulo: contenido.subtitulo || '',
    imagenes: contenido.imagenes || [],
    columnas: contenido.columnas || 3,
    espaciado: contenido.espaciado || 'normal', // none, small, normal, large
    estilo: contenido.estilo || 'grid', // grid, masonry, carousel
    lightbox: contenido.lightbox !== false,
  });

  const [cambios, setCambios] = useState(false);

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      titulo: contenido.titulo || '',
      subtitulo: contenido.subtitulo || '',
      imagenes: contenido.imagenes || [],
      columnas: contenido.columnas || 3,
      espaciado: contenido.espaciado || 'normal',
      estilo: contenido.estilo || 'grid',
      lightbox: contenido.lightbox !== false,
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
      imagenes: [...form.imagenes, { url: '', alt: '', titulo: '' }]
    });
  };

  const handleEliminar = (index) => {
    setForm({
      ...form,
      imagenes: form.imagenes.filter((_, i) => i !== index)
    });
  };

  const handleChange = (index, campo, valor) => {
    const nuevas = [...form.imagenes];
    nuevas[index] = { ...nuevas[index], [campo]: valor };
    setForm({ ...form, imagenes: nuevas });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título (opcional)
          </label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Nuestra Galería"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subtítulo (opcional)
          </label>
          <input
            type="text"
            value={form.subtitulo}
            onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
            placeholder="Nuestros mejores trabajos"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Columnas
          </label>
          <select
            value={form.columnas}
            onChange={(e) => setForm({ ...form, columnas: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Espaciado
          </label>
          <select
            value={form.espaciado}
            onChange={(e) => setForm({ ...form, espaciado: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="none">Sin espacio</option>
            <option value="small">Pequeño</option>
            <option value="normal">Normal</option>
            <option value="large">Grande</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estilo
          </label>
          <select
            value={form.estilo}
            onChange={(e) => setForm({ ...form, estilo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="grid">Cuadrícula</option>
            <option value="masonry">Masonry</option>
            <option value="carousel">Carrusel</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.lightbox}
            onChange={(e) => setForm({ ...form, lightbox: e.target.checked })}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700">Abrir en lightbox al hacer clic</span>
        </label>
      </div>

      {/* Lista de imágenes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Imágenes ({form.imagenes.length})
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

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {form.imagenes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay imágenes</p>
              <button
                type="button"
                onClick={handleAgregar}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                Agregar primera imagen
              </button>
            </div>
          ) : (
            form.imagenes.map((imagen, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200"
              >
                <GripVertical className="w-5 h-5 text-gray-400 mt-2 cursor-grab flex-shrink-0" />

                {imagen.url ? (
                  <img
                    src={imagen.url}
                    alt={imagen.alt}
                    className="w-16 h-16 object-cover rounded flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    <Image className="w-6 h-6 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <input
                    type="url"
                    value={imagen.url}
                    onChange={(e) => handleChange(index, 'url', e.target.value)}
                    placeholder="URL de la imagen"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={imagen.alt}
                    onChange={(e) => handleChange(index, 'alt', e.target.value)}
                    placeholder="Texto alternativo"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleEliminar(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 rounded-lg p-4">
        {form.titulo && (
          <h4 className="font-bold text-center mb-3" style={{ color: tema?.colores?.texto }}>
            {form.titulo}
          </h4>
        )}
        <div
          className={`grid gap-${form.espaciado === 'none' ? '0' : form.espaciado === 'small' ? '1' : form.espaciado === 'large' ? '4' : '2'}`}
          style={{ gridTemplateColumns: `repeat(${Math.min(form.columnas, form.imagenes.length || 3)}, 1fr)` }}
        >
          {(form.imagenes.length > 0 ? form.imagenes.slice(0, 6) : [1, 2, 3]).map((img, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-200 rounded overflow-hidden"
            >
              {typeof img === 'object' && img.url ? (
                <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-8 h-8 text-gray-400" />
                </div>
              )}
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

export default GaleriaEditor;
