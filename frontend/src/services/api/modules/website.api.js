import apiClient, { publicApiClient } from '../client';
/**
 * API de Website
 */
export const websiteApi = {
  // ========== Configuración del Sitio ==========

  /**
   * Crear configuración del sitio
   * @param {Object} data - { slug, nombre_sitio?, descripcion_seo?, ... }
   * @returns {Promise<Object>}
   */
  crearConfig: (data) => apiClient.post('/website/config', data),

  /**
   * Obtener configuración del sitio
   * @returns {Promise<Object>}
   */
  obtenerConfig: () => apiClient.get('/website/config'),

  /**
   * Actualizar configuración del sitio
   * @param {string} id - UUID
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarConfig: (id, data) => apiClient.put(`/website/config/${id}`, data),

  /**
   * Publicar/despublicar sitio
   * @param {string} id - UUID
   * @param {boolean} publicar
   * @returns {Promise<Object>}
   */
  publicarConfig: (id, publicar) => apiClient.post(`/website/config/${id}/publicar`, { publicar }),

  /**
   * Verificar disponibilidad de slug
   * @param {string} slug
   * @param {string} excludeId - UUID opcional para excluir
   * @returns {Promise<Object>}
   */
  verificarSlug: (slug, excludeId) => apiClient.get(`/website/config/slug/${slug}/disponible`, {
    params: excludeId ? { exclude: excludeId } : {}
  }),

  /**
   * Eliminar sitio web
   * @param {string} id - UUID
   * @returns {Promise<Object>}
   */
  eliminarConfig: (id) => apiClient.delete(`/website/config/${id}`),

  // ========== Páginas ==========

  /**
   * Crear página
   * @param {Object} data - { slug?, titulo, descripcion_seo?, orden?, visible_menu?, publicada? }
   * @returns {Promise<Object>}
   */
  crearPagina: (data) => apiClient.post('/website/paginas', data),

  /**
   * Listar páginas
   * @returns {Promise<Object>}
   */
  listarPaginas: () => apiClient.get('/website/paginas'),

  /**
   * Obtener página por ID
   * @param {string} id - UUID
   * @returns {Promise<Object>}
   */
  obtenerPagina: (id) => apiClient.get(`/website/paginas/${id}`),

  /**
   * Actualizar página
   * @param {string} id - UUID
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarPagina: (id, data) => apiClient.put(`/website/paginas/${id}`, data),

  /**
   * Reordenar páginas
   * @param {Array} ordenamiento - [{ id, orden }, ...]
   * @returns {Promise<Object>}
   */
  reordenarPaginas: (ordenamiento) => apiClient.put('/website/paginas/orden', { ordenamiento }),

  /**
   * Eliminar página
   * @param {string} id - UUID
   * @returns {Promise<Object>}
   */
  eliminarPagina: (id) => apiClient.delete(`/website/paginas/${id}`),

  // ========== Bloques ==========

  /**
   * Crear bloque
   * @param {Object} data - { pagina_id, tipo, contenido?, estilos?, orden?, visible? }
   * @returns {Promise<Object>}
   */
  crearBloque: (data) => apiClient.post('/website/bloques', data),

  /**
   * Listar bloques de una página
   * @param {string} paginaId - UUID
   * @returns {Promise<Object>}
   */
  listarBloques: (paginaId) => apiClient.get(`/website/paginas/${paginaId}/bloques`),

  /**
   * Obtener bloque por ID
   * @param {string} id - UUID
   * @returns {Promise<Object>}
   */
  obtenerBloque: (id) => apiClient.get(`/website/bloques/${id}`),

  /**
   * Actualizar bloque
   * @param {string} id - UUID
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarBloque: (id, data) => apiClient.put(`/website/bloques/${id}`, data),

  /**
   * Reordenar bloques de una página
   * @param {string} paginaId - UUID
   * @param {Array} ordenamiento - [{ id, orden }, ...]
   * @returns {Promise<Object>}
   */
  reordenarBloques: (paginaId, ordenamiento) =>
    apiClient.put(`/website/paginas/${paginaId}/bloques/orden`, { ordenamiento }),

  /**
   * Duplicar bloque
   * @param {string} id - UUID
   * @returns {Promise<Object>}
   */
  duplicarBloque: (id) => apiClient.post(`/website/bloques/${id}/duplicar`),

  /**
   * Eliminar bloque
   * @param {string} id - UUID
   * @returns {Promise<Object>}
   */
  eliminarBloque: (id) => apiClient.delete(`/website/bloques/${id}`),

  /**
   * Listar tipos de bloques disponibles
   * @returns {Promise<Object>}
   */
  listarTiposBloques: () => apiClient.get('/website/bloques/tipos'),

  /**
   * Obtener contenido default de un tipo de bloque
   * @param {string} tipo - hero, servicios, testimonios, etc.
   * @returns {Promise<Object>}
   */
  obtenerDefaultBloque: (tipo) => apiClient.get(`/website/bloques/tipos/${tipo}/default`),

  // ========== Rutas Públicas (sin auth) ==========

  /**
   * Obtener sitio público por slug
   * @param {string} slug
   * @returns {Promise<Object>}
   */
  obtenerSitioPublico: (slug) =>
    publicApiClient.get(`/public/sitio/${slug}`),

  /**
   * Obtener página pública
   * @param {string} slug - Slug del sitio
   * @param {string} pagina - Slug de la página
   * @returns {Promise<Object>}
   */
  obtenerPaginaPublica: (slug, pagina) =>
    publicApiClient.get(`/public/sitio/${slug}/${pagina}`),

  /**
   * Enviar formulario de contacto
   * @param {string} slug
   * @param {Object} data - { nombre, email, telefono?, mensaje? }
   * @returns {Promise<Object>}
   */
  enviarContacto: (slug, data) =>
    publicApiClient.post(`/public/sitio/${slug}/contacto`, data),

  // ========== Templates ==========

  /**
   * Listar templates disponibles
   * @param {Object} filtros - { industria?, destacados? }
   * @returns {Promise<Array>}
   */
  listarTemplates: (filtros = {}) =>
    apiClient.get('/website/templates', { params: filtros }).then((res) => res.data?.data || res.data || []),

  /**
   * Listar industrias disponibles
   * @returns {Promise<Array>}
   */
  listarIndustrias: () =>
    apiClient.get('/website/templates/industrias').then((res) => res.data?.data || res.data || []),

  /**
   * Obtener template por ID
   * @param {string} id - UUID
   * @returns {Promise<Object>}
   */
  obtenerTemplate: (id) =>
    apiClient.get(`/website/templates/${id}`).then((res) => res.data?.data || res.data),

  /**
   * Obtener estructura de un template
   * @param {string} id - UUID
   * @returns {Promise<Object>}
   */
  obtenerEstructuraTemplate: (id) =>
    apiClient.get(`/website/templates/${id}/estructura`).then((res) => res.data?.data || res.data),

  /**
   * Aplicar template
   * @param {string} id - UUID del template
   * @param {Object} datos - { nombre_sitio?, slug?, descripcion? }
   * @returns {Promise<Object>}
   */
  aplicarTemplate: (id, datos = {}) =>
    apiClient.post(`/website/templates/${id}/aplicar`, datos).then((res) => res.data?.data || res.data),

  /**
   * Guardar sitio actual como template personalizado
   * @param {Object} datos - { nombre, descripcion?, industria? }
   * @returns {Promise<Object>}
   */
  guardarComoTemplate: (datos) =>
    apiClient.post('/website/templates', datos).then((res) => res.data?.data || res.data),

  /**
   * Eliminar template personalizado
   * @param {string} id - UUID
   * @returns {Promise<Object>}
   */
  eliminarTemplate: (id) =>
    apiClient.delete(`/website/templates/${id}`),

  // ========== IA ==========

  /**
   * Verificar disponibilidad del servicio de IA
   * @returns {Promise<Object>}
   */
  obtenerStatusIA: () =>
    apiClient.get('/website/ai/status').then((res) => res.data?.data || res.data),

  /**
   * Generar contenido para un campo específico
   * @param {Object} datos - { tipo, campo, industria?, contexto? }
   * @returns {Promise<Object>}
   */
  generarContenidoIA: (datos) =>
    apiClient.post('/website/ai/generar', datos).then((res) => res.data?.data || res.data),

  /**
   * Generar contenido completo para un bloque
   * @param {Object} datos - { tipo, industria?, contexto? }
   * @returns {Promise<Object>}
   */
  generarBloqueIA: (datos) =>
    apiClient.post('/website/ai/generar-bloque', datos).then((res) => res.data?.data || res.data),

  /**
   * Generar sitio web completo con IA
   * @param {Object} datos - { nombre, descripcion, industria?, estilo?, aplicar? }
   * @returns {Promise<Object>}
   */
  generarSitioIA: (datos) =>
    apiClient.post('/website/ai/generar-sitio', datos, {
      timeout: 120000, // 2 minutos para generación con IA
    }).then((res) => res.data?.data || res.data),

  /**
   * Detectar industria desde descripcion
   * @param {string} descripcion
   * @returns {Promise<Object>}
   */
  detectarIndustriaIA: (descripcion) =>
    apiClient.post('/website/ai/detectar-industria', { descripcion }).then((res) => res.data?.data || res.data),

  // ========== Preview ==========

  /**
   * Generar token de preview
   * @param {string} id - UUID del sitio
   * @param {number} duracionHoras - Duracion en horas (default 1)
   * @returns {Promise<Object>}
   */
  generarPreview: (id, duracionHoras = 1) =>
    apiClient.post(`/website/config/${id}/preview`, { duracion_horas: duracionHoras })
      .then((res) => res.data?.data || res.data),

  /**
   * Obtener info de preview activo
   * @param {string} id - UUID del sitio
   * @returns {Promise<Object>}
   */
  obtenerPreviewInfo: (id) =>
    apiClient.get(`/website/config/${id}/preview`).then((res) => res.data?.data || res.data),

  /**
   * Revocar token de preview
   * @param {string} id - UUID del sitio
   * @returns {Promise<Object>}
   */
  revocarPreview: (id) =>
    apiClient.delete(`/website/config/${id}/preview`).then((res) => res.data?.data || res.data),

  /**
   * Obtener sitio via preview token (publico)
   * @param {string} token - Token de preview
   * @returns {Promise<Object>}
   */
  obtenerSitioPreview: (token) =>
    publicApiClient.get(`/public/preview/${token}`).then((res) => res.data?.data || res.data),

  // ========== Versiones (Historial/Rollback) ==========

  /**
   * Listar versiones del sitio
   * @param {Object} params - { limite?, offset?, tipo? }
   * @returns {Promise<Object>}
   */
  listarVersiones: (params = {}) =>
    apiClient.get('/website/versiones', { params }).then((res) => res.data?.data || res.data),

  /**
   * Obtener version por ID
   * @param {string} id - UUID de la version
   * @returns {Promise<Object>}
   */
  obtenerVersion: (id) =>
    apiClient.get(`/website/versiones/${id}`).then((res) => res.data?.data || res.data),

  /**
   * Crear version manual (snapshot)
   * @param {Object} datos - { nombre?, descripcion? }
   * @returns {Promise<Object>}
   */
  crearVersion: (datos = {}) =>
    apiClient.post('/website/versiones', datos).then((res) => res.data?.data || res.data),

  /**
   * Restaurar sitio a una version
   * @param {string} id - UUID de la version
   * @param {boolean} crearBackup - Si crear backup antes
   * @returns {Promise<Object>}
   */
  restaurarVersion: (id, crearBackup = true) =>
    apiClient.post(`/website/versiones/${id}/restaurar`, { crear_backup: crearBackup })
      .then((res) => res.data?.data || res.data),

  /**
   * Eliminar version
   * @param {string} id - UUID de la version
   * @returns {Promise<Object>}
   */
  eliminarVersion: (id) =>
    apiClient.delete(`/website/versiones/${id}`).then((res) => res.data?.data || res.data),

  /**
   * Obtener preview de una version
   * @param {string} id - UUID de la version
   * @returns {Promise<Object>}
   */
  obtenerPreviewVersion: (id) =>
    apiClient.get(`/website/versiones/${id}/preview`).then((res) => res.data?.data || res.data),

  // ========== Analytics ==========

  /**
   * Registrar evento de analytics (publico)
   * @param {string} slug - Slug del sitio
   * @param {Object} datos - { evento_tipo, pagina_slug?, bloque_id?, fuente?, datos_extra? }
   * @returns {Promise<void>}
   */
  registrarEvento: (slug, datos) =>
    publicApiClient.post(`/public/sitio/${slug}/track`, datos).catch(() => {}), // Fire-and-forget

  /**
   * Listar eventos de analytics recientes
   * @param {Object} params - { website_id?, evento_tipo?, limite?, offset? }
   * @returns {Promise<Array>}
   */
  listarEventos: (params = {}) =>
    apiClient.get('/website/analytics', { params }).then((res) => res.data?.data || res.data || []),

  /**
   * Obtener resumen de metricas
   * @param {Object} params - { dias?, website_id? }
   * @returns {Promise<Object>}
   */
  obtenerResumenAnalytics: (params = {}) =>
    apiClient.get('/website/analytics/resumen', { params }).then((res) => res.data?.data || res.data),

  /**
   * Obtener paginas mas populares
   * @param {Object} params - { dias?, website_id?, limite? }
   * @returns {Promise<Array>}
   */
  obtenerPaginasPopulares: (params = {}) =>
    apiClient.get('/website/analytics/paginas', { params }).then((res) => res.data?.data || res.data || []),

  /**
   * Obtener metricas en tiempo real
   * @param {string} websiteId - UUID opcional
   * @returns {Promise<Object>}
   */
  obtenerTiempoReal: (websiteId) =>
    apiClient.get('/website/analytics/tiempo-real', { params: websiteId ? { website_id: websiteId } : {} })
      .then((res) => res.data?.data || res.data),

  // ========== SEO ==========

  /**
   * Obtener auditoria SEO
   * @param {string} websiteId - UUID opcional
   * @returns {Promise<Object>}
   */
  obtenerAuditoriaSEO: (websiteId) =>
    apiClient.get('/website/seo/auditoria', { params: websiteId ? { website_id: websiteId } : {} })
      .then((res) => res.data?.data || res.data),

  /**
   * Obtener preview de Google SERP
   * @param {string} websiteId - UUID del sitio
   * @returns {Promise<Object>}
   */
  obtenerPreviewGoogle: (websiteId) =>
    apiClient.get('/website/seo/preview-google', { params: { website_id: websiteId } })
      .then((res) => res.data?.data || res.data),

  /**
   * Obtener schema markup
   * @param {string} websiteId - UUID del sitio
   * @param {string} tipo - Tipo de schema (LocalBusiness, Organization)
   * @returns {Promise<Object>}
   */
  obtenerSchemaSEO: (websiteId, tipo = 'LocalBusiness') =>
    apiClient.get('/website/seo/schema', { params: { website_id: websiteId, tipo } })
      .then((res) => res.data?.data || res.data),
};

export default websiteApi;

// ==================== CONTABILIDAD ====================
