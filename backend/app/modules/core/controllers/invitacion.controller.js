/**
 * @fileoverview Controlador de Invitaciones para Profesionales
 * @description Endpoints para gestionar invitaciones de empleados
 * @version 1.0.0
 * Nov 2025 - Sistema de Invitaciones Profesional-Usuario
 */

const InvitacionModel = require('../models/invitacion.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const bcrypt = require('bcryptjs');
const emailService = require('../../../services/emailService');

class InvitacionController {

    /**
     * POST /invitaciones
     * Crear y enviar invitación a un profesional
     */
    static crear = asyncHandler(async (req, res) => {
        const { profesional_id, email, nombre_sugerido } = req.body;
        const organizacion_id = req.user.organizacion_id;
        const creado_por = req.user.id;

        const invitacion = await InvitacionModel.crear({
            organizacion_id,
            profesional_id,
            email,
            nombre_sugerido,
            creado_por
        });

        // Enviar email de invitación
        try {
            await emailService.enviarInvitacionProfesional({
                email: invitacion.email,
                nombre: invitacion.nombre_sugerido,
                token: invitacion.token,
                organizacion_nombre: req.user.nombre_comercial || 'la organización',
                profesional_nombre: invitacion.profesional_nombre,
                expira_en: invitacion.expira_en
            });
        } catch (emailError) {
            console.error('Error enviando email de invitación:', emailError);
            // No fallamos la operación, la invitación se creó
        }

        return ResponseHelper.success(res, {
            invitacion: {
                id: invitacion.id,
                email: invitacion.email,
                estado: invitacion.estado,
                expira_en: invitacion.expira_en,
                profesional_nombre: invitacion.profesional_nombre
            }
        }, 'Invitación enviada exitosamente', 201);
    });

    /**
     * GET /invitaciones/validar/:token
     * Validar token de invitación (público)
     */
    static validarToken = asyncHandler(async (req, res) => {
        const { token } = req.params;

        const resultado = await InvitacionModel.validarToken(token);

        if (!resultado.valido) {
            return ResponseHelper.error(res, resultado.error, 400, { valido: false });
        }

        return ResponseHelper.success(res, resultado, 'Invitación válida');
    });

    /**
     * POST /invitaciones/aceptar/:token
     * Aceptar invitación y crear usuario (público)
     */
    static aceptar = asyncHandler(async (req, res) => {
        const { token } = req.params;
        const { nombre, apellidos, password } = req.body;

        // Validar que la invitación sea válida primero
        const validacion = await InvitacionModel.validarToken(token);
        if (!validacion.valido) {
            return ResponseHelper.error(res, validacion.error, 400);
        }

        // Hash de la contraseña
        const password_hash = await bcrypt.hash(password, 12);

        // Aceptar invitación y crear usuario
        const resultado = await InvitacionModel.aceptar(token, {
            nombre,
            apellidos,
            password_hash
        });

        return ResponseHelper.success(res, {
            usuario: {
                id: resultado.usuario.id,
                email: resultado.usuario.email,
                nombre: resultado.usuario.nombre,
                rol: resultado.usuario.rol
            },
            profesional: {
                id: resultado.profesional.id,
                nombre: resultado.profesional.nombre_completo,
                modulos_acceso: resultado.profesional.modulos_acceso
            },
            mensaje: 'Cuenta creada exitosamente. Ya puedes iniciar sesión.'
        }, 'Registro completado', 201);
    });

    /**
     * POST /invitaciones/:id/reenviar
     * Reenviar invitación (genera nuevo token)
     */
    static reenviar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacion_id = req.user.organizacion_id;

        const invitacion = await InvitacionModel.reenviar(parseInt(id), organizacion_id);

        // Enviar email con nuevo link
        try {
            await emailService.enviarInvitacionProfesional({
                email: invitacion.email,
                nombre: invitacion.nombre_sugerido,
                token: invitacion.token,
                organizacion_nombre: req.user.nombre_comercial || 'la organización',
                expira_en: invitacion.expira_en,
                es_reenvio: true
            });
        } catch (emailError) {
            console.error('Error reenviando email de invitación:', emailError);
        }

        return ResponseHelper.success(res, {
            invitacion: {
                id: invitacion.id,
                email: invitacion.email,
                estado: invitacion.estado,
                expira_en: invitacion.expira_en,
                reenvios: invitacion.reenvios
            }
        }, 'Invitación reenviada');
    });

    /**
     * DELETE /invitaciones/:id
     * Cancelar invitación
     */
    static cancelar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacion_id = req.user.organizacion_id;

        await InvitacionModel.cancelar(parseInt(id), organizacion_id);

        return ResponseHelper.success(res, null, 'Invitación cancelada');
    });

    /**
     * GET /invitaciones
     * Listar invitaciones de la organización
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacion_id = req.user.organizacion_id;
        const { estado } = req.query;

        const invitaciones = await InvitacionModel.listarPorOrganizacion(
            organizacion_id,
            { estado }
        );

        return ResponseHelper.success(res, { invitaciones }, 'Invitaciones obtenidas');
    });

    /**
     * GET /invitaciones/profesional/:profesionalId
     * Obtener invitación de un profesional específico
     */
    static obtenerPorProfesional = asyncHandler(async (req, res) => {
        const { profesionalId } = req.params;
        const organizacion_id = req.user.organizacion_id;

        const invitacion = await InvitacionModel.obtenerPorProfesional(
            parseInt(profesionalId),
            organizacion_id
        );

        return ResponseHelper.success(res, { invitacion }, 'Invitación obtenida');
    });
}

module.exports = InvitacionController;
