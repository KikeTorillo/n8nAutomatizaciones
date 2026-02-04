/**
 * ====================================================================
 * HELPER DE LÍMITES DE PLAN
 * ====================================================================
 *
 * Verifica límites de recursos según el plan de suscripción.
 * Usa las tablas nuevas: suscripciones_org y planes_suscripcion_org
 *
 * NOTA: Reemplaza el sistema legacy que usaba:
 * - subscripciones (sin guión bajo)
 * - planes_subscripcion (sin guión bajo)
 * - función verificar_limite_plan() que no existe
 *
 * @module utils/helpers/LimitesHelper
 * @version 1.0.0
 * @date Enero 2026
 */

const RLSContextManager = require('../rlsContextManager');
const { PlanLimitExceededError } = require('../errors');
const logger = require('../logger');

// Lazy load para evitar dependencia circular
let UsageTrackingService = null;
const getUsageTrackingService = () => {
    if (!UsageTrackingService) {
        UsageTrackingService = require('../../modules/suscripciones-negocio/services/usage-tracking.service');
    }
    return UsageTrackingService;
};

/**
 * Límites por defecto cuando no hay suscripción activa
 */
const LIMITES_DEFAULT = {
    sucursales: 1,
    profesionales: 2,
    servicios: 10,
    citas: 50,
    usuarios: 3,
    // eventos-digitales
    eventos_activos: 3,
    invitados_evento: 100,
    fotos_galeria: 20
};

class LimitesHelper {

