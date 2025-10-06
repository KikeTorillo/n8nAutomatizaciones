/** Controller de Clientes - Gestión CRUD con aislamiento multi-tenant */

const ClienteModel = require('../database/cliente.model');
const { ResponseHelper } = require('../utils/helpers');
const asyncHandler = require('../middleware/asyncHandler');

class ClienteController {

    static crear = asyncHandler(async (req, res) => {
        const clienteData = {
            ...req.body,
            organizacion_id: req.tenant.organizacionId
        };

        const nuevoCliente = await ClienteModel.crear(clienteData);

        return ResponseHelper.success(res, nuevoCliente, 'Cliente creado exitosamente', 201);
    });

    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const cliente = await ClienteModel.obtenerPorId(parseInt(id), req.tenant.organizacionId);

        if (!cliente) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        return ResponseHelper.success(res, cliente, 'Cliente obtenido exitosamente');
    });

    static listar = asyncHandler(async (req, res) => {
        const {
            page = 1,
            limit = 20,
            busqueda,
            activo,
            marketing_permitido,
            ordenPor,
            orden
        } = req.query;

        const options = {
            organizacionId: req.tenant.organizacionId,
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 100),
            busqueda,
            activos: activo !== undefined ? activo === 'true' : undefined,
            marketing: marketing_permitido !== undefined ? marketing_permitido === 'true' : undefined,
            ordenPor,
            orden
        };

        const resultado = await ClienteModel.listar(options);

        return ResponseHelper.paginated(
            res,
            resultado.clientes,
            resultado.paginacion,
            'Clientes listados exitosamente'
        );
    });

    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const clienteData = req.body;

        const clienteActualizado = await ClienteModel.actualizar(
            parseInt(id),
            clienteData,
            req.tenant.organizacionId
        );

        if (!clienteActualizado) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        return ResponseHelper.success(res, clienteActualizado, 'Cliente actualizado exitosamente');
    });

    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const eliminado = await ClienteModel.eliminar(parseInt(id), req.tenant.organizacionId);

        if (!eliminado) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        return ResponseHelper.success(res, null, 'Cliente eliminado exitosamente');
    });

    static buscar = asyncHandler(async (req, res) => {
        const { q: termino, limit = 10 } = req.query;

        const clientes = await ClienteModel.buscar(
            termino.trim(),
            req.tenant.organizacionId,
            Math.min(parseInt(limit), 50)
        );

        return ResponseHelper.success(res, clientes, 'Búsqueda completada exitosamente');
    });

    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const estadisticas = await ClienteModel.obtenerEstadisticas(req.tenant.organizacionId);
        return ResponseHelper.success(res, estadisticas, 'Estadísticas obtenidas exitosamente');
    });

    static cambiarEstado = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { activo } = req.body;

        const clienteActualizado = await ClienteModel.actualizar(
            parseInt(id),
            { activo },
            req.tenant.organizacionId
        );

        if (!clienteActualizado) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        return ResponseHelper.success(
            res,
            clienteActualizado,
            `Cliente ${activo ? 'activado' : 'desactivado'} exitosamente`
        );
    });

    static buscarPorTelefono = asyncHandler(async (req, res) => {
        const { telefono, exacto, incluir_inactivos, crear_si_no_existe } = req.query;

        const resultado = await ClienteModel.buscarPorTelefono(
            telefono,
            req.tenant.organizacionId,
            {
                exacto: exacto === 'true',
                incluir_inactivos: incluir_inactivos === 'true',
                crear_si_no_existe: crear_si_no_existe === 'true'
            }
        );

        return ResponseHelper.success(res, resultado, 'Búsqueda por teléfono completada');
    });

    static buscarPorNombre = asyncHandler(async (req, res) => {
        const { nombre, limit = 10 } = req.query;

        const clientes = await ClienteModel.buscarPorNombre(
            nombre,
            req.tenant.organizacionId,
            parseInt(limit)
        );

        return ResponseHelper.success(res, clientes, 'Búsqueda por nombre completada');
    });
}

module.exports = ClienteController;
