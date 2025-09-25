/**
 * Modelo de Organizaciones (Tenants)
 * Entidad principal del sistema multi-tenant
 * Cada organización es un tenant independiente con aislamiento completo de datos
 */

const { getDb } = require('../config/database');
const logger = require('../utils/logger');

class OrganizacionModel {
    /**
     * Crear una nueva organización
     * @param {Object} organizacionData - Datos de la organización
     * @param {string} organizacionData.nombre_comercial - Nombre comercial de la organización
     * @param {string} organizacionData.tipo_industria - ENUM: Clasificación categórica (barberia, spa, consultorio_medico, etc.)
     * @param {Object} [organizacionData.configuracion_industria] - JSONB: Configuraciones operativas específicas por industria
     * @param {string} organizacionData.email_admin - Email del administrador
     * @param {string} [organizacionData.telefono] - Teléfono de contacto
     *
     * @description
     * CAMPOS DE INDUSTRIA (DOS PROPÓSITOS DIFERENTES):
     * - tipo_industria: ENUM fijo para clasificación y validaciones
     * - configuracion_industria: JSONB flexible para configuraciones operativas
     *
     * @example
     * // Ejemplo de uso:
     * {
     *   "tipo_industria": "barberia",  // ENUM: Clasificación fija
     *   "configuracion_industria": {   // JSONB: Config personalizada
     *     "horario_especial": true,
     *     "servicios_a_domicilio": false
     *   }
     * }
     *
     * @returns {Promise<Object>} Organización creada
     */
    static async crear(organizacionData) {
        const client = await getDb();

        try {
            // TEST: Verificar si podemos hacer SELECT básico
            const testQuery = await client.query("SELECT current_user, current_database()");
            logger.info('Usuario BD actual:', testQuery.rows[0]);

            // Verificar configuraciones RLS antes del bypass
            const rlsStatus = await client.query("SHOW row_security");
            logger.info('RLS Status antes:', rlsStatus.rows[0]);

            // Intentar establecer configuraciones para bypass
            await client.query("SET app.current_user_role = 'super_admin'");
            await client.query("SET app.bypass_rls = 'true'");

            // Verificar que las configuraciones se aplicaron
            const checkRole = await client.query("SELECT current_setting('app.current_user_role', true) as role");
            const checkBypass = await client.query("SELECT current_setting('app.bypass_rls', true) as bypass");
            logger.info('Configuraciones aplicadas:', {
                role: checkRole.rows[0].role,
                bypass: checkBypass.rows[0].bypass
            });

            // INSERT con ambos campos de industria y telefono opcional
            const query = `
                INSERT INTO organizaciones (
                    nombre_comercial, tipo_industria, configuracion_industria,
                    email_admin, telefono, codigo_tenant, slug
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING
                    id, nombre_comercial, tipo_industria, configuracion_industria,
                    email_admin, telefono, codigo_tenant, slug
            `;

            // Generar código único para el tenant
            const codigoTenant = `org_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const slug = organizacionData.nombre_comercial.toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .substring(0, 50);

            const values = [
                organizacionData.nombre_comercial,
                organizacionData.tipo_industria, // ENUM: Clasificación categórica
                organizacionData.configuracion_industria || {}, // JSONB: Configuraciones operativas
                organizacionData.email_admin,
                organizacionData.telefono || null, // telefono opcional
                codigoTenant,
                slug
            ];

            logger.info('Intentando INSERT con valores:', values);
            const result = await client.query(query, values);

            logger.info('Organización creada exitosamente', {
                organizacion_id: result.rows[0].id,
                nombre_comercial: result.rows[0].nombre_comercial,
                tipo_industria: result.rows[0].tipo_industria
            });

            return result.rows[0];

        } catch (error) {
            logger.error('Error al crear organización:', error);
            throw new Error(`Error al crear organización: ${error.message}`);
        } finally {
            // Resetear configuraciones
            try {
                await client.query("SET row_security = on");
                await client.query("SET app.bypass_rls = 'false'");
            } catch (resetError) {
                // Log pero no fallar por esto
                console.warn('Error resetting RLS bypass:', resetError.message);
            }
            client.release();
        }
    }

    /**
     * Obtener organización por ID
     * @param {number} id - ID de la organización
     * @returns {Promise<Object|null>} Organización encontrada o null
     */
    static async obtenerPorId(id) {
        const client = await getDb();

        try {
            // Configurar bypass RLS para super admin
            await client.query("SET app.current_user_role = 'super_admin'");
            await client.query("SET app.bypass_rls = 'true'");

            const query = `
                SELECT
                    id, codigo_tenant, slug, nombre_comercial,
                    tipo_industria, configuracion_industria,
                    email_admin, telefono, plan_actual, activo, suspendido,
                    fecha_registro, creado_en, actualizado_en
                FROM organizaciones
                WHERE id = $1 AND activo = TRUE
            `;

            const result = await client.query(query, [id]);
            return result.rows[0] || null;

        } catch (error) {
            logger.error('Error al obtener organización por ID:', error);
            throw new Error(`Error al obtener organización: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Obtener organización por email
     * @param {string} email - Email de la organización
     * @returns {Promise<Object|null>} Organización encontrada o null
     */
    static async obtenerPorEmail(email) {
        const client = await getDb();

        try {
            const query = `
                SELECT
                    id, nombre_comercial, tipo_industria, email_admin, telefono,
                    configuracion_industria, codigo_tenant, slug, fecha_registro
                FROM organizaciones
                WHERE email_admin = $1
            `;

            const result = await client.query(query, [email]);
            return result.rows[0] || null;

        } catch (error) {
            logger.error('Error al obtener organización por email:', error);
            throw new Error(`Error al obtener organización: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Listar todas las organizaciones con paginación
     * @param {Object} options - Opciones de listado
     * @param {number} [options.page=1] - Página actual
     * @param {number} [options.limit=10] - Límite por página
     * @param {string} [options.tipo_industria] - Filtrar por tipo de industria
     * @param {boolean} [options.activo=true] - Filtrar por estado activo
     * @returns {Promise<Object>} Lista de organizaciones con metadatos de paginación
     */
    static async listar(options = {}) {
        const client = await getDb();

        try {
            // Configurar bypass RLS para super admin
            await client.query("SET app.current_user_role = 'super_admin'");
            await client.query("SET app.bypass_rls = 'true'");

            const { page = 1, limit = 10, tipo_industria, activo = true } = options;
            const offset = (page - 1) * limit;

            let whereConditions = ['activo = $1'];
            let values = [activo];
            let paramCounter = 2;

            if (tipo_industria) {
                whereConditions.push(`tipo_industria = $${paramCounter}`);
                values.push(tipo_industria);
                paramCounter++;
            }

            const whereClause = whereConditions.join(' AND ');

            // Query para obtener el total de registros
            const countQuery = `
                SELECT COUNT(*) as total
                FROM organizaciones
                WHERE ${whereClause}
            `;

            // Query para obtener los registros paginados
            const dataQuery = `
                SELECT
                    id, codigo_tenant, slug, nombre_comercial, tipo_industria,
                    email_admin, telefono, plan_actual, activo, suspendido,
                    fecha_registro, creado_en, actualizado_en
                FROM organizaciones
                WHERE ${whereClause}
                ORDER BY creado_en DESC
                LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
            `;

            const countResult = await client.query(countQuery, values);
            const dataResult = await client.query(dataQuery, [...values, limit, offset]);

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

        } catch (error) {
            logger.error('Error al listar organizaciones:', error);
            throw new Error(`Error al listar organizaciones: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Actualizar organización
     * @param {number} id - ID de la organización
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<Object|null>} Organización actualizada o null
     */
    static async actualizar(id, updateData) {
        const client = await getDb();

        try {
            // Configurar bypass RLS para super admin
            await client.query("SET app.current_user_role = 'super_admin'");
            await client.query("SET app.bypass_rls = 'true'");

            const allowedFields = ['nombre_comercial', 'tipo_industria', 'email_admin', 'telefono'];
            const updateFields = [];
            const values = [];
            let paramCounter = 1;

            // Construir query dinámicamente basado en campos permitidos
            for (const [key, value] of Object.entries(updateData)) {
                if (allowedFields.includes(key) && value !== undefined) {
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
                WHERE id = $${paramCounter} AND activo = TRUE
                RETURNING
                    id, codigo_tenant, slug, nombre_comercial,
                    tipo_industria, email_admin, telefono,
                    plan_actual, activo, suspendido,
                    fecha_registro, creado_en, actualizado_en
            `;

            const result = await client.query(query, values);

            if (result.rows.length > 0) {
                logger.info('Organización actualizada exitosamente', {
                    organizacion_id: result.rows[0].id,
                    campos_actualizados: Object.keys(updateData)
                });
            }

            return result.rows[0] || null;

        } catch (error) {
            logger.error('Error al actualizar organización:', error);
            throw new Error(`Error al actualizar organización: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Desactivar organización (soft delete)
     * @param {number} id - ID de la organización
     * @returns {Promise<boolean>} true si se desactivó exitosamente
     */
    static async desactivar(id) {
        const client = await getDb();

        try {
            // Configurar bypass RLS para super admin
            await client.query("SET app.current_user_role = 'super_admin'");
            await client.query("SET app.bypass_rls = 'true'");

            const query = `
                UPDATE organizaciones
                SET activo = FALSE, actualizado_en = NOW()
                WHERE id = $1 AND activo = TRUE
                RETURNING id
            `;

            const result = await client.query(query, [id]);

            if (result.rows.length > 0) {
                logger.info('Organización desactivada exitosamente', {
                    organizacion_id: result.rows[0].id
                });
                return true;
            }

            return false;

        } catch (error) {
            logger.error('Error al desactivar organización:', error);
            throw new Error(`Error al desactivar organización: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Verificar límites de la organización
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Información sobre límites y uso actual
     */
    static async verificarLimites(organizacionId) {
        const client = await getDb();

        try {
            const query = `
                SELECT
                    o.limite_citas_mes,
                    o.limite_profesionales,
                    o.limite_servicios,
                    COUNT(DISTINCT c.id) FILTER (
                        WHERE c.fecha_cita >= date_trunc('month', CURRENT_DATE)
                        AND c.fecha_cita < date_trunc('month', CURRENT_DATE) + interval '1 month'
                    ) as citas_mes_actual,
                    COUNT(DISTINCT p.id) as profesionales_activos,
                    COUNT(DISTINCT s.id) as servicios_activos
                FROM organizaciones o
                LEFT JOIN citas c ON o.id = c.organizacion_id AND c.estado != 'cancelada'
                LEFT JOIN profesionales p ON o.id = p.organizacion_id AND p.estado = 'activo'
                LEFT JOIN servicios s ON o.id = s.organizacion_id AND s.estado = 'activo'
                WHERE o.id = $1 AND o.activo = TRUE
                GROUP BY o.id, o.limite_citas_mes, o.limite_profesionales, o.limite_servicios
            `;

            const result = await client.query(query, [organizacionId]);

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

        } catch (error) {
            logger.error('Error al verificar límites de organización:', error);
            throw new Error(`Error al verificar límites: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Agregar plantillas de servicios automáticamente durante onboarding
     * @param {number} organizacionId - ID de la organización
     * @param {string} tipoIndustria - Tipo de industria de la organización
     * @returns {Promise<Object>} Resultado de importación de plantillas
     */
    static async agregarPlantillasServicios(organizacionId, tipoIndustria) {
        const client = await getDb();

        try {
            // Configurar bypass RLS para super admin
            await client.query("SET app.current_user_role = 'super_admin'");
            await client.query("SET app.bypass_rls = 'true'");

            // Obtener plantillas de servicios para la industria específica
            const plantillasQuery = `
                SELECT id, nombre, descripcion, categoria, subcategoria,
                       duracion_minutos, precio_sugerido, precio_minimo, precio_maximo,
                       requiere_preparacion_minutos, tiempo_limpieza_minutos,
                       max_clientes_simultaneos, tags, configuracion_especifica
                FROM plantillas_servicios
                WHERE tipo_industria = $1 AND activo = true
                ORDER BY popularidad DESC, nombre ASC
            `;

            const plantillas = await client.query(plantillasQuery, [tipoIndustria]);

            if (plantillas.rows.length === 0) {
                logger.warn('No se encontraron plantillas para la industria', { tipoIndustria });
                return {
                    servicios_importados: 0,
                    total_plantillas: 0,
                    mensaje: `No hay plantillas disponibles para industria ${tipoIndustria}`
                };
            }

            let serviciosImportados = 0;
            const serviciosCreados = [];

            for (const plantilla of plantillas.rows) {
                try {
                    // Crear servicio basado en plantilla
                    const insertServiceQuery = `
                        INSERT INTO servicios (
                            organizacion_id, plantilla_servicio_id, nombre, descripcion,
                            categoria, subcategoria, duracion_minutos, precio, precio_minimo,
                            precio_maximo, requiere_preparacion_minutos, tiempo_limpieza_minutos,
                            max_clientes_simultaneos, tags, configuracion_especifica, activo
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                        RETURNING id, nombre, precio
                    `;

                    const servicioResult = await client.query(insertServiceQuery, [
                        organizacionId,
                        plantilla.id,
                        plantilla.nombre,
                        plantilla.descripcion,
                        plantilla.categoria,
                        plantilla.subcategoria,
                        plantilla.duracion_minutos,
                        plantilla.precio_sugerido || 100.00, // precio default
                        plantilla.precio_minimo,
                        plantilla.precio_maximo,
                        plantilla.requiere_preparacion_minutos,
                        plantilla.tiempo_limpieza_minutos,
                        plantilla.max_clientes_simultaneos,
                        plantilla.tags,
                        plantilla.configuracion_especifica,
                        true // activo por default
                    ]);

                    serviciosImportados++;
                    serviciosCreados.push(servicioResult.rows[0]);

                } catch (servicioError) {
                    logger.warn('Error importando servicio individual', {
                        plantilla_id: plantilla.id,
                        nombre: plantilla.nombre,
                        error: servicioError.message
                    });
                    // Continuar con las demás plantillas
                }
            }

            logger.info('Plantillas de servicios importadas', {
                organizacion_id: organizacionId,
                tipo_industria: tipoIndustria,
                plantillas_disponibles: plantillas.rows.length,
                servicios_importados: serviciosImportados
            });

            return {
                servicios_importados: serviciosImportados,
                total_plantillas: plantillas.rows.length,
                servicios_creados: serviciosCreados,
                mensaje: `${serviciosImportados} servicios importados exitosamente`
            };

        } catch (error) {
            logger.error('Error al agregar plantillas de servicios:', error);
            throw new Error(`Error al importar plantillas: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Obtener métricas completas de la organización para dashboard
     * @param {number} organizacionId - ID de la organización
     * @param {string} periodo - Periodo de métricas ('mes', 'semana', 'año')
     * @returns {Promise<Object>} Métricas completas de la organización
     */
    static async obtenerMetricas(organizacionId, periodo = 'mes') {
        const client = await getDb();

        try {
            // Configurar bypass RLS para super admin
            await client.query("SET app.current_user_role = 'super_admin'");
            await client.query("SET app.bypass_rls = 'true'");

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

            // Query principal de métricas
            const metricsQuery = `
                WITH metricas_organizacion AS (
                    SELECT
                        -- Métricas de citas
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

                        -- Métricas financieras
                        COALESCE(SUM(c.precio_final) FILTER (
                            WHERE c.fecha_cita >= ${fechaInicio}
                            AND c.fecha_cita < ${fechaFin}
                            AND c.estado = 'completada'
                        ), 0) as ingresos_periodo,
                        COALESCE(AVG(c.precio_final) FILTER (
                            WHERE c.fecha_cita >= ${fechaInicio}
                            AND c.fecha_cita < ${fechaFin}
                            AND c.estado = 'completada'
                        ), 0) as ticket_promedio,

                        -- Métricas de clientes
                        COUNT(DISTINCT c.cliente_id) FILTER (
                            WHERE c.fecha_cita >= ${fechaInicio}
                            AND c.fecha_cita < ${fechaFin}
                        ) as clientes_atendidos,
                        COUNT(DISTINCT cl.id) FILTER (
                            WHERE cl.creado_en >= ${fechaInicio}
                            AND cl.creado_en < ${fechaFin}
                        ) as clientes_nuevos,

                        -- Métricas operativas
                        COUNT(DISTINCT p.id) FILTER (WHERE p.activo = true) as profesionales_activos,
                        COUNT(DISTINCT s.id) FILTER (WHERE s.activo = true) as servicios_activos,

                        -- Satisfacción
                        COALESCE(AVG(c.calificacion_cliente) FILTER (
                            WHERE c.fecha_cita >= ${fechaInicio}
                            AND c.fecha_cita < ${fechaFin}
                            AND c.calificacion_cliente IS NOT NULL
                        ), 5.0) as satisfaccion_promedio

                    FROM organizaciones o
                    LEFT JOIN citas c ON o.id = c.organizacion_id
                    LEFT JOIN clientes cl ON o.id = cl.organizacion_id
                    LEFT JOIN profesionales p ON o.id = p.organizacion_id
                    LEFT JOIN servicios s ON o.id = s.organizacion_id
                    WHERE o.id = $1 AND o.activo = true
                ),
                servicios_populares AS (
                    SELECT
                        s.nombre as servicio_nombre,
                        s.precio,
                        COUNT(c.id) as veces_solicitado,
                        SUM(c.precio_final) as ingresos_servicio
                    FROM servicios s
                    LEFT JOIN citas c ON s.id = c.servicio_id
                        AND c.fecha_cita >= ${fechaInicio}
                        AND c.fecha_cita < ${fechaFin}
                        AND c.estado = 'completada'
                    WHERE s.organizacion_id = $1 AND s.activo = true
                    GROUP BY s.id, s.nombre, s.precio
                    ORDER BY veces_solicitado DESC
                    LIMIT 5
                )
                SELECT
                    m.*,
                    COALESCE(
                        (SELECT json_agg(sp) FROM servicios_populares sp),
                        '[]'::json
                    ) as servicios_populares
                FROM metricas_organizacion m
            `;

            const result = await client.query(metricsQuery, [organizacionId]);

            if (result.rows.length === 0) {
                throw new Error('Organización no encontrada');
            }

            const metricas = result.rows[0];

            // Calcular KPIs derivados
            const tasaCompletitud = metricas.citas_periodo > 0
                ? Math.round((parseInt(metricas.citas_completadas) / parseInt(metricas.citas_periodo)) * 100)
                : 0;

            const tasaCancelacion = metricas.citas_periodo > 0
                ? Math.round((parseInt(metricas.citas_canceladas) / parseInt(metricas.citas_periodo)) * 100)
                : 0;

            return {
                periodo: periodo,
                resumen: {
                    citas_total: parseInt(metricas.citas_periodo),
                    citas_completadas: parseInt(metricas.citas_completadas),
                    citas_canceladas: parseInt(metricas.citas_canceladas),
                    tasa_completitud: tasaCompletitud,
                    tasa_cancelacion: tasaCancelacion
                },
                financieras: {
                    ingresos_periodo: parseFloat(metricas.ingresos_periodo),
                    ticket_promedio: parseFloat(metricas.ticket_promedio),
                    moneda: 'MXN' // TODO: obtener de configuración de organización
                },
                clientes: {
                    clientes_atendidos: parseInt(metricas.clientes_atendidos),
                    clientes_nuevos: parseInt(metricas.clientes_nuevos),
                    satisfaccion_promedio: parseFloat(metricas.satisfaccion_promedio)
                },
                operativas: {
                    profesionales_activos: parseInt(metricas.profesionales_activos),
                    servicios_activos: parseInt(metricas.servicios_activos)
                },
                servicios_populares: metricas.servicios_populares || []
            };

        } catch (error) {
            logger.error('Error al obtener métricas de organización:', error);
            throw new Error(`Error al obtener métricas: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Cambiar plan de subscripción de una organización
     * @param {number} organizacionId - ID de la organización
     * @param {string} nuevoPlan - Nuevo plan ('trial', 'basico', 'profesional', 'empresarial', 'custom')
     * @param {Object} configuracionPlan - Configuración específica del plan
     * @returns {Promise<Object>} Resultado del cambio de plan
     */
    static async cambiarPlan(organizacionId, nuevoPlan, configuracionPlan = {}) {
        const client = await getDb();

        try {
            await client.query('BEGIN');

            // Configurar bypass RLS para super admin
            await client.query("SET app.current_user_role = 'super_admin'");
            await client.query("SET app.bypass_rls = 'true'");

            // Verificar que la organización existe
            const orgQuery = `
                SELECT id, nombre_comercial, plan_actual, fecha_activacion
                FROM organizaciones
                WHERE id = $1 AND activo = true
            `;
            const orgResult = await client.query(orgQuery, [organizacionId]);

            if (orgResult.rows.length === 0) {
                throw new Error('Organización no encontrada');
            }

            const organizacion = orgResult.rows[0];
            const planAnterior = organizacion.plan_actual;

            // Definir límites por plan
            const limitesPorPlan = {
                trial: {
                    limite_citas_mes: 50,
                    limite_profesionales: 2,
                    limite_servicios: 10,
                    precio_mensual: 0
                },
                basico: {
                    limite_citas_mes: 200,
                    limite_profesionales: 5,
                    limite_servicios: 25,
                    precio_mensual: 299
                },
                profesional: {
                    limite_citas_mes: 1000,
                    limite_profesionales: 15,
                    limite_servicios: 100,
                    precio_mensual: 599
                },
                empresarial: {
                    limite_citas_mes: 5000,
                    limite_profesionales: 50,
                    limite_servicios: 500,
                    precio_mensual: 1299
                },
                custom: {
                    limite_citas_mes: configuracionPlan.limite_citas_mes || 10000,
                    limite_profesionales: configuracionPlan.limite_profesionales || 100,
                    limite_servicios: configuracionPlan.limite_servicios || 1000,
                    precio_mensual: configuracionPlan.precio_mensual || 2500
                }
            };

            const nuevosLimites = limitesPorPlan[nuevoPlan];
            if (!nuevosLimites) {
                throw new Error(`Plan no válido: ${nuevoPlan}`);
            }

            // Actualizar la organización con el nuevo plan
            const updateQuery = `
                UPDATE organizaciones
                SET
                    plan_actual = $1,
                    fecha_activacion = CASE
                        WHEN plan_actual = 'trial' AND $1 != 'trial' THEN NOW()
                        ELSE fecha_activacion
                    END,
                    actualizado_en = NOW()
                WHERE id = $2
                RETURNING id, nombre_comercial, plan_actual, fecha_activacion
            `;

            const updateResult = await client.query(updateQuery, [nuevoPlan, organizacionId]);

            // Registrar el cambio en historial de subscripciones (si existe la tabla)
            try {
                const historialQuery = `
                    INSERT INTO historial_subscripciones (
                        organizacion_id, plan_anterior, plan_nuevo,
                        fecha_cambio, precio_mensual, configuracion_plan, activo
                    ) VALUES ($1, $2, $3, NOW(), $4, $5, true)
                `;

                await client.query(historialQuery, [
                    organizacionId,
                    planAnterior,
                    nuevoPlan,
                    nuevosLimites.precio_mensual,
                    JSON.stringify({ limites: nuevosLimites, ...configuracionPlan })
                ]);

            } catch (historialError) {
                logger.warn('No se pudo registrar en historial_subscripciones:', historialError.message);
                // No fallar por esto, la tabla podría no existir aún
            }

            await client.query('COMMIT');

            logger.info('Plan de organización cambiado exitosamente', {
                organizacion_id: organizacionId,
                plan_anterior: planAnterior,
                plan_nuevo: nuevoPlan,
                limites: nuevosLimites
            });

            return {
                organizacion_id: organizacionId,
                nombre_comercial: organizacion.nombre_comercial,
                plan_anterior: planAnterior,
                plan_nuevo: nuevoPlan,
                fecha_activacion: updateResult.rows[0].fecha_activacion,
                limites: nuevosLimites,
                mensaje: `Plan cambiado exitosamente de ${planAnterior} a ${nuevoPlan}`
            };

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error al cambiar plan de organización:', error);
            throw new Error(`Error al cambiar plan: ${error.message}`);
        } finally {
            client.release();
        }
    }
}

module.exports = OrganizacionModel;