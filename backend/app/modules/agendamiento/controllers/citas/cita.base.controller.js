const CitaModel = require('../../models/citas');
const clienteAdapter = require('../../../../services/clienteAdapter');
const { ResponseHelper } = require('../../../../utils/helpers');
const { asyncHandler } = require('../../../../middleware');
const RLSContextManager = require('../../../../utils/rlsContextManager');
const RoundRobinService = require('../../services/round-robin.service');

class CitaBaseController {

    // =====================================================================
    // MÉTODOS PRIVADOS - Lógica extraída para evitar duplicación
    // =====================================================================

    /**
     * Resuelve el cliente: busca por email/teléfono o crea uno nuevo
     * @param {Object} clienteInfo - Datos del cliente {nombre, apellidos, email, telefono}
     * @param {number} organizacionId - ID de la organización
     * @param {string} notaOrigen - Nota para identificar el origen del cliente
     * @returns {Promise<number>} ID del cliente resuelto
     */
    static async _resolverCliente(clienteInfo, organizacionId, notaOrigen = 'Cliente creado desde agendamiento público') {
        let clienteId = null;

        // Buscar cliente existente por email (prioritario)
        if (clienteInfo.email) {
            const resultadoBusqueda = await RLSContextManager.query(organizacionId, async (db) => {
                const query = 'SELECT id FROM clientes WHERE organizacion_id = $1 AND LOWER(email) = LOWER($2) LIMIT 1';
                const result = await db.query(query, [organizacionId, clienteInfo.email]);
                return result.rows[0];
            });

            if (resultadoBusqueda) {
                clienteId = resultadoBusqueda.id;
            }
        }

        // Si no se encontró por email, buscar por teléfono (via adapter)
        if (!clienteId && clienteInfo.telefono) {
            const resultadoBusqueda = await clienteAdapter.buscarPorTelefono(
                clienteInfo.telefono,
                organizacionId,
                { exacto: true }
            );

            if (resultadoBusqueda.encontrado) {
                clienteId = resultadoBusqueda.cliente.id;
            }
        }

        // Si no existe, crear nuevo cliente (via adapter)
        if (!clienteId) {
            const nuevoCliente = await clienteAdapter.crear({
                organizacion_id: organizacionId,
                nombre: clienteInfo.nombre,
                apellidos: clienteInfo.apellidos || null,
                email: clienteInfo.email || null,
                telefono: clienteInfo.telefono,
                como_conocio: 'marketplace',
                notas_especiales: notaOrigen,
                activo: true,
                marketing_permitido: true
            });

            clienteId = nuevoCliente.id;
        }

        return clienteId;
    }

    /**
     * Calcula hora_fin basándose en duración de servicios
     * @param {string} horaInicio - Hora de inicio (HH:MM)
     * @param {number[]} serviciosIds - IDs de los servicios
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<string>} Hora de fin calculada (HH:MM)
     */
    static async _calcularHoraFin(horaInicio, serviciosIds, organizacionId) {
        const duracionTotal = await RLSContextManager.query(organizacionId, async (db) => {
            const query = 'SELECT SUM(duracion_minutos) as duracion_total FROM servicios WHERE organizacion_id = $1 AND id = ANY($2)';
            const result = await db.query(query, [organizacionId, serviciosIds]);
            return result.rows[0]?.duracion_total || 60; // Default 60 min
        });

        const [horas, minutos] = horaInicio.split(':').map(Number);
        const horaInicioDate = new Date(2000, 0, 1, horas, minutos);
        horaInicioDate.setMinutes(horaInicioDate.getMinutes() + parseInt(duracionTotal));

        return `${String(horaInicioDate.getHours()).padStart(2, '0')}:${String(horaInicioDate.getMinutes()).padStart(2, '0')}`;
    }

