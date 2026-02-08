/**
 * ====================================================================
 * COUNTDOWN CANVAS BLOCK (Compartido)
 * ====================================================================
 * Renderer de cuenta regresiva compartido entre Website e Invitaciones.
 */

import { memo, useState, useEffect, useMemo, Fragment } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InlineText } from '../../inline';
import { calculateTimeRemaining } from '../../utils/countdownUtils';
import { getThemeColors } from '../../utils/themeColors';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

/**
 * TimeUnit — Renderiza una unidad de tiempo según variante
 */
function TimeUnit({ value, label, variant, colors }) {
  const padded = String(value).padStart(2, '0');

  switch (variant) {
    case 'boxes-shadow':
      return (
        <div className="flex flex-col items-center">
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center mb-2 shadow-lg"
            style={{ backgroundColor: `${colors.primario}20` }}
          >
            <span className="text-3xl md:text-4xl font-bold" style={{ color: colors.primario }}>
              {padded}
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {label}
          </span>
        </div>
      );

    case 'circular':
      return (
        <div
          className="w-20 h-20 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center"
          style={{ backgroundColor: colors.secundario, border: `3px solid ${colors.primario}` }}
        >
          <span className="text-2xl md:text-3xl font-bold" style={{ color: colors.primario }}>
            {padded}
          </span>
          <span className="text-xs" style={{ color: colors.textoClaro }}>
            {label}
          </span>
        </div>
      );

    case 'inline':
      return (
        <div className="text-center">
          <span className="text-3xl md:text-4xl font-bold" style={{ color: colors.primario }}>
            {padded}
          </span>
          <span className="text-xs block" style={{ color: colors.textoClaro }}>
            {label}
          </span>
        </div>
      );

    case 'cajas':
    default:
      return (
        <div
          className="p-4 md:p-6 rounded-2xl min-w-[80px] md:min-w-[100px]"
          style={{ backgroundColor: `${colors.secundario}40` }}
        >
          <span className="text-3xl md:text-4xl font-bold block" style={{ color: colors.primario }}>
            {padded}
          </span>
          <span className="text-xs md:text-sm uppercase tracking-wider" style={{ color: colors.textoClaro }}>
            {label}
          </span>
        </div>
      );
  }
}

/**
 * CountdownCanvasBlock compartido
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema del editor
 * @param {string} [props.fechaObjetivo] - Fecha objetivo explícita
 * @param {string} [props.horaObjetivo] - Hora objetivo explícita
 * @param {boolean} [props.isEditing] - Modo edición inline
 * @param {Function} [props.onContentChange] - Callback cambio contenido
 * @param {'website'|'invitacion'} [props.fallbackContext='website'] - Contexto fallback
 * @param {string} [props.variant] - Estilo: 'boxes-shadow'|'cajas'|'circular'|'inline'
 * @param {boolean} [props.showBackground] - Mostrar fondo configurable (website)
 * @param {boolean} [props.showButton] - Mostrar botón CTA (website)
 * @param {boolean} [props.showIcon] - Mostrar icono Clock (website)
 * @param {Object} [props.units] - Config de unidades visibles
 */
