import apiClient from './client';
import axios from 'axios';

/**
 * API Endpoints para el sistema
 */

// ==================== AUTH ====================
export const authApi = {
  /**
   * Login de usuario
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} { user, accessToken, refreshToken }
   */
  login: (credentials) => apiClient.post('/auth/login', credentials),

  /**
   * Refresh token
   * @param {string} refreshToken
   * @returns {Promise<Object>} { accessToken, refreshToken }
   */
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),

  /**
   * Logout
   * @returns {Promise<Object>}
   */
  logout: () => apiClient.post('/auth/logout'),

  /**
   * Obtener información del usuario autenticado (perfil + datos de org)
   * @returns {Promise<Object>} { usuario: { ...datos, tipo_industria, nombre_comercial, plan_actual } }
   */
  me: () => apiClient.get('/auth/me'),

  /**
   * Solicitar token de recuperación de contraseña
   * @param {Object} data - { email, organizacion_id }
   * @returns {Promise<Object>} { token_enviado, expires_at, reset_token (dev only) }
   */
  recuperarPassword: (data) => apiClient.post('/auth/reset-password', data),

  /**
   * Validar token de reset
   * @param {string} token - Token de reset
   * @returns {Promise<Object>} { valido, email, expira_en_minutos, expira_en }
   */
  validarTokenReset: (token) => apiClient.get(`/auth/validate-reset-token/${token}`),

  /**
   * Confirmar reset de contraseña
   * @param {string} token - Token de reset
   * @param {Object} data - { passwordNueva }
   * @returns {Promise<Object>} { success, email, mensaje }
   */
  confirmarResetPassword: (token, data) => apiClient.post(`/auth/reset-password/${token}`, data),

  /**
   * Evaluar fortaleza de contraseña
   * @param {Object} data - { password }
   * @returns {Promise<Object>} { puntuacion, nivel, cumple_requisitos, requisitos, sugerencias }
   */
  evaluarFortaleza: (data) => apiClient.post('/auth/password-strength', data),

  // ===== Onboarding Simplificado - Fase 2 (Nov 2025) =====

  /**
   * Registro simplificado (sin password, envía email de activación)
   * @param {Object} data - { nombre, email, nombre_negocio, categoria_id, estado_id, ciudad_id, plan, app_seleccionada }
   * @returns {Promise<Object>} { mensaje, email_enviado, expira_en, token (dev only) }
   */
  registrar: (data) => apiClient.post('/auth/registrar', data),

  /**
   * Validar token de activación
   * @param {string} token - Token de 64 caracteres
   * @returns {Promise<Object>} { valido, email, nombre, nombre_negocio, organizacion_id, tiempo_restante }
   */
  validarActivacion: (token) => apiClient.get(`/auth/activar/${token}`),

  /**
   * Activar cuenta con password
   * @param {string} token - Token de activación
   * @param {Object} data - { password, password_confirm }
   * @returns {Promise<Object>} { usuario, organizacion, accessToken, expiresIn }
   */
  activarCuenta: (token, data) => apiClient.post(`/auth/activar/${token}`, data),

  /**
   * Reenviar email de activación
   * @param {Object} data - { email }
   * @returns {Promise<Object>} { mensaje, email_enviado, expira_en, reenvio_numero }
   */
  reenviarActivacion: (data) => apiClient.post('/auth/reenviar-activacion', data),
};

// ==================== ORGANIZACIONES ====================
export const organizacionesApi = {
  /**
   * Registro de organización (Onboarding público - Sin autenticación)
   * @param {Object} data - { organizacion, admin, aplicar_plantilla_servicios }
   * @returns {Promise<Object>} { organizacion, admin: { id, nombre, apellidos, email, rol, token }, servicios_creados }
   */
  register: (data) => apiClient.post('/organizaciones/register', data),

  /**
   * Crear organización (solo super_admin - Requiere autenticación)
   * @param {Object} data - Datos de la organización
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/organizaciones', data),

  /**
   * Obtener organización por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/organizaciones/${id}`),

  /**
   * Actualizar organización
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/organizaciones/${id}`, data),

  /**
   * Obtener estadísticas de la organización
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerEstadisticas: (id) => apiClient.get(`/organizaciones/${id}/estadisticas`),

  /**
   * Obtener progreso del setup inicial
   * @param {number} id
   * @returns {Promise<Object>} { completed, profesionales, horarios_configurados, servicios, asignaciones, progress }
   */
  getSetupProgress: (id) => apiClient.get(`/organizaciones/${id}/setup-progress`),
};

// ==================== USUARIOS ====================
export const usuariosApi = {
  /**
   * Crear usuario (registro)
   * @param {Object} data - Datos del usuario
   * @returns {Promise<Object>} { user, accessToken, refreshToken }
   */
  crear: (data) => apiClient.post('/usuarios', data),

  /**
   * Obtener usuario por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/usuarios/${id}`),

  /**
   * Listar usuarios
   * @returns {Promise<Object>}
   */
  listar: () => apiClient.get('/usuarios'),

  /**
   * Actualizar usuario
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/usuarios/${id}`, data),
};

// ==================== PROFESIONALES ====================
export const profesionalesApi = {
  /**
   * Crear profesional
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/profesionales', data),

  /**
   * Crear múltiples profesionales en transacción (bulk)
   * @param {Array} profesionales - Array de profesionales a crear
   * @returns {Promise<Object>} { profesionales, total_creados }
   */
  crearBulk: (profesionales) => apiClient.post('/profesionales/bulk-create', {
    profesionales
  }),

  /**
   * Listar profesionales con filtros
   * @param {Object} params - Filtros opcionales
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/profesionales', { params }),

  /**
   * Obtener profesional por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/profesionales/${id}`),

  /**
   * Actualizar profesional
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/profesionales/${id}`, data),

  /**
   * Eliminar profesional
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/profesionales/${id}`),

  // ========== Modelo Unificado Profesional-Usuario (Nov 2025) ==========

  /**
   * Buscar profesional vinculado a un usuario
   * @param {number} usuarioId
   * @returns {Promise<Object>}
   */
  buscarPorUsuario: (usuarioId) => apiClient.get(`/profesionales/por-usuario/${usuarioId}`),

  /**
   * Obtener usuarios disponibles para vincular (sin profesional asignado)
   * @returns {Promise<Object>}
   */
  usuariosDisponibles: () => apiClient.get('/profesionales/usuarios-disponibles'),

  /**
   * Listar profesionales por módulo habilitado
   * @param {string} modulo - 'agendamiento' | 'pos' | 'inventario'
   * @param {Object} params - { activos }
   * @returns {Promise<Object>}
   */
  listarPorModulo: (modulo, params = {}) => apiClient.get(`/profesionales/por-modulo/${modulo}`, { params }),

  /**
   * Vincular o desvincular usuario a profesional
   * @param {number} profesionalId
   * @param {number|null} usuarioId - null para desvincular
   * @returns {Promise<Object>}
   */
  vincularUsuario: (profesionalId, usuarioId) =>
    apiClient.patch(`/profesionales/${profesionalId}/vincular-usuario`, { usuario_id: usuarioId }),

  /**
   * Actualizar módulos habilitados para un profesional
   * @param {number} profesionalId
   * @param {Object} modulosAcceso - { agendamiento, pos, inventario }
   * @returns {Promise<Object>}
   */
  actualizarModulos: (profesionalId, modulosAcceso) =>
    apiClient.patch(`/profesionales/${profesionalId}/modulos`, { modulos_acceso: modulosAcceso }),
};

