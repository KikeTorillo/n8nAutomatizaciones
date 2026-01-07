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

  // ===== Magic Links - Dic 2025 =====

  /**
   * Solicitar magic link para login sin contraseña
   * @param {Object} data - { email }
   * @returns {Promise<Object>} { mensaje, email_enviado, expira_en }
   */
  solicitarMagicLink: (data) => apiClient.post('/auth/magic-link', data),

  /**
   * Verificar magic link y obtener tokens
   * @param {string} token - Token de 64 caracteres
   * @returns {Promise<Object>} { usuario, organizacion, accessToken, requiere_onboarding }
   */
  verificarMagicLink: (token) => apiClient.get(`/auth/magic-link/verify/${token}`),

  // ===== OAuth Google - Dic 2025 =====

  /**
   * Login/Registro con Google OAuth
   * @param {Object} data - { credential } - Token ID de Google
   * @returns {Promise<Object>} { usuario, organizacion, accessToken, es_nuevo, requiere_onboarding }
   */
  loginGoogle: (data) => apiClient.post('/auth/oauth/google', data),

  // ===== Onboarding - Dic 2025 =====

  /**
   * Obtener estado del onboarding
   * @returns {Promise<Object>} { onboarding_completado, tiene_organizacion, organizacion_id }
   */
  onboardingStatus: () => apiClient.get('/auth/onboarding/status'),

  /**
   * Completar onboarding (crear organización)
   * @param {Object} data - { nombre_negocio, industria, estado_id, ciudad_id, soy_profesional }
   * @returns {Promise<Object>} { usuario, organizacion, accessToken }
   */
  completarOnboarding: (data) => apiClient.post('/auth/onboarding/complete', data),
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

  // ========== Gestión de Usuarios Estilo Odoo - Dic 2025 ==========

  /**
   * Listar usuarios con filtros y paginación
   * @param {Object} params - { rol?, activo?, buscar?, page?, limit?, order_by?, order_direction? }
   * @returns {Promise<Object>}
   */
  listarConFiltros: (params = {}) => apiClient.get('/usuarios', { params }),

  /**
   * Crear usuario directamente (sin invitación)
   * @param {Object} data - { email, password, nombre, apellidos?, telefono?, rol?, profesional_id?, activo? }
   * @returns {Promise<Object>}
   */
  crearDirecto: (data) => apiClient.post('/usuarios/directo', data),

  /**
   * Cambiar estado activo de usuario
   * @param {number} id - ID del usuario
   * @param {boolean} activo - Nuevo estado
   * @returns {Promise<Object>}
   */
  cambiarEstado: (id, activo) => apiClient.patch(`/usuarios/${id}/estado`, { activo }),

  /**
   * Cambiar rol de usuario
   * @param {number} id - ID del usuario
   * @param {string} rol - Nuevo rol (admin, propietario, empleado)
   * @returns {Promise<Object>}
   */
  cambiarRol: (id, rol) => apiClient.patch(`/usuarios/${id}/rol`, { rol }),

  /**
   * Vincular o desvincular profesional a usuario
   * @param {number} id - ID del usuario
   * @param {number|null} profesionalId - ID del profesional o null para desvincular
   * @returns {Promise<Object>}
   */
  vincularProfesional: (id, profesionalId) =>
    apiClient.patch(`/usuarios/${id}/vincular-profesional`, { profesional_id: profesionalId }),

  /**
   * Obtener profesionales sin usuario vinculado (para selector)
   * @returns {Promise<Object>}
   */
  profesionalesDisponibles: () => apiClient.get('/usuarios/profesionales-disponibles'),

  /**
   * Obtener usuarios sin profesional vinculado (para vincular al crear profesional)
   * Dic 2025: Para flujo de crear profesional y vincular a usuario existente
   * @returns {Promise<Object>}
   */
  sinProfesional: () => apiClient.get('/usuarios/sin-profesional'),
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

  // ========== Gestión Empleados - Dic 2025 ==========

  /**
   * Listar profesionales por estado laboral
   * @param {string} estado - 'activo' | 'vacaciones' | 'incapacidad' | 'suspendido' | 'baja'
   * @param {Object} params - Filtros adicionales
   */
  listarPorEstado: (estado, params = {}) =>
    apiClient.get('/profesionales', { params: { estado, ...params } }),

  /**
   * Listar profesionales por departamento
   * @param {number} departamentoId
   * @param {Object} params - Filtros adicionales
   */
  listarPorDepartamento: (departamentoId, params = {}) =>
    apiClient.get('/profesionales', { params: { departamento_id: departamentoId, ...params } }),

  /**
   * Obtener subordinados de un profesional
   * @param {number} profesionalId
   * @param {Object} params - { directos_solo?: boolean }
   */
  obtenerSubordinados: (profesionalId, params = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/subordinados`, { params }),

  /**
   * Obtener cadena de supervisores de un profesional
   * @param {number} profesionalId
   */
  obtenerCadenaSupervisores: (profesionalId) =>
    apiClient.get(`/profesionales/${profesionalId}/supervisores`),

  /**
   * Obtener categorías de un profesional
   * @param {number} profesionalId
   */
  obtenerCategorias: (profesionalId) =>
    apiClient.get(`/profesionales/${profesionalId}/categorias`),

  /**
   * Asignar categoría a un profesional
   * @param {number} profesionalId
   * @param {number} categoriaId
   */
  asignarCategoria: (profesionalId, categoriaId) =>
    apiClient.post(`/profesionales/${profesionalId}/categorias`, { categoria_id: categoriaId }),

  /**
   * Eliminar categoría de un profesional
   * @param {number} profesionalId
   * @param {number} categoriaId
   */
  eliminarCategoria: (profesionalId, categoriaId) =>
    apiClient.delete(`/profesionales/${profesionalId}/categorias/${categoriaId}`),

  /**
   * Sincronizar categorías de un profesional (reemplaza todas)
   * @param {number} profesionalId
   * @param {Array<number>} categoriaIds - Array de IDs de categorías
   */
  sincronizarCategorias: (profesionalId, categoriaIds) =>
    apiClient.put(`/profesionales/${profesionalId}/categorias`, { categoria_ids: categoriaIds }),

  // ========== Documentos de Empleado - Enero 2026 ==========

  /**
   * Listar documentos de un profesional
   * @param {number} profesionalId
   * @param {Object} params - { tipo, verificado, estado_vencimiento, limit, offset }
   */
  listarDocumentos: (profesionalId, params = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/documentos`, { params }),

  /**
   * Subir documento de empleado
   * @param {number} profesionalId
   * @param {FormData} formData - Contiene: file, tipo_documento, nombre, descripcion, etc.
   */
  subirDocumento: (profesionalId, formData) =>
    apiClient.post(`/profesionales/${profesionalId}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  /**
   * Obtener documento por ID
   * @param {number} profesionalId
   * @param {number} documentoId
   */
  obtenerDocumento: (profesionalId, documentoId) =>
    apiClient.get(`/profesionales/${profesionalId}/documentos/${documentoId}`),

  /**
   * Actualizar metadata de documento
   * @param {number} profesionalId
   * @param {number} documentoId
   * @param {Object} data - { tipo_documento, nombre, descripcion, etc. }
   */
  actualizarDocumento: (profesionalId, documentoId, data) =>
    apiClient.put(`/profesionales/${profesionalId}/documentos/${documentoId}`, data),

  /**
   * Eliminar documento (soft delete)
   * @param {number} profesionalId
   * @param {number} documentoId
   */
  eliminarDocumento: (profesionalId, documentoId) =>
    apiClient.delete(`/profesionales/${profesionalId}/documentos/${documentoId}`),

  /**
   * Marcar documento como verificado/no verificado
   * @param {number} profesionalId
   * @param {number} documentoId
   * @param {Object} data - { verificado: boolean, notas_verificacion?: string }
   */
  verificarDocumento: (profesionalId, documentoId, data) =>
    apiClient.patch(`/profesionales/${profesionalId}/documentos/${documentoId}/verificar`, data),

  /**
   * Obtener URL firmada temporal para descargar documento
   * @param {number} profesionalId
   * @param {number} documentoId
   * @param {Object} params - { expiry?: number } (segundos, default 3600)
   */
  obtenerUrlDocumento: (profesionalId, documentoId, params = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/documentos/${documentoId}/presigned`, { params }),

  /**
   * Reemplazar archivo de documento existente
   * @param {number} profesionalId
   * @param {number} documentoId
   * @param {FormData} formData - Contiene: file
   */
  reemplazarArchivoDocumento: (profesionalId, documentoId, formData) =>
    apiClient.post(`/profesionales/${profesionalId}/documentos/${documentoId}/reemplazar-archivo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // ========== Cuentas Bancarias - Fase 1 Enero 2026 ==========

  /**
   * Listar cuentas bancarias de un profesional
   * @param {number} profesionalId
   * @param {Object} params - { uso, activo, limit, offset }
   */
  listarCuentasBancarias: (profesionalId, params = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/cuentas-bancarias`, { params }),

  /**
   * Crear cuenta bancaria
   * @param {number} profesionalId
   * @param {Object} data - { banco, numero_cuenta, clabe, tipo_cuenta, moneda, etc. }
   */
  crearCuentaBancaria: (profesionalId, data) =>
    apiClient.post(`/profesionales/${profesionalId}/cuentas-bancarias`, data),

  /**
   * Obtener cuenta bancaria por ID
   * @param {number} profesionalId
   * @param {number} cuentaId
   */
  obtenerCuentaBancaria: (profesionalId, cuentaId) =>
    apiClient.get(`/profesionales/${profesionalId}/cuentas-bancarias/${cuentaId}`),

  /**
   * Actualizar cuenta bancaria
   * @param {number} profesionalId
   * @param {number} cuentaId
   * @param {Object} data
   */
  actualizarCuentaBancaria: (profesionalId, cuentaId, data) =>
    apiClient.put(`/profesionales/${profesionalId}/cuentas-bancarias/${cuentaId}`, data),

  /**
   * Eliminar cuenta bancaria (soft delete)
   * @param {number} profesionalId
   * @param {number} cuentaId
   */
  eliminarCuentaBancaria: (profesionalId, cuentaId) =>
    apiClient.delete(`/profesionales/${profesionalId}/cuentas-bancarias/${cuentaId}`),

  /**
   * Establecer cuenta bancaria como principal
   * @param {number} profesionalId
   * @param {number} cuentaId
   */
  establecerCuentaPrincipal: (profesionalId, cuentaId) =>
    apiClient.patch(`/profesionales/${profesionalId}/cuentas-bancarias/${cuentaId}/principal`),

  // ========== Experiencia Laboral - Fase 4 Enero 2026 ==========

  /**
   * Listar experiencia laboral de un profesional
   * @param {number} profesionalId
   * @param {Object} params - { limit, offset }
   */
  listarExperiencia: (profesionalId, params = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/experiencia`, { params }),

  /**
   * Crear experiencia laboral
   * @param {number} profesionalId
   * @param {Object} data - { empresa, puesto, fecha_inicio, fecha_fin, descripcion, etc. }
   */
  crearExperiencia: (profesionalId, data) =>
    apiClient.post(`/profesionales/${profesionalId}/experiencia`, data),

  /**
   * Obtener experiencia laboral por ID
   * @param {number} profesionalId
   * @param {number} experienciaId
   */
  obtenerExperiencia: (profesionalId, experienciaId) =>
    apiClient.get(`/profesionales/${profesionalId}/experiencia/${experienciaId}`),

  /**
   * Actualizar experiencia laboral
   * @param {number} profesionalId
   * @param {number} experienciaId
   * @param {Object} data
   */
  actualizarExperiencia: (profesionalId, experienciaId, data) =>
    apiClient.put(`/profesionales/${profesionalId}/experiencia/${experienciaId}`, data),

  /**
   * Eliminar experiencia laboral (soft delete)
   * @param {number} profesionalId
   * @param {number} experienciaId
   */
  eliminarExperiencia: (profesionalId, experienciaId) =>
    apiClient.delete(`/profesionales/${profesionalId}/experiencia/${experienciaId}`),

  /**
   * Reordenar experiencia laboral
   * @param {number} profesionalId
   * @param {Object} data - { orden: [{ id, orden }] }
   */
  reordenarExperiencia: (profesionalId, data) =>
    apiClient.patch(`/profesionales/${profesionalId}/experiencia/reordenar`, data),

  /**
   * Obtener empleo actual del profesional
   * @param {number} profesionalId
   */
  obtenerEmpleoActual: (profesionalId) =>
    apiClient.get(`/profesionales/${profesionalId}/experiencia/actual`),

  // ========== Educación Formal - Fase 4 Enero 2026 ==========

  /**
   * Listar educación formal de un profesional
   * @param {number} profesionalId
   * @param {Object} params - { nivel, limit, offset }
   */
  listarEducacion: (profesionalId, params = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/educacion`, { params }),

  /**
   * Crear registro de educación formal
   * @param {number} profesionalId
   * @param {Object} data - { institucion, titulo, nivel, fecha_inicio, fecha_fin, etc. }
   */
  crearEducacion: (profesionalId, data) =>
    apiClient.post(`/profesionales/${profesionalId}/educacion`, data),

  /**
   * Obtener educación por ID
   * @param {number} profesionalId
   * @param {number} educacionId
   */
  obtenerEducacion: (profesionalId, educacionId) =>
    apiClient.get(`/profesionales/${profesionalId}/educacion/${educacionId}`),

  /**
   * Actualizar educación formal
   * @param {number} profesionalId
   * @param {number} educacionId
   * @param {Object} data
   */
  actualizarEducacion: (profesionalId, educacionId, data) =>
    apiClient.put(`/profesionales/${profesionalId}/educacion/${educacionId}`, data),

  /**
   * Eliminar educación formal (soft delete)
   * @param {number} profesionalId
   * @param {number} educacionId
   */
  eliminarEducacion: (profesionalId, educacionId) =>
    apiClient.delete(`/profesionales/${profesionalId}/educacion/${educacionId}`),

  /**
   * Reordenar educación formal
   * @param {number} profesionalId
   * @param {Object} data - { orden: [{ id, orden }] }
   */
  reordenarEducacion: (profesionalId, data) =>
    apiClient.patch(`/profesionales/${profesionalId}/educacion/reordenar`, data),

  /**
   * Obtener estudios en curso del profesional
   * @param {number} profesionalId
   */
  obtenerEducacionEnCurso: (profesionalId) =>
    apiClient.get(`/profesionales/${profesionalId}/educacion/en-curso`),

  // ========== Habilidades de Empleado - Fase 4 Enero 2026 ==========

  /**
   * Listar habilidades de un profesional
   * @param {number} profesionalId
   * @param {Object} params - { categoria, nivel, verificado, limit, offset }
   */
  listarHabilidades: (profesionalId, params = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/habilidades`, { params }),

  /**
   * Asignar habilidad a profesional
   * @param {number} profesionalId
   * @param {Object} data - { habilidad_id, nivel, anios_experiencia, notas, certificaciones }
   */
  asignarHabilidad: (profesionalId, data) =>
    apiClient.post(`/profesionales/${profesionalId}/habilidades`, data),

  /**
   * Asignar múltiples habilidades en batch
   * @param {number} profesionalId
   * @param {Object} data - { habilidades: [{ habilidad_id, nivel, anios_experiencia }] }
   */
  asignarHabilidadesBatch: (profesionalId, data) =>
    apiClient.post(`/profesionales/${profesionalId}/habilidades/batch`, data),

  /**
   * Obtener habilidad de empleado por ID
   * @param {number} profesionalId
   * @param {number} habilidadEmpleadoId
   */
  obtenerHabilidadEmpleado: (profesionalId, habilidadEmpleadoId) =>
    apiClient.get(`/profesionales/${profesionalId}/habilidades/${habilidadEmpleadoId}`),

  /**
   * Actualizar habilidad de empleado
   * @param {number} profesionalId
   * @param {number} habilidadEmpleadoId
   * @param {Object} data - { nivel, anios_experiencia, notas, certificaciones }
   */
  actualizarHabilidadEmpleado: (profesionalId, habilidadEmpleadoId, data) =>
    apiClient.put(`/profesionales/${profesionalId}/habilidades/${habilidadEmpleadoId}`, data),

  /**
   * Eliminar habilidad de empleado (soft delete)
   * @param {number} profesionalId
   * @param {number} habilidadEmpleadoId
   */
  eliminarHabilidadEmpleado: (profesionalId, habilidadEmpleadoId) =>
    apiClient.delete(`/profesionales/${profesionalId}/habilidades/${habilidadEmpleadoId}`),

  /**
   * Verificar/desverificar habilidad de empleado
   * @param {number} profesionalId
   * @param {number} habilidadEmpleadoId
   * @param {Object} data - { verificado: boolean }
   */
  verificarHabilidadEmpleado: (profesionalId, habilidadEmpleadoId, data) =>
    apiClient.patch(`/profesionales/${profesionalId}/habilidades/${habilidadEmpleadoId}/verificar`, data),

  // ========== Onboarding de Empleado - Fase 5 Enero 2026 ==========

  /**
   * Aplicar plantilla de onboarding a un profesional
   * @param {number} profesionalId
   * @param {number} plantillaId
   */
  aplicarOnboarding: (profesionalId, plantillaId) =>
    apiClient.post(`/profesionales/${profesionalId}/onboarding/aplicar`, { plantilla_id: plantillaId }),

  /**
   * Obtener progreso de onboarding de un profesional
   * @param {number} profesionalId
   * @param {Object} params - { solo_pendientes }
   */
  obtenerProgresoOnboarding: (profesionalId, params = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/onboarding/progreso`, { params }),

  /**
   * Marcar tarea de onboarding como completada/pendiente
   * @param {number} profesionalId
   * @param {number} tareaId
   * @param {Object} data - { completado, notas }
   */
  marcarTareaOnboarding: (profesionalId, tareaId, data) =>
    apiClient.patch(`/profesionales/${profesionalId}/onboarding/progreso/${tareaId}`, data),

  /**
   * Eliminar todo el progreso de onboarding de un profesional
   * @param {number} profesionalId
   */
  eliminarProgresoOnboarding: (profesionalId) =>
    apiClient.delete(`/profesionales/${profesionalId}/onboarding`),
};

