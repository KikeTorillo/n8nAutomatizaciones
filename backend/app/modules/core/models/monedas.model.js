/**
 * ====================================================================
 * MODEL - MONEDAS
 * ====================================================================
 *
 * Gestión de monedas, tasas de cambio y conversiones.
 * Módulo: Multi-Moneda (Fase 4)
 */

const { getDb } = require('../../../config/database');
const logger = require('../../../utils/logger');

class MonedasModel {
    // ========================================================================
    // CATÁLOGO DE MONEDAS
    // ========================================================================

    /**
     * Listar todas las monedas
     * @param {boolean} soloActivas - Filtrar solo monedas activas
     * @returns {Promise<Array>}
     */
    static async listar(soloActivas = true) {
        const db = await getDb();
        try {
            const query = `
                SELECT
                    codigo, nombre, simbolo, decimales, locale, activo, orden
                FROM monedas
                ${soloActivas ? 'WHERE activo = true' : ''}
                ORDER BY orden, codigo
            `;
            const result = await db.query(query);
            return result.rows;
        } finally {
            db.release();
        }
    }

    /**
     * Obtener una moneda por código
     * @param {string} codigo - Código ISO de la moneda (MXN, USD, etc.)
     * @returns {Promise<Object|null>}
     */
    static async obtenerPorCodigo(codigo) {
        const db = await getDb();
        try {
            const query = `
                SELECT codigo, nombre, simbolo, decimales, locale, activo, orden
                FROM monedas
                WHERE codigo = $1
            `;
            const result = await db.query(query, [codigo.toUpperCase()]);
            return result.rows[0] || null;
        } finally {
            db.release();
        }
    }

    // ========================================================================
    // TASAS DE CAMBIO
    // ========================================================================

    /**
     * Obtener tasa de cambio más reciente
     * @param {string} origen - Moneda origen
     * @param {string} destino - Moneda destino
     * @param {Date} fecha - Fecha de referencia (default: hoy)
     * @returns {Promise<Object|null>}
     */
    static async obtenerTasa(origen, destino, fecha = new Date()) {
        const db = await getDb();
        try {
            // Si son la misma moneda
            if (origen.toUpperCase() === destino.toUpperCase()) {
                return {
                    moneda_origen: origen.toUpperCase(),
                    moneda_destino: destino.toUpperCase(),
                    tasa: 1.0,
                    fecha: fecha,
                    fuente: 'sistema'
                };
            }

            const query = `
                SELECT
                    moneda_origen, moneda_destino, tasa, fecha, fuente, creado_en
                FROM tasas_cambio
                WHERE moneda_origen = $1
                  AND moneda_destino = $2
                  AND fecha <= $3
                ORDER BY fecha DESC
                LIMIT 1
            `;
            const result = await db.query(query, [
                origen.toUpperCase(),
                destino.toUpperCase(),
                fecha
            ]);

            if (result.rows.length > 0) {
                return result.rows[0];
            }

            // Intentar tasa inversa
            const inversa = await db.query(query, [
                destino.toUpperCase(),
                origen.toUpperCase(),
                fecha
            ]);

            if (inversa.rows.length > 0) {
                const tasaInversa = inversa.rows[0];
                return {
                    moneda_origen: origen.toUpperCase(),
                    moneda_destino: destino.toUpperCase(),
                    tasa: 1 / tasaInversa.tasa,
                    fecha: tasaInversa.fecha,
                    fuente: tasaInversa.fuente + ' (inversa)',
                    calculada: true
                };
            }

            return null;
        } finally {
            db.release();
        }
    }

    /**
     * Guardar nueva tasa de cambio
     * @param {Object} datos - { moneda_origen, moneda_destino, tasa, fuente }
     * @returns {Promise<Object>}
     */
    static async guardarTasa(datos) {
        const db = await getDb();
        try {
            const { moneda_origen, moneda_destino, tasa, fuente = 'manual' } = datos;

            const query = `
                INSERT INTO tasas_cambio (moneda_origen, moneda_destino, tasa, fecha, fuente)
                VALUES ($1, $2, $3, CURRENT_DATE, $4)
                ON CONFLICT (moneda_origen, moneda_destino, fecha)
                DO UPDATE SET tasa = $3, fuente = $4, actualizado_en = NOW()
                RETURNING *
            `;

            const result = await db.query(query, [
                moneda_origen.toUpperCase(),
                moneda_destino.toUpperCase(),
                tasa,
                fuente
            ]);

            logger.info('[Monedas] Tasa de cambio guardada', {
                origen: moneda_origen,
                destino: moneda_destino,
                tasa
            });

            return result.rows[0];
        } finally {
            db.release();
        }
    }

    /**
     * Obtener historial de tasas de cambio
     * @param {string} origen - Moneda origen
     * @param {string} destino - Moneda destino
     * @param {number} dias - Días de historial (default: 30)
     * @returns {Promise<Array>}
     */
    static async obtenerHistorialTasas(origen, destino, dias = 30) {
        const db = await getDb();
        try {
            const query = `
                SELECT moneda_origen, moneda_destino, tasa, fecha, fuente
                FROM tasas_cambio
                WHERE moneda_origen = $1
                  AND moneda_destino = $2
                  AND fecha >= CURRENT_DATE - $3
                ORDER BY fecha DESC
            `;
            const result = await db.query(query, [
                origen.toUpperCase(),
                destino.toUpperCase(),
                dias
            ]);
            return result.rows;
        } finally {
            db.release();
        }
    }

