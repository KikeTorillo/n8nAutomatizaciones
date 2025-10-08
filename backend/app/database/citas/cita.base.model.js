const { getDb } = require('../../config/database');
const logger = require('../../utils/logger');
const { DEFAULTS, CitaHelpersModel } = require('./cita.helpers.model');

class CitaBaseModel {

    static async crearEstandar(citaData, usuarioId) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', citaData.organizacion_id.toString()]);

            // Validar entidades relacionadas
            await CitaHelpersModel.validarEntidadesRelacionadas(
                citaData.cliente_id,
                citaData.profesional_id,
                citaData.servicio_id,
                citaData.organizacion_id,
                db
            );

            // Validar conflicto de horario
            await CitaHelpersModel.validarConflictoHorario(
                citaData.profesional_id,
                citaData.fecha_cita,
                citaData.hora_inicio,
                citaData.hora_fin,
                null,
                db
            );

            // Preparar datos completos para inserción (codigo_cita auto-generado por trigger)
            const datosCompletos = {
                organizacion_id: citaData.organizacion_id,
                cliente_id: citaData.cliente_id,
                profesional_id: citaData.profesional_id,
                servicio_id: citaData.servicio_id,
                fecha_cita: citaData.fecha_cita,
                hora_inicio: citaData.hora_inicio,
                hora_fin: citaData.hora_fin,
                zona_horaria: citaData.zona_horaria || DEFAULTS.ZONA_HORARIA,
                precio_servicio: citaData.precio_servicio,
                descuento: citaData.descuento || 0.00,
                precio_final: citaData.precio_final,
                estado: citaData.estado || 'pendiente',
                metodo_pago: citaData.metodo_pago || null,
                pagado: citaData.pagado || false,
                notas_cliente: citaData.notas_cliente || null,
                notas_profesional: citaData.notas_profesional || null,
                notas_internas: citaData.notas_internas || null,
                confirmacion_requerida: citaData.confirmacion_requerida !== false,
                confirmada_por_cliente: null,
                recordatorio_enviado: false,
                creado_por: usuarioId,
                ip_origen: citaData.ip_origen || null,
                user_agent: citaData.user_agent || null,
                origen_aplicacion: citaData.origen_aplicacion || DEFAULTS.ORIGEN_APLICACION
            };

            const nuevaCita = await CitaHelpersModel.insertarCitaCompleta(datosCompletos, db);

            // Registrar evento de auditoría
            await CitaHelpersModel.registrarEventoAuditoria({
                organizacion_id: citaData.organizacion_id,
                tipo_evento: 'cita_creada_estandar',
                descripcion: 'Cita creada via endpoint estándar autenticado',
                cita_id: nuevaCita.id,
                usuario_id: usuarioId,
                metadatos: {
                    cliente_id: citaData.cliente_id,
                    profesional_id: citaData.profesional_id,
                    servicio_id: citaData.servicio_id,
                    origen: 'crud_estandar'
                }
            }, db);