// ==================== TIPOS PROFESIONAL ====================
export const tiposProfesionalApi = {
  /**
   * Listar tipos de profesional (sistema + personalizados de la org)
   * @param {Object} params - { solo_sistema, solo_personalizados, tipo_industria, activo }
   * @returns {Promise<Object>} { tipos, total, filtros_aplicados }
   */
  listar: (params = {}) => apiClient.get('/tipos-profesional', { params }),

  /**
   * Obtener tipo de profesional por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/tipos-profesional/${id}`),

  /**
   * Crear tipo personalizado
   * @param {Object} data - { codigo, nombre, descripcion, categoria, industrias_compatibles, etc. }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/tipos-profesional', data),

  /**
   * Actualizar tipo personalizado
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/tipos-profesional/${id}`, data),

  /**
   * Eliminar tipo personalizado (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/tipos-profesional/${id}`),
};

// ==================== SERVICIOS ====================
export const serviciosApi = {
  /**
   * Crear servicio
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/servicios', data),

  /**
   * Crear múltiples servicios en transacción (bulk)
   * @param {Array} servicios - Array de servicios a crear
   * @returns {Promise<Object>} { servicios, total_creados }
   */
  crearBulk: (servicios) => apiClient.post('/servicios/bulk-create', {
    servicios
  }),

  /**
   * Listar servicios con filtros y paginación
   * @param {Object} params - { pagina, limite, busqueda, activo, categoria, precio_min, precio_max }
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/servicios', { params }),

  /**
   * Obtener servicio por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/servicios/${id}`),

  /**
   * Actualizar servicio
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/servicios/${id}`, data),

  /**
   * Eliminar servicio (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/servicios/${id}`),

  /**
   * Buscar servicios (búsqueda rápida)
   * @param {Object} params - { termino, limite }
   * @returns {Promise<Object>}
   */
  buscar: (params) => apiClient.get('/servicios/buscar', { params }),

  /**
   * Obtener profesionales asignados al servicio
   * @param {number} id - ID del servicio
   * @returns {Promise<Object>}
   */
  obtenerProfesionales: (id) => apiClient.get(`/servicios/${id}/profesionales`),

  /**
   * Asignar profesional al servicio
   * @param {number} id - ID del servicio
   * @param {Object} data - { profesional_id, configuracion }
   * @returns {Promise<Object>}
   */
  asignarProfesional: (id, data) => apiClient.post(`/servicios/${id}/profesionales`, data),

  /**
   * Desasignar profesional del servicio
   * @param {number} id - ID del servicio
   * @param {number} profId - ID del profesional
   * @returns {Promise<Object>}
   */
  desasignarProfesional: (id, profId) => apiClient.delete(`/servicios/${id}/profesionales/${profId}`),

  /**
   * Obtener servicios de un profesional
   * @param {number} profesionalId - ID del profesional
   * @param {Object} params - { solo_activos }
   * @returns {Promise<Object>}
   */
  obtenerServiciosPorProfesional: (profesionalId, params = {}) =>
    apiClient.get(`/servicios/profesionales/${profesionalId}/servicios`, { params }),

  /**
   * Obtener estadísticas de asignaciones servicio-profesional
   * @returns {Promise<Object>} { total_servicios, servicios_activos, servicios_sin_profesional, total_profesionales, profesionales_activos, profesionales_sin_servicio, total_asignaciones_activas }
   */
  obtenerEstadisticasAsignaciones: () =>
    apiClient.get('/servicios/estadisticas/asignaciones'),
};

// ==================== HORARIOS PROFESIONALES ====================
export const horariosApi = {
  /**
   * Crear horarios semanales estándar (batch para Lun-Vie)
   * @param {Object} data - { profesional_id, dias, hora_inicio, hora_fin, tipo_horario, nombre_horario, fecha_inicio }
   * @returns {Promise<Object>} { horarios_creados, horarios: [...] }
   */
  crearSemanalesEstandar: (data) => apiClient.post('/horarios-profesionales/semanales-estandar', data),

  /**
   * Crear horario individual
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/horarios-profesionales', data),

  /**
   * Listar horarios de un profesional
   * @param {Object} params - { profesional_id, dia_semana, tipo_horario, etc. }
   * @returns {Promise<Object>}
   */
  listar: (params) => apiClient.get('/horarios-profesionales', { params }),

  /**
   * Obtener horario por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/horarios-profesionales/${id}`),

  /**
   * Actualizar horario
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/horarios-profesionales/${id}`, data),

  /**
   * Eliminar horario
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/horarios-profesionales/${id}`),

  /**
   * Validar configuración de horarios de un profesional
   * @param {number} profesionalId
   * @returns {Promise<Object>}
   */
  validarConfiguracion: (profesionalId) => apiClient.get(`/horarios-profesionales/validar/${profesionalId}`),
};

// ==================== CLIENTES ====================
export const clientesApi = {
  /**
   * Crear cliente
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/clientes', data),

  /**
   * Listar clientes con paginación
   * @param {Object} params - { page, limit, busqueda, activo, marketing_permitido, ordenPor, orden }
   * @returns {Promise<Object>} { data, pagination }
   */
  listar: (params = {}) => apiClient.get('/clientes', { params }),

  /**
   * Obtener cliente por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/clientes/${id}`),

  /**
   * Actualizar cliente
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/clientes/${id}`, data),

  /**
   * Eliminar cliente (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/clientes/${id}`),

  /**
   * Búsqueda rápida de clientes
   * @param {Object} params - { q, limit }
   * @returns {Promise<Object>}
   */
  buscar: (params) => apiClient.get('/clientes/buscar', { params }),

  /**
   * Buscar cliente por teléfono (útil para walk-in)
   * @param {Object} params - { telefono, exacto, incluir_inactivos, crear_si_no_existe }
   * @returns {Promise<Object>}
   */
  buscarPorTelefono: (params) => apiClient.get('/clientes/buscar-telefono', { params }),

  /**
   * Buscar cliente por nombre
   * @param {Object} params - { nombre, limit }
   * @returns {Promise<Object>}
   */
  buscarPorNombre: (params) => apiClient.get('/clientes/buscar-nombre', { params }),

  /**
   * Obtener estadísticas de clientes
   * @returns {Promise<Object>}
   */
  obtenerEstadisticas: () => apiClient.get('/clientes/estadisticas'),

  /**
   * Cambiar estado de cliente (activo/inactivo)
   * @param {number} id
   * @param {boolean} activo
   * @returns {Promise<Object>}
   */
  cambiarEstado: (id, activo) => apiClient.patch(`/clientes/${id}/estado`, { activo }),
};

// ==================== CITAS ====================
export const citasApi = {
  /**
   * Crear cita
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/citas', data),

  /**
   * Listar citas
   * @param {Object} params - Filtros opcionales
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/citas', { params }),

  /**
   * Obtener cita por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/citas/${id}`),

  /**
   * Actualizar cita
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/citas/${id}`, data),

  /**
   * Cancelar cita
   * @param {number} id
   * @param {Object} data - { motivo_cancelacion }
   * @returns {Promise<Object>}
   */
  cancelar: (id, data = {}) => apiClient.put(`/citas/${id}/cancelar`, data),

  /**
   * Confirmar asistencia de cita
   * @param {number} id
   * @param {Object} data - Datos opcionales
   * @returns {Promise<Object>}
   */
  confirmar: (id, data = {}) => apiClient.patch(`/citas/${id}/confirmar-asistencia`, data),

  /**
   * Iniciar cita (cambiar a estado en_curso)
   * @param {number} id
   * @param {Object} data - { notas_inicio }
   * @returns {Promise<Object>}
   */
  iniciar: (id, data = {}) => apiClient.post(`/citas/${id}/start-service`, data),

  /**
   * Completar cita
   * @param {number} id
   * @param {Object} data - { notas_finalizacion, precio_total_real, metodo_pago }
   * @returns {Promise<Object>}
   */
  completar: (id, data = {}) => apiClient.post(`/citas/${id}/complete`, data),

  /**
   * Marcar cita como no show (cliente no llegó)
   * @param {number} id
   * @param {Object} data - { motivo }
   * @returns {Promise<Object>}
   */
  noShow: (id, data = {}) => apiClient.put(`/citas/${id}/no-show`, data),

  /**
   * Enviar recordatorio de cita por WhatsApp
   * @param {number} id
   * @returns {Promise<Object>}
   */
  enviarRecordatorio: (id) => apiClient.post(`/citas/${id}/enviar-recordatorio`),

  /**
   * Obtener historial de recordatorios de una cita
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerRecordatorios: (id) => apiClient.get(`/citas/${id}/recordatorios`),

  /**
   * Crear cita walk-in (cliente sin cita previa)
   * @param {Object} data - { cliente_id, nombre_cliente, profesional_id, servicio_id, tiempo_espera_aceptado, notas_walk_in }
   * @returns {Promise<Object>}
   */
  crearWalkIn: (data) => apiClient.post('/citas/walk-in', data),

  /**
   * Consultar disponibilidad inmediata para walk-in
   * @param {Object} params - { servicio_id, profesional_id }
   * @returns {Promise<Object>}
   */
  disponibilidadInmediata: (params) => apiClient.get('/citas/disponibilidad-inmediata', { params }),
};

