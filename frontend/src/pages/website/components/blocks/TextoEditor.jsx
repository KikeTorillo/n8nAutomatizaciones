/**
 * ====================================================================
 * TEXTO EDITOR (Refactorizado)
 * ====================================================================
 *
 * Editor del bloque de texto enriquecido.
 * Usa BaseBlockEditor con toolbar de formateo HTML.
 *
 * @version 2.0.0
 * @since 2026-02-03
 */

import { memo, useCallback, useMemo } from 'react';
import { Bold, Italic, List, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { sanitizeHTML } from '@/lib/sanitize';
import { AIGenerateButton } from '../AIGenerator';
import { useBlockEditor } from '../../hooks';
import BaseBlockEditor from './BaseBlockEditor';

/**
 * TextoEditor - Editor del bloque de texto enriquecido
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Function} props.onGuardar - Callback para guardar
 * @param {Object} props.tema - Tema del sitio
 * @param {boolean} props.isSaving - Estado de guardado
 * @param {string} props.industria - Industria para AI
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

  // Verificar si el contenido esta vacio
  const contenidoVacio = !contenido.html || contenido.html.trim() === '';

  // Callback para generacion de IA de contenido de texto
  const handleAIGenerate = useCallback((generatedContent) => {
    const content = generatedContent.contenido || generatedContent;
    const htmlContent = content.includes('<') ? content : `<p>${content}</p>`;
    setForm(prev => ({
      ...prev,
      html: htmlContent,
    }));
  }, [setForm]);

  // Insertar etiqueta HTML en posicion del cursor
  const insertTag = (openTag, closeTag) => {
    const textarea = document.getElementById('texto-html');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = form.html;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + openTag + selectedText + closeTag + text.substring(end);
    handleFieldChange('html', newText);
  };

  // Opciones de select
  const anchoOptions = [
    { value: 'full', label: 'Ancho completo' },
    { value: 'medium', label: 'Mediano (75%)' },
    { value: 'narrow', label: 'Angosto (50%)' },
  ];

  const paddingOptions = [
    { value: 'none', label: 'Sin espaciado' },
    { value: 'small', label: 'Pequeno' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Grande' },
  ];

  // Componente de preview
  const preview = useMemo(() => (
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
  ), [form.titulo, form.html, form.ancho, form.padding, form.alineacion, tema?.colores?.texto]);

  return (
    <BaseBlockEditor
      tipo="texto"
      industria={industria}
      mostrarAIBanner={contenidoVacio}
      onAIGenerate={handleAIGenerate}
      cambios={cambios}
      handleSubmit={handleSubmit}
      onGuardar={onGuardar}
      isSaving={isSaving}
      preview={preview}
    >
      <Input
        label="Titulo (opcional)"
        value={form.titulo}
        onChange={(e) => handleFieldChange('titulo', e.target.value)}
        placeholder="Titulo de la seccion"
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
                contexto={{ tema: 'informacion general del negocio' }}
                onGenerate={(text) => handleFieldChange('html', text.includes('<') ? text : `<p>${text}</p>`)}
                size="sm"
              />
            </span>
          }
          value={form.html}
          onChange={(e) => handleFieldChange('html', e.target.value)}
          placeholder="<p>Escribe tu contenido aqui...</p>"
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
    </BaseBlockEditor>
  );
}

export default memo(TextoEditor);
