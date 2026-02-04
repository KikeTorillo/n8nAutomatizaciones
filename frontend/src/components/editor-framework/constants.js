/**
 * ====================================================================
 * EDITOR FRAMEWORK - CONSTANTS
 * ====================================================================
 * Constantes compartidas para editores de bloques.
 */

import {
  Settings,
  Paintbrush,
  Code,
  Search,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react';

// ========== TABS CONFIG ==========

export const TABS = [
  { id: 'contenido', label: 'Contenido', icon: Settings },
  { id: 'estilo', label: 'Estilo', icon: Paintbrush },
  { id: 'avanzado', label: 'Avanzado', icon: Code },
  { id: 'seo', label: 'SEO', icon: Search },
];

// Tabs sin SEO (para invitaciones)
export const TABS_SIMPLE = [
  { id: 'contenido', label: 'Contenido', icon: Settings },
  { id: 'estilo', label: 'Estilo', icon: Paintbrush },
  { id: 'avanzado', label: 'Avanzado', icon: Code },
];

// ========== BREAKPOINT CONFIG ==========

export const BREAKPOINT_ICONS = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

export const BREAKPOINT_LABELS = {
  desktop: 'Escritorio',
  tablet: 'Tablet',
  mobile: 'Movil',
};
