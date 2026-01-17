import { forwardRef } from 'react';
import { Check, X, QrCode } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';

/**
 * Sección de confirmación RSVP para página pública de eventos
 */
const EventoRSVP = forwardRef(function EventoRSVP({
  invitado,
  configuracion,
  tema,
  visibleSections,
  rsvpForm,
  setRsvpForm,
  onConfirm,
  isLoading,
  qrImage,
  loadingQR,
}, ref) {
  if (!invitado) return null;

  return (
    <section
      ref={ref}
      data-section="rsvp"
      className="max-w-5xl mx-auto px-4 py-20"
    >
      <div className="max-w-lg mx-auto">
        <div className={`text-center mb-10 ${visibleSections.has('rsvp') ? 'animate-fadeInUp' : 'opacity-0'}`}>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ color: tema.color_texto, fontFamily: tema.fuente_titulo }}
          >
            Confirmar Asistencia
          </h2>
        </div>

        {invitado.estado_rsvp === 'pendiente' ? (
          <div
            className={`rounded-3xl p-8 ${visibleSections.has('rsvp') ? 'animate-scaleIn stagger-2' : 'opacity-0'}`}
            style={{
              backgroundColor: 'white',
              boxShadow: `0 20px 60px ${tema.color_primario}15`
            }}
          >
            <div className="text-center mb-8">
              <p className="text-lg" style={{ color: tema.color_texto_claro }}>
                Hola <span className="font-bold" style={{ color: tema.color_primario }}>{invitado.nombre}</span>
              </p>
              <p style={{ color: tema.color_texto_claro }}>
                Nos encantaría contar con tu presencia
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: tema.color_texto }}
                >
                  Número de personas
                </label>
                <select
                  value={rsvpForm.num_asistentes}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, num_asistentes: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 rounded-xl"
                  style={{
                    borderColor: tema.color_secundario,
                    backgroundColor: 'white',
                    color: tema.color_texto
                  }}
                >
                  {[...Array(invitado.max_acompanantes + 1)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1} persona{i > 0 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: tema.color_texto }}
                >
                  Mensaje (opcional)
                </label>
                <textarea
                  value={rsvpForm.mensaje_rsvp}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, mensaje_rsvp: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 rounded-xl"
                  style={{
                    borderColor: tema.color_secundario,
                    backgroundColor: 'white',
                    color: tema.color_texto
                  }}
                  placeholder="Un mensaje especial..."
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: tema.color_texto }}
                >
                  Restricciones dietéticas (opcional)
                </label>
                <input
                  type="text"
                  value={rsvpForm.restricciones_dieteticas}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, restricciones_dieteticas: e.target.value })}
                  placeholder="Ej: Vegetariano, sin gluten..."
                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors"
                  style={{
                    borderColor: tema.color_secundario,
                    backgroundColor: 'white',
                    color: tema.color_texto
                  }}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => onConfirm(true)}
                  disabled={isLoading}
                  className="flex-1 py-4 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: tema.color_primario,
                    boxShadow: `0 10px 30px ${tema.color_primario}40`
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" />
                    Confirmo
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onConfirm(false)}
                  disabled={isLoading}
                  className="flex-1 py-4 rounded-xl font-semibold border-2 transition-all hover:scale-[1.02]"
                  style={{
                    borderColor: tema.color_secundario,
                    color: tema.color_texto_claro
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <X className="w-5 h-5" />
                    No asistiré
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <RSVPConfirmado
            invitado={invitado}
            configuracion={configuracion}
            tema={tema}
            visibleSections={visibleSections}
            qrImage={qrImage}
            loadingQR={loadingQR}
          />
        )}
      </div>
    </section>
  );
});

/**
 * Sub-componente para mostrar confirmación exitosa
 */
function RSVPConfirmado({ invitado, configuracion, tema, visibleSections, qrImage, loadingQR }) {
  return (
    <div
      className={`text-center rounded-3xl p-10 ${visibleSections.has('rsvp') ? 'animate-scaleIn' : 'opacity-0'}`}
      style={{
        backgroundColor: invitado.estado_rsvp === 'confirmado' ? tema.color_secundario : '#fee2e2'
      }}
    >
      <div
        className="inline-flex items-center gap-3 text-2xl font-bold mb-4"
        style={{
          color: invitado.estado_rsvp === 'confirmado' ? tema.color_primario : '#dc2626'
        }}
      >
        {invitado.estado_rsvp === 'confirmado' ? (
          <>
            <Check className="w-8 h-8" />
            <span>¡Asistencia Confirmada!</span>
          </>
        ) : (
          <>
            <X className="w-8 h-8" />
            <span>No asistirás al evento</span>
          </>
        )}
      </div>

      {invitado.estado_rsvp === 'confirmado' && invitado.num_asistentes > 0 && (
        <p style={{ color: tema.color_texto_claro }}>
          {invitado.num_asistentes} persona{invitado.num_asistentes > 1 ? 's' : ''} confirmada{invitado.num_asistentes > 1 ? 's' : ''}
        </p>
      )}

      {/* Mensaje de confirmación personalizado */}
      {invitado.estado_rsvp === 'confirmado' && configuracion.mensaje_confirmacion && (
        <p className="mt-4 text-lg italic" style={{ color: tema.color_texto }}>
          {configuracion.mensaje_confirmacion}
        </p>
      )}

      {/* Código QR para check-in */}
      {invitado.estado_rsvp === 'confirmado' && configuracion.mostrar_qr_invitado === true && (
        <div className="mt-8 pt-6 border-t" style={{ borderColor: tema.color_secundario }}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="w-5 h-5" style={{ color: tema.color_primario }} />
            <p className="font-medium" style={{ color: tema.color_texto }}>
              Tu pase de entrada
            </p>
          </div>
          {loadingQR ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : qrImage ? (
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-lg inline-block">
                <img
                  src={qrImage}
                  alt="Código QR de entrada"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm mt-4" style={{ color: tema.color_texto_claro }}>
                Muestra este código en la entrada
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Mesa asignada */}
      {invitado.estado_rsvp === 'confirmado' && invitado.mesa_nombre && (
        <div className="mt-8 pt-6 border-t" style={{ borderColor: tema.color_secundario }}>
          <div className="text-center">
            <p className="text-sm mb-2" style={{ color: tema.color_texto_claro }}>
              Tu mesa asignada
            </p>
            <p
              className="text-3xl font-bold"
              style={{ color: tema.color_primario }}
            >
              {invitado.mesa_numero ? `Mesa ${invitado.mesa_numero}` : invitado.mesa_nombre}
            </p>
            {invitado.mesa_numero && invitado.mesa_nombre !== `Mesa ${invitado.mesa_numero}` && (
              <p className="text-sm mt-1" style={{ color: tema.color_texto_claro }}>
                {invitado.mesa_nombre}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EventoRSVP;
