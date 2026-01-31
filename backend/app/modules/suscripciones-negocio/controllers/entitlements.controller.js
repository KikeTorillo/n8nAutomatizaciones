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
const { NEXO_TEAM_ORG_ID, FEATURE_TO_MODULO } = require('../../../config/constants');

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
                    limites, features,
                    usuarios_incluidos, precio_usuario_adicional, max_usuarios_hard,
                    activo, creado_en, orden_display
                FROM planes_suscripcion_org
                WHERE organizacion_id = $1
                ORDER BY orden_display ASC NULLS LAST, nombre ASC
            `;
            return (await db.query(query, [NEXO_TEAM_ORG_ID])).rows;
        });

        // Obtener módulos disponibles del mapeo de features
        const modulosDisponibles = Object.keys(FEATURE_TO_MODULO);

        return ResponseHelper.success(res, { planes, modulosDisponibles });
    });

    /**
     * PUT /entitlements/planes/:id
     * Actualiza solo los campos de entitlements de un plan
     */
    static actualizarEntitlements = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const {
            limites,
            features,
            usuarios_incluidos,
            precio_usuario_adicional,
            max_usuarios_hard
        } = req.body;

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
                    features = $2,
                    usuarios_incluidos = $3,
                    precio_usuario_adicional = $4,
                    max_usuarios_hard = $5,
                    actualizado_en = NOW()
                WHERE id = $6
                RETURNING *
            `, [
                JSON.stringify(limites || {}),
                JSON.stringify(features || []),
                usuarios_incluidos,
                precio_usuario_adicional,
                max_usuarios_hard,
                id
            ]);

            return result.rows[0];
        });

        return ResponseHelper.success(res, planActualizado, 'Entitlements actualizados correctamente');
    });
}

module.exports = EntitlementsController;
