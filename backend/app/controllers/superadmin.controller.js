/**
 * @fileoverview Controller para operaciones de Super Administrador
 * @description Gestiona métricas globales, organizaciones y planes del sistema SaaS
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

const RLSContextManager = require('../utils/rlsContextManager');
const { ResponseHelper } = require('../utils/helpers');

/**
 * ====================================================================
 * SUPER ADMIN CONTROLLER
 * ====================================================================
 * Todos los métodos usan RLSContextManager.withBypass() porque operan
 * sobre datos de TODAS las organizaciones (acceso global)
 */
class SuperAdminController {
    /**
     * ====================================================================
     * GET /api/v1/superadmin/dashboard
     * ====================================================================
     * Dashboard global con métricas del sistema completo
     *
     * 📊 MÉTRICAS INCLUIDAS:
     * - Organizaciones activas/totales
     * - Usuarios totales del sistema
     * - Citas del mes actual
     * - Revenue mensual
     * - Organizaciones en trial/morosas/suspendidas
     * - Top 10 organizaciones por uso
     *
     * ✅ RESPONSE 200:
     * {
     *   "success": true,
     *   "data": {
     *     "metricas": { ... },
     *     "top_organizaciones": [ ... ],
     *     "fecha_consulta": "2025-10-30T..."
     *   }
     * }
     */
    static async dashboard(req, res) {
        try {
            const metricas = await RLSContextManager.withBypass(async (db) => {
                // Query para métricas globales
                const metricasQuery = `
                    SELECT
                        (SELECT COUNT(*) FROM organizaciones WHERE activo = true) as organizaciones_activas,
                        (SELECT COUNT(*) FROM organizaciones) as organizaciones_total,
                        (SELECT COUNT(*) FROM usuarios WHERE rol != 'super_admin') as usuarios_totales,
                        (SELECT COUNT(*) FROM citas WHERE fecha_cita >= DATE_TRUNC('month', CURRENT_DATE)) as citas_mes_actual,
                        (SELECT COALESCE(SUM(precio_actual), 0) FROM subscripciones WHERE activa = true) as revenue_mensual,
                        (SELECT COUNT(*) FROM subscripciones WHERE estado = 'trial' AND activa = true) as organizaciones_trial,
                        (SELECT COUNT(*) FROM subscripciones WHERE estado = 'morosa' AND activa = true) as organizaciones_morosas,
                        (SELECT COUNT(*) FROM subscripciones WHERE estado = 'suspendida') as organizaciones_suspendidas
                `;

                const result = await db.query(metricasQuery);
                return result.rows[0];
            });

            // Top 10 organizaciones por uso
            const topOrganizaciones = await RLSContextManager.withBypass(async (db) => {
                const topOrgsQuery = `
                    SELECT
                        o.id,
                        o.nombre_comercial,
                        o.plan_actual,
                        ps.nombre_plan,
                        m.uso_citas_mes_actual,
                        m.uso_profesionales,
                        m.uso_clientes,
                        o.fecha_registro,
                        s.estado as estado_subscripcion,
                        s.precio_actual
                    FROM organizaciones o
                    LEFT JOIN subscripciones s ON o.id = s.organizacion_id AND s.activa = true
                    LEFT JOIN planes_subscripcion ps ON s.plan_id = ps.id
                    LEFT JOIN metricas_uso_organizacion m ON o.id = m.organizacion_id
                    WHERE o.activo = true
                    ORDER BY m.uso_citas_mes_actual DESC NULLS LAST
                    LIMIT 10
                `;

                const result = await db.query(topOrgsQuery);
                return result.rows;
            });

            ResponseHelper.success(res, {
                metricas,
                top_organizaciones: topOrganizaciones,
                fecha_consulta: new Date().toISOString()
            }, 'Dashboard obtenido exitosamente');

        } catch (error) {
            console.error('Error en dashboard super admin:', error);
            ResponseHelper.error(res, 'Error al obtener métricas del sistema', 500);
        }
    }

    /**
     * ====================================================================
     * GET /api/v1/superadmin/organizaciones
     * ====================================================================
     * Listar todas las organizaciones con filtros y paginación
     *
     * 🔍 QUERY PARAMS:
     * - page: Número de página (default: 1)
     * - limit: Registros por página (default: 20, max: 100)
     * - busqueda: Búsqueda por nombre o email
     * - plan: Filtrar por plan (trial, basico, profesional, custom)
     * - estado: Filtrar por estado subscripción (activa, trial, morosa, suspendida)
     * - orden: Campo para ordenar (fecha_registro, nombre_comercial)
     * - direccion: ASC o DESC
     *
     * ✅ RESPONSE 200:
     * {
     *   "success": true,
     *   "data": [ ... ],
     *   "pagination": {
     *     "page": 1,
     *     "limit": 20,
     *     "total": 45,
     *     "totalPages": 3
     *   }
     * }
     */
    static async listarOrganizaciones(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                busqueda,
                plan,
                estado,
                orden = 'fecha_registro',
                direccion = 'DESC'
            } = req.query;

