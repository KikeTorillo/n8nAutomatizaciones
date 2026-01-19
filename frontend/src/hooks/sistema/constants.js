/**
 * Constantes para el módulo de Sistema
 * Query keys y configuración compartida
 * Ene 2026 - Centralización de query keys
 */

/**
 * Query keys para React Query - Sistema
 */
export const SISTEMA_KEYS = {
  all: ['sistema'],

  // Workflows y Aprobaciones
  workflows: {
    all: () => ['workflows'],
    definiciones: (params) => ['workflow-definiciones', params],
    definicion: (id) => ['workflow-definicion', id],
    instancia: (id) => ['instancia-workflow', id],
    aprobacionesPendientes: (params) => ['aprobaciones-pendientes', params],
    aprobacionesCount: () => ['aprobaciones-count'],
    historialAprobaciones: (params) => ['historial-aprobaciones', params],
    delegaciones: (params) => ['delegaciones', params],
    validacion: (id) => ['workflow-validacion', id],
    definicionWorkflow: (id) => ['definicion-workflow', id],
    definicionesWorkflow: (params) => ['definiciones-workflow', params],
  },

  // Designer de Workflows
  designer: {
    entidades: () => ['designer-entidades'],
    roles: () => ['designer-roles'],
    permisos: () => ['designer-permisos'],
  },

  // Notificaciones
  notificaciones: {
    all: () => ['notificaciones'],
    list: (params) => [...SISTEMA_KEYS.notificaciones.all(), 'list', params],
    count: () => ['notificaciones-count'],
    preferencias: () => ['notificaciones-preferencias'],
    tipos: () => ['notificaciones-tipos'],
    plantillas: () => ['notificaciones-plantillas'],
  },

  // App Notifications (Dashboard)
  appNotifications: {
    citasHoy: () => ['app-notifications', 'citas-hoy'],
    alertasInventario: () => ['app-notifications', 'alertas-inventario'],
    ventasHoy: () => ['app-notifications', 'ventas-hoy'],
    aprobacionesPendientes: () => ['app-notifications', 'aprobaciones-pendientes'],
  },

  // SuperAdmin
  superAdmin: {
    all: () => ['superadmin'],
    dashboard: () => ['superadmin', 'dashboard'],
    organizaciones: (filtros) => ['superadmin', 'organizaciones', filtros],
    planes: () => ['superadmin', 'planes'],
    perfilesAdmin: (params) => ['perfiles-admin', params],
    estadisticasPerfil: () => ['estadisticas-perfil'],
    perfilesMarketplace: () => ['perfiles-marketplace'],
  },

  // Sucursales
  sucursales: {
    all: () => ['sucursales'],
    list: (params) => [...SISTEMA_KEYS.sucursales.all(), 'list', params],
    detail: (id) => ['sucursal', id],
    matriz: () => ['sucursal-matriz'],
    byUsuario: (usuarioId) => ['sucursales-usuario', usuarioId],
    usuarios: (sucursalId) => ['sucursal-usuarios', sucursalId],
    profesionales: (sucursalId) => ['sucursal-profesionales', sucursalId],
    metricas: (params) => ['metricas-sucursales', params],
  },

  // Transferencias entre sucursales
  transferencias: {
    all: () => ['transferencias'],
    list: (params) => [...SISTEMA_KEYS.transferencias.all(), 'list', params],
    detail: (id) => ['transferencia', id],
  },

  // Custom Fields
  customFields: {
    all: () => ['custom-fields'],
    definiciones: (params) => ['custom-fields-definiciones', params],
    definicion: (id) => ['custom-field-definicion', id],
    valores: (entidadTipo, entidadId) => ['custom-fields-valores', entidadTipo, entidadId],
    secciones: (entidadTipo) => ['custom-fields-secciones', entidadTipo],
  },

  // Permisos y Acceso
  permisos: {
    all: () => ['permisos'],
    permiso: (codigoPermiso, sucursalId) => ['permiso', codigoPermiso, sucursalId],
    resumen: (userId, sucursalId) => ['permisos-resumen', userId, sucursalId],
    profesionalUsuario: (userId) => ['profesional-usuario', userId],
    usuariosDisponibles: () => ['usuarios-disponibles'],
  },
};

/**
 * Estados de Instancia de Workflow
 */
export const ESTADOS_WORKFLOW = {
  PENDIENTE: 'pendiente',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
  CANCELADO: 'cancelado',
  EN_REVISION: 'en_revision',
};

/**
 * Tipos de Notificación
 */
export const TIPOS_NOTIFICACION = {
  INFO: 'info',
  ALERTA: 'alerta',
  URGENTE: 'urgente',
  SISTEMA: 'sistema',
  APROBACION: 'aprobacion',
};

/**
 * Estados de Sucursal
 */
export const ESTADOS_SUCURSAL = {
  ACTIVA: 'activa',
  INACTIVA: 'inactiva',
  EN_CONSTRUCCION: 'en_construccion',
  CERRADA: 'cerrada',
};

/**
 * Tipos de Custom Field
 */
export const TIPOS_CUSTOM_FIELD = {
  TEXTO: 'texto',
  NUMERO: 'numero',
  FECHA: 'fecha',
  BOOLEAN: 'boolean',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  TEXTAREA: 'textarea',
  URL: 'url',
  EMAIL: 'email',
  TELEFONO: 'telefono',
};

/**
 * Entidades que soportan Custom Fields
 */
export const ENTIDADES_CUSTOM_FIELDS = {
  CLIENTE: 'cliente',
  PROFESIONAL: 'profesional',
  PRODUCTO: 'producto',
  CITA: 'cita',
  VENTA: 'venta',
  ORDEN_COMPRA: 'orden_compra',
};
