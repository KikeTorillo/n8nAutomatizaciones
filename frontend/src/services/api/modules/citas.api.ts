import { AxiosResponse } from 'axios';
import apiClient from '../client';
import type {
  Cita,
  EstadoCita,
  CitasListParams,
  CitasListResponse,
  CrearCitaData,
  ActualizarCitaData,
} from '@/types/entities/cita';
import type { ApiResponse } from '@/types/entities/common';

// ========== Request Types ==========

interface CancelarCitaRequest {
  motivo_cancelacion?: string;
  cancelado_por?: string;
}

interface CompletarCitaRequest {
  notas_finalizacion?: string;
  notas_profesional?: string;
  comentario_profesional?: string;
  precio_total_real?: number;
  metodo_pago?: string;
}

interface NoShowCitaRequest {
  motivo_no_show?: string;
  notas_adicionales?: string;
}

interface IniciarCitaRequest {
  notas_inicio?: string;
}

interface ConfirmarCitaRequest {
  [key: string]: unknown;
}

interface WalkInCitaRequest {
  cliente_id?: number;
  nombre_cliente?: string;
  nombre?: string;
  telefono?: string;
  email?: string;
  profesional_id?: number;
  servicio_id?: number;
  sucursal_id?: number;
  tiempo_espera_aceptado?: number;
  notas_walk_in?: string;
  notas?: string;
}

interface CrearRecurrenteRequest extends CrearCitaData {
  patron_recurrencia: Record<string, unknown>;
}

interface CancelarSerieRequest {
  motivo_cancelacion?: string;
  cancelar_desde_fecha?: string;
  cancelar_solo_pendientes?: boolean;
}

interface PreviewRecurrenciaRequest {
  fecha_inicio: string;
  hora_inicio: string;
  duracion_minutos: number;
  profesional_id: number;
  patron_recurrencia: Record<string, unknown>;
}

interface DisponibilidadInmediataParams {
  servicio_id?: number | null;
  profesional_id?: number | null;
}

// ========== Response Types ==========

type CitaResponse = AxiosResponse<ApiResponse<Cita>>;
type CitaListResponse = AxiosResponse<ApiResponse<CitasListResponse>>;

// ========== API ==========

export const citasApi = {
  /** Crear cita */
  crear: (data: CrearCitaData): Promise<CitaResponse> =>
    apiClient.post('/citas', data),

  /** Listar citas */
  listar: (params: CitasListParams = {}): Promise<CitaListResponse> =>
    apiClient.get('/citas', { params }),

  /** Obtener cita por ID */
  obtener: (id: number): Promise<CitaResponse> =>
    apiClient.get(`/citas/${id}`),

  /** Actualizar cita */
  actualizar: (id: number, data: ActualizarCitaData): Promise<CitaResponse> =>
    apiClient.put(`/citas/${id}`, data),

  /** Cancelar cita */
  cancelar: (id: number, data: CancelarCitaRequest = {}): Promise<CitaResponse> =>
    apiClient.post(`/citas/${id}/cancelar`, data),

  /** Confirmar asistencia de cita */
  confirmar: (id: number, data: ConfirmarCitaRequest = {}): Promise<CitaResponse> =>
    apiClient.patch(`/citas/${id}/confirmar-asistencia`, data),

  /** Iniciar cita (cambiar a estado en_curso) */
  iniciar: (id: number, data: IniciarCitaRequest = {}): Promise<CitaResponse> =>
    apiClient.post(`/citas/${id}/start-service`, data),

  /** Completar cita */
  completar: (id: number, data: CompletarCitaRequest = {}): Promise<CitaResponse> =>
    apiClient.post(`/citas/${id}/complete`, data),

  /** Marcar cita como no show (cliente no llego) */
  noShow: (id: number, data: NoShowCitaRequest = {}): Promise<CitaResponse> =>
    apiClient.post(`/citas/${id}/no-show`, data),

  /** Enviar recordatorio de cita por WhatsApp */
  enviarRecordatorio: (id: number): Promise<AxiosResponse> =>
    apiClient.post(`/citas/${id}/enviar-recordatorio`),

  /** Obtener historial de recordatorios de una cita */
  obtenerRecordatorios: (id: number): Promise<AxiosResponse> =>
    apiClient.get(`/citas/${id}/recordatorios`),

  /** Crear cita walk-in (cliente sin cita previa) */
  crearWalkIn: (data: WalkInCitaRequest): Promise<AxiosResponse> =>
    apiClient.post('/citas/walk-in', data),

  /** Consultar disponibilidad inmediata para walk-in */
  disponibilidadInmediata: (params: DisponibilidadInmediataParams): Promise<AxiosResponse> =>
    apiClient.get('/citas/disponibilidad-inmediata', { params }),

  // ==================== CITAS RECURRENTES ====================

  /** Crear serie de citas recurrentes */
  crearRecurrente: (data: CrearRecurrenteRequest): Promise<AxiosResponse> =>
    apiClient.post('/citas/recurrente', data),

  /** Obtener todas las citas de una serie recurrente */
  obtenerSerie: (serieId: string, params: { incluir_canceladas?: boolean } = {}): Promise<AxiosResponse> =>
    apiClient.get(`/citas/serie/${serieId}`, { params }),

  /** Cancelar todas las citas pendientes de una serie */
  cancelarSerie: (serieId: string, data: CancelarSerieRequest): Promise<AxiosResponse> =>
    apiClient.post(`/citas/serie/${serieId}/cancelar`, data),

  /** Preview de fechas para serie recurrente (sin crear) */
  previewRecurrencia: (data: PreviewRecurrenciaRequest): Promise<AxiosResponse> =>
    apiClient.post('/citas/recurrente/preview', data),

  // Alias de compatibilidad (Ene 2026)
  obtenerPorFecha: (fecha: string): Promise<CitaListResponse> =>
    apiClient.get('/citas', { params: { fecha_cita: fecha } }),
};
