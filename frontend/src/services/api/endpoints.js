import apiClient from './client';

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
   * Confirmar cita
   * @param {number} id
   * @param {Object} data - Datos opcionales
   * @returns {Promise<Object>}
   */
  confirmar: (id, data = {}) => apiClient.put(`/citas/${id}/confirmar`, data),

  /**
   * Iniciar cita (cambiar a estado en_curso)
   * @param {number} id
   * @param {Object} data - Datos opcionales
   * @returns {Promise<Object>}
   */
  iniciar: (id, data = {}) => apiClient.put(`/citas/${id}/iniciar`, data),

  /**
   * Completar cita
   * @param {number} id
   * @param {Object} data - { calificacion_cliente, comentario_cliente, notas_profesional }
   * @returns {Promise<Object>}
   */
  completar: (id, data = {}) => apiClient.put(`/citas/${id}/completar`, data),

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
};
