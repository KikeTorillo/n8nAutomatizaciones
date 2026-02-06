/**
 * ====================================================================
 * FELICITACIONES CANVAS BLOCK
 * ====================================================================
 * Bloque de felicitaciones/libro de firmas para vista canvas del editor.
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import { memo } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

function FelicitacionesCanvasBlock({ bloque, tema }) {
  const contenido = bloque.contenido || {};

  const titulo = contenido.titulo || 'Libro de Firmas';
  const subtitulo = contenido.subtitulo || 'Déjanos tus buenos deseos';
  const placeholderMensaje = contenido.placeholder_mensaje || 'Escribe tus buenos deseos...';

  const INV = THEME_FALLBACK_COLORS.invitacion;
  const colorPrimario = tema?.color_primario || INV.primario;
  const colorSecundario = tema?.color_secundario || INV.acento;
  const colorTexto = tema?.color_texto || INV.texto;
  const colorTextoClaro = tema?.color_texto_claro || INV.textoClaro;

  return (
    <section
      className="py-20 px-6"
      style={{ backgroundColor: colorSecundario + '30' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: colorTexto, fontFamily: 'var(--fuente-titulos)' }}
          >
            {titulo}
          </h2>
          {subtitulo && (
            <p className="max-w-2xl mx-auto" style={{ color: colorTextoClaro }}>
              {subtitulo}
            </p>
          )}
        </div>

        {/* Formulario preview */}
        <div
          className="max-w-xl mx-auto rounded-3xl p-6 mb-8"
          style={{ backgroundColor: 'white', boxShadow: `0 10px 40px ${colorPrimario}10` }}
        >
          <textarea
            placeholder={placeholderMensaje}
            disabled
            rows={3}
            className="w-full px-4 py-3 border-2 rounded-xl resize-none text-sm"
            style={{ borderColor: colorSecundario, color: colorTexto }}
          />
          <button
            className="mt-3 w-full py-3 text-white rounded-xl font-medium flex items-center justify-center gap-2 text-sm"
            style={{ backgroundColor: colorPrimario }}
          >
            <Send className="w-4 h-4" />
            Enviar Felicitación
          </button>
        </div>

        {/* Preview de felicitaciones */}
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { nombre: 'María García', mensaje: '¡Muchas felicidades! Les deseo lo mejor en esta nueva etapa.' },
            { nombre: 'Carlos López', mensaje: '¡Qué emoción! Los quiero mucho, disfruten este día.' },
          ].map((fel, idx) => (
            <div
              key={idx}
              className="relative rounded-3xl p-5"
              style={{ backgroundColor: 'white', boxShadow: `0 5px 20px ${colorPrimario}10` }}
            >
              <div
                className="absolute top-4 left-4 text-5xl opacity-10"
                style={{ color: colorPrimario, fontFamily: 'serif' }}
              >
                &ldquo;
              </div>
              <p
                className="text-sm italic mb-3 relative z-10"
                style={{ color: colorTexto }}
              >
                {fel.mensaje}
              </p>
              <p className="text-xs font-semibold" style={{ color: colorPrimario }}>
                — {fel.nombre}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(FelicitacionesCanvasBlock);
