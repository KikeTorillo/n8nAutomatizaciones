/**
 * ====================================================================
 * FOOTER EDITOR (Refactorizado)
 * ====================================================================
 *
 * Editor del bloque Footer.
 * Usa BaseBlockEditor y ArrayItemsEditor.
 *
 * @version 2.0.0
 * @since 2026-02-03
 */

import { memo, useCallback, useMemo } from 'react';
import { Link2, Share2 } from 'lucide-react';
import { Input, Select, Textarea } from '@/components/ui';
import { useBlockEditor, useArrayItems } from '../../hooks';
import BaseBlockEditor from './BaseBlockEditor';
import { ArrayItemsEditor } from './fields';

/**
 * FooterEditor - Editor del bloque Footer
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Function} props.onGuardar - Callback para guardar
 * @param {Object} props.tema - Tema del sitio
 * @param {boolean} props.isSaving - Estado de guardado
 */
function FooterEditor({ contenido, onGuardar, tema, isSaving }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    copyright: `© ${new Date().getFullYear()} Mi Negocio. Todos los derechos reservados.`,
    logo: '',
    descripcion: '',
    links: [
      { texto: 'Inicio', url: '/' },
      { texto: 'Servicios', url: '/servicios' },
      { texto: 'Contacto', url: '/contacto' },
    ],
    redes_sociales: [],
    columnas: 1,
    estilo: 'oscuro',
  }), []);

  // Default items para arrays
  const defaultLink = useMemo(() => ({ texto: '', url: '' }), []);
  const defaultRed = useMemo(() => ({ red: 'facebook', url: '' }), []);

  // Hook para manejo del formulario
  const { form, setForm, cambios, handleSubmit, handleFieldChange } = useBlockEditor(
    contenido,
    defaultValues
  );

  // Hook para manejo del array de links
  const {
    handleAgregar: handleAgregarLink,
    handleEliminar: handleEliminarLink,
    handleChange: handleLinkChange,
  } = useArrayItems(setForm, 'links', defaultLink);

  // Hook para manejo del array de redes sociales
  const {
    handleAgregar: handleAgregarRed,
    handleEliminar: handleEliminarRed,
    handleChange: handleRedChange,
  } = useArrayItems(setForm, 'redes_sociales', defaultRed);

  const estiloOptions = [
    { value: 'oscuro', label: 'Oscuro' },
    { value: 'claro', label: 'Claro' },
    { value: 'primario', label: 'Color primario' },
  ];

  const redesOptions = [
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'whatsapp', label: 'WhatsApp' },
  ];

  // Renderizador de cada link
  const renderLinkItem = useCallback((link, index) => (
    <div className="grid grid-cols-2 gap-2">
      <Input
        label="Texto"
        value={link.texto}
        onChange={(e) => handleLinkChange(index, 'texto', e.target.value)}
        placeholder="Inicio"
        size="sm"
        className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
      />
      <Input
        label="URL"
        value={link.url}
        onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
        placeholder="/pagina"
        size="sm"
        className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
      />
    </div>
  ), [handleLinkChange]);

  // Renderizador de cada red social
  const renderRedItem = useCallback((red, index) => (
    <div className="grid grid-cols-2 gap-2">
      <Select
        label="Red Social"
        value={red.red}
        onChange={(e) => handleRedChange(index, 'red', e.target.value)}
        options={redesOptions}
        className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
      />
      <Input
        label="URL del perfil"
        type="url"
        value={red.url}
        onChange={(e) => handleRedChange(index, 'url', e.target.value)}
        placeholder="https://..."
        size="sm"
        className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
      />
    </div>
  ), [handleRedChange, redesOptions]);

  // Componente de preview
  const preview = useMemo(() => (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: form.estilo === 'oscuro' ? '#1F2937' :
          form.estilo === 'primario' ? tema?.colores?.primario || '#4F46E5' :
          '#F3F4F6',
        color: form.estilo === 'claro' ? '#1F2937' : '#FFFFFF',
      }}
    >
      {form.logo && (
        <img src={form.logo} alt="Logo" className="h-8 mb-3" />
      )}
      {form.descripcion && (
        <p className="text-sm opacity-80 mb-3">{form.descripcion}</p>
      )}
      <div className="flex gap-4 text-sm mb-3">
        {form.links.map((link, i) => (
          <span key={i} className="opacity-80 hover:opacity-100">
            {link.texto}
          </span>
        ))}
      </div>
      <p className="text-xs opacity-60">{form.copyright}</p>
    </div>
  ), [form, tema]);

  return (
    <BaseBlockEditor
      tipo="footer"
      mostrarAIBanner={false}
      cambios={cambios}
      handleSubmit={handleSubmit}
      onGuardar={onGuardar}
      isSaving={isSaving}
      preview={preview}
    >
      {/* Configuracion general */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Estilo"
          value={form.estilo}
          onChange={(e) => handleFieldChange('estilo', e.target.value)}
          options={estiloOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Input
          type="url"
          label="Logo URL (opcional)"
          value={form.logo}
          onChange={(e) => handleFieldChange('logo', e.target.value)}
          placeholder="https://ejemplo.com/logo.png"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <Textarea
        label="Descripcion breve (opcional)"
        value={form.descripcion}
        onChange={(e) => handleFieldChange('descripcion', e.target.value)}
        placeholder="Breve descripcion del negocio"
        rows={2}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Input
        label="Texto de copyright"
        value={form.copyright}
        onChange={(e) => handleFieldChange('copyright', e.target.value)}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Links del menú */}
      <ArrayItemsEditor
        items={form.links}
        label="Enlaces del menu"
        onAgregar={handleAgregarLink}
        onEliminar={handleEliminarLink}
        itemName="Enlace"
        itemIcon={Link2}
        iconColor="text-blue-500"
        showDragHandle={false}
        renderItem={renderLinkItem}
      />

      {/* Redes sociales */}
      <ArrayItemsEditor
        items={form.redes_sociales}
        label="Redes sociales"
        onAgregar={handleAgregarRed}
        onEliminar={handleEliminarRed}
        itemName="Red"
        itemIcon={Share2}
        iconColor="text-pink-500"
        showDragHandle={false}
        renderItem={renderRedItem}
      />
    </BaseBlockEditor>
  );
}

export default memo(FooterEditor);
