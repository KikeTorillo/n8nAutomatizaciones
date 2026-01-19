const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { ErrorHelper } = require('../../../utils/helpers');

/**
 * Model para gestión de reservas de stock - Arquitectura Superior
 *
 * PRINCIPIOS DE DISEÑO (Superior a Odoo):
 * 1. SSOT: Reservas solo en una tabla
 * 2. stock_disponible SIEMPRE calculado, NUNCA almacenado
 * 3. Validación atómica en PostgreSQL
 * 4. Soporte completo para variantes de producto
 *
 * @since Dic 2025 - Fase 1 Gaps Inventario
 * @version 2.0 - Arquitectura Superior (28 Dic 2025)
 */
class ReservasModel {

    // Tiempo de expiración por defecto (minutos)
    static DEFAULT_EXPIRACION_MINUTOS = 15;

    // Tipos de origen válidos
    static TIPOS_ORIGEN = {
        VENTA_POS: 'venta_pos',
        ORDEN_VENTA: 'orden_venta',
        COTIZACION: 'cotizacion',
        CITA_SERVICIO: 'cita_servicio',
        TRANSFERENCIA: 'transferencia',
        ORDEN_PRODUCCION: 'orden_produccion',
        RESERVA_MANUAL: 'reserva_manual'
    };

    // Estados de reserva
    static ESTADOS = {
        ACTIVA: 'activa',
        CONFIRMADA: 'confirmada',
        EXPIRADA: 'expirada',
        LIBERADA: 'liberada',
        CANCELADA: 'cancelada'
    };

    // =========================================================================
    // MÉTODOS DE CONSULTA DE STOCK
    // =========================================================================

