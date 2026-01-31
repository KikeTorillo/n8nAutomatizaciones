/**
 * ====================================================================
 * SERVICE: TRACKING DE USO DE USUARIOS (SEAT-BASED BILLING)
 * ====================================================================
 * Gestiona el tracking diario de usuarios activos para facturación
 * por cantidad de usuarios (seat-based billing).
 *
 * Funcionalidades:
 * - Registrar uso diario de usuarios
 * - Calcular ajustes por usuarios adicionales
 * - Verificar límites (soft vs hard)
 * - Obtener resumen de uso para UI
 *
 * @module services/usage-tracking
 * @version 1.0.0
 * @date Enero 2026
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class UsageTrackingService {

    /**
     * Registrar uso diario de usuarios para una suscripción
     * Llamado por el cron job diario a las 23:55
     *
     * @param {number} suscripcionId - ID de la suscripción
     * @returns {Promise<Object>} - Registro creado o actualizado
     */
    static async registrarUsoDiario(suscripcionId) {
        return await RLSContextManager.withBypass(async (db) => {
            // Obtener datos de la suscripción, plan y organización vinculada (Platform Billing)
            const suscripcionQuery = `
                SELECT
                    s.id, s.organizacion_id, s.estado,
                    s.usuarios_max_periodo,
                    p.usuarios_incluidos,
                    p.precio_usuario_adicional,
                    p.max_usuarios_hard,
                    c.organizacion_vinculada_id
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                WHERE s.id = $1
            `;
            const suscResult = await db.query(suscripcionQuery, [suscripcionId]);
            const suscripcion = suscResult.rows[0];

            if (!suscripcion) {
                throw new Error(`Suscripción ${suscripcionId} no encontrada`);
            }

            // Solo trackear suscripciones activas o en trial
            if (!['activa', 'trial', 'grace_period'].includes(suscripcion.estado)) {
                logger.debug(`Suscripción ${suscripcionId} en estado ${suscripcion.estado}, saltando tracking`);
                return null;
            }

            // Usar organización vinculada (Platform Billing) o propietaria (Customer Billing)
            const orgIdParaConteo = suscripcion.organizacion_vinculada_id || suscripcion.organizacion_id;

            // Contar usuarios activos de la organización
            const countQuery = `
                SELECT COUNT(*)::int as total
                FROM usuarios
                WHERE organizacion_id = $1 AND activo = true
            `;
            const countResult = await db.query(countQuery, [orgIdParaConteo]);
            const usuariosActivos = countResult.rows[0]?.total || 0;

            const usuariosIncluidos = suscripcion.usuarios_incluidos || 5;
            const hoy = new Date().toISOString().split('T')[0];

            // Insertar o actualizar registro de uso diario (upsert)
            const upsertQuery = `
                INSERT INTO uso_usuarios_org (
                    organizacion_id, suscripcion_id, fecha,
                    usuarios_activos, usuarios_incluidos
                ) VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (suscripcion_id, fecha)
                DO UPDATE SET
                    usuarios_activos = EXCLUDED.usuarios_activos,
                    creado_en = NOW()
                RETURNING *
            `;
            const upsertResult = await db.query(upsertQuery, [
                suscripcion.organizacion_id,
                suscripcionId,
                hoy,
                usuariosActivos,
                usuariosIncluidos
            ]);

            // Actualizar usuarios_max_periodo si es mayor
            const maxActual = suscripcion.usuarios_max_periodo || 0;
            if (usuariosActivos > maxActual) {
                await db.query(`
                    UPDATE suscripciones_org
                    SET usuarios_max_periodo = $1, actualizado_en = NOW()
                    WHERE id = $2
                `, [usuariosActivos, suscripcionId]);

                logger.info(`Suscripción ${suscripcionId}: Nuevo máximo de usuarios del período: ${usuariosActivos}`);
            }

            logger.debug(`Uso registrado: Suscripción ${suscripcionId}, ${usuariosActivos} usuarios activos`);

            return upsertResult.rows[0];
        });
    }

    /**
     * Calcular ajuste por usuarios adicionales antes del cobro
     *
     * @param {number} suscripcionId - ID de la suscripción
     * @returns {Promise<Object>} - { monto, usuariosIncluidos, usuariosMax, usuariosExtra, precioUnitario }
     */
    static async calcularAjusteUsuarios(suscripcionId) {
        return await RLSContextManager.withBypass(async (db) => {
            // Obtener suscripción con plan
            const query = `
                SELECT
                    s.id, s.organizacion_id, s.usuarios_max_periodo,
                    s.precio_usuario_snapshot,
                    p.usuarios_incluidos, p.precio_usuario_adicional
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                WHERE s.id = $1
            `;
            const result = await db.query(query, [suscripcionId]);
            const suscripcion = result.rows[0];

            if (!suscripcion) {
                throw new Error(`Suscripción ${suscripcionId} no encontrada`);
            }

            const usuariosIncluidos = suscripcion.usuarios_incluidos || 5;
            const usuariosMax = suscripcion.usuarios_max_periodo || 0;

            // Usar precio snapshot si existe, sino precio actual del plan
            const precioUnitario = suscripcion.precio_usuario_snapshot
                || suscripcion.precio_usuario_adicional
                || 0;

            // Si no hay precio por usuario adicional, no hay ajuste
            if (!precioUnitario || precioUnitario <= 0) {
                return {
                    monto: 0,
                    usuariosIncluidos,
                    usuariosMax,
                    usuariosExtra: 0,
                    precioUnitario: 0,
                    mensaje: 'Plan sin cobro por usuarios adicionales'
                };
            }

            const usuariosExtra = Math.max(0, usuariosMax - usuariosIncluidos);
            const monto = usuariosExtra * precioUnitario;

            return {
                monto,
                usuariosIncluidos,
                usuariosMax,
                usuariosExtra,
                precioUnitario,
                mensaje: usuariosExtra > 0
                    ? `${usuariosExtra} usuarios adicionales × $${precioUnitario}`
                    : 'Sin usuarios adicionales'
            };
        });
    }

    /**
     * Verificar límite de usuarios con ajuste automático (soft/hard limit)
     *
     * @param {number} organizacionId - ID de la organización
     * @param {number} cantidadACrear - Cantidad de usuarios a crear (default 1)
     * @returns {Promise<Object>} - { puedeCrear, advertencia, costoAdicional, esHardLimit, detalle }
     */
    static async verificarLimiteConAjuste(organizacionId, cantidadACrear = 1) {
        return await RLSContextManager.withBypass(async (db) => {
            // Obtener suscripción activa de la organización
            const suscQuery = `
                SELECT
                    s.id, s.estado, s.es_trial,
                    p.usuarios_incluidos, p.precio_usuario_adicional, p.max_usuarios_hard,
                    p.nombre as plan_nombre
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                INNER JOIN clientes c ON s.cliente_id = c.id
                WHERE c.organizacion_vinculada_id = $1
                  AND s.estado IN ('activa', 'trial', 'grace_period')
                ORDER BY
                    CASE s.estado WHEN 'activa' THEN 1 WHEN 'trial' THEN 2 ELSE 3 END
                LIMIT 1
            `;
            const suscResult = await db.query(suscQuery, [organizacionId]);
            const suscripcion = suscResult.rows[0];

            // Sin suscripción: usar límites default
            if (!suscripcion) {
                return {
                    puedeCrear: false,
                    advertencia: 'No hay suscripción activa',
                    costoAdicional: 0,
                    esHardLimit: true,
                    detalle: {
                        usuariosActuales: 0,
                        usuariosIncluidos: 0,
                        maxUsuariosHard: 0,
                        planNombre: 'Sin plan'
                    }
                };
            }

            // Contar usuarios actuales
            const countQuery = `
                SELECT COUNT(*)::int as total
                FROM usuarios
                WHERE organizacion_id = $1 AND activo = true
            `;
            const countResult = await db.query(countQuery, [organizacionId]);
            const usuariosActuales = countResult.rows[0]?.total || 0;

            const usuariosIncluidos = suscripcion.usuarios_incluidos || 5;
            const precioUsuarioAdicional = suscripcion.precio_usuario_adicional;
            const maxUsuariosHard = suscripcion.max_usuarios_hard;
            const esTrial = suscripcion.es_trial;
            const enGracePeriod = suscripcion.estado === 'grace_period';

            const usuariosDespues = usuariosActuales + cantidadACrear;

            // En grace_period no se pueden crear usuarios (solo lectura)
            if (enGracePeriod) {
                return {
                    puedeCrear: false,
                    advertencia: 'Tu cuenta está en período de gracia. Solo lectura disponible.',
                    costoAdicional: 0,
                    esHardLimit: true,
                    detalle: {
                        usuariosActuales,
                        usuariosIncluidos,
                        maxUsuariosHard,
                        planNombre: suscripcion.plan_nombre
                    }
                };
            }

            // Trial siempre tiene hard limit
            if (esTrial) {
                const limiteHard = maxUsuariosHard || usuariosIncluidos;
                const puedeCrear = usuariosDespues <= limiteHard;

                return {
                    puedeCrear,
                    advertencia: puedeCrear
                        ? null
                        : `Tu plan trial permite máximo ${limiteHard} usuarios. Actualiza a Pro para agregar más.`,
                    costoAdicional: 0,
                    esHardLimit: true,
                    detalle: {
                        usuariosActuales,
                        usuariosIncluidos,
                        maxUsuariosHard: limiteHard,
                        planNombre: suscripcion.plan_nombre
                    }
                };
            }

            // Plan de pago: verificar hard limit si existe
            if (maxUsuariosHard && usuariosDespues > maxUsuariosHard) {
                return {
                    puedeCrear: false,
                    advertencia: `Tu plan permite máximo ${maxUsuariosHard} usuarios.`,
                    costoAdicional: 0,
                    esHardLimit: true,
                    detalle: {
                        usuariosActuales,
                        usuariosIncluidos,
                        maxUsuariosHard,
                        planNombre: suscripcion.plan_nombre
                    }
                };
            }

            // Soft limit: puede crear pero con advertencia de costo
            const usuariosExtraActuales = Math.max(0, usuariosActuales - usuariosIncluidos);
            const usuariosExtraDespues = Math.max(0, usuariosDespues - usuariosIncluidos);
            const nuevosUsuariosExtra = usuariosExtraDespues - usuariosExtraActuales;

            let advertencia = null;
            let costoAdicional = 0;

            if (nuevosUsuariosExtra > 0 && precioUsuarioAdicional) {
                costoAdicional = nuevosUsuariosExtra * precioUsuarioAdicional;
                advertencia = `Se agregarán $${costoAdicional.toFixed(2)} MXN/mes a tu próxima factura por ${nuevosUsuariosExtra} usuario(s) adicional(es).`;
            }

            return {
                puedeCrear: true,
                advertencia,
                costoAdicional,
                esHardLimit: false,
                detalle: {
                    usuariosActuales,
                    usuariosIncluidos,
                    maxUsuariosHard,
                    precioUsuarioAdicional,
                    usuariosExtraActuales,
                    usuariosExtraDespues,
                    planNombre: suscripcion.plan_nombre
                }
            };
        });
    }

    /**
     * Obtener resumen de uso de usuarios para UI
     *
     * @param {number} suscripcionId - ID de la suscripción
     * @returns {Promise<Object>} - Resumen completo de uso
     */
    static async obtenerResumenUso(suscripcionId) {
        return await RLSContextManager.withBypass(async (db) => {
            // Obtener suscripción con plan y organización vinculada (Platform Billing)
            const suscQuery = `
                SELECT
                    s.id, s.organizacion_id, s.estado,
                    s.usuarios_max_periodo, s.usuarios_contratados,
                    s.precio_usuario_snapshot, s.ajuste_pendiente,
                    s.fecha_proximo_cobro,
                    p.usuarios_incluidos, p.precio_usuario_adicional, p.max_usuarios_hard,
                    p.nombre as plan_nombre,
                    c.organizacion_vinculada_id
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                WHERE s.id = $1
            `;
            const suscResult = await db.query(suscQuery, [suscripcionId]);
            const suscripcion = suscResult.rows[0];

            if (!suscripcion) {
                throw new Error(`Suscripción ${suscripcionId} no encontrada`);
            }

            // Usar organización vinculada (Platform Billing) o propietaria (Customer Billing)
            const orgIdParaConteo = suscripcion.organizacion_vinculada_id || suscripcion.organizacion_id;

            // Contar usuarios actuales
            const countQuery = `
                SELECT COUNT(*)::int as total
                FROM usuarios
                WHERE organizacion_id = $1 AND activo = true
            `;
            const countResult = await db.query(countQuery, [orgIdParaConteo]);
            const usuariosActuales = countResult.rows[0]?.total || 0;

            const usuariosIncluidos = suscripcion.usuarios_incluidos || 5;
            const usuariosMaxPeriodo = suscripcion.usuarios_max_periodo || 0;
            const precioUsuarioAdicional = suscripcion.precio_usuario_adicional || 0;
            const maxUsuariosHard = suscripcion.max_usuarios_hard;

            // Calcular uso
            const usuariosExtra = Math.max(0, usuariosActuales - usuariosIncluidos);
            const porcentajeUso = maxUsuariosHard
                ? Math.round((usuariosActuales / maxUsuariosHard) * 100)
                : Math.round((usuariosActuales / usuariosIncluidos) * 100);

            // Proyección de cobro adicional
            const usuariosExtraParaCobro = Math.max(0, usuariosMaxPeriodo - usuariosIncluidos);
            const cobroAdicionalProyectado = usuariosExtraParaCobro * precioUsuarioAdicional;

            // Determinar estado visual
            let estadoUso = 'normal';
            if (porcentajeUso >= 100) {
                estadoUso = 'excedido';
            } else if (porcentajeUso >= 80) {
                estadoUso = 'advertencia';
            }

            return {
                // Datos actuales
                usuariosActuales,
                usuariosIncluidos,
                usuariosExtra,
                maxUsuariosHard,
                porcentajeUso,
                estadoUso,

                // Datos del período
                usuariosMaxPeriodo,
                usuariosContratados: suscripcion.usuarios_contratados || 0,

                // Precios
                precioUsuarioAdicional,
                cobroAdicionalProyectado,
                ajustePendiente: parseFloat(suscripcion.ajuste_pendiente) || 0,

                // Contexto
                planNombre: suscripcion.plan_nombre,
                fechaProximoCobro: suscripcion.fecha_proximo_cobro,
                estado: suscripcion.estado,

                // Para UI
                puedeAgregarUsuarios: !maxUsuariosHard || usuariosActuales < maxUsuariosHard,
                tieneCobroAdicional: cobroAdicionalProyectado > 0,
                esHardLimit: !!maxUsuariosHard && !precioUsuarioAdicional
            };
        });
    }

    /**
     * Obtener historial de uso de usuarios del período actual
     *
     * @param {number} suscripcionId - ID de la suscripción
     * @param {number} diasAtras - Días hacia atrás (default 30)
     * @returns {Promise<Array>} - Historial diario de uso
     */
    static async obtenerHistorialUso(suscripcionId, diasAtras = 30) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    fecha, usuarios_activos, usuarios_incluidos,
                    GREATEST(0, usuarios_activos - usuarios_incluidos) as usuarios_extra
                FROM uso_usuarios_org
                WHERE suscripcion_id = $1
                  AND fecha >= CURRENT_DATE - $2
                ORDER BY fecha DESC
            `;
            const result = await db.query(query, [suscripcionId, diasAtras]);
            return result.rows;
        });
    }

    /**
     * Resetear máximo de usuarios del período (después de un cobro)
     *
     * @param {number} suscripcionId - ID de la suscripción
     * @returns {Promise<void>}
     */
    static async resetearMaximoPeriodo(suscripcionId) {
        return await RLSContextManager.withBypass(async (db) => {
            // Guardar el máximo actual como usuarios_contratados
            await db.query(`
                UPDATE suscripciones_org
                SET usuarios_contratados = usuarios_max_periodo,
                    usuarios_max_periodo = 0,
                    ajuste_pendiente = 0,
                    actualizado_en = NOW()
                WHERE id = $1
            `, [suscripcionId]);

            logger.info(`Suscripción ${suscripcionId}: Máximo del período reseteado`);
        });
    }

    /**
     * Registrar ajuste de facturación por usuarios adicionales
     *
     * @param {Object} params - Parámetros del ajuste
     * @param {number} params.organizacionId - ID de la organización
     * @param {number} params.suscripcionId - ID de la suscripción
     * @param {number} params.pagoId - ID del pago (opcional)
     * @param {number} params.monto - Monto del ajuste
     * @param {number} params.usuariosBase - Usuarios incluidos en el plan
     * @param {number} params.usuariosFacturados - Usuarios facturados (máximo del período)
     * @param {number} params.precioUnitario - Precio por usuario adicional
     * @returns {Promise<Object>} - Ajuste registrado
     */
    static async registrarAjusteUsuarios(params) {
        const {
            organizacionId,
            suscripcionId,
            pagoId = null,
            monto,
            usuariosBase,
            usuariosFacturados,
            precioUnitario
        } = params;

        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                INSERT INTO ajustes_facturacion_org (
                    organizacion_id, suscripcion_id, pago_id,
                    tipo, monto, descripcion,
                    usuarios_base, usuarios_facturados, precio_unitario
                ) VALUES ($1, $2, $3, 'usuario_adicional', $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const descripcion = `Cobro por ${usuariosFacturados - usuariosBase} usuarios adicionales`;

            const result = await db.query(query, [
                organizacionId,
                suscripcionId,
                pagoId,
                monto,
                descripcion,
                usuariosBase,
                usuariosFacturados,
                precioUnitario
            ]);

            logger.info(`Ajuste registrado: Suscripción ${suscripcionId}, $${monto} por usuarios adicionales`);

            return result.rows[0];
        });
    }

    /**
     * Obtener resumen de uso para una organización (por organizacionId)
     * Alternativa a obtenerResumenUso cuando solo se tiene el ID de organización
     *
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} - Resumen de uso o null si no hay suscripción
     */
    static async obtenerResumenUsoPorOrganizacion(organizacionId) {
        return await RLSContextManager.withBypass(async (db) => {
            // Buscar suscripción activa de la organización
            const suscQuery = `
                SELECT s.id
                FROM suscripciones_org s
                INNER JOIN clientes c ON s.cliente_id = c.id
                WHERE c.organizacion_vinculada_id = $1
                  AND s.estado IN ('activa', 'trial', 'grace_period')
                ORDER BY
                    CASE s.estado WHEN 'activa' THEN 1 WHEN 'trial' THEN 2 ELSE 3 END
                LIMIT 1
            `;
            const suscResult = await db.query(suscQuery, [organizacionId]);

            if (!suscResult.rows[0]) {
                return null;
            }

            return this.obtenerResumenUso(suscResult.rows[0].id);
        });
    }
}

module.exports = UsageTrackingService;
