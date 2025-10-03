/**
 * Modelo de Bloqueos de Horarios - Multi-tenant con RLS
 * Gestión de vacaciones, permisos, festivos y bloqueos organizacionales
 */

const { getDb } = require('../config/database');
const logger = require('../utils/logger');

class BloqueosHorariosModel {

    /**
     * Crear bloqueo de horario
     * @param {Object} datosBloqueo - Datos del bloqueo
     * @param {Object} auditoria - Información de auditoría
     * @returns {Promise<Object>} Bloqueo creado
     */
    static async crear(datosBloqueo, auditoria = {}) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', datosBloqueo.organizacion_id.toString()]);

            // Validar que el profesional pertenezca a la organización (si aplica)
            if (datosBloqueo.profesional_id) {
                const validarProfesional = await db.query(`
                    SELECT id, nombre_completo
                    FROM profesionales
                    WHERE id = $1 AND organizacion_id = $2 AND activo = true
                `, [datosBloqueo.profesional_id, datosBloqueo.organizacion_id]);

                if (validarProfesional.rows.length === 0) {
                    throw new Error('El profesional no existe o no pertenece a esta organización');
                }
            }

            // Calcular citas afectadas si es inmediato
            let citasAfectadas = 0;
            if (datosBloqueo.calcular_impacto) {
                const queryImpacto = `
                    SELECT COUNT(*) as total
                    FROM citas c
                    WHERE c.organizacion_id = $1
                      AND c.fecha_cita BETWEEN $2::date AND $3::date
                      AND c.estado IN ('pendiente', 'confirmada')
                      ${datosBloqueo.profesional_id ? 'AND c.profesional_id = $4' : ''}
                `;

                const paramsImpacto = datosBloqueo.profesional_id
                    ? [datosBloqueo.organizacion_id, datosBloqueo.fecha_inicio, datosBloqueo.fecha_fin, datosBloqueo.profesional_id]
                    : [datosBloqueo.organizacion_id, datosBloqueo.fecha_inicio, datosBloqueo.fecha_fin];

                const impacto = await db.query(queryImpacto, paramsImpacto);
                citasAfectadas = parseInt(impacto.rows[0].total);
            }

            // Insertar bloqueo
            const insertQuery = `
                INSERT INTO bloqueos_horarios (
                    organizacion_id, profesional_id, servicio_id,
                    tipo_bloqueo, titulo, descripcion,
                    fecha_inicio, fecha_fin,
                    hora_inicio, hora_fin, zona_horaria,
                    es_recurrente, patron_recurrencia, fecha_fin_recurrencia,
                    color_display, icono,
                    activo, auto_generado, origen_bloqueo,
                    notificar_afectados, dias_aviso_previo, mensaje_clientes,
                    citas_afectadas, ingresos_perdidos,
                    metadata, notas_internas,
                    creado_por, ip_origen, creado_en
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8,
                    $9, $10, $11, $12, $13, $14,
                    $15, $16, $17, $18, $19,
                    $20, $21, $22, $23, $24,
                    $25, $26, $27, $28, NOW()
                )
                RETURNING id, organizacion_id, profesional_id, tipo_bloqueo,
                         titulo, fecha_inicio, fecha_fin, hora_inicio, hora_fin,
                         citas_afectadas, activo, creado_en
            `;

            const result = await db.query(insertQuery, [
                datosBloqueo.organizacion_id,
                datosBloqueo.profesional_id || null,
                datosBloqueo.servicio_id || null,
                datosBloqueo.tipo_bloqueo,
                datosBloqueo.titulo,
                datosBloqueo.descripcion || null,
                datosBloqueo.fecha_inicio,
                datosBloqueo.fecha_fin,
                datosBloqueo.hora_inicio || null,
                datosBloqueo.hora_fin || null,
                datosBloqueo.zona_horaria || 'America/Mexico_City',
                datosBloqueo.es_recurrente || false,
                datosBloqueo.patron_recurrencia || {},
                datosBloqueo.fecha_fin_recurrencia || null,
                datosBloqueo.color_display || '#FF6B6B',
                datosBloqueo.icono || 'calendar-x',
                datosBloqueo.activo !== false,
                datosBloqueo.auto_generado || false,
                datosBloqueo.origen_bloqueo || 'manual',
                datosBloqueo.notificar_afectados !== false,
                datosBloqueo.dias_aviso_previo || 7,
                datosBloqueo.mensaje_clientes || null,
                citasAfectadas,
                datosBloqueo.ingresos_perdidos || 0.00,
                datosBloqueo.metadata || {},
                datosBloqueo.notas_internas || null,
                auditoria.usuario_id || null,
                auditoria.ip_origen || null
            ]);

            await db.query('COMMIT');

            const bloqueoCreado = result.rows[0];

