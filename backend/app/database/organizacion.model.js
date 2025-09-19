/**
 * Modelo de Organizaciones (Tenants)
 * Entidad principal del sistema multi-tenant
 * Cada organización es un tenant independiente con aislamiento completo de datos
 */

const { getDb } = require('../config/database');
const logger = require('../utils/logger');

class OrganizacionModel {
    /**
     * Crear una nueva organización
     * @param {Object} organizacionData - Datos de la organización
     * @param {string} organizacionData.nombre_comercial - Nombre comercial de la organización
     * @param {string} organizacionData.configuracion_industria - Configuración de industria (barberia, spa, consultorio_medico, etc.)
     * @param {string} organizacionData.email_admin - Email del administrador
     * @param {string} [organizacionData.telefono] - Teléfono de contacto
     * @returns {Promise<Object>} Organización creada
     */
    static async crear(organizacionData) {
        const client = await getDb();

        try {
            // TEST: Verificar si podemos hacer SELECT básico
            const testQuery = await client.query("SELECT current_user, current_database()");
            logger.info('Usuario BD actual:', testQuery.rows[0]);

            // Verificar configuraciones RLS antes del bypass
            const rlsStatus = await client.query("SHOW row_security");
            logger.info('RLS Status antes:', rlsStatus.rows[0]);

            // Intentar establecer configuraciones para bypass
            await client.query("SET app.current_user_role = 'super_admin'");
            await client.query("SET app.bypass_rls = 'true'");

            // Verificar que las configuraciones se aplicaron
            const checkRole = await client.query("SELECT current_setting('app.current_user_role', true) as role");
            const checkBypass = await client.query("SELECT current_setting('app.bypass_rls', true) as bypass");
            logger.info('Configuraciones aplicadas:', {
                role: checkRole.rows[0].role,
                bypass: checkBypass.rows[0].bypass
            });

            // Simplificar INSERT para debugging
            const query = `
                INSERT INTO organizaciones (
                    nombre_comercial, tipo_industria, email_admin, codigo_tenant, slug
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    id, nombre_comercial, tipo_industria, email_admin, codigo_tenant, slug
            `;

            // Generar código único para el tenant
            const codigoTenant = `org_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const slug = organizacionData.nombre_comercial.toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .substring(0, 50);

            const values = [
                organizacionData.nombre_comercial,
                organizacionData.configuracion_industria, // tipo_industria ENUM
                organizacionData.email_admin,
                codigoTenant,
                slug
            ];

            logger.info('Intentando INSERT con valores:', values);
            const result = await client.query(query, values);

            logger.info('Organización creada exitosamente', {
                organizacion_id: result.rows[0].id,
                nombre_comercial: result.rows[0].nombre_comercial,
                tipo_industria: result.rows[0].tipo_industria
            });

            return result.rows[0];

        } catch (error) {
            logger.error('Error al crear organización:', error);
            throw new Error(`Error al crear organización: ${error.message}`);
        } finally {
            // Resetear configuraciones
            try {
                await client.query("SET row_security = on");
                await client.query("SET app.bypass_rls = 'false'");
            } catch (resetError) {
                // Log pero no fallar por esto
                console.warn('Error resetting RLS bypass:', resetError.message);
            }
            client.release();
        }
    }

    /**
     * Obtener organización por ID
     * @param {number} id - ID de la organización
     * @returns {Promise<Object|null>} Organización encontrada o null
     */
    static async obtenerPorId(id) {
        const client = await getDb();

        try {
            // Configurar bypass RLS para super admin
            await client.query("SET app.current_user_role = 'super_admin'");
            await client.query("SET app.bypass_rls = 'true'");

            const query = `
                SELECT
                    id, codigo_tenant, slug, nombre_comercial, tipo_industria,
                    email_admin, telefono, plan_actual, activo, suspendido,
                    fecha_registro, creado_en, actualizado_en
                FROM organizaciones
                WHERE id = $1 AND activo = TRUE
            `;

            const result = await client.query(query, [id]);
            return result.rows[0] || null;

        } catch (error) {
            logger.error('Error al obtener organización por ID:', error);
            throw new Error(`Error al obtener organización: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Obtener organización por email
     * @param {string} email - Email de la organización
     * @returns {Promise<Object|null>} Organización encontrada o null
     */
    static async obtenerPorEmail(email) {
        const client = await getDb();

        try {
            const query = `
                SELECT
                    id, nombre_comercial, tipo_industria, email_admin, telefono,
                    configuracion_industria, codigo_tenant, slug, fecha_registro
                FROM organizaciones
                WHERE email_admin = $1
            `;

            const result = await client.query(query, [email]);
            return result.rows[0] || null;

        } catch (error) {
            logger.error('Error al obtener organización por email:', error);
            throw new Error(`Error al obtener organización: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Listar todas las organizaciones con paginación
     * @param {Object} options - Opciones de listado
     * @param {number} [options.page=1] - Página actual
     * @param {number} [options.limit=10] - Límite por página
     * @param {string} [options.tipo_industria] - Filtrar por tipo de industria
     * @param {boolean} [options.activo=true] - Filtrar por estado activo
     * @returns {Promise<Object>} Lista de organizaciones con metadatos de paginación
     */
    static async listar(options = {}) {
        const client = await getDb();

        try {
            // Configurar bypass RLS para super admin
            await client.query("SET app.current_user_role = 'super_admin'");
            await client.query("SET app.bypass_rls = 'true'");

            const { page = 1, limit = 10, tipo_industria, activo = true } = options;
            const offset = (page - 1) * limit;

            let whereConditions = ['activo = $1'];
            let values = [activo];
            let paramCounter = 2;

            if (tipo_industria) {
                whereConditions.push(`tipo_industria = $${paramCounter}`);
                values.push(tipo_industria);
                paramCounter++;
            }

            const whereClause = whereConditions.join(' AND ');

            // Query para obtener el total de registros
            const countQuery = `
                SELECT COUNT(*) as total
                FROM organizaciones
                WHERE ${whereClause}
            `;

            // Query para obtener los registros paginados
            const dataQuery = `
                SELECT
                    id, codigo_tenant, slug, nombre_comercial, tipo_industria,
                    email_admin, telefono, plan_actual, activo, suspendido,
                    fecha_registro, creado_en, actualizado_en
                FROM organizaciones
                WHERE ${whereClause}
                ORDER BY creado_en DESC
                LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
            `;

            const countResult = await client.query(countQuery, values);
            const dataResult = await client.query(dataQuery, [...values, limit, offset]);

            const total = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(total / limit);

            return {
                data: dataResult.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };

        } catch (error) {
            logger.error('Error al listar organizaciones:', error);
            throw new Error(`Error al listar organizaciones: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Actualizar organización
     * @param {number} id - ID de la organización
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<Object|null>} Organización actualizada o null
     */
    static async actualizar(id, updateData) {
        const client = await getDb();

        try {
            // Configurar bypass RLS para super admin
            await client.query("SET app.current_user_role = 'super_admin'");
            await client.query("SET app.bypass_rls = 'true'");

            const allowedFields = ['nombre_comercial', 'tipo_industria', 'email_admin', 'telefono'];
            const updateFields = [];
            const values = [];
            let paramCounter = 1;

            // Construir query dinámicamente basado en campos permitidos
            for (const [key, value] of Object.entries(updateData)) {
                if (allowedFields.includes(key) && value !== undefined) {
                    updateFields.push(`${key} = $${paramCounter}`);
                    values.push(value);
                    paramCounter++;
                }
            }

            if (updateFields.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }

            updateFields.push(`actualizado_en = NOW()`);
            values.push(id);

            const query = `
                UPDATE organizaciones
                SET ${updateFields.join(', ')}
                WHERE id = $${paramCounter} AND activo = TRUE
                RETURNING
                    id, codigo_tenant, slug, nombre_comercial,
                    tipo_industria, email_admin, telefono,
                    plan_actual, activo, suspendido,
                    fecha_registro, creado_en, actualizado_en
            `;

            const result = await client.query(query, values);

            if (result.rows.length > 0) {
                logger.info('Organización actualizada exitosamente', {
                    organizacion_id: result.rows[0].id,
                    campos_actualizados: Object.keys(updateData)
                });
            }

            return result.rows[0] || null;

        } catch (error) {
            logger.error('Error al actualizar organización:', error);
            throw new Error(`Error al actualizar organización: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Desactivar organización (soft delete)
     * @param {number} id - ID de la organización
     * @returns {Promise<boolean>} true si se desactivó exitosamente
     */
    static async desactivar(id) {
        const client = await getDb();

        try {
            // Configurar bypass RLS para super admin
            await client.query("SET app.current_user_role = 'super_admin'");
            await client.query("SET app.bypass_rls = 'true'");

            const query = `
                UPDATE organizaciones
                SET activo = FALSE, actualizado_en = NOW()
                WHERE id = $1 AND activo = TRUE
                RETURNING id
            `;

            const result = await client.query(query, [id]);

            if (result.rows.length > 0) {
                logger.info('Organización desactivada exitosamente', {
                    organizacion_id: result.rows[0].id
                });
                return true;
            }

            return false;

        } catch (error) {
            logger.error('Error al desactivar organización:', error);
            throw new Error(`Error al desactivar organización: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Verificar límites de la organización
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Información sobre límites y uso actual
     */
    static async verificarLimites(organizacionId) {
        const client = await getDb();

        try {
            const query = `
                SELECT
                    o.limite_citas_mes,
                    o.limite_profesionales,
                    o.limite_servicios,
                    COUNT(DISTINCT c.id) FILTER (
                        WHERE c.fecha_cita >= date_trunc('month', CURRENT_DATE)
                        AND c.fecha_cita < date_trunc('month', CURRENT_DATE) + interval '1 month'
                    ) as citas_mes_actual,
                    COUNT(DISTINCT p.id) as profesionales_activos,
                    COUNT(DISTINCT s.id) as servicios_activos
                FROM organizaciones o
                LEFT JOIN citas c ON o.id = c.organizacion_id AND c.estado != 'cancelada'
                LEFT JOIN profesionales p ON o.id = p.organizacion_id AND p.estado = 'activo'
                LEFT JOIN servicios s ON o.id = s.organizacion_id AND s.estado = 'activo'
                WHERE o.id = $1 AND o.activo = TRUE
                GROUP BY o.id, o.limite_citas_mes, o.limite_profesionales, o.limite_servicios
            `;

            const result = await client.query(query, [organizacionId]);

            if (result.rows.length === 0) {
                throw new Error('Organización no encontrada');
            }

            const limites = result.rows[0];

            return {
                citas: {
                    limite: limites.limite_citas_mes,
                    usado: parseInt(limites.citas_mes_actual),
                    disponible: limites.limite_citas_mes - parseInt(limites.citas_mes_actual),
                    porcentaje_uso: Math.round((parseInt(limites.citas_mes_actual) / limites.limite_citas_mes) * 100)
                },
                profesionales: {
                    limite: limites.limite_profesionales,
                    usado: parseInt(limites.profesionales_activos),
                    disponible: limites.limite_profesionales - parseInt(limites.profesionales_activos),
                    porcentaje_uso: Math.round((parseInt(limites.profesionales_activos) / limites.limite_profesionales) * 100)
                },
                servicios: {
                    limite: limites.limite_servicios,
                    usado: parseInt(limites.servicios_activos),
                    disponible: limites.limite_servicios - parseInt(limites.servicios_activos),
                    porcentaje_uso: Math.round((parseInt(limites.servicios_activos) / limites.limite_servicios) * 100)
                }
            };

        } catch (error) {
            logger.error('Error al verificar límites de organización:', error);
            throw new Error(`Error al verificar límites: ${error.message}`);
        } finally {
            client.release();
        }
    }
}

module.exports = OrganizacionModel;