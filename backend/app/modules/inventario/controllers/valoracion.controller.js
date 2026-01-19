const ValoracionModel = require('../models/valoracion.model');
const asyncHandler = require('../../../middleware/asyncHandler');
const { ErrorHelper, ParseHelper } = require('../../../utils/helpers');

/**
 * Controller para valoracion de inventario FIFO/AVCO
 * Endpoints para reportes contables de valoracion
 * @since Dic 2025 - Gap Valoracion FIFO/AVCO
 * @refactored Ene 2026 - Migracion a asyncHandler + ErrorHelper
 */
const ValoracionController = {

    // =========================================================================
    // CONFIGURACION
    // =========================================================================

    /**
     * GET /valoracion/configuracion
     * Obtener configuracion de valoracion de la organizacion
     */
    obtenerConfiguracion: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;

        const configuracion = await ValoracionModel.obtenerConfiguracion(organizacion_id);

        res.json({
            success: true,
            data: configuracion
        });
    }),

    /**
     * PUT /valoracion/configuracion
     * Actualizar configuracion de valoracion
     */
    actualizarConfiguracion: asyncHandler(async (req, res) => {
        const { organizacion_id, id: usuarioId } = req.user;
        const { metodo_valoracion, incluir_gastos_envio, redondeo_decimales } = req.body;

        // Validar metodo
        if (metodo_valoracion && !['fifo', 'avco', 'promedio'].includes(metodo_valoracion)) {
            ErrorHelper.throwValidation('Metodo de valoracion invalido. Use: fifo, avco o promedio');
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
    }),

    // =========================================================================
    // VALORACION POR PRODUCTO
    // =========================================================================

    /**
     * GET /valoracion/producto/:id
     * Obtener valoracion de un producto con todos los metodos
     */
    valorProducto: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { id } = req.params;

        const valoracion = await ValoracionModel.valorProducto(parseInt(id), organizacion_id);

        ErrorHelper.throwIfNotFound(valoracion, 'Producto');

        res.json({
            success: true,
            data: valoracion
        });
    }),

    /**
     * GET /valoracion/producto/:id/fifo
     * Obtener valoracion FIFO de un producto
     */
    valorFIFO: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { id } = req.params;
        const sucursal_id = ParseHelper.parseId(req.query.sucursal_id);

        const valoracion = await ValoracionModel.calcularFIFO(
            parseInt(id),
            organizacion_id,
            sucursal_id
        );

        res.json({
            success: true,
            data: valoracion
        });
    }),

    /**
     * GET /valoracion/producto/:id/avco
     * Obtener valoracion AVCO de un producto
     */
    valorAVCO: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { id } = req.params;
        const sucursal_id = ParseHelper.parseId(req.query.sucursal_id);

        const valoracion = await ValoracionModel.calcularAVCO(
            parseInt(id),
            organizacion_id,
            sucursal_id
        );

        res.json({
            success: true,
            data: valoracion
        });
    }),

    /**
     * GET /valoracion/producto/:id/capas
     * Obtener capas de inventario FIFO detalladas
     */
    capasProducto: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { id } = req.params;

        const capas = await ValoracionModel.obtenerCapasFIFO(parseInt(id), organizacion_id);

        res.json({
            success: true,
            data: capas
        });
    }),

    // =========================================================================
    // VALORACION TOTAL
    // =========================================================================

    /**
     * GET /valoracion/total
     * Calcular valor total del inventario
     */
    valorTotal: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const { metodo } = req.query;
        const categoria_id = ParseHelper.parseId(req.query.categoria_id);
        const sucursal_id = ParseHelper.parseId(req.query.sucursal_id);

        const valoracion = await ValoracionModel.calcularValorTotal(
            organizacion_id,
            metodo || null,
            categoria_id,
            sucursal_id
        );

        res.json({
            success: true,
            data: valoracion
        });
    }),

    /**
     * GET /valoracion/comparativa
     * Comparar todos los metodos de valoracion
     */
    comparativa: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const producto_id = ParseHelper.parseId(req.query.producto_id);

        const comparativa = await ValoracionModel.compararMetodos(
            organizacion_id,
            producto_id
        );

        res.json({
            success: true,
            data: comparativa
        });
    }),

    /**
     * GET /valoracion/resumen
     * Resumen de valoracion para dashboard
     */
    resumen: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;

        const resumen = await ValoracionModel.resumenValoracion(organizacion_id);

        res.json({
            success: true,
            data: resumen
        });
    }),

    // =========================================================================
    // REPORTES
    // =========================================================================

    /**
     * GET /valoracion/reporte/categorias
     * Reporte de valoracion por categorias
     */
    reportePorCategorias: asyncHandler(async (req, res) => {
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
    }),

    /**
     * GET /valoracion/reporte/diferencias
     * Productos con mayor diferencia entre metodos
     */
    reporteDiferencias: asyncHandler(async (req, res) => {
        const { organizacion_id } = req.user;
        const limite = ParseHelper.parseInt(req.query.limite, 10);

        const reporte = await ValoracionModel.productosConMayorDiferencia(
            organizacion_id,
            limite
        );

        res.json({
            success: true,
            data: reporte
        });
    })
};

module.exports = ValoracionController;
