/**
 * Constantes del módulo POS
 * Fuente única de verdad para tipos de venta
 */

// Valores permitidos (para validación Joi)
const TIPOS_VENTA = {
  DIRECTA: 'directa',
  COTIZACION: 'cotizacion',
  APARTADO: 'apartado',
  CITA: 'cita',
};

// Configuración detallada (para API y UI)
const TIPOS_VENTA_CONFIG = {
  directa: {
    value: 'directa',
    label: 'Venta Directa',
    description: 'Pago inmediato, stock descontado',
    icon: 'shopping-cart',
    requiere: [],
    reservaStock: false,
    descontarStockInmediato: true,
  },
  cotizacion: {
    value: 'cotizacion',
    label: 'Cotización',
    description: 'Presupuesto sin comprometer stock',
    icon: 'file-text',
    requiere: [],
    reservaStock: false,
    descontarStockInmediato: false,
  },
  apartado: {
    value: 'apartado',
    label: 'Apartado',
    description: 'Reserva de stock con fecha límite',
    icon: 'clock',
    requiere: ['fecha_apartado', 'fecha_vencimiento_apartado'],
    reservaStock: true,
    descontarStockInmediato: false,
  },
  cita: {
    value: 'cita',
    label: 'Venta de Cita',
    description: 'Vinculada a servicio agendado',
    icon: 'calendar',
    requiere: ['cita_id'],
    soloDesdeContexto: true,
    reservaStock: true,
    descontarStockInmediato: false,
  },
};

// Array de valores para Joi.valid()
const TIPOS_VENTA_VALIDOS = Object.values(TIPOS_VENTA);

module.exports = {
  TIPOS_VENTA,
  TIPOS_VENTA_CONFIG,
  TIPOS_VENTA_VALIDOS,
};
