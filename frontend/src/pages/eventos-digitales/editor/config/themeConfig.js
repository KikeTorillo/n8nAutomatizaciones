/**
 * ====================================================================
 * THEME CONFIG - Invitaciones
 * ====================================================================
 * Constantes de tema compartidas entre SidebarContainer y DrawersContainer.
 *
 * @since 2026-02-05
 */

export const TEMAS_POR_TIPO = {
  boda: [
    { id: 'elegante', nombre: 'Elegante', colores: { primario: '#753572', secundario: '#D4AF37' } },
    { id: 'rosa', nombre: 'Rosa', colores: { primario: '#EC4899', secundario: '#F9A8D4' } },
    { id: 'dorado', nombre: 'Dorado', colores: { primario: '#D97706', secundario: '#FDE68A' } },
    { id: 'azul', nombre: 'Azul', colores: { primario: '#3B82F6', secundario: '#93C5FD' } },
    { id: 'verde', nombre: 'Verde', colores: { primario: '#059669', secundario: '#6EE7B7' } },
  ],
  xv_anos: [
    { id: 'rosa', nombre: 'Rosa', colores: { primario: '#DB2777', secundario: '#F9A8D4' } },
    { id: 'morado', nombre: 'Morado', colores: { primario: '#8B5CF6', secundario: '#C4B5FD' } },
    { id: 'turquesa', nombre: 'Turquesa', colores: { primario: '#14B8A6', secundario: '#5EEAD4' } },
    { id: 'dorado', nombre: 'Dorado', colores: { primario: '#B45309', secundario: '#FDE68A' } },
    { id: 'rosa_gold', nombre: 'Rosa Gold', colores: { primario: '#F472B6', secundario: '#D4AF37' } },
  ],
  bautizo: [
    { id: 'celeste', nombre: 'Celeste', colores: { primario: '#38BDF8', secundario: '#BAE6FD' } },
    { id: 'rosa', nombre: 'Rosa', colores: { primario: '#F472B6', secundario: '#FBCFE8' } },
    { id: 'verde', nombre: 'Verde', colores: { primario: '#34D399', secundario: '#A7F3D0' } },
    { id: 'blanco', nombre: 'Blanco', colores: { primario: '#6B7280', secundario: '#F3F4F6' } },
    { id: 'dorado', nombre: 'Dorado', colores: { primario: '#D4AF37', secundario: '#FEF3C7' } },
  ],
  cumpleanos: [
    { id: 'fiesta', nombre: 'Fiesta', colores: { primario: '#F59E0B', secundario: '#EF4444' } },
    { id: 'morado', nombre: 'Morado', colores: { primario: '#8B5CF6', secundario: '#A78BFA' } },
    { id: 'azul', nombre: 'Azul', colores: { primario: '#3B82F6', secundario: '#60A5FA' } },
    { id: 'verde', nombre: 'Verde', colores: { primario: '#10B981', secundario: '#34D399' } },
    { id: 'rosa', nombre: 'Rosa', colores: { primario: '#EC4899', secundario: '#F472B6' } },
  ],
  corporativo: [
    { id: 'azul', nombre: 'Corporativo', colores: { primario: '#1E40AF', secundario: '#3B82F6' } },
    { id: 'gris', nombre: 'Elegante', colores: { primario: '#374151', secundario: '#6B7280' } },
    { id: 'verde', nombre: 'Moderno', colores: { primario: '#059669', secundario: '#10B981' } },
    { id: 'morado', nombre: 'Creativo', colores: { primario: '#7C3AED', secundario: '#8B5CF6' } },
    { id: 'rojo', nombre: 'Impactante', colores: { primario: '#DC2626', secundario: '#EF4444' } },
  ],
  otro: [
    { id: 'primario', nombre: 'Clásico', colores: { primario: '#753572', secundario: '#F59E0B' } },
    { id: 'azul', nombre: 'Azul', colores: { primario: '#3B82F6', secundario: '#60A5FA' } },
    { id: 'verde', nombre: 'Verde', colores: { primario: '#10B981', secundario: '#34D399' } },
    { id: 'morado', nombre: 'Morado', colores: { primario: '#8B5CF6', secundario: '#A78BFA' } },
    { id: 'rosa', nombre: 'Rosa', colores: { primario: '#EC4899', secundario: '#F472B6' } },
  ],
};

export const COLOR_FIELDS = [
  { key: 'primario', label: 'Color primario' },
  { key: 'secundario', label: 'Color secundario' },
];
