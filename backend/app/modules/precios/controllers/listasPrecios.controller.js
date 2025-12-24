/**
 * ====================================================================
 * CONTROLLER - LISTAS DE PRECIOS
 * ====================================================================
 *
 * Endpoints para gestión de listas de precios.
 * Módulo: Precios (Fase 5)
 */

const ListasPreciosModel = require('../models/listasPrecios.model');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const logger = require('../../../utils/logger');

class ListasPreciosController {
    // ========================================================================
    // LISTAS DE PRECIOS - CRUD
    // ========================================================================

    /**
     * Listar listas de precios
     * GET /api/v1/listas-precios
     */
    static listar = asyncHandler(async (req, res) => {
        const { soloActivas, moneda } = req.query;
        const organizacionId = req.user.organizacion_id;

        const listas = await ListasPreciosModel.listar(organizacionId, {
            soloActivas: soloActivas !== 'false',
            moneda
        });

        return ResponseHelper.success(res, listas, 'Listas de precios obtenidas');
    });

    /**
     * Obtener lista por ID
     * GET /api/v1/listas-precios/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.user.organizacion_id;

        const lista = await ListasPreciosModel.obtenerPorId(organizacionId, id);

        if (!lista) {
            return ResponseHelper.error(res, 'Lista de precios no encontrada', 404);
        }

        return ResponseHelper.success(res, lista, 'Lista de precios obtenida');
    });

    /**
     * Crear lista de precios
     * POST /api/v1/listas-precios
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.user.organizacion_id;
        const datos = req.body;

        const lista = await ListasPreciosModel.crear(organizacionId, datos);

        logger.info('[ListasPrecios] Lista creada', {
            organizacionId,
            listaId: lista.id,
            usuario: req.user.id
        });

        return ResponseHelper.success(res, lista, 'Lista de precios creada', 201);
    });

    /**
     * Actualizar lista de precios
     * PUT /api/v1/listas-precios/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.user.organizacion_id;
        const datos = req.body;

        const lista = await ListasPreciosModel.actualizar(organizacionId, id, datos);

        if (!lista) {
            return ResponseHelper.error(res, 'Lista de precios no encontrada', 404);
        }

        return ResponseHelper.success(res, lista, 'Lista de precios actualizada');
    });

    /**
     * Eliminar lista de precios
     * DELETE /api/v1/listas-precios/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.user.organizacion_id;
        const usuarioId = req.user.id;

        try {
            const resultado = await ListasPreciosModel.eliminar(organizacionId, id, usuarioId);

            if (!resultado) {
                return ResponseHelper.error(res, 'Lista de precios no encontrada', 404);
            }

            return ResponseHelper.success(res, { id }, 'Lista de precios eliminada');
        } catch (error) {
            if (error.message.includes('lista de precios por defecto')) {
                return ResponseHelper.error(res, error.message, 400);
            }
            throw error;
        }
    });

    // ========================================================================
    // ITEMS DE LISTA
    // ========================================================================

    /**
     * Listar items de una lista
     * GET /api/v1/listas-precios/:id/items
     */
    static listarItems = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.user.organizacion_id;

        const items = await ListasPreciosModel.listarItems(organizacionId, id);

