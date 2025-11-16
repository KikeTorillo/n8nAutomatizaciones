const RLSContextManager = require('../../utils/rlsContextManager');
const logger = require('../../utils/logger');
const PaginationHelper = require('../../utils/helpers').PaginationHelper;

/**
 * Model para consultas de comisiones profesionales
 * Maneja las comisiones generadas automáticamente por el trigger
 */
class ComisionesModel {

    /**
     * Listar comisiones de un profesional con filtros y paginación
     */
    static async listarPorProfesional(profesionalId, filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = [
                'cp.organizacion_id = $1',
                'cp.profesional_id = $2'
            ];
            let queryParams = [organizacionId, profesionalId];
            let paramIndex = 3;

            // Filtro por estado de pago
            if (filtros.estado_pago) {
                whereConditions.push(`cp.estado_pago = $${paramIndex}`);
                queryParams.push(filtros.estado_pago);
                paramIndex++;
            }

            // Filtro por rango de fechas
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

            const whereClause = whereConditions.join(' AND ');

            // Query para contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM comisiones_profesionales cp
                WHERE ${whereClause}
            `;

            const countResult = await db.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);

            // Paginación
            const { limit, offset } = PaginationHelper.calcularLimitOffset(
                filtros.pagina || 1,
                filtros.limite || 20
            );

            // Query principal con JOIN para obtener info de la cita
            const query = `
                SELECT
                    cp.*,
                    p.nombre_completo as profesional_nombre,
                    c.codigo_cita,
                    cl.nombre as cliente_nombre,
                    cl.telefono as cliente_telefono
                FROM comisiones_profesionales cp
                INNER JOIN profesionales p ON cp.profesional_id = p.id
                INNER JOIN citas c ON cp.cita_id = c.id AND cp.fecha_cita = c.fecha_cita
                INNER JOIN clientes cl ON c.cliente_id = cl.id
                WHERE ${whereClause}
                ORDER BY cp.fecha_cita DESC, cp.creado_en DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            queryParams.push(limit, offset);

            logger.info('[ComisionesModel.listarPorProfesional] Consultando comisiones', {
                profesional_id: profesionalId,
                filtros,
                limite: limit,
                offset
            });

            const result = await db.query(query, queryParams);

            return {
                comisiones: result.rows,
                paginacion: PaginationHelper.generarMetadata(
                    total,
                    filtros.pagina || 1,
                    filtros.limite || 20
                )
            };
        });
    }

    /**
     * Consultar comisiones por período con agrupación
     * Útil para reportes y dashboard
     */
    static async consultarPorPeriodo(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['cp.organizacion_id = $1'];
            let queryParams = [organizacionId];
            let paramIndex = 2;

            // Filtros obligatorios de fecha
            if (!filtros.fecha_desde || !filtros.fecha_hasta) {
                throw new Error('Se requieren fecha_desde y fecha_hasta');
            }

            whereConditions.push(`cp.fecha_cita >= $${paramIndex}`);
            queryParams.push(filtros.fecha_desde);
            paramIndex++;

            whereConditions.push(`cp.fecha_cita <= $${paramIndex}`);
            queryParams.push(filtros.fecha_hasta);
            paramIndex++;

            // Filtro por profesional (opcional)
            if (filtros.profesional_id) {
                whereConditions.push(`cp.profesional_id = $${paramIndex}`);
                queryParams.push(filtros.profesional_id);
                paramIndex++;
            }

            // Filtro por estado de pago (opcional)
            if (filtros.estado_pago) {
                whereConditions.push(`cp.estado_pago = $${paramIndex}`);
                queryParams.push(filtros.estado_pago);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT
                    cp.*,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    c.codigo_cita,
                    c.fecha_cita,
                    c.hora_inicio,
                    c.hora_fin,
                    cl.nombre as cliente_nombre,
                    CONCAT(u.nombre, ' ', COALESCE(u.apellidos, '')) as pagado_por_nombre
                FROM comisiones_profesionales cp
                INNER JOIN profesionales p ON cp.profesional_id = p.id
                INNER JOIN citas c ON cp.cita_id = c.id AND cp.fecha_cita = c.fecha_cita
                INNER JOIN clientes cl ON c.cliente_id = cl.id
                LEFT JOIN usuarios u ON cp.pagado_por = u.id
                WHERE ${whereClause}
                ORDER BY cp.fecha_cita DESC, p.nombre_completo ASC
            `;

            logger.info('[ComisionesModel.consultarPorPeriodo] Consultando período', {
                fecha_desde: filtros.fecha_desde,
                fecha_hasta: filtros.fecha_hasta,
                profesional_id: filtros.profesional_id || 'TODOS'
            });

            const result = await db.query(query, queryParams);
            return result.rows;
        });
    }

    /**
     * Marcar comisión como pagada
     */
    static async marcarComoPagada(comisionId, datosPago, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ComisionesModel.marcarComoPagada] Marcando comisión como pagada', {
                comision_id: comisionId,
                metodo_pago: datosPago.metodo_pago
            });

            // Verificar que la comisión existe y está pendiente
            const comisionQuery = await db.query(
                `SELECT id, estado_pago, monto_comision
                 FROM comisiones_profesionales
                 WHERE id = $1 AND organizacion_id = $2`,
                [comisionId, organizacionId]
            );

            if (comisionQuery.rows.length === 0) {
                throw new Error('Comisión no encontrada');
            }

            const comision = comisionQuery.rows[0];

            if (comision.estado_pago === 'pagada') {
                throw new Error('Esta comisión ya fue marcada como pagada');
            }

            if (comision.estado_pago === 'cancelada') {
                throw new Error('No se puede pagar una comisión cancelada');
            }

            // Actualizar estado a pagada
            const result = await db.query(
                `UPDATE comisiones_profesionales
                 SET estado_pago = 'pagada',
                     fecha_pago = $1,
                     metodo_pago = $2,
                     referencia_pago = $3,
                     notas_pago = $4,
                     pagado_por = $5,
                     actualizado_en = NOW()
                 WHERE id = $6
                 RETURNING *`,
                [
                    datosPago.fecha_pago || new Date().toISOString().split('T')[0],
                    datosPago.metodo_pago || 'efectivo',
                    datosPago.referencia_pago || null,
                    datosPago.notas_pago || null,
                    datosPago.pagado_por || null,
                    comisionId
                ]
            );

            logger.info('[ComisionesModel.marcarComoPagada] Comisión pagada exitosamente', {
                comision_id: comisionId,
                monto: comision.monto_comision
            });

            return result.rows[0];
        });
    }

    /**
     * Obtener estadísticas de comisiones para dashboard
     */
    static async obtenerEstadisticas(filtros, organizacionId) {
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

            // Query de estadísticas agregadas
            const query = `
                SELECT
                    COUNT(*) as total_comisiones,
                    COALESCE(SUM(cp.monto_comision), 0) as total_monto,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pendiente' THEN cp.monto_comision ELSE 0 END), 0) as monto_pendiente,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pagada' THEN cp.monto_comision ELSE 0 END), 0) as monto_pagado,
                    COUNT(CASE WHEN cp.estado_pago = 'pendiente' THEN 1 END) as comisiones_pendientes,
                    COUNT(CASE WHEN cp.estado_pago = 'pagada' THEN 1 END) as comisiones_pagadas,
                    COALESCE(AVG(cp.monto_comision), 0) as comision_promedio
                FROM comisiones_profesionales cp
                WHERE ${whereClause}
            `;

            logger.info('[ComisionesModel.obtenerEstadisticas] Consultando estadísticas', {
                filtros,
                organizacion_id: organizacionId
            });

            const result = await db.query(query, queryParams);
            const stats = result.rows[0];

            // Convertir strings a números
            return {
                total_comisiones: parseInt(stats.total_comisiones),
                total_monto: parseFloat(stats.total_monto),
                monto_pendiente: parseFloat(stats.monto_pendiente),
                monto_pagado: parseFloat(stats.monto_pagado),
                comisiones_pendientes: parseInt(stats.comisiones_pendientes),
                comisiones_pagadas: parseInt(stats.comisiones_pagadas),
                comision_promedio: parseFloat(stats.comision_promedio)
            };
        });
    }

    /**
     * Obtener comisión por ID con detalles completos
     */
    static async obtenerPorId(comisionId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    cp.*,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    c.codigo_cita,
                    c.fecha_cita,
                    c.hora_inicio,
                    c.hora_fin,
                    c.estado as cita_estado,
                    cl.nombre as cliente_nombre,
                    cl.telefono as cliente_telefono,
                    cl.email as cliente_email,
                    CONCAT(u.nombre, ' ', COALESCE(u.apellidos, '')) as pagado_por_nombre
                FROM comisiones_profesionales cp
                INNER JOIN profesionales p ON cp.profesional_id = p.id
                INNER JOIN citas c ON cp.cita_id = c.id AND cp.fecha_cita = c.fecha_cita
                INNER JOIN clientes cl ON c.cliente_id = cl.id
                LEFT JOIN usuarios u ON cp.pagado_por = u.id
                WHERE cp.id = $1 AND cp.organizacion_id = $2
            `;

            const result = await db.query(query, [comisionId, organizacionId]);
            return result.rows[0] || null;
        });
    }
}

module.exports = ComisionesModel;
