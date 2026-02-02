// Modelo de Organizaciones - Multi-tenant entity

const { getDb } = require('../../../config/database');
const RLSHelper = require('../../../utils/rlsHelper');
const RLSContextManager = require('../../../utils/rlsContextManager');
const { SELECT_FIELDS, CAMPOS_ACTUALIZABLES } = require('../../../constants/organizacion.constants');
const { NEXO_TEAM_ORG_ID } = require('../../../config/constants');
const SecureRandom = require('../../../utils/helpers/SecureRandom');
const { ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');


class OrganizacionModel {
    static SELECT_FIELDS_SQL = SELECT_FIELDS.join(', ');

    // Crear nueva organización (bypass RLS - operación de super_admin)
    static async crear(organizacionData) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                INSERT INTO organizaciones (
                    nombre_comercial, razon_social, rfc_nif, categoria_id,
                    configuracion_categoria, email_admin, telefono, codigo_tenant, slug,
                    sitio_web, logo_url, colores_marca, configuracion_ui,
                    app_seleccionada, pais_id, estado_id, ciudad_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING *
            `;

            const codigoTenant = `org_${Date.now()}_${SecureRandom.slugSuffix(6)}`;

            // Generar slug único con timestamp
            const baseSlug = organizacionData.nombre_comercial.toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '') // Eliminar guiones al inicio/final
                .substring(0, 40); // Reducir a 40 para dejar espacio al sufijo

            const uniqueSuffix = Date.now().toString().slice(-8); // Últimos 8 dígitos del timestamp
            const slug = `${baseSlug}-${uniqueSuffix}`.substring(0, 50);

            // Determinar plan: free, pro, trial (default: trial)
            // NOTA Feb 2026: plan ya no se guarda en organizaciones, solo en suscripciones_org
            const plan = organizacionData.plan || 'trial';

            // app_seleccionada solo aplica para Plan Free
            // Para otros planes es NULL (tienen acceso a todas las apps)
            const appSeleccionada = plan === 'free' ? organizacionData.app_seleccionada : null;

            const values = [
                organizacionData.nombre_comercial,
                organizacionData.razon_social || null,
                organizacionData.rfc_nif || null,
                organizacionData.categoria_id,
                organizacionData.configuracion_categoria || {},
                organizacionData.email_admin || `admin-${codigoTenant}@temp.local`,
                organizacionData.telefono || null,
                codigoTenant,
                slug,
                organizacionData.sitio_web || null,
                organizacionData.logo_url || null,
                organizacionData.colores_marca || {},
                organizacionData.configuracion_ui || {},
                appSeleccionada,
                // Ubicación geográfica (Nov 2025)
                organizacionData.pais_id || 1,        // Default: México (id=1)
                organizacionData.estado_id || null,
                organizacionData.ciudad_id || null
            ];

            const result = await db.query(query, values);
            const orgCreada = result.rows[0];

            // Hook: Vincular con Nexo Team CRM (dogfooding)
            // Se ejecuta de forma asíncrona para no bloquear la creación
            if (orgCreada && orgCreada.id !== NEXO_TEAM_ORG_ID) { // No vincular Nexo Team consigo misma
                setImmediate(async () => {
                    try {
                        const DogfoodingService = require('../../../services/dogfoodingService');
                        await DogfoodingService.vincularOrganizacionComoCliente(orgCreada);
                    } catch (err) {
                        console.error('Error en dogfooding hook:', err);
                    }
                });
            }

            return orgCreada;
        });
    }

    // Obtener organización por ID (bypass RLS - acceso super_admin/admin)
    static async obtenerPorId(id) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT ${this.SELECT_FIELDS_SQL}
                FROM organizaciones
                WHERE id = $1 AND activo = TRUE
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    // Obtener organización por email (bypass RLS - operaciones de sistema)
    static async obtenerPorEmail(email) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT ${this.SELECT_FIELDS_SQL}
                FROM organizaciones
                WHERE email_admin = $1 AND activo = TRUE
            `;

            const result = await db.query(query, [email]);
            return result.rows[0] || null;
        });
    }

    // Listar todas las organizaciones con paginación (bypass RLS - solo super_admin)
    static async listar(options = {}) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            const { page = 1, limit = 10, categoria_id, incluir_inactivas = false, organizacion_id } = options;
            const offset = (page - 1) * limit;

            let whereConditions = [];
            let values = [];
            let paramCounter = 1;

            // Solo filtrar por activo si NO se incluyen inactivas
            if (!incluir_inactivas) {
                whereConditions.push(`activo = $${paramCounter}`);
                values.push(true);
                paramCounter++;
            }

            if (categoria_id) {
                whereConditions.push(`categoria_id = $${paramCounter}`);
                values.push(categoria_id);
                paramCounter++;
            }

            if (organizacion_id) {
                whereConditions.push(`id = $${paramCounter}`);
                values.push(organizacion_id);
                paramCounter++;
            }

            const whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : 'TRUE';

            const countQuery = `
                SELECT COUNT(*) as total
                FROM organizaciones
                WHERE ${whereClause}
            `;

            const dataQuery = `
                SELECT ${this.SELECT_FIELDS_SQL}
                FROM organizaciones
                WHERE ${whereClause}
                ORDER BY creado_en DESC
                LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
            `;

            const countResult = await db.query(countQuery, values);
            const dataValues = [...values, limit, offset];
            const dataResult = await db.query(dataQuery, dataValues);

            const total = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(total / limit);

            return {
                data: dataResult.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        });
    }

    // Actualizar organización (bypass RLS - super_admin/admin)
    static async actualizar(id, updateData) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            const updateFields = [];
            const values = [];
            let paramCounter = 1;

            for (const [key, value] of Object.entries(updateData)) {
                if (CAMPOS_ACTUALIZABLES.includes(key) && value !== undefined) {
                    updateFields.push(`${key} = $${paramCounter}`);
                    values.push(value);
                    paramCounter++;
                }
            }

            if (updateFields.length === 0) {
                ErrorHelper.throwValidation('No hay campos válidos para actualizar');
            }

            updateFields.push(`actualizado_en = NOW()`);
            values.push(id);

            const query = `
                UPDATE organizaciones
                SET ${updateFields.join(', ')}
                WHERE id = $${paramCounter}
                RETURNING ${this.SELECT_FIELDS_SQL}
            `;

            const result = await db.query(query, values);
            return result.rows[0] || null;
        });
    }

    // Desactivar organización - soft delete (solo super_admin)
    static async desactivar(id) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                UPDATE organizaciones
                SET activo = FALSE, actualizado_en = NOW()
                WHERE id = $1 AND activo = TRUE
                RETURNING id
            `;

            const result = await db.query(query, [id]);
            return result.rows.length > 0;
        });
    }

    // Verificar límites de la organización (bypass RLS - operación de consulta)
    // ACTUALIZADO Ene 2026: Usa tablas suscripciones_org y planes_suscripcion_org
    // SIMPLIFICADO: Queries separadas para evitar problemas con JOINs complejos
    static async verificarLimites(organizacionId) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            // 1. Verificar que la organización existe
            const orgCheck = await db.query(
                'SELECT id FROM organizaciones WHERE id = $1 AND activo = TRUE',
                [organizacionId]
            );
            ErrorHelper.throwIfNotFound(orgCheck.rows[0], 'Organización');

            // 2. Obtener límites del plan (si existe suscripción activa o trial)
            // FIX: Evitar cast a int de valores vacíos, usar CASE WHEN para manejar valores nulos
            let limites = {
                limite_citas: 50,
                limite_profesionales: 2,
                limite_servicios: 10
            };

            try {
                const limitesQuery = await db.query(`
                    SELECT
                        CASE
                            WHEN ps.limites->>'citas' IS NOT NULL AND ps.limites->>'citas' != ''
                            THEN (ps.limites->>'citas')::int
                            ELSE 50
                        END as limite_citas,
                        CASE
                            WHEN ps.limites->>'profesionales' IS NOT NULL AND ps.limites->>'profesionales' != ''
                            THEN (ps.limites->>'profesionales')::int
                            ELSE 2
                        END as limite_profesionales,
                        CASE
                            WHEN ps.limites->>'servicios' IS NOT NULL AND ps.limites->>'servicios' != ''
                            THEN (ps.limites->>'servicios')::int
                            ELSE 10
                        END as limite_servicios
                    FROM suscripciones_org sub
                    JOIN planes_suscripcion_org ps ON sub.plan_id = ps.id
                    WHERE sub.organizacion_id = $1 AND sub.estado IN ('activa', 'trial')
                    LIMIT 1
                `, [organizacionId]);

                if (limitesQuery.rows[0]) {
                    limites = limitesQuery.rows[0];
                }
            } catch (limitesError) {
                // Si hay error obteniendo límites, usar valores por defecto
                logger.warn('[OrganizacionModel] Error obteniendo límites, usando defaults', {
                    organizacionId,
                    error: limitesError.message
                });
            }

            // 3. Contar uso actual (queries simples separadas)
            const citasResult = await db.query(`
                SELECT COUNT(*)::int as total
                FROM citas
                WHERE organizacion_id = $1
                AND estado != 'cancelada'
                AND fecha_cita >= date_trunc('month', CURRENT_DATE)
                AND fecha_cita < date_trunc('month', CURRENT_DATE) + interval '1 month'
            `, [organizacionId]);

            const profesionalesResult = await db.query(`
                SELECT COUNT(*)::int as total
                FROM profesionales
                WHERE organizacion_id = $1 AND activo = TRUE
            `, [organizacionId]);

            const serviciosResult = await db.query(`
                SELECT COUNT(*)::int as total
                FROM servicios
                WHERE organizacion_id = $1 AND activo = TRUE
            `, [organizacionId]);

            const citasUsadas = citasResult.rows[0]?.total || 0;
            const profesionalesUsados = profesionalesResult.rows[0]?.total || 0;
            const serviciosUsados = serviciosResult.rows[0]?.total || 0;

            return {
                citas: {
                    limite: limites.limite_citas,
                    usado: citasUsadas,
                    disponible: limites.limite_citas - citasUsadas,
                    porcentaje_uso: Math.round((citasUsadas / limites.limite_citas) * 100)
                },
                profesionales: {
                    limite: limites.limite_profesionales,
                    usado: profesionalesUsados,
                    disponible: limites.limite_profesionales - profesionalesUsados,
                    porcentaje_uso: Math.round((profesionalesUsados / limites.limite_profesionales) * 100)
                },
                servicios: {
                    limite: limites.limite_servicios,
                    usado: serviciosUsados,
                    disponible: limites.limite_servicios - serviciosUsados,
                    porcentaje_uso: Math.round((serviciosUsados / limites.limite_servicios) * 100)
                }
            };
        });
    }


    // Obtener métricas completas de la organización para dashboard
    static async obtenerMetricas(organizacionId, periodo = 'mes') {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            // Calcular rangos de fechas según el período
            let fechaInicio, fechaFin;
            switch (periodo) {
                case 'semana':
                    fechaInicio = "date_trunc('week', CURRENT_DATE)";
                    fechaFin = "date_trunc('week', CURRENT_DATE) + interval '1 week'";
                    break;
                case 'año':
                    fechaInicio = "date_trunc('year', CURRENT_DATE)";
                    fechaFin = "date_trunc('year', CURRENT_DATE) + interval '1 year'";
                    break;
                default: // 'mes'
                    fechaInicio = "date_trunc('month', CURRENT_DATE)";
                    fechaFin = "date_trunc('month', CURRENT_DATE) + interval '1 month'";
            }

            // Query para métricas de uso de recursos y operacionales
            // ACTUALIZADO Ene 2026: Usa tablas suscripciones_org y planes_suscripcion_org
            const metricsQuery = `
                SELECT
                    -- Límites del plan (desde JSONB, NULLIF para manejar cadenas vacías)
                    COALESCE(NULLIF(ps.limites->>'profesionales', '')::int, 2) as limite_profesionales,
                    COALESCE(NULLIF(ps.limites->>'servicios', '')::int, 10) as limite_servicios,
                    COALESCE(NULLIF(ps.limites->>'citas', '')::int, 50) as limite_citas_mes,

                    -- Uso actual
                    COUNT(DISTINCT p.id) FILTER (WHERE p.activo = true) as profesionales_usados,
                    COUNT(DISTINCT s.id) FILTER (WHERE s.activo = true) as servicios_usados,
                    COUNT(DISTINCT u.id) FILTER (WHERE u.activo = true) as usuarios_usados,

                    -- Métricas operacionales del período
                    COUNT(DISTINCT c.id) FILTER (
                        WHERE c.fecha_cita >= ${fechaInicio}
                        AND c.fecha_cita < ${fechaFin}
                    ) as citas_periodo,
                    COUNT(DISTINCT c.id) FILTER (
                        WHERE c.fecha_cita >= ${fechaInicio}
                        AND c.fecha_cita < ${fechaFin}
                        AND c.estado = 'completada'
                    ) as citas_completadas,
                    COUNT(DISTINCT c.id) FILTER (
                        WHERE c.fecha_cita >= ${fechaInicio}
                        AND c.fecha_cita < ${fechaFin}
                        AND c.estado = 'cancelada'
                    ) as citas_canceladas,
                    COALESCE(SUM(c.precio_total) FILTER (
                        WHERE c.fecha_cita >= ${fechaInicio}
                        AND c.fecha_cita < ${fechaFin}
                        AND c.estado = 'completada'
                    ), 0) as ingresos_periodo,

                    -- Salud del sistema
                    o.activo as org_activa,
                    o.suspendido as org_suspendida

                FROM organizaciones o
                LEFT JOIN suscripciones_org sub ON o.id = sub.organizacion_id AND sub.estado = 'activa'
                LEFT JOIN planes_suscripcion_org ps ON sub.plan_id = ps.id
                LEFT JOIN profesionales p ON o.id = p.organizacion_id
                LEFT JOIN servicios s ON o.id = s.organizacion_id
                LEFT JOIN usuarios u ON o.id = u.organizacion_id
                LEFT JOIN citas c ON o.id = c.organizacion_id
                WHERE o.id = $1
                GROUP BY o.id, o.activo, o.suspendido, ps.limites
            `;

            const result = await db.query(metricsQuery, [organizacionId]);
            ErrorHelper.throwIfNotFound(result.rows[0], 'Organización');

            const data = result.rows[0];

            // Calcular porcentajes de uso
            const profesionalesUsados = parseInt(data.profesionales_usados);
            const serviciosUsados = parseInt(data.servicios_usados);
            const usuariosUsados = parseInt(data.usuarios_usados);

            const profesionalesPorcentaje = data.limite_profesionales > 0
                ? Math.round((profesionalesUsados / data.limite_profesionales) * 100)
                : 0;
            const serviciosPorcentaje = data.limite_servicios > 0
                ? Math.round((serviciosUsados / data.limite_servicios) * 100)
                : 0;
            const usuariosPorcentaje = 100; // Sin límite definido, asumimos 100%

            // Calcular tasa de completitud
            const citasPeriodo = parseInt(data.citas_periodo);
            const tasaCompletitud = citasPeriodo > 0
                ? Math.round((parseInt(data.citas_completadas) / citasPeriodo) * 100)
                : 0;

            return {
                uso_recursos: {
                    profesionales: {
                        usados: profesionalesUsados,
                        limite: data.limite_profesionales,
                        porcentaje_uso: profesionalesPorcentaje
                    },
                    servicios: {
                        usados: serviciosUsados,
                        limite: data.limite_servicios,
                        porcentaje_uso: serviciosPorcentaje
                    },
                    usuarios: {
                        usados: usuariosUsados,
                        limite: 999, // Sin límite real
                        porcentaje_uso: usuariosPorcentaje
                    }
                },
                estadisticas_operacionales: {
                    citas_totales: citasPeriodo,
                    citas_completadas: parseInt(data.citas_completadas),
                    citas_canceladas: parseInt(data.citas_canceladas),
                    tasa_completitud: tasaCompletitud,
                    ingresos: parseFloat(data.ingresos_periodo),
                    periodo: periodo
                },
                salud_sistema: {
                    organizacion_activa: data.org_activa,
                    organizacion_suspendida: data.org_suspendida,
                    estado_general: data.org_activa && !data.org_suspendida ? 'saludable' : 'degradado'
                }
            };
        });
    }

    // Obtener estadísticas básicas (wrapper de límites + info general)
    static async obtenerEstadisticas(organizacionId) {
        const limites = await this.verificarLimites(organizacionId);
        const organizacion = await this.obtenerPorId(organizacionId);
        ErrorHelper.throwIfNotFound(organizacion, 'Organización');

        return {
            organizacion: {
                id: organizacion.id,
                nombre: organizacion.nombre_comercial,
                categoria_id: organizacion.categoria_id,
                fecha_creacion: organizacion.fecha_registro
            },
            uso_actual: limites,
            resumen: {
                estado: organizacion.activo ? 'activo' : 'inactivo',
                configuracion_completa: !!organizacion.configuracion_categoria && Object.keys(organizacion.configuracion_categoria).length > 0
            }
        };
    }

    /**
     * Obtener progreso del setup inicial de una organización
     * Para mostrar checklist de configuración en el dashboard
     */
    static async obtenerProgresoSetup(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // 1. Contar profesionales activos
            const profesionalesResult = await db.query(`
                SELECT COUNT(*)::int as total
                FROM profesionales
                WHERE activo = true
            `);
            const profesionales = profesionalesResult.rows[0].total;

            // 2. Verificar si hay horarios configurados (al menos 1 profesional con horarios)
            const horariosResult = await db.query(`
                SELECT COUNT(DISTINCT profesional_id)::int as total
                FROM horarios_profesionales
            `);
            const horarios_configurados = horariosResult.rows[0].total > 0;

            // 3. Contar servicios activos
            const serviciosResult = await db.query(`
                SELECT COUNT(*)::int as total
                FROM servicios
                WHERE activo = true
            `);
            const servicios = serviciosResult.rows[0].total;

            // 4. Contar asignaciones servicio-profesional activas
            const asignacionesResult = await db.query(`
                SELECT COUNT(*)::int as total
                FROM servicios_profesionales sp
                JOIN servicios s ON s.id = sp.servicio_id
                JOIN profesionales p ON p.id = sp.profesional_id
                WHERE s.activo = true AND p.activo = true
            `);
            const asignaciones = asignacionesResult.rows[0].total;

            // 5. Calcular progreso
            const steps = [
                profesionales > 0,      // Paso 1: Crear profesional
                horarios_configurados,  // Paso 2: Configurar horarios
                servicios > 0,          // Paso 3: Crear servicio
                asignaciones > 0        // Paso 4: Asignar servicio a profesional
            ];

            const completedSteps = steps.filter(Boolean).length;
            const totalSteps = steps.length;
            const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

            return {
                completed: completedSteps === totalSteps,
                profesionales,
                horarios_configurados,
                servicios,
                asignaciones,
                progress: {
                    completed_steps: completedSteps,
                    total_steps: totalSteps,
                    percentage: progressPercentage
                }
            };
        });
    }


    // NOTA: Métodos cambiarPlan() y crearSubscripcionActiva() ELIMINADOS (Ene 2026)
    // Usaban tablas legacy: planes_subscripcion, subscripciones
    // Reemplazados por módulo suscripciones-negocio con tablas:
    // - planes_suscripcion_org
    // - suscripciones_org
    // Ver: backend/app/modules/suscripciones-negocio/

    /**
     * Actualizar módulos activos de una organización
     * @param {number} organizacionId - ID de la organización
     * @param {Object} modulosActivos - Objeto con módulos y su estado {core: true, inventario: true, ...}
     * @returns {Promise<Object>} Resultado de la actualización
     */
    static async actualizarModulosActivos(organizacionId, modulosActivos) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                UPDATE organizaciones
                SET modulos_activos = $2,
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING id, modulos_activos
            `;

            const result = await db.query(query, [
                organizacionId,
                JSON.stringify(modulosActivos)
            ]);

            return result.rows[0];
        });
    }

    /**
     * Obtener datos de organización para tickets/recibos POS
     * Incluye ubicación geográfica formateada
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} Datos de la organización para ticket
     */
    static async obtenerParaTicket(organizacionId) {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                SELECT
                    o.nombre_comercial,
                    o.razon_social,
                    o.rfc_nif,
                    o.telefono,
                    o.email_admin,
                    o.logo_url,
                    CONCAT_WS(', ',
                        c.nombre,
                        e.nombre,
                        p.nombre
                    ) AS direccion
                FROM organizaciones o
                LEFT JOIN ciudades c ON c.id = o.ciudad_id
                LEFT JOIN estados e ON e.id = o.estado_id
                LEFT JOIN paises p ON p.id = o.pais_id
                WHERE o.id = $1
            `, [organizacionId]);
            return result.rows[0] || null;
        });
    }
}

module.exports = OrganizacionModel;