/**
 * ====================================================================
 * CONTROLLER DE CLIENTES - MÓDULO CORE
 * ====================================================================
 *
 * Controller de Cliente como módulo Core compartido (patrón Odoo/Salesforce).
 * Gestión CRUD con aislamiento multi-tenant.
 *
 * Migrado desde modules/agendamiento a modules/core (Nov 2025)
 * ====================================================================
 */

const ClienteModel = require('../models/cliente.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');

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
            tipo,  // Filtro: 'persona' o 'empresa'
            etiqueta_ids,  // Filtro por etiquetas (comma-separated o array)
            ordenPor,
            orden
        } = req.query;

        // Parsear etiqueta_ids si viene como string separado por comas
        let etiquetaIdsArray = null;
        if (etiqueta_ids) {
            if (Array.isArray(etiqueta_ids)) {
                etiquetaIdsArray = etiqueta_ids.map(id => parseInt(id));
            } else if (typeof etiqueta_ids === 'string') {
                etiquetaIdsArray = etiqueta_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            }
        }

        const options = {
            organizacionId: req.tenant.organizacionId,
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 100),
            busqueda,
            activos: activo !== undefined ? activo === 'true' : undefined,
            marketing: marketing_permitido !== undefined ? marketing_permitido === 'true' : undefined,
            tipo,
            etiqueta_ids: etiquetaIdsArray,
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
        const { q: termino, tipo = 'nombre', limit = 10 } = req.query;

        const clientes = await ClienteModel.buscar(
            termino.trim(),
            req.tenant.organizacionId,
            Math.min(parseInt(limit), 50),
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
        const cliente = await ClienteModel.obtenerPorId(parseInt(id), req.tenant.organizacionId);
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

    /**
     * Importar clientes desde CSV
     * POST /api/v1/clientes/importar-csv
     *
     * Body: { clientes: Array<{ nombre, email?, telefono?, direccion?, notas? }> }
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

        const resultados = {
            creados: 0,
            errores: [],
            duplicados: 0
        };

        for (let i = 0; i < clientes.length; i++) {
            const clienteData = clientes[i];
            const fila = i + 1;

            try {
                // Validar campo requerido
                if (!clienteData.nombre || clienteData.nombre.trim() === '') {
                    resultados.errores.push({
                        fila,
                        error: 'El nombre es requerido'
                    });
                    continue;
                }

                // Verificar duplicado por email si existe
                if (clienteData.email) {
                    const existente = await ClienteModel.buscarPorEmail(
                        clienteData.email,
                        organizacionId
                    );
                    if (existente) {
                        resultados.duplicados++;
                        resultados.errores.push({
                            fila,
                            error: `Email ${clienteData.email} ya existe`
                        });
                        continue;
                    }
                }

                // Crear cliente
                await ClienteModel.crear({
                    organizacion_id: organizacionId,
                    nombre: clienteData.nombre.trim(),
                    email: clienteData.email?.trim() || null,
                    telefono: clienteData.telefono?.trim() || null,
                    direccion: clienteData.direccion?.trim() || null,
                    notas: clienteData.notas?.trim() || null,
                    activo: true,
                    marketing_permitido: clienteData.marketing_permitido ?? true
                });

                resultados.creados++;

            } catch (error) {
                resultados.errores.push({
                    fila,
                    error: error.message || 'Error desconocido'
                });
            }
        }

        const mensaje = `Importacion completada: ${resultados.creados} creados, ${resultados.duplicados} duplicados, ${resultados.errores.length} errores`;

        return ResponseHelper.success(res, resultados, mensaje);
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
            parseInt(id),
            {
                permite_credito,
                limite_credito: limite_credito || 0,
                dias_credito: dias_credito || 30
            },
            organizacionId
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
            parseInt(id),
            {
                credito_suspendido: true,
                credito_suspendido_en: new Date().toISOString(),
                credito_suspendido_motivo: motivo || 'Suspendido manualmente'
            },
            organizacionId
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
            parseInt(id),
            {
                credito_suspendido: false,
                credito_suspendido_en: null,
                credito_suspendido_motivo: null
            },
            organizacionId
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
        const { limit = 50, offset = 0 } = req.query;
        const organizacionId = req.tenant.organizacionId;

        const movimientos = await ClienteModel.listarMovimientosCredito(
            parseInt(id),
            organizacionId,
            { limit: parseInt(limit), offset: parseInt(offset) }
        );

        return ResponseHelper.success(res, movimientos, 'Movimientos obtenidos');
    });

    /**
     * Listar clientes con saldo pendiente (cobranza)
     * GET /api/v1/clientes/credito/con-saldo
     */
    static listarClientesConSaldo = asyncHandler(async (req, res) => {
        const { solo_vencidos = false } = req.query;
        const organizacionId = req.tenant.organizacionId;

        const clientes = await ClienteModel.listarClientesConSaldo(
            organizacionId,
            solo_vencidos === 'true'
        );

        return ResponseHelper.success(res, clientes, 'Clientes con saldo obtenidos');
    });
}

module.exports = ClienteController;
