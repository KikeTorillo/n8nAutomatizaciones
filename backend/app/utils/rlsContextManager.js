/**
 * @fileoverview RLS Context Manager - Gestión Completa de Row Level Security
 * @description Maneja automáticamente RLS, transacciones, conexiones y multi-tenancy
 * @version 2.0.0
 * @author Backend Team
 *
 * ⚠️ IMPORTANTE: SEPARACIÓN DE RESPONSABILIDADES
 *
 * Este manager es para GESTIÓN COMPLETA de operaciones con RLS:
 * - Adquiere/libera conexiones automáticamente del pool
 * - Maneja transacciones (BEGIN/COMMIT/ROLLBACK)
 * - Configura current_tenant_id (multi-tenancy básico)
 * - Limpia variables RLS antes/después
 * - Garantiza cleanup en TODOS los casos (incluso errores)
 *
 * ✅ USAR RLSContextManager PARA:
 * - Operaciones CRUD típicas de modelos (80% de casos)
 * - Queries con aislamiento por organizacion_id
 * - Bypass RLS con gestión automática de conexiones
 * - Patrón limpio sin manejo manual de conexiones
 *
 * ❌ NO USAR RLSContextManager PARA:
 * - Configurar current_user_id o current_user_role → Usar RLSHelper
 * - Login/autenticación → Usar RLSHelper.withRole('login_context')
 * - Registrar eventos de auditoría → Usar RLSHelper.registrarEvento()
 * - Transacciones muy complejas con múltiples contextos → Usar RLSHelper.withContext()
 *
 * ARQUITECTURA:
 * - set_config(..., true) para transacciones (local)
 * - set_config(..., false) para queries simples (sesión)
 * - Limpia variables antes de configurar (previene contaminación del pool)
 *
 * 📖 Ver también: RLSHelper (control manual fino para casos específicos)
 */

const { getDb } = require('../config/database');
const logger = require('./logger');

class RLSContextManager {

    /**
     * Ejecutar operación con contexto RLS configurado
     * @param {number} organizacionId - ID de la organización (tenant)
     * @param {Function} callback - Función async que recibe (db) y retorna el resultado
     * @param {Object} options - Opciones de configuración
     * @param {boolean} options.useTransaction - Si true, envuelve en BEGIN/COMMIT
     * @param {boolean} options.bypass - Si true, bypasea RLS (para operaciones admin)
     * @returns {Promise<any>} Resultado del callback
     *
     * @example
     * // Query simple (sin transacción)
     * const result = await RLSContextManager.withRLS(orgId, async (db) => {
     *     return await db.query('SELECT * FROM clientes WHERE id = $1', [clienteId]);
     * }, { useTransaction: false });
     *
     * @example
     * // Operación compleja (con transacción)
     * const result = await RLSContextManager.withRLS(orgId, async (db) => {
     *     await db.query('INSERT INTO clientes ...');
     *     await db.query('INSERT INTO citas ...');
     *     return result;
     * }, { useTransaction: true });
     */
    static async withRLS(organizacionId, callback, options = {}) {
        const { useTransaction = false, bypass = false } = options;

        // Validar organizacionId
        if (!bypass && (!organizacionId || isNaN(parseInt(organizacionId)))) {
            throw new Error(`organizacionId inválido: ${organizacionId}`);
        }

        let db = null;
        let transactionStarted = false;

        try {
            // 1. Adquirir conexión del pool
            db = await getDb();

            logger.debug('[RLSContextManager] Conexión adquirida', {
                processId: db.processID,
                organizacionId,
                useTransaction,
                bypass
            });

            // 2. Iniciar transacción SI es necesario
            if (useTransaction) {
                await db.query('BEGIN');
                transactionStarted = true;

                logger.debug('[RLSContextManager] Transacción iniciada', {
                    processId: db.processID,
                    organizacionId
                });
            }

            // 3. Limpiar TODAS las variables RLS para evitar contaminación del pool
            // CRÍTICO: Esto garantiza que conexiones reutilizadas empiecen limpias
            await db.query("SELECT set_config('app.current_user_id', '', false)");
            await db.query("SELECT set_config('app.current_user_role', '', false)");
            await db.query("SELECT set_config('app.bypass_rls', 'false', false)");
            await db.query("SELECT set_config('app.current_tenant_id', '', false)");

            // 4. Configurar contexto RLS específico
            if (bypass) {
                // Bypass RLS para operaciones administrativas
                await db.query('SELECT set_config($1, $2, $3)',
                    ['app.bypass_rls', 'true', useTransaction]);

                logger.debug('[RLSContextManager] RLS bypaseado', {
                    processId: db.processID
                });
            } else {
                // Configurar tenant_id para multi-tenancy
                // CRÍTICO: usar true (boolean) si hay transacción (local), false si no (sesión)
                await db.query('SELECT set_config($1, $2, $3)',
                    ['app.current_tenant_id', organizacionId.toString(), useTransaction]);

                logger.debug('[RLSContextManager] RLS configurado', {
                    processId: db.processID,
                    organizacionId,
                    isLocal: useTransaction
                });
            }

            // 5. Ejecutar callback del usuario
            const result = await callback(db);

            // 6. Commit SI hay transacción
            if (transactionStarted) {
                await db.query('COMMIT');
                transactionStarted = false; // Marcar como completada

                logger.debug('[RLSContextManager] Transacción commit exitoso', {
                    processId: db.processID,
                    organizacionId
                });
            }

            return result;

        } catch (error) {
            // 7. Rollback SI hay transacción activa
            if (transactionStarted && db) {
                try {
                    await db.query('ROLLBACK');
                    logger.warn('[RLSContextManager] Transacción rollback ejecutado', {
                        processId: db?.processID,
                        organizacionId,
                        error: error.message
                    });
                } catch (rollbackError) {
                    logger.error('[RLSContextManager] Error en rollback', {
                        processId: db?.processID,
                        organizacionId,
                        rollbackError: rollbackError.message,
                        originalError: error.message
                    });
                }
            }

            // Re-lanzar error original
            throw error;

        } finally {
            // 8. Liberar conexión SIEMPRE (incluso si hay error)
            if (db) {
                // FIX v2.1: Limpiar TODAS las variables RLS antes de liberar
                // CRÍTICO: Previene contaminación del pool, especialmente con bypass
                try {
                    await db.query(`SELECT
                        set_config('app.current_tenant_id', '', false),
                        set_config('app.bypass_rls', 'false', false),
                        set_config('app.current_user_id', '', false),
                        set_config('app.current_user_role', '', false)
                    `);

                    logger.debug('[RLSContextManager] Variables RLS limpiadas', {
                        processId: db.processID
                    });
                } catch (cleanError) {
                    logger.warn('[RLSContextManager] Error limpiando RLS', {
                        processId: db.processID,
                        error: cleanError.message
                    });
                }

                db.release();

                logger.debug('[RLSContextManager] Conexión liberada', {
                    processId: db.processID,
                    organizacionId
                });
            }
        }
    }

