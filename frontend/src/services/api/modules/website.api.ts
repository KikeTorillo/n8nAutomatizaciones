import { AxiosResponse } from 'axios';
import apiClient, { publicApiClient } from '../client';
import type {
  WebsiteConfig,
  WebsitePagina,
  WebsiteBloque,
  WebsiteTemplate,
  WebsiteVersion,
  AnalyticsResumen,
  AuditoriaSEO,
} from '@/types/entities/website';
import type { ApiResponse } from '@/types/entities/common';

// ========== Request Types ==========

interface CrearConfigRequest {
  slug: string;
  nombre_sitio?: string;
  descripcion_seo?: string;
  [key: string]: unknown;
}

interface CrearPaginaRequest {
  slug?: string;
  titulo: string;
  descripcion_seo?: string;
  orden?: number;
  visible_menu?: boolean;
  publicada?: boolean;
}

interface CrearBloqueRequest {
  pagina_id: string;
  tipo: string;
  contenido?: Record<string, unknown>;
  estilos?: Record<string, unknown>;
  orden?: number;
  visible?: boolean;
}

interface OrdenamientoItem {
  id: string;
  orden: number;
}

interface ContactoRequest {
  nombre: string;
  email: string;
  telefono?: string;
  mensaje?: string;
}

interface TemplateFilters {
  industria?: string;
  destacados?: boolean;
}

interface AplicarTemplateRequest {
  nombre_sitio?: string;
  slug?: string;
  descripcion?: string;
}

interface GenerarContenidoIARequest {
  tipo: string;
  campo: string;
  industria?: string;
  contexto?: string;
}

interface GenerarBloqueIARequest {
  tipo: string;
  industria?: string;
  contexto?: string;
}

interface GenerarSitioIARequest {
  nombre: string;
  descripcion: string;
  industria?: string;
  estilo?: string;
  aplicar?: boolean;
}

interface GenerarTextoTonRequest {
  campo: string;
  industria: string;
  tono: string;
  contexto?: string;
  longitud?: string;
}

interface GuardarTemplateRequest {
  nombre: string;
  descripcion?: string;
  industria?: string;
}

interface VersionesParams {
  limite?: number;
  offset?: number;
  tipo?: string;
}

interface AnalyticsParams {
  website_id?: string;
  evento_tipo?: string;
  limite?: number;
  offset?: number;
}

interface ResumenAnalyticsParams {
  dias?: number;
  website_id?: string;
}

interface PaginasPopularesParams {
  dias?: number;
  website_id?: string;
  limite?: number;
}

interface ServiciosERPParams {
  busqueda?: string;
  categoria?: string;
}

interface ProfesionalesERPParams {
  busqueda?: string;
  departamento_id?: number;
}

// ========== Response Types ==========

type ConfigResponse = AxiosResponse<ApiResponse<WebsiteConfig>>;
type PaginaResponse = AxiosResponse<ApiResponse<WebsitePagina>>;
type BloqueResponse = AxiosResponse<ApiResponse<WebsiteBloque>>;

// ========== API ==========

