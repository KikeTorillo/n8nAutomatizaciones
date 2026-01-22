/**
 * @fileoverview Controller para operaciones de Super Administrador
 * @description Gestiona métricas globales, organizaciones y planes del sistema SaaS
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ResponseHelper } = require('../../../utils/helpers');

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
                // Query para métricas globales (sin tablas de suscripciones viejas)
                const metricasQuery = `
                    SELECT
                        (SELECT COUNT(*) FROM organizaciones WHERE activo = true) as organizaciones_activas,
                        (SELECT COUNT(*) FROM organizaciones) as organizaciones_total,
                        (SELECT COUNT(*) FROM usuarios WHERE rol != 'super_admin') as usuarios_totales,
                        (SELECT COUNT(*) FROM citas WHERE fecha_cita >= DATE_TRUNC('month', CURRENT_DATE)) as citas_mes_actual,
                        (SELECT COUNT(*) FROM profesionales WHERE activo = true) as profesionales_totales,
                        (SELECT COUNT(*) FROM clientes) as clientes_totales,
                        (SELECT COUNT(*) FROM organizaciones WHERE suspendido = true) as organizaciones_suspendidas
                `;

                const result = await db.query(metricasQuery);
                return result.rows[0];
            });

            // Top 10 organizaciones por actividad (usuarios + citas recientes)
            const topOrganizaciones = await RLSContextManager.withBypass(async (db) => {
                const topOrgsQuery = `
                    SELECT
                        o.id,
                        o.nombre_comercial,
                        o.plan_actual,
                        o.activo,
                        o.suspendido,
                        o.fecha_registro,
                        (SELECT COUNT(*) FROM usuarios u WHERE u.organizacion_id = o.id AND u.activo = true) as total_usuarios,
                        (SELECT COUNT(*) FROM profesionales p WHERE p.organizacion_id = o.id AND p.activo = true) as total_profesionales,
                        (SELECT COUNT(*) FROM clientes c WHERE c.organizacion_id = o.id) as total_clientes,
                        (SELECT COUNT(*) FROM citas ct WHERE ct.organizacion_id = o.id AND ct.fecha_cita >= DATE_TRUNC('month', CURRENT_DATE)) as citas_mes
                    FROM organizaciones o
                    WHERE o.activo = true
                    ORDER BY citas_mes DESC NULLS LAST, total_usuarios DESC
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
                activo,
                orden = 'fecha_registro',
                direccion = 'DESC'
            } = req.query;

            // Validar límite máximo
            const limitSafe = Math.min(parseInt(limit), 100);
            const offset = (parseInt(page) - 1) * limitSafe;

            // Validar orden y dirección
            const ordenesPermitidos = ['fecha_registro', 'nombre_comercial'];
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

                // Filtro por activo
                if (activo !== undefined) {
                    whereConditions.push(`o.activo = $${paramCounter}`);
                    params.push(activo === 'true' || activo === true);
                    paramCounter++;
                }

                const whereClause = whereConditions.join(' AND ');

                // Query principal (sin tablas viejas)
                const query = `
                    SELECT
                        o.id,
                        o.nombre_comercial,
                        o.email_admin,
                        o.plan_actual,
                        o.activo,
                        o.suspendido,
                        o.fecha_registro,
                        o.fecha_activacion,
                        o.modulos_activos,
                        (SELECT COUNT(*) FROM usuarios u WHERE u.organizacion_id = o.id AND u.activo = true) as total_usuarios,
                        (SELECT COUNT(*) FROM profesionales p WHERE p.organizacion_id = o.id AND p.activo = true) as total_profesionales,
                        (SELECT COUNT(*) FROM clientes c WHERE c.organizacion_id = o.id) as total_clientes,
                        (SELECT COUNT(*) FROM citas ct WHERE ct.organizacion_id = o.id AND ct.fecha_cita >= DATE_TRUNC('month', CURRENT_DATE)) as citas_mes
                    FROM organizaciones o
                    WHERE ${whereClause}
                    ORDER BY o.${ordenSafe} ${direccionSafe} NULLS LAST
                    LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
                `;

                params.push(limitSafe, offset);
                const dataResult = await db.query(query, params);

                // Contar total
                const countQuery = `
                    SELECT COUNT(*) FROM organizaciones o
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
    /**
     * Nota: El sistema de planes viejo fue eliminado en Fase 0.
     * Este endpoint ahora retorna el modelo de pricing actual (cobro por usuario).
     * Para gestión de planes de suscripciones SaaS, usar el módulo suscripciones-negocio.
     */
    static async listarPlanes(req, res) {
        try {
            // Modelo actual: $249/usuario/mes (Pro), Trial 14 días, sin límites de recursos
            const planesActuales = [
                {
                    id: 1,
                    codigo: 'trial',
                    nombre: 'Trial',
                    descripcion: '14 días de prueba sin restricciones',
                    precio_mensual: 0,
                    precio_por_usuario: 0,
                    dias_trial: 14,
                    limite_usuarios: null, // Ilimitado
                    funciones: ['todas'],
                    activo: true
                },
                {
                    id: 2,
                    codigo: 'pro',
                    nombre: 'Pro',
                    descripcion: 'Plan completo por usuario',
                    precio_mensual: null, // Depende de usuarios
                    precio_por_usuario: 249,
                    dias_trial: 0,
                    limite_usuarios: null, // Ilimitado
                    funciones: ['todas'],
                    activo: true
                }
            ];

            ResponseHelper.success(res, planesActuales, 'Planes obtenidos exitosamente');

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
    /**
     * Nota: El sistema de planes viejo fue eliminado en Fase 0.
     * Para gestión de planes de suscripciones SaaS, usar el módulo suscripciones-negocio.
     */
    static async actualizarPlan(req, res) {
        return ResponseHelper.error(
            res,
            'El sistema de planes legacy fue deprecado. Usa el módulo suscripciones-negocio para gestionar planes.',
            410 // Gone
        );
    }
}

module.exports = SuperAdminController;
