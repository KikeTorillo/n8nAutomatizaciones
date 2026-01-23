/**
 * ====================================================================
 * MODEL: SUSCRIPCIONES
 * ====================================================================
 * Gestión de suscripciones de clientes a planes.
 * Incluye operaciones de cambio de estado, plan, cobros, etc.
 *
 * @module models/suscripciones
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper, ParseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');
const { NEXO_TEAM_ORG_ID, FEATURE_TO_MODULO, MODULOS_BASE } = require('../../../config/constants');

class SuscripcionesModel {

    /**
     * Listar suscripciones con paginación y filtros
     *
     * @param {Object} options - Opciones de filtrado y paginación
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - {items, paginacion}
     */
    static async listar(options = {}, organizacionId) {
        const {
            page = 1,
            limit = 20,
            estado,
            plan_id,
            cliente_id,
            gateway,
            busqueda
        } = options;

        const { offset } = ParseHelper.parsePagination({ page, limit });

        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = [];
            let params = [];
            let paramCount = 1;

            // Filtros
            if (estado) {
                whereConditions.push(`s.estado = $${paramCount++}`);
                params.push(estado);
            }

            if (plan_id) {
                whereConditions.push(`s.plan_id = $${paramCount++}`);
                params.push(plan_id);
            }

            if (cliente_id) {
                whereConditions.push(`s.cliente_id = $${paramCount++}`);
                params.push(cliente_id);
            }

            if (gateway) {
                whereConditions.push(`s.gateway = $${paramCount++}`);
                params.push(gateway);
            }

            // Búsqueda por nombre de cliente o suscriptor externo
            if (busqueda) {
                whereConditions.push(`(
                    c.nombre ILIKE $${paramCount} OR
                    c.email ILIKE $${paramCount} OR
                    s.suscriptor_externo->>'nombre' ILIKE $${paramCount} OR
                    s.suscriptor_externo->>'email' ILIKE $${paramCount}
                )`);
                params.push(`%${busqueda}%`);
                paramCount++;
            }

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            // Query de conteo
            const countQuery = `
                SELECT COUNT(*) as total
                FROM suscripciones_org s
                LEFT JOIN clientes c ON s.cliente_id = c.id
                ${whereClause}
            `;

            const countResult = await db.query(countQuery, params);
            const total = parseInt(countResult.rows[0].total);

            // Query principal
            const query = `
                SELECT
                    s.id, s.plan_id, s.cliente_id,
                    s.suscriptor_externo,
                    s.periodo, s.estado,
                    s.fecha_inicio, s.fecha_proximo_cobro, s.fecha_fin,
                    s.es_trial, s.fecha_fin_trial,
                    s.gateway, s.precio_actual, s.moneda,
                    s.auto_cobro, s.meses_activo, s.total_pagado,
                    s.creado_en, s.actualizado_en,
                    p.nombre as plan_nombre,
                    p.codigo as plan_codigo,
                    c.nombre as cliente_nombre,
                    c.email as cliente_email
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                ${whereClause}
                ORDER BY s.creado_en DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            params.push(limit, offset);

            const result = await db.query(query, params);

            return {
                items: result.rows,
                paginacion: {
                    total,
                    pagina: parseInt(page),
                    limite: parseInt(limit),
                    paginas: Math.ceil(total / limit)
                }
            };
        });
    }

    /**
     * Buscar suscripción por ID
     *
     * @param {number} id - ID de la suscripción
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} - Suscripción encontrada o null
     */
    static async buscarPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    s.*,
                    p.nombre as plan_nombre,
                    p.codigo as plan_codigo,
                    c.nombre as cliente_nombre,
                    c.email as cliente_email
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                WHERE s.id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Crear nueva suscripción
     *
     * @param {Object} suscripcionData - Datos de la suscripción
     * @param {number} organizacionId - ID de la organización
     * @param {number} creadoPorId - ID del usuario que crea
     * @returns {Promise<Object>} - Suscripción creada
     */
    static async crear(suscripcionData, organizacionId, creadoPorId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const {
                plan_id,
                cliente_id,
                suscriptor_externo,
                periodo = 'mensual',
                es_trial = false,
                gateway,
                customer_id_gateway,
                subscription_id_gateway,
                payment_method_id,
                cupon_codigo
            } = suscripcionData;

            // Validar que tenga cliente_id O suscriptor_externo
            if (!cliente_id && !suscriptor_externo) {
                ErrorHelper.throwValidation('Debe proporcionar cliente_id o suscriptor_externo');
            }

            // Obtener plan
            const planQuery = `SELECT * FROM planes_suscripcion_org WHERE id = $1`;
            const planResult = await db.query(planQuery, [plan_id]);
            const plan = planResult.rows[0];

            ErrorHelper.throwIfNotFound(plan, 'Plan de suscripción');

            // Calcular precio según período
            let precioActual;
            switch (periodo) {
                case 'mensual':
                    precioActual = plan.precio_mensual;
                    break;
                case 'trimestral':
                    precioActual = plan.precio_trimestral || plan.precio_mensual * 3;
                    break;
                case 'semestral':
                    precioActual = (plan.precio_mensual * 6); // Asumimos precio mensual * 6
                    break;
                case 'anual':
                    precioActual = plan.precio_anual || plan.precio_mensual * 12;
                    break;
                default:
                    precioActual = plan.precio_mensual;
            }

            // Aplicar cupón si existe
            let cuponAplicadoId = null;
            let descuentoPorcentaje = null;
            let descuentoMonto = null;

            if (cupon_codigo) {
                const cuponQuery = `
                    SELECT * FROM cupones_suscripcion
                    WHERE codigo = $1 AND activo = TRUE
                      AND fecha_inicio <= CURRENT_DATE
                      AND (fecha_expiracion IS NULL OR fecha_expiracion >= CURRENT_DATE)
                      AND (usos_maximos IS NULL OR usos_actuales < usos_maximos)
                `;
                const cuponResult = await db.query(cuponQuery, [cupon_codigo]);
                const cupon = cuponResult.rows[0];

                if (cupon) {
                    cuponAplicadoId = cupon.id;

                    if (cupon.tipo_descuento === 'porcentaje') {
                        descuentoPorcentaje = cupon.porcentaje_descuento;
                        descuentoMonto = (precioActual * cupon.porcentaje_descuento) / 100;
                    } else {
                        descuentoMonto = cupon.monto_descuento;
                    }

                    // Incrementar uso del cupón
                    await db.query(
                        `UPDATE cupones_suscripcion SET usos_actuales = usos_actuales + 1 WHERE id = $1`,
                        [cupon.id]
                    );
                }
            }

            // Calcular fechas
            const fechaInicio = new Date();
            let fechaFinTrial = null;
            let fechaProximoCobro;

            if (es_trial && plan.dias_trial > 0) {
                fechaFinTrial = new Date();
                fechaFinTrial.setDate(fechaFinTrial.getDate() + plan.dias_trial);
                fechaProximoCobro = fechaFinTrial;
            } else {
                fechaProximoCobro = this._calcularProximoCobro(fechaInicio, periodo);
            }

            // Crear suscripción
            const insertQuery = `
                INSERT INTO suscripciones_org (
                    organizacion_id, plan_id, cliente_id, suscriptor_externo,
                    periodo, estado,
                    fecha_inicio, fecha_proximo_cobro,
                    es_trial, fecha_fin_trial,
                    gateway, customer_id_gateway, subscription_id_gateway, payment_method_id,
                    precio_actual, moneda,
                    cupon_aplicado_id, descuento_porcentaje, descuento_monto,
                    creado_por
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
                )
                RETURNING *
            `;

            const values = [
                organizacionId,
                plan_id,
                cliente_id,
                suscriptor_externo ? JSON.stringify(suscriptor_externo) : null,
                periodo,
                es_trial ? 'trial' : 'activa',
                fechaInicio,
                fechaProximoCobro,
                es_trial,
                fechaFinTrial,
                gateway,
                customer_id_gateway,
                subscription_id_gateway,
                payment_method_id,
                precioActual,
                plan.moneda,
                cuponAplicadoId,
                descuentoPorcentaje,
                descuentoMonto,
                creadoPorId
            ];

            const result = await db.query(insertQuery, values);

            logger.info(`Suscripción creada: ID ${result.rows[0].id} en org ${organizacionId}`);

            return result.rows[0];
        });
    }

    /**
     * Cambiar estado de suscripción
     *
     * @param {number} id - ID de la suscripción
     * @param {string} nuevoEstado - Nuevo estado (trial, activa, pausada, cancelada, vencida, suspendida)
     * @param {number} organizacionId - ID de la organización
     * @param {Object} options - Opciones adicionales (razon, usuario_id)
     * @returns {Promise<Object>} - Suscripción actualizada
     */
    static async cambiarEstado(id, nuevoEstado, organizacionId, options = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const suscripcion = await this.buscarPorId(id, organizacionId);
            ErrorHelper.throwIfNotFound(suscripcion, 'Suscripción');

            const estadosValidos = ['trial', 'pendiente_pago', 'activa', 'pausada', 'cancelada', 'vencida', 'suspendida'];
            if (!estadosValidos.includes(nuevoEstado)) {
                ErrorHelper.throwValidation(`Estado inválido: ${nuevoEstado}`);
            }

            const updates = ['estado = $1', 'actualizado_en = NOW()'];
            const values = [nuevoEstado];
            let paramCount = 2;

            // Si se cancela, guardar fecha_fin y razón
            if (nuevoEstado === 'cancelada') {
                updates.push(`fecha_fin = CURRENT_DATE`);
                if (options.razon) {
                    updates.push(`razon_cancelacion = $${paramCount++}`);
                    values.push(options.razon);
                }
                if (options.usuario_id) {
                    updates.push(`cancelado_por = $${paramCount++}`);
                    values.push(options.usuario_id);
                }
            }

            values.push(id);

            const query = `
                UPDATE suscripciones_org
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await db.query(query, values);

            logger.info(`Suscripción ${id} cambió a estado: ${nuevoEstado}`);

            return result.rows[0];
        });
    }

    /**
     * Cambiar plan de suscripción (upgrade/downgrade)
     *
     * @param {number} id - ID de la suscripción
     * @param {number} nuevoPlanId - ID del nuevo plan
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - Suscripción actualizada
     */
    static async cambiarPlan(id, nuevoPlanId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const suscripcion = await this.buscarPorId(id, organizacionId);
            ErrorHelper.throwIfNotFound(suscripcion, 'Suscripción');

            // Obtener nuevo plan
            const planQuery = `SELECT * FROM planes_suscripcion_org WHERE id = $1`;
            const planResult = await db.query(planQuery, [nuevoPlanId]);
            const nuevoPlan = planResult.rows[0];

            ErrorHelper.throwIfNotFound(nuevoPlan, 'Plan de suscripción');

            // Calcular nuevo precio según período actual
            let nuevoPrecio;
            switch (suscripcion.periodo) {
                case 'mensual':
                    nuevoPrecio = nuevoPlan.precio_mensual;
                    break;
                case 'trimestral':
                    nuevoPrecio = nuevoPlan.precio_trimestral || nuevoPlan.precio_mensual * 3;
                    break;
                case 'semestral':
                    nuevoPrecio = nuevoPlan.precio_mensual * 6;
                    break;
                case 'anual':
                    nuevoPrecio = nuevoPlan.precio_anual || nuevoPlan.precio_mensual * 12;
                    break;
            }

            // Actualizar suscripción
            const updateQuery = `
                UPDATE suscripciones_org
                SET plan_id = $1,
                    precio_actual = $2,
                    actualizado_en = NOW()
                WHERE id = $3
                RETURNING *
            `;

            const result = await db.query(updateQuery, [nuevoPlanId, nuevoPrecio, id]);

            logger.info(`Suscripción ${id} cambió de plan ${suscripcion.plan_id} a ${nuevoPlanId}`);

            return result.rows[0];
        });
    }

    /**
     * Obtener suscripciones pendientes de cobro para una fecha
     *
     * @param {string} fecha - Fecha en formato YYYY-MM-DD
     * @param {number} organizacionId - ID de la organización (opcional, para filtrar)
     * @returns {Promise<Array>} - Array de suscripciones a cobrar
     */
    static async obtenerParaCobro(fecha, organizacionId = null) {
        const queryFn = async (db) => {
            let query = `
                SELECT
                    s.*,
                    p.nombre as plan_nombre,
                    c.nombre as cliente_nombre,
                    c.email as cliente_email
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                WHERE s.fecha_proximo_cobro = $1
                  AND s.estado IN ('activa', 'trial')
                  AND s.auto_cobro = TRUE
            `;

            const params = [fecha];

            if (organizacionId) {
                query += ` AND s.organizacion_id = $2`;
                params.push(organizacionId);
            }

            query += ` ORDER BY s.id ASC`;

            const result = await db.query(query, params);
            return result.rows;
        };

        if (organizacionId) {
            return await RLSContextManager.query(organizacionId, queryFn);
        } else {
            // Sin RLS para el cron job que procesa todas las orgs
            return await RLSContextManager.withBypass(queryFn);
        }
    }

    /**
     * Registrar cobro exitoso y actualizar próxima fecha
     *
     * @param {number} id - ID de la suscripción
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - Suscripción actualizada
     */
    static async procesarCobroExitoso(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const suscripcion = await this.buscarPorId(id, organizacionId);
            ErrorHelper.throwIfNotFound(suscripcion, 'Suscripción');

            const nuevaFechaProximoCobro = this._calcularProximoCobro(
                new Date(suscripcion.fecha_proximo_cobro),
                suscripcion.periodo
            );

            // Si era trial, cambiar a activa
            const nuevoEstado = suscripcion.es_trial ? 'activa' : suscripcion.estado;

            const query = `
                UPDATE suscripciones_org
                SET fecha_proximo_cobro = $1,
                    estado = $2,
                    es_trial = FALSE,
                    meses_activo = meses_activo + 1,
                    actualizado_en = NOW()
                WHERE id = $3
                RETURNING *
            `;

            const result = await db.query(query, [nuevaFechaProximoCobro, nuevoEstado, id]);

            logger.info(`Cobro exitoso procesado para suscripción ${id}`);

            // Si era trial, activar módulos en organización vinculada (dogfooding)
            if (suscripcion.es_trial) {
                await this.actualizarOrgVinculadaAlActivar(id, organizacionId);
            }

            return result.rows[0];
        });
    }

    /**
     * Actualizar la organización vinculada cuando se activa una suscripción
     * (Fase 6 del plan Dogfooding)
     *
     * Esta función se llama cuando una suscripción trial se convierte en activa.
     * Mapea los features del plan a módulos y los activa en la organización vinculada.
     *
     * @param {number} suscripcionId - ID de la suscripción
     * @param {number} organizacionId - ID de la organización dueña (Nexo Team)
     * @returns {Promise<number|null>} - ID de la org vinculada actualizada o null
     */
    static async actualizarOrgVinculadaAlActivar(suscripcionId, organizacionId) {
        try {
            // Solo aplica para suscripciones de Nexo Team (org que gestiona la plataforma)
            if (organizacionId !== NEXO_TEAM_ORG_ID) {
                return null;
            }

            return await RLSContextManager.withBypass(async (db) => {
                // 1. Obtener suscripción con cliente y plan
                const suscQuery = `
                    SELECT s.id, s.cliente_id, s.plan_id,
                           c.organizacion_vinculada_id,
                           p.codigo, p.features
                    FROM suscripciones_org s
                    LEFT JOIN clientes c ON s.cliente_id = c.id AND c.organizacion_id = $2
                    INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                    WHERE s.id = $1 AND s.organizacion_id = $2
                `;
                const suscResult = await db.query(suscQuery, [suscripcionId, organizacionId]);
                const suscripcion = suscResult.rows[0];

                if (!suscripcion?.organizacion_vinculada_id) {
                    // Cliente externo (sin org vinculada) - no aplica
                    logger.info(`Suscripción ${suscripcionId}: Cliente sin organización vinculada, saltando actualización`);
                    return null;
                }

                const orgVinculadaId = suscripcion.organizacion_vinculada_id;
                const planCodigo = suscripcion.codigo || 'pro';
                const features = suscripcion.features || [];

                // 2. Mapear features → módulos
                const modulosActivos = { ...MODULOS_BASE }; // Siempre incluye core: true

                features.forEach(feature => {
                    const modulo = FEATURE_TO_MODULO[feature];
                    if (modulo) {
                        modulosActivos[modulo] = true;
                    }
                });

                // 3. Actualizar organización vinculada
                const updateQuery = `
                    UPDATE organizaciones
                    SET plan_actual = $2,
                        modulos_activos = $3,
                        actualizado_en = NOW()
                    WHERE id = $1
                    RETURNING id, plan_actual, modulos_activos
                `;

                const updateResult = await db.query(updateQuery, [
                    orgVinculadaId,
                    planCodigo,
                    JSON.stringify(modulosActivos)
                ]);

                if (updateResult.rows[0]) {
                    logger.info(`Dogfooding: Org ${orgVinculadaId} actualizada a plan '${planCodigo}' con módulos: ${Object.keys(modulosActivos).join(', ')}`);
                }

                return orgVinculadaId;
            });

        } catch (error) {
            logger.error(`Error actualizando org vinculada para suscripción ${suscripcionId}:`, error);
            // No lanzar error para no interrumpir el flujo de cobro
            return null;
        }
    }

    /**
     * Registrar fallo de cobro
     *
     * @param {number} id - ID de la suscripción
     * @param {string} error - Mensaje de error
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - Suscripción actualizada
     */
    static async registrarFalloCobro(id, error, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE suscripciones_org
                SET estado = 'vencida',
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [id]);

            logger.warn(`Fallo de cobro para suscripción ${id}: ${error}`);

            return result.rows[0];
        });
    }

    /**
     * Calcular próxima fecha de cobro según período
     * @private
     */
    static _calcularProximoCobro(fechaActual, periodo) {
        const fecha = new Date(fechaActual);

        switch (periodo) {
            case 'mensual':
                fecha.setMonth(fecha.getMonth() + 1);
                break;
            case 'trimestral':
                fecha.setMonth(fecha.getMonth() + 3);
                break;
            case 'semestral':
                fecha.setMonth(fecha.getMonth() + 6);
                break;
            case 'anual':
                fecha.setFullYear(fecha.getFullYear() + 1);
                break;
        }

        return fecha;
    }

    /**
     * Crear suscripción en estado pendiente_pago (para checkout)
     *
     * @param {Object} suscripcionData - Datos de la suscripción
     * @param {number} organizacionId - ID de la organización
     * @param {number} creadoPorId - ID del usuario que crea
     * @returns {Promise<Object>} - Suscripción creada
     */
    static async crearPendiente(suscripcionData, organizacionId, creadoPorId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                plan_id,
                cliente_id,
                suscriptor_externo,
                periodo = 'mensual',
                precio_actual,
                gateway,
                cupon_aplicado_id,
                descuento_porcentaje,
                descuento_monto
            } = suscripcionData;

            // Validar que tenga cliente_id O suscriptor_externo
            if (!cliente_id && !suscriptor_externo) {
                ErrorHelper.throwValidation('Debe proporcionar cliente_id o suscriptor_externo');
            }

            // Obtener plan para moneda
            const planQuery = `SELECT * FROM planes_suscripcion_org WHERE id = $1`;
            const planResult = await db.query(planQuery, [plan_id]);
            const plan = planResult.rows[0];

            ErrorHelper.throwIfNotFound(plan, 'Plan de suscripción');

            // Crear suscripción en estado pendiente_pago
            const insertQuery = `
                INSERT INTO suscripciones_org (
                    organizacion_id, plan_id, cliente_id, suscriptor_externo,
                    periodo, estado,
                    fecha_inicio, fecha_proximo_cobro,
                    es_trial, gateway,
                    precio_actual, moneda,
                    cupon_aplicado_id, descuento_porcentaje, descuento_monto,
                    auto_cobro, creado_por
                ) VALUES (
                    $1, $2, $3, $4, $5, 'pendiente_pago', NOW(), NULL,
                    FALSE, $6, $7, $8, $9, $10, $11, TRUE, $12
                )
                RETURNING *
            `;

            const values = [
                organizacionId,
                plan_id,
                cliente_id,
                suscriptor_externo ? JSON.stringify(suscriptor_externo) : null,
                periodo,
                gateway,
                precio_actual,
                plan.moneda || 'MXN',
                cupon_aplicado_id,
                descuento_porcentaje,
                descuento_monto,
                creadoPorId
            ];

            const result = await db.query(insertQuery, values);

            logger.info(`Suscripción pendiente creada: ID ${result.rows[0].id} en org ${organizacionId}`);

            return result.rows[0];
        });
    }

    /**
     * Actualizar IDs del gateway de pago
     *
     * @param {number} id - ID de la suscripción
     * @param {Object} gatewayIds - { subscription_id_gateway, customer_id_gateway, payment_method_id }
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - Suscripción actualizada
     */
    static async actualizarGatewayIds(id, gatewayIds, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                subscription_id_gateway,
                customer_id_gateway,
                payment_method_id
            } = gatewayIds;

            const updates = [];
            const values = [];
            let paramCount = 1;

            if (subscription_id_gateway !== undefined) {
                updates.push(`subscription_id_gateway = $${paramCount++}`);
                values.push(subscription_id_gateway);
            }
            if (customer_id_gateway !== undefined) {
                updates.push(`customer_id_gateway = $${paramCount++}`);
                values.push(customer_id_gateway);
            }
            if (payment_method_id !== undefined) {
                updates.push(`payment_method_id = $${paramCount++}`);
                values.push(payment_method_id);
            }

            if (updates.length === 0) {
                return await this.buscarPorId(id, organizacionId);
            }

            updates.push(`actualizado_en = NOW()`);
            values.push(id);

            const query = `
                UPDATE suscripciones_org
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Buscar suscripción por ID del gateway
     *
     * @param {string} subscriptionIdGateway - ID de suscripción en el gateway
     * @param {number} organizacionId - ID de la organización (opcional para búsqueda global)
     * @returns {Promise<Object|null>} - Suscripción encontrada o null
     */
    static async buscarPorGatewayId(subscriptionIdGateway, organizacionId = null) {
        const queryFn = async (db) => {
            const query = `
                SELECT
                    s.*,
                    p.nombre as plan_nombre,
                    p.codigo as plan_codigo,
                    c.nombre as cliente_nombre,
                    c.email as cliente_email
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                WHERE s.subscription_id_gateway = $1
            `;

            const result = await db.query(query, [subscriptionIdGateway]);
            return result.rows[0] || null;
        };

        if (organizacionId) {
            return await RLSContextManager.query(organizacionId, queryFn);
        } else {
            return await RLSContextManager.withBypass(queryFn);
        }
    }

    /**
     * Cancelar suscripción
     *
     * @param {number} id - ID de la suscripción
     * @param {string} razon - Razón de cancelación
     * @param {number} organizacionId - ID de la organización
     * @param {number} usuarioId - ID del usuario que cancela
     * @returns {Promise<Object>} - Suscripción cancelada
     */
    static async cancelar(id, razon, organizacionId, usuarioId) {
        return this.cambiarEstado(id, 'cancelada', organizacionId, { razon, usuario_id: usuarioId });
    }

    /**
     * Pausar suscripción
     *
     * @param {number} id - ID de la suscripción
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - Suscripción pausada
     */
    static async pausar(id, organizacionId) {
        return this.cambiarEstado(id, 'pausada', organizacionId);
    }

    /**
     * Reactivar suscripción pausada
     *
     * @param {number} id - ID de la suscripción
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} - Suscripción reactivada
     */
    static async reactivar(id, organizacionId) {
        return this.cambiarEstado(id, 'activa', organizacionId);
    }
}

module.exports = SuscripcionesModel;
