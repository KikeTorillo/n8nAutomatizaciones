/**
 * Constantes para el módulo de Sistema
 * Configuración compartida
 * Ene 2026 - Query keys migradas a @/hooks/config/queryKeys.js
 */

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
