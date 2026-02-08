import { AxiosResponse } from 'axios';
import apiClient, { publicApiClient } from '../client';
import type {
  EventoDigital,
  Invitado,
  Plantilla,
  Mesa,
  Ubicacion,
  Regalo,
  FotoGaleria,
  Felicitacion,
  TipoEvento,
  EstadoEvento,
  EstadoRsvp,
  EstadoFoto,
} from '@/types/entities/evento';
import type { ApiResponse, ApiListResponse } from '@/types/entities/common';

// ========== Request Types ==========

interface CrearEventoRequest {
  nombre: string;
  tipo: TipoEvento;
  descripcion?: string;
  fecha_evento: string;
  hora_evento?: string;
  fecha_limite_rsvp?: string;
  plantilla_id?: number;
  configuracion?: Record<string, unknown>;
}

interface ListarEventosParams {
  estado?: EstadoEvento;
  tipo?: TipoEvento;
  busqueda?: string;
  pagina?: number;
  limite?: number;
}

interface CrearInvitadoRequest {
  nombre: string;
  email?: string;
  telefono?: string;
  grupo_familiar?: string;
  max_acompanantes?: number;
  etiquetas?: string[];
}

interface ListarInvitadosParams {
  estado_rsvp?: EstadoRsvp;
  busqueda?: string;
  pagina?: number;
  limite?: number;
}

interface CheckinStatsResponse {
  total_invitados: number;
  total_confirmados: number;
  total_checkin: number;
  porcentaje: number;
}

interface CheckinReciente {
  id: number;
  invitado_nombre: string;
  num_acompanantes: number;
  checkin_at: string;
}

interface RegistrarCheckinRequest {
  token: string;
  num_acompanantes?: number;
}

interface QRInvitadoResponse {
  qr_code: string;
  url_invitacion: string;
}

interface WhatsAppLinkResponse {
  whatsapp_url: string;
  mensaje: string;
}

interface ListarRegalosParams {
  disponibles?: boolean;
}

interface MarcarRegaloCompradoRequest {
  comprado_por: string;
}

interface CrearFelicitacionRequest {
  nombre_autor: string;
  mensaje: string;
  invitado_id?: number;
}

interface ListarFelicitacionesParams {
  aprobadas?: boolean;
  limit?: number;
  offset?: number;
}

interface ListarPlantillasParams {
  tipo_evento?: TipoEvento;
  es_premium?: boolean;
}

interface CrearPlantillaRequest {
  nombre: string;
  codigo: string;
  tipo_evento: TipoEvento;
  estructura_html?: string;
  estilos_css?: string;
  es_premium?: boolean;
  preview_url?: string;
}

interface CrearMesaRequest {
  nombre: string;
  numero?: number;
  tipo?: string;
  posicion_x?: number;
  posicion_y?: number;
  rotacion?: number;
  capacidad?: number;
}

interface ActualizarPosicionesMesasRequest {
  posiciones: Array<{
    id: number;
    posicion_x: number;
    posicion_y: number;
    rotacion?: number;
  }>;
}

interface SubirFotoRequest {
  url: string;
  thumbnail_url?: string;
  caption?: string;
  tamanio_bytes?: number;
  tipo_mime?: string;
}

interface ListarFotosParams {
  estado?: EstadoFoto;
  limit?: number;
  offset?: number;
}

interface CambiarEstadoFotoRequest {
  estado: EstadoFoto;
}

interface ConfirmarRSVPRequest {
  asistira: boolean;
  num_asistentes?: number;
  mensaje_rsvp?: string;
  restricciones_dieteticas?: string;
}

interface BloqueInvitacion {
  id: string;
  tipo: string;
  contenido?: Record<string, unknown>;
  estilos?: Record<string, unknown>;
  visible?: boolean;
  orden?: number;
}

interface ActualizarBloqueRequest {
  contenido?: Record<string, unknown>;
  estilos?: Record<string, unknown>;
  visible?: boolean;
}

// ========== Response Types ==========

