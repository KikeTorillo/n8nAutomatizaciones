const { CategoriasProductosModel } = require('../../models/inventario');
const { ResponseHelper } = require('../../../../utils/helpers');
const { asyncHandler } = require('../../../../middleware');

/**
 * Controller para gestión de categorías de productos
 * CRUD completo con soporte para jerarquías
 */
class CategoriasProductosController {

    /**
     * Crear nueva categoría
     * POST /api/v1/inventario/categorias
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const categoria = await CategoriasProductosModel.crear(req.body, organizacionId);

        return ResponseHelper.success(
            res,
            categoria,
            'Categoría creada exitosamente',
            201
        );
    });

    /**
     * Obtener categoría por ID
     * GET /api/v1/inventario/categorias/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const categoria = await CategoriasProductosModel.obtenerPorId(parseInt(id), organizacionId);

        if (!categoria) {
            return ResponseHelper.error(res, 'Categoría no encontrada', 404);
        }

        return ResponseHelper.success(res, categoria, 'Categoría obtenida exitosamente');
    });

    /**
     * Listar categorías con filtros
     * GET /api/v1/inventario/categorias
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            activo: req.query.activo !== undefined
                ? (typeof req.query.activo === 'boolean' ? req.query.activo : req.query.activo === 'true')
                : undefined,
            categoria_padre_id: req.query.categoria_padre_id === 'null'
                ? null
                : req.query.categoria_padre_id
                    ? parseInt(req.query.categoria_padre_id)
                    : undefined,
            busqueda: req.query.busqueda || undefined
        };

        const categorias = await CategoriasProductosModel.listar(filtros, organizacionId);

        return ResponseHelper.success(res, categorias, 'Categorías obtenidas exitosamente');
    });

    /**
     * Obtener árbol jerárquico de categorías
     * GET /api/v1/inventario/categorias/arbol
     */
    static obtenerArbol = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const arbol = await CategoriasProductosModel.obtenerArbol(organizacionId);

        return ResponseHelper.success(res, arbol, 'Árbol de categorías obtenido exitosamente');
    });

    /**
     * Actualizar categoría
     * PUT /api/v1/inventario/categorias/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const categoria = await CategoriasProductosModel.actualizar(parseInt(id), req.body, organizacionId);

        return ResponseHelper.success(res, categoria, 'Categoría actualizada exitosamente');
    });

    /**
     * Eliminar categoría (soft delete)
     * DELETE /api/v1/inventario/categorias/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await CategoriasProductosModel.eliminar(parseInt(id), organizacionId);

        return ResponseHelper.success(res, resultado, 'Categoría eliminada exitosamente');
    });
}

module.exports = CategoriasProductosController;