            logger.info('[BloqueosHorariosModel.crear] Bloqueo creado', {
                id: bloqueoCreado.id,
                organizacion_id: bloqueoCreado.organizacion_id,
                tipo: bloqueoCreado.tipo_bloqueo,
                fecha_inicio: bloqueoCreado.fecha_inicio,
                fecha_fin: bloqueoCreado.fecha_fin,
                citas_afectadas: bloqueoCreado.citas_afectadas
            });

            return bloqueoCreado;

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[BloqueosHorariosModel.crear] Error creando bloqueo:', {
                error: error.message,
                organizacion_id: datosBloqueo.organizacion_id
            });
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * Obtener bloqueos con filtros
     * @param {Object} filtros - Filtros de búsqueda
     * @returns {Promise<Object>} Lista de bloqueos con paginación
     */
    static async obtener(filtros) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', filtros.organizacion_id.toString()]);

            const limite = Math.min(filtros.limite || 50, 100);
            const offset = filtros.offset || 0;

            let whereClause = 'WHERE bh.organizacion_id = $1 AND bh.activo = true';
            const queryParams = [filtros.organizacion_id];
            let paramCounter = 2;

            // Filtros dinámicos
            if (filtros.id) {
                whereClause += ` AND bh.id = $${paramCounter}`;
                queryParams.push(filtros.id);
                paramCounter++;
            }

            if (filtros.profesional_id) {
                whereClause += ` AND bh.profesional_id = $${paramCounter}`;
                queryParams.push(filtros.profesional_id);
                paramCounter++;
            }

            if (filtros.tipo_bloqueo) {
                whereClause += ` AND bh.tipo_bloqueo = $${paramCounter}`;
                queryParams.push(filtros.tipo_bloqueo);
                paramCounter++;
            }

            if (filtros.fecha_inicio) {
                whereClause += ` AND bh.fecha_fin >= $${paramCounter}::date`;
                queryParams.push(filtros.fecha_inicio);
                paramCounter++;
            }

            if (filtros.fecha_fin) {
                whereClause += ` AND bh.fecha_inicio <= $${paramCounter}::date`;
                queryParams.push(filtros.fecha_fin);
                paramCounter++;
            }

            // Bloqueos organizacionales (sin profesional)
            if (filtros.solo_organizacionales) {
                whereClause += ` AND bh.profesional_id IS NULL`;
            }

            const query = `
                SELECT
                    bh.id, bh.organizacion_id, bh.profesional_id, bh.servicio_id,
                    bh.tipo_bloqueo, bh.titulo, bh.descripcion,
                    bh.fecha_inicio, bh.fecha_fin,
                    bh.hora_inicio, bh.hora_fin, bh.zona_horaria,
                    bh.es_recurrente, bh.patron_recurrencia, bh.fecha_fin_recurrencia,
                    bh.color_display, bh.icono,
                    bh.activo, bh.auto_generado, bh.origen_bloqueo,
                    bh.notificar_afectados, bh.dias_aviso_previo, bh.mensaje_clientes,
                    bh.citas_afectadas, bh.ingresos_perdidos,
                    bh.metadata, bh.notas_internas,
                    bh.creado_en, bh.actualizado_en,
                    p.nombre_completo as profesional_nombre,
                    s.nombre as servicio_nombre,
                    -- Formateo para UI
                    to_char(bh.fecha_inicio, 'DD/MM/YYYY') as fecha_inicio_fmt,
                    to_char(bh.fecha_fin, 'DD/MM/YYYY') as fecha_fin_fmt,
                    CASE
                        WHEN bh.hora_inicio IS NOT NULL THEN
                            to_char(bh.hora_inicio, 'HH24:MI') || ' - ' || to_char(bh.hora_fin, 'HH24:MI')
                        ELSE 'Todo el día'
                    END as horario_fmt,
                    -- Calcular días totales
                    (bh.fecha_fin - bh.fecha_inicio) + 1 as dias_totales
                FROM bloqueos_horarios bh
                LEFT JOIN profesionales p ON bh.profesional_id = p.id
                LEFT JOIN servicios s ON bh.servicio_id = s.id
                ${whereClause}
                ORDER BY bh.fecha_inicio DESC, bh.creado_en DESC
                LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
            `;

            queryParams.push(limite, offset);

            // Query para contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM bloqueos_horarios bh
                ${whereClause}
            `;

            const [dataResult, countResult] = await Promise.all([
                db.query(query, queryParams),
                db.query(countQuery, queryParams.slice(0, -2))
            ]);

            const total = parseInt(countResult.rows[0].total);
            const bloqueos = dataResult.rows;

            return {
                bloqueos,
                paginacion: {
                    total,
                    limite,
                    offset,
                    pagina_actual: Math.floor(offset / limite) + 1,
                    total_paginas: Math.ceil(total / limite)
                },
                filtros_aplicados: {
                    organizacion_id: filtros.organizacion_id,
                    profesional_id: filtros.profesional_id,
                    tipo_bloqueo: filtros.tipo_bloqueo,
                    fecha_inicio: filtros.fecha_inicio,
                    fecha_fin: filtros.fecha_fin
                }
            };

        } catch (error) {
            logger.error('[BloqueosHorariosModel.obtener] Error obteniendo bloqueos:', {
                error: error.message,
                filtros
            });
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * Actualizar bloqueo
     * @param {number} bloqueoId - ID del bloqueo
     * @param {number} organizacionId - ID de la organización
     * @param {Object} datosActualizacion - Datos a actualizar
     * @param {Object} auditoria - Información de auditoría
     * @returns {Promise<Object>} Bloqueo actualizado
     */
    static async actualizar(bloqueoId, organizacionId, datosActualizacion, auditoria = {}) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            // Verificar que existe
            const bloqueoExistente = await db.query(`
                SELECT id, profesional_id, fecha_inicio, fecha_fin
                FROM bloqueos_horarios
                WHERE id = $1 AND organizacion_id = $2 AND activo = true
                FOR UPDATE
            `, [bloqueoId, organizacionId]);

            if (bloqueoExistente.rows.length === 0) {
                throw new Error('Bloqueo no encontrado o sin permisos para actualizar');
            }

            // Construir query de actualización dinámicamente
            const camposActualizar = [];
            const valoresActualizar = [bloqueoId, organizacionId];
            let paramCounter = 3;

            const camposPermitidos = [
                'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin',
                'hora_inicio', 'hora_fin', 'zona_horaria',
                'tipo_bloqueo', 'color_display', 'icono',
                'notificar_afectados', 'dias_aviso_previo', 'mensaje_clientes',
                'metadata', 'notas_internas'
            ];

            camposPermitidos.forEach(campo => {
                if (datosActualizacion.hasOwnProperty(campo)) {
                    camposActualizar.push(`${campo} = $${paramCounter}`);
                    valoresActualizar.push(datosActualizacion[campo]);
                    paramCounter++;
                }
            });

            if (camposActualizar.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }

            // Agregar campos de auditoría
            camposActualizar.push(
                `actualizado_por = $${paramCounter}`,
                `actualizado_en = NOW()`
            );
            valoresActualizar.push(auditoria.usuario_id || null);

            const updateQuery = `
                UPDATE bloqueos_horarios
                SET ${camposActualizar.join(', ')}
                WHERE id = $1 AND organizacion_id = $2
                RETURNING id, organizacion_id, profesional_id, tipo_bloqueo,
                         titulo, fecha_inicio, fecha_fin, actualizado_en
            `;

            const result = await db.query(updateQuery, valoresActualizar);
            const bloqueoActualizado = result.rows[0];

            await db.query('COMMIT');

            logger.info('[BloqueosHorariosModel.actualizar] Bloqueo actualizado', {
                id: bloqueoId,
                organizacion_id: organizacionId,
                campos: Object.keys(datosActualizacion).join(',')
            });

            return {
                ...bloqueoActualizado,
                mensaje: 'Bloqueo actualizado exitosamente',
                cambios_aplicados: Object.keys(datosActualizacion)
            };

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[BloqueosHorariosModel.actualizar] Error actualizando bloqueo:', {
                error: error.message,
                bloqueo_id: bloqueoId,
                organizacion_id: organizacionId
            });
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * Eliminar bloqueo (lógico)
     * @param {number} bloqueoId - ID del bloqueo
     * @param {number} organizacionId - ID de la organización
     * @param {Object} auditoria - Información de auditoría
     * @returns {Promise<Object>} Confirmación de eliminación
     */
    static async eliminar(bloqueoId, organizacionId, auditoria = {}) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const result = await db.query(`
                UPDATE bloqueos_horarios
                SET activo = false,
                    actualizado_por = $3,
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2 AND activo = true
                RETURNING id, titulo, fecha_inicio, fecha_fin
            `, [bloqueoId, organizacionId, auditoria.usuario_id || null]);

            if (result.rows.length === 0) {
                throw new Error('Bloqueo no encontrado o sin permisos para eliminar');
            }

            await db.query('COMMIT');

            logger.info('[BloqueosHorariosModel.eliminar] Bloqueo eliminado', {
                id: bloqueoId,
                organizacion_id: organizacionId
            });

            return {
                eliminado: true,
                bloqueo_id: bloqueoId,
                titulo: result.rows[0].titulo,
                periodo: `${result.rows[0].fecha_inicio} - ${result.rows[0].fecha_fin}`,
                mensaje: 'Bloqueo eliminado exitosamente'
            };

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[BloqueosHorariosModel.eliminar] Error eliminando bloqueo:', {
                error: error.message,
                bloqueo_id: bloqueoId,
                organizacion_id: organizacionId
            });
            throw error;
        } finally {
            db.release();
        }
    }
}

module.exports = BloqueosHorariosModel;
