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
 * Fecha creación: 4 Diciembre 2025
 */

const InvitadoModel = require('../models/invitado.model');
const EventoModel = require('../models/evento.model');
const logger = require('../../../utils/logger');
const { ResponseHelper } = require('../../../utils/helpers');
const QRCode = require('qrcode');
const archiver = require('archiver');

class InvitadosController {

    /**
     * Crear invitado
     * POST /api/v1/eventos-digitales/eventos/:eventoId/invitados
     */
    static async crear(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

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

        } catch (error) {
            logger.error('[InvitadosController.crear] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Importar invitados masivamente
     * POST /api/v1/eventos-digitales/eventos/:eventoId/invitados/importar
     */
    static async importar(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;
            const { invitados } = req.body;

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

        } catch (error) {
            logger.error('[InvitadosController.importar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Listar invitados del evento
     * GET /api/v1/eventos-digitales/eventos/:eventoId/invitados
     */
    static async listar(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;
            const filtros = req.query;

            const resultado = await InvitadoModel.listar(
                parseInt(eventoId),
                organizacionId,
                filtros
            );

            return ResponseHelper.success(res, resultado);

        } catch (error) {
            logger.error('[InvitadosController.listar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Actualizar invitado
     * PUT /api/v1/eventos-digitales/invitados/:id
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const invitado = await InvitadoModel.actualizar(
                parseInt(id),
                req.body,
                organizacionId
            );

            if (!invitado) {
                return ResponseHelper.error(res, 'Invitado no encontrado', 404);
            }

            return ResponseHelper.success(res, invitado, 'Invitado actualizado exitosamente');

        } catch (error) {
            logger.error('[InvitadosController.actualizar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Eliminar invitado
     * DELETE /api/v1/eventos-digitales/invitados/:id
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const eliminado = await InvitadoModel.eliminar(parseInt(id), organizacionId);

            if (!eliminado) {
                return ResponseHelper.error(res, 'Invitado no encontrado', 404);
            }

            return ResponseHelper.success(res, { id: parseInt(id) }, 'Invitado eliminado');

        } catch (error) {
            logger.error('[InvitadosController.eliminar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Exportar invitados a CSV
     * GET /api/v1/eventos-digitales/eventos/:eventoId/invitados/exportar
     */
    static async exportar(req, res) {
        try {
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

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell =>
                    typeof cell === 'string' && cell.includes(',')
                        ? `"${cell}"`
                        : cell
                ).join(','))
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=invitados-${eventoId}.csv`);
            return res.send(csvContent);

        } catch (error) {
            logger.error('[InvitadosController.exportar] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Obtener grupos familiares únicos
     * GET /api/v1/eventos-digitales/eventos/:eventoId/grupos
     */
    static async obtenerGrupos(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const grupos = await InvitadoModel.obtenerGrupos(parseInt(eventoId), organizacionId);

            return ResponseHelper.success(res, grupos);

        } catch (error) {
            logger.error('[InvitadosController.obtenerGrupos] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Obtener etiquetas únicas
     * GET /api/v1/eventos-digitales/eventos/:eventoId/etiquetas
     */
    static async obtenerEtiquetas(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const etiquetas = await InvitadoModel.obtenerEtiquetas(parseInt(eventoId), organizacionId);

            return ResponseHelper.success(res, etiquetas);

        } catch (error) {
            logger.error('[InvitadosController.obtenerEtiquetas] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    // ========================================================================
    // QR + CHECK-IN
    // ========================================================================

    /**
     * Generar QR individual para un invitado
     * GET /api/v1/eventos-digitales/eventos/:eventoId/invitados/:invitadoId/qr
     */
    static async generarQR(req, res) {
        try {
            const { eventoId, invitadoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;
            const { formato = 'png' } = req.query; // png o base64

            // Obtener invitado y evento
            const invitado = await InvitadoModel.obtenerPorId(parseInt(invitadoId), organizacionId);

            if (!invitado || invitado.evento_id !== parseInt(eventoId)) {
                return ResponseHelper.error(res, 'Invitado no encontrado', 404);
            }

            const evento = await EventoModel.obtenerPorId(parseInt(eventoId), organizacionId);

            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            // Generar URL de la invitación
            const baseUrl = process.env.FRONTEND_URL || 'https://nexo.app';
            const invitacionUrl = `${baseUrl}/e/${evento.slug}/${invitado.token}`;

            // Opciones del QR
            const qrOptions = {
                errorCorrectionLevel: 'M',
                type: 'png',
                margin: 2,
                width: 400,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            };

            if (formato === 'base64') {
                // Retornar como base64
                const qrDataUrl = await QRCode.toDataURL(invitacionUrl, qrOptions);
                return ResponseHelper.success(res, {
                    qr: qrDataUrl,
                    url: invitacionUrl,
                    invitado: {
                        id: invitado.id,
                        nombre: invitado.nombre,
                        grupo_familiar: invitado.grupo_familiar
                    }
                });
            } else {
                // Retornar como imagen PNG
                const qrBuffer = await QRCode.toBuffer(invitacionUrl, qrOptions);

                res.setHeader('Content-Type', 'image/png');
                res.setHeader('Content-Disposition', `attachment; filename="qr-${invitado.nombre.replace(/\s+/g, '-')}.png"`);
                return res.send(qrBuffer);
            }

        } catch (error) {
            logger.error('[InvitadosController.generarQR] Error', { error: error.message });
            return ResponseHelper.error(res, 'Error generando QR', 500);
        }
    }

    /**
     * Generar ZIP con todos los QR del evento
     * GET /api/v1/eventos-digitales/eventos/:eventoId/qr-masivo
     */
    static async generarQRMasivo(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            // Obtener evento
            const evento = await EventoModel.obtenerPorId(parseInt(eventoId), organizacionId);

            if (!evento) {
                return ResponseHelper.error(res, 'Evento no encontrado', 404);
            }

            // Obtener todos los invitados
            const resultado = await InvitadoModel.listar(parseInt(eventoId), organizacionId, { limite: 1000 });
            const invitados = resultado.invitados || [];

            if (invitados.length === 0) {
                return ResponseHelper.error(res, 'No hay invitados en este evento', 400);
            }

            const baseUrl = process.env.FRONTEND_URL || 'https://nexo.app';

            // Configurar respuesta como ZIP
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="qr-${evento.slug}.zip"`);

            // Crear archivo ZIP
            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.pipe(res);

            // Generar QR para cada invitado
            const qrOptions = {
                errorCorrectionLevel: 'M',
                type: 'png',
                margin: 2,
                width: 400
            };

            for (const invitado of invitados) {
                const invitacionUrl = `${baseUrl}/e/${evento.slug}/${invitado.token}`;
                const qrBuffer = await QRCode.toBuffer(invitacionUrl, qrOptions);

                // Nombre del archivo: grupo_nombre.png o solo nombre.png
                const nombreArchivo = invitado.grupo_familiar
                    ? `${invitado.grupo_familiar}_${invitado.nombre}`.replace(/\s+/g, '-')
                    : invitado.nombre.replace(/\s+/g, '-');

                archive.append(qrBuffer, { name: `${nombreArchivo}.png` });
            }

            await archive.finalize();

            logger.info('[InvitadosController.generarQRMasivo] ZIP generado', {
                evento_id: eventoId,
                total_qr: invitados.length
            });

        } catch (error) {
            logger.error('[InvitadosController.generarQRMasivo] Error', { error: error.message });
            return ResponseHelper.error(res, 'Error generando QR masivo', 500);
        }
    }

    /**
     * Registrar check-in de un invitado
     * POST /api/v1/eventos-digitales/eventos/:eventoId/checkin
     * Body: { token: string }
     */
    static async registrarCheckin(req, res) {
        try {
            const { eventoId } = req.params;
            const { token } = req.body;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            if (!token) {
                return ResponseHelper.error(res, 'Token requerido', 400);
            }

            // Buscar invitado por token
            const invitado = await InvitadoModel.obtenerPorTokenInterno(token, organizacionId);

            if (!invitado) {
                return ResponseHelper.error(res, 'QR inválido - Invitado no encontrado', 404);
            }

            if (invitado.evento_id !== parseInt(eventoId)) {
                return ResponseHelper.error(res, 'QR inválido - No corresponde a este evento', 400);
            }

            // Verificar si ya hizo check-in
            if (invitado.checkin_at) {
                return res.status(200).json({
                    success: true,
                    status: 'already_checked_in',
                    message: 'Ya registrado previamente',
                    data: {
                        invitado: {
                            id: invitado.id,
                            nombre: invitado.nombre,
                            grupo_familiar: invitado.grupo_familiar,
                            num_asistentes: invitado.num_asistentes || 1
                        },
                        checkin_at: invitado.checkin_at
                    }
                });
            }

            // Registrar check-in
            const resultado = await InvitadoModel.registrarCheckin(invitado.id, organizacionId);

            logger.info('[InvitadosController.registrarCheckin] Check-in registrado', {
                invitado_id: invitado.id,
                evento_id: eventoId,
                nombre: invitado.nombre
            });

            return res.status(200).json({
                success: true,
                status: 'checked_in',
                message: '¡Bienvenido!',
                data: {
                    invitado: {
                        id: resultado.id,
                        nombre: resultado.nombre,
                        grupo_familiar: resultado.grupo_familiar,
                        num_asistentes: resultado.num_asistentes || 1
                    },
                    checkin_at: resultado.checkin_at
                }
            });

        } catch (error) {
            logger.error('[InvitadosController.registrarCheckin] Error', { error: error.message });
            return ResponseHelper.error(res, 'Error registrando check-in', 500);
        }
    }

    /**
     * Obtener estadísticas de check-in
     * GET /api/v1/eventos-digitales/eventos/:eventoId/checkin/stats
     */
    static async obtenerEstadisticasCheckin(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;

            const stats = await InvitadoModel.obtenerEstadisticasCheckin(parseInt(eventoId), organizacionId);

            return ResponseHelper.success(res, stats);

        } catch (error) {
            logger.error('[InvitadosController.obtenerEstadisticasCheckin] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Listar invitados con check-in (para dashboard tiempo real)
     * GET /api/v1/eventos-digitales/eventos/:eventoId/checkin/lista
     */
    static async listarCheckins(req, res) {
        try {
            const { eventoId } = req.params;
            const organizacionId = req.tenant?.organizacionId || req.user.organizacion_id;
            const { limite = 50 } = req.query;

            const checkins = await InvitadoModel.listarCheckins(
                parseInt(eventoId),
                organizacionId,
                parseInt(limite)
            );

            return ResponseHelper.success(res, checkins);

        } catch (error) {
            logger.error('[InvitadosController.listarCheckins] Error', { error: error.message });
            return ResponseHelper.error(res, error.message, 500);
        }
    }
}

module.exports = InvitadosController;
