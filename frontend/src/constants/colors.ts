/**
 * Colores centralizados para uso en componentes UI.
 * Los colores de tema de invitaciones (#ec4899) NO van aqui -- son de dominio (constants.js).
 * Los colores de Tailwind config tampoco -- ya estan definidos ahi.
 */

/** Colores de marca Nexo (alineados con tailwind.config.js primary-*) */
export const BRAND_COLORS = {
  primary: '#753572',
  primaryLight: '#8B4589',
  primaryDark: '#5C2A59',
} as const;

/** Colores para etiquetas/tags de clientes */
export const TAG_COLORS = {
  default: '#6366F1',
  palette: [
    { value: '#EF4444', label: 'Rojo', description: 'VIP, Urgente' },
    { value: '#F59E0B', label: 'Naranja', description: 'Nuevo, Pendiente' },
    { value: '#10B981', label: 'Verde', description: 'Activo, Frecuente' },
    { value: '#3B82F6', label: 'Azul', description: 'Corporativo' },
    { value: '#8B5CF6', label: 'Morado', description: 'Premium' },
    { value: '#EC4899', label: 'Rosa', description: 'Especial' },
    { value: '#6366F1', label: 'Indigo', description: 'Default' },
    { value: '#14B8A6', label: 'Teal', description: 'Referido' },
  ],
} as const;

/** Colores de contraste para texto sobre fondos de color */
export const CONTRAST_COLORS = {
  dark: '#1F2937',
  light: '#FFFFFF',
} as const;

/** Colores neutros de UI */
export const NEUTRAL_COLORS = {
  gray500: '#6B7280',
  gray800: '#1F2937',
} as const;

/** Temas predefinidos para website */
export const WEBSITE_THEME_PRESETS = [
  { id: 'default', nombre: 'Clasico', colores: { primario: '#4F46E5', secundario: '#6366F1', fondo: '#FFFFFF', texto: '#1F2937' } },
  { id: 'dark', nombre: 'Oscuro', colores: { primario: '#8B5CF6', secundario: '#A78BFA', fondo: '#111827', texto: '#F9FAFB' } },
  { id: 'nature', nombre: 'Natural', colores: { primario: '#059669', secundario: '#10B981', fondo: '#ECFDF5', texto: '#064E3B' } },
  { id: 'sunset', nombre: 'Atardecer', colores: { primario: '#DC2626', secundario: '#F97316', fondo: '#FFF7ED', texto: '#7C2D12' } },
  { id: 'ocean', nombre: 'Oceano', colores: { primario: '#0284C7', secundario: '#38BDF8', fondo: '#F0F9FF', texto: '#0C4A6E' } },
] as const;

/** Colores por defecto del tema website */
export const WEBSITE_DEFAULT_COLORS = {
  primario: '#4F46E5',
  secundario: '#6366F1',
  fondo: '#FFFFFF',
  texto: '#1F2937',
} as const;
