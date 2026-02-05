/**
 * ====================================================================
 * FELICITACIONES PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza el libro de firmas / felicitaciones.
 * Permite enviar felicitaciones y ver las existentes.
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import { memo, useState, useEffect, useCallback } from 'react';
import { Send, MessageSquare, Loader2, Heart } from 'lucide-react';
import { eventosDigitalesApi } from '@/services/api/endpoints';

function FelicitacionesPublico({
  bloque,
  invitado,
  evento,
  tema,
  isVisible,
  className = '',
}) {
  const { contenido = {} } = bloque;

  const titulo = contenido.titulo || 'Libro de Firmas';
  const subtitulo = contenido.subtitulo || 'Déjanos tus buenos deseos';
  const placeholderMensaje = contenido.placeholder_mensaje || 'Escribe tus buenos deseos...';
  const textoAgradecimiento = contenido.texto_agradecimiento || '¡Gracias por tus palabras!';

  const [felicitaciones, setFelicitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const slug = evento?.slug;
  const token = invitado?.token;

  // Cargar felicitaciones
  useEffect(() => {
    if (!slug) return;

    eventosDigitalesApi.obtenerFelicitacionesPublicas(slug)
      .then(response => {
        const data = response.data?.data;
        setFelicitaciones(data?.felicitaciones || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!token || !mensaje.trim() || enviando) return;

    setEnviando(true);
    try {
      const response = await eventosDigitalesApi.enviarFelicitacionPublica(slug, token, {
        mensaje: mensaje.trim(),
      });
      const nueva = response.data?.data;
      if (nueva) {
        setFelicitaciones(prev => [nueva, ...prev]);
      }
      setMensaje('');
      setEnviado(true);
      setTimeout(() => setEnviado(false), 3000);
    } catch {
      // Silenciar error
    } finally {
      setEnviando(false);
    }
  }, [token, slug, mensaje, enviando]);

  const animationClass = isVisible ? 'animate-fadeInUp' : 'opacity-0';

  return (
    <section
      data-section="felicitaciones"
      className={`py-20 ${className}`}
      style={{ backgroundColor: tema?.color_secundario + '30' }}
    >
      <div className="max-w-5xl mx-auto px-4">
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

        {/* Formulario (solo si hay invitado con token) */}
        {token && (
          <form
            onSubmit={handleSubmit}
            className={`max-w-xl mx-auto rounded-3xl p-8 mb-12 ${animationClass}`}
            style={{
              backgroundColor: 'white',
              boxShadow: `0 10px 40px ${tema?.color_primario}10`,
            }}
          >
            {enviado ? (
              <div className="text-center py-4">
                <Heart
                  className="w-12 h-12 mx-auto mb-3 fill-current"
                  style={{ color: tema?.color_primario }}
                />
                <p
                  className="text-lg font-semibold"
                  style={{ color: tema?.color_texto }}
                >
                  {textoAgradecimiento}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: tema?.color_texto }}
                  >
                    Tu Mensaje
                  </label>
                  <textarea
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors"
                    style={{
                      borderColor: tema?.color_secundario,
                      backgroundColor: 'white',
                      color: tema?.color_texto,
                    }}
                    placeholder={placeholderMensaje}
                    required
                    minLength={5}
                    maxLength={1000}
                  />
                </div>
                <button
                  type="submit"
                  disabled={enviando || mensaje.trim().length < 5}
                  className="w-full py-4 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                  style={{
                    backgroundColor: tema?.color_primario,
                    boxShadow: `0 10px 30px ${tema?.color_primario}40`,
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    {enviando ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    {enviando ? 'Enviando...' : 'Enviar Felicitación'}
                  </span>
                </button>
              </div>
            )}
          </form>
        )}

        {/* Mensajes existentes */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: tema?.color_primario }}
            />
          </div>
        ) : felicitaciones.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-6">
            {felicitaciones.map((fel, idx) => (
              <div
                key={fel.id}
                className={`relative rounded-3xl p-6 transition-transform hover:scale-[1.02] ${animationClass}`}
                style={{
                  animationDelay: `${0.3 + idx * 0.1}s`,
                  backgroundColor: 'white',
                  boxShadow: `0 5px 20px ${tema?.color_primario}10`,
                }}
              >
                <div
                  className="absolute top-6 left-6 text-6xl opacity-10"
                  style={{ color: tema?.color_primario, fontFamily: 'serif' }}
                >
                  &ldquo;
                </div>
                <p
                  className="text-lg italic mb-4 relative z-10"
                  style={{ color: tema?.color_texto }}
                >
                  {fel.mensaje}
                </p>
                <p
                  className="font-semibold"
                  style={{ color: tema?.color_primario }}
                >
                  — {fel.nombre_autor}
                </p>
              </div>
            ))}
          </div>
        ) : !token ? (
          <div className="text-center py-8">
            <MessageSquare
              className="w-12 h-12 mx-auto mb-3 opacity-30"
              style={{ color: tema?.color_texto_claro }}
            />
            <p style={{ color: tema?.color_texto_claro }}>
              Aún no hay felicitaciones
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default memo(FelicitacionesPublico);