type EventoResponse = AxiosResponse<ApiResponse<EventoDigital>>;
type EventosListResponse = AxiosResponse<ApiListResponse<EventoDigital>>;
type InvitadoResponse = AxiosResponse<ApiResponse<Invitado>>;
type InvitadosListResponse = AxiosResponse<ApiListResponse<Invitado>>;
type PlantillaResponse = AxiosResponse<ApiResponse<Plantilla>>;
type PlantillasListResponse = AxiosResponse<ApiListResponse<Plantilla>>;
type MesaResponse = AxiosResponse<ApiResponse<Mesa>>;
type MesasListResponse = AxiosResponse<ApiListResponse<Mesa>>;
type UbicacionResponse = AxiosResponse<ApiResponse<Ubicacion>>;
type UbicacionesListResponse = AxiosResponse<ApiListResponse<Ubicacion>>;
type RegaloResponse = AxiosResponse<ApiResponse<Regalo>>;
type RegalosListResponse = AxiosResponse<ApiListResponse<Regalo>>;
type FotoResponse = AxiosResponse<ApiResponse<FotoGaleria>>;
type FotosListResponse = AxiosResponse<ApiListResponse<FotoGaleria>>;
type FelicitacionResponse = AxiosResponse<ApiResponse<Felicitacion>>;
type FelicitacionesListResponse = AxiosResponse<ApiListResponse<Felicitacion>>;
type BloqueResponse = AxiosResponse<ApiResponse<BloqueInvitacion>>;
type BloquesResponse = AxiosResponse<{ bloques: BloqueInvitacion[]; total: number }>;

/**
 * API de Eventos Digitales
 * Invitaciones, galerías, mesas, plantillas
 */