    /**
     * Alias conveniente: Query simple sin transacción
     * @param {number} organizacionId - ID de la organización
     * @param {Function} callback - Función que recibe (db)
     * @returns {Promise<any>}
     *
     * @example
     * const cliente = await RLSContextManager.query(orgId, async (db) => {
     *     const result = await db.query('SELECT * FROM clientes WHERE id = $1', [id]);
     *     return result.rows[0];
     * });
     */
    static async query(organizacionId, callback) {
        return await this.withRLS(organizacionId, callback, { useTransaction: false });
    }

    /**
     * Alias conveniente: Operación con transacción
     * @param {number} organizacionId - ID de la organización
     * @param {Function} callback - Función que recibe (db)
     * @returns {Promise<any>}
     *
     * @example
     * const result = await RLSContextManager.transaction(orgId, async (db) => {
     *     await db.query('INSERT INTO clientes ...');
     *     await db.query('UPDATE metricas ...');
     *     return { success: true };
     * });
     */
    static async transaction(organizacionId, callback) {
        return await this.withRLS(organizacionId, callback, { useTransaction: true });
    }

    /**
     * Ejecutar operación con RLS bypaseado (para operaciones administrativas)
     * @param {Function} callback - Función que recibe (db)
     * @param {Object} options - Opciones adicionales
     * @param {boolean} options.useTransaction - Si usar transacción
     * @returns {Promise<any>}
     *
     * @example
     * const allOrgs = await RLSContextManager.withBypass(async (db) => {
     *     const result = await db.query('SELECT * FROM organizaciones');
     *     return result.rows;
     * });
     */
    static async withBypass(callback, options = {}) {
        return await this.withRLS(null, callback, { ...options, bypass: true });
    }

    /**
     * Ejecutar transacción con bypass de RLS
     * ✅ FIX v2.1: Nuevo método para evitar BEGIN/COMMIT manual dentro de withBypass
     *
     * @param {Function} callback - Función que recibe (db)
     * @returns {Promise<any>}
     *
     * @example
     * await RLSContextManager.transactionWithBypass(async (db) => {
     *     await db.query('UPDATE subscripciones SET estado = $1 WHERE org_id = $2', ['activa', orgId]);
     *     await db.query('INSERT INTO historial ...');
     *     // COMMIT automático al final, ROLLBACK automático si hay error
     * });
     */
    static async transactionWithBypass(callback) {
        return await this.withBypass(callback, { useTransaction: true });
    }

    /**
     * Ejecutar múltiples operaciones en la MISMA transacción con el MISMO contexto RLS
     * Útil cuando se llama a múltiples métodos del modelo que necesitan compartir transacción
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Function} callback - Función que recibe (db)
     * @returns {Promise<any>}
     *
     * @example
     * await RLSContextManager.transaction(orgId, async (db) => {
     *     // Estos métodos reciben 'db' y NO llaman withRLS internamente
     *     await ClienteModel._insertRaw(db, clienteData);
     *     await CitaModel._insertRaw(db, citaData);
     * });
     */
    static async shared(organizacionId, callback) {
        // Exactamente igual que transaction, pero documenta la intención de compartir conexión
        return await this.transaction(organizacionId, callback);
    }
}

module.exports = RLSContextManager;
