/**
 * ====================================================================
 * CONSTANTES GLOBALES DEL SISTEMA
 * ====================================================================
 * Constantes centralizadas para configuración del sistema SaaS.
 * Usadas en múltiples módulos para evitar hardcoding de valores.
 *
 * @module config/constants
 * @author Nexo Team
 * @version 1.0.0
 * @date Enero 2026
 */

/**
 * ID de la organización Nexo Team (dogfooding)
 * - Desarrollo/Local: 1
 * - Producción: 4
 *
 * Esta organización actúa como "la empresa" que gestiona todas las
 * organizaciones de la plataforma como sus clientes.
 */
const NEXO_TEAM_ORG_ID = parseInt(process.env.NEXO_TEAM_ORG_ID) || 1;

/**
 * Módulos válidos del sistema
 * Usados para validación en entitlements y sincronización de suscripciones
 */
const MODULOS_VALIDOS = [
    'agendamiento',
    'inventario',
    'pos',
    'comisiones',
    'contabilidad',
    'marketplace',
    'chatbots',
    'workflows',
    'eventos-digitales',
    'website',
    'suscripciones-negocio'
];

/**
 * Estados válidos para suscripciones
 */
const ESTADOS_SUSCRIPCION = [
    'trial',          // En período de prueba
    'pendiente_pago', // Checkout iniciado, esperando pago
    'activa',         // Suscripción activa (pagando)
    'pausada',        // Temporalmente pausada
    'cancelada',      // Cancelada por el usuario
    'vencida',        // Fallo en el cobro
    'suspendida',     // Suspendida por admin
    'grace_period'    // Período de gracia (solo lectura)
];

/**
 * Períodos de facturación disponibles
 */
const PERIODOS_FACTURACION = [
    'mensual',
    'trimestral',
    'semestral',
    'anual'
];

/**
 * Configuración de Grace Period
 * Tiempo que tiene el usuario para pagar después de un cobro fallido
 */
const GRACE_PERIOD_DAYS = 7;

/**
 * Días después de grace_period antes de suspensión total
 */
const SUSPENSION_DAYS = 14;

/**
 * Secuencia de dunning (recordatorios de pago)
 * Define cuándo enviar notificaciones y cambiar estados
 */
const DUNNING_SEQUENCE = [
    { dias: 0, tipo: 'vencimiento', accion: 'email' },
    { dias: 3, tipo: 'recordatorio', accion: 'email' },
    { dias: 7, tipo: 'grace_period', accion: 'cambiar_estado' },
    { dias: 10, tipo: 'urgente', accion: 'email' },
    { dias: 14, tipo: 'suspension', accion: 'cambiar_estado' },
];

/**
 * Estados agrupados por nivel de acceso
 * - COMPLETO: Acceso total a la plataforma
 * - LIMITADO: Solo lectura (grace_period, vencida)
 * - BLOQUEADOS: Sin acceso, redirect a /planes
 */
const ESTADOS_ACCESO_COMPLETO = ['trial', 'activa', 'pendiente_pago'];
const ESTADOS_ACCESO_LIMITADO = ['grace_period', 'vencida'];
const ESTADOS_BLOQUEADOS = ['suspendida', 'cancelada'];

/**
 * Rutas exentas de verificación de suscripción
 * Estas rutas siempre son accesibles independiente del estado de suscripción
 */
const RUTAS_EXENTAS_SUSCRIPCION = [
    '/api/v1/auth',
    '/api/v1/suscripciones-negocio/suscripciones/mi-suscripcion',
    '/api/v1/suscripciones-negocio/planes/publicos',
    '/api/v1/suscripciones-negocio/checkout',
    '/api/v1/health',
    '/api/v1/webhooks'
];

module.exports = {
    NEXO_TEAM_ORG_ID,
    MODULOS_VALIDOS,
    ESTADOS_SUSCRIPCION,
    PERIODOS_FACTURACION,
    // Grace Period (Ene 2026)
    GRACE_PERIOD_DAYS,
    SUSPENSION_DAYS,
    DUNNING_SEQUENCE,
    ESTADOS_ACCESO_COMPLETO,
    ESTADOS_ACCESO_LIMITADO,
    ESTADOS_BLOQUEADOS,
    RUTAS_EXENTAS_SUSCRIPCION
};
