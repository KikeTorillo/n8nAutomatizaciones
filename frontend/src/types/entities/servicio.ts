import type { BaseEntity } from './common';

export interface Servicio extends BaseEntity {
  nombre: string;
  descripcion?: string;
  precio: number;
  duracion_minutos: number;
  categoria_id?: number;
  categoria_nombre?: string;
  activo: boolean;
  color?: string;
  imagen_url?: string;
  requiere_profesional?: boolean;
  max_clientes_simultaneos?: number;
  // Comisión
  tipo_comision?: 'porcentaje' | 'fijo';
  valor_comision?: number;
}
