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

// ═══════════════════════════════════════════════════════════════
// MÓDULOS DEL SISTEMA - Fuente única de verdad
// Feb 2026 - Centralización para evitar duplicación
// ═══════════════════════════════════════════════════════════════

/**
 * Configuración completa de módulos del sistema
 * Usado en: ModulosPage, ModuloSelector (onboarding)
 */
export const MODULOS_CONFIG = {
  agendamiento: {
    nombre: 'agendamiento',
    display_name: 'Agendamiento',
    descripcion: 'Citas, profesionales y servicios',
    dependencias: [],
  },
  inventario: {
    nombre: 'inventario',
    display_name: 'Inventario',
    descripcion: 'Productos, proveedores y stock',
    dependencias: [],
  },
  workflows: {
    nombre: 'workflows',
    display_name: 'Aprobaciones',
    descripcion: 'Flujos de aprobación para compras',
    dependencias: ['inventario'],
  },
  pos: {
    nombre: 'pos',
    display_name: 'Punto de Venta',
    descripcion: 'Terminal de venta y caja',
    dependencias: ['inventario'],
  },
  comisiones: {
    nombre: 'comisiones',
    display_name: 'Comisiones',
    descripcion: 'Pago a empleados automático',
    dependencias: [], // Opcional: agendamiento, pos
  },
  contabilidad: {
    nombre: 'contabilidad',
    display_name: 'Contabilidad',
    descripcion: 'Cuentas, asientos y reportes SAT',
    dependencias: [],
  },
  marketplace: {
    nombre: 'marketplace',
    display_name: 'Marketplace',
    descripcion: 'Perfil público y SEO',
    dependencias: ['agendamiento'],
  },
  chatbots: {
    nombre: 'chatbots',
    display_name: 'Chatbots IA',
    descripcion: 'WhatsApp y Telegram',
    dependencias: ['agendamiento'],
  },
  'eventos-digitales': {
    nombre: 'eventos-digitales',
    display_name: 'Eventos',
    descripcion: 'Invitaciones y acomodo de mesas',
    dependencias: [],
  },
  website: {
    nombre: 'website',
    display_name: 'Mi Sitio Web',
    descripcion: 'Página web pública',
    dependencias: [],
  },
  'suscripciones-negocio': {
    nombre: 'suscripciones-negocio',
    display_name: 'Suscripciones',
    descripcion: 'Membresías y cobros recurrentes',
    dependencias: [],
  },
};

/**
 * Lista de módulos para onboarding/selector (excluye core)
 * Derivado de MODULOS_CONFIG para mantener consistencia
 */
export const MODULOS_LISTA = Object.values(MODULOS_CONFIG);

/**
 * Colores por módulo - Variaciones de Nexo Purple
 * Usados tanto en ModulosPage como ModuloSelector
 */
export const MODULOS_COLORES = {
  core: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  agendamiento: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
  inventario: 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300',
  workflows: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
  pos: 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400',
  comisiones: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
  contabilidad: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
  marketplace: 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400',
  chatbots: 'bg-primary-50 dark:bg-primary-900/30 text-primary-400 dark:text-primary-300',
  'eventos-digitales': 'bg-primary-50 dark:bg-primary-900/30 text-primary-400 dark:text-primary-300',
  website: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
  'suscripciones-negocio': 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
};
