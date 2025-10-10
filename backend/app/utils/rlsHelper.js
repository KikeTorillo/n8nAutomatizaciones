/**
 * @fileoverview Helper para Row Level Security (RLS) Multi-Tenant
 * @description Funciones reutilizables para configurar contexto RLS en PostgreSQL
 * @version 1.0.0
 */

const logger = require('./logger');

class RLSHelper {

    /**
     * Configurar contexto RLS para PostgreSQL
     * @param {Object} db - Cliente de base de datos
     * @param {number} userId - ID del usuario actual
     * @param {string} userRole - Rol del usuario (admin, propietario, empleado, cliente)
     * @param {number} organizacionId - ID de la organización
     */
    static async configurarContexto(db, userId, userRole, organizacionId = null) {
        try {
            await db.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId.toString()]);
            await db.query('SELECT set_config($1, $2, true)', ['app.current_user_role', userRole]);

            if (organizacionId) {
                await db.query('SELECT set_config($1, $2, true)', ['app.current_tenant_id', organizacionId.toString()]);
            }
        } catch (error) {
            logger.warn('Error configurando contexto RLS', {
                error: error.message,
                userId,
                userRole,
                organizacionId
            });
        }
    }

    /**
     * Ejecutar query con contexto RLS específico
     * @param {Object} db - Cliente de base de datos
     * @param {Object} context - Configuración del contexto { role, bypass, userId, tenantId }
     * @param {Function} callback - Función a ejecutar con el contexto configurado
     * @returns {Promise} Resultado del callback
     */
    static async withContext(db, context = {}, callback) {
        const { role = null, bypass = false, userId = null, tenantId = null } = context;

        try {
            if (role) {
                await db.query('SELECT set_config($1, $2, false)', ['app.current_user_role', role]);
            }
            if (bypass) {
                // ✅ FIX: Usar set_config en lugar de SET para que sea local a la transacción
                await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'true']);
            }
            if (userId) {
                await db.query('SELECT set_config($1, $2, false)', ['app.current_user_id', userId.toString()]);
            }
            if (tenantId) {
                await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', tenantId.toString()]);
            }

            return await callback(db);

        } finally {
            // CRÍTICO: Limpiar TODAS las variables RLS configuradas para evitar contaminación del pool
            try {
                if (bypass) {
                    // ✅ FIX: Usar set_config en lugar de SET (aunque ya no es necesario porque set_config es local)
                    await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'false']);
                }
                if (role) {
                    await db.query("SELECT set_config('app.current_user_role', '', false)");
                }
                if (userId) {
                    await db.query("SELECT set_config('app.current_user_id', '', false)");
                }
                if (tenantId) {
                    await db.query("SELECT set_config('app.current_tenant_id', '', false)");
                }
            } catch (resetError) {
                logger.warn('Error resetting RLS variables:', resetError.message);
            }
        }
    }

    /**
     * Registrar evento de auditoría en el sistema
     * @param {Object} db - Cliente de base de datos
     * @param {Object} eventoData - Datos del evento
     * @param {number} eventoData.organizacion_id - ID de la organización
     * @param {string} eventoData.evento_tipo - Tipo de evento
     * @param {string} eventoData.entidad_tipo - Tipo de entidad afectada
     * @param {number} eventoData.entidad_id - ID de la entidad
     * @param {string} eventoData.descripcion - Descripción del evento
     * @param {Object} eventoData.metadatos - Metadatos adicionales
     * @param {number} eventoData.usuario_id - ID del usuario que generó el evento
     */
    static async registrarEvento(db, eventoData) {
        try {
            const query = `
                INSERT INTO eventos_sistema (
                    organizacion_id, evento_tipo, entidad_tipo, entidad_id,
                    descripcion, metadata, usuario_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;

            await db.query(query, [
                eventoData.organizacion_id,
                eventoData.evento_tipo,
                eventoData.entidad_tipo,
                eventoData.entidad_id,
                eventoData.descripcion,
                JSON.stringify(eventoData.metadatos),
                eventoData.usuario_id
            ]);
        } catch (error) {
            logger.warn('No se pudo registrar evento en auditoría:', error.message);
        }
    }

    /**
     * Ejecutar operación con bypass RLS temporal
     * @param {Object} db - Cliente de base de datos
     * @param {Function} callback - Función a ejecutar con bypass activo
     * @returns {Promise} Resultado del callback
     */
    static async withBypass(db, callback) {
        return this.withContext(db, { bypass: true }, callback);
    }

    /**
     * Ejecutar operación con rol específico (sin bypass)
     * @param {Object} db - Cliente de base de datos
     * @param {string} role - Rol a usar (login_context, super_admin, etc)
     * @param {Function} callback - Función a ejecutar con el rol
     * @returns {Promise} Resultado del callback
     */
    static async withRole(db, role, callback) {
        return this.withContext(db, { role }, callback);
    }

    /**
     * Ejecutar operación con self-access (acceso del propio usuario)
     * @param {Object} db - Cliente de base de datos
     * @param {number} userId - ID del usuario
     * @param {Function} callback - Función a ejecutar
     * @returns {Promise} Resultado del callback
     */
    static async withSelfAccess(db, userId, callback) {
        return this.withContext(db, { userId }, callback);
    }
}

module.exports = RLSHelper;
