/**
 * ====================================================================
 * CONTROLLER - WORKFLOW DESIGNER
 * ====================================================================
 *
 * Endpoints CRUD para el diseñador visual de workflows:
 * - Crear, editar, eliminar definiciones
 * - Duplicar workflows
 * - Publicar/Despublicar
 * - Validar estructura
 */

const WorkflowDefinicionesModel = require('../models/definiciones.model');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const logger = require('../../../utils/logger');

class DesignerController {

    // ========================================================================
    // CRUD DEFINICIONES
    // ========================================================================

    /**
     * Crear nueva definición de workflow
     * POST /api/v1/workflows/designer/definiciones
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        logger.info('[DesignerController.crear] Iniciando', {
            usuario_id: usuarioId,
            codigo: req.body.codigo,
            entidad_tipo: req.body.entidad_tipo
        });

        const workflow = await WorkflowDefinicionesModel.crear(
            req.body,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            workflow,
            'Workflow creado exitosamente',
            201
        );
    });

    /**
     * Actualizar definición de workflow
     * PUT /api/v1/workflows/designer/definiciones/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        logger.info('[DesignerController.actualizar] Iniciando', {
            workflow_id: id
        });

        const workflow = await WorkflowDefinicionesModel.actualizar(
            parseInt(id),
            req.body,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            workflow,
            'Workflow actualizado exitosamente'
        );
    });

    /**
     * Eliminar definición de workflow
     * DELETE /api/v1/workflows/designer/definiciones/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        logger.info('[DesignerController.eliminar] Iniciando', {
            workflow_id: id
        });

        const workflow = await WorkflowDefinicionesModel.eliminar(
            parseInt(id),
            organizacionId
        );

        return ResponseHelper.success(
            res,
            workflow,
            'Workflow eliminado exitosamente'
        );
    });

    /**
     * Duplicar workflow
     * POST /api/v1/workflows/designer/definiciones/:id/duplicar
     */
    static duplicar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { nuevo_codigo, nuevo_nombre } = req.body;
        const organizacionId = req.tenant.organizacionId;

        logger.info('[DesignerController.duplicar] Iniciando', {
            workflow_id: id,
            nuevo_codigo
        });

        const workflow = await WorkflowDefinicionesModel.duplicar(
            parseInt(id),
            nuevo_codigo,
            nuevo_nombre,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            workflow,
            'Workflow duplicado exitosamente',
            201
        );
    });

    /**
     * Publicar o despublicar workflow
     * PATCH /api/v1/workflows/designer/definiciones/:id/publicar
     */
    static cambiarEstadoPublicacion = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { activo } = req.body;
        const organizacionId = req.tenant.organizacionId;

        logger.info('[DesignerController.cambiarEstadoPublicacion]', {
            workflow_id: id,
            activo
        });

        const workflow = await WorkflowDefinicionesModel.cambiarEstadoPublicacion(
            parseInt(id),
            activo,
            organizacionId
        );

        const mensaje = activo
            ? 'Workflow publicado exitosamente'
            : 'Workflow despublicado exitosamente';

        return ResponseHelper.success(res, workflow, mensaje);
    });

    // ========================================================================
    // VALIDACIÓN
    // ========================================================================

    /**
     * Validar estructura de un workflow guardado
     * GET /api/v1/workflows/designer/definiciones/:id/validar
     */
    static validarWorkflow = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const validacion = await WorkflowDefinicionesModel.validarEstructura(
            parseInt(id),
            organizacionId
        );

        return ResponseHelper.success(
            res,
            validacion,
            validacion.valido ? 'Workflow válido' : 'Workflow con errores'
        );
    });

    // ========================================================================
    // UTILIDADES
    // ========================================================================

    /**
     * Obtener tipos de entidad disponibles
     * GET /api/v1/workflows/designer/entidades
     */
    static listarEntidades = asyncHandler(async (req, res) => {
        const entidades = [
            {
                tipo: 'orden_compra',
                nombre: 'Orden de Compra',
                descripcion: 'Aprobación de órdenes de compra a proveedores',
                campos_disponibles: ['total', 'proveedor_id', 'sucursal_id', 'items_count']
            },
            {
                tipo: 'venta_pos',
                nombre: 'Venta POS',
                descripcion: 'Aprobación de ventas en punto de venta',
                campos_disponibles: ['total', 'descuento_total', 'cliente_id']
            },
            {
                tipo: 'descuento_pos',
                nombre: 'Descuento POS',
                descripcion: 'Aprobación de descuentos especiales en ventas',
                campos_disponibles: ['porcentaje', 'monto', 'motivo']
            },
            {
                tipo: 'cita',
                nombre: 'Cita',
                descripcion: 'Aprobación de citas especiales',
                campos_disponibles: ['precio_total', 'duracion_total', 'profesional_id']
            },
            {
                tipo: 'gasto',
                nombre: 'Gasto',
                descripcion: 'Aprobación de gastos empresariales',
                campos_disponibles: ['monto', 'categoria_id', 'proveedor_id']
            },
            {
                tipo: 'requisicion',
                nombre: 'Requisición',
                descripcion: 'Aprobación de requisiciones de materiales',
                campos_disponibles: ['total_estimado', 'urgencia', 'departamento_id']
            }
        ];

        return ResponseHelper.success(
            res,
            entidades,
            'Tipos de entidad obtenidos exitosamente'
        );
    });

    /**
     * Obtener roles disponibles para aprobadores
     * GET /api/v1/workflows/designer/roles
     */
    static listarRoles = asyncHandler(async (req, res) => {
        const roles = [
            { codigo: 'admin', nombre: 'Administrador', descripcion: 'Administrador con acceso completo' },
            { codigo: 'empleado', nombre: 'Empleado', descripcion: 'Usuario estándar' }
        ];

        return ResponseHelper.success(
            res,
            roles,
            'Roles obtenidos exitosamente'
        );
    });

    /**
     * Obtener permisos disponibles para aprobadores
     * GET /api/v1/workflows/designer/permisos
     */
    static listarPermisos = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Los permisos relevantes para aprobaciones
        const permisos = [
            { codigo: 'workflows.aprobar', nombre: 'Aprobar solicitudes' },
            { codigo: 'inventario.aprobar_ordenes_compra', nombre: 'Aprobar órdenes de compra' },
            { codigo: 'pos.anular_ventas', nombre: 'Anular ventas' },
            { codigo: 'pos.aplicar_descuentos', nombre: 'Aplicar descuentos' }
        ];

        return ResponseHelper.success(
            res,
            permisos,
            'Permisos obtenidos exitosamente'
        );
    });
}

module.exports = DesignerController;
