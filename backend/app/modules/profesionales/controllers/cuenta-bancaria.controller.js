/**
 * CuentaBancariaController - Enero 2026
 * Handlers HTTP para cuentas bancarias de empleados
 * Fase 1 del Plan de Empleados Competitivo
 */
const CuentaBancariaModel = require('../models/cuenta-bancaria.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const logger = require('../../../utils/logger');

class CuentaBancariaController {

    /**
     * GET /profesionales/:id/cuentas-bancarias
     * Lista cuentas bancarias de un profesional
     */
    static listar = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            uso: req.query.uso || null,
            activo: req.query.activo !== 'false', // Default true
            limite: Math.min(parseInt(req.query.limit) || 20, 50),
            offset: Math.max(parseInt(req.query.offset) || 0, 0)
        };

        const cuentas = await CuentaBancariaModel.listarPorProfesional(
            organizacionId,
            profesionalId,
            filtros
        );

        // Obtener conteo por tipo
        const conteo = await CuentaBancariaModel.contarPorProfesional(
            organizacionId,
            profesionalId
        );

        return ResponseHelper.success(res, {
            cuentas,
            conteo,
            filtros_aplicados: filtros
        }, 'Cuentas bancarias obtenidas exitosamente');
    });

    /**
     * POST /profesionales/:id/cuentas-bancarias
     * Crea una nueva cuenta bancaria
     */
    static crear = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const cuentaData = {
            organizacion_id: organizacionId,
            profesional_id: profesionalId,
            banco: req.body.banco,
            numero_cuenta: req.body.numero_cuenta,
            clabe: req.body.clabe || null,
            tipo_cuenta: req.body.tipo_cuenta || 'debito',
            moneda: req.body.moneda || 'MXN',
            titular_nombre: req.body.titular_nombre || null,
            titular_documento: req.body.titular_documento || null,
            es_principal: req.body.es_principal || false,
            uso: req.body.uso || 'nomina',
            creado_por: usuarioId
        };

        const cuenta = await CuentaBancariaModel.crear(cuentaData);

        // Obtener cuenta completa con joins
        const cuentaCompleta = await CuentaBancariaModel.obtenerPorId(
            organizacionId,
            cuenta.id
        );

        logger.info(`[CuentaBancaria.crear] Cuenta creada: ${cuenta.banco} (ID: ${cuenta.id}) para profesional ${profesionalId}`);

        return ResponseHelper.success(res, cuentaCompleta, 'Cuenta bancaria creada exitosamente', 201);
    });

    /**
     * GET /profesionales/:id/cuentas-bancarias/:cuentaId
     * Obtiene una cuenta bancaria específica
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const cuentaId = parseInt(req.params.cuentaId);
        const organizacionId = req.tenant.organizacionId;

        const cuenta = await CuentaBancariaModel.obtenerPorId(organizacionId, cuentaId);

        if (!cuenta) {
            return ResponseHelper.notFound(res, 'Cuenta bancaria no encontrada');
        }

        return ResponseHelper.success(res, cuenta, 'Cuenta bancaria obtenida exitosamente');
    });

    /**
     * PUT /profesionales/:id/cuentas-bancarias/:cuentaId
     * Actualiza una cuenta bancaria
     */
    static actualizar = asyncHandler(async (req, res) => {
        const cuentaId = parseInt(req.params.cuentaId);
        const organizacionId = req.tenant.organizacionId;

        // Verificar que existe
        const cuentaExistente = await CuentaBancariaModel.obtenerPorId(organizacionId, cuentaId);
        if (!cuentaExistente) {
            return ResponseHelper.notFound(res, 'Cuenta bancaria no encontrada');
        }

        const cuenta = await CuentaBancariaModel.actualizar(
            organizacionId,
            cuentaId,
            req.body
        );

        // Obtener cuenta actualizada con joins
        const cuentaCompleta = await CuentaBancariaModel.obtenerPorId(
            organizacionId,
            cuenta.id
        );

        logger.info(`[CuentaBancaria.actualizar] Cuenta actualizada: ${cuenta.banco} (ID: ${cuentaId})`);

        return ResponseHelper.success(res, cuentaCompleta, 'Cuenta bancaria actualizada exitosamente');
    });

    /**
     * DELETE /profesionales/:id/cuentas-bancarias/:cuentaId
     * Soft delete de una cuenta bancaria
     */
    static eliminar = asyncHandler(async (req, res) => {
        const cuentaId = parseInt(req.params.cuentaId);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        // Verificar que existe
        const cuenta = await CuentaBancariaModel.obtenerPorId(organizacionId, cuentaId);
        if (!cuenta) {
            return ResponseHelper.notFound(res, 'Cuenta bancaria no encontrada');
        }

        // Advertencia si es la cuenta principal
        if (cuenta.es_principal) {
            logger.warn(`[CuentaBancaria.eliminar] Eliminando cuenta principal del profesional ${cuenta.profesional_id}`);
        }

        const eliminado = await CuentaBancariaModel.eliminar(
            organizacionId,
            cuentaId,
            usuarioId
        );

        if (!eliminado) {
            return ResponseHelper.error(res, 'No se pudo eliminar la cuenta bancaria', 400);
        }

        logger.info(`[CuentaBancaria.eliminar] Cuenta eliminada: ${cuenta.banco} (ID: ${cuentaId}) por usuario ${usuarioId}`);

        return ResponseHelper.success(res, { id: cuentaId }, 'Cuenta bancaria eliminada exitosamente');
    });

    /**
     * PATCH /profesionales/:id/cuentas-bancarias/:cuentaId/principal
     * Establece una cuenta como principal
     */
    static establecerPrincipal = asyncHandler(async (req, res) => {
        const cuentaId = parseInt(req.params.cuentaId);
        const organizacionId = req.tenant.organizacionId;

        // Verificar que existe
        const cuentaExistente = await CuentaBancariaModel.obtenerPorId(organizacionId, cuentaId);
        if (!cuentaExistente) {
            return ResponseHelper.notFound(res, 'Cuenta bancaria no encontrada');
        }

        if (cuentaExistente.es_principal) {
            return ResponseHelper.success(res, cuentaExistente, 'Esta cuenta ya es la principal');
        }

        const cuenta = await CuentaBancariaModel.establecerPrincipal(organizacionId, cuentaId);

        // Obtener cuenta actualizada
        const cuentaCompleta = await CuentaBancariaModel.obtenerPorId(
            organizacionId,
            cuenta.id
        );

        logger.info(`[CuentaBancaria.establecerPrincipal] Cuenta establecida como principal: ${cuenta.banco} (ID: ${cuentaId})`);

        return ResponseHelper.success(res, cuentaCompleta, 'Cuenta establecida como principal exitosamente');
    });

    /**
     * GET /cuentas-bancarias/sin-principal
     * Lista profesionales sin cuenta bancaria principal (para alertas RRHH)
     */
    static listarSinCuentaPrincipal = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            limite: Math.min(parseInt(req.query.limit) || 50, 100),
            offset: Math.max(parseInt(req.query.offset) || 0, 0)
        };

        const profesionales = await CuentaBancariaModel.listarSinCuentaPrincipal(
            organizacionId,
            filtros
        );

        return ResponseHelper.success(res, {
            profesionales,
            total: profesionales.length,
            filtros_aplicados: filtros
        }, 'Profesionales sin cuenta principal obtenidos exitosamente');
    });

}

module.exports = CuentaBancariaController;
