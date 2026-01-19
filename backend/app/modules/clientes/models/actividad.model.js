/**
 * ====================================================================
 * MODELO ACTIVIDAD CLIENTE (Timeline)
 * ====================================================================
 *
 * Fase 4A - Timeline de Actividad (Ene 2026)
 * CRUD para notas, llamadas, tareas y timeline unificado
 *
 * ====================================================================
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');

class ActividadClienteModel {

    // ====================================================================
    // CRUD BÁSICO
    // ====================================================================

    /**
     * Crear una nueva actividad (nota, llamada, tarea, email)
     */
    static async crear(actividadData) {
        return await RLSContextManager.query(actividadData.organizacion_id, async (db) => {
            const query = `
                INSERT INTO cliente_actividades (
                    organizacion_id,
                    cliente_id,
                    tipo,
                    fuente,
                    referencia_tipo,
                    referencia_id,
                    titulo,
                    descripcion,
                    estado,
                    fecha_vencimiento,
                    prioridad,
                    usuario_id,
                    asignado_a
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *
            `;

            const values = [
                actividadData.organizacion_id,
                actividadData.cliente_id,
                actividadData.tipo,
                actividadData.fuente || 'manual',
                actividadData.referencia_tipo || null,
                actividadData.referencia_id || null,
                actividadData.titulo,
                actividadData.descripcion || null,
                // Para tareas: estado puede ser 'pendiente', para otros siempre 'completada'
                actividadData.tipo === 'tarea'
                    ? (actividadData.estado || 'pendiente')
                    : 'completada',
                actividadData.fecha_vencimiento || null,
                actividadData.prioridad || 'normal',
                actividadData.usuario_id || null,
                actividadData.asignado_a || null
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Listar actividades de un cliente con paginación y filtros
     */
    static async listarPorCliente(organizacionId, clienteId, opciones = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                page = 1,
                limit = 20,
                tipo,           // Filtrar por tipo (nota, llamada, tarea, email)
                estado,         // Para tareas: pendiente, completada, cancelada
                soloTareas = false
            } = opciones;

            const offset = (page - 1) * limit;
            const whereConditions = ['a.cliente_id = $1'];
            const params = [clienteId];
            let paramIndex = 2;

            if (tipo) {
                whereConditions.push(`a.tipo = $${paramIndex++}`);
                params.push(tipo);
            }

            if (soloTareas) {
                whereConditions.push(`a.tipo = 'tarea'`);
            }

            if (estado) {
                whereConditions.push(`a.estado = $${paramIndex++}`);
                params.push(estado);
            }

            const whereClause = whereConditions.join(' AND ');

            // Query principal
            const query = `
                SELECT
                    a.*,
                    u.nombre as usuario_nombre,
                    ua.nombre as asignado_nombre
                FROM cliente_actividades a
                LEFT JOIN usuarios u ON u.id = a.usuario_id
                LEFT JOIN usuarios ua ON ua.id = a.asignado_a
                WHERE ${whereClause}
                ORDER BY a.creado_en DESC
                LIMIT $${paramIndex++} OFFSET $${paramIndex}
            `;
            params.push(limit, offset);

            // Count query
            const countQuery = `
                SELECT COUNT(*) as total
                FROM cliente_actividades a
                WHERE ${whereClause}
            `;

            const [result, countResult] = await Promise.all([
                db.query(query, params),
                db.query(countQuery, params.slice(0, whereConditions.length))
            ]);

            const total = parseInt(countResult.rows[0].total);

            return {
                actividades: result.rows,
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
     * Obtener timeline unificado (actividades + citas + ventas)
     * Usa la función SQL get_cliente_timeline
     */
    static async obtenerTimeline(organizacionId, clienteId, limit = 20, offset = 0) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM get_cliente_timeline($1, $2, $3)
            `;

            const result = await db.query(query, [clienteId, limit, offset]);
            return result.rows;
        });
    }

    /**
     * Obtener actividad por ID
     */
    static async obtenerPorId(organizacionId, actividadId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    a.*,
                    u.nombre as usuario_nombre,
                    ua.nombre as asignado_nombre,
                    c.nombre as cliente_nombre
                FROM cliente_actividades a
                LEFT JOIN usuarios u ON u.id = a.usuario_id
                LEFT JOIN usuarios ua ON ua.id = a.asignado_a
                LEFT JOIN clientes c ON c.id = a.cliente_id
                WHERE a.id = $1
            `;

            const result = await db.query(query, [actividadId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar actividad (principalmente para tareas)
     */
    static async actualizar(organizacionId, actividadId, actividadData) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const campos = [];
            const values = [];
            let paramIndex = 1;

            // Campos actualizables
            const camposPermitidos = [
                'titulo',
                'descripcion',
                'estado',
                'fecha_vencimiento',
                'prioridad',
                'asignado_a'
            ];

            for (const campo of camposPermitidos) {
                if (actividadData[campo] !== undefined) {
                    campos.push(`${campo} = $${paramIndex++}`);
                    values.push(actividadData[campo]);
                }
            }

            if (campos.length === 0) {
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            values.push(actividadId);

            const query = `
                UPDATE cliente_actividades
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${paramIndex}
                RETURNING *
            `;

            const result = await db.query(query, values);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        });
    }

    /**
     * Eliminar actividad
     */
    static async eliminar(organizacionId, actividadId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                DELETE FROM cliente_actividades
                WHERE id = $1
                RETURNING id
            `;

            const result = await db.query(query, [actividadId]);

            if (result.rows.length === 0) {
                return null;
            }

            return { eliminado: true, id: actividadId };
        });
    }

    // ====================================================================
    // TAREAS
    // ====================================================================

    /**
     * Marcar tarea como completada
     */
    static async marcarCompletada(organizacionId, actividadId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE cliente_actividades
                SET estado = 'completada',
                    completada_en = NOW(),
                    actualizado_en = NOW()
                WHERE id = $1 AND tipo = 'tarea'
                RETURNING *
            `;

            const result = await db.query(query, [actividadId]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        });
    }

    /**
     * Obtener tareas pendientes de un usuario
     * Usa la función SQL get_tareas_pendientes_usuario
     */
    static async obtenerTareasPendientesUsuario(organizacionId, usuarioId, limit = 50) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM get_tareas_pendientes_usuario($1, $2, $3)
            `;

            const result = await db.query(query, [usuarioId, organizacionId, limit]);
            return result.rows;
        });
    }

    /**
     * Contar actividades de un cliente por tipo
     * Usa la función SQL contar_actividades_cliente
     */
    static async contarActividades(organizacionId, clienteId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM contar_actividades_cliente($1)
            `;

            const result = await db.query(query, [clienteId]);
            return result.rows[0] || {
                total: 0,
                notas: 0,
                llamadas: 0,
                tareas_pendientes: 0,
                tareas_completadas: 0
            };
        });
    }

    // ====================================================================
    // ACTIVIDADES DEL SISTEMA (AUTOMÁTICAS)
    // ====================================================================

    /**
     * Registrar actividad del sistema (para citas, ventas, etc.)
     * Usado por otros módulos para agregar al timeline
     */
    static async registrarActividadSistema(actividadData) {
        return await this.crear({
            ...actividadData,
            tipo: 'sistema',
            fuente: actividadData.fuente || 'sistema',
            estado: 'completada'
        });
    }
}

module.exports = ActividadClienteModel;
