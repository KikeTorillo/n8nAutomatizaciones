/** Controller de Clientes - Gestión CRUD con aislamiento multi-tenant */

const ClienteModel = require('../database/cliente.model');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');

class ClienteController {

    /** Crear nuevo cliente - POST /api/v1/clientes */
    static async crear(req, res) {
        try {
            const clienteData = {
                ...req.body,
                organizacion_id: req.tenant.organizacionId
            };

            const nuevoCliente = await ClienteModel.crear(clienteData);

            logger.info('Cliente creado', {
                id: nuevoCliente.id,
                org: req.tenant.organizacionId,
                user: req.user.email
            });

            ResponseHelper.success(res, nuevoCliente, 'Cliente creado exitosamente', 201);

        } catch (error) {
            logger.error('Error al crear cliente:', { error: error.message, user: req.user?.email });

            if (error.message.includes('ya está registrado')) {
                return ResponseHelper.error(res, error.message, 409);
            }

            if (error.message.includes('formato') || error.message.includes('válido')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            ResponseHelper.error(res, 'Error interno al crear cliente', 500);
        }
    }

    /** Obtener cliente por ID - GET /api/v1/clientes/:id */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const cliente = await ClienteModel.obtenerPorId(parseInt(id), req.tenant.organizacionId);

            if (!cliente) {
                return ResponseHelper.notFound(res, 'Cliente no encontrado');
            }

            ResponseHelper.success(res, cliente, 'Cliente obtenido exitosamente');

        } catch (error) {
            logger.error('Error al obtener cliente:', { error: error.message, user: req.user?.email });
            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /** Listar clientes con paginación y filtros - GET /api/v1/clientes */
    static async listar(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                busqueda,
                activo,
                marketing_permitido,
                ordenPor,
                orden
            } = req.query;

            const options = {
                organizacionId: req.tenant.organizacionId,
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100),
                busqueda,
                activos: activo !== undefined ? activo === 'true' : undefined,
                marketing: marketing_permitido !== undefined ? marketing_permitido === 'true' : undefined,
                ordenPor,
                orden
            };

            const resultado = await ClienteModel.listar(options);

            ResponseHelper.paginated(
                res,
                resultado.clientes,
                resultado.paginacion,
                'Clientes listados exitosamente'
            );

        } catch (error) {
            logger.error('Error al listar clientes:', { error: error.message, user: req.user?.email });
            ResponseHelper.error(res, 'Error interno al listar clientes', 500);
        }
    }

    /** Actualizar cliente existente - PUT /api/v1/clientes/:id */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const clienteData = req.body;

            const clienteActualizado = await ClienteModel.actualizar(
                parseInt(id),
                clienteData,
                req.tenant.organizacionId
            );

            if (!clienteActualizado) {
                return ResponseHelper.notFound(res, 'Cliente no encontrado');
            }

            logger.info('Cliente actualizado', {
                id: clienteActualizado.id,
                campos: Object.keys(clienteData),
                user: req.user.email
            });

            ResponseHelper.success(res, clienteActualizado, 'Cliente actualizado exitosamente');

        } catch (error) {
            logger.error('Error al actualizar cliente:', { error: error.message, user: req.user?.email });

            if (error.message.includes('ya está registrado')) {
                return ResponseHelper.error(res, error.message, 409);
            }

            if (error.message.includes('formato') || error.message.includes('válido')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            ResponseHelper.error(res, 'Error interno al actualizar cliente', 500);
        }
    }

    /** Eliminar cliente (soft delete) - DELETE /api/v1/clientes/:id */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;
            const eliminado = await ClienteModel.eliminar(parseInt(id), req.tenant.organizacionId);

            if (!eliminado) {
                return ResponseHelper.notFound(res, 'Cliente no encontrado');
            }

            logger.info('Cliente eliminado', { id: parseInt(id), user: req.user.email });
            ResponseHelper.success(res, null, 'Cliente eliminado exitosamente');

        } catch (error) {
            logger.error('Error al eliminar cliente:', { error: error.message, user: req.user?.email });
            ResponseHelper.error(res, 'Error interno al eliminar cliente', 500);
        }
    }

    /** Buscar clientes por término - GET /api/v1/clientes/buscar */
    static async buscar(req, res) {
        try {
            const { q: termino, limit = 10 } = req.query;

            const clientes = await ClienteModel.buscar(
                termino.trim(),
                req.tenant.organizacionId,
                Math.min(parseInt(limit), 50)
            );

            ResponseHelper.success(res, clientes, 'Búsqueda completada exitosamente');

        } catch (error) {
            logger.error('Error al buscar clientes:', { error: error.message, user: req.user?.email });
            ResponseHelper.error(res, 'Error interno en la búsqueda', 500);
        }
    }

    /** Obtener estadísticas de clientes - GET /api/v1/clientes/estadisticas */
    static async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = await ClienteModel.obtenerEstadisticas(req.tenant.organizacionId);
            ResponseHelper.success(res, estadisticas, 'Estadísticas obtenidas exitosamente');

        } catch (error) {
            logger.error('Error al obtener estadísticas:', { error: error.message, user: req.user?.email });
            ResponseHelper.error(res, 'Error interno al obtener estadísticas', 500);
        }
    }

    /** Activar/Desactivar cliente - PATCH /api/v1/clientes/:id/estado */
    static async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { activo } = req.body;

            const clienteActualizado = await ClienteModel.actualizar(
                parseInt(id),
                { activo },
                req.tenant.organizacionId
            );

            if (!clienteActualizado) {
                return ResponseHelper.notFound(res, 'Cliente no encontrado');
            }

            logger.info('Estado cliente cambiado', { id: clienteActualizado.id, activo, user: req.user.email });
            ResponseHelper.success(
                res,
                clienteActualizado,
                `Cliente ${activo ? 'activado' : 'desactivado'} exitosamente`
            );

        } catch (error) {
            logger.error('Error al cambiar estado:', { error: error.message, user: req.user?.email });
            ResponseHelper.error(res, 'Error interno al cambiar estado del cliente', 500);
        }
    }

    /** Buscar cliente por teléfono (CRÍTICO IA) - GET /api/v1/clientes/buscar-telefono */
    static async buscarPorTelefono(req, res) {
        try {
            const { telefono, exacto, incluir_inactivos, crear_si_no_existe } = req.query;

            const resultado = await ClienteModel.buscarPorTelefono(
                telefono,
                req.tenant.organizacionId,
                {
                    exacto: exacto === 'true',
                    incluir_inactivos: incluir_inactivos === 'true',
                    crear_si_no_existe: crear_si_no_existe === 'true'
                }
            );

            ResponseHelper.success(res, resultado, 'Búsqueda por teléfono completada');

        } catch (error) {
            logger.error('Error buscar por teléfono:', { error: error.message, user: req.user?.email });
            ResponseHelper.error(res, 'Error interno en búsqueda por teléfono', 500);
        }
    }

    /** Buscar clientes por nombre (COMPLEMENTARIO IA) - GET /api/v1/clientes/buscar-nombre */
    static async buscarPorNombre(req, res) {
        try {
            const { nombre, limit = 10 } = req.query;

            const clientes = await ClienteModel.buscarPorNombre(
                nombre,
                req.tenant.organizacionId,
                parseInt(limit)
            );

            ResponseHelper.success(res, clientes, 'Búsqueda por nombre completada');

        } catch (error) {
            logger.error('Error buscar por nombre:', { error: error.message, user: req.user?.email });
            ResponseHelper.error(res, 'Error interno en búsqueda por nombre', 500);
        }
    }
}

module.exports = ClienteController;
