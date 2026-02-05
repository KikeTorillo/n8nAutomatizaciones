/**
 * ====================================================================
 * BLOQUES PÚBLICOS - INVITACIONES DIGITALES
 * ====================================================================
 * Componentes de renderizado público para los bloques del editor.
 * Estos componentes se usan en la vista pública de la invitación.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { lazy } from 'react';

// Lazy load para mejor rendimiento
const HeroPublico = lazy(() => import('./HeroPublico'));
const CountdownPublico = lazy(() => import('./CountdownPublico'));
const TimelinePublico = lazy(() => import('./TimelinePublico'));
const UbicacionPublico = lazy(() => import('./UbicacionPublico'));
const RSVPPublico = lazy(() => import('./RSVPPublico'));
const MesaRegalosPublico = lazy(() => import('./MesaRegalosPublico'));
const GaleriaPublico = lazy(() => import('./GaleriaPublico'));
const VideoPublico = lazy(() => import('./VideoPublico'));
const TextoPublico = lazy(() => import('./TextoPublico'));
const SeparadorPublico = lazy(() => import('./SeparadorPublico'));
const FelicitacionesPublico = lazy(() => import('./FelicitacionesPublico'));

// Renderer principal
export { default as BloqueRenderer } from './BloqueRenderer';

/**
 * Mapa de componentes de bloques públicos
 */
export const BLOQUES_PUBLICOS = {
  hero_invitacion: HeroPublico,
  countdown: CountdownPublico,
  timeline: TimelinePublico,
  ubicacion: UbicacionPublico,
  rsvp: RSVPPublico,
  mesa_regalos: MesaRegalosPublico,
  galeria: GaleriaPublico,
  video: VideoPublico,
  texto: TextoPublico,
  separador: SeparadorPublico,
  felicitaciones: FelicitacionesPublico,
};

/**
 * Obtiene el componente de bloque público por tipo
 */
export function getBloquePublico(tipo) {
  return BLOQUES_PUBLICOS[tipo] || null;
}

export {
  HeroPublico,
  CountdownPublico,
  TimelinePublico,
  UbicacionPublico,
  RSVPPublico,
  MesaRegalosPublico,
  GaleriaPublico,
  VideoPublico,
  TextoPublico,
  SeparadorPublico,
  FelicitacionesPublico,
};
