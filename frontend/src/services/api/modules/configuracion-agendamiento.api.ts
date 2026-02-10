import apiClient from '../client';

// ========== Tipos ==========

interface ConfigAgendamientoUpdateData {
  round_robin_habilitado?: boolean;
  verificar_disponibilidad?: boolean;
}

// ========== API ==========

export const configuracionAgendamientoApi = {
  /** Obtener configuración de agendamiento de la organización */
  obtener: () =>
    apiClient.get('/agendamiento/configuracion'),

  /** Actualizar configuración de agendamiento */
  actualizar: (data: ConfigAgendamientoUpdateData) =>
    apiClient.put('/agendamiento/configuracion', data),

  /** Toggle rápido para round-robin */
  toggleRoundRobin: () =>
    apiClient.post('/agendamiento/configuracion/round-robin/toggle'),
};
