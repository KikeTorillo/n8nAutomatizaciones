import apiClient from '@/services/api/client';

/**
 * API de Autenticación
 */
export const authApi = {
  /**
   * Login de usuario
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} { user, accessToken, refreshToken }
   */
  login: (credentials) => apiClient.post('/auth/login', credentials),

  // NOTA: refreshToken se maneja automáticamente en client.js via httpOnly cookie
  // No exponer función manual para evitar confusión

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
   * Actualizar perfil del usuario autenticado
   * @param {Object} data - { nombre, apellidos, telefono, etc. }
   * @returns {Promise<Object>} { usuario }
   */
  actualizarPerfil: (data) => apiClient.put('/auth/profile', data),

  /**
   * Verificar email con token
   * @param {string} token - Token de verificación de email
   * @returns {Promise<Object>} { verificado, ya_verificado, email, mensaje }
   */
  verificarEmail: (token) => apiClient.get(`/auth/verificar-email/${token}`),

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

  // ===== Cambio de Sucursal - Ene 2026 =====

  /**
   * Cambiar sucursal activa (regenera tokens)
   * Invalida token anterior y genera nuevo con sucursalId actualizado
   * @param {Object} data - { sucursal_id }
   * @returns {Promise<Object>} { sucursal, accessToken, expiresIn }
   */
  cambiarSucursal: (data) => apiClient.post('/auth/cambiar-sucursal', data),

  /**
   * Cambiar contraseña del usuario autenticado
   * @param {Object} data - { passwordAnterior, passwordNueva }
   * @returns {Promise<Object>} { success, message }
   */
  cambiarPassword: (data) => apiClient.post('/auth/change-password', data),
};

export default authApi;
