const { ReseñasMarketplaceModel } = require('../../database/marketplace');
const { ResponseHelper } = require('../../utils/helpers');
const { asyncHandler } = require('../../middleware');

/**
 * ====================================================================
 * CONTROLLER - RESEÑAS DE MARKETPLACE
 * ====================================================================
 *
 * Gestiona reseñas de clientes sobre negocios del marketplace.
 *
 * ENDPOINTS (4):
 * • POST   /reseñas                           - Crear reseña (requiere auth)
 * • POST   /reseñas/:id/responder             - Responder reseña (negocio)
 * • PATCH  /reseñas/:id/moderar               - Moderar reseña (admin)
 * • GET    /reseñas/negocio/:organizacion_id  - Listar reseñas (público)
 *
 * REGLAS DE NEGOCIO:
 * • Solo clientes con cita completada pueden dejar reseña
 * • Una reseña por cita (constraint UNIQUE en BD)
 * • Rating 1-5 estrellas obligatorio
 * • Solo negocios pueden responder a sus reseñas
 * • Solo admin/propietario pueden moderar
 *
 * Fecha creación: 17 Noviembre 2025
 */
class ReseñasMarketplaceController {

    /**
     * Crear reseña de cliente
     * POST /api/v1/marketplace/reseñas
     *
     * @requires auth - cliente con cita completada
     * @requires tenant - organizacionId desde RLS context
     * @note El trigger actualiza automáticamente stats del perfil
     */
    static crear = asyncHandler(async (req, res) => {
        const { cita_id, fecha_cita, rating, titulo, comentario, profesional_id } = req.body;
        const clienteId = req.user.cliente_id; // Usuario debe tener cliente asociado
        const organizacionId = req.tenant.organizacionId;

        // Validar que el usuario sea un cliente
        if (!clienteId) {
            return ResponseHelper.error(
                res,
                'Solo clientes pueden dejar reseñas',
                403
            );
        }

        // Validar que la cita existe, está completada y pertenece al cliente
        const citaValida = await ReseñasMarketplaceModel.validarCitaParaReseña(
            cita_id,
            fecha_cita,
            clienteId,
            organizacionId
        );

        if (!citaValida.valida) {
            return ResponseHelper.error(
                res,
                citaValida.mensaje,
                400
            );
        }

        // Validar que no exista ya una reseña para esta cita
        const reseñaExistente = await ReseñasMarketplaceModel.verificarReseñaExistente(
            cita_id,
            fecha_cita
        );

        if (reseñaExistente) {
            return ResponseHelper.error(
                res,
                'Ya existe una reseña para esta cita',
                409
            );
        }

        const datosReseña = {
            organizacion_id: citaValida.organizacion_id,
            cliente_id: clienteId,
            cita_id,
            fecha_cita,
            profesional_id: profesional_id || null,
            rating,
            titulo: titulo || null,
            comentario: comentario || null
        };

        const reseñaCreada = await ReseñasMarketplaceModel.crear(datosReseña);

        return ResponseHelper.success(
            res,
            reseñaCreada,
            'Reseña creada exitosamente. ¡Gracias por tu opinión!',
            201
        );
    });

    /**
     * Responder a una reseña (solo el negocio)
     * POST /api/v1/marketplace/reseñas/:id/responder
     *
     * @requires auth - admin o propietario del negocio
     * @requires tenant - organizacionId desde RLS context
     */
    static responder = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { respuesta_negocio } = req.body;
        const organizacionId = req.tenant.organizacionId;
        const userId = req.user.id;

        // Validar que el usuario sea admin o propietario
        if (!['admin', 'propietario'].includes(req.user.rol)) {
            return ResponseHelper.error(
                res,
                'Solo administradores pueden responder reseñas',
                403
            );
        }

        // Verificar que la reseña existe y pertenece a la organización
        const reseña = await ReseñasMarketplaceModel.obtenerPorId(parseInt(id), organizacionId);