export const eventosDigitalesApi = {
  // ========== Eventos ==========

  /**
   * Crear evento digital
   */
  crearEvento: (data: CrearEventoRequest): Promise<EventoResponse> =>
    apiClient.post('/eventos-digitales/eventos', data),

  /**
   * Listar eventos de la organización
   */
  listarEventos: (params: ListarEventosParams = {}): Promise<EventosListResponse> =>
    apiClient.get('/eventos-digitales/eventos', { params }),

  /**
   * Obtener evento por ID
   */
  obtenerEvento: (id: number): Promise<EventoResponse> =>
    apiClient.get(`/eventos-digitales/eventos/${id}`),

  /**
   * Actualizar evento
   */
  actualizarEvento: (id: number, data: Partial<CrearEventoRequest>): Promise<EventoResponse> =>
    apiClient.put(`/eventos-digitales/eventos/${id}`, data),

  /**
   * Eliminar evento
   */
  eliminarEvento: (id: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/eventos-digitales/eventos/${id}`),

  /**
   * Publicar evento
   */
  publicarEvento: (id: number): Promise<EventoResponse> =>
    apiClient.post(`/eventos-digitales/eventos/${id}/publicar`),

  /**
   * Obtener estadísticas RSVP del evento
   */
  obtenerEstadisticasEvento: (id: number): Promise<AxiosResponse<ApiResponse<CheckinStatsResponse>>> =>
    apiClient.get(`/eventos-digitales/eventos/${id}/estadisticas`),

  // ========== Invitados ==========

  /**
   * Crear invitado
   */
  crearInvitado: (eventoId: number, data: CrearInvitadoRequest): Promise<InvitadoResponse> =>
    apiClient.post(`/eventos-digitales/eventos/${eventoId}/invitados`, data),

  /**
   * Listar invitados del evento
   */
  listarInvitados: (eventoId: number, params: ListarInvitadosParams = {}): Promise<InvitadosListResponse> =>
    apiClient.get(`/eventos-digitales/eventos/${eventoId}/invitados`, { params }),

  /**
   * Actualizar invitado
   */
  actualizarInvitado: (id: number, data: Partial<CrearInvitadoRequest>): Promise<InvitadoResponse> =>
    apiClient.put(`/eventos-digitales/invitados/${id}`, data),

  /**
   * Eliminar invitado
   */
  eliminarInvitado: (id: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/eventos-digitales/invitados/${id}`),

  /**
   * Importar invitados desde CSV
   */
  importarInvitados: (eventoId: number, formData: FormData): Promise<AxiosResponse<ApiResponse<{ imported: number }>>> =>
    apiClient.post(`/eventos-digitales/eventos/${eventoId}/invitados/importar`, formData),

  /**
   * Exportar invitados a CSV
   */
  exportarInvitados: (eventoId: number): Promise<AxiosResponse<Blob>> =>
    apiClient.get(`/eventos-digitales/eventos/${eventoId}/invitados/exportar`, { responseType: 'blob' }),

  /**
   * Obtener link de WhatsApp para invitado
   */
  obtenerWhatsAppLink: (id: number): Promise<AxiosResponse<ApiResponse<WhatsAppLinkResponse>>> =>
    apiClient.get(`/eventos-digitales/invitados/${id}/whatsapp`),

  // ========== Check-In ==========

  /**
   * Obtener estadísticas de check-in del evento
   */
  obtenerCheckinStats: (eventoId: number): Promise<AxiosResponse<ApiResponse<CheckinStatsResponse>>> =>
    apiClient.get(`/eventos-digitales/eventos/${eventoId}/checkin/stats`),

  /**
   * Listar check-ins recientes del evento
   */
  listarCheckinsRecientes: (eventoId: number, params: { limit?: number; offset?: number } = {}): Promise<AxiosResponse<{ checkins: CheckinReciente[] }>> =>
    apiClient.get(`/eventos-digitales/eventos/${eventoId}/checkin/lista`, { params }),

  /**
   * Registrar check-in de invitado
   */
  registrarCheckin: (eventoId: number, data: RegistrarCheckinRequest): Promise<InvitadoResponse> =>
    apiClient.post(`/eventos-digitales/eventos/${eventoId}/checkin`, data),

  // ========== QR Invitados ==========

  /**
   * Obtener QR de un invitado
   */
  obtenerQRInvitado: (eventoId: number, invitadoId: number, formato: 'base64' | 'png' | 'svg' = 'base64'): Promise<AxiosResponse<ApiResponse<QRInvitadoResponse>>> =>
    apiClient.get(`/eventos-digitales/eventos/${eventoId}/invitados/${invitadoId}/qr`, { params: { formato } }),

  /**
   * Descargar QRs de todos los invitados en ZIP
   */
  descargarQRMasivo: (eventoId: number): Promise<AxiosResponse<Blob>> =>
    apiClient.get(`/eventos-digitales/eventos/${eventoId}/qr-masivo`, { responseType: 'blob' }),

  /**
   * Obtener QR público de invitado (sin auth)
   */
  obtenerQRPublico: (slug: string, token: string, formato: 'base64' | 'png' | 'svg' = 'base64'): Promise<AxiosResponse<ApiResponse<QRInvitadoResponse>>> =>
    publicApiClient.get(`/public/evento/${slug}/${token}/qr`, { params: { formato } }),

  // ========== Ubicaciones ==========

  /**
   * Crear ubicación
   */
  crearUbicacion: (eventoId: number, data: Partial<Ubicacion>): Promise<UbicacionResponse> =>
    apiClient.post(`/eventos-digitales/eventos/${eventoId}/ubicaciones`, data),

  /**
   * Listar ubicaciones del evento
   */
  listarUbicaciones: (eventoId: number): Promise<UbicacionesListResponse> =>
    apiClient.get(`/eventos-digitales/eventos/${eventoId}/ubicaciones`),

  /**
   * Actualizar ubicación
   */
  actualizarUbicacion: (id: number, data: Partial<Ubicacion>): Promise<UbicacionResponse> =>
    apiClient.put(`/eventos-digitales/ubicaciones/${id}`, data),

  /**
   * Eliminar ubicación
   */
  eliminarUbicacion: (id: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/eventos-digitales/ubicaciones/${id}`),

  // ========== Mesa de Regalos ==========

  /**
   * Crear regalo
   */
  crearRegalo: (eventoId: number, data: Partial<Regalo>): Promise<RegaloResponse> =>
    apiClient.post(`/eventos-digitales/eventos/${eventoId}/mesa-regalos`, data),

  /**
   * Listar regalos del evento
   */
  listarRegalos: (eventoId: number, params: ListarRegalosParams = {}): Promise<RegalosListResponse> =>
    apiClient.get(`/eventos-digitales/eventos/${eventoId}/mesa-regalos`, { params }),

  /**
   * Actualizar regalo
   */
  actualizarRegalo: (id: number, data: Partial<Regalo>): Promise<RegaloResponse> =>
    apiClient.put(`/eventos-digitales/mesa-regalos/${id}`, data),

  /**
   * Marcar regalo como comprado
   */
  marcarRegaloComprado: (id: number, data: MarcarRegaloCompradoRequest): Promise<RegaloResponse> =>
    apiClient.put(`/eventos-digitales/mesa-regalos/${id}/comprar`, data),

  /**
   * Eliminar regalo
   */
  eliminarRegalo: (id: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/eventos-digitales/mesa-regalos/${id}`),

  // ========== Felicitaciones ==========

  /**
   * Crear felicitación
   */
  crearFelicitacion: (eventoId: number, data: CrearFelicitacionRequest): Promise<FelicitacionResponse> =>
    apiClient.post(`/eventos-digitales/eventos/${eventoId}/felicitaciones`, data),

  /**
   * Listar felicitaciones del evento
   */
  listarFelicitaciones: (eventoId: number, params: ListarFelicitacionesParams = {}): Promise<FelicitacionesListResponse> =>
    apiClient.get(`/eventos-digitales/eventos/${eventoId}/felicitaciones`, { params }),

  /**
   * Aprobar felicitación
   */
  aprobarFelicitacion: (id: number): Promise<FelicitacionResponse> =>
    apiClient.put(`/eventos-digitales/felicitaciones/${id}/aprobar`),

  /**
   * Rechazar felicitación
   */
  rechazarFelicitacion: (id: number): Promise<FelicitacionResponse> =>
    apiClient.put(`/eventos-digitales/felicitaciones/${id}/rechazar`),

  /**
   * Eliminar felicitación
   */
  eliminarFelicitacion: (id: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/eventos-digitales/felicitaciones/${id}`),

  // ========== Plantillas ==========

  /**
   * Listar plantillas disponibles
   */
  listarPlantillas: (params: ListarPlantillasParams = {}): Promise<PlantillasListResponse> =>
    apiClient.get('/eventos-digitales/plantillas', { params }),

  /**
   * Obtener plantilla por ID
   */
  obtenerPlantilla: (id: number): Promise<PlantillaResponse> =>
    apiClient.get(`/eventos-digitales/plantillas/${id}`),

  /**
   * Listar plantillas por tipo de evento
   */
  listarPlantillasPorTipo: (tipoEvento: TipoEvento): Promise<PlantillasListResponse> =>
    apiClient.get(`/eventos-digitales/plantillas/tipo/${tipoEvento}`),

  /**
   * Crear plantilla (solo super_admin)
   */
  crearPlantilla: (data: CrearPlantillaRequest): Promise<PlantillaResponse> =>
    apiClient.post('/eventos-digitales/plantillas', data),

  /**
   * Actualizar plantilla (solo super_admin)
   */
  actualizarPlantilla: (id: number, data: Partial<CrearPlantillaRequest>): Promise<PlantillaResponse> =>
    apiClient.put(`/eventos-digitales/plantillas/${id}`, data),

  /**
   * Eliminar plantilla (solo super_admin)
   */
  eliminarPlantilla: (id: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/eventos-digitales/plantillas/${id}`),

  /**
   * Obtener bloques de una plantilla
   */
  obtenerBloquesPlantilla: (id: number): Promise<AxiosResponse<{ bloques: BloqueInvitacion[] }>> =>
    apiClient.get(`/eventos-digitales/plantillas/${id}/bloques`),

  /**
   * Guardar bloques de una plantilla (solo super_admin)
   */
  guardarBloquesPlantilla: (id: number, bloques: BloqueInvitacion[]): Promise<AxiosResponse<ApiResponse<{ bloques: BloqueInvitacion[] }>>> =>
    apiClient.put(`/eventos-digitales/plantillas/${id}/bloques`, { bloques }),

  // ========== Mesas (Seating Chart) ==========

  /**
   * Crear mesa
   */
  crearMesa: (eventoId: number, data: CrearMesaRequest): Promise<MesaResponse> =>
    apiClient.post(`/eventos-digitales/eventos/${eventoId}/mesas`, data),

  /**
   * Listar mesas del evento con invitados asignados
   */
  listarMesas: (eventoId: number): Promise<MesasListResponse> =>
    apiClient.get(`/eventos-digitales/eventos/${eventoId}/mesas`),

  /**
   * Obtener mesa por ID
   */
  obtenerMesa: (mesaId: number): Promise<MesaResponse> =>
    apiClient.get(`/eventos-digitales/mesas/${mesaId}`),

  /**
   * Actualizar mesa
   */
  actualizarMesa: (eventoId: number, mesaId: number, data: Partial<CrearMesaRequest>): Promise<MesaResponse> =>
    apiClient.put(`/eventos-digitales/eventos/${eventoId}/mesas/${mesaId}`, data),

  /**
   * Eliminar mesa
   */
  eliminarMesa: (mesaId: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/eventos-digitales/mesas/${mesaId}`),

  /**
   * Actualizar posiciones de múltiples mesas (batch)
   */
  actualizarPosicionesMesas: (eventoId: number, posiciones: ActualizarPosicionesMesasRequest['posiciones']): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.patch(`/eventos-digitales/eventos/${eventoId}/mesas/posiciones`, { posiciones }),

  /**
   * Asignar invitado a mesa
   */
  asignarInvitadoAMesa: (eventoId: number, mesaId: number, invitadoId: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.post(`/eventos-digitales/eventos/${eventoId}/mesas/${mesaId}/asignar`, { invitado_id: invitadoId }),

  /**
   * Desasignar invitado de mesa
   */
  desasignarInvitado: (invitadoId: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/eventos-digitales/invitados/${invitadoId}/mesa`),

  /**
   * Obtener estadísticas de ocupación de mesas
   */
  obtenerEstadisticasMesas: (eventoId: number): Promise<AxiosResponse<ApiResponse<{ total_mesas: number; total_asignados: number; total_sin_asignar: number }>>> =>
    apiClient.get(`/eventos-digitales/eventos/${eventoId}/mesas/estadisticas`),

  // ========== Galería Compartida ==========

  /**
   * Subir foto a la galería (admin/organizador)
   */
  subirFoto: (eventoId: number, data: SubirFotoRequest): Promise<FotoResponse> =>
    apiClient.post(`/eventos-digitales/eventos/${eventoId}/galeria`, data),

  /**
   * Listar fotos de la galería
   */
  listarFotos: (eventoId: number, params: ListarFotosParams = {}): Promise<FotosListResponse> =>
    apiClient.get(`/eventos-digitales/eventos/${eventoId}/galeria`, { params }),

  /**
   * Obtener foto por ID
   */
  obtenerFoto: (fotoId: number): Promise<FotoResponse> =>
    apiClient.get(`/eventos-digitales/galeria/${fotoId}`),

  /**
   * Cambiar estado de foto (visible/oculta)
   */
  cambiarEstadoFoto: (fotoId: number, estado: EstadoFoto): Promise<FotoResponse> =>
    apiClient.put(`/eventos-digitales/galeria/${fotoId}/estado`, { estado }),

  /**
   * Eliminar foto (soft delete)
   */
  eliminarFoto: (fotoId: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/eventos-digitales/galeria/${fotoId}`),

  /**
   * Eliminar foto permanentemente
   */
  eliminarFotoPermanente: (fotoId: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/eventos-digitales/galeria/${fotoId}/permanente`),

  // ========== Rutas Públicas (RSVP) ==========

  /**
   * Obtener evento público por slug (sin auth)
   */
  obtenerEventoPublico: (slug: string): Promise<EventoResponse> =>
    publicApiClient.get(`/public/evento/${slug}`),

  /**
   * Obtener invitación personalizada (sin auth)
   */
  obtenerInvitacion: (slug: string, token: string): Promise<AxiosResponse<ApiResponse<{ evento: EventoDigital; invitado: Invitado }>>> =>
    publicApiClient.get(`/public/evento/${slug}/${token}`),

  /**
   * Confirmar RSVP (sin auth)
   */
  confirmarRSVP: (slug: string, token: string, data: ConfirmarRSVPRequest): Promise<InvitadoResponse> =>
    publicApiClient.post(`/public/evento/${slug}/${token}/rsvp`, data),

  /**
   * Obtener URL de WhatsApp para compartir (sin auth)
   */
  obtenerWhatsAppUrl: (slug: string, token: string): Promise<AxiosResponse<ApiResponse<WhatsAppLinkResponse>>> =>
    publicApiClient.get(`/public/evento/${slug}/${token}/whatsapp`),

  // ========== Felicitaciones Públicas ==========

  /**
   * Obtener felicitaciones aprobadas del evento (sin auth)
   */
  obtenerFelicitacionesPublicas: (slug: string, limite: number = 50): Promise<FelicitacionesListResponse> =>
    publicApiClient.get(`/public/evento/${slug}/felicitaciones`, { params: { limite } }),

  /**
   * Enviar felicitación como invitado (sin auth, requiere token)
   */
  enviarFelicitacionPublica: (slug: string, token: string, data: { mensaje: string }): Promise<FelicitacionResponse> =>
    publicApiClient.post(`/public/evento/${slug}/${token}/felicitacion`, data),

  // ========== Galería Pública ==========

  /**
   * Obtener galería pública del evento (sin auth)
   */
  obtenerGaleriaPublica: (slug: string, limit: number = 100): Promise<FotosListResponse> =>
    publicApiClient.get(`/public/evento/${slug}/galeria`, { params: { limit } }),

  /**
   * Subir foto como invitado (sin auth, requiere token)
   * Envía archivo como FormData
   */
  subirFotoPublica: (slug: string, token: string, file: File, caption: string = ''): Promise<FotoResponse> => {
    const formData = new FormData();
    formData.append('foto', file);
    if (caption) {
      formData.append('caption', caption);
    }
    // Para FormData, axios detecta automáticamente el Content-Type
    return publicApiClient.post(`/public/evento/${slug}/${token}/galeria`, formData);
  },

  /**
   * Reportar foto inapropiada (sin auth)
   */
  reportarFoto: (fotoId: number, motivo: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    publicApiClient.post(`/public/galeria/${fotoId}/reportar`, { motivo }),

  // ========== Bloques de Invitación ==========

  /**
   * Obtener bloques de invitación del evento
   */
  getBloques: (eventoId: number): Promise<BloquesResponse> =>
    apiClient.get(`/eventos-digitales/eventos/${eventoId}/bloques`),

  /**
   * Guardar todos los bloques de invitación
   */
  saveBloques: (eventoId: number, bloques: BloqueInvitacion[]): Promise<AxiosResponse<ApiResponse<{ bloques: BloqueInvitacion[] }>>> =>
    apiClient.put(`/eventos-digitales/eventos/${eventoId}/bloques`, { bloques }),

  /**
   * Actualizar un bloque específico
   */
  updateBloque: (eventoId: number, bloqueId: string, data: ActualizarBloqueRequest): Promise<BloqueResponse> =>
    apiClient.patch(`/eventos-digitales/eventos/${eventoId}/bloques/${bloqueId}`, data),

  /**
   * Agregar un nuevo bloque
   */
  addBloque: (eventoId: number, bloque: BloqueInvitacion): Promise<BloqueResponse> =>
    apiClient.post(`/eventos-digitales/eventos/${eventoId}/bloques`, bloque),

  /**
   * Eliminar un bloque
   */
  deleteBloque: (eventoId: number, bloqueId: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/eventos-digitales/eventos/${eventoId}/bloques/${bloqueId}`),

  /**
   * Reordenar bloques
   */
  reorderBloques: (eventoId: number, orden: string[]): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.patch(`/eventos-digitales/eventos/${eventoId}/bloques/reordenar`, { orden }),

  /**
   * Duplicar un bloque
   */
  duplicateBloque: (eventoId: number, bloqueId: string): Promise<BloqueResponse> =>
    apiClient.post(`/eventos-digitales/eventos/${eventoId}/bloques/${bloqueId}/duplicar`),

  // ========== Alias para compatibilidad ==========

  /**
   * Alias de obtenerEvento para compatibilidad con naming conventions
   */
  getById: (id: number): Promise<EventoResponse> =>
    apiClient.get(`/eventos-digitales/eventos/${id}`),
};
