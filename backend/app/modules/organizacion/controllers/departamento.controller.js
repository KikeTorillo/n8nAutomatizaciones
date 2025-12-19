const DepartamentoModel = require('../models/departamento.model');
const logger = require('../../../utils/logger');

class DepartamentoController {

    /**
     * POST /departamentos
     */
    static async crear(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const data = req.body;

            const departamento = await DepartamentoModel.crear(organizacionId, data);

            logger.info(`Departamento creado: ${departamento.nombre}`, {
                organizacionId,
                departamentoId: departamento.id,
                usuario: req.user.email
            });

            res.status(201).json({
                success: true,
                data: departamento
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /departamentos
     */
    static async listar(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const filtros = {
                activo: req.query.activo === 'true' ? true : req.query.activo === 'false' ? false : null,
                parent_id: req.query.parent_id !== undefined ? parseInt(req.query.parent_id) : null,
                limit: parseInt(req.query.limit) || 100,
                offset: parseInt(req.query.offset) || 0
            };

            const departamentos = await DepartamentoModel.listar(organizacionId, filtros);

            res.json({
                success: true,
                data: departamentos,
                meta: {
                    total: departamentos.length,
                    limit: filtros.limit,
                    offset: filtros.offset
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /departamentos/arbol
     */
    static async obtenerArbol(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const arbol = await DepartamentoModel.obtenerArbol(organizacionId);

            res.json({
                success: true,
                data: arbol
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /departamentos/:id
     */
    static async obtenerPorId(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const { id } = req.params;

            const departamento = await DepartamentoModel.buscarPorId(organizacionId, id);

            if (!departamento) {
                return res.status(404).json({
                    success: false,
                    error: 'Departamento no encontrado'
                });
            }

            res.json({
                success: true,
                data: departamento
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /departamentos/:id
     */
    static async actualizar(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const { id } = req.params;
            const data = req.body;

            const departamento = await DepartamentoModel.actualizar(organizacionId, id, data);

            logger.info(`Departamento actualizado: ${departamento.nombre}`, {
                organizacionId,
                departamentoId: id,
                usuario: req.user.email
            });

            res.json({
                success: true,
                data: departamento
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /departamentos/:id
     */
    static async eliminar(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const { id } = req.params;

            const eliminado = await DepartamentoModel.eliminar(organizacionId, id);

            if (!eliminado) {
                return res.status(404).json({
                    success: false,
                    error: 'Departamento no encontrado'
                });
            }

            logger.info(`Departamento eliminado: ${id}`, {
                organizacionId,
                departamentoId: id,
                usuario: req.user.email
            });

            res.json({
                success: true,
                message: 'Departamento eliminado correctamente'
            });
        } catch (error) {
            next(error);
        }
    }

}

module.exports = DepartamentoController;