// ==================== PLANES ====================
export const planesApi = {
  /**
   * Listar planes disponibles
   * @returns {Promise<Object>}
   */
  listar: () => apiClient.get('/planes'),

  /**
   * Obtener plan por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/planes/${id}`),
};

// ==================== BLOQUEOS DE HORARIOS ====================
export const bloqueosApi = {
  /**
   * Crear bloqueo de horario
   * @param {Object} data - { profesional_id, tipo_bloqueo, titulo, descripcion, fecha_inicio, fecha_fin, hora_inicio, hora_fin, ... }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/bloqueos-horarios', data),

  /**
   * Listar bloqueos con filtros
   * @param {Object} params - { profesional_id, tipo_bloqueo, fecha_inicio, fecha_fin, solo_organizacionales, limite, offset }
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/bloqueos-horarios', { params }),

  /**
   * Obtener bloqueo por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/bloqueos-horarios/${id}`),

  /**
   * Actualizar bloqueo
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/bloqueos-horarios/${id}`, data),

  /**
   * Eliminar bloqueo
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/bloqueos-horarios/${id}`),

  /**
   * Obtener bloqueos de un profesional específico
   * @param {number} profesionalId
   * @param {Object} params - { fecha_inicio, fecha_fin }
   * @returns {Promise<Object>}
   */
  obtenerPorProfesional: (profesionalId, params = {}) =>
    apiClient.get('/bloqueos-horarios', { params: { ...params, profesional_id: profesionalId } }),

  /**
   * Obtener bloqueos organizacionales (sin profesional específico)
   * @param {Object} params - { fecha_inicio, fecha_fin, tipo_bloqueo }
   * @returns {Promise<Object>}
   */
  obtenerOrganizacionales: (params = {}) =>
    apiClient.get('/bloqueos-horarios', { params: { ...params, solo_organizacionales: true } }),

  /**
   * Obtener bloqueos por rango de fechas
   * @param {string} fechaInicio - Formato YYYY-MM-DD
   * @param {string} fechaFin - Formato YYYY-MM-DD
   * @param {Object} params - Filtros adicionales
   * @returns {Promise<Object>}
   */
  obtenerPorRangoFechas: (fechaInicio, fechaFin, params = {}) =>
    apiClient.get('/bloqueos-horarios', {
      params: { ...params, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    }),
};

// ==================== TIPOS DE BLOQUEO ====================
export const tiposBloqueoApi = {
  /**
   * Listar tipos de bloqueo disponibles (sistema + personalizados)
   * @param {Object} params - { solo_sistema, solo_personalizados }
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/tipos-bloqueo', { params }),

  /**
   * Obtener tipo de bloqueo por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/tipos-bloqueo/${id}`),

  /**
   * Crear tipo de bloqueo personalizado (solo admin/propietario)
   * @param {Object} data - { codigo, nombre, descripcion, permite_todo_el_dia, permite_horario_especifico, requiere_aprobacion, orden_display, metadata }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/tipos-bloqueo', data),

  /**
   * Actualizar tipo de bloqueo personalizado
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/tipos-bloqueo/${id}`, data),

  /**
   * Eliminar tipo de bloqueo personalizado
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/tipos-bloqueo/${id}`),
};

// ==================== WHATSAPP ====================
export const whatsappApi = {
  /**
   * Obtener QR Code para vincular WhatsApp
   * @returns {Promise<Object>} { qr_code_base64, session_id, status }
   */
  obtenerQR: () => apiClient.get('/whatsapp/qr-code'),

  /**
   * Verificar estado de WhatsApp
   * @returns {Promise<Object>} { status, phone_number, profile_name }
   */
  verificarEstado: () => apiClient.get('/whatsapp/status'),

  /**
   * Desvincular WhatsApp
   * @returns {Promise<Object>}
   */
  desvincular: () => apiClient.post('/whatsapp/disconnect'),
};

// ==================== CHATBOTS ====================
export const chatbotsApi = {
  /**
   * Configurar chatbot de Telegram
   * @param {Object} data - { nombre, plataforma, config_plataforma, ai_model, ai_temperature, system_prompt }
   * @returns {Promise<Object>} { chatbot, workflow, credential }
   */
  configurarTelegram: (data) => apiClient.post('/chatbots/configurar', data),

  /**
   * Configurar chatbot de WhatsApp Business Cloud API
   * @param {Object} data - { nombre, plataforma, config_plataforma, ai_model, ai_temperature }
   * @returns {Promise<Object>} { chatbot, workflow, credential }
   */
  configurarWhatsApp: (data) => apiClient.post('/chatbots/configurar', data),

  /**
   * Listar chatbots configurados
   * @param {Object} params - { plataforma, activo }
   * @returns {Promise<Object>} { chatbots, total }
   */
  listar: (params = {}) => apiClient.get('/chatbots', { params }),

  /**
   * Obtener chatbot por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/chatbots/${id}`),

  /**
   * Actualizar chatbot
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/chatbots/${id}`, data),

  /**
   * Eliminar chatbot
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/chatbots/${id}`),

  /**
   * Activar/Desactivar chatbot
   * @param {number} id
   * @param {boolean} activo
   * @returns {Promise<Object>}
   */
  cambiarEstado: (id, activo) => apiClient.patch(`/chatbots/${id}/estado`, { activo }),

  /**
   * Obtener estadísticas del chatbot
   * @param {number} id
   * @param {Object} params - { fecha_inicio, fecha_fin }
   * @returns {Promise<Object>}
   */
  obtenerEstadisticas: (id, params = {}) => apiClient.get(`/chatbots/${id}/estadisticas`, { params }),
};

// Exportar todo como default también
// ==================== SUBSCRIPCIONES ====================
export const subscripcionesApi = {
  /**
   * Crear suscripción en Mercado Pago
   * @param {Object} data - { plan_id, email, card_token_id }
   * @returns {Promise<Object>} { subscription_id, status, suscripcion_id }
   */
  crear: (data) => apiClient.post('/subscripciones/crear', data),

  /**
   * Obtener suscripción actual
   * @returns {Promise<Object>}
   */
  obtenerActual: () => apiClient.get('/subscripciones/actual'),

  /**
   * Obtener estado del trial
   * @returns {Promise<Object>} { tiene_trial, trial_activo, trial_vencido, dias_restantes, plan_codigo, ... }
   */
  obtenerEstadoTrial: () => apiClient.get('/subscripciones/estado-trial'),

  /**
   * Activar pago con Mercado Pago (después del trial) - Usando init_point
   * No requiere body - genera init_point para redirigir a Mercado Pago
   * @returns {Promise<Object>} { subscription_id, init_point, status }
   */
  activarPago: () => apiClient.post('/subscripciones/activar-pago'),

  /**
   * Obtener métricas de uso de la organización
   * @returns {Promise<Object>} { uso_profesionales, uso_clientes, ..., limites }
   */
  obtenerMetricasUso: () => apiClient.get('/subscripciones/metricas-uso'),
};

// ==================== MERCADO PAGO ====================
export const mercadopagoApi = {
  /**
   * Crear token de tarjeta
   * @param {Object} data - { card_number, cardholder_name, expiration_month, expiration_year, security_code, identification_number }
   * @returns {Promise<Object>} { token_id, first_six_digits, last_four_digits }
   */
  createCardToken: (data) => apiClient.post('/mercadopago/create-card-token', data),
};

// ==================== COMISIONES ====================
export const comisionesApi = {
  // ========== Configuración de Comisiones ==========

  /**
   * Crear o actualizar configuración de comisión
   * @param {Object} data - { profesional_id, servicio_id, tipo_comision, valor_comision, activo, notas }
   * @returns {Promise<Object>}
   */
  crearConfiguracion: (data) => apiClient.post('/comisiones/configuracion', data),

  /**
   * Listar configuraciones de comisión
   * @param {Object} params - { profesional_id, servicio_id, activo }
   * @returns {Promise<Object>} { configuraciones, total }
   */
  listarConfiguraciones: (params = {}) => apiClient.get('/comisiones/configuracion', { params }),

  /**
   * Obtener historial de cambios en configuración
   * @param {Object} params - { profesional_id, servicio_id, fecha_desde, fecha_hasta, limite, offset }
   * @returns {Promise<Object>} { historial, total }
   */
  obtenerHistorialConfiguracion: (params = {}) =>
    apiClient.get('/comisiones/configuracion/historial', { params }),

  /**
   * Eliminar configuración de comisión
   * @param {number} id - ID de la configuración
   * @returns {Promise<Object>}
   */
  eliminarConfiguracion: (id) => apiClient.delete(`/comisiones/configuracion/${id}`),

  // ========== Consulta de Comisiones ==========

  /**
   * Obtener comisiones de un profesional
   * @param {number} profesionalId - ID del profesional
   * @param {Object} params - { fecha_desde, fecha_hasta, estado_pago, limite, offset }
   * @returns {Promise<Object>} { comisiones, total, resumen }
   */
  obtenerPorProfesional: (profesionalId, params = {}) =>
    apiClient.get(`/comisiones/profesional/${profesionalId}`, { params }),

  /**
   * Obtener comisiones por período
   * @param {Object} params - { fecha_desde, fecha_hasta, profesional_id, estado_pago, limite, offset }
   * @returns {Promise<Object>} { comisiones, total, resumen }
   */
  obtenerPorPeriodo: (params = {}) => apiClient.get('/comisiones/periodo', { params }),

  /**
   * Obtener comisión por ID
   * @param {number} id - ID de la comisión
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/comisiones/${id}`),

  /**
   * Marcar comisión como pagada
   * @param {number} id - ID de la comisión
   * @param {Object} data - { fecha_pago, metodo_pago, referencia_pago, notas_pago }
   * @returns {Promise<Object>}
   */
  marcarComoPagada: (id, data) => apiClient.patch(`/comisiones/${id}/pagar`, data),

  // ========== Dashboard y Reportes ==========

  /**
   * Obtener métricas del dashboard de comisiones
   * @param {Object} params - { fecha_desde, fecha_hasta, profesional_id }
   * @returns {Promise<Object>} { total_comisiones, comisiones_pendientes, comisiones_pagadas, total_profesionales }
   */
  obtenerDashboard: (params = {}) => apiClient.get('/comisiones/dashboard', { params }),

  /**
   * Obtener estadísticas de comisiones
   * @param {Object} params - { fecha_desde, fecha_hasta, profesional_id }
   * @returns {Promise<Object>} { por_profesional, por_mes, por_servicio, resumen_general }
   */
  obtenerEstadisticas: (params = {}) => apiClient.get('/comisiones/estadisticas', { params }),

  /**
   * Obtener datos para gráfica de comisiones por día
   * @param {Object} params - { fecha_desde, fecha_hasta, profesional_id }
   * @returns {Promise<Object>} { grafica }
   */
  obtenerGraficaPorDia: (params = {}) => apiClient.get('/comisiones/grafica/por-dia', { params }),
};

// ==================== MARKETPLACE ====================
export const marketplaceApi = {
  // ========== Públicas (sin auth) ==========

  /**
   * Buscar perfiles en directorio
   * @param {Object} params - { ciudad, categoria, rating_min, busqueda, pagina, limite }
   * @returns {Promise<Object>} { perfiles, paginacion }
   */
  getPerfiles: (params = {}) => apiClient.get('/marketplace/perfiles/buscar', { params }),

  /**
   * Obtener perfil público por slug
   * @param {string} slug
   * @returns {Promise<Object>}
   */
  getPerfilPorSlug: (slug) => apiClient.get(`/marketplace/perfiles/slug/${slug}`),

  /**
   * Registrar evento de analytics (fire-and-forget)
   * @param {Object} data - { perfil_id, tipo_evento, metadata }
   */
  registrarEvento: (data) => apiClient.post('/marketplace/analytics', data),

  /**
   * Crear cita pública (sin auth - crea cliente automáticamente)
   * @param {Object} data - { organizacion_id, cliente: {...}, servicios_ids, fecha_cita, hora_inicio }
   * @returns {Promise<Object>} Cita creada
   *
   * IMPORTANTE: Crea instancia nueva de axios sin interceptores para evitar enviar token
   */
  crearCitaPublica: (data) => {
    // Crear instancia limpia de axios sin interceptores
    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' }
    });
    return publicAxios.post('/citas', data);
  },

  /**
   * Consultar disponibilidad pública (sin auth)
   * @param {Object} params - { organizacion_id, fecha, servicios_ids, profesional_id?, intervalo_minutos? }
   * @returns {Promise<Object>} { fecha, slots: [...] }
   *
   * IMPORTANTE: Crea instancia nueva de axios sin interceptores para evitar enviar token
   */
  consultarDisponibilidadPublica: (params) => {
    // Crear instancia limpia de axios sin interceptores
    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' }
    });
    return publicAxios.get('/disponibilidad', { params });
  },

  // ========== Privadas (requieren auth) ==========

  /**
   * Crear perfil de marketplace
   * @param {Object} data
   */
  crearPerfil: (data) => apiClient.post('/marketplace/perfiles', data),

  /**
   * Actualizar mi perfil
   * @param {number} id
   * @param {Object} data
   */
  actualizarPerfil: (id, data) => apiClient.put(`/marketplace/perfiles/${id}`, data),

  /**
   * Obtener mi perfil (admin/propietario)
   */
  getMiPerfil: () => apiClient.get('/marketplace/perfiles/mi-perfil'),

  /**
   * Activar/desactivar perfil (super_admin)
   * @param {number} id
   * @param {boolean} activo
   */
  activarPerfil: (id, activo) => apiClient.patch(`/marketplace/perfiles/${id}/activar`, { activo }),

  /**
   * Obtener estadísticas del perfil
   * @param {number} id
   * @param {Object} params - { fecha_desde, fecha_hasta }
   */
  getEstadisticasPerfil: (id, params = {}) =>
    apiClient.get(`/marketplace/perfiles/${id}/estadisticas`, { params }),

  // ========== Reseñas ==========

  /**
   * Listar reseñas de un negocio (público)
   * @param {string} slug
   * @param {Object} params - { pagina, limite, orden }
   */
  getReseñas: (slug, params = {}) =>
    apiClient.get(`/marketplace/resenas/negocio/${slug}`, { params }),

  /**
   * Crear reseña (autenticado - cliente con cita completada)
   * @param {Object} data - { cita_id, rating, comentario }
   */
  crearReseña: (data) => apiClient.post('/marketplace/resenas', data),

  /**
   * Responder reseña (admin/propietario)
   * @param {number} id
   * @param {Object} data - { respuesta }
   */
  responderReseña: (id, data) => apiClient.post(`/marketplace/resenas/${id}/responder`, data),

  /**
   * Moderar reseña (admin/propietario)
   * @param {number} id
   * @param {Object} data - { estado, motivo_moderacion }
   */
  moderarReseña: (id, data) => apiClient.patch(`/marketplace/resenas/${id}/moderar`, data),

  // ========== Super Admin ==========

  /**
   * Listar TODOS los perfiles de marketplace (super_admin)
   * @param {Object} params - { activo, ciudad, rating_min, pagina, limite }
   * @returns {Promise<Object>} { perfiles, paginacion }
   */
  getPerfilesAdmin: (params = {}) => apiClient.get('/superadmin/marketplace/perfiles', { params }),

  /**
   * Limpiar analytics antiguos (super_admin)
   * @param {Object} params - { dias_antiguedad }
   */
  limpiarAnalytics: (params = {}) => apiClient.delete('/marketplace/analytics/limpiar', { params }),
};

