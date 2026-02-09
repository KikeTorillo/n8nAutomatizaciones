import apiClient from '../client';

// ========== TYPES ==========

export interface ConectorListParams {
  page?: number;
  limit?: number;
  gateway?: string;
  entorno?: string;
  activo?: boolean;
  orden?: string;
  direccion?: 'asc' | 'desc';
}

export interface ConectorCreateData {
  gateway: string;
  entorno: string;
  nombre_display?: string;
  credenciales: Record<string, unknown>;
  webhook_url?: string;
  webhook_secret?: string;
  es_principal?: boolean;
}

export interface ConectorUpdateData {
  nombre_display?: string;
  credenciales?: Record<string, unknown>;
  webhook_url?: string;
  webhook_secret?: string;
  es_principal?: boolean;
  activo?: boolean;
}

export interface Gateway {
  id: string;
  nombre: string;
  campos_requeridos: string[];
}

// ========== API ==========

const BASE_URL = '/suscripciones-negocio/conectores';

/**
 * API de Conectores de Pago
 * Gestión de conectores de pago multi-tenant (Stripe, MercadoPago, etc.)
 */
export const conectoresApi = {
  /** Listar gateways soportados */
  listarGateways: () =>
    apiClient.get(BASE_URL + '/gateways'),

  /** Listar conectores de la organización con paginación y filtros */
  listar: (params: ConectorListParams = {}) =>
    apiClient.get(BASE_URL, { params }),

  /** Obtener conector por ID */
  obtener: (id: number) =>
    apiClient.get(`${BASE_URL}/${id}`),

  /** Crear nuevo conector */
  crear: (data: ConectorCreateData) =>
    apiClient.post(BASE_URL, data),

  /** Actualizar conector existente */
  actualizar: (id: number, data: ConectorUpdateData) =>
    apiClient.put(`${BASE_URL}/${id}`, data),

  /** Eliminar conector */
  eliminar: (id: number) =>
    apiClient.delete(`${BASE_URL}/${id}`),

  /** Verificar conectividad del conector */
  verificarConectividad: (id: number) =>
    apiClient.post(`${BASE_URL}/${id}/verificar`),
};
