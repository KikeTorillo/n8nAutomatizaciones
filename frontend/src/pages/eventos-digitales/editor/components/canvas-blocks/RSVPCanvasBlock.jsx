/**
 * ====================================================================
 * RSVP CANVAS BLOCK
 * ====================================================================
 * Bloque de confirmación de asistencia para invitaciones.
 * Diseño sincronizado con RSVPPublico.jsx (vista pública).
 *
 * @version 2.0.0
 * @since 2026-02-03
 * @updated 2026-02-05 - Sincronizar diseño con RSVPPublico
 */

import { memo, useState } from 'react';
import { Check, X, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

/**
 * RSVP Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 */
function RSVPCanvasBlock({ bloque, tema }) {
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  const titulo = contenido.titulo || 'Confirma tu Asistencia';
  const subtitulo = contenido.subtitulo;
  const mostrarMensaje = estilos.mostrar_mensaje !== false;
  const mostrarRestricciones = (estilos.mostrar_restricciones ?? contenido.pedir_restricciones) !== false;
  // Preview fijo: siempre mostrar selector de asistentes con max=4
  const maxAsistentes = 4;

  const INV = THEME_FALLBACK_COLORS.invitacion;
  const colorPrimario = tema?.color_primario || INV.primario;
  const colorSecundario = tema?.color_secundario || INV.acento;
  const colorTexto = tema?.color_texto || INV.texto;
  const colorTextoClaro = tema?.color_texto_claro || INV.textoClaro;

  const [form, setForm] = useState({
    num_asistentes: 1,
    mensaje_rsvp: '',
    restricciones_dieteticas: '',
  });

  return (
    <section
      className="py-20 px-6"
      style={{ backgroundColor: colorSecundario + '20' }}
    >
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: colorTexto, fontFamily: 'var(--fuente-titulos)' }}
          >
            {titulo}
          </h2>
          {subtitulo && (
            <p className="text-lg" style={{ color: colorTextoClaro }}>
              {subtitulo}
            </p>
          )}
        </div>

        {/* Formulario */}
        <div
          className="bg-white rounded-3xl p-6 md:p-8"
          style={{ boxShadow: `0 10px 40px ${colorPrimario}15` }}
        >
          {/* Número de asistentes */}
          <div className="mb-6">
            <label
              className="flex items-center gap-2 text-sm font-medium mb-2"
              style={{ color: colorTexto }}
            >
              <Users className="w-4 h-4" />
              Número de asistentes
            </label>
            <select
              value={form.num_asistentes}
              onChange={(e) => setForm({ ...form, num_asistentes: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2"
              style={{
                borderColor: colorSecundario,
                backgroundColor: 'white',
                color: colorTexto,
              }}
            >
              {[...Array(maxAsistentes)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i === 0 ? 'persona' : 'personas'}
                </option>
              ))}
            </select>
          </div>

          {/* Mensaje */}
          {mostrarMensaje && (
            <div className="mb-6">
              <label
                className="flex items-center gap-2 text-sm font-medium mb-2"
                style={{ color: colorTexto }}
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
                style={{ borderColor: colorSecundario }}
              />
            </div>
          )}

          {/* Restricciones dietéticas */}
          {mostrarRestricciones && (
            <div className="mb-8">
              <label
                className="flex items-center gap-2 text-sm font-medium mb-2"
                style={{ color: colorTexto }}
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
                style={{ borderColor: colorSecundario }}
              />
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
              style={{ backgroundColor: colorPrimario }}
            >
              <Check className="w-5 h-5" />
              ¡Sí, asistiré!
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: colorSecundario,
                color: colorTexto,
              }}
            >
              <X className="w-5 h-5" />
              No podré asistir
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(RSVPCanvasBlock);
