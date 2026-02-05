/**
 * ====================================================================
 * CONTROLLER - EVENTOS DIGITALES
 * ====================================================================
 * Controlador para gestión de eventos con invitaciones digitales.
 *
 * ENDPOINTS (7):
 * - POST   /eventos              - Crear evento
 * - GET    /eventos              - Listar eventos
 * - GET    /eventos/:id          - Obtener evento por ID
 * - PUT    /eventos/:id          - Actualizar evento
 * - POST   /eventos/:id/publicar - Publicar evento
 * - GET    /eventos/:id/estadisticas - Estadísticas del evento
 * - DELETE /eventos/:id          - Eliminar evento
 *
 * NO MIGRADO A BaseCrudController - Ene 2026
 * Razón: Métodos custom publicar() y estadisticas(), lógica de
 * estados de evento, no sigue firma estándar del Model.
 *
 * REFACTORIZADO Feb 2026: Migrado a asyncHandler
 *
 * Fecha creación: 4 Diciembre 2025
 */

const EventoModel = require('../models/evento.model');
const PlantillaModel = require('../models/plantilla.model');
const BloquesInvitacionModel = require('../models/bloquesInvitacion.model');
const logger = require('../../../utils/logger');
const { ResponseHelper, LimitesHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const { ResourceNotFoundError } = require('../../../utils/errors');
const { v4: uuidv4 } = require('uuid');

class EventosController {

    /**
     * Crear evento
     * POST /api/v1/eventos-digitales/eventos
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        // Verificar límite de eventos activos
        await LimitesHelper.verificarLimiteOLanzar(organizacionId, 'eventos_activos', 1);

        const datos = {
            ...req.body,
            organizacion_id: organizacionId
        };

        // Si viene plantilla_id pero no se envió tema (plantilla), obtenerlo de la plantilla
        if (datos.plantilla_id && !datos.plantilla) {
            const plantilla = await PlantillaModel.obtenerPorId(datos.plantilla_id);
            if (plantilla?.tema) {
                datos.plantilla = plantilla.tema;
            }
        }

        const evento = await EventoModel.crear(datos);

        // Generar bloques iniciales si tiene plantilla
        if (datos.plantilla_id || datos.plantilla) {
            const bloquesIniciales = generarBloquesIniciales(datos.tipo, evento.nombre);
            if (bloquesIniciales.length > 0) {
                await BloquesInvitacionModel.guardarBloques(
                    evento.id,
                    bloquesIniciales,
                    organizacionId
                );
            }
        }

        logger.info('[EventosController.crear] Evento creado', {
            evento_id: evento.id,
            organizacion_id: organizacionId,
            usuario_id: req.user.id,
            con_plantilla: !!(datos.plantilla_id || datos.plantilla)
        });

        return ResponseHelper.success(res, evento, 'Evento creado exitosamente', 201);
    });

    /**
     * Listar eventos de la organización
     * GET /api/v1/eventos-digitales/eventos
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;
        const filtros = req.query;

        const resultado = await EventoModel.listar(organizacionId, filtros);

        return ResponseHelper.success(res, resultado);
    });

    /**
     * Obtener evento por ID
     * GET /api/v1/eventos-digitales/eventos/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const evento = await EventoModel.obtenerPorId(parseInt(id), organizacionId);

        if (!evento) {
            throw new ResourceNotFoundError('Evento', id);
        }

        return ResponseHelper.success(res, evento);
    });

    /**
     * Actualizar evento
     * PUT /api/v1/eventos-digitales/eventos/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        // Verificar límite de fotos si se actualiza galeria_urls
        if (req.body.galeria_urls && Array.isArray(req.body.galeria_urls)) {
            const cantidadFotos = req.body.galeria_urls.length;
            await LimitesHelper.verificarLimiteFotosGaleriaOLanzar(
                organizacionId,
                parseInt(id),
                cantidadFotos
            );
        }

        const evento = await EventoModel.actualizar(parseInt(id), req.body, organizacionId);

        if (!evento) {
            throw new ResourceNotFoundError('Evento', id);
        }

        logger.info('[EventosController.actualizar] Evento actualizado', {
            evento_id: id,
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, evento, 'Evento actualizado exitosamente');
    });

    /**
     * Publicar evento
     * POST /api/v1/eventos-digitales/eventos/:id/publicar
     */
    static publicar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const evento = await EventoModel.publicar(parseInt(id), organizacionId);

        logger.info('[EventosController.publicar] Evento publicado', {
            evento_id: id,
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, evento, 'Evento publicado exitosamente');
    });

    /**
     * Obtener estadísticas del evento
     * GET /api/v1/eventos-digitales/eventos/:id/estadisticas
     */
    static estadisticas = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const estadisticas = await EventoModel.obtenerEstadisticas(parseInt(id), organizacionId);

        return ResponseHelper.success(res, estadisticas);
    });

    /**
     * Eliminar evento (soft delete)
     * DELETE /api/v1/eventos-digitales/eventos/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const eliminado = await EventoModel.eliminar(parseInt(id), organizacionId);

        if (!eliminado) {
            throw new ResourceNotFoundError('Evento', id);
        }

        logger.info('[EventosController.eliminar] Evento eliminado', {
            evento_id: id,
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, { id: parseInt(id) }, 'Evento eliminado exitosamente');
    });
}

/**
 * Genera bloques iniciales según tipo de evento
 */