function CountdownCanvasBlock({
  bloque,
  tema,
  fechaObjetivo: fechaObjetivoProp,
  horaObjetivo: horaObjetivoProp,
  isEditing,
  onContentChange,
  fallbackContext = 'website',
  variant: variantProp,
  showBackground = false,
  showButton = false,
  showIcon = false,
  units: unitsProp,
}) {
  const colors = getThemeColors(tema, fallbackContext);
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  // Títulos
  const titulo = contenido.titulo || (fallbackContext === 'website' ? 'Gran Inauguracion' : 'Faltan');
  const subtitulo = contenido.subtitulo;
  const texto_finalizado = contenido.texto_finalizado || (fallbackContext === 'website' ? 'El evento ha comenzado!' : '¡Llegó el gran día!');

  // Fecha — prop explícita o del contenido
  const fecha_objetivo = fechaObjetivoProp || contenido.fecha_objetivo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const hora_objetivo = horaObjetivoProp;

  // Variante visual
  const variant = variantProp || estilos.estilo || contenido.estilo || (fallbackContext === 'website' ? 'boxes-shadow' : 'cajas');

  // Background (website)
  const fondo_tipo = contenido.fondo_tipo || 'color';
  const fondo_valor = contenido.fondo_valor || THEME_FALLBACK_COLORS.common.fondoOscuro;
  const color_texto = contenido.color_texto || THEME_FALLBACK_COLORS.common.textoBlanco;

  // CTA (website)
  const boton_texto = contenido.boton_texto || '';
  const boton_url = contenido.boton_url || '';

  // Unidades
  const mostrar_segundos = estilos.mostrar_segundos ?? contenido.mostrar_segundos ?? true;

  const unidades = useMemo(() => {
    if (unitsProp) return unitsProp;

    if (fallbackContext === 'website') {
      const items = [];
      if (contenido.mostrar_dias !== false) items.push({ key: 'dias', label: 'Días' });
      if (contenido.mostrar_horas !== false) items.push({ key: 'horas', label: 'Horas' });
      if (contenido.mostrar_minutos !== false) items.push({ key: 'minutos', label: 'Minutos' });
      if (contenido.mostrar_segundos !== false) items.push({ key: 'segundos', label: 'Segundos' });
      return items;
    }

    // Invitación: siempre días/horas/min + toggle segundos
    const base = [
      { key: 'dias', label: 'Días' },
      { key: 'horas', label: 'Horas' },
      { key: 'minutos', label: 'Minutos' },
    ];
    if (mostrar_segundos) base.push({ key: 'segundos', label: 'Segundos' });
    return base;
  }, [unitsProp, fallbackContext, contenido.mostrar_dias, contenido.mostrar_horas, contenido.mostrar_minutos, contenido.mostrar_segundos, mostrar_segundos]);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(() =>
    calculateTimeRemaining(fecha_objetivo, hora_objetivo)
  );

  useEffect(() => {
    if (!fecha_objetivo) {
      setTimeRemaining(null);
      return;
    }
    const calc = () => {
      const result = calculateTimeRemaining(fecha_objetivo, hora_objetivo);
      setTimeRemaining(fallbackContext === 'invitacion' && result.finished ? null : result);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [fecha_objetivo, hora_objetivo, fallbackContext]);

  // Background styles (website con fondo configurable)
  const backgroundStyle = showBackground
    ? fondo_tipo === 'imagen'
      ? { backgroundImage: `url(${fondo_valor})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : fondo_tipo === 'gradiente'
      ? { background: fondo_valor }
      : { backgroundColor: fondo_valor }
    : fallbackContext === 'invitacion'
    ? { backgroundColor: colors.fondo }
    : undefined;

  const textColor = showBackground ? color_texto : undefined;

  return (
    <section
      className={cn(
        'px-6 relative overflow-hidden',
        showBackground ? 'py-20' : 'py-16'
      )}
      style={backgroundStyle}
    >
      {/* Overlay para imágenes de fondo */}
      {showBackground && fondo_tipo === 'imagen' && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        {/* Icon (website) */}
        {showIcon && (
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${colors.primario}30` }}
            >
              <Clock className="w-8 h-8" style={{ color: colors.primario }} />
            </div>
          </div>
        )}

        {/* Título */}
        <div className="mb-8">
          {isEditing ? (
            <>
              <InlineText
                value={contenido.titulo || ''}
                onChange={(v) => onContentChange?.({ titulo: v })}
                placeholder={fallbackContext === 'website' ? 'Titulo del evento' : 'Título de la cuenta regresiva...'}
                className={cn(
                  'font-bold block',
                  fallbackContext === 'website' ? 'text-3xl md:text-5xl mb-4' : 'text-2xl md:text-3xl'
                )}
                style={textColor
                  ? { color: textColor }
                  : { color: colors.primario, fontFamily: 'var(--fuente-titulos)' }
                }
                as="h2"
              />
              {subtitulo !== undefined && showBackground && (
                <InlineText
                  value={subtitulo || ''}
                  onChange={(v) => onContentChange?.({ subtitulo: v })}
                  placeholder="Subtitulo"
                  className="text-lg md:text-xl block opacity-90"
                  style={textColor ? { color: textColor } : undefined}
                  as="p"
                />
              )}
            </>
          ) : (
            <>
              <h2
                className={cn(
                  'font-bold',
                  fallbackContext === 'website' ? 'text-3xl md:text-5xl mb-4' : 'text-2xl md:text-3xl'
                )}
                style={textColor
                  ? { color: textColor, fontFamily: 'var(--fuente-titulos)' }
                  : { color: colors.primario, fontFamily: 'var(--fuente-titulos)' }
                }
              >
                {titulo}
              </h2>
              {subtitulo && showBackground && (
                <p className="text-lg md:text-xl opacity-90" style={{ color: textColor }}>
                  {subtitulo}
                </p>
              )}
            </>
          )}
        </div>

        {/* Countdown */}
        {timeRemaining && !timeRemaining.finished ? (
          <div
            className={cn(
              'flex justify-center gap-4 md:gap-6 flex-wrap',
              variant === 'inline' && 'items-end'
            )}
          >
            {unidades.map((unidad, idx) => (
              <Fragment key={unidad.key}>
                <TimeUnit
                  value={timeRemaining[unidad.key]}
                  label={unidad.label}
                  variant={variant}
                  colors={colors}
                />
                {variant === 'inline' && idx < unidades.length - 1 && (
                  <span className="text-3xl md:text-4xl font-light" style={{ color: colors.primario }}>
                    :
                  </span>
                )}
              </Fragment>
            ))}
          </div>
        ) : isEditing ? (
          <InlineText
            value={contenido.texto_finalizado || ''}
            onChange={(v) => onContentChange?.({ texto_finalizado: v })}
            placeholder="Texto cuando termine la cuenta..."
            as="p"
            className="text-2xl md:text-3xl font-medium"
            style={{ color: colors.primario }}
          />
        ) : (
          <p
            className="text-2xl md:text-3xl font-bold"
            style={{ color: colors.primario }}
          >
            {texto_finalizado}
          </p>
        )}

        {/* CTA Button (website) */}
        {showButton && boton_texto && (
          <div className="text-center mt-10">
            <a
              href={boton_url || '#'}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: colors.primario }}
            >
              {boton_texto}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(CountdownCanvasBlock);
