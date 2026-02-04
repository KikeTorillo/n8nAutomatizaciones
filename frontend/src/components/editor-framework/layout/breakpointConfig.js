/**
 * ====================================================================
 * BREAKPOINT CONFIG
 * ====================================================================
 * Configuración de breakpoints para editores responsive.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { Monitor, Tablet, Smartphone } from 'lucide-react';

/**
 * Configuración de breakpoints disponibles
 */
export const BREAKPOINTS = [
  { id: 'desktop', icon: Monitor, label: 'Desktop', width: '100%' },
  { id: 'tablet', icon: Tablet, label: 'Tablet', width: '768px' },
  { id: 'mobile', icon: Smartphone, label: 'Mobile', width: '375px' },
];
