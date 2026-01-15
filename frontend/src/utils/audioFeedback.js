/**
 * Utilidad para retroalimentación de audio en el sistema
 * Usado principalmente en POS para confirmación de acciones
 *
 * Ene 2026 - Mejoras UX POS
 */

let audioContext = null;

/**
 * Obtiene o crea el AudioContext (singleton)
 */
function getAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioContext;
}

/**
 * Reproduce un beep de confirmación (producto escaneado/agregado)
 * @param {Object} options - Opciones del beep
 * @param {number} options.frequency - Frecuencia en Hz (default: 1800)
 * @param {number} options.duration - Duración en segundos (default: 0.1)
 * @param {number} options.volume - Volumen 0-1 (default: 0.3)
 */
export function playBeep({ frequency = 1800, duration = 0.1, volume = 0.3 } = {}) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.value = volume;

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Ignorar errores de audio
  }
}

/**
 * Beep de éxito (tono agudo, producto agregado)
 */
export function playSuccessBeep() {
  playBeep({ frequency: 1800, duration: 0.08, volume: 0.25 });
}

/**
 * Beep de error (tono grave)
 */
export function playErrorBeep() {
  playBeep({ frequency: 400, duration: 0.2, volume: 0.3 });
}

/**
 * Beep doble de confirmación (venta completada)
 */
export function playDoubleBeep() {
  playBeep({ frequency: 1800, duration: 0.08, volume: 0.25 });
  setTimeout(() => {
    playBeep({ frequency: 2200, duration: 0.08, volume: 0.25 });
  }, 120);
}

/**
 * Sonido de "cha-ching" para venta completada
 */
export function playCashRegisterSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Primer tono
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.value = 1200;
    osc1.type = 'sine';
    gain1.gain.value = 0.2;
    osc1.start();
    osc1.stop(ctx.currentTime + 0.1);

    // Segundo tono (más alto)
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1600;
      osc2.type = 'sine';
      gain2.gain.value = 0.2;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.15);
    }, 100);
  } catch {
    // Ignorar errores de audio
  }
}

export default {
  playBeep,
  playSuccessBeep,
  playErrorBeep,
  playDoubleBeep,
  playCashRegisterSound
};
