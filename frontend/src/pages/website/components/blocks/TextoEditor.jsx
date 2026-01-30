import { useCallback, useMemo } from 'react';
import { Save, Bold, Italic, List, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Textarea
} from '@/components/ui';
import { sanitizeHTML } from '@/lib/sanitize';
import { AIGenerateButton, AISuggestionBanner } from '../AIGenerator';
import { useBlockEditor } from '../../hooks';

/**
 * TextoEditor - Editor del bloque de texto enriquecido
 */
function TextoEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    titulo: '',
    html: '',
    alineacion: 'left',
    ancho: 'full',
    padding: 'normal',
  }), []);

  // Hook para manejo del formulario
  const { form, setForm, cambios, handleSubmit, handleFieldChange } = useBlockEditor(
    contenido,
    defaultValues
  );

  // Verificar si el contenido está esencialmente vacío
  const contenidoVacio = !contenido.html || contenido.html.trim() === '';

  // Callback para generación de IA de contenido de texto
  const handleAIGenerate = useCallback((generatedContent) => {
    const content = generatedContent.contenido || generatedContent;
    // Envolver en párrafos si no tiene HTML
    const htmlContent = content.includes('<') ? content : `<p>${content}</p>`;
    setForm(prev => ({
      ...prev,
      html: htmlContent,
    }));
  }, [setForm]);

  const insertTag = (openTag, closeTag) => {
    const textarea = document.getElementById('texto-html');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = form.html;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + openTag + selectedText + closeTag + text.substring(end);
    handleFieldChange('html', newText);
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
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-4">
      {/* Banner de sugerencia IA para contenido vacío */}
      {contenidoVacio && (
        <AISuggestionBanner
          tipo="texto"
          industria={industria}
          onGenerate={handleAIGenerate}
        />
      )}

      <Input
        label="Título (opcional)"
        value={form.titulo}
        onChange={(e) => handleFieldChange('titulo', e.target.value)}
        placeholder="Título de la sección"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Toolbar de formateo */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertTag('<strong>', '</strong>')}
          title="Negrita"
          className="dark:hover:bg-gray-600"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertTag('<em>', '</em>')}
          title="Cursiva"
          className="dark:hover:bg-gray-600"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertTag('<ul>\n<li>', '</li>\n</ul>')}
          title="Lista"
          className="dark:hover:bg-gray-600"
        >
          <List className="w-4 h-4" />
        </Button>
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
        <Button
          type="button"
          variant={form.alineacion === 'left' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleFieldChange('alineacion', 'left')}
          title="Alinear izquierda"
          className="dark:hover:bg-gray-600"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={form.alineacion === 'center' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleFieldChange('alineacion', 'center')}
          title="Centrar"
          className="dark:hover:bg-gray-600"
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={form.alineacion === 'right' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleFieldChange('alineacion', 'right')}
          title="Alinear derecha"
          className="dark:hover:bg-gray-600"
        >
          <AlignRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor de texto */}
      <div>
        <Textarea
          id="texto-html"
          label={
            <span className="flex items-center gap-2">
              Contenido (HTML)
              <AIGenerateButton
                tipo="texto"
                campo="contenido"
                industria={industria}
                contexto={{ tema: 'información general del negocio' }}
                onGenerate={(text) => handleFieldChange('html', text.includes('<') ? text : `<p>${text}</p>`)}
                size="sm"
              />
            </span>
          }
          value={form.html}
          onChange={(e) => handleFieldChange('html', e.target.value)}
          placeholder="<p>Escribe tu contenido aquí...</p>"
          rows={8}
          className="font-mono text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Puedes usar etiquetas HTML: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Ancho del contenido"
          value={form.ancho}
          onChange={(e) => handleFieldChange('ancho', e.target.value)}
          options={anchoOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Select
          label="Espaciado"
          value={form.padding}
          onChange={(e) => handleFieldChange('padding', e.target.value)}
          options={paddingOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      {/* Preview */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
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
            className="prose prose-sm max-w-none dark:prose-invert"
            style={{ color: tema?.colores?.texto }}
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(form.html) || '<p class="text-gray-400 dark:text-gray-500">Vista previa del contenido...</p>' }}
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
