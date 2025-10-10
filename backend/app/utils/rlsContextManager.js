/**
 * @fileoverview RLS Context Manager - Helper Centralizado para Row Level Security
 * @description Maneja automáticamente la configuración de RLS, transacciones y pool de conexiones
 * @version 2.0.0
 * @author Backend Team
 *
 * ARQUITECTURA:
 * - Adquiere/libera conexiones automáticamente
 * - Configura set_config apropiadamente (true para transacciones, false para queries simples)
 * - Maneja BEGIN/COMMIT/ROLLBACK automáticamente
 * - Garantiza liberación de conexiones en TODOS los casos
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

            // 3. Configurar contexto RLS
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

            // 4. Ejecutar callback del usuario
            const result = await callback(db);

            // 5. Commit SI hay transacción
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
            // 6. Rollback SI hay transacción activa
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
            // 7. Liberar conexión SIEMPRE (incluso si hay error)
            if (db) {
                // Si NO usamos transacción y NO hay bypass, limpiar tenant_id de sesión
                // para evitar contaminación del pool
                if (!useTransaction && !bypass) {
                    try {
                        await db.query('SELECT set_config($1, $2, false)',
                            ['app.current_tenant_id', '']);

                        logger.debug('[RLSContextManager] RLS limpiado de sesión', {
                            processId: db.processID
                        });
                    } catch (cleanError) {
                        logger.warn('[RLSContextManager] Error limpiando RLS', {
                            processId: db.processID,
                            error: cleanError.message
                        });
                    }
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
