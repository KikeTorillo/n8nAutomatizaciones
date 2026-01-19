const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { PaginationHelper, ErrorHelper } = require('../../../utils/helpers');

/**
 * Model para consultas de comisiones profesionales
 * Maneja las comisiones generadas automáticamente por triggers
 *
 * ORÍGENES SOPORTADOS:
 * - cita: Comisiones de servicios completados (trigger en citas)
 * - venta: Comisiones de productos vendidos en POS (trigger en ventas_pos)
 *
 * DETALLES:
 * - detalle_servicios: JSONB con breakdown por servicio (origen = 'cita')
 * - detalle_productos: JSONB con breakdown por producto (origen = 'venta')
 */
class ComisionesModel {

    /**
     * Listar comisiones de un profesional con filtros y paginación
     *
     * @param {number} profesionalId - ID del profesional
     * @param {Object} filtros - Filtros de búsqueda
     * @param {string} [filtros.estado_pago] - 'pendiente', 'pagada' o 'cancelada'
     * @param {string} [filtros.origen] - 'cita' o 'venta'
     * @param {string} [filtros.fecha_desde] - Fecha inicio (YYYY-MM-DD)
     * @param {string} [filtros.fecha_hasta] - Fecha fin (YYYY-MM-DD)
     * @param {number} [filtros.pagina=1] - Página actual
     * @param {number} [filtros.limite=20] - Registros por página
     * @param {number} organizacionId - ID de la organización
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

            // Filtro por origen (cita o venta)
            if (filtros.origen) {
                whereConditions.push(`cp.origen = $${paramIndex}`);
                queryParams.push(filtros.origen);
                paramIndex++;
            }

            // Filtro por rango de fechas (usa fecha_cita para citas, creado_en para ventas)
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

            const whereClause = whereConditions.join(' AND ');

            // Query para contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM comisiones_profesionales cp
                WHERE ${whereClause}
            `;

            const countResult = await db.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);

            // Query para resumen por estado de pago
            const resumenQuery = `
                SELECT
                    COALESCE(SUM(cp.monto_comision), 0) as total,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pendiente' THEN cp.monto_comision ELSE 0 END), 0) as total_pendientes,
                    COALESCE(SUM(CASE WHEN cp.estado_pago = 'pagada' THEN cp.monto_comision ELSE 0 END), 0) as total_pagadas
                FROM comisiones_profesionales cp
                WHERE ${whereClause}
            `;

            const resumenResult = await db.query(resumenQuery, queryParams);
            const resumen = {
                total: parseFloat(resumenResult.rows[0].total || 0),
                total_pendientes: parseFloat(resumenResult.rows[0].total_pendientes || 0),
                total_pagadas: parseFloat(resumenResult.rows[0].total_pagadas || 0)
            };

            // Paginación
            const { limit, offset } = PaginationHelper.calculatePagination(
                filtros.pagina || 1,
                filtros.limite || 20
            );

            // Query principal con JOINs opcionales según origen
            // LEFT JOINs para que funcione tanto para citas como ventas
            const query = `
                SELECT
                    cp.*,
                    p.nombre_completo as profesional_nombre,
                    -- Datos de cita (origen = 'cita')
                    c.codigo_cita,
                    cl.nombre as cliente_nombre,
                    cl.telefono as cliente_telefono,
                    -- Datos de venta (origen = 'venta')
                    vp.folio as codigo_venta,
                    vp.total as venta_total,
                    cl_venta.nombre as cliente_venta_nombre
                FROM comisiones_profesionales cp
                INNER JOIN profesionales p ON cp.profesional_id = p.id
                -- JOINs para comisiones de citas
                LEFT JOIN citas c ON cp.cita_id = c.id AND cp.fecha_cita = c.fecha_cita AND cp.origen = 'cita'
                LEFT JOIN clientes cl ON c.cliente_id = cl.id
                -- JOINs para comisiones de ventas
                LEFT JOIN ventas_pos vp ON cp.venta_id = vp.id AND cp.origen = 'venta'
                LEFT JOIN clientes cl_venta ON vp.cliente_id = cl_venta.id
                WHERE ${whereClause}
                ORDER BY COALESCE(cp.fecha_cita, cp.creado_en::date) DESC, cp.creado_en DESC
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
                total,
                resumen,
                paginacion: PaginationHelper.getPaginationInfo(
                    filtros.pagina || 1,
                    filtros.limite || 20,
                    total
                )
            };
        });
    }

    /**
     * Consultar comisiones por período con agrupación
     * Útil para reportes y dashboard
     *
     * @param {Object} filtros - Filtros de búsqueda
     * @param {string} filtros.fecha_desde - Fecha inicio (YYYY-MM-DD) - REQUERIDO
     * @param {string} filtros.fecha_hasta - Fecha fin (YYYY-MM-DD) - REQUERIDO
     * @param {number} [filtros.profesional_id] - Filtrar por profesional
     * @param {string} [filtros.estado_pago] - 'pendiente', 'pagada' o 'cancelada'
     * @param {string} [filtros.origen] - 'cita' o 'venta'
     * @param {number} organizacionId - ID de la organización
     */
    static async consultarPorPeriodo(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['cp.organizacion_id = $1'];
            let queryParams = [organizacionId];
            let paramIndex = 2;

            // Filtros obligatorios de fecha
            if (!filtros.fecha_desde || !filtros.fecha_hasta) {
                ErrorHelper.throwValidation('Se requieren fecha_desde y fecha_hasta');
            }

            // Usa COALESCE para soportar ambos orígenes (cita usa fecha_cita, venta usa creado_en)
            whereConditions.push(`COALESCE(cp.fecha_cita, cp.creado_en::date) >= $${paramIndex}`);
            queryParams.push(filtros.fecha_desde);
            paramIndex++;

            whereConditions.push(`COALESCE(cp.fecha_cita, cp.creado_en::date) <= $${paramIndex}`);
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

            // Filtro por origen (opcional)
            if (filtros.origen) {
                whereConditions.push(`cp.origen = $${paramIndex}`);
                queryParams.push(filtros.origen);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT
                    cp.*,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    -- Datos de cita (origen = 'cita')
                    c.codigo_cita,
                    c.fecha_cita,
                    c.hora_inicio,
                    c.hora_fin,
                    cl.nombre as cliente_nombre,
                    -- Datos de venta (origen = 'venta')
                    vp.folio as codigo_venta,
                    vp.total as venta_total,
                    cl_venta.nombre as cliente_venta_nombre,
                    -- Usuario que pagó
                    CONCAT(u.nombre, ' ', COALESCE(u.apellidos, '')) as pagado_por_nombre
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
                ORDER BY COALESCE(cp.fecha_cita, cp.creado_en::date) DESC, p.nombre_completo ASC
            `;

            logger.info('[ComisionesModel.consultarPorPeriodo] Consultando período', {
                fecha_desde: filtros.fecha_desde,
                fecha_hasta: filtros.fecha_hasta,
                profesional_id: filtros.profesional_id || 'TODOS',
                origen: filtros.origen || 'TODOS'
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

            ErrorHelper.throwIfNotFound(comisionQuery.rows[0], 'Comisión');

            const comision = comisionQuery.rows[0];

            if (comision.estado_pago === 'pagada') {
                ErrorHelper.throwConflict('Esta comisión ya fue marcada como pagada');
            }

            if (comision.estado_pago === 'cancelada') {
                ErrorHelper.throwConflict('No se puede pagar una comisión cancelada');
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
     *
     * @param {Object} filtros - Filtros de búsqueda
     * @param {string} [filtros.fecha_desde] - Fecha inicio (YYYY-MM-DD)
     * @param {string} [filtros.fecha_hasta] - Fecha fin (YYYY-MM-DD)
     * @param {number} [filtros.profesional_id] - Filtrar por profesional
     * @param {string} [filtros.origen] - 'cita' o 'venta'
     * @param {number} organizacionId - ID de la organización
     */
    static async obtenerEstadisticas(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['cp.organizacion_id = $1'];
            let queryParams = [organizacionId];
            let paramIndex = 2;

            // Filtros opcionales
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

            // Filtro por origen
            if (filtros.origen) {
                whereConditions.push(`cp.origen = $${paramIndex}`);
                queryParams.push(filtros.origen);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            // Query de estadísticas agregadas con desglose por origen
            const query = `
                SELECT
                    COUNT(*) as total_comisiones,
                    COALESCE(SUM(cp.monto_comision), 0) as total_monto,
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
                comision_promedio: parseFloat(stats.comision_promedio),
                // Desglose por origen
                por_origen: {
                    citas: {
                        cantidad: parseInt(stats.comisiones_citas),
                        monto: parseFloat(stats.monto_citas)
                    },
                    ventas: {
                        cantidad: parseInt(stats.comisiones_ventas),
                        monto: parseFloat(stats.monto_ventas)
                    }
                }
            };
        });
    }

    /**
     * Obtener comisión por ID con detalles completos
     * Soporta ambos orígenes: cita y venta
     */
    static async obtenerPorId(comisionId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    cp.*,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    -- Datos de cita (origen = 'cita')
                    c.codigo_cita,
                    c.fecha_cita,
                    c.hora_inicio,
                    c.hora_fin,
                    c.estado as cita_estado,
                    cl.nombre as cliente_nombre,
                    cl.telefono as cliente_telefono,
                    cl.email as cliente_email,
                    -- Datos de venta (origen = 'venta')
                    vp.folio as codigo_venta,
                    vp.total as venta_total,
                    vp.estado as venta_estado,
                    vp.metodo_pago as venta_metodo_pago,
                    cl_venta.nombre as cliente_venta_nombre,
                    cl_venta.telefono as cliente_venta_telefono,
                    cl_venta.email as cliente_venta_email,
                    -- Usuario que pagó la comisión
                    CONCAT(u.nombre, ' ', COALESCE(u.apellidos, '')) as pagado_por_nombre
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
                WHERE cp.id = $1 AND cp.organizacion_id = $2
            `;

            const result = await db.query(query, [comisionId, organizacionId]);
            return result.rows[0] || null;
        });
    }
}

module.exports = ComisionesModel;
