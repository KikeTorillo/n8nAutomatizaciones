import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Textarea
} from '@/components/ui';

/**
 * FooterEditor - Editor del bloque Footer
 */
function FooterEditor({ contenido, onGuardar, tema, isSaving }) {
  const [form, setForm] = useState({
    copyright: contenido.copyright || `© ${new Date().getFullYear()} Mi Negocio. Todos los derechos reservados.`,
    logo: contenido.logo || '',
    descripcion: contenido.descripcion || '',
    links: contenido.links || [
      { texto: 'Inicio', url: '/' },
      { texto: 'Servicios', url: '/servicios' },
      { texto: 'Contacto', url: '/contacto' },
    ],
    redes_sociales: contenido.redes_sociales || [],
    columnas: contenido.columnas || 1,
    estilo: contenido.estilo || 'oscuro',
  });

  const [cambios, setCambios] = useState(false);

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      copyright: contenido.copyright || `© ${new Date().getFullYear()} Mi Negocio. Todos los derechos reservados.`,
      logo: contenido.logo || '',
      descripcion: contenido.descripcion || '',
      links: contenido.links || [
        { texto: 'Inicio', url: '/' },
        { texto: 'Servicios', url: '/servicios' },
        { texto: 'Contacto', url: '/contacto' },
      ],
      redes_sociales: contenido.redes_sociales || [],
      columnas: contenido.columnas || 1,
      estilo: contenido.estilo || 'oscuro',
    }));
  }, [form, contenido]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(form);
    setCambios(false);
  };

  const handleAgregarLink = () => {
    setForm({
      ...form,
      links: [...form.links, { texto: '', url: '' }]
    });
  };

  const handleEliminarLink = (index) => {
    setForm({
      ...form,
      links: form.links.filter((_, i) => i !== index)
    });
  };

  const handleLinkChange = (index, campo, valor) => {
    const nuevos = [...form.links];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setForm({ ...form, links: nuevos });
  };

  const handleAgregarRed = () => {
    setForm({
      ...form,
      redes_sociales: [...form.redes_sociales, { red: 'facebook', url: '' }]
    });
  };

  const handleEliminarRed = (index) => {
    setForm({
      ...form,
      redes_sociales: form.redes_sociales.filter((_, i) => i !== index)
    });
  };

  const handleRedChange = (index, campo, valor) => {
    const nuevos = [...form.redes_sociales];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setForm({ ...form, redes_sociales: nuevos });
  };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Estilo"
          value={form.estilo}
          onChange={(e) => setForm({ ...form, estilo: e.target.value })}
          options={estiloOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Input
          type="url"
          label="Logo URL (opcional)"
          value={form.logo}
          onChange={(e) => setForm({ ...form, logo: e.target.value })}
          placeholder="https://ejemplo.com/logo.png"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <Textarea
        label="Descripción breve (opcional)"
        value={form.descripcion}
        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        placeholder="Breve descripción del negocio"
        rows={2}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Input
        label="Texto de copyright"
        value={form.copyright}
        onChange={(e) => setForm({ ...form, copyright: e.target.value })}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Links */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Enlaces del menú</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAgregarLink}
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>

        <div className="space-y-2">
          {form.links.map((link, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={link.texto}
                onChange={(e) => handleLinkChange(index, 'texto', e.target.value)}
                placeholder="Texto"
                inputSize="sm"
                className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
              />
              <Input
                value={link.url}
                onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                placeholder="/url"
                inputSize="sm"
                className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleEliminarLink(index)}
                className="text-gray-400 hover:text-red-500 dark:hover:bg-gray-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Redes sociales */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Redes sociales</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAgregarRed}
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>

        <div className="space-y-2">
          {form.redes_sociales.map((red, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select
                value={red.red}
                onChange={(e) => handleRedChange(index, 'red', e.target.value)}
                options={redesOptions}
                className="w-32 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
              />
              <Input
                type="url"
                value={red.url}
                onChange={(e) => handleRedChange(index, 'url', e.target.value)}
                placeholder="URL del perfil"
                inputSize="sm"
                className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleEliminarRed(index)}
                className="text-gray-400 hover:text-red-500 dark:hover:bg-gray-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
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

export default FooterEditor;
