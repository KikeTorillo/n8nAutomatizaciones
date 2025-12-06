import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Loader2, CheckCircle } from 'lucide-react';
import { websiteApi } from '@/services/api/endpoints';

/**
 * ContactoPublico - Renderiza bloque de contacto en sitio público
 */
export default function ContactoPublico({ contenido, slug }) {
  const {
    titulo = 'Contacto',
    subtitulo = '',
    mostrarFormulario = true,
    mostrarMapa = false,
    mostrarInfo = true,
    direccion = '',
    telefono = '',
    email = '',
    horario = '',
    mapaUrl = '',
  } = contenido;

  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', mensaje: '' });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError('');

    try {
      await websiteApi.enviarContacto(slug, form);
      setEnviado(true);
      setForm({ nombre: '', email: '', telefono: '', mensaje: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar mensaje');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section id="contacto" className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-12">
          {subtitulo && (
            <span
              className="text-sm font-medium uppercase tracking-wider mb-2 block"
              style={{ color: 'var(--color-primario)' }}
            >
              {subtitulo}
            </span>
          )}
          <h2
            className="text-3xl sm:text-4xl font-bold"
            style={{ color: 'var(--color-texto)', fontFamily: 'var(--font-titulos)' }}
          >
            {titulo}
          </h2>
        </div>

        <div className={`grid grid-cols-1 ${mostrarFormulario && mostrarInfo ? 'lg:grid-cols-2' : ''} gap-12`}>
          {/* Info de contacto */}
          {mostrarInfo && (direccion || telefono || email || horario) && (
            <div className="space-y-6">
              {direccion && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `var(--color-primario)20` }}
                  >
                    <MapPin className="w-6 h-6" style={{ color: 'var(--color-primario)' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Direccion</h4>
                    <p className="text-gray-600">{direccion}</p>
                  </div>
                </div>
              )}

              {telefono && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `var(--color-primario)20` }}
                  >
                    <Phone className="w-6 h-6" style={{ color: 'var(--color-primario)' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Telefono</h4>
                    <a href={`tel:${telefono}`} className="text-gray-600 hover:underline">{telefono}</a>
                  </div>
                </div>
              )}

              {email && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `var(--color-primario)20` }}
                  >
                    <Mail className="w-6 h-6" style={{ color: 'var(--color-primario)' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Email</h4>
                    <a href={`mailto:${email}`} className="text-gray-600 hover:underline">{email}</a>
                  </div>
                </div>
              )}

              {horario && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `var(--color-primario)20` }}
                  >
                    <Clock className="w-6 h-6" style={{ color: 'var(--color-primario)' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Horario</h4>
                    <p className="text-gray-600">{horario}</p>
                  </div>
                </div>
              )}

              {/* Mapa */}
              {mostrarMapa && mapaUrl && (
                <div className="mt-6 rounded-xl overflow-hidden h-64">
                  <iframe
                    src={mapaUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>
          )}

          {/* Formulario */}
          {mostrarFormulario && (
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm">
              {enviado ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Mensaje enviado</h3>
                  <p className="text-gray-600">Te contactaremos pronto.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefono
                    </label>
                    <input
                      type="tel"
                      value={form.telefono}
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mensaje
                    </label>
                    <textarea
                      rows={4}
                      value={form.mensaje}
                      onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-primario)' }}
                  >
                    {enviando ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar mensaje
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
