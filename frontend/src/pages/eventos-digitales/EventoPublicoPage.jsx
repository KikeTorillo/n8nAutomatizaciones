import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Gift,
  MessageCircle,
  Users,
  Heart,
  Send,
  ExternalLink,
  Check,
  X,
  PartyPopper
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import {
  useEventoPublico,
  useInvitacionPublica,
  useConfirmarRSVP,
} from '@/hooks/useEventosDigitales';
import { eventosDigitalesApi } from '@/services/api/endpoints';

/**
 * Página pública del evento digital (RSVP)
 * Accesible en /e/:slug o /e/:slug/:token
 */
function EventoPublicoPage() {
  const { slug, token } = useParams();
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('inicio');
  const [rsvpForm, setRsvpForm] = useState({
    asistira: null,
    num_asistentes: 1,
    mensaje_rsvp: '',
    restricciones_dieteticas: '',
  });
  const [felicitacionForm, setFelicitacionForm] = useState({
    nombre_autor: '',
    mensaje: '',
  });
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Queries
  const { data: eventoPublico, isLoading: loadingEvento, error: errorEvento } = token
    ? useInvitacionPublica(slug, token)
    : useEventoPublico(slug);

  // Mutations
  const confirmarRSVP = useConfirmarRSVP();

  const evento = token ? eventoPublico?.evento : eventoPublico;
  const invitado = token ? eventoPublico?.invitado : null;

  // Countdown timer
  useEffect(() => {
    if (!evento?.fecha_evento) return;

    const updateCountdown = () => {
      const eventDate = new Date(evento.fecha_evento);
      if (evento.hora_evento) {
        const [hours, minutes] = evento.hora_evento.split(':');
        eventDate.setHours(parseInt(hours), parseInt(minutes));
      }

      const now = new Date();
      const diff = eventDate - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [evento?.fecha_evento, evento?.hora_evento]);

  const handleRSVP = async (asistira) => {
    if (!token) {
      toast.error('Necesitas un link personalizado para confirmar asistencia');
      return;
    }

    try {
      await confirmarRSVP.mutateAsync({
        slug,
        token,
        data: {
          asistira,
          num_asistentes: asistira ? rsvpForm.num_asistentes : 0,
          mensaje_rsvp: rsvpForm.mensaje_rsvp || undefined,
          restricciones_dieteticas: rsvpForm.restricciones_dieteticas || undefined,
        }
      });
      toast.success(asistira ? 'Asistencia confirmada' : 'Respuesta registrada');
      setRsvpForm({ ...rsvpForm, asistira });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEnviarFelicitacion = async (e) => {
    e.preventDefault();

    if (!felicitacionForm.nombre_autor.trim() || !felicitacionForm.mensaje.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      // Usar API directa para felicitaciones públicas
      await eventosDigitalesApi.crearFelicitacion(evento.id, {
        nombre_autor: felicitacionForm.nombre_autor.trim(),
        mensaje: felicitacionForm.mensaje.trim(),
        invitado_id: invitado?.id,
      });
      toast.success('Felicitación enviada. Será visible cuando los anfitriones la aprueben.');
      setFelicitacionForm({ nombre_autor: '', mensaje: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar felicitación');
    }
  };

  if (loadingEvento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (errorEvento || !evento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <PartyPopper className="w-16 h-16 text-pink-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Evento no encontrado</h1>
          <p className="text-gray-600">El evento que buscas no existe o ya no está disponible</p>
        </div>
      </div>
    );
  }

  const configuracion = evento.configuracion || {};
  const ubicaciones = evento.ubicaciones || [];
  const regalos = evento.regalos || [];
  const felicitaciones = evento.felicitaciones?.filter(f => f.aprobada) || [];

  const galeria = evento.galeria_urls || [];

  const sections = [
    { id: 'inicio', label: 'Inicio' },
    ...(galeria.length > 0 ? [{ id: 'galeria', label: 'Galería' }] : []),
    ...(configuracion.mostrar_ubicaciones !== false && ubicaciones.length > 0 ? [{ id: 'ubicaciones', label: 'Ubicaciones' }] : []),
    ...(configuracion.mostrar_mesa_regalos !== false && regalos.length > 0 ? [{ id: 'regalos', label: 'Regalos' }] : []),
    ...(configuracion.permitir_felicitaciones !== false ? [{ id: 'felicitaciones', label: 'Felicitaciones' }] : []),
    ...(token ? [{ id: 'rsvp', label: 'Confirmar' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center gap-6 overflow-x-auto py-3">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  text-sm font-medium whitespace-nowrap transition-colors pb-1 border-b-2
                  ${activeSection === section.id
                    ? 'text-pink-600 border-pink-500'
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                  }
                `}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Section: Inicio */}
        {activeSection === 'inicio' && (
          <div className="text-center space-y-8">
            {/* Portada Hero */}
            {evento.portada_url && (
              <div className="relative -mx-4 sm:mx-0 sm:rounded-2xl overflow-hidden">
                <img
                  src={evento.portada_url}
                  alt={evento.nombre}
                  className="w-full h-64 sm:h-80 md:h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            )}

            {/* Header */}
            <div className="space-y-4">
              {invitado && (
                <p className="text-lg text-pink-600">
                  Querido/a <span className="font-semibold">{invitado.nombre}</span>
                </p>
              )}
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 font-serif">
                {evento.nombre}
              </h1>
              {evento.descripcion && (
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {configuracion.mensaje_bienvenida || evento.descripcion}
                </p>
              )}
            </div>

            {/* Fecha y Hora */}
            <div className="bg-white/60 rounded-2xl p-6 inline-block">
              <div className="flex items-center gap-6 justify-center flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-pink-500" />
                  <span className="text-lg font-medium">
                    {new Date(evento.fecha_evento).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                {evento.hora_evento && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-6 h-6 text-pink-500" />
                    <span className="text-lg font-medium">{evento.hora_evento}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Countdown */}
            {configuracion.mostrar_contador !== false && (
              <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
                {[
                  { value: countdown.days, label: 'Días' },
                  { value: countdown.hours, label: 'Horas' },
                  { value: countdown.minutes, label: 'Minutos' },
                  { value: countdown.seconds, label: 'Segundos' },
                ].map((item) => (
                  <div key={item.label} className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-3xl font-bold text-pink-600">{item.value}</p>
                    <p className="text-xs text-gray-500">{item.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* RSVP Button */}
            {token && invitado && invitado.estado_rsvp === 'pendiente' && (
              <div className="pt-4">
                <Button
                  size="lg"
                  onClick={() => setActiveSection('rsvp')}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Confirmar Asistencia
                </Button>
              </div>
            )}

            {invitado && invitado.estado_rsvp === 'confirmado' && (
              <div className="bg-green-50 text-green-700 rounded-xl p-4 inline-block">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Asistencia Confirmada</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section: Galería */}
        {activeSection === 'galeria' && galeria.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-900">Galería</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galeria.map((url, index) => (
                <div key={index} className="aspect-square rounded-xl overflow-hidden shadow-sm">
                  <img
                    src={url}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Ubicaciones */}
        {activeSection === 'ubicaciones' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-900">Ubicaciones</h2>
            <div className="grid gap-4">
              {ubicaciones.map((ubi) => (
                <div key={ubi.id} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{ubi.nombre}</h3>
                      <p className="text-sm text-pink-600 uppercase">{ubi.tipo}</p>
                      {ubi.hora && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Clock className="w-4 h-4" />{ubi.hora}
                        </p>
                      )}
                      {ubi.direccion && (
                        <p className="text-sm text-gray-600 mt-1">{ubi.direccion}</p>
                      )}
                      {ubi.google_maps_url && (
                        <a
                          href={ubi.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-pink-600 hover:underline mt-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ver en Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Mesa de Regalos */}
        {activeSection === 'regalos' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-900">Mesa de Regalos</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {regalos.filter(r => !r.comprado).map((regalo) => (
                <div key={regalo.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Gift className="w-6 h-6 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{regalo.nombre}</h3>
                      {regalo.descripcion && (
                        <p className="text-sm text-gray-600">{regalo.descripcion}</p>
                      )}
                      {regalo.precio && (
                        <p className="text-lg font-semibold text-pink-600 mt-1">
                          ${regalo.precio.toLocaleString()}
                        </p>
                      )}
                      {regalo.url_externa && (
                        <a
                          href={regalo.url_externa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-pink-600 hover:underline mt-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ver producto
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Felicitaciones */}
        {activeSection === 'felicitaciones' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-900">Felicitaciones</h2>

            {/* Form */}
            <form onSubmit={handleEnviarFelicitacion} className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Deja tu mensaje</h3>
              <div className="space-y-4">
                <Input
                  label="Tu Nombre"
                  value={felicitacionForm.nombre_autor}
                  onChange={(e) => setFelicitacionForm({ ...felicitacionForm, nombre_autor: e.target.value })}
                  placeholder="Escribe tu nombre"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                  <textarea
                    value={felicitacionForm.mensaje}
                    onChange={(e) => setFelicitacionForm({ ...felicitacionForm, mensaje: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Escribe tu felicitación..."
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Felicitación
                </Button>
              </div>
            </form>

            {/* List */}
            {felicitaciones.length > 0 && (
              <div className="space-y-4">
                {felicitaciones.map((fel) => (
                  <div key={fel.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="font-medium text-gray-900">{fel.nombre_autor}</p>
                    <p className="text-gray-600 mt-1 italic">"{fel.mensaje}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section: RSVP */}
        {activeSection === 'rsvp' && token && invitado && (
          <div className="max-w-md mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-900">Confirmar Asistencia</h2>

            {invitado.estado_rsvp === 'pendiente' ? (
              <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
                <div className="text-center">
                  <p className="text-gray-600">
                    Hola <span className="font-semibold">{invitado.nombre}</span>, nos encantaría contar con tu presencia.
                  </p>
                </div>

                {/* Número de asistentes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de personas que asistirán (incluyéndote)
                  </label>
                  <select
                    value={rsvpForm.num_asistentes}
                    onChange={(e) => setRsvpForm({ ...rsvpForm, num_asistentes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {[...Array(invitado.max_acompanantes + 1)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>

                {/* Mensaje opcional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje para los anfitriones (opcional)
                  </label>
                  <textarea
                    value={rsvpForm.mensaje_rsvp}
                    onChange={(e) => setRsvpForm({ ...rsvpForm, mensaje_rsvp: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Un mensaje especial..."
                  />
                </div>

                {/* Restricciones dietéticas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restricciones dietéticas (opcional)
                  </label>
                  <Input
                    value={rsvpForm.restricciones_dieteticas}
                    onChange={(e) => setRsvpForm({ ...rsvpForm, restricciones_dieteticas: e.target.value })}
                    placeholder="Ej: Vegetariano, sin gluten..."
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-4">
                  <Button
                    onClick={() => handleRSVP(true)}
                    disabled={confirmarRSVP.isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Confirmo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRSVP(false)}
                    disabled={confirmarRSVP.isLoading}
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <X className="w-5 h-5 mr-2" />
                    No asistiré
                  </Button>
                </div>
              </div>
            ) : (
              <div className={`text-center rounded-xl p-6 ${
                invitado.estado_rsvp === 'confirmado' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className={`inline-flex items-center gap-2 text-lg font-medium ${
                  invitado.estado_rsvp === 'confirmado' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {invitado.estado_rsvp === 'confirmado' ? (
                    <>
                      <Check className="w-6 h-6" />
                      <span>Asistencia Confirmada</span>
                    </>
                  ) : (
                    <>
                      <X className="w-6 h-6" />
                      <span>No asistirás al evento</span>
                    </>
                  )}
                </div>
                {invitado.estado_rsvp === 'confirmado' && invitado.num_asistentes > 0 && (
                  <p className="text-gray-600 mt-2">
                    {invitado.num_asistentes} persona(s) confirmada(s)
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500 text-sm">
        <p>Creado con Nexo</p>
      </footer>
    </div>
  );
}

export default EventoPublicoPage;
