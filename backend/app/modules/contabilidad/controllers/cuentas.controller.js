const { CuentasModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

/**
 * Controller para gestión de cuentas contables
 * Basado en el Código Agrupador SAT México (Anexo 24)
 *
 * NO MIGRADO a BaseCrudController - Ene 2026
 * Razones:
 * - 3+ métodos custom: obtenerArbol(), listarAfectables(), inicializarCatalogoSAT()
 * - Firma del modelo incompatible: listar(filtros, orgId) vs listar(orgId, filtros)
 * - obtenerPorId(id, orgId) vs buscarPorId(orgId, id)
 */
class CuentasController {

    /**
     * Listar cuentas contables con filtros
     * GET /api/v1/contabilidad/cuentas
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Helper para parsear booleanos (soporta string o boolean)
        const parseBool = (val) => {
            if (val === undefined) return undefined;
            if (typeof val === 'boolean') return val;
            return val === 'true';
        };

        const filtros = {
            tipo: req.query.tipo || undefined,
            naturaleza: req.query.naturaleza || undefined,
            nivel: req.query.nivel ? parseInt(req.query.nivel) : undefined,
            cuenta_padre_id: req.query.cuenta_padre_id ? parseInt(req.query.cuenta_padre_id) : undefined,
            activo: parseBool(req.query.activo),
            afectable: parseBool(req.query.afectable),
            busqueda: req.query.busqueda || undefined,
            pagina: req.query.pagina ? parseInt(req.query.pagina) : 1,
            limite: req.query.limite ? parseInt(req.query.limite) : 50
        };

        const resultado = await CuentasModel.listar(filtros, organizacionId);

        return ResponseHelper.success(res, resultado, 'Cuentas obtenidas exitosamente');
    });

    /**
     * Obtener árbol de cuentas (estructura jerárquica)
     * GET /api/v1/contabilidad/cuentas/arbol
     */
    static obtenerArbol = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const soloActivas = req.query.solo_activas !== 'false';

        const arbol = await CuentasModel.obtenerArbol(organizacionId, soloActivas);

        return ResponseHelper.success(res, arbol, 'Árbol de cuentas obtenido');
    });

    /**
     * Obtener cuentas afectables (para selects)
     * GET /api/v1/contabilidad/cuentas/afectables
     */
    static listarAfectables = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const tipo = req.query.tipo || null;

        const cuentas = await CuentasModel.listarAfectables(organizacionId, tipo);

        return ResponseHelper.success(res, cuentas, 'Cuentas afectables obtenidas');
    });

    /**
     * Obtener cuenta por ID
     * GET /api/v1/contabilidad/cuentas/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const cuenta = await CuentasModel.obtenerPorId(parseInt(id), organizacionId);

        if (!cuenta) {
            return ResponseHelper.notFound(res, 'Cuenta no encontrada');
        }

        return ResponseHelper.success(res, cuenta);
    });

    /**
     * Crear nueva cuenta contable
     * POST /api/v1/contabilidad/cuentas
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const cuenta = await CuentasModel.crear(req.body, organizacionId);

        return ResponseHelper.created(res, cuenta, 'Cuenta creada exitosamente');
    });

    /**
     * Actualizar cuenta contable
     * PUT /api/v1/contabilidad/cuentas/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const cuenta = await CuentasModel.actualizar(parseInt(id), req.body, organizacionId);

        return ResponseHelper.success(res, cuenta, 'Cuenta actualizada exitosamente');
    });

    /**
     * Eliminar cuenta (soft delete)
     * DELETE /api/v1/contabilidad/cuentas/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const resultado = await CuentasModel.eliminar(parseInt(id), organizacionId);

        return ResponseHelper.success(res, resultado);
    });

    /**
     * Inicializar catálogo de cuentas SAT
     * POST /api/v1/contabilidad/cuentas/inicializar-sat
     */
    static inicializarCatalogoSAT = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const resultado = await CuentasModel.inicializarCatalogoSAT(organizacionId, usuarioId);

        return ResponseHelper.success(res, resultado);
    });
}

module.exports = CuentasController;
