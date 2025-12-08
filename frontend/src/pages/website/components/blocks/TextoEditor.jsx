import { useState, useEffect } from 'react';
import { Save, Bold, Italic, List, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

/**
 * TextoEditor - Editor del bloque de texto enriquecido
 */
function TextoEditor({ contenido, onGuardar, tema, isSaving }) {
  const [form, setForm] = useState({
    titulo: contenido.titulo || '',
    html: contenido.html || '',
    alineacion: contenido.alineacion || 'left',
    ancho: contenido.ancho || 'full',
    padding: contenido.padding || 'normal',
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

  const insertTag = (openTag, closeTag) => {
    const textarea = document.getElementById('texto-html');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = form.html;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + openTag + selectedText + closeTag + text.substring(end);
    setForm({ ...form, html: newText });
  };

  const anchoOptions = [
    { value: 'full', label: 'Ancho completo' },
    { value: 'medium', label: 'Mediano (75%)' },
    { value: 'narrow', label: 'Angosto (50%)' },
  ];

  const paddingOptions = [
    { value: 'none', label: 'Sin espaciado' },
    { value: 'small', label: 'Pequeño' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Grande' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Título (opcional)"
        value={form.titulo}
        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
        placeholder="Título de la sección"
      />

      {/* Toolbar de formateo */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertTag('<strong>', '</strong>')}
          title="Negrita"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertTag('<em>', '</em>')}
          title="Cursiva"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertTag('<ul>\n<li>', '</li>\n</ul>')}
          title="Lista"
        >
          <List className="w-4 h-4" />
        </Button>
        <div className="h-6 w-px bg-gray-300 mx-1" />
        <Button
          type="button"
          variant={form.alineacion === 'left' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setForm({ ...form, alineacion: 'left' })}
          title="Alinear izquierda"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={form.alineacion === 'center' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setForm({ ...form, alineacion: 'center' })}
          title="Centrar"
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={form.alineacion === 'right' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setForm({ ...form, alineacion: 'right' })}
          title="Alinear derecha"
        >
          <AlignRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor de texto */}
      <div>
        <Textarea
          id="texto-html"
          label="Contenido (HTML)"
          value={form.html}
          onChange={(e) => setForm({ ...form, html: e.target.value })}
          placeholder="<p>Escribe tu contenido aquí...</p>"
          rows={8}
          className="font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Puedes usar etiquetas HTML: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Ancho del contenido"
          value={form.ancho}
          onChange={(e) => setForm({ ...form, ancho: e.target.value })}
          options={anchoOptions}
        />
        <Select
          label="Espaciado"
          value={form.padding}
          onChange={(e) => setForm({ ...form, padding: e.target.value })}
          options={paddingOptions}
        />
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
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        </div>
      )}
    </form>
  );
}

export default TextoEditor;
