import apiClient from '../client';

/**
 * API de Profesionales
 * Gestión de profesionales, educación, experiencia, habilidades, documentos
 */
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

