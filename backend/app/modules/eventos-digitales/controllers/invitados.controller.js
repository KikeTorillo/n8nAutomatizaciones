/**
 * ====================================================================
 * CONTROLLER - INVITADOS DE EVENTOS
 * ====================================================================
 * Controlador para gestión de invitados y RSVP.
 *
 * ENDPOINTS (13):
 * - POST   /eventos/:eventoId/invitados           - Crear invitado
 * - POST   /eventos/:eventoId/invitados/importar  - Importar masivo
 * - GET    /eventos/:eventoId/invitados           - Listar invitados
 * - PUT    /invitados/:id                         - Actualizar invitado
 * - DELETE /invitados/:id                         - Eliminar invitado
 * - GET    /eventos/:eventoId/invitados/exportar  - Exportar CSV
 * - GET    /eventos/:eventoId/grupos              - Grupos familiares
 * - GET    /eventos/:eventoId/etiquetas           - Etiquetas
 * - GET    /eventos/:eventoId/invitados/:id/qr    - Generar QR individual
 * - GET    /eventos/:eventoId/qr-masivo           - Generar ZIP de QRs
 * - POST   /eventos/:eventoId/checkin             - Registrar check-in
 * - GET    /eventos/:eventoId/checkin/stats       - Estadísticas check-in
 * - GET    /eventos/:eventoId/checkin/lista       - Lista de check-ins
 *
 * NO MIGRADO A BaseCrudController - Ene 2026
 * Razón: 8+ métodos custom (importar, exportar, QR, check-in, grupos),
 * depende de eventoId, lógica compleja de RSVP y check-in.
 *
 * REFACTORIZADO Feb 2026: Migrado a asyncHandler + qr.service
 *
 * Fecha creación: 4 Diciembre 2025
 */

const InvitadoModel = require('../models/invitado.model');
const EventoModel = require('../models/evento.model');
const logger = require('../../../utils/logger');
const { ResponseHelper, LimitesHelper } = require('../../../utils/helpers');
const { ResourceNotFoundError, ValidationError } = require('../../../utils/errors');
const asyncHandler = require('../../../middleware/asyncHandler');
const archiver = require('archiver');

// Usar servicio centralizado de QR
const {
    generarQRInvitado,
    generarQRBuffer,
    generarUrlInvitacion,
    generarNombreArchivoQR
} = require('../services/qr.service');

class InvitadosController {

    /**
     * Crear invitado
     * POST /api/v1/eventos-digitales/eventos/:eventoId/invitados
     */
    static crear = asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        // Verificar límite de invitados por evento
        await LimitesHelper.verificarLimiteInvitadosOLanzar(
            organizacionId,
            parseInt(eventoId),
            1
        );

        const datos = {
            ...req.body,
            organizacion_id: organizacionId,
            evento_id: parseInt(eventoId)
        };

        const invitado = await InvitadoModel.crear(datos);

        logger.info('[InvitadosController.crear] Invitado creado', {
            invitado_id: invitado.id,
            evento_id: eventoId
        });

