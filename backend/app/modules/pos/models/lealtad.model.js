/**
 * ====================================================================
 * MODEL - PROGRAMA DE LEALTAD
 * ====================================================================
 *
 * Modelo para gestión del programa de puntos de fidelización
 * - Configuración del programa
 * - Niveles de membresía
 * - Acumulación y canje de puntos
 * - Historial de transacciones
 *
 * Ene 2026 - Fase 3 POS
 * ====================================================================
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { ErrorHelper } = require('../../../utils/helpers');

class LealtadModel {

    // ========================================================================
    // CONFIGURACIÓN DEL PROGRAMA
    // ========================================================================

    /**
     * Obtener configuración del programa de lealtad
     * @param {number} organizacionId - ID de la organización
     */
    static async obtenerConfiguracion(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM configuracion_lealtad
                WHERE organizacion_id = $1
            `;
            const result = await db.query(query, [organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Crear o actualizar configuración del programa
     * @param {Object} data - Datos de configuración
     * @param {number} organizacionId - ID de la organización
     */
    static async guardarConfiguracion(data, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO configuracion_lealtad (
                    organizacion_id,
                    puntos_por_peso,
                    monto_minimo_acumulacion,
                    redondeo_puntos,
                    puntos_por_peso_descuento,
                    minimo_puntos_canje,
                    maximo_descuento_porcentaje,
                    permitir_canje_parcial,
                    puntos_expiran,
                    meses_expiracion,
                    aplica_productos_con_descuento,
                    aplica_con_cupones,
                    categorias_excluidas_ids,
                    activo
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
                )
                ON CONFLICT (organizacion_id) DO UPDATE SET
                    puntos_por_peso = EXCLUDED.puntos_por_peso,
                    monto_minimo_acumulacion = EXCLUDED.monto_minimo_acumulacion,
                    redondeo_puntos = EXCLUDED.redondeo_puntos,
                    puntos_por_peso_descuento = EXCLUDED.puntos_por_peso_descuento,
                    minimo_puntos_canje = EXCLUDED.minimo_puntos_canje,
                    maximo_descuento_porcentaje = EXCLUDED.maximo_descuento_porcentaje,
                    permitir_canje_parcial = EXCLUDED.permitir_canje_parcial,
                    puntos_expiran = EXCLUDED.puntos_expiran,
                    meses_expiracion = EXCLUDED.meses_expiracion,
                    aplica_productos_con_descuento = EXCLUDED.aplica_productos_con_descuento,
                    aplica_con_cupones = EXCLUDED.aplica_con_cupones,
                    categorias_excluidas_ids = EXCLUDED.categorias_excluidas_ids,
                    activo = EXCLUDED.activo,
                    actualizado_en = NOW()
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.puntos_por_peso ?? 1,
                data.monto_minimo_acumulacion ?? 0,
                data.redondeo_puntos || 'floor',
                data.puntos_por_peso_descuento ?? 100,
                data.minimo_puntos_canje ?? 100,
                data.maximo_descuento_porcentaje ?? 50,
                data.permitir_canje_parcial !== false,
                data.puntos_expiran !== false,
                data.meses_expiracion ?? 12,
                data.aplica_productos_con_descuento || false,
                data.aplica_con_cupones !== false,
                data.categorias_excluidas_ids || null,
                data.activo !== false
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    // ========================================================================
    // NIVELES DE MEMBRESÍA
    // ========================================================================

    /**
     * Listar niveles de lealtad
     * @param {number} organizacionId - ID de la organización
     * @param {boolean} soloActivos - Filtrar solo activos
     */
    static async listarNiveles(organizacionId, soloActivos = true) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT nl.*,
                    (SELECT COUNT(*) FROM puntos_cliente WHERE nivel_id = nl.id) as total_clientes
                FROM niveles_lealtad nl
                WHERE nl.organizacion_id = $1
                ${soloActivos ? 'AND nl.activo = true' : ''}
                ORDER BY nl.orden ASC
            `;
            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }

    /**
     * Crear nivel de lealtad
     * @param {Object} data - Datos del nivel
     * @param {number} organizacionId - ID de la organización
     */
    static async crearNivel(data, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO niveles_lealtad (
                    organizacion_id,
                    nombre,
                    codigo,
                    color,
                    icono,
                    puntos_minimos,
                    compras_minimas,
                    multiplicador_puntos,
                    descuento_adicional_porcentaje,
                    envio_gratis,
                    acceso_ventas_anticipadas,
                    orden,
                    activo
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
                )
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.nombre,
                data.codigo.toUpperCase(),
                data.color || null,
                data.icono || null,
                data.puntos_minimos || 0,
                data.compras_minimas || null,
                data.multiplicador_puntos || 1.0,
                data.descuento_adicional_porcentaje || 0,
                data.envio_gratis || false,
                data.acceso_ventas_anticipadas || false,
                data.orden || 0,
                data.activo !== false
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Actualizar nivel de lealtad
     * @param {number} id - ID del nivel
     * @param {Object} data - Datos a actualizar
     * @param {number} organizacionId - ID de la organización
     */
    static async actualizarNivel(id, data, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const campos = [];
            const valores = [];
            let paramCount = 1;

            // Construir campos dinámicamente
            const camposPermitidos = [
                'nombre', 'codigo', 'color', 'icono', 'puntos_minimos',
                'compras_minimas', 'multiplicador_puntos', 'descuento_adicional_porcentaje',
                'envio_gratis', 'acceso_ventas_anticipadas', 'orden', 'activo'
            ];

            for (const campo of camposPermitidos) {
                if (data[campo] !== undefined) {
                    let valor = data[campo];
                    if (campo === 'codigo' && valor) valor = valor.toUpperCase();
                    campos.push(`${campo} = $${paramCount}`);
                    valores.push(valor);
                    paramCount++;
                }
            }

            if (campos.length === 0) {
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            valores.push(id);
            const query = `
                UPDATE niveles_lealtad
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Eliminar nivel de lealtad
     * @param {number} id - ID del nivel
     * @param {number} organizacionId - ID de la organización
     */
    static async eliminarNivel(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar que no tenga clientes asignados
            const checkQuery = `
                SELECT COUNT(*) as total FROM puntos_cliente WHERE nivel_id = $1
            `;
            const checkResult = await db.query(checkQuery, [id]);

            if (parseInt(checkResult.rows[0].total) > 0) {
                ErrorHelper.throwConflict('No se puede eliminar un nivel con clientes asignados');
            }

            const query = `
                DELETE FROM niveles_lealtad WHERE id = $1 RETURNING *
            `;
            const result = await db.query(query, [id]);
            return result.rows[0];
        });
    }

    /**
     * Crear niveles por defecto para una organización
     * @param {number} organizacionId - ID de la organización
     */
    static async crearNivelesDefault(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT crear_niveles_lealtad_default($1)`;
            await db.query(query, [organizacionId]);
            return await this.listarNiveles(organizacionId);
        });
    }

    // ========================================================================
    // PUNTOS DEL CLIENTE
    // ========================================================================

    /**
     * Obtener puntos de un cliente
     * @param {number} clienteId - ID del cliente
     * @param {number} organizacionId - ID de la organización
     */
    static async obtenerPuntosCliente(clienteId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    pc.*,
                    nl.nombre as nivel_nombre,
                    nl.codigo as nivel_codigo,
                    nl.color as nivel_color,
                    nl.icono as nivel_icono,
                    nl.multiplicador_puntos,
                    nl.descuento_adicional_porcentaje,
                    c.nombre as cliente_nombre,
                    c.email as cliente_email
                FROM puntos_cliente pc
                LEFT JOIN niveles_lealtad nl ON pc.nivel_id = nl.id
                LEFT JOIN clientes c ON pc.cliente_id = c.id
                WHERE pc.cliente_id = $1 AND pc.organizacion_id = $2
            `;

            const result = await db.query(query, [clienteId, organizacionId]);

            // Si no existe, retornar valores por defecto
            if (!result.rows[0]) {
                return {
                    cliente_id: clienteId,
                    puntos_disponibles: 0,
                    puntos_acumulados_historico: 0,
                    puntos_canjeados_historico: 0,
                    puntos_expirados_historico: 0,
                    nivel_nombre: null,
                    multiplicador_puntos: 1.0
                };
            }

            return result.rows[0];
        });
    }

    /**
     * Calcular puntos que ganaría una venta (preview)
     * @param {Object} params - Parámetros de cálculo
     * @param {number} organizacionId - ID de la organización
     */
    static async calcularPuntosVenta(params, organizacionId) {
        const { cliente_id, monto, tiene_cupon = false, items = null } = params;

        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT calcular_puntos_venta($1, $2, $3, $4, $5) as resultado
            `;

            const result = await db.query(query, [
                organizacionId,
                cliente_id || null,
                monto,
                tiene_cupon,
                items ? JSON.stringify(items) : null
            ]);

            return result.rows[0]?.resultado || { puntos: 0 };
        });
    }

    /**
     * Acumular puntos por una venta
     * @param {Object} params - Parámetros de acumulación
     * @param {number} organizacionId - ID de la organización
     * @param {number} usuarioId - ID del usuario que registra
     */
    static async acumularPuntos(params, organizacionId, usuarioId) {
        const { cliente_id, venta_pos_id, monto_venta, puntos } = params;

        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT acumular_puntos($1, $2, $3, $4, $5, $6) as transaccion
            `;

            const result = await db.query(query, [
                organizacionId,
                cliente_id,
                venta_pos_id,
                monto_venta,
                puntos,
                usuarioId
            ]);

            // Recalcular nivel después de acumular
            await db.query('SELECT recalcular_nivel_cliente($1, $2)', [organizacionId, cliente_id]);

            return result.rows[0]?.transaccion;
        });
    }

    /**
     * Validar canje de puntos (preview)
     * @param {Object} params - Parámetros de validación
     * @param {number} organizacionId - ID de la organización
     */
    static async validarCanje(params, organizacionId) {
        const { cliente_id, puntos, total_venta } = params;

        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT validar_canje_puntos($1, $2, $3, $4) as resultado
            `;

            const result = await db.query(query, [
                organizacionId,
                cliente_id,
                puntos,
                total_venta
            ]);

            return result.rows[0]?.resultado || { valido: false, error: 'ERROR_DESCONOCIDO' };
        });
    }

    /**
     * Canjear puntos por descuento
     * @param {Object} params - Parámetros de canje
     * @param {number} organizacionId - ID de la organización
     * @param {number} usuarioId - ID del usuario que registra
     */
    static async canjearPuntos(params, organizacionId, usuarioId) {
        const { cliente_id, venta_pos_id, puntos, descuento } = params;

        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT canjear_puntos($1, $2, $3, $4, $5, $6) as transaccion
            `;

            const result = await db.query(query, [
                organizacionId,
                cliente_id,
                venta_pos_id,
                puntos,
                descuento,
                usuarioId
            ]);

            return result.rows[0]?.transaccion;
        });
    }

    /**
     * Ajuste manual de puntos (admin)
     * @param {Object} params - Parámetros del ajuste
     * @param {number} organizacionId - ID de la organización
     * @param {number} usuarioId - ID del usuario que ajusta
     */
    static async ajustarPuntos(params, organizacionId, usuarioId) {
        const { cliente_id, puntos, descripcion, tipo = 'ajuste_manual' } = params;

        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Obtener saldo actual
            const saldoQuery = `
                SELECT puntos_disponibles FROM puntos_cliente
                WHERE cliente_id = $1 AND organizacion_id = $2
                FOR UPDATE
            `;
            let saldoResult = await db.query(saldoQuery, [cliente_id, organizacionId]);

            // Si no existe, crear registro
            if (!saldoResult.rows[0]) {
                await db.query(`
                    INSERT INTO puntos_cliente (organizacion_id, cliente_id, puntos_disponibles)
                    VALUES ($1, $2, 0)
                `, [organizacionId, cliente_id]);
                saldoResult = { rows: [{ puntos_disponibles: 0 }] };
            }

            const saldoAntes = saldoResult.rows[0].puntos_disponibles;
            const saldoDespues = saldoAntes + puntos;

            if (saldoDespues < 0) {
                ErrorHelper.throwValidation('El ajuste resultaría en saldo negativo');
            }

            // Registrar transacción
            const insertQuery = `
                INSERT INTO transacciones_puntos (
                    organizacion_id, cliente_id, tipo, puntos,
                    puntos_antes, puntos_despues, descripcion, creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const transResult = await db.query(insertQuery, [
                organizacionId, cliente_id, tipo, puntos,
                saldoAntes, saldoDespues, descripcion, usuarioId
            ]);

            // Actualizar saldo
            await db.query(`
                UPDATE puntos_cliente
                SET puntos_disponibles = $1,
                    puntos_acumulados_historico = puntos_acumulados_historico + GREATEST($2, 0),
                    actualizado_en = NOW()
                WHERE cliente_id = $3 AND organizacion_id = $4
            `, [saldoDespues, puntos, cliente_id, organizacionId]);

            return transResult.rows[0];
        });
    }

    /**
     * Revertir puntos por devolución de venta
     * Ene 2026 - Fix: Las devoluciones deben restar puntos proporcionales
     * @param {Object} params - Parámetros de la reversión
     * @param {number} params.cliente_id - ID del cliente
     * @param {number} params.venta_pos_id - ID de la venta
     * @param {number} params.monto_devuelto - Monto total devuelto
     * @param {number} params.monto_original - Monto original de la venta
     * @param {number} organizacionId - ID de la organización
     * @param {number} usuarioId - ID del usuario que procesa
     */
    static async revertirPuntosDevolucion(params, organizacionId, usuarioId = null) {
        const { cliente_id, venta_pos_id, monto_devuelto, monto_original } = params;

        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                `SELECT * FROM revertir_puntos_devolucion($1, $2, $3, $4, $5, $6)`,
                [organizacionId, cliente_id, venta_pos_id, monto_devuelto, monto_original, usuarioId]
            );

            return result.rows[0] || null;
        });
    }

    // ========================================================================
    // HISTORIAL Y REPORTES
    // ========================================================================

    /**
     * Obtener historial de transacciones de un cliente
     * @param {number} clienteId - ID del cliente
     * @param {Object} filtros - Filtros de búsqueda
     * @param {number} organizacionId - ID de la organización
     */
    static async obtenerHistorial(clienteId, filtros, organizacionId) {
        const { limit = 50, offset = 0, tipo = null, fecha_desde = null, fecha_hasta = null } = filtros;

        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereClause = 'WHERE t.cliente_id = $1 AND t.organizacion_id = $2';
            const values = [clienteId, organizacionId];
            let paramCount = 3;

            if (tipo) {
                whereClause += ` AND t.tipo = $${paramCount}`;
                values.push(tipo);
                paramCount++;
            }

            if (fecha_desde) {
                whereClause += ` AND t.creado_en >= $${paramCount}`;
                values.push(fecha_desde);
                paramCount++;
            }

            if (fecha_hasta) {
                whereClause += ` AND t.creado_en <= $${paramCount}`;
                values.push(fecha_hasta);
                paramCount++;
            }

            values.push(limit, offset);

            const query = `
                SELECT
                    t.*,
                    v.folio as venta_folio,
                    u.nombre as creado_por_nombre
                FROM transacciones_puntos t
                LEFT JOIN ventas_pos v ON t.venta_pos_id = v.id
                LEFT JOIN usuarios u ON t.creado_por = u.id
                ${whereClause}
                ORDER BY t.creado_en DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            const countQuery = `
                SELECT COUNT(*) as total FROM transacciones_puntos t ${whereClause}
            `;

            const [dataResult, countResult] = await Promise.all([
                db.query(query, values),
                db.query(countQuery, values.slice(0, -2))
            ]);

            return {
                data: dataResult.rows,
                total: parseInt(countResult.rows[0].total),
                limit,
                offset
            };
        });
    }

    /**
     * Obtener resumen de puntos por cliente
     * @param {Object} filtros - Filtros de búsqueda
     * @param {number} organizacionId - ID de la organización
     */
    static async listarClientesConPuntos(filtros, organizacionId) {
        const { limit = 50, offset = 0, busqueda = null, nivel_id = null, orden = 'puntos_desc' } = filtros;

        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereClause = 'WHERE pc.organizacion_id = $1';
            const values = [organizacionId];
            let paramCount = 2;

            if (busqueda) {
                whereClause += ` AND (c.nombre ILIKE $${paramCount} OR c.email ILIKE $${paramCount})`;
                values.push(`%${busqueda}%`);
                paramCount++;
            }

            if (nivel_id) {
                whereClause += ` AND pc.nivel_id = $${paramCount}`;
                values.push(nivel_id);
                paramCount++;
            }

            let orderClause;
            switch (orden) {
                case 'puntos_asc':
                    orderClause = 'ORDER BY pc.puntos_disponibles ASC';
                    break;
                case 'nombre':
                    orderClause = 'ORDER BY c.nombre ASC';
                    break;
                case 'reciente':
                    orderClause = 'ORDER BY pc.actualizado_en DESC';
                    break;
                default:
                    orderClause = 'ORDER BY pc.puntos_disponibles DESC';
            }

            values.push(limit, offset);

            const query = `
                SELECT
                    pc.*,
                    c.nombre as cliente_nombre,
                    c.email as cliente_email,
                    c.telefono as cliente_telefono,
                    nl.nombre as nivel_nombre,
                    nl.color as nivel_color
                FROM puntos_cliente pc
                JOIN clientes c ON pc.cliente_id = c.id
                LEFT JOIN niveles_lealtad nl ON pc.nivel_id = nl.id
                ${whereClause}
                ${orderClause}
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            const countQuery = `
                SELECT COUNT(*) as total
                FROM puntos_cliente pc
                JOIN clientes c ON pc.cliente_id = c.id
                ${whereClause}
            `;

            const [dataResult, countResult] = await Promise.all([
                db.query(query, values),
                db.query(countQuery, values.slice(0, -2))
            ]);

            return {
                data: dataResult.rows,
                total: parseInt(countResult.rows[0].total),
                limit,
                offset
            };
        });
    }

    /**
     * Obtener estadísticas del programa de lealtad
     * @param {number} organizacionId - ID de la organización
     */
    static async obtenerEstadisticas(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    COUNT(DISTINCT pc.cliente_id) as total_clientes,
                    COALESCE(SUM(pc.puntos_disponibles), 0) as puntos_en_circulacion,
                    COALESCE(SUM(pc.puntos_acumulados_historico), 0) as puntos_totales_emitidos,
                    COALESCE(SUM(pc.puntos_canjeados_historico), 0) as puntos_totales_canjeados,
                    COALESCE(SUM(pc.puntos_expirados_historico), 0) as puntos_totales_expirados,
                    (
                        SELECT COUNT(DISTINCT cliente_id)
                        FROM transacciones_puntos
                        WHERE organizacion_id = $1
                        AND tipo = 'acumulacion'
                        AND creado_en >= CURRENT_DATE - INTERVAL '30 days'
                    ) as clientes_activos_30d,
                    (
                        SELECT COALESCE(SUM(puntos), 0)
                        FROM transacciones_puntos
                        WHERE organizacion_id = $1
                        AND tipo = 'acumulacion'
                        AND creado_en >= CURRENT_DATE - INTERVAL '30 days'
                    ) as puntos_acumulados_30d,
                    (
                        SELECT COALESCE(SUM(ABS(puntos)), 0)
                        FROM transacciones_puntos
                        WHERE organizacion_id = $1
                        AND tipo = 'canje'
                        AND creado_en >= CURRENT_DATE - INTERVAL '30 days'
                    ) as puntos_canjeados_30d
                FROM puntos_cliente pc
                WHERE pc.organizacion_id = $1
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows[0];
        });
    }
}

module.exports = LealtadModel;
