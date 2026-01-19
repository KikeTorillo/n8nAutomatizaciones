const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { ErrorHelper } = require('../../../utils/helpers');

/**
 * Model para reportes y métricas avanzadas de comisiones
 * Maneja agregaciones complejas para dashboard y exportación
 *
 * ORÍGENES SOPORTADOS:
 * - cita: Comisiones de servicios completados
 * - venta: Comisiones de productos vendidos en POS
 */
class ReportesComisionesModel {

    /**
     * Generar reporte de comisiones por profesional
     * Agrupa por profesional y calcula totales
     *
     * @param {Object} filtros - Filtros de búsqueda
     * @param {string} filtros.fecha_desde - Fecha inicio (YYYY-MM-DD) - REQUERIDO
     * @param {string} filtros.fecha_hasta - Fecha fin (YYYY-MM-DD) - REQUERIDO
     * @param {number} [filtros.profesional_id] - Filtrar por profesional
     * @param {string} [filtros.estado_pago] - 'pendiente', 'pagada' o 'cancelada'
     * @param {string} [filtros.origen] - 'cita' o 'venta'
     * @param {number} organizacionId - ID de la organización
     */
    static async reportePorProfesional(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['cp.organizacion_id = $1'];
            let queryParams = [organizacionId];
            let paramIndex = 2;

            // Filtros de fecha (obligatorios para reportes)
            if (!filtros.fecha_desde || !filtros.fecha_hasta) {
                ErrorHelper.throwValidation('Se requieren fecha_desde y fecha_hasta para generar el reporte');
            }

            // Usa COALESCE para soportar ambos orígenes
            whereConditions.push(`COALESCE(cp.fecha_cita, cp.creado_en::date) >= $${paramIndex}`);
            queryParams.push(filtros.fecha_desde);
            paramIndex++;

            whereConditions.push(`COALESCE(cp.fecha_cita, cp.creado_en::date) <= $${paramIndex}`);
            queryParams.push(filtros.fecha_hasta);
            paramIndex++;

            // Filtro opcional por profesional
            if (filtros.profesional_id) {
                whereConditions.push(`cp.profesional_id = $${paramIndex}`);
                queryParams.push(filtros.profesional_id);
                paramIndex++;
            }

            // Filtro opcional por estado
            if (filtros.estado_pago) {
                whereConditions.push(`cp.estado_pago = $${paramIndex}`);
                queryParams.push(filtros.estado_pago);
                paramIndex++;
            }

            // Filtro opcional por origen
            if (filtros.origen) {
                whereConditions.push(`cp.origen = $${paramIndex}`);
                queryParams.push(filtros.origen);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT
                    p.id as profesional_id,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    COUNT(cp.id) as total_comisiones,
                    COALESCE(SUM(cp.monto_base), 0) as total_ventas,
                    COALESCE(SUM(cp.monto_comision), 0) as total_comisiones_monto,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pendiente' THEN cp.monto_comision ELSE 0 END), 0) as monto_pendiente,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pagada' THEN cp.monto_comision ELSE 0 END), 0) as monto_pagado,
                    COUNT(CASE WHEN cp.estado_pago = 'pendiente' THEN 1 END) as comisiones_pendientes,
                    COUNT(CASE WHEN cp.estado_pago = 'pagada' THEN 1 END) as comisiones_pagadas,
                    COALESCE(AVG(cp.monto_comision), 0) as comision_promedio,
                    -- Desglose por origen
                    COUNT(CASE WHEN cp.origen = 'cita' THEN 1 END) as comisiones_citas,
                    COUNT(CASE WHEN cp.origen = 'venta' THEN 1 END) as comisiones_ventas,
                    COALESCE(SUM(CASE WHEN cp.origen = 'cita' THEN cp.monto_comision ELSE 0 END), 0) as monto_citas,
                    COALESCE(SUM(CASE WHEN cp.origen = 'venta' THEN cp.monto_comision ELSE 0 END), 0) as monto_ventas
                FROM profesionales p
                INNER JOIN comisiones_profesionales cp ON p.id = cp.profesional_id
                WHERE ${whereClause}
                GROUP BY p.id, p.nombre_completo, p.email
                ORDER BY total_comisiones_monto DESC
            `;

            logger.info('[ReportesComisionesModel.reportePorProfesional] Generando reporte', {
                fecha_desde: filtros.fecha_desde,
                fecha_hasta: filtros.fecha_hasta,
                organizacion_id: organizacionId
            });

            const result = await db.query(query, queryParams);

            // Calcular totales generales
            const totales = result.rows.reduce((acc, row) => ({
                total_comisiones: acc.total_comisiones + parseInt(row.total_comisiones),
                total_ventas: acc.total_ventas + parseFloat(row.total_ventas),
                total_comisiones_monto: acc.total_comisiones_monto + parseFloat(row.total_comisiones_monto),
                monto_pendiente: acc.monto_pendiente + parseFloat(row.monto_pendiente),
                monto_pagado: acc.monto_pagado + parseFloat(row.monto_pagado)
            }), {
                total_comisiones: 0,
                total_ventas: 0,
                total_comisiones_monto: 0,
                monto_pendiente: 0,
                monto_pagado: 0
            });

            return {
                profesionales: result.rows.map(row => ({
                    profesional_id: row.profesional_id,
                    profesional_nombre: row.profesional_nombre,
                    profesional_email: row.profesional_email,
                    total_comisiones: parseInt(row.total_comisiones),
                    total_ventas: parseFloat(row.total_ventas),
                    total_comisiones_monto: parseFloat(row.total_comisiones_monto),
                    monto_pendiente: parseFloat(row.monto_pendiente),
                    monto_pagado: parseFloat(row.monto_pagado),
                    comisiones_pendientes: parseInt(row.comisiones_pendientes),
                    comisiones_pagadas: parseInt(row.comisiones_pagadas),
                    comision_promedio: parseFloat(row.comision_promedio),
                    // Desglose por origen
                    por_origen: {
                        citas: {
                            cantidad: parseInt(row.comisiones_citas),
                            monto: parseFloat(row.monto_citas)
                        },
                        ventas: {
                            cantidad: parseInt(row.comisiones_ventas),
                            monto: parseFloat(row.monto_ventas)
                        }
                    }
                })),
                totales,
                periodo: {
                    fecha_desde: filtros.fecha_desde,
                    fecha_hasta: filtros.fecha_hasta
                }
            };
        });
    }

    /**
     * Generar métricas para dashboard
     * Incluye tendencias, comparaciones y desglose por origen
     */
    static async metricasDashboard(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['cp.organizacion_id = $1'];
            let queryParams = [organizacionId];
            let paramIndex = 2;

            // Filtros opcionales - usa COALESCE para soportar ambos orígenes
            if (filtros.fecha_desde) {
                whereConditions.push(`COALESCE(cp.fecha_cita, cp.creado_en::date) >= $${paramIndex}`);
                queryParams.push(filtros.fecha_desde);
                paramIndex++;
            }

            if (filtros.fecha_hasta) {
                whereConditions.push(`COALESCE(cp.fecha_cita, cp.creado_en::date) <= $${paramIndex}`);
                queryParams.push(filtros.fecha_hasta);
                paramIndex++;
            }

            if (filtros.profesional_id) {
                whereConditions.push(`cp.profesional_id = $${paramIndex}`);
                queryParams.push(filtros.profesional_id);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            // Query principal de métricas con desglose por origen
            const metricsQuery = `
                SELECT
                    COUNT(*) as total_comisiones,
                    COALESCE(SUM(cp.monto_comision), 0) as total_monto,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pendiente' THEN cp.monto_comision ELSE 0 END), 0) as monto_pendiente,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pagada' THEN cp.monto_comision ELSE 0 END), 0) as monto_pagado,
                    COALESCE(AVG(cp.monto_comision), 0) as comision_promedio,
                    COUNT(DISTINCT cp.profesional_id) as profesionales_activos,
                    COUNT(CASE WHEN cp.estado_pago = 'pendiente' THEN 1 END) as comisiones_pendientes,
                    COUNT(CASE WHEN cp.estado_pago = 'pagada' THEN 1 END) as comisiones_pagadas,
                    -- Desglose por origen
                    COUNT(CASE WHEN cp.origen = 'cita' THEN 1 END) as comisiones_citas,
                    COUNT(CASE WHEN cp.origen = 'venta' THEN 1 END) as comisiones_ventas,
                    COALESCE(SUM(CASE WHEN cp.origen = 'cita' THEN cp.monto_comision ELSE 0 END), 0) as monto_citas,
                    COALESCE(SUM(CASE WHEN cp.origen = 'venta' THEN cp.monto_comision ELSE 0 END), 0) as monto_ventas
                FROM comisiones_profesionales cp
                WHERE ${whereClause}
            `;

            const metricsResult = await db.query(metricsQuery, queryParams);
            const metrics = metricsResult.rows[0];

            // Query de comisiones por tipo
            const tiposQuery = `
                SELECT
                    cp.tipo_comision,
                    COUNT(*) as cantidad,
                    COALESCE(SUM(cp.monto_comision), 0) as total_monto
                FROM comisiones_profesionales cp
                WHERE ${whereClause}
                GROUP BY cp.tipo_comision
            `;

            const tiposResult = await db.query(tiposQuery, queryParams);

            // Query de top 5 profesionales
            const topProfesionalesQuery = `
                SELECT
                    p.id,
                    p.nombre_completo,
                    COUNT(cp.id) as total_comisiones,
                    COALESCE(SUM(cp.monto_comision), 0) as total_monto
                FROM profesionales p
                INNER JOIN comisiones_profesionales cp ON p.id = cp.profesional_id
                WHERE ${whereClause}
                GROUP BY p.id, p.nombre_completo
                ORDER BY total_monto DESC
                LIMIT 5
            `;

            const topProfesionalesResult = await db.query(topProfesionalesQuery, queryParams);

            logger.info('[ReportesComisionesModel.metricasDashboard] Métricas generadas', {
                total_comisiones: metrics.total_comisiones,
                total_monto: metrics.total_monto
            });

            return {
                resumen: {
                    total_comisiones: parseInt(metrics.total_comisiones),
                    total_monto: parseFloat(metrics.total_monto),
                    monto_pendiente: parseFloat(metrics.monto_pendiente),
                    monto_pagado: parseFloat(metrics.monto_pagado),
                    comision_promedio: parseFloat(metrics.comision_promedio),
                    profesionales_activos: parseInt(metrics.profesionales_activos),
                    comisiones_pendientes: parseInt(metrics.comisiones_pendientes),
                    comisiones_pagadas: parseInt(metrics.comisiones_pagadas)
                },
                por_tipo: tiposResult.rows.map(row => ({
                    tipo_comision: row.tipo_comision,
                    cantidad: parseInt(row.cantidad),
                    total_monto: parseFloat(row.total_monto)
                })),
                por_origen: {
                    citas: {
                        cantidad: parseInt(metrics.comisiones_citas),
                        monto: parseFloat(metrics.monto_citas)
                    },
                    ventas: {
                        cantidad: parseInt(metrics.comisiones_ventas),
                        monto: parseFloat(metrics.monto_ventas)
                    }
                },
                top_profesionales: topProfesionalesResult.rows.map(row => ({
                    id: row.id,
                    nombre: row.nombre_completo,
                    total_comisiones: parseInt(row.total_comisiones),
                    total_monto: parseFloat(row.total_monto)
                }))
            };
        });
    }

    /**
     * Obtener comisiones agrupadas por día (para gráficas)
     * Soporta ambos orígenes: cita y venta
     */
    static async comisionesPorDia(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            if (!filtros.fecha_desde || !filtros.fecha_hasta) {
                ErrorHelper.throwValidation('Se requieren fecha_desde y fecha_hasta');
            }

            let whereConditions = [
                'cp.organizacion_id = $1',
                'COALESCE(cp.fecha_cita, cp.creado_en::date) >= $2',
                'COALESCE(cp.fecha_cita, cp.creado_en::date) <= $3'
            ];
            let queryParams = [organizacionId, filtros.fecha_desde, filtros.fecha_hasta];
            let paramIndex = 4;

            if (filtros.profesional_id) {
                whereConditions.push(`cp.profesional_id = $${paramIndex}`);
                queryParams.push(filtros.profesional_id);
                paramIndex++;
            }

            if (filtros.origen) {
                whereConditions.push(`cp.origen = $${paramIndex}`);
                queryParams.push(filtros.origen);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT
                    COALESCE(cp.fecha_cita, cp.creado_en::date) as fecha,
                    COUNT(*) as cantidad_comisiones,
                    COALESCE(SUM(cp.monto_comision), 0) as total_monto,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pendiente' THEN cp.monto_comision ELSE 0 END), 0) as monto_pendiente,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pagada' THEN cp.monto_comision ELSE 0 END), 0) as monto_pagado,
                    -- Desglose por origen
                    COUNT(CASE WHEN cp.origen = 'cita' THEN 1 END) as comisiones_citas,
                    COUNT(CASE WHEN cp.origen = 'venta' THEN 1 END) as comisiones_ventas,
                    COALESCE(SUM(CASE WHEN cp.origen = 'cita' THEN cp.monto_comision ELSE 0 END), 0) as monto_citas,
                    COALESCE(SUM(CASE WHEN cp.origen = 'venta' THEN cp.monto_comision ELSE 0 END), 0) as monto_ventas
                FROM comisiones_profesionales cp
                WHERE ${whereClause}
                GROUP BY COALESCE(cp.fecha_cita, cp.creado_en::date)
                ORDER BY fecha ASC
            `;

            const result = await db.query(query, queryParams);

            return result.rows.map(row => ({
                fecha: row.fecha,
                cantidad_comisiones: parseInt(row.cantidad_comisiones),
                total_monto: parseFloat(row.total_monto),
                monto_pendiente: parseFloat(row.monto_pendiente),
                monto_pagado: parseFloat(row.monto_pagado),
                por_origen: {
                    citas: {
                        cantidad: parseInt(row.comisiones_citas),
                        monto: parseFloat(row.monto_citas)
                    },
                    ventas: {
                        cantidad: parseInt(row.comisiones_ventas),
                        monto: parseFloat(row.monto_ventas)
                    }
                }
            }));
        });
    }

    /**
     * Obtener detalle completo para exportación (Excel/PDF)
     * Soporta ambos orígenes: cita y venta
     */
    static async detalleParaExportacion(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            if (!filtros.fecha_desde || !filtros.fecha_hasta) {
                ErrorHelper.throwValidation('Se requieren fecha_desde y fecha_hasta para exportación');
            }

            let whereConditions = [
                'cp.organizacion_id = $1',
                'COALESCE(cp.fecha_cita, cp.creado_en::date) >= $2',
                'COALESCE(cp.fecha_cita, cp.creado_en::date) <= $3'
            ];
            let queryParams = [organizacionId, filtros.fecha_desde, filtros.fecha_hasta];
            let paramIndex = 4;

            if (filtros.profesional_id) {
                whereConditions.push(`cp.profesional_id = $${paramIndex}`);
                queryParams.push(filtros.profesional_id);
                paramIndex++;
            }

            if (filtros.estado_pago) {
                whereConditions.push(`cp.estado_pago = $${paramIndex}`);
                queryParams.push(filtros.estado_pago);
                paramIndex++;
            }

            if (filtros.origen) {
                whereConditions.push(`cp.origen = $${paramIndex}`);
                queryParams.push(filtros.origen);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT
                    cp.id,
                    cp.origen,
                    COALESCE(cp.fecha_cita, cp.creado_en::date) as fecha,
                    p.nombre_completo as profesional,
                    cp.monto_base,
                    cp.tipo_comision,
                    cp.valor_comision,
                    cp.monto_comision,
                    cp.estado_pago,
                    cp.fecha_pago,
                    cp.metodo_pago,
                    cp.referencia_pago,
                    CONCAT(u.nombre, ' ', COALESCE(u.apellidos, '')) as pagado_por,
                    cp.detalle_servicios,
                    cp.detalle_productos,
                    -- Datos de cita (origen = 'cita')
                    c.codigo_cita,
                    c.hora_inicio,
                    c.hora_fin,
                    cl.nombre as cliente_cita,
                    -- Datos de venta (origen = 'venta')
                    vp.codigo_venta,
                    cl_venta.nombre as cliente_venta
                FROM comisiones_profesionales cp
                INNER JOIN profesionales p ON cp.profesional_id = p.id
                -- JOINs para comisiones de citas
                LEFT JOIN citas c ON cp.cita_id = c.id AND cp.fecha_cita = c.fecha_cita AND cp.origen = 'cita'
                LEFT JOIN clientes cl ON c.cliente_id = cl.id
                -- JOINs para comisiones de ventas
                LEFT JOIN ventas_pos vp ON cp.venta_id = vp.id AND cp.origen = 'venta'
                LEFT JOIN clientes cl_venta ON vp.cliente_id = cl_venta.id
                -- Usuario que pagó
                LEFT JOIN usuarios u ON cp.pagado_por = u.id
                WHERE ${whereClause}
                ORDER BY fecha DESC, cp.creado_en DESC
            `;

            logger.info('[ReportesComisionesModel.detalleParaExportacion] Generando detalle', {
                fecha_desde: filtros.fecha_desde,
                fecha_hasta: filtros.fecha_hasta,
                origen: filtros.origen || 'TODOS',
                organizacion_id: organizacionId
            });

            const result = await db.query(query, queryParams);
            return result.rows;
        });
    }

    /**
     * Reporte agrupado por origen (cita vs venta)
     * Útil para comparar rendimiento de servicios vs productos
     */
    static async reportePorOrigen(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            if (!filtros.fecha_desde || !filtros.fecha_hasta) {
                ErrorHelper.throwValidation('Se requieren fecha_desde y fecha_hasta para generar el reporte');
            }

            let whereConditions = [
                'cp.organizacion_id = $1',
                'COALESCE(cp.fecha_cita, cp.creado_en::date) >= $2',
                'COALESCE(cp.fecha_cita, cp.creado_en::date) <= $3'
            ];
            let queryParams = [organizacionId, filtros.fecha_desde, filtros.fecha_hasta];
            let paramIndex = 4;

            if (filtros.profesional_id) {
                whereConditions.push(`cp.profesional_id = $${paramIndex}`);
                queryParams.push(filtros.profesional_id);
                paramIndex++;
            }

            if (filtros.estado_pago) {
                whereConditions.push(`cp.estado_pago = $${paramIndex}`);
                queryParams.push(filtros.estado_pago);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT
                    cp.origen,
                    COUNT(cp.id) as total_comisiones,
                    COALESCE(SUM(cp.monto_base), 0) as total_base,
                    COALESCE(SUM(cp.monto_comision), 0) as total_comisiones_monto,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pendiente' THEN cp.monto_comision ELSE 0 END), 0) as monto_pendiente,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pagada' THEN cp.monto_comision ELSE 0 END), 0) as monto_pagado,
                    COUNT(CASE WHEN cp.estado_pago = 'pendiente' THEN 1 END) as comisiones_pendientes,
                    COUNT(CASE WHEN cp.estado_pago = 'pagada' THEN 1 END) as comisiones_pagadas,
                    COALESCE(AVG(cp.monto_comision), 0) as comision_promedio,
                    COUNT(DISTINCT cp.profesional_id) as profesionales
                FROM comisiones_profesionales cp
                WHERE ${whereClause}
                GROUP BY cp.origen
                ORDER BY total_comisiones_monto DESC
            `;

            logger.info('[ReportesComisionesModel.reportePorOrigen] Generando reporte', {
                fecha_desde: filtros.fecha_desde,
                fecha_hasta: filtros.fecha_hasta,
                organizacion_id: organizacionId
            });

            const result = await db.query(query, queryParams);

            // Calcular totales
            const totales = result.rows.reduce((acc, row) => ({
                total_comisiones: acc.total_comisiones + parseInt(row.total_comisiones),
                total_base: acc.total_base + parseFloat(row.total_base),
                total_comisiones_monto: acc.total_comisiones_monto + parseFloat(row.total_comisiones_monto),
                monto_pendiente: acc.monto_pendiente + parseFloat(row.monto_pendiente),
                monto_pagado: acc.monto_pagado + parseFloat(row.monto_pagado)
            }), {
                total_comisiones: 0,
                total_base: 0,
                total_comisiones_monto: 0,
                monto_pendiente: 0,
                monto_pagado: 0
            });

            return {
                por_origen: result.rows.map(row => ({
                    origen: row.origen,
                    total_comisiones: parseInt(row.total_comisiones),
                    total_base: parseFloat(row.total_base),
                    total_comisiones_monto: parseFloat(row.total_comisiones_monto),
                    monto_pendiente: parseFloat(row.monto_pendiente),
                    monto_pagado: parseFloat(row.monto_pagado),
                    comisiones_pendientes: parseInt(row.comisiones_pendientes),
                    comisiones_pagadas: parseInt(row.comisiones_pagadas),
                    comision_promedio: parseFloat(row.comision_promedio),
                    profesionales: parseInt(row.profesionales)
                })),
                totales,
                periodo: {
                    fecha_desde: filtros.fecha_desde,
                    fecha_hasta: filtros.fecha_hasta
                }
            };
        });
    }
}

module.exports = ReportesComisionesModel;
