/**
 * ====================================================================
 * CONFIGURACIÓN - ANIMACIONES DECORATIVAS
 * ====================================================================
 * Catálogo de animaciones Lottie disponibles para el bloque
 * animacion_decorativa del editor de invitaciones.
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import { Mail, PartyPopper, Flower2 } from 'lucide-react';

// ========== CATÁLOGO DE ANIMACIONES ==========

export const ANIMACIONES_DECORATIVAS = [
  {
    id: 'sobre',
    label: 'Sobre / Carta',
    descripcion: 'Un sobre que se abre con un corazón',
    icon: Mail,
    loader: () => import('@/assets/lottie/sobre.json'),
  },
  {
    id: 'globos',
    label: 'Globos / Confetti',
    descripcion: 'Globos subiendo con confetti',
    icon: PartyPopper,
    loader: () => import('@/assets/lottie/globos.json'),
  },
  {
    id: 'flores',
    label: 'Flores / Pétalos',
    descripcion: 'Flores floreciendo',
    icon: Flower2,
    loader: () => import('@/assets/lottie/flores.json'),
  },
];

// ========== OPCIONES DE VELOCIDAD ==========

export const VELOCIDADES = [
  { value: 0.5, label: 'Lenta' },
  { value: 0.75, label: 'Suave' },
  { value: 1, label: 'Normal' },
  { value: 1.25, label: 'Rápida' },
  { value: 1.5, label: 'Muy rápida' },
];

// ========== OPCIONES DE TAMAÑO ==========

export const TAMANOS = [
  { value: 'pequeno', label: 'Pequeño', height: 120 },
  { value: 'mediano', label: 'Mediano', height: 200 },
  { value: 'grande', label: 'Grande', height: 300 },
];

// ========== HELPERS ==========

/**
 * Obtiene la config de una animación por ID
 */
export function getAnimacionById(id) {
  return ANIMACIONES_DECORATIVAS.find((a) => a.id === id) || ANIMACIONES_DECORATIVAS[0];
}

/**
 * Obtiene la altura en px para un tamaño
 */
export function getTamanoHeight(tamano) {
  const found = TAMANOS.find((t) => t.value === tamano);
  return found ? found.height : 200;
}
