/**
 * @fileoverview Controller de Clientes para sistema multi-tenant SaaS
 * @description Gestión de operaciones CRUD para clientes con aislamiento multi-tenant
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

const ClienteModel = require('../database/cliente.model');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');

/**
 * Controller de Clientes
 * Gestión de operaciones CRUD para clientes con aislamiento multi-tenant
 * Incluye manejo de errores, validaciones y logging
 */
class ClienteController {

    /**
     * Crear nuevo cliente
     * POST /api/v1/clientes
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async crear(req, res) {
        try {
            const clienteData = req.body;

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                // Super admin debe especificar organizacion_id en el body
                organizacionId = clienteData.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id en el cuerpo de la petición',
                        400
                    );
                }
            } else {
                // Usuario regular usa su organizacion_id y no puede especificar otra
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }

                // Sobreescribir cualquier organizacion_id que haya en el body
                clienteData.organizacion_id = organizacionId;
            }

            // Ya se asignó organizacionId arriba, no necesario duplicar

            // Validaciones básicas requeridas
            if (!clienteData.nombre || !clienteData.telefono) {
                return ResponseHelper.error(res,
                    'Nombre y teléfono son campos requeridos',
                    400
                );
            }

            // Crear cliente usando el modelo
            const nuevoCliente = await ClienteModel.crear(clienteData);

            logger.info('Cliente creado exitosamente via API', {
                cliente_id: nuevoCliente.id,
                organizacion_id: organizacionId,
                nombre: nuevoCliente.nombre,
                usuario: req.user.email,
                ip: req.ip,
                user_agent: req.get('User-Agent')
            });

            ResponseHelper.success(res, nuevoCliente, 'Cliente creado exitosamente', 201);

        } catch (error) {
            logger.error('Error al crear cliente via API:', {
                error: error.message,
                stack: error.stack,
                body: req.body,
                usuario: req.user?.email,
                ip: req.ip
            });

            // Manejo específico de errores del modelo
            if (error.message.includes('ya está registrado')) {
                return ResponseHelper.error(res, error.message, 409);
            }

            if (error.message.includes('formato') || error.message.includes('válido')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            ResponseHelper.error(res, 'Error interno al crear cliente', 500);
        }
    }

    /**
     * Obtener cliente por ID
     * GET /api/v1/clientes/:id
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;

            // Validar ID
            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de cliente inválido', 400);
            }

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id ? parseInt(req.query.organizacion_id) : null;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            const cliente = await ClienteModel.obtenerPorId(parseInt(id), organizacionId);

            if (!cliente) {
                return ResponseHelper.notFound(res, 'Cliente no encontrado');
            }

            ResponseHelper.success(res, cliente, 'Cliente obtenido exitosamente');

        } catch (error) {
            logger.error('Error al obtener cliente via API:', {
                error: error.message,
                cliente_id: req.params.id,
                organizacion_id: req.user?.organizacion_id,
                usuario: req.user?.email,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Listar clientes con paginación y filtros
     * GET /api/v1/clientes
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async listar(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                busqueda,
                activos,
                marketing,
                ordenPor,
                orden,
                organizacion_id
            } = req.query;

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = organizacion_id ? parseInt(organizacion_id) : null;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            const options = {
                organizacionId,
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100), // Máximo 100 elementos por página
                busqueda,
                activos: activos !== undefined ? activos === 'true' : undefined,
                marketing: marketing !== undefined ? marketing === 'true' : undefined,
                ordenPor,
                orden
            };

            const resultado = await ClienteModel.listar(options);

            ResponseHelper.paginated(res, resultado.clientes, resultado.paginacion, 'Clientes listados exitosamente');

        } catch (error) {
            logger.error('Error al listar clientes via API:', {
                error: error.message,
                query: req.query,
                usuario: req.user?.email
            });

            ResponseHelper.error(res, 'Error interno al listar clientes', 500);
        }
    }

    /**
     * Actualizar cliente existente
     * PUT /api/v1/clientes/:id
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const clienteData = req.body;

            // Validar ID
            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de cliente inválido', 400);
            }

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id ? parseInt(req.query.organizacion_id) : null;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }

                // Usuarios regulares no pueden cambiar organizacion_id
                delete clienteData.organizacion_id;
            }

            const clienteActualizado = await ClienteModel.actualizar(
                parseInt(id),
                clienteData,
                organizacionId
            );

            if (!clienteActualizado) {
                return ResponseHelper.notFound(res, 'Cliente no encontrado');
            }

            logger.info('Cliente actualizado exitosamente via API', {
                cliente_id: clienteActualizado.id,
                organizacion_id: organizacionId,
                cambios: Object.keys(clienteData),
                usuario: req.user.email
            });

            ResponseHelper.success(res, clienteActualizado, 'Cliente actualizado exitosamente');

        } catch (error) {
            logger.error('Error al actualizar cliente via API:', {
                error: error.message,
                cliente_id: req.params.id,
                usuario: req.user?.email
            });

            // Manejo específico de errores del modelo
            if (error.message.includes('ya está registrado')) {
                return ResponseHelper.error(res, error.message, 409);
            }

            if (error.message.includes('formato') || error.message.includes('válido')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            ResponseHelper.error(res, 'Error interno al actualizar cliente', 500);
        }
    }

    /**
     * Eliminar cliente (soft delete)
     * DELETE /api/v1/clientes/:id
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;

            // Validar ID
            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de cliente inválido', 400);
            }

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id ? parseInt(req.query.organizacion_id) : null;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            const eliminado = await ClienteModel.eliminar(parseInt(id), organizacionId);

            if (!eliminado) {
                return ResponseHelper.notFound(res, 'Cliente no encontrado');
            }

            logger.info('Cliente eliminado exitosamente via API', {
                cliente_id: parseInt(id),
                organizacion_id: organizacionId,
                usuario: req.user.email,
                ip: req.ip
            });

            ResponseHelper.success(res, null, 'Cliente eliminado exitosamente');

        } catch (error) {
            logger.error('Error al eliminar cliente via API:', {
                error: error.message,
                cliente_id: req.params.id,
                usuario: req.user?.email
            });

            ResponseHelper.error(res, 'Error interno al eliminar cliente', 500);
        }
    }

    /**
     * Buscar clientes por término
     * GET /api/v1/clientes/buscar
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async buscar(req, res) {
        try {
            const { q: termino, limit = 10, organizacion_id } = req.query;

            if (!termino || termino.trim().length < 2) {
                return ResponseHelper.error(res,
                    'El término de búsqueda debe tener al menos 2 caracteres',
                    400
                );
            }

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = organizacion_id ? parseInt(organizacion_id) : null;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            const clientes = await ClienteModel.buscar(
                termino.trim(),
                organizacionId,
                Math.min(parseInt(limit), 50) // Máximo 50 resultados
            );

            ResponseHelper.success(res, clientes, 'Búsqueda completada exitosamente');

        } catch (error) {
            logger.error('Error al buscar clientes via API:', {
                error: error.message,
                termino: req.query.q,
                usuario: req.user?.email
            });

            ResponseHelper.error(res, 'Error interno en la búsqueda', 500);
        }
    }

    /**
     * Obtener estadísticas de clientes
     * GET /api/v1/clientes/estadisticas
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const { organizacion_id } = req.query;

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = organizacion_id ? parseInt(organizacion_id) : null;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            const estadisticas = await ClienteModel.obtenerEstadisticas(organizacionId);

            ResponseHelper.success(res, estadisticas, 'Estadísticas obtenidas exitosamente');

        } catch (error) {
            logger.error('Error al obtener estadísticas via API:', {
                error: error.message,
                usuario: req.user?.email
            });

            ResponseHelper.error(res, 'Error interno al obtener estadísticas', 500);
        }
    }

    /**
     * Activar/Desactivar cliente
     * PATCH /api/v1/clientes/:id/estado
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { activo } = req.body;

            // Validar ID
            if (!id || isNaN(parseInt(id))) {
                return ResponseHelper.error(res, 'ID de cliente inválido', 400);
            }

            // Determinar organizacion_id según el rol del usuario
            let organizacionId;

            if (req.user.rol === 'super_admin') {
                organizacionId = req.query.organizacion_id ? parseInt(req.query.organizacion_id) : null;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Super admin debe especificar organizacion_id como query parameter',
                        400
                    );
                }
            } else {
                organizacionId = req.user.organizacion_id;

                if (!organizacionId) {
                    return ResponseHelper.error(res,
                        'Usuario no tiene organización asignada',
                        400
                    );
                }
            }

            // Validar parámetro activo
            if (typeof activo !== 'boolean') {
                return ResponseHelper.error(res,
                    'El campo "activo" debe ser un valor booleano',
                    400
                );
            }

            const clienteActualizado = await ClienteModel.actualizar(
                parseInt(id),
                { activo },
                organizacionId
            );

            if (!clienteActualizado) {
                return ResponseHelper.notFound(res, 'Cliente no encontrado');
            }

            logger.info('Estado de cliente cambiado exitosamente via API', {
                cliente_id: clienteActualizado.id,
                nuevo_estado: activo,
                organizacion_id: organizacionId,
                usuario: req.user.email
            });

            ResponseHelper.success(
                res,
                clienteActualizado,
                `Cliente ${activo ? 'activado' : 'desactivado'} exitosamente`
            );

        } catch (error) {
            logger.error('Error al cambiar estado cliente via API:', {
                error: error.message,
                cliente_id: req.params.id,
                usuario: req.user?.email
            });

            ResponseHelper.error(res, 'Error interno al cambiar estado del cliente', 500);
        }
    }
}

module.exports = ClienteController;