            // Validar límite máximo
            const limitSafe = Math.min(parseInt(limit), 100);
            const offset = (parseInt(page) - 1) * limitSafe;

            // Validar orden y dirección
            const ordenesPermitidos = ['fecha_registro', 'nombre_comercial', 'uso_citas_mes_actual'];
            const ordenSafe = ordenesPermitidos.includes(orden) ? orden : 'fecha_registro';
            const direccionSafe = direccion.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            const result = await RLSContextManager.withBypass(async (db) => {
                let whereConditions = ['1=1'];
                const params = [];
                let paramCounter = 1;

                // Filtro de búsqueda
                if (busqueda) {
                    whereConditions.push(`(o.nombre_comercial ILIKE $${paramCounter} OR o.email_admin ILIKE $${paramCounter})`);
                    params.push(`%${busqueda}%`);
                    paramCounter++;
                }

                // Filtro por plan
                if (plan) {
                    whereConditions.push(`o.plan_actual = $${paramCounter}`);
                    params.push(plan);
                    paramCounter++;
                }

                // Filtro por estado
                if (estado) {
                    whereConditions.push(`s.estado = $${paramCounter}`);
                    params.push(estado);
                    paramCounter++;
                }

                const whereClause = whereConditions.join(' AND ');

                // Query principal
                const query = `
                    SELECT
                        o.id,
                        o.nombre_comercial,
                        o.email_admin,
                        o.plan_actual,
                        ps.nombre_plan,
                        o.activo,
                        o.suspendido,
                        o.fecha_registro,
                        o.fecha_activacion,
                        s.estado as estado_subscripcion,
                        s.fecha_fin as fecha_fin_trial,
                        s.precio_actual,
                        CASE
                            WHEN s.fecha_fin IS NOT NULL AND s.estado = 'trial' THEN
                                (s.fecha_fin - CURRENT_DATE)::INTEGER
                            ELSE NULL
                        END as dias_restantes_trial,
                        m.uso_profesionales,
                        m.uso_clientes,
                        m.uso_servicios,
                        m.uso_usuarios,
                        m.uso_citas_mes_actual,
                        ps.limite_profesionales,
                        ps.limite_clientes,
                        ps.limite_citas_mes,
                        (SELECT COUNT(*) FROM usuarios WHERE organizacion_id = o.id AND activo = true) as total_usuarios
                    FROM organizaciones o
                    LEFT JOIN subscripciones s ON o.id = s.organizacion_id AND s.activa = true
                    LEFT JOIN planes_subscripcion ps ON s.plan_id = ps.id
                    LEFT JOIN metricas_uso_organizacion m ON o.id = m.organizacion_id
                    WHERE ${whereClause}
                    ORDER BY ${ordenSafe === 'uso_citas_mes_actual' ? 'm.uso_citas_mes_actual' : 'o.' + ordenSafe} ${direccionSafe} NULLS LAST
                    LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
                `;

                params.push(limitSafe, offset);
                const dataResult = await db.query(query, params);

                // Contar total
                const countQuery = `
                    SELECT COUNT(*) FROM organizaciones o
                    LEFT JOIN subscripciones s ON o.id = s.organizacion_id AND s.activa = true
                    WHERE ${whereClause}
                `;

                const countResult = await db.query(countQuery, params.slice(0, -2));
                const total = parseInt(countResult.rows[0].count);

                return {
                    data: dataResult.rows,
                    total
                };
            });

