import { forwardRef } from 'react';
import { Send } from 'lucide-react';

/**
 * Sección de libro de firmas/felicitaciones para página pública de eventos
 */
const EventoFelicitaciones = forwardRef(function EventoFelicitaciones({
  felicitaciones = [],
  tema,
  visibleSections,
  form,
  setForm,
  onSubmit,
}, ref) {
  return (
    <section
      ref={ref}
      data-section="felicitaciones"
      className="py-20"
      style={{ backgroundColor: tema.color_secundario + '30' }}
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className={`text-center mb-12 ${visibleSections.has('felicitaciones') ? 'animate-fadeInUp' : 'opacity-0'}`}>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ color: tema.color_texto, fontFamily: tema.fuente_titulo }}
          >
            Libro de Firmas
          </h2>
          <p className="text-lg" style={{ color: tema.color_texto_claro }}>
            Déjanos tus buenos deseos
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={onSubmit}
          className={`max-w-xl mx-auto rounded-3xl p-8 ${visibleSections.has('felicitaciones') ? 'animate-scaleIn stagger-2' : 'opacity-0'}`}
          style={{
            backgroundColor: 'white',
            boxShadow: `0 10px 40px ${tema.color_primario}10`
          }}
        >
          <div className="space-y-5">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: tema.color_texto }}
              >
                Tu Nombre
              </label>
              <input
                type="text"
                value={form.nombre_autor}
                onChange={(e) => setForm({ ...form, nombre_autor: e.target.value })}
                placeholder="Escribe tu nombre"
                required
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors"
                style={{
                  borderColor: tema.color_secundario,
                  backgroundColor: 'white',
                  color: tema.color_texto
                }}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: tema.color_texto }}
              >
                Tu Mensaje
              </label>
              <textarea
                value={form.mensaje}
                onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors"
                style={{
                  borderColor: tema.color_secundario,
                  backgroundColor: 'white',
                  color: tema.color_texto
                }}
                placeholder="Escribe tus buenos deseos..."
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: tema.color_primario,
                boxShadow: `0 10px 30px ${tema.color_primario}40`
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                Enviar Felicitación
              </span>
            </button>
          </div>
        </form>

        {/* Mensajes existentes */}
        {felicitaciones.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-6 mt-12">
            {felicitaciones.map((fel, idx) => (
              <div
                key={fel.id}
                className={`relative rounded-3xl p-6 transition-transform hover:scale-[1.02] ${visibleSections.has('felicitaciones') ? 'animate-fadeInUp' : 'opacity-0'}`}
                style={{
                  animationDelay: `${0.3 + idx * 0.1}s`,
                  backgroundColor: 'white',
                  boxShadow: `0 5px 20px ${tema.color_primario}10`
                }}
              >
                <div
                  className="absolute top-6 left-6 text-6xl opacity-10"
                  style={{ color: tema.color_primario, fontFamily: 'serif' }}
                >
                  "
                </div>
                <p
                  className="text-lg italic mb-4 relative z-10"
                  style={{ color: tema.color_texto }}
                >
                  {fel.mensaje}
                </p>
                <p
                  className="font-semibold"
                  style={{ color: tema.color_primario }}
                >
                  — {fel.nombre_autor}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

export default EventoFelicitaciones;
