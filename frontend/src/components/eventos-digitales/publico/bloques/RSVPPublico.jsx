/**
 * ====================================================================
 * RSVP PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza el formulario de confirmación de asistencia.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo, useState } from 'react';
import { Check, X, Users, MessageSquare, AlertCircle, Loader2, QrCode } from 'lucide-react';

function RSVPPublico({
  bloque,
  invitado,
  evento,
  tema,
  isVisible,
  onConfirm,
  isLoading,
  qrImage,
  loadingQR,
  className = '',
}) {
  const { contenido = {}, estilos = {} } = bloque;

  const titulo = contenido.titulo || 'Confirma tu asistencia';
  const subtitulo = contenido.subtitulo;
  const textoConfirmado = contenido.texto_confirmado || '¡Gracias por confirmar! Te esperamos.';
  // Fallback: editor usa texto_rechazado, compatible con texto_declinado
  const textoDeclinado = contenido.texto_rechazado || contenido.texto_declinado || 'Lamentamos que no puedas asistir.';

  // Fallbacks para campos que pueden venir de estilos o contenido
  // Editor guarda permitir_acompanantes, antes se usaba mostrar_num_asistentes
  const mostrarNumAsistentes = (estilos.mostrar_num_asistentes ?? contenido.permitir_acompanantes) !== false;
  const mostrarMensaje = estilos.mostrar_mensaje !== false;
  // Editor guarda pedir_restricciones, antes se usaba mostrar_restricciones
  const mostrarRestricciones = (estilos.mostrar_restricciones ?? contenido.pedir_restricciones) !== false;
  // Editor guarda max_acompanantes, antes se usaba max_asistentes
  const maxAsistentes = estilos.max_asistentes || contenido.max_acompanantes || 10;

  const [form, setForm] = useState({
    num_asistentes: invitado?.num_asistentes || 1,
    mensaje_rsvp: invitado?.mensaje_rsvp || '',
    restricciones_dieteticas: invitado?.restricciones_dieteticas || '',
  });

  const animationClass = isVisible ? 'animate-fadeInUp' : 'opacity-0';

  // Si no hay invitado (acceso público sin token), no mostrar RSVP
  if (!invitado) return null;

  const handleConfirm = (asistira) => {
    if (onConfirm) {
      onConfirm(asistira, form);
    }
  };

  const yaRespondio = invitado.estado_rsvp && invitado.estado_rsvp !== 'pendiente';
  const confirmado = invitado.estado_rsvp === 'confirmado';
  const declinado = invitado.estado_rsvp === 'declinado';

  return (
    <section
      data-section="rsvp"
      className={`py-20 ${className}`}
      style={{ backgroundColor: tema?.color_secundario + '20' }}
    >
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className={`text-center mb-12 ${animationClass}`}>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ color: tema?.color_texto, fontFamily: tema?.fuente_titulo }}
          >
            {titulo}
          </h2>
          {subtitulo && (
            <p className="text-lg" style={{ color: tema?.color_texto_claro }}>
              {subtitulo}
            </p>
          )}
        </div>

        {/* Ya respondió */}
        {yaRespondio ? (
          <div
            className={`bg-white rounded-3xl p-8 text-center ${animationClass}`}
            style={{ boxShadow: `0 10px 40px ${tema?.color_primario}15` }}
          >
            {confirmado ? (
              <>
                <div
                  className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ backgroundColor: '#10b98120' }}
                >
                  <Check className="w-10 h-10 text-green-500" />
                </div>
                <h3
                  className="text-2xl font-semibold mb-2"
                  style={{ color: tema?.color_texto }}
                >
                  ¡Asistencia Confirmada!
                </h3>
                <p style={{ color: tema?.color_texto_claro }}>{textoConfirmado}</p>

                {/* QR Code para check-in */}
                {evento?.configuracion?.mostrar_qr_invitado && (
                  <div className="mt-8">
                    <p
                      className="text-sm mb-4 font-medium"
                      style={{ color: tema?.color_texto }}
                    >
                      <QrCode className="w-4 h-4 inline mr-2" />
                      Tu código QR para el día del evento:
                    </p>
                    {loadingQR ? (
                      <div className="flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: tema?.color_primario }} />
                      </div>
                    ) : qrImage ? (
                      <img
                        src={qrImage}
                        alt="QR de acceso"
                        className="mx-auto w-48 h-48 rounded-lg shadow-md"
                      />
                    ) : null}
                  </div>
                )}
              </>
            ) : (
              <>
                <div
                  className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ backgroundColor: '#ef444420' }}
                >
                  <X className="w-10 h-10 text-red-500" />
                </div>
                <h3
                  className="text-2xl font-semibold mb-2"
                  style={{ color: tema?.color_texto }}
                >
                  Respuesta Registrada
                </h3>
                <p style={{ color: tema?.color_texto_claro }}>{textoDeclinado}</p>
              </>
            )}
          </div>
        ) : (
          /* Formulario RSVP */
          <div
            className={`bg-white rounded-3xl p-6 sm:p-8 ${animationClass}`}
            style={{ boxShadow: `0 10px 40px ${tema?.color_primario}15` }}
          >
            {/* Número de asistentes */}
            {mostrarNumAsistentes && (
              <div className="mb-6">
                <label
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: tema?.color_texto }}
                >
                  <Users className="w-4 h-4" />
                  Número de asistentes
                </label>
                <select
                  value={form.num_asistentes}
                  onChange={(e) => setForm({ ...form, num_asistentes: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2"
                  style={{
                    borderColor: tema?.color_secundario,
                    focusRingColor: tema?.color_primario,
                  }}
                >
                  {[...Array(maxAsistentes)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? 'persona' : 'personas'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mensaje */}
            {mostrarMensaje && (
              <div className="mb-6">
                <label
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: tema?.color_texto }}
                >
                  <MessageSquare className="w-4 h-4" />
                  Mensaje (opcional)
                </label>
                <textarea
                  value={form.mensaje_rsvp}
                  onChange={(e) => setForm({ ...form, mensaje_rsvp: e.target.value })}
                  placeholder="Escribe un mensaje para los anfitriones..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 resize-none"
                  style={{ borderColor: tema?.color_secundario }}
                />
              </div>
            )}

            {/* Restricciones dietéticas */}
            {mostrarRestricciones && (
              <div className="mb-8">
                <label
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: tema?.color_texto }}
                >
                  <AlertCircle className="w-4 h-4" />
                  Restricciones alimentarias (opcional)
                </label>
                <input
                  type="text"
                  value={form.restricciones_dieteticas}
                  onChange={(e) => setForm({ ...form, restricciones_dieteticas: e.target.value })}
                  placeholder="Ej: Vegetariano, sin gluten, alergia a mariscos..."
                  className="w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2"
                  style={{ borderColor: tema?.color_secundario }}
                />
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => handleConfirm(true)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ backgroundColor: '#10b981' }}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                ¡Sí, asistiré!
              </button>
              <button
                onClick={() => handleConfirm(false)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{
                  backgroundColor: tema?.color_secundario,
                  color: tema?.color_texto,
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <X className="w-5 h-5" />
                )}
                No podré asistir
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(RSVPPublico);
