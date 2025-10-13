// Modelo de Organizaciones - Multi-tenant entity

const { getDb } = require('../config/database');
const RLSHelper = require('../utils/rlsHelper');
const RLSContextManager = require('../utils/rlsContextManager');
const { SELECT_FIELDS, CAMPOS_ACTUALIZABLES } = require('../constants/organizacion.constants');


class OrganizacionModel {
    static SELECT_FIELDS_SQL = SELECT_FIELDS.join(', ');

    // Crear nueva organización (bypass RLS - operación de super_admin)
    static async crear(organizacionData) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                INSERT INTO organizaciones (
                    nombre_comercial, razon_social, rfc_nif, tipo_industria,
                    configuracion_industria, email_admin, telefono, codigo_tenant, slug,
                    sitio_web, logo_url, colores_marca, configuracion_ui, plan_actual
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *
            `;

            const codigoTenant = `org_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const slug = organizacionData.nombre_comercial.toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .substring(0, 50);

            const values = [
                organizacionData.nombre_comercial,
                organizacionData.razon_social || null,
                organizacionData.rfc_nif || null,
                organizacionData.tipo_industria,
                organizacionData.configuracion_industria || {},
                organizacionData.email_admin || `admin-${codigoTenant}@temp.local`,
                organizacionData.telefono || null,
                codigoTenant,
                slug,
                organizacionData.sitio_web || null,
                organizacionData.logo_url || null,
                organizacionData.colores_marca || {},
                organizacionData.configuracion_ui || {},
                organizacionData.plan || organizacionData.plan_actual || 'basico'
            ];

            const result = await db.query(query, values);
            return result.rows[0];
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
            const { page = 1, limit = 10, tipo_industria, incluir_inactivas = false, organizacion_id } = options;
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

            if (tipo_industria) {
                whereConditions.push(`tipo_industria = $${paramCounter}`);
                values.push(tipo_industria);
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
                throw new Error('No hay campos válidos para actualizar');
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
    static async verificarLimites(organizacionId) {
        const db = await getDb();

        try {
            return await RLSHelper.withBypass(db, async (db) => {
                const query = `
                    SELECT
                        COALESCE(ps.limite_citas_mes, 50) as limite_citas_mes,
                        COALESCE(ps.limite_profesionales, 2) as limite_profesionales,
                        COALESCE(ps.limite_servicios, 10) as limite_servicios,
                        COUNT(DISTINCT c.id) FILTER (
                            WHERE c.fecha_cita >= date_trunc('month', CURRENT_DATE)
                            AND c.fecha_cita < date_trunc('month', CURRENT_DATE) + interval '1 month'
                        ) as citas_mes_actual,
                        COUNT(DISTINCT p.id) as profesionales_activos,
                        COUNT(DISTINCT s.id) as servicios_activos
                    FROM organizaciones o
                    LEFT JOIN subscripciones sub ON o.id = sub.organizacion_id AND sub.activa = TRUE
                    LEFT JOIN planes_subscripcion ps ON sub.plan_id = ps.id
                    LEFT JOIN citas c ON o.id = c.organizacion_id AND c.estado != 'cancelada'
                    LEFT JOIN profesionales p ON o.id = p.organizacion_id AND p.activo = TRUE
                    LEFT JOIN servicios s ON o.id = s.organizacion_id AND s.activo = TRUE
                    WHERE o.id = $1 AND o.activo = TRUE
                    GROUP BY o.id, ps.limite_citas_mes, ps.limite_profesionales, ps.limite_servicios
                `;

                const result = await db.query(query, [organizacionId]);

                if (result.rows.length === 0) {
                    throw new Error('Organización no encontrada');
                }

                const limites = result.rows[0];

                return {
                    citas: {
                        limite: limites.limite_citas_mes,
                        usado: parseInt(limites.citas_mes_actual),
                        disponible: limites.limite_citas_mes - parseInt(limites.citas_mes_actual),
                        porcentaje_uso: Math.round((parseInt(limites.citas_mes_actual) / limites.limite_citas_mes) * 100)
                    },
                    profesionales: {
                        limite: limites.limite_profesionales,
                        usado: parseInt(limites.profesionales_activos),
                        disponible: limites.limite_profesionales - parseInt(limites.profesionales_activos),
                        porcentaje_uso: Math.round((parseInt(limites.profesionales_activos) / limites.limite_profesionales) * 100)
                    },
                    servicios: {
                        limite: limites.limite_servicios,
                        usado: parseInt(limites.servicios_activos),
                        disponible: limites.limite_servicios - parseInt(limites.servicios_activos),
                        porcentaje_uso: Math.round((parseInt(limites.servicios_activos) / limites.limite_servicios) * 100)
                    }
                };
            });
        } finally {
            db.release();
        }
    }


    // Obtener métricas completas de la organización para dashboard
    static async obtenerMetricas(organizacionId, periodo = 'mes') {
        const db = await getDb();

        try {
            return await RLSHelper.withBypass(db, async (db) => {
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
                const metricsQuery = `
                    SELECT
                        -- Límites del plan
                        COALESCE(ps.limite_profesionales, 2) as limite_profesionales,
                        COALESCE(ps.limite_servicios, 10) as limite_servicios,
                        COALESCE(ps.limite_citas_mes, 50) as limite_citas_mes,

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
                        COALESCE(SUM(c.precio_final) FILTER (
                            WHERE c.fecha_cita >= ${fechaInicio}
                            AND c.fecha_cita < ${fechaFin}
                            AND c.estado = 'completada'
                        ), 0) as ingresos_periodo,

                        -- Salud del sistema
                        o.activo as org_activa,
                        o.suspendido as org_suspendida

                    FROM organizaciones o
                    LEFT JOIN subscripciones sub ON o.id = sub.organizacion_id AND sub.activa = TRUE
                    LEFT JOIN planes_subscripcion ps ON sub.plan_id = ps.id
                    LEFT JOIN profesionales p ON o.id = p.organizacion_id
                    LEFT JOIN servicios s ON o.id = s.organizacion_id
                    LEFT JOIN usuarios u ON o.id = u.organizacion_id
                    LEFT JOIN citas c ON o.id = c.organizacion_id
                    WHERE o.id = $1
                    GROUP BY o.id, o.activo, o.suspendido, ps.limite_profesionales, ps.limite_servicios, ps.limite_citas_mes
                `;

                const result = await db.query(metricsQuery, [organizacionId]);

                if (result.rows.length === 0) {
                    throw new Error('Organización no encontrada');
                }

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
        } finally {
            db.release();
        }
    }

    // Obtener estadísticas básicas (wrapper de límites + info general)
    static async obtenerEstadisticas(organizacionId) {
        const limites = await this.verificarLimites(organizacionId);
        const organizacion = await this.obtenerPorId(organizacionId);

        if (!organizacion) {
            throw new Error('Organización no encontrada');
        }

        return {
            organizacion: {
                id: organizacion.id,
                nombre: organizacion.nombre_comercial,
                tipo_industria: organizacion.tipo_industria,
                fecha_creacion: organizacion.fecha_registro
            },
            uso_actual: limites,
            resumen: {
                estado: organizacion.activo ? 'activo' : 'inactivo',
                configuracion_completa: !!organizacion.configuracion_industria && Object.keys(organizacion.configuracion_industria).length > 0
            }
        };
    }


    // Cambiar plan de subscripción de una organización
    static async cambiarPlan(organizacionId, codigoPlan, configuracionPlan = {}) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            const resultado = await RLSHelper.withBypass(db, async (db) => {

                const orgQuery = `
                    SELECT id, nombre_comercial, plan_actual, fecha_activacion
                    FROM organizaciones
                    WHERE id = $1 AND activo = true
                `;
                const orgResult = await db.query(orgQuery, [organizacionId]);

                if (orgResult.rows.length === 0) {
                    throw new Error('Organización no encontrada');
                }

                const organizacion = orgResult.rows[0];
                const planAnterior = organizacion.plan_actual;

                const planQuery = `
                    SELECT id, codigo_plan, nombre_plan, precio_mensual, limite_citas_mes,
                           limite_profesionales, limite_servicios, limite_usuarios
                    FROM planes_subscripcion
                    WHERE codigo_plan = $1 AND activo = TRUE
                `;
                const planResult = await db.query(planQuery, [codigoPlan]);

                if (planResult.rows.length === 0) {
                    throw new Error(`Plan no encontrado: ${codigoPlan}`);
                }

                const nuevoPlan = planResult.rows[0];

                const updateOrgQuery = `
                    UPDATE organizaciones
                    SET
                        plan_actual = $1::plan_tipo,
                        fecha_activacion = CASE
                            WHEN plan_actual = 'trial' AND $1::plan_tipo != 'trial' THEN NOW()
                            ELSE fecha_activacion
                        END,
                        actualizado_en = NOW()
                    WHERE id = $2
                    RETURNING id, nombre_comercial, plan_actual, fecha_activacion
                `;

                const updateOrgResult = await db.query(updateOrgQuery, [codigoPlan, organizacionId]);

                const subscripcionQuery = `
                    INSERT INTO subscripciones (
                        organizacion_id, plan_id, precio_actual, fecha_inicio,
                        fecha_proximo_pago, estado, activa, metadata
                    ) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 'activa', true, $4)
                    ON CONFLICT (organizacion_id) DO UPDATE SET
                        plan_id = EXCLUDED.plan_id,
                        precio_actual = EXCLUDED.precio_actual,
                        fecha_proximo_pago = CASE
                            WHEN subscripciones.estado = 'trial' THEN CURRENT_DATE + INTERVAL '1 month'
                            ELSE subscripciones.fecha_proximo_pago
                        END,
                        estado = EXCLUDED.estado,
                        activa = EXCLUDED.activa,
                        metadata = EXCLUDED.metadata,
                        actualizado_en = NOW()
                    RETURNING id
                `;

                await db.query(subscripcionQuery, [
                    organizacionId,
                    nuevoPlan.id,
                    nuevoPlan.precio_mensual,
                    JSON.stringify(configuracionPlan)
                ]);

                return {
                    id: organizacionId,
                    nombre_comercial: organizacion.nombre_comercial,
                    plan_actual: updateOrgResult.rows[0].plan_actual,
                    plan_anterior: planAnterior,
                    nombre_plan: nuevoPlan.nombre_plan,
                    precio_mensual: nuevoPlan.precio_mensual,
                    fecha_activacion: updateOrgResult.rows[0].fecha_activacion,
                    configuracion_plan: configuracionPlan,
                    limites: {
                        max_citas_mes: nuevoPlan.limite_citas_mes,
                        max_profesionales: nuevoPlan.limite_profesionales,
                        max_servicios: nuevoPlan.limite_servicios,
                        max_usuarios: nuevoPlan.limite_usuarios
                    },
                    mensaje: `Plan cambiado exitosamente de ${planAnterior} a ${codigoPlan}`
                };
            });

            await db.query('COMMIT');
            return resultado;

        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        } finally {
            db.release();
        }
    }

    // Crear subscripción activa inicial para nueva organización
    static async crearSubscripcionActiva(organizacionId, codigoPlan = 'trial') {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            // Obtener información del plan
            const planQuery = `
                SELECT id, codigo_plan, precio_mensual
                FROM planes_subscripcion
                WHERE codigo_plan = $1
            `;

            const planResult = await db.query(planQuery, [codigoPlan]);

            if (planResult.rows.length === 0) {
                throw new Error(`Plan ${codigoPlan} no encontrado`);
            }

            const plan = planResult.rows[0];

            // Crear subscripción activa
            const subscripcionQuery = `
                INSERT INTO subscripciones (
                    organizacion_id, plan_id, precio_actual, fecha_inicio,
                    fecha_proximo_pago, estado, activa, metadata
                ) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 'activa', true, '{}'::jsonb)
                RETURNING id, organizacion_id, plan_id, estado, activa
            `;

            const result = await db.query(subscripcionQuery, [
                organizacionId,
                plan.id,
                plan.precio_mensual
            ]);

            return result.rows[0];
        });
    }
}

module.exports = OrganizacionModel;