import apiClient from '../client';

// ========== Tipos ==========

interface RecordatorioConfigUpdateData {
  habilitado?: boolean;
  recordatorio_1_horas?: number;
  plantilla_mensaje?: string;
  [key: string]: unknown;
}

interface RecordatorioEstadisticasParams {
  fecha_desde?: string;
  fecha_hasta?: string;
}

interface RecordatorioPruebaData {
  telefono: string;
  mensaje?: string;
}

// ========== API ==========

export const recordatoriosApi = {
  /** Obtener configuración de recordatorios de la organización */
  obtenerConfiguracion: () =>
    apiClient.get('/recordatorios/configuracion'),

  /** Actualizar configuración de recordatorios */
  actualizarConfiguracion: (data: RecordatorioConfigUpdateData) =>
    apiClient.put('/recordatorios/configuracion', data),

  /** Obtener estadísticas de recordatorios */
  obtenerEstadisticas: (params: RecordatorioEstadisticasParams = {}) =>
    apiClient.get('/recordatorios/estadisticas', { params }),

  /** Obtener historial de recordatorios de una cita */
  obtenerHistorial: (citaId: number) =>
    apiClient.get('/recordatorios/historial', { params: { cita_id: citaId } }),

  /** Enviar mensaje de prueba */
  enviarPrueba: (data: RecordatorioPruebaData) =>
    apiClient.post('/recordatorios/test', data),
};
