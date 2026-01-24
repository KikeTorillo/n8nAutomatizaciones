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
     * Matriz de transiciones de estado válidas
     */
    static TRANSICIONES_VALIDAS = {
        'trial': ['activa', 'cancelada', 'vencida', 'pendiente_pago'],
        'pendiente_pago': ['activa', 'cancelada', 'vencida'],
        'activa': ['pausada', 'cancelada', 'vencida', 'suspendida'],
        'pausada': ['activa', 'cancelada'],
        'cancelada': [], // Estado final
        'vencida': ['activa', 'suspendida'],
        'suspendida': ['activa', 'cancelada']
    };

    /**
     * Verificar si una transición de estado es válida
     * @private
     */
    static _esTransicionValida(estadoActual, nuevoEstado) {
        if (estadoActual === nuevoEstado) return true;
        const permitidas = this.TRANSICIONES_VALIDAS[estadoActual] || [];
        return permitidas.includes(nuevoEstado);
    }

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

            // Validar transición permitida
            if (!this._esTransicionValida(suscripcion.estado, nuevoEstado)) {
                ErrorHelper.throwValidation(
                    `Transición no permitida: ${suscripcion.estado} → ${nuevoEstado}`
                );
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

            // Validar que no sea el mismo plan
            if (suscripcion.plan_id === nuevoPlanId) {
                ErrorHelper.throwValidation('Ya tienes este plan activo');
            }

            // Obtener nuevo plan
            const planQuery = `SELECT * FROM planes_suscripcion_org WHERE id = $1`;
            const planResult = await db.query(planQuery, [nuevoPlanId]);
            const nuevoPlan = planResult.rows[0];

            ErrorHelper.throwIfNotFound(nuevoPlan, 'Plan de suscripción');

            // ═══════════════════════════════════════════════════════════════
            // Cancelar suscripciones existentes del plan destino
            // (para evitar conflicto con índice único)
            // ═══════════════════════════════════════════════════════════════
            const cancelarQuery = `
                UPDATE suscripciones_org
                SET estado = 'cancelada',
                    fecha_fin = CURRENT_DATE,
                    actualizado_en = NOW()
                WHERE cliente_id = $1
                  AND plan_id = $2
                  AND id != $3
                  AND estado IN ('trial', 'pendiente_pago', 'pausada')
            `;
            const cancelResult = await db.query(cancelarQuery, [
                suscripcion.cliente_id,
                nuevoPlanId,
                id
            ]);

            if (cancelResult.rowCount > 0) {
                logger.info(`Canceladas ${cancelResult.rowCount} suscripciones anteriores del plan ${nuevoPlanId} para cliente ${suscripcion.cliente_id}`);
            }

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
                moneda = 'MXN', // Aceptar moneda directamente para evitar buscar plan de nuevo
                gateway,
                cupon_aplicado_id,
                descuento_porcentaje,
                descuento_monto
            } = suscripcionData;

            // Validar que tenga cliente_id O suscriptor_externo
            if (!cliente_id && !suscriptor_externo) {
                ErrorHelper.throwValidation('Debe proporcionar cliente_id o suscriptor_externo');
            }

            // Usar moneda proporcionada o default
            const monedaFinal = moneda || 'MXN';

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
                monedaFinal,
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
        // NOTA: Usamos withBypass porque:
        // 1. El subscription_id_gateway es único globalmente
        // 2. Los planes pertenecen a Nexo Team (org 1) pero las suscripciones a clientes (org N)
        // 3. Con RLS, el JOIN con planes falla si la org del usuario != org del plan
        const queryFn = async (db) => {
            let query = `
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
            const params = [subscriptionIdGateway];

            // Si se proporciona organizacionId, filtramos por la org de la suscripción
            if (organizacionId) {
                query += ` AND s.organizacion_id = $2`;
                params.push(organizacionId);
            }

            const result = await db.query(query, params);
            return result.rows[0] || null;
        };

        // Siempre usar bypass porque los planes están en org diferente
        return await RLSContextManager.withBypass(queryFn);
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

    /**
     * Buscar suscripciones pendientes que tengan gateway ID (para polling)
     *
     * Usado por el job de polling para verificar estado de suscripciones
     * que están en pendiente_pago pero ya tienen subscription_id_gateway.
     *
     * @param {number} organizacionId - ID de la organización (Nexo Team)
     * @returns {Promise<Array>} - Lista de suscripciones pendientes con gateway
     */
    /**
     * Buscar suscripciones pendientes con gateway ID (para polling)
     * NOTA: Usa withBypass porque las suscripciones pueden pertenecer a diferentes organizaciones
     * pero el polling debe poder verlas todas para sincronizar estados con MercadoPago.
     *
     * @returns {Promise<Array>} - Suscripciones pendientes
     */
    static async buscarPendientesConGateway() {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                SELECT
                    s.id,
                    s.organizacion_id,
                    s.subscription_id_gateway,
                    s.creado_en,
                    s.plan_id,
                    s.estado,
                    s.periodo,
                    s.fecha_proximo_cobro,
                    s.es_trial,
                    s.cliente_id,
                    p.nombre as plan_nombre,
                    p.codigo as plan_codigo,
                    p.features
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                WHERE s.estado = 'pendiente_pago'
                  AND s.subscription_id_gateway IS NOT NULL
                  AND s.creado_en > NOW() - INTERVAL '24 hours'
                ORDER BY s.creado_en ASC
                LIMIT 50
            `);
            return result.rows;
        });
    }

    /**
     * Cambiar estado de suscripción usando bypass RLS
     * SOLO para uso interno del polling/webhooks donde los planes están en org diferente
     *
     * @param {number} id - ID de la suscripción
     * @param {string} nuevoEstado - Nuevo estado
     * @param {Object} options - { razon, usuario_id }
     * @returns {Promise<Object>} - Suscripción actualizada
     */
    static async cambiarEstadoBypass(id, nuevoEstado, options = {}) {
        return await RLSContextManager.withBypass(async (db) => {
            // Obtener estado actual sin JOIN a planes (evita problemas RLS cross-org)
            const suscResult = await db.query(
                `SELECT id, estado, organizacion_id FROM suscripciones_org WHERE id = $1`,
                [id]
            );
            const suscripcion = suscResult.rows[0];

            if (!suscripcion) {
                ErrorHelper.throwNotFound('Suscripción');
            }

            const estadosValidos = ['trial', 'pendiente_pago', 'activa', 'pausada', 'cancelada', 'vencida', 'suspendida'];
            if (!estadosValidos.includes(nuevoEstado)) {
                ErrorHelper.throwValidation(`Estado inválido: ${nuevoEstado}`);
            }

            // Validar transición permitida
            if (!this._esTransicionValida(suscripcion.estado, nuevoEstado)) {
                ErrorHelper.throwValidation(
                    `Transición no permitida: ${suscripcion.estado} → ${nuevoEstado}`
                );
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

            logger.info(`[Bypass] Suscripción ${id} cambió a estado: ${nuevoEstado}`);

            return result.rows[0];
        });
    }

    /**
     * Procesar cobro exitoso usando bypass RLS
     * SOLO para uso interno del polling/webhooks
     *
     * @param {number} id - ID de la suscripción
     * @param {Object} suscripcionData - Datos de la suscripción (evita query adicional)
     * @returns {Promise<Object>} - Suscripción actualizada
     */
    static async procesarCobroExitosoBypass(id, suscripcionData = null) {
        return await RLSContextManager.withBypass(async (db) => {
            // Si no se pasaron datos, obtenerlos
            let suscripcion = suscripcionData;
            if (!suscripcion) {
                const result = await db.query(
                    `SELECT id, estado, periodo, fecha_proximo_cobro, es_trial, organizacion_id, cliente_id, plan_id
                     FROM suscripciones_org WHERE id = $1`,
                    [id]
                );
                suscripcion = result.rows[0];
            }

            if (!suscripcion) {
                ErrorHelper.throwNotFound('Suscripción');
            }

            const nuevaFechaProximoCobro = this._calcularProximoCobro(
                suscripcion.fecha_proximo_cobro ? new Date(suscripcion.fecha_proximo_cobro) : new Date(),
                suscripcion.periodo
            );

            // Si era trial o pendiente_pago, cambiar a activa
            const nuevoEstado = (suscripcion.es_trial || suscripcion.estado === 'pendiente_pago')
                ? 'activa'
                : suscripcion.estado;

            const query = `
                UPDATE suscripciones_org
                SET fecha_proximo_cobro = $1,
                    fecha_inicio = COALESCE(fecha_inicio, NOW()),
                    estado = $2,
                    es_trial = FALSE,
                    meses_activo = meses_activo + 1,
                    actualizado_en = NOW()
                WHERE id = $3
                RETURNING *
            `;

            const result = await db.query(query, [nuevaFechaProximoCobro, nuevoEstado, id]);

            logger.info(`[Bypass] Cobro exitoso procesado para suscripción ${id}`);

            // Si era trial o pendiente_pago, activar módulos en organización vinculada (dogfooding)
            if (suscripcion.es_trial || suscripcion.estado === 'pendiente_pago') {
                await this.actualizarOrgVinculadaAlActivar(id, suscripcion.organizacion_id);
            }

            return result.rows[0];
        });
    }

    /**
     * Buscar suscripción activa de una organización (para página MiPlan)
     *
     * Busca la suscripción activa donde el cliente está vinculado a esta organización.
     * Usado por usuarios para ver su plan actual.
     *
     * @param {number} organizacionId - ID de la organización del usuario
     * @returns {Promise<Object|null>} - Suscripción activa con info del plan
     */
    static async buscarActivaPorOrganizacion(organizacionId) {
        // Necesitamos bypass porque:
        // - Los planes pertenecen a Nexo Team (org 1)
        // - Los clientes pertenecen a Nexo Team pero tienen organizacion_vinculada_id = org del usuario
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    s.id, s.plan_id, s.cliente_id,
                    s.periodo, s.estado,
                    s.fecha_inicio, s.fecha_proximo_cobro, s.fecha_fin,
                    s.es_trial, s.fecha_fin_trial,
                    s.gateway, s.precio_actual, s.moneda,
                    s.meses_activo, s.total_pagado,
                    s.descuento_porcentaje, s.descuento_monto,
                    s.creado_en, s.actualizado_en,
                    p.nombre as plan_nombre,
                    p.codigo as plan_codigo,
                    p.features as plan_features,
                    p.limites as plan_limites,
                    c.nombre as cliente_nombre,
                    c.email as cliente_email
                FROM suscripciones_org s
                INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                LEFT JOIN clientes c ON s.cliente_id = c.id
                WHERE c.organizacion_vinculada_id = $1
                  AND s.estado IN ('activa', 'trial', 'pendiente_pago')
                ORDER BY
                    CASE s.estado
                        WHEN 'activa' THEN 1
                        WHEN 'trial' THEN 2
                        WHEN 'pendiente_pago' THEN 3
                    END,
                    s.creado_en DESC
                LIMIT 1
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Crear suscripción pendiente con bypass RLS
     * Usado por checkout público donde no hay contexto de usuario autenticado
     *
     * @param {Object} suscripcionData - Datos de la suscripción
     * @param {number} organizacionId - ID de la organización vendor
     * @returns {Promise<Object>} - Suscripción creada
     */
    static async crearPendienteBypass(suscripcionData, organizacionId) {
        return await RLSContextManager.withBypass(async (db) => {
            const {
                plan_id,
                cliente_id,
                suscriptor_externo,
                periodo = 'mensual',
                precio_actual,
                moneda = 'MXN',
                gateway,
                cupon_codigo
            } = suscripcionData;

            // Validar que tenga cliente_id O suscriptor_externo
            if (!cliente_id && !suscriptor_externo) {
                ErrorHelper.throwValidation('Debe proporcionar cliente_id o suscriptor_externo');
            }

            // Buscar cupón si se proporciona código
            let cuponAplicadoId = null;
            if (cupon_codigo) {
                const cuponQuery = `
                    SELECT id FROM cupones_suscripcion
                    WHERE codigo = $1 AND organizacion_id = $2 AND activo = TRUE
                `;
                const cuponResult = await db.query(cuponQuery, [cupon_codigo, organizacionId]);
                if (cuponResult.rows[0]) {
                    cuponAplicadoId = cuponResult.rows[0].id;
                }
            }

            const insertQuery = `
                INSERT INTO suscripciones_org (
                    organizacion_id, plan_id, cliente_id, suscriptor_externo,
                    periodo, estado,
                    fecha_inicio, fecha_proximo_cobro,
                    es_trial, gateway,
                    precio_actual, moneda,
                    cupon_aplicado_id, auto_cobro
                ) VALUES (
                    $1, $2, $3, $4, $5, 'pendiente_pago', NOW(), NULL,
                    FALSE, $6, $7, $8, $9, TRUE
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
                moneda,
                cuponAplicadoId
            ];

            const result = await db.query(insertQuery, values);

            logger.info(`[Bypass] Suscripción pendiente creada: ID ${result.rows[0].id} en org ${organizacionId}`);

            return result.rows[0];
        });
    }

    /**
     * Actualizar IDs del gateway usando bypass RLS
     * Usado por checkout público
     *
     * @param {number} id - ID de la suscripción
     * @param {Object} gatewayIds - { subscription_id_gateway, customer_id_gateway, payment_method_id }
     * @returns {Promise<Object>} - Suscripción actualizada
     */
    static async actualizarGatewayIdsBypass(id, gatewayIds) {
        return await RLSContextManager.withBypass(async (db) => {
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
                const result = await db.query(`SELECT * FROM suscripciones_org WHERE id = $1`, [id]);
                return result.rows[0];
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
     * Buscar suscripción activa/pendiente para un cliente y plan específicos
     * Usado para prevenir duplicados en checkout
     *
     * @param {number} clienteId - ID del cliente (puede ser null si es externo)
     * @param {number} planId - ID del plan
     * @param {number} organizacionId - ID de la organización
     * @param {string} emailExterno - Email del suscriptor externo (si no tiene cliente_id)
     * @returns {Promise<Object|null>} - Suscripción existente o null
     */
    static async buscarActivaPorClienteYPlan(clienteId, planId, organizacionId, emailExterno = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const estadosActivos = ['activa', 'trial', 'pendiente_pago', 'pausada'];

            let query;
            let params;

            if (clienteId) {
                // Buscar por cliente_id
                query = `
                    SELECT s.*, p.nombre as plan_nombre, p.codigo as plan_codigo
                    FROM suscripciones_org s
                    INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                    WHERE s.cliente_id = $1
                      AND s.plan_id = $2
                      AND s.estado = ANY($3::text[])
                    ORDER BY s.creado_en DESC
                    LIMIT 1
                `;
                params = [clienteId, planId, estadosActivos];
            } else if (emailExterno) {
                // Buscar por email del suscriptor externo
                query = `
                    SELECT s.*, p.nombre as plan_nombre, p.codigo as plan_codigo
                    FROM suscripciones_org s
                    INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
                    WHERE s.cliente_id IS NULL
                      AND s.suscriptor_externo->>'email' = $1
                      AND s.plan_id = $2
                      AND s.estado = ANY($3::text[])
                    ORDER BY s.creado_en DESC
                    LIMIT 1
                `;
                params = [emailExterno, planId, estadosActivos];
            } else {
                return null; // Sin cliente_id ni email, no se puede buscar
            }

            const result = await db.query(query, params);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener historial de cambios de una suscripción
     * Incluye webhooks recibidos y cambios de estado
     *
     * @param {number} id - ID de la suscripción
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} - Array de eventos del historial
     */
    static async obtenerHistorial(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar que la suscripción existe
            const suscripcion = await db.query(
                'SELECT id, estado, creado_en, fecha_inicio FROM suscripciones_org WHERE id = $1',
                [id]
            );

            if (!suscripcion.rows[0]) {
                return [];
            }

            // Obtener webhooks como historial de eventos
            const webhooksQuery = `
                SELECT
                    id,
                    evento_tipo,
                    gateway,
                    procesado,
                    fecha_procesado,
                    mensaje_error,
                    recibido_en
                FROM webhooks_suscripcion
                WHERE suscripcion_id = $1
                ORDER BY recibido_en DESC
                LIMIT 50
            `;

            const webhooks = await db.query(webhooksQuery, [id]);

            // Construir historial combinando creación + webhooks
            const historial = [];

            // Evento de creación
            historial.push({
                id: 0,
                tipo: 'creacion',
                descripcion: 'Suscripción creada',
                fecha: suscripcion.rows[0].creado_en,
                detalles: {
                    estado_inicial: suscripcion.rows[0].estado,
                    fecha_inicio: suscripcion.rows[0].fecha_inicio
                }
            });

            // Agregar webhooks como eventos
            webhooks.rows.forEach(w => {
                historial.push({
                    id: w.id,
                    tipo: 'webhook',
                    descripcion: `Webhook: ${w.evento_tipo}`,
                    fecha: w.fecha_procesado || w.recibido_en,
                    detalles: {
                        gateway: w.gateway,
                        procesado: w.procesado,
                        error: w.mensaje_error
                    }
                });
            });

            // Ordenar por fecha descendente
            historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            return historial;
        });
    }
}

module.exports = SuscripcionesModel;