    /**
     * Asigna profesional automáticamente (Round-Robin o fallback)
     * @param {Object} params - Parámetros para asignación
     * @param {number[]} params.serviciosIds - IDs de servicios
     * @param {string} params.fecha - Fecha de la cita
     * @param {string} params.horaInicio - Hora de inicio
     * @param {string} params.horaFin - Hora de fin
     * @param {number} params.organizacionId - ID de la organización
     * @returns {Promise<{id: number}|{error: string}>} Profesional asignado o error
     */
    static async _asignarProfesional({ serviciosIds, fecha, horaInicio, horaFin, organizacionId }) {
        // Si hay servicio definido, usar Round-Robin inteligente
        if (serviciosIds.length > 0 && fecha && horaInicio && horaFin) {
            try {
                const profesionalAsignado = await RLSContextManager.query(organizacionId, async (db) => {
                    return await RoundRobinService.obtenerSiguienteProfesional({
                        servicioId: serviciosIds[0],
                        organizacionId,
                        fecha,
                        horaInicio,
                        horaFin,
                        db
                    });
                });
                return { id: profesionalAsignado.id };
            } catch (error) {
                return { error: error.message || 'No hay profesionales disponibles para el horario solicitado' };
            }
        }

        // Fallback: Sin servicio definido, asignar primer profesional activo
        const profesionalAsignado = await RLSContextManager.query(organizacionId, async (db) => {
            const query = 'SELECT id FROM profesionales WHERE organizacion_id = $1 AND activo = true ORDER BY id ASC LIMIT 1';
            const result = await db.query(query, [organizacionId]);
            return result.rows[0];
        });

        if (!profesionalAsignado) {
            return { error: 'No hay profesionales activos disponibles' };
        }

        return { id: profesionalAsignado.id };
    }

    // =====================================================================
    // ENDPOINTS PÚBLICOS
    // =====================================================================

    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        let citaData = {
            ...req.body,
            organizacion_id: organizacionId
        };

        // Resolver cliente si se proporciona objeto en lugar de ID
        if (citaData.cliente && !citaData.cliente_id) {
            citaData.cliente_id = await CitaBaseController._resolverCliente(
                citaData.cliente,
                organizacionId,
                'Cliente creado desde agendamiento público'
            );
            delete citaData.cliente;
        }

        // Calcular hora_fin si no se proporciona
        const serviciosIds = citaData.servicios_ids || (citaData.servicio_id ? [citaData.servicio_id] : []);
        if (!citaData.hora_fin && citaData.hora_inicio && serviciosIds.length > 0) {
            citaData.hora_fin = await CitaBaseController._calcularHoraFin(
                citaData.hora_inicio,
                serviciosIds,
                organizacionId
            );
        }

        // Asignar profesional automáticamente si no se especificó
        if (!citaData.profesional_id) {
            const asignacion = await CitaBaseController._asignarProfesional({
                serviciosIds,
                fecha: citaData.fecha_cita,
                horaInicio: citaData.hora_inicio,
                horaFin: citaData.hora_fin,
                organizacionId
            });

            if (asignacion.error) {
                return ResponseHelper.error(res, asignacion.error, 400);
            }
            citaData.profesional_id = asignacion.id;
        }

        const usuarioId = req.user?.id || null;
        const nuevaCita = await CitaModel.crearEstandar(citaData, usuarioId);

