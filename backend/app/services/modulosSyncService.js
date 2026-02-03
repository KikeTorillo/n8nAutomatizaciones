/**
 * ====================================================================
 * MODULOS SYNC SERVICE
 * ====================================================================
 * Servicio centralizado para sincronización de módulos entre planes
 * y organizaciones. Única fuente de verdad para la lógica de:
 * plan.modulos_habilitados → organizacion.modulos_activos
 *
 * @module services/modulosSyncService
 * @author Nexo Team
 * @version 1.0.0
 * @date Febrero 2026
 */

const RLSContextManager = require('../utils/rlsContextManager');
const ModulesCache = require('../core/ModulesCache');
const logger = require('../utils/logger');
const { NEXO_TEAM_ORG_ID } = require('../config/constants');

class ModulosSyncService {

    /**
     * Construye objeto de módulos activos desde array de habilitados
     * Función pura sin side effects - única fuente de verdad para el mapeo
     *
     * LÓGICA DE MERGE INTELIGENTE (cuando se pasan módulos actuales):
     * - Módulos que SALEN del plan → No se incluyen (quedan fuera)
     * - Módulos que PERMANECEN en el plan → Mantener estado actual (respeta preferencia usuario)
     * - Módulos NUEVOS en el plan → Activar por defecto (usuario puede desactivar después)
     *
     * @param {string[]} modulosHabilitados - Ej: ["inventario", "pos"]
     * @param {Object|null} modulosActivosActuales - Estado actual de la org, ej: { core: true, inventario: false }
     * @returns {Object} - Ej: { core: true, inventario: true, pos: true }
     */
    static construirModulosActivos(modulosHabilitados, modulosActivosActuales = null) {
        const modulosActivos = { core: true }; // Core siempre activo

        (modulosHabilitados || []).forEach(modulo => {
            if (modulosActivosActuales && modulosActivosActuales[modulo] !== undefined) {
                // Módulo existía antes - mantener preferencia del usuario
                modulosActivos[modulo] = modulosActivosActuales[modulo];
            } else {
                // Módulo nuevo o sin preferencia previa - activar por defecto
                modulosActivos[modulo] = true;
            }
        });

        return modulosActivos;
    }

    /**
     * Sincroniza módulos de UNA organización basándose en su suscripción activa
     *
     * @param {number} orgId - ID de la organización a sincronizar
     * @returns {Promise<Object>} - Resultado de sincronización
     */
    static async sincronizarOrganizacion(orgId) {
        return await RLSContextManager.withBypass(async (db) => {
            // 1. Buscar suscripción activa de la organización en Nexo Team
            const suscQuery = `
                SELECT s.id, s.plan_id, s.estado,
                       p.codigo as plan_codigo, p.nombre as plan_nombre, p.modulos_habilitados,
                       c.organizacion_vinculada_id
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                INNER JOIN clientes c ON s.cliente_id = c.id
                WHERE c.organizacion_vinculada_id = $1
                  AND s.organizacion_id = $2
                  AND s.estado IN ('activa', 'trial', 'pendiente_pago', 'grace_period')
                ORDER BY
                    CASE s.estado
                        WHEN 'activa' THEN 1
                        WHEN 'trial' THEN 2
                        WHEN 'grace_period' THEN 3
                        ELSE 4
                    END
                LIMIT 1
            `;
            const suscResult = await db.query(suscQuery, [orgId, NEXO_TEAM_ORG_ID]);
            const suscripcion = suscResult.rows[0];

            if (!suscripcion) {
                return {
                    success: false,
                    mensaje: 'No se encontró suscripción activa para esta organización',
                    organizacion_id: orgId
                };
            }

            // 2. Obtener módulos activos actuales de la organización (para respetar preferencias)
            const orgQuery = `SELECT modulos_activos FROM organizaciones WHERE id = $1`;
            const orgResult = await db.query(orgQuery, [orgId]);
            const modulosActivosActuales = orgResult.rows[0]?.modulos_activos || null;

            // 3. Construir módulos activos con merge inteligente (respeta preferencias del usuario)
            const modulosHabilitados = suscripcion.modulos_habilitados || [];
            const modulosActivos = this.construirModulosActivos(modulosHabilitados, modulosActivosActuales);

            // 4. Actualizar organización
            await db.query(`
                UPDATE organizaciones
                SET modulos_activos = $1::jsonb,
                    actualizado_en = NOW()
                WHERE id = $2
            `, [JSON.stringify(modulosActivos), orgId]);

            // 5. Invalidar cache
            await ModulesCache.invalidate(orgId);

            logger.info(`[ModulosSyncService] Módulos sincronizados para org ${orgId}`, {
                plan: suscripcion.plan_codigo,
                modulos: Object.keys(modulosActivos)
            });

            return {
                success: true,
                organizacion_id: orgId,
                plan_codigo: suscripcion.plan_codigo,
                plan_nombre: suscripcion.plan_nombre,
                estado_suscripcion: suscripcion.estado,
                modulos_sincronizados: Object.keys(modulosActivos)
            };
        });
    }

