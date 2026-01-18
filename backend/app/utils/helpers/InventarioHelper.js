/**
 * Helper de dominio para operaciones de Inventario
 * Funciones de cálculo y validación específicas del módulo de inventario
 *
 * @module utils/helpers/InventarioHelper
 */

class InventarioHelper {
  /**
   * Calcula el costo usando método FIFO (First In, First Out)
   * @param {Array} capas - Array de capas con {cantidad, costo_unitario}
   * @param {number} cantidadRequerida - Cantidad a extraer
   * @returns {Object} { costo_total, cantidad_satisfecha, capas_usadas, capas_restantes }
   */
  static calcularCostoFIFO(capas, cantidadRequerida) {
    let cantidadRestante = cantidadRequerida;
    let costoTotal = 0;
    const capasUsadas = [];
    const capasRestantes = [];

    // Ordenar por fecha (las más antiguas primero)
    const capasOrdenadas = [...capas].sort((a, b) =>
      new Date(a.fecha || a.creado_en) - new Date(b.fecha || b.creado_en)
    );

    for (const capa of capasOrdenadas) {
      if (cantidadRestante <= 0) {
        capasRestantes.push({ ...capa });
        continue;
      }

      const cantidadDeEstaCapatomar = Math.min(cantidadRestante, capa.cantidad);
      const costoDeLaCapa = cantidadDeEstaCapatomar * capa.costo_unitario;

      costoTotal += costoDeLaCapa;
      cantidadRestante -= cantidadDeEstaCapatomar;

      capasUsadas.push({
        ...capa,
        cantidad_usada: cantidadDeEstaCapatomar,
        costo_parcial: costoDeLaCapa
      });

      // Si queda cantidad en esta capa, añadir el resto a capas restantes
      const cantidadRestanteEnCapa = capa.cantidad - cantidadDeEstaCapatomar;
      if (cantidadRestanteEnCapa > 0) {
        capasRestantes.push({
          ...capa,
          cantidad: cantidadRestanteEnCapa
        });
      }
    }

    return {
      costo_total: costoTotal,
      costo_unitario_promedio: cantidadRequerida > 0 ? costoTotal / (cantidadRequerida - cantidadRestante) : 0,
      cantidad_satisfecha: cantidadRequerida - cantidadRestante,
      cantidad_faltante: cantidadRestante,
      capas_usadas: capasUsadas,
      capas_restantes: capasRestantes
    };
  }

  /**
   * Calcula el nuevo costo promedio ponderado tras una entrada
   * @param {number} stockActual - Stock actual antes de la entrada
   * @param {number} costoActual - Costo promedio actual
   * @param {number} cantidadEntrada - Cantidad que entra
   * @param {number} costoEntrada - Costo unitario de la entrada
   * @returns {Object} { nuevo_costo_promedio, valor_total }
   */
  static calcularPromedioTrasEntrada(stockActual, costoActual, cantidadEntrada, costoEntrada) {
    const valorActual = stockActual * costoActual;
    const valorEntrada = cantidadEntrada * costoEntrada;
    const nuevoStock = stockActual + cantidadEntrada;

    if (nuevoStock <= 0) {
      return {
        nuevo_costo_promedio: 0,
        valor_total: 0,
        nuevo_stock: 0
      };
    }

    const nuevoValorTotal = valorActual + valorEntrada;
    const nuevoCostoPromedio = nuevoValorTotal / nuevoStock;

    return {
      nuevo_costo_promedio: Math.round(nuevoCostoPromedio * 100) / 100, // Redondear a 2 decimales
      valor_total: nuevoValorTotal,
      nuevo_stock: nuevoStock
    };
  }

  /**
   * Valida si hay stock disponible suficiente
   * @param {number} disponible - Stock disponible
   * @param {number} requerido - Stock requerido
   * @returns {Object} { disponible: boolean, faltante: number, mensaje: string }
   */
  static validarStockDisponible(disponible, requerido) {
    const faltante = requerido - disponible;

    if (faltante > 0) {
      return {
        disponible: false,
        faltante: faltante,
        mensaje: `Stock insuficiente. Disponible: ${disponible}, Requerido: ${requerido}, Faltante: ${faltante}`
      };
    }

    return {
      disponible: true,
      faltante: 0,
      mensaje: 'Stock suficiente disponible'
    };
  }

