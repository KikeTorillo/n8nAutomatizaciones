/**
 * ====================================================================
 * CONTROLLER - COMBOS Y MODIFICADORES
 * ====================================================================
 *
 * Controller para gestión de combos/kits y modificadores de productos
 *
 * Migrado desde POS a Inventario - Ene 2026
 * ====================================================================
 */

const CombosModel = require('../models/combos.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');

class CombosController {

    // ========================================================================
    // COMBOS / KITS
    // ========================================================================

    /**
     * Verificar si un producto es combo
     * GET /api/v1/inventario/combos/verificar/:productoId
     */
    static verificarCombo = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const esCombo = await CombosModel.esCombo(parseInt(productoId), organizacionId);

        return ResponseHelper.success(res, { es_combo: esCombo });
    });

    /**
     * Obtener combo por producto ID
     * GET /api/v1/inventario/combos/:productoId
     */
    static obtenerCombo = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const combo = await CombosModel.obtenerCombo(parseInt(productoId), organizacionId);

        if (!combo) {
            return ResponseHelper.notFound(res, 'Combo no encontrado');
        }

        return ResponseHelper.success(res, combo);
    });

    /**
     * Listar combos
     * GET /api/v1/inventario/combos
     */
    static listarCombos = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { limit = 50, offset = 0, busqueda, activo } = req.query;

        const resultado = await CombosModel.listarCombos({
            limit: Math.min(parseInt(limit), 100),
            offset: parseInt(offset),
            busqueda,
            activo: activo === 'true' ? true : activo === 'false' ? false : undefined
        }, organizacionId);

        return ResponseHelper.paginated(
            res,
            resultado.data,
            resultado.total,
            Math.ceil(resultado.total / resultado.limit),
            Math.floor(resultado.offset / resultado.limit) + 1,
            'Combos obtenidos exitosamente'
        );
    });

    /**
     * Crear combo
     * POST /api/v1/inventario/combos
     */
    static crearCombo = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const combo = await CombosModel.crearCombo(req.body, organizacionId);

        return ResponseHelper.success(res, combo, 'Combo creado exitosamente', 201);
    });

    /**
     * Actualizar combo
     * PUT /api/v1/inventario/combos/:productoId
     */
    static actualizarCombo = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const combo = await CombosModel.actualizarCombo(
            parseInt(productoId),
            req.body,
            organizacionId
        );

        if (!combo) {
            return ResponseHelper.notFound(res, 'Combo no encontrado');
        }

        return ResponseHelper.success(res, combo, 'Combo actualizado exitosamente');
    });

    /**
     * Eliminar combo
     * DELETE /api/v1/inventario/combos/:productoId
     */
    static eliminarCombo = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const combo = await CombosModel.eliminarCombo(parseInt(productoId), organizacionId);

        if (!combo) {
            return ResponseHelper.notFound(res, 'Combo no encontrado');
        }

        return ResponseHelper.success(res, combo, 'Combo eliminado exitosamente');
    });

    /**
     * Calcular precio de combo
     * GET /api/v1/inventario/combos/:productoId/precio
     */
    static calcularPrecio = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const precio = await CombosModel.calcularPrecio(parseInt(productoId), organizacionId);

        return ResponseHelper.success(res, { precio });
    });

    /**
     * Verificar stock de componentes
     * GET /api/v1/inventario/combos/:productoId/stock
     */
    static verificarStock = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const { cantidad = 1 } = req.query;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await CombosModel.verificarStock(
            parseInt(productoId),
            parseInt(cantidad),
            organizacionId
        );

        return ResponseHelper.success(res, resultado);
    });

    // ========================================================================
    // GRUPOS DE MODIFICADORES
    // ========================================================================

    /**
     * Listar grupos de modificadores
     * GET /api/v1/inventario/modificadores/grupos
     */
    static listarGrupos = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { activo, incluir_modificadores } = req.query;

        const grupos = await CombosModel.listarGrupos({
            activo: activo === 'true' ? true : activo === 'false' ? false : undefined,
            incluirModificadores: incluir_modificadores !== 'false'
        }, organizacionId);

        return ResponseHelper.success(res, grupos, 'Grupos obtenidos exitosamente');
    });

    /**
     * Crear grupo de modificadores
     * POST /api/v1/inventario/modificadores/grupos
     */
    static crearGrupo = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const grupo = await CombosModel.crearGrupo(req.body, organizacionId);

        return ResponseHelper.success(res, grupo, 'Grupo creado exitosamente', 201);
    });

    /**
     * Actualizar grupo de modificadores
     * PUT /api/v1/inventario/modificadores/grupos/:id
     */
    static actualizarGrupo = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const grupo = await CombosModel.actualizarGrupo(
            parseInt(id),
            req.body,
            organizacionId
        );

        if (!grupo) {
            return ResponseHelper.notFound(res, 'Grupo no encontrado');
        }

        return ResponseHelper.success(res, grupo, 'Grupo actualizado exitosamente');
    });

    /**
     * Eliminar grupo de modificadores
     * DELETE /api/v1/inventario/modificadores/grupos/:id
     */
    static eliminarGrupo = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        try {
            const grupo = await CombosModel.eliminarGrupo(parseInt(id), organizacionId);

            if (!grupo) {
                return ResponseHelper.notFound(res, 'Grupo no encontrado');
            }

            return ResponseHelper.success(res, grupo, 'Grupo eliminado exitosamente');
        } catch (error) {
            if (error.message.includes('asignaciones')) {
                return ResponseHelper.badRequest(res, error.message);
            }
            throw error;
        }
    });

    // ========================================================================
    // MODIFICADORES
    // ========================================================================

    /**
     * Crear modificador
     * POST /api/v1/inventario/modificadores
     */
    static crearModificador = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const modificador = await CombosModel.crearModificador(req.body, organizacionId);

        return ResponseHelper.success(res, modificador, 'Modificador creado exitosamente', 201);
    });

    /**
     * Actualizar modificador
     * PUT /api/v1/inventario/modificadores/:id
     */
    static actualizarModificador = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const modificador = await CombosModel.actualizarModificador(
            parseInt(id),
            req.body,
            organizacionId
        );

        if (!modificador) {
            return ResponseHelper.notFound(res, 'Modificador no encontrado');
        }

        return ResponseHelper.success(res, modificador, 'Modificador actualizado exitosamente');
    });

    /**
     * Eliminar modificador
     * DELETE /api/v1/inventario/modificadores/:id
     */
    static eliminarModificador = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const modificador = await CombosModel.eliminarModificador(parseInt(id), organizacionId);

        if (!modificador) {
            return ResponseHelper.notFound(res, 'Modificador no encontrado');
        }

        return ResponseHelper.success(res, modificador, 'Modificador eliminado exitosamente');
    });

    // ========================================================================
    // ASIGNACIONES DE MODIFICADORES A PRODUCTOS
    // ========================================================================

    /**
     * Obtener modificadores de un producto
     * GET /api/v1/inventario/productos/:productoId/modificadores
     */
    static obtenerModificadoresProducto = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const modificadores = await CombosModel.obtenerModificadoresProducto(
            parseInt(productoId),
            organizacionId
        );

        return ResponseHelper.success(res, modificadores);
    });

    /**
     * Verificar si un producto tiene modificadores
     * GET /api/v1/inventario/productos/:productoId/tiene-modificadores
     */
    static tieneModificadores = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const tiene = await CombosModel.tieneModificadores(
            parseInt(productoId),
            organizacionId
        );

        return ResponseHelper.success(res, { tiene_modificadores: tiene });
    });

    /**
     * Asignar grupo a producto
     * POST /api/v1/inventario/productos/:productoId/grupos
     */
    static asignarGrupoAProducto = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const asignacion = await CombosModel.asignarGrupoAProducto({
            producto_id: parseInt(productoId),
            ...req.body
        }, organizacionId);

        return ResponseHelper.success(res, asignacion, 'Grupo asignado exitosamente', 201);
    });

    /**
     * Asignar grupo a categoría
     * POST /api/v1/inventario/categorias/:categoriaId/grupos
     */
    static asignarGrupoACategoria = asyncHandler(async (req, res) => {
        const { categoriaId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const asignacion = await CombosModel.asignarGrupoACategoria({
            categoria_id: parseInt(categoriaId),
            ...req.body
        }, organizacionId);

        return ResponseHelper.success(res, asignacion, 'Grupo asignado exitosamente', 201);
    });

    /**
     * Eliminar asignación de grupo a producto
     * DELETE /api/v1/inventario/productos/:productoId/grupos/:grupoId
     */
    static eliminarAsignacionProducto = asyncHandler(async (req, res) => {
        const { productoId, grupoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await CombosModel.eliminarAsignacionProducto(
            parseInt(productoId),
            parseInt(grupoId),
            organizacionId
        );

        if (!resultado) {
            return ResponseHelper.notFound(res, 'Asignación no encontrada');
        }

        return ResponseHelper.success(res, resultado, 'Asignación eliminada exitosamente');
    });

    /**
     * Listar asignaciones de un producto
     * GET /api/v1/inventario/productos/:productoId/grupos
     */
    static listarAsignacionesProducto = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const asignaciones = await CombosModel.listarAsignacionesProducto(
            parseInt(productoId),
            organizacionId
        );

        return ResponseHelper.success(res, asignaciones);
    });
}

module.exports = CombosController;
