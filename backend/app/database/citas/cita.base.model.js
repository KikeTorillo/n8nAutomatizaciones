const { getDb } = require('../../config/database');
const logger = require('../../utils/logger');
const { DEFAULTS, CitaHelpersModel } = require('./cita.helpers.model');
const RLSContextManager = require('../../utils/rlsContextManager');

class CitaBaseModel {

    static async crearEstandar(citaData, usuarioId) {
        return await RLSContextManager.transaction(citaData.organizacion_id, async (db) => {
            logger.info('[CitaBaseModel.crearEstandar] 🔍🔍🔍 INICIO CREATE', {
                organizacion_id: citaData.organizacion_id,
                cliente_id: citaData.cliente_id,
                usuario_id: usuarioId,
                db_processId: db.processID,
                allCitaData: citaData
            });

            // Validar entidades relacionadas
            await CitaHelpersModel.validarEntidadesRelacionadas(
                citaData.cliente_id,
                citaData.profesional_id,
                citaData.servicio_id,
                citaData.organizacion_id,
                db
            );

            // Normalizar fecha_cita a formato YYYY-MM-DD ANTES de validar (soporta ISO completo, Date object o solo fecha)
            let fechaCitaNormalizada;
            if (citaData.fecha_cita instanceof Date) {
                fechaCitaNormalizada = citaData.fecha_cita.toISOString().split('T')[0];
            } else if (typeof citaData.fecha_cita === 'string' && citaData.fecha_cita.includes('T')) {
                fechaCitaNormalizada = citaData.fecha_cita.split('T')[0];
            } else {
                fechaCitaNormalizada = citaData.fecha_cita;
            }

            // Validar horario permitido (horarios_profesionales, bloqueos, conflictos)
            const validacion = await CitaHelpersModel.validarHorarioPermitido(
                citaData.profesional_id,
                fechaCitaNormalizada,  // ✅ Usar fecha normalizada
                citaData.hora_inicio,
                citaData.hora_fin,
                citaData.organizacion_id,
                db,
                null, // no excluir cita
                { esWalkIn: false, permitirFueraHorario: false }
            );

            if (!validacion.valido) {
                const mensajesError = validacion.errores.map(e => e.mensaje).join('; ');
                logger.error('[CitaBaseModel.crearEstandar] Validación de horario fallida', {
                    profesional_id: citaData.profesional_id,
                    fecha: citaData.fecha_cita,
                    horario: `${citaData.hora_inicio}-${citaData.hora_fin}`,
                    errores: validacion.errores
                });
                throw new Error(`No se puede crear la cita: ${mensajesError}`);
            }

            // Log de advertencias si las hay
            if (validacion.advertencias.length > 0) {
                logger.warn('[CitaBaseModel.crearEstandar] Advertencias en validación de horario', {
                    advertencias: validacion.advertencias
                });
            }

            // Auto-calcular precio si no se proporciona
            let precioServicio = citaData.precio_servicio;
            let precioFinal = citaData.precio_final;

            // Si no se proporcionó precio, obtenerlo automáticamente del servicio
            if (!precioServicio || !precioFinal) {
                const servicio = await CitaHelpersModel.obtenerServicioCompleto(
                    citaData.servicio_id,
                    citaData.organizacion_id,
                    db
                );

                if (servicio) {
                    precioServicio = precioServicio || servicio.precio || 0.00;
                    const descuento = citaData.descuento || 0.00;
                    precioFinal = precioFinal || (precioServicio - descuento);

                    logger.info('[CitaBaseModel.crearEstandar] 💰 Precio auto-calculado', {
                        servicio_id: citaData.servicio_id,
                        precio_servicio: precioServicio,
                        descuento: descuento,
                        precio_final: precioFinal
                    });
                }
            }

            // Preparar datos completos para inserción (codigo_cita auto-generado por trigger)
            const datosCompletos = {
                organizacion_id: citaData.organizacion_id,
                cliente_id: citaData.cliente_id,
                profesional_id: citaData.profesional_id,
                servicio_id: citaData.servicio_id,
                fecha_cita: fechaCitaNormalizada,
                hora_inicio: citaData.hora_inicio,
                hora_fin: citaData.hora_fin,
                zona_horaria: citaData.zona_horaria || DEFAULTS.ZONA_HORARIA,
                precio_servicio: precioServicio,
                descuento: citaData.descuento || 0.00,
                precio_final: precioFinal,
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

            // Validar que no cruce medianoche (constraint BD)
            CitaHelpersModel.validarNoMidnightCrossing(citaData.hora_inicio, citaData.hora_fin);

            const nuevaCita = await CitaHelpersModel.insertarCitaCompleta(datosCompletos, db);

            // Registrar evento de auditoría
            await CitaHelpersModel.registrarEventoAuditoria({
                organizacion_id: citaData.organizacion_id,
                tipo_evento: 'cita_creada',
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

            logger.info('[CitaBaseModel.crearEstandar] 🔍 COMMIT EXITOSO', {
                cita_id: nuevaCita.id,
                organizacion_id: nuevaCita.organizacion_id,
                codigo_cita: nuevaCita.codigo_cita,
                db_processId: db.processID
            });

            return nuevaCita;
        });
    }

    /**
     * Verificar existencia de cita (sin JOINs) - Optimizado para validaciones internas
     * @param {number} citaId - ID de la cita
     * @param {number} organizacionId - ID de la organización
     * @param {Object} db - Conexión de base de datos (requerida, debe venir de transacción)
     * @returns {Promise<Object|null>} Datos básicos de la cita o null
     */
    static async verificarExistencia(citaId, organizacionId, db) {
        logger.info('[CitaBaseModel.verificarExistencia] 🔍 Verificando', {
            cita_id: citaId,
            organizacion_id: organizacionId,
            db_processId: db.processID
        });

        const resultado = await db.query(`
            SELECT * FROM citas WHERE id = $1 AND organizacion_id = $2
        `, [citaId, organizacionId]);

        logger.info('[CitaBaseModel.verificarExistencia] 🔍 Resultado', {
            cita_id: citaId,
            organizacion_id: organizacionId,
            encontrada: resultado.rows.length > 0,
            rowCount: resultado.rows.length,
            datos: resultado.rows[0] || 'NO ENCONTRADA'
        });

        return resultado.rows.length > 0 ? resultado.rows[0] : null;
    }

    /**
     * Obtener cita por ID con datos completos (incluye JOINs)
     * Usar solo cuando se necesiten los datos relacionados (cliente, profesional, servicio)
     * Para validaciones internas, usar verificarExistencia() en su lugar
     */
    static async obtenerPorId(citaId, organizacionId, db = null) {
        // Si recibimos una conexión externa (desde transacción), usarla directamente
        if (db) {
            const cita = await db.query(`
                SELECT
                    c.*,
                    cl.nombre as cliente_nombre,
                    cl.telefono as cliente_telefono,
                    cl.email as cliente_email,
                    p.nombre_completo as profesional_nombre,
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
        }

        // Si no hay conexión externa, usar RLSContextManager
        return await RLSContextManager.query(organizacionId, async (db) => {
            const cita = await db.query(`
                SELECT
                    c.*,
                    cl.nombre as cliente_nombre,
                    cl.telefono as cliente_telefono,
                    cl.email as cliente_email,
                    p.nombre_completo as profesional_nombre,
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
        });
    }

    static async actualizarEstandar(citaId, datosActualizacion, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[CitaBaseModel.actualizarEstandar] 🔍🔍🔍 INICIO UPDATE', {
                cita_id: citaId,
                organizacion_id: organizacionId,
                usuario_id: usuarioId,
                db_processId: db.processID,
                datosActualizacion
            });

            // Verificar que la cita existe (sin JOINs para mejor rendimiento)
            const citaExistente = await this.verificarExistencia(citaId, organizacionId, db);

            logger.info('[CitaBaseModel.actualizarEstandar] 🔍🔍🔍 POST-VERIFICAR', {
                encontrada: !!citaExistente,
                cita_id: citaId,
                organizacion_id_buscado: organizacionId,
                organizacion_id_encontrado: citaExistente?.organizacion_id
            });

            if (!citaExistente) {
                throw new Error('Cita no encontrada');
            }

            // Validar que se puede modificar
            if (['completada', 'cancelada'].includes(citaExistente.estado)) {
                throw new Error('Transición de estado inválida: no se puede modificar una cita completada o cancelada');
            }

            // Validar horario permitido si se cambian fechas/horas o profesional
            if (datosActualizacion.fecha_cita || datosActualizacion.hora_inicio ||
                datosActualizacion.hora_fin || datosActualizacion.profesional_id) {

                // Determinar profesional final (nuevo o existente)
                const profesionalFinal = datosActualizacion.profesional_id || citaExistente.profesional_id;
                const nuevaFecha = datosActualizacion.fecha_cita || citaExistente.fecha_cita;
                const nuevaHoraInicio = datosActualizacion.hora_inicio || citaExistente.hora_inicio;
                const nuevaHoraFin = datosActualizacion.hora_fin || citaExistente.hora_fin;

                // Validar que no cruce medianoche (constraint BD)
                CitaHelpersModel.validarNoMidnightCrossing(nuevaHoraInicio, nuevaHoraFin);

                const validacion = await CitaHelpersModel.validarHorarioPermitido(
                    profesionalFinal,  // ✅ Usar profesional final (no siempre el existente)
                    nuevaFecha,
                    nuevaHoraInicio,
                    nuevaHoraFin,
                    organizacionId,
                    db,
                    citaId, // excluir esta cita de la validación de conflictos
                    { esWalkIn: false, permitirFueraHorario: false }
                );

                if (!validacion.valido) {
                    const mensajesError = validacion.errores.map(e => e.mensaje).join('; ');
                    logger.error('[CitaBaseModel.actualizarEstandar] Validación de horario fallida', {
                        cita_id: citaId,
                        profesional_id: profesionalFinal,
                        profesional_cambio: !!datosActualizacion.profesional_id,
                        fecha: nuevaFecha,
                        horario: `${nuevaHoraInicio}-${nuevaHoraFin}`,
                        errores: validacion.errores
                    });
                    throw new Error(`No se puede actualizar la cita: ${mensajesError}`);
                }

                // Log de advertencias si las hay
                if (validacion.advertencias.length > 0) {
                    logger.warn('[CitaBaseModel.actualizarEstandar] Advertencias en validación de horario', {
                        cita_id: citaId,
                        advertencias: validacion.advertencias
                    });
                }
            }

            // Lógica de negocio: Si se marca como completada y tiene precio > 0, debe estar pagada
            if (datosActualizacion.estado === 'completada' && citaExistente.precio_final > 0) {
                if (!datosActualizacion.hasOwnProperty('pagado')) {
                    datosActualizacion.pagado = true;
                    logger.info('[CitaBaseModel.actualizarEstandar] Auto-marcando como pagada', {
                        cita_id: citaId,
                        precio_final: citaExistente.precio_final
                    });
                }
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
                tipo_evento: 'cita_modificada',
                descripcion: 'Cita actualizada via endpoint estándar',
                cita_id: citaId,
                usuario_id: usuarioId,
                metadatos: {
                    campos_actualizados: Object.keys(datosActualizacion),
                    estado_anterior: citaExistente.estado,
                    estado_nuevo: datosActualizacion.estado || citaExistente.estado
                }
            }, db);

            return resultado.rows[0];
        });
    }

    static async eliminarEstandar(citaId, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que la cita existe (sin JOINs para mejor rendimiento)
            const citaExistente = await this.verificarExistencia(citaId, organizacionId, db);
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

            // Auditoría dentro de la transacción
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

            return true;
        });
    }

    static async confirmarAsistenciaEstandar(citaId, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que la cita existe (sin JOINs para mejor rendimiento)
            const citaExistente = await this.verificarExistencia(citaId, organizacionId, db);
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

            // Auditoría dentro de la transacción
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

            return {
                exito: true,
                mensaje: 'Asistencia confirmada exitosamente',
                cita: resultado.rows[0]
            };
        });
    }

    /**
     * Listar citas con filtros avanzados
     * @param {Object} filtros - Filtros de búsqueda y paginación
     * @returns {Promise<Object>} Citas y total
     */
    static async listarConFiltros(filtros) {
        return await RLSContextManager.query(filtros.organizacion_id, async (db) => {
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
        });
    }
}

module.exports = CitaBaseModel;