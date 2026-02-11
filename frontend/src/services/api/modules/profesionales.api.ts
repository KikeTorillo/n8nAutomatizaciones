import apiClient from '../client';

// ==================== INTERFACES ====================

interface ProfesionalCreateData {
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  especialidad?: string;
  usuario_id?: number | null;
  departamento_id?: number | null;
  puesto_id?: number | null;
  supervisor_id?: number | null;
  fecha_ingreso?: string;
  [key: string]: unknown;
}

interface ProfesionalUpdateData extends Partial<ProfesionalCreateData> {
  estado?: string;
}

interface ProfesionalListParams {
  estado?: string;
  departamento_id?: number;
  sucursal_id?: number;
  activo?: boolean;
  buscar?: string;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

interface DocumentoUpdateData {
  nombre?: string;
  tipo_documento?: string;
  fecha_vencimiento?: string | null;
  notas?: string;
  [key: string]: unknown;
}

interface DocumentoVerificarData {
  verificado: boolean;
  notas_verificacion?: string;
}

interface CuentaBancariaData {
  banco: string;
  tipo_cuenta: string;
  numero_cuenta: string;
  clabe?: string;
  es_principal?: boolean;
  [key: string]: unknown;
}

interface ExperienciaData {
  empresa: string;
  puesto: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  descripcion?: string;
  es_actual?: boolean;
  [key: string]: unknown;
}

interface EducacionData {
  institucion: string;
  titulo: string;
  nivel: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  en_curso?: boolean;
  [key: string]: unknown;
}

interface HabilidadAsignacion {
  habilidad_id: number;
  nivel?: string;
  notas?: string;
}

interface HabilidadBatchData {
  habilidades: HabilidadAsignacion[];
}

interface HabilidadUpdateData {
  nivel?: string;
  notas?: string;
  [key: string]: unknown;
}

interface HabilidadVerificarData {
  verificado: boolean;
  notas_verificacion?: string;
}

interface OnboardingTareaData {
  completada: boolean;
  notas?: string;
}

interface ReordenarData {
  orden: number[];
}

/**
 * API de Profesionales
 * Gestión de profesionales, educación, experiencia, habilidades, documentos
 */
export const profesionalesApi = {
  /** Crear profesional */
  crear: (data: ProfesionalCreateData) => apiClient.post('/profesionales', data),

  /** Crear múltiples profesionales en transacción (bulk) */
  crearBulk: (profesionales: ProfesionalCreateData[]) => apiClient.post('/profesionales/bulk-create', {
    profesionales
  }),

  /** Listar profesionales con filtros */
  listar: (params: ProfesionalListParams = {}) => apiClient.get('/profesionales', { params }),

  /** Obtener profesional por ID */
  obtener: (id: number) => apiClient.get(`/profesionales/${id}`),

  /** Actualizar profesional */
  actualizar: (id: number, data: ProfesionalUpdateData) => apiClient.put(`/profesionales/${id}`, data),

  /** Eliminar profesional */
  eliminar: (id: number) => apiClient.delete(`/profesionales/${id}`),

  // ========== Modelo Unificado Profesional-Usuario (Nov 2025) ==========

  /** Buscar profesional vinculado a un usuario */
  buscarPorUsuario: (usuarioId: number) => apiClient.get(`/profesionales/por-usuario/${usuarioId}`),

  /** Obtener usuarios disponibles para vincular (sin profesional asignado) */
  usuariosDisponibles: () => apiClient.get('/profesionales/usuarios-disponibles'),

  /** Listar profesionales por módulo habilitado */
  listarPorModulo: (modulo: string, params: ProfesionalListParams = {}) => apiClient.get(`/profesionales/por-modulo/${modulo}`, { params }),

  /** Vincular o desvincular usuario a profesional */
  vincularUsuario: (profesionalId: number, usuarioId: number | null) =>
    apiClient.patch(`/profesionales/${profesionalId}/vincular-usuario`, { usuario_id: usuarioId }),

  /** Actualizar módulos habilitados para un profesional */
  actualizarModulos: (profesionalId: number, modulosAcceso: Record<string, boolean>) =>
    apiClient.patch(`/profesionales/${profesionalId}/modulos`, { modulos_acceso: modulosAcceso }),

  // ========== Gestión Empleados - Dic 2025 ==========

  /** Listar profesionales por estado laboral */
  listarPorEstado: (estado: string, params: ProfesionalListParams = {}) =>
    apiClient.get('/profesionales', { params: { estado, ...params } }),

  /** Listar profesionales por departamento */
  listarPorDepartamento: (departamentoId: number, params: ProfesionalListParams = {}) =>
    apiClient.get('/profesionales', { params: { departamento_id: departamentoId, ...params } }),

  /** Obtener subordinados de un profesional */
  obtenerSubordinados: (profesionalId: number, params: ProfesionalListParams = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/subordinados`, { params }),

  /** Obtener cadena de supervisores de un profesional */
  obtenerCadenaSupervisores: (profesionalId: number) =>
    apiClient.get(`/profesionales/${profesionalId}/supervisores`),

  /** Obtener categorías de un profesional */
  obtenerCategorias: (profesionalId: number) =>
    apiClient.get(`/profesionales/${profesionalId}/categorias`),

  /** Asignar categoría a un profesional */
  asignarCategoria: (profesionalId: number, categoriaId: number) =>
    apiClient.post(`/profesionales/${profesionalId}/categorias`, { categoria_id: categoriaId }),

  /** Eliminar categoría de un profesional */
  eliminarCategoria: (profesionalId: number, categoriaId: number) =>
    apiClient.delete(`/profesionales/${profesionalId}/categorias/${categoriaId}`),

  /** Sincronizar categorías de un profesional (reemplaza todas) */
  sincronizarCategorias: (profesionalId: number, categoriaIds: number[]) =>
    apiClient.put(`/profesionales/${profesionalId}/categorias`, { categoria_ids: categoriaIds }),

  // ========== Documentos de Empleado - Enero 2026 ==========

  /** Listar documentos de un profesional */
  listarDocumentos: (profesionalId: number, params: ProfesionalListParams = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/documentos`, { params }),

  /** Subir documento de empleado */
  subirDocumento: (profesionalId: number, formData: FormData) =>
    apiClient.post(`/profesionales/${profesionalId}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  /** Obtener documento por ID */
  obtenerDocumento: (profesionalId: number, documentoId: number) =>
    apiClient.get(`/profesionales/${profesionalId}/documentos/${documentoId}`),

  /** Actualizar metadata de documento */
  actualizarDocumento: (profesionalId: number, documentoId: number, data: DocumentoUpdateData) =>
    apiClient.put(`/profesionales/${profesionalId}/documentos/${documentoId}`, data),

  /** Eliminar documento (soft delete) */
  eliminarDocumento: (profesionalId: number, documentoId: number) =>
    apiClient.delete(`/profesionales/${profesionalId}/documentos/${documentoId}`),

  /** Marcar documento como verificado/no verificado */
  verificarDocumento: (profesionalId: number, documentoId: number, data: DocumentoVerificarData) =>
    apiClient.patch(`/profesionales/${profesionalId}/documentos/${documentoId}/verificar`, data),

  /** Obtener URL firmada temporal para descargar documento */
  obtenerUrlDocumento: (profesionalId: number, documentoId: number, params: { expiry?: number } = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/documentos/${documentoId}/presigned`, { params }),

  /** Reemplazar archivo de documento existente */
  reemplazarArchivoDocumento: (profesionalId: number, documentoId: number, formData: FormData) =>
    apiClient.post(`/profesionales/${profesionalId}/documentos/${documentoId}/reemplazar-archivo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // ========== Cuentas Bancarias - Fase 1 Enero 2026 ==========

  /** Listar cuentas bancarias de un profesional */
  listarCuentasBancarias: (profesionalId: number, params: ProfesionalListParams = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/cuentas-bancarias`, { params }),

  /** Crear cuenta bancaria */
  crearCuentaBancaria: (profesionalId: number, data: CuentaBancariaData) =>
    apiClient.post(`/profesionales/${profesionalId}/cuentas-bancarias`, data),

  /** Obtener cuenta bancaria por ID */
  obtenerCuentaBancaria: (profesionalId: number, cuentaId: number) =>
    apiClient.get(`/profesionales/${profesionalId}/cuentas-bancarias/${cuentaId}`),

  /** Actualizar cuenta bancaria */
  actualizarCuentaBancaria: (profesionalId: number, cuentaId: number, data: Partial<CuentaBancariaData>) =>
    apiClient.put(`/profesionales/${profesionalId}/cuentas-bancarias/${cuentaId}`, data),

  /** Eliminar cuenta bancaria (soft delete) */
  eliminarCuentaBancaria: (profesionalId: number, cuentaId: number) =>
    apiClient.delete(`/profesionales/${profesionalId}/cuentas-bancarias/${cuentaId}`),

  /** Establecer cuenta bancaria como principal */
  establecerCuentaPrincipal: (profesionalId: number, cuentaId: number) =>
    apiClient.patch(`/profesionales/${profesionalId}/cuentas-bancarias/${cuentaId}/principal`),

  // ========== Experiencia Laboral - Fase 4 Enero 2026 ==========

  /** Listar experiencia laboral de un profesional */
  listarExperiencia: (profesionalId: number, params: ProfesionalListParams = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/experiencia`, { params }),

  /** Crear experiencia laboral */
  crearExperiencia: (profesionalId: number, data: ExperienciaData) =>
    apiClient.post(`/profesionales/${profesionalId}/experiencia`, data),

  /** Obtener experiencia laboral por ID */
  obtenerExperiencia: (profesionalId: number, experienciaId: number) =>
    apiClient.get(`/profesionales/${profesionalId}/experiencia/${experienciaId}`),

  /** Actualizar experiencia laboral */
  actualizarExperiencia: (profesionalId: number, experienciaId: number, data: Partial<ExperienciaData>) =>
    apiClient.put(`/profesionales/${profesionalId}/experiencia/${experienciaId}`, data),

  /** Eliminar experiencia laboral (soft delete) */
  eliminarExperiencia: (profesionalId: number, experienciaId: number) =>
    apiClient.delete(`/profesionales/${profesionalId}/experiencia/${experienciaId}`),

  /** Reordenar experiencia laboral */
  reordenarExperiencia: (profesionalId: number, data: ReordenarData) =>
    apiClient.patch(`/profesionales/${profesionalId}/experiencia/reordenar`, data),

  /** Obtener empleo actual del profesional */
  obtenerEmpleoActual: (profesionalId: number) =>
    apiClient.get(`/profesionales/${profesionalId}/experiencia/actual`),

  // ========== Educación Formal - Fase 4 Enero 2026 ==========

  /** Listar educación formal de un profesional */
  listarEducacion: (profesionalId: number, params: ProfesionalListParams = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/educacion`, { params }),

  /** Crear registro de educación formal */
  crearEducacion: (profesionalId: number, data: EducacionData) =>
    apiClient.post(`/profesionales/${profesionalId}/educacion`, data),

  /** Obtener educación por ID */
  obtenerEducacion: (profesionalId: number, educacionId: number) =>
    apiClient.get(`/profesionales/${profesionalId}/educacion/${educacionId}`),

  /** Actualizar educación formal */
  actualizarEducacion: (profesionalId: number, educacionId: number, data: Partial<EducacionData>) =>
    apiClient.put(`/profesionales/${profesionalId}/educacion/${educacionId}`, data),

  /** Eliminar educación formal (soft delete) */
  eliminarEducacion: (profesionalId: number, educacionId: number) =>
    apiClient.delete(`/profesionales/${profesionalId}/educacion/${educacionId}`),

  /** Reordenar educación formal */
  reordenarEducacion: (profesionalId: number, data: ReordenarData) =>
    apiClient.patch(`/profesionales/${profesionalId}/educacion/reordenar`, data),

  /** Obtener estudios en curso del profesional */
  obtenerEducacionEnCurso: (profesionalId: number) =>
    apiClient.get(`/profesionales/${profesionalId}/educacion/en-curso`),

  // ========== Habilidades de Empleado - Fase 4 Enero 2026 ==========

  /** Listar habilidades de un profesional */
  listarHabilidades: (profesionalId: number, params: ProfesionalListParams = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/habilidades`, { params }),

  /** Asignar habilidad a profesional */
  asignarHabilidad: (profesionalId: number, data: HabilidadAsignacion) =>
    apiClient.post(`/profesionales/${profesionalId}/habilidades`, data),

  /** Asignar múltiples habilidades en batch */
  asignarHabilidadesBatch: (profesionalId: number, data: HabilidadBatchData) =>
    apiClient.post(`/profesionales/${profesionalId}/habilidades/batch`, data),

  /** Obtener habilidad de empleado por ID */
  obtenerHabilidadEmpleado: (profesionalId: number, habilidadEmpleadoId: number) =>
    apiClient.get(`/profesionales/${profesionalId}/habilidades/${habilidadEmpleadoId}`),

  /** Actualizar habilidad de empleado */
  actualizarHabilidadEmpleado: (profesionalId: number, habilidadEmpleadoId: number, data: HabilidadUpdateData) =>
    apiClient.put(`/profesionales/${profesionalId}/habilidades/${habilidadEmpleadoId}`, data),

  /** Eliminar habilidad de empleado (soft delete) */
  eliminarHabilidadEmpleado: (profesionalId: number, habilidadEmpleadoId: number) =>
    apiClient.delete(`/profesionales/${profesionalId}/habilidades/${habilidadEmpleadoId}`),

  /** Verificar/desverificar habilidad de empleado */
  verificarHabilidadEmpleado: (profesionalId: number, habilidadEmpleadoId: number, data: HabilidadVerificarData) =>
    apiClient.patch(`/profesionales/${profesionalId}/habilidades/${habilidadEmpleadoId}/verificar`, data),

  // ========== Onboarding de Empleado - Fase 5 Enero 2026 ==========

  /** Aplicar plantilla de onboarding a un profesional */
  aplicarOnboarding: (profesionalId: number, plantillaId: number) =>
    apiClient.post(`/profesionales/${profesionalId}/onboarding/aplicar`, { plantilla_id: plantillaId }),

  /** Obtener progreso de onboarding de un profesional */
  obtenerProgresoOnboarding: (profesionalId: number, params: ProfesionalListParams = {}) =>
    apiClient.get(`/profesionales/${profesionalId}/onboarding/progreso`, { params }),

  /** Marcar tarea de onboarding como completada/pendiente */
  marcarTareaOnboarding: (profesionalId: number, tareaId: number, data: OnboardingTareaData) =>
    apiClient.patch(`/profesionales/${profesionalId}/onboarding/progreso/${tareaId}`, data),

  /** Eliminar todo el progreso de onboarding de un profesional */
  eliminarProgresoOnboarding: (profesionalId: number) =>
    apiClient.delete(`/profesionales/${profesionalId}/onboarding`),
};

// ==================== ONBOARDING DE EMPLEADOS ====================
