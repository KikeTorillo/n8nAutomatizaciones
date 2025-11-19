const { ConfiguracionComisionesModel } = require('../../../../database/comisiones');
const { ResponseHelper } = require('../../../../utils/helpers');
const { asyncHandler } = require('../../../../middleware');

/**
 * Controller para gestión de configuración de comisiones
 * CRUD completo de reglas de comisión por profesional/servicio
 */
class ConfiguracionComisionesController {

    /**
     * Crear o actualizar configuración de comisión
     * POST /api/v1/comisiones/configuracion
     */
    static crearOActualizar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const userId = req.user.id;

        const data = {
            ...req.body,
            creado_por: userId
        };

        const configuracion = await ConfiguracionComisionesModel.crearOActualizar(data, organizacionId);

        return ResponseHelper.success(
            res,
            configuracion,
            'Configuración de comisión guardada exitosamente',
            201
        );
    });

    /**
     * Listar configuraciones de comisiones
     * GET /api/v1/comisiones/configuracion
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            profesional_id: req.query.profesional_id ? parseInt(req.query.profesional_id) : undefined,
            servicio_id: req.query.servicio_id ? parseInt(req.query.servicio_id) : undefined,
            activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
            tipo_comision: req.query.tipo_comision || undefined
        };

        const configuraciones = await ConfiguracionComisionesModel.listar(filtros, organizacionId);

        return ResponseHelper.success(
            res,
            configuraciones,
            'Configuraciones obtenidas exitosamente'
        );
    });

    /**
     * Obtener configuración por ID
     * GET /api/v1/comisiones/configuracion/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const configuracion = await ConfiguracionComisionesModel.obtenerPorId(parseInt(id), organizacionId);

        if (!configuracion) {
            return ResponseHelper.error(res, 'Configuración no encontrada', 404);
        }

        return ResponseHelper.success(res, configuracion, 'Configuración obtenida exitosamente');
    });

    /**
     * Eliminar configuración de comisión
     * DELETE /api/v1/comisiones/configuracion/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await ConfiguracionComisionesModel.eliminar(parseInt(id), organizacionId);

        return ResponseHelper.success(res, resultado, 'Configuración eliminada exitosamente');
    });

    /**
     * Obtener historial de cambios
     * GET /api/v1/comisiones/configuracion/historial
     */
    static obtenerHistorial = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            profesional_id: req.query.profesional_id ? parseInt(req.query.profesional_id) : undefined,
            configuracion_id: req.query.configuracion_id ? parseInt(req.query.configuracion_id) : undefined
        };

        const historial = await ConfiguracionComisionesModel.obtenerHistorial(filtros, organizacionId);

        return ResponseHelper.success(res, historial, 'Historial obtenido exitosamente');
    });
}

module.exports = ConfiguracionComisionesController;
