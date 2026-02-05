/**
 * ====================================================================
 * CONTROLLER DE CLIENTES - MÓDULO CORE
 * ====================================================================
 *
 * Controller de Cliente como módulo Core compartido (patrón CRM).
 * Gestión CRUD con aislamiento multi-tenant.
 *
 * Migrado desde modules/agendamiento a modules/core (Nov 2025)
 * ====================================================================
 */

const ClienteModel = require('../models/cliente.model');
const { ResponseHelper, ParseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');

class ClienteController {

    static crear = asyncHandler(async (req, res) => {
        const nuevoCliente = await ClienteModel.crear(
            req.tenant.organizacionId,
            req.body
        );

        return ResponseHelper.success(res, nuevoCliente, 'Cliente creado exitosamente', 201);
    });

    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const cliente = await ClienteModel.buscarPorId(req.tenant.organizacionId, parseInt(id));

        if (!cliente) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        return ResponseHelper.success(res, cliente, 'Cliente obtenido exitosamente');
    });

    static listar = asyncHandler(async (req, res) => {
        // Parseo centralizado con ParseHelper
        const { page, limit } = ParseHelper.parsePagination(req.query, { maxLimit: 100 });

        const filtros = {
            page,
            limit,
            busqueda: ParseHelper.parseString(req.query.busqueda),
            activos: ParseHelper.parseBoolean(req.query.activo),
            marketing: ParseHelper.parseBoolean(req.query.marketing_permitido),
            tipo: ParseHelper.parseString(req.query.tipo),
            etiqueta_ids: ParseHelper.parseIntArray(req.query.etiqueta_ids),
            ordenPor: ParseHelper.parseString(req.query.ordenPor) || 'nombre',
            orden: ParseHelper.parseString(req.query.orden) || 'ASC'
        };

        // Limpiar etiqueta_ids si está vacío
        if (filtros.etiqueta_ids?.length === 0) {
            filtros.etiqueta_ids = null;
        }

        const resultado = await ClienteModel.listar(req.tenant.organizacionId, filtros);

        return ResponseHelper.paginated(
            res,
            resultado.clientes,
            resultado.paginacion,
            'Clientes listados exitosamente'
        );
    });

    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const clienteActualizado = await ClienteModel.actualizar(
            req.tenant.organizacionId,
            parseInt(id),
            req.body
        );

        if (!clienteActualizado) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        return ResponseHelper.success(res, clienteActualizado, 'Cliente actualizado exitosamente');
    });

    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const eliminado = await ClienteModel.eliminar(req.tenant.organizacionId, parseInt(id));

        if (!eliminado) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        return ResponseHelper.success(res, null, 'Cliente eliminado exitosamente');
    });

    static buscar = asyncHandler(async (req, res) => {
        const termino = ParseHelper.parseString(req.query.q) || '';
        const tipo = ParseHelper.parseString(req.query.tipo) || 'nombre';
        const limit = Math.min(ParseHelper.parseInt(req.query.limit, 10), 50);

        const clientes = await ClienteModel.buscar(
            termino.trim(),
            req.tenant.organizacionId,
            limit,
            tipo
        );

        return ResponseHelper.success(res, clientes, 'Búsqueda completada exitosamente');
    });

    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const estadisticas = await ClienteModel.obtenerEstadisticas(req.tenant.organizacionId);
        return ResponseHelper.success(res, estadisticas, 'Estadísticas obtenidas exitosamente');
    });

    /**
     * Vista 360° del cliente - Estadísticas detalladas
     * GET /api/v1/clientes/:id/estadisticas
     */
    static obtenerEstadisticasCliente = asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Verificar que el cliente existe
        const cliente = await ClienteModel.buscarPorId(req.tenant.organizacionId, parseInt(id));
        if (!cliente) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        const estadisticas = await ClienteModel.obtenerEstadisticasCliente(
            parseInt(id),
            req.tenant.organizacionId
        );

        return ResponseHelper.success(res, {
            cliente,
            estadisticas
        }, 'Estadísticas del cliente obtenidas exitosamente');
    });

    static cambiarEstado = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { activo } = req.body;

        const clienteActualizado = await ClienteModel.actualizar(
            req.tenant.organizacionId,
            parseInt(id),
            { activo }
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
        const telefono = ParseHelper.parseString(req.query.telefono);

        const resultado = await ClienteModel.buscarPorTelefono(
            telefono,
            req.tenant.organizacionId,
            {
                exacto: ParseHelper.parseBoolean(req.query.exacto, false),
                incluir_inactivos: ParseHelper.parseBoolean(req.query.incluir_inactivos, false),
                crear_si_no_existe: ParseHelper.parseBoolean(req.query.crear_si_no_existe, false)
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

    /**
     * Importar clientes desde CSV (transaccional)
     * POST /api/v1/clientes/importar-csv
     *
     * Body: { clientes: Array<{ nombre, email?, telefono?, notas?, marketing_permitido? }> }
     *
     * Usa importarMasivo que es transaccional: todos los clientes se importan
     * dentro de una misma transacción para garantizar atomicidad.
     */
    static importarCSV = asyncHandler(async (req, res) => {
        const { clientes = [] } = req.body;
        const organizacionId = req.tenant.organizacionId;

        if (!Array.isArray(clientes) || clientes.length === 0) {
            return ResponseHelper.badRequest(res, 'Se requiere un array de clientes para importar');
        }

        // Limite de 500 registros por importacion
        if (clientes.length > 500) {
            return ResponseHelper.badRequest(res, 'Maximo 500 clientes por importacion');
        }

        // Usar método transaccional del modelo
        const resultado = await ClienteModel.importarMasivo(organizacionId, clientes, {
            ignorarDuplicados: true // Salta duplicados sin hacer rollback
        });

        const mensaje = `Importacion completada: ${resultado.creados} creados, ${resultado.duplicados} duplicados, ${resultado.errores} errores`;

        return ResponseHelper.success(res, {
            creados: resultado.creados,
            duplicados: resultado.duplicados,
            errores: resultado.detalles.errores,
            clientesCreados: resultado.detalles.creados.map(c => c.cliente)
        }, mensaje);
    });

    // =========================================================================
    // CRÉDITO / FIADO (Ene 2026)
    // =========================================================================

    /**
     * Obtener estado de crédito de un cliente
     * GET /api/v1/clientes/:id/credito
     */
    static obtenerEstadoCredito = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const estadoCredito = await ClienteModel.obtenerEstadoCredito(
            parseInt(id),
            organizacionId
        );

        if (!estadoCredito) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        return ResponseHelper.success(res, estadoCredito, 'Estado de crédito obtenido');
    });

    /**
     * Habilitar/deshabilitar crédito de un cliente
     * PATCH /api/v1/clientes/:id/credito
     */
    static actualizarConfigCredito = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { permite_credito, limite_credito, dias_credito } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const clienteActualizado = await ClienteModel.actualizar(
            organizacionId,
            parseInt(id),
            {
                permite_credito,
                limite_credito: limite_credito || 0,
                dias_credito: dias_credito || 30
            }
        );

        if (!clienteActualizado) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        return ResponseHelper.success(
            res,
            clienteActualizado,
            permite_credito ? 'Crédito habilitado' : 'Crédito deshabilitado'
        );
    });

    /**
     * Suspender crédito de un cliente
     * POST /api/v1/clientes/:id/credito/suspender
     */
    static suspenderCredito = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { motivo } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const clienteActualizado = await ClienteModel.actualizar(
            organizacionId,
            parseInt(id),
            {
                credito_suspendido: true,
                credito_suspendido_en: new Date().toISOString(),
                credito_suspendido_motivo: motivo || 'Suspendido manualmente'
            }
        );

        if (!clienteActualizado) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        return ResponseHelper.success(res, clienteActualizado, 'Crédito suspendido');
    });

    /**
     * Reactivar crédito de un cliente
     * POST /api/v1/clientes/:id/credito/reactivar
     */
    static reactivarCredito = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const clienteActualizado = await ClienteModel.actualizar(
            organizacionId,
            parseInt(id),
            {
                credito_suspendido: false,
                credito_suspendido_en: null,
                credito_suspendido_motivo: null
            }
        );

        if (!clienteActualizado) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        return ResponseHelper.success(res, clienteActualizado, 'Crédito reactivado');
    });

    /**
     * Registrar abono a la cuenta del cliente
     * POST /api/v1/clientes/:id/credito/abono
     */
    static registrarAbono = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { monto, descripcion } = req.body;
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user?.id;

        const resultado = await ClienteModel.registrarAbonoCredito(
            parseInt(id),
            monto,
            descripcion,
            usuarioId,
            organizacionId
        );

        return ResponseHelper.success(res, resultado, 'Abono registrado exitosamente');
    });

    /**
     * Listar movimientos de crédito del cliente
     * GET /api/v1/clientes/:id/credito/movimientos
     */
    static listarMovimientosCredito = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { limit, offset } = ParseHelper.parsePagination(req.query, { defaultLimit: 50 });
        const organizacionId = req.tenant.organizacionId;

        const movimientos = await ClienteModel.listarMovimientosCredito(
            parseInt(id),
            organizacionId,
            { limit, offset }
        );

        return ResponseHelper.success(res, movimientos, 'Movimientos obtenidos');
    });

    /**
     * Listar clientes con saldo pendiente (cobranza)
     * GET /api/v1/clientes/credito/con-saldo
     */
    static listarClientesConSaldo = asyncHandler(async (req, res) => {
        const soloVencidos = ParseHelper.parseBoolean(req.query.solo_vencidos, false);
        const organizacionId = req.tenant.organizacionId;

        const clientes = await ClienteModel.listarClientesConSaldo(
            organizacionId,
            soloVencidos
        );

        return ResponseHelper.success(res, clientes, 'Clientes con saldo obtenidos');
    });
}

module.exports = ClienteController;