    /**
     * Obtiene los límites del plan activo de una organización
     *
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Límites del plan
     */
    static async obtenerLimitesPlan(organizacionId) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    COALESCE(NULLIF(ps.limites->>'sucursales', '')::int, $2) as limite_sucursales,
                    COALESCE(NULLIF(ps.limites->>'profesionales', '')::int, $3) as limite_profesionales,
                    COALESCE(NULLIF(ps.limites->>'servicios', '')::int, $4) as limite_servicios,
                    COALESCE(NULLIF(ps.limites->>'citas', '')::int, $5) as limite_citas,
                    COALESCE(NULLIF(ps.limites->>'usuarios', '')::int, $6) as limite_usuarios,
                    COALESCE(NULLIF(ps.limites->>'eventos_activos', '')::int, $7) as limite_eventos_activos,
                    COALESCE(NULLIF(ps.limites->>'invitados_evento', '')::int, $8) as limite_invitados_evento,
                    COALESCE(NULLIF(ps.limites->>'fotos_galeria', '')::int, $9) as limite_fotos_galeria,
                    ps.nombre as nombre_plan,
                    ps.codigo as codigo_plan
                FROM suscripciones_org sub
                JOIN planes_suscripcion_org ps ON sub.plan_id = ps.id
                WHERE sub.organizacion_id = $1
                  AND sub.estado IN ('activa', 'trial')
                LIMIT 1
            `;

            const result = await db.query(query, [
                organizacionId,
                LIMITES_DEFAULT.sucursales,
                LIMITES_DEFAULT.profesionales,
                LIMITES_DEFAULT.servicios,
                LIMITES_DEFAULT.citas,
                LIMITES_DEFAULT.usuarios,
                LIMITES_DEFAULT.eventos_activos,
                LIMITES_DEFAULT.invitados_evento,
                LIMITES_DEFAULT.fotos_galeria
            ]);

            if (result.rows.length === 0) {
                logger.warn('[LimitesHelper] No hay suscripción activa, usando límites default', {
                    organizacionId
                });
                return {
                    limite_sucursales: LIMITES_DEFAULT.sucursales,
                    limite_profesionales: LIMITES_DEFAULT.profesionales,
                    limite_servicios: LIMITES_DEFAULT.servicios,
                    limite_citas: LIMITES_DEFAULT.citas,
                    limite_usuarios: LIMITES_DEFAULT.usuarios,
                    limite_eventos_activos: LIMITES_DEFAULT.eventos_activos,
                    limite_invitados_evento: LIMITES_DEFAULT.invitados_evento,
                    limite_fotos_galeria: LIMITES_DEFAULT.fotos_galeria,
                    nombre_plan: 'Sin plan',
                    codigo_plan: null
                };
            }

            return result.rows[0];
        });
    }

    /**
     * Cuenta el uso actual de un recurso específico
     *
     * @param {number} organizacionId - ID de la organización
     * @param {string} recurso - Tipo de recurso: 'sucursales', 'profesionales', 'servicios', 'citas', 'usuarios'
     * @param {Object} db - Conexión de base de datos (opcional, para usar dentro de transacciones)
     * @returns {Promise<number>} Cantidad actual de recursos usados
     */
    static async contarUsoActual(organizacionId, recurso, db = null) {
        const ejecutarQuery = async (conexion) => {
            let query;

            switch (recurso) {
                case 'sucursales':
                    query = `
                        SELECT COUNT(*)::int as total
                        FROM sucursales
                        WHERE organizacion_id = $1 AND activo = true
                    `;
                    break;

                case 'profesionales':
                    query = `
                        SELECT COUNT(*)::int as total
                        FROM profesionales
                        WHERE organizacion_id = $1 AND activo = true
                    `;
                    break;

                case 'servicios':
                    query = `
                        SELECT COUNT(*)::int as total
                        FROM servicios
                        WHERE organizacion_id = $1 AND activo = true
                    `;
                    break;

                case 'citas':
                    // Citas del mes actual (no canceladas)
                    query = `
                        SELECT COUNT(*)::int as total
                        FROM citas
                        WHERE organizacion_id = $1
                          AND estado != 'cancelada'
                          AND fecha_cita >= date_trunc('month', CURRENT_DATE)
                          AND fecha_cita < date_trunc('month', CURRENT_DATE) + interval '1 month'
                    `;
                    break;

                case 'usuarios':
                    query = `
                        SELECT COUNT(*)::int as total
                        FROM usuarios
                        WHERE organizacion_id = $1 AND activo = true
                    `;
                    break;

                case 'eventos_activos':
                    query = `
                        SELECT COUNT(*)::int as total
                        FROM eventos_digitales
                        WHERE organizacion_id = $1
                          AND activo = true
                    `;
                    break;

                default:
                    throw new Error(`Recurso desconocido: ${recurso}`);
            }

            const result = await conexion.query(query, [organizacionId]);
            return result.rows[0]?.total || 0;
        };

        // Si se pasa conexión, usarla directamente (para transacciones)
        if (db) {
            return await ejecutarQuery(db);
        }

        // Si no, usar RLS bypass
        return await RLSContextManager.withBypass(ejecutarQuery);
    }

    /**
     * Verifica si se puede crear X cantidad de un recurso sin exceder el límite
     *
     * @param {number} organizacionId - ID de la organización
     * @param {string} recurso - Tipo de recurso
     * @param {number} cantidadACrear - Cantidad que se quiere crear
     * @param {Object} db - Conexión de base de datos (opcional)
     * @returns {Promise<{puedeCrear: boolean, limite: number, usoActual: number, nombrePlan: string}>}
     */
    static async verificarLimite(organizacionId, recurso, cantidadACrear = 1, db = null) {
        const limites = await this.obtenerLimitesPlan(organizacionId);
        const usoActual = await this.contarUsoActual(organizacionId, recurso, db);

        // Mapear recurso a campo de límite
        const campoLimite = `limite_${recurso}`;
        const limite = limites[campoLimite];

        // NULL o -1 significa ilimitado
        if (limite === null || limite === -1) {
            return {
                puedeCrear: true,
                limite: -1,
                usoActual,
                nombrePlan: limites.nombre_plan,
                disponible: Infinity
            };
        }

        const disponible = limite - usoActual;
        const puedeCrear = cantidadACrear <= disponible;

        return {
            puedeCrear,
            limite,
            usoActual,
            nombrePlan: limites.nombre_plan,
            disponible
        };
    }

    /**
     * Verifica límite y lanza error si se excede
     * Útil para usar directamente en controllers/models
     *
     * @param {number} organizacionId - ID de la organización
     * @param {string} recurso - Tipo de recurso
     * @param {number} cantidadACrear - Cantidad que se quiere crear
     * @param {Object} db - Conexión de base de datos (opcional)
     * @throws {PlanLimitExceededError} Si se excede el límite
     */
    static async verificarLimiteOLanzar(organizacionId, recurso, cantidadACrear = 1, db = null) {
        const resultado = await this.verificarLimite(organizacionId, recurso, cantidadACrear, db);

        if (!resultado.puedeCrear) {
            logger.warn('[LimitesHelper] Límite de plan excedido', {
                organizacionId,
                recurso,
                cantidadACrear,
                limite: resultado.limite,
                usoActual: resultado.usoActual,
                nombrePlan: resultado.nombrePlan
            });

            throw new PlanLimitExceededError(
                recurso,
                resultado.limite,
                resultado.usoActual,
                resultado.nombrePlan
            );
        }

        return resultado;
    }

    /**
     * Cuenta invitados de un evento específico
     *
     * @param {number} eventoId - ID del evento
     * @param {Object} db - Conexión de base de datos (opcional)
     * @returns {Promise<number>} Cantidad de invitados
     */
    static async contarInvitadosEvento(eventoId, db = null) {
        const ejecutarQuery = async (conexion) => {
            const query = `
                SELECT COUNT(*)::int as total
                FROM invitados_evento
                WHERE evento_id = $1 AND activo = true
            `;
            const result = await conexion.query(query, [eventoId]);
            return result.rows[0]?.total || 0;
        };

        if (db) {
            return await ejecutarQuery(db);
        }

        return await RLSContextManager.withBypass(ejecutarQuery);
    }

    /**
     * Cuenta fotos en galería de un evento específico
     *
     * @param {number} eventoId - ID del evento
     * @param {Object} db - Conexión de base de datos (opcional)
     * @returns {Promise<number>} Cantidad de fotos
     */
    static async contarFotosGaleria(eventoId, db = null) {
        const ejecutarQuery = async (conexion) => {
            const query = `
                SELECT COALESCE(jsonb_array_length(galeria_urls), 0)::int as total
                FROM eventos_digitales
                WHERE id = $1
            `;
            const result = await conexion.query(query, [eventoId]);
            return result.rows[0]?.total || 0;
        };

        if (db) {
            return await ejecutarQuery(db);
        }

        return await RLSContextManager.withBypass(ejecutarQuery);
    }

    /**
     * Verifica límite de invitados para un evento
     *
     * @param {number} organizacionId - ID de la organización
     * @param {number} eventoId - ID del evento
     * @param {number} cantidadACrear - Cantidad de invitados a crear (default 1)
     * @param {Object} db - Conexión de base de datos (opcional)
     * @returns {Promise<Object>} - {puedeCrear, limite, usoActual, disponible, nombrePlan}
     */
    static async verificarLimiteInvitados(organizacionId, eventoId, cantidadACrear = 1, db = null) {
        const limites = await this.obtenerLimitesPlan(organizacionId);
        const limite = limites.limite_invitados_evento;

        // -1 = ilimitado
        if (limite === -1) {
            return {
                puedeCrear: true,
                limite: -1,
                usoActual: 0,
                disponible: Infinity,
                nombrePlan: limites.nombre_plan
            };
        }

        const usoActual = await this.contarInvitadosEvento(eventoId, db);
        const disponible = limite - usoActual;

        return {
            puedeCrear: disponible >= cantidadACrear,
            limite,
            usoActual,
            disponible,
            nombrePlan: limites.nombre_plan
        };
    }

    /**
     * Verifica límite de invitados y lanza error si se excede
     *
     * @param {number} organizacionId - ID de la organización
     * @param {number} eventoId - ID del evento
     * @param {number} cantidadACrear - Cantidad de invitados a crear
     * @param {Object} db - Conexión de base de datos (opcional)
     * @throws {PlanLimitExceededError} Si se excede el límite
     */
    static async verificarLimiteInvitadosOLanzar(organizacionId, eventoId, cantidadACrear = 1, db = null) {
        const resultado = await this.verificarLimiteInvitados(organizacionId, eventoId, cantidadACrear, db);

        if (!resultado.puedeCrear) {
            logger.warn('[LimitesHelper] Límite de invitados excedido', {
                organizacionId,
                eventoId,
                cantidadACrear,
                limite: resultado.limite,
                usoActual: resultado.usoActual,
                nombrePlan: resultado.nombrePlan
            });

            throw new PlanLimitExceededError(
                'invitados por evento',
                resultado.limite,
                resultado.usoActual,
                resultado.nombrePlan
            );
        }

        return resultado;
    }

    /**
     * Verifica límite de fotos en galería para un evento
     *
     * @param {number} organizacionId - ID de la organización
     * @param {number} eventoId - ID del evento
     * @param {number} cantidadAAgregar - Cantidad de fotos a agregar (default 1)
     * @param {Object} db - Conexión de base de datos (opcional)
     * @returns {Promise<Object>} - {puedeCrear, limite, usoActual, disponible, nombrePlan}
     */
    static async verificarLimiteFotosGaleria(organizacionId, eventoId, cantidadAAgregar = 1, db = null) {
        const limites = await this.obtenerLimitesPlan(organizacionId);
        const limite = limites.limite_fotos_galeria;

        // -1 = ilimitado
        if (limite === -1) {
            return {
                puedeCrear: true,
                limite: -1,
                usoActual: 0,
                disponible: Infinity,
                nombrePlan: limites.nombre_plan
            };
        }

        const usoActual = await this.contarFotosGaleria(eventoId, db);
        const disponible = limite - usoActual;

        return {
            puedeCrear: disponible >= cantidadAAgregar,
            limite,
            usoActual,
            disponible,
            nombrePlan: limites.nombre_plan
        };
    }

    /**
     * Verifica límite de fotos en galería y lanza error si se excede
     *
     * @param {number} organizacionId - ID de la organización
     * @param {number} eventoId - ID del evento
     * @param {number} cantidadAAgregar - Cantidad de fotos a agregar
     * @param {Object} db - Conexión de base de datos (opcional)
     * @throws {PlanLimitExceededError} Si se excede el límite
     */
    static async verificarLimiteFotosGaleriaOLanzar(organizacionId, eventoId, cantidadAAgregar = 1, db = null) {
        const resultado = await this.verificarLimiteFotosGaleria(organizacionId, eventoId, cantidadAAgregar, db);

        if (!resultado.puedeCrear) {
            logger.warn('[LimitesHelper] Límite de fotos en galería excedido', {
                organizacionId,
                eventoId,
                cantidadAAgregar,
                limite: resultado.limite,
                usoActual: resultado.usoActual,
                nombrePlan: resultado.nombrePlan
            });

            throw new PlanLimitExceededError(
                'fotos en galería',
                resultado.limite,
                resultado.usoActual,
                resultado.nombrePlan
            );
        }

        return resultado;
    }

    /**
     * Obtiene resumen de uso de todos los recursos
     *
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Resumen de uso de recursos
     */
    static async obtenerResumenUso(organizacionId) {
        const limites = await this.obtenerLimitesPlan(organizacionId);

        const recursos = ['sucursales', 'profesionales', 'servicios', 'citas', 'usuarios', 'eventos_activos'];
        const resumen = {};

        for (const recurso of recursos) {
            const usoActual = await this.contarUsoActual(organizacionId, recurso);
            const campoLimite = `limite_${recurso}`;
            const limite = limites[campoLimite];

            resumen[recurso] = {
                usado: usoActual,
                limite: limite === -1 ? 'Ilimitado' : limite,
                disponible: limite === -1 ? 'Ilimitado' : Math.max(0, limite - usoActual),
                porcentaje_uso: limite === -1 ? 0 : Math.round((usoActual / limite) * 100)
            };
        }

        return {
            plan: {
                nombre: limites.nombre_plan,
                codigo: limites.codigo_plan
            },
            uso: resumen
        };
    }

    /**
     * Verifica límite de usuarios con soporte para soft limits (seat-based billing)
     *
     * A diferencia de verificarLimite(), este método considera:
     * - Hard limits: bloquea si se excede (para trials)
     * - Soft limits: permite con advertencia de cobro adicional (para planes de pago)
     *
     * @param {number} organizacionId - ID de la organización
     * @param {number} cantidadACrear - Cantidad de usuarios a crear (default 1)
     * @returns {Promise<Object>} - {
     *   puedeCrear: boolean,
     *   advertencia: string|null,
     *   costoAdicional: number,
     *   esHardLimit: boolean,
     *   detalle: Object
     * }
     */
    static async verificarLimiteUsuariosConAjuste(organizacionId, cantidadACrear = 1) {
        try {
            const UsageService = getUsageTrackingService();
            return await UsageService.verificarLimiteConAjuste(organizacionId, cantidadACrear);
        } catch (error) {
            // Si el servicio falla, usar verificación tradicional como fallback
            logger.warn('[LimitesHelper] Error en verificación con ajuste, usando fallback', {
                organizacionId,
                error: error.message
            });

            const resultado = await this.verificarLimite(organizacionId, 'usuarios', cantidadACrear);

            return {
                puedeCrear: resultado.puedeCrear,
                advertencia: resultado.puedeCrear ? null : `Límite de ${resultado.limite} usuarios alcanzado`,
                costoAdicional: 0,
                esHardLimit: true,
                detalle: {
                    usuariosActuales: resultado.usoActual,
                    usuariosIncluidos: resultado.limite,
                    planNombre: resultado.nombrePlan
                }
            };
        }
    }

    /**
     * Verifica límite de usuarios con ajuste y lanza error si es hard limit excedido
     * Para soft limits, retorna advertencia pero no lanza error
     *
     * @param {number} organizacionId - ID de la organización
     * @param {number} cantidadACrear - Cantidad que se quiere crear
     * @throws {PlanLimitExceededError} Si es hard limit y se excede
     * @returns {Promise<Object>} - Resultado de la verificación
     */
    static async verificarLimiteUsuariosOLanzar(organizacionId, cantidadACrear = 1) {
        const resultado = await this.verificarLimiteUsuariosConAjuste(organizacionId, cantidadACrear);

        if (!resultado.puedeCrear) {
            logger.warn('[LimitesHelper] Límite de usuarios excedido (hard limit)', {
                organizacionId,
                cantidadACrear,
                detalle: resultado.detalle
            });

            throw new PlanLimitExceededError(
                'usuarios',
                resultado.detalle.maxUsuariosHard || resultado.detalle.usuariosIncluidos,
                resultado.detalle.usuariosActuales,
                resultado.detalle.planNombre
            );
        }

        // Si hay advertencia (soft limit), logear pero no lanzar error
        if (resultado.advertencia) {
            logger.info('[LimitesHelper] Usuario adicional con cobro extra', {
                organizacionId,
                costoAdicional: resultado.costoAdicional,
                advertencia: resultado.advertencia
            });
        }

        return resultado;
    }
}

module.exports = LimitesHelper;