// ==================== ONBOARDING DE EMPLEADOS ====================
export const onboardingEmpleadosApi = {
  // ========== Plantillas ==========

  /**
   * Listar plantillas de onboarding
   * @param {Object} params - { departamento_id, puesto_id, activo, limite, offset }
   */
  listarPlantillas: (params = {}) =>
    apiClient.get('/onboarding-empleados/plantillas', { params }),

  /**
   * Crear plantilla de onboarding
   * @param {Object} data - { nombre, descripcion, departamento_id, puesto_id, duracion_dias, activo }
   */
  crearPlantilla: (data) =>
    apiClient.post('/onboarding-empleados/plantillas', data),

  /**
   * Obtener plantilla con tareas
   * @param {number} plantillaId
   */
  obtenerPlantilla: (plantillaId) =>
    apiClient.get(`/onboarding-empleados/plantillas/${plantillaId}`),

  /**
   * Actualizar plantilla
   * @param {number} plantillaId
   * @param {Object} data
   */
  actualizarPlantilla: (plantillaId, data) =>
    apiClient.put(`/onboarding-empleados/plantillas/${plantillaId}`, data),

  /**
   * Eliminar plantilla (soft delete)
   * @param {number} plantillaId
   */
  eliminarPlantilla: (plantillaId) =>
    apiClient.delete(`/onboarding-empleados/plantillas/${plantillaId}`),

  /**
   * Obtener plantillas sugeridas para un profesional
   * @param {number} profesionalId
   */
  obtenerPlantillasSugeridas: (profesionalId) =>
    apiClient.get(`/onboarding-empleados/plantillas/sugeridas/${profesionalId}`),

  // ========== Tareas ==========

  /**
   * Crear tarea en plantilla
   * @param {number} plantillaId
   * @param {Object} data - { titulo, descripcion, responsable_tipo, dias_limite, orden, es_obligatoria, url_recurso }
   */
  crearTarea: (plantillaId, data) =>
    apiClient.post(`/onboarding-empleados/plantillas/${plantillaId}/tareas`, data),

  /**
   * Actualizar tarea
   * @param {number} tareaId
   * @param {Object} data
   */
  actualizarTarea: (tareaId, data) =>
    apiClient.put(`/onboarding-empleados/tareas/${tareaId}`, data),

  /**
   * Eliminar tarea (soft delete)
   * @param {number} tareaId
   */
  eliminarTarea: (tareaId) =>
    apiClient.delete(`/onboarding-empleados/tareas/${tareaId}`),

  /**
   * Reordenar tareas de una plantilla
   * @param {number} plantillaId
   * @param {Array} items - [{ id, orden }]
   */
  reordenarTareas: (plantillaId, items) =>
    apiClient.patch(`/onboarding-empleados/plantillas/${plantillaId}/tareas/reordenar`, { items }),

  // ========== Dashboard RRHH ==========

  /**
   * Obtener dashboard de onboarding
   * @param {Object} params - { departamento_id, estado_empleado, limite, offset }
   */
  obtenerDashboard: (params = {}) =>
    apiClient.get('/onboarding-empleados/dashboard', { params }),

  /**
   * Obtener tareas vencidas de todos los empleados
   * @param {Object} params - { solo_obligatorias, limite, offset }
   */
  obtenerTareasVencidas: (params = {}) =>
    apiClient.get('/onboarding-empleados/vencidas', { params }),
};

