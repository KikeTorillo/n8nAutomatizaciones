const ValoracionModel = require('../models/valoracion.model');
const logger = require('../../../utils/logger');

/**
 * Controller para valoracion de inventario FIFO/AVCO
 * Endpoints para reportes contables de valoracion
 * @since Dic 2025 - Gap Valoracion FIFO/AVCO
 */
const ValoracionController = {

    // =========================================================================
    // CONFIGURACION
    // =========================================================================

    /**
     * GET /valoracion/configuracion
     * Obtener configuracion de valoracion de la organizacion
     */
    obtenerConfiguracion: async (req, res) => {
        try {
            const { organizacion_id } = req.user;

            const configuracion = await ValoracionModel.obtenerConfiguracion(organizacion_id);

            res.json({
                success: true,
                data: configuracion
            });
        } catch (error) {
            logger.error('[ValoracionController.obtenerConfiguracion] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener configuracion de valoracion',
                error: error.message
            });
        }
    },

    /**
     * PUT /valoracion/configuracion
     * Actualizar configuracion de valoracion
     */
    actualizarConfiguracion: async (req, res) => {
        try {
            const { organizacion_id, id: usuarioId } = req.user;
            const { metodo_valoracion, incluir_gastos_envio, redondeo_decimales } = req.body;

            // Validar metodo
            if (metodo_valoracion && !['fifo', 'avco', 'promedio'].includes(metodo_valoracion)) {
                return res.status(400).json({
                    success: false,
                    message: 'Metodo de valoracion invalido. Use: fifo, avco o promedio'
                });
            }

            const configuracion = await ValoracionModel.actualizarConfiguracion(
                organizacion_id,
                { metodo_valoracion, incluir_gastos_envio, redondeo_decimales },
                usuarioId
            );

            res.json({
                success: true,
                message: 'Configuracion actualizada correctamente',
                data: configuracion
            });
        } catch (error) {
            logger.error('[ValoracionController.actualizarConfiguracion] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar configuracion',
                error: error.message
            });
        }
    },

    // =========================================================================
    // VALORACION POR PRODUCTO
    // =========================================================================

    /**
     * GET /valoracion/producto/:id
     * Obtener valoracion de un producto con todos los metodos
     */
    valorProducto: async (req, res) => {
        try {
            const { organizacion_id } = req.user;
            const { id } = req.params;

            const valoracion = await ValoracionModel.valorProducto(parseInt(id), organizacion_id);

            if (!valoracion) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            res.json({
                success: true,
                data: valoracion
            });
        } catch (error) {
            logger.error('[ValoracionController.valorProducto] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error al calcular valoracion del producto',
                error: error.message
            });
        }
    },

    /**
     * GET /valoracion/producto/:id/fifo
     * Obtener valoracion FIFO de un producto
     */
    valorFIFO: async (req, res) => {
        try {
            const { organizacion_id } = req.user;
            const { id } = req.params;
            const { sucursal_id } = req.query;

            const valoracion = await ValoracionModel.calcularFIFO(
                parseInt(id),
                organizacion_id,
                sucursal_id ? parseInt(sucursal_id) : null
            );

            res.json({
                success: true,
                data: valoracion
            });
        } catch (error) {
            logger.error('[ValoracionController.valorFIFO] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error al calcular FIFO',
                error: error.message
            });
        }
    },

    /**
     * GET /valoracion/producto/:id/avco
     * Obtener valoracion AVCO de un producto
     */
    valorAVCO: async (req, res) => {
        try {
            const { organizacion_id } = req.user;
            const { id } = req.params;
            const { sucursal_id } = req.query;

            const valoracion = await ValoracionModel.calcularAVCO(
                parseInt(id),
                organizacion_id,
                sucursal_id ? parseInt(sucursal_id) : null
            );

            res.json({
                success: true,
                data: valoracion
            });
        } catch (error) {
            logger.error('[ValoracionController.valorAVCO] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error al calcular AVCO',
                error: error.message
            });
        }
    },

    /**
     * GET /valoracion/producto/:id/capas
     * Obtener capas de inventario FIFO detalladas
     */
    capasProducto: async (req, res) => {
        try {
            const { organizacion_id } = req.user;
            const { id } = req.params;

            const capas = await ValoracionModel.obtenerCapasFIFO(parseInt(id), organizacion_id);

            res.json({
                success: true,
                data: capas
            });
        } catch (error) {
            logger.error('[ValoracionController.capasProducto] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener capas de inventario',
                error: error.message
            });
        }
    },

    // =========================================================================
    // VALORACION TOTAL
    // =========================================================================

    /**
     * GET /valoracion/total
     * Calcular valor total del inventario
     */
    valorTotal: async (req, res) => {
        try {
            const { organizacion_id } = req.user;
            const { metodo, categoria_id, sucursal_id } = req.query;

            const valoracion = await ValoracionModel.calcularValorTotal(
                organizacion_id,
                metodo || null,
                categoria_id ? parseInt(categoria_id) : null,
                sucursal_id ? parseInt(sucursal_id) : null
            );

            res.json({
                success: true,
                data: valoracion
            });
        } catch (error) {
            logger.error('[ValoracionController.valorTotal] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error al calcular valor total',
                error: error.message
            });
        }
    },

    /**
     * GET /valoracion/comparativa
     * Comparar todos los metodos de valoracion
     */
    comparativa: async (req, res) => {
        try {
            const { organizacion_id } = req.user;
            const { producto_id } = req.query;

            const comparativa = await ValoracionModel.compararMetodos(
                organizacion_id,
                producto_id ? parseInt(producto_id) : null
            );

            res.json({
                success: true,
                data: comparativa
            });
        } catch (error) {
            logger.error('[ValoracionController.comparativa] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar comparativa',
                error: error.message
            });
        }
    },

    /**
     * GET /valoracion/resumen
     * Resumen de valoracion para dashboard
     */
    resumen: async (req, res) => {
        try {
            const { organizacion_id } = req.user;

            const resumen = await ValoracionModel.resumenValoracion(organizacion_id);

            res.json({
                success: true,
                data: resumen
            });
        } catch (error) {
            logger.error('[ValoracionController.resumen] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener resumen',
                error: error.message
            });
        }
    },

    // =========================================================================
    // REPORTES
    // =========================================================================

    /**
     * GET /valoracion/reporte/categorias
     * Reporte de valoracion por categorias
     */
    reportePorCategorias: async (req, res) => {
        try {
            const { organizacion_id } = req.user;
            const { metodo } = req.query;

            const reporte = await ValoracionModel.reportePorCategoria(
                organizacion_id,
                metodo || null
            );

            res.json({
                success: true,
                data: reporte
            });
        } catch (error) {
            logger.error('[ValoracionController.reportePorCategorias] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar reporte por categorias',
                error: error.message
            });
        }
    },

    /**
     * GET /valoracion/reporte/diferencias
     * Productos con mayor diferencia entre metodos
     */
    reporteDiferencias: async (req, res) => {
        try {
            const { organizacion_id } = req.user;
            const { limite } = req.query;

            const reporte = await ValoracionModel.productosConMayorDiferencia(
                organizacion_id,
                limite ? parseInt(limite) : 10
            );

            res.json({
                success: true,
                data: reporte
            });
        } catch (error) {
            logger.error('[ValoracionController.reporteDiferencias] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar reporte de diferencias',
                error: error.message
            });
        }
    }
};

module.exports = ValoracionController;