// ==================== INVENTARIO ====================
export const inventarioApi = {
  // ========== Categorías de Productos ==========

  /**
   * Crear categoría de producto
   * @param {Object} data - { nombre, descripcion?, categoria_padre_id?, icono?, color?, orden?, activo? }
   * @returns {Promise<Object>}
   */
  crearCategoria: (data) => apiClient.post('/inventario/categorias', data),

  /**
   * Listar categorías con filtros
   * @param {Object} params - { activo?, categoria_padre_id?, busqueda? }
   * @returns {Promise<Object>} { categorias }
   */
  listarCategorias: (params = {}) => apiClient.get('/inventario/categorias', { params }),

  /**
   * Obtener árbol jerárquico de categorías
   * @returns {Promise<Object>} { arbol }
   */
  obtenerArbolCategorias: () => apiClient.get('/inventario/categorias/arbol'),

  /**
   * Obtener categoría por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerCategoria: (id) => apiClient.get(`/inventario/categorias/${id}`),

  /**
   * Actualizar categoría
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarCategoria: (id, data) => apiClient.put(`/inventario/categorias/${id}`, data),

  /**
   * Eliminar categoría (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarCategoria: (id) => apiClient.delete(`/inventario/categorias/${id}`),

  // ========== Proveedores ==========

  /**
   * Crear proveedor
   * @param {Object} data - { nombre, razon_social?, rfc?, telefono?, email?, sitio_web?, direccion?, ciudad?, estado?, codigo_postal?, pais?, dias_credito?, dias_entrega_estimados?, monto_minimo_compra?, notas?, activo? }
   * @returns {Promise<Object>}
   */
  crearProveedor: (data) => apiClient.post('/inventario/proveedores', data),

  /**
   * Listar proveedores con filtros
   * @param {Object} params - { activo?, busqueda?, ciudad?, rfc?, limit?, offset? }
   * @returns {Promise<Object>} { proveedores, total }
   */
  listarProveedores: (params = {}) => apiClient.get('/inventario/proveedores', { params }),

  /**
   * Obtener proveedor por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerProveedor: (id) => apiClient.get(`/inventario/proveedores/${id}`),

  /**
   * Actualizar proveedor
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarProveedor: (id, data) => apiClient.put(`/inventario/proveedores/${id}`, data),

  /**
   * Eliminar proveedor (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarProveedor: (id) => apiClient.delete(`/inventario/proveedores/${id}`),

  // ========== Productos ==========

  /**
   * Crear producto
   * @param {Object} data - { nombre, descripcion?, sku?, codigo_barras?, categoria_id?, proveedor_id?, precio_compra?, precio_venta, precio_mayoreo?, cantidad_mayoreo?, stock_actual?, stock_minimo?, stock_maximo?, unidad_medida?, alerta_stock_minimo?, es_perecedero?, dias_vida_util?, permite_venta?, permite_uso_servicio?, notas?, activo? }
   * @returns {Promise<Object>}
   */
  crearProducto: (data) => apiClient.post('/inventario/productos', data),

  /**
   * Crear múltiples productos (bulk 1-50)
   * @param {Object} data - { productos: [...] }
   * @returns {Promise<Object>} { productos_creados, errores? }
   */
  bulkCrearProductos: (data) => apiClient.post('/inventario/productos/bulk', data),

  /**
   * Listar productos con filtros
   * @param {Object} params - { activo?, categoria_id?, proveedor_id?, busqueda?, sku?, codigo_barras?, stock_bajo?, stock_agotado?, permite_venta?, orden_por?, orden_dir?, limit?, offset? }
   * @returns {Promise<Object>} { productos, total }
   */
  listarProductos: (params = {}) => apiClient.get('/inventario/productos', { params }),

  /**
   * Buscar productos (full-text search + código de barras)
   * @param {Object} params - { q, tipo_busqueda?, categoria_id?, proveedor_id?, solo_activos?, solo_con_stock?, limit? }
   * @returns {Promise<Object>} { productos }
   */
  buscarProductos: (params) => apiClient.get('/inventario/productos/buscar', { params }),

  /**
   * Obtener productos con stock crítico
   * @returns {Promise<Object>} { productos }
   */
  obtenerStockCritico: () => apiClient.get('/inventario/productos/stock-critico'),

  /**
   * Obtener producto por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerProducto: (id) => apiClient.get(`/inventario/productos/${id}`),

  /**
   * Actualizar producto
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarProducto: (id, data) => apiClient.put(`/inventario/productos/${id}`, data),

  /**
   * Ajustar stock manualmente (conteo físico, correcciones)
   * @param {number} id
   * @param {Object} data - { cantidad_ajuste, motivo, tipo_movimiento: 'entrada_ajuste' | 'salida_ajuste' }
   * @returns {Promise<Object>}
   */
  ajustarStock: (id, data) => apiClient.patch(`/inventario/productos/${id}/stock`, data),

  /**
   * Eliminar producto (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarProducto: (id) => apiClient.delete(`/inventario/productos/${id}`),

  // ========== Movimientos de Inventario ==========

  /**
   * Registrar movimiento de inventario
   * @param {Object} data - { producto_id, tipo_movimiento, cantidad, costo_unitario?, proveedor_id?, venta_pos_id?, cita_id?, usuario_id?, referencia?, motivo?, fecha_vencimiento?, lote? }
   * @returns {Promise<Object>}
   */
  registrarMovimiento: (data) => apiClient.post('/inventario/movimientos', data),

  /**
   * Listar movimientos con filtros
   * @param {Object} params - { tipo_movimiento?, categoria?, producto_id?, proveedor_id?, fecha_desde?, fecha_hasta?, limit?, offset? }
   * @returns {Promise<Object>} { movimientos, total }
   */
  listarMovimientos: (params = {}) => apiClient.get('/inventario/movimientos', { params }),

  /**
   * Obtener kardex de un producto
   * @param {number} productoId
   * @param {Object} params - { tipo_movimiento?, fecha_desde?, fecha_hasta?, proveedor_id?, limit?, offset? }
   * @returns {Promise<Object>} { kardex, producto }
   */
  obtenerKardex: (productoId, params = {}) => apiClient.get(`/inventario/movimientos/kardex/${productoId}`, { params }),

  /**
   * Obtener estadísticas de movimientos
   * @param {Object} params - { fecha_desde, fecha_hasta }
   * @returns {Promise<Object>} { estadisticas }
   */
  obtenerEstadisticasMovimientos: (params) => apiClient.get('/inventario/movimientos/estadisticas', { params }),

  // ========== Alertas de Inventario ==========

  /**
   * Listar alertas con filtros
   * @param {Object} params - { tipo_alerta?, nivel?, leida?, producto_id?, fecha_desde?, fecha_hasta?, limit?, offset? }
   * @returns {Promise<Object>} { alertas, total }
   */
  listarAlertas: (params = {}) => apiClient.get('/inventario/alertas', { params }),

  /**
   * Obtener dashboard de alertas
   * @returns {Promise<Object>} { resumen, alertas_recientes }
   */
  obtenerDashboardAlertas: () => apiClient.get('/inventario/alertas/dashboard'),

  /**
   * Obtener alerta por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerAlerta: (id) => apiClient.get(`/inventario/alertas/${id}`),

  /**
   * Marcar alerta como leída
   * @param {number} id
   * @returns {Promise<Object>}
   */
  marcarAlertaLeida: (id) => apiClient.patch(`/inventario/alertas/${id}/marcar-leida`),

  /**
   * Marcar múltiples alertas como leídas
   * @param {Object} data - { alerta_ids: [...] }
   * @returns {Promise<Object>}
   */
  marcarVariasAlertasLeidas: (data) => apiClient.patch('/inventario/alertas/marcar-varias-leidas', data),

  // ========== Reportes de Inventario ==========

  /**
   * Obtener valor total del inventario
   * @returns {Promise<Object>} { total_productos, total_unidades, valor_compra, valor_venta, margen_potencial }
   */
  obtenerValorInventario: () => apiClient.get('/inventario/reportes/valor-inventario'),

  /**
   * Obtener análisis ABC de productos (clasificación Pareto)
   * @param {Object} params - { fecha_desde, fecha_hasta, categoria_id? }
   * @returns {Promise<Object>} { productos_abc }
   */
  obtenerAnalisisABC: (params) => apiClient.get('/inventario/reportes/analisis-abc', { params }),

  /**
   * Obtener reporte de rotación de inventario
   * @param {Object} params - { fecha_desde, fecha_hasta, categoria_id?, top? }
   * @returns {Promise<Object>} { productos_rotacion }
   */
  obtenerRotacionInventario: (params) => apiClient.get('/inventario/reportes/rotacion', { params }),

  /**
   * Obtener resumen de alertas agrupadas
   * @returns {Promise<Object>} { resumen_alertas }
   */
  obtenerResumenAlertas: () => apiClient.get('/inventario/reportes/alertas'),
};

