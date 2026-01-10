const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

/**
 * Model para Sesiones de Caja POS
 * Gestiona apertura/cierre de caja, movimientos de efectivo y validación de diferencias
 *
 * Ene 2026: Implementación inicial basada en gaps vs Odoo POS
 */
class SesionesCajaModel {

    /**
     * Abrir nueva sesión de caja
     * @param {Object} data - Datos de apertura
     * @param {number} data.sucursal_id - ID de sucursal
     * @param {number} data.usuario_id - ID del usuario/cajero
     * @param {number} data.monto_inicial - Fondo de caja inicial
     * @param {string} data.nota_apertura - Nota opcional
     * @param {number} organizacionId - ID de la organización
     */
    static async abrirSesion(data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[SesionesCajaModel.abrirSesion] Abriendo sesión de caja', {
                organizacion_id: organizacionId,
                sucursal_id: data.sucursal_id,
                usuario_id: data.usuario_id,
                monto_inicial: data.monto_inicial
            });

            // Verificar que no hay sesión abierta para este usuario/sucursal
            const sesionActivaQuery = await db.query(
                `SELECT id, fecha_apertura FROM sesiones_caja
                 WHERE organizacion_id = $1
                 AND sucursal_id = $2
                 AND usuario_id = $3
                 AND estado = 'abierta'`,
                [organizacionId, data.sucursal_id, data.usuario_id]
            );

            if (sesionActivaQuery.rows.length > 0) {
                const sesionActiva = sesionActivaQuery.rows[0];
                throw new Error(
                    `Ya existe una sesión de caja abierta desde ${new Date(sesionActiva.fecha_apertura).toLocaleString()}`
                );
            }

            // Crear nueva sesión
            const query = `
                INSERT INTO sesiones_caja (
                    organizacion_id,
                    sucursal_id,
                    usuario_id,
                    monto_inicial,
                    nota_apertura,
                    fecha_apertura,
                    estado
                ) VALUES ($1, $2, $3, $4, $5, NOW(), 'abierta')
                RETURNING *
            `;

            const result = await db.query(query, [
                organizacionId,
                data.sucursal_id,
                data.usuario_id,
                data.monto_inicial || 0,
                data.nota_apertura || null
            ]);

            const sesion = result.rows[0];

            logger.info('[SesionesCajaModel.abrirSesion] Sesión abierta exitosamente', {
                sesion_id: sesion.id,
                monto_inicial: sesion.monto_inicial
            });

            return sesion;
        });
    }

    /**
     * Obtener sesión activa del usuario en sucursal
     * @param {number} sucursalId - ID de sucursal
     * @param {number} usuarioId - ID del usuario
     * @param {number} organizacionId - ID de la organización
     */
    static async obtenerSesionActiva(sucursalId, usuarioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT s.*,
                       u.nombre AS usuario_nombre,
                       suc.nombre AS sucursal_nombre
                FROM sesiones_caja s
                LEFT JOIN usuarios u ON u.id = s.usuario_id
                LEFT JOIN sucursales suc ON suc.id = s.sucursal_id
                WHERE s.organizacion_id = $1
                AND s.sucursal_id = $2
                AND s.usuario_id = $3
                AND s.estado = 'abierta'
                ORDER BY s.fecha_apertura DESC
                LIMIT 1
            `;

            const result = await db.query(query, [organizacionId, sucursalId, usuarioId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener sesión por ID
     * @param {number} sesionId - ID de la sesión
     * @param {number} organizacionId - ID de la organización
     */
    static async obtenerPorId(sesionId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT s.*,
                       u.nombre AS usuario_nombre,
                       suc.nombre AS sucursal_nombre
                FROM sesiones_caja s
                LEFT JOIN usuarios u ON u.id = s.usuario_id
                LEFT JOIN sucursales suc ON suc.id = s.sucursal_id
                WHERE s.id = $1 AND s.organizacion_id = $2
            `;

            const result = await db.query(query, [sesionId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Calcular totales de una sesión para cierre
     * @param {number} sesionId - ID de la sesión
     * @param {number} organizacionId - ID de la organización
     */
    static async calcularTotalesSesion(sesionId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener datos de la sesión
            const sesionQuery = await db.query(
                `SELECT * FROM sesiones_caja WHERE id = $1 AND organizacion_id = $2`,
                [sesionId, organizacionId]
            );

            if (sesionQuery.rows.length === 0) {
                throw new Error('Sesión no encontrada');
            }

            const sesion = sesionQuery.rows[0];

            // Calcular ventas en efectivo durante la sesión
            const ventasEfectivoQuery = await db.query(
                `SELECT COALESCE(SUM(monto_pagado), 0) as total
                 FROM ventas_pos
                 WHERE organizacion_id = $1
                 AND sucursal_id = $2
                 AND metodo_pago = 'efectivo'
                 AND estado_pago IN ('pagado', 'parcial')
                 AND estado = 'completada'
                 AND fecha_venta >= $3
                 AND ($4::timestamptz IS NULL OR fecha_venta < $4)`,
                [organizacionId, sesion.sucursal_id, sesion.fecha_apertura, sesion.fecha_cierre]
            );

            const totalVentasEfectivo = parseFloat(ventasEfectivoQuery.rows[0].total) || 0;

            // Calcular ventas por otros métodos
            const ventasOtrosQuery = await db.query(
                `SELECT metodo_pago, COALESCE(SUM(monto_pagado), 0) as total
                 FROM ventas_pos
                 WHERE organizacion_id = $1
                 AND sucursal_id = $2
                 AND metodo_pago != 'efectivo'
                 AND estado_pago IN ('pagado', 'parcial')
                 AND estado = 'completada'
                 AND fecha_venta >= $3
                 AND ($4::timestamptz IS NULL OR fecha_venta < $4)
                 GROUP BY metodo_pago`,
                [organizacionId, sesion.sucursal_id, sesion.fecha_apertura, sesion.fecha_cierre]
            );

            // Calcular entradas de efectivo
            const entradasQuery = await db.query(
                `SELECT COALESCE(SUM(monto), 0) as total
                 FROM movimientos_caja
                 WHERE sesion_caja_id = $1 AND tipo = 'entrada'`,
                [sesionId]
            );

            const totalEntradas = parseFloat(entradasQuery.rows[0].total) || 0;

            // Calcular salidas de efectivo
            const salidasQuery = await db.query(
                `SELECT COALESCE(SUM(monto), 0) as total
                 FROM movimientos_caja
                 WHERE sesion_caja_id = $1 AND tipo = 'salida'`,
                [sesionId]
            );

            const totalSalidas = parseFloat(salidasQuery.rows[0].total) || 0;

            // Calcular monto esperado en caja
            const montoInicial = parseFloat(sesion.monto_inicial) || 0;
            const montoEsperado = montoInicial + totalVentasEfectivo + totalEntradas - totalSalidas;

            // Contar ventas del período
            const conteoVentasQuery = await db.query(
                `SELECT COUNT(*) as total
                 FROM ventas_pos
                 WHERE organizacion_id = $1
                 AND sucursal_id = $2
                 AND estado = 'completada'
                 AND fecha_venta >= $3
                 AND ($4::timestamptz IS NULL OR fecha_venta < $4)`,
                [organizacionId, sesion.sucursal_id, sesion.fecha_apertura, sesion.fecha_cierre]
            );

            return {
                sesion_id: sesionId,
                monto_inicial: montoInicial,
                ventas_efectivo: totalVentasEfectivo,
                ventas_otros: ventasOtrosQuery.rows,
                total_entradas: totalEntradas,
                total_salidas: totalSalidas,
                monto_esperado: montoEsperado,
                total_ventas: parseInt(conteoVentasQuery.rows[0].total) || 0,
                fecha_apertura: sesion.fecha_apertura
            };
        });
    }

    /**
     * Cerrar sesión de caja
     * @param {number} sesionId - ID de la sesión
     * @param {Object} data - Datos de cierre
     * @param {number} data.monto_contado - Monto físico contado
     * @param {string} data.nota_cierre - Nota opcional
     * @param {Object} data.desglose - Desglose de billetes opcional
     * @param {number} organizacionId - ID de la organización
     */
    static async cerrarSesion(sesionId, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[SesionesCajaModel.cerrarSesion] Cerrando sesión de caja', {
                sesion_id: sesionId,
                monto_contado: data.monto_contado
            });

            // Verificar que la sesión existe y está abierta
            const sesionQuery = await db.query(
                `SELECT * FROM sesiones_caja
                 WHERE id = $1 AND organizacion_id = $2 AND estado = 'abierta'
                 FOR UPDATE`,
                [sesionId, organizacionId]
            );

            if (sesionQuery.rows.length === 0) {
                throw new Error('Sesión no encontrada o ya está cerrada');
            }

            const sesion = sesionQuery.rows[0];

            // Calcular totales
            const totales = await this.calcularTotalesSesion(sesionId, organizacionId);
            const montoSistema = totales.monto_esperado;
            const montoContado = parseFloat(data.monto_contado) || 0;
            const diferencia = montoContado - montoSistema;

            // Actualizar sesión con datos de cierre
            const updateQuery = `
                UPDATE sesiones_caja
                SET estado = 'cerrada',
                    fecha_cierre = NOW(),
                    monto_final_sistema = $1,
                    monto_final_contado = $2,
                    diferencia = $3,
                    nota_cierre = $4,
                    actualizado_en = NOW()
                WHERE id = $5
                RETURNING *
            `;

            const result = await db.query(updateQuery, [
                montoSistema,
                montoContado,
                diferencia,
                data.nota_cierre || null,
                sesionId
            ]);

            const sesionCerrada = result.rows[0];

            // Guardar desglose de billetes si se proporciona
            if (data.desglose) {
                await db.query(
                    `INSERT INTO desglose_billetes (
                        sesion_caja_id,
                        billetes_1000, billetes_500, billetes_200, billetes_100, billetes_50, billetes_20,
                        monedas_10, monedas_5, monedas_2, monedas_1, monedas_050
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    ON CONFLICT (sesion_caja_id) DO UPDATE SET
                        billetes_1000 = $2, billetes_500 = $3, billetes_200 = $4,
                        billetes_100 = $5, billetes_50 = $6, billetes_20 = $7,
                        monedas_10 = $8, monedas_5 = $9, monedas_2 = $10,
                        monedas_1 = $11, monedas_050 = $12`,
                    [
                        sesionId,
                        data.desglose.billetes_1000 || 0,
                        data.desglose.billetes_500 || 0,
                        data.desglose.billetes_200 || 0,
                        data.desglose.billetes_100 || 0,
                        data.desglose.billetes_50 || 0,
                        data.desglose.billetes_20 || 0,
                        data.desglose.monedas_10 || 0,
                        data.desglose.monedas_5 || 0,
                        data.desglose.monedas_2 || 0,
                        data.desglose.monedas_1 || 0,
                        data.desglose.monedas_050 || 0
                    ]
                );
            }

            logger.info('[SesionesCajaModel.cerrarSesion] Sesión cerrada exitosamente', {
                sesion_id: sesionId,
                monto_sistema: montoSistema,
                monto_contado: montoContado,
                diferencia: diferencia
            });

            return {
                ...sesionCerrada,
                totales
            };
        });
    }

    /**
     * Registrar movimiento de efectivo (entrada/salida)
     * @param {number} sesionId - ID de la sesión
     * @param {Object} data - Datos del movimiento
     * @param {string} data.tipo - 'entrada' o 'salida'
     * @param {number} data.monto - Monto del movimiento
     * @param {string} data.motivo - Motivo del movimiento
     * @param {number} data.usuario_id - ID del usuario
     * @param {number} organizacionId - ID de la organización
     */
    static async registrarMovimiento(sesionId, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[SesionesCajaModel.registrarMovimiento] Registrando movimiento', {
                sesion_id: sesionId,
                tipo: data.tipo,
                monto: data.monto
            });

            // Verificar que la sesión existe y está abierta
            const sesionQuery = await db.query(
                `SELECT id FROM sesiones_caja
                 WHERE id = $1 AND organizacion_id = $2 AND estado = 'abierta'`,
                [sesionId, organizacionId]
            );

            if (sesionQuery.rows.length === 0) {
                throw new Error('Sesión no encontrada o ya está cerrada');
            }

            // Validar tipo
            if (!['entrada', 'salida'].includes(data.tipo)) {
                throw new Error('Tipo de movimiento inválido. Debe ser "entrada" o "salida"');
            }

            // Validar monto
            if (!data.monto || data.monto <= 0) {
                throw new Error('El monto debe ser mayor a 0');
            }

            // Validar motivo
            if (!data.motivo || data.motivo.trim() === '') {
                throw new Error('Debe especificar un motivo para el movimiento');
            }

            // Insertar movimiento
            const query = `
                INSERT INTO movimientos_caja (
                    sesion_caja_id,
                    tipo,
                    monto,
                    motivo,
                    usuario_id
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;

            const result = await db.query(query, [
                sesionId,
                data.tipo,
                data.monto,
                data.motivo.trim(),
                data.usuario_id
            ]);

            logger.info('[SesionesCajaModel.registrarMovimiento] Movimiento registrado', {
                movimiento_id: result.rows[0].id,
                tipo: data.tipo,
                monto: data.monto
            });

            return result.rows[0];
        });
    }

    /**
     * Listar movimientos de una sesión
     * @param {number} sesionId - ID de la sesión
     * @param {number} organizacionId - ID de la organización
     */
    static async listarMovimientos(sesionId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT m.*,
                       u.nombre AS usuario_nombre
                FROM movimientos_caja m
                LEFT JOIN usuarios u ON u.id = m.usuario_id
                WHERE m.sesion_caja_id = $1
                ORDER BY m.creado_en DESC
            `;

            const result = await db.query(query, [sesionId]);
            return result.rows;
        });
    }

    /**
     * Listar sesiones de caja con filtros
     * @param {Object} filtros - Filtros de búsqueda
     * @param {number} organizacionId - ID de la organización
     */
    static async listar(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['s.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            if (filtros.sucursal_id) {
                whereConditions.push(`s.sucursal_id = $${paramCounter}`);
                values.push(filtros.sucursal_id);
                paramCounter++;
            }

            if (filtros.usuario_id) {
                whereConditions.push(`s.usuario_id = $${paramCounter}`);
                values.push(filtros.usuario_id);
                paramCounter++;
            }

            if (filtros.estado) {
                whereConditions.push(`s.estado = $${paramCounter}`);
                values.push(filtros.estado);
                paramCounter++;
            }

            if (filtros.fecha_desde) {
                whereConditions.push(`s.fecha_apertura >= $${paramCounter}`);
                values.push(filtros.fecha_desde);
                paramCounter++;
            }

            if (filtros.fecha_hasta) {
                whereConditions.push(`s.fecha_apertura <= $${paramCounter}`);
                values.push(filtros.fecha_hasta);
                paramCounter++;
            }

            const query = `
                SELECT s.*,
                       u.nombre AS usuario_nombre,
                       suc.nombre AS sucursal_nombre
                FROM sesiones_caja s
                LEFT JOIN usuarios u ON u.id = s.usuario_id
                LEFT JOIN sucursales suc ON suc.id = s.sucursal_id
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY s.fecha_apertura DESC
                LIMIT $${paramCounter}
                OFFSET $${paramCounter + 1}
            `;

            values.push(filtros.limit || 50);
            values.push(filtros.offset || 0);

            const result = await db.query(query, values);

            // Obtener conteo total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM sesiones_caja s
                WHERE ${whereConditions.join(' AND ')}
            `;

            const countResult = await db.query(countQuery, values.slice(0, values.length - 2));

            return {
                sesiones: result.rows,
                total: parseInt(countResult.rows[0].total) || 0,
                limit: filtros.limit || 50,
                offset: filtros.offset || 0
            };
        });
    }

    /**
     * Obtener resumen de sesión para reporte
     * @param {number} sesionId - ID de la sesión
     * @param {number} organizacionId - ID de la organización
     */
    static async obtenerResumen(sesionId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener sesión
            const sesion = await this.obtenerPorId(sesionId, organizacionId);

            if (!sesion) {
                throw new Error('Sesión no encontrada');
            }

            // Calcular totales
            const totales = await this.calcularTotalesSesion(sesionId, organizacionId);

            // Obtener movimientos
            const movimientos = await this.listarMovimientos(sesionId, organizacionId);

            // Obtener desglose si existe
            const desgloseQuery = await db.query(
                `SELECT * FROM desglose_billetes WHERE sesion_caja_id = $1`,
                [sesionId]
            );

            // Obtener ventas del período
            const ventasQuery = await db.query(
                `SELECT v.id, v.folio, v.total, v.metodo_pago, v.fecha_venta
                 FROM ventas_pos v
                 WHERE v.organizacion_id = $1
                 AND v.sucursal_id = $2
                 AND v.estado = 'completada'
                 AND v.fecha_venta >= $3
                 AND ($4::timestamptz IS NULL OR v.fecha_venta < $4)
                 ORDER BY v.fecha_venta DESC`,
                [organizacionId, sesion.sucursal_id, sesion.fecha_apertura, sesion.fecha_cierre]
            );

            return {
                sesion,
                totales,
                movimientos,
                desglose: desgloseQuery.rows[0] || null,
                ventas: ventasQuery.rows
            };
        });
    }
}

module.exports = SesionesCajaModel;
