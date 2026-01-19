const { AsientosModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

/**
 * Controller para gestión de asientos contables (libro diario)
 *
 * NO MIGRADO a BaseCrudController - Ene 2026
 * Razones:
 * - Tabla particionada por fecha: requiere param `fecha` en obtenerPorId, actualizar, eliminar
 * - Métodos custom esenciales: publicar(), anular()
 * - Firma del modelo incompatible: listar(filtros, orgId) vs listar(orgId, filtros)
 */
class AsientosController {

    /**
     * Listar asientos con filtros
     * GET /api/v1/contabilidad/asientos
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            estado: req.query.estado || undefined,
            tipo: req.query.tipo || undefined,
            periodo_id: req.query.periodo_id ? parseInt(req.query.periodo_id) : undefined,
            fecha_desde: req.query.fecha_desde || undefined,
            fecha_hasta: req.query.fecha_hasta || undefined,
            busqueda: req.query.busqueda || undefined,
            pagina: req.query.pagina ? parseInt(req.query.pagina) : 1,
            limite: req.query.limite ? parseInt(req.query.limite) : 20
        };

        const resultado = await AsientosModel.listar(filtros, organizacionId);

        return ResponseHelper.success(res, resultado, 'Asientos obtenidos exitosamente');
    });

    /**
     * Obtener asiento por ID con movimientos
     * GET /api/v1/contabilidad/asientos/:id
     *
     * Query params:
     * - fecha: YYYY-MM-DD (requerido para tabla particionada)
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { fecha } = req.query;
        const organizacionId = req.tenant.organizacionId;

        if (!fecha) {
            return ResponseHelper.badRequest(res, 'Se requiere el parámetro fecha');
        }

        const asiento = await AsientosModel.obtenerPorId(parseInt(id), fecha, organizacionId);

        if (!asiento) {
            return ResponseHelper.notFound(res, 'Asiento no encontrado');
        }

        return ResponseHelper.success(res, asiento);
    });

    /**
     * Crear nuevo asiento contable
     * POST /api/v1/contabilidad/asientos
     *
     * Body:
     * {
     *   fecha: "YYYY-MM-DD",
     *   concepto: "Descripción del asiento",
     *   tipo: "manual|venta_pos|compra|...",
     *   notas: "Notas opcionales",
     *   estado: "borrador|publicado",
     *   movimientos: [
     *     { cuenta_id: 1, debe: 1000, haber: 0, concepto: "..." },
     *     { cuenta_id: 2, debe: 0, haber: 1000, concepto: "..." }
     *   ]
     * }
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const asiento = await AsientosModel.crear(req.body, organizacionId, usuarioId);

        return ResponseHelper.created(res, asiento, 'Asiento creado exitosamente');
    });

    /**
     * Actualizar asiento (solo en borrador)
     * PUT /api/v1/contabilidad/asientos/:id
     *
     * Query params:
     * - fecha: YYYY-MM-DD (requerido)
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { fecha } = req.query;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        if (!fecha) {
            return ResponseHelper.badRequest(res, 'Se requiere el parámetro fecha');
        }

        const asiento = await AsientosModel.actualizar(parseInt(id), fecha, req.body, organizacionId, usuarioId);

        return ResponseHelper.success(res, asiento, 'Asiento actualizado exitosamente');
    });

    /**
     * Publicar asiento (cambiar de borrador a publicado)
     * POST /api/v1/contabilidad/asientos/:id/publicar
     *
     * Query params:
     * - fecha: YYYY-MM-DD (requerido)
     */
    static publicar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { fecha } = req.query;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        if (!fecha) {
            return ResponseHelper.badRequest(res, 'Se requiere el parámetro fecha');
        }

        const asiento = await AsientosModel.publicar(parseInt(id), fecha, organizacionId, usuarioId);

        return ResponseHelper.success(res, asiento, 'Asiento publicado exitosamente');
    });

    /**
     * Anular asiento publicado
     * POST /api/v1/contabilidad/asientos/:id/anular
     *
     * Query params:
     * - fecha: YYYY-MM-DD (requerido)
     *
     * Body:
     * - motivo: "Razón de la anulación"
     */
    static anular = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { fecha } = req.query;
        const { motivo } = req.body;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        if (!fecha) {
            return ResponseHelper.badRequest(res, 'Se requiere el parámetro fecha');
        }

        if (!motivo) {
            return ResponseHelper.badRequest(res, 'Se requiere el motivo de anulación');
        }

        const asiento = await AsientosModel.anular(parseInt(id), fecha, motivo, organizacionId, usuarioId);

        return ResponseHelper.success(res, asiento, 'Asiento anulado exitosamente');
    });

    /**
     * Eliminar asiento en borrador
     * DELETE /api/v1/contabilidad/asientos/:id
     *
     * Query params:
     * - fecha: YYYY-MM-DD (requerido)
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { fecha } = req.query;
        const organizacionId = req.tenant.organizacionId;

        if (!fecha) {
            return ResponseHelper.badRequest(res, 'Se requiere el parámetro fecha');
        }

        const resultado = await AsientosModel.eliminar(parseInt(id), fecha, organizacionId);

        return ResponseHelper.success(res, resultado);
    });
}

module.exports = AsientosController;