function generarBloquesIniciales(tipoEvento, nombreEvento) {
    const bloques = [
        {
            id: uuidv4(),
            tipo: 'hero_invitacion',
            orden: 0,
            visible: true,
            contenido: {
                titulo: nombreEvento || '',
                subtitulo: '',
                imagen_url: '',
                alineacion: 'center',
                imagen_overlay: 0.3,
                tipo_overlay: 'uniforme',
                color_overlay: '#000000',
                altura: 'full',
                mostrar_calendario: true,
            },
            estilos: {},
        },
        {
            id: uuidv4(),
            tipo: 'countdown',
            orden: 1,
            visible: true,
            contenido: {
                titulo: 'Faltan',
                texto_finalizado: '¡Llegó el gran día!',
                estilo: 'cajas',
                mostrar_segundos: false,
            },
            estilos: {},
        },
        {
            id: uuidv4(),
            tipo: 'timeline',
            orden: 2,
            visible: true,
            contenido: {
                titulo_seccion: 'Itinerario del Día',
                subtitulo_seccion: '',
                items: [],
                layout: 'alternado',
                color_linea: '',
            },
            estilos: {},
        },
        {
            id: uuidv4(),
            tipo: 'ubicacion',
            orden: 3,
            visible: true,
            contenido: {
                titulo: 'Ubicación',
                subtitulo: '',
                mostrar_todas: true,
                ubicacion_id: null,
                mostrar_mapa: true,
                altura_mapa: 300,
            },
            estilos: {},
        },
        {
            id: uuidv4(),
            tipo: 'rsvp',
            orden: 4,
            visible: true,
            contenido: {
                titulo: 'Confirma tu Asistencia',
                subtitulo: '',
                texto_confirmado: '¡Gracias por confirmar!',
                texto_rechazado: 'Lamentamos que no puedas asistir',
                pedir_restricciones: false,
            },
            estilos: {},
        },
    ];

    // Agregar mesa de regalos para bodas, XV años y bautizos
    if (['boda', 'xv_anos', 'bautizo'].includes(tipoEvento)) {
        bloques.push({
            id: uuidv4(),
            tipo: 'mesa_regalos',
            orden: 5,
            visible: true,
            contenido: {
                titulo: 'Mesa de Regalos',
                subtitulo: 'Tu presencia es nuestro mejor regalo',
                usar_mesa_evento: true,
                items: [],
                layout: 'grid',
            },
            estilos: {},
        });
    }

    return bloques;
}

module.exports = EventosController;
