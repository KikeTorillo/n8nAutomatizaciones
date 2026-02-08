import apiClient from '../client';
import type { Cliente, ClienteEstadisticas, Etiqueta } from '@/types/entities';

// ========== Tipos de parámetros ==========

interface ClienteCreateData {
  nombre: string;
  email?: string;
  telefono?: string;
  telefono_secundario?: string;
  direccion?: string;
  notas?: string;
  tipo?: 'persona' | 'empresa';
  rfc?: string;
  razon_social?: string;
  marketing_permitido?: boolean;
  fecha_nacimiento?: string;
  genero?: string;
  fuente?: string;
  referido_por?: number;
  foto_url?: string;
  permite_credito?: boolean;
  limite_credito?: number;
  dias_credito?: number;
}

interface ClienteListParams {
  page?: number;
  limit?: number;
  busqueda?: string;
  activo?: boolean;
  marketing_permitido?: boolean;
  ordenPor?: string;
  orden?: 'ASC' | 'DESC';
}

interface ActividadCreateData {
  tipo: 'nota' | 'llamada' | 'tarea' | 'email';
  titulo: string;
  descripcion?: string;
  fecha_vencimiento?: string;
  prioridad?: 'baja' | 'media' | 'alta';
  asignado_a?: number;
}

interface ActividadListParams {
  page?: number;
  limit?: number;
  tipo?: string;
  estado?: string;
  soloTareas?: boolean;
}

interface DocumentoListParams {
  tipo?: string;
  verificado?: boolean;
  estado_vencimiento?: string;
  limite?: number;
  offset?: number;
}

interface CreditoConfigData {
  permite_credito: boolean;
  limite_credito?: number;
  dias_credito?: number;
}

interface OportunidadListParams {
  page?: number;
  limit?: number;
  estado?: string;
}

// ========== API ==========