        return ResponseHelper.success(res, invitado, 'Invitado creado exitosamente', 201);
    });

    /**
     * Importar invitados masivamente
     * POST /api/v1/eventos-digitales/eventos/:eventoId/invitados/importar
     */
    static importar = asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;
        const { invitados } = req.body;

        // Verificar límite de invitados antes de importar
        const cantidadAImportar = invitados?.length || 0;
        const verificacion = await LimitesHelper.verificarLimiteInvitados(
            organizacionId,
            parseInt(eventoId),
            cantidadAImportar
        );

        if (!verificacion.puedeCrear) {
            return ResponseHelper.error(
                res,
                `No puedes importar ${cantidadAImportar} invitados. ` +
                `Límite: ${verificacion.limite}, Usados: ${verificacion.usoActual}, ` +
                `Disponibles: ${verificacion.disponible}`,
                403,
                {
                    code: 'PLAN_LIMIT_EXCEEDED',
                    details: {
                        recurso: 'invitados por evento',
                        limite: verificacion.limite,
                        uso_actual: verificacion.usoActual,
                        disponible: verificacion.disponible,
                        cantidad_solicitada: cantidadAImportar,
                        plan: verificacion.nombrePlan
                    }
                }
            );
        }

        const resultado = await InvitadoModel.crearMasivo(
            parseInt(eventoId),
            organizacionId,
            invitados
        );

        logger.info('[InvitadosController.importar] Importación completada', {
            evento_id: eventoId,
            creados: resultado.creados.length,
            errores: resultado.errores.length
        });

        return ResponseHelper.success(res, resultado, `${resultado.creados.length} invitados importados`);
    });

    /**
     * Listar invitados del evento
     * GET /api/v1/eventos-digitales/eventos/:eventoId/invitados
     */
    static listar = asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;
        const filtros = req.query;

        const resultado = await InvitadoModel.listar(
            parseInt(eventoId),
            organizacionId,
            filtros
        );

        return ResponseHelper.success(res, resultado);
    });

    /**
     * Actualizar invitado
     * PUT /api/v1/eventos-digitales/invitados/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const invitado = await InvitadoModel.actualizar(
            parseInt(id),
            req.body,
            organizacionId
        );

        if (!invitado) {
            throw new ResourceNotFoundError('Invitado', id);
        }

        return ResponseHelper.success(res, invitado, 'Invitado actualizado exitosamente');
    });

    /**
     * Eliminar invitado
     * DELETE /api/v1/eventos-digitales/invitados/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const eliminado = await InvitadoModel.eliminar(parseInt(id), organizacionId);

        if (!eliminado) {
            throw new ResourceNotFoundError('Invitado', id);
        }

        return ResponseHelper.success(res, { id: parseInt(id) }, 'Invitado eliminado');
    });

    /**
     * Exportar invitados a CSV
     * GET /api/v1/eventos-digitales/eventos/:eventoId/invitados/exportar
     */
    static exportar = asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const invitados = await InvitadoModel.exportar(parseInt(eventoId), organizacionId);

        // Generar CSV
        const headers = [
            'Nombre', 'Email', 'Teléfono', 'Grupo Familiar',
            'Max Acompañantes', 'Estado RSVP', 'Num Asistentes',
            'Mensaje', 'Restricciones Dietéticas', 'Confirmado En', 'Vía'
        ];

        const rows = invitados.map(i => [
            i.nombre,
            i.email || '',
            i.telefono || '',
            i.grupo_familiar || '',
            i.max_acompanantes,
            i.estado_rsvp,
            i.num_asistentes || 0,
            i.mensaje_rsvp || '',
            i.restricciones_dieteticas || '',
            i.confirmado_en || '',
            i.confirmado_via || ''
        ]);

        // Escapar celdas CSV: comillas dobles, comas, newlines, fórmulas Excel
        const escapeCSV = (cell) => {
            if (cell == null) return '';
            const str = String(cell);
            // Prevenir inyección de fórmulas Excel (=, +, -, @, \t, \r)
            const needsPrefix = /^[=+\-@\t\r]/.test(str);
            const needsQuotes = str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r');
            if (needsPrefix || needsQuotes) {
                const escaped = str.replace(/"/g, '""');
                return needsPrefix ? `"'${escaped}"` : `"${escaped}"`;
            }
            return str;
        };

        const csvContent = [
            headers.map(escapeCSV).join(','),
            ...rows.map(row => row.map(escapeCSV).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=invitados-${eventoId}.csv`);
        return res.send(csvContent);
    });

    /**
     * Obtener grupos familiares únicos
     * GET /api/v1/eventos-digitales/eventos/:eventoId/grupos
     */
    static obtenerGrupos = asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const grupos = await InvitadoModel.obtenerGrupos(parseInt(eventoId), organizacionId);

        return ResponseHelper.success(res, grupos);
    });

    /**
     * Obtener etiquetas únicas
     * GET /api/v1/eventos-digitales/eventos/:eventoId/etiquetas
     */
    static obtenerEtiquetas = asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const etiquetas = await InvitadoModel.obtenerEtiquetas(parseInt(eventoId), organizacionId);

        return ResponseHelper.success(res, etiquetas);
    });

    // ========================================================================
    // QR + CHECK-IN
    // ========================================================================

    /**
     * Generar QR individual para un invitado
     * GET /api/v1/eventos-digitales/eventos/:eventoId/invitados/:invitadoId/qr
     */
    static generarQR = asyncHandler(async (req, res) => {
        const { eventoId, invitadoId } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;
        const { formato = 'png' } = req.query;

        // Obtener invitado y evento
        const invitado = await InvitadoModel.obtenerPorId(parseInt(invitadoId), organizacionId);

        if (!invitado || invitado.evento_id !== parseInt(eventoId)) {
            throw new ResourceNotFoundError('Invitado', invitadoId);
        }

        const evento = await EventoModel.obtenerPorId(parseInt(eventoId), organizacionId);

        if (!evento) {
            throw new ResourceNotFoundError('Evento', eventoId);
        }

        // Usar servicio de QR
        const resultado = await generarQRInvitado(
            {
                slug: evento.slug,
                token: invitado.token,
                nombre: invitado.nombre,
                grupoFamiliar: invitado.grupo_familiar
            },
            formato
        );

        if (formato === 'base64') {
            return ResponseHelper.success(res, {
                qr: resultado.qr,
                url: resultado.url,
                invitado: {
                    id: invitado.id,
                    nombre: resultado.invitado.nombre,
                    grupo_familiar: resultado.invitado.grupo_familiar
                }
            });
        }

        // Retornar como imagen PNG
        res.setHeader('Content-Type', resultado.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${resultado.filename}"`);
        return res.send(resultado.buffer);
    });

    /**
     * Generar ZIP con todos los QR del evento
     * GET /api/v1/eventos-digitales/eventos/:eventoId/qr-masivo
     */
    static generarQRMasivo = asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        // Obtener evento
        const evento = await EventoModel.obtenerPorId(parseInt(eventoId), organizacionId);

        if (!evento) {
            throw new ResourceNotFoundError('Evento', eventoId);
        }

        // Obtener todos los invitados
        const resultado = await InvitadoModel.listar(parseInt(eventoId), organizacionId, { limite: 1000 });
        const invitados = resultado.invitados || [];

        if (invitados.length === 0) {
            throw new ValidationError('No hay invitados en este evento');
        }

        // Configurar respuesta como ZIP
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="qr-${evento.slug}.zip"`);

        // Crear archivo ZIP
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        // Generar QR para cada invitado usando el servicio
        for (const invitado of invitados) {
            const url = generarUrlInvitacion(evento.slug, invitado.token);
            const qrBuffer = await generarQRBuffer(url);
            const nombreArchivo = generarNombreArchivoQR(invitado.nombre, invitado.grupo_familiar);

            archive.append(qrBuffer, { name: nombreArchivo });
        }

        await archive.finalize();

        logger.info('[InvitadosController.generarQRMasivo] ZIP generado', {
            evento_id: eventoId,
            total_qr: invitados.length
        });
    });

    /**
     * Registrar check-in de un invitado
     * POST /api/v1/eventos-digitales/eventos/:eventoId/checkin
     * Body: { token: string }
     */
    static registrarCheckin = asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const { token } = req.body;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        if (!token) {
            throw new ValidationError('Token requerido');
        }

        // Buscar invitado por token
        const invitado = await InvitadoModel.obtenerPorTokenInterno(token, organizacionId);

        if (!invitado) {
            throw new ResourceNotFoundError('Invitado');
        }

        if (invitado.evento_id !== parseInt(eventoId)) {
            throw new ValidationError('QR inválido - No corresponde a este evento');
        }

        // Verificar si ya hizo check-in
        if (invitado.checkin_at) {
            return ResponseHelper.success(res, {
                status: 'already_checked_in',
                message: 'Ya registrado previamente',
                invitado: {
                    id: invitado.id,
                    nombre: invitado.nombre,
                    grupo_familiar: invitado.grupo_familiar,
                    num_asistentes: invitado.num_asistentes || 1
                },
                checkin_at: invitado.checkin_at
            });
        }

        // Registrar check-in
        const resultadoCheckin = await InvitadoModel.registrarCheckin(invitado.id, organizacionId);

        logger.info('[InvitadosController.registrarCheckin] Check-in registrado', {
            invitado_id: invitado.id,
            evento_id: eventoId,
        });

        return ResponseHelper.success(res, {
            status: 'checked_in',
            message: '¡Bienvenido!',
            invitado: {
                id: resultadoCheckin.id,
                nombre: resultadoCheckin.nombre,
                grupo_familiar: resultadoCheckin.grupo_familiar,
                num_asistentes: resultadoCheckin.num_asistentes || 1
            },
            checkin_at: resultadoCheckin.checkin_at
        });
    });

    /**
     * Obtener estadísticas de check-in
     * GET /api/v1/eventos-digitales/eventos/:eventoId/checkin/stats
     */
    static obtenerEstadisticasCheckin = asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

        const stats = await InvitadoModel.obtenerEstadisticasCheckin(parseInt(eventoId), organizacionId);

        return ResponseHelper.success(res, stats);
    });

    /**
     * Listar invitados con check-in (para dashboard tiempo real)
     * GET /api/v1/eventos-digitales/eventos/:eventoId/checkin/lista
     */
    static listarCheckins = asyncHandler(async (req, res) => {
        const { eventoId } = req.params;
        const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;
        const { limite = 50 } = req.query;

        const checkins = await InvitadoModel.listarCheckins(
            parseInt(eventoId),
            organizacionId,
            parseInt(limite)
        );

        return ResponseHelper.success(res, checkins);
    });
}

module.exports = InvitadosController;
