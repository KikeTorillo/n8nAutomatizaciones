import client from '../client';
import type { ApiResponse } from '../client';
import type { Modulo } from '@/types/entities';

interface ModulosActivos {
  modulos_activos: Record<string, boolean>;
  modulos: Record<string, unknown>;
  organizacion_id: number;
}

interface VerificacionModulo {
  modulo: string;
  activo: boolean;
  metadata?: Record<string, unknown>;
}

export const modulosApi = {
  listarDisponibles: (): Promise<ApiResponse<{ modulos: Modulo[]; total: number }>> =>
    client.get('/modulos/disponibles'),
  obtenerActivos: (): Promise<ApiResponse<ModulosActivos>> =>
    client.get('/modulos/activos'),
  verificarModulo: (modulo: string): Promise<ApiResponse<VerificacionModulo>> =>
    client.get(`/modulos/verificar/${modulo}`),
  activarModulo: (modulo: string): Promise<ApiResponse<VerificacionModulo>> =>
    client.put('/modulos/activar', { modulo }),
  desactivarModulo: (modulo: string): Promise<ApiResponse<VerificacionModulo>> =>
    client.put('/modulos/desactivar', { modulo }),
};
