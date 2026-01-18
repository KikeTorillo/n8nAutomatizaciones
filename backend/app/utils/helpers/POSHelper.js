/**
 * Helper de dominio para operaciones de Punto de Venta (POS)
 * Funciones de cálculo específicas del módulo POS
 *
 * @module utils/helpers/POSHelper
 */

class POSHelper {
  /**
   * Calcula el subtotal de items del carrito
   * @param {Array} items - Array de items con {cantidad, precio_unitario}
   * @returns {number} Subtotal
   */
  static calcularSubtotal(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return 0;
    }

    return items.reduce((total, item) => {
      const cantidad = parseFloat(item.cantidad) || 0;
      const precio = parseFloat(item.precio_unitario || item.precio) || 0;
      return total + (cantidad * precio);
    }, 0);
  }

  /**
   * Aplica descuentos al subtotal
   * @param {number} subtotal - Subtotal antes de descuentos
   * @param {Array} descuentos - Array de descuentos [{tipo: 'porcentaje'|'monto', valor: number}]
   * @returns {Object} { subtotal_con_descuento, total_descuentos, detalle_descuentos }
   */
  static aplicarDescuentos(subtotal, descuentos = []) {
    let totalDescuentos = 0;
    let subtotalActual = subtotal;
    const detalleDescuentos = [];

    for (const descuento of descuentos) {
      let montoDescuento = 0;

      if (descuento.tipo === 'porcentaje') {
        montoDescuento = (subtotalActual * descuento.valor) / 100;
      } else if (descuento.tipo === 'monto') {
        montoDescuento = Math.min(descuento.valor, subtotalActual); // No puede ser mayor al subtotal
      }

      montoDescuento = Math.round(montoDescuento * 100) / 100;
      totalDescuentos += montoDescuento;
      subtotalActual -= montoDescuento;

      detalleDescuentos.push({
        ...descuento,
        monto_aplicado: montoDescuento
      });
    }

    return {
      subtotal_con_descuento: Math.max(0, subtotalActual),
      total_descuentos: totalDescuentos,
      detalle_descuentos: detalleDescuentos
    };
  }

  /**
   * Calcula el IVA
   * @param {number} base - Base gravable
   * @param {number} tasa - Tasa de IVA (default 16 para México)
   * @returns {Object} { iva, base_gravable }
   */
  static calcularIVA(base, tasa = 16) {
    const iva = Math.round((base * tasa / 100) * 100) / 100;
    return {
      iva,
      base_gravable: base,
      tasa
    };
  }

  /**
   * Calcula el total de la venta
   * @param {number} subtotal - Subtotal de items
   * @param {number} descuentos - Total de descuentos
   * @param {number} iva - IVA calculado
   * @returns {number} Total de la venta
   */
  static calcularTotal(subtotal, descuentos = 0, iva = 0) {
    return Math.round((subtotal - descuentos + iva) * 100) / 100;
  }

  /**
   * Calcula el cambio a devolver
   * @param {number} total - Total de la venta
   * @param {number} pagado - Monto pagado
   * @returns {Object} { cambio, requiere_cambio }
   */
  static calcularCambio(total, pagado) {
    const cambio = Math.round((pagado - total) * 100) / 100;
    return {
      cambio: Math.max(0, cambio),
      requiere_cambio: cambio > 0,
      faltante: cambio < 0 ? Math.abs(cambio) : 0
    };
  }

  /**
   * Valida un cupón de descuento
   * @param {Object} cupon - Datos del cupón
   * @param {number} subtotal - Subtotal actual de la venta
   * @returns {Object} { valido: boolean, descuento: number, mensaje: string }
   */
  static validarCupon(cupon, subtotal) {
    const ahora = new Date();

    // Validar existencia
    if (!cupon) {
      return { valido: false, descuento: 0, mensaje: 'Cupón no encontrado' };
    }

    // Validar estado activo
    if (!cupon.activo) {
      return { valido: false, descuento: 0, mensaje: 'Cupón inactivo' };
    }

    // Validar vigencia
    if (cupon.fecha_inicio && new Date(cupon.fecha_inicio) > ahora) {
      return { valido: false, descuento: 0, mensaje: 'Cupón aún no está vigente' };
    }

    if (cupon.fecha_fin && new Date(cupon.fecha_fin) < ahora) {
      return { valido: false, descuento: 0, mensaje: 'Cupón expirado' };
    }

    // Validar usos restantes
    if (cupon.usos_maximos && cupon.usos_actuales >= cupon.usos_maximos) {
      return { valido: false, descuento: 0, mensaje: 'Cupón agotado' };
    }

    // Validar monto mínimo
    if (cupon.monto_minimo && subtotal < cupon.monto_minimo) {
      return {
        valido: false,
        descuento: 0,
        mensaje: `Monto mínimo requerido: $${cupon.monto_minimo}`
      };
    }

    // Calcular descuento
    let descuento;
    if (cupon.tipo_descuento === 'porcentaje') {
      descuento = (subtotal * cupon.valor) / 100;
      // Aplicar tope si existe
      if (cupon.monto_maximo && descuento > cupon.monto_maximo) {
        descuento = cupon.monto_maximo;
      }
    } else {
      descuento = cupon.valor;
    }

    return {
      valido: true,
      descuento: Math.round(descuento * 100) / 100,
      tipo: cupon.tipo_descuento,
      valor_original: cupon.valor,
      mensaje: 'Cupón válido'
    };
  }

  /**
   * Procesa pagos múltiples (split payment)
   * @param {number} total - Total a pagar
   * @param {Array} pagos - Array de pagos [{metodo: string, monto: number}]
   * @returns {Object} { completo: boolean, pagado: number, pendiente: number, pagos_procesados: Array }
   */
  static procesarPagosMultiples(total, pagos = []) {
    let totalPagado = 0;
    const pagosProcesados = [];

    for (const pago of pagos) {
      const monto = parseFloat(pago.monto) || 0;
      totalPagado += monto;

      pagosProcesados.push({
        metodo: pago.metodo,
        monto: monto,
        referencia: pago.referencia || null
      });
    }

    const pendiente = Math.round((total - totalPagado) * 100) / 100;

    return {
      completo: pendiente <= 0,
      pagado: Math.round(totalPagado * 100) / 100,
      pendiente: Math.max(0, pendiente),
      cambio: pendiente < 0 ? Math.abs(pendiente) : 0,
      pagos_procesados: pagosProcesados
    };
  }

  /**
   * Genera número de ticket/folio
   * @param {string} prefijo - Prefijo del ticket (ej: "SUC01")
   * @param {number} secuencial - Número secuencial
   * @returns {string} Número de ticket formateado
   */
  static generarFolioTicket(prefijo, secuencial) {
    const fecha = new Date();
    const fechaParte = fecha.toISOString().slice(2, 10).replace(/-/g, '');
    const secuencialParte = String(secuencial).padStart(6, '0');

    return `${prefijo || 'TKT'}-${fechaParte}-${secuencialParte}`;
  }

  /**
   * Calcula comisión de venta
   * @param {number} montoVenta - Monto de la venta
   * @param {Object} reglaComision - Regla de comisión {tipo, valor, minimo, maximo}
   * @returns {Object} { comision, tipo, aplicada }
   */
  static calcularComision(montoVenta, reglaComision) {
    if (!reglaComision) {
      return { comision: 0, tipo: null, aplicada: false };
    }

    let comision;
    if (reglaComision.tipo === 'porcentaje') {
      comision = (montoVenta * reglaComision.valor) / 100;
    } else {
      comision = reglaComision.valor;
    }

    // Aplicar mínimo y máximo si existen
    if (reglaComision.minimo && comision < reglaComision.minimo) {
      comision = reglaComision.minimo;
    }
    if (reglaComision.maximo && comision > reglaComision.maximo) {
      comision = reglaComision.maximo;
    }

    return {
      comision: Math.round(comision * 100) / 100,
      tipo: reglaComision.tipo,
      aplicada: true
    };
  }
}

module.exports = POSHelper;