        if (!reseña) {
            return ResponseHelper.error(
                res,
                'Reseña no encontrada',
                404
            );
        }

        // Validar que la reseña esté publicada
        if (reseña.estado !== 'publicada') {
            return ResponseHelper.error(
                res,
                'Solo se pueden responder reseñas publicadas',
                400
            );
        }

        const datosRespuesta = {
            respuesta_negocio,
            respondido_por: userId
        };

        const reseñaActualizada = await ReseñasMarketplaceModel.responder(
            parseInt(id),
            datosRespuesta,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            reseñaActualizada,
            'Respuesta publicada exitosamente'
        );
    });

    /**
     * Moderar reseña (cambiar estado)
     * PATCH /api/v1/marketplace/reseñas/:id/moderar
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     * @note Estados: pendiente, publicada, reportada, oculta
     */
    static moderar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { estado, motivo_reporte } = req.body;
        const organizacionId = req.tenant.organizacionId;
        const userId = req.user.id;

        // Validar que el usuario sea admin o propietario
        if (!['admin', 'propietario'].includes(req.user.rol)) {
            return ResponseHelper.error(
                res,
                'Solo administradores pueden moderar reseñas',
                403
            );
        }

        // Verificar que la reseña existe y pertenece a la organización
        const reseña = await ReseñasMarketplaceModel.obtenerPorId(parseInt(id), organizacionId);

        if (!reseña) {
            return ResponseHelper.error(
                res,
                'Reseña no encontrada',
                404
            );
        }

        // Validar que si el estado es 'reportada' u 'oculta', se proporcione motivo
        if (['reportada', 'oculta'].includes(estado) && !motivo_reporte) {
            return ResponseHelper.error(
                res,
                'Debe proporcionar un motivo para reportar u ocultar la reseña',
                400
            );
        }

        const datosModeracion = {
            estado,
            motivo_reporte: motivo_reporte || null,
            moderada_por: userId
        };

        const reseñaActualizada = await ReseñasMarketplaceModel.moderar(
            parseInt(id),
            datosModeracion,
            organizacionId
        );

        const mensajes = {
            pendiente: 'Reseña marcada como pendiente de revisión',
            publicada: 'Reseña publicada exitosamente',
            reportada: 'Reseña reportada. Será revisada por el equipo',
            oculta: 'Reseña ocultada. No será visible públicamente'
        };

        return ResponseHelper.success(
            res,
            reseñaActualizada,
            mensajes[estado] || 'Reseña moderada exitosamente'
        );
    });

    /**
     * Listar reseñas de un negocio
     * GET /api/v1/marketplace/reseñas/negocio/:organizacion_id
     *
     * @public Acceso público (solo muestra reseñas publicadas por defecto)
     * @note Si está autenticado y es del negocio, puede ver todas sus reseñas
     */
    static listar = asyncHandler(async (req, res) => {
        const { organizacion_id } = req.params;

        const filtros = {
            estado: req.query.estado || 'publicada',  // Por defecto solo publicadas
            rating_minimo: req.query.rating_minimo ? parseInt(req.query.rating_minimo) : undefined,
            pagina: req.query.pagina ? parseInt(req.query.pagina) : 1,
            limite: req.query.limite ? parseInt(req.query.limite) : 10
        };

        // Si el usuario está autenticado y es de la misma organización,
        // puede ver reseñas en cualquier estado
        const esDelNegocio = req.user && req.tenant && req.tenant.organizacionId === parseInt(organizacion_id);

        // Si no es del negocio, forzar estado 'publicada'
        if (!esDelNegocio) {
            filtros.estado = 'publicada';
        }

        const resultado = await ReseñasMarketplaceModel.listar(
            parseInt(organizacion_id),
            filtros
        );

        return ResponseHelper.success(
            res,
            resultado,
            'Reseñas obtenidas exitosamente'
        );
    });
}

module.exports = ReseñasMarketplaceController;