    /**
     * Obtener stock disponible (real - reservado)
     * Soporta productos Y variantes
     * @param {Object} params - { productoId, varianteId, sucursalId }
     * @param {number} organizacionId - ID de la organización
     */
    static async stockDisponible({ productoId = null, varianteId = null, sucursalId = null }, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT stock_disponible($1, $2, $3) as disponible`;
            const result = await db.query(query, [
                varianteId ? null : productoId,  // Si hay variante, no enviar producto_id
                varianteId,
                sucursalId
            ]);
            return result.rows[0]?.disponible || 0;
        });
    }

    /**
     * Obtener información completa de stock
     * @param {Object} params - { productoId, varianteId, sucursalId }
     * @param {number} organizacionId - ID de la organización
     */
    static async stockInfoCompleto({ productoId = null, varianteId = null, sucursalId = null }, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT * FROM stock_info_completo($1, $2, $3)`;
            const result = await db.query(query, [
                varianteId ? null : productoId,
                varianteId,
                sucursalId
            ]);
            return result.rows[0] || {
                stock_actual: 0,
                stock_reservado: 0,
                stock_disponible: 0,
                reservas_activas: 0
            };
        });
    }

    /**
     * Obtener stock disponible para múltiples productos/variantes
     * ✅ FIX v2.1: Refactorizado para evitar N+1 - usa una sola query con unnest()
     * @param {Array<Object>} items - Array de { producto_id, variante_id }
     * @param {number} organizacionId - ID de la organización
     * @param {number|null} sucursalId - ID de sucursal (opcional)
     */
    static async stockDisponibleMultiple(items, organizacionId, sucursalId = null) {
        if (!items || items.length === 0) {
            return {};
        }

        return await RLSContextManager.query(organizacionId, async (db) => {
            // Preparar arrays para unnest
            const productoIds = items.map(i => i.variante_id ? null : i.producto_id);
            const varianteIds = items.map(i => i.variante_id || null);

            // Una sola query para todos los items
            const query = `
                WITH items AS (
                    SELECT
                        unnest($1::int[]) as producto_id,
                        unnest($2::int[]) as variante_id
                )
                SELECT
                    i.producto_id,
                    i.variante_id,
                    stock_disponible(i.producto_id, i.variante_id, $3) as stock_disponible,
                    stock_reservado(i.producto_id, i.variante_id, $3) as stock_reservado,
                    COALESCE(p.nombre, 'Producto') as nombre,
                    COALESCE(p.ruta_preferida, 'normal') as ruta_preferida
                FROM items i
                LEFT JOIN productos p ON p.id = COALESCE(
                    i.producto_id,
                    (SELECT producto_id FROM producto_variantes WHERE id = i.variante_id)
                )
            `;

            const result = await db.query(query, [productoIds, varianteIds, sucursalId]);

            // Construir mapa de resultados
            const resultMap = {};
            for (const row of result.rows) {
                const key = row.variante_id
                    ? `variante_${row.variante_id}`
                    : `producto_${row.producto_id}`;
                resultMap[key] = row;
            }

            return resultMap;
        });
    }

    // =========================================================================
    // MÉTODOS DE CREACIÓN DE RESERVAS
    // =========================================================================

    /**
     * Crear una nueva reserva de stock (producto o variante)
     * Usa función atómica con SKIP LOCKED para concurrencia segura
     * @param {number} organizacionId - ID de la organización
     * @param {Object} data - Datos de la reserva
     * @param {number|null} usuarioId - ID del usuario que crea la reserva
     */
    static async crear(organizacionId, data, usuarioId = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ReservasModel.crear] Iniciando reserva atómica', {
                organizacion_id: organizacionId,
                producto_id: data.producto_id,
                variante_id: data.variante_id,
                cantidad: data.cantidad,
                tipo_origen: data.tipo_origen
            });

            // Usar función SQL atómica con SKIP LOCKED
            // Orden correcto: org, cantidad, tipo, producto_id, variante_id, origen_id, origen_ref, sucursal, usuario, mins
            const query = `
                SELECT * FROM crear_reserva_atomica(
                    $1::INTEGER,   -- organizacion_id
                    $2::INTEGER,   -- cantidad
                    $3::VARCHAR,   -- tipo_origen
                    $4::INTEGER,   -- producto_id (null si es variante)
                    $5::INTEGER,   -- variante_id (null si es producto)
                    $6::INTEGER,   -- origen_id
                    $7::VARCHAR,   -- origen_referencia
                    $8::INTEGER,   -- sucursal_id
                    $9::INTEGER,   -- usuario_id
                    $10::INTEGER   -- minutos_expiracion
                )
            `;

            const values = [
                organizacionId,
                data.cantidad,
                data.tipo_origen,
                data.variante_id ? null : data.producto_id,  // Si hay variante, no enviar producto_id
                data.variante_id || null,
                data.origen_id || null,
                data.origen_referencia || null,
                data.sucursal_id || null,
                usuarioId,
                data.minutos_expiracion || this.DEFAULT_EXPIRACION_MINUTOS
            ];

            const result = await db.query(query, values);
            const response = result.rows[0];

            if (!response.exito) {
                logger.warn('[ReservasModel.crear] Reserva fallida', {
                    mensaje: response.mensaje,
                    stock_disponible: response.stock_disponible_antes
                });
                ErrorHelper.throwConflict(response.mensaje);
            }

            logger.info('[ReservasModel.crear] Reserva creada exitosamente', {
                reserva_id: response.reserva_id,
                stock_antes: response.stock_disponible_antes,
                stock_despues: response.stock_disponible_despues
            });

            // Retornar la reserva completa
            return await this.obtenerPorIdInterno(response.reserva_id, db);
        });
    }

    /**
     * Crear reserva para producto (wrapper de compatibilidad)
     */
    static async crearParaProducto(productoId, cantidad, tipoOrigen, organizacionId, opciones = {}) {
        return await this.crear({
            producto_id: productoId,
            variante_id: null,
            cantidad,
            tipo_origen: tipoOrigen,
            ...opciones
        }, organizacionId, opciones.usuario_id);
    }

    /**
     * Crear reserva para variante
     */
    static async crearParaVariante(varianteId, cantidad, tipoOrigen, organizacionId, opciones = {}) {
        return await this.crear({
            producto_id: null,  // Se obtiene automáticamente en la función SQL
            variante_id: varianteId,
            cantidad,
            tipo_origen: tipoOrigen,
            ...opciones
        }, organizacionId, opciones.usuario_id);
    }

    /**
     * Crear múltiples reservas en una transacción atómica
     *
     * NOTA DE RENDIMIENTO (v2.1):
     * Este método usa un loop para llamar a crear_reserva_atomica por cada item.
     * La función SQL usa SKIP LOCKED para evitar race conditions en stock.
     * Optimización con unnest() requeriría crear_reservas_batch() en PostgreSQL
     * que maneje arrays con validación atómica de stock.
     * El overhead actual es aceptable ya que:
     * - Todas las queries van a la misma conexión (dentro de transacción)
     * - El SKIP LOCKED garantiza concurrencia segura
     *
     * @param {Array} items - Array de { producto_id, variante_id, cantidad }
     * @param {string} tipoOrigen - Tipo de origen (venta_pos, etc.)
     * @param {number} organizacionId - ID de la organización
     * @param {Object} opciones - { origen_id, origen_referencia, sucursal_id, usuario_id }
     */
    static async crearMultiple(items, tipoOrigen, organizacionId, opciones = {}) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const reservas = [];
            const errores = [];

            for (const item of items) {
                try {
                    // Orden: org, cantidad, tipo, producto_id, variante_id, origen_id, origen_ref, sucursal, usuario, mins
                    const query = `
                        SELECT * FROM crear_reserva_atomica(
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
                        )
                    `;

                    const values = [
                        organizacionId,
                        item.cantidad,
                        tipoOrigen,
                        item.variante_id ? null : item.producto_id,
                        item.variante_id || null,
                        opciones.origen_id || null,
                        opciones.origen_referencia || null,
                        opciones.sucursal_id || null,
                        opciones.usuario_id || null,
                        this.DEFAULT_EXPIRACION_MINUTOS
                    ];

                    const result = await db.query(query, values);
                    const response = result.rows[0];

                    if (response.exito) {
                        reservas.push({
                            reserva_id: response.reserva_id,
                            producto_id: item.producto_id,
                            variante_id: item.variante_id,
                            cantidad: item.cantidad,
                            stock_disponible_despues: response.stock_disponible_despues
                        });
                    } else {
                        errores.push({
                            producto_id: item.producto_id,
                            variante_id: item.variante_id,
                            cantidad: item.cantidad,
                            error: response.mensaje
                        });
                    }
                } catch (error) {
                    errores.push({
                        producto_id: item.producto_id,
                        variante_id: item.variante_id,
                        cantidad: item.cantidad,
                        error: error.message
                    });
                }
            }

            // Si hay errores, hacer rollback de todo
            if (errores.length > 0) {
                logger.error('[ReservasModel.crearMultiple] Errores en reservas', { errores });
                ErrorHelper.throwConflict(`Error en ${errores.length} reservas: ${errores.map(e => e.error).join(', ')}`);
            }

            logger.info('[ReservasModel.crearMultiple] Reservas creadas', {
                total: reservas.length,
                tipo_origen: tipoOrigen
            });

            return reservas;
        });
    }

    // =========================================================================
    // MÉTODOS DE CONFIRMACIÓN Y LIBERACIÓN
    // =========================================================================

    /**
     * Confirmar una reserva
     * NOTA: El descuento de stock lo hace el trigger de venta
     * @param {number} reservaId - ID de la reserva
     * @param {number} organizacionId - ID de la organización
     * @param {number|null} usuarioId - ID del usuario que confirma
     */
    static async confirmar(reservaId, organizacionId, usuarioId = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ReservasModel.confirmar] Confirmando reserva', {
                reserva_id: reservaId
            });

            const query = `SELECT confirmar_reserva_stock($1, $2) as resultado`;
            const result = await db.query(query, [reservaId, usuarioId]);

            if (result.rows[0].resultado) {
                logger.info('[ReservasModel.confirmar] Reserva confirmada', {
                    reserva_id: reservaId
                });
                return await this.obtenerPorIdInterno(reservaId, db);
            }

            ErrorHelper.throwConflict('No se pudo confirmar la reserva');
        });
    }

    /**
     * Confirmar múltiples reservas
     * @param {Array<number>} reservaIds - Array de IDs de reservas
     * @param {number} organizacionId - ID de la organización
     * @param {number|null} usuarioId - ID del usuario que confirma
     */
    static async confirmarMultiple(reservaIds, organizacionId, usuarioId = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const confirmadas = [];
            const errores = [];

            for (const reservaId of reservaIds) {
                try {
                    const query = `SELECT confirmar_reserva_stock($1, $2) as resultado`;
                    const result = await db.query(query, [reservaId, usuarioId]);

                    if (result.rows[0].resultado) {
                        confirmadas.push(reservaId);
                    } else {
                        errores.push({ reserva_id: reservaId, error: 'No se pudo confirmar' });
                    }
                } catch (error) {
                    errores.push({ reserva_id: reservaId, error: error.message });
                }
            }

            logger.info('[ReservasModel.confirmarMultiple] Reservas confirmadas', {
                total: confirmadas.length,
                errores: errores.length
            });

            return { confirmadas, errores };
        });
    }

    /**
     * Liberar una reserva (cancelar manualmente)
     * @param {number} reservaId - ID de la reserva
     * @param {number} organizacionId - ID de la organización
     * @param {string|null} motivo - Motivo de liberación
     */
    static async liberar(reservaId, organizacionId, motivo = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ReservasModel.liberar] Liberando reserva', {
                reserva_id: reservaId,
                motivo
            });

            const query = `SELECT liberar_reserva($1, $2) as resultado`;
            const result = await db.query(query, [reservaId, motivo]);

            if (result.rows[0].resultado) {
                logger.info('[ReservasModel.liberar] Reserva liberada', {
                    reserva_id: reservaId
                });
                return true;
            }

            return false;
        });
    }

    /**
     * Alias de liberar para compatibilidad
     */
    static async cancelar(reservaId, organizacionId) {
        return await this.liberar(reservaId, organizacionId, 'Cancelada');
    }

    /**
     * Liberar reservas por origen (ej: todas las reservas de una venta)
     * @param {string} tipoOrigen - Tipo de origen
     * @param {number} origenId - ID del origen
     * @param {number} organizacionId - ID de la organización
     * @param {string|null} motivo - Motivo de liberación
     */
    static async liberarPorOrigen(tipoOrigen, origenId, organizacionId, motivo = null) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const query = `SELECT liberar_reservas_por_origen($1, $2, $3) as cantidad`;
            const result = await db.query(query, [tipoOrigen, origenId, motivo]);

            const cantidad = result.rows[0].cantidad;

            logger.info('[ReservasModel.liberarPorOrigen] Reservas liberadas', {
                tipo_origen: tipoOrigen,
                origen_id: origenId,
                cantidad
            });

            return cantidad;
        });
    }

    /**
     * Alias para compatibilidad
     */
    static async cancelarPorOrigen(tipoOrigen, origenId, organizacionId) {
        return await this.liberarPorOrigen(tipoOrigen, origenId, organizacionId, 'Cancelado por origen');
    }

    // =========================================================================
    // MÉTODOS DE CONSULTA DE RESERVAS
    // =========================================================================

    /**
     * Listar reservas con filtros
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros de búsqueda
     */
    static async listar(organizacionId, filtros) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let query = `
                SELECT
                    r.*,
                    p.nombre as producto_nombre,
                    p.sku as producto_sku,
                    v.nombre_variante,
                    v.sku as variante_sku,
                    u.nombre as usuario_nombre,
                    uc.nombre as confirmado_por_nombre
                FROM reservas_stock r
                JOIN productos p ON p.id = r.producto_id
                LEFT JOIN variantes_producto v ON v.id = r.variante_id
                LEFT JOIN usuarios u ON u.id = r.creado_por
                LEFT JOIN usuarios uc ON uc.id = r.confirmada_por
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

            if (filtros.variante_id) {
                query += ` AND r.variante_id = $${paramIndex++}`;
                values.push(filtros.variante_id);
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

            if (filtros.solo_activas) {
                query += ` AND r.estado = 'activa' AND r.expira_en > NOW()`;
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
     * Buscar reserva por ID
     */
    static async buscarPorId(organizacionId, reservaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            return await this.obtenerPorIdInterno(reservaId, db);
        });
    }

    /**
     * Obtener resumen de reservas activas
     */
    static async resumenActivas(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT * FROM resumen_reservas_activas($1)`;
            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }

    // =========================================================================
    // MÉTODOS DE UTILIDAD
    // =========================================================================

    /**
     * Verificar si hay stock suficiente
     * @param {Object} params - { productoId, varianteId, cantidad, sucursalId }
     * @param {number} organizacionId - ID de la organización
     */
    static async verificarDisponibilidad({ productoId, varianteId, cantidad, sucursalId }, organizacionId) {
        const disponible = await this.stockDisponible(
            { productoId, varianteId, sucursalId },
            organizacionId
        );

        return {
            disponible,
            suficiente: disponible >= cantidad,
            faltante: Math.max(0, cantidad - disponible)
        };
    }

    /**
     * Extender tiempo de expiración de una reserva
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

    /**
     * Obtener stock desde vista de tiempo real
     */
    static async obtenerStockTiempoReal(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let query = `
                SELECT * FROM v_stock_disponible_tiempo_real
                WHERE 1=1
            `;

            const values = [];
            let paramIndex = 1;

            if (filtros.nivel_stock) {
                query += ` AND nivel_stock = $${paramIndex++}`;
                values.push(filtros.nivel_stock);
            }

            if (filtros.producto_id) {
                query += ` AND producto_id = $${paramIndex++}`;
                values.push(filtros.producto_id);
            }

            if (filtros.solo_agotados) {
                query += ` AND nivel_stock = 'agotado'`;
            }

            if (filtros.solo_bajos) {
                query += ` AND nivel_stock IN ('agotado', 'bajo')`;
            }

            query += ` ORDER BY nivel_stock, nombre`;

            if (filtros.limit) {
                query += ` LIMIT $${paramIndex++}`;
                values.push(filtros.limit);
            }

            const result = await db.query(query, values);
            return result.rows;
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
                p.sku as producto_sku,
                v.nombre_variante,
                v.sku as variante_sku
            FROM reservas_stock r
            JOIN productos p ON p.id = r.producto_id
            LEFT JOIN variantes_producto v ON v.id = r.variante_id
            WHERE r.id = $1
        `;

        const result = await db.query(query, [reservaId]);
        return result.rows[0] || null;
    }
}

module.exports = ReservasModel;