// ==================== ÓRDENES DE COMPRA ====================
export const ordenesCompraApi = {
  // ========== CRUD Básico ==========

  /**
   * Crear orden de compra
   * @param {Object} data - { proveedor_id, fecha_entrega_esperada?, descuento_porcentaje?, descuento_monto?, impuestos?, dias_credito?, notas?, referencia_proveedor?, items?[] }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/inventario/ordenes-compra', data),

  /**
   * Listar ordenes de compra
   * @param {Object} params - { proveedor_id?, estado?, estado_pago?, fecha_desde?, fecha_hasta?, folio?, limit?, offset? }
   * @returns {Promise<Object>}
   */
  listar: (params) => apiClient.get('/inventario/ordenes-compra', { params }),

  /**
   * Obtener orden por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerPorId: (id) => apiClient.get(`/inventario/ordenes-compra/${id}`),

  /**
   * Actualizar orden (solo borradores)
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/inventario/ordenes-compra/${id}`, data),

  /**
   * Eliminar orden (solo borradores)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/inventario/ordenes-compra/${id}`),

  // ========== Gestión de Items ==========

  /**
   * Agregar items a orden
   * @param {number} ordenId
   * @param {Object} data - { items: [{ producto_id, cantidad_ordenada, precio_unitario?, fecha_vencimiento?, notas? }] }
   * @returns {Promise<Object>}
   */
  agregarItems: (ordenId, data) => apiClient.post(`/inventario/ordenes-compra/${ordenId}/items`, data),

  /**
   * Actualizar item de orden
   * @param {number} ordenId
   * @param {number} itemId
   * @param {Object} data - { cantidad_ordenada?, precio_unitario?, fecha_vencimiento?, notas? }
   * @returns {Promise<Object>}
   */
  actualizarItem: (ordenId, itemId, data) => apiClient.put(`/inventario/ordenes-compra/${ordenId}/items/${itemId}`, data),

  /**
   * Eliminar item de orden
   * @param {number} ordenId
   * @param {number} itemId
   * @returns {Promise<Object>}
   */
  eliminarItem: (ordenId, itemId) => apiClient.delete(`/inventario/ordenes-compra/${ordenId}/items/${itemId}`),

  // ========== Cambios de Estado ==========

  /**
   * Enviar orden al proveedor (borrador -> enviada)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  enviar: (id) => apiClient.patch(`/inventario/ordenes-compra/${id}/enviar`),

  /**
   * Cancelar orden
   * @param {number} id
   * @param {Object} data - { motivo? }
   * @returns {Promise<Object>}
   */
  cancelar: (id, data) => apiClient.patch(`/inventario/ordenes-compra/${id}/cancelar`, data),

  // ========== Recepción de Mercancía ==========

  /**
   * Recibir mercancía (parcial o total)
   * @param {number} ordenId
   * @param {Object} data - { recepciones: [{ item_id, cantidad, precio_unitario_real?, fecha_vencimiento?, lote?, notas? }] }
   * @returns {Promise<Object>}
   */
  recibirMercancia: (ordenId, data) => apiClient.post(`/inventario/ordenes-compra/${ordenId}/recibir`, data),

  // ========== Pagos ==========

  /**
   * Registrar pago de orden
   * @param {number} id
   * @param {Object} data - { monto }
   * @returns {Promise<Object>}
   */
  registrarPago: (id, data) => apiClient.post(`/inventario/ordenes-compra/${id}/pago`, data),

  // ========== Reportes ==========

  /**
   * Obtener ordenes pendientes de recibir
   * @returns {Promise<Object>}
   */
  obtenerPendientes: () => apiClient.get('/inventario/ordenes-compra/pendientes'),

  /**
   * Obtener ordenes pendientes de pago
   * @returns {Promise<Object>}
   */
  obtenerPendientesPago: () => apiClient.get('/inventario/ordenes-compra/pendientes-pago'),

  /**
   * Obtener estadísticas de compras por proveedor
   * @param {Object} params - { fecha_desde?, fecha_hasta? }
   * @returns {Promise<Object>}
   */
  estadisticasPorProveedor: (params) => apiClient.get('/inventario/ordenes-compra/reportes/por-proveedor', { params }),
};

