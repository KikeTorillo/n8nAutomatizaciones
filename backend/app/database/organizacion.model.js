// Modelo de Organizaciones - Multi-tenant entity

const { getDb } = require('../config/database');
const logger = require('../utils/logger');
const { TIPOS_INDUSTRIA, PLANES, SELECT_FIELDS, CAMPOS_ACTUALIZABLES } = require('../constants/organizacion.constants');


class OrganizacionModel {
    // Constantes sincronizadas con ENUMs de base de datos
    static TIPOS_INDUSTRIA_VALIDOS = TIPOS_INDUSTRIA;
    static PLANES_VALIDOS = PLANES;
    static SELECT_FIELDS_SQL = SELECT_FIELDS.join(', ');

    /**
     * Helper para configurar bypass RLS
     * @private
     */
    static async _setBypassRLS(client, bypass = true) {
        await client.query("SET app.current_user_role = 'super_admin'");
        await client.query(`SET app.bypass_rls = '${bypass}'`);
    }

    /**
     * Helper para resetear bypass RLS en finally
     * @private
     */
    static async _resetBypassRLS(client) {
        try {
            await client.query("SET app.bypass_rls = 'false'");
        } catch (resetError) {
            logger.warn('Error resetting RLS bypass:', resetError.message);
        }
    }

    /**
     * Validar tipo de industria
     * @param {string} tipoIndustria - Tipo de industria a validar
     * @returns {boolean} true si es válido
     */
    static validarTipoIndustria(tipoIndustria) {
        return TIPOS_INDUSTRIA.includes(tipoIndustria);
    }

