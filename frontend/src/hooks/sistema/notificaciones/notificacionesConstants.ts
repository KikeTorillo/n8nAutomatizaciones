/**
 * Constantes y tipos para Notificaciones
 * Extraído de useNotificaciones.ts — Feb 2026
 */

// ==================== TIPOS ====================

export interface NotificacionListParams {
  solo_no_leidas?: boolean;
  categoria?: string;
  limit?: number;
  offset?: number;
}

export interface Notificacion {
  id: number;
  usuario_id: number;
  tipo: string;
  categoria: string;
  titulo: string;
  mensaje: string;
  nivel: string;
  icono?: string;
  accion_url?: string;
  accion_texto?: string;
  entidad_tipo?: string;
  entidad_id?: number;
  leida: boolean;
  archivada: boolean;
  expira_en?: string;
  created_at: string;
}

export interface CrearNotificacionData {
  usuario_id: number;
  tipo: string;
  categoria: string;
  titulo: string;
  mensaje: string;
  nivel?: string;
  icono?: string;
  accion_url?: string;
  accion_texto?: string;
  entidad_tipo?: string;
  entidad_id?: number;
  expira_en?: string;
}

export interface NotificacionPreferencia {
  tipo: string;
  in_app: boolean;
  email: boolean;
  push?: boolean;
  whatsapp?: boolean;
}

export interface ActualizarPreferenciasData {
  preferencias: NotificacionPreferencia[];
}

export interface NotificacionPlantilla {
  id: number;
  tipo_notificacion: string;
  nombre: string;
  titulo_template: string;
  mensaje_template: string;
  icono?: string;
  nivel?: string;
  activo: boolean;
}

export interface CrearPlantillaData {
  tipo_notificacion: string;
  nombre: string;
  titulo_template: string;
  mensaje_template: string;
  icono?: string;
  nivel?: string;
  activo?: boolean;
}

export interface ActualizarPlantillaParams {
  id: number;
  data: Partial<CrearPlantillaData>;
}

interface NivelConfig {
  label: string;
  color: string;
  bg: string;
}

interface CategoriaOption {
  value: string;
  label: string;
}

// ==================== CONSTANTES ====================

export const NOTIFICACION_NIVELES: Record<string, NivelConfig> = {
  info: { label: 'Informacion', color: 'text-primary-500 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/30' },
  success: { label: 'Exito', color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
  warning: { label: 'Advertencia', color: 'text-yellow-500 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
  error: { label: 'Error', color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
} as const;

export const NOTIFICACION_CATEGORIAS: readonly CategoriaOption[] = [
  { value: 'citas', label: 'Citas' },
  { value: 'inventario', label: 'Inventario' },
  { value: 'pagos', label: 'Pagos' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'profesionales', label: 'Profesionales' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'sistema', label: 'Sistema' },
  { value: 'eventos', label: 'Eventos digitales' },
  { value: 'comisiones', label: 'Comisiones' },
  { value: 'suscripcion', label: 'Suscripcion' },
] as const;
