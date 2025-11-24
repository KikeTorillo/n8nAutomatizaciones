const { PerfilesMarketplaceModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

/**
 * ====================================================================
 * CONTROLLER - PERFILES DE MARKETPLACE
 * ====================================================================
 *
 * Gestiona perfiles públicos de negocios en el directorio marketplace.
 *
 * ENDPOINTS (7):
 * • POST   /perfiles           - Crear perfil (requiere auth)
 * • PUT    /perfiles/:id       - Actualizar perfil (requiere auth)
 * • PATCH  /perfiles/:id/activar - Activar/desactivar (solo super_admin)
 * • GET    /perfiles/buscar    - Búsqueda pública (sin auth)
 * • GET    /perfiles/slug/:slug - Obtener por slug (sin auth)
 * • GET    /perfiles/:id       - Obtener perfil (requiere auth)
 * • GET    /perfiles/:id/estadisticas - Stats del perfil (requiere auth)
 *
 * Fecha creación: 17 Noviembre 2025
 */
class PerfilesMarketplaceController {

    /**
     * Crear perfil de marketplace para una organización
     * POST /api/v1/marketplace/perfiles
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Validar que la organización no tenga ya un perfil
        const perfilExistente = await PerfilesMarketplaceModel.obtenerPorOrganizacion(organizacionId);
        if (perfilExistente) {
            return ResponseHelper.error(
                res,
                'Esta organización ya tiene un perfil de marketplace',
                409
            );
        }

        const datosPerfil = {
            ...req.body,
            organizacion_id: organizacionId
        };

        const perfilCreado = await PerfilesMarketplaceModel.crear(datosPerfil);

        return ResponseHelper.success(
            res,
            perfilCreado,
            'Perfil de marketplace creado exitosamente. Pendiente de activación por administrador.',
            201
        );
    });

    /**
     * Actualizar perfil de marketplace
     * PUT /api/v1/marketplace/perfiles/:id
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        // Verificar que el perfil pertenece a la organización
        const perfilExistente = await PerfilesMarketplaceModel.obtenerPorId(parseInt(id), organizacionId);
        if (!perfilExistente) {
            return ResponseHelper.error(
                res,
                'Perfil no encontrado',
                404
            );
        }

        const datosActualizados = req.body;

        const perfilActualizado = await PerfilesMarketplaceModel.actualizar(
            parseInt(id),
            datosActualizados,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            perfilActualizado,
            'Perfil actualizado exitosamente'
        );
    });

    /**
     * Activar/Desactivar perfil de marketplace
     * PATCH /api/v1/marketplace/perfiles/:id/activar
     *
     * @requires auth - solo super_admin
     * @note Usa bypass RLS para acceder a cualquier perfil
     */
    static activar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { activo } = req.body;

        // Validar que el usuario sea super_admin (middleware ya lo valida)
        if (req.user.rol !== 'super_admin') {
            return ResponseHelper.error(
                res,
                'Solo super administradores pueden activar/desactivar perfiles',
                403
            );
        }

        const perfilActualizado = await PerfilesMarketplaceModel.activar(parseInt(id), activo);

        if (!perfilActualizado) {
            return ResponseHelper.error(
                res,
                'Perfil no encontrado',
                404
            );
        }

        const mensaje = activo
            ? 'Perfil activado exitosamente. Ahora es visible en el directorio público.'
            : 'Perfil desactivado. Ya no es visible en el directorio público.';

        return ResponseHelper.success(
            res,
            perfilActualizado,
            mensaje
        );
    });

    /**
     * Búsqueda pública de perfiles en el marketplace
     * GET /api/v1/marketplace/perfiles/buscar
     *
     * @public Sin autenticación requerida
     * @note Usa RLS policy PUBLIC para acceder solo a perfiles activos y visibles
     */
    static buscar = asyncHandler(async (req, res) => {
        const filtros = {
            q: req.query.q || undefined,              // Búsqueda full-text
            ciudad: req.query.ciudad || undefined,
            estado: req.query.estado || undefined,
            pais: req.query.pais || undefined,
            rating_minimo: req.query.rating_minimo ? parseFloat(req.query.rating_minimo) : undefined,
            orden: req.query.orden || 'rating',       // rating, reseñas, reciente, alfabetico
            pagina: req.query.pagina ? parseInt(req.query.pagina) : 1,
            limite: req.query.limite ? parseInt(req.query.limite) : 12
        };

        const resultado = await PerfilesMarketplaceModel.buscar(filtros);

        return ResponseHelper.success(
            res,
            resultado,
            'Búsqueda completada exitosamente'
        );
    });

    /**
     * Obtener perfil completo por slug (público)
     * GET /api/v1/marketplace/perfiles/slug/:slug
     *
     * @public Sin autenticación requerida
     * @note Usa función PL/pgSQL optimizada con CTEs
     * @note Retorna: perfil + servicios + profesionales + reseñas + stats
     */
    static obtenerPorSlug = asyncHandler(async (req, res) => {
        const { slug } = req.params;

        const perfilCompleto = await PerfilesMarketplaceModel.obtenerPorSlug(slug);

        if (!perfilCompleto) {
            return ResponseHelper.error(
                res,
                'Perfil no encontrado o no está activo',
                404
            );
        }

        return ResponseHelper.success(
            res,
            perfilCompleto,
            'Perfil obtenido exitosamente'
        );
    });

    /**
     * Obtener perfil por ID (privado)
     * GET /api/v1/marketplace/perfiles/:id
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const perfil = await PerfilesMarketplaceModel.obtenerPorId(parseInt(id), organizacionId);

        if (!perfil) {
            return ResponseHelper.error(
                res,
                'Perfil no encontrado',
                404
            );
        }

        return ResponseHelper.success(
            res,
            perfil,
            'Perfil obtenido exitosamente'
        );
    });

    /**
     * Obtener estadísticas del perfil
     * GET /api/v1/marketplace/perfiles/:id/estadisticas
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     * @note Retorna: vistas, clics, conversión, tendencias
     */
    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        // Validar que el perfil pertenece a la organización
        const perfilExistente = await PerfilesMarketplaceModel.obtenerPorId(parseInt(id), organizacionId);
        if (!perfilExistente) {
            return ResponseHelper.error(
                res,
                'Perfil no encontrado',
                404
            );
        }

        const filtros = {
            fecha_inicio: req.query.fecha_inicio || undefined,
            fecha_fin: req.query.fecha_fin || undefined
        };

        const estadisticas = await PerfilesMarketplaceModel.obtenerEstadisticas(parseInt(id), filtros);

        return ResponseHelper.success(
            res,
            estadisticas,
            'Estadísticas obtenidas exitosamente'
        );
    });

    /**
     * Obtener mi perfil de marketplace
     * GET /api/v1/marketplace/perfiles/mi-perfil
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     * @note Retorna el perfil de la organización del usuario logueado
     */
    static obtenerMiPerfil = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const perfil = await PerfilesMarketplaceModel.obtenerPorOrganizacion(organizacionId);

        if (!perfil) {
            return ResponseHelper.success(
                res,
                null,
                'No tienes un perfil de marketplace'
            );
        }

        return ResponseHelper.success(
            res,
            perfil,
            'Perfil obtenido exitosamente'
        );
    });

    /**
     * Listar TODOS los perfiles para super admin
     * GET /api/v1/superadmin/marketplace/perfiles
     *
     * @requires auth - solo super_admin
     * @note Usa bypass RLS para acceder a perfiles activos e inactivos
     * @note Incluye datos de organización (nombre, plan, estado)
     */
    static listarParaAdmin = asyncHandler(async (req, res) => {
        // Validar que el usuario sea super_admin (middleware ya lo valida)
        if (req.user.rol !== 'super_admin') {
            return ResponseHelper.error(
                res,
                'Solo super administradores pueden listar todos los perfiles',
                403
            );
        }

        const filtros = {
            activo: req.query.activo !== undefined
                ? req.query.activo === 'true'
                : undefined,
            ciudad: req.query.ciudad || undefined,
            rating_min: req.query.rating_min ? parseFloat(req.query.rating_min) : undefined,
            pagina: req.query.pagina ? parseInt(req.query.pagina) : 1,
            limite: req.query.limite ? parseInt(req.query.limite) : 20
        };

        const resultado = await PerfilesMarketplaceModel.listarTodosParaAdmin(filtros);

        return ResponseHelper.success(
            res,
            resultado,
            'Perfiles obtenidos exitosamente'
        );
    });
}

module.exports = PerfilesMarketplaceController;
