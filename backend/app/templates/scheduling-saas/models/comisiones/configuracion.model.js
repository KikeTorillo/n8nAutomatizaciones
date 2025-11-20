const RLSContextManager = require('../../../../utils/rlsContextManager');
const logger = require('../../../../utils/logger');

/**
 * Model para CRUD de configuración de comisiones
 * Maneja las reglas de comisión por profesional/servicio
 */
class ConfiguracionComisionesModel {

    /**
     * Crear o actualizar configuración de comisión
     * Si ya existe (org + prof + servicio), actualiza. Si no, crea nueva.
     */
    static async crearOActualizar(data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ConfiguracionComisionesModel.crearOActualizar] Iniciando', {
                organizacion_id: organizacionId,
                profesional_id: data.profesional_id,
                servicio_id: data.servicio_id || 'GLOBAL'
            });

            // Validar que el profesional existe y pertenece a la organización
            const profesionalQuery = await db.query(
                `SELECT id FROM profesionales WHERE id = $1 AND organizacion_id = $2`,
                [data.profesional_id, organizacionId]
            );

            if (profesionalQuery.rows.length === 0) {
                throw new Error('Profesional no encontrado o no pertenece a esta organización');
            }

            // Si servicio_id está definido, validar que existe y pertenece a la organización
            if (data.servicio_id) {
                const servicioQuery = await db.query(
                    `SELECT id FROM servicios WHERE id = $1 AND organizacion_id = $2`,
                    [data.servicio_id, organizacionId]
                );

                if (servicioQuery.rows.length === 0) {
                    throw new Error('Servicio no encontrado o no pertenece a esta organización');
                }
            }

            // Verificar si ya existe una configuración
            const existenteQuery = await db.query(
                `SELECT id FROM configuracion_comisiones
                 WHERE organizacion_id = $1
                   AND profesional_id = $2
                   AND servicio_id IS NOT DISTINCT FROM $3`,
                [organizacionId, data.profesional_id, data.servicio_id || null]
            );

            let result;

            if (existenteQuery.rows.length > 0) {
                // ACTUALIZAR configuración existente
                const configId = existenteQuery.rows[0].id;

                result = await db.query(
                    `UPDATE configuracion_comisiones
                     SET tipo_comision = $1,
                         valor_comision = $2,
                         activo = $3,
                         notas = $4,
                         actualizado_en = NOW()
                     WHERE id = $5
                     RETURNING *`,
                    [
                        data.tipo_comision,
                        data.valor_comision,
                        data.activo !== undefined ? data.activo : true,
                        data.notas || null,
                        configId
                    ]
                );

                logger.info('[ConfiguracionComisionesModel.crearOActualizar] Configuración actualizada', {
                    config_id: configId
                });
            } else {
                // CREAR nueva configuración
                result = await db.query(
                    `INSERT INTO configuracion_comisiones (
                        organizacion_id,
                        profesional_id,
                        servicio_id,
                        tipo_comision,
                        valor_comision,
                        activo,
                        notas,
                        creado_por
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING *`,
                    [
                        organizacionId,
                        data.profesional_id,
                        data.servicio_id || null,
                        data.tipo_comision,
                        data.valor_comision,
                        data.activo !== undefined ? data.activo : true,
                        data.notas || null,
                        data.creado_por || null
                    ]
                );

                logger.info('[ConfiguracionComisionesModel.crearOActualizar] Configuración creada', {
                    config_id: result.rows[0].id
                });
            }

            return result.rows[0];
        });
    }

    /**
     * Listar configuraciones de comisiones con filtros opcionales
     */
    static async listar(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['cc.organizacion_id = $1'];
            let queryParams = [organizacionId];
            let paramIndex = 2;

            // Filtro por profesional
            if (filtros.profesional_id) {
                whereConditions.push(`cc.profesional_id = $${paramIndex}`);
                queryParams.push(filtros.profesional_id);
                paramIndex++;
            }

            // Filtro por servicio
            if (filtros.servicio_id) {
                whereConditions.push(`cc.servicio_id = $${paramIndex}`);
                queryParams.push(filtros.servicio_id);
                paramIndex++;
            }

            // Filtro por estado activo
            if (filtros.activo !== undefined) {
                whereConditions.push(`cc.activo = $${paramIndex}`);
                queryParams.push(filtros.activo);
                paramIndex++;
            }

            // Filtro por tipo de comisión
            if (filtros.tipo_comision) {
                whereConditions.push(`cc.tipo_comision = $${paramIndex}`);
                queryParams.push(filtros.tipo_comision);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT
                    cc.*,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    s.nombre as servicio_nombre,
                    s.precio as servicio_precio,
                    CONCAT(u.nombre, ' ', COALESCE(u.apellidos, '')) as creado_por_nombre
                FROM configuracion_comisiones cc
                INNER JOIN profesionales p ON cc.profesional_id = p.id
                LEFT JOIN servicios s ON cc.servicio_id = s.id
                LEFT JOIN usuarios u ON cc.creado_por = u.id
                WHERE ${whereClause}
                ORDER BY cc.creado_en DESC
            `;

            logger.info('[ConfiguracionComisionesModel.listar] Consultando configuraciones', {
                filtros,
                organizacion_id: organizacionId
            });

            const result = await db.query(query, queryParams);
            return result.rows;
        });
    }

    /**
     * Obtener una configuración por ID
     */
    static async obtenerPorId(configId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    cc.*,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    s.nombre as servicio_nombre,
                    s.precio as servicio_precio
                FROM configuracion_comisiones cc
                INNER JOIN profesionales p ON cc.profesional_id = p.id
                LEFT JOIN servicios s ON cc.servicio_id = s.id
                WHERE cc.id = $1 AND cc.organizacion_id = $2
            `;

            const result = await db.query(query, [configId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Eliminar configuración de comisión
     */
    static async eliminar(configId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[ConfiguracionComisionesModel.eliminar] Eliminando configuración', {
                config_id: configId,
                organizacion_id: organizacionId
            });

            // Verificar que existe
            const existeQuery = await db.query(
                `SELECT id FROM configuracion_comisiones
                 WHERE id = $1 AND organizacion_id = $2`,
                [configId, organizacionId]
            );

            if (existeQuery.rows.length === 0) {
                throw new Error('Configuración no encontrada');
            }

            // Eliminar (el trigger de auditoría registrará automáticamente)
            await db.query(
                `DELETE FROM configuracion_comisiones
                 WHERE id = $1 AND organizacion_id = $2`,
                [configId, organizacionId]
            );

            logger.info('[ConfiguracionComisionesModel.eliminar] Configuración eliminada', {
                config_id: configId
            });

            return { success: true, message: 'Configuración eliminada correctamente' };
        });
    }

    /**
     * Obtener historial de cambios de configuración
     */
    static async obtenerHistorial(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['hcc.organizacion_id = $1'];
            let queryParams = [organizacionId];
            let paramIndex = 2;

            // Filtro por profesional
            if (filtros.profesional_id) {
                whereConditions.push(`hcc.profesional_id = $${paramIndex}`);
                queryParams.push(filtros.profesional_id);
                paramIndex++;
            }

            // Filtro por configuración específica
            if (filtros.configuracion_id) {
                whereConditions.push(`hcc.configuracion_id = $${paramIndex}`);
                queryParams.push(filtros.configuracion_id);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT
                    hcc.*,
                    p.nombre_completo as profesional_nombre,
                    s.nombre as servicio_nombre,
                    CONCAT(u.nombre, ' ', COALESCE(u.apellidos, '')) as modificado_por_nombre
                FROM historial_configuracion_comisiones hcc
                INNER JOIN profesionales p ON hcc.profesional_id = p.id
                LEFT JOIN servicios s ON hcc.servicio_id = s.id
                LEFT JOIN usuarios u ON hcc.modificado_por = u.id
                WHERE ${whereClause}
                ORDER BY hcc.modificado_en DESC
                LIMIT 100
            `;

            const result = await db.query(query, queryParams);
            return result.rows;
        });
    }
}

module.exports = ConfiguracionComisionesModel;