export const websiteApi = {
  // ========== Configuracion del Sitio ==========

  /** Crear configuracion del sitio */
  crearConfig: (data: CrearConfigRequest): Promise<ConfigResponse> =>
    apiClient.post('/website/config', data),

  /** Obtener configuracion del sitio */
  obtenerConfig: (): Promise<ConfigResponse> =>
    apiClient.get('/website/config'),

  /** Actualizar configuracion del sitio */
  actualizarConfig: (id: string, data: Partial<WebsiteConfig>): Promise<ConfigResponse> =>
    apiClient.put(`/website/config/${id}`, data),

  /** Publicar/despublicar sitio */
  publicarConfig: (id: string, publicar: boolean): Promise<ConfigResponse> =>
    apiClient.post(`/website/config/${id}/publicar`, { publicar }),

  /** Verificar disponibilidad de slug */
  verificarSlug: (slug: string, excludeId?: string): Promise<AxiosResponse> =>
    apiClient.get(`/website/config/slug/${slug}/disponible`, {
      params: excludeId ? { exclude: excludeId } : {}
    }),

  /** Eliminar sitio web */
  eliminarConfig: (id: string): Promise<AxiosResponse> =>
    apiClient.delete(`/website/config/${id}`),

  // ========== Paginas ==========

  /** Crear pagina */
  crearPagina: (data: CrearPaginaRequest): Promise<PaginaResponse> =>
    apiClient.post('/website/paginas', data),

  /** Listar paginas */
  listarPaginas: (): Promise<AxiosResponse<ApiResponse<WebsitePagina[]>>> =>
    apiClient.get('/website/paginas'),

  /** Obtener pagina por ID */
  obtenerPagina: (id: string): Promise<PaginaResponse> =>
    apiClient.get(`/website/paginas/${id}`),

  /** Actualizar pagina */
  actualizarPagina: (id: string, data: Partial<WebsitePagina>): Promise<PaginaResponse> =>
    apiClient.put(`/website/paginas/${id}`, data),

  /** Reordenar paginas */
  reordenarPaginas: (ordenamiento: OrdenamientoItem[]): Promise<AxiosResponse> =>
    apiClient.put('/website/paginas/orden', { ordenamiento }),

  /** Eliminar pagina */
  eliminarPagina: (id: string): Promise<AxiosResponse> =>
    apiClient.delete(`/website/paginas/${id}`),

  // ========== Bloques ==========

  /** Crear bloque */
  crearBloque: (data: CrearBloqueRequest): Promise<BloqueResponse> =>
    apiClient.post('/website/bloques', data),

  /** Listar bloques de una pagina */
  listarBloques: (paginaId: string): Promise<AxiosResponse<ApiResponse<WebsiteBloque[]>>> =>
    apiClient.get(`/website/paginas/${paginaId}/bloques`),

  /** Obtener bloque por ID */
  obtenerBloque: (id: string): Promise<BloqueResponse> =>
    apiClient.get(`/website/bloques/${id}`),

  /** Actualizar bloque */
  actualizarBloque: (id: string, data: Partial<WebsiteBloque>): Promise<BloqueResponse> =>
    apiClient.put(`/website/bloques/${id}`, data),

  /** Reordenar bloques de una pagina */
  reordenarBloques: (paginaId: string, ordenamiento: OrdenamientoItem[]): Promise<AxiosResponse> =>
    apiClient.put(`/website/paginas/${paginaId}/bloques/orden`, { ordenamiento }),

  /** Duplicar bloque */
  duplicarBloque: (id: string): Promise<BloqueResponse> =>
    apiClient.post(`/website/bloques/${id}/duplicar`),

  /** Eliminar bloque */
  eliminarBloque: (id: string): Promise<AxiosResponse> =>
    apiClient.delete(`/website/bloques/${id}`),

  /** Listar tipos de bloques disponibles */
  listarTiposBloques: (): Promise<AxiosResponse> =>
    apiClient.get('/website/bloques/tipos'),

  /** Obtener contenido default de un tipo de bloque */
  obtenerDefaultBloque: (tipo: string): Promise<AxiosResponse> =>
    apiClient.get(`/website/bloques/tipos/${tipo}/default`),

  /** Obtener servicios del ERP para el editor de bloques */
  obtenerServiciosERP: (params: ServiciosERPParams = {}): Promise<unknown> =>
    apiClient.get('/website/servicios-erp', { params })
      .then((res) => res.data?.data || res.data),

  /** Obtener profesionales del ERP para el editor de bloques (bloque equipo) */
  obtenerProfesionalesERP: (params: ProfesionalesERPParams = {}): Promise<unknown> =>
    apiClient.get('/website/profesionales-erp', { params })
      .then((res) => res.data?.data || res.data),

  // ========== Rutas Publicas (sin auth) ==========

  /** Obtener sitio publico por slug */
  obtenerSitioPublico: (slug: string): Promise<AxiosResponse> =>
    publicApiClient.get(`/public/sitio/${slug}`),

  /** Obtener pagina publica */
  obtenerPaginaPublica: (slug: string, pagina: string): Promise<AxiosResponse> =>
    publicApiClient.get(`/public/sitio/${slug}/${pagina}`),

  /** Enviar formulario de contacto */
  enviarContacto: (slug: string, data: ContactoRequest): Promise<AxiosResponse> =>
    publicApiClient.post(`/public/sitio/${slug}/contacto`, data),

  // ========== Templates ==========

  /** Listar templates disponibles */
  listarTemplates: (filtros: TemplateFilters = {}): Promise<WebsiteTemplate[]> =>
    apiClient.get('/website/templates', { params: filtros }).then((res) => res.data?.data || res.data || []),

  /** Listar industrias disponibles */
  listarIndustrias: (): Promise<string[]> =>
    apiClient.get('/website/templates/industrias').then((res) => res.data?.data || res.data || []),

  /** Obtener template por ID */
  obtenerTemplate: (id: string): Promise<WebsiteTemplate> =>
    apiClient.get(`/website/templates/${id}`).then((res) => res.data?.data || res.data),

  /** Obtener estructura de un template */
  obtenerEstructuraTemplate: (id: string): Promise<unknown> =>
    apiClient.get(`/website/templates/${id}/estructura`).then((res) => res.data?.data || res.data),

  /** Aplicar template */
  aplicarTemplate: (id: string, datos: AplicarTemplateRequest = {}): Promise<unknown> =>
    apiClient.post(`/website/templates/${id}/aplicar`, datos).then((res) => res.data?.data || res.data),

  /** Guardar sitio actual como template personalizado */
  guardarComoTemplate: (datos: GuardarTemplateRequest): Promise<WebsiteTemplate> =>
    apiClient.post('/website/templates', datos).then((res) => res.data?.data || res.data),

  /** Eliminar template personalizado */
  eliminarTemplate: (id: string): Promise<AxiosResponse> =>
    apiClient.delete(`/website/templates/${id}`),

  // ========== IA ==========

  /** Verificar disponibilidad del servicio de IA */
  obtenerStatusIA: (): Promise<unknown> =>
    apiClient.get('/website/ai/status').then((res) => res.data?.data || res.data),

  /** Generar contenido para un campo especifico */
  generarContenidoIA: (datos: GenerarContenidoIARequest): Promise<unknown> =>
    apiClient.post('/website/ai/generar', datos).then((res) => res.data?.data || res.data),

  /** Generar contenido completo para un bloque */
  generarBloqueIA: (datos: GenerarBloqueIARequest): Promise<unknown> =>
    apiClient.post('/website/ai/generar-bloque', datos).then((res) => res.data?.data || res.data),

  /** Generar sitio web completo con IA */
  generarSitioIA: (datos: GenerarSitioIARequest): Promise<unknown> =>
    apiClient.post('/website/ai/generar-sitio', datos, {
      timeout: 120000,
    }).then((res) => res.data?.data || res.data),

  /** Detectar industria desde descripcion */
  detectarIndustriaIA: (descripcion: string): Promise<unknown> =>
    apiClient.post('/website/ai/detectar-industria', { descripcion }).then((res) => res.data?.data || res.data),

  // ========== Preview ==========

  /** Generar token de preview */
  generarPreview: (id: string, duracionHoras: number = 1): Promise<unknown> =>
    apiClient.post(`/website/config/${id}/preview`, { duracion_horas: duracionHoras })
      .then((res) => res.data?.data || res.data),

  /** Obtener info de preview activo */
  obtenerPreviewInfo: (id: string): Promise<unknown> =>
    apiClient.get(`/website/config/${id}/preview`).then((res) => res.data?.data || res.data),

  /** Revocar token de preview */
  revocarPreview: (id: string): Promise<unknown> =>
    apiClient.delete(`/website/config/${id}/preview`).then((res) => res.data?.data || res.data),

  /** Obtener sitio via preview token (publico) */
  obtenerSitioPreview: (token: string): Promise<unknown> =>
    publicApiClient.get(`/public/preview/${token}`).then((res) => res.data?.data || res.data),

  // ========== Versiones (Historial/Rollback) ==========

  /** Listar versiones del sitio */
  listarVersiones: (params: VersionesParams = {}): Promise<WebsiteVersion[]> =>
    apiClient.get('/website/versiones', { params }).then((res) => res.data?.data || res.data),

  /** Obtener version por ID */
  obtenerVersion: (id: string): Promise<WebsiteVersion> =>
    apiClient.get(`/website/versiones/${id}`).then((res) => res.data?.data || res.data),

  /** Crear version manual (snapshot) */
  crearVersion: (datos: { nombre?: string; descripcion?: string } = {}): Promise<WebsiteVersion> =>
    apiClient.post('/website/versiones', datos).then((res) => res.data?.data || res.data),

  /** Restaurar sitio a una version */
  restaurarVersion: (id: string, crearBackup: boolean = true): Promise<unknown> =>
    apiClient.post(`/website/versiones/${id}/restaurar`, { crear_backup: crearBackup })
      .then((res) => res.data?.data || res.data),

  /** Eliminar version */
  eliminarVersion: (id: string): Promise<unknown> =>
    apiClient.delete(`/website/versiones/${id}`).then((res) => res.data?.data || res.data),

  /** Obtener preview de una version */
  obtenerPreviewVersion: (id: string): Promise<unknown> =>
    apiClient.get(`/website/versiones/${id}/preview`).then((res) => res.data?.data || res.data),

  // ========== Analytics ==========

  /** Registrar evento de analytics (publico) */
  registrarEvento: async (slug: string, datos: Record<string, unknown>): Promise<void> => {
    await publicApiClient.post(`/public/sitio/${slug}/track`, datos).catch(() => {});
  },

  /** Listar eventos de analytics recientes */
  listarEventos: (params: AnalyticsParams = {}): Promise<unknown[]> =>
    apiClient.get('/website/analytics', { params }).then((res) => res.data?.data || res.data || []),

  /** Obtener resumen de metricas */
  obtenerResumenAnalytics: (params: ResumenAnalyticsParams = {}): Promise<AnalyticsResumen> =>
    apiClient.get('/website/analytics/resumen', { params }).then((res) => res.data?.data || res.data),

  /** Obtener paginas mas populares */
  obtenerPaginasPopulares: (params: PaginasPopularesParams = {}): Promise<unknown[]> =>
    apiClient.get('/website/analytics/paginas', { params }).then((res) => res.data?.data || res.data || []),

  /** Obtener metricas en tiempo real */
  obtenerTiempoReal: (websiteId?: string): Promise<unknown> =>
    apiClient.get('/website/analytics/tiempo-real', { params: websiteId ? { website_id: websiteId } : {} })
      .then((res) => res.data?.data || res.data),

  // ========== SEO ==========

  /** Obtener auditoria SEO */
  obtenerAuditoriaSEO: (websiteId?: string): Promise<AuditoriaSEO> =>
    apiClient.get('/website/seo/auditoria', { params: websiteId ? { website_id: websiteId } : {} })
      .then((res) => res.data?.data || res.data),

  /** Obtener preview de Google SERP */
  obtenerPreviewGoogle: (websiteId: string): Promise<unknown> =>
    apiClient.get('/website/seo/preview-google', { params: { website_id: websiteId } })
      .then((res) => res.data?.data || res.data),

  /** Obtener schema markup */
  obtenerSchemaSEO: (websiteId: string, tipo: string = 'LocalBusiness'): Promise<unknown> =>
    apiClient.get('/website/seo/schema', { params: { website_id: websiteId, tipo } })
      .then((res) => res.data?.data || res.data),

  // ========== IA - Generacion con Tonos ==========

  /** Generar texto con tono personalizado */
  generarTextoConTono: (datos: GenerarTextoTonRequest): Promise<unknown> =>
    apiClient.post('/website/ai/generar-texto', datos)
      .then((res) => res.data?.data || res.data),
};

export default websiteApi;
