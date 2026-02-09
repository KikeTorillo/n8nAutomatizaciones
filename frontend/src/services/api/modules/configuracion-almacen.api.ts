import apiClient from '../client';

// ========== TYPES ==========

export interface ConfiguracionAlmacenUpdateData {
  pasos_recepcion?: number;
  pasos_envio?: number;
  ubicacion_recepcion_id?: number;
  ubicacion_envio_id?: number;
  ubicacion_calidad_id?: number;
  ubicacion_empaque_id?: number;
  [key: string]: unknown;
}

export interface MultietapaParams {
  tipo?: 'recepcion' | 'envio';
}

export interface MultietapaResult {
  usa_multietapa: boolean | { recepcion: boolean; envio: boolean };
}

export interface DescripcionesPasos {
  recepcion: Record<number, string>;
  envio: Record<number, string>;
}

// ========== API ==========

/**
 * API de Configuración de Almacén
 */
export const configuracionAlmacenApi = {
  /** Listar configuraciones de todas las sucursales */
  listar: () =>
    apiClient.get('/inventario/configuracion-almacen'),

  /** Obtener configuración por sucursal */
  obtenerPorSucursal: (sucursalId: number) =>
    apiClient.get(`/inventario/configuracion-almacen/${sucursalId}`),

  /** Actualizar configuración de sucursal */
  actualizar: (sucursalId: number, data: ConfiguracionAlmacenUpdateData) =>
    apiClient.put(`/inventario/configuracion-almacen/${sucursalId}`, data),

  /** Crear ubicaciones por defecto para rutas multietapa */
  crearUbicacionesDefault: (sucursalId: number) =>
    apiClient.post(`/inventario/configuracion-almacen/${sucursalId}/crear-ubicaciones`),

  /** Verificar si la sucursal usa rutas multietapa */
  verificarMultietapa: (sucursalId: number, params: MultietapaParams = {}) =>
    apiClient.get(`/inventario/configuracion-almacen/${sucursalId}/usa-multietapa`, { params }),

  /** Obtener descripciones de todos los pasos disponibles */
  obtenerDescripcionesPasos: () =>
    apiClient.get('/inventario/configuracion-almacen/descripciones-pasos'),
};
