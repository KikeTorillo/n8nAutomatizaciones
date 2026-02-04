/**
 * ====================================================================
 * RSVP CANVAS BLOCK
 * ====================================================================
 * Bloque de confirmación de asistencia para invitaciones.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo, useState } from 'react';
import { CheckCircle, X, Users, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * RSVP Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 */
function RSVPCanvasBlock({ bloque, tema }) {
  const contenido = bloque.contenido || {};

  // Usar || para fallbacks (strings vacíos necesitan ||, no default de desestructuración)
  const titulo = contenido.titulo || 'Confirma tu Asistencia';
  const subtitulo = contenido.subtitulo;
  const permitir_acompanantes = contenido.permitir_acompanantes ?? true;
  const max_acompanantes = contenido.max_acompanantes || 4;
  const pedir_restricciones = contenido.pedir_restricciones ?? false;

  const colorPrimario = tema?.color_primario || '#753572';

  // Estado del formulario (para preview)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asistira: null,
    num_acompanantes: 1,
    restricciones: '',
  });

  return (
    <section className="py-16 px-6 bg-white dark:bg-gray-900">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: colorPrimario, fontFamily: 'var(--fuente-titulos)' }}
          >
            {titulo}
          </h2>
          {subtitulo && (
            <p className="text-gray-600 dark:text-gray-400">
              {subtitulo}
            </p>
          )}
        </div>

        {/* Formulario */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg">
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                placeholder="Tu nombre"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': colorPrimario }}
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correo electrónico *
              </label>
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': colorPrimario }}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Acompañantes */}
            {permitir_acompanantes && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  ¿Cuántas personas asistirán?
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[...Array(max_acompanantes + 1)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, num_acompanantes: i })}
                      className={cn(
                        'w-10 h-10 rounded-full font-medium transition-colors',
                        formData.num_acompanantes === i
                          ? 'text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      )}
                      style={
                        formData.num_acompanantes === i
                          ? { backgroundColor: colorPrimario }
                          : {}
                      }
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Restricciones alimenticias */}
            {pedir_restricciones && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4" />
                  Restricciones alimenticias
                </label>
                <textarea
                  placeholder="Indica si tienes alergias o restricciones..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': colorPrimario }}
                  value={formData.restricciones}
                  onChange={(e) => setFormData({ ...formData, restricciones: e.target.value })}
                />
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                className={cn(
                  'flex-1 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2',
                  'transform transition-transform hover:scale-[1.02]'
                )}
                style={{ backgroundColor: colorPrimario }}
              >
                <CheckCircle className="w-5 h-5" />
                Confirmar Asistencia
              </button>
              <button
                type="button"
                className="flex-1 py-3 rounded-lg font-semibold border-2 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                style={{ borderColor: colorPrimario }}
              >
                <X className="w-5 h-5" />
                No puedo asistir
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(RSVPCanvasBlock);
