/**
 * ====================================================================
 * ELEMENTOS TEMÁTICOS PARA INVITACIONES
 * ====================================================================
 * Componentes visuales que renderizan los elementos del tema:
 * - PatronFondo: Patrones decorativos de fondo
 * - StickersDecorativos: Emojis/stickers flotantes
 * - TituloTematico: Título con efectos especiales
 * - DecoracionEsquinas: Decoraciones en las esquinas
 * - MarcoFoto: Marcos estilizados para fotos
 *
 * Fecha creación: 14 Diciembre 2025
 */

import { useMemo } from 'react';

/**
 * PatronFondo - Renderiza patrones decorativos SVG
 */
export function PatronFondo({ patron, opacidad = 0.1, colorPrimario = '#ec4899' }) {
  if (!patron || patron === 'none') return null;

  const patrones = {
    confetti: (
      <pattern id="confetti" width="60" height="60" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="3" fill={colorPrimario} />
        <rect x="30" y="5" width="6" height="6" fill={colorPrimario} transform="rotate(45 33 8)" />
        <circle cx="50" cy="25" r="2" fill={colorPrimario} />
        <rect x="5" y="35" width="5" height="5" fill={colorPrimario} transform="rotate(30 7.5 37.5)" />
        <circle cx="35" cy="45" r="4" fill={colorPrimario} />
        <rect x="45" y="50" width="4" height="4" fill={colorPrimario} transform="rotate(60 47 52)" />
      </pattern>
    ),
    stars: (
      <pattern id="stars" width="80" height="80" patternUnits="userSpaceOnUse">
        <polygon points="20,5 23,15 33,15 25,22 28,32 20,25 12,32 15,22 7,15 17,15" fill={colorPrimario} />
        <polygon points="60,35 62,42 70,42 64,47 66,54 60,49 54,54 56,47 50,42 58,42" fill={colorPrimario} transform="scale(0.7)" />
        <polygon points="45,60 47,65 53,65 48,69 50,74 45,71 40,74 42,69 37,65 43,65" fill={colorPrimario} />
      </pattern>
    ),
    hearts: (
      <pattern id="hearts" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M15,25 C15,20 10,15 5,15 C0,15 0,22 0,22 C0,30 15,40 15,40 C15,40 30,30 30,22 C30,22 30,15 25,15 C20,15 15,20 15,25 Z" fill={colorPrimario} transform="scale(0.5) translate(10,10)" />
        <path d="M15,25 C15,20 10,15 5,15 C0,15 0,22 0,22 C0,30 15,40 15,40 C15,40 30,30 30,22 C30,22 30,15 25,15 C20,15 15,20 15,25 Z" fill={colorPrimario} transform="scale(0.4) translate(80,70)" />
      </pattern>
    ),
    dots: (
      <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
        <circle cx="15" cy="15" r="4" fill={colorPrimario} />
      </pattern>
    ),
    stripes: (
      <pattern id="stripes" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="10" height="20" fill={colorPrimario} />
      </pattern>
    ),
    bubbles: (
      <pattern id="bubbles" width="100" height="100" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="15" fill="none" stroke={colorPrimario} strokeWidth="2" />
        <circle cx="70" cy="30" r="10" fill="none" stroke={colorPrimario} strokeWidth="1.5" />
        <circle cx="40" cy="70" r="20" fill="none" stroke={colorPrimario} strokeWidth="2" />
        <circle cx="85" cy="80" r="8" fill="none" stroke={colorPrimario} strokeWidth="1" />
      </pattern>
    ),
    geometric: (
      <pattern id="geometric" width="50" height="50" patternUnits="userSpaceOnUse">
        <polygon points="25,5 45,25 25,45 5,25" fill="none" stroke={colorPrimario} strokeWidth="1.5" />
        <circle cx="25" cy="25" r="8" fill="none" stroke={colorPrimario} strokeWidth="1" />
      </pattern>
    )
  };

  if (!patrones[patron]) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: opacidad }}>
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {patrones[patron]}
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patron})`} />
      </svg>
    </div>
  );
}

/**
 * StickersDecorativos - Emojis flotantes animados
 */
export function StickersDecorativos({ stickers = [], className = '' }) {
  if (!stickers || stickers.length === 0) return null;

  const posiciones = useMemo(() => {
    return stickers.map((_, idx) => ({
      top: `${10 + (idx * 15) % 80}%`,
      left: idx % 2 === 0 ? `${5 + (idx * 3) % 15}%` : 'auto',
      right: idx % 2 === 1 ? `${5 + (idx * 3) % 15}%` : 'auto',
      animationDelay: `${idx * 0.5}s`,
      fontSize: `${1.5 + (idx % 3) * 0.5}rem`
    }));
  }, [stickers]);

  return (
    <>
      <style>{`
        @keyframes floatSticker {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(5deg); }
          50% { transform: translateY(-5px) rotate(-3deg); }
          75% { transform: translateY(-15px) rotate(3deg); }
        }
        .sticker-float {
          animation: floatSticker 4s ease-in-out infinite;
        }
      `}</style>
      <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
        {stickers.map((sticker, idx) => (
          <span
            key={idx}
            className="absolute sticker-float select-none"
            style={{
              top: posiciones[idx].top,
              left: posiciones[idx].left,
              right: posiciones[idx].right,
              animationDelay: posiciones[idx].animationDelay,
              fontSize: posiciones[idx].fontSize,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }}
          >
            {sticker}
          </span>
        ))}
      </div>
    </>
  );
}

/**
 * TituloTematico - Título con efectos especiales
 */
export function TituloTematico({
  children,
  efecto = 'none',
  colorPrimario = '#ec4899',
  colorSecundario = '#fce7f3',
  className = '',
  style = {}
}) {
  const efectoStyles = {
    none: {},
    sparkle: {
      textShadow: `0 0 10px ${colorPrimario}40, 0 0 20px ${colorPrimario}30, 0 0 30px ${colorPrimario}20`,
      animation: 'sparkleTitle 2s ease-in-out infinite'
    },
    glow: {
      textShadow: `0 0 20px ${colorPrimario}, 0 0 40px ${colorPrimario}80, 0 0 60px ${colorPrimario}60`,
      animation: 'glowPulse 2s ease-in-out infinite'
    },
    shadow: {
      textShadow: `4px 4px 0 ${colorSecundario}, 8px 8px 0 ${colorPrimario}30`
    },
    gradient: {
      background: `linear-gradient(135deg, ${colorPrimario}, ${colorSecundario}, ${colorPrimario})`,
      backgroundSize: '200% 200%',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      animation: 'gradientShift 3s ease infinite'
    },
    outline: {
      WebkitTextStroke: `2px ${colorPrimario}`,
      color: 'transparent',
      textShadow: `3px 3px 0 ${colorSecundario}`
    }
  };

  return (
    <>
      {(efecto === 'sparkle' || efecto === 'glow' || efecto === 'gradient') && (
        <style>{`
          @keyframes sparkleTitle {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.2); }
          }
          @keyframes glowPulse {
            0%, 100% { text-shadow: 0 0 20px ${colorPrimario}, 0 0 40px ${colorPrimario}80; }
            50% { text-shadow: 0 0 30px ${colorPrimario}, 0 0 60px ${colorPrimario}, 0 0 80px ${colorPrimario}60; }
          }
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      )}
      <span
        className={className}
        style={{
          ...style,
          ...(efectoStyles[efecto] || {})
        }}
      >
        {children}
      </span>
    </>
  );
}

