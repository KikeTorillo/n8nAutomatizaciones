/**
 * ====================================================================
 * THEME CONFIG - Invitaciones
 * ====================================================================
 * Constantes de tema compartidas entre SidebarContainer y DrawersContainer.
 *
 * @since 2026-02-05
 */

import { FUENTES_DISPONIBLES } from '@/components/editor-framework';

export const FONT_FIELDS = [
  { key: 'fuente_titulos', label: 'Fuente de títulos', options: FUENTES_DISPONIBLES },
  { key: 'fuente_cuerpo', label: 'Fuente del cuerpo', options: FUENTES_DISPONIBLES },
];

export const TEMAS_POR_TIPO = {
  boda: [
    { id: 'elegante', nombre: 'Elegante', colores: { primario: '#753572', secundario: '#D4AF37', fondo: '#FDF8F6', texto: '#2D1B2E', texto_claro: '#6B5B6E' } },
    { id: 'rosa', nombre: 'Rosa', colores: { primario: '#EC4899', secundario: '#F9A8D4', fondo: '#FFF1F2', texto: '#4C1D34', texto_claro: '#9D7186' } },
    { id: 'dorado', nombre: 'Dorado', colores: { primario: '#D97706', secundario: '#FDE68A', fondo: '#FFFBEB', texto: '#451A03', texto_claro: '#92400E' } },
    { id: 'azul', nombre: 'Azul', colores: { primario: '#3B82F6', secundario: '#93C5FD', fondo: '#EFF6FF', texto: '#1E3A5F', texto_claro: '#64748B' } },
    { id: 'verde', nombre: 'Verde', colores: { primario: '#059669', secundario: '#6EE7B7', fondo: '#ECFDF5', texto: '#064E3B', texto_claro: '#6B7280' } },
  ],
  xv_anos: [
    { id: 'rosa', nombre: 'Rosa', colores: { primario: '#DB2777', secundario: '#F9A8D4', fondo: '#FFF1F2', texto: '#4C1D34', texto_claro: '#9D7186' } },
    { id: 'morado', nombre: 'Morado', colores: { primario: '#8B5CF6', secundario: '#C4B5FD', fondo: '#F5F3FF', texto: '#3B2075', texto_claro: '#7C6B9E' } },
    { id: 'turquesa', nombre: 'Turquesa', colores: { primario: '#14B8A6', secundario: '#5EEAD4', fondo: '#F0FDFA', texto: '#134E4A', texto_claro: '#5F8A85' } },
    { id: 'dorado', nombre: 'Dorado', colores: { primario: '#B45309', secundario: '#FDE68A', fondo: '#FFFBEB', texto: '#451A03', texto_claro: '#92400E' } },
    { id: 'rosa_gold', nombre: 'Rosa Gold', colores: { primario: '#F472B6', secundario: '#D4AF37', fondo: '#FFF5F7', texto: '#4C1D34', texto_claro: '#9D7186' } },
  ],
  bautizo: [
    { id: 'celeste', nombre: 'Celeste', colores: { primario: '#38BDF8', secundario: '#BAE6FD', fondo: '#F0F9FF', texto: '#0C4A6E', texto_claro: '#64748B' } },
    { id: 'rosa', nombre: 'Rosa', colores: { primario: '#F472B6', secundario: '#FBCFE8', fondo: '#FFF1F2', texto: '#4C1D34', texto_claro: '#9D7186' } },
    { id: 'verde', nombre: 'Verde', colores: { primario: '#34D399', secundario: '#A7F3D0', fondo: '#ECFDF5', texto: '#064E3B', texto_claro: '#6B7280' } },
    { id: 'blanco', nombre: 'Blanco', colores: { primario: '#6B7280', secundario: '#F3F4F6', fondo: '#FFFFFF', texto: '#1F2937', texto_claro: '#9CA3AF' } },
    { id: 'dorado', nombre: 'Dorado', colores: { primario: '#D4AF37', secundario: '#FEF3C7', fondo: '#FFFBEB', texto: '#451A03', texto_claro: '#92400E' } },
  ],
  cumpleanos: [
    { id: 'fiesta', nombre: 'Fiesta', colores: { primario: '#F59E0B', secundario: '#EF4444', fondo: '#FFFBEB', texto: '#451A03', texto_claro: '#78716C' } },
    { id: 'morado', nombre: 'Morado', colores: { primario: '#8B5CF6', secundario: '#A78BFA', fondo: '#F5F3FF', texto: '#3B2075', texto_claro: '#7C6B9E' } },
    { id: 'azul', nombre: 'Azul', colores: { primario: '#3B82F6', secundario: '#60A5FA', fondo: '#EFF6FF', texto: '#1E3A5F', texto_claro: '#64748B' } },
    { id: 'verde', nombre: 'Verde', colores: { primario: '#10B981', secundario: '#34D399', fondo: '#ECFDF5', texto: '#064E3B', texto_claro: '#6B7280' } },
    { id: 'rosa', nombre: 'Rosa', colores: { primario: '#EC4899', secundario: '#F472B6', fondo: '#FFF1F2', texto: '#4C1D34', texto_claro: '#9D7186' } },
  ],
  corporativo: [
    { id: 'azul', nombre: 'Corporativo', colores: { primario: '#1E40AF', secundario: '#3B82F6', fondo: '#F8FAFC', texto: '#0F172A', texto_claro: '#64748B' } },
    { id: 'gris', nombre: 'Elegante', colores: { primario: '#374151', secundario: '#6B7280', fondo: '#F9FAFB', texto: '#111827', texto_claro: '#6B7280' } },
    { id: 'verde', nombre: 'Moderno', colores: { primario: '#059669', secundario: '#10B981', fondo: '#F0FDF4', texto: '#064E3B', texto_claro: '#6B7280' } },
    { id: 'morado', nombre: 'Creativo', colores: { primario: '#7C3AED', secundario: '#8B5CF6', fondo: '#FAF5FF', texto: '#3B0764', texto_claro: '#7C6B9E' } },
    { id: 'rojo', nombre: 'Impactante', colores: { primario: '#DC2626', secundario: '#EF4444', fondo: '#FEF2F2', texto: '#450A0A', texto_claro: '#78716C' } },
  ],
  otro: [
    { id: 'primario', nombre: 'Clásico', colores: { primario: '#753572', secundario: '#F59E0B', fondo: '#FDF8F6', texto: '#2D1B2E', texto_claro: '#6B5B6E' } },
    { id: 'azul', nombre: 'Azul', colores: { primario: '#3B82F6', secundario: '#60A5FA', fondo: '#EFF6FF', texto: '#1E3A5F', texto_claro: '#64748B' } },
    { id: 'verde', nombre: 'Verde', colores: { primario: '#10B981', secundario: '#34D399', fondo: '#ECFDF5', texto: '#064E3B', texto_claro: '#6B7280' } },
    { id: 'morado', nombre: 'Morado', colores: { primario: '#8B5CF6', secundario: '#A78BFA', fondo: '#F5F3FF', texto: '#3B2075', texto_claro: '#7C6B9E' } },
    { id: 'rosa', nombre: 'Rosa', colores: { primario: '#EC4899', secundario: '#F472B6', fondo: '#FFF1F2', texto: '#4C1D34', texto_claro: '#9D7186' } },
  ],
};

