const CitaModel = require('../../models/citas');
// Nov 2025: ClienteModel migrado a Core (patrón Odoo/Salesforce)
const ClienteModel = require('../../../core/models/cliente.model');
const { ResponseHelper } = require('../../../../utils/helpers');
const { asyncHandler } = require('../../../../middleware');
const RLSContextManager = require('../../../../utils/rlsContextManager');

class CitaBaseController {

    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        let citaData = {
            ...req.body,
            organizacion_id: organizacionId
        };

        // ✅ FEATURE: Agendamiento público - crear cliente automáticamente si se proporciona objeto
        if (citaData.cliente && !citaData.cliente_id) {
            const clienteInfo = citaData.cliente;

            // Buscar cliente existente por email (prioritario) o teléfono
            let clienteId = null;

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

            // Si no se encontró por email, buscar por teléfono
            if (!clienteId && clienteInfo.telefono) {
                const resultadoBusqueda = await ClienteModel.buscarPorTelefono(
                    clienteInfo.telefono,
                    organizacionId,
                    { exacto: true }
                );

                if (resultadoBusqueda.encontrado) {
                    clienteId = resultadoBusqueda.cliente.id;
                }
            }

            // Si no existe, crear nuevo cliente
            if (!clienteId) {
                const nuevoCliente = await ClienteModel.crear({
                    organizacion_id: organizacionId,
                    nombre: clienteInfo.nombre,
                    apellidos: clienteInfo.apellidos || null,
                    email: clienteInfo.email || null,
                    telefono: clienteInfo.telefono,
                    como_conocio: 'marketplace',
                    notas_especiales: 'Cliente creado desde agendamiento público',
                    activo: true,
                    marketing_permitido: true
                });

                clienteId = nuevoCliente.id;
            }

            // Reemplazar objeto cliente con cliente_id
            citaData.cliente_id = clienteId;
            delete citaData.cliente;
        }

        // ✅ FEATURE: Asignar profesional automáticamente si no se especificó
        if (!citaData.profesional_id) {
            const profesionalAsignado = await RLSContextManager.query(organizacionId, async (db) => {
                const query = 'SELECT id FROM profesionales WHERE organizacion_id = $1 AND activo = true ORDER BY id ASC LIMIT 1';
                const result = await db.query(query, [organizacionId]);
                return result.rows[0];
            });

            if (!profesionalAsignado) {
                return ResponseHelper.error(res, 'No hay profesionales activos disponibles', 400);
            }

            citaData.profesional_id = profesionalAsignado.id;
        }

        // ✅ FEATURE: Calcular hora_fin automáticamente si no se proporciona
        if (!citaData.hora_fin && citaData.hora_inicio) {
            const serviciosIds = citaData.servicios_ids || (citaData.servicio_id ? [citaData.servicio_id] : []);

            if (serviciosIds.length > 0) {
                // Obtener duración total de los servicios
                const duracionTotal = await RLSContextManager.query(organizacionId, async (db) => {
                    const query = 'SELECT SUM(duracion_minutos) as duracion_total FROM servicios WHERE organizacion_id = $1 AND id = ANY($2)';
                    const result = await db.query(query, [organizacionId, serviciosIds]);
                    return result.rows[0]?.duracion_total || 60; // Default 60 min si no se encuentra
                });

                // Calcular hora_fin sumando la duración a hora_inicio
                const [horas, minutos] = citaData.hora_inicio.split(':').map(Number);
                const horaInicioDate = new Date(2000, 0, 1, horas, minutos);
                horaInicioDate.setMinutes(horaInicioDate.getMinutes() + parseInt(duracionTotal));

                const horaFin = `${String(horaInicioDate.getHours()).padStart(2, '0')}:${String(horaInicioDate.getMinutes()).padStart(2, '0')}`;
                citaData.hora_fin = horaFin;
            }
        }

        // ✅ FEATURE: Agendamiento público - req.user puede ser undefined
        // Si no hay usuario autenticado, usar null (creado por sistema/marketplace)
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
}

module.exports = CitaBaseController;
