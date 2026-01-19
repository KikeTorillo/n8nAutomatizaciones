const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { ErrorHelper } = require('../../../utils/helpers');

/**
 * Model para reportes contables
 * Utiliza las funciones PL/pgSQL definidas en 05-funciones.sql
 */
class ReportesModel {

    /**
     * Obtener Balanza de Comprobación
     * Muestra saldos de todas las cuentas en un período
     */
    static async obtenerBalanzaComprobacion(periodoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener fechas del período
            const periodoResult = await db.query(
                `SELECT fecha_inicio, fecha_fin FROM periodos_contables WHERE id = $1 AND organizacion_id = $2`,
                [periodoId, organizacionId]
            );

            ErrorHelper.throwIfNotFound(periodoResult.rows[0], 'Período');

            const { fecha_inicio, fecha_fin } = periodoResult.rows[0];

            // Llamar a la función SQL con las fechas del período
            const result = await db.query(
                `SELECT * FROM obtener_balanza_comprobacion($1, $2, $3)`,
                [organizacionId, fecha_inicio, fecha_fin]
            );

            // Calcular totales
            let totalSaldoInicial = 0;
            let totalDebe = 0;
            let totalHaber = 0;
            let totalSaldoFinal = 0;

            const cuentas = result.rows.map(row => {
                totalSaldoInicial += parseFloat(row.saldo_inicial || 0);
                totalDebe += parseFloat(row.debe || 0);
                totalHaber += parseFloat(row.haber || 0);
                totalSaldoFinal += parseFloat(row.saldo_final || 0);

                return {
                    cuenta_id: row.cuenta_id,
                    codigo: row.codigo,
                    nombre: row.nombre,
                    tipo: row.tipo,
                    naturaleza: row.naturaleza,
                    nivel: row.nivel,
                    saldo_inicial: parseFloat(row.saldo_inicial || 0),
                    total_debe: parseFloat(row.debe || 0),
                    total_haber: parseFloat(row.haber || 0),
                    saldo_final: parseFloat(row.saldo_final || 0)
                };
            });

            // Obtener información del período
            const periodoInfo = await db.query(
                `SELECT * FROM periodos_contables WHERE id = $1 AND organizacion_id = $2`,
                [periodoId, organizacionId]
            );

            return {
                periodo: periodoInfo.rows[0] || null,
                cuentas,
                totales: {
                    saldo_inicial: totalSaldoInicial,
                    total_debe: totalDebe,
                    total_haber: totalHaber,
                    saldo_final: totalSaldoFinal
                },
                cuadra: Math.abs(totalDebe - totalHaber) < 0.01
            };
        });
    }

    /**
     * Obtener Libro Mayor de una cuenta
     * Muestra todos los movimientos de una cuenta en un período
     */
    static async obtenerLibroMayor(cuentaId, fechaInicio, fechaFin, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Llamar a la función SQL
            const result = await db.query(
                `SELECT * FROM obtener_libro_mayor($1, $2, $3, $4)`,
                [organizacionId, cuentaId, fechaInicio, fechaFin]
            );

            // Obtener información de la cuenta
            const cuentaInfo = await db.query(
                `SELECT * FROM cuentas_contables WHERE id = $1 AND organizacion_id = $2`,
                [cuentaId, organizacionId]
            );

            ErrorHelper.throwIfNotFound(cuentaInfo.rows[0], 'Cuenta');

            const movimientos = result.rows.map(row => ({
                fecha: row.fecha,
                numero_asiento: row.numero_asiento,
                concepto: row.concepto,
                debe: parseFloat(row.debe || 0),
                haber: parseFloat(row.haber || 0),
                saldo: parseFloat(row.saldo || 0)
            }));

            // Calcular totales
            const totales = movimientos.reduce((acc, mov) => ({
                debe: acc.debe + mov.debe,
                haber: acc.haber + mov.haber
            }), { debe: 0, haber: 0 });

            return {
                cuenta: cuentaInfo.rows[0],
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                movimientos,
                totales,
                saldo_final: movimientos.length > 0 ? movimientos[movimientos.length - 1].saldo : 0
            };
        });
    }

    /**
     * Obtener Estado de Resultados (Pérdidas y Ganancias)
     */
    static async obtenerEstadoResultados(fechaInicio, fechaFin, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener ingresos (tipo = 'ingreso')
            const ingresosQuery = `
                SELECT
                    c.id, c.codigo, c.nombre,
                    COALESCE(SUM(m.haber) - SUM(m.debe), 0) as monto
                FROM cuentas_contables c
                LEFT JOIN movimientos_contables m ON m.cuenta_id = c.id
                    AND m.asiento_fecha BETWEEN $2 AND $3
                INNER JOIN asientos_contables a ON m.asiento_id = a.id
                    AND m.asiento_fecha = a.fecha
                    AND a.estado = 'publicado'
                WHERE c.organizacion_id = $1
                    AND c.tipo = 'ingreso'
                    AND c.afectable = true
                    AND c.activo = true
                GROUP BY c.id, c.codigo, c.nombre
                HAVING COALESCE(SUM(m.haber) - SUM(m.debe), 0) != 0
                ORDER BY c.codigo
            `;

            const ingresosResult = await db.query(ingresosQuery, [organizacionId, fechaInicio, fechaFin]);

            // Obtener gastos (tipo = 'gasto')
            const gastosQuery = `
                SELECT
                    c.id, c.codigo, c.nombre,
                    COALESCE(SUM(m.debe) - SUM(m.haber), 0) as monto
                FROM cuentas_contables c
                LEFT JOIN movimientos_contables m ON m.cuenta_id = c.id
                    AND m.asiento_fecha BETWEEN $2 AND $3
                INNER JOIN asientos_contables a ON m.asiento_id = a.id
                    AND m.asiento_fecha = a.fecha
                    AND a.estado = 'publicado'
                WHERE c.organizacion_id = $1
                    AND c.tipo = 'gasto'
                    AND c.afectable = true
                    AND c.activo = true
                GROUP BY c.id, c.codigo, c.nombre
                HAVING COALESCE(SUM(m.debe) - SUM(m.haber), 0) != 0
                ORDER BY c.codigo
            `;

            const gastosResult = await db.query(gastosQuery, [organizacionId, fechaInicio, fechaFin]);

            // Calcular totales
            const totalIngresos = ingresosResult.rows.reduce((acc, row) => acc + parseFloat(row.monto), 0);
            const totalGastos = gastosResult.rows.reduce((acc, row) => acc + parseFloat(row.monto), 0);
            const utilidadNeta = totalIngresos - totalGastos;

            return {
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                ingresos: {
                    detalle: ingresosResult.rows.map(r => ({
                        ...r,
                        monto: parseFloat(r.monto)
                    })),
                    total: totalIngresos
                },
                gastos: {
                    detalle: gastosResult.rows.map(r => ({
                        ...r,
                        monto: parseFloat(r.monto)
                    })),
                    total: totalGastos
                },
                utilidad_neta: utilidadNeta,
                es_utilidad: utilidadNeta >= 0
            };
        });
    }

    /**
     * Obtener Balance General
     */
    static async obtenerBalanceGeneral(fecha, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener activos
            const activosQuery = `
                SELECT
                    c.id, c.codigo, c.nombre, c.nivel,
                    COALESCE(SUM(m.debe) - SUM(m.haber), 0) as saldo
                FROM cuentas_contables c
                LEFT JOIN movimientos_contables m ON m.cuenta_id = c.id
                    AND m.asiento_fecha <= $2
                LEFT JOIN asientos_contables a ON m.asiento_id = a.id
                    AND m.asiento_fecha = a.fecha
                    AND a.estado = 'publicado'
                WHERE c.organizacion_id = $1
                    AND c.tipo = 'activo'
                    AND c.afectable = true
                    AND c.activo = true
                GROUP BY c.id, c.codigo, c.nombre, c.nivel
                ORDER BY c.codigo
            `;

            const activosResult = await db.query(activosQuery, [organizacionId, fecha]);

            // Obtener pasivos
            const pasivosQuery = `
                SELECT
                    c.id, c.codigo, c.nombre, c.nivel,
                    COALESCE(SUM(m.haber) - SUM(m.debe), 0) as saldo
                FROM cuentas_contables c
                LEFT JOIN movimientos_contables m ON m.cuenta_id = c.id
                    AND m.asiento_fecha <= $2
                LEFT JOIN asientos_contables a ON m.asiento_id = a.id
                    AND m.asiento_fecha = a.fecha
                    AND a.estado = 'publicado'
                WHERE c.organizacion_id = $1
                    AND c.tipo = 'pasivo'
                    AND c.afectable = true
                    AND c.activo = true
                GROUP BY c.id, c.codigo, c.nombre, c.nivel
                ORDER BY c.codigo
            `;

            const pasivosResult = await db.query(pasivosQuery, [organizacionId, fecha]);

            // Obtener capital
            const capitalQuery = `
                SELECT
                    c.id, c.codigo, c.nombre, c.nivel,
                    COALESCE(SUM(m.haber) - SUM(m.debe), 0) as saldo
                FROM cuentas_contables c
                LEFT JOIN movimientos_contables m ON m.cuenta_id = c.id
                    AND m.asiento_fecha <= $2
                LEFT JOIN asientos_contables a ON m.asiento_id = a.id
                    AND m.asiento_fecha = a.fecha
                    AND a.estado = 'publicado'
                WHERE c.organizacion_id = $1
                    AND c.tipo = 'capital'
                    AND c.afectable = true
                    AND c.activo = true
                GROUP BY c.id, c.codigo, c.nombre, c.nivel
                ORDER BY c.codigo
            `;

            const capitalResult = await db.query(capitalQuery, [organizacionId, fecha]);

            // Calcular totales
            const totalActivos = activosResult.rows.reduce((acc, row) => acc + parseFloat(row.saldo || 0), 0);
            const totalPasivos = pasivosResult.rows.reduce((acc, row) => acc + parseFloat(row.saldo || 0), 0);
            const totalCapital = capitalResult.rows.reduce((acc, row) => acc + parseFloat(row.saldo || 0), 0);

            return {
                fecha,
                activos: {
                    detalle: activosResult.rows.map(r => ({ ...r, saldo: parseFloat(r.saldo || 0) })),
                    total: totalActivos
                },
                pasivos: {
                    detalle: pasivosResult.rows.map(r => ({ ...r, saldo: parseFloat(r.saldo || 0) })),
                    total: totalPasivos
                },
                capital: {
                    detalle: capitalResult.rows.map(r => ({ ...r, saldo: parseFloat(r.saldo || 0) })),
                    total: totalCapital
                },
                ecuacion_contable: {
                    activos: totalActivos,
                    pasivos_mas_capital: totalPasivos + totalCapital,
                    diferencia: totalActivos - (totalPasivos + totalCapital),
                    cuadra: Math.abs(totalActivos - (totalPasivos + totalCapital)) < 0.01
                }
            };
        });
    }

    /**
     * Obtener períodos contables
     */
    static async listarPeriodos(organizacionId, anio = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let query = `
                SELECT
                    p.*,
                    p.anio || '-' || LPAD(p.mes::text, 2, '0') as nombre,
                    (SELECT COUNT(*) FROM asientos_contables a WHERE a.organizacion_id = p.organizacion_id AND a.fecha BETWEEN p.fecha_inicio AND p.fecha_fin AND a.estado = 'publicado') as asientos_publicados,
                    (SELECT COUNT(*) FROM asientos_contables a WHERE a.organizacion_id = p.organizacion_id AND a.fecha BETWEEN p.fecha_inicio AND p.fecha_fin AND a.estado = 'borrador') as asientos_borrador
                FROM periodos_contables p
                WHERE p.organizacion_id = $1
            `;
            const params = [organizacionId];

            if (anio) {
                query += ` AND p.anio = $2`;
                params.push(anio);
            }

            query += ` ORDER BY p.anio DESC, p.mes DESC`;

            const result = await db.query(query, params);
            return result.rows;
        });
    }

    /**
     * Cerrar período contable
     */
    static async cerrarPeriodo(periodoId, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar período
            const periodo = await db.query(
                `SELECT * FROM periodos_contables WHERE id = $1 AND organizacion_id = $2`,
                [periodoId, organizacionId]
            );

            ErrorHelper.throwIfNotFound(periodo.rows[0], 'Período');

            if (periodo.rows[0].estado === 'cerrado') {
                ErrorHelper.throwConflict('El período ya está cerrado');
            }

            // Verificar que no haya asientos en borrador
            const borradores = await db.query(
                `SELECT COUNT(*) as total FROM asientos_contables WHERE periodo_id = $1 AND estado = 'borrador'`,
                [periodoId]
            );

            if (parseInt(borradores.rows[0].total) > 0) {
                ErrorHelper.throwConflict('No se puede cerrar un período con asientos en borrador');
            }

            // Cerrar período
            await db.query(
                `UPDATE periodos_contables SET estado = 'cerrado', cerrado_en = NOW(), cerrado_por = $1 WHERE id = $2`,
                [usuarioId, periodoId]
            );

            logger.info('[ReportesModel.cerrarPeriodo] Período cerrado', {
                periodo_id: periodoId,
                usuario_id: usuarioId
            });

            return { success: true, mensaje: 'Período cerrado correctamente' };
        });
    }

    /**
     * Obtener resumen del dashboard contable
     */
    static async obtenerResumenDashboard(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const hoy = new Date().toISOString().split('T')[0];
            const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            const finMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

            // Asientos del mes
            const asientosMes = await db.query(`
                SELECT
                    COUNT(*) FILTER (WHERE estado = 'publicado') as publicados,
                    COUNT(*) FILTER (WHERE estado = 'borrador') as borradores,
                    COALESCE(SUM(total_debe) FILTER (WHERE estado = 'publicado'), 0) as total_movimiento
                FROM asientos_contables
                WHERE organizacion_id = $1 AND fecha BETWEEN $2 AND $3
            `, [organizacionId, inicioMes, finMes]);

            // Cuentas activas
            const cuentas = await db.query(`
                SELECT COUNT(*) as total FROM cuentas_contables WHERE organizacion_id = $1 AND activo = true
            `, [organizacionId]);

            // Período actual
            const periodoActual = await db.query(`
                SELECT * FROM periodos_contables
                WHERE organizacion_id = $1 AND estado = 'abierto'
                ORDER BY anio DESC, mes DESC LIMIT 1
            `, [organizacionId]);

            // Configuración
            const config = await db.query(`
                SELECT * FROM config_contabilidad WHERE organizacion_id = $1
            `, [organizacionId]);

            return {
                asientos_mes: {
                    publicados: parseInt(asientosMes.rows[0]?.publicados || 0),
                    borradores: parseInt(asientosMes.rows[0]?.borradores || 0),
                    total_movimiento: parseFloat(asientosMes.rows[0]?.total_movimiento || 0)
                },
                cuentas_activas: parseInt(cuentas.rows[0]?.total || 0),
                periodo_actual: periodoActual.rows[0] || null,
                configurado: config.rows.length > 0,
                configuracion: config.rows[0] || null
            };
        });
    }

    /**
     * Obtener configuración contable
     */
    static async obtenerConfiguracion(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT
                    cc.*,
                    cv.codigo as cuenta_ventas_codigo,
                    cv.nombre as cuenta_ventas_nombre,
                    ccv.codigo as cuenta_costo_ventas_codigo,
                    ccv.nombre as cuenta_costo_ventas_nombre,
                    ci.codigo as cuenta_inventario_codigo,
                    ci.nombre as cuenta_inventario_nombre,
                    ccl.codigo as cuenta_clientes_codigo,
                    ccl.nombre as cuenta_clientes_nombre,
                    cp.codigo as cuenta_proveedores_codigo,
                    cp.nombre as cuenta_proveedores_nombre,
                    cit.codigo as cuenta_iva_trasladado_codigo,
                    cit.nombre as cuenta_iva_trasladado_nombre,
                    cia.codigo as cuenta_iva_acreditable_codigo,
                    cia.nombre as cuenta_iva_acreditable_nombre,
                    cb.codigo as cuenta_bancos_codigo,
                    cb.nombre as cuenta_bancos_nombre,
                    cca.codigo as cuenta_caja_codigo,
                    cca.nombre as cuenta_caja_nombre
                FROM config_contabilidad cc
                LEFT JOIN cuentas_contables cv ON cv.id = cc.cuenta_ventas_id
                LEFT JOIN cuentas_contables ccv ON ccv.id = cc.cuenta_costo_ventas_id
                LEFT JOIN cuentas_contables ci ON ci.id = cc.cuenta_inventario_id
                LEFT JOIN cuentas_contables ccl ON ccl.id = cc.cuenta_clientes_id
                LEFT JOIN cuentas_contables cp ON cp.id = cc.cuenta_proveedores_id
                LEFT JOIN cuentas_contables cit ON cit.id = cc.cuenta_iva_trasladado_id
                LEFT JOIN cuentas_contables cia ON cia.id = cc.cuenta_iva_acreditable_id
                LEFT JOIN cuentas_contables cb ON cb.id = cc.cuenta_bancos_id
                LEFT JOIN cuentas_contables cca ON cca.id = cc.cuenta_caja_id
                WHERE cc.organizacion_id = $1
            `, [organizacionId]);

            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar configuración contable
     */
    static async actualizarConfiguracion(data, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que exista la configuración
            const existe = await db.query(
                `SELECT id FROM config_contabilidad WHERE organizacion_id = $1`,
                [organizacionId]
            );

            ErrorHelper.throwIfNotFound(existe.rows[0], 'Configuración contable');

            // Construir query de actualización dinámica
            const campos = [];
            const valores = [];
            let idx = 1;

            // Campos actualizables
            const camposPermitidos = [
                'generar_asientos_automaticos',
                'tasa_iva',
                'metodo_costeo',
                'cuenta_ventas_id',
                'cuenta_costo_ventas_id',
                'cuenta_inventario_id',
                'cuenta_clientes_id',
                'cuenta_proveedores_id',
                'cuenta_iva_trasladado_id',
                'cuenta_iva_acreditable_id',
                'cuenta_bancos_id',
                'cuenta_caja_id',
                'cuenta_comisiones_gasto_id',
                'cuenta_descuentos_id'
            ];

            for (const campo of camposPermitidos) {
                if (data[campo] !== undefined) {
                    campos.push(`${campo} = $${idx}`);
                    valores.push(data[campo]);
                    idx++;
                }
            }

            if (campos.length === 0) {
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            // Agregar timestamp y usuario
            campos.push(`actualizado_en = NOW()`);

            valores.push(organizacionId);

            const query = `
                UPDATE config_contabilidad
                SET ${campos.join(', ')}
                WHERE organizacion_id = $${idx}
                RETURNING *
            `;

            const result = await db.query(query, valores);

            logger.info('[ReportesModel.actualizarConfiguracion] Configuración actualizada', {
                organizacion_id: organizacionId,
                usuario_id: usuarioId,
                campos_actualizados: Object.keys(data)
            });

            return result.rows[0];
        });
    }
}

module.exports = ReportesModel;
