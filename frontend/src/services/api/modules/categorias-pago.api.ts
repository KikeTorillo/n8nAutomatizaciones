import apiClient from '../client';

// ========== Tipos ==========

interface CategoriaPagoCreateData {
  codigo: string;
  nombre: string;
  nivel_salarial?: string;
  permite_comisiones?: boolean;
  permite_bonos?: boolean;
  permite_viaticos?: boolean;
  color?: string;
  icono?: string;
}

interface CategoriaPagoUpdateData extends Partial<CategoriaPagoCreateData> {}

interface CategoriaPagoListParams {
  activas?: boolean;
  ordenar_por?: string;
  limit?: number;
  offset?: number;
}

// ========== API ==========

export const categoriasPagoApi = {
  /** Listar categorias de pago de la organizacion */
  listar: (params: CategoriaPagoListParams = {}) =>
    apiClient.get('/categorias-pago', { params }),

  /** Obtener estadisticas de uso de categorias */
  estadisticas: () =>
    apiClient.get('/categorias-pago/estadisticas'),

  /** Obtener categoria de pago por ID */
  obtener: (id: number) =>
    apiClient.get(`/categorias-pago/${id}`),

  /** Crear categoria de pago (solo admin/propietario) */
  crear: (data: CategoriaPagoCreateData) =>
    apiClient.post('/categorias-pago', data),

  /** Actualizar categoria de pago */
  actualizar: (id: number, data: CategoriaPagoUpdateData) =>
    apiClient.put(`/categorias-pago/${id}`, data),

  /** Eliminar categoria de pago (soft delete) */
  eliminar: (id: number) =>
    apiClient.delete(`/categorias-pago/${id}`),
};
