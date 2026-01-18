/**
 * @module AjustesMasivosController
 * @description Controlador para gestión de Ajustes Masivos de Inventario
 */

const AjustesMasivosModel = require('../models/ajustes-masivos.model');
const asyncHandler = require('../../../middleware/asyncHandler');
const { ResponseHelper } = require('../../../utils/helpers');

/**
 * Crear ajuste masivo desde items parseados
 * POST /api/v1/inventario/ajustes-masivos
 */
const crear = asyncHandler(async (req, res) => {
    const { archivo_nombre, items } = req.body;
    const usuarioId = req.user.id;
    const organizacionId = req.tenant.organizacionId;
    const sucursalId = req.user.sucursal_id || null;

    const ajuste = await AjustesMasivosModel.crear(
        { archivo_nombre, items },
        usuarioId,
        organizacionId,
        sucursalId
    );

    ResponseHelper.created(res, ajuste, 'Ajuste masivo creado exitosamente');
});

/**
 * Listar ajustes masivos con filtros
 * GET /api/v1/inventario/ajustes-masivos
 */
const listar = asyncHandler(async (req, res) => {
    const params = {
        estado: req.query.estado,
        fecha_desde: req.query.fecha_desde,
        fecha_hasta: req.query.fecha_hasta,
        folio: req.query.folio,
        limit: req.query.limit ? parseInt(req.query.limit) : 20,
        offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    const organizacionId = req.tenant.organizacionId;

    const resultado = await AjustesMasivosModel.listar(params, organizacionId);

    ResponseHelper.success(res, resultado);
});

/**
 * Obtener ajuste masivo por ID
 * GET /api/v1/inventario/ajustes-masivos/:id
 */
const obtenerPorId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizacionId = req.tenant.organizacionId;

    const ajuste = await AjustesMasivosModel.buscarPorId(organizacionId, parseInt(id));

    ResponseHelper.success(res, ajuste);
});

/**
 * Validar items del ajuste masivo
 * POST /api/v1/inventario/ajustes-masivos/:id/validar
 */
const validar = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizacionId = req.tenant.organizacionId;

    const ajuste = await AjustesMasivosModel.validar(parseInt(id), organizacionId);

    ResponseHelper.success(res, ajuste, 'Items validados exitosamente');
});

/**
 * Aplicar ajustes de inventario
 * POST /api/v1/inventario/ajustes-masivos/:id/aplicar
 */
const aplicar = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const usuarioId = req.user.id;
    const organizacionId = req.tenant.organizacionId;

    const resultado = await AjustesMasivosModel.aplicar(
        parseInt(id),
        usuarioId,
        organizacionId
    );

    const mensaje = resultado.errores.length > 0
        ? `Ajustes aplicados parcialmente. ${resultado.aplicados.length} aplicados, ${resultado.errores.length} con errores.`
        : `${resultado.aplicados.length} ajustes aplicados exitosamente`;

    ResponseHelper.success(res, resultado, mensaje);
});

/**
 * Cancelar/eliminar ajuste masivo
 * DELETE /api/v1/inventario/ajustes-masivos/:id
 */
const cancelar = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizacionId = req.tenant.organizacionId;

    await AjustesMasivosModel.cancelar(parseInt(id), organizacionId);

    ResponseHelper.success(res, null, 'Ajuste masivo cancelado exitosamente');
});

/**
 * Descargar plantilla CSV
 * GET /api/v1/inventario/ajustes-masivos/plantilla
 */
const descargarPlantilla = asyncHandler(async (req, res) => {
    const csvContent = `sku,codigo_barras,cantidad_ajuste,motivo
PROD-001,,+10,Entrada por recepción manual
,7501234567890,-5,Salida por merma o daño
SKU-VARIANTE,,+3,Corrección de inventario`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla_ajustes_masivos.csv"');
    res.send(csvContent);
});

module.exports = {
    crear,
    listar,
    obtenerPorId,
    validar,
    aplicar,
    cancelar,
    descargarPlantilla
};
