/**
 * @fileoverview Helper para Row Level Security (RLS) - Casos Específicos
 * @description Funciones de BAJO NIVEL para configurar contexto RLS específico
 * @version 2.0.0
 *
 * ⚠️ IMPORTANTE: SEPARACIÓN DE RESPONSABILIDADES
 *
 * Este helper es para CASOS ESPECÍFICOS donde necesitas:
 * - Configurar current_user_id o current_user_role
 * - Operaciones de login/autenticación (withRole('login_context'))
 * - Acceso propio del usuario (withSelfAccess)
 * - Registrar eventos de auditoría (registrarEvento)
 * - Control manual fino de variables RLS
 *
 * ✅ USAR RLSHelper CUANDO:
 * - Necesitas configurar current_user_id o current_user_role
 * - Login/autenticación con withRole('login_context')
 * - Ya tienes una conexión db y transacción manual compleja
 * - Necesitas registrar eventos de auditoría
 *
 * ❌ NO USAR RLSHelper PARA:
 * - Operaciones CRUD típicas de modelos → Usar RLSContextManager
 * - Queries simples con aislamiento por organizacion_id → Usar RLSContextManager
 * - Bypass RLS con gestión automática → Usar RLSContextManager.withBypass()
 *
 * 📖 Ver también: RLSContextManager (gestión completa de conexiones + transacciones)
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
     * @param {Object} context - Configuración del contexto { role, bypass, userId, tenantId, loginEmail }
     * @param {Function} callback - Función a ejecutar con el contexto configurado
     * @returns {Promise} Resultado del callback
     */
    static async withContext(db, context = {}, callback) {
        const { role = null, bypass = false, userId = null, tenantId = null, loginEmail = null } = context;

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
            if (loginEmail) {
                // Configurar email de login para políticas RLS de autenticación
                await db.query('SELECT set_config($1, $2, false)', ['app.login_email', loginEmail]);
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
                if (loginEmail) {
                    await db.query("SELECT set_config('app.login_email', '', false)");
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
     *
     * ⚠️ DEPRECATED: Usar RLSContextManager.withBypass() en su lugar
     *
     * RLSContextManager maneja conexiones y transacciones automáticamente,
     * mientras que este método requiere conexión ya adquirida.
     *
     * @deprecated Usar RLSContextManager.withBypass() para nuevos casos
     * @param {Object} db - Cliente de base de datos (ya adquirido)
     * @param {Function} callback - Función a ejecutar con bypass activo
     * @returns {Promise} Resultado del callback
     *
     * @example
     * // ❌ Patrón viejo (usar solo si ya tienes db y transacción manual)
     * const db = await getDb();
     * try {
     *     await db.query('BEGIN');
     *     const result = await RLSHelper.withBypass(db, async (db) => {
     *         return await db.query('SELECT ...');
     *     });
     *     await db.query('COMMIT');
     * } finally {
     *     db.release();
     * }
     *
     * // ✅ Patrón nuevo (preferido)
     * const result = await RLSContextManager.withBypass(async (db) => {
     *     return await db.query('SELECT ...');
     * }, { useTransaction: true });
     */
    static async withBypass(db, callback) {
        console.warn('[RLSHelper] withBypass() está deprecated. Considerar usar RLSContextManager.withBypass()');
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

    /**
     * Ejecutar operación de login con email configurado en RLS
     * Permite que políticas RLS usen: current_setting('app.login_email') = email
     *
     * @param {Object} db - Cliente de base de datos
     * @param {string} email - Email del usuario intentando autenticarse
     * @param {Function} callback - Función a ejecutar con contexto de login
     * @returns {Promise} Resultado del callback
     *
     * @example
     * const usuario = await RLSHelper.withLoginEmail(db, 'user@example.com', async (db) => {
     *     const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
     *     return result.rows[0];
     * });
     */
    static async withLoginEmail(db, email, callback) {
        return this.withContext(db, { loginEmail: email }, callback);
    }
}

module.exports = RLSHelper;