    // ========================================================================
    // CONVERSIÓN DE MONEDA
    // ========================================================================

    /**
     * Convertir monto entre monedas
     * @param {number} monto - Monto a convertir
     * @param {string} origen - Moneda origen
     * @param {string} destino - Moneda destino
     * @param {Date} fecha - Fecha de referencia
     * @returns {Promise<Object>}
     */
    static async convertir(monto, origen, destino, fecha = new Date()) {
        const tasa = await this.obtenerTasa(origen, destino, fecha);

        if (!tasa) {
            throw new Error(`No hay tasa de cambio disponible de ${origen} a ${destino}`);
        }

        const montoConvertido = Math.round(monto * tasa.tasa * 100) / 100;

        return {
            monto_original: monto,
            moneda_origen: origen.toUpperCase(),
            monto_convertido: montoConvertido,
            moneda_destino: destino.toUpperCase(),
            tasa_utilizada: tasa.tasa,
            fecha_tasa: tasa.fecha,
            fuente_tasa: tasa.fuente
        };
    }

    /**
     * Convertir múltiples montos
     * @param {Array<{monto: number, moneda: string}>} items - Items a convertir
     * @param {string} monedaDestino - Moneda destino
     * @returns {Promise<Array>}
     */
    static async convertirMultiple(items, monedaDestino) {
        const resultados = await Promise.all(
            items.map(async (item) => {
                const conversion = await this.convertir(
                    item.monto,
                    item.moneda,
                    monedaDestino
                );
                return {
                    ...item,
                    ...conversion
                };
            })
        );
        return resultados;
    }

    // ========================================================================
    // PRECIOS MULTI-MONEDA (SERVICIOS)
    // ========================================================================

    /**
     * Obtener precio de servicio en moneda específica
     * @param {number} servicioId
     * @param {string} moneda
     * @param {number} organizacionId
     * @returns {Promise<Object|null>}
     */
    static async obtenerPrecioServicio(servicioId, moneda, organizacionId) {
        const db = await getDb();
        try {
            const query = `
                SELECT id, servicio_id, moneda, precio, precio_minimo, precio_maximo, activo
                FROM precios_servicio_moneda
                WHERE servicio_id = $1 AND moneda = $2 AND organizacion_id = $3
            `;
            const result = await db.query(query, [servicioId, moneda.toUpperCase(), organizacionId]);
            return result.rows[0] || null;
        } finally {
            db.release();
        }
    }

    /**
     * Guardar precio de servicio en moneda
     * @param {Object} datos
     * @param {number} organizacionId
     * @returns {Promise<Object>}
     */
    static async guardarPrecioServicio(datos, organizacionId) {
        const db = await getDb();
        try {
            const { servicio_id, moneda, precio, precio_minimo, precio_maximo } = datos;

            const query = `
                INSERT INTO precios_servicio_moneda
                    (servicio_id, moneda, precio, precio_minimo, precio_maximo, organizacion_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (servicio_id, moneda)
                DO UPDATE SET
                    precio = $3,
                    precio_minimo = $4,
                    precio_maximo = $5,
                    actualizado_en = NOW()
                RETURNING *
            `;

            const result = await db.query(query, [
                servicio_id,
                moneda.toUpperCase(),
                precio,
                precio_minimo,
                precio_maximo,
                organizacionId
            ]);

            return result.rows[0];
        } finally {
            db.release();
        }
    }

    // ========================================================================
    // PRECIOS MULTI-MONEDA (PRODUCTOS)
    // ========================================================================

    /**
     * Obtener precio de producto en moneda específica
     * @param {number} productoId
     * @param {string} moneda
     * @param {number} organizacionId
     * @returns {Promise<Object|null>}
     */
    static async obtenerPrecioProducto(productoId, moneda, organizacionId) {
        const db = await getDb();
        try {
            const query = `
                SELECT id, producto_id, moneda, precio_compra, precio_venta, precio_mayoreo, activo
                FROM precios_producto_moneda
                WHERE producto_id = $1 AND moneda = $2 AND organizacion_id = $3
            `;
            const result = await db.query(query, [productoId, moneda.toUpperCase(), organizacionId]);
            return result.rows[0] || null;
        } finally {
            db.release();
        }
    }

    /**
     * Guardar precio de producto en moneda
     * @param {Object} datos
     * @param {number} organizacionId
     * @returns {Promise<Object>}
     */
    static async guardarPrecioProducto(datos, organizacionId) {
        const db = await getDb();
        try {
            const { producto_id, moneda, precio_compra, precio_venta, precio_mayoreo } = datos;

            const query = `
                INSERT INTO precios_producto_moneda
                    (producto_id, moneda, precio_compra, precio_venta, precio_mayoreo, organizacion_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (producto_id, moneda)
                DO UPDATE SET
                    precio_compra = $3,
                    precio_venta = $4,
                    precio_mayoreo = $5,
                    actualizado_en = NOW()
                RETURNING *
            `;

            const result = await db.query(query, [
                producto_id,
                moneda.toUpperCase(),
                precio_compra,
                precio_venta,
                precio_mayoreo,
                organizacionId
            ]);

            return result.rows[0];
        } finally {
            db.release();
        }
    }
}

module.exports = MonedasModel;
