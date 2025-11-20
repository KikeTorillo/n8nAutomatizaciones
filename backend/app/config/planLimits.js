/**
 * Configuración de Límites por Plan de Suscripción
 *
 * Define los límites de recursos para cada plan, incluyendo
 * los nuevos módulos de Inventario y POS.
 *
 * IMPORTANTE: Esta configuración debe sincronizarse con:
 * - Tabla `planes_subscripcion` en PostgreSQL
 * - Middleware `subscription.js` para validación
 * - Frontend para mostrar límites al usuario
 */

const PLAN_LIMITS = {
    /**
     * Plan Gratuito / Trial (14 días)
     * Límites restrictivos para evaluar el sistema
     */
    gratuito: {
        // Core
        profesionales: 2,
        servicios: 5,
        clientes: 50,
        citas_mes: 50,

        // Inventario y POS
        productos: 20,
        categorias_productos: 5,
        proveedores: 2,
        ventas_pos_mes: 50,

        // Features
        chatbots: 0, // No disponible
        marketplace: false,
        reportes_avanzados: false,
        comisiones: false
    },

    /**
     * Plan Básico ($15 USD/mes)
     * Para negocios pequeños con necesidades básicas
     */
    basico: {
        // Core
        profesionales: 3,
        servicios: 15,
        clientes: 500,
        citas_mes: 200,

        // Inventario y POS
        productos: 100,
        categorias_productos: 20,
        proveedores: 10,
        ventas_pos_mes: 500,

        // Features
        chatbots: 1, // Solo 1 plataforma (Telegram o WhatsApp)
        marketplace: true,
        reportes_avanzados: false,
        comisiones: true
    },

    /**
     * Plan Profesional ($34 USD/mes)
     * Para negocios en crecimiento - PLAN RECOMENDADO
     */
    profesional: {
        // Core
        profesionales: 10,
        servicios: 50,
        clientes: 2000,
        citas_mes: 1000,

        // Inventario y POS
        productos: 500,
        categorias_productos: 50,
        proveedores: 30,
        ventas_pos_mes: 2000,

        // Features
        chatbots: 2, // Telegram + WhatsApp
        marketplace: true,
        reportes_avanzados: true,
        comisiones: true
    },

    /**
     * Plan Empresarial ($79 USD/mes)
     * Para negocios con múltiples sucursales o alto volumen
     */
    empresarial: {
        // Core
        profesionales: -1, // Ilimitado
        servicios: -1,
        clientes: -1,
        citas_mes: -1,

        // Inventario y POS
        productos: -1, // Ilimitado
        categorias_productos: -1,
        proveedores: -1,
        ventas_pos_mes: -1,

        // Features
        chatbots: 2,
        marketplace: true,
        reportes_avanzados: true,
        comisiones: true,
        soporte_prioritario: true,
        api_access: true
    }
};

/**
 * Obtener límites del plan
 * @param {string} planNombre - Nombre del plan (gratuito, basico, profesional, empresarial)
 * @returns {object} Límites del plan
 */
function getLimits(planNombre) {
    const limits = PLAN_LIMITS[planNombre.toLowerCase()];

    if (!limits) {
        throw new Error(`Plan desconocido: ${planNombre}`);
    }

    return limits;
}

/**
 * Verificar si un límite es ilimitado
 * @param {number} limit - Valor del límite (-1 = ilimitado)
 * @returns {boolean}
 */
function isUnlimited(limit) {
    return limit === -1;
}

/**
 * Verificar si se ha excedido un límite
 * @param {number} currentCount - Cantidad actual
 * @param {number} limit - Límite del plan
 * @returns {boolean}
 */
function hasExceededLimit(currentCount, limit) {
    if (isUnlimited(limit)) {
        return false;
    }

    return currentCount >= limit;
}

/**
 * Calcular límites restantes
 * @param {number} currentCount - Cantidad actual
 * @param {number} limit - Límite del plan
 * @returns {number} Cantidad restante (0 si excedido, -1 si ilimitado)
 */
function getRemainingLimit(currentCount, limit) {
    if (isUnlimited(limit)) {
        return -1;
    }

    const remaining = limit - currentCount;
    return Math.max(0, remaining);
}

/**
 * Obtener mensaje de error personalizado cuando se excede un límite
 * @param {string} resource - Recurso (productos, ventas_pos_mes, etc.)
 * @param {string} planNombre - Nombre del plan actual
 * @returns {string}
 */
function getLimitExceededMessage(resource, planNombre) {
    const limits = getLimits(planNombre);
    const limit = limits[resource];

    const resourceNames = {
        productos: 'productos',
        categorias_productos: 'categorías de productos',
        proveedores: 'proveedores',
        ventas_pos_mes: 'ventas POS mensuales',
        profesionales: 'profesionales',
        servicios: 'servicios',
        clientes: 'clientes',
        citas_mes: 'citas mensuales'
    };

    const resourceName = resourceNames[resource] || resource;

    if (isUnlimited(limit)) {
        return null; // No hay límite
    }

    return `Has alcanzado el límite de ${limit} ${resourceName} para el plan ${planNombre}. ` +
           `Actualiza tu plan para continuar.`;
}

module.exports = {
    PLAN_LIMITS,
    getLimits,
    isUnlimited,
    hasExceededLimit,
    getRemainingLimit,
    getLimitExceededMessage
};
