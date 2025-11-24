const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const CitaValidacionUtil = require('../utils/cita-validacion.util');

class BloqueosHorariosModel {

    static async crear(datosBloqueo, auditoria = {}) {
        return await RLSContextManager.transaction(datosBloqueo.organizacion_id, async (db) => {
            try {
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

                // Validar que el tipo_bloqueo_id sea válido y accesible
                if (datosBloqueo.tipo_bloqueo_id) {
                    const tipoValido = await db.query(`
                        SELECT id FROM tipos_bloqueo
                        WHERE id = $1
                        AND (organizacion_id IS NULL OR organizacion_id = $2)
                        AND activo = true
                    `, [datosBloqueo.tipo_bloqueo_id, datosBloqueo.organizacion_id]);

                    if (tipoValido.rows.length === 0) {
                        throw new Error('Tipo de bloqueo inválido o no disponible para esta organización');
                    }
                }

                // ====================================================================
                // VALIDACIÓN: Verificar que no haya citas confirmadas/pendientes en el rango
                // ====================================================================
                const queryCitas = `
                    SELECT
                        c.id,
                        c.codigo_cita,
                        c.profesional_id,
                        c.fecha_cita,
                        c.hora_inicio,
                        c.hora_fin,
                        c.estado,
                        cl.nombre as cliente_nombre
                    FROM citas c
                    LEFT JOIN clientes cl ON c.cliente_id = cl.id
                    WHERE c.organizacion_id = $1
                      AND c.fecha_cita BETWEEN $2::date AND $3::date
                      AND c.estado IN ('pendiente', 'confirmada', 'en_curso')
                      ${datosBloqueo.profesional_id ? 'AND c.profesional_id = $4' : ''}
                `;

                const paramsCitas = datosBloqueo.profesional_id
                    ? [datosBloqueo.organizacion_id, datosBloqueo.fecha_inicio, datosBloqueo.fecha_fin, datosBloqueo.profesional_id]
                    : [datosBloqueo.organizacion_id, datosBloqueo.fecha_inicio, datosBloqueo.fecha_fin];

                const citasResult = await db.query(queryCitas, paramsCitas);

                // Validar cada cita para ver si se solapa con el bloqueo
                const citasConflictivas = [];

                for (const cita of citasResult.rows) {
                    // Si el bloqueo es organizacional, verificar TODAS las citas
                    // Si el bloqueo es específico de profesional, solo verificar las del mismo profesional
                    const profesionalAValidar = datosBloqueo.profesional_id || cita.profesional_id;

                    // Para bloqueos de día completo (sin hora_inicio/hora_fin), siempre hay conflicto
                    if (!datosBloqueo.hora_inicio && !datosBloqueo.hora_fin) {
                        citasConflictivas.push(cita);
                    } else if (datosBloqueo.hora_inicio && datosBloqueo.hora_fin) {
                        // Para bloqueos de horario específico, validar solapamiento de horas
                        // Usar CitaValidacionUtil para validación consistente
                        if (CitaValidacionUtil.citaSolapaConSlot(
                            cita,
                            profesionalAValidar,
                            cita.fecha_cita,
                            datosBloqueo.hora_inicio,
                            datosBloqueo.hora_fin
                        )) {
                            citasConflictivas.push(cita);
                        }
                    }
                }

                // Si hay citas conflictivas, rechazar la creación
                if (citasConflictivas.length > 0) {
                    // Formatear fecha a formato legible en español (DD/MM/YYYY)
                    const formatearFecha = (fecha) => {
                        // Si viene como Date object de PostgreSQL, convertir a string
                        let fechaStr = fecha;
                        if (fecha instanceof Date) {
                            fechaStr = fecha.toISOString().split('T')[0];
                        } else if (typeof fecha === 'string' && fecha.includes('T')) {
                            fechaStr = fecha.split('T')[0];
                        }

                        // Separar YYYY-MM-DD
                        const [year, month, day] = fechaStr.split('-');
                        return `${day}/${month}/${year}`;
                    };

                    // Formatear hora HH:MM:SS a HH:MM
                    const formatearHora = (hora) => {
                        return hora ? hora.substring(0, 5) : '';
                    };

                    const detallesCitas = citasConflictivas.slice(0, 3).map(c =>
                        `• ${c.codigo_cita} - ${c.cliente_nombre} el ${formatearFecha(c.fecha_cita)} de ${formatearHora(c.hora_inicio)} a ${formatearHora(c.hora_fin)}`
                    ).join('\n');

                    const mensajeExtra = citasConflictivas.length > 3
                        ? `\n• ... y ${citasConflictivas.length - 3} cita${citasConflictivas.length - 3 > 1 ? 's' : ''} más`
                        : '';

                    const cantidadTexto = citasConflictivas.length === 1
                        ? '1 cita confirmada o pendiente'
                        : `${citasConflictivas.length} citas confirmadas o pendientes`;

                    const error = new Error(
                        `No se puede crear el bloqueo. Hay ${cantidadTexto} que se ${citasConflictivas.length === 1 ? 'solapa' : 'solapan'} con este horario:\n\n${detallesCitas}${mensajeExtra}\n\nPor favor, cancela o reagenda ${citasConflictivas.length === 1 ? 'esta cita' : 'estas citas'} antes de crear el bloqueo.`
                    );
                    error.statusCode = 409; // Conflict
                    error.citasConflictivas = citasConflictivas.map(c => ({
                        id: c.id,
                        codigo: c.codigo_cita,
                        cliente: c.cliente_nombre,
                        fecha: c.fecha_cita,
                        horario: `${c.hora_inicio}-${c.hora_fin}`,
                        estado: c.estado
                    }));

                    logger.warn('[BloqueosHorariosModel.crear] Bloqueo rechazado por conflicto con citas', {
                        organizacion_id: datosBloqueo.organizacion_id,
                        fecha_inicio: datosBloqueo.fecha_inicio,
                        fecha_fin: datosBloqueo.fecha_fin,
                        citas_conflictivas: citasConflictivas.length
                    });

                    throw error;
                }

                // No hay conflictos, continuar con la creación
                const citasAfectadas = 0;

                const insertQuery = `
                    INSERT INTO bloqueos_horarios (
                        organizacion_id, profesional_id, servicio_id,
                        tipo_bloqueo_id, titulo, descripcion,
                        fecha_inicio, fecha_fin,
                        hora_inicio, hora_fin, zona_horaria,
                        es_recurrente, patron_recurrencia, fecha_fin_recurrencia,
                        color_display, icono,
                        activo, auto_generado, origen_bloqueo,
                        notificar_afectados, dias_aviso_previo, mensaje_clientes,
                        citas_afectadas, ingresos_perdidos,
                        metadata, notas_internas,
                        creado_por, creado_en
                    )
                    VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8,
                        $9, $10, $11, $12, $13, $14,
                        $15, $16, $17, $18, $19,
                        $20, $21, $22, $23, $24,
                        $25, $26, $27, NOW()
                    )
                    RETURNING id, organizacion_id, profesional_id, tipo_bloqueo_id,
                             titulo, fecha_inicio, fecha_fin, hora_inicio, hora_fin,
                             citas_afectadas, activo, creado_en
                `;

                const result = await db.query(insertQuery, [
                    datosBloqueo.organizacion_id,
                    datosBloqueo.profesional_id || null,
                    datosBloqueo.servicio_id || null,
                    datosBloqueo.tipo_bloqueo_id,
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
                    auditoria.usuario_id || null
                ]);

                return result.rows[0];

            } catch (error) {
                logger.error('[BloqueosHorariosModel.crear] Error creando bloqueo:', {
                    error: error.message,
                    organizacion_id: datosBloqueo.organizacion_id
                });
                throw error;
            }
        });
    }

