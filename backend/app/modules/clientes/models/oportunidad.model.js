/**
 * ====================================================================
 * MODELO OPORTUNIDADES B2B
 * ====================================================================
 *
 * Fase 5 - Pipeline de Oportunidades (Ene 2026)
 * CRUD para oportunidades comerciales y pipeline Kanban
 *
 * ====================================================================
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');

class OportunidadModel {

    // ====================================================================
    // ETAPAS DEL PIPELINE
    // ====================================================================

    /**
     * Listar etapas del pipeline
     */
    static async listarEtapas(organizacionId, incluirInactivas = false) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT *
                FROM etapas_oportunidad
                WHERE organizacion_id = $1
                ${incluirInactivas ? '' : 'AND activo = true'}
                ORDER BY orden, id
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }

    /**
     * Crear etapa
     */
    static async crearEtapa(etapaData) {
        return await RLSContextManager.query(etapaData.organizacion_id, async (db) => {
            // Obtener el siguiente orden
            const ordenQuery = `
                SELECT COALESCE(MAX(orden), 0) + 1 as siguiente_orden
                FROM etapas_oportunidad
                WHERE organizacion_id = $1
            `;
            const ordenResult = await db.query(ordenQuery, [etapaData.organizacion_id]);
            const siguienteOrden = ordenResult.rows[0].siguiente_orden;

            const query = `
                INSERT INTO etapas_oportunidad (
                    organizacion_id,
                    nombre,
                    descripcion,
                    probabilidad_default,
                    color,
                    orden,
                    es_ganada,
                    es_perdida
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const values = [
                etapaData.organizacion_id,
                etapaData.nombre,
                etapaData.descripcion || null,
                etapaData.probabilidad_default || 10,
                etapaData.color || '#6366F1',
                etapaData.orden ?? siguienteOrden,
                etapaData.es_ganada || false,
                etapaData.es_perdida || false
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Actualizar etapa
     */
    static async actualizarEtapa(organizacionId, etapaId, etapaData) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const campos = [];
            const values = [];
            let paramIndex = 1;

            const camposPermitidos = [
                'nombre',
                'descripcion',
                'probabilidad_default',
                'color',
                'orden',
                'es_ganada',
                'es_perdida',
                'activo'
            ];

            for (const campo of camposPermitidos) {
                if (etapaData[campo] !== undefined) {
                    campos.push(`${campo} = $${paramIndex++}`);
                    values.push(etapaData[campo]);
                }
            }

            if (campos.length === 0) {
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            values.push(etapaId);

            const query = `
                UPDATE etapas_oportunidad
                SET ${campos.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING *
            `;

            const result = await db.query(query, values);
            return result.rows[0] || null;
        });
    }

    /**
     * Eliminar etapa (soft delete)
     */
    static async eliminarEtapa(organizacionId, etapaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar que no haya oportunidades en esta etapa
            const checkQuery = `
                SELECT COUNT(*) as count FROM oportunidades
                WHERE etapa_id = $1 AND estado = 'abierta'
            `;
            const checkResult = await db.query(checkQuery, [etapaId]);

            if (parseInt(checkResult.rows[0].count) > 0) {
                ErrorHelper.throwConflict('No se puede eliminar una etapa con oportunidades activas');
            }

            const query = `
                UPDATE etapas_oportunidad
                SET activo = false
                WHERE id = $1
                RETURNING id
            `;

            const result = await db.query(query, [etapaId]);
            return result.rows[0] ? { eliminado: true, id: etapaId } : null;
        });
    }

    /**
     * Reordenar etapas
     */
    static async reordenarEtapas(organizacionId, ordenEtapas) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            for (let i = 0; i < ordenEtapas.length; i++) {
                await db.query(
                    'UPDATE etapas_oportunidad SET orden = $1 WHERE id = $2',
                    [i + 1, ordenEtapas[i]]
                );
            }
            return { success: true };
        });
    }

    // ====================================================================
    // OPORTUNIDADES CRUD
    // ====================================================================

    /**
     * Crear oportunidad
     */
    static async crear(oportunidadData) {
        return await RLSContextManager.query(oportunidadData.organizacion_id, async (db) => {
            const query = `
                INSERT INTO oportunidades (
                    organizacion_id,
                    cliente_id,
                    etapa_id,
                    nombre,
                    descripcion,
                    probabilidad,
                    fecha_cierre_esperada,
                    ingreso_esperado,
                    moneda,
                    vendedor_id,
                    prioridad,
                    fuente,
                    creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *
            `;

            const values = [
                oportunidadData.organizacion_id,
                oportunidadData.cliente_id,
                oportunidadData.etapa_id || null,
                oportunidadData.nombre,
                oportunidadData.descripcion || null,
                oportunidadData.probabilidad || 10,
                oportunidadData.fecha_cierre_esperada || null,
                oportunidadData.ingreso_esperado || 0,
                oportunidadData.moneda || 'MXN',
                oportunidadData.vendedor_id || null,
                oportunidadData.prioridad || 'normal',
                oportunidadData.fuente || null,
                oportunidadData.creado_por || null
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Listar oportunidades con filtros y paginación
     */
    static async listar(organizacionId, opciones = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                page = 1,
                limit = 20,
                cliente_id,
                etapa_id,
                vendedor_id,
                estado,
                prioridad,
                fecha_desde,
                fecha_hasta,
                busqueda
            } = opciones;

            const offset = (page - 1) * limit;
            const whereConditions = ['o.organizacion_id = $1'];
            const params = [organizacionId];
            let paramIndex = 2;

            if (cliente_id) {
                whereConditions.push(`o.cliente_id = $${paramIndex++}`);
                params.push(cliente_id);
            }

            if (etapa_id) {
                whereConditions.push(`o.etapa_id = $${paramIndex++}`);
                params.push(etapa_id);
            }

            if (vendedor_id) {
                whereConditions.push(`o.vendedor_id = $${paramIndex++}`);
                params.push(vendedor_id);
            }

            if (estado) {
                whereConditions.push(`o.estado = $${paramIndex++}`);
                params.push(estado);
            }

            if (prioridad) {
                whereConditions.push(`o.prioridad = $${paramIndex++}`);
                params.push(prioridad);
            }

            if (fecha_desde) {
                whereConditions.push(`o.fecha_cierre_esperada >= $${paramIndex++}`);
                params.push(fecha_desde);
            }

            if (fecha_hasta) {
                whereConditions.push(`o.fecha_cierre_esperada <= $${paramIndex++}`);
                params.push(fecha_hasta);
            }

            if (busqueda) {
                whereConditions.push(`(
                    o.nombre ILIKE $${paramIndex} OR
                    c.nombre ILIKE $${paramIndex}
                )`);
                params.push(`%${busqueda}%`);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT
                    o.*,
                    c.nombre as cliente_nombre,
                    c.email as cliente_email,
                    c.telefono as cliente_telefono,
                    e.nombre as etapa_nombre,
                    e.color as etapa_color,
                    u.nombre as vendedor_nombre
                FROM oportunidades o
                LEFT JOIN clientes c ON c.id = o.cliente_id
                LEFT JOIN etapas_oportunidad e ON e.id = o.etapa_id
                LEFT JOIN usuarios u ON u.id = o.vendedor_id
                WHERE ${whereClause}
                ORDER BY o.fecha_cierre_esperada ASC NULLS LAST, o.creado_en DESC
                LIMIT $${paramIndex++} OFFSET $${paramIndex}
            `;
            params.push(limit, offset);

            const countQuery = `
                SELECT COUNT(*) as total
                FROM oportunidades o
                LEFT JOIN clientes c ON c.id = o.cliente_id
                WHERE ${whereClause}
            `;

            const [result, countResult] = await Promise.all([
                db.query(query, params),
                db.query(countQuery, params.slice(0, whereConditions.length))
            ]);

            const total = parseInt(countResult.rows[0].total);

            return {
                oportunidades: result.rows,
                paginacion: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            };
        });
    }

    /**
     * Listar oportunidades por cliente
     */
    static async listarPorCliente(organizacionId, clienteId, opciones = {}) {
        return await this.listar(organizacionId, { ...opciones, cliente_id: clienteId });
    }

    /**
     * Obtener oportunidad por ID
     */
    static async obtenerPorId(organizacionId, oportunidadId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    o.*,
                    c.nombre as cliente_nombre,
                    c.email as cliente_email,
                    c.telefono as cliente_telefono,
                    c.tipo as cliente_tipo,
                    e.nombre as etapa_nombre,
                    e.color as etapa_color,
                    e.es_ganada,
                    e.es_perdida,
                    u.nombre as vendedor_nombre,
                    uc.nombre as creado_por_nombre
                FROM oportunidades o
                LEFT JOIN clientes c ON c.id = o.cliente_id
                LEFT JOIN etapas_oportunidad e ON e.id = o.etapa_id
                LEFT JOIN usuarios u ON u.id = o.vendedor_id
                LEFT JOIN usuarios uc ON uc.id = o.creado_por
                WHERE o.id = $1
            `;

            const result = await db.query(query, [oportunidadId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar oportunidad
     */
    static async actualizar(organizacionId, oportunidadId, oportunidadData) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const campos = [];
            const values = [];
            let paramIndex = 1;

            const camposPermitidos = [
                'etapa_id',
                'nombre',
                'descripcion',
                'probabilidad',
                'fecha_cierre_esperada',
                'ingreso_esperado',
                'moneda',
                'vendedor_id',
                'prioridad',
                'fuente',
                'estado',
                'motivo_perdida'
            ];

            for (const campo of camposPermitidos) {
                if (oportunidadData[campo] !== undefined) {
                    campos.push(`${campo} = $${paramIndex++}`);
                    values.push(oportunidadData[campo]);
                }
            }

            if (campos.length === 0) {
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            values.push(oportunidadId);

            const query = `
                UPDATE oportunidades
                SET ${campos.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING *
            `;

            const result = await db.query(query, values);
            return result.rows[0] || null;
        });
    }

    /**
     * Eliminar oportunidad
     */
    static async eliminar(organizacionId, oportunidadId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                DELETE FROM oportunidades
                WHERE id = $1
                RETURNING id
            `;

            const result = await db.query(query, [oportunidadId]);
            return result.rows[0] ? { eliminado: true, id: oportunidadId } : null;
        });
    }

    // ====================================================================
    // OPERACIONES PIPELINE (KANBAN)
    // ====================================================================

    /**
     * Obtener pipeline completo para Kanban
     */
    static async obtenerPipeline(organizacionId, vendedorId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT * FROM get_pipeline_oportunidades($1, $2)`;
            const result = await db.query(query, [organizacionId, vendedorId]);
            return result.rows;
        });
    }

    /**
     * Mover oportunidad a otra etapa (drag & drop)
     */
    static async moverAEtapa(organizacionId, oportunidadId, nuevaEtapaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT * FROM mover_oportunidad_etapa($1, $2)`;
            const result = await db.query(query, [oportunidadId, nuevaEtapaId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Marcar como ganada
     */
    static async marcarGanada(organizacionId, oportunidadId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Buscar etapa "Ganada"
            const etapaQuery = `
                SELECT id FROM etapas_oportunidad
                WHERE organizacion_id = $1 AND es_ganada = true AND activo = true
                LIMIT 1
            `;
            const etapaResult = await db.query(etapaQuery, [organizacionId]);

            if (etapaResult.rows.length === 0) {
                ErrorHelper.throwNotFound('No existe una etapa de cierre configurada');
            }

            const etapaGanadaId = etapaResult.rows[0].id;

            const query = `
                UPDATE oportunidades
                SET etapa_id = $1,
                    estado = 'ganada',
                    probabilidad = 100,
                    fecha_cierre = NOW()
                WHERE id = $2
                RETURNING *
            `;

            const result = await db.query(query, [etapaGanadaId, oportunidadId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Marcar como perdida
     */
    static async marcarPerdida(organizacionId, oportunidadId, motivoPerdida) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Buscar etapa "Perdida"
            const etapaQuery = `
                SELECT id FROM etapas_oportunidad
                WHERE organizacion_id = $1 AND es_perdida = true AND activo = true
                LIMIT 1
            `;
            const etapaResult = await db.query(etapaQuery, [organizacionId]);

            if (etapaResult.rows.length === 0) {
                ErrorHelper.throwNotFound('No existe una etapa de pérdida configurada');
            }

            const etapaPerdidaId = etapaResult.rows[0].id;

            const query = `
                UPDATE oportunidades
                SET etapa_id = $1,
                    estado = 'perdida',
                    probabilidad = 0,
                    fecha_cierre = NOW(),
                    motivo_perdida = $2
                WHERE id = $3
                RETURNING *
            `;

            const result = await db.query(query, [etapaPerdidaId, motivoPerdida, oportunidadId]);
            return result.rows[0] || null;
        });
    }

    // ====================================================================
    // ESTADÍSTICAS Y REPORTES
    // ====================================================================

    /**
     * Obtener estadísticas de oportunidades por cliente
     */
    static async obtenerEstadisticasCliente(organizacionId, clienteId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT * FROM get_cliente_oportunidades_stats($1)`;
            const result = await db.query(query, [clienteId]);
            return result.rows[0];
        });
    }

    /**
     * Obtener pronóstico de ventas
     */
    static async obtenerPronostico(organizacionId, fechaInicio, fechaFin) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT * FROM get_pronostico_ventas($1, $2, $3)`;
            const result = await db.query(query, [organizacionId, fechaInicio, fechaFin]);
            return result.rows;
        });
    }

    /**
     * Obtener estadísticas generales del pipeline
     */
    static async obtenerEstadisticasPipeline(organizacionId, vendedorId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereVendedor = '';
            const params = [organizacionId];

            if (vendedorId) {
                whereVendedor = 'AND vendedor_id = $2';
                params.push(vendedorId);
            }

            const query = `
                SELECT
                    COUNT(*) FILTER (WHERE estado = 'abierta') as abiertas,
                    COUNT(*) FILTER (WHERE estado = 'ganada' AND fecha_cierre >= DATE_TRUNC('month', CURRENT_DATE)) as ganadas_mes,
                    COUNT(*) FILTER (WHERE estado = 'perdida' AND fecha_cierre >= DATE_TRUNC('month', CURRENT_DATE)) as perdidas_mes,
                    COALESCE(SUM(ingreso_esperado) FILTER (WHERE estado = 'abierta'), 0) as valor_pipeline,
                    COALESCE(SUM(ingreso_esperado * probabilidad / 100) FILTER (WHERE estado = 'abierta'), 0) as valor_ponderado,
                    COALESCE(SUM(ingreso_esperado) FILTER (WHERE estado = 'ganada' AND fecha_cierre >= DATE_TRUNC('month', CURRENT_DATE)), 0) as ganado_mes,
                    CASE
                        WHEN COUNT(*) FILTER (WHERE estado IN ('ganada', 'perdida') AND fecha_cierre >= DATE_TRUNC('month', CURRENT_DATE)) > 0
                        THEN ROUND(
                            COUNT(*) FILTER (WHERE estado = 'ganada' AND fecha_cierre >= DATE_TRUNC('month', CURRENT_DATE))::numeric /
                            COUNT(*) FILTER (WHERE estado IN ('ganada', 'perdida') AND fecha_cierre >= DATE_TRUNC('month', CURRENT_DATE))::numeric * 100,
                            1
                        )
                        ELSE 0
                    END as tasa_conversion_mes
                FROM oportunidades
                WHERE organizacion_id = $1 ${whereVendedor}
            `;

            const result = await db.query(query, params);
            return result.rows[0];
        });
    }
}

module.exports = OportunidadModel;
