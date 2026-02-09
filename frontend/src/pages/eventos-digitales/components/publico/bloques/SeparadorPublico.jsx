/**
 * ====================================================================
 * SEPARADOR PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza un separador visual entre secciones.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { Heart, Sparkles, Star, Flower2 } from 'lucide-react';

function SeparadorPublico({ bloque, tema, isVisible, className = '' }) {
  const { estilos = {}, contenido = {} } = bloque;

  const estilo = estilos.estilo || contenido.estilo || 'linea';
  const icono = estilos.icono || contenido.icono || 'none';
  // El editor guarda altura como número (px), antes se usaba string (pequeno/mediano/grande)
  const alturaRaw = estilos.altura ?? contenido.altura ?? 'mediano';

  const animationClass = isVisible ? 'animate-fadeIn' : 'opacity-0';

  // Mapeo de alturas numéricas a clases
  const getAlturaClass = (altura) => {
    if (typeof altura === 'number') {
      // Convertir px a clase aproximada
      if (altura <= 20) return 'py-2';
      if (altura <= 40) return 'py-4';
      if (altura <= 60) return 'py-6';
      if (altura <= 80) return 'py-8';
      if (altura <= 120) return 'py-12';
      return 'py-16';
    }
    // Mapeo de strings legacy
    const alturas = {
      pequeno: 'py-4',
      mediano: 'py-8',
      grande: 'py-12',
    };
    return alturas[altura] || 'py-8';
  };

  const alturaClass = getAlturaClass(alturaRaw);

  // Iconos disponibles
  const iconos = {
    heart: Heart,
    sparkles: Sparkles,
    star: Star,
    flower: Flower2,
  };

  const IconComponent = iconos[icono];

  return (
    <div className={`${alturaClass} ${className} ${animationClass}`}>
      <div className="max-w-4xl mx-auto px-4">
        {estilo === 'linea' && (
          <div
            className="h-px w-full"
            style={{ backgroundColor: tema?.color_primario + '30' }}
          />
        )}

        {estilo === 'linea_con_icono' && (
          <div className="flex items-center gap-4">
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: tema?.color_primario + '30' }}
            />
            {IconComponent && (
              <IconComponent
                className="w-6 h-6"
                style={{ color: tema?.color_primario }}
              />
            )}
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: tema?.color_primario + '30' }}
            />
          </div>
        )}

        {estilo === 'puntos' && (
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tema?.color_primario }}
              />
            ))}
          </div>
        )}

        {estilo === 'decorativo' && (
          <div className="flex items-center justify-center">
            <svg
              viewBox="0 0 200 20"
              className="w-48 h-5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 10 Q 25 0 50 10 T 100 10 T 150 10 T 200 10"
                stroke={tema?.color_primario}
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="100" cy="10" r="4" fill={tema?.color_primario} />
            </svg>
          </div>
        )}

        {estilo === 'ondas' && (
          <div className="flex items-center justify-center">
            <svg
              viewBox="0 0 200 30"
              className="w-full max-w-md h-8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 15 Q 12.5 5 25 15 T 50 15 T 75 15 T 100 15 T 125 15 T 150 15 T 175 15 T 200 15"
                stroke={tema?.color_primario + '50'}
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
        )}

        {estilo === 'espacio' && <div />}
      </div>
    </div>
  );
}

export default memo(SeparadorPublico);
