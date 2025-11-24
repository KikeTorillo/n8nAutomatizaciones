const { ProveedoresModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

/**
 * Controller para gestión de proveedores
 * CRUD completo con información comercial
 */
class ProveedoresController {

    /**
     * Crear nuevo proveedor
     * POST /api/v1/inventario/proveedores
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const proveedor = await ProveedoresModel.crear(req.body, organizacionId);

        return ResponseHelper.success(
            res,
            proveedor,
            'Proveedor creado exitosamente',
            201
        );
    });

    /**
     * Obtener proveedor por ID
     * GET /api/v1/inventario/proveedores/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const proveedor = await ProveedoresModel.obtenerPorId(parseInt(id), organizacionId);

        if (!proveedor) {
            return ResponseHelper.error(res, 'Proveedor no encontrado', 404);
        }

        return ResponseHelper.success(res, proveedor, 'Proveedor obtenido exitosamente');
    });

    /**
     * Listar proveedores con filtros
     * GET /api/v1/inventario/proveedores
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            activo: req.query.activo !== undefined
                ? (typeof req.query.activo === 'boolean' ? req.query.activo : req.query.activo === 'true')
                : undefined,
            busqueda: req.query.busqueda || undefined,
            ciudad: req.query.ciudad || undefined,
            rfc: req.query.rfc || undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const proveedores = await ProveedoresModel.listar(filtros, organizacionId);

        return ResponseHelper.success(res, proveedores, 'Proveedores obtenidos exitosamente');
    });

    /**
     * Actualizar proveedor
     * PUT /api/v1/inventario/proveedores/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const proveedor = await ProveedoresModel.actualizar(parseInt(id), req.body, organizacionId);

        return ResponseHelper.success(res, proveedor, 'Proveedor actualizado exitosamente');
    });

    /**
     * Eliminar proveedor (soft delete)
     * DELETE /api/v1/inventario/proveedores/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await ProveedoresModel.eliminar(parseInt(id), organizacionId);

        return ResponseHelper.success(res, resultado, 'Proveedor eliminado exitosamente');
    });
}

module.exports = ProveedoresController;
