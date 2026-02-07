/**
 * ====================================================================
 * RSVP BUTTON ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo rsvp_button en el canvas de posición libre.
 * Diseño sincronizado con RSVPPublico.jsx (vista pública).
 *
 * @version 2.0.0
 * @since 2026-02-04
 * @updated 2026-02-05 - Sincronizar diseño con RSVPPublico
 */

import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { Check, X, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

function RsvpButtonElementRenderer({
  elemento,
  tema,
  isEditing = false,
}) {
  const { contenido = {}, estilos = {} } = elemento;

  const titulo = contenido.titulo || 'Confirma tu Asistencia';
  const subtitulo = contenido.subtitulo;
  const mostrarMensaje = estilos.mostrar_mensaje !== false;
  const mostrarRestricciones = (estilos.mostrar_restricciones ?? contenido.pedir_restricciones) !== false;
  const maxAsistentes = 4;

  const INV = THEME_FALLBACK_COLORS.invitacion;
  const colorPrimario = tema?.color_primario || INV.primario;
  const colorSecundario = tema?.color_secundario || INV.acento;
  const colorTexto = tema?.color_texto || INV.texto;
  const colorTextoClaro = tema?.color_texto_claro || INV.textoClaro;
  const fuenteTitulo = tema?.fuente_titulo || 'inherit';

  const [form, setForm] = useState({
    num_asistentes: 1,
    mensaje_rsvp: '',
    restricciones_dieteticas: '',
  });

  return (
    <div
      className="rsvp-element w-full py-6"
      style={{ backgroundColor: colorSecundario + '20' }}
    >
      {/* Header */}
      <div className="text-center mb-6 px-4">
        <h2
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: colorTexto, fontFamily: fuenteTitulo }}
        >
          {titulo}
        </h2>
        {subtitulo && (
          <p className="text-sm" style={{ color: colorTextoClaro }}>
            {subtitulo}
          </p>
        )}
      </div>

      {/* Formulario */}
      <div
        className="bg-white rounded-3xl p-5 mx-4"
        style={{ boxShadow: `0 10px 40px ${colorPrimario}15` }}
      >
        {/* Número de asistentes */}
        <div className="mb-4">
          <label
            className="flex items-center gap-2 text-xs font-medium mb-1.5"
            style={{ color: colorTexto }}
          >
            <Users className="w-3.5 h-3.5" />
            Número de asistentes
          </label>
          <select
            value={form.num_asistentes}
            onChange={(e) => !isEditing && setForm({ ...form, num_asistentes: parseInt(e.target.value) })}
            className="w-full px-3 py-2 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2"
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
          <div className="mb-4">
            <label
              className="flex items-center gap-2 text-xs font-medium mb-1.5"
              style={{ color: colorTexto }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Mensaje (opcional)
            </label>
            <textarea
              placeholder="Escribe un mensaje para los anfitriones..."
              rows={2}
              readOnly={isEditing}
              className="w-full px-3 py-2 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 resize-none"
              style={{ borderColor: colorSecundario }}
            />
          </div>
        )}

        {/* Restricciones dietéticas */}
        {mostrarRestricciones && (
          <div className="mb-5">
            <label
              className="flex items-center gap-2 text-xs font-medium mb-1.5"
              style={{ color: colorTexto }}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Restricciones alimentarias (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Vegetariano, sin gluten..."
              readOnly={isEditing}
              className="w-full px-3 py-2 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2"
              style={{ borderColor: colorSecundario }}
            />
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-white text-sm"
            style={{ backgroundColor: colorPrimario }}
            onClick={(e) => isEditing && e.preventDefault()}
          >
            <Check className="w-4 h-4" />
            ¡Sí, asistiré!
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-sm"
            style={{
              backgroundColor: colorSecundario,
              color: colorTexto,
            }}
            onClick={(e) => isEditing && e.preventDefault()}
          >
            <X className="w-4 h-4" />
            No podré asistir
          </button>
        </div>
      </div>
    </div>
  );
}

RsvpButtonElementRenderer.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.object,
    estilos: PropTypes.object,
  }).isRequired,
  tema: PropTypes.shape({
    color_primario: PropTypes.string,
    color_secundario: PropTypes.string,
    color_texto: PropTypes.string,
    color_texto_claro: PropTypes.string,
    fuente_titulo: PropTypes.string,
  }),
  isEditing: PropTypes.bool,
};

export default memo(RsvpButtonElementRenderer);
