const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

/**
 * Model para CRUD de configuración de comisiones
 * Maneja las reglas de comisión por profesional/servicio/producto
 *
 * SCOPE DE APLICACIÓN:
 * - servicio: Aplica a servicios/citas
 * - producto: Aplica a productos/ventas POS
 * - ambos: Configuración global que aplica a todo
 *
 * PRIORIDAD:
 * - Servicios: servicio_id específico > global (servicio_id NULL)
 * - Productos: producto_id > categoria_producto_id > global
 */
class ConfiguracionComisionesModel {

    /**
     * Crear o actualizar configuración de comisión
     * Si ya existe (org + prof + scope), actualiza. Si no, crea nueva.
     *
     * @param {Object} data - Datos de configuración
     * @param {number} data.profesional_id - ID del profesional (requerido)
     * @param {string} data.tipo_comision - 'porcentaje' o 'monto_fijo'
     * @param {number} data.valor_comision - Valor de la comisión
     * @param {string} [data.aplica_a='servicio'] - 'servicio', 'producto' o 'ambos'
     * @param {number} [data.servicio_id] - ID del servicio específico
     * @param {number} [data.producto_id] - ID del producto específico
     * @param {number} [data.categoria_producto_id] - ID de la categoría de productos
     * @param {boolean} [data.activo=true] - Estado activo
     * @param {string} [data.notas] - Notas opcionales
     * @param {number} [data.creado_por] - ID del usuario creador
     * @param {number} organizacionId - ID de la organización
     */
    static async crearOActualizar(data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const aplicaA = data.aplica_a || 'servicio';

            logger.info('[ConfiguracionComisionesModel.crearOActualizar] Iniciando', {
                organizacion_id: organizacionId,
                profesional_id: data.profesional_id,
                aplica_a: aplicaA,
                servicio_id: data.servicio_id || null,
                producto_id: data.producto_id || null,
                categoria_producto_id: data.categoria_producto_id || null
            });

            // Validar que el profesional existe y pertenece a la organización
            const profesionalQuery = await db.query(
                `SELECT id FROM profesionales WHERE id = $1 AND organizacion_id = $2`,
                [data.profesional_id, organizacionId]
            );

            if (profesionalQuery.rows.length === 0) {
                throw new Error('Profesional no encontrado o no pertenece a esta organización');
            }

            // Validar servicio si aplica_a = 'servicio' y servicio_id está definido
            if (aplicaA === 'servicio' && data.servicio_id) {
                const servicioQuery = await db.query(
                    `SELECT id FROM servicios WHERE id = $1 AND organizacion_id = $2`,
                    [data.servicio_id, organizacionId]
                );

                if (servicioQuery.rows.length === 0) {
                    throw new Error('Servicio no encontrado o no pertenece a esta organización');
                }
            }

            // Validar producto si aplica_a = 'producto' y producto_id está definido
            // NOTA: No hay FK en SQL debido al orden de init, validamos manualmente
            if (aplicaA === 'producto' && data.producto_id) {
                const productoQuery = await db.query(
                    `SELECT id FROM productos WHERE id = $1 AND organizacion_id = $2`,
                    [data.producto_id, organizacionId]
                );

                if (productoQuery.rows.length === 0) {
                    throw new Error('Producto no encontrado o no pertenece a esta organización');
                }
            }

            // Validar categoría de producto si aplica_a = 'producto' y categoria_producto_id está definido
            if (aplicaA === 'producto' && data.categoria_producto_id) {
                const categoriaQuery = await db.query(
                    `SELECT id FROM categorias_productos WHERE id = $1 AND organizacion_id = $2`,
                    [data.categoria_producto_id, organizacionId]
                );

                if (categoriaQuery.rows.length === 0) {
                    throw new Error('Categoría de producto no encontrada o no pertenece a esta organización');
                }
            }

            // Verificar si ya existe una configuración con el mismo scope
            const existenteQuery = await db.query(
                `SELECT id FROM configuracion_comisiones
                 WHERE organizacion_id = $1
                   AND profesional_id = $2
                   AND servicio_id IS NOT DISTINCT FROM $3
                   AND producto_id IS NOT DISTINCT FROM $4
                   AND categoria_producto_id IS NOT DISTINCT FROM $5`,
                [
                    organizacionId,
                    data.profesional_id,
                    data.servicio_id || null,
                    data.producto_id || null,
                    data.categoria_producto_id || null
                ]
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
                         aplica_a = $5,
                         actualizado_en = NOW()
                     WHERE id = $6
                     RETURNING *`,
                    [
                        data.tipo_comision,
                        data.valor_comision,
                        data.activo !== undefined ? data.activo : true,
                        data.notas || null,
                        aplicaA,
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
                        aplica_a,
                        servicio_id,
                        producto_id,
                        categoria_producto_id,
                        tipo_comision,
                        valor_comision,
                        activo,
                        notas,
                        creado_por
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING *`,
                    [
                        organizacionId,
                        data.profesional_id,
                        aplicaA,
                        data.servicio_id || null,
                        data.producto_id || null,
                        data.categoria_producto_id || null,
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
     *
     * @param {Object} filtros - Filtros de búsqueda
     * @param {number} [filtros.profesional_id] - Filtrar por profesional
     * @param {string} [filtros.aplica_a] - 'servicio', 'producto' o 'ambos'
     * @param {number} [filtros.servicio_id] - Filtrar por servicio específico
     * @param {number} [filtros.producto_id] - Filtrar por producto específico
     * @param {number} [filtros.categoria_producto_id] - Filtrar por categoría de producto
     * @param {boolean} [filtros.activo] - Filtrar por estado activo
     * @param {string} [filtros.tipo_comision] - 'porcentaje' o 'monto_fijo'
     * @param {number} organizacionId - ID de la organización
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

            // Filtro por scope (aplica_a)
            if (filtros.aplica_a) {
                whereConditions.push(`cc.aplica_a = $${paramIndex}`);
                queryParams.push(filtros.aplica_a);
                paramIndex++;
            }

            // Filtro por servicio
            if (filtros.servicio_id) {
                whereConditions.push(`cc.servicio_id = $${paramIndex}`);
                queryParams.push(filtros.servicio_id);
                paramIndex++;
            }

            // Filtro por producto
            if (filtros.producto_id) {
                whereConditions.push(`cc.producto_id = $${paramIndex}`);
                queryParams.push(filtros.producto_id);
                paramIndex++;
            }

            // Filtro por categoría de producto
            if (filtros.categoria_producto_id) {
                whereConditions.push(`cc.categoria_producto_id = $${paramIndex}`);
                queryParams.push(filtros.categoria_producto_id);
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
                    prod.nombre as producto_nombre,
                    prod.precio_venta as producto_precio,
                    cat.nombre as categoria_producto_nombre,
                    CONCAT(u.nombre, ' ', COALESCE(u.apellidos, '')) as creado_por_nombre
                FROM configuracion_comisiones cc
                INNER JOIN profesionales p ON cc.profesional_id = p.id
                LEFT JOIN servicios s ON cc.servicio_id = s.id
                LEFT JOIN productos prod ON cc.producto_id = prod.id
                LEFT JOIN categorias_productos cat ON cc.categoria_producto_id = cat.id
                LEFT JOIN usuarios u ON cc.creado_por = u.id
                WHERE ${whereClause}
                ORDER BY cc.aplica_a ASC, cc.creado_en DESC
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
                    s.precio as servicio_precio,
                    prod.nombre as producto_nombre,
                    prod.precio_venta as producto_precio,
                    cat.nombre as categoria_producto_nombre
                FROM configuracion_comisiones cc
                INNER JOIN profesionales p ON cc.profesional_id = p.id
                LEFT JOIN servicios s ON cc.servicio_id = s.id
                LEFT JOIN productos prod ON cc.producto_id = prod.id
                LEFT JOIN categorias_productos cat ON cc.categoria_producto_id = cat.id
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

            // Filtro por scope (aplica_a)
            if (filtros.aplica_a) {
                whereConditions.push(`hcc.aplica_a = $${paramIndex}`);
                queryParams.push(filtros.aplica_a);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT
                    hcc.*,
                    p.nombre_completo as profesional_nombre,
                    s.nombre as servicio_nombre,
                    prod.nombre as producto_nombre,
                    cat.nombre as categoria_producto_nombre,
                    CONCAT(u.nombre, ' ', COALESCE(u.apellidos, '')) as modificado_por_nombre
                FROM historial_configuracion_comisiones hcc
                INNER JOIN profesionales p ON hcc.profesional_id = p.id
                LEFT JOIN servicios s ON hcc.servicio_id = s.id
                LEFT JOIN productos prod ON hcc.producto_id = prod.id
                LEFT JOIN categorias_productos cat ON hcc.categoria_producto_id = cat.id
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