        return ResponseHelper.success(res, nuevaCita, 'Cita creada exitosamente', 201);
    });

    static obtener = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const cita = await CitaModel.obtenerPorId(parseInt(id), organizacionId);

        if (!cita) {
            return ResponseHelper.error(res, 'Cita no encontrada', 404);
        }

        return ResponseHelper.success(res, cita, 'Cita obtenida exitosamente');
    });

    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const citaData = req.body;

        const citaActualizada = await CitaModel.actualizarEstandar(parseInt(id), citaData, organizacionId, req.user.id);

        if (!citaActualizada) {
            return ResponseHelper.error(res, 'Cita no encontrada', 404);
        }

        return ResponseHelper.success(res, citaActualizada, 'Cita actualizada exitosamente');
    });

    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const eliminada = await CitaModel.eliminarEstandar(parseInt(id), organizacionId, req.user.id);

        if (!eliminada) {
            return ResponseHelper.error(res, 'Cita no encontrada', 404);
        }

        return ResponseHelper.success(res, null, 'Cita cancelada exitosamente');
    });

    static confirmarAsistencia = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await CitaModel.confirmarAsistenciaEstandar(parseInt(id), organizacionId, req.user.id);

        if (!resultado.exito) {
            return ResponseHelper.error(res, resultado.mensaje || 'No se pudo confirmar asistencia', 400);
        }

        return ResponseHelper.success(res, resultado, 'Asistencia confirmada exitosamente');
    });

    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const orden = req.query.orden || 'fecha_cita';
        const direccion = req.query.direccion || 'DESC';

        const filtros = {
            organizacion_id: organizacionId,
            estado: req.query.estado,
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta,
            cliente_id: req.query.cliente_id ? parseInt(req.query.cliente_id) : null,
            profesional_id: req.query.profesional_id ? parseInt(req.query.profesional_id) : null,
            servicio_id: req.query.servicio_id ? parseInt(req.query.servicio_id) : null,
            // ✅ FEATURE: Citas Recurrentes - filtros
            cita_serie_id: req.query.cita_serie_id,
            es_cita_recurrente: req.query.es_cita_recurrente === 'true' ? true :
                               req.query.es_cita_recurrente === 'false' ? false : undefined,
            busqueda: req.query.busqueda,
            limite: limit,
            offset,
            orden,
            direccion
        };

        const resultado = await CitaModel.listarConFiltros(filtros);

        return ResponseHelper.success(res, {
            citas: resultado.citas,
            meta: {
                total: resultado.total,
                page: page,
                limit: limit,
                total_pages: Math.ceil(resultado.total / limit),
                has_next: page * limit < resultado.total,
                has_prev: page > 1
            }
        }, 'Citas obtenidas exitosamente');
    });

    // =====================================================================
    // CITAS RECURRENTES
    // =====================================================================

    /**
     * Crea una serie de citas recurrentes
     * POST /api/v1/citas/recurrente
     */
    static crearRecurrente = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        let citaData = {
            ...req.body,
            organizacion_id: organizacionId
        };

        // Resolver cliente si se proporciona objeto en lugar de ID
        if (citaData.cliente && !citaData.cliente_id) {
            citaData.cliente_id = await CitaBaseController._resolverCliente(
                citaData.cliente,
                organizacionId,
                'Cliente creado desde agendamiento público (serie recurrente)'
            );
            delete citaData.cliente;
        }

        // Calcular hora_fin si no se proporciona
        const serviciosIds = citaData.servicios_ids || (citaData.servicio_id ? [citaData.servicio_id] : []);
        if (!citaData.hora_fin && citaData.hora_inicio && serviciosIds.length > 0) {
            citaData.hora_fin = await CitaBaseController._calcularHoraFin(
                citaData.hora_inicio,
                serviciosIds,
                organizacionId
            );
        }

        // Asignar profesional automáticamente si no se especificó
        if (!citaData.profesional_id) {
            // Para series recurrentes, usar fecha_inicio como referencia para round-robin
            const fechaReferencia = citaData.fecha_inicio || citaData.patron_recurrencia?.fecha_inicio;

            const asignacion = await CitaBaseController._asignarProfesional({
                serviciosIds,
                fecha: fechaReferencia,
                horaInicio: citaData.hora_inicio,
                horaFin: citaData.hora_fin,
                organizacionId
            });

            if (asignacion.error) {
                return ResponseHelper.error(res, asignacion.error, 400);
            }
            citaData.profesional_id = asignacion.id;
        }

        const usuarioId = req.user?.id || null;
        const resultado = await CitaModel.crearRecurrente(citaData, usuarioId);

        return ResponseHelper.success(res, resultado, 'Serie de citas creada exitosamente', 201);
    });

    /**
     * Obtiene todas las citas de una serie recurrente
     * GET /api/v1/citas/serie/:serieId
     */
    static obtenerSerie = asyncHandler(async (req, res) => {
        const { serieId } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const incluirCanceladas = req.query.incluir_canceladas === 'true';

        const serie = await CitaModel.obtenerSerie(serieId, organizacionId, {
            incluir_canceladas: incluirCanceladas
        });

        if (!serie) {
            return ResponseHelper.error(res, 'Serie de citas no encontrada', 404);
        }

        return ResponseHelper.success(res, serie, 'Serie obtenida exitosamente');
    });

    /**
     * Cancela todas las citas pendientes de una serie
     * POST /api/v1/citas/serie/:serieId/cancelar
     */
    static cancelarSerie = asyncHandler(async (req, res) => {
        const { serieId } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const opciones = {
            motivo_cancelacion: req.body.motivo_cancelacion,
            cancelar_desde_fecha: req.body.cancelar_desde_fecha,
            cancelar_solo_pendientes: req.body.cancelar_solo_pendientes !== false
        };

        const resultado = await CitaModel.cancelarSerie(serieId, organizacionId, opciones, usuarioId);

        return ResponseHelper.success(res, resultado, 'Serie cancelada exitosamente');
    });

    /**
     * Preview de fechas para una serie recurrente (sin crear)
     * POST /api/v1/citas/recurrente/preview
     */
    static previewRecurrencia = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const datos = {
            fecha_inicio: req.body.fecha_inicio,
            hora_inicio: req.body.hora_inicio,
            hora_fin: req.body.hora_fin,
            duracion_minutos: req.body.duracion_minutos,
            profesional_id: req.body.profesional_id,
            patron_recurrencia: req.body.patron_recurrencia
        };

        const preview = await CitaModel.previewRecurrencia(datos, organizacionId);

        return ResponseHelper.success(res, preview, 'Preview de recurrencia generado');
    });
}

module.exports = CitaBaseController;