  /**
   * Calcula el punto de reorden basado en consumo promedio
   * @param {number} consumoPromedioDiario - Consumo promedio diario
   * @param {number} tiempoEntrega - Días de tiempo de entrega del proveedor
   * @param {number} stockSeguridad - Días adicionales de stock de seguridad
   * @returns {Object} { punto_reorden, stock_seguridad_unidades }
   */
  static calcularPuntoReorden(consumoPromedioDiario, tiempoEntrega, stockSeguridad = 2) {
    const stockSeguridadUnidades = consumoPromedioDiario * stockSeguridad;
    const puntoReorden = (consumoPromedioDiario * tiempoEntrega) + stockSeguridadUnidades;

    return {
      punto_reorden: Math.ceil(puntoReorden),
      stock_seguridad_unidades: Math.ceil(stockSeguridadUnidades),
      consumo_durante_entrega: Math.ceil(consumoPromedioDiario * tiempoEntrega)
    };
  }

  /**
   * Calcula rotación de inventario
   * @param {number} costoVentas - Costo de productos vendidos en el período
   * @param {number} inventarioPromedio - Inventario promedio (inicio + fin / 2)
   * @returns {Object} { rotacion, dias_inventario }
   */
  static calcularRotacion(costoVentas, inventarioPromedio) {
    if (inventarioPromedio <= 0) {
      return {
        rotacion: 0,
        dias_inventario: 0,
        mensaje: 'No hay inventario promedio para calcular'
      };
    }

    const rotacion = costoVentas / inventarioPromedio;
    const diasInventario = rotacion > 0 ? 365 / rotacion : 0;

    return {
      rotacion: Math.round(rotacion * 100) / 100,
      dias_inventario: Math.round(diasInventario),
      mensaje: `El inventario rota ${rotacion.toFixed(2)} veces al año (${Math.round(diasInventario)} días promedio)`
    };
  }

  /**
   * Clasifica producto según análisis ABC
   * @param {number} valorAnual - Valor anual del producto (precio * cantidad vendida)
   * @param {number} valorTotalInventario - Valor total de todo el inventario
   * @param {number} porcentajeAcumulado - Porcentaje acumulado previo
   * @returns {Object} { clasificacion, porcentaje, porcentaje_acumulado }
   */
  static clasificarABC(valorAnual, valorTotalInventario, porcentajeAcumulado = 0) {
    const porcentaje = valorTotalInventario > 0
      ? (valorAnual / valorTotalInventario) * 100
      : 0;

    const nuevoPorcentajeAcumulado = porcentajeAcumulado + porcentaje;

    let clasificacion;
    if (nuevoPorcentajeAcumulado <= 80) {
      clasificacion = 'A'; // Alto valor (80% del valor)
    } else if (nuevoPorcentajeAcumulado <= 95) {
      clasificacion = 'B'; // Valor medio (15% del valor)
    } else {
      clasificacion = 'C'; // Bajo valor (5% del valor)
    }

    return {
      clasificacion,
      porcentaje: Math.round(porcentaje * 100) / 100,
      porcentaje_acumulado: Math.round(nuevoPorcentajeAcumulado * 100) / 100
    };
  }

  /**
   * Genera código SKU basado en categoría y producto
   * @param {string} categoriaCode - Código de la categoría
   * @param {string} productoNombre - Nombre del producto
   * @param {number} secuencial - Número secuencial
   * @returns {string} Código SKU generado
   */
  static generarSKU(categoriaCode, productoNombre, secuencial) {
    const categoriaParte = (categoriaCode || 'GEN').substring(0, 3).toUpperCase();
    const productoParte = (productoNombre || 'PRD')
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    const secuencialParte = String(secuencial).padStart(4, '0');

    return `${categoriaParte}-${productoParte}-${secuencialParte}`;
  }
}

module.exports = InventarioHelper;