/**
 * DecoracionEsquinas - Decoraciones en las esquinas
 */
export function DecoracionEsquinas({ tipo = 'none' }) {
  if (!tipo || tipo === 'none') return null;

  const decoraciones = {
    globos: {
      emoji: '🎈',
      positions: [
        { top: '5%', left: '5%', transform: 'rotate(-15deg)' },
        { top: '5%', right: '5%', transform: 'rotate(15deg)' },
        { bottom: '5%', left: '5%', transform: 'rotate(-10deg)' },
        { bottom: '5%', right: '5%', transform: 'rotate(10deg)' }
      ]
    },
    estrellas: {
      emoji: '⭐',
      positions: [
        { top: '3%', left: '3%', transform: 'rotate(-20deg)' },
        { top: '3%', right: '3%', transform: 'rotate(20deg)' },
        { bottom: '3%', left: '3%', transform: 'rotate(-15deg)' },
        { bottom: '3%', right: '3%', transform: 'rotate(15deg)' }
      ]
    },
    flores: {
      emoji: '🌸',
      positions: [
        { top: '2%', left: '2%' },
        { top: '2%', right: '2%' },
        { bottom: '2%', left: '2%' },
        { bottom: '2%', right: '2%' }
      ]
    },
    corazones: {
      emoji: '💕',
      positions: [
        { top: '4%', left: '4%', transform: 'rotate(-10deg)' },
        { top: '4%', right: '4%', transform: 'rotate(10deg)' },
        { bottom: '4%', left: '4%', transform: 'rotate(-5deg)' },
        { bottom: '4%', right: '4%', transform: 'rotate(5deg)' }
      ]
    },
    lazos: {
      emoji: '🎀',
      positions: [
        { top: '3%', left: '3%', transform: 'rotate(-25deg)' },
        { top: '3%', right: '3%', transform: 'rotate(25deg)' },
        { bottom: '3%', left: '3%', transform: 'rotate(-20deg)' },
        { bottom: '3%', right: '3%', transform: 'rotate(20deg)' }
      ]
    },
    hojas: {
      emoji: '🍃',
      positions: [
        { top: '5%', left: '5%', transform: 'rotate(-30deg)' },
        { top: '5%', right: '5%', transform: 'rotate(30deg)' },
        { bottom: '5%', left: '5%', transform: 'rotate(-25deg)' },
        { bottom: '5%', right: '5%', transform: 'rotate(25deg)' }
      ]
    }
  };

  const deco = decoraciones[tipo];
  if (!deco) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {deco.positions.map((pos, idx) => (
        <span
          key={idx}
          className="absolute text-3xl sm:text-4xl md:text-5xl select-none"
          style={{
            ...pos,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }}
        >
          {deco.emoji}
        </span>
      ))}
    </div>
  );
}

