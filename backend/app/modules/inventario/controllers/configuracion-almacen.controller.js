/**
 * Controller para Configuracion de Almacen
 * Gestionar pasos de recepcion/envio y ubicaciones por sucursal
 * Fecha: 31 Diciembre 2025
 */

const { asyncHandler } = require('../../../middleware');
const { ResponseHelper } = require('../../../utils/helpers');
const ConfiguracionAlmacenModel = require('../models/configuracion-almacen.model');

class ConfiguracionAlmacenController {
    // ==================== CONFIGURACION ====================

    /**
     * GET /api/v1/inventario/configuracion-almacen
     * Listar configuraciones de todas las sucursales
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const configuraciones = await ConfiguracionAlmacenModel.listar(organizacionId);

        return ResponseHelper.success(res, configuraciones, 'Configuraciones obtenidas');
    });

    /**
     * GET /api/v1/inventario/configuracion-almacen/:sucursalId
     * Obtener configuracion por sucursal
     */
    static obtenerPorSucursal = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { sucursalId } = req.params;

        const config = await ConfiguracionAlmacenModel.obtenerPorSucursal(
            parseInt(sucursalId),
            organizacionId
        );

        if (!config) {
            return ResponseHelper.notFound(res, 'Configuracion no encontrada');
        }

        // Agregar descripciones de pasos
        const descripciones = ConfiguracionAlmacenModel.obtenerDescripcionPasos(config);

        return ResponseHelper.success(res, {
            ...config,
            descripcion_recepcion: descripciones.recepcion,
            descripcion_envio: descripciones.envio
        }, 'Configuracion obtenida');
    });

    /**
     * PUT /api/v1/inventario/configuracion-almacen/:sucursalId
     * Actualizar configuracion
     */
    static actualizar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { sucursalId } = req.params;

        // Validar configuracion
        const validacion = ConfiguracionAlmacenModel.validarConfiguracion(req.body);
        if (!validacion.valido) {
            return ResponseHelper.error(res, `Configuracion invalida: ${validacion.errores.join(', ')}`, 400);
        }

        const config = await ConfiguracionAlmacenModel.actualizar(
            organizacionId,
            parseInt(sucursalId),
            req.body,
            usuarioId
        );

        // Agregar descripciones de pasos
        const descripciones = ConfiguracionAlmacenModel.obtenerDescripcionPasos(config);

        return ResponseHelper.success(res, {
            ...config,
            descripcion_recepcion: descripciones.recepcion,
            descripcion_envio: descripciones.envio
        }, 'Configuracion actualizada');
    });

    // ==================== UBICACIONES DEFAULT ====================

    /**
     * POST /api/v1/inventario/configuracion-almacen/:sucursalId/crear-ubicaciones
     * Crear ubicaciones por defecto para rutas multietapa
     */
    static crearUbicacionesDefault = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;
        const { sucursalId } = req.params;

        const resultado = await ConfiguracionAlmacenModel.crearUbicacionesDefault(
            parseInt(sucursalId),
            organizacionId,
            usuarioId
        );

        if (!resultado.exito) {
            return ResponseHelper.error(res, resultado.error || 'Error al crear ubicaciones', 500);
        }

        return ResponseHelper.success(res, resultado, resultado.mensaje);
    });

    // ==================== HELPERS ====================

    /**
     * GET /api/v1/inventario/configuracion-almacen/:sucursalId/usa-multietapa
     * Verificar si la sucursal usa rutas multietapa
     */
    static verificarMultietapa = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { sucursalId } = req.params;
        const { tipo } = req.query; // 'recepcion' o 'envio'

        let usaMultietapa = false;

        if (tipo === 'recepcion') {
            usaMultietapa = await ConfiguracionAlmacenModel.usaRecepcionMultietapa(
                parseInt(sucursalId),
                organizacionId
            );
        } else if (tipo === 'envio') {
            usaMultietapa = await ConfiguracionAlmacenModel.usaEnvioMultietapa(
                parseInt(sucursalId),
                organizacionId
            );
        } else {
            // Verificar ambos
            const [recepcion, envio] = await Promise.all([
                ConfiguracionAlmacenModel.usaRecepcionMultietapa(parseInt(sucursalId), organizacionId),
                ConfiguracionAlmacenModel.usaEnvioMultietapa(parseInt(sucursalId), organizacionId)
            ]);
            usaMultietapa = { recepcion, envio };
        }

        return ResponseHelper.success(res, { usa_multietapa: usaMultietapa }, 'Verificacion completada');
    });

    /**
     * GET /api/v1/inventario/configuracion-almacen/descripciones-pasos
     * Obtener descripciones de todos los pasos disponibles
     */
    static obtenerDescripcionesPasos = asyncHandler(async (req, res) => {
        const descripciones = {
            recepcion: {
                1: 'Directo a stock - La mercancia va directamente a la ubicacion de stock',
                2: 'Recepcion -> Almacenamiento - La mercancia pasa por zona de recepcion antes de almacenarse',
                3: 'Recepcion -> Control Calidad -> Almacenamiento - Incluye inspeccion de calidad'
            },
            envio: {
                1: 'Directo desde stock - El producto sale directamente de la ubicacion de stock',
                2: 'Picking -> Envio - Se realiza picking antes del envio',
                3: 'Picking -> Empaque -> Envio - Incluye etapa de empaque'
            }
        };

        return ResponseHelper.success(res, descripciones, 'Descripciones obtenidas');
    });
}

module.exports = ConfiguracionAlmacenController;
