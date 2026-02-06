/**
 * ====================================================================
 * CONTACTO CANVAS BLOCK
 * ====================================================================
 * Bloque de contacto editable para el canvas WYSIWYG.
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { InlineText } from '../InlineEditor';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

/**
 * Contacto Canvas Block
 */
function ContactoCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const WEB = THEME_FALLBACK_COLORS.website;
  const contenido = bloque.contenido || {};
  const {
    titulo_seccion = 'Contáctanos',
    mostrar_formulario = true,
    campos_formulario = ['nombre', 'email', 'telefono', 'mensaje'],
    mostrar_info = true,
    telefono = '+52 55 1234 5678',
    email = 'contacto@ejemplo.com',
    direccion = 'Calle Principal #123, Ciudad',
    horarios = 'Lun-Vie 9:00-18:00',
    mostrar_mapa = false,
  } = contenido;

  return (
    <section className="py-16 px-6 bg-white dark:bg-gray-800">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          {isEditing ? (
            <InlineText
              value={titulo_seccion}
              onChange={(value) => onContentChange({ titulo_seccion: value })}
              placeholder="Título de sección"
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white block"
              as="h2"
            />
          ) : (
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
              style={{ fontFamily: 'var(--fuente-titulos)' }}
            >
              {titulo_seccion}
            </h2>
          )}
        </div>

        <div
          className={cn(
            'grid gap-12',
            mostrar_formulario && mostrar_info
              ? 'lg:grid-cols-2'
              : 'max-w-2xl mx-auto'
          )}
        >
          {/* Contact Form */}
          {mostrar_formulario && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                {campos_formulario.includes('nombre') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      placeholder="Tu nombre"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
                      disabled={isEditing}
                    />
                  </div>
                )}

                {campos_formulario.includes('email') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
                      disabled={isEditing}
                    />
                  </div>
                )}

                {campos_formulario.includes('telefono') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      placeholder="Tu teléfono"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
                      disabled={isEditing}
                    />
                  </div>
                )}

                {campos_formulario.includes('mensaje') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mensaje
                    </label>
                    <textarea
                      rows={4}
                      placeholder="¿En qué podemos ayudarte?"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-gray-900 dark:text-white"
                      disabled={isEditing}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
                  style={{
                    backgroundColor: `var(--color-primario, ${tema?.color_primario || WEB.primario})`,
                  }}
                  disabled={isEditing}
                >
                  <Send className="w-4 h-4" />
                  Enviar mensaje
                </button>
              </form>
            </div>
          )}

          {/* Contact Info */}
          {mostrar_info && (
            <div className="space-y-6">
              {/* Phone */}
              {telefono && (
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: `var(--color-primario, ${tema?.color_primario || WEB.primario})20`,
                    }}
                  >
                    <Phone
                      className="w-6 h-6"
                      style={{ color: `var(--color-primario, ${tema?.color_primario || WEB.primario})` }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Teléfono
                    </h3>
                    {isEditing ? (
                      <InlineText
                        value={telefono}
                        onChange={(value) => onContentChange({ telefono: value })}
                        placeholder="Número de teléfono"
                        className="text-gray-600 dark:text-gray-400"
                      />
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">{telefono}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Email */}
              {email && (
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: `var(--color-primario, ${tema?.color_primario || WEB.primario})20`,
                    }}
                  >
                    <Mail
                      className="w-6 h-6"
                      style={{ color: `var(--color-primario, ${tema?.color_primario || WEB.primario})` }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Email
                    </h3>
                    {isEditing ? (
                      <InlineText
                        value={email}
                        onChange={(value) => onContentChange({ email: value })}
                        placeholder="Correo electrónico"
                        className="text-gray-600 dark:text-gray-400"
                      />
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">{email}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Address */}
              {direccion && (
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: `var(--color-primario, ${tema?.color_primario || WEB.primario})20`,
                    }}
                  >
                    <MapPin
                      className="w-6 h-6"
                      style={{ color: `var(--color-primario, ${tema?.color_primario || WEB.primario})` }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Dirección
                    </h3>
                    {isEditing ? (
                      <InlineText
                        value={direccion}
                        onChange={(value) => onContentChange({ direccion: value })}
                        placeholder="Dirección"
                        className="text-gray-600 dark:text-gray-400"
                        multiline
                      />
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">{direccion}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Hours */}
              {horarios && (
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: `var(--color-primario, ${tema?.color_primario || WEB.primario})20`,
                    }}
                  >
                    <Clock
                      className="w-6 h-6"
                      style={{ color: `var(--color-primario, ${tema?.color_primario || WEB.primario})` }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Horarios
                    </h3>
                    {isEditing ? (
                      <InlineText
                        value={horarios}
                        onChange={(value) => onContentChange({ horarios: value })}
                        placeholder="Horarios de atención"
                        className="text-gray-600 dark:text-gray-400"
                        multiline
                      />
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                        {horarios}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default memo(ContactoCanvasBlock);