// ==================== PUNTO DE VENTA (POS) ====================
export const posApi = {
  // ========== Ventas POS ==========

  /**
   * Crear venta con items
   * @param {Object} data - { tipo_venta?, cliente_id?, cita_id?, profesional_id?, usuario_id, items: [{ producto_id, cantidad, precio_unitario?, descuento_porcentaje?, descuento_monto?, aplica_comision?, notas? }], descuento_porcentaje?, descuento_monto?, impuestos?, metodo_pago, monto_pagado?, fecha_apartado?, fecha_vencimiento_apartado?, notas? }
   * @returns {Promise<Object>}
   */
  crearVenta: (data) => apiClient.post('/pos/ventas', data),

  /**
   * Listar ventas con filtros
   * @param {Object} params - { estado?, estado_pago?, tipo_venta?, cliente_id?, profesional_id?, metodo_pago?, fecha_desde?, fecha_hasta?, folio?, limit?, offset? }
   * @returns {Promise<Object>} { ventas, total }
   */
  listarVentas: (params = {}) => apiClient.get('/pos/ventas', { params }),

  /**
   * Obtener venta por ID con sus items
   * @param {number} id
   * @returns {Promise<Object>} { venta, items }
   */
  obtenerVenta: (id) => apiClient.get(`/pos/ventas/${id}`),

  /**
   * Actualizar venta
   * @param {number} id
   * @param {Object} data - { tipo_venta?, cliente_id?, profesional_id?, descuento_porcentaje?, descuento_monto?, impuestos?, metodo_pago?, fecha_apartado?, fecha_vencimiento_apartado?, notas? }
   * @returns {Promise<Object>}
   */
  actualizarVenta: (id, data) => apiClient.put(`/pos/ventas/${id}`, data),

  /**
   * Actualizar estado de venta
   * @param {number} id
   * @param {Object} data - { estado: 'cotizacion' | 'apartado' | 'completada' | 'cancelada' }
   * @returns {Promise<Object>}
   */
  actualizarEstadoVenta: (id, data) => apiClient.patch(`/pos/ventas/${id}/estado`, data),

  /**
   * Registrar pago en venta
   * @param {number} id
   * @param {Object} data - { monto_pago, metodo_pago, pago_id? }
   * @returns {Promise<Object>}
   */
  registrarPago: (id, data) => apiClient.post(`/pos/ventas/${id}/pago`, data),

  /**
   * Cancelar venta y revertir stock
   * @param {number} id
   * @param {Object} data - { motivo?, usuario_id }
   * @returns {Promise<Object>}
   */
  cancelarVenta: (id, data) => apiClient.post(`/pos/ventas/${id}/cancelar`, data),

  /**
   * Procesar devolución parcial o total de items
   * @param {number} id
   * @param {Object} data - { items_devueltos: [{ item_id, cantidad_devolver }], motivo?, usuario_id }
   * @returns {Promise<Object>}
   */
  devolverItems: (id, data) => apiClient.post(`/pos/ventas/${id}/devolver`, data),

  /**
   * Agregar items a venta existente
   * @param {number} id
   * @param {Object} data - { items: [{ producto_id, cantidad, precio_unitario?, descuento_porcentaje?, descuento_monto?, aplica_comision?, notas? }] }
   * @returns {Promise<Object>}
   */
  agregarItems: (id, data) => apiClient.post(`/pos/ventas/${id}/items`, data),

  /**
   * Eliminar venta (marca como cancelada y revierte stock)
   * @param {number} id
   * @param {Object} data - { motivo, usuario_id }
   * @returns {Promise<Object>}
   */
  eliminarVenta: (id, data) => apiClient.delete(`/pos/ventas/${id}`, { data }),

  // ========== Tickets PDF ==========

  /**
   * Generar ticket PDF de una venta
   * @param {number} id - ID de la venta
   * @param {Object} options - { paper_size?: '58mm' | '80mm', download?: boolean }
   * @returns {Promise<Blob>} PDF binary
   */
  generarTicket: (id, options = {}) => {
    const params = new URLSearchParams();
    if (options.paper_size) params.append('paper_size', options.paper_size);
    if (options.download !== undefined) params.append('download', options.download);
    const queryString = params.toString();
    const url = `/pos/ventas/${id}/ticket${queryString ? '?' + queryString : ''}`;
    return apiClient.get(url, { responseType: 'blob' });
  },

  /**
   * Obtener URL para descargar ticket (útil para abrir en nueva pestaña)
   * @param {number} id - ID de la venta
   * @param {Object} options - { paper_size?: '58mm' | '80mm' }
   * @returns {string} URL del endpoint
   */
  getTicketUrl: (id, options = {}) => {
    const params = new URLSearchParams();
    if (options.paper_size) params.append('paper_size', options.paper_size);
    params.append('download', 'false'); // Para visualizar inline
    const queryString = params.toString();
    return `${import.meta.env.VITE_API_URL || ''}/api/v1/pos/ventas/${id}/ticket?${queryString}`;
  },

  // ========== Reportes POS ==========

  /**
   * Obtener corte de caja por período
   * @param {Object} params - { fecha_inicio, fecha_fin, usuario_id? }
   * @returns {Promise<Object>} { resumen, totales_por_metodo, ventas_por_hora, top_productos }
   */
  obtenerCorteCaja: (params) => apiClient.get('/pos/corte-caja', { params }),

  /**
   * Obtener reporte de ventas diarias
   * @param {Object} params - { fecha, profesional_id?, usuario_id? }
   * @returns {Promise<Object>} { resumen, ventas_por_hora, top_productos, detalle }
   */
  obtenerVentasDiarias: (params) => apiClient.get('/pos/reportes/ventas-diarias', { params }),
};

// ==================== MÓDULOS ====================
export const modulosApi = {
  /**
   * Listar módulos disponibles en el sistema
   * @returns {Promise<Object>} { modulos: [...], total }
   */
  listarDisponibles: () => apiClient.get('/modulos/disponibles'),

  /**
   * Obtener módulos activos de la organización
   * @returns {Promise<Object>} { modulos_activos: {...}, modulos: {...}, organizacion_id }
   */
  obtenerActivos: () => apiClient.get('/modulos/activos'),

  /**
   * Verificar si un módulo específico está activo
   * @param {string} modulo - Nombre del módulo
   * @returns {Promise<Object>} { modulo, activo, metadata }
   */
  verificarModulo: (modulo) => apiClient.get(`/modulos/verificar/${modulo}`),

  /**
   * Activar módulo para la organización
   * @param {string} modulo - Nombre del módulo a activar
   * @returns {Promise<Object>} { modulo, activo: true, mensaje }
   */
  activarModulo: (modulo) => apiClient.put('/modulos/activar', { modulo }),

  /**
   * Desactivar módulo para la organización
   * @param {string} modulo - Nombre del módulo a desactivar
   * @returns {Promise<Object>} { modulo, activo: false, mensaje }
   */
  desactivarModulo: (modulo) => apiClient.put('/modulos/desactivar', { modulo }),
};