            ResponseHelper.paginated(res, result.data, {
                page: parseInt(page),
                limit: limitSafe,
                total: result.total,
                totalPages: Math.ceil(result.total / limitSafe)
            }, 'Organizaciones obtenidas exitosamente');

        } catch (error) {
            console.error('Error listando organizaciones:', error);
            ResponseHelper.error(res, 'Error al listar organizaciones', 500);
        }
    }

    /**
     * ====================================================================
     * GET /api/v1/superadmin/planes
     * ====================================================================
     * Listar todos los planes de subscripción con contador de organizaciones
     *
     * ✅ RESPONSE 200:
     * {
     *   "success": true,
     *   "data": [
     *     {
     *       "id": 1,
     *       "codigo_plan": "basico",
     *       "nombre_plan": "Plan Básico",
     *       "precio_mensual": 299.00,
     *       "limite_profesionales": 5,
     *       ...
     *       "organizaciones_activas": 12
     *     }
     *   ]
     * }
     */
    static async listarPlanes(req, res) {
        try {
            const planes = await RLSContextManager.withBypass(async (db) => {
                const query = `
                    SELECT
                        id,
                        codigo_plan,
                        nombre_plan,
                        descripcion,
                        precio_mensual,
                        precio_anual,
                        limite_profesionales,
                        limite_clientes,
                        limite_servicios,
                        limite_usuarios,
                        limite_citas_mes,
                        funciones_habilitadas,
                        activo,
                        orden_display,
                        (SELECT COUNT(*) FROM subscripciones WHERE plan_id = planes_subscripcion.id AND activa = true) as organizaciones_activas,
                        creado_en,
                        actualizado_en
                    FROM planes_subscripcion
                    ORDER BY orden_display ASC, precio_mensual ASC
                `;

                const result = await db.query(query);
                return result.rows;
            });

            ResponseHelper.success(res, planes, 'Planes obtenidos exitosamente');

        } catch (error) {
            console.error('Error listando planes:', error);
            ResponseHelper.error(res, 'Error al listar planes', 500);
        }
    }

    /**
     * ====================================================================
     * PUT /api/v1/superadmin/planes/:id
     * ====================================================================
     * Actualizar límites y configuración de un plan
     *
     * 📝 BODY (todos los campos son opcionales):
     * {
     *   "nombre_plan": "Plan Básico Mejorado",
     *   "descripcion": "Nueva descripción",
     *   "precio_mensual": 349.00,
     *   "precio_anual": 3490.00,
     *   "limite_profesionales": 7,
     *   "limite_clientes": 300,
     *   "limite_servicios": 20,
     *   "limite_usuarios": 5,
     *   "limite_citas_mes": 250,
     *   "funciones_habilitadas": { "whatsapp": true },
     *   "activo": true
     * }
     *
     * ✅ RESPONSE 200:
     * {
     *   "success": true,
     *   "data": { plan actualizado },
     *   "message": "Plan actualizado exitosamente"
     * }
     *
     * ❌ ERRORES:
     * - 400: Datos inválidos
     * - 404: Plan no encontrado
     * - 500: Error interno
     */
    static async actualizarPlan(req, res) {
        try {
            const { id } = req.params;
            const {
                nombre_plan,
                descripcion,
                precio_mensual,
                precio_anual,
                limite_profesionales,
                limite_clientes,
                limite_servicios,
                limite_usuarios,
                limite_citas_mes,
                funciones_habilitadas,
                activo
            } = req.body;

            // Validar que al menos un campo esté presente
            const hasUpdates = nombre_plan || descripcion || precio_mensual !== undefined ||
                precio_anual !== undefined || limite_profesionales !== undefined ||
                limite_clientes !== undefined || limite_servicios !== undefined ||
                limite_usuarios !== undefined || limite_citas_mes !== undefined ||
                funciones_habilitadas || activo !== undefined;

            if (!hasUpdates) {
                return ResponseHelper.error(res, 'No se proporcionaron campos para actualizar', 400);
            }

            const planActualizado = await RLSContextManager.withBypass(async (db) => {
                const query = `
                    UPDATE planes_subscripcion
                    SET
                        nombre_plan = COALESCE($1, nombre_plan),
                        descripcion = COALESCE($2, descripcion),
                        precio_mensual = COALESCE($3, precio_mensual),
                        precio_anual = COALESCE($4, precio_anual),
                        limite_profesionales = COALESCE($5, limite_profesionales),
                        limite_clientes = COALESCE($6, limite_clientes),
                        limite_servicios = COALESCE($7, limite_servicios),
                        limite_usuarios = COALESCE($8, limite_usuarios),
                        limite_citas_mes = COALESCE($9, limite_citas_mes),
                        funciones_habilitadas = COALESCE($10, funciones_habilitadas),
                        activo = COALESCE($11, activo),
                        actualizado_en = NOW()
                    WHERE id = $12
                    RETURNING *
                `;

                const result = await db.query(query, [
                    nombre_plan,
                    descripcion,
                    precio_mensual,
                    precio_anual,
                    limite_profesionales,
                    limite_clientes,
                    limite_servicios,
                    limite_usuarios,
                    limite_citas_mes,
                    funciones_habilitadas ? JSON.stringify(funciones_habilitadas) : null,
                    activo,
                    id
                ]);

                if (result.rows.length === 0) {
                    throw new Error('PLAN_NOT_FOUND');
                }

                return result.rows[0];
            });

            ResponseHelper.success(res, planActualizado, 'Plan actualizado exitosamente');

        } catch (error) {
            console.error('Error actualizando plan:', error);

            if (error.message === 'PLAN_NOT_FOUND') {
                return ResponseHelper.notFound(res, 'Plan no encontrado');
            }

            ResponseHelper.error(res, 'Error al actualizar plan', 500);
        }
    }
}

module.exports = SuperAdminController;
