/**
 * Constantes para el módulo de Personas (Profesionales, Clientes, Usuarios)
 * Query keys y configuración compartida
 * Ene 2026 - Centralización de query keys
 */

/**
 * Query keys para React Query - Personas
 */
export const PERSONAS_KEYS = {
  all: ['personas'],

  // Profesionales
  profesionales: {
    all: () => ['profesionales'],
    list: (params) => [...PERSONAS_KEYS.profesionales.all(), 'list', params],
    detail: (id) => ['profesional', id],
    buscar: (termino, options) => ['buscar-profesionales', termino, options],
    byModulo: (modulo, options) => ['profesionales-modulo', modulo, options],
    byEstado: (estado, options) => ['profesionales', { estado, ...options }],
    byDepartamento: (departamentoId, options) => ['profesionales', { departamento_id: departamentoId, ...options }],
    subordinados: (profesionalId, options) => ['profesional-subordinados', profesionalId, options],
    supervisores: (profesionalId) => ['profesional-supervisores', profesionalId],
    categorias: (profesionalId) => ['profesional-categorias', profesionalId],
    servicios: (profesionalId) => ['profesional-servicios', profesionalId],
    usuario: (profesionalId) => ['profesional-usuario', profesionalId],
    sinUsuario: () => ['profesionales-sin-usuario'],
  },

  // Clientes
  clientes: {
    all: () => ['clientes'],
    list: (params) => [...PERSONAS_KEYS.clientes.all(), 'list', params],
    detail: (id) => ['cliente', id],
    buscar: (termino) => ['buscar-clientes', termino],
    etiquetas: (clienteId) => ['cliente-etiquetas', clienteId],
    actividades: (clienteId, params) => ['cliente-actividades', clienteId, params],
    timeline: (clienteId, params) => ['cliente-timeline', clienteId, params],
    actividad: (clienteId, actividadId) => ['cliente-actividad', clienteId, actividadId],
    actividadesConteo: (clienteId) => ['cliente-actividades-conteo', clienteId],
    credito: (clienteId) => ['cliente-credito', clienteId],
    historialCompras: (clienteId) => ['cliente-historial-compras', clienteId],
  },

  // Usuarios
  usuarios: {
    all: () => ['usuarios'],
    list: (params) => [...PERSONAS_KEYS.usuarios.all(), 'list', params],
    detail: (id) => ['usuario', id],
    sinProfesional: () => ['usuarios-sin-profesional'],
    disponibles: () => ['usuarios-disponibles'],
  },

  // Etiquetas de Clientes
  etiquetasClientes: {
    all: () => ['etiquetas-clientes'],
    list: (params) => [...PERSONAS_KEYS.etiquetasClientes.all(), 'list', params],
    detail: (id) => ['etiqueta-cliente', id],
  },

  // Oportunidades (CRM)
  oportunidades: {
    all: () => ['oportunidades'],
    list: (params) => [...PERSONAS_KEYS.oportunidades.all(), 'list', params],
    detail: (id) => ['oportunidad', id],
    byCliente: (clienteId, params) => ['oportunidades-cliente', clienteId, params],
    pipeline: (incluirInactivas) => ['etapas-pipeline', incluirInactivas],
  },

  // Habilidades
  habilidades: {
    all: () => ['habilidades'],
    list: (params) => [...PERSONAS_KEYS.habilidades.all(), 'list', params],
    detail: (id) => ['habilidad', id],
    byProfesional: (profesionalId) => ['profesional-habilidades', profesionalId],
    certificaciones: (habilidadId) => ['habilidad-certificaciones', habilidadId],
  },

  // Vacaciones
  vacaciones: {
    all: () => ['vacaciones'],
    list: (params) => [...PERSONAS_KEYS.vacaciones.all(), 'list', params],
    detail: (id) => ['vacacion', id],
    saldo: (profesionalId, anio) => ['vacaciones-saldo', profesionalId, anio],
    solicitudes: (params) => ['vacaciones-solicitudes', params],
    calendario: (anio, mes) => ['vacaciones-calendario', anio, mes],
  },

  // Ausencias
  ausencias: {
    all: () => ['ausencias'],
    list: (params) => [...PERSONAS_KEYS.ausencias.all(), 'list', params],
    detail: (id) => ['ausencia', id],
    byProfesional: (profesionalId, params) => ['ausencias-profesional', profesionalId, params],
    tipos: () => ['tipos-ausencia'],
  },

  // Incapacidades
  incapacidades: {
    all: () => ['incapacidades'],
    list: (params) => [...PERSONAS_KEYS.incapacidades.all(), 'list', params],
    detail: (id) => ['incapacidad', id],
    byProfesional: (profesionalId) => ['incapacidades-profesional', profesionalId],
  },

  // Departamentos
  departamentos: {
    all: () => ['departamentos'],
    list: (params) => [...PERSONAS_KEYS.departamentos.all(), 'list', params],
    arbol: () => [...PERSONAS_KEYS.departamentos.all(), 'arbol'],
    detail: (id) => ['departamento', id],
  },

  // Categorías de Pago
  categoriasPago: {
    all: () => ['categorias-pago'],
    list: (params) => [...PERSONAS_KEYS.categoriasPago.all(), 'list', params],
    detail: (id) => ['categoria-pago', id],
    profesionales: (categoriaId) => ['categoria-profesionales', categoriaId],
  },
};

/**
 * Estados de Profesional
 */
export const ESTADOS_PROFESIONAL = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  BAJA: 'baja',
  VACACIONES: 'vacaciones',
  INCAPACIDAD: 'incapacidad',
};

/**
 * Estados de Oportunidad
 */
export const ESTADOS_OPORTUNIDAD = {
  NUEVO: 'nuevo',
  CONTACTADO: 'contactado',
  CALIFICADO: 'calificado',
  PROPUESTA: 'propuesta',
  NEGOCIACION: 'negociacion',
  GANADO: 'ganado',
  PERDIDO: 'perdido',
};

/**
 * Estados de Vacaciones
 */
export const ESTADOS_VACACION = {
  SOLICITADA: 'solicitada',
  APROBADA: 'aprobada',
  RECHAZADA: 'rechazada',
  EN_CURSO: 'en_curso',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
};

/**
 * Tipos de Ausencia
 */
export const TIPOS_AUSENCIA = {
  FALTA: 'falta',
  RETARDO: 'retardo',
  PERMISO: 'permiso',
  INCAPACIDAD: 'incapacidad',
  OTRO: 'otro',
};