    static async obtener(filtros) {
        return await RLSContextManager.query(filtros.organizacion_id, async (db) => {
            try {
                const limite = Math.min(filtros.limite || 50, 100);
                const offset = filtros.offset || 0;

                let whereClause = 'WHERE bh.organizacion_id = $1 AND bh.activo = true';
                const queryParams = [filtros.organizacion_id];
                let paramCounter = 2;

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

                if (filtros.tipo_bloqueo_id) {
                    whereClause += ` AND bh.tipo_bloqueo_id = $${paramCounter}`;
                    queryParams.push(filtros.tipo_bloqueo_id);
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

                if (filtros.solo_organizacionales) {
                    whereClause += ` AND bh.profesional_id IS NULL`;
                }

                const query = `
                    SELECT
                        bh.id, bh.organizacion_id, bh.profesional_id, bh.servicio_id,
                        bh.tipo_bloqueo_id,
                        tb.codigo as tipo_bloqueo_codigo,
                        tb.nombre as tipo_bloqueo_nombre,
                        bh.titulo, bh.descripcion,
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
                        to_char(bh.fecha_inicio, 'DD/MM/YYYY') as fecha_inicio_fmt,
                        to_char(bh.fecha_fin, 'DD/MM/YYYY') as fecha_fin_fmt,
                        CASE
                            WHEN bh.hora_inicio IS NOT NULL THEN
                                to_char(bh.hora_inicio, 'HH24:MI') || ' - ' || to_char(bh.hora_fin, 'HH24:MI')
                            ELSE 'Todo el día'
                        END as horario_fmt,
                        (bh.fecha_fin - bh.fecha_inicio) + 1 as dias_totales
                    FROM bloqueos_horarios bh
                    LEFT JOIN profesionales p ON bh.profesional_id = p.id
                    LEFT JOIN servicios s ON bh.servicio_id = s.id
                    JOIN tipos_bloqueo tb ON bh.tipo_bloqueo_id = tb.id
                    ${whereClause}
                    ORDER BY bh.fecha_inicio DESC, bh.creado_en DESC
                    LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
                `;

                queryParams.push(limite, offset);

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
                        tipo_bloqueo_id: filtros.tipo_bloqueo_id,
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
            }
        });
    }

    static async actualizar(bloqueoId, organizacionId, datosActualizacion, auditoria = {}) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            try {
                const bloqueoExistente = await db.query(`
                    SELECT id, profesional_id, fecha_inicio, fecha_fin, hora_inicio, hora_fin
                    FROM bloqueos_horarios
                    WHERE id = $1 AND organizacion_id = $2 AND activo = true
                    FOR UPDATE
                `, [bloqueoId, organizacionId]);

                if (bloqueoExistente.rows.length === 0) {
                    throw new Error('Bloqueo no encontrado o sin permisos para actualizar');
                }

                const bloqueoActual = bloqueoExistente.rows[0];

                // ====================================================================
                // VALIDACIÓN: Si se actualizan fechas u horas, verificar conflictos
                // ====================================================================
                const hayActualizacionHorario = (
                    datosActualizacion.fecha_inicio ||
                    datosActualizacion.fecha_fin ||
                    datosActualizacion.hora_inicio !== undefined ||
                    datosActualizacion.hora_fin !== undefined ||
                    datosActualizacion.profesional_id !== undefined
                );

                if (hayActualizacionHorario) {
                    // Combinar datos actualizados con datos existentes
                    const fechaInicioFinal = datosActualizacion.fecha_inicio || bloqueoActual.fecha_inicio;
                    const fechaFinFinal = datosActualizacion.fecha_fin || bloqueoActual.fecha_fin;
                    const horaInicioFinal = datosActualizacion.hora_inicio !== undefined
                        ? datosActualizacion.hora_inicio
                        : bloqueoActual.hora_inicio;
                    const horaFinFinal = datosActualizacion.hora_fin !== undefined
                        ? datosActualizacion.hora_fin
                        : bloqueoActual.hora_fin;
                    const profesionalIdFinal = datosActualizacion.profesional_id !== undefined
                        ? datosActualizacion.profesional_id
                        : bloqueoActual.profesional_id;

                    // Query para obtener citas que podrían solaparse
                    const queryCitas = `
                        SELECT
                            c.id,
                            c.codigo_cita,
                            c.profesional_id,
                            c.fecha_cita,
                            c.hora_inicio,
                            c.hora_fin,
                            c.estado,
                            cl.nombre as cliente_nombre
                        FROM citas c
                        LEFT JOIN clientes cl ON c.cliente_id = cl.id
                        WHERE c.organizacion_id = $1
                          AND c.fecha_cita BETWEEN $2::date AND $3::date
                          AND c.estado IN ('pendiente', 'confirmada', 'en_curso')
                          ${profesionalIdFinal ? 'AND c.profesional_id = $4' : ''}
                    `;

                    const paramsCitas = profesionalIdFinal
                        ? [organizacionId, fechaInicioFinal, fechaFinFinal, profesionalIdFinal]
                        : [organizacionId, fechaInicioFinal, fechaFinFinal];

                    const citasResult = await db.query(queryCitas, paramsCitas);

                    // Validar cada cita para ver si se solapa con el bloqueo actualizado
                    const citasConflictivas = [];

                    for (const cita of citasResult.rows) {
                        const profesionalAValidar = profesionalIdFinal || cita.profesional_id;

                        // Para bloqueos de día completo (sin hora_inicio/hora_fin), siempre hay conflicto
                        if (!horaInicioFinal && !horaFinFinal) {
                            citasConflictivas.push(cita);
                        } else if (horaInicioFinal && horaFinFinal) {
                            // Para bloqueos de horario específico, validar solapamiento de horas
                            if (CitaValidacionUtil.citaSolapaConSlot(
                                cita,
                                profesionalAValidar,
                                cita.fecha_cita,
                                horaInicioFinal,
                                horaFinFinal
                            )) {
                                citasConflictivas.push(cita);
                            }
                        }
                    }

                    // Si hay citas conflictivas, rechazar la actualización
                    if (citasConflictivas.length > 0) {
                        // Formatear fecha a formato legible en español (DD/MM/YYYY)
                        const formatearFecha = (fecha) => {
                            // Si viene como Date object de PostgreSQL, convertir a string
                            let fechaStr = fecha;
                            if (fecha instanceof Date) {
                                fechaStr = fecha.toISOString().split('T')[0];
                            } else if (typeof fecha === 'string' && fecha.includes('T')) {
                                fechaStr = fecha.split('T')[0];
                            }

                            // Separar YYYY-MM-DD
                            const [year, month, day] = fechaStr.split('-');
                            return `${day}/${month}/${year}`;
                        };

                        // Formatear hora HH:MM:SS a HH:MM
                        const formatearHora = (hora) => {
                            return hora ? hora.substring(0, 5) : '';
                        };

                        const detallesCitas = citasConflictivas.slice(0, 3).map(c =>
                            `• ${c.codigo_cita} - ${c.cliente_nombre} el ${formatearFecha(c.fecha_cita)} de ${formatearHora(c.hora_inicio)} a ${formatearHora(c.hora_fin)}`
                        ).join('\n');

                        const mensajeExtra = citasConflictivas.length > 3
                            ? `\n• ... y ${citasConflictivas.length - 3} cita${citasConflictivas.length - 3 > 1 ? 's' : ''} más`
                            : '';

                        const cantidadTexto = citasConflictivas.length === 1
                            ? '1 cita confirmada o pendiente'
                            : `${citasConflictivas.length} citas confirmadas o pendientes`;

                        const error = new Error(
                            `No se puede actualizar el bloqueo. Hay ${cantidadTexto} que se ${citasConflictivas.length === 1 ? 'solapa' : 'solapan'} con este horario:\n\n${detallesCitas}${mensajeExtra}\n\nPor favor, cancela o reagenda ${citasConflictivas.length === 1 ? 'esta cita' : 'estas citas'} antes de actualizar el bloqueo.`
                        );
                        error.statusCode = 409; // Conflict
                        error.citasConflictivas = citasConflictivas.map(c => ({
                            id: c.id,
                            codigo: c.codigo_cita,
                            cliente: c.cliente_nombre,
                            fecha: c.fecha_cita,
                            horario: `${c.hora_inicio}-${c.hora_fin}`,
                            estado: c.estado
                        }));

                        logger.warn('[BloqueosHorariosModel.actualizar] Actualización rechazada por conflicto con citas', {
                            bloqueo_id: bloqueoId,
                            organizacion_id: organizacionId,
                            fecha_inicio: fechaInicioFinal,
                            fecha_fin: fechaFinFinal,
                            citas_conflictivas: citasConflictivas.length
                        });

                        throw error;
                    }
                }

                const camposActualizar = [];
                const valoresActualizar = [bloqueoId, organizacionId];
                let paramCounter = 3;

                const camposPermitidos = [
                    'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin',
                    'hora_inicio', 'hora_fin', 'zona_horaria',
                    'tipo_bloqueo_id', 'color_display', 'icono',
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

                camposActualizar.push(
                    `actualizado_por = $${paramCounter}`,
                    `actualizado_en = NOW()`
                );
                valoresActualizar.push(auditoria.usuario_id || null);

                const updateQuery = `
                    UPDATE bloqueos_horarios
                    SET ${camposActualizar.join(', ')}
                    WHERE id = $1 AND organizacion_id = $2
                    RETURNING id, organizacion_id, profesional_id, tipo_bloqueo_id,
                             titulo, fecha_inicio, fecha_fin, actualizado_en
                `;

                const result = await db.query(updateQuery, valoresActualizar);

                return {
                    ...result.rows[0],
                    cambios_aplicados: Object.keys(datosActualizacion)
                };

            } catch (error) {
                logger.error('[BloqueosHorariosModel.actualizar] Error actualizando bloqueo:', {
                    error: error.message,
                    bloqueo_id: bloqueoId,
                    organizacion_id: organizacionId
                });
                throw error;
            }
        });
    }

    static async eliminar(bloqueoId, organizacionId, auditoria = {}) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            try {
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

                return {
                    eliminado: true,
                    bloqueo_id: bloqueoId,
                    titulo: result.rows[0].titulo,
                    periodo: `${result.rows[0].fecha_inicio} - ${result.rows[0].fecha_fin}`
                };

            } catch (error) {
                logger.error('[BloqueosHorariosModel.eliminar] Error eliminando bloqueo:', {
                    error: error.message,
                    bloqueo_id: bloqueoId,
                    organizacion_id: organizacionId
                });
                throw error;
            }
        });
    }
}

module.exports = BloqueosHorariosModel;