// ==================== UBICACIONES (Nov 2025) ====================
export const ubicacionesApi = {
  // ========== Países ==========

  /**
   * Listar todos los países activos
   * @returns {Promise<Object>} { paises: [...], total }
   */
  listarPaises: () => apiClient.get('/ubicaciones/paises'),

  /**
   * Obtener país por defecto (México)
   * @returns {Promise<Object>} País con datos completos
   */
  obtenerPaisDefault: () => apiClient.get('/ubicaciones/paises/default'),

  // ========== Estados ==========

  /**
   * Listar estados de México (shortcut)
   * @returns {Promise<Object>} { estados: [...], total, pais: 'México' }
   */
  listarEstadosMexico: () => apiClient.get('/ubicaciones/estados'),

  /**
   * Listar estados de un país específico
   * @param {number} paisId - ID del país
   * @returns {Promise<Object>} { estados: [...], total, pais_id }
   */
  listarEstadosPorPais: (paisId) => apiClient.get(`/ubicaciones/paises/${paisId}/estados`),

  /**
   * Buscar estados por nombre (autocomplete)
   * @param {string} q - Texto de búsqueda (min 2 chars)
   * @param {Object} options - { pais_id?, limite? }
   * @returns {Promise<Object>} { estados: [...], total, busqueda }
   */
  buscarEstados: (q, options = {}) =>
    apiClient.get('/ubicaciones/estados/buscar', { params: { q, ...options } }),

  /**
   * Obtener un estado por ID
   * @param {number} id - ID del estado
   * @returns {Promise<Object>} Estado con datos del país
   */
  obtenerEstado: (id) => apiClient.get(`/ubicaciones/estados/${id}`),

  // ========== Ciudades ==========

  /**
   * Listar ciudades de un estado
   * @param {number} estadoId - ID del estado
   * @param {boolean} principales - Solo ciudades principales
   * @returns {Promise<Object>} { ciudades: [...], total, estado_id }
   */
  listarCiudadesPorEstado: (estadoId, principales = false) =>
    apiClient.get(`/ubicaciones/estados/${estadoId}/ciudades`, {
      params: principales ? { principales: 'true' } : {}
    }),

  /**
   * Listar ciudades principales de México
   * @param {number} limite - Límite de resultados (default 50)
   * @returns {Promise<Object>} { ciudades: [...], total }
   */
  listarCiudadesPrincipales: (limite = 50) =>
    apiClient.get('/ubicaciones/ciudades/principales', { params: { limite } }),

  /**
   * Buscar ciudades por nombre (autocomplete)
   * @param {string} q - Texto de búsqueda (min 2 chars)
   * @param {Object} options - { estado_id?, limite? }
   * @returns {Promise<Object>} { ciudades: [...], total, busqueda }
   */
  buscarCiudades: (q, options = {}) =>
    apiClient.get('/ubicaciones/ciudades/buscar', { params: { q, ...options } }),

  /**
   * Obtener una ciudad por ID
   * @param {number} id - ID de la ciudad
   * @returns {Promise<Object>} Ciudad con estado y país
   */
  obtenerCiudad: (id) => apiClient.get(`/ubicaciones/ciudades/${id}`),

  /**
   * Obtener ubicación completa (ciudad + estado + país)
   * @param {number} ciudadId - ID de la ciudad
   * @returns {Promise<Object>} { ciudad, estado, pais, ids }
   */
  obtenerUbicacionCompleta: (ciudadId) =>
    apiClient.get(`/ubicaciones/ciudades/${ciudadId}/completa`),

  // ========== Códigos Postales ==========

  /**
   * Buscar códigos postales
   * @param {string} q - Código postal (min 3 chars)
   * @param {Object} options - { estado_id?, limite? }
   * @returns {Promise<Object>} { codigos_postales: [...], total }
   */
  buscarCodigosPostales: (q, options = {}) =>
    apiClient.get('/ubicaciones/codigos-postales/buscar', { params: { q, ...options } }),

  // ========== Utilidades ==========

  /**
   * Validar combinación de ubicación
   * @param {Object} data - { ciudad_id, estado_id, pais_id }
   * @returns {Promise<Object>} { valida: boolean }
   */
  validarUbicacion: (data) => apiClient.post('/ubicaciones/validar', data),
};

// ==================== RECORDATORIOS (Nov 2025) ====================
export const recordatoriosApi = {
  // ========== Configuración ==========

  /**
   * Obtener configuración de recordatorios de la organización
   * @returns {Promise<Object>} { habilitado, recordatorio_1_horas, plantilla_mensaje, ... }
   */
  obtenerConfiguracion: () => apiClient.get('/recordatorios/configuracion'),

  /**
   * Actualizar configuración de recordatorios
   * @param {Object} data - Campos a actualizar
   * @returns {Promise<Object>} Configuración actualizada
   */
  actualizarConfiguracion: (data) => apiClient.put('/recordatorios/configuracion', data),

  // ========== Estadísticas ==========

  /**
   * Obtener estadísticas de recordatorios
   * @param {Object} params - { fecha_desde?, fecha_hasta? }
   * @returns {Promise<Object>} { total, enviados, confirmados, tasa_confirmacion, ... }
   */
  obtenerEstadisticas: (params) => apiClient.get('/recordatorios/estadisticas', { params }),

  // ========== Historial ==========

  /**
   * Obtener historial de recordatorios de una cita
   * @param {number} citaId - ID de la cita
   * @returns {Promise<Object>} { recordatorios: [...] }
   */
  obtenerHistorial: (citaId) => apiClient.get('/recordatorios/historial', { params: { cita_id: citaId } }),

  // ========== Testing ==========

  /**
   * Enviar mensaje de prueba
   * @param {Object} data - { telefono, mensaje? }
   * @returns {Promise<Object>} { enviado: boolean, plataforma, mensaje_id }
   */
  enviarPrueba: (data) => apiClient.post('/recordatorios/test', data),
};

// ==================== STORAGE (Dic 2025 - MinIO) ====================
export const storageApi = {
  /**
   * Subir archivo
   * @param {FormData} formData - file, folder?, isPublic?, generateThumbnail?, entidadTipo?, entidadId?
   * @returns {Promise<Object>} { id, url, thumbnailUrl, bucket, path, fileName, mimeType, size, creadoEn }
   */
  upload: (formData) => apiClient.post('/storage/upload', formData),

  /**
   * Listar archivos de la organización
   * @param {Object} params - { entidadTipo?, entidadId?, limit?, offset? }
   * @returns {Promise<Object>} Array de archivos
   */
  listar: (params = {}) => apiClient.get('/storage', { params }),

  /**
   * Obtener archivo por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/storage/${id}`),

  /**
   * Obtener URL firmada (para archivos privados)
   * @param {number} id
   * @param {Object} params - { expiry? } en segundos
   * @returns {Promise<Object>} { url, expiresIn, esPublica }
   */
  obtenerPresignedUrl: (id, params = {}) => apiClient.get(`/storage/${id}/presigned`, { params }),

  /**
   * Eliminar archivo
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/storage/${id}`),

  /**
   * Obtener uso de almacenamiento
   * @returns {Promise<Object>} { totalArchivos, totalBytes, totalMb }
   */
  obtenerUso: () => apiClient.get('/storage/usage'),
};

// ==================== INVITACIONES (Nov 2025 - Sistema Profesional-Usuario) ====================
export const invitacionesApi = {
  /**
   * Validar token de invitación (público)
   * @param {string} token - Token de 64 caracteres
   * @returns {Promise<Object>} { valido, invitacion: { email, nombre_sugerido, organizacion_nombre, ... } }
   */
  validar: (token) => apiClient.get(`/invitaciones/validar/${token}`),

  /**
   * Aceptar invitación y crear usuario (público)
   * @param {string} token - Token de invitación
   * @param {Object} data - { nombre, apellidos?, password }
   * @returns {Promise<Object>} { usuario, profesional }
   */
  aceptar: (token, data) => apiClient.post(`/invitaciones/aceptar/${token}`, data),

  /**
   * Crear y enviar invitación (requiere auth)
   * @param {Object} data - { profesional_id, email, nombre_sugerido? }
   * @returns {Promise<Object>} { invitacion: { id, email, estado, expira_en } }
   */
  crear: (data) => apiClient.post('/invitaciones', data),

  /**
   * Listar invitaciones de la organización
   * @param {Object} params - { estado? }
   * @returns {Promise<Object>} { invitaciones: [...] }
   */
  listar: (params) => apiClient.get('/invitaciones', { params }),

  /**
   * Obtener invitación de un profesional
   * @param {number} profesionalId - ID del profesional
   * @returns {Promise<Object>} { invitacion }
   */
  obtenerPorProfesional: (profesionalId) => apiClient.get(`/invitaciones/profesional/${profesionalId}`),

  /**
   * Reenviar invitación
   * @param {number} id - ID de la invitación
   * @returns {Promise<Object>} { invitacion }
   */
  reenviar: (id) => apiClient.post(`/invitaciones/${id}/reenviar`),

  /**
   * Cancelar invitación
   * @param {number} id - ID de la invitación
   * @returns {Promise<Object>}
   */
  cancelar: (id) => apiClient.delete(`/invitaciones/${id}`),
};

