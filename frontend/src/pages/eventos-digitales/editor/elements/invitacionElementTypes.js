/**
 * ====================================================================
 * INVITACION ELEMENT TYPES
 * ====================================================================
 * Tipos de elementos específicos para el módulo de Invitaciones.
 * Se registran dinámicamente en el framework al inicializar el editor.
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import {
  Clock,
  UserCheck,
  List,
  Layout,
  MapPin,
  Images,
  HelpCircle,
  Gift,
} from 'lucide-react';
import { registerElementTypes } from '@/components/editor-framework';

// ========== INVITACION ELEMENT TYPES ==========

export const INVITACION_ELEMENT_TYPES = {
  hero_invitacion: {
    tipo: 'hero_invitacion',
    label: 'Portada',
    categoria: 'estructura',
    icon: Layout,
    variantes: ['full', 'medium', 'auto'],
    defaultSize: { ancho: 100, altura: 'auto' },
    defaultPosition: { x: 0, y: 0, ancla: 'top-left' },
    defaultContent: {
      titulo: '',
      subtitulo: '',
      imagen_url: '',
      imagen_posicion: '50% 50%',
      alineacion: 'center',
      imagen_overlay: 0.3,
      tipo_overlay: 'uniforme',
      color_overlay: '#000000',
      altura: 'full',
      mostrar_calendario: true,
    },
    defaultStyles: {},
    canResize: false,
    canRotate: false,
    maintainAspectRatio: false,
  },

  countdown: {
    tipo: 'countdown',
    label: 'Cuenta Regresiva',
    categoria: 'especiales',
    icon: Clock,
    variantes: ['cajas', 'inline', 'circular'],
    defaultSize: { ancho: 80, altura: 'auto' },
    defaultPosition: { x: 50, y: 60, ancla: 'center' },
    defaultContent: {
      titulo: 'Faltan',
      fecha: null,
      hora: null,
      variante: 'cajas',
      mostrar_dias: true,
      mostrar_horas: true,
      mostrar_minutos: true,
      mostrar_segundos: false,
      texto_finalizado: '¡Es hoy!',
    },
    defaultStyles: {},
    canResize: true,
    canRotate: false,
    maintainAspectRatio: false,
  },

  rsvp_button: {
    tipo: 'rsvp_button',
    label: 'Botón RSVP',
    categoria: 'interaccion',
    icon: UserCheck,
    variantes: ['primario', 'secundario', 'outline', 'minimal'],
    defaultSize: { ancho: 'auto', altura: 'auto' },
    defaultPosition: { x: 50, y: 85, ancla: 'center' },
    defaultContent: {
      texto: 'Confirmar Asistencia',
      texto_confirmado: '¡Confirmado!',
      variante: 'primario',
      tamano: 'lg',
      mostrar_icono: true,
    },
    defaultStyles: {},
    canResize: false,
    canRotate: false,
    maintainAspectRatio: false,
  },

  timeline: {
    tipo: 'timeline',
    label: 'Itinerario',
    categoria: 'contenido',
    icon: List,
    variantes: ['vertical', 'horizontal'],
    defaultSize: { ancho: 90, altura: 'auto' },
    defaultPosition: { x: 50, y: 50, ancla: 'center' },
    defaultContent: {
      titulo: 'Itinerario',
      subtitulo: '',
      layout: 'vertical',
      items: [],
    },
    defaultStyles: {},
    canResize: true,
    canRotate: false,
    maintainAspectRatio: false,
  },

  ubicacion: {
    tipo: 'ubicacion',
    label: 'Ubicación',
    categoria: 'contenido',
    icon: MapPin,
    variantes: ['default', 'minimal', 'cards'],
    defaultSize: { ancho: 90, altura: 'auto' },
    defaultPosition: { x: 50, y: 50, ancla: 'center' },
    defaultContent: {
      titulo: 'Ubicación',
      subtitulo: '',
      mostrar_todas: true,
      ubicacion_id: null,
      mostrar_mapa: true,
      altura_mapa: 300,
    },
    defaultStyles: {},
    canResize: true,
    canRotate: false,
    maintainAspectRatio: false,
  },

  galeria: {
    tipo: 'galeria',
    label: 'Galería',
    categoria: 'media',
    icon: Images,
    variantes: ['grid', 'masonry', 'carousel'],
    defaultSize: { ancho: 95, altura: 'auto' },
    defaultPosition: { x: 50, y: 50, ancla: 'center' },
    defaultContent: {
      titulo_seccion: 'Galería',
      subtitulo_seccion: '',
      usar_galeria_evento: true,
      imagenes: [],
      layout: 'grid',
      columnas: 3,
    },
    defaultStyles: {},
    canResize: true,
    canRotate: false,
    maintainAspectRatio: false,
  },

  mesa_regalos: {
    tipo: 'mesa_regalos',
    label: 'Mesa de Regalos',
    categoria: 'interaccion',
    icon: Gift,
    variantes: ['grid', 'list'],
    defaultSize: { ancho: 90, altura: 'auto' },
    defaultPosition: { x: 50, y: 50, ancla: 'center' },
    defaultContent: {
      titulo: 'Mesa de Regalos',
      subtitulo: 'Tu presencia es nuestro mejor regalo',
      usar_mesa_evento: true,
      items: [],
      layout: 'grid',
    },
    defaultStyles: {},
    canResize: true,
    canRotate: false,
    maintainAspectRatio: false,
  },

  faq: {
    tipo: 'faq',
    label: 'Preguntas Frecuentes',
    categoria: 'contenido',
    icon: HelpCircle,
    variantes: ['accordion', 'list'],
    defaultSize: { ancho: 90, altura: 'auto' },
    defaultPosition: { x: 50, y: 50, ancla: 'center' },
    defaultContent: {
      titulo_seccion: 'Preguntas Frecuentes',
      subtitulo_seccion: '',
      items: [],
    },
    defaultStyles: {},
    canResize: true,
    canRotate: false,
    maintainAspectRatio: false,
  },
};

// ========== ALLOWED TYPES ==========

/**
 * Lista de tipos disponibles para invitaciones (built-in + específicos)
 */
export const INVITACION_ALLOWED_TYPES = [
  // Built-in
  'texto',
  'imagen',
  'boton',
  'forma',
  'separador',
  'video',
  // Específicos de invitaciones
  'hero_invitacion',
  'countdown',
  'rsvp_button',
  'timeline',
  'ubicacion',
  'galeria',
  'mesa_regalos',
];

// ========== REGISTRATION ==========

/**
 * Registra los tipos de elementos de invitaciones en el framework.
 * Llamar esta función al inicializar el módulo de invitaciones.
 */
export function registerInvitacionElementTypes() {
  registerElementTypes(INVITACION_ELEMENT_TYPES);
}
