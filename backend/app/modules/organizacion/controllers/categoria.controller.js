const CategoriaModel = require('../models/categoria.model');
const logger = require('../../../utils/logger');

class CategoriaController {

    /**
     * POST /categorias-profesional
     */
    static async crear(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const data = req.body;

            const categoria = await CategoriaModel.crear(organizacionId, data);

            logger.info(`Categoría creada: ${categoria.nombre}`, {
                organizacionId,
                categoriaId: categoria.id,
                tipo: categoria.tipo_categoria,
                usuario: req.user.email
            });

            res.status(201).json({
                success: true,
                data: categoria
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /categorias-profesional
     */
    static async listar(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;

            // Si se solicita agrupado, usar método especial
            if (req.query.agrupado === 'true') {
                const soloActivas = req.query.activo !== 'false';
                const categorias = await CategoriaModel.listarAgrupadas(organizacionId, soloActivas);

                return res.json({
                    success: true,
                    data: categorias
                });
            }

            const filtros = {
                activo: req.query.activo === 'true' ? true : req.query.activo === 'false' ? false : null,
                tipo_categoria: req.query.tipo_categoria || null,
                limit: parseInt(req.query.limit) || 100,
                offset: parseInt(req.query.offset) || 0
            };

            const categorias = await CategoriaModel.listar(organizacionId, filtros);

            res.json({
                success: true,
                data: categorias,
                meta: {
                    total: categorias.length,
                    limit: filtros.limit,
                    offset: filtros.offset
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /categorias-profesional/:id
     */
    static async obtenerPorId(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const { id } = req.params;

            const categoria = await CategoriaModel.buscarPorId(organizacionId, id);

            if (!categoria) {
                return res.status(404).json({
                    success: false,
                    error: 'Categoría no encontrada'
                });
            }

            res.json({
                success: true,
                data: categoria
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /categorias-profesional/:id/profesionales
     */
    static async obtenerProfesionales(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const { id } = req.params;

            const profesionales = await CategoriaModel.obtenerProfesionales(organizacionId, id);

            res.json({
                success: true,
                data: profesionales,
                meta: {
                    total: profesionales.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /categorias-profesional/:id
     */
    static async actualizar(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const { id } = req.params;
            const data = req.body;

            const categoria = await CategoriaModel.actualizar(organizacionId, id, data);

            logger.info(`Categoría actualizada: ${categoria.nombre}`, {
                organizacionId,
                categoriaId: id,
                usuario: req.user.email
            });

            res.json({
                success: true,
                data: categoria
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /categorias-profesional/:id
     */
    static async eliminar(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const { id } = req.params;

            const eliminado = await CategoriaModel.eliminar(organizacionId, id);

            if (!eliminado) {
                return res.status(404).json({
                    success: false,
                    error: 'Categoría no encontrada'
                });
            }

            logger.info(`Categoría eliminada: ${id}`, {
                organizacionId,
                categoriaId: id,
                usuario: req.user.email
            });

            res.json({
                success: true,
                message: 'Categoría eliminada correctamente'
            });
        } catch (error) {
            next(error);
        }
    }

}

module.exports = CategoriaController;
