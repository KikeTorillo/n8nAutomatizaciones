const PuestoModel = require('../models/puesto.model');
const logger = require('../../../utils/logger');

class PuestoController {

    /**
     * POST /puestos
     */
    static async crear(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const data = req.body;

            const puesto = await PuestoModel.crear(organizacionId, data);

            logger.info(`Puesto creado: ${puesto.nombre}`, {
                organizacionId,
                puestoId: puesto.id,
                usuario: req.user.email
            });

            res.status(201).json({
                success: true,
                data: puesto
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /puestos
     */
    static async listar(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const filtros = {
                activo: req.query.activo === 'true' ? true : req.query.activo === 'false' ? false : null,
                departamento_id: req.query.departamento_id ? parseInt(req.query.departamento_id) : null,
                limit: parseInt(req.query.limit) || 100,
                offset: parseInt(req.query.offset) || 0
            };

            const puestos = await PuestoModel.listar(organizacionId, filtros);

            res.json({
                success: true,
                data: puestos,
                meta: {
                    total: puestos.length,
                    limit: filtros.limit,
                    offset: filtros.offset
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /puestos/:id
     */
    static async obtenerPorId(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const { id } = req.params;

            const puesto = await PuestoModel.buscarPorId(organizacionId, id);

            if (!puesto) {
                return res.status(404).json({
                    success: false,
                    error: 'Puesto no encontrado'
                });
            }

            res.json({
                success: true,
                data: puesto
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /puestos/:id
     */
    static async actualizar(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const { id } = req.params;
            const data = req.body;

            const puesto = await PuestoModel.actualizar(organizacionId, id, data);

            logger.info(`Puesto actualizado: ${puesto.nombre}`, {
                organizacionId,
                puestoId: id,
                usuario: req.user.email
            });

            res.json({
                success: true,
                data: puesto
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /puestos/:id
     */
    static async eliminar(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const { id } = req.params;

            const eliminado = await PuestoModel.eliminar(organizacionId, id);

            if (!eliminado) {
                return res.status(404).json({
                    success: false,
                    error: 'Puesto no encontrado'
                });
            }

            logger.info(`Puesto eliminado: ${id}`, {
                organizacionId,
                puestoId: id,
                usuario: req.user.email
            });

            res.json({
                success: true,
                message: 'Puesto eliminado correctamente'
            });
        } catch (error) {
            next(error);
        }
    }

}

module.exports = PuestoController;