/**
 * MarcoFoto - Contenedor con marco estilizado
 */
export function MarcoFoto({
  children,
  marco = 'none',
  colorPrimario = '#ec4899',
  colorSecundario = '#fce7f3',
  className = ''
}) {
  const marcoStyles = {
    none: {},
    polaroid: {
      wrapper: 'bg-white p-2 pb-8 shadow-xl rotate-1 hover:rotate-0 transition-transform',
      inner: 'aspect-square'
    },
    comic: {
      wrapper: 'border-4 border-black shadow-[4px_4px_0_0_black] bg-white p-1',
      inner: ''
    },
    vintage: {
      wrapper: `border-8 rounded-sm shadow-inner`,
      wrapperStyle: { borderColor: '#d4a574', backgroundColor: '#f5e6d3' },
      inner: 'sepia'
    },
    neon: {
      wrapper: 'p-1 rounded-lg',
      wrapperStyle: {
        boxShadow: `0 0 10px ${colorPrimario}, 0 0 20px ${colorPrimario}80, 0 0 30px ${colorPrimario}60, inset 0 0 10px ${colorPrimario}40`,
        border: `2px solid ${colorPrimario}`
      },
      inner: ''
    },
    rounded: {
      wrapper: 'rounded-3xl overflow-hidden shadow-2xl',
      inner: ''
    },
    ornate: {
      wrapper: 'p-3 rounded-lg',
      wrapperStyle: {
        background: `linear-gradient(135deg, ${colorPrimario}20, ${colorSecundario}40, ${colorPrimario}20)`,
        border: `3px double ${colorPrimario}`,
        boxShadow: `0 10px 40px ${colorPrimario}30`
      },
      inner: 'rounded'
    }
  };

  const estiloMarco = marcoStyles[marco] || marcoStyles.none;

  if (marco === 'none') {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`${estiloMarco.wrapper || ''} ${className}`}
      style={estiloMarco.wrapperStyle || {}}
    >
      <div className={estiloMarco.inner || ''}>
        {children}
      </div>
    </div>
  );
}

/**
 * IconoPrincipal - Ícono temático grande
 */
export function IconoPrincipal({ icono = 'none', colorPrimario = '#ec4899', className = '' }) {
  if (!icono || icono === 'none') return null;

  const iconos = {
    cake: '🎂',
    crown: '👑',
    star: '⭐',
    heart: '💖',
    mask: '🎭',
    gift: '🎁',
    ring: '💍',
    baby: '👶',
    balloon: '🎈'
  };

  const emoji = iconos[icono];
  if (!emoji) return null;

  return (
    <>
      <style>{`
        @keyframes bounceIcon {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
      `}</style>
      <div
        className={`text-6xl sm:text-7xl md:text-8xl select-none ${className}`}
        style={{
          animation: 'bounceIcon 2s ease-in-out infinite',
          filter: `drop-shadow(0 4px 8px ${colorPrimario}40)`
        }}
      >
        {emoji}
      </div>
    </>
  );
}

export default {
  PatronFondo,
  StickersDecorativos,
  TituloTematico,
  DecoracionEsquinas,
  MarcoFoto,
  IconoPrincipal
};
