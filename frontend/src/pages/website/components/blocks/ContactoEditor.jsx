import { useState, useEffect } from 'react';
import { Save, Loader2, MapPin, Phone, Mail, Clock } from 'lucide-react';

/**
 * ContactoEditor - Editor del bloque Contacto
 */
function ContactoEditor({ contenido, onGuardar, tema, isSaving }) {
  const [form, setForm] = useState({
    titulo: contenido.titulo || 'Contáctanos',
    subtitulo: contenido.subtitulo || '',
    direccion: contenido.direccion || '',
    telefono: contenido.telefono || '',
    email: contenido.email || '',
    horario: contenido.horario || '',
    mostrar_mapa: contenido.mostrar_mapa || false,
    mapa_url: contenido.mapa_url || '',
    mostrar_formulario: contenido.mostrar_formulario !== false,
    formulario_campos: contenido.formulario_campos || ['nombre', 'email', 'mensaje'],
  });

  const [cambios, setCambios] = useState(false);

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      titulo: contenido.titulo || 'Contáctanos',
      subtitulo: contenido.subtitulo || '',
      direccion: contenido.direccion || '',
      telefono: contenido.telefono || '',
      email: contenido.email || '',
      horario: contenido.horario || '',
      mostrar_mapa: contenido.mostrar_mapa || false,
      mapa_url: contenido.mapa_url || '',
      mostrar_formulario: contenido.mostrar_formulario !== false,
      formulario_campos: contenido.formulario_campos || ['nombre', 'email', 'mensaje'],
    }));
  }, [form, contenido]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(form);
    setCambios(false);
  };

  const camposDisponibles = [
    { id: 'nombre', label: 'Nombre' },
    { id: 'email', label: 'Email' },
    { id: 'telefono', label: 'Teléfono' },
    { id: 'asunto', label: 'Asunto' },
    { id: 'mensaje', label: 'Mensaje' },
  ];

  const toggleCampo = (campo) => {
    const campos = [...form.formulario_campos];
    const index = campos.indexOf(campo);
    if (index > -1) {
      campos.splice(index, 1);
    } else {
      campos.push(campo);
    }
    setForm({ ...form, formulario_campos: campos });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título
          </label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Contáctanos"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subtítulo
          </label>
          <input
            type="text"
            value={form.subtitulo}
            onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
            placeholder="Estamos aquí para ayudarte"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Información de contacto */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Información de contacto</h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <MapPin className="w-3 h-3" />
              Dirección
            </label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              placeholder="Calle 123, Ciudad"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Phone className="w-3 h-3" />
              Teléfono
            </label>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="+52 123 456 7890"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Mail className="w-3 h-3" />
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contacto@negocio.com"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Clock className="w-3 h-3" />
              Horario
            </label>
            <input
              type="text"
              value={form.horario}
              onChange={(e) => setForm({ ...form, horario: e.target.value })}
              placeholder="Lun-Vie 9:00-18:00"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Opciones de formulario */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Formulario de contacto</h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.mostrar_formulario}
              onChange={(e) => setForm({ ...form, mostrar_formulario: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600">Mostrar</span>
          </label>
        </div>

        {form.mostrar_formulario && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Campos del formulario:</p>
            <div className="flex flex-wrap gap-2">
              {camposDisponibles.map((campo) => (
                <button
                  key={campo.id}
                  type="button"
                  onClick={() => toggleCampo(campo.id)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    form.formulario_campos.includes(campo.id)
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {campo.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Mapa de Google</h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.mostrar_mapa}
              onChange={(e) => setForm({ ...form, mostrar_mapa: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600">Mostrar</span>
          </label>
        </div>

        {form.mostrar_mapa && (
          <input
            type="url"
            value={form.mapa_url}
            onChange={(e) => setForm({ ...form, mapa_url: e.target.value })}
            placeholder="URL del embed de Google Maps"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        )}
      </div>

      {/* Preview */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-bold mb-3" style={{ color: tema?.colores?.texto }}>
          {form.titulo}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 text-sm" style={{ color: tema?.colores?.texto }}>
            {form.direccion && (
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: tema?.colores?.primario }} />
                {form.direccion}
              </p>
            )}
            {form.telefono && (
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" style={{ color: tema?.colores?.primario }} />
                {form.telefono}
              </p>
            )}
            {form.email && (
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" style={{ color: tema?.colores?.primario }} />
                {form.email}
              </p>
            )}
          </div>
          {form.mostrar_formulario && (
            <div className="space-y-2">
              {form.formulario_campos.includes('nombre') && (
                <input placeholder="Nombre" className="w-full px-3 py-2 text-xs border rounded" disabled />
              )}
              {form.formulario_campos.includes('email') && (
                <input placeholder="Email" className="w-full px-3 py-2 text-xs border rounded" disabled />
              )}
              <button
                className="w-full py-2 text-white text-xs rounded"
                style={{ backgroundColor: tema?.colores?.primario || '#4F46E5' }}
              >
                Enviar
              </button>
            </div>
          )}
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

export default ContactoEditor;