// ==================== CATÁLOGO DE HABILIDADES ====================
export const habilidadesApi = {
  /**
   * Listar catálogo de habilidades de la organización
   * @param {Object} params - { categoria, q, limit, offset }
   */
  listar: (params = {}) =>
    apiClient.get('/habilidades', { params }),

  /**
   * Crear habilidad en catálogo
   * @param {Object} data - { nombre, categoria, descripcion, icono, color }
   */
  crear: (data) =>
    apiClient.post('/habilidades', data),

  /**
   * Obtener habilidad del catálogo por ID
   * @param {number} habilidadId
   */
  obtener: (habilidadId) =>
    apiClient.get(`/habilidades/${habilidadId}`),

  /**
   * Actualizar habilidad del catálogo
   * @param {number} habilidadId
   * @param {Object} data - { nombre, categoria, descripcion, icono, color }
   */
  actualizar: (habilidadId, data) =>
    apiClient.put(`/habilidades/${habilidadId}`, data),

  /**
   * Eliminar habilidad del catálogo (soft delete)
   * @param {number} habilidadId
   */
  eliminar: (habilidadId) =>
    apiClient.delete(`/habilidades/${habilidadId}`),

  /**
   * Listar profesionales con una habilidad específica
   * @param {number} habilidadId
   * @param {Object} params - { nivel_minimo, verificado, limit, offset }
   */
  listarProfesionales: (habilidadId, params = {}) =>
    apiClient.get(`/habilidades/${habilidadId}/profesionales`, { params }),
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

  // ==================== CITAS RECURRENTES ====================

  /**
   * Crear serie de citas recurrentes
   * @param {Object} data - Datos de la cita + patron_recurrencia
   * @returns {Promise<Object>} { cita_serie_id, citas_creadas, citas_omitidas, estadisticas }
   */
  crearRecurrente: (data) => apiClient.post('/citas/recurrente', data),

  /**
   * Obtener todas las citas de una serie recurrente
   * @param {string} serieId - UUID de la serie
   * @param {Object} params - { incluir_canceladas: boolean }
   * @returns {Promise<Object>} Serie completa con citas y estadísticas
   */
  obtenerSerie: (serieId, params = {}) => apiClient.get(`/citas/serie/${serieId}`, { params }),

  /**
   * Cancelar todas las citas pendientes de una serie
   * @param {string} serieId - UUID de la serie
   * @param {Object} data - { motivo_cancelacion, cancelar_desde_fecha, cancelar_solo_pendientes }
   * @returns {Promise<Object>} Resumen de cancelación
   */
  cancelarSerie: (serieId, data) => apiClient.post(`/citas/serie/${serieId}/cancelar`, data),

  /**
   * Preview de fechas para serie recurrente (sin crear)
   * @param {Object} data - { fecha_inicio, hora_inicio, duracion_minutos, profesional_id, patron_recurrencia }
   * @returns {Promise<Object>} { fechas_disponibles, fechas_no_disponibles, porcentaje_disponibilidad }
   */
  previewRecurrencia: (data) => apiClient.post('/citas/recurrente/preview', data),
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
   * @param {Object} data - { nombre, descripcion?, sku?, codigo_barras?, categoria_id?, proveedor_id?, precio_compra?, precio_venta, stock_actual?, stock_minimo?, stock_maximo?, unidad_medida?, alerta_stock_minimo?, es_perecedero?, dias_vida_util?, permite_venta?, permite_uso_servicio?, notas?, activo? }
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

  // ========== Reservas de Stock (Dic 2025 - Fase 1 Gaps) ==========

  /**
   * Obtener stock disponible de un producto (stock_actual - reservas_activas)
   * @param {number} productoId
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Object>} { producto_id, stock_disponible }
   */
  obtenerStockDisponible: (productoId, params = {}) =>
    apiClient.get(`/inventario/productos/${productoId}/stock-disponible`, { params }),

  /**
   * Obtener stock disponible de múltiples productos
   * @param {Object} data - { producto_ids: [...], sucursal_id? }
   * @returns {Promise<Object>} { [producto_id]: { nombre, stock_actual, stock_disponible } }
   */
  obtenerStockDisponibleMultiple: (data) =>
    apiClient.post('/inventario/productos/stock-disponible', data),

  /**
   * Verificar si hay stock suficiente para una cantidad
   * @param {number} productoId
   * @param {Object} params - { cantidad, sucursal_id? }
   * @returns {Promise<Object>} { disponible, suficiente, faltante }
   */
  verificarDisponibilidad: (productoId, params) =>
    apiClient.get(`/inventario/productos/${productoId}/verificar-disponibilidad`, { params }),

  /**
   * Crear reserva de stock
   * @param {Object} data - { producto_id, cantidad, tipo_origen, origen_id?, sucursal_id?, minutos_expiracion? }
   * @returns {Promise<Object>} Reserva creada
   */
  crearReserva: (data) => apiClient.post('/inventario/reservas', data),

  /**
   * Crear múltiples reservas
   * @param {Object} data - { items: [{ producto_id, cantidad }], tipo_origen, origen_id?, sucursal_id? }
   * @returns {Promise<Object>} { reservas: [...] }
   */
  crearReservasMultiple: (data) => apiClient.post('/inventario/reservas/multiple', data),

  /**
   * Listar reservas con filtros
   * @param {Object} params - { estado?, producto_id?, sucursal_id?, tipo_origen?, origen_id?, limit?, offset? }
   * @returns {Promise<Object>} { reservas: [...] }
   */
  listarReservas: (params = {}) => apiClient.get('/inventario/reservas', { params }),

  /**
   * Obtener reserva por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerReserva: (id) => apiClient.get(`/inventario/reservas/${id}`),

  /**
   * Confirmar reserva (descuenta stock real)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  confirmarReserva: (id) => apiClient.patch(`/inventario/reservas/${id}/confirmar`),

  /**
   * Confirmar múltiples reservas
   * @param {Object} data - { reserva_ids: [...] }
   * @returns {Promise<Object>} { confirmadas: [...], total }
   */
  confirmarReservasMultiple: (data) => apiClient.post('/inventario/reservas/confirmar-multiple', data),

  /**
   * Extender tiempo de expiración de una reserva
   * @param {number} id
   * @param {Object} data - { minutos_adicionales? }
   * @returns {Promise<Object>}
   */
  extenderReserva: (id, data = {}) => apiClient.patch(`/inventario/reservas/${id}/extender`, data),

  /**
   * Cancelar reserva individual
   * @param {number} id
   * @returns {Promise<Object>}
   */
  cancelarReserva: (id) => apiClient.delete(`/inventario/reservas/${id}`),

  /**
   * Cancelar reservas por origen
   * @param {string} tipoOrigen - 'venta_pos' | 'orden_venta' | 'cita_servicio' | 'transferencia'
   * @param {number} origenId
   * @returns {Promise<Object>} { canceladas: [...], total }
   */
  cancelarReservasPorOrigen: (tipoOrigen, origenId) =>
    apiClient.delete(`/inventario/reservas/origen/${tipoOrigen}/${origenId}`),

  // ========== Ubicaciones de Almacén WMS (Dic 2025 - Fase 3 Gaps) ==========

  /**
   * Crear nueva ubicación de almacén
   * @param {Object} data - { sucursal_id, codigo, nombre?, tipo, parent_id?, capacidad_maxima?, es_picking?, es_recepcion?, ... }
   * @returns {Promise<Object>} Ubicación creada
   */
  crearUbicacion: (data) => apiClient.post('/inventario/ubicaciones', data),

  /**
   * Obtener ubicación por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerUbicacion: (id) => apiClient.get(`/inventario/ubicaciones/${id}`),

  /**
   * Listar ubicaciones con filtros
   * @param {Object} params - { sucursal_id?, tipo?, parent_id?, es_picking?, es_recepcion?, activo?, bloqueada?, busqueda?, limit?, offset? }
   * @returns {Promise<Object>} { ubicaciones, total }
   */
  listarUbicaciones: (params = {}) => apiClient.get('/inventario/ubicaciones', { params }),

  /**
   * Obtener árbol jerárquico de ubicaciones de una sucursal
   * @param {number} sucursalId
   * @returns {Promise<Array>} Árbol de ubicaciones
   */
  obtenerArbolUbicaciones: (sucursalId) => apiClient.get(`/inventario/ubicaciones/arbol/${sucursalId}`),

  /**
   * Actualizar ubicación
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarUbicacion: (id, data) => apiClient.put(`/inventario/ubicaciones/${id}`, data),

  /**
   * Eliminar ubicación (solo si no tiene stock ni sub-ubicaciones)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarUbicacion: (id) => apiClient.delete(`/inventario/ubicaciones/${id}`),

  /**
   * Bloquear/Desbloquear ubicación
   * @param {number} id
   * @param {Object} data - { bloqueada: boolean, motivo_bloqueo?: string }
   * @returns {Promise<Object>}
   */
  toggleBloqueoUbicacion: (id, data) => apiClient.patch(`/inventario/ubicaciones/${id}/bloquear`, data),

  /**
   * Obtener stock de una ubicación
   * @param {number} id
   * @returns {Promise<Array>} Productos en la ubicación
   */
  obtenerStockUbicacion: (id) => apiClient.get(`/inventario/ubicaciones/${id}/stock`),

  /**
   * Agregar stock a una ubicación
   * @param {number} ubicacionId
   * @param {Object} data - { producto_id, cantidad, lote?, fecha_vencimiento? }
   * @returns {Promise<Object>}
   */
  agregarStockUbicacion: (ubicacionId, data) => apiClient.post(`/inventario/ubicaciones/${ubicacionId}/stock`, data),

  /**
   * Mover stock entre ubicaciones
   * @param {Object} data - { producto_id, ubicacion_origen_id, ubicacion_destino_id, cantidad, lote? }
   * @returns {Promise<Object>}
   */
  moverStockUbicacion: (data) => apiClient.post('/inventario/ubicaciones/mover-stock', data),

  /**
   * Obtener ubicaciones disponibles para almacenar
   * @param {number} sucursalId
   * @param {Object} params - { cantidad? }
   * @returns {Promise<Array>}
   */
  obtenerUbicacionesDisponibles: (sucursalId, params = {}) => apiClient.get(`/inventario/ubicaciones/disponibles/${sucursalId}`, { params }),

  /**
   * Obtener estadísticas de ubicaciones de una sucursal
   * @param {number} sucursalId
   * @returns {Promise<Object>}
   */
  obtenerEstadisticasUbicaciones: (sucursalId) => apiClient.get(`/inventario/ubicaciones/estadisticas/${sucursalId}`),

  /**
   * Obtener ubicaciones donde está un producto
   * @param {number} productoId
   * @returns {Promise<Array>}
   */
  obtenerUbicacionesProducto: (productoId) => apiClient.get(`/inventario/productos/${productoId}/ubicaciones`),

  // ========== Valoracion FIFO/AVCO (Dic 2025 - Gap Alta Prioridad) ==========

  /**
   * Obtener configuracion de valoracion de la organizacion
   * @returns {Promise<Object>} { metodo_valoracion, incluir_gastos_envio, redondeo_decimales }
   */
  obtenerConfiguracionValoracion: () => apiClient.get('/inventario/valoracion/configuracion'),

  /**
   * Actualizar configuracion de valoracion
   * @param {Object} data - { metodo_valoracion?, incluir_gastos_envio?, redondeo_decimales? }
   * @returns {Promise<Object>}
   */
  actualizarConfiguracionValoracion: (data) => apiClient.put('/inventario/valoracion/configuracion', data),

  /**
   * Obtener resumen comparativo de todos los metodos para dashboard
   * @returns {Promise<Object>} { metodo_configurado, promedio, fifo, avco, comparativa }
   */
  obtenerResumenValoracion: () => apiClient.get('/inventario/valoracion/resumen'),

  /**
   * Obtener valor total del inventario segun metodo
   * @param {Object} params - { metodo?: 'fifo'|'avco'|'promedio', categoria_id?, sucursal_id? }
   * @returns {Promise<Object>}
   */
  obtenerValorTotal: (params = {}) => apiClient.get('/inventario/valoracion/total', { params }),

  /**
   * Comparar valoracion de productos por los 3 metodos
   * @param {Object} params - { producto_id? } - Opcional, para un producto especifico
   * @returns {Promise<Array>}
   */
  obtenerComparativaValoracion: (params = {}) => apiClient.get('/inventario/valoracion/comparativa', { params }),

  /**
   * Reporte de valoracion agrupado por categorias
   * @param {Object} params - { metodo? }
   * @returns {Promise<Array>}
   */
  obtenerReporteValoracionCategorias: (params = {}) => apiClient.get('/inventario/valoracion/reporte/categorias', { params }),

  /**
   * Productos con mayor diferencia entre metodos
   * @param {Object} params - { limite?: number }
   * @returns {Promise<Array>}
   */
  obtenerReporteDiferenciasValoracion: (params = {}) => apiClient.get('/inventario/valoracion/reporte/diferencias', { params }),

  /**
   * Valoracion detallada de un producto con todos los metodos
   * @param {number} productoId
   * @returns {Promise<Object>}
   */
  obtenerValoracionProducto: (productoId) => apiClient.get(`/inventario/valoracion/producto/${productoId}`),

  /**
   * Valoracion FIFO de un producto
   * @param {number} productoId
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Object>}
   */
  obtenerValoracionFIFO: (productoId, params = {}) => apiClient.get(`/inventario/valoracion/producto/${productoId}/fifo`, { params }),

  /**
   * Valoracion AVCO de un producto
   * @param {number} productoId
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Object>}
   */
  obtenerValoracionAVCO: (productoId, params = {}) => apiClient.get(`/inventario/valoracion/producto/${productoId}/avco`, { params }),

  /**
   * Capas de inventario FIFO detalladas con trazabilidad
   * @param {number} productoId
   * @returns {Promise<Array>}
   */
  obtenerCapasFIFO: (productoId) => apiClient.get(`/inventario/valoracion/producto/${productoId}/capas`),

  // ========== Numeros de Serie / Lotes (Dic 2025 - Gap Media Prioridad) ==========

  /**
   * Listar numeros de serie con filtros
   * @param {Object} params - { producto_id?, sucursal_id?, ubicacion_id?, estado?, lote?, fecha_vencimiento_desde?, fecha_vencimiento_hasta?, busqueda?, page?, limit? }
   * @returns {Promise<Object>}
   */
  listarNumerosSerie: (params = {}) => apiClient.get('/inventario/numeros-serie', { params }),

  /**
   * Buscar numeros de serie
   * @param {string} termino
   * @returns {Promise<Array>}
   */
  buscarNumeroSerie: (termino) => apiClient.get('/inventario/numeros-serie/buscar', { params: { q: termino } }),

  /**
   * Obtener numero de serie por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerNumeroSerie: (id) => apiClient.get(`/inventario/numeros-serie/${id}`),

  /**
   * Obtener historial de movimientos de un numero de serie
   * @param {number} id
   * @returns {Promise<Array>}
   */
  obtenerHistorialNumeroSerie: (id) => apiClient.get(`/inventario/numeros-serie/${id}/historial`),

  /**
   * Crear numero de serie individual
   * @param {Object} data - { producto_id, numero_serie, lote?, fecha_vencimiento?, sucursal_id?, ubicacion_id?, costo_unitario?, proveedor_id?, orden_compra_id?, notas? }
   * @returns {Promise<Object>}
   */
  crearNumeroSerie: (data) => apiClient.post('/inventario/numeros-serie', data),

  /**
   * Crear multiples numeros de serie (recepcion masiva)
   * @param {Object} data - { items: [...] }
   * @returns {Promise<Object>}
   */
  crearNumerosSerieMultiple: (data) => apiClient.post('/inventario/numeros-serie/bulk', data),

  /**
   * Obtener numeros de serie disponibles de un producto
   * @param {number} productoId
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Array>}
   */
  obtenerNumerosSerieDisponibles: (productoId, params = {}) => apiClient.get(`/inventario/numeros-serie/producto/${productoId}/disponibles`, { params }),

  /**
   * Obtener resumen de numeros de serie por producto
   * @param {number} productoId
   * @returns {Promise<Array>}
   */
  obtenerResumenNumeroSerieProducto: (productoId) => apiClient.get(`/inventario/numeros-serie/producto/${productoId}/resumen`),

  /**
   * Obtener productos que requieren numero de serie
   * @returns {Promise<Array>}
   */
  obtenerProductosConSerie: () => apiClient.get('/inventario/numeros-serie/productos-con-serie'),

  /**
   * Obtener estadisticas generales de numeros de serie
   * @returns {Promise<Object>}
   */
  obtenerEstadisticasNumerosSerie: () => apiClient.get('/inventario/numeros-serie/estadisticas'),

  /**
   * Obtener numeros de serie proximos a vencer
   * @param {number} dias
   * @returns {Promise<Array>}
   */
  obtenerProximosVencer: (dias = 30) => apiClient.get('/inventario/numeros-serie/proximos-vencer', { params: { dias } }),

  /**
   * Verificar si existe un numero de serie
   * @param {number} productoId
   * @param {string} numeroSerie
   * @returns {Promise<Object>}
   */
  verificarExistenciaNumeroSerie: (productoId, numeroSerie) => apiClient.get('/inventario/numeros-serie/existe', { params: { producto_id: productoId, numero_serie: numeroSerie } }),

  /**
   * Vender numero de serie
   * @param {number} id
   * @param {Object} data - { venta_id, cliente_id? }
   * @returns {Promise<Object>}
   */
  venderNumeroSerie: (id, data) => apiClient.post(`/inventario/numeros-serie/${id}/vender`, data),

  /**
   * Transferir numero de serie
   * @param {number} id
   * @param {Object} data - { sucursal_destino_id, ubicacion_destino_id?, notas? }
   * @returns {Promise<Object>}
   */
  transferirNumeroSerie: (id, data) => apiClient.post(`/inventario/numeros-serie/${id}/transferir`, data),

  /**
   * Devolver numero de serie
   * @param {number} id
   * @param {Object} data - { sucursal_id, ubicacion_id?, motivo }
   * @returns {Promise<Object>}
   */
  devolverNumeroSerie: (id, data) => apiClient.post(`/inventario/numeros-serie/${id}/devolver`, data),

  /**
   * Marcar numero de serie como defectuoso
   * @param {number} id
   * @param {Object} data - { motivo }
   * @returns {Promise<Object>}
   */
  marcarNumeroSerieDefectuoso: (id, data) => apiClient.post(`/inventario/numeros-serie/${id}/defectuoso`, data),

  /**
   * Reservar numero de serie
   * @param {number} id
   * @param {Object} data - { notas? }
   * @returns {Promise<Object>}
   */
  reservarNumeroSerie: (id, data = {}) => apiClient.post(`/inventario/numeros-serie/${id}/reservar`, data),

  /**
   * Liberar reserva de numero de serie
   * @param {number} id
   * @returns {Promise<Object>}
   */
  liberarReservaNumeroSerie: (id) => apiClient.post(`/inventario/numeros-serie/${id}/liberar`),

  /**
   * Actualizar garantia de numero de serie
   * @param {number} id
   * @param {Object} data - { tiene_garantia, fecha_inicio_garantia?, fecha_fin_garantia? }
   * @returns {Promise<Object>}
   */
  actualizarGarantiaNumeroSerie: (id, data) => apiClient.put(`/inventario/numeros-serie/${id}/garantia`, data),

  // ========== Rutas de Operación (Dic 2025 - Gap Inventario Avanzado) ==========

  /**
   * Crear rutas por defecto para la organización
   * @returns {Promise<Object>} { rutas: [...] }
   */
  inicializarRutas: () => apiClient.post('/inventario/rutas-operacion/init'),

  /**
   * Listar rutas de operación
   * @param {Object} params - { tipo?, activo? }
   * @returns {Promise<Object>} { rutas: [...] }
   */
  listarRutas: (params = {}) => apiClient.get('/inventario/rutas-operacion', { params }),

  /**
   * Crear ruta de operación
   * @param {Object} data - { codigo, nombre, descripcion?, tipo, prioridad?, sucursal_origen_id?, proveedor_default_id?, lead_time_dias?, activo?, es_default? }
   * @returns {Promise<Object>}
   */
  crearRuta: (data) => apiClient.post('/inventario/rutas-operacion', data),

  /**
   * Obtener ruta por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerRuta: (id) => apiClient.get(`/inventario/rutas-operacion/${id}`),

  /**
   * Actualizar ruta
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarRuta: (id, data) => apiClient.put(`/inventario/rutas-operacion/${id}`, data),

  /**
   * Eliminar ruta
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarRuta: (id) => apiClient.delete(`/inventario/rutas-operacion/${id}`),

  /**
   * Obtener rutas asignadas a un producto
   * @param {number} productoId
   * @returns {Promise<Array>}
   */
  obtenerRutasProducto: (productoId) => apiClient.get(`/inventario/productos/${productoId}/rutas`),

  /**
   * Asignar ruta a producto
   * @param {number} productoId
   * @param {Object} data - { ruta_id, prioridad?, sucursal_id? }
   * @returns {Promise<Object>}
   */
  asignarRutaProducto: (productoId, data) => apiClient.post(`/inventario/productos/${productoId}/rutas`, data),

  /**
   * Quitar ruta de producto
   * @param {number} productoId
   * @param {number} rutaId
   * @returns {Promise<Object>}
   */
  quitarRutaProducto: (productoId, rutaId) => apiClient.delete(`/inventario/productos/${productoId}/rutas/${rutaId}`),

  /**
   * Obtener mejor ruta para un producto
   * @param {number} productoId
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Object>}
   */
  obtenerMejorRuta: (productoId, params = {}) => apiClient.get(`/inventario/productos/${productoId}/mejor-ruta`, { params }),

  // ========== Reglas de Reabastecimiento ==========

  /**
   * Listar reglas de reabastecimiento
   * @param {Object} params - { activo?, tipo_trigger? }
   * @returns {Promise<Object>} { reglas: [...] }
   */
  listarReglasReabastecimiento: (params = {}) => apiClient.get('/inventario/reglas-reabastecimiento', { params }),

  /**
   * Crear regla de reabastecimiento
   * @param {Object} data - { nombre, descripcion?, tipo_trigger, condicion, acciones, activo? }
   * @returns {Promise<Object>}
   */
  crearReglaReabastecimiento: (data) => apiClient.post('/inventario/reglas-reabastecimiento', data),

  /**
   * Obtener regla por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerReglaReabastecimiento: (id) => apiClient.get(`/inventario/reglas-reabastecimiento/${id}`),

  /**
   * Actualizar regla
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarReglaReabastecimiento: (id, data) => apiClient.put(`/inventario/reglas-reabastecimiento/${id}`, data),

  /**
   * Eliminar regla
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarReglaReabastecimiento: (id) => apiClient.delete(`/inventario/reglas-reabastecimiento/${id}`),

  // ========== Transferencias entre Sucursales ==========

  /**
   * Listar solicitudes de transferencia
   * @param {Object} params - { estado?, sucursal_origen_id?, sucursal_destino_id? }
   * @returns {Promise<Object>} { transferencias: [...] }
   */
  listarTransferencias: (params = {}) => apiClient.get('/inventario/transferencias', { params }),

  /**
   * Crear solicitud de transferencia
   * @param {Object} data - { sucursal_origen_id, sucursal_destino_id, items: [{ producto_id, cantidad }], notas? }
   * @returns {Promise<Object>}
   */
  crearTransferencia: (data) => apiClient.post('/inventario/transferencias', data),

  /**
   * Obtener transferencia con items
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerTransferencia: (id) => apiClient.get(`/inventario/transferencias/${id}`),

  /**
   * Aprobar solicitud de transferencia
   * @param {number} id
   * @returns {Promise<Object>}
   */
  aprobarTransferencia: (id) => apiClient.post(`/inventario/transferencias/${id}/aprobar`),

  /**
   * Rechazar solicitud de transferencia
   * @param {number} id
   * @param {Object} data - { motivo? }
   * @returns {Promise<Object>}
   */
  rechazarTransferencia: (id, data = {}) => apiClient.post(`/inventario/transferencias/${id}/rechazar`, data),

  /**
   * Marcar transferencia como enviada
   * @param {number} id
   * @returns {Promise<Object>}
   */
  enviarTransferencia: (id) => apiClient.post(`/inventario/transferencias/${id}/enviar`),

  /**
   * Marcar transferencia como recibida
   * @param {number} id
   * @returns {Promise<Object>}
   */
  recibirTransferencia: (id) => apiClient.post(`/inventario/transferencias/${id}/recibir`),

  // ========== Atributos de Producto (Variantes) ==========

  /**
   * Listar atributos de producto
   * @param {Object} params - { incluir_inactivos? }
   * @returns {Promise<Object>}
   */
  listarAtributos: (params = {}) => apiClient.get('/inventario/atributos', { params }),

  /**
   * Obtener atributo por ID con valores
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerAtributo: (id) => apiClient.get(`/inventario/atributos/${id}`),

  /**
   * Crear atributo
   * @param {Object} data - { nombre, codigo, tipo_visualizacion?, orden? }
   * @returns {Promise<Object>}
   */
  crearAtributo: (data) => apiClient.post('/inventario/atributos', data),

  /**
   * Actualizar atributo
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarAtributo: (id, data) => apiClient.put(`/inventario/atributos/${id}`, data),

  /**
   * Eliminar atributo
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarAtributo: (id) => apiClient.delete(`/inventario/atributos/${id}`),

  /**
   * Crear atributos por defecto (Color, Talla)
   * @returns {Promise<Object>}
   */
  crearAtributosDefecto: () => apiClient.post('/inventario/atributos/defecto'),

  /**
   * Agregar valor a atributo
   * @param {number} atributoId
   * @param {Object} data - { valor, codigo, color_hex?, orden? }
   * @returns {Promise<Object>}
   */
  agregarValorAtributo: (atributoId, data) => apiClient.post(`/inventario/atributos/${atributoId}/valores`, data),

  /**
   * Actualizar valor de atributo
   * @param {number} valorId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarValor: (valorId, data) => apiClient.put(`/inventario/valores/${valorId}`, data),

  /**
   * Eliminar valor de atributo
   * @param {number} valorId
   * @returns {Promise<Object>}
   */
  eliminarValor: (valorId) => apiClient.delete(`/inventario/valores/${valorId}`),

  // ========== Variantes de Producto ==========

  /**
   * Listar variantes de un producto
   * @param {number} productoId
   * @returns {Promise<Object>}
   */
  listarVariantes: (productoId) => apiClient.get(`/inventario/productos/${productoId}/variantes`),

  /**
   * Obtener variante por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerVariante: (id) => apiClient.get(`/inventario/variantes/${id}`),

  /**
   * Buscar variante por SKU o codigo de barras
   * @param {string} termino
   * @returns {Promise<Object>}
   */
  buscarVariante: (termino) => apiClient.get('/inventario/variantes/buscar', { params: { termino } }),

  /**
   * Obtener resumen de stock por variantes
   * @param {number} productoId
   * @returns {Promise<Object>}
   */
  obtenerResumenVariantes: (productoId) => apiClient.get(`/inventario/productos/${productoId}/variantes/resumen`),

  /**
   * Crear variante individual
   * @param {number} productoId
   * @param {Object} data - { nombre_variante, sku?, codigo_barras?, precio_compra?, precio_venta?, stock_actual?, atributos? }
   * @returns {Promise<Object>}
   */
  crearVariante: (productoId, data) => apiClient.post(`/inventario/productos/${productoId}/variantes`, data),

  /**
   * Generar variantes automaticamente
   * @param {number} productoId
   * @param {Object} data - { atributos: [{ atributo_id, valores: [] }], opciones?: { sku_base?, precio_venta?, precio_compra? } }
   * @returns {Promise<Object>}
   */
  generarVariantes: (productoId, data) => apiClient.post(`/inventario/productos/${productoId}/variantes/generar`, data),

  /**
   * Actualizar variante
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarVariante: (id, data) => apiClient.put(`/inventario/variantes/${id}`, data),

  /**
   * Ajustar stock de variante
   * @param {number} id
   * @param {Object} data - { cantidad, tipo, motivo? }
   * @returns {Promise<Object>}
   */
  ajustarStockVariante: (id, data) => apiClient.patch(`/inventario/variantes/${id}/stock`, data),

  /**
   * Eliminar variante
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarVariante: (id) => apiClient.delete(`/inventario/variantes/${id}`),

  // ========== Inventory at Date - Snapshots (Dic 2025) ==========

  /**
   * Listar snapshots disponibles
   * @param {Object} params - { limit?, offset? }
   * @returns {Promise<Object>} { snapshots[] }
   */
  listarSnapshots: (params = {}) => apiClient.get('/inventario/snapshots', { params }),

  /**
   * Obtener fechas disponibles para selector
   * @returns {Promise<Object>} { fechas[] }
   */
  obtenerFechasDisponibles: () => apiClient.get('/inventario/snapshots/fechas'),

  /**
   * Generar snapshot manualmente
   * @param {Object} data - { fecha?, descripcion? }
   * @returns {Promise<Object>}
   */
  generarSnapshot: (data = {}) => apiClient.post('/inventario/snapshots', data),

  /**
   * Obtener historico de stock de un producto para grafico de pronostico
   * @param {number} productoId - ID del producto
   * @param {Object} params - { dias? } (default: 30)
   * @returns {Promise<Object>} { snapshots[], producto, oc_pendientes[], proyeccion[], metricas }
   */
  obtenerHistoricoProducto: (productoId, params = {}) =>
    apiClient.get(`/inventario/snapshots/historico/${productoId}`, { params }),

  /**
   * Consultar stock en fecha especifica
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @param {Object} params - { producto_id?, categoria_id?, solo_con_stock?, limit?, offset? }
   * @returns {Promise<Object>} { fecha, productos[], totales }
   */
  obtenerStockEnFecha: (fecha, params = {}) => apiClient.get('/inventario/at-date', { params: { fecha, ...params } }),

  /**
   * Comparar inventario entre dos fechas
   * @param {string} fechaDesde - Fecha inicial YYYY-MM-DD
   * @param {string} fechaHasta - Fecha final YYYY-MM-DD
   * @param {boolean} soloCambios - Solo productos con cambios (default: true)
   * @returns {Promise<Object>} { fecha_desde, fecha_hasta, productos[], resumen }
   */
  compararInventario: (fechaDesde, fechaHasta, soloCambios = true) =>
    apiClient.get('/inventario/comparar', { params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta, solo_cambios: soloCambios } }),
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

  // ========== Auto-generación de OC (Dic 2025 - Fase 2 Gaps) ==========

  /**
   * Obtener sugerencias de OC (productos con stock bajo)
   * @returns {Promise<Object>} { productos: [...] }
   */
  obtenerSugerenciasOC: () => apiClient.get('/inventario/ordenes-compra/sugerencias'),

  /**
   * Generar OC desde un producto con stock bajo
   * @param {number} productoId
   * @returns {Promise<Object>} Orden de compra creada
   */
  generarOCDesdeProducto: (productoId) => apiClient.post(`/inventario/ordenes-compra/generar-desde-producto/${productoId}`),

  /**
   * Generar OCs automáticas para todos los productos con stock bajo
   * @returns {Promise<Object>} { ordenes_creadas, errores }
   */
  autoGenerarOCs: () => apiClient.post('/inventario/ordenes-compra/auto-generar'),

  // ========== Ubicaciones de Almacén - WMS (Dic 2025 - Fase 3 Gaps) ==========

  /**
   * Crear nueva ubicación de almacén
   * @param {Object} data - { sucursal_id, codigo, nombre?, tipo, parent_id?, capacidad_maxima?, es_picking?, es_recepcion?, ... }
   * @returns {Promise<Object>} Ubicación creada
   */
  crearUbicacion: (data) => apiClient.post('/inventario/ubicaciones', data),

  /**
   * Obtener ubicación por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerUbicacion: (id) => apiClient.get(`/inventario/ubicaciones/${id}`),

  /**
   * Listar ubicaciones con filtros
   * @param {Object} params - { sucursal_id?, tipo?, parent_id?, es_picking?, es_recepcion?, activo?, bloqueada?, busqueda?, limit?, offset? }
   * @returns {Promise<Object>} { ubicaciones, total }
   */
  listarUbicaciones: (params = {}) => apiClient.get('/inventario/ubicaciones', { params }),

  /**
   * Obtener árbol jerárquico de ubicaciones de una sucursal
   * @param {number} sucursalId
   * @returns {Promise<Array>} Árbol de ubicaciones
   */
  obtenerArbolUbicaciones: (sucursalId) => apiClient.get(`/inventario/ubicaciones/arbol/${sucursalId}`),

  /**
   * Actualizar ubicación
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarUbicacion: (id, data) => apiClient.put(`/inventario/ubicaciones/${id}`, data),

  /**
   * Eliminar ubicación (solo si no tiene stock ni sub-ubicaciones)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarUbicacion: (id) => apiClient.delete(`/inventario/ubicaciones/${id}`),

  /**
   * Bloquear/Desbloquear ubicación
   * @param {number} id
   * @param {Object} data - { bloqueada: boolean, motivo_bloqueo?: string }
   * @returns {Promise<Object>}
   */
  toggleBloqueoUbicacion: (id, data) => apiClient.patch(`/inventario/ubicaciones/${id}/bloquear`, data),

  /**
   * Obtener stock de una ubicación
   * @param {number} id
   * @returns {Promise<Array>} Productos en la ubicación
   */
  obtenerStockUbicacion: (id) => apiClient.get(`/inventario/ubicaciones/${id}/stock`),

  /**
   * Agregar stock a una ubicación
   * @param {number} ubicacionId
   * @param {Object} data - { producto_id, cantidad, lote?, fecha_vencimiento? }
   * @returns {Promise<Object>}
   */
  agregarStockUbicacion: (ubicacionId, data) => apiClient.post(`/inventario/ubicaciones/${ubicacionId}/stock`, data),

  /**
   * Mover stock entre ubicaciones
   * @param {Object} data - { producto_id, ubicacion_origen_id, ubicacion_destino_id, cantidad, lote? }
   * @returns {Promise<Object>}
   */
  moverStockUbicacion: (data) => apiClient.post('/inventario/ubicaciones/mover-stock', data),

  /**
   * Obtener ubicaciones disponibles para almacenar
   * @param {number} sucursalId
   * @param {Object} params - { cantidad? }
   * @returns {Promise<Array>}
   */
  obtenerUbicacionesDisponibles: (sucursalId, params = {}) => apiClient.get(`/inventario/ubicaciones/disponibles/${sucursalId}`, { params }),

  /**
   * Obtener estadísticas de ubicaciones de una sucursal
   * @param {number} sucursalId
   * @returns {Promise<Object>}
   */
  obtenerEstadisticasUbicaciones: (sucursalId) => apiClient.get(`/inventario/ubicaciones/estadisticas/${sucursalId}`),

  /**
   * Obtener ubicaciones donde está un producto
   * @param {number} productoId
   * @returns {Promise<Array>}
   */
  obtenerUbicacionesProducto: (productoId) => apiClient.get(`/inventario/productos/${productoId}/ubicaciones`),
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
    return `/api/v1/pos/ventas/${id}/ticket?${queryString}`;
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
  obtenerSitioPublico: (slug) => {
    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' }
    });
    return publicAxios.get(`/public/sitio/${slug}`);
  },

  /**
   * Obtener página pública
   * @param {string} slug - Slug del sitio
   * @param {string} pagina - Slug de la página
   * @returns {Promise<Object>}
   */
  obtenerPaginaPublica: (slug, pagina) => {
    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' }
    });
    return publicAxios.get(`/public/sitio/${slug}/${pagina}`);
  },

  /**
   * Enviar formulario de contacto
   * @param {string} slug
   * @param {Object} data - { nombre, email, telefono?, mensaje? }
   * @returns {Promise<Object>}
   */
  enviarContacto: (slug, data) => {
    const publicAxios = axios.create({
      baseURL: '/api/v1',
      headers: { 'Content-Type': 'application/json' }
    });
    return publicAxios.post(`/public/sitio/${slug}/contacto`, data);
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

// ==================== SUCURSALES ====================
export const sucursalesApi = {
  // ========== CRUD Sucursales ==========

  /**
   * Listar sucursales con filtros
   * @param {Object} params - { activo, es_matriz, ciudad_id }
   * @returns {Promise<Object>} { sucursales }
   */
  listar: (params = {}) => apiClient.get('/sucursales', { params }),

  /**
   * Obtener sucursal por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/sucursales/${id}`),

  /**
   * Obtener sucursal matriz de la organización
   * @returns {Promise<Object>}
   */
  obtenerMatriz: () => apiClient.get('/sucursales/matriz'),

  /**
   * Obtener sucursales asignadas a un usuario
   * @param {number} usuarioId
   * @returns {Promise<Object>}
   */
  obtenerPorUsuario: (usuarioId) => apiClient.get(`/sucursales/usuario/${usuarioId}`),

  /**
   * Crear nueva sucursal
   * @param {Object} data - { nombre, codigo?, direccion?, estado_id?, ciudad_id?, ... }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/sucursales', data),

  /**
   * Actualizar sucursal
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/sucursales/${id}`, data),

  /**
   * Eliminar sucursal (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/sucursales/${id}`),

  // ========== Métricas Dashboard ==========

  /**
   * Obtener métricas consolidadas para dashboard multi-sucursal
   * @param {Object} params - { sucursal_id?, fecha_desde?, fecha_hasta? }
   * @returns {Promise<Object>} { ventas, citas, comparativaSucursales, tendencia, transferencias }
   */
  obtenerMetricas: (params = {}) => apiClient.get('/sucursales/metricas', { params }),

  // ========== Usuarios de Sucursal ==========

  /**
   * Obtener usuarios asignados a una sucursal
   * @param {number} sucursalId
   * @returns {Promise<Object>}
   */
  obtenerUsuarios: (sucursalId) => apiClient.get(`/sucursales/${sucursalId}/usuarios`),

  /**
   * Asignar usuario a sucursal
   * @param {number} sucursalId
   * @param {Object} data - { usuario_id, es_gerente?, rol_sucursal?, activo? }
   * @returns {Promise<Object>}
   */
  asignarUsuario: (sucursalId, data) => apiClient.post(`/sucursales/${sucursalId}/usuarios`, data),

  // ========== Profesionales de Sucursal ==========

  /**
   * Obtener profesionales asignados a una sucursal
   * @param {number} sucursalId
   * @returns {Promise<Object>}
   */
  obtenerProfesionales: (sucursalId) => apiClient.get(`/sucursales/${sucursalId}/profesionales`),

  /**
   * Asignar profesional a sucursal
   * @param {number} sucursalId
   * @param {Object} data - { profesional_id, horarios_personalizados?, activo? }
   * @returns {Promise<Object>}
   */
  asignarProfesional: (sucursalId, data) => apiClient.post(`/sucursales/${sucursalId}/profesionales`, data),

  // ========== Transferencias de Stock ==========

  /**
   * Listar transferencias de stock
   * @param {Object} params - { estado?, sucursal_origen_id?, sucursal_destino_id?, fecha_desde?, fecha_hasta? }
   * @returns {Promise<Object>}
   */
  listarTransferencias: (params = {}) => apiClient.get('/sucursales/transferencias/lista', { params }),

  /**
   * Obtener transferencia por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerTransferencia: (id) => apiClient.get(`/sucursales/transferencias/${id}`),

  /**
   * Crear nueva transferencia
   * @param {Object} data - { sucursal_origen_id, sucursal_destino_id, notas?, items? }
   * @returns {Promise<Object>}
   */
  crearTransferencia: (data) => apiClient.post('/sucursales/transferencias', data),

  /**
   * Agregar item a transferencia
   * @param {number} transferenciaId
   * @param {Object} data - { producto_id, cantidad_enviada, notas? }
   * @returns {Promise<Object>}
   */
  agregarItemTransferencia: (transferenciaId, data) =>
    apiClient.post(`/sucursales/transferencias/${transferenciaId}/items`, data),

  /**
   * Eliminar item de transferencia
   * @param {number} transferenciaId
   * @param {number} itemId
   * @returns {Promise<Object>}
   */
  eliminarItemTransferencia: (transferenciaId, itemId) =>
    apiClient.delete(`/sucursales/transferencias/${transferenciaId}/items/${itemId}`),

  /**
   * Enviar transferencia (borrador -> enviado)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  enviarTransferencia: (id) => apiClient.post(`/sucursales/transferencias/${id}/enviar`),

  /**
   * Recibir transferencia (enviado -> recibido)
   * @param {number} id
   * @param {Object} data - { items?: [{ id, cantidad_recibida, notas? }] }
   * @returns {Promise<Object>}
   */
  recibirTransferencia: (id, data = {}) => apiClient.post(`/sucursales/transferencias/${id}/recibir`, data),

  /**
   * Cancelar transferencia
   * @param {number} id
   * @returns {Promise<Object>}
   */
  cancelarTransferencia: (id) => apiClient.post(`/sucursales/transferencias/${id}/cancelar`),
};

// ==================== ORGANIZACIÓN (Dic 2025) ====================

/**
 * API de Departamentos
 * Gestión de estructura departamental jerárquica
 */
export const departamentosApi = {
  /**
   * Crear departamento
   * @param {Object} data - { nombre, descripcion?, codigo?, parent_id?, gerente_id?, activo? }
   */
  crear: (data) => apiClient.post('/departamentos', data),

  /**
   * Listar departamentos
   * @param {Object} params - { activo?, parent_id?, limit?, offset? }
   */
  listar: (params = {}) => apiClient.get('/departamentos', { params }),

  /**
   * Obtener árbol jerárquico de departamentos
   */
  obtenerArbol: () => apiClient.get('/departamentos/arbol'),

  /**
   * Obtener departamento por ID
   */
  obtener: (id) => apiClient.get(`/departamentos/${id}`),

  /**
   * Actualizar departamento
   */
  actualizar: (id, data) => apiClient.put(`/departamentos/${id}`, data),

  /**
   * Eliminar departamento (soft delete)
   */
  eliminar: (id) => apiClient.delete(`/departamentos/${id}`),
};

/**
 * API de Puestos
 * Gestión de puestos de trabajo
 */
export const puestosApi = {
  /**
   * Crear puesto
   * @param {Object} data - { nombre, descripcion?, codigo?, departamento_id?, salario_minimo?, salario_maximo?, activo? }
   */
  crear: (data) => apiClient.post('/puestos', data),

  /**
   * Listar puestos
   * @param {Object} params - { activo?, departamento_id?, limit?, offset? }
   */
  listar: (params = {}) => apiClient.get('/puestos', { params }),

  /**
   * Obtener puesto por ID
   */
  obtener: (id) => apiClient.get(`/puestos/${id}`),

  /**
   * Actualizar puesto
   */
  actualizar: (id, data) => apiClient.put(`/puestos/${id}`, data),

  /**
   * Eliminar puesto (soft delete)
   */
  eliminar: (id) => apiClient.delete(`/puestos/${id}`),
};

/**
 * API de Categorías de Profesional
 * Categorías flexibles: especialidad, nivel, área, certificación
 */
export const categoriasProfesionalApi = {
  /**
   * Crear categoría
   * @param {Object} data - { nombre, descripcion?, tipo_categoria?, color?, icono?, orden?, activo? }
   */
  crear: (data) => apiClient.post('/categorias-profesional', data),

  /**
   * Listar categorías
   * @param {Object} params - { activo?, tipo_categoria?, agrupado?, limit?, offset? }
   */
  listar: (params = {}) => apiClient.get('/categorias-profesional', { params }),

  /**
   * Listar categorías agrupadas por tipo
   */
  listarAgrupadas: () => apiClient.get('/categorias-profesional', { params: { agrupado: 'true' } }),

  /**
   * Obtener categoría por ID
   */
  obtener: (id) => apiClient.get(`/categorias-profesional/${id}`),

  /**
   * Obtener profesionales de una categoría
   */
  obtenerProfesionales: (id) => apiClient.get(`/categorias-profesional/${id}/profesionales`),

  /**
   * Actualizar categoría
   */
  actualizar: (id, data) => apiClient.put(`/categorias-profesional/${id}`, data),

  /**
   * Eliminar categoría (soft delete)
   */
  eliminar: (id) => apiClient.delete(`/categorias-profesional/${id}`),
};

// ==================== CUSTOM FIELDS ====================
/**
 * API de Campos Personalizados
 * Permite definir y gestionar campos dinámicos para entidades
 */
// ==================== NOTIFICACIONES ====================
export const notificacionesApi = {
  // ========== Feed de Notificaciones ==========

  /**
   * Listar notificaciones del usuario
   * @param {Object} params - { solo_no_leidas?, categoria?, limit?, offset? }
   */
  listar: (params = {}) => apiClient.get('/notificaciones', { params }),

  /**
   * Contar notificaciones no leídas (para badge)
   */
  contarNoLeidas: () => apiClient.get('/notificaciones/count'),

  /**
   * Marcar notificación como leída
   * @param {number} id
   */
  marcarLeida: (id) => apiClient.put(`/notificaciones/${id}/leer`),

  /**
   * Marcar todas las notificaciones como leídas
   */
  marcarTodasLeidas: () => apiClient.put('/notificaciones/leer-todas'),

  /**
   * Archivar notificación
   * @param {number} id
   */
  archivar: (id) => apiClient.put(`/notificaciones/${id}/archivar`),

  /**
   * Eliminar notificación
   * @param {number} id
   */
  eliminar: (id) => apiClient.delete(`/notificaciones/${id}`),

  /**
   * Crear notificación (admin/sistema)
   * @param {Object} data - { usuario_id, tipo, categoria, titulo, mensaje, nivel?, icono?, accion_url?, accion_texto?, entidad_tipo?, entidad_id?, expira_en? }
   */
  crear: (data) => apiClient.post('/notificaciones', data),

  // ========== Preferencias ==========

  /**
   * Obtener preferencias de notificación del usuario
   */
  obtenerPreferencias: () => apiClient.get('/notificaciones/preferencias'),

  /**
   * Actualizar preferencias de notificación
   * @param {Object} data - { preferencias: [{ tipo, in_app, email, push?, whatsapp? }] }
   */
  actualizarPreferencias: (data) => apiClient.put('/notificaciones/preferencias', data),

  /**
   * Obtener tipos de notificación disponibles
   */
  obtenerTipos: () => apiClient.get('/notificaciones/tipos'),

  // ========== Plantillas (Admin) ==========

  /**
   * Listar plantillas de la organización
   */
  listarPlantillas: () => apiClient.get('/notificaciones/plantillas'),

  /**
   * Crear plantilla de notificación
   * @param {Object} data - { tipo_notificacion, nombre, titulo_template, mensaje_template, icono?, nivel?, activo? }
   */
  crearPlantilla: (data) => apiClient.post('/notificaciones/plantillas', data),

  /**
   * Actualizar plantilla
   * @param {number} id
   * @param {Object} data
   */
  actualizarPlantilla: (id, data) => apiClient.put(`/notificaciones/plantillas/${id}`, data),

  /**
   * Eliminar plantilla
   * @param {number} id
   */
  eliminarPlantilla: (id) => apiClient.delete(`/notificaciones/plantillas/${id}`),
};

// ==================== PERMISOS ====================
/**
 * API de Permisos Normalizados (Dic 2025)
 * Sistema de permisos con catálogo, roles y overrides por usuario/sucursal
 */
export const permisosApi = {
  // ========== Catálogo ==========

  /**
   * Listar catálogo de permisos
   * @param {Object} params - { modulo?, categoria? }
   */
  listarCatalogo: (params = {}) => apiClient.get('/permisos/catalogo', { params }),

  /**
   * Listar módulos disponibles
   */
  listarModulos: () => apiClient.get('/permisos/modulos'),

  // ========== Mis Permisos ==========

  /**
   * Obtener todos los permisos del usuario actual
   * @param {number} sucursalId - ID de la sucursal
   */
  obtenerMisPermisos: (sucursalId) => apiClient.get('/permisos/mis-permisos', { params: { sucursalId } }),

  /**
   * Obtener resumen de permisos agrupados por módulo
   * @param {number} sucursalId - ID de la sucursal
   */
  obtenerResumen: (sucursalId) => apiClient.get('/permisos/resumen', { params: { sucursalId } }),

  /**
   * Verificar si el usuario tiene un permiso específico
   * @param {string} codigo - Código del permiso (ej: 'pos.acceso')
   * @param {number} sucursalId - ID de la sucursal
   */
  verificar: (codigo, sucursalId) => apiClient.get(`/permisos/verificar/${codigo}`, { params: { sucursalId } }),

  /**
   * Obtener valor de un permiso específico
   * @param {string} codigo - Código del permiso
   * @param {number} sucursalId - ID de la sucursal
   */
  obtenerValor: (codigo, sucursalId) => apiClient.get(`/permisos/valor/${codigo}`, { params: { sucursalId } }),

  /**
   * Obtener permisos de un módulo específico
   * @param {string} modulo - Nombre del módulo
   * @param {number} sucursalId - ID de la sucursal
   */
  obtenerPermisosModulo: (modulo, sucursalId) => apiClient.get(`/permisos/modulos/${modulo}`, { params: { sucursalId } }),

  // ========== Permisos por Rol ==========

  /**
   * Listar permisos de un rol
   * @param {string} rol - 'admin' | 'propietario' | 'empleado' | 'bot'
   */
  listarPorRol: (rol) => apiClient.get(`/permisos/roles/${rol}`),

  /**
   * Actualizar múltiples permisos de un rol
   * @param {string} rol
   * @param {Array} permisos - [{ permisoId, valor }]
   */
  actualizarPermisosRol: (rol, permisos) => apiClient.put(`/permisos/roles/${rol}`, { permisos }),

  /**
   * Asignar un permiso específico a un rol
   * @param {string} rol
   * @param {number} permisoId
   * @param {any} valor
   */
  asignarPermisoRol: (rol, permisoId, valor) => apiClient.post(`/permisos/roles/${rol}/permisos`, { permisoId, valor }),

  /**
   * Eliminar permiso de un rol (vuelve a default)
   * @param {string} rol
   * @param {number} permisoId
   */
  eliminarPermisoRol: (rol, permisoId) => apiClient.delete(`/permisos/roles/${rol}/permisos/${permisoId}`),

  // ========== Overrides Usuario/Sucursal ==========

  /**
   * Listar overrides de un usuario en una sucursal
   * @param {number} usuarioId
   * @param {number} sucursalId
   */
  listarPermisosUsuarioSucursal: (usuarioId, sucursalId) =>
    apiClient.get(`/permisos/usuarios/${usuarioId}/sucursales/${sucursalId}`),

  /**
   * Asignar override de permiso a usuario/sucursal
   * @param {number} usuarioId
   * @param {number} sucursalId
   * @param {Object} data - { permisoId, valor, motivo?, fechaInicio?, fechaFin? }
   */
  asignarPermisoUsuarioSucursal: (usuarioId, sucursalId, data) =>
    apiClient.post(`/permisos/usuarios/${usuarioId}/sucursales/${sucursalId}`, data),

  /**
   * Eliminar override de permiso usuario/sucursal
   * @param {number} usuarioId
   * @param {number} sucursalId
   * @param {number} permisoId
   */
  eliminarPermisoUsuarioSucursal: (usuarioId, sucursalId, permisoId) =>
    apiClient.delete(`/permisos/usuarios/${usuarioId}/sucursales/${sucursalId}/permisos/${permisoId}`),
};

// ==================== CUSTOM FIELDS ====================
export const customFieldsApi = {
  // ========== Definiciones ==========

  /**
   * Listar definiciones de campos
   * @param {Object} params - { entidad_tipo?, activo?, seccion?, visible_en_formulario?, visible_en_listado?, limit?, offset? }
   */
  listarDefiniciones: (params = {}) => apiClient.get('/custom-fields/definiciones', { params }),

  /**
   * Obtener definición por ID
   * @param {number} id
   */
  obtenerDefinicion: (id) => apiClient.get(`/custom-fields/definiciones/${id}`),

  /**
   * Crear definición de campo
   * @param {Object} data - { nombre, entidad_tipo, tipo_dato, opciones?, requerido?, ... }
   */
  crearDefinicion: (data) => apiClient.post('/custom-fields/definiciones', data),

  /**
   * Actualizar definición de campo
   * @param {number} id
   * @param {Object} data
   */
  actualizarDefinicion: (id, data) => apiClient.put(`/custom-fields/definiciones/${id}`, data),

  /**
   * Eliminar definición de campo (soft delete)
   * @param {number} id
   */
  eliminarDefinicion: (id) => apiClient.delete(`/custom-fields/definiciones/${id}`),

  /**
   * Reordenar definiciones
   * @param {Object} data - { entidad_tipo, orden: [{ id, orden }] }
   */
  reordenarDefiniciones: (data) => apiClient.put('/custom-fields/definiciones/reorder', data),

  // ========== Valores ==========

  /**
   * Obtener valores de campos personalizados de una entidad
   * @param {string} entidadTipo - cliente, profesional, servicio, producto, cita, evento_digital, invitado_evento
   * @param {number} entidadId
   */
  obtenerValores: (entidadTipo, entidadId) =>
    apiClient.get(`/custom-fields/valores/${entidadTipo}/${entidadId}`),

  /**
   * Guardar valores de campos personalizados
   * @param {string} entidadTipo
   * @param {number} entidadId
   * @param {Object} valores - { nombre_clave: valor, ... }
   */
  guardarValores: (entidadTipo, entidadId, valores) =>
    apiClient.post(`/custom-fields/valores/${entidadTipo}/${entidadId}`, valores),

  /**
   * Validar valores de campos personalizados (sin guardar)
   * @param {string} entidadTipo
   * @param {Object} valores
   */
  validarValores: (entidadTipo, valores) =>
    apiClient.post(`/custom-fields/validar/${entidadTipo}`, valores),

  // ========== Utilidades ==========

  /**
   * Obtener secciones disponibles para un tipo de entidad
   * @param {string} entidadTipo
   */
  obtenerSecciones: (entidadTipo) => apiClient.get(`/custom-fields/secciones/${entidadTipo}`),
};

// ==================== WORKFLOWS DE APROBACIÓN ====================
export const workflowsApi = {
  // ========== Bandeja de Aprobaciones ==========

  /**
   * Listar aprobaciones pendientes del usuario actual
   * @param {Object} params - { entidad_tipo?, limit?, offset? }
   * @returns {Promise<Object>} { instancias[], total, limit, offset }
   */
  listarPendientes: (params) => apiClient.get('/workflows/pendientes', { params }),

  /**
   * Contar aprobaciones pendientes (para badge)
   * @returns {Promise<Object>} { total }
   */
  contarPendientes: () => apiClient.get('/workflows/pendientes/count'),

  /**
   * Obtener detalle de una instancia de workflow
   * @param {number} id - ID de la instancia
   * @returns {Promise<Object>} Instancia con historial y datos de entidad
   */
  obtenerInstancia: (id) => apiClient.get(`/workflows/instancias/${id}`),

  // ========== Acciones ==========

  /**
   * Aprobar una solicitud
   * @param {number} id - ID de la instancia
   * @param {Object} data - { comentario? }
   * @returns {Promise<Object>}
   */
  aprobar: (id, data) => apiClient.post(`/workflows/instancias/${id}/aprobar`, data),

  /**
   * Rechazar una solicitud
   * @param {number} id - ID de la instancia
   * @param {Object} data - { motivo }
   * @returns {Promise<Object>}
   */
  rechazar: (id, data) => apiClient.post(`/workflows/instancias/${id}/rechazar`, data),

  // ========== Historial ==========

  /**
   * Obtener historial de aprobaciones
   * @param {Object} params - { entidad_tipo?, estado?, fecha_desde?, fecha_hasta?, limit?, offset? }
   * @returns {Promise<Object>} { instancias[], total, limit, offset }
   */
  listarHistorial: (params) => apiClient.get('/workflows/historial', { params }),

  // ========== Delegaciones ==========

  /**
   * Listar delegaciones del usuario
   * @param {Object} params - { activas?, como_delegado? }
   * @returns {Promise<Object[]>}
   */
  listarDelegaciones: (params) => apiClient.get('/workflows/delegaciones', { params }),

  /**
   * Crear delegación
   * @param {Object} data - { usuario_delegado_id, workflow_id?, fecha_inicio, fecha_fin, motivo? }
   * @returns {Promise<Object>}
   */
  crearDelegacion: (data) => apiClient.post('/workflows/delegaciones', data),

  /**
   * Actualizar delegación
   * @param {number} id - ID de la delegación
   * @param {Object} data - { fecha_fin?, activo?, motivo? }
   * @returns {Promise<Object>}
   */
  actualizarDelegacion: (id, data) => apiClient.put(`/workflows/delegaciones/${id}`, data),

  /**
   * Eliminar delegación
   * @param {number} id - ID de la delegación
   * @returns {Promise<Object>}
   */
  eliminarDelegacion: (id) => apiClient.delete(`/workflows/delegaciones/${id}`),

  // ========== Definiciones (lectura) ==========

  /**
   * Listar definiciones de workflows
   * @param {Object} params - { entidad_tipo?, activo? }
   * @returns {Promise<Object[]>}
   */
  listarDefiniciones: (params) => apiClient.get('/workflows/definiciones', { params }),

  /**
   * Obtener definición por ID
   * @param {number} id
   * @returns {Promise<Object>} Definición con pasos y transiciones
   */
  obtenerDefinicion: (id) => apiClient.get(`/workflows/definiciones/${id}`),
};

// ==================== WORKFLOW DESIGNER (Visual Editor) ====================
export const workflowDesignerApi = {
  // ========== Utilidades ==========

  /**
   * Listar tipos de entidad disponibles
   * @returns {Promise<Object[]>} Lista de entidades con campos disponibles
   */
  listarEntidades: () => apiClient.get('/workflows/designer/entidades'),

  /**
   * Listar roles disponibles para aprobadores
   * @returns {Promise<Object[]>}
   */
  listarRoles: () => apiClient.get('/workflows/designer/roles'),

  /**
   * Listar permisos disponibles para aprobadores
   * @returns {Promise<Object[]>}
   */
  listarPermisos: () => apiClient.get('/workflows/designer/permisos'),

  // ========== CRUD Definiciones ==========

  /**
   * Crear nueva definición de workflow
   * @param {Object} data - { codigo, nombre, descripcion?, entidad_tipo, condicion_activacion?, prioridad?, activo?, pasos, transiciones }
   * @returns {Promise<Object>} Workflow creado con pasos y transiciones
   */
  crear: (data) => apiClient.post('/workflows/designer/definiciones', data),

  /**
   * Actualizar definición de workflow
   * @param {number} id
   * @param {Object} data - { nombre?, descripcion?, condicion_activacion?, prioridad?, pasos?, transiciones? }
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/workflows/designer/definiciones/${id}`, data),

  /**
   * Eliminar definición de workflow
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/workflows/designer/definiciones/${id}`),

  /**
   * Duplicar un workflow existente
   * @param {number} id
   * @param {Object} data - { nuevo_codigo?, nuevo_nombre? }
   * @returns {Promise<Object>} Workflow duplicado
   */
  duplicar: (id, data) => apiClient.post(`/workflows/designer/definiciones/${id}/duplicar`, data),

  /**
   * Publicar o despublicar workflow
   * @param {number} id
   * @param {boolean} activo
   * @returns {Promise<Object>}
   */
  cambiarEstadoPublicacion: (id, activo) =>
    apiClient.patch(`/workflows/designer/definiciones/${id}/publicar`, { activo }),

  /**
   * Validar estructura de un workflow
   * @param {number} id
   * @returns {Promise<Object>} { valido, errores, estadisticas }
   */
  validar: (id) => apiClient.get(`/workflows/designer/definiciones/${id}/validar`),
};

// ==================== MONEDAS (Multi-Moneda) ====================
export const monedasApi = {
  /**
   * Listar monedas disponibles
   * @param {boolean} activas - Filtrar solo activas (default: true)
   * @returns {Promise<Object[]>} Lista de monedas
   */
  listar: (activas = true) => apiClient.get('/monedas', { params: { activas } }),

  /**
   * Obtener moneda por código
   * @param {string} codigo - Código ISO (MXN, USD, etc.)
   * @returns {Promise<Object>} Datos de la moneda
   */
  obtenerPorCodigo: (codigo) => apiClient.get(`/monedas/${codigo}`),

  /**
   * Obtener tasa de cambio actual
   * @param {string} origen - Moneda origen
   * @param {string} destino - Moneda destino
   * @param {string} fecha - Fecha opcional (YYYY-MM-DD)
   * @returns {Promise<Object>} Tasa de cambio
   */
  obtenerTasa: (origen, destino, fecha) =>
    apiClient.get('/monedas/tasas/actual', { params: { origen, destino, fecha } }),

  /**
   * Obtener historial de tasas
   * @param {string} origen - Moneda origen
   * @param {string} destino - Moneda destino
   * @param {number} dias - Días de historial (default: 30)
   * @returns {Promise<Object[]>} Historial de tasas
   */
  obtenerHistorialTasas: (origen, destino, dias = 30) =>
    apiClient.get('/monedas/tasas/historial', { params: { origen, destino, dias } }),

  /**
   * Guardar nueva tasa de cambio (admin)
   * @param {Object} data - { moneda_origen, moneda_destino, tasa, fuente }
   * @returns {Promise<Object>} Tasa guardada
   */
  guardarTasa: (data) => apiClient.post('/monedas/tasas', data),

  /**
   * Convertir monto entre monedas
   * @param {Object} data - { monto, origen, destino, fecha? }
   * @returns {Promise<Object>} Resultado de conversión
   */
  convertir: (data) => apiClient.post('/monedas/convertir', data),

  /**
   * Convertir múltiples montos
   * @param {Object} data - { items: [{ monto, moneda }], destino }
   * @returns {Promise<Object[]>} Conversiones
   */
  convertirMultiple: (data) => apiClient.post('/monedas/convertir/multiple', data),
};

// ==================== LISTAS DE PRECIOS (Fase 5) ====================
export const listasPreciosApi = {
  /**
   * Listar listas de precios
   * @param {Object} params - { soloActivas?, moneda? }
   * @returns {Promise<Object[]>} Listas de precios
   */
  listar: (params) => apiClient.get('/listas-precios', { params }),

  /**
   * Obtener lista por ID
   * @param {number} id
   * @returns {Promise<Object>} Lista con detalles
   */
  obtenerPorId: (id) => apiClient.get(`/listas-precios/${id}`),

  /**
   * Crear lista de precios
   * @param {Object} data - { codigo, nombre, descripcion?, moneda?, es_default?, descuento_global_pct? }
   * @returns {Promise<Object>} Lista creada
   */
  crear: (data) => apiClient.post('/listas-precios', data),

  /**
   * Actualizar lista de precios
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>} Lista actualizada
   */
  actualizar: (id, data) => apiClient.put(`/listas-precios/${id}`, data),

  /**
   * Eliminar lista de precios
   * @param {number} id
   * @returns {Promise<void>}
   */
  eliminar: (id) => apiClient.delete(`/listas-precios/${id}`),

  // Items de lista
  /**
   * Listar items de una lista
   * @param {number} listaId
   * @returns {Promise<Object[]>} Items
   */
  listarItems: (listaId) => apiClient.get(`/listas-precios/${listaId}/items`),

  /**
   * Crear item de lista
   * @param {number} listaId
   * @param {Object} data - { producto_id?, categoria_id?, cantidad_minima?, precio_fijo?, descuento_pct? }
   * @returns {Promise<Object>} Item creado
   */
  crearItem: (listaId, data) => apiClient.post(`/listas-precios/${listaId}/items`, data),

  /**
   * Actualizar item
   * @param {number} itemId
   * @param {Object} data
   * @returns {Promise<Object>} Item actualizado
   */
  actualizarItem: (itemId, data) => apiClient.put(`/listas-precios/items/${itemId}`, data),

  /**
   * Eliminar item
   * @param {number} itemId
   * @returns {Promise<void>}
   */
  eliminarItem: (itemId) => apiClient.delete(`/listas-precios/items/${itemId}`),

  // Resolución de precios
  /**
   * Obtener precio de producto
   * @param {number} productoId
   * @param {Object} params - { clienteId?, cantidad?, moneda?, sucursalId? }
   * @returns {Promise<Object>} Precio resuelto
   */
  obtenerPrecio: (productoId, params) => apiClient.get(`/listas-precios/precio/${productoId}`, { params }),

  /**
   * Obtener precios de carrito
   * @param {Object} data - { items: [{ productoId, cantidad }], clienteId?, moneda?, sucursalId? }
   * @returns {Promise<Object[]>} Precios
   */
  obtenerPreciosCarrito: (data) => apiClient.post('/listas-precios/precios-carrito', data),

  // Asignación a clientes
  /**
   * Listar clientes de una lista
   * @param {number} listaId
   * @returns {Promise<Object[]>} Clientes
   */
  listarClientes: (listaId) => apiClient.get(`/listas-precios/${listaId}/clientes`),

  /**
   * Asignar lista a cliente
   * @param {number} listaId
   * @param {number} clienteId
   * @returns {Promise<Object>}
   */
  asignarCliente: (listaId, clienteId) => apiClient.post(`/listas-precios/${listaId}/asignar-cliente`, { clienteId }),

  /**
   * Asignar lista a múltiples clientes
   * @param {number} listaId
   * @param {number[]} clienteIds
   * @returns {Promise<Object>}
   */
  asignarClientesBulk: (listaId, clienteIds) => apiClient.post(`/listas-precios/${listaId}/asignar-clientes`, { clienteIds }),
};

// ==================== CONTEOS DE INVENTARIO (Dic 2025) ====================
export const conteosApi = {
  /**
   * Listar conteos con filtros
   * @param {Object} params - { sucursal_id?, estado?, tipo_conteo?, fecha_desde?, fecha_hasta?, folio?, limit?, offset? }
   * @returns {Promise<Object>} { conteos, totales }
   */
  listar: (params) => apiClient.get('/inventario/conteos', { params }),

  /**
   * Obtener conteo por ID con items
   * @param {number} id
   * @returns {Promise<Object>} Conteo con items y resumen
   */
  obtenerPorId: (id) => apiClient.get(`/inventario/conteos/${id}`),

  /**
   * Crear nuevo conteo de inventario
   * @param {Object} data - { tipo_conteo, sucursal_id?, filtros?, fecha_programada?, usuario_contador_id?, usuario_supervisor_id?, notas? }
   * @returns {Promise<Object>} Conteo creado (estado: borrador)
   */
  crear: (data) => apiClient.post('/inventario/conteos', data),

  /**
   * Iniciar conteo (genera items según filtros)
   * Cambia estado: borrador → en_proceso
   * @param {number} id
   * @returns {Promise<Object>} Conteo con items generados
   */
  iniciar: (id) => apiClient.post(`/inventario/conteos/${id}/iniciar`),

  /**
   * Registrar cantidad contada para un item
   * @param {number} itemId - ID del item del conteo
   * @param {Object} data - { cantidad_contada, notas? }
   * @returns {Promise<Object>} Item actualizado
   */
  registrarConteo: (itemId, data) => apiClient.put(`/inventario/conteos/items/${itemId}`, data),

  /**
   * Completar conteo (todos los items deben estar contados)
   * Cambia estado: en_proceso → completado
   * @param {number} id
   * @returns {Promise<Object>} Conteo completado
   */
  completar: (id) => apiClient.post(`/inventario/conteos/${id}/completar`),

  /**
   * Aplicar ajustes de inventario basados en el conteo
   * Cambia estado: completado → ajustado
   * Crea movimientos de inventario para cada diferencia
   * @param {number} id
   * @returns {Promise<Object>} { conteo, ajustes_realizados }
   */
  aplicarAjustes: (id) => apiClient.post(`/inventario/conteos/${id}/aplicar-ajustes`),

  /**
   * Cancelar conteo
   * Cambia estado: (cualquiera excepto ajustado) → cancelado
   * @param {number} id
   * @param {Object} data - { motivo? }
   * @returns {Promise<Object>} Conteo cancelado
   */
  cancelar: (id, data) => apiClient.post(`/inventario/conteos/${id}/cancelar`, data),

  /**
   * Buscar item por código de barras o SKU
   * @param {number} conteoId
   * @param {string} codigo - Código de barras o SKU
   * @returns {Promise<Object>} Item encontrado
   */
  buscarItem: (conteoId, codigo) => apiClient.get(`/inventario/conteos/${conteoId}/buscar-item`, { params: { codigo } }),

  /**
   * Obtener estadísticas de conteos por período
   * @param {Object} params - { fecha_desde?, fecha_hasta? }
   * @returns {Promise<Object>} Estadísticas
   */
  obtenerEstadisticas: (params) => apiClient.get('/inventario/conteos/estadisticas', { params }),
};

// ==================== AJUSTES MASIVOS DE INVENTARIO (Dic 2025) ====================
export const ajustesMasivosApi = {
  /**
   * Listar ajustes masivos con filtros
   * @param {Object} params - { estado?, fecha_desde?, fecha_hasta?, folio?, limit?, offset? }
   * @returns {Promise<Object>} { ajustes, totales }
   */
  listar: (params) => apiClient.get('/inventario/ajustes-masivos', { params }),

  /**
   * Obtener ajuste masivo por ID con items
   * @param {number} id
   * @returns {Promise<Object>} Ajuste con items
   */
  obtenerPorId: (id) => apiClient.get(`/inventario/ajustes-masivos/${id}`),

  /**
   * Crear ajuste masivo desde items parseados del CSV
   * @param {Object} data - { archivo_nombre, items: [{ fila_numero, sku?, codigo_barras?, cantidad_ajuste, motivo? }] }
   * @returns {Promise<Object>} Ajuste creado (estado: pendiente)
   */
  crear: (data) => apiClient.post('/inventario/ajustes-masivos', data),

  /**
   * Validar items del ajuste masivo
   * Resuelve SKU/código de barras a producto_id, verifica existencia
   * Cambia estado: pendiente → validado
   * @param {number} id
   * @returns {Promise<Object>} Ajuste con items validados
   */
  validar: (id) => apiClient.post(`/inventario/ajustes-masivos/${id}/validar`),

  /**
   * Aplicar ajustes de inventario
   * Crea movimientos de inventario para cada item válido
   * Cambia estado: validado → aplicado | con_errores
   * @param {number} id
   * @returns {Promise<Object>} { aplicados: [], errores: [] }
   */
  aplicar: (id) => apiClient.post(`/inventario/ajustes-masivos/${id}/aplicar`),

  /**
   * Cancelar ajuste masivo
   * Solo si estado = pendiente
   * @param {number} id
   * @returns {Promise<Object>}
   */
  cancelar: (id) => apiClient.delete(`/inventario/ajustes-masivos/${id}`),

  /**
   * Descargar plantilla CSV
   * @returns {Promise<Blob>} Archivo CSV
   */
  descargarPlantilla: () => apiClient.get('/inventario/ajustes-masivos/plantilla', { responseType: 'blob' }),
};

// ==================== LANDED COSTS - Costos en Destino (Dic 2025) ====================
export const landedCostsApi = {
  /**
   * Listar costos adicionales de una OC
   * @param {number} ordenCompraId
   * @returns {Promise<Array>} Lista de costos adicionales
   */
  listar: (ordenCompraId) => apiClient.get(`/inventario/ordenes-compra/${ordenCompraId}/costos`),

  /**
   * Obtener resumen de costos de una OC
   * @param {number} ordenCompraId
   * @returns {Promise<Object>} { por_tipo, totales }
   */
  obtenerResumen: (ordenCompraId) => apiClient.get(`/inventario/ordenes-compra/${ordenCompraId}/costos/resumen`),

  /**
   * Obtener un costo adicional por ID
   * @param {number} ordenCompraId
   * @param {number} costoId
   */
  obtener: (ordenCompraId, costoId) => apiClient.get(`/inventario/ordenes-compra/${ordenCompraId}/costos/${costoId}`),

  /**
   * Crear costo adicional
   * @param {number} ordenCompraId
   * @param {Object} data - { tipo_costo, monto_total, metodo_distribucion, ... }
   */
  crear: (ordenCompraId, data) => apiClient.post(`/inventario/ordenes-compra/${ordenCompraId}/costos`, data),

  /**
   * Actualizar costo adicional
   * @param {number} ordenCompraId
   * @param {number} costoId
   * @param {Object} data
   */
  actualizar: (ordenCompraId, costoId, data) =>
    apiClient.put(`/inventario/ordenes-compra/${ordenCompraId}/costos/${costoId}`, data),

  /**
   * Eliminar costo adicional
   * @param {number} ordenCompraId
   * @param {number} costoId
   */
  eliminar: (ordenCompraId, costoId) =>
    apiClient.delete(`/inventario/ordenes-compra/${ordenCompraId}/costos/${costoId}`),

  /**
   * Distribuir un costo adicional a los items
   * @param {number} ordenCompraId
   * @param {number} costoId
   */
  distribuir: (ordenCompraId, costoId) =>
    apiClient.post(`/inventario/ordenes-compra/${ordenCompraId}/costos/${costoId}/distribuir`),

  /**
   * Obtener detalle de distribucion de un costo
   * @param {number} ordenCompraId
   * @param {number} costoId
   */
  obtenerDistribucion: (ordenCompraId, costoId) =>
    apiClient.get(`/inventario/ordenes-compra/${ordenCompraId}/costos/${costoId}/distribucion`),

  /**
   * Distribuir todos los costos pendientes de una OC
   * @param {number} ordenCompraId
   */
  distribuirTodos: (ordenCompraId) =>
    apiClient.post(`/inventario/ordenes-compra/${ordenCompraId}/distribuir-costos`),

  /**
   * Obtener costos totales desglosados por item
   * @param {number} ordenCompraId
   */
  obtenerCostosPorItems: (ordenCompraId) =>
    apiClient.get(`/inventario/ordenes-compra/${ordenCompraId}/costos-por-items`),
};

// ==================== DROPSHIPPING (Dic 2025) ====================
export const dropshipApi = {
  /**
   * Obtener estadisticas de dropship
   * @returns {Promise<Object>} { borradores, enviadas, entregadas, canceladas, ... }
   */
  obtenerEstadisticas: () => apiClient.get('/inventario/dropship/estadisticas'),

  /**
   * Obtener configuracion dropship de la organizacion
   * @returns {Promise<Object>} { dropship_auto_generar_oc }
   */
  obtenerConfiguracion: () => apiClient.get('/inventario/dropship/configuracion'),

  /**
   * Actualizar configuracion dropship
   * @param {Object} data - { dropship_auto_generar_oc: boolean }
   */
  actualizarConfiguracion: (data) => apiClient.patch('/inventario/dropship/configuracion', data),

  /**
   * Obtener ventas pendientes de generar OC dropship
   * @returns {Promise<Array>} Lista de ventas pendientes
   */
  obtenerVentasPendientes: () => apiClient.get('/inventario/dropship/pendientes'),

  /**
   * Crear OC dropship desde una venta
   * @param {number} ventaId - ID de la venta
   * @returns {Promise<Object>} Resultado con OCs creadas
   */
  crearDesdeVenta: (ventaId) => apiClient.post(`/inventario/dropship/desde-venta/${ventaId}`),

  /**
   * Listar OC dropship
   * @param {Object} params - { estado?, proveedor_id?, fecha_desde?, fecha_hasta? }
   * @returns {Promise<Array>} Lista de OC dropship
   */
  listarOrdenes: (params = {}) => apiClient.get('/inventario/dropship/ordenes', { params }),

  /**
   * Obtener detalle de OC dropship
   * @param {number} id - ID de la OC
   * @returns {Promise<Object>} Detalle de la OC con items
   */
  obtenerOrden: (id) => apiClient.get(`/inventario/dropship/ordenes/${id}`),

  /**
   * Confirmar entrega de OC dropship
   * @param {number} id - ID de la OC
   * @param {Object} data - { notas? }
   * @returns {Promise<Object>} Resultado
   */
  confirmarEntrega: (id, data = {}) => apiClient.patch(`/inventario/dropship/ordenes/${id}/confirmar-entrega`, data),

  /**
   * Cancelar OC dropship
   * @param {number} id - ID de la OC
   * @param {Object} data - { motivo? }
   * @returns {Promise<Object>} Resultado
   */
  cancelar: (id, data = {}) => apiClient.patch(`/inventario/dropship/ordenes/${id}/cancelar`, data),
};

// ==================== REORDEN AUTOMATICO (Dic 2025) ====================
export const reordenApi = {
  /**
   * Obtener dashboard de reorden con metricas
   * @returns {Promise<Object>} { metricas, reglas, job }
   */
  obtenerDashboard: () => apiClient.get('/inventario/reorden/dashboard'),

  /**
   * Listar productos que necesitan reabastecimiento
   * @param {Object} params - { solo_sin_oc?, categoria_id?, proveedor_id?, limit? }
   * @returns {Promise<Array>} Productos bajo minimo
   */
  productosBajoMinimo: (params = {}) => apiClient.get('/inventario/reorden/productos-bajo-minimo', { params }),

  /**
   * Listar rutas de operacion disponibles
   * @param {Object} params - { tipo?, activo? }
   * @returns {Promise<Array>} Rutas
   */
  listarRutas: (params = {}) => apiClient.get('/inventario/reorden/rutas', { params }),

  /**
   * Listar reglas de reabastecimiento
   * @param {Object} params - { activo?, producto_id? }
   * @returns {Promise<Array>} Reglas
   */
  listarReglas: (params = {}) => apiClient.get('/inventario/reorden/reglas', { params }),

  /**
   * Obtener regla por ID
   * @param {number} id
   * @returns {Promise<Object>} Regla
   */
  obtenerRegla: (id) => apiClient.get(`/inventario/reorden/reglas/${id}`),

  /**
   * Crear nueva regla de reabastecimiento
   * @param {Object} data - Datos de la regla
   * @returns {Promise<Object>} Regla creada
   */
  crearRegla: (data) => apiClient.post('/inventario/reorden/reglas', data),

  /**
   * Actualizar regla de reabastecimiento
   * @param {number} id
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Regla actualizada
   */
  actualizarRegla: (id, data) => apiClient.put(`/inventario/reorden/reglas/${id}`, data),

  /**
   * Eliminar regla de reabastecimiento
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarRegla: (id) => apiClient.delete(`/inventario/reorden/reglas/${id}`),

  /**
   * Ejecutar evaluacion de reorden manualmente
   * @returns {Promise<Object>} { reglas_evaluadas, ordenes_generadas, errores, detalles }
   */
  ejecutarManual: () => apiClient.post('/inventario/reorden/ejecutar'),

  /**
   * Listar historial de ejecuciones de reorden
   * @param {Object} params - { tipo?, fecha_desde?, fecha_hasta?, limit?, offset? }
   * @returns {Promise<Array>} Logs de ejecucion
   */
  listarLogs: (params = {}) => apiClient.get('/inventario/reorden/logs', { params }),

  /**
   * Obtener detalle de un log de ejecucion
   * @param {number} id
   * @returns {Promise<Object>} Log con detalles
   */
  obtenerLog: (id) => apiClient.get(`/inventario/reorden/logs/${id}`),
};

// ==================== OPERACIONES DE ALMACEN (Dic 2025) ====================
export const operacionesAlmacenApi = {
  /**
   * Listar operaciones con filtros
   * @param {Object} params - { sucursal_id?, tipo_operacion?, estado?, estados?, asignado_a?, origen_tipo?, limit? }
   * @returns {Promise<Array>} Operaciones
   */
  listar: (params = {}) => apiClient.get('/inventario/operaciones', { params }),

  /**
   * Obtener operacion por ID con items
   * @param {number} id
   * @returns {Promise<Object>} Operacion con items
   */
  obtenerPorId: (id) => apiClient.get(`/inventario/operaciones/${id}`),

  /**
   * Crear operacion manual
   * @param {Object} data - Datos de la operacion
   * @returns {Promise<Object>} Operacion creada
   */
  crear: (data) => apiClient.post('/inventario/operaciones', data),

  /**
   * Actualizar operacion
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>} Operacion actualizada
   */
  actualizar: (id, data) => apiClient.put(`/inventario/operaciones/${id}`, data),

  /**
   * Asignar operacion a usuario
   * @param {number} id
   * @param {Object} data - { usuario_id? }
   * @returns {Promise<Object>} Operacion asignada
   */
  asignar: (id, data = {}) => apiClient.post(`/inventario/operaciones/${id}/asignar`, data),

  /**
   * Iniciar procesamiento de operacion
   * @param {number} id
   * @returns {Promise<Object>} Operacion iniciada
   */
  iniciar: (id) => apiClient.post(`/inventario/operaciones/${id}/iniciar`),

  /**
   * Completar operacion procesando items
   * @param {number} id
   * @param {Object} data - { items: [{ id, cantidad_procesada, ubicacion_destino_id? }] }
   * @returns {Promise<Object>} Resultado con operacion_siguiente si aplica
   */
  completar: (id, data) => apiClient.post(`/inventario/operaciones/${id}/completar`, data),

  /**
   * Cancelar operacion
   * @param {number} id
   * @param {Object} data - { motivo? }
   * @returns {Promise<Object>} Operacion cancelada
   */
  cancelar: (id, data = {}) => apiClient.post(`/inventario/operaciones/${id}/cancelar`, data),

  /**
   * Procesar item individual
   * @param {number} itemId
   * @param {Object} data - { cantidad_procesada, ubicacion_destino_id? }
   * @returns {Promise<Object>} Item procesado
   */
  procesarItem: (itemId, data) => apiClient.post(`/inventario/operaciones/items/${itemId}/procesar`, data),

  /**
   * Cancelar item
   * @param {number} itemId
   * @returns {Promise<Object>} Item cancelado
   */
  cancelarItem: (itemId) => apiClient.post(`/inventario/operaciones/items/${itemId}/cancelar`),

  /**
   * Obtener cadena completa de operaciones
   * @param {number} id
   * @returns {Promise<Array>} Cadena de operaciones
   */
  obtenerCadena: (id) => apiClient.get(`/inventario/operaciones/${id}/cadena`),

  /**
   * Obtener operaciones pendientes por sucursal
   * @param {number} sucursalId
   * @returns {Promise<Object>} { por_tipo, total }
   */
  obtenerPendientes: (sucursalId) => apiClient.get(`/inventario/operaciones/pendientes/${sucursalId}`),

  /**
   * Obtener estadisticas por tipo
   * @param {number} sucursalId
   * @returns {Promise<Object>} Estadisticas
   */
  obtenerEstadisticas: (sucursalId) => apiClient.get(`/inventario/operaciones/estadisticas/${sucursalId}`),

  /**
   * Obtener resumen para vista Kanban
   * @param {number} sucursalId
   * @returns {Promise<Object>} Resumen Kanban
   */
  obtenerResumenKanban: (sucursalId) => apiClient.get(`/inventario/operaciones/kanban/${sucursalId}`),
};

// ==================== BATCH PICKING (Dic 2025) ====================
export const batchPickingApi = {
  /**
   * Listar batches con filtros
   * @param {Object} params - { sucursal_id?, estado?, estados?, asignado_a?, limit? }
   * @returns {Promise<Array>} Batches
   */
  listar: (params = {}) => apiClient.get('/inventario/batch-picking', { params }),

  /**
   * Obtener batch por ID con operaciones
   * @param {number} id
   * @returns {Promise<Object>} Batch con operaciones
   */
  obtenerPorId: (id) => apiClient.get(`/inventario/batch-picking/${id}`),

  /**
   * Crear batch de picking
   * @param {Object} data - { sucursal_id?, operacion_ids, nombre? }
   * @returns {Promise<Object>} Batch creado
   */
  crear: (data) => apiClient.post('/inventario/batch-picking', data),

  /**
   * Actualizar batch
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>} Batch actualizado
   */
  actualizar: (id, data) => apiClient.put(`/inventario/batch-picking/${id}`, data),

  /**
   * Eliminar batch (solo si esta en borrador)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/inventario/batch-picking/${id}`),

  /**
   * Agregar operacion al batch
   * @param {number} batchId
   * @param {Object} data - { operacion_id }
   * @returns {Promise<Object>} Relacion creada
   */
  agregarOperacion: (batchId, data) => apiClient.post(`/inventario/batch-picking/${batchId}/operaciones`, data),

  /**
   * Quitar operacion del batch
   * @param {number} batchId
   * @param {number} operacionId
   * @returns {Promise<Object>}
   */
  quitarOperacion: (batchId, operacionId) => apiClient.delete(`/inventario/batch-picking/${batchId}/operaciones/${operacionId}`),

  /**
   * Iniciar procesamiento del batch
   * @param {number} id
   * @returns {Promise<Object>} Resultado
   */
  iniciar: (id) => apiClient.post(`/inventario/batch-picking/${id}/iniciar`),

  /**
   * Procesar item del batch
   * @param {number} id
   * @param {Object} data - { producto_id, variante_id?, ubicacion_id?, cantidad }
   * @returns {Promise<Object>} Resultado
   */
  procesarItem: (id, data) => apiClient.post(`/inventario/batch-picking/${id}/procesar-item`, data),

  /**
   * Completar batch
   * @param {number} id
   * @returns {Promise<Object>} Resultado
   */
  completar: (id) => apiClient.post(`/inventario/batch-picking/${id}/completar`),

  /**
   * Cancelar batch
   * @param {number} id
   * @returns {Promise<Object>} Batch cancelado
   */
  cancelar: (id) => apiClient.post(`/inventario/batch-picking/${id}/cancelar`),

  /**
   * Obtener lista consolidada de productos a recoger
   * @param {number} id
   * @returns {Promise<Array>} Lista consolidada
   */
  obtenerListaConsolidada: (id) => apiClient.get(`/inventario/batch-picking/${id}/lista-consolidada`),

  /**
   * Obtener estadisticas del batch
   * @param {number} id
   * @returns {Promise<Object>} Estadisticas
   */
  obtenerEstadisticas: (id) => apiClient.get(`/inventario/batch-picking/${id}/estadisticas`),

  /**
   * Obtener batches pendientes de una sucursal
   * @param {number} sucursalId
   * @returns {Promise<Array>} Batches pendientes
   */
  obtenerPendientes: (sucursalId) => apiClient.get(`/inventario/batch-picking/pendientes/${sucursalId}`),

  /**
   * Obtener operaciones de picking disponibles para batch
   * @param {number} sucursalId
   * @returns {Promise<Array>} Operaciones disponibles
   */
  obtenerOperacionesDisponibles: (sucursalId) => apiClient.get(`/inventario/batch-picking/operaciones-disponibles/${sucursalId}`),
};

// ==================== CONFIGURACION ALMACEN (Dic 2025) ====================
export const configuracionAlmacenApi = {
  /**
   * Listar configuraciones de todas las sucursales
   * @returns {Promise<Array>} Configuraciones
   */
  listar: () => apiClient.get('/inventario/configuracion-almacen'),

  /**
   * Obtener configuracion por sucursal
   * @param {number} sucursalId
   * @returns {Promise<Object>} Configuracion con ubicaciones
   */
  obtenerPorSucursal: (sucursalId) => apiClient.get(`/inventario/configuracion-almacen/${sucursalId}`),

  /**
   * Actualizar configuracion de sucursal
   * @param {number} sucursalId
   * @param {Object} data - { pasos_recepcion, pasos_envio, ubicacion_*_id, etc. }
   * @returns {Promise<Object>} Configuracion actualizada
   */
  actualizar: (sucursalId, data) => apiClient.put(`/inventario/configuracion-almacen/${sucursalId}`, data),

  /**
   * Crear ubicaciones por defecto para rutas multietapa
   * @param {number} sucursalId
   * @returns {Promise<Object>} Resultado con ubicaciones creadas
   */
  crearUbicacionesDefault: (sucursalId) => apiClient.post(`/inventario/configuracion-almacen/${sucursalId}/crear-ubicaciones`),

  /**
   * Verificar si la sucursal usa rutas multietapa
   * @param {number} sucursalId
   * @param {Object} params - { tipo?: 'recepcion' | 'envio' }
   * @returns {Promise<Object>} { usa_multietapa: boolean | { recepcion, envio } }
   */
  verificarMultietapa: (sucursalId, params = {}) => apiClient.get(`/inventario/configuracion-almacen/${sucursalId}/usa-multietapa`, { params }),

  /**
   * Obtener descripciones de todos los pasos disponibles
   * @returns {Promise<Object>} { recepcion: {1, 2, 3}, envio: {1, 2, 3} }
   */
  obtenerDescripcionesPasos: () => apiClient.get('/inventario/configuracion-almacen/descripciones-pasos'),
};

// ========================================================================
// PAQUETES DE ENVIO (Dic 2025)
// ========================================================================

/**
 * Endpoints para Paquetes de Envio (empaque)
 * @module paquetesApi
 */
export const paquetesApi = {
  // ==================== PAQUETES POR OPERACION ====================

  /**
   * Crear paquete para operacion de empaque
   * @param {number} operacionId
   * @param {Object} data - { notas? }
   * @returns {Promise<Object>} Paquete creado
   */
  crear: (operacionId, data = {}) => apiClient.post(`/inventario/operaciones/${operacionId}/paquetes`, data),

  /**
   * Listar paquetes de una operacion
   * @param {number} operacionId
   * @returns {Promise<Array>} Lista de paquetes
   */
  listarPorOperacion: (operacionId) => apiClient.get(`/inventario/operaciones/${operacionId}/paquetes`),

  /**
   * Obtener items disponibles para empacar
   * @param {number} operacionId
   * @returns {Promise<Array>} Items pendientes de empacar
   */
  obtenerItemsDisponibles: (operacionId) => apiClient.get(`/inventario/operaciones/${operacionId}/items-disponibles`),

  /**
   * Obtener resumen de empaque de la operacion
   * @param {number} operacionId
   * @returns {Promise<Object>} Resumen con totales y paquetes
   */
  obtenerResumen: (operacionId) => apiClient.get(`/inventario/operaciones/${operacionId}/resumen-empaque`),

  // ==================== PAQUETE INDIVIDUAL ====================

  /**
   * Obtener paquete por ID con items
   * @param {number} id
   * @returns {Promise<Object>} Paquete con items
   */
  obtenerPorId: (id) => apiClient.get(`/inventario/paquetes/${id}`),

  /**
   * Actualizar dimensiones/peso del paquete
   * @param {number} id
   * @param {Object} data - { peso_kg?, largo_cm?, ancho_cm?, alto_cm?, notas?, carrier?, tracking_carrier? }
   * @returns {Promise<Object>} Paquete actualizado
   */
  actualizar: (id, data) => apiClient.put(`/inventario/paquetes/${id}`, data),

  // ==================== ITEMS DE PAQUETE ====================

  /**
   * Agregar item al paquete
   * @param {number} paqueteId
   * @param {Object} data - { operacion_item_id, cantidad, numero_serie_id? }
   * @returns {Promise<Object>} Resultado
   */
  agregarItem: (paqueteId, data) => apiClient.post(`/inventario/paquetes/${paqueteId}/items`, data),

  /**
   * Remover item del paquete
   * @param {number} paqueteId
   * @param {number} itemId
   * @returns {Promise<Object>} Resultado
   */
  removerItem: (paqueteId, itemId) => apiClient.delete(`/inventario/paquetes/${paqueteId}/items/${itemId}`),

  // ==================== ACCIONES DE PAQUETE ====================

  /**
   * Cerrar paquete (no mas modificaciones)
   * @param {number} id
   * @returns {Promise<Object>} Resultado
   */
  cerrar: (id) => apiClient.post(`/inventario/paquetes/${id}/cerrar`),

  /**
   * Cancelar paquete
   * @param {number} id
   * @param {Object} data - { motivo? }
   * @returns {Promise<Object>} Resultado
   */
  cancelar: (id, data = {}) => apiClient.post(`/inventario/paquetes/${id}/cancelar`, data),

  /**
   * Marcar paquete como etiquetado
   * @param {number} id
   * @param {Object} data - { tracking_carrier?, carrier? }
   * @returns {Promise<Object>} Paquete actualizado
   */
  etiquetar: (id, data = {}) => apiClient.post(`/inventario/paquetes/${id}/etiquetar`, data),

  /**
   * Marcar paquete como enviado
   * @param {number} id
   * @returns {Promise<Object>} Paquete actualizado
   */
  enviar: (id) => apiClient.post(`/inventario/paquetes/${id}/enviar`),

  /**
   * Generar datos de etiqueta del paquete
   * @param {number} id
   * @returns {Promise<Object>} Datos para impresion de etiqueta
   */
  generarEtiqueta: (id) => apiClient.get(`/inventario/paquetes/${id}/etiqueta`),
};

// ================================================================================
// CONSIGNA - Inventario en Consignacion (Dic 2025)
// ================================================================================

/**
 * API para gestion de inventario en consignacion
 * Stock de proveedores en tu almacen, pago solo al vender
 */
export const consignaApi = {
  // --- ACUERDOS ---

  /**
   * Crear acuerdo de consignacion
   * @param {Object} data - { proveedor_id, porcentaje_comision, dias_liquidacion, ... }
   * @returns {Promise<Object>} Acuerdo creado
   */
  crearAcuerdo: (data) => apiClient.post('/inventario/consigna/acuerdos', data),

  /**
   * Listar acuerdos
   * @param {Object} params - { proveedor_id?, estado?, busqueda?, limit?, offset? }
   * @returns {Promise<Object>} { data, total, limit, offset }
   */
  listarAcuerdos: (params = {}) => apiClient.get('/inventario/consigna/acuerdos', { params }),

  /**
   * Obtener acuerdo por ID
   * @param {number} id
   * @returns {Promise<Object>} Acuerdo con detalles
   */
  obtenerAcuerdo: (id) => apiClient.get(`/inventario/consigna/acuerdos/${id}`),

  /**
   * Actualizar acuerdo
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>} Acuerdo actualizado
   */
  actualizarAcuerdo: (id, data) => apiClient.put(`/inventario/consigna/acuerdos/${id}`, data),

  /**
   * Activar acuerdo
   * @param {number} id
   * @returns {Promise<Object>} Acuerdo activado
   */
  activarAcuerdo: (id) => apiClient.post(`/inventario/consigna/acuerdos/${id}/activar`),

  /**
   * Pausar acuerdo
   * @param {number} id
   * @returns {Promise<Object>} Acuerdo pausado
   */
  pausarAcuerdo: (id) => apiClient.post(`/inventario/consigna/acuerdos/${id}/pausar`),

  /**
   * Terminar acuerdo
   * @param {number} id
   * @returns {Promise<Object>} Acuerdo terminado
   */
  terminarAcuerdo: (id) => apiClient.post(`/inventario/consigna/acuerdos/${id}/terminar`),

  // --- PRODUCTOS DEL ACUERDO ---

  /**
   * Agregar producto al acuerdo
   * @param {number} acuerdoId
   * @param {Object} data - { producto_id, precio_consigna, ... }
   * @returns {Promise<Object>} Producto agregado
   */
  agregarProducto: (acuerdoId, data) =>
    apiClient.post(`/inventario/consigna/acuerdos/${acuerdoId}/productos`, data),

  /**
   * Listar productos del acuerdo
   * @param {number} acuerdoId
   * @returns {Promise<Array>} Productos del acuerdo
   */
  listarProductos: (acuerdoId) =>
    apiClient.get(`/inventario/consigna/acuerdos/${acuerdoId}/productos`),

  /**
   * Actualizar producto del acuerdo
   * @param {number} acuerdoId
   * @param {number} productoId
   * @param {Object} data
   * @param {number} varianteId - Opcional
   * @returns {Promise<Object>} Producto actualizado
   */
  actualizarProducto: (acuerdoId, productoId, data, varianteId = null) =>
    apiClient.put(
      `/inventario/consigna/acuerdos/${acuerdoId}/productos/${productoId}`,
      data,
      { params: varianteId ? { variante_id: varianteId } : {} }
    ),

  /**
   * Remover producto del acuerdo
   * @param {number} acuerdoId
   * @param {number} productoId
   * @param {number} varianteId - Opcional
   * @returns {Promise<Object>} Resultado
   */
  removerProducto: (acuerdoId, productoId, varianteId = null) =>
    apiClient.delete(
      `/inventario/consigna/acuerdos/${acuerdoId}/productos/${productoId}`,
      { params: varianteId ? { variante_id: varianteId } : {} }
    ),

  // --- STOCK CONSIGNA ---

  /**
   * Recibir mercancia en consignacion
   * @param {number} acuerdoId
   * @param {Object} data - { items: [{ producto_id, cantidad, ... }] }
   * @returns {Promise<Object>} Movimientos creados
   */
  recibirMercancia: (acuerdoId, data) =>
    apiClient.post(`/inventario/consigna/acuerdos/${acuerdoId}/recibir`, data),

  /**
   * Consultar stock en consignacion
   * @param {Object} params - { acuerdo_id?, proveedor_id?, producto_id?, almacen_id?, solo_disponible? }
   * @returns {Promise<Array>} Stock consigna
   */
  consultarStock: (params = {}) => apiClient.get('/inventario/consigna/stock', { params }),

  /**
   * Ajustar stock consigna
   * @param {number} stockId
   * @param {Object} data - { cantidad, motivo }
   * @returns {Promise<Object>} Resultado del ajuste
   */
  ajustarStock: (stockId, data) =>
    apiClient.post(`/inventario/consigna/stock/${stockId}/ajuste`, data),

  /**
   * Devolver mercancia al proveedor
   * @param {number} acuerdoId
   * @param {Object} data - { items: [{ producto_id, cantidad, ... }] }
   * @returns {Promise<Object>} Movimientos de devolucion
   */
  devolverMercancia: (acuerdoId, data) =>
    apiClient.post(`/inventario/consigna/acuerdos/${acuerdoId}/devolver`, data),

  // --- LIQUIDACIONES ---

  /**
   * Generar liquidacion
   * @param {Object} data - { acuerdo_id, fecha_desde, fecha_hasta }
   * @returns {Promise<Object>} Liquidacion generada
   */
  generarLiquidacion: (data) => apiClient.post('/inventario/consigna/liquidaciones', data),

  /**
   * Listar liquidaciones
   * @param {Object} params - { acuerdo_id?, proveedor_id?, estado?, limit?, offset? }
   * @returns {Promise<Array>} Liquidaciones
   */
  listarLiquidaciones: (params = {}) =>
    apiClient.get('/inventario/consigna/liquidaciones', { params }),

  /**
   * Obtener liquidacion con detalle
   * @param {number} id
   * @returns {Promise<Object>} Liquidacion con items
   */
  obtenerLiquidacion: (id) => apiClient.get(`/inventario/consigna/liquidaciones/${id}`),

  /**
   * Confirmar liquidacion
   * @param {number} id
   * @returns {Promise<Object>} Liquidacion confirmada
   */
  confirmarLiquidacion: (id) => apiClient.post(`/inventario/consigna/liquidaciones/${id}/confirmar`),

  /**
   * Pagar liquidacion
   * @param {number} id
   * @param {Object} data - { fecha_pago?, metodo_pago?, referencia_pago? }
   * @returns {Promise<Object>} Liquidacion pagada
   */
  pagarLiquidacion: (id, data = {}) =>
    apiClient.post(`/inventario/consigna/liquidaciones/${id}/pagar`, data),

  /**
   * Cancelar liquidacion
   * @param {number} id
   * @returns {Promise<Object>} Resultado
   */
  cancelarLiquidacion: (id) => apiClient.delete(`/inventario/consigna/liquidaciones/${id}`),

  // --- REPORTES ---

  /**
   * Reporte de stock consigna
   * @param {Object} params - { proveedor_id? }
   * @returns {Promise<Array>} Resumen de stock
   */
  reporteStock: (params = {}) =>
    apiClient.get('/inventario/consigna/reportes/stock', { params }),

  /**
   * Reporte de ventas consigna
   * @param {Object} params - { fecha_desde, fecha_hasta }
   * @returns {Promise<Array>} Ventas por producto
   */
  reporteVentas: (params) =>
    apiClient.get('/inventario/consigna/reportes/ventas', { params }),

  /**
   * Reporte pendiente de liquidar
   * @returns {Promise<Array>} Pendiente por acuerdo
   */
  reportePendiente: () => apiClient.get('/inventario/consigna/reportes/pendiente'),
};

// ==================== VACACIONES (Fase 3 - Enero 2026) ====================

export const vacacionesApi = {
  // --- POLÍTICA ---

  /**
   * Obtener política de vacaciones de la organización
   * @returns {Promise<Object>} Política
   */
  obtenerPolitica: () => apiClient.get('/vacaciones/politica'),

  /**
   * Actualizar política de vacaciones
   * @param {Object} data - Datos de la política
   * @returns {Promise<Object>} Política actualizada
   */
  actualizarPolitica: (data) => apiClient.put('/vacaciones/politica', data),

  // --- NIVELES ---

  /**
   * Listar niveles de vacaciones por antigüedad
   * @param {Object} params - { activo? }
   * @returns {Promise<Array>} Niveles
   */
  listarNiveles: (params = {}) => apiClient.get('/vacaciones/niveles', { params }),

  /**
   * Crear nivel de vacaciones
   * @param {Object} data - Datos del nivel
   * @returns {Promise<Object>} Nivel creado
   */
  crearNivel: (data) => apiClient.post('/vacaciones/niveles', data),

  /**
   * Actualizar nivel
   * @param {number} id - ID del nivel
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Nivel actualizado
   */
  actualizarNivel: (id, data) => apiClient.put(`/vacaciones/niveles/${id}`, data),

  /**
   * Eliminar nivel
   * @param {number} id - ID del nivel
   * @returns {Promise<Object>} Resultado
   */
  eliminarNivel: (id) => apiClient.delete(`/vacaciones/niveles/${id}`),

  /**
   * Crear niveles preset por país (México LFT o Colombia)
   * @param {Object} data - { pais: 'mexico'|'colombia', sobrescribir? }
   * @returns {Promise<Array>} Niveles creados
   */
  crearNivelesPreset: (data) => apiClient.post('/vacaciones/niveles/preset', data),

  // --- SALDOS ---

  /**
   * Obtener mi saldo de vacaciones
   * @param {Object} params - { anio? }
   * @returns {Promise<Object>} { saldo, nivel }
   */
  obtenerMiSaldo: (params = {}) => apiClient.get('/vacaciones/mi-saldo', { params }),

  /**
   * Listar saldos de vacaciones (admin)
   * @param {Object} params - { anio?, profesional_id?, con_pendientes?, page?, limit? }
   * @returns {Promise<Object>} { data, total, page, limit }
   */
  listarSaldos: (params = {}) => apiClient.get('/vacaciones/saldos', { params }),

  /**
   * Ajustar saldo manualmente
   * @param {number} id - ID del saldo
   * @param {Object} data - { dias_ajuste, motivo }
   * @returns {Promise<Object>} Saldo actualizado
   */
  ajustarSaldo: (id, data) => apiClient.put(`/vacaciones/saldos/${id}/ajustar`, data),

  /**
   * Generar saldos para un año
   * @param {Object} data - { anio, profesional_id?, sobrescribir? }
   * @returns {Promise<Object>} { creados, actualizados, errores }
   */
  generarSaldosAnio: (data) => apiClient.post('/vacaciones/saldos/generar-anio', data),

  // --- SOLICITUDES ---

  /**
   * Crear solicitud de vacaciones
   * @param {Object} data - { fecha_inicio, fecha_fin, es_medio_dia?, turno_medio_dia?, motivo_solicitud? }
   * @returns {Promise<Object>} Solicitud creada
   */
  crearSolicitud: (data) => apiClient.post('/vacaciones/solicitudes', data),

  /**
   * Listar mis solicitudes
   * @param {Object} params - { estado?, anio?, page?, limit? }
   * @returns {Promise<Object>} { data, total }
   */
  listarMisSolicitudes: (params = {}) => apiClient.get('/vacaciones/mis-solicitudes', { params }),

  /**
   * Listar todas las solicitudes (admin)
   * @param {Object} params - { estado?, profesional_id?, fecha_inicio?, fecha_fin?, anio?, page?, limit? }
   * @returns {Promise<Object>} { data, total }
   */
  listarSolicitudes: (params = {}) => apiClient.get('/vacaciones/solicitudes', { params }),

  /**
   * Listar solicitudes pendientes de aprobación
   * @param {Object} params - { page?, limit? }
   * @returns {Promise<Object>} { data, total }
   */
  listarPendientes: (params = {}) => apiClient.get('/vacaciones/solicitudes/pendientes', { params }),

  /**
   * Obtener solicitud por ID
   * @param {number} id - ID de la solicitud
   * @returns {Promise<Object>} Solicitud
   */
  obtenerSolicitud: (id) => apiClient.get(`/vacaciones/solicitudes/${id}`),

  /**
   * Aprobar solicitud
   * @param {number} id - ID de la solicitud
   * @param {Object} data - { notas_internas? }
   * @returns {Promise<Object>} Solicitud aprobada
   */
  aprobarSolicitud: (id, data = {}) => apiClient.post(`/vacaciones/solicitudes/${id}/aprobar`, data),

  /**
   * Rechazar solicitud
   * @param {number} id - ID de la solicitud
   * @param {Object} data - { motivo_rechazo, notas_internas? }
   * @returns {Promise<Object>} Solicitud rechazada
   */
  rechazarSolicitud: (id, data) => apiClient.post(`/vacaciones/solicitudes/${id}/rechazar`, data),

  /**
   * Cancelar solicitud
   * @param {number} id - ID de la solicitud
   * @param {Object} data - { motivo? }
   * @returns {Promise<Object>} Solicitud cancelada
   */
  cancelarSolicitud: (id, data = {}) => apiClient.delete(`/vacaciones/solicitudes/${id}`, { data }),

  // --- DASHBOARD ---

  /**
   * Obtener dashboard de vacaciones del usuario
   * @param {Object} params - { anio? }
   * @returns {Promise<Object>} Dashboard con saldo, nivel, solicitudes recientes
   */
  obtenerDashboard: (params = {}) => apiClient.get('/vacaciones/dashboard', { params }),

  /**
   * Obtener estadísticas generales (admin)
   * @param {Object} params - { anio?, departamento_id? }
   * @returns {Promise<Object>} Estadísticas
   */
  obtenerEstadisticas: (params = {}) => apiClient.get('/vacaciones/estadisticas', { params }),
};

// ==================== MOTIVOS DE SALIDA (GAP-001) ====================
export const motivosSalidaApi = {
  /**
   * Listar motivos de salida disponibles (sistema + personalizados)
   * @param {Object} params - { solo_sistema, solo_personalizados, activos }
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/motivos-salida', { params }),

  /**
   * Obtener estadísticas de uso de motivos
   * @returns {Promise<Object>}
   */
  estadisticas: () => apiClient.get('/motivos-salida/estadisticas'),

  /**
   * Obtener motivo de salida por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/motivos-salida/${id}`),

  /**
   * Obtener motivo de salida por código
   * @param {string} codigo
   * @returns {Promise<Object>}
   */
  obtenerPorCodigo: (codigo) => apiClient.get(`/motivos-salida/codigo/${codigo}`),

  /**
   * Crear motivo de salida personalizado (solo admin/propietario)
   * @param {Object} data - { codigo, nombre, descripcion, requiere_documentacion, afecta_finiquito, color, icono }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/motivos-salida', data),

  /**
   * Actualizar motivo de salida
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/motivos-salida/${id}`, data),

  /**
   * Eliminar motivo de salida (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/motivos-salida/${id}`),
};

// ==================== UBICACIONES DE TRABAJO (GAP-003) ====================
export const ubicacionesTrabajoApi = {
  /**
   * Listar ubicaciones de trabajo de la organización
   * @param {Object} params - { activas, es_remoto, es_oficina_principal, sucursal_id }
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/ubicaciones-trabajo', { params }),

  /**
   * Obtener estadísticas de uso por día de la semana
   * @returns {Promise<Object>}
   */
  estadisticas: () => apiClient.get('/ubicaciones-trabajo/estadisticas'),

  /**
   * Obtener ubicación de trabajo por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/ubicaciones-trabajo/${id}`),

  /**
   * Crear ubicación de trabajo (solo admin/propietario)
   * @param {Object} data - { codigo, nombre, direccion, ciudad, es_remoto, es_oficina_principal, color, icono }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/ubicaciones-trabajo', data),

  /**
   * Actualizar ubicación de trabajo
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/ubicaciones-trabajo/${id}`, data),

  /**
   * Eliminar ubicación de trabajo (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/ubicaciones-trabajo/${id}`),
};

// ==================== CATEGORÍAS DE PAGO (GAP-004) ====================
export const categoriasPagoApi = {
  /**
   * Listar categorías de pago de la organización
   * @param {Object} params - { activas, ordenar_por }
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/categorias-pago', { params }),

  /**
   * Obtener estadísticas de uso de categorías
   * @returns {Promise<Object>}
   */
  estadisticas: () => apiClient.get('/categorias-pago/estadisticas'),

  /**
   * Obtener categoría de pago por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/categorias-pago/${id}`),

  /**
   * Crear categoría de pago (solo admin/propietario)
   * @param {Object} data - { codigo, nombre, nivel_salarial, permite_comisiones, permite_bonos, permite_viaticos, color, icono }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/categorias-pago', data),

  /**
   * Actualizar categoría de pago
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/categorias-pago/${id}`, data),

  /**
   * Eliminar categoría de pago (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/categorias-pago/${id}`),
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
  website: websiteApi,
  sucursales: sucursalesApi,
  customFields: customFieldsApi,
  notificaciones: notificacionesApi,
  permisos: permisosApi,
  workflows: workflowsApi,
  workflowDesigner: workflowDesignerApi,
  monedas: monedasApi,
  listasPrecios: listasPreciosApi,
  conteos: conteosApi,
  ajustesMasivos: ajustesMasivosApi,
  reorden: reordenApi,
  landedCosts: landedCostsApi,
  dropship: dropshipApi,
  operacionesAlmacen: operacionesAlmacenApi,
  batchPicking: batchPickingApi,
  configuracionAlmacen: configuracionAlmacenApi,
  paquetes: paquetesApi,
  consigna: consignaApi,
  vacaciones: vacacionesApi,
  habilidades: habilidadesApi,
  onboardingEmpleados: onboardingEmpleadosApi,
  motivosSalida: motivosSalidaApi,
  ubicacionesTrabajo: ubicacionesTrabajoApi,
  categoriasPago: categoriasPagoApi,
};
