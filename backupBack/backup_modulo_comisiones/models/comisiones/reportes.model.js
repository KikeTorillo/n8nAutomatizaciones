const RLSContextManager = require('../../../../utils/rlsContextManager');
const logger = require('../../../../utils/logger');

/**
 * Model para reportes y métricas avanzadas de comisiones
 * Maneja agregaciones complejas para dashboard y exportación
 */
class ReportesComisionesModel {

    /**
     * Generar reporte de comisiones por profesional
     * Agrupa por profesional y calcula totales
     */
    static async reportePorProfesional(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['cp.organizacion_id = $1'];
            let queryParams = [organizacionId];
            let paramIndex = 2;

            // Filtros de fecha (obligatorios para reportes)
            if (!filtros.fecha_desde || !filtros.fecha_hasta) {
                throw new Error('Se requieren fecha_desde y fecha_hasta para generar el reporte');
            }

            whereConditions.push(`cp.fecha_cita >= $${paramIndex}`);
            queryParams.push(filtros.fecha_desde);
            paramIndex++;

            whereConditions.push(`cp.fecha_cita <= $${paramIndex}`);
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
                    COALESCE(AVG(cp.monto_comision), 0) as comision_promedio
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
                    comision_promedio: parseFloat(row.comision_promedio)
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
     * Incluye tendencias y comparaciones
     */
    static async metricasDashboard(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['cp.organizacion_id = $1'];
            let queryParams = [organizacionId];
            let paramIndex = 2;

            // Filtros opcionales
            if (filtros.fecha_desde) {
                whereConditions.push(`cp.fecha_cita >= $${paramIndex}`);
                queryParams.push(filtros.fecha_desde);
                paramIndex++;
            }

            if (filtros.fecha_hasta) {
                whereConditions.push(`cp.fecha_cita <= $${paramIndex}`);
                queryParams.push(filtros.fecha_hasta);
                paramIndex++;
            }

            if (filtros.profesional_id) {
                whereConditions.push(`cp.profesional_id = $${paramIndex}`);
                queryParams.push(filtros.profesional_id);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            // Query principal de métricas
            const metricsQuery = `
                SELECT
                    COUNT(*) as total_comisiones,
                    COALESCE(SUM(cp.monto_comision), 0) as total_monto,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pendiente' THEN cp.monto_comision ELSE 0 END), 0) as monto_pendiente,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pagada' THEN cp.monto_comision ELSE 0 END), 0) as monto_pagado,
                    COALESCE(AVG(cp.monto_comision), 0) as comision_promedio,
                    COUNT(DISTINCT cp.profesional_id) as profesionales_activos,
                    COUNT(CASE WHEN cp.estado_pago = 'pendiente' THEN 1 END) as comisiones_pendientes,
                    COUNT(CASE WHEN cp.estado_pago = 'pagada' THEN 1 END) as comisiones_pagadas
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
     */
    static async comisionesPorDia(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            if (!filtros.fecha_desde || !filtros.fecha_hasta) {
                throw new Error('Se requieren fecha_desde y fecha_hasta');
            }

            let whereConditions = [
                'cp.organizacion_id = $1',
                'cp.fecha_cita >= $2',
                'cp.fecha_cita <= $3'
            ];
            let queryParams = [organizacionId, filtros.fecha_desde, filtros.fecha_hasta];
            let paramIndex = 4;

            if (filtros.profesional_id) {
                whereConditions.push(`cp.profesional_id = $${paramIndex}`);
                queryParams.push(filtros.profesional_id);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT
                    cp.fecha_cita,
                    COUNT(*) as cantidad_comisiones,
                    COALESCE(SUM(cp.monto_comision), 0) as total_monto,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pendiente' THEN cp.monto_comision ELSE 0 END), 0) as monto_pendiente,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pagada' THEN cp.monto_comision ELSE 0 END), 0) as monto_pagado
                FROM comisiones_profesionales cp
                WHERE ${whereClause}
                GROUP BY cp.fecha_cita
                ORDER BY cp.fecha_cita ASC
            `;

            const result = await db.query(query, queryParams);

            return result.rows.map(row => ({
                fecha: row.fecha_cita,
                cantidad_comisiones: parseInt(row.cantidad_comisiones),
                total_monto: parseFloat(row.total_monto),
                monto_pendiente: parseFloat(row.monto_pendiente),
                monto_pagado: parseFloat(row.monto_pagado)
            }));
        });
    }

    /**
     * Obtener detalle completo para exportación (Excel/PDF)
     */
    static async detalleParaExportacion(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            if (!filtros.fecha_desde || !filtros.fecha_hasta) {
                throw new Error('Se requieren fecha_desde y fecha_hasta para exportación');
            }

            let whereConditions = [
                'cp.organizacion_id = $1',
                'cp.fecha_cita >= $2',
                'cp.fecha_cita <= $3'
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
                    cp.id,
                    cp.fecha_cita,
                    c.codigo_cita,
                    c.hora_inicio,
                    c.hora_fin,
                    p.nombre_completo as profesional,
                    cl.nombre as cliente,
                    cp.monto_base,
                    cp.tipo_comision,
                    cp.valor_comision,
                    cp.monto_comision,
                    cp.estado_pago,
                    cp.fecha_pago,
                    cp.metodo_pago,
                    cp.referencia_pago,
                    CONCAT(u.nombre, ' ', COALESCE(u.apellidos, '')) as pagado_por,
                    cp.detalle_servicios
                FROM comisiones_profesionales cp
                INNER JOIN citas c ON cp.cita_id = c.id AND cp.fecha_cita = c.fecha_cita
                INNER JOIN profesionales p ON cp.profesional_id = p.id
                INNER JOIN clientes cl ON c.cliente_id = cl.id
                LEFT JOIN usuarios u ON cp.pagado_por = u.id
                WHERE ${whereClause}
                ORDER BY cp.fecha_cita DESC, c.hora_inicio ASC
            `;

            logger.info('[ReportesComisionesModel.detalleParaExportacion] Generando detalle', {
                fecha_desde: filtros.fecha_desde,
                fecha_hasta: filtros.fecha_hasta,
                organizacion_id: organizacionId
            });

            const result = await db.query(query, queryParams);
            return result.rows;
        });
    }
}

module.exports = ReportesComisionesModel;
