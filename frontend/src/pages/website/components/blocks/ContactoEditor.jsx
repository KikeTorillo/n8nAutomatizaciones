import { useState, useEffect } from 'react';
import { Save, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Button, Checkbox, Input } from '@/components/ui';

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
        <Input
          label="Título"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Contáctanos"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Input
          label="Subtítulo"
          value={form.subtitulo}
          onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
          placeholder="Estamos aquí para ayudarte"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      {/* Información de contacto */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Información de contacto</h4>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={
              <span className="flex items-center gap-1 text-xs">
                <MapPin className="w-3 h-3" />
                Dirección
              </span>
            }
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            placeholder="Calle 123, Ciudad"
            size="sm"
            className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          />
          <Input
            label={
              <span className="flex items-center gap-1 text-xs">
                <Phone className="w-3 h-3" />
                Teléfono
              </span>
            }
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="+52 123 456 7890"
            size="sm"
            className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          />
          <Input
            type="email"
            label={
              <span className="flex items-center gap-1 text-xs">
                <Mail className="w-3 h-3" />
                Email
              </span>
            }
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="contacto@negocio.com"
            size="sm"
            className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          />
          <Input
            label={
              <span className="flex items-center gap-1 text-xs">
                <Clock className="w-3 h-3" />
                Horario
              </span>
            }
            value={form.horario}
            onChange={(e) => setForm({ ...form, horario: e.target.value })}
            placeholder="Lun-Vie 9:00-18:00"
            size="sm"
            className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Opciones de formulario */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Formulario de contacto</h4>
          <Checkbox
            label="Mostrar"
            checked={form.mostrar_formulario}
            onChange={(e) => setForm({ ...form, mostrar_formulario: e.target.checked })}
          />
        </div>

        {form.mostrar_formulario && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Campos del formulario:</p>
            <div className="flex flex-wrap gap-2">
              {camposDisponibles.map((campo) => (
                <Button
                  key={campo.id}
                  type="button"
                  variant={form.formulario_campos.includes(campo.id) ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => toggleCampo(campo.id)}
                  className="text-xs"
                >
                  {campo.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Mapa de Google</h4>
          <Checkbox
            label="Mostrar"
            checked={form.mostrar_mapa}
            onChange={(e) => setForm({ ...form, mostrar_mapa: e.target.checked })}
          />
        </div>

        {form.mostrar_mapa && (
          <Input
            type="url"
            value={form.mapa_url}
            onChange={(e) => setForm({ ...form, mapa_url: e.target.value })}
            placeholder="URL del embed de Google Maps"
            size="sm"
            className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          />
        )}
      </div>

      {/* Preview */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
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
                <input placeholder="Nombre" className="w-full px-3 py-2 text-xs border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded" disabled />
              )}
              {form.formulario_campos.includes('email') && (
                <input placeholder="Email" className="w-full px-3 py-2 text-xs border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded" disabled />
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

export default ContactoEditor;
