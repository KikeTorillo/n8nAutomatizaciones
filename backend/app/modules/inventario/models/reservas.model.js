const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

/**
 * Model para gestión de reservas de stock
 * Evita sobreventa en ventas concurrentes
 * @since Dic 2025 - Fase 1 Gaps Inventario
 */
class ReservasModel {

    // Tiempo de expiración por defecto (minutos)
    static DEFAULT_EXPIRACION_MINUTOS = 15;

    // =========================================================================
    // MÉTODOS DE CONSULTA
    // =========================================================================

    /**
     * Obtener stock disponible (real - reservado)
     * @param {number} productoId - ID del producto
     * @param {number} organizacionId - ID de la organización
     * @param {number|null} sucursalId - ID de sucursal (opcional)
     */
    static async stockDisponible(productoId, organizacionId, sucursalId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT stock_disponible($1, $2) as disponible`;
            const result = await db.query(query, [productoId, sucursalId]);
            return result.rows[0]?.disponible || 0;
        });
    }

    /**
     * Obtener stock disponible para múltiples productos
     * @param {Array<number>} productosIds - Array de IDs de productos
     * @param {number} organizacionId - ID de la organización
     * @param {number|null} sucursalId - ID de sucursal (opcional)
     */
    static async stockDisponibleMultiple(productosIds, organizacionId, sucursalId = null) {
        if (!productosIds || productosIds.length === 0) {
            return {};
        }

        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    p.id as producto_id,
                    p.nombre,
                    p.stock_actual,
                    stock_disponible(p.id, $2) as stock_disponible
                FROM productos p
                WHERE p.id = ANY($1)
                AND p.activo = true
                AND p.eliminado_en IS NULL
            `;

            const result = await db.query(query, [productosIds, sucursalId]);

            // Convertir a objeto indexado por producto_id
            const stockMap = {};
            for (const row of result.rows) {
                stockMap[row.producto_id] = {
                    nombre: row.nombre,
                    stock_actual: row.stock_actual,
                    stock_disponible: row.stock_disponible
                };
            }
            return stockMap;
        });
    }

    /**
     * Listar reservas activas
     * @param {Object} filtros - Filtros de búsqueda
     * @param {number} organizacionId - ID de la organización
     */
    static async listar(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let query = `
                SELECT
                    r.*,
                    p.nombre as producto_nombre,
                    p.sku as producto_sku,
                    u.nombre as usuario_nombre
                FROM reservas_stock r
                JOIN productos p ON p.id = r.producto_id
                LEFT JOIN usuarios u ON u.id = r.usuario_id
                WHERE 1=1
            `;

            const values = [];
            let paramIndex = 1;

            if (filtros.estado) {
                query += ` AND r.estado = $${paramIndex++}`;
                values.push(filtros.estado);
            }

            if (filtros.producto_id) {
                query += ` AND r.producto_id = $${paramIndex++}`;
                values.push(filtros.producto_id);
            }

            if (filtros.sucursal_id) {
                query += ` AND r.sucursal_id = $${paramIndex++}`;
                values.push(filtros.sucursal_id);
            }

            if (filtros.tipo_origen) {
                query += ` AND r.tipo_origen = $${paramIndex++}`;
                values.push(filtros.tipo_origen);
            }

            if (filtros.origen_id) {
                query += ` AND r.origen_id = $${paramIndex++}`;
                values.push(filtros.origen_id);
            }

            query += ` ORDER BY r.creado_en DESC`;

            if (filtros.limit) {
                query += ` LIMIT $${paramIndex++}`;
                values.push(filtros.limit);
            }

            if (filtros.offset) {
                query += ` OFFSET $${paramIndex++}`;
                values.push(filtros.offset);
            }

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Obtener reserva por ID
     */
    static async obtenerPorId(reservaId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    r.*,
                    p.nombre as producto_nombre,
                    p.sku as producto_sku
                FROM reservas_stock r
                JOIN productos p ON p.id = r.producto_id
                WHERE r.id = $1
            `;

            const result = await db.query(query, [reservaId]);
            return result.rows[0] || null;
        });
    }

    // =========================================================================
    // MÉTODOS DE CREACIÓN
    // =========================================================================

    /**
     * Crear una nueva reserva de stock
     * @param {Object} data - Datos de la reserva
     * @param {number} organizacionId - ID de la organización
     * @param {number|null} usuarioId - ID del usuario que crea la reserva
     */
    static async crear(data, organizacionId, usuarioId = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ReservasModel.crear] Iniciando', {
                organizacion_id: organizacionId,
                producto_id: data.producto_id,
                cantidad: data.cantidad,
                tipo_origen: data.tipo_origen
            });

            // Usar función SQL que valida disponibilidad
            const query = `
                SELECT crear_reserva_stock(
                    $1::INTEGER,  -- organizacion_id
                    $2::INTEGER,  -- producto_id
                    $3::INTEGER,  -- cantidad
                    $4::VARCHAR,  -- tipo_origen
                    $5::INTEGER,  -- origen_id
                    $6::INTEGER,  -- sucursal_id
                    $7::INTEGER,  -- usuario_id
                    $8::INTEGER   -- minutos_expiracion
                ) as reserva_id
            `;

            const values = [
                organizacionId,
                data.producto_id,
                data.cantidad,
                data.tipo_origen,
                data.origen_id || null,
                data.sucursal_id || null,
                usuarioId,
                data.minutos_expiracion || this.DEFAULT_EXPIRACION_MINUTOS
            ];

            const result = await db.query(query, values);
            const reservaId = result.rows[0].reserva_id;

            logger.info('[ReservasModel.crear] Reserva creada', {
                reserva_id: reservaId
            });

            // Retornar la reserva completa
            return await this.obtenerPorIdInterno(reservaId, db);
        });
    }

    /**
     * Crear múltiples reservas en una transacción
     * @param {Array} items - Array de { producto_id, cantidad }
     * @param {string} tipoOrigen - Tipo de origen (venta_pos, etc.)
     * @param {number|null} origenId - ID del origen
     * @param {number} organizacionId - ID de la organización
     * @param {number|null} sucursalId - ID de sucursal
     * @param {number|null} usuarioId - ID del usuario
     */
    static async crearMultiple(items, tipoOrigen, origenId, organizacionId, sucursalId = null, usuarioId = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const reservas = [];

            for (const item of items) {
                const query = `
                    SELECT crear_reserva_stock(
                        $1::INTEGER, $2::INTEGER, $3::INTEGER, $4::VARCHAR,
                        $5::INTEGER, $6::INTEGER, $7::INTEGER, $8::INTEGER
                    ) as reserva_id
                `;

                const values = [
                    organizacionId,
                    item.producto_id,
                    item.cantidad,
                    tipoOrigen,
                    origenId,
                    sucursalId,
                    usuarioId,
                    this.DEFAULT_EXPIRACION_MINUTOS
                ];

                const result = await db.query(query, values);
                reservas.push({
                    reserva_id: result.rows[0].reserva_id,
                    producto_id: item.producto_id,
                    cantidad: item.cantidad
                });
            }

            logger.info('[ReservasModel.crearMultiple] Reservas creadas', {
                total: reservas.length,
                tipo_origen: tipoOrigen
            });

            return reservas;
        });
    }

    // =========================================================================
    // MÉTODOS DE ACTUALIZACIÓN
    // =========================================================================

    /**
     * Confirmar una reserva (descuenta stock real)
     * @param {number} reservaId - ID de la reserva
     * @param {number} organizacionId - ID de la organización
     */
    static async confirmar(reservaId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ReservasModel.confirmar] Confirmando reserva', {
                reserva_id: reservaId
            });

            const query = `SELECT confirmar_reserva_stock($1) as resultado`;
            const result = await db.query(query, [reservaId]);

            if (result.rows[0].resultado) {
                logger.info('[ReservasModel.confirmar] Reserva confirmada', {
                    reserva_id: reservaId
                });
                return await this.obtenerPorIdInterno(reservaId, db);
            }

            throw new Error('No se pudo confirmar la reserva');
        });
    }

    /**
     * Confirmar múltiples reservas
     * @param {Array<number>} reservaIds - Array de IDs de reservas
     * @param {number} organizacionId - ID de la organización
     */
    static async confirmarMultiple(reservaIds, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const confirmadas = [];

            for (const reservaId of reservaIds) {
                const query = `SELECT confirmar_reserva_stock($1) as resultado`;
                const result = await db.query(query, [reservaId]);

                if (result.rows[0].resultado) {
                    confirmadas.push(reservaId);
                }
            }

            logger.info('[ReservasModel.confirmarMultiple] Reservas confirmadas', {
                total: confirmadas.length,
                confirmadas
            });

            return confirmadas;
        });
    }

    /**
     * Cancelar una reserva
     * @param {number} reservaId - ID de la reserva
     * @param {number} organizacionId - ID de la organización
     */
    static async cancelar(reservaId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ReservasModel.cancelar] Cancelando reserva', {
                reserva_id: reservaId
            });

            const query = `SELECT cancelar_reserva_stock($1) as resultado`;
            const result = await db.query(query, [reservaId]);

            if (result.rows[0].resultado) {
                logger.info('[ReservasModel.cancelar] Reserva cancelada', {
                    reserva_id: reservaId
                });
                return true;
            }

            return false;
        });
    }

    /**
     * Cancelar reservas por origen (ej: todas las reservas de una venta)
     * @param {string} tipoOrigen - Tipo de origen
     * @param {number} origenId - ID del origen
     * @param {number} organizacionId - ID de la organización
     */
    static async cancelarPorOrigen(tipoOrigen, origenId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const query = `
                UPDATE reservas_stock
                SET estado = 'cancelada'
                WHERE tipo_origen = $1
                AND origen_id = $2
                AND estado = 'activa'
                RETURNING id
            `;

            const result = await db.query(query, [tipoOrigen, origenId]);

            logger.info('[ReservasModel.cancelarPorOrigen] Reservas canceladas', {
                tipo_origen: tipoOrigen,
                origen_id: origenId,
                total: result.rows.length
            });

            return result.rows.map(r => r.id);
        });
    }

    // =========================================================================
    // MÉTODOS INTERNOS
    // =========================================================================

    /**
     * Obtener reserva por ID (interno, dentro de transacción)
     */
    static async obtenerPorIdInterno(reservaId, db) {
        const query = `
            SELECT
                r.*,
                p.nombre as producto_nombre,
                p.sku as producto_sku
            FROM reservas_stock r
            JOIN productos p ON p.id = r.producto_id
            WHERE r.id = $1
        `;

        const result = await db.query(query, [reservaId]);
        return result.rows[0] || null;
    }

    // =========================================================================
    // MÉTODOS DE UTILIDAD
    // =========================================================================

    /**
     * Verificar si hay stock suficiente para un producto
     * @param {number} productoId - ID del producto
     * @param {number} cantidad - Cantidad requerida
     * @param {number} organizacionId - ID de la organización
     * @param {number|null} sucursalId - ID de sucursal (opcional)
     */
    static async verificarDisponibilidad(productoId, cantidad, organizacionId, sucursalId = null) {
        const disponible = await this.stockDisponible(productoId, organizacionId, sucursalId);
        return {
            disponible,
            suficiente: disponible >= cantidad,
            faltante: Math.max(0, cantidad - disponible)
        };
    }

    /**
     * Extender tiempo de expiración de una reserva
     * @param {number} reservaId - ID de la reserva
     * @param {number} minutosAdicionales - Minutos adicionales
     * @param {number} organizacionId - ID de la organización
     */
    static async extenderExpiracion(reservaId, minutosAdicionales, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const query = `
                UPDATE reservas_stock
                SET expira_en = expira_en + ($2 || ' minutes')::INTERVAL
                WHERE id = $1
                AND estado = 'activa'
                RETURNING *
            `;

            const result = await db.query(query, [reservaId, minutosAdicionales]);
            return result.rows[0] || null;
        });
    }
}

module.exports = ReservasModel;