    /**
     * Validar tipo de plan
     * @param {string} tipoPlan - Tipo de plan a validar
     * @returns {boolean} true si es válido
     */
    static validarTipoPlan(tipoPlan) {
        return PLANES.includes(tipoPlan);
    }
    /**
     * Crear nueva organización
     * @param {Object} organizacionData - Datos de la organización
     * @returns {Promise<Object>} Organización creada
     */
    static async crear(organizacionData) {
        const client = await getDb();

        try {
            await this._setBypassRLS(client);

            const query = `
                INSERT INTO organizaciones (
                    nombre_comercial, razon_social, rfc_nif, tipo_industria,
                    configuracion_industria, email_admin, telefono, codigo_tenant, slug,
                    sitio_web, logo_url, colores_marca, configuracion_ui
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *
            `;

            // Generar código único para el tenant
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
                organizacionData.email_admin,
                organizacionData.telefono || null,
                codigoTenant,
                slug,
                organizacionData.sitio_web || null,
                organizacionData.logo_url || null,
                organizacionData.colores_marca || {},
                organizacionData.configuracion_ui || {}
            ];

            const result = await client.query(query, values);

            logger.info('Organización creada', {
                organizacion_id: result.rows[0].id
            });

            return result.rows[0];

        } catch (error) {
            logger.error('Error al crear organización:', error);
            throw new Error(`Error al crear organización: ${error.message}`);
        } finally {
            await this._resetBypassRLS(client);
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
            await this._setBypassRLS(client);

            const query = `
                SELECT ${this.SELECT_FIELDS_SQL}
                FROM organizaciones
                WHERE id = $1 AND activo = TRUE
            `;

            const result = await client.query(query, [id]);
            return result.rows[0] || null;

        } catch (error) {
            logger.error('Error al obtener organización por ID:', error);
            throw new Error(`Error al obtener organización: ${error.message}`);
        } finally {
            await this._resetBypassRLS(client);
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
            await this._setBypassRLS(client);

            const query = `
                SELECT ${this.SELECT_FIELDS_SQL}
                FROM organizaciones
                WHERE email_admin = $1 AND activo = TRUE
            `;

            const result = await client.query(query, [email]);
            return result.rows[0] || null;

        } catch (error) {
            logger.error('Error al obtener organización por email:', error);
            throw new Error(`Error al obtener organización: ${error.message}`);
        } finally {
            await this._resetBypassRLS(client);
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
            await this._setBypassRLS(client);

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
                SELECT ${this.SELECT_FIELDS_SQL}
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
            await this._resetBypassRLS(client);
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
            await this._setBypassRLS(client);

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
                WHERE id = $${paramCounter} AND activo = TRUE
                RETURNING ${this.SELECT_FIELDS_SQL}
            `;

            const result = await client.query(query, values);
            return result.rows[0] || null;

        } catch (error) {
            logger.error('Error al actualizar organización:', error);
            throw new Error(`Error al actualizar organización: ${error.message}`);
        } finally {
            await this._resetBypassRLS(client);
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
            await this._setBypassRLS(client);

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
            await this._resetBypassRLS(client);
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
            await this._setBypassRLS(client);

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
            await this._resetBypassRLS(client);
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
            await this._setBypassRLS(client);

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
                        -- Configuración de organización
                        o.moneda,

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
                    moneda: metricas.moneda || 'MXN'
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
            await this._resetBypassRLS(client);
            client.release();
        }
    }

    /**
     * Obtener estadísticas básicas de organización
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Estadísticas básicas de la organización
     */
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

    /**
     * Proceso de onboarding completo para nueva organización
     * @param {Object} organizacionData - Datos de la organización
     * @param {boolean} [importarPlantillas=true] - Si importar plantillas automáticamente
     * @returns {Promise<Object>} Resultado del onboarding
     */
    static async onboarding(organizacionData, importarPlantillas = true) {
        const client = await getDb();

        try {
            await client.query('BEGIN');

            // 1. Crear organización
            const nuevaOrganizacion = await this.crear(organizacionData);

            let resultadoPlantillas = null;

            // 2. Importar plantillas de servicios automáticamente si se solicita
            if (importarPlantillas) {
                try {
                    resultadoPlantillas = await this.agregarPlantillasServicios(
                        nuevaOrganizacion.id,
                        nuevaOrganizacion.tipo_industria
                    );
                } catch (plantillasError) {
                    logger.warn('Error importando plantillas durante onboarding:', {
                        organizacion_id: nuevaOrganizacion.id,
                        error: plantillasError.message
                    });
                    // No fallar el onboarding por esto
                }
            }

            await client.query('COMMIT');

            logger.info('Onboarding de organización completado', {
                organizacion_id: nuevaOrganizacion.id,
                nombre_comercial: nuevaOrganizacion.nombre_comercial,
                tipo_industria: nuevaOrganizacion.tipo_industria,
                plantillas_importadas: resultadoPlantillas?.servicios_importados || 0
            });

            return {
                organizacion: nuevaOrganizacion,
                plantillas: resultadoPlantillas,
                siguiente_paso: 'Crear usuarios y profesionales para la organización'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error en onboarding de organización:', error);
            throw new Error(`Error en proceso de onboarding: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Cambiar plan de subscripción de una organización
     * @param {number} organizacionId - ID de la organización
     * @param {string} codigoPlan - Código del plan ('trial', 'basico', 'profesional', 'empresarial', 'custom')
     * @param {Object} [configuracionPlan={}] - Configuración adicional del plan
     * @returns {Promise<Object>} Resultado del cambio de plan
     */
    static async cambiarPlan(organizacionId, codigoPlan, configuracionPlan = {}) {
        const client = await getDb();

        try {
            await client.query('BEGIN');
            await this._setBypassRLS(client);

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

            // Buscar el plan por código
            const planQuery = `
                SELECT id, codigo_plan, nombre_plan, precio_mensual, limite_citas_mes,
                       limite_profesionales, limite_servicios, limite_usuarios
                FROM planes_subscripcion
                WHERE codigo_plan = $1 AND activo = TRUE
            `;
            const planResult = await client.query(planQuery, [codigoPlan]);

            if (planResult.rows.length === 0) {
                throw new Error(`Plan no encontrado: ${codigoPlan}`);
            }

            const nuevoPlan = planResult.rows[0];

            // Actualizar el plan_actual en organizaciones
            const updateOrgQuery = `
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

            const updateOrgResult = await client.query(updateOrgQuery, [codigoPlan, organizacionId]);

            // Actualizar o crear subscripción
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

            await client.query(subscripcionQuery, [
                organizacionId,
                nuevoPlan.id,
                nuevoPlan.precio_mensual,
                JSON.stringify(configuracionPlan)
            ]);

            await client.query('COMMIT');

            logger.info('Plan de organización cambiado exitosamente', {
                organizacion_id: organizacionId,
                plan_anterior: planAnterior,
                plan_nuevo: codigoPlan,
                precio_mensual: nuevoPlan.precio_mensual
            });

            return {
                organizacion_id: organizacionId,
                nombre_comercial: organizacion.nombre_comercial,
                plan_anterior: planAnterior,
                plan_nuevo: codigoPlan,
                nombre_plan: nuevoPlan.nombre_plan,
                precio_mensual: nuevoPlan.precio_mensual,
                fecha_activacion: updateOrgResult.rows[0].fecha_activacion,
                configuracion_plan: configuracionPlan,
                limites: {
                    citas_mes: nuevoPlan.limite_citas_mes,
                    profesionales: nuevoPlan.limite_profesionales,
                    servicios: nuevoPlan.limite_servicios,
                    usuarios: nuevoPlan.limite_usuarios,
                    precio_mensual: nuevoPlan.precio_mensual
                },
                mensaje: `Plan cambiado exitosamente de ${planAnterior} a ${codigoPlan}`
            };

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error al cambiar plan de organización:', error);
            throw new Error(`Error al cambiar plan: ${error.message}`);
        } finally {
            await this._resetBypassRLS(client);
            client.release();
        }
    }
}

module.exports = OrganizacionModel;