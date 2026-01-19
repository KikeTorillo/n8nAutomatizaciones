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
 * Razón: Verificación de rol super_admin inline en cada método,
 * no usa organizacionId (entidad global), listarPorTipo custom.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const PlantillaModel = require('../models/plantilla.model');
const { ResponseHelper } = require('../../../utils/helpers');

class PlantillasController {
    /**
     * GET /plantillas
     * Listar plantillas (público)
     */
    static async listar(req, res) {
        try {
            const { tipo_evento, es_premium } = req.query;

            const plantillas = await PlantillaModel.listar({
                tipo_evento,
                es_premium: es_premium === 'true' ? true : es_premium === 'false' ? false : undefined
            });

            return ResponseHelper.success(res, {
                plantillas,
                total: plantillas.length
            });
        } catch (error) {
            console.error('Error al listar plantillas:', error);
            return ResponseHelper.error(res, 'Error al listar plantillas', 500);
        }
    }

    /**
     * GET /plantillas/:id
     * Obtener plantilla por ID (público)
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;

            const plantilla = await PlantillaModel.obtenerPorId(id);

            if (!plantilla) {
                return ResponseHelper.error(res, 'Plantilla no encontrada', 404);
            }

            return ResponseHelper.success(res, plantilla);
        } catch (error) {
            console.error('Error al obtener plantilla:', error);
            return ResponseHelper.error(res, 'Error al obtener plantilla', 500);
        }
    }

    /**
     * POST /plantillas
     * Crear plantilla (solo super_admin)
     */
    static async crear(req, res) {
        try {
            // Verificar que es super_admin
            if (req.user.rol !== 'super_admin') {
                return ResponseHelper.error(res, 'Solo super_admin puede crear plantillas', 403);
            }

            const plantilla = await PlantillaModel.crear(req.body);

            return ResponseHelper.success(res, plantilla, 'Plantilla creada exitosamente', 201);
        } catch (error) {
            console.error('Error al crear plantilla:', error);

            if (error.code === '23505') {
                return ResponseHelper.error(res, 'Ya existe una plantilla con ese código', 400);
            }

            return ResponseHelper.error(res, 'Error al crear plantilla', 500);
        }
    }

    /**
     * PUT /plantillas/:id
     * Actualizar plantilla (solo super_admin)
     */
    static async actualizar(req, res) {
        try {
            // Verificar que es super_admin
            if (req.user.rol !== 'super_admin') {
                return ResponseHelper.error(res, 'Solo super_admin puede actualizar plantillas', 403);
            }

            const { id } = req.params;

            // Verificar que existe
            const plantillaExistente = await PlantillaModel.obtenerPorId(id);
            if (!plantillaExistente) {
                return ResponseHelper.error(res, 'Plantilla no encontrada', 404);
            }

            const plantilla = await PlantillaModel.actualizar(id, req.body);

            return ResponseHelper.success(res, plantilla, 'Plantilla actualizada exitosamente');
        } catch (error) {
            console.error('Error al actualizar plantilla:', error);
            return ResponseHelper.error(res, 'Error al actualizar plantilla', 500);
        }
    }

    /**
     * DELETE /plantillas/:id
     * Eliminar plantilla (solo super_admin)
     */
    static async eliminar(req, res) {
        try {
            // Verificar que es super_admin
            if (req.user.rol !== 'super_admin') {
                return ResponseHelper.error(res, 'Solo super_admin puede eliminar plantillas', 403);
            }

            const { id } = req.params;

            // Verificar que existe
            const plantilla = await PlantillaModel.obtenerPorId(id);
            if (!plantilla) {
                return ResponseHelper.error(res, 'Plantilla no encontrada', 404);
            }

            const resultado = await PlantillaModel.eliminar(id);

            if (resultado.desactivado) {
                return ResponseHelper.success(res, { id: parseInt(id), desactivado: true },
                    'Plantilla desactivada (está en uso por eventos existentes)');
            }

            return ResponseHelper.success(res, { id: parseInt(id) }, 'Plantilla eliminada exitosamente');
        } catch (error) {
            console.error('Error al eliminar plantilla:', error);
            return ResponseHelper.error(res, 'Error al eliminar plantilla', 500);
        }
    }

    /**
     * GET /plantillas/tipo/:tipoEvento
     * Listar plantillas por tipo de evento
     */
    static async listarPorTipo(req, res) {
        try {
            const { tipoEvento } = req.params;

            const plantillas = await PlantillaModel.listarPorTipo(tipoEvento);

            return ResponseHelper.success(res, {
                plantillas,
                tipo_evento: tipoEvento,
                total: plantillas.length
            });
        } catch (error) {
            console.error('Error al listar plantillas por tipo:', error);
            return ResponseHelper.error(res, 'Error al listar plantillas', 500);
        }
    }
}

module.exports = PlantillasController;
