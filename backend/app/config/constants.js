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
 * Mapeo de features de planes a módulos del sistema
 * Usado para activar/desactivar módulos cuando una suscripción se activa
 *
 * Las features vienen del campo `features[]` en planes_suscripcion_org
 * Los módulos se guardan en `modulos_activos` de organizaciones
 */
const FEATURE_TO_MODULO = {
    'agendamiento': 'agendamiento',
    'inventario': 'inventario',
    'pos': 'pos',
    'comisiones': 'comisiones',
    'contabilidad': 'contabilidad',
    'marketplace': 'marketplace',
    'chatbots': 'chatbots',
    'workflows': 'workflows',
    'eventos-digitales': 'eventos-digitales',
    'website': 'website',
    'suscripciones-negocio': 'suscripciones-negocio'
};

/**
 * Módulos base que siempre están activos (independiente del plan)
 */
const MODULOS_BASE = {
    core: true
};

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
    'suspendida'      // Suspendida por admin
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

module.exports = {
    NEXO_TEAM_ORG_ID,
    FEATURE_TO_MODULO,
    MODULOS_BASE,
    ESTADOS_SUSCRIPCION,
    PERIODOS_FACTURACION
};