// ==================== EVENTOS DIGITALES (Dic 2025) ====================
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
};

// ==================== CONTABILIDAD ====================
export const contabilidadApi = {
  // ========== Dashboard ==========

  /**
   * Obtener resumen del dashboard contable
   * @returns {Promise<Object>} { asientos_mes, cuentas_activas, periodo_actual, configurado }
   */
  obtenerDashboard: () => apiClient.get('/contabilidad/dashboard'),

  // ========== Cuentas Contables ==========

  /**
   * Listar cuentas contables con filtros
   * @param {Object} params - { tipo?, naturaleza?, nivel?, cuenta_padre_id?, activo?, afectable?, busqueda?, pagina?, limite? }
   * @returns {Promise<Object>} { cuentas, paginacion }
   */
  listarCuentas: (params = {}) => apiClient.get('/contabilidad/cuentas', { params }),

  /**
   * Obtener árbol jerárquico de cuentas
   * @param {Object} params - { solo_activas? }
   * @returns {Promise<Object>} { arbol }
   */
  obtenerArbolCuentas: (params = {}) => apiClient.get('/contabilidad/cuentas/arbol', { params }),

  /**
   * Obtener cuentas afectables (para selects en asientos)
   * @param {Object} params - { tipo? }
   * @returns {Promise<Object>} { cuentas }
   */
  listarCuentasAfectables: (params = {}) => apiClient.get('/contabilidad/cuentas/afectables', { params }),

  /**
   * Obtener cuenta por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerCuenta: (id) => apiClient.get(`/contabilidad/cuentas/${id}`),

  /**
   * Crear cuenta contable
   * @param {Object} data - { codigo, nombre, tipo, naturaleza, cuenta_padre_id?, codigo_sat?, afectable?, activo? }
   * @returns {Promise<Object>}
   */
  crearCuenta: (data) => apiClient.post('/contabilidad/cuentas', data),

  /**
   * Actualizar cuenta contable
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarCuenta: (id, data) => apiClient.put(`/contabilidad/cuentas/${id}`, data),

  /**
   * Eliminar cuenta (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarCuenta: (id) => apiClient.delete(`/contabilidad/cuentas/${id}`),

  /**
   * Inicializar catálogo de cuentas SAT México
   * @returns {Promise<Object>} { success, mensaje, cuentas_creadas }
   */
  inicializarCatalogoSAT: () => apiClient.post('/contabilidad/cuentas/inicializar-sat'),

  // ========== Asientos Contables ==========

  /**
   * Listar asientos con filtros
   * @param {Object} params - { estado?, tipo?, periodo_id?, fecha_desde?, fecha_hasta?, busqueda?, pagina?, limite? }
   * @returns {Promise<Object>} { asientos, paginacion }
   */
  listarAsientos: (params = {}) => apiClient.get('/contabilidad/asientos', { params }),

  /**
   * Obtener asiento por ID con movimientos
   * @param {number} id
   * @param {string} fecha - YYYY-MM-DD (requerido para tabla particionada)
   * @returns {Promise<Object>}
   */
  obtenerAsiento: (id, fecha) => apiClient.get(`/contabilidad/asientos/${id}`, { params: { fecha } }),

  /**
   * Crear asiento contable
   * @param {Object} data - { fecha, concepto, tipo?, notas?, estado?, movimientos: [...] }
   * @returns {Promise<Object>}
   */
  crearAsiento: (data) => apiClient.post('/contabilidad/asientos', data),

  /**
   * Actualizar asiento (solo en borrador)
   * @param {number} id
   * @param {string} fecha - YYYY-MM-DD
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarAsiento: (id, fecha, data) => apiClient.put(`/contabilidad/asientos/${id}`, data, { params: { fecha } }),

  /**
   * Publicar asiento
   * @param {number} id
   * @param {string} fecha - YYYY-MM-DD
   * @returns {Promise<Object>}
   */
  publicarAsiento: (id, fecha) => apiClient.post(`/contabilidad/asientos/${id}/publicar`, {}, { params: { fecha } }),

  /**
   * Anular asiento
   * @param {number} id
   * @param {string} fecha - YYYY-MM-DD
   * @param {Object} data - { motivo }
   * @returns {Promise<Object>}
   */
  anularAsiento: (id, fecha, data) => apiClient.post(`/contabilidad/asientos/${id}/anular`, data, { params: { fecha } }),

  /**
   * Eliminar asiento en borrador
   * @param {number} id
   * @param {string} fecha - YYYY-MM-DD
   * @returns {Promise<Object>}
   */
  eliminarAsiento: (id, fecha) => apiClient.delete(`/contabilidad/asientos/${id}`, { params: { fecha } }),

  // ========== Períodos Contables ==========

  /**
   * Listar períodos contables
   * @param {Object} params - { anio? }
   * @returns {Promise<Object>} { periodos }
   */
  listarPeriodos: (params = {}) => apiClient.get('/contabilidad/periodos', { params }),

  /**
   * Cerrar período contable
   * @param {number} id
   * @returns {Promise<Object>}
   */
  cerrarPeriodo: (id) => apiClient.post(`/contabilidad/periodos/${id}/cerrar`),

  // ========== Reportes Financieros ==========

  /**
   * Obtener Balanza de Comprobación
   * @param {number} periodoId
   * @returns {Promise<Object>} { periodo, cuentas, totales, cuadra }
   */
  obtenerBalanza: (periodoId) => apiClient.get('/contabilidad/reportes/balanza', { params: { periodo_id: periodoId } }),

  /**
   * Obtener Libro Mayor de una cuenta
   * @param {number} cuentaId
   * @param {string} fechaInicio - YYYY-MM-DD
   * @param {string} fechaFin - YYYY-MM-DD
   * @returns {Promise<Object>} { cuenta, movimientos, totales, saldo_final }
   */
  obtenerLibroMayor: (cuentaId, fechaInicio, fechaFin) =>
    apiClient.get('/contabilidad/reportes/libro-mayor', {
      params: { cuenta_id: cuentaId, fecha_inicio: fechaInicio, fecha_fin: fechaFin }
    }),

  /**
   * Obtener Estado de Resultados
   * @param {string} fechaInicio - YYYY-MM-DD
   * @param {string} fechaFin - YYYY-MM-DD
   * @returns {Promise<Object>} { ingresos, gastos, utilidad_neta }
   */
  obtenerEstadoResultados: (fechaInicio, fechaFin) =>
    apiClient.get('/contabilidad/reportes/estado-resultados', {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
    }),

  /**
   * Obtener Balance General
   * @param {string} fecha - YYYY-MM-DD
   * @returns {Promise<Object>} { activos, pasivos, capital, ecuacion_contable }
   */
  obtenerBalanceGeneral: (fecha) =>
    apiClient.get('/contabilidad/reportes/balance-general', { params: { fecha } }),

  // ========== Configuración ==========

  /**
   * Obtener configuración contable
   * @returns {Promise<Object>} Configuración con cuentas del sistema
   */
  obtenerConfiguracion: () => apiClient.get('/contabilidad/configuracion'),

  /**
   * Actualizar configuración contable
   * @param {Object} data - { generar_asientos_automaticos?, tasa_iva?, metodo_costeo?, cuenta_*_id? }
   * @returns {Promise<Object>}
   */
  actualizarConfiguracion: (data) => apiClient.put('/contabilidad/configuracion', data),
};

export default {
  auth: authApi,
  organizaciones: organizacionesApi,
  usuarios: usuariosApi,
  profesionales: profesionalesApi,
  servicios: serviciosApi,
  horarios: horariosApi,
  clientes: clientesApi,
  citas: citasApi,
  planes: planesApi,
  bloqueos: bloqueosApi,
  tiposBloqueo: tiposBloqueoApi,
  tiposProfesional: tiposProfesionalApi,
  whatsapp: whatsappApi,
  chatbots: chatbotsApi,
  subscripciones: subscripcionesApi,
  mercadopago: mercadopagoApi,
  comisiones: comisionesApi,
  marketplace: marketplaceApi,
  inventario: inventarioApi,
  ordenesCompra: ordenesCompraApi,
  pos: posApi,
  modulos: modulosApi,
  ubicaciones: ubicacionesApi,
  recordatorios: recordatoriosApi,
  invitaciones: invitacionesApi,
  storage: storageApi,
  eventosDigitales: eventosDigitalesApi,
  contabilidad: contabilidadApi,
};
