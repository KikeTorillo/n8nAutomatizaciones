/**
 * ====================================================================
 * ENTITLEMENTS CONTROLLER
 * ====================================================================
 * Controlador para gestionar entitlements de planes de Nexo Team.
 * Permite a SuperAdmin configurar límites y módulos de los planes
 * de la plataforma sin mezclarlos con el flujo normal de Customer Billing.
 *
 * @module suscripciones-negocio/controllers/entitlements
 */

const asyncHandler = require('../../../middleware/asyncHandler');
const RLSContextManager = require('../../../utils/rlsContextManager');
const { ResponseHelper, ErrorHelper } = require('../../../utils/helpers');
const { NEXO_TEAM_ORG_ID, MODULOS_VALIDOS } = require('../../../config/constants');
const ModulosSyncService = require('../../../services/modulosSyncService');
const logger = require('../../../utils/logger');

class EntitlementsController {
    /**
     * GET /entitlements/planes
     * Lista planes de Nexo Team con sus entitlements
     */
    static listarPlanesNexoTeam = asyncHandler(async (req, res) => {
        const planes = await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    id, codigo, nombre, descripcion,
                    precio_mensual, dias_trial,
                    limites, features, modulos_habilitados,
                    usuarios_incluidos, precio_usuario_adicional, max_usuarios_hard,
                    activo, creado_en, orden_display
                FROM planes_suscripcion_org
                WHERE organizacion_id = $1
                ORDER BY orden_display ASC NULLS LAST, nombre ASC
            `;
            return (await db.query(query, [NEXO_TEAM_ORG_ID])).rows;
        });

        // Obtener lista de módulos válidos del sistema
        const modulosDisponibles = MODULOS_VALIDOS;

        return ResponseHelper.success(res, { planes, modulosDisponibles });
    });

    /**
     * PUT /entitlements/planes/:id
     * Actualiza los campos de entitlements de un plan
     * Opcionalmente sincroniza organizaciones existentes con el nuevo plan
     */
    static actualizarEntitlements = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const {
            limites,
            modulos_habilitados,
            usuarios_incluidos,
            precio_usuario_adicional,
            max_usuarios_hard,
            sincronizar_organizaciones = false
        } = req.body;

        // 1. Actualizar plan en BD
        const planActualizado = await RLSContextManager.withBypass(async (db) => {
            // Verificar que el plan pertenece a Nexo Team
            const check = await db.query(
                `SELECT id FROM planes_suscripcion_org WHERE id = $1 AND organizacion_id = $2`,
                [id, NEXO_TEAM_ORG_ID]
            );

            if (check.rows.length === 0) {
                ErrorHelper.throwNotFound('Plan de Nexo Team');
            }

            const result = await db.query(`
                UPDATE planes_suscripcion_org
                SET
                    limites = $1,
                    modulos_habilitados = $2,
                    usuarios_incluidos = $3,
                    precio_usuario_adicional = $4,
                    max_usuarios_hard = $5,
                    actualizado_en = NOW()
                WHERE id = $6
                RETURNING *
            `, [
                JSON.stringify(limites || {}),
                JSON.stringify(modulos_habilitados || []),
                usuarios_incluidos,
                precio_usuario_adicional,
                max_usuarios_hard,
                id
            ]);

            return result.rows[0];
        });

        // 2. Si solicitó sincronización, propagar a orgs existentes
        let resultadoSync = null;
        if (sincronizar_organizaciones) {
            resultadoSync = await ModulosSyncService.sincronizarPorPlan(id);
            logger.info('[Entitlements] Sincronización post-edición completada', {
                plan_id: id,
                plan_codigo: planActualizado.codigo,
                sincronizadas: resultadoSync.sincronizadas.length,
                errores: resultadoSync.errores.length
            });
        }

        return ResponseHelper.success(res, {
            plan: planActualizado,
            sincronizacion: resultadoSync
        }, sincronizar_organizaciones
            ? `Entitlements actualizados. ${resultadoSync?.sincronizadas?.length || 0} organizaciones sincronizadas`
            : 'Entitlements actualizados correctamente'
        );
    });

}

module.exports = EntitlementsController;
