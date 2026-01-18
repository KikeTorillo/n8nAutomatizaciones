import axios from 'axios';
import apiClient from '../client';

/**
 * API de Eventos Digitales
 * Invitaciones, galerías, mesas, plantillas
 */
export const eventosDigitalesApi = {
  // ========== Eventos ==========

  /**
   * Crear evento digital
   * @param {Object} data - { nombre, tipo, descripcion?, fecha_evento, hora_evento?, fecha_limite_rsvp?, plantilla_id?, configuracion? }
   * @returns {Promise<Object>}
   */
  crearEvento: (data) => apiClient.post('/eventos-digitales/eventos', data),

  /**
   * Listar eventos de la organización
   * @param {Object} params - { estado?, tipo?, busqueda?, pagina?, limite? }
   * @returns {Promise<Object>} { eventos, total, paginacion }
   */
  listarEventos: (params = {}) => apiClient.get('/eventos-digitales/eventos', { params }),

  /**
   * Obtener evento por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerEvento: (id) => apiClient.get(`/eventos-digitales/eventos/${id}`),

  /**
   * Actualizar evento
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarEvento: (id, data) => apiClient.put(`/eventos-digitales/eventos/${id}`, data),

  /**
   * Eliminar evento
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarEvento: (id) => apiClient.delete(`/eventos-digitales/eventos/${id}`),

  /**
   * Publicar evento
   * @param {number} id
   * @returns {Promise<Object>}
   */
  publicarEvento: (id) => apiClient.post(`/eventos-digitales/eventos/${id}/publicar`),

  /**
   * Obtener estadísticas RSVP del evento
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerEstadisticasEvento: (id) => apiClient.get(`/eventos-digitales/eventos/${id}/estadisticas`),

  // ========== Invitados ==========

  /**
   * Crear invitado
   * @param {number} eventoId
   * @param {Object} data - { nombre, email?, telefono?, grupo_familiar?, max_acompanantes?, etiquetas? }
   * @returns {Promise<Object>}
   */
  crearInvitado: (eventoId, data) => apiClient.post(`/eventos-digitales/eventos/${eventoId}/invitados`, data),

  /**
   * Listar invitados del evento
   * @param {number} eventoId
   * @param {Object} params - { estado_rsvp?, busqueda?, pagina?, limite? }
   * @returns {Promise<Object>}
   */
  listarInvitados: (eventoId, params = {}) => apiClient.get(`/eventos-digitales/eventos/${eventoId}/invitados`, { params }),

  /**
   * Actualizar invitado
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarInvitado: (id, data) => apiClient.put(`/eventos-digitales/invitados/${id}`, data),

  /**
   * Eliminar invitado
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarInvitado: (id) => apiClient.delete(`/eventos-digitales/invitados/${id}`),

  /**
   * Importar invitados desde CSV
   * @param {number} eventoId
   * @param {FormData} formData - archivo CSV
   * @returns {Promise<Object>}
   */
  importarInvitados: (eventoId, formData) => apiClient.post(`/eventos-digitales/eventos/${eventoId}/invitados/importar`, formData),

  /**
   * Exportar invitados a CSV
   * @param {number} eventoId
   * @returns {Promise<Blob>}
   */
  exportarInvitados: (eventoId) => apiClient.get(`/eventos-digitales/eventos/${eventoId}/invitados/exportar`, { responseType: 'blob' }),

  /**
   * Obtener link de WhatsApp para invitado
   * @param {number} id - ID del invitado
   * @returns {Promise<Object>} { whatsapp_url, mensaje }
   */
  obtenerWhatsAppLink: (id) => apiClient.get(`/eventos-digitales/invitados/${id}/whatsapp`),

  // ========== Check-In ==========

  /**
   * Obtener estadísticas de check-in del evento
   * @param {number} eventoId
   * @returns {Promise<Object>} { total_invitados, total_confirmados, total_checkin, porcentaje }
   */
  obtenerCheckinStats: (eventoId) => apiClient.get(`/eventos-digitales/eventos/${eventoId}/checkin/stats`),

  /**
   * Listar check-ins recientes del evento
   * @param {number} eventoId
   * @param {Object} params - { limit?, offset? }
   * @returns {Promise<Object>} { checkins[] }
   */
  listarCheckinsRecientes: (eventoId, params = {}) => apiClient.get(`/eventos-digitales/eventos/${eventoId}/checkin/lista`, { params }),

  /**
   * Registrar check-in de invitado
   * @param {number} eventoId
   * @param {Object} data - { token, num_acompanantes? }
   * @returns {Promise<Object>}
   */
  registrarCheckin: (eventoId, data) => apiClient.post(`/eventos-digitales/eventos/${eventoId}/checkin`, data),

  // ========== QR Invitados ==========

  /**
   * Obtener QR de un invitado
   * @param {number} eventoId
   * @param {number} invitadoId
   * @param {string} formato - 'base64' | 'png' | 'svg'
   * @returns {Promise<Object>} { qr_code, url_invitacion }
   */
  obtenerQRInvitado: (eventoId, invitadoId, formato = 'base64') =>
    apiClient.get(`/eventos-digitales/eventos/${eventoId}/invitados/${invitadoId}/qr`, { params: { formato } }),

  /**
   * Descargar QRs de todos los invitados en ZIP
   * @param {number} eventoId
   * @returns {Promise<Blob>}
   */
  descargarQRMasivo: (eventoId) =>
    apiClient.get(`/eventos-digitales/eventos/${eventoId}/qr-masivo`, { responseType: 'blob' }),

  /**
   * Obtener QR público de invitado (sin auth)
   * @param {string} slug
   * @param {string} token
   * @param {string} formato - 'base64' | 'png' | 'svg'
   * @returns {Promise<Object>}
   */
  obtenerQRPublico: (slug, token, formato = 'base64') => {
    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' }
    });
    return publicAxios.get(`/public/evento/${slug}/${token}/qr`, { params: { formato } });
  },

  // ========== Ubicaciones ==========

  /**
   * Crear ubicación
   * @param {number} eventoId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crearUbicacion: (eventoId, data) => apiClient.post(`/eventos-digitales/eventos/${eventoId}/ubicaciones`, data),

  /**
   * Listar ubicaciones del evento
   * @param {number} eventoId
   * @returns {Promise<Object>}
   */
  listarUbicaciones: (eventoId) => apiClient.get(`/eventos-digitales/eventos/${eventoId}/ubicaciones`),

  /**
   * Actualizar ubicación
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarUbicacion: (id, data) => apiClient.put(`/eventos-digitales/ubicaciones/${id}`, data),

  /**
   * Eliminar ubicación
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarUbicacion: (id) => apiClient.delete(`/eventos-digitales/ubicaciones/${id}`),

  // ========== Mesa de Regalos ==========

  /**
   * Crear regalo
   * @param {number} eventoId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crearRegalo: (eventoId, data) => apiClient.post(`/eventos-digitales/eventos/${eventoId}/mesa-regalos`, data),

  /**
   * Listar regalos del evento
   * @param {number} eventoId
   * @param {Object} params - { disponibles? }
   * @returns {Promise<Object>}
   */
  listarRegalos: (eventoId, params = {}) => apiClient.get(`/eventos-digitales/eventos/${eventoId}/mesa-regalos`, { params }),

  /**
   * Actualizar regalo
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarRegalo: (id, data) => apiClient.put(`/eventos-digitales/mesa-regalos/${id}`, data),

  /**
   * Marcar regalo como comprado
   * @param {number} id
   * @param {Object} data - { comprado_por }
   * @returns {Promise<Object>}
   */
  marcarRegaloComprado: (id, data) => apiClient.put(`/eventos-digitales/mesa-regalos/${id}/comprar`, data),

  /**
   * Eliminar regalo
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarRegalo: (id) => apiClient.delete(`/eventos-digitales/mesa-regalos/${id}`),

  // ========== Felicitaciones ==========

  /**
   * Crear felicitación
   * @param {number} eventoId
   * @param {Object} data - { nombre_autor, mensaje, invitado_id? }
   * @returns {Promise<Object>}
   */
  crearFelicitacion: (eventoId, data) => apiClient.post(`/eventos-digitales/eventos/${eventoId}/felicitaciones`, data),

  /**
   * Listar felicitaciones del evento
   * @param {number} eventoId
   * @param {Object} params - { aprobadas?, limit?, offset? }
   * @returns {Promise<Object>}
   */
  listarFelicitaciones: (eventoId, params = {}) => apiClient.get(`/eventos-digitales/eventos/${eventoId}/felicitaciones`, { params }),

  /**
   * Aprobar felicitación
   * @param {number} id
   * @returns {Promise<Object>}
   */
  aprobarFelicitacion: (id) => apiClient.put(`/eventos-digitales/felicitaciones/${id}/aprobar`),

  /**
   * Rechazar felicitación
   * @param {number} id
   * @returns {Promise<Object>}
   */
  rechazarFelicitacion: (id) => apiClient.put(`/eventos-digitales/felicitaciones/${id}/rechazar`),

  /**
   * Eliminar felicitación
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarFelicitacion: (id) => apiClient.delete(`/eventos-digitales/felicitaciones/${id}`),

  // ========== Plantillas ==========

  /**
   * Listar plantillas disponibles
   * @param {Object} params - { tipo_evento?, es_premium? }
   * @returns {Promise<Object>}
   */
  listarPlantillas: (params = {}) => apiClient.get('/eventos-digitales/plantillas', { params }),

  /**
   * Obtener plantilla por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerPlantilla: (id) => apiClient.get(`/eventos-digitales/plantillas/${id}`),

  /**
   * Listar plantillas por tipo de evento
   * @param {string} tipoEvento - boda, xv_anos, bautizo, cumpleanos, corporativo, otro
   * @returns {Promise<Object>}
   */
  listarPlantillasPorTipo: (tipoEvento) => apiClient.get(`/eventos-digitales/plantillas/tipo/${tipoEvento}`),

  /**
   * Crear plantilla (solo super_admin)
   * @param {Object} data - { nombre, codigo, tipo_evento, estructura_html, estilos_css, es_premium?, preview_url? }
   * @returns {Promise<Object>}
   */
  crearPlantilla: (data) => apiClient.post('/eventos-digitales/plantillas', data),

  /**
   * Actualizar plantilla (solo super_admin)
   * @param {number} id - ID de la plantilla
   * @param {Object} data - campos a actualizar
   * @returns {Promise<Object>}
   */
  actualizarPlantilla: (id, data) => apiClient.put(`/eventos-digitales/plantillas/${id}`, data),

  /**
   * Eliminar plantilla (solo super_admin)
   * @param {number} id - ID de la plantilla
   * @returns {Promise<Object>}
   */
  eliminarPlantilla: (id) => apiClient.delete(`/eventos-digitales/plantillas/${id}`),

  // ========== Mesas (Seating Chart) ==========

  /**
   * Crear mesa
   * @param {number} eventoId
   * @param {Object} data - { nombre, numero?, tipo?, posicion_x?, posicion_y?, rotacion?, capacidad? }
   * @returns {Promise<Object>}
   */
  crearMesa: (eventoId, data) => apiClient.post(`/eventos-digitales/eventos/${eventoId}/mesas`, data),

  /**
   * Listar mesas del evento con invitados asignados
   * @param {number} eventoId
   * @returns {Promise<Object>}
   */
  listarMesas: (eventoId) => apiClient.get(`/eventos-digitales/eventos/${eventoId}/mesas`),

  /**
   * Obtener mesa por ID
   * @param {number} mesaId
   * @returns {Promise<Object>}
   */
  obtenerMesa: (mesaId) => apiClient.get(`/eventos-digitales/mesas/${mesaId}`),

  /**
   * Actualizar mesa
   * @param {number} eventoId
   * @param {number} mesaId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarMesa: (eventoId, mesaId, data) => apiClient.put(`/eventos-digitales/eventos/${eventoId}/mesas/${mesaId}`, data),

  /**
   * Eliminar mesa
   * @param {number} mesaId
   * @returns {Promise<Object>}
   */
  eliminarMesa: (mesaId) => apiClient.delete(`/eventos-digitales/mesas/${mesaId}`),

  /**
   * Actualizar posiciones de múltiples mesas (batch)
   * @param {number} eventoId
   * @param {Array} posiciones - [{ id, posicion_x, posicion_y, rotacion? }]
   * @returns {Promise<Object>}
   */
  actualizarPosicionesMesas: (eventoId, posiciones) => apiClient.patch(`/eventos-digitales/eventos/${eventoId}/mesas/posiciones`, { posiciones }),

  /**
   * Asignar invitado a mesa
   * @param {number} eventoId
   * @param {number} mesaId
   * @param {number} invitadoId
   * @returns {Promise<Object>}
   */
  asignarInvitadoAMesa: (eventoId, mesaId, invitadoId) => apiClient.post(`/eventos-digitales/eventos/${eventoId}/mesas/${mesaId}/asignar`, { invitado_id: invitadoId }),

  /**
   * Desasignar invitado de mesa
   * @param {number} invitadoId
   * @returns {Promise<Object>}
   */
  desasignarInvitado: (invitadoId) => apiClient.delete(`/eventos-digitales/invitados/${invitadoId}/mesa`),

  /**
   * Obtener estadísticas de ocupación de mesas
   * @param {number} eventoId
   * @returns {Promise<Object>}
   */
  obtenerEstadisticasMesas: (eventoId) => apiClient.get(`/eventos-digitales/eventos/${eventoId}/mesas/estadisticas`),

  // ========== Galería Compartida ==========

  /**
   * Subir foto a la galería (admin/organizador)
   * @param {number} eventoId
   * @param {Object} data - { url, thumbnail_url?, caption?, tamanio_bytes?, tipo_mime? }
   * @returns {Promise<Object>}
   */
  subirFoto: (eventoId, data) => apiClient.post(`/eventos-digitales/eventos/${eventoId}/galeria`, data),

  /**
   * Listar fotos de la galería
   * @param {number} eventoId
   * @param {Object} params - { estado?, limit?, offset? }
   * @returns {Promise<Object>}
   */
  listarFotos: (eventoId, params = {}) => apiClient.get(`/eventos-digitales/eventos/${eventoId}/galeria`, { params }),

  /**
   * Obtener foto por ID
   * @param {number} fotoId
   * @returns {Promise<Object>}
   */
  obtenerFoto: (fotoId) => apiClient.get(`/eventos-digitales/galeria/${fotoId}`),

  /**
   * Cambiar estado de foto (visible/oculta)
   * @param {number} fotoId
   * @param {string} estado - 'visible' | 'oculta'
   * @returns {Promise<Object>}
   */
  cambiarEstadoFoto: (fotoId, estado) => apiClient.put(`/eventos-digitales/galeria/${fotoId}/estado`, { estado }),

  /**
   * Eliminar foto (soft delete)
   * @param {number} fotoId
   * @returns {Promise<Object>}
   */
  eliminarFoto: (fotoId) => apiClient.delete(`/eventos-digitales/galeria/${fotoId}`),

  /**
   * Eliminar foto permanentemente
   * @param {number} fotoId
   * @returns {Promise<Object>}
   */
  eliminarFotoPermanente: (fotoId) => apiClient.delete(`/eventos-digitales/galeria/${fotoId}/permanente`),

  // ========== Rutas Públicas (RSVP) ==========

  /**
   * Obtener evento público por slug (sin auth)
   * @param {string} slug
   * @returns {Promise<Object>}
   */
  obtenerEventoPublico: (slug) => {
    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' }
    });
    return publicAxios.get(`/public/evento/${slug}`);
  },

  /**
   * Obtener invitación personalizada (sin auth)
   * @param {string} slug
   * @param {string} token
   * @returns {Promise<Object>}
   */
  obtenerInvitacion: (slug, token) => {
    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' }
    });
    return publicAxios.get(`/public/evento/${slug}/${token}`);
  },

  /**
   * Confirmar RSVP (sin auth)
   * @param {string} slug
   * @param {string} token
   * @param {Object} data - { asistira, num_asistentes?, mensaje_rsvp?, restricciones_dieteticas? }
   * @returns {Promise<Object>}
   */
  confirmarRSVP: (slug, token, data) => {
    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' }
    });
    return publicAxios.post(`/public/evento/${slug}/${token}/rsvp`, data);
  },

  /**
   * Obtener URL de WhatsApp para compartir (sin auth)
   * @param {string} slug
   * @param {string} token
   * @returns {Promise<Object>}
   */
  obtenerWhatsAppUrl: (slug, token) => {
    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' }
    });
    return publicAxios.get(`/public/evento/${slug}/${token}/whatsapp`);
  },

  // ========== Galería Pública ==========

  /**
   * Obtener galería pública del evento (sin auth)
   * @param {string} slug
   * @param {number} limit
   * @returns {Promise<Object>}
   */
  obtenerGaleriaPublica: (slug, limit = 100) => {
    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' }
    });
    return publicAxios.get(`/public/evento/${slug}/galeria`, { params: { limit } });
  },

  /**
   * Subir foto como invitado (sin auth, requiere token)
   * Envía archivo como FormData
   * @param {string} slug
   * @param {string} token
   * @param {File} file - Archivo de imagen
   * @param {string} caption - Descripción opcional
   * @returns {Promise<Object>}
   */
  subirFotoPublica: (slug, token, file, caption = '') => {
    const formData = new FormData();
    formData.append('foto', file);
    if (caption) {
      formData.append('caption', caption);
    }

    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return publicAxios.post(`/public/evento/${slug}/${token}/galeria`, formData);
  },

  /**
   * Reportar foto inapropiada (sin auth)
   * @param {number} fotoId
   * @param {string} motivo
   * @returns {Promise<Object>}
   */
  reportarFoto: (fotoId, motivo) => {
    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' }
    });
    return publicAxios.post(`/public/galeria/${fotoId}/reportar`, { motivo });
  },
};

// ==================== WEBSITE (Dic 2025) ====================

