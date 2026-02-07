/**
 * ====================================================================
 * CONTROLLER: PLANTILLAS DE EVENTOS
 * ====================================================================
 * Gestión de plantillas de diseño.
 * Lectura pública, escritura solo super_admin.
 *
 * ENDPOINTS (6):
 * - GET    /plantillas              - Listar plantillas (público)
 * - GET    /plantillas/:id          - Obtener plantilla (público)
 * - POST   /plantillas              - Crear plantilla (super_admin)
 * - PUT    /plantillas/:id          - Actualizar plantilla (super_admin)
 * - DELETE /plantillas/:id          - Eliminar plantilla (super_admin)
 * - GET    /plantillas/tipo/:tipo   - Listar por tipo de evento
 *
 * NO MIGRADO A BaseCrudController - Ene 2026
 * Razón: No usa organizacionId (entidad global), listarPorTipo custom.
 *
 * REFACTORIZADO Feb 2026: Migrado a asyncHandler, verificación
 * de super_admin movida a middleware requireRole en rutas.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const PlantillaModel = require('../models/plantilla.model');
const { ResponseHelper } = require('../../../utils/helpers');
const { ResourceNotFoundError, DuplicateResourceError } = require('../../../utils/errors');
const asyncHandler = require('../../../middleware/asyncHandler');
const logger = require('../../../utils/logger');

class PlantillasController {
    /**
     * GET /plantillas
     * Listar plantillas (público)
     */
    static listar = asyncHandler(async (req, res) => {
        const { tipo_evento, es_premium } = req.query;

        const plantillas = await PlantillaModel.listar({
            tipo_evento,
            es_premium: es_premium === 'true' ? true : es_premium === 'false' ? false : undefined
        });

        return ResponseHelper.success(res, {
            plantillas,
            total: plantillas.length
        });
    });

    /**
     * GET /plantillas/:id
     * Obtener plantilla por ID (público)
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const plantilla = await PlantillaModel.obtenerPorId(id);

        if (!plantilla) {
            throw new ResourceNotFoundError('Plantilla', id);
        }

        return ResponseHelper.success(res, plantilla);
    });

    /**
     * POST /plantillas
     * Crear plantilla (super_admin - verificado en middleware)
     */
    static crear = asyncHandler(async (req, res) => {
        const plantilla = await PlantillaModel.crear(req.body);

        logger.info('[PlantillasController.crear] Plantilla creada', {
            plantilla_id: plantilla.id,
            codigo: plantilla.codigo,
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, plantilla, 'Plantilla creada exitosamente', 201);
    });

    /**
     * PUT /plantillas/:id
     * Actualizar plantilla (super_admin - verificado en middleware)
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Verificar que existe
        const plantillaExistente = await PlantillaModel.obtenerPorId(id);
        if (!plantillaExistente) {
            throw new ResourceNotFoundError('Plantilla', id);
        }

        const plantilla = await PlantillaModel.actualizar(id, req.body);

        logger.info('[PlantillasController.actualizar] Plantilla actualizada', {
            plantilla_id: id,
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, plantilla, 'Plantilla actualizada exitosamente');
    });

    /**
     * DELETE /plantillas/:id
     * Eliminar plantilla (super_admin - verificado en middleware)
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Verificar que existe
        const plantilla = await PlantillaModel.obtenerPorId(id);
        if (!plantilla) {
            throw new ResourceNotFoundError('Plantilla', id);
        }

        const resultado = await PlantillaModel.eliminar(id);

        logger.info('[PlantillasController.eliminar] Plantilla eliminada', {
            plantilla_id: id,
            desactivado: resultado.desactivado || false,
            usuario_id: req.user.id
        });

        if (resultado.desactivado) {
            return ResponseHelper.success(res, { id: parseInt(id), desactivado: true },
                'Plantilla desactivada (está en uso por eventos existentes)');
        }

        return ResponseHelper.success(res, { id: parseInt(id) }, 'Plantilla eliminada exitosamente');
    });

    /**
     * GET /plantillas/:id/bloques
     * Obtener bloques de una plantilla
     */
    static obtenerBloques = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const plantilla = await PlantillaModel.obtenerPorId(id);
        if (!plantilla) {
            throw new ResourceNotFoundError('Plantilla', id);
        }

        const bloques = await PlantillaModel.obtenerBloques(id);

        return ResponseHelper.success(res, { bloques: bloques || [] });
    });

    /**
     * PUT /plantillas/:id/bloques
     * Guardar bloques de una plantilla (super_admin)
     */
    static guardarBloques = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { bloques } = req.body;

        const plantilla = await PlantillaModel.obtenerPorId(id);
        if (!plantilla) {
            throw new ResourceNotFoundError('Plantilla', id);
        }

        const resultado = await PlantillaModel.guardarBloques(id, bloques);

        logger.info('[PlantillasController.guardarBloques] Bloques guardados', {
            plantilla_id: id,
            total_bloques: bloques.length,
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, resultado, 'Bloques guardados exitosamente');
    });

    /**
     * GET /plantillas/tipo/:tipoEvento
     * Listar plantillas por tipo de evento
     */
    static listarPorTipo = asyncHandler(async (req, res) => {
        const { tipoEvento } = req.params;

        const plantillas = await PlantillaModel.listarPorTipo(tipoEvento);

        return ResponseHelper.success(res, {
            plantillas,
            tipo_evento: tipoEvento,
            total: plantillas.length
        });
    });
}

module.exports = PlantillasController;