export const COLOR_FIELDS = [
  { key: 'primario', label: 'Color primario' },
  { key: 'secundario', label: 'Color secundario' },
  { key: 'fondo', label: 'Color de fondo' },
  { key: 'texto', label: 'Color de texto' },
  { key: 'texto_claro', label: 'Texto secundario' },
];

export const PATRONES_FONDO = [
  { value: 'none', label: 'Ninguno' },
  { value: 'confetti', label: 'Confetti' },
  { value: 'stars', label: 'Estrellas' },
  { value: 'hearts', label: 'Corazones' },
  { value: 'dots', label: 'Puntos' },
  { value: 'stripes', label: 'Rayas' },
  { value: 'bubbles', label: 'Burbujas' },
  { value: 'geometric', label: 'Geométrico' },
];

export const DECORACIONES_ESQUINAS = [
  { value: 'none', label: 'Ninguna' },
  { value: 'globos', label: '🎈 Globos' },
  { value: 'estrellas', label: '⭐ Estrellas' },
  { value: 'flores', label: '🌸 Flores' },
  { value: 'corazones', label: '💖 Corazones' },
  { value: 'lazos', label: '🎀 Lazos' },
  { value: 'hojas', label: '🍃 Hojas' },
];

export const ICONOS_PRINCIPALES = [
  { value: 'none', label: 'Ninguno' },
  { value: 'cake', label: '🎂 Pastel' },
  { value: 'crown', label: '👑 Corona' },
  { value: 'star', label: '⭐ Estrella' },
  { value: 'heart', label: '💖 Corazón' },
  { value: 'mask', label: '🎭 Máscara' },
  { value: 'gift', label: '🎁 Regalo' },
  { value: 'ring', label: '💍 Anillo' },
  { value: 'baby', label: '👶 Bebé' },
  { value: 'balloon', label: '🎈 Globo' },
];

export const EFECTOS_TITULO = [
  { value: 'none', label: 'Ninguno' },
  { value: 'sparkle', label: 'Brillos' },
  { value: 'glow', label: 'Resplandor' },
  { value: 'shadow', label: 'Sombra' },
  { value: 'gradient', label: 'Degradado' },
  { value: 'outline', label: 'Contorno' },
];

export const MARCOS_FOTOS = [
  { value: 'none', label: 'Ninguno' },
  { value: 'polaroid', label: 'Polaroid' },
  { value: 'comic', label: 'Cómic' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'neon', label: 'Neón' },
  { value: 'rounded', label: 'Redondeado' },
  { value: 'ornate', label: 'Ornamentado' },
];

export const ANIMACIONES_ENTRADA = [
  { value: 'none', label: 'Ninguna' },
  { value: 'fade', label: 'Desvanecer' },
  { value: 'bounce', label: 'Rebote' },
  { value: 'slide', label: 'Deslizar' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'flip', label: 'Voltear' },
];

export const STICKERS_DISPONIBLES = [
  '💖','💕','✨','⭐','🎉','🎊','🎈','🎁','🎂','🎀',
  '💐','🌸','👑','🦋','🍀','🌺','🎵','💍','👶','🎶',
];