export const clientesApi = {
  // ========== CRUD Basico ==========

  crear: (data: ClienteCreateData) =>
    apiClient.post<Cliente>('/clientes', data),

  listar: (params: ClienteListParams = {}) =>
    apiClient.get<{ data: Cliente[]; pagination: { total: number; page: number; limit: number } }>(
      '/clientes',
      { params },
    ),

  obtener: (id: number) =>
    apiClient.get<Cliente>(`/clientes/${id}`),

  actualizar: (id: number, data: Partial<ClienteCreateData>) =>
    apiClient.put<Cliente>(`/clientes/${id}`, data),

  eliminar: (id: number) =>
    apiClient.delete(`/clientes/${id}`),

  buscar: (params: { q: string; limit?: number }) =>
    apiClient.get<{ clientes: Cliente[] }>('/clientes/buscar', { params }),

  buscarPorTelefono: (params: { telefono: string; exacto?: boolean; incluir_inactivos?: boolean; crear_si_no_existe?: boolean }) =>
    apiClient.get('/clientes/buscar-telefono', { params }),

  buscarPorNombre: (params: { nombre: string; limit?: number }) =>
    apiClient.get<{ clientes: Cliente[] }>('/clientes/buscar-nombre', { params }),

  obtenerEstadisticas: () =>
    apiClient.get<ClienteEstadisticas>('/clientes/estadisticas'),

  cambiarEstado: (id: number, activo: boolean) =>
    apiClient.patch(`/clientes/${id}/estado`, { activo }),

  obtenerEstadisticasCliente: (id: number) =>
    apiClient.get(`/clientes/${id}/estadisticas`),

  importarCSV: (data: { clientes: Array<{ nombre: string; email?: string; telefono?: string; direccion?: string; notas?: string }> }) =>
    apiClient.post<{ creados: number; errores: number; duplicados: number }>('/clientes/importar-csv', data),

  // ========== Etiquetas ==========

  listarEtiquetas: (params: { soloActivas?: boolean } = {}) =>
    apiClient.get<{ etiquetas: Etiqueta[] }>('/clientes/etiquetas', { params }),

  crearEtiqueta: (data: { nombre: string; color: string; descripcion?: string; orden?: number }) =>
    apiClient.post<Etiqueta>('/clientes/etiquetas', data),

  obtenerEtiqueta: (id: number) =>
    apiClient.get<Etiqueta>(`/clientes/etiquetas/${id}`),

  actualizarEtiqueta: (id: number, data: { nombre?: string; color?: string; descripcion?: string; orden?: number; activo?: boolean }) =>
    apiClient.put<Etiqueta>(`/clientes/etiquetas/${id}`, data),

  eliminarEtiqueta: (id: number) =>
    apiClient.delete(`/clientes/etiquetas/${id}`),

  obtenerEtiquetasCliente: (clienteId: number) =>
    apiClient.get<{ etiquetas: Etiqueta[] }>(`/clientes/${clienteId}/etiquetas`),

  asignarEtiquetasCliente: (clienteId: number, etiquetaIds: number[]) =>
    apiClient.post(`/clientes/${clienteId}/etiquetas`, { etiqueta_ids: etiquetaIds }),

  agregarEtiquetaCliente: (clienteId: number, etiquetaId: number) =>
    apiClient.post(`/clientes/${clienteId}/etiquetas/${etiquetaId}`),

  quitarEtiquetaCliente: (clienteId: number, etiquetaId: number) =>
    apiClient.delete(`/clientes/${clienteId}/etiquetas/${etiquetaId}`),

  // ========== Actividades y Timeline ==========

  listarActividades: (clienteId: number, params: ActividadListParams = {}) =>
    apiClient.get(`/clientes/${clienteId}/actividades`, { params }),

  obtenerTimeline: (clienteId: number, params: { limit?: number; offset?: number } = {}) =>
    apiClient.get(`/clientes/${clienteId}/timeline`, { params }),

  crearActividad: (clienteId: number, data: ActividadCreateData) =>
    apiClient.post(`/clientes/${clienteId}/actividades`, data),

  obtenerActividad: (clienteId: number, actividadId: number) =>
    apiClient.get(`/clientes/${clienteId}/actividades/${actividadId}`),

  actualizarActividad: (clienteId: number, actividadId: number, data: Partial<ActividadCreateData>) =>
    apiClient.put(`/clientes/${clienteId}/actividades/${actividadId}`, data),

  eliminarActividad: (clienteId: number, actividadId: number) =>
    apiClient.delete(`/clientes/${clienteId}/actividades/${actividadId}`),

  completarTarea: (clienteId: number, actividadId: number) =>
    apiClient.patch(`/clientes/${clienteId}/actividades/${actividadId}/completar`),

  contarActividades: (clienteId: number) =>
    apiClient.get(`/clientes/${clienteId}/actividades/conteo`),

  // ========== Documentos ==========

  obtenerTiposDocumento: () =>
    apiClient.get('/clientes/documentos/tipos'),

  listarDocumentosPorVencer: (params: { dias?: number } = {}) =>
    apiClient.get('/clientes/documentos/por-vencer', { params }),

  listarDocumentos: (clienteId: number, params: DocumentoListParams = {}) =>
    apiClient.get(`/clientes/${clienteId}/documentos`, { params }),

  obtenerDocumento: (clienteId: number, documentoId: number) =>
    apiClient.get(`/clientes/${clienteId}/documentos/${documentoId}`),

  crearDocumento: (clienteId: number, formData: FormData) =>
    apiClient.post(`/clientes/${clienteId}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  actualizarDocumento: (clienteId: number, documentoId: number, data: Record<string, unknown>) =>
    apiClient.put(`/clientes/${clienteId}/documentos/${documentoId}`, data),

  eliminarDocumento: (clienteId: number, documentoId: number) =>
    apiClient.delete(`/clientes/${clienteId}/documentos/${documentoId}`),

  verificarDocumento: (clienteId: number, documentoId: number, verificado: boolean) =>
    apiClient.patch(`/clientes/${clienteId}/documentos/${documentoId}/verificar`, { verificado }),

  obtenerDocumentoPresigned: (clienteId: number, documentoId: number, params: { expiry?: number } = {}) =>
    apiClient.get<{ url: string }>(`/clientes/${clienteId}/documentos/${documentoId}/presigned`, { params }),

  contarDocumentos: (clienteId: number) =>
    apiClient.get(`/clientes/${clienteId}/documentos/conteo`),

  subirArchivoDocumento: (clienteId: number, documentoId: number, formData: FormData) =>
    apiClient.post(`/clientes/${clienteId}/documentos/${documentoId}/archivo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // ========== Oportunidades por Cliente ==========

  listarOportunidadesCliente: (clienteId: number, params: OportunidadListParams = {}) =>
    apiClient.get(`/clientes/${clienteId}/oportunidades`, { params }),

  crearOportunidadCliente: (clienteId: number, data: Record<string, unknown>) =>
    apiClient.post(`/clientes/${clienteId}/oportunidades`, data),

  obtenerEstadisticasOportunidadesCliente: (clienteId: number) =>
    apiClient.get(`/clientes/${clienteId}/oportunidades/estadisticas`),

  // ========== Credito / Fiado ==========

  obtenerEstadoCredito: (clienteId: number) =>
    apiClient.get<{
      cliente: Cliente;
      permite_credito: boolean;
      limite_credito: number;
      saldo_credito: number;
      disponible: number;
      dias_credito: number;
      credito_suspendido: boolean;
    }>(`/clientes/${clienteId}/credito`),

  actualizarCredito: (clienteId: number, data: CreditoConfigData) =>
    apiClient.patch(`/clientes/${clienteId}/credito`, data),

  suspenderCredito: (clienteId: number, data: { motivo?: string } = {}) =>
    apiClient.post(`/clientes/${clienteId}/credito/suspender`, data),

  reactivarCredito: (clienteId: number) =>
    apiClient.post(`/clientes/${clienteId}/credito/reactivar`),

  registrarAbono: (clienteId: number, data: { monto: number; descripcion?: string }) =>
    apiClient.post(`/clientes/${clienteId}/credito/abono`, data),

  listarMovimientosCredito: (clienteId: number, params: { limit?: number; offset?: number } = {}) =>
    apiClient.get(`/clientes/${clienteId}/credito/movimientos`, { params }),

  listarClientesConSaldo: (params: { solo_vencidos?: boolean } = {}) =>
    apiClient.get('/clientes/credito/con-saldo', { params }),
};
