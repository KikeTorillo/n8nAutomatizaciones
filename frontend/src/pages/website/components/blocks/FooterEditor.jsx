import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Loader2 } from 'lucide-react';

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
    estilo: contenido.estilo || 'oscuro', // oscuro, claro, primario
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

  const redesDisponibles = [
    'facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'whatsapp'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estilo
          </label>
          <select
            value={form.estilo}
            onChange={(e) => setForm({ ...form, estilo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="oscuro">Oscuro</option>
            <option value="claro">Claro</option>
            <option value="primario">Color primario</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logo URL (opcional)
          </label>
          <input
            type="url"
            value={form.logo}
            onChange={(e) => setForm({ ...form, logo: e.target.value })}
            placeholder="https://ejemplo.com/logo.png"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción breve (opcional)
        </label>
        <textarea
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          placeholder="Breve descripción del negocio"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Texto de copyright
        </label>
        <input
          type="text"
          value={form.copyright}
          onChange={(e) => setForm({ ...form, copyright: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Links */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Enlaces del menú</h4>
          <button
            type="button"
            onClick={handleAgregarLink}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>

        <div className="space-y-2">
          {form.links.map((link, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={link.texto}
                onChange={(e) => handleLinkChange(index, 'texto', e.target.value)}
                placeholder="Texto"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="text"
                value={link.url}
                onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                placeholder="/url"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleEliminarLink(index)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Redes sociales */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Redes sociales</h4>
          <button
            type="button"
            onClick={handleAgregarRed}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>

        <div className="space-y-2">
          {form.redes_sociales.map((red, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={red.red}
                onChange={(e) => handleRedChange(index, 'red', e.target.value)}
                className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {redesDisponibles.map(r => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
              <input
                type="url"
                value={red.url}
                onChange={(e) => handleRedChange(index, 'url', e.target.value)}
                placeholder="URL del perfil"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleEliminarRed(index)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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

export default FooterEditor;