        return ResponseHelper.success(res, items, 'Items de lista obtenidos');
    });

    /**
     * Crear item de lista
     * POST /api/v1/listas-precios/:id/items
     */
    static crearItem = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.user.organizacion_id;
        const datos = req.body;

        const item = await ListasPreciosModel.crearItem(organizacionId, id, datos);

        return ResponseHelper.success(res, item, 'Item de lista creado', 201);
    });

    /**
     * Actualizar item de lista
     * PUT /api/v1/listas-precios/items/:itemId
     */
    static actualizarItem = asyncHandler(async (req, res) => {
        const { itemId } = req.params;
        const organizacionId = req.user.organizacion_id;
        const datos = req.body;

        const item = await ListasPreciosModel.actualizarItem(organizacionId, itemId, datos);

        if (!item) {
            return ResponseHelper.error(res, 'Item no encontrado', 404);
        }

        return ResponseHelper.success(res, item, 'Item de lista actualizado');
    });

    /**
     * Eliminar item de lista
     * DELETE /api/v1/listas-precios/items/:itemId
     */
    static eliminarItem = asyncHandler(async (req, res) => {
        const { itemId } = req.params;
        const organizacionId = req.user.organizacion_id;

        const resultado = await ListasPreciosModel.eliminarItem(organizacionId, itemId);

        if (!resultado) {
            return ResponseHelper.error(res, 'Item no encontrado', 404);
        }

        return ResponseHelper.success(res, { id: itemId }, 'Item eliminado');
    });

    // ========================================================================
    // RESOLUCIÓN DE PRECIOS
    // ========================================================================

    /**
     * Obtener precio de un producto
     * GET /api/v1/listas-precios/precio/:productoId
     */
    static obtenerPrecio = asyncHandler(async (req, res) => {
        const { productoId } = req.params;
        const { clienteId, cantidad, moneda, sucursalId } = req.query;
        const organizacionId = req.user.organizacion_id;

        const precio = await ListasPreciosModel.obtenerPrecioProducto(
            organizacionId,
            productoId,
            {
                clienteId: clienteId ? parseInt(clienteId) : null,
                cantidad: cantidad ? parseInt(cantidad) : 1,
                moneda,
                sucursalId: sucursalId ? parseInt(sucursalId) : null
            }
        );

        if (!precio) {
            return ResponseHelper.error(res, 'Producto no encontrado', 404);
        }

        return ResponseHelper.success(res, precio, 'Precio obtenido');
    });

    /**
     * Obtener precios de carrito
     * POST /api/v1/listas-precios/precios-carrito
     */
    static obtenerPreciosCarrito = asyncHandler(async (req, res) => {
        const { items, clienteId, moneda, sucursalId } = req.body;
        const organizacionId = req.user.organizacion_id;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return ResponseHelper.error(res, 'Se requiere un array de items', 400);
        }

        const precios = await ListasPreciosModel.obtenerPreciosCarrito(
            organizacionId,
            items,
            { clienteId, moneda, sucursalId }
        );

        return ResponseHelper.success(res, precios, 'Precios de carrito obtenidos');
    });

    // ========================================================================
    // ASIGNACIÓN A CLIENTES
    // ========================================================================

    /**
     * Asignar lista a cliente
     * POST /api/v1/listas-precios/:id/asignar-cliente
     */
    static asignarCliente = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { clienteId } = req.body;
        const organizacionId = req.user.organizacion_id;

        if (!clienteId) {
            return ResponseHelper.error(res, 'Se requiere clienteId', 400);
        }

        const resultado = await ListasPreciosModel.asignarACliente(
            organizacionId,
            clienteId,
            id
        );

        if (!resultado) {
            return ResponseHelper.error(res, 'Cliente no encontrado', 404);
        }

        return ResponseHelper.success(res, resultado, 'Lista asignada al cliente');
    });

    /**
     * Asignar lista a múltiples clientes
     * POST /api/v1/listas-precios/:id/asignar-clientes
     */
    static asignarClientesBulk = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { clienteIds } = req.body;
        const organizacionId = req.user.organizacion_id;

        if (!clienteIds || !Array.isArray(clienteIds) || clienteIds.length === 0) {
            return ResponseHelper.error(res, 'Se requiere un array de clienteIds', 400);
        }

        const resultado = await ListasPreciosModel.asignarAClientesBulk(
            organizacionId,
            clienteIds,
            id
        );

        return ResponseHelper.success(
            res,
            { asignados: resultado.length },
            `Lista asignada a ${resultado.length} clientes`
        );
    });

    /**
     * Listar clientes de una lista
     * GET /api/v1/listas-precios/:id/clientes
     */
    static listarClientes = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.user.organizacion_id;

        const clientes = await ListasPreciosModel.listarClientesPorLista(organizacionId, id);

        return ResponseHelper.success(res, clientes, 'Clientes de la lista obtenidos');
    });
}

module.exports = ListasPreciosController;
