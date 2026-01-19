/**
 * ====================================================================
 * MODEL - WORKFLOW INSTANCIAS
 * ====================================================================
 *
 * Operaciones de base de datos para instancias de workflow.
 * Incluye consultas para bandeja de aprobaciones, historial y delegaciones.
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class WorkflowInstanciasModel {

    // ========================================================================
    // BANDEJA DE APROBACIONES
    // ========================================================================

    /**
     * Obtener aprobaciones pendientes para un usuario
     */
    static async obtenerPendientes(usuarioId, organizacionId, filtros = {}) {
        return await RLSContextManager.withBypass(async (db) => {
            let whereConditions = [
                'wi.organizacion_id = $1',
                'wi.estado = \'en_progreso\'',
                'puede_aprobar_workflow(wi.id, $2) = true'
            ];
            let values = [organizacionId, usuarioId];
            let paramCounter = 3;

            // Filtro por tipo de entidad
            if (filtros.entidad_tipo) {
                whereConditions.push(`wi.entidad_tipo = $${paramCounter}`);
                values.push(filtros.entidad_tipo);
                paramCounter++;
            }

            const query = `
                SELECT
                    wi.id,
                    wi.workflow_id,
                    wi.entidad_tipo,
                    wi.entidad_id,
                    wi.estado,
                    wi.prioridad,
                    wi.contexto,
                    wi.iniciado_en,
                    wi.fecha_limite,
                    wd.nombre AS workflow_nombre,
                    wd.descripcion AS workflow_descripcion,
                    wp.nombre AS paso_nombre,
                    wp.descripcion AS paso_descripcion,
                    u.nombre AS solicitante_nombre,
                    u.email AS solicitante_email,
                    -- Datos específicos según tipo de entidad
                    CASE
                        WHEN wi.entidad_tipo = 'orden_compra' THEN
                            (SELECT jsonb_build_object(
                                'folio', oc.folio,
                                'total', oc.total,
                                'proveedor_nombre', p.nombre,
                                'items_count', (SELECT COUNT(*) FROM ordenes_compra_items WHERE orden_compra_id = oc.id)
                            )
                            FROM ordenes_compra oc
                            LEFT JOIN proveedores p ON p.id = oc.proveedor_id
                            WHERE oc.id = wi.entidad_id)
                        ELSE NULL
                    END AS entidad_resumen,
                    -- Tiempo de espera
                    EXTRACT(EPOCH FROM (NOW() - wi.iniciado_en)) / 3600 AS horas_pendiente
                FROM workflow_instancias wi
                JOIN workflow_definiciones wd ON wd.id = wi.workflow_id
                JOIN workflow_pasos wp ON wp.id = wi.paso_actual_id
                LEFT JOIN usuarios u ON u.id = wi.iniciado_por
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY wi.prioridad DESC, wi.iniciado_en ASC
                LIMIT $${paramCounter}
                OFFSET $${paramCounter + 1}
            `;

            values.push(filtros.limit || 20);
            values.push(filtros.offset || 0);

            const result = await db.query(query, values);

            // Obtener conteo total (usar las mismas condiciones pero sin LIMIT/OFFSET)
            const countQuery = `
                SELECT COUNT(*) as total
                FROM workflow_instancias wi
                WHERE ${whereConditions.join(' AND ')}
            `;

            const countResult = await db.query(countQuery, values.slice(0, paramCounter - 1));

            return {
                instancias: result.rows,
                total: parseInt(countResult.rows[0]?.total || 0),
                limit: filtros.limit || 20,
                offset: filtros.offset || 0
            };
        });
    }

    /**
     * Contar aprobaciones pendientes para badge
     */
    static async contarPendientes(usuarioId, organizacionId) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT contar_aprobaciones_pendientes($1, $2) as total
            `;

            const result = await db.query(query, [usuarioId, organizacionId]);
            return parseInt(result.rows[0]?.total || 0);
        });
    }

    /**
     * Obtener instancia por ID con detalles completos
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.withBypass(async (db) => {
            // Obtener instancia con workflow y paso
            const instanciaQuery = `
                SELECT
                    wi.*,
                    wd.nombre AS workflow_nombre,
                    wd.descripcion AS workflow_descripcion,
                    wd.codigo AS workflow_codigo,
                    wp.nombre AS paso_nombre,
                    wp.descripcion AS paso_descripcion,
                    wp.tipo AS paso_tipo,
                    wp.config AS paso_config,
                    u.nombre AS solicitante_nombre,
                    u.email AS solicitante_email
                FROM workflow_instancias wi
                JOIN workflow_definiciones wd ON wd.id = wi.workflow_id
                JOIN workflow_pasos wp ON wp.id = wi.paso_actual_id
                LEFT JOIN usuarios u ON u.id = wi.iniciado_por
                WHERE wi.id = $1 AND wi.organizacion_id = $2
            `;

            const instanciaResult = await db.query(instanciaQuery, [id, organizacionId]);

            if (instanciaResult.rows.length === 0) {
                return null;
            }

            const instancia = instanciaResult.rows[0];

            // Obtener historial
            const historialQuery = `
                SELECT
                    wh.*,
                    wp.nombre AS paso_nombre,
                    u.nombre AS usuario_nombre,
                    u.email AS usuario_email
                FROM workflow_historial wh
                LEFT JOIN workflow_pasos wp ON wp.id = wh.paso_id
                LEFT JOIN usuarios u ON u.id = wh.usuario_id
                WHERE wh.instancia_id = $1
                ORDER BY wh.ejecutado_en DESC
            `;

            const historialResult = await db.query(historialQuery, [id]);

            // Obtener datos de la entidad
            let entidadDatos = null;
            if (instancia.entidad_tipo === 'orden_compra') {
                const ocQuery = `
                    SELECT
                        oc.*,
                        p.nombre AS proveedor_nombre,
                        p.telefono AS proveedor_telefono,
                        p.email AS proveedor_email,
                        json_agg(
                            json_build_object(
                                'id', oci.id,
                                'producto_id', oci.producto_id,
                                'nombre_producto', oci.nombre_producto,
                                'cantidad_ordenada', oci.cantidad_ordenada,
                                'precio_unitario', oci.precio_unitario,
                                'subtotal', oci.subtotal
                            )
                        ) AS items
                    FROM ordenes_compra oc
                    LEFT JOIN proveedores p ON p.id = oc.proveedor_id
                    LEFT JOIN ordenes_compra_items oci ON oci.orden_compra_id = oc.id
                    WHERE oc.id = $1 AND oc.organizacion_id = $2
                    GROUP BY oc.id, p.nombre, p.telefono, p.email
                `;

                const ocResult = await db.query(ocQuery, [instancia.entidad_id, organizacionId]);
                entidadDatos = ocResult.rows[0] || null;
            }

            return {
                ...instancia,
                historial: historialResult.rows,
                entidad: entidadDatos
            };
        });
    }

    // ========================================================================
    // HISTORIAL
    // ========================================================================

    /**
     * Obtener historial de aprobaciones
     */
    static async obtenerHistorial(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = [
                'wi.organizacion_id = $1',
                "wi.estado IN ('aprobado', 'rechazado', 'cancelado', 'expirado')"
            ];
            let values = [organizacionId];
            let paramCounter = 2;

            // Filtro por tipo de entidad
            if (filtros.entidad_tipo) {
                whereConditions.push(`wi.entidad_tipo = $${paramCounter}`);
                values.push(filtros.entidad_tipo);
                paramCounter++;
            }

            // Filtro por estado
            if (filtros.estado) {
                whereConditions.push(`wi.estado = $${paramCounter}`);
                values.push(filtros.estado);
                paramCounter++;
            }

            // Filtro por fecha
            if (filtros.fecha_desde) {
                whereConditions.push(`wi.completado_en >= $${paramCounter}`);
                values.push(filtros.fecha_desde);
                paramCounter++;
            }

            if (filtros.fecha_hasta) {
                whereConditions.push(`wi.completado_en <= $${paramCounter}`);
                values.push(filtros.fecha_hasta);
                paramCounter++;
            }

            const query = `
                SELECT
                    wi.id,
                    wi.workflow_id,
                    wi.entidad_tipo,
                    wi.entidad_id,
                    wi.estado,
                    wi.contexto,
                    wi.resultado,
                    wi.iniciado_en,
                    wi.completado_en,
                    wd.nombre AS workflow_nombre,
                    u_solicitante.nombre AS solicitante_nombre,
                    -- Último usuario que actuó
                    (
                        SELECT u.nombre
                        FROM workflow_historial wh
                        JOIN usuarios u ON u.id = wh.usuario_id
                        WHERE wh.instancia_id = wi.id
                          AND wh.accion IN ('aprobado', 'rechazado')
                        ORDER BY wh.ejecutado_en DESC
                        LIMIT 1
                    ) AS aprobador_nombre,
                    -- Resumen de entidad
                    CASE
                        WHEN wi.entidad_tipo = 'orden_compra' THEN
                            (SELECT jsonb_build_object(
                                'folio', oc.folio,
                                'total', oc.total
                            )
                            FROM ordenes_compra oc
                            WHERE oc.id = wi.entidad_id)
                        ELSE NULL
                    END AS entidad_resumen
                FROM workflow_instancias wi
                JOIN workflow_definiciones wd ON wd.id = wi.workflow_id
                LEFT JOIN usuarios u_solicitante ON u_solicitante.id = wi.iniciado_por
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY wi.completado_en DESC
                LIMIT $${paramCounter}
                OFFSET $${paramCounter + 1}
            `;

            values.push(filtros.limit || 50);
            values.push(filtros.offset || 0);

            const result = await db.query(query, values);

            // Conteo total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM workflow_instancias wi
                WHERE ${whereConditions.join(' AND ')}
            `;

            const countResult = await db.query(countQuery, values.slice(0, paramCounter - 1));

            return {
                instancias: result.rows,
                total: parseInt(countResult.rows[0]?.total || 0),
                limit: filtros.limit || 50,
                offset: filtros.offset || 0
            };
        });
    }

    // ========================================================================
    // DELEGACIONES
    // ========================================================================

    /**
     * Crear delegación
     */
    static async crearDelegacion(data, usuarioId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[WorkflowInstanciasModel.crearDelegacion] Iniciando', {
                usuario_original: usuarioId,
                usuario_delegado: data.usuario_delegado_id
            });

            // Verificar que el usuario delegado existe y pertenece a la org
            const delegadoQuery = await db.query(
                `SELECT id, nombre, email FROM usuarios
                 WHERE id = $1 AND organizacion_id = $2 AND activo = true`,
                [data.usuario_delegado_id, organizacionId]
            );

            ErrorHelper.throwIfNotFound(delegadoQuery.rows[0], 'Usuario delegado');

            // Verificar que no se delega a sí mismo
            if (data.usuario_delegado_id === usuarioId) {
                ErrorHelper.throwValidation('No puedes delegarte a ti mismo');
            }

            // Verificar que no haya delegación activa que se traslape
            const existeQuery = await db.query(
                `SELECT id FROM workflow_delegaciones
                 WHERE usuario_original_id = $1
                   AND activo = true
                   AND (workflow_id IS NULL OR workflow_id = $2)
                   AND NOT (fecha_fin < $3 OR fecha_inicio > $4)`,
                [
                    usuarioId,
                    data.workflow_id || null,
                    data.fecha_inicio,
                    data.fecha_fin
                ]
            );

            if (existeQuery.rows.length > 0) {
                ErrorHelper.throwConflict('Ya existe una delegación activa en ese período');
            }

            // Crear delegación
            const query = `
                INSERT INTO workflow_delegaciones (
                    organizacion_id,
                    usuario_original_id,
                    usuario_delegado_id,
                    workflow_id,
                    fecha_inicio,
                    fecha_fin,
                    motivo,
                    activo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
                RETURNING *
            `;

            const result = await db.query(query, [
                organizacionId,
                usuarioId,
                data.usuario_delegado_id,
                data.workflow_id || null,
                data.fecha_inicio,
                data.fecha_fin,
                data.motivo || null
            ]);

            const delegacion = result.rows[0];

            logger.info('[WorkflowInstanciasModel.crearDelegacion] Delegación creada', {
                delegacion_id: delegacion.id
            });

            return {
                ...delegacion,
                delegado_nombre: delegadoQuery.rows[0].nombre,
                delegado_email: delegadoQuery.rows[0].email
            };
        });
    }

    /**
     * Listar delegaciones
     */
    static async listarDelegaciones(usuarioId, organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['wd.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            // Delegaciones donde soy el original o el delegado
            if (filtros.como_delegado) {
                whereConditions.push(`wd.usuario_delegado_id = $${paramCounter}`);
            } else {
                whereConditions.push(`wd.usuario_original_id = $${paramCounter}`);
            }
            values.push(usuarioId);
            paramCounter++;

            // Solo activas
            if (filtros.activas !== undefined) {
                whereConditions.push(`wd.activo = $${paramCounter}`);
                values.push(filtros.activas);
                paramCounter++;
            }

            const query = `
                SELECT
                    wd.*,
                    u_original.nombre AS usuario_original_nombre,
                    u_original.email AS usuario_original_email,
                    u_delegado.nombre AS usuario_delegado_nombre,
                    u_delegado.email AS usuario_delegado_email,
                    wdef.nombre AS workflow_nombre,
                    CASE
                        WHEN wd.fecha_fin < CURRENT_DATE THEN 'expirada'
                        WHEN wd.fecha_inicio > CURRENT_DATE THEN 'futura'
                        ELSE 'activa'
                    END AS estado_periodo
                FROM workflow_delegaciones wd
                JOIN usuarios u_original ON u_original.id = wd.usuario_original_id
                JOIN usuarios u_delegado ON u_delegado.id = wd.usuario_delegado_id
                LEFT JOIN workflow_definiciones wdef ON wdef.id = wd.workflow_id
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY wd.fecha_inicio DESC
            `;

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Actualizar delegación
     */
    static async actualizarDelegacion(id, data, usuarioId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que la delegación existe y pertenece al usuario
            const checkQuery = await db.query(
                `SELECT id FROM workflow_delegaciones
                 WHERE id = $1 AND usuario_original_id = $2`,
                [id, usuarioId]
            );

            ErrorHelper.throwIfNotFound(checkQuery.rows[0], 'Delegación');

            const updates = [];
            const values = [];
            let paramCounter = 1;

            if (data.fecha_fin !== undefined) {
                updates.push(`fecha_fin = $${paramCounter}`);
                values.push(data.fecha_fin);
                paramCounter++;
            }

            if (data.activo !== undefined) {
                updates.push(`activo = $${paramCounter}`);
                values.push(data.activo);
                paramCounter++;
            }

            if (data.motivo !== undefined) {
                updates.push(`motivo = $${paramCounter}`);
                values.push(data.motivo);
                paramCounter++;
            }

            if (updates.length === 0) {
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            values.push(id);

            const query = `
                UPDATE workflow_delegaciones
                SET ${updates.join(', ')}, actualizado_en = NOW()
                WHERE id = $${paramCounter}
                RETURNING *
            `;

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Eliminar delegación
     */
    static async eliminarDelegacion(id, usuarioId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const query = `
                DELETE FROM workflow_delegaciones
                WHERE id = $1 AND usuario_original_id = $2
                RETURNING *
            `;

            const result = await db.query(query, [id, usuarioId]);

            ErrorHelper.throwIfNotFound(result.rows[0], 'Delegación');

            return result.rows[0];
        });
    }

    // ========================================================================
    // DEFINICIONES (LECTURA)
    // ========================================================================

    /**
     * Listar definiciones de workflows
     */
    static async listarDefiniciones(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['wd.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            if (filtros.entidad_tipo) {
                whereConditions.push(`wd.entidad_tipo = $${paramCounter}`);
                values.push(filtros.entidad_tipo);
                paramCounter++;
            }

            if (filtros.activo !== undefined) {
                whereConditions.push(`wd.activo = $${paramCounter}`);
                values.push(filtros.activo);
                paramCounter++;
            }

            const query = `
                SELECT
                    wd.*,
                    (SELECT COUNT(*) FROM workflow_pasos WHERE workflow_id = wd.id) AS total_pasos,
                    (SELECT COUNT(*) FROM workflow_instancias WHERE workflow_id = wd.id AND estado = 'en_progreso') AS instancias_activas
                FROM workflow_definiciones wd
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY wd.entidad_tipo, wd.prioridad DESC
            `;

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Obtener definición por ID con pasos y transiciones
     */
    static async obtenerDefinicionPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener definición
            const defQuery = `
                SELECT * FROM workflow_definiciones
                WHERE id = $1 AND organizacion_id = $2
            `;

            const defResult = await db.query(defQuery, [id, organizacionId]);

            if (defResult.rows.length === 0) {
                return null;
            }

            const definicion = defResult.rows[0];

            // Obtener pasos
            const pasosQuery = `
                SELECT * FROM workflow_pasos
                WHERE workflow_id = $1
                ORDER BY orden
            `;

            const pasosResult = await db.query(pasosQuery, [id]);

            // Obtener transiciones
            const transicionesQuery = `
                SELECT
                    wt.*,
                    wp_origen.codigo AS paso_origen_codigo,
                    wp_origen.nombre AS paso_origen_nombre,
                    wp_destino.codigo AS paso_destino_codigo,
                    wp_destino.nombre AS paso_destino_nombre
                FROM workflow_transiciones wt
                JOIN workflow_pasos wp_origen ON wp_origen.id = wt.paso_origen_id
                JOIN workflow_pasos wp_destino ON wp_destino.id = wt.paso_destino_id
                WHERE wt.workflow_id = $1
                ORDER BY wt.orden
            `;

            const transicionesResult = await db.query(transicionesQuery, [id]);

            return {
                ...definicion,
                pasos: pasosResult.rows,
                transiciones: transicionesResult.rows
            };
        });
    }
}

module.exports = WorkflowInstanciasModel;
