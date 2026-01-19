const { getDb } = require('../../../../config/database');
const logger = require('../../../../utils/logger');
const { ErrorHelper } = require('../../../../utils/helpers');
const { DEFAULTS, CitaHelpersModel } = require('./cita.helpers.model');
const RLSContextManager = require('../../../../utils/rlsContextManager');
// ✅ FIX GAP #5: Importar CitaServicioQueries para evitar N+1 en listarConFiltros
const CitaServicioQueries = require('./cita-servicio.queries');
// ✅ FEATURE: Citas Recurrentes
const { v4: uuidv4 } = require('uuid');
const { RecurrenciaUtil, FRECUENCIAS } = require('../../utils/recurrencia.util');

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
                ErrorHelper.throwValidation('Se requiere servicios_ids (array) o servicio_id (deprecated)');
            }

            // Validar que haya al menos un servicio
            if (serviciosIds.length === 0) {
                ErrorHelper.throwValidation('Se requiere al menos un servicio');
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
                ErrorHelper.throwConflict(`No se puede crear la cita: ${mensajesError}`);
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

            // Obtener información completa de TODOS los servicios en 1 query (optimización N+1)
            const serviciosMap = await CitaHelpersModel.obtenerServiciosCompletos(
                serviciosIds,
                citaData.organizacion_id,
                db
            );

            // Procesar servicios y validar que todos existen
            const serviciosData = serviciosIds.map((servicioId, index) => {
                const servicio = serviciosMap.get(servicioId);

                ErrorHelper.throwIfNotFound(servicio, `Servicio con ID ${servicioId}`);

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
            });

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
                sucursal_id: citaData.sucursal_id || null, // ✅ Multi-sucursal
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

            ErrorHelper.throwIfNotFound(citaExistente, 'Cita');

            // Validar que se puede modificar
            if (['completada', 'cancelada'].includes(citaExistente.estado)) {
                ErrorHelper.throwConflict('Transición de estado inválida: no se puede modificar una cita completada o cancelada');
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
                    ErrorHelper.throwConflict(`No se puede actualizar la cita: ${mensajesError}`);
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
                        ErrorHelper.throwConflict(`No se puede actualizar los servicios: ${mensajesError}`);
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
                ErrorHelper.throwValidation('No se proporcionaron campos para actualizar');
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

            ErrorHelper.throwIfNotFound(resultado.rows[0], 'Cita');

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
                ErrorHelper.throwConflict(`No se puede cancelar una cita ${citaExistente.estado}`);
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

            // Actualizar historial de recordatorios (si existe)
            // Marca el último recordatorio enviado como 'confirmado'
            await db.query(`
                UPDATE historial_recordatorios
                SET estado = 'confirmado',
                    respuesta_cliente = 'Confirmado vía chatbot',
                    fecha_respuesta = NOW()
                WHERE id = (
                    SELECT id FROM historial_recordatorios
                    WHERE cita_id = $1 AND organizacion_id = $2 AND estado = 'enviado'
                    ORDER BY enviado_en DESC
                    LIMIT 1
                )
            `, [citaId, organizacionId]);

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

            // ✅ FEATURE: Multi-sucursal - Filtrar por sucursal_id
            if (filtros.sucursal_id) {
                paramCount++;
                whereConditions.push(`c.sucursal_id = $${paramCount}`);
                params.push(filtros.sucursal_id);
            }

            const whereClause = whereConditions.join(' AND ');

            // Validación whitelist para ORDER BY (prevención SQL injection)
            const CAMPOS_ORDEN_PERMITIDOS = ['fecha_cita', 'creado_en', 'hora_inicio', 'estado', 'actualizado_en'];
            const ordenSeguro = CAMPOS_ORDEN_PERMITIDOS.includes(filtros.orden) ? filtros.orden : 'fecha_cita';
            const direccionSegura = filtros.direccion?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            const orderClause = `ORDER BY c.${ordenSeguro} ${direccionSegura}`;

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

    // =====================================================================
    // CITAS RECURRENTES
    // =====================================================================

    /**
     * Crea una serie de citas recurrentes
     *
     * @param {Object} citaData - Datos base de la cita + patron_recurrencia
     * @param {number} usuarioId - ID del usuario que crea
     * @returns {Object} Resumen: { citas_creadas, citas_omitidas, detalles }
     */
    static async crearRecurrente(citaData, usuarioId) {
        logger.info('[CitaBaseModel.crearRecurrente] Iniciando creación de serie recurrente', {
            organizacion_id: citaData.organizacion_id,
            profesional_id: citaData.profesional_id,
            patron: citaData.patron_recurrencia
        });

        // Validar patrón de recurrencia
        const validacionPatron = RecurrenciaUtil.validarPatronRecurrencia(citaData.patron_recurrencia);
        if (!validacionPatron.valido) {
            ErrorHelper.throwValidation(`Patrón de recurrencia inválido: ${validacionPatron.errores.join(', ')}`);
        }

        // Normalizar fecha de inicio
        let fechaInicio;
        if (citaData.fecha_cita instanceof Date) {
            fechaInicio = citaData.fecha_cita.toISOString().split('T')[0];
        } else if (typeof citaData.fecha_cita === 'string' && citaData.fecha_cita.includes('T')) {
            fechaInicio = citaData.fecha_cita.split('T')[0];
        } else {
            fechaInicio = citaData.fecha_cita;
        }

        // Generar todas las fechas de la serie
        const fechasSerie = RecurrenciaUtil.generarFechasRecurrentes(
            citaData.patron_recurrencia,
            fechaInicio
        );

        logger.info('[CitaBaseModel.crearRecurrente] Fechas generadas', {
            total: fechasSerie.length,
            primera: fechasSerie[0],
            ultima: fechasSerie[fechasSerie.length - 1]
        });

        // Generar UUID para la serie
        const citaSerieId = uuidv4();

        // Resultado
        const resultado = {
            cita_serie_id: citaSerieId,
            total_solicitadas: fechasSerie.length,
            citas_creadas: [],
            citas_omitidas: [],
            patron: citaData.patron_recurrencia,
            descripcion_patron: RecurrenciaUtil.describirPatron(citaData.patron_recurrencia)
        };

        return await RLSContextManager.transaction(citaData.organizacion_id, async (db) => {
            // Validar entidades relacionadas una sola vez
            const serviciosIds = citaData.servicios_ids || [citaData.servicio_id];

            await CitaHelpersModel.validarEntidadesRelacionadas(
                citaData.cliente_id,
                citaData.profesional_id,
                serviciosIds[0],
                citaData.organizacion_id,
                db
            );

            // Obtener información de servicios una sola vez
            const CitaServicioModel = require('./cita-servicio.model');
            await CitaServicioModel.validarServiciosOrganizacion(serviciosIds, citaData.organizacion_id);

            const serviciosData = await Promise.all(
                serviciosIds.map(async (servicioId, index) => {
                    const servicio = await CitaHelpersModel.obtenerServicioCompleto(
                        servicioId,
                        citaData.organizacion_id,
                        db
                    );

                    ErrorHelper.throwIfNotFound(servicio, `Servicio con ID ${servicioId}`);

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

            const { precio_total, duracion_total_minutos } = CitaServicioModel.calcularTotales(serviciosData);

            // Crear cada cita de la serie
            for (let i = 0; i < fechasSerie.length; i++) {
                const fechaCita = fechasSerie[i];
                const numeroEnSerie = i + 1;

                try {
                    // Validar horario para esta fecha específica
                    const validacion = await CitaHelpersModel.validarHorarioPermitido(
                        citaData.profesional_id,
                        fechaCita,
                        citaData.hora_inicio,
                        citaData.hora_fin,
                        citaData.organizacion_id,
                        db,
                        null,
                        { esWalkIn: false, permitirFueraHorario: false }
                    );

                    if (!validacion.valido) {
                        // Esta fecha no está disponible, omitirla
                        resultado.citas_omitidas.push({
                            fecha: fechaCita,
                            numero_en_serie: numeroEnSerie,
                            motivo: validacion.errores.map(e => e.mensaje).join('; ')
                        });

                        logger.warn('[CitaBaseModel.crearRecurrente] Fecha omitida por conflicto', {
                            fecha: fechaCita,
                            numero_en_serie: numeroEnSerie,
                            errores: validacion.errores
                        });

                        continue;
                    }

                    // Preparar datos para esta cita
                    const datosCita = {
                        organizacion_id: citaData.organizacion_id,
                        cliente_id: citaData.cliente_id,
                        profesional_id: citaData.profesional_id,
                        sucursal_id: citaData.sucursal_id || null,
                        fecha_cita: fechaCita,
                        hora_inicio: citaData.hora_inicio,
                        hora_fin: citaData.hora_fin,
                        zona_horaria: citaData.zona_horaria || DEFAULTS.ZONA_HORARIA,
                        precio_total: precio_total,
                        duracion_total_minutos: duracion_total_minutos,
                        estado: 'pendiente',
                        metodo_pago: citaData.metodo_pago || null,
                        pagado: false,
                        notas_cliente: citaData.notas_cliente || null,
                        notas_profesional: citaData.notas_profesional || null,
                        notas_internas: citaData.notas_internas || null,
                        confirmacion_requerida: citaData.confirmacion_requerida !== false,
                        confirmada_por_cliente: null,
                        recordatorio_enviado: false,
                        creado_por: usuarioId,
                        ip_origen: citaData.ip_origen || null,
                        user_agent: citaData.user_agent || null,
                        origen_aplicacion: citaData.origen_aplicacion || DEFAULTS.ORIGEN_APLICACION,
                        // Campos de recurrencia
                        cita_serie_id: citaSerieId,
                        es_cita_recurrente: true,
                        numero_en_serie: numeroEnSerie,
                        total_en_serie: fechasSerie.length,
                        // Solo guardar patrón en la primera cita
                        patron_recurrencia: numeroEnSerie === 1 ? citaData.patron_recurrencia : null
                    };

                    // Validar que no cruce medianoche
                    CitaHelpersModel.validarNoMidnightCrossing(citaData.hora_inicio, citaData.hora_fin);

                    // Insertar cita
                    const nuevaCita = await CitaHelpersModel.insertarCitaCompleta(datosCita, db);

                    // Insertar servicios
                    const values = [];
                    const placeholders = [];
                    let paramCount = 1;

                    serviciosData.forEach((servicio) => {
                        placeholders.push(
                            `($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4}, $${paramCount + 5}, $${paramCount + 6}, $${paramCount + 7})`
                        );

                        values.push(
                            nuevaCita.id,
                            fechaCita,
                            servicio.servicio_id,
                            servicio.orden_ejecucion,
                            servicio.precio_aplicado,
                            servicio.duracion_minutos,
                            servicio.descuento,
                            servicio.notas
                        );

                        paramCount += 8;
                    });

                    await db.query(`
                        INSERT INTO citas_servicios (
                            cita_id, fecha_cita, servicio_id, orden_ejecucion,
                            precio_aplicado, duracion_minutos, descuento, notas
                        ) VALUES ${placeholders.join(', ')}
                    `, values);

                    resultado.citas_creadas.push({
                        id: nuevaCita.id,
                        fecha: fechaCita,
                        codigo_cita: nuevaCita.codigo_cita,
                        numero_en_serie: numeroEnSerie
                    });

                    logger.info('[CitaBaseModel.crearRecurrente] Cita creada', {
                        cita_id: nuevaCita.id,
                        fecha: fechaCita,
                        numero_en_serie: numeroEnSerie
                    });

                } catch (error) {
                    // Error inesperado, registrar y continuar
                    resultado.citas_omitidas.push({
                        fecha: fechaCita,
                        numero_en_serie: numeroEnSerie,
                        motivo: error.message
                    });

                    logger.error('[CitaBaseModel.crearRecurrente] Error al crear cita', {
                        fecha: fechaCita,
                        numero_en_serie: numeroEnSerie,
                        error: error.message
                    });
                }
            }

            // Verificar que se creó al menos una cita
            if (resultado.citas_creadas.length === 0) {
                ErrorHelper.throwConflict('No se pudo crear ninguna cita de la serie. Todas las fechas tienen conflictos.');
            }

            // Actualizar total_en_serie en todas las citas creadas (por si algunas fueron omitidas)
            if (resultado.citas_creadas.length !== fechasSerie.length) {
                await db.query(`
                    UPDATE citas
                    SET total_en_serie = $1
                    WHERE cita_serie_id = $2
                `, [resultado.citas_creadas.length, citaSerieId]);
            }

            // Registrar evento de auditoría
            await CitaHelpersModel.registrarEventoAuditoria({
                organizacion_id: citaData.organizacion_id,
                tipo_evento: 'serie_citas_creada',
                descripcion: `Serie recurrente creada: ${resultado.citas_creadas.length} citas`,
                cita_id: resultado.citas_creadas[0]?.id,
                usuario_id: usuarioId,
                metadatos: {
                    cita_serie_id: citaSerieId,
                    citas_creadas: resultado.citas_creadas.length,
                    citas_omitidas: resultado.citas_omitidas.length,
                    patron: citaData.patron_recurrencia,
                    descripcion_patron: resultado.descripcion_patron
                }
            }, db);

            // Calcular estadísticas de la serie
            const fechasCreadas = resultado.citas_creadas.map(c => c.fecha);
            resultado.estadisticas = RecurrenciaUtil.calcularEstadisticasSerie(
                fechasCreadas,
                precio_total,
                duracion_total_minutos
            );

            logger.info('[CitaBaseModel.crearRecurrente] Serie creada exitosamente', {
                cita_serie_id: citaSerieId,
                creadas: resultado.citas_creadas.length,
                omitidas: resultado.citas_omitidas.length
            });

            return resultado;
        });
    }

    /**
     * Obtiene todas las citas de una serie recurrente
     *
     * @param {string} serieId - UUID de la serie
     * @param {number} organizacionId - ID de la organización
     * @param {Object} opciones - { incluir_canceladas: boolean }
     * @returns {Object} Serie completa con citas y estadísticas
     */
    static async obtenerSerie(serieId, organizacionId, opciones = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = [
                'c.organizacion_id = $1',
                'c.cita_serie_id = $2'
            ];

            if (!opciones.incluir_canceladas) {
                whereConditions.push("c.estado != 'cancelada'");
            }

            const query = `
                SELECT
                    c.*,
                    cl.nombre as cliente_nombre,
                    cl.telefono as cliente_telefono,
                    cl.email as cliente_email,
                    p.nombre_completo as profesional_nombre,
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
                WHERE ${whereConditions.join(' AND ')}
                GROUP BY c.id, c.fecha_cita, cl.id, p.id
                ORDER BY c.fecha_cita ASC, c.hora_inicio ASC
            `;

            const resultado = await db.query(query, [organizacionId, serieId]);

            if (resultado.rows.length === 0) {
                return null;
            }

            // Obtener patrón de la primera cita
            const primeraCita = resultado.rows.find(c => c.numero_en_serie === 1);
            const patron = primeraCita?.patron_recurrencia;

            // Calcular estadísticas
            const citasActivas = resultado.rows.filter(c => c.estado !== 'cancelada');
            const citasCompletadas = resultado.rows.filter(c => c.estado === 'completada');
            const citasPendientes = resultado.rows.filter(c =>
                ['pendiente', 'confirmada'].includes(c.estado)
            );

            return {
                cita_serie_id: serieId,
                patron_recurrencia: patron,
                descripcion_patron: patron ? RecurrenciaUtil.describirPatron(patron) : null,
                total_citas: resultado.rows.length,
                citas_activas: citasActivas.length,
                citas_completadas: citasCompletadas.length,
                citas_pendientes: citasPendientes.length,
                citas_canceladas: resultado.rows.length - citasActivas.length,
                fecha_inicio: resultado.rows[0]?.fecha_cita,
                fecha_fin: resultado.rows[resultado.rows.length - 1]?.fecha_cita,
                cliente: {
                    id: resultado.rows[0]?.cliente_id,
                    nombre: resultado.rows[0]?.cliente_nombre,
                    telefono: resultado.rows[0]?.cliente_telefono,
                    email: resultado.rows[0]?.cliente_email
                },
                profesional: {
                    id: resultado.rows[0]?.profesional_id,
                    nombre: resultado.rows[0]?.profesional_nombre
                },
                citas: resultado.rows
            };
        });
    }

    /**
     * Cancela todas las citas pendientes de una serie
     *
     * @param {string} serieId - UUID de la serie
     * @param {number} organizacionId - ID de la organización
     * @param {Object} opciones - { motivo_cancelacion, cancelar_desde_fecha, cancelar_solo_pendientes }
     * @param {number} usuarioId - ID del usuario que cancela
     * @returns {Object} Resumen de cancelación
     */
    static async cancelarSerie(serieId, organizacionId, opciones, usuarioId) {
        const {
            motivo_cancelacion,
            cancelar_desde_fecha,
            cancelar_solo_pendientes = true
        } = opciones;

        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que la serie existe
            const verificacion = await db.query(`
                SELECT COUNT(*) as total,
                       COUNT(*) FILTER (WHERE estado IN ('pendiente', 'confirmada')) as pendientes
                FROM citas
                WHERE organizacion_id = $1 AND cita_serie_id = $2
            `, [organizacionId, serieId]);

            if (parseInt(verificacion.rows[0].total) === 0) {
                ErrorHelper.throwNotFound('Serie de citas no encontrada');
            }

            // Construir condiciones de cancelación
            let whereConditions = [
                'organizacion_id = $1',
                'cita_serie_id = $2'
            ];
            let params = [organizacionId, serieId];
            let paramCount = 2;

            // Solo cancelar pendientes/confirmadas
            if (cancelar_solo_pendientes) {
                whereConditions.push("estado IN ('pendiente', 'confirmada')");
            } else {
                whereConditions.push("estado NOT IN ('completada', 'cancelada')");
            }

            // Cancelar desde fecha específica
            if (cancelar_desde_fecha) {
                paramCount++;
                whereConditions.push(`fecha_cita >= $${paramCount}`);
                params.push(cancelar_desde_fecha);
            }

            // Ejecutar cancelación
            paramCount++;
            params.push(motivo_cancelacion);
            paramCount++;
            params.push(usuarioId);

            const resultado = await db.query(`
                UPDATE citas
                SET estado = 'cancelada',
                    estado_anterior = estado,
                    motivo_cancelacion = $${paramCount - 1},
                    actualizado_por = $${paramCount},
                    actualizado_en = NOW()
                WHERE ${whereConditions.join(' AND ')}
                RETURNING id, fecha_cita, codigo_cita, estado_anterior
            `, params);

            const citasCanceladas = resultado.rows;

            // Registrar evento de auditoría
            await CitaHelpersModel.registrarEventoAuditoria({
                organizacion_id: organizacionId,
                tipo_evento: 'serie_citas_cancelada',
                descripcion: `Serie cancelada: ${citasCanceladas.length} citas`,
                cita_id: citasCanceladas[0]?.id,
                usuario_id: usuarioId,
                metadatos: {
                    cita_serie_id: serieId,
                    citas_canceladas: citasCanceladas.length,
                    motivo: motivo_cancelacion,
                    desde_fecha: cancelar_desde_fecha
                }
            }, db);

            logger.info('[CitaBaseModel.cancelarSerie] Serie cancelada', {
                cita_serie_id: serieId,
                canceladas: citasCanceladas.length
            });

            return {
                cita_serie_id: serieId,
                citas_canceladas: citasCanceladas.length,
                detalle: citasCanceladas.map(c => ({
                    id: c.id,
                    fecha: c.fecha_cita,
                    codigo_cita: c.codigo_cita,
                    estado_anterior: c.estado_anterior
                }))
            };
        });
    }

    /**
     * Preview de fechas para una serie recurrente (sin crear)
     * Útil para mostrar al usuario antes de confirmar
     *
     * @param {Object} datos - Datos del preview
     * @returns {Object} Preview con fechas disponibles y no disponibles
     */
    static async previewRecurrencia(datos, organizacionId) {
        // Validar patrón
        const validacionPatron = RecurrenciaUtil.validarPatronRecurrencia(datos.patron_recurrencia);
        if (!validacionPatron.valido) {
            ErrorHelper.throwValidation(`Patrón inválido: ${validacionPatron.errores.join(', ')}`);
        }

        // Normalizar fecha
        let fechaInicio;
        if (datos.fecha_inicio instanceof Date) {
            fechaInicio = datos.fecha_inicio.toISOString().split('T')[0];
        } else if (typeof datos.fecha_inicio === 'string' && datos.fecha_inicio.includes('T')) {
            fechaInicio = datos.fecha_inicio.split('T')[0];
        } else {
            fechaInicio = datos.fecha_inicio;
        }

        // Generar fechas
        const fechasSerie = RecurrenciaUtil.generarFechasRecurrentes(
            datos.patron_recurrencia,
            fechaInicio
        );

        // Calcular hora_fin si no se proporciona
        let horaFin = datos.hora_fin;
        if (!horaFin && datos.duracion_minutos) {
            const [horas, minutos] = datos.hora_inicio.split(':').map(Number);
            const minutosFinales = (horas * 60 + minutos) + datos.duracion_minutos;
            const horasFin = Math.floor(minutosFinales / 60);
            const minutosFin = minutosFinales % 60;
            horaFin = `${String(horasFin).padStart(2, '0')}:${String(minutosFin).padStart(2, '0')}:00`;
        }

        const resultado = {
            fechas_disponibles: [],
            fechas_no_disponibles: [],
            patron: datos.patron_recurrencia,
            descripcion_patron: RecurrenciaUtil.describirPatron(datos.patron_recurrencia)
        };

        return await RLSContextManager.query(organizacionId, async (db) => {
            for (let i = 0; i < fechasSerie.length; i++) {
                const fecha = fechasSerie[i];

                try {
                    const validacion = await CitaHelpersModel.validarHorarioPermitido(
                        datos.profesional_id,
                        fecha,
                        datos.hora_inicio,
                        horaFin,
                        organizacionId,
                        db,
                        null,
                        { esWalkIn: false, permitirFueraHorario: false }
                    );

                    if (validacion.valido) {
                        resultado.fechas_disponibles.push({
                            fecha,
                            numero_en_serie: i + 1,
                            hora_inicio: datos.hora_inicio,
                            hora_fin: horaFin,
                            advertencias: validacion.advertencias.map(a => a.mensaje)
                        });
                    } else {
                        resultado.fechas_no_disponibles.push({
                            fecha,
                            numero_en_serie: i + 1,
                            motivo: validacion.errores.map(e => e.mensaje).join('; ')
                        });
                    }
                } catch (error) {
                    resultado.fechas_no_disponibles.push({
                        fecha,
                        numero_en_serie: i + 1,
                        motivo: error.message
                    });
                }
            }

            // Calcular estadísticas
            resultado.total_solicitadas = fechasSerie.length;
            resultado.total_disponibles = resultado.fechas_disponibles.length;
            resultado.total_no_disponibles = resultado.fechas_no_disponibles.length;
            resultado.porcentaje_disponibilidad = Math.round(
                (resultado.total_disponibles / resultado.total_solicitadas) * 100
            );

            return resultado;
        });
    }
}

module.exports = CitaBaseModel;