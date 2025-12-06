import { useState, useEffect } from 'react';
import { Save, Bold, Italic, List, Loader2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

/**
 * TextoEditor - Editor del bloque de texto enriquecido
 */
function TextoEditor({ contenido, onGuardar, tema, isSaving }) {
  const [form, setForm] = useState({
    titulo: contenido.titulo || '',
    html: contenido.html || '',
    alineacion: contenido.alineacion || 'left',
    ancho: contenido.ancho || 'full', // full, medium, narrow
    padding: contenido.padding || 'normal', // none, small, normal, large
  });

  const [cambios, setCambios] = useState(false);

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      titulo: contenido.titulo || '',
      html: contenido.html || '',
      alineacion: contenido.alineacion || 'left',
      ancho: contenido.ancho || 'full',
      padding: contenido.padding || 'normal',
    }));
  }, [form, contenido]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(form);
    setCambios(false);
  };

  // Funciones para formateo básico
  const insertTag = (openTag, closeTag) => {
    const textarea = document.getElementById('texto-html');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = form.html;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + openTag + selectedText + closeTag + text.substring(end);
    setForm({ ...form, html: newText });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Título (opcional)
        </label>
        <input
          type="text"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Título de la sección"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Toolbar de formateo */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <button
          type="button"
          onClick={() => insertTag('<strong>', '</strong>')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Negrita"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertTag('<em>', '</em>')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Cursiva"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertTag('<ul>\n<li>', '</li>\n</ul>')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Lista"
        >
          <List className="w-4 h-4" />
        </button>
        <div className="h-6 w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => setForm({ ...form, alineacion: 'left' })}
          className={`p-2 rounded transition-colors ${form.alineacion === 'left' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-200'}`}
          title="Alinear izquierda"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, alineacion: 'center' })}
          className={`p-2 rounded transition-colors ${form.alineacion === 'center' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-200'}`}
          title="Centrar"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, alineacion: 'right' })}
          className={`p-2 rounded transition-colors ${form.alineacion === 'right' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-200'}`}
          title="Alinear derecha"
        >
          <AlignRight className="w-4 h-4" />
        </button>
      </div>

      {/* Editor de texto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contenido (HTML)
        </label>
        <textarea
          id="texto-html"
          value={form.html}
          onChange={(e) => setForm({ ...form, html: e.target.value })}
          placeholder="<p>Escribe tu contenido aquí...</p>"
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Puedes usar etiquetas HTML: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ancho del contenido
          </label>
          <select
            value={form.ancho}
            onChange={(e) => setForm({ ...form, ancho: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="full">Ancho completo</option>
            <option value="medium">Mediano (75%)</option>
            <option value="narrow">Angosto (50%)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Espaciado
          </label>
          <select
            value={form.padding}
            onChange={(e) => setForm({ ...form, padding: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="none">Sin espaciado</option>
            <option value="small">Pequeño</option>
            <option value="normal">Normal</option>
            <option value="large">Grande</option>
          </select>
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div
          className={`
            ${form.ancho === 'medium' ? 'max-w-3xl' : form.ancho === 'narrow' ? 'max-w-xl' : ''}
            ${form.padding === 'small' ? 'py-2' : form.padding === 'normal' ? 'py-4' : form.padding === 'large' ? 'py-8' : ''}
            ${form.alineacion === 'center' ? 'mx-auto text-center' : form.alineacion === 'right' ? 'ml-auto text-right' : ''}
          `}
        >
          {form.titulo && (
            <h3 className="text-lg font-bold mb-3" style={{ color: tema?.colores?.texto }}>
              {form.titulo}
            </h3>
          )}
          <div
            className="prose prose-sm max-w-none"
            style={{ color: tema?.colores?.texto }}
            dangerouslySetInnerHTML={{ __html: form.html || '<p class="text-gray-400">Vista previa del contenido...</p>' }}
          />
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

export default TextoEditor;
