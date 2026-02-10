/**
 * Entity Types — Marketplace
 */

export type EstadoPerfil = 'borrador' | 'activo' | 'inactivo' | 'suspendido';

export interface PerfilMarketplace {
  id: number;
  organizacion_id: number;
  slug: string;
  nombre_negocio: string;
  descripcion?: string;
  logo_url?: string;
  portada_url?: string;
  industria?: string;
  categoria_id?: number;
  direccion?: string;
  telefono?: string;
  email?: string;
  website?: string;
  horario_texto?: string;
  estado: EstadoPerfil;
  activo: boolean;
  calificacion_promedio?: number;
  total_resenas?: number;
  created_at: string;
  updated_at?: string;
}

export interface CategoriaMarketplace {
  id: number;
  nombre: string;
  slug: string;
  icono?: string;
  orden?: number;
  activo: boolean;
}

export interface ResenaMarketplace {
  id: number;
  perfil_id: number;
  cliente_id: number;
  cita_id?: number;
  calificacion: number;
  comentario?: string;
  respuesta?: string;
  respuesta_fecha?: string;
  moderada: boolean;
  visible: boolean;
  created_at: string;
}