            await db.query('COMMIT');
            return nuevaCita;

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[CitaBaseModel.crearEstandar] Error:', {
                error: error.message,
                stack: error.stack,
                organizacion_id: citaData.organizacion_id
            });
            throw error;
        }
    }

    static async obtenerPorId(citaId, organizacionId, db = null) {
        const connection = db || await getDb();

        try {
            await connection.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const cita = await connection.query(`
                SELECT
                    c.*,
                    cl.nombre as cliente_nombre,
                    cl.telefono as cliente_telefono,
                    cl.email as cliente_email,
                    p.nombre_completo as profesional_nombre,
                    p.especialidades as profesional_especialidades,
                    s.nombre as servicio_nombre,
                    s.descripcion as servicio_descripcion,
                    s.duracion_minutos as servicio_duracion
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                JOIN profesionales p ON c.profesional_id = p.id
                JOIN servicios s ON c.servicio_id = s.id
                WHERE c.id = $1 AND c.organizacion_id = $2
            `, [citaId, organizacionId]);

            return cita.rows.length > 0 ? cita.rows[0] : null;

        } catch (error) {
            logger.error('[CitaBaseModel.obtenerPorId] Error:', {
                error: error.message,
                cita_id: citaId,
                organizacion_id: organizacionId
            });
            throw error;
        }
    }

    static async actualizarEstandar(citaId, datosActualizacion, organizacionId, usuarioId) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            // Verificar que la cita existe
            const citaExistente = await this.obtenerPorId(citaId, organizacionId, db);
            if (!citaExistente) {
                throw new Error('Cita no encontrada');
            }

            // Validar que se puede modificar
            if (['completada', 'cancelada'].includes(citaExistente.estado)) {
                throw new Error('Transición de estado inválida: no se puede modificar una cita completada o cancelada');
            }

            // Validar conflicto de horario si se cambian fechas/horas
            if (datosActualizacion.fecha_cita || datosActualizacion.hora_inicio || datosActualizacion.hora_fin) {
                const nuevaFecha = datosActualizacion.fecha_cita || citaExistente.fecha_cita;
                const nuevaHoraInicio = datosActualizacion.hora_inicio || citaExistente.hora_inicio;
                const nuevaHoraFin = datosActualizacion.hora_fin || citaExistente.hora_fin;

                await CitaHelpersModel.validarConflictoHorario(
                    citaExistente.profesional_id,
                    nuevaFecha,
                    nuevaHoraInicio,
                    nuevaHoraFin,
                    citaId,
                    db
                );
            }

            // Construir query de actualización dinámicamente
            const camposActualizables = [
                'profesional_id', 'servicio_id', 'fecha_cita', 'hora_inicio', 'hora_fin',
                'precio_servicio', 'descuento', 'precio_final', 'estado', 'metodo_pago',
                'pagado', 'notas_cliente', 'notas_profesional', 'notas_internas',
                'motivo_cancelacion', 'calificacion_cliente', 'comentario_cliente'
            ];

            const updates = [];
            const valores = [];
            let contador = 1;

            for (const campo of camposActualizables) {
                if (datosActualizacion.hasOwnProperty(campo)) {
                    updates.push(`${campo} = $${contador}`);
                    valores.push(datosActualizacion[campo]);
                    contador++;
                }
            }

            if (updates.length === 0) {
                throw new Error('No se proporcionaron campos para actualizar');
            }

            // Agregar campos de auditoría
            updates.push(`actualizado_por = $${contador}`, `actualizado_en = NOW()`);
            valores.push(usuarioId, citaId, organizacionId);

            const query = `
                UPDATE citas
                SET ${updates.join(', ')}
                WHERE id = $${contador + 1} AND organizacion_id = $${contador + 2}
                RETURNING *
            `;

            const resultado = await db.query(query, valores);

            if (resultado.rows.length === 0) {
                throw new Error('No se pudo actualizar la cita');
            }

            // Registrar evento de auditoría
            await CitaHelpersModel.registrarEventoAuditoria({
                organizacion_id: organizacionId,
                tipo_evento: 'cita_actualizada',
                descripcion: 'Cita actualizada via endpoint estándar',
                cita_id: citaId,
                usuario_id: usuarioId,
                metadatos: {
                    campos_actualizados: Object.keys(datosActualizacion),
                    estado_anterior: citaExistente.estado,
                    estado_nuevo: datosActualizacion.estado || citaExistente.estado
                }
            }, db);

            await db.query('COMMIT');

            return resultado.rows[0];

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[CitaBaseModel.actualizarEstandar] Error:', {
                error: error.message,
                cita_id: citaId,
                organizacion_id: organizacionId
            });
            throw error;
        }
    }

    static async eliminarEstandar(citaId, organizacionId, usuarioId) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const citaExistente = await this.obtenerPorId(citaId, organizacionId, db);
            if (!citaExistente) {
                return false;
            }

            if (['completada', 'cancelada', 'en_curso'].includes(citaExistente.estado)) {
                throw new Error(`No se puede cancelar una cita ${citaExistente.estado}`);
            }

            // Marcar como cancelada (soft delete)
            await db.query(`
                UPDATE citas
                SET estado = 'cancelada',
                    motivo_cancelacion = $1,
                    actualizado_por = $2,
                    actualizado_en = NOW()
                WHERE id = $3 AND organizacion_id = $4
            `, [
                'Cancelada por administrador',
                usuarioId,
                citaId,
                organizacionId
            ]);

            await db.query(`
                UPDATE horarios_disponibilidad
                SET estado = 'disponible', cita_id = NULL
                WHERE cita_id = $1
            `, [citaId]);

            await db.query('COMMIT');

            // Auditoría DESPUÉS del commit
            try {
                await CitaHelpersModel.registrarEventoAuditoria({
                    organizacion_id: organizacionId,
                    tipo_evento: 'cita_cancelada',
                    descripcion: 'Cita cancelada via endpoint estándar',
                    cita_id: citaId,
                    usuario_id: usuarioId,
                    metadatos: {
                        estado_anterior: citaExistente.estado,
                        motivo: 'Cancelada por administrador'
                    }
                }, db);
            } catch (auditError) {
                logger.error('[eliminarEstandar] Error en auditoría:', auditError);
            }

            return true;

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[CitaBaseModel.eliminarEstandar] Error:', {
                error: error.message,
                cita_id: citaId,
                organizacion_id: organizacionId
            });
            throw error;
        } finally {
            db.release();
        }
    }

    static async confirmarAsistenciaEstandar(citaId, organizacionId, usuarioId) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            // Verificar que la cita existe
            const citaExistente = await this.obtenerPorId(citaId, organizacionId, db);
            if (!citaExistente) {
                return { exito: false, mensaje: 'Cita no encontrada' };
            }

            // Validar estado actual
            if (!['pendiente'].includes(citaExistente.estado)) {
                return {
                    exito: false,
                    mensaje: `No se puede confirmar asistencia. Estado actual: ${citaExistente.estado}`
                };
            }

            // Confirmar asistencia
            const resultado = await db.query(`
                UPDATE citas
                SET estado = 'confirmada',
                    confirmada_por_cliente = NOW(),
                    actualizado_por = $1,
                    actualizado_en = NOW()
                WHERE id = $2 AND organizacion_id = $3
                RETURNING *
            `, [usuarioId, citaId, organizacionId]);

            await db.query('COMMIT');

            // Auditoría DESPUÉS del commit (fuera de la transacción)
            try {
                await CitaHelpersModel.registrarEventoAuditoria({
                    organizacion_id: organizacionId,
                    tipo_evento: 'cita_confirmada',
                    descripcion: 'Asistencia confirmada por cliente',
                    cita_id: citaId,
                    usuario_id: usuarioId,
                    metadatos: {
                        estado_anterior: citaExistente.estado,
                        confirmada_en: new Date().toISOString()
                    }
                }, db);
            } catch (auditError) {
                logger.error('[confirmarAsistenciaEstandar] Error en auditoría:', auditError);
                // No lanzar error, la cita ya fue confirmada exitosamente
            }

            return {
                exito: true,
                mensaje: 'Asistencia confirmada exitosamente',
                cita: resultado.rows[0]
            };

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[CitaBaseModel.confirmarAsistenciaEstandar] Error:', {
                error: error.message,
                cita_id: citaId,
                organizacion_id: organizacionId
            });
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * Listar citas con filtros avanzados
     * @param {Object} filtros - Filtros de búsqueda y paginación
     * @returns {Promise<Object>} Citas y total
     */
    static async listarConFiltros(filtros) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', filtros.organizacion_id.toString()]);

            let whereConditions = ['c.organizacion_id = $1'];
            let params = [filtros.organizacion_id];
            let paramCount = 1;

            if (filtros.estado) {
                paramCount++;
                whereConditions.push(`c.estado = $${paramCount}`);
                params.push(filtros.estado);
            }

            if (filtros.fecha_desde) {
                paramCount++;
                whereConditions.push(`c.fecha_cita >= $${paramCount}`);
                params.push(filtros.fecha_desde);
            }

            if (filtros.fecha_hasta) {
                paramCount++;
                whereConditions.push(`c.fecha_cita <= $${paramCount}`);
                params.push(filtros.fecha_hasta);
            }

            if (filtros.cliente_id) {
                paramCount++;
                whereConditions.push(`c.cliente_id = $${paramCount}`);
                params.push(filtros.cliente_id);
            }

            if (filtros.profesional_id) {
                paramCount++;
                whereConditions.push(`c.profesional_id = $${paramCount}`);
                params.push(filtros.profesional_id);
            }

            if (filtros.servicio_id) {
                paramCount++;
                whereConditions.push(`c.servicio_id = $${paramCount}`);
                params.push(filtros.servicio_id);
            }

            if (filtros.busqueda) {
                paramCount++;
                whereConditions.push(`(
                    cl.nombre ILIKE $${paramCount} OR
                    cl.telefono ILIKE $${paramCount} OR
                    c.codigo_cita ILIKE $${paramCount}
                )`);
                params.push(`%${filtros.busqueda}%`);
            }

            const whereClause = whereConditions.join(' AND ');
            const orderClause = `ORDER BY c.${filtros.orden || 'fecha_cita'} ${filtros.direccion || 'DESC'}`;

            // Contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                WHERE ${whereClause}
            `;

            const totalResult = await db.query(countQuery, params);
            const total = parseInt(totalResult.rows[0].total);

            // Obtener datos paginados
            const dataQuery = `
                SELECT
                    c.*,
                    cl.nombre as cliente_nombre,
                    cl.telefono as cliente_telefono,
                    p.nombre_completo as profesional_nombre,
                    s.nombre as servicio_nombre
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                JOIN profesionales p ON c.profesional_id = p.id
                JOIN servicios s ON c.servicio_id = s.id
                WHERE ${whereClause}
                ${orderClause}
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            params.push(filtros.limite || 20, filtros.offset || 0);
            const dataResult = await db.query(dataQuery, params);

            return {
                citas: dataResult.rows,
                total: total
            };

        } catch (error) {
            logger.error('[CitaBaseModel.listarConFiltros] Error:', error);
            throw error;
        } finally {
            db.release();
        }
    }
}

module.exports = CitaBaseModel;