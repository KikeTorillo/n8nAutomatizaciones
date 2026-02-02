/**
 * ====================================================================
 * DOGFOODING SERVICE
 * ====================================================================
 * Servicio para vincular organizaciones de la plataforma como clientes
 * en Nexo Team (NEXO_TEAM_ORG_ID configurable via env) para el modelo dogfooding.
 *
 * Cada nueva organización registrada crea automáticamente:
 * 1. Un cliente en el CRM de Nexo Team
 * 2. Una suscripción trial en el módulo suscripciones-negocio
 *
 * @module services/dogfoodingService
 * @author Nexo Team
 * @version 1.0.0
 * @date Enero 2026
 */

const RLSContextManager = require('../utils/rlsContextManager');
const logger = require('../utils/logger');
const { NEXO_TEAM_ORG_ID } = require('../config/constants');

class DogfoodingService {

    /**
     * Vincular una organización de la plataforma como cliente en Nexo Team
     *
     * @param {Object} organizacion - Datos de la organización recién creada
     * @param {number} organizacion.id - ID de la organización
     * @param {string} organizacion.nombre_comercial - Nombre comercial
     * @param {string} organizacion.email_admin - Email del admin
     * @param {string} [organizacion.telefono] - Teléfono de contacto
     * @param {string} [organizacion.razon_social] - Razón social
     * @returns {Promise<Object|null>} - Cliente creado o null si falla
     */
    static async vincularOrganizacionComoCliente(organizacion) {
        try {
            // Evitar vincular Nexo Team consigo misma
            if (organizacion.id === NEXO_TEAM_ORG_ID) {
                logger.info(`Dogfooding: Ignorando org ${organizacion.id} (es Nexo Team)`);
                return null;
            }

            // Verificar que existan planes en Nexo Team
            const PlanesModel = require('../modules/suscripciones-negocio/models/planes.model');
            const planTrial = await PlanesModel.buscarPorCodigo('trial', NEXO_TEAM_ORG_ID);
            if (!planTrial) {
                logger.warn(`Dogfooding: No hay plan trial en Nexo Team (org ${NEXO_TEAM_ORG_ID}). Saltando vinculación.`);
                return null;
            }

            logger.info(`Dogfooding: Vinculando org ${organizacion.id} (${organizacion.nombre_comercial}) como cliente`);

            // 1. Crear cliente en Nexo Team (con vinculación directa en INSERT)
            const clienteData = {
                nombre: organizacion.nombre_comercial,
                email: organizacion.email_admin,
                telefono: organizacion.telefono || null,
                tipo: 'empresa',
                razon_social: organizacion.razon_social || organizacion.nombre_comercial,
                notas_especiales: `Organización plataforma ID: ${organizacion.id}`,
                como_conocio: 'plataforma',
                activo: true,
                marketing_permitido: true,
                // Vinculación directa (optimizado Ene 2026 - sin UPDATE extra)
                organizacion_vinculada_id: organizacion.id
            };

            const ClienteModel = require('../modules/clientes/models/cliente.model');
            const cliente = await ClienteModel.crear(NEXO_TEAM_ORG_ID, clienteData);

            if (!cliente) {
                logger.error(`Dogfooding: Fallo creando cliente para org ${organizacion.id}`);
                return null;
            }

            logger.info(`Dogfooding: Cliente ${cliente.id} creado y vinculado a org ${organizacion.id}`);

            // 3. Crear suscripción trial
            await this._crearSuscripcionTrial(organizacion, cliente);

            return cliente;

        } catch (error) {
            logger.error(`Dogfooding: Error vinculando org ${organizacion.id}:`, error);
            return null;
        }
    }

    /**
     * Crear suscripción trial para el cliente
     * @private
     */
    static async _crearSuscripcionTrial(organizacion, cliente) {
        try {
            const PlanesModel = require('../modules/suscripciones-negocio/models/planes.model');
            const SuscripcionesModel = require('../modules/suscripciones-negocio/models/suscripciones.model');

            // Buscar plan trial
            const planTrial = await PlanesModel.buscarPorCodigo('trial', NEXO_TEAM_ORG_ID);

            if (!planTrial) {
                logger.warn(`Dogfooding: Plan trial no encontrado en org ${NEXO_TEAM_ORG_ID}`);
                return null;
            }

            // Calcular fecha fin de trial
            const diasTrial = planTrial.dias_trial || 14;

            const suscripcionData = {
                plan_id: planTrial.id,
                cliente_id: cliente.id,
                periodo: 'mensual',
                es_trial: true
            };

            // Crear suscripción (el modelo calcula las fechas automáticamente)
            const suscripcion = await SuscripcionesModel.crear(
                suscripcionData,
                NEXO_TEAM_ORG_ID,
                null // Sin usuario específico (sistema)
            );

            logger.info(`Dogfooding: Suscripción trial ${suscripcion?.id} creada para cliente ${cliente.id}`);

            return suscripcion;

        } catch (error) {
            logger.error(`Dogfooding: Error creando suscripción trial:`, error);
            return null;
        }
    }

    /**
     * Buscar cliente vinculado a una organización
     *
     * @param {number} organizacionId - ID de la organización de la plataforma
     * @returns {Promise<Object|null>} - Cliente vinculado o null
     */
    static async buscarClienteVinculado(organizacionId) {
        try {
            return await RLSContextManager.query(NEXO_TEAM_ORG_ID, async (db) => {
                const result = await db.query(
                    `SELECT c.*, p.nombre as plan_nombre, s.estado as suscripcion_estado
                     FROM clientes c
                     LEFT JOIN suscripciones_org s ON s.cliente_id = c.id
                     LEFT JOIN planes_suscripcion_org p ON s.plan_id = p.id
                     WHERE c.organizacion_vinculada_id = $1`,
                    [organizacionId]
                );
                return result.rows[0] || null;
            });
        } catch (error) {
            logger.error(`Dogfooding: Error buscando cliente vinculado a org ${organizacionId}:`, error);
            return null;
        }
    }

    /**
     * Actualizar datos del cliente cuando se actualiza la organización
     *
     * @param {Object} organizacion - Datos actualizados de la organización
     * @returns {Promise<boolean>} - true si se actualizó, false si no
     */
    static async sincronizarDatosCliente(organizacion) {
        try {
            const cliente = await this.buscarClienteVinculado(organizacion.id);

            if (!cliente) {
                logger.info(`Dogfooding: No hay cliente vinculado para org ${organizacion.id}`);
                return false;
            }

            await RLSContextManager.query(NEXO_TEAM_ORG_ID, async (db) => {
                await db.query(
                    `UPDATE clientes
                     SET nombre = $1,
                         email = $2,
                         telefono = $3,
                         razon_social = $4,
                         actualizado_en = NOW()
                     WHERE id = $5`,
                    [
                        organizacion.nombre_comercial,
                        organizacion.email_admin,
                        organizacion.telefono,
                        organizacion.razon_social || organizacion.nombre_comercial,
                        cliente.id
                    ]
                );
            });

            logger.info(`Dogfooding: Cliente ${cliente.id} sincronizado con org ${organizacion.id}`);
            return true;

        } catch (error) {
            logger.error(`Dogfooding: Error sincronizando cliente para org ${organizacion.id}:`, error);
            return false;
        }
    }
}

module.exports = DogfoodingService;