    /**
     * Sincroniza TODAS las organizaciones con un plan específico
     * Usado cuando se editan los entitlements de un plan
     *
     * @param {number} planId - ID del plan editado
     * @returns {Promise<Object>} - { sincronizadas: [], errores: [] }
     */
    static async sincronizarPorPlan(planId) {
        return await RLSContextManager.withBypass(async (db) => {
            // 1. Obtener el plan con sus módulos habilitados
            const planQuery = `
                SELECT id, codigo, nombre, modulos_habilitados
                FROM planes_suscripcion_org
                WHERE id = $1 AND organizacion_id = $2
            `;
            const planResult = await db.query(planQuery, [planId, NEXO_TEAM_ORG_ID]);
            const plan = planResult.rows[0];

            if (!plan) {
                logger.warn(`[ModulosSyncService] Plan ${planId} no encontrado en Nexo Team`);
                return { sincronizadas: [], errores: [], mensaje: 'Plan no encontrado' };
            }

            // 2. Obtener todas las organizaciones con suscripción activa a este plan
            // INCLUYE modulos_activos para hacer merge inteligente (respetar preferencias)
            const orgsQuery = `
                SELECT DISTINCT ON (c.organizacion_vinculada_id)
                    c.organizacion_vinculada_id as org_id,
                    o.nombre_comercial,
                    o.modulos_activos as modulos_activos_actuales,
                    s.id as suscripcion_id,
                    s.estado
                FROM suscripciones_org s
                INNER JOIN clientes c ON s.cliente_id = c.id
                INNER JOIN organizaciones o ON c.organizacion_vinculada_id = o.id
                WHERE s.plan_id = $1
                  AND s.organizacion_id = $2
                  AND c.organizacion_vinculada_id IS NOT NULL
                  AND s.estado IN ('activa', 'trial', 'pendiente_pago', 'grace_period')
                ORDER BY c.organizacion_vinculada_id,
                    CASE s.estado
                        WHEN 'activa' THEN 1
                        WHEN 'trial' THEN 2
                        WHEN 'grace_period' THEN 3
                        ELSE 4
                    END
            `;
            const orgsResult = await db.query(orgsQuery, [planId, NEXO_TEAM_ORG_ID]);

            const sincronizadas = [];
            const errores = [];

            // 3. Actualizar cada organización con merge inteligente
            for (const org of orgsResult.rows) {
                try {
                    // Construir módulos respetando preferencias del usuario
                    const modulosActivos = this.construirModulosActivos(
                        plan.modulos_habilitados,
                        org.modulos_activos_actuales
                    );

                    await db.query(`
                        UPDATE organizaciones
                        SET modulos_activos = $1::jsonb,
                            actualizado_en = NOW()
                        WHERE id = $2
                    `, [JSON.stringify(modulosActivos), org.org_id]);

                    // Invalidar cache
                    await ModulesCache.invalidate(org.org_id);

                    sincronizadas.push({
                        org_id: org.org_id,
                        nombre: org.nombre_comercial,
                        modulos: Object.keys(modulosActivos).length
                    });
                } catch (err) {
                    errores.push({
                        org_id: org.org_id,
                        nombre: org.nombre_comercial,
                        error: err.message
                    });
                }
            }

            logger.info(`[ModulosSyncService] Sincronización por plan ${plan.codigo} completada`, {
                plan_id: planId,
                sincronizadas: sincronizadas.length,
                errores: errores.length
            });

            return {
                sincronizadas,
                errores,
                plan_codigo: plan.codigo,
                modulos_habilitados: plan.modulos_habilitados || []
            };
        });
    }

    /**
     * Sincroniza TODAS las organizaciones de la plataforma
     * Operación pesada - usar con precaución
     *
     * @returns {Promise<Object>} - { sincronizadas: [], errores: [] }
     */
    static async sincronizarTodas() {
        return await RLSContextManager.withBypass(async (db) => {
            // 1. Obtener todas las organizaciones con suscripción en Nexo Team
            // INCLUYE modulos_activos para hacer merge inteligente (respetar preferencias)
            const query = `
                SELECT DISTINCT ON (c.organizacion_vinculada_id)
                    c.organizacion_vinculada_id as org_id,
                    o.nombre_comercial,
                    o.modulos_activos as modulos_activos_actuales,
                    s.id as suscripcion_id,
                    s.estado,
                    p.codigo as plan_codigo,
                    p.modulos_habilitados
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                INNER JOIN clientes c ON s.cliente_id = c.id
                INNER JOIN organizaciones o ON c.organizacion_vinculada_id = o.id
                WHERE s.organizacion_id = $1
                  AND c.organizacion_vinculada_id IS NOT NULL
                  AND s.estado IN ('activa', 'trial', 'pendiente_pago', 'grace_period')
                ORDER BY c.organizacion_vinculada_id,
                    CASE s.estado
                        WHEN 'activa' THEN 1
                        WHEN 'trial' THEN 2
                        WHEN 'grace_period' THEN 3
                        ELSE 4
                    END
            `;
            const orgsResult = await db.query(query, [NEXO_TEAM_ORG_ID]);

            const sincronizadas = [];
            const errores = [];

            for (const org of orgsResult.rows) {
                try {
                    const modulosHabilitados = org.modulos_habilitados || [];
                    // Construir módulos respetando preferencias del usuario
                    const modulosActivos = this.construirModulosActivos(
                        modulosHabilitados,
                        org.modulos_activos_actuales
                    );

                    await db.query(`
                        UPDATE organizaciones
                        SET modulos_activos = $1::jsonb,
                            actualizado_en = NOW()
                        WHERE id = $2
                    `, [JSON.stringify(modulosActivos), org.org_id]);

                    await ModulesCache.invalidate(org.org_id);

                    sincronizadas.push({
                        org_id: org.org_id,
                        nombre: org.nombre_comercial,
                        plan: org.plan_codigo,
                        modulos: Object.keys(modulosActivos).length
                    });
                } catch (err) {
                    errores.push({
                        org_id: org.org_id,
                        nombre: org.nombre_comercial,
                        error: err.message
                    });
                }
            }

            logger.info(`[ModulosSyncService] Sincronización masiva completada`, {
                sincronizadas: sincronizadas.length,
                errores: errores.length
            });

            return { sincronizadas, errores };
        });
    }
}

module.exports = ModulosSyncService;
