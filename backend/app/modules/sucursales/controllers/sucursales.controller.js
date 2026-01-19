const { SucursalesModel, TransferenciasStockModel } = require('../models');
const {
    crearSucursalSchema,
    actualizarSucursalSchema,
    asignarUsuarioSchema,
    asignarProfesionalSchema,
    crearTransferenciaSchema,
    itemTransferenciaSchema,
    recibirTransferenciaSchema
} = require('../schemas/sucursales.schemas');
const { ParseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

/**
 * Controller para gestión de sucursales
 */
class SucursalesController {

    // ========================================
    // SUCURSALES CRUD
    // ========================================

    /**
     * GET /api/v1/sucursales
     * Listar sucursales de la organización
     */
    static async listar(req, res) {
        try {
            const { organizacion_id } = req.user;
            const filtros = ParseHelper.parseFilters(req.query, {
                activo: 'boolean',
                es_matriz: 'boolean',
                ciudad_id: 'int'
            });

            const sucursales = await SucursalesModel.listar(organizacion_id, filtros);

            res.json({
                success: true,
                data: sucursales
            });
        } catch (error) {
            logger.error('[SucursalesController.listar] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al listar sucursales',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v1/sucursales/:id
     * Obtener sucursal por ID
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const { organizacion_id } = req.user;

            const sucursal = await SucursalesModel.buscarPorId(organizacion_id, parseInt(id));

            if (!sucursal) {
                return res.status(404).json({
                    success: false,
                    error: 'Sucursal no encontrada'
                });
            }

            res.json({
                success: true,
                data: sucursal
            });
        } catch (error) {
            logger.error('[SucursalesController.obtenerPorId] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener sucursal',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v1/sucursales
     * Crear nueva sucursal
     */
    static async crear(req, res) {
        try {
            const { organizacion_id } = req.user;

            // Validar datos
            const { error, value } = crearSucursalSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos inválidos',
                    details: error.details.map(d => d.message)
                });
            }

            const sucursal = await SucursalesModel.crear(organizacion_id, value);

            res.status(201).json({
                success: true,
                data: sucursal,
                message: 'Sucursal creada exitosamente'
            });
        } catch (error) {
            logger.error('[SucursalesController.crear] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al crear sucursal',
                message: error.message
            });
        }
    }

    /**
     * PUT /api/v1/sucursales/:id
     * Actualizar sucursal
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { organizacion_id } = req.user;

            // Validar datos
            const { error, value } = actualizarSucursalSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos inválidos',
                    details: error.details.map(d => d.message)
                });
            }

            const sucursal = await SucursalesModel.actualizar(organizacion_id, parseInt(id), value);

            res.json({
                success: true,
                data: sucursal,
                message: 'Sucursal actualizada exitosamente'
            });
        } catch (error) {
            logger.error('[SucursalesController.actualizar] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar sucursal',
                message: error.message
            });
        }
    }

    /**
     * DELETE /api/v1/sucursales/:id
     * Eliminar sucursal (soft delete)
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;
            const { organizacion_id } = req.user;

            await SucursalesModel.eliminar(organizacion_id, parseInt(id));

            res.json({
                success: true,
                message: 'Sucursal eliminada exitosamente'
            });
        } catch (error) {
            logger.error('[SucursalesController.eliminar] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al eliminar sucursal',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v1/sucursales/matriz
     * Obtener sucursal matriz
     */
    static async obtenerMatriz(req, res) {
        try {
            const { organizacion_id } = req.user;

            const sucursal = await SucursalesModel.obtenerMatriz(organizacion_id);

            if (!sucursal) {
                return res.status(404).json({
                    success: false,
                    error: 'Sucursal matriz no encontrada'
                });
            }

            res.json({
                success: true,
                data: sucursal
            });
        } catch (error) {
            logger.error('[SucursalesController.obtenerMatriz] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener sucursal matriz',
                message: error.message
            });
        }
    }

    // ========================================
    // USUARIOS DE SUCURSAL
    // ========================================

    /**
     * GET /api/v1/sucursales/:id/usuarios
     * Obtener usuarios de una sucursal
     */
    static async obtenerUsuarios(req, res) {
        try {
            const { id } = req.params;
            const { organizacion_id } = req.user;

            const usuarios = await SucursalesModel.obtenerUsuarios(parseInt(id), organizacion_id);

            res.json({
                success: true,
                data: usuarios
            });
        } catch (error) {
            logger.error('[SucursalesController.obtenerUsuarios] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener usuarios',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v1/sucursales/:id/usuarios
     * Asignar usuario a sucursal
     */
    static async asignarUsuario(req, res) {
        try {
            const { id } = req.params;
            const { organizacion_id } = req.user;

            // Validar datos
            const { error, value } = asignarUsuarioSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos inválidos',
                    details: error.details.map(d => d.message)
                });
            }

            const asignacion = await SucursalesModel.asignarUsuario(
                parseInt(id),
                value.usuario_id,
                value,
                organizacion_id
            );

            res.status(201).json({
                success: true,
                data: asignacion,
                message: 'Usuario asignado exitosamente'
            });
        } catch (error) {
            logger.error('[SucursalesController.asignarUsuario] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al asignar usuario',
                message: error.message
            });
        }
    }

    // ========================================
    // PROFESIONALES DE SUCURSAL
    // ========================================

    /**
     * GET /api/v1/sucursales/:id/profesionales
     * Obtener profesionales de una sucursal
     */
    static async obtenerProfesionales(req, res) {
        try {
            const { id } = req.params;
            const { organizacion_id } = req.user;

            const profesionales = await SucursalesModel.obtenerProfesionales(parseInt(id), organizacion_id);

            res.json({
                success: true,
                data: profesionales
            });
        } catch (error) {
            logger.error('[SucursalesController.obtenerProfesionales] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener profesionales',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v1/sucursales/:id/profesionales
     * Asignar profesional a sucursal
     */
    static async asignarProfesional(req, res) {
        try {
            const { id } = req.params;
            const { organizacion_id } = req.user;

            // Validar datos
            const { error, value } = asignarProfesionalSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos inválidos',
                    details: error.details.map(d => d.message)
                });
            }

            const asignacion = await SucursalesModel.asignarProfesional(
                parseInt(id),
                value.profesional_id,
                value,
                organizacion_id
            );

            res.status(201).json({
                success: true,
                data: asignacion,
                message: 'Profesional asignado exitosamente'
            });
        } catch (error) {
            logger.error('[SucursalesController.asignarProfesional] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al asignar profesional',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v1/sucursales/usuario/:usuarioId
     * Obtener sucursales de un usuario
     */
    static async obtenerSucursalesUsuario(req, res) {
        try {
            const { usuarioId } = req.params;
            const { organizacion_id } = req.user;

            const sucursales = await SucursalesModel.obtenerSucursalesUsuario(
                parseInt(usuarioId),
                organizacion_id
            );

            res.json({
                success: true,
                data: sucursales
            });
        } catch (error) {
            logger.error('[SucursalesController.obtenerSucursalesUsuario] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener sucursales del usuario',
                message: error.message
            });
        }
    }

    // ========================================
    // TRANSFERENCIAS DE STOCK
    // ========================================

    /**
     * GET /api/v1/sucursales/transferencias
     * Listar transferencias de stock
     */
    static async listarTransferencias(req, res) {
        try {
            const { organizacion_id } = req.user;
            const filtros = ParseHelper.parseFilters(req.query, {
                estado: 'string',
                sucursal_origen_id: 'int',
                sucursal_destino_id: 'int',
                fecha_desde: 'string',
                fecha_hasta: 'string'
            });

            const transferencias = await TransferenciasStockModel.listar(filtros, organizacion_id);

            res.json({
                success: true,
                data: transferencias
            });
        } catch (error) {
            logger.error('[SucursalesController.listarTransferencias] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al listar transferencias',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v1/sucursales/transferencias/:id
     * Obtener transferencia por ID
     */
    static async obtenerTransferencia(req, res) {
        try {
            const { id } = req.params;
            const { organizacion_id } = req.user;

            const transferencia = await TransferenciasStockModel.obtenerPorId(parseInt(id), organizacion_id);

            if (!transferencia) {
                return res.status(404).json({
                    success: false,
                    error: 'Transferencia no encontrada'
                });
            }

            res.json({
                success: true,
                data: transferencia
            });
        } catch (error) {
            logger.error('[SucursalesController.obtenerTransferencia] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener transferencia',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v1/sucursales/transferencias
     * Crear nueva transferencia
     */
    static async crearTransferencia(req, res) {
        try {
            const { organizacion_id, id: usuario_id } = req.user;

            // Validar datos
            const { error, value } = crearTransferenciaSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos inválidos',
                    details: error.details.map(d => d.message)
                });
            }

            const transferencia = await TransferenciasStockModel.crear(value, organizacion_id, usuario_id);

            res.status(201).json({
                success: true,
                data: transferencia,
                message: 'Transferencia creada exitosamente'
            });
        } catch (error) {
            logger.error('[SucursalesController.crearTransferencia] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al crear transferencia',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v1/sucursales/transferencias/:id/items
     * Agregar item a transferencia
     */
    static async agregarItemTransferencia(req, res) {
        try {
            const { id } = req.params;
            const { organizacion_id } = req.user;

            // Validar datos
            const { error, value } = itemTransferenciaSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos inválidos',
                    details: error.details.map(d => d.message)
                });
            }

            const item = await TransferenciasStockModel.agregarItem(parseInt(id), value, organizacion_id);

            res.status(201).json({
                success: true,
                data: item,
                message: 'Item agregado exitosamente'
            });
        } catch (error) {
            logger.error('[SucursalesController.agregarItemTransferencia] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al agregar item',
                message: error.message
            });
        }
    }

    /**
     * DELETE /api/v1/sucursales/transferencias/:id/items/:itemId
     * Eliminar item de transferencia
     */
    static async eliminarItemTransferencia(req, res) {
        try {
            const { id, itemId } = req.params;
            const { organizacion_id } = req.user;

            await TransferenciasStockModel.eliminarItem(parseInt(id), parseInt(itemId), organizacion_id);

            res.json({
                success: true,
                message: 'Item eliminado exitosamente'
            });
        } catch (error) {
            logger.error('[SucursalesController.eliminarItemTransferencia] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al eliminar item',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v1/sucursales/transferencias/:id/enviar
     * Enviar transferencia (borrador -> enviado)
     */
    static async enviarTransferencia(req, res) {
        try {
            const { id } = req.params;
            const { organizacion_id, id: usuario_id } = req.user;

            const transferencia = await TransferenciasStockModel.enviar(parseInt(id), organizacion_id, usuario_id);

            res.json({
                success: true,
                data: transferencia,
                message: 'Transferencia enviada exitosamente'
            });
        } catch (error) {
            logger.error('[SucursalesController.enviarTransferencia] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al enviar transferencia',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v1/sucursales/transferencias/:id/recibir
     * Recibir transferencia (enviado -> recibido)
     */
    static async recibirTransferencia(req, res) {
        try {
            const { id } = req.params;
            const { organizacion_id, id: usuario_id } = req.user;

            // Validar datos opcionales
            const { error, value } = recibirTransferenciaSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos inválidos',
                    details: error.details.map(d => d.message)
                });
            }

            const transferencia = await TransferenciasStockModel.recibir(
                parseInt(id),
                value,
                organizacion_id,
                usuario_id
            );

            res.json({
                success: true,
                data: transferencia,
                message: 'Transferencia recibida exitosamente'
            });
        } catch (error) {
            logger.error('[SucursalesController.recibirTransferencia] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al recibir transferencia',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v1/sucursales/transferencias/:id/cancelar
     * Cancelar transferencia
     */
    static async cancelarTransferencia(req, res) {
        try {
            const { id } = req.params;
            const { organizacion_id, id: usuario_id } = req.user;

            const transferencia = await TransferenciasStockModel.cancelar(parseInt(id), organizacion_id, usuario_id);

            res.json({
                success: true,
                data: transferencia,
                message: 'Transferencia cancelada exitosamente'
            });
        } catch (error) {
            logger.error('[SucursalesController.cancelarTransferencia] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al cancelar transferencia',
                message: error.message
            });
        }
    }

    // ========================================
    // MÉTRICAS Y DASHBOARD
    // ========================================

    /**
     * GET /api/v1/sucursales/metricas
     * Obtener métricas consolidadas para dashboard multi-sucursal
     */
    static async obtenerMetricas(req, res) {
        try {
            const { organizacion_id } = req.user;
            const filtros = ParseHelper.parseFilters(req.query, {
                sucursal_id: 'int',
                fecha_desde: 'string',
                fecha_hasta: 'string'
            });

            const metricas = await SucursalesModel.obtenerMetricas(organizacion_id, filtros);

            res.json({
                success: true,
                data: metricas
            });
        } catch (error) {
            logger.error('[SucursalesController.obtenerMetricas] Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener métricas',
                message: error.message
            });
        }
    }
}

module.exports = SucursalesController;
