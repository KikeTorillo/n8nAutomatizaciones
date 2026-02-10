import apiClient from '../client';

// ========== Tipos ==========

interface TasaCambioData {
  moneda_origen: string;
  moneda_destino: string;
  tasa: number;
  fuente?: string;
}

interface ConvertirData {
  monto: number;
  origen: string;
  destino: string;
  fecha?: string;
}

interface ConvertirMultipleData {
  items: Array<{ monto: number; moneda: string }>;
  destino: string;
}

// ========== API ==========

export const monedasApi = {
  /** Listar monedas disponibles */
  listar: (activas: boolean = true) =>
    apiClient.get('/monedas', { params: { activas } }),

  /** Obtener moneda por código */
  obtenerPorCodigo: (codigo: string) =>
    apiClient.get(`/monedas/${codigo}`),

  /** Obtener tasa de cambio actual */
  obtenerTasa: (origen: string, destino: string, fecha?: string) =>
    apiClient.get('/monedas/tasas/actual', { params: { origen, destino, fecha } }),

  /** Obtener historial de tasas */
  obtenerHistorialTasas: (origen: string, destino: string, dias: number = 30) =>
    apiClient.get('/monedas/tasas/historial', { params: { origen, destino, dias } }),

  /** Guardar nueva tasa de cambio (admin) */
  guardarTasa: (data: TasaCambioData) =>
    apiClient.post('/monedas/tasas', data),

  /** Convertir monto entre monedas */
  convertir: (data: ConvertirData) =>
    apiClient.post('/monedas/convertir', data),

  /** Convertir múltiples montos */
  convertirMultiple: (data: ConvertirMultipleData) =>
    apiClient.post('/monedas/convertir/multiple', data),
};
