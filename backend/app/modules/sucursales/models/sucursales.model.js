const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { ErrorHelper } = require('../../../utils/helpers');

/**
 * Model para CRUD de sucursales
 * Gestiona ubicaciones físicas de una organización
 */
class SucursalesModel {

    /**
     * Crear nueva sucursal
     * Valida límite según plan de suscripción
     */
    static async crear(organizacionId, data) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[SucursalesModel.crear] Iniciando', {
                organizacion_id: organizacionId,
                nombre: data.nombre
            });

            // Verificar límite de sucursales según plan
            const limiteQuery = `
                SELECT
                    p.limite_sucursales,
                    p.nombre_plan,
                    (SELECT COUNT(*) FROM sucursales WHERE organizacion_id = $1 AND activo = true) as sucursales_actuales
                FROM subscripciones s
                JOIN planes_subscripcion p ON s.plan_id = p.id
                WHERE s.organizacion_id = $1
            `;
            const limiteResult = await db.query(limiteQuery, [organizacionId]);

            if (limiteResult.rows.length > 0) {
                const { limite_sucursales, nombre_plan, sucursales_actuales } = limiteResult.rows[0];

                // NULL = ilimitado
                if (limite_sucursales !== null && sucursales_actuales >= limite_sucursales) {
                    logger.warn('[SucursalesModel.crear] Límite de sucursales alcanzado', {
                        organizacion_id: organizacionId,
                        plan: nombre_plan,
                        limite: limite_sucursales,
                        actuales: sucursales_actuales
                    });
                    const error = new Error(`Has alcanzado el límite de ${limite_sucursales} sucursal(es) de tu plan ${nombre_plan}. Actualiza tu plan para agregar más sucursales.`);
                    error.statusCode = 403;
                    error.code = 'LIMITE_SUCURSALES_ALCANZADO';
                    throw error;
                }
            }

            const query = `
                INSERT INTO sucursales (
                    organizacion_id,
                    codigo,
                    nombre,
                    es_matriz,
                    direccion,
                    estado_id,
                    ciudad_id,
                    codigo_postal,
                    latitud,
                    longitud,
                    telefono,
                    email,
                    whatsapp,
                    zona_horaria,
                    horario_apertura,
                    horario_cierre,
                    dias_laborales,
                    inventario_compartido,
                    servicios_heredados,
                    activo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.codigo || null,  // Se genera automáticamente por trigger si es null
                data.nombre,
                data.es_matriz || false,
                data.direccion || null,
                data.estado_id || null,
                data.ciudad_id || null,
                data.codigo_postal || null,
                data.latitud || null,
                data.longitud || null,
                data.telefono || null,
                data.email || null,
                data.whatsapp || null,
                data.zona_horaria || 'America/Mexico_City',
                data.horario_apertura || '09:00',
                data.horario_cierre || '20:00',
                JSON.stringify(data.dias_laborales || ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']),
                data.inventario_compartido !== undefined ? data.inventario_compartido : true,
                data.servicios_heredados !== undefined ? data.servicios_heredados : true,
                data.activo !== undefined ? data.activo : true
            ];

            const result = await db.query(query, values);

            logger.info('[SucursalesModel.crear] Sucursal creada', {
                sucursal_id: result.rows[0].id
            });

            return result.rows[0];
        });
    }

    /**
     * Obtener sucursal por ID
     */
    static async buscarPorId(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    s.*,
                    e.nombre AS estado_nombre,
                    c.nombre AS ciudad_nombre
                FROM sucursales s
                LEFT JOIN estados e ON s.estado_id = e.id
                LEFT JOIN ciudades c ON s.ciudad_id = c.id
                WHERE s.id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Listar sucursales con filtros opcionales
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['s.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            // Filtro por activo (usar != null para descartar tanto null como undefined)
            if (filtros.activo != null) {
                whereConditions.push(`s.activo = $${paramCounter}`);
                values.push(filtros.activo);
                paramCounter++;
            }

            // Filtro por es_matriz (usar != null para descartar tanto null como undefined)
            if (filtros.es_matriz != null) {
                whereConditions.push(`s.es_matriz = $${paramCounter}`);
                values.push(filtros.es_matriz);
                paramCounter++;
            }

            // Filtro por ciudad
            if (filtros.ciudad_id) {
                whereConditions.push(`s.ciudad_id = $${paramCounter}`);
                values.push(filtros.ciudad_id);
                paramCounter++;
            }

            const query = `
                SELECT
                    s.*,
                    e.nombre AS estado_nombre,
                    c.nombre AS ciudad_nombre,
                    (SELECT COUNT(*) FROM usuarios_sucursales us WHERE us.sucursal_id = s.id AND us.activo = true) AS total_usuarios,
                    (SELECT COUNT(*) FROM profesionales_sucursales ps WHERE ps.sucursal_id = s.id AND ps.activo = true) AS total_profesionales
                FROM sucursales s
                LEFT JOIN estados e ON s.estado_id = e.id
                LEFT JOIN ciudades c ON s.ciudad_id = c.id
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY s.es_matriz DESC, s.nombre ASC
            `;

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Actualizar sucursal
     */
    static async actualizar(organizacionId, id, data) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[SucursalesModel.actualizar] Iniciando', {
                sucursal_id: id,
                organizacion_id: organizacionId
            });

            // Verificar que existe
            const existeQuery = await db.query(
                `SELECT id FROM sucursales WHERE id = $1`,
                [id]
            );

            ErrorHelper.throwIfNotFound(existeQuery.rows[0], 'Sucursal');

            // Construir query dinámico
            const campos = [];
            const values = [];
            let paramCounter = 1;

            const camposPermitidos = [
                'codigo', 'nombre', 'direccion', 'estado_id', 'ciudad_id',
                'codigo_postal', 'latitud', 'longitud', 'telefono', 'email',
                'whatsapp', 'zona_horaria', 'horario_apertura', 'horario_cierre',
                'dias_laborales', 'inventario_compartido', 'servicios_heredados', 'activo'
            ];

            for (const campo of camposPermitidos) {
                if (data[campo] !== undefined) {
                    if (campo === 'dias_laborales') {
                        campos.push(`${campo} = $${paramCounter}`);
                        values.push(JSON.stringify(data[campo]));
                    } else {
                        campos.push(`${campo} = $${paramCounter}`);
                        values.push(data[campo]);
                    }
                    paramCounter++;
                }
            }

            if (campos.length === 0) {
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            campos.push(`actualizado_en = NOW()`);
            values.push(id);

            const query = `
                UPDATE sucursales
                SET ${campos.join(', ')}
                WHERE id = $${paramCounter}
                RETURNING *
            `;

            const result = await db.query(query, values);

            logger.info('[SucursalesModel.actualizar] Sucursal actualizada', {
                sucursal_id: id
            });

            return result.rows[0];
        });
    }

    /**
     * Eliminar sucursal (soft delete)
     */
    static async eliminar(organizacionId, id) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[SucursalesModel.eliminar] Iniciando', {
                sucursal_id: id,
                organizacion_id: organizacionId
            });

            // Verificar que no es matriz
            const sucursalQuery = await db.query(
                `SELECT id, es_matriz FROM sucursales WHERE id = $1`,
                [id]
            );

            ErrorHelper.throwIfNotFound(sucursalQuery.rows[0], 'Sucursal');

            if (sucursalQuery.rows[0].es_matriz) {
                ErrorHelper.throwConflict('No se puede eliminar la sucursal matriz');
            }

            // Soft delete
            const query = `
                UPDATE sucursales
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [id]);

            logger.info('[SucursalesModel.eliminar] Sucursal desactivada', {
                sucursal_id: id
            });

            return result.rows[0];
        });
    }

    /**
     * Obtener sucursal matriz de la organización
     */
    static async obtenerMatriz(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM sucursales
                WHERE organizacion_id = $1 AND es_matriz = true
                LIMIT 1
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Asignar usuario a sucursal
     * NOTA: rol_sucursal y permisos_override fueron migrados al sistema
     * normalizado de permisos (permisos_usuario_sucursal) en Fase 3
     */
    static async asignarUsuario(sucursalId, usuarioId, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const query = `
                INSERT INTO usuarios_sucursales (
                    usuario_id, sucursal_id, es_gerente, activo
                ) VALUES ($1, $2, $3, $4)
                ON CONFLICT (usuario_id, sucursal_id)
                DO UPDATE SET
                    es_gerente = EXCLUDED.es_gerente,
                    activo = EXCLUDED.activo
                RETURNING *
            `;

            const values = [
                usuarioId,
                sucursalId,
                data.es_gerente || false,
                data.activo !== undefined ? data.activo : true
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Obtener usuarios de una sucursal
     */
    static async obtenerUsuarios(sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    us.*,
                    u.nombre,
                    u.apellidos AS apellido,
                    u.email,
                    r.codigo AS rol_codigo,
                    r.nombre AS rol_nombre
                FROM usuarios_sucursales us
                JOIN usuarios u ON us.usuario_id = u.id
                LEFT JOIN roles r ON r.id = u.rol_id
                WHERE us.sucursal_id = $1 AND us.activo = true
                ORDER BY us.es_gerente DESC, u.nombre ASC
            `;

            const result = await db.query(query, [sucursalId]);
            return result.rows;
        });
    }

    /**
     * Asignar profesional a sucursal
     */
    static async asignarProfesional(sucursalId, profesionalId, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const query = `
                INSERT INTO profesionales_sucursales (
                    profesional_id, sucursal_id, horarios_personalizados, activo
                ) VALUES ($1, $2, $3, $4)
                ON CONFLICT (profesional_id, sucursal_id)
                DO UPDATE SET
                    horarios_personalizados = EXCLUDED.horarios_personalizados,
                    activo = EXCLUDED.activo
                RETURNING *
            `;

            const values = [
                profesionalId,
                sucursalId,
                data.horarios_personalizados ? JSON.stringify(data.horarios_personalizados) : null,
                data.activo !== undefined ? data.activo : true
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Obtener profesionales de una sucursal
     */
    static async obtenerProfesionales(sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    ps.*,
                    p.nombre_completo AS nombre,
                    p.nombre_completo AS profesional_nombre,
                    p.email AS profesional_email,
                    p.color_calendario
                FROM profesionales_sucursales ps
                JOIN profesionales p ON ps.profesional_id = p.id
                WHERE ps.sucursal_id = $1 AND ps.activo = true
                ORDER BY p.nombre_completo ASC
            `;

            const result = await db.query(query, [sucursalId]);
            return result.rows;
        });
    }

    /**
     * Obtener sucursales de un usuario
     * NOTA: rol_sucursal y permisos_override fueron migrados al sistema
     * normalizado de permisos (permisos_usuario_sucursal) en Fase 3
     */
    static async obtenerSucursalesUsuario(usuarioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    s.*,
                    us.es_gerente
                FROM sucursales s
                JOIN usuarios_sucursales us ON s.id = us.sucursal_id
                WHERE us.usuario_id = $1 AND us.activo = true AND s.activo = true
                ORDER BY s.es_matriz DESC, s.nombre ASC
            `;

            const result = await db.query(query, [usuarioId]);
            return result.rows;
        });
    }

    /**
     * Obtener métricas consolidadas para dashboard multi-sucursal
     * @param {number} organizacionId
     * @param {object} filtros - { sucursal_id, fecha_desde, fecha_hasta }
     */
    static async obtenerMetricas(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { sucursal_id, fecha_desde, fecha_hasta } = filtros;

            // Fechas por defecto: hoy y este mes
            const hoy = new Date().toISOString().split('T')[0];
            const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                .toISOString().split('T')[0];
            const desde = fecha_desde || inicioMes;
            const hasta = fecha_hasta || hoy;

            // Base de condición para sucursal
            const sucursalCondition = sucursal_id ? 'AND sucursal_id = $4' : '';
            const sucursalConditionCitas = sucursal_id ? 'AND c.sucursal_id = $4' : '';
            const params = sucursal_id ? [organizacionId, desde, hasta, sucursal_id] : [organizacionId, desde, hasta];

            // 1. Métricas de ventas
            const ventasQuery = `
                SELECT
                    COALESCE(COUNT(*), 0) as total_ventas,
                    COALESCE(SUM(total), 0) as ingresos_totales,
                    COALESCE(AVG(total), 0) as ticket_promedio,
                    COALESCE(COUNT(CASE WHEN DATE(fecha_venta) = CURRENT_DATE THEN 1 END), 0) as ventas_hoy,
                    COALESCE(SUM(CASE WHEN DATE(fecha_venta) = CURRENT_DATE THEN total ELSE 0 END), 0) as ingresos_hoy
                FROM ventas_pos
                WHERE organizacion_id = $1
                AND DATE(fecha_venta) BETWEEN $2 AND $3
                AND estado != 'cancelada'
                ${sucursalCondition}
            `;

            const ventasResult = await db.query(ventasQuery, params);
            const ventas = ventasResult.rows[0] || {};

            // 2. Métricas de citas
            const citasQuery = `
                SELECT
                    COALESCE(COUNT(*), 0) as total_citas,
                    COALESCE(COUNT(CASE WHEN estado = 'completada' THEN 1 END), 0) as citas_completadas,
                    COALESCE(COUNT(CASE WHEN estado = 'cancelada' THEN 1 END), 0) as citas_canceladas,
                    COALESCE(COUNT(CASE WHEN estado = 'pendiente' THEN 1 END), 0) as citas_pendientes,
                    COALESCE(COUNT(CASE WHEN estado = 'confirmada' THEN 1 END), 0) as citas_confirmadas,
                    COALESCE(COUNT(CASE WHEN fecha_cita = CURRENT_DATE THEN 1 END), 0) as citas_hoy,
                    COALESCE(SUM(CASE WHEN estado = 'completada' THEN precio_total ELSE 0 END), 0) as ingresos_citas
                FROM citas c
                WHERE c.organizacion_id = $1
                AND fecha_cita BETWEEN $2 AND $3
                ${sucursalConditionCitas}
            `;

            const citasResult = await db.query(citasQuery, params);
            const citas = citasResult.rows[0] || {};

            // 3. Comparativa por sucursal (solo si no se filtra por sucursal específica)
            let comparativaSucursales = [];
            if (!sucursal_id) {
                const comparativaQuery = `
                    SELECT
                        s.id,
                        s.nombre,
                        s.es_matriz,
                        COALESCE(v.total_ventas, 0) as total_ventas,
                        COALESCE(v.ingresos, 0) as ingresos_ventas,
                        COALESCE(c.total_citas, 0) as total_citas,
                        COALESCE(c.completadas, 0) as citas_completadas,
                        COALESCE(c.ingresos, 0) as ingresos_citas
                    FROM sucursales s
                    LEFT JOIN (
                        SELECT
                            sucursal_id,
                            COUNT(*) as total_ventas,
                            SUM(total) as ingresos
                        FROM ventas_pos
                        WHERE organizacion_id = $1
                        AND DATE(fecha_venta) BETWEEN $2 AND $3
                        AND estado != 'cancelada'
                        GROUP BY sucursal_id
                    ) v ON s.id = v.sucursal_id
                    LEFT JOIN (
                        SELECT
                            sucursal_id,
                            COUNT(*) as total_citas,
                            COUNT(CASE WHEN estado = 'completada' THEN 1 END) as completadas,
                            SUM(CASE WHEN estado = 'completada' THEN precio_total ELSE 0 END) as ingresos
                        FROM citas
                        WHERE organizacion_id = $1
                        AND fecha_cita BETWEEN $2 AND $3
                        GROUP BY sucursal_id
                    ) c ON s.id = c.sucursal_id
                    WHERE s.organizacion_id = $1 AND s.activo = true
                    ORDER BY (COALESCE(v.ingresos, 0) + COALESCE(c.ingresos, 0)) DESC
                `;

                const comparativaResult = await db.query(comparativaQuery, [organizacionId, desde, hasta]);
                comparativaSucursales = comparativaResult.rows;
            }

            // 4. Tendencia de los últimos 7 días
            const tendenciaSucursalCondition = sucursal_id ? 'AND sucursal_id = $2' : '';
            const tendenciaParams = sucursal_id ? [organizacionId, sucursal_id] : [organizacionId];
            const tendenciaQuery = `
                SELECT
                    DATE(fecha_venta) as fecha,
                    COUNT(*) as ventas,
                    SUM(total) as ingresos
                FROM ventas_pos
                WHERE organizacion_id = $1
                AND DATE(fecha_venta) >= CURRENT_DATE - INTERVAL '6 days'
                AND estado != 'cancelada'
                ${tendenciaSucursalCondition}
                GROUP BY DATE(fecha_venta)
                ORDER BY fecha ASC
            `;

            const tendenciaResult = await db.query(tendenciaQuery, tendenciaParams);

            // 5. Transferencias pendientes (solo enviadas, no recibidas)
            const transferenciasQuery = `
                SELECT COUNT(*) as pendientes
                FROM transferencias_stock
                WHERE organizacion_id = $1
                AND estado = 'enviado'
            `;
            const transferenciasResult = await db.query(transferenciasQuery, [organizacionId]);

            return {
                periodo: { desde, hasta },
                ventas: {
                    total: parseInt(ventas.total_ventas) || 0,
                    ingresos: parseFloat(ventas.ingresos_totales) || 0,
                    ticketPromedio: parseFloat(ventas.ticket_promedio) || 0,
                    hoy: {
                        cantidad: parseInt(ventas.ventas_hoy) || 0,
                        ingresos: parseFloat(ventas.ingresos_hoy) || 0
                    }
                },
                citas: {
                    total: parseInt(citas.total_citas) || 0,
                    completadas: parseInt(citas.citas_completadas) || 0,
                    canceladas: parseInt(citas.citas_canceladas) || 0,
                    pendientes: parseInt(citas.citas_pendientes) || 0,
                    confirmadas: parseInt(citas.citas_confirmadas) || 0,
                    hoy: parseInt(citas.citas_hoy) || 0,
                    ingresos: parseFloat(citas.ingresos_citas) || 0
                },
                comparativaSucursales,
                tendencia: tendenciaResult.rows.map(row => ({
                    fecha: row.fecha,
                    ventas: parseInt(row.ventas) || 0,
                    ingresos: parseFloat(row.ingresos) || 0
                })),
                transferencias: {
                    pendientes: parseInt(transferenciasResult.rows[0]?.pendientes) || 0
                }
            };
        });
    }
}

module.exports = SucursalesModel;
