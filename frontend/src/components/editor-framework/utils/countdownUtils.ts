/**
 * Utilidades para countdown/cuenta regresiva.
 * Compartidas entre Website e Invitaciones canvas blocks.
 */

export interface TimeRemaining {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  finished: boolean;
}

/**
 * Calcula el tiempo restante hasta una fecha objetivo.
 */
export function calculateTimeRemaining(targetDate: string, targetTime?: string): TimeRemaining {
  const target = new Date(targetDate);
  if (targetTime) {
    const [hours, minutes] = targetTime.split(':');
    target.setHours(parseInt(hours), parseInt(minutes));
  }

  const difference = target.getTime() - Date.now();

  if (difference <= 0) {
    return { dias: 0, horas: 0, minutos: 0, segundos: 0, finished: true };
  }

  return {
    dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
    horas: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutos: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    segundos: Math.floor((difference % (1000 * 60)) / 1000),
    finished: false,
  };
}
