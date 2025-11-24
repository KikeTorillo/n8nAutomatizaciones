const { getDb } = require('../../../../config/database');
const logger = require('../../../../utils/logger');
const { DEFAULTS, CitaHelpersModel } = require('./cita.helpers.model');
const RLSContextManager = require('../../../../utils/rlsContextManager');
// ✅ FIX GAP #5: Importar CitaServicioQueries para evitar N+1 en listarConFiltros
const CitaServicioQueries = require('./cita-servicio.queries');

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

            // ✅ FEATURE: Múltiples Servicios
            // Aceptar tanto servicio_id (backward compatibility) como servicios_ids (nuevo)
            let serviciosIds = [];
            if (citaData.servicios_ids && Array.isArray(citaData.servicios_ids)) {
                serviciosIds = citaData.servicios_ids;
            } else if (citaData.servicio_id) {
                // Backward compatibility: convertir servicio_id a array
                serviciosIds = [citaData.servicio_id];
                logger.warn('[CitaBaseModel.crearEstandar] ⚠️ DEPRECATED: servicio_id usado en lugar de servicios_ids', {
                    servicio_id: citaData.servicio_id
                });
            } else {
                throw new Error('Se requiere servicios_ids (array) o servicio_id (deprecated)');
            }

            // Validar que haya al menos un servicio
            if (serviciosIds.length === 0) {
                throw new Error('Se requiere al menos un servicio');
            }

            // Validar entidades relacionadas (cliente y profesional)
            await CitaHelpersModel.validarEntidadesRelacionadas(
                citaData.cliente_id,
                citaData.profesional_id,
                serviciosIds[0], // Backward compatibility: validar al menos el primer servicio
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

            // ✅ FEATURE: Obtener información completa de TODOS los servicios
            const CitaServicioModel = require('./cita-servicio.model');

            // Validar que todos los servicios existen y están activos
            await CitaServicioModel.validarServiciosOrganizacion(serviciosIds, citaData.organizacion_id);

            // Obtener información completa de cada servicio
            const serviciosData = await Promise.all(
                serviciosIds.map(async (servicioId, index) => {
                    const servicio = await CitaHelpersModel.obtenerServicioCompleto(
                        servicioId,
                        citaData.organizacion_id,
                        db
                    );

                    if (!servicio) {
                        throw new Error(`Servicio con ID ${servicioId} no encontrado`);
                    }

                    // Usar datos proporcionados o defaults del servicio
                    const servicioData = citaData.servicios_data?.[index] || {};

                    return {
                        servicio_id: servicioId,
                        orden_ejecucion: index + 1,
                        precio_aplicado: servicioData.precio_aplicado || servicio.precio || 0.00,
                        duracion_minutos: servicioData.duracion_minutos || servicio.duracion_minutos || 0,
                        descuento: servicioData.descuento || 0.00,
                        notas: servicioData.notas || null
                    };
                })
            );

            // Calcular totales (precio_total + duracion_total_minutos)
            const { precio_total, duracion_total_minutos } = CitaServicioModel.calcularTotales(serviciosData);

            logger.info('[CitaBaseModel.crearEstandar] 💰 Totales calculados desde múltiples servicios', {
                cantidad_servicios: serviciosData.length,
                servicios_ids: serviciosIds,
                precio_total,
                duracion_total_minutos
            });

            // Preparar datos completos para inserción (codigo_cita auto-generado por trigger)
            const datosCompletos = {
                organizacion_id: citaData.organizacion_id,
                cliente_id: citaData.cliente_id,
                profesional_id: citaData.profesional_id,
                // ✅ servicio_id ELIMINADO - Ahora se usa citas_servicios (M:N)
                fecha_cita: fechaCitaNormalizada,
                hora_inicio: citaData.hora_inicio,
                hora_fin: citaData.hora_fin,
                zona_horaria: citaData.zona_horaria || DEFAULTS.ZONA_HORARIA,
                // ✅ precio_servicio, descuento, precio_final ELIMINADOS
                // ✅ Nuevos campos calculados desde múltiples servicios:
                precio_total: precio_total,
                duracion_total_minutos: duracion_total_minutos,
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

            // ✅ FEATURE: Insertar servicios en citas_servicios (M:N)
            logger.info('[CitaBaseModel.crearEstandar] 📝 Insertando servicios en citas_servicios', {
                cita_id: nuevaCita.id,
                cantidad_servicios: serviciosData.length
            });

            // Insertar servicios usando CitaServicioModel (dentro de la misma transacción)
            // NOTA: No podemos usar CitaServicioModel.crearMultiples porque intenta iniciar otra transacción
            // Replicamos la lógica de inserción aquí
            const values = [];
            const placeholders = [];
            let paramCount = 1;

            serviciosData.forEach((servicio, index) => {
                placeholders.push(
                    `($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4}, $${paramCount + 5}, $${paramCount + 6}, $${paramCount + 7})`
                );

                values.push(
                    nuevaCita.id,
                    fechaCitaNormalizada,  // ✅ PARTITIONING: Requerido para FK compuesto
                    servicio.servicio_id,
                    servicio.orden_ejecucion,
                    servicio.precio_aplicado,
                    servicio.duracion_minutos,
                    servicio.descuento,
                    servicio.notas
                );

                paramCount += 8;
            });

            const queryServiciosInsert = `
                INSERT INTO citas_servicios (
                    cita_id,
                    fecha_cita,
                    servicio_id,
                    orden_ejecucion,
                    precio_aplicado,
                    duracion_minutos,
                    descuento,
                    notas
                ) VALUES ${placeholders.join(', ')}
                RETURNING *
            `;

            const serviciosInsertados = await db.query(queryServiciosInsert, values);

            logger.info('[CitaBaseModel.crearEstandar] ✅ Servicios insertados en citas_servicios', {
                cita_id: nuevaCita.id,
                cantidad_insertada: serviciosInsertados.rows.length
            });

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
                    servicios_ids: serviciosIds, // ✅ Array de servicios en lugar de servicio_id único
                    cantidad_servicios: serviciosData.length,
                    precio_total: precio_total,
                    duracion_total_minutos: duracion_total_minutos,
                    origen: 'crud_estandar'
                }
            }, db);

            logger.info('[CitaBaseModel.crearEstandar] 🔍 COMMIT EXITOSO', {
                cita_id: nuevaCita.id,
                organizacion_id: nuevaCita.organizacion_id,
                codigo_cita: nuevaCita.codigo_cita,
                cantidad_servicios: serviciosInsertados.rows.length,
                db_processId: db.processID
            });

            // ✅ Agregar servicios a la respuesta
            nuevaCita.servicios = serviciosInsertados.rows;

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
     * Obtener cita por ID con datos completos (incluye JOINs + múltiples servicios)
     * Usar solo cuando se necesiten los datos relacionados (cliente, profesional, servicios)
     * Para validaciones internas, usar verificarExistencia() en su lugar
     * ✅ FEATURE: Recupera múltiples servicios usando JSON_AGG (evita N+1 queries)
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
                    -- ✅ Servicios como JSON array (evita N+1 queries)
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', cs.id,
                                'servicio_id', cs.servicio_id,
                                'servicio_nombre', s.nombre,
                                'servicio_descripcion', s.descripcion,
                                'orden_ejecucion', cs.orden_ejecucion,
                                'precio_aplicado', cs.precio_aplicado,
                                'duracion_minutos', cs.duracion_minutos,
                                'descuento', cs.descuento,
                                'notas', cs.notas
                            ) ORDER BY cs.orden_ejecucion
                        ) FILTER (WHERE cs.id IS NOT NULL),
                        '[]'::json
                    ) as servicios
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                JOIN profesionales p ON c.profesional_id = p.id
                LEFT JOIN citas_servicios cs ON c.id = cs.cita_id AND cs.fecha_cita = c.fecha_cita
                LEFT JOIN servicios s ON cs.servicio_id = s.id
                WHERE c.id = $1 AND c.organizacion_id = $2
                GROUP BY c.id, c.fecha_cita, cl.id, p.id
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
                    -- ✅ Servicios como JSON array (evita N+1 queries)
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', cs.id,
                                'servicio_id', cs.servicio_id,
                                'servicio_nombre', s.nombre,
                                'servicio_descripcion', s.descripcion,
                                'orden_ejecucion', cs.orden_ejecucion,
                                'precio_aplicado', cs.precio_aplicado,
                                'duracion_minutos', cs.duracion_minutos,
                                'descuento', cs.descuento,
                                'notas', cs.notas
                            ) ORDER BY cs.orden_ejecucion
                        ) FILTER (WHERE cs.id IS NOT NULL),
                        '[]'::json
                    ) as servicios
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                JOIN profesionales p ON c.profesional_id = p.id
                LEFT JOIN citas_servicios cs ON c.id = cs.cita_id AND cs.fecha_cita = c.fecha_cita
                LEFT JOIN servicios s ON cs.servicio_id = s.id
                WHERE c.id = $1 AND c.organizacion_id = $2
                GROUP BY c.id, c.fecha_cita, cl.id, p.id
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
            // ✅ Usar precio_total en lugar de precio_final
            const precioFinal = datosActualizacion.precio_total || citaExistente.precio_total || 0;
            if (datosActualizacion.estado === 'completada' && precioFinal > 0) {
                if (!datosActualizacion.hasOwnProperty('pagado')) {
                    datosActualizacion.pagado = true;
                    logger.info('[CitaBaseModel.actualizarEstandar] Auto-marcando como pagada', {
                        cita_id: citaId,
                        precio_total: precioFinal
                    });
                }
            }

            // ✅ FEATURE: Actualizar servicios si se proporciona servicios_ids
            if (datosActualizacion.servicios_ids && Array.isArray(datosActualizacion.servicios_ids)) {
                const CitaServicioModel = require('./cita-servicio.model');

                logger.info('[CitaBaseModel.actualizarEstandar] 🔄 Actualizando servicios', {
                    cita_id: citaId,
                    cantidad_servicios: datosActualizacion.servicios_ids.length
                });

                // Validar servicios
                await CitaServicioModel.validarServiciosOrganizacion(
                    datosActualizacion.servicios_ids,
                    organizacionId
                );

                // Obtener información completa de servicios
                const serviciosData = await Promise.all(
                    datosActualizacion.servicios_ids.map(async (servicioId, index) => {
                        const servicio = await CitaHelpersModel.obtenerServicioCompleto(
                            servicioId,
                            organizacionId,
                            db
                        );

                        const servicioData = datosActualizacion.servicios_data?.[index] || {};

                        return {
                            servicio_id: servicioId,
                            orden_ejecucion: index + 1,
                            precio_aplicado: servicioData.precio_aplicado || servicio.precio || 0.00,
                            duracion_minutos: servicioData.duracion_minutos || servicio.duracion_minutos || 0,
                            descuento: servicioData.descuento || 0.00,
                            notas: servicioData.notas || null
                        };
                    })
                );

                // Calcular nuevos totales
                const { precio_total, duracion_total_minutos } = CitaServicioModel.calcularTotales(serviciosData);

                // Agregar totales a datosActualizacion
                datosActualizacion.precio_total = precio_total;
                datosActualizacion.duracion_total_minutos = duracion_total_minutos;

                // ✅ FIX: Recalcular hora_fin basándose en nueva duración (si no se proporcionó explícitamente)
                if (!datosActualizacion.hora_fin && duracion_total_minutos > 0) {
                    const horaInicioFinal = datosActualizacion.hora_inicio || citaExistente.hora_inicio;

                    // Convertir hora_inicio (HH:MM:SS o HH:MM) a minutos desde medianoche
                    const [horas, minutos] = horaInicioFinal.split(':').map(Number);
                    const minutosDesdeMedianoche = horas * 60 + minutos;

                    // Sumar duración
                    const minutosFinales = minutosDesdeMedianoche + duracion_total_minutos;

                    // Convertir de vuelta a HH:MM:SS
                    const horasFin = Math.floor(minutosFinales / 60);
                    const minutosFin = minutosFinales % 60;

                    datosActualizacion.hora_fin = `${String(horasFin).padStart(2, '0')}:${String(minutosFin).padStart(2, '0')}:00`;

                    logger.info('[CitaBaseModel.actualizarEstandar] ✅ Recalculada hora_fin automáticamente', {
                        cita_id: citaId,
                        hora_inicio: horaInicioFinal,
                        duracion_minutos: duracion_total_minutos,
                        hora_fin_nueva: datosActualizacion.hora_fin
                    });

                    // ✅ FIX: Validar que la nueva duración NO cause conflictos con otras citas
                    const fechaFinal = datosActualizacion.fecha_cita || citaExistente.fecha_cita;
                    const profesionalFinal = datosActualizacion.profesional_id || citaExistente.profesional_id;

                    logger.info('[CitaBaseModel.actualizarEstandar] 🔍 Validando conflictos post-cambio de duración', {
                        cita_id: citaId,
                        profesional_id: profesionalFinal,
                        fecha: fechaFinal,
                        hora_inicio: horaInicioFinal,
                        hora_fin_nueva: datosActualizacion.hora_fin,
                        duracion_anterior: citaExistente.duracion_total_minutos,
                        duracion_nueva: duracion_total_minutos
                    });

                    // Validar que no cruce medianoche
                    CitaHelpersModel.validarNoMidnightCrossing(horaInicioFinal, datosActualizacion.hora_fin);

                    // Validar conflictos (horario laboral, bloqueos, otras citas)
                    const validacion = await CitaHelpersModel.validarHorarioPermitido(
                        profesionalFinal,
                        fechaFinal,
                        horaInicioFinal,
                        datosActualizacion.hora_fin,
                        organizacionId,
                        db,
                        citaId, // excluir esta cita de la validación de conflictos
                        { esWalkIn: false, permitirFueraHorario: false }
                    );

                    if (!validacion.valido) {
                        const mensajesError = validacion.errores.map(e => e.mensaje).join('; ');
                        logger.error('[CitaBaseModel.actualizarEstandar] ❌ Conflicto detectado al cambiar servicios', {
                            cita_id: citaId,
                            profesional_id: profesionalFinal,
                            fecha: fechaFinal,
                            horario: `${horaInicioFinal}-${datosActualizacion.hora_fin}`,
                            errores: validacion.errores
                        });
                        throw new Error(`No se puede actualizar los servicios: ${mensajesError}`);
                    }

                    if (validacion.advertencias.length > 0) {
                        logger.warn('[CitaBaseModel.actualizarEstandar] ⚠️ Advertencias en validación post-cambio servicios', {
                            cita_id: citaId,
                            advertencias: validacion.advertencias
                        });
                    }
                }

                // ✅ FIX PARTITIONING: Si cambia la fecha, actualizar tabla citas PRIMERO
                // para que el FK compuesto (cita_id, fecha_cita) sea válido al insertar servicios
                if (datosActualizacion.fecha_cita && datosActualizacion.fecha_cita !== citaExistente.fecha_cita) {
                    await db.query(
                        'UPDATE citas SET fecha_cita = $1, actualizado_en = NOW() WHERE id = $2 AND organizacion_id = $3',
                        [datosActualizacion.fecha_cita, citaId, organizacionId]
                    );

                    logger.info('[CitaBaseModel.actualizarEstandar] ✅ Pre-actualizada fecha_cita para FK compuesto', {
                        cita_id: citaId,
                        fecha_anterior: citaExistente.fecha_cita,
                        fecha_nueva: datosActualizacion.fecha_cita
                    });

                    // Actualizar citaExistente para reflejar el cambio
                    citaExistente.fecha_cita = datosActualizacion.fecha_cita;
                }

                // DELETE servicios actuales
                await db.query('DELETE FROM citas_servicios WHERE cita_id = $1', [citaId]);

                // INSERT nuevos servicios (replicamos lógica para evitar nested transaction)
                const values = [];
                const placeholders = [];
                let paramCountServ = 1;

                // ✅ PARTITIONING: Obtener fecha final (nueva o existente) para FK compuesto
                const fechaCitaFinal = datosActualizacion.fecha_cita || citaExistente.fecha_cita;

                serviciosData.forEach((servicio) => {
                    placeholders.push(
                        `($${paramCountServ}, $${paramCountServ + 1}, $${paramCountServ + 2}, $${paramCountServ + 3}, $${paramCountServ + 4}, $${paramCountServ + 5}, $${paramCountServ + 6}, $${paramCountServ + 7})`
                    );

                    values.push(
                        citaId,
                        fechaCitaFinal,  // ✅ PARTITIONING: Requerido para FK compuesto
                        servicio.servicio_id,
                        servicio.orden_ejecucion,
                        servicio.precio_aplicado,
                        servicio.duracion_minutos,
                        servicio.descuento,
                        servicio.notas
                    );

                    paramCountServ += 8;
                });

                await db.query(`
                    INSERT INTO citas_servicios (
                        cita_id, fecha_cita, servicio_id, orden_ejecucion,
                        precio_aplicado, duracion_minutos, descuento, notas
                    ) VALUES ${placeholders.join(', ')}
                `, values);

                logger.info('[CitaBaseModel.actualizarEstandar] ✅ Servicios actualizados', {
                    cita_id: citaId,
                    cantidad: serviciosData.length
                });
            }

            // Construir query de actualización dinámicamente
            const camposActualizables = [
                'profesional_id', 'fecha_cita', 'hora_inicio', 'hora_fin',
                // ✅ servicio_id ELIMINADO - Ahora se usa citas_servicios
                // ✅ precio_servicio, descuento, precio_final ELIMINADOS
                'precio_total', 'duracion_total_minutos', // ✅ Nuevos campos
                'estado', 'metodo_pago',
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
     * ✅ FEATURE: Usa JSON_AGG para obtener múltiples servicios (evita N+1 queries)
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

            // ✅ Filtro por servicio_id MODIFICADO - Ahora busca en citas_servicios
            if (filtros.servicio_id) {
                paramCount++;
                whereConditions.push(`EXISTS (
                    SELECT 1 FROM citas_servicios cs
                    WHERE cs.cita_id = c.id AND cs.servicio_id = $${paramCount}
                )`);
                params.push(filtros.servicio_id);
            }

            // ✅ NUEVO: Filtro por múltiples servicios (array)
            if (filtros.servicios_ids && Array.isArray(filtros.servicios_ids) && filtros.servicios_ids.length > 0) {
                paramCount++;
                whereConditions.push(`EXISTS (
                    SELECT 1 FROM citas_servicios cs
                    WHERE cs.cita_id = c.id AND cs.servicio_id = ANY($${paramCount}::int[])
                )`);
                params.push(filtros.servicios_ids);
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

            // Obtener datos paginados con servicios (JSON_AGG)
            const dataQuery = `
                SELECT
                    c.*,
                    cl.nombre as cliente_nombre,
                    cl.telefono as cliente_telefono,
                    p.nombre_completo as profesional_nombre,
                    -- ✅ Servicios como JSON array (evita N+1 queries)
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', cs.id,
                                'servicio_id', cs.servicio_id,
                                'servicio_nombre', s.nombre,
                                'orden_ejecucion', cs.orden_ejecucion,
                                'precio_aplicado', cs.precio_aplicado,
                                'duracion_minutos', cs.duracion_minutos
                            ) ORDER BY cs.orden_ejecucion
                        ) FILTER (WHERE cs.id IS NOT NULL),
                        '[]'::json
                    ) as servicios
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                JOIN profesionales p ON c.profesional_id = p.id
                LEFT JOIN citas_servicios cs ON c.id = cs.cita_id AND cs.fecha_cita = c.fecha_cita
                LEFT JOIN servicios s ON cs.servicio_id = s.id
                WHERE ${whereClause}
                GROUP BY c.id, c.fecha_cita, cl.id, p.id
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