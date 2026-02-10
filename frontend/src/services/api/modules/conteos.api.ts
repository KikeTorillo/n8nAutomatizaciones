import apiClient from '../client';

// ========== Tipos ==========

interface ConteoListParams {
  sucursal_id?: number;
  estado?: string;
  tipo_conteo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  folio?: string;
  limit?: number;
  offset?: number;
}

interface ConteoCreateData {
  tipo_conteo: string;
  sucursal_id?: number;
  filtros?: Record<string, unknown>;
  fecha_programada?: string;
  usuario_contador_id?: number;
  usuario_supervisor_id?: number;
  notas?: string;
}

interface ConteoItemData {
  cantidad_contada: number;
  notas?: string;
}

interface ConteoCancelarData {
  motivo?: string;
}

interface ConteoEstadisticasParams {
  fecha_desde?: string;
  fecha_hasta?: string;
}

// ========== API ==========

export const conteosApi = {
  /** Listar conteos con filtros */
  listar: (params: ConteoListParams = {}) =>
    apiClient.get('/inventario/conteos', { params }),

  /** Obtener conteo por ID con items */
  obtenerPorId: (id: number) =>
    apiClient.get(`/inventario/conteos/${id}`),

  /** Crear nuevo conteo de inventario */
  crear: (data: ConteoCreateData) =>
    apiClient.post('/inventario/conteos', data),

  /** Iniciar conteo (borrador → en_proceso) */
  iniciar: (id: number) =>
    apiClient.post(`/inventario/conteos/${id}/iniciar`),

  /** Registrar cantidad contada para un item */
  registrarConteo: (itemId: number, data: ConteoItemData) =>
    apiClient.put(`/inventario/conteos/items/${itemId}`, data),

  /** Completar conteo (en_proceso → completado) */
  completar: (id: number) =>
    apiClient.post(`/inventario/conteos/${id}/completar`),

  /** Aplicar ajustes de inventario (completado → ajustado) */
  aplicarAjustes: (id: number) =>
    apiClient.post(`/inventario/conteos/${id}/aplicar-ajustes`),

  /** Cancelar conteo */
  cancelar: (id: number, data: ConteoCancelarData = {}) =>
    apiClient.post(`/inventario/conteos/${id}/cancelar`, data),

  /** Buscar item por código de barras o SKU */
  buscarItem: (conteoId: number, codigo: string) =>
    apiClient.get(`/inventario/conteos/${conteoId}/buscar-item`, { params: { codigo } }),

  /** Obtener estadísticas de conteos por período */
  obtenerEstadisticas: (params: ConteoEstadisticasParams = {}) =>
    apiClient.get('/inventario/conteos/estadisticas', { params }),
};
