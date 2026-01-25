/**
 * @fileoverview Modelo de Invitaciones para Profesionales
 * @description Gestiona invitaciones para que empleados se registren y vinculen a profesionales
 * @version 1.0.0
 * Nov 2025 - Sistema de Invitaciones Profesional-Usuario
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const crypto = require('crypto');
const { ErrorHelper } = require('../../../utils/helpers');

class InvitacionModel {

    /**
     * Generar token único para invitación
     * @returns {string} Token de 64 caracteres hex
     */
    static generarToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Crear nueva invitación
     * @param {Object} data - Datos de la invitación
     * @param {number} data.organizacion_id - ID de la organización
     * @param {number} data.profesional_id - ID del profesional a vincular
     * @param {string} data.email - Email del invitado
     * @param {string} data.nombre_sugerido - Nombre sugerido (del profesional)
     * @param {number} data.creado_por - ID del usuario que crea la invitación
     * @param {string} [data.rol='empleado'] - Rol a asignar al usuario (Dic 2025)
     * @param {number} [data.dias_expiracion=7] - Días hasta expiración
     * @returns {Promise<Object>} Invitación creada con token
     */
    static async crear(data) {
        const {
            organizacion_id,
            profesional_id,
            email,
            nombre_sugerido,
            creado_por,
            rol = 'empleado', // Dic 2025: Rol configurable
            dias_expiracion = 7
        } = data;

        // Validar rol permitido
        const rolesPermitidos = ['empleado', 'admin'];
        if (!rolesPermitidos.includes(rol)) {
            ErrorHelper.throwValidation(`Rol inválido: ${rol}. Roles permitidos: ${rolesPermitidos.join(', ')}`);
        }

        const token = this.generarToken();

        return RLSContextManager.query(organizacion_id, async (db) => {
            // Verificar si ya existe invitación pendiente para este email/profesional
            const existenteResult = await db.query(`
                SELECT id, estado, expira_en
                FROM invitaciones_profesionales
                WHERE profesional_id = $1
                  AND email = LOWER($2)
                  AND estado = 'pendiente'
            `, [profesional_id, email]);

            if (existenteResult.rows[0]) {
                ErrorHelper.throwConflict('Ya existe una invitación pendiente para este email');
            }

            // Verificar que el profesional no tenga ya un usuario vinculado
            const profesionalResult = await db.query(`
                SELECT id, usuario_id, nombre_completo
                FROM profesionales
                WHERE id = $1
            `, [profesional_id]);

            const profesional = profesionalResult.rows[0];
            ErrorHelper.throwIfNotFound(profesional, 'Profesional');

            if (profesional.usuario_id) {
                ErrorHelper.throwConflict('Este profesional ya tiene un usuario vinculado');
            }

            // Verificar que el email no esté registrado como usuario
            const emailExistenteResult = await db.query(`
                SELECT id FROM usuarios WHERE email = LOWER($1)
            `, [email]);

            if (emailExistenteResult.rows[0]) {
                ErrorHelper.throwConflict('Este email ya está registrado en el sistema');
            }

            // Crear invitación (Dic 2025: incluye rol)
            const invitacionResult = await db.query(`
                INSERT INTO invitaciones_profesionales (
                    token,
                    organizacion_id,
                    profesional_id,
                    email,
                    nombre_sugerido,
                    rol,
                    creado_por,
                    expira_en,
                    enviado_en
                ) VALUES (
                    $1, $2, $3, LOWER($4), $5, $6, $7,
                    NOW() + INTERVAL '${dias_expiracion} days',
                    NOW()
                )
                RETURNING *
            `, [token, organizacion_id, profesional_id, email, nombre_sugerido || profesional.nombre_completo, rol, creado_por]);

            const invitacion = invitacionResult.rows[0];

            return {
                ...invitacion,
                profesional_nombre: profesional.nombre_completo
            };
        });
    }

    /**
     * Crear invitación para usuario directo (sin profesional)
     * Dic 2025: Soporte para usuarios como contadores, auditores, etc.
     * @param {Object} data - Datos de la invitación
     * @param {number} data.organizacion_id - ID de la organización
     * @param {string} data.email - Email del invitado
     * @param {string} data.nombre - Nombre del usuario
     * @param {string} [data.apellidos] - Apellidos del usuario
     * @param {string} [data.rol='empleado'] - Rol a asignar
     * @param {number} data.creado_por - ID del usuario que crea
     * @param {number} [data.dias_expiracion=7] - Días hasta expiración
     * @returns {Promise<Object>} Invitación creada con token
     */
    static async crearParaUsuarioDirecto(data) {
        const {
            organizacion_id,
            email,
            nombre,
            apellidos,
            rol = 'empleado',
            creado_por,
            dias_expiracion = 7
        } = data;

        // Validar rol permitido
        const rolesPermitidos = ['empleado', 'admin'];
        if (!rolesPermitidos.includes(rol)) {
            ErrorHelper.throwValidation(`Rol inválido: ${rol}. Roles permitidos: ${rolesPermitidos.join(', ')}`);
        }

        const token = this.generarToken();

        return RLSContextManager.query(organizacion_id, async (db) => {
            // Verificar si ya existe invitación pendiente para este email
            const existenteResult = await db.query(`
                SELECT id, estado, expira_en
                FROM invitaciones_profesionales
                WHERE email = LOWER($1)
                  AND estado = 'pendiente'
                  AND tipo_invitacion = 'usuario_directo'
            `, [email]);

            if (existenteResult.rows[0]) {
                ErrorHelper.throwConflict('Ya existe una invitación pendiente para este email');
            }

            // Verificar que el email no esté registrado como usuario
            const emailExistenteResult = await db.query(`
                SELECT id FROM usuarios WHERE email = LOWER($1)
            `, [email]);

            if (emailExistenteResult.rows[0]) {
                ErrorHelper.throwConflict('Este email ya está registrado en el sistema');
            }

            // Crear invitación para usuario directo (nombre y apellidos separados)
            const invitacionResult = await db.query(`
                INSERT INTO invitaciones_profesionales (
                    token,
                    organizacion_id,
                    profesional_id,
                    tipo_invitacion,
                    email,
                    nombre_sugerido,
                    apellidos_sugerido,
                    rol,
                    creado_por,
                    expira_en,
                    enviado_en
                ) VALUES (
                    $1, $2, NULL, 'usuario_directo', LOWER($3), $4, $5, $6, $7,
                    NOW() + INTERVAL '${dias_expiracion} days',
                    NOW()
                )
                RETURNING *
            `, [token, organizacion_id, email, nombre, apellidos || null, rol, creado_por]);

            return invitacionResult.rows[0];
        });
    }

    /**
     * Validar token de invitación (público, sin RLS)
     * @param {string} token - Token de la invitación
     * @returns {Promise<Object|null>} Invitación con datos del profesional y organización
     */
    static async validarToken(token) {
        return RLSContextManager.withBypass(async (db) => {
            // Marcar expiradas primero
            await db.query(`SELECT marcar_invitaciones_expiradas()`);

            // LEFT JOIN para soportar invitaciones sin profesional
            const invitacionResult = await db.query(`
                SELECT
                    i.*,
                    p.nombre_completo AS profesional_nombre,
                    o.nombre_comercial AS organizacion_nombre,
                    o.logo_url AS organizacion_logo
                FROM invitaciones_profesionales i
                LEFT JOIN profesionales p ON i.profesional_id = p.id
                JOIN organizaciones o ON i.organizacion_id = o.id
                WHERE i.token = $1
            `, [token]);

            const invitacion = invitacionResult.rows[0];

            if (!invitacion) {
                return { valido: false, error: 'Invitación no encontrada' };
            }

            if (invitacion.estado === 'aceptada') {
                return { valido: false, error: 'Esta invitación ya fue utilizada' };
            }

            if (invitacion.estado === 'expirada') {
                return { valido: false, error: 'Esta invitación ha expirado' };
            }

            if (invitacion.estado === 'cancelada') {
                return { valido: false, error: 'Esta invitación fue cancelada' };
            }

            if (invitacion.estado === 'reenviada') {
                return { valido: false, error: 'Se ha enviado una nueva invitación. Usa el enlace más reciente.' };
            }

            // Calcular tiempo restante
            const ahora = new Date();
            const expira = new Date(invitacion.expira_en);
            const minutosRestantes = Math.floor((expira - ahora) / (1000 * 60));

            return {
                valido: true,
                invitacion: {
                    id: invitacion.id,
                    email: invitacion.email,
                    nombre_sugerido: invitacion.nombre_sugerido,
                    apellidos_sugerido: invitacion.apellidos_sugerido,
                    tipo_invitacion: invitacion.tipo_invitacion || 'profesional',
                    profesional_nombre: invitacion.profesional_nombre,
                    organizacion_nombre: invitacion.organizacion_nombre,
                    organizacion_logo: invitacion.organizacion_logo,
                    expira_en: invitacion.expira_en,
                    minutos_restantes: minutosRestantes
                }
            };
        });
    }

    /**
     * Aceptar invitación y crear usuario
     * @param {string} token - Token de la invitación
     * @param {Object} datosUsuario - Datos para crear el usuario
     * @param {string} datosUsuario.nombre - Nombre del usuario
     * @param {string} datosUsuario.apellidos - Apellidos (opcional)
     * @param {string} datosUsuario.password_hash - Hash de la contraseña
     * @returns {Promise<Object>} Usuario creado y profesional vinculado
     */
    static async aceptar(token, datosUsuario) {
        return RLSContextManager.withBypass(async (db) => {
            // Obtener invitación
            const invitacionResult = await db.query(`
                SELECT * FROM invitaciones_profesionales
                WHERE token = $1 AND estado = 'pendiente'
            `, [token]);

            const invitacion = invitacionResult.rows[0];

            if (!invitacion) {
                ErrorHelper.throwValidation('Invitación no válida o ya utilizada');
            }

            // Verificar expiración
            if (new Date(invitacion.expira_en) < new Date()) {
                await db.query(`
                    UPDATE invitaciones_profesionales
                    SET estado = 'expirada'
                    WHERE id = $1
                `, [invitacion.id]);
                ErrorHelper.throwValidation('La invitación ha expirado');
            }

            // Crear usuario con rol de la invitación (Dic 2025: rol configurable)
            const rolAsignado = invitacion.rol || 'empleado';

            // FASE 7: Obtener rol_id basado en código de rol
            const rolResult = await db.query(
                `SELECT id FROM roles WHERE codigo = $1 AND organizacion_id = $2 LIMIT 1`,
                [rolAsignado, invitacion.organizacion_id]
            );
            const rolId = rolResult.rows[0]?.id || null;

            // FASE 7: Solo usar rol_id (sin columna rol ENUM)
            const usuarioResult = await db.query(`
                INSERT INTO usuarios (
                    organizacion_id,
                    email,
                    password_hash,
                    nombre,
                    apellidos,
                    rol_id,
                    activo,
                    email_verificado
                ) VALUES (
                    $1, LOWER($2), $3, $4, $5, $6, TRUE, TRUE
                )
                RETURNING id, email, nombre, apellidos, rol_id, organizacion_id, activo, creado_en
            `, [
                invitacion.organizacion_id,
                invitacion.email,
                datosUsuario.password_hash,
                datosUsuario.nombre,
                datosUsuario.apellidos || null,
                rolId
            ]);

            const usuario = usuarioResult.rows[0];

            let profesional = null;

            // Solo vincular profesional si existe (tipo_invitacion = 'profesional')
            if (invitacion.profesional_id) {
                await db.query(`
                    UPDATE profesionales
                    SET usuario_id = $1, actualizado_en = NOW()
                    WHERE id = $2
                `, [usuario.id, invitacion.profesional_id]);

                // Obtener datos del profesional actualizado
                const profesionalResult = await db.query(`
                    SELECT id, nombre_completo
                    FROM profesionales
                    WHERE id = $1
                `, [invitacion.profesional_id]);

                profesional = profesionalResult.rows[0];
            }

            // Marcar invitación como aceptada
            await db.query(`
                UPDATE invitaciones_profesionales
                SET estado = 'aceptada',
                    usuario_id = $1,
                    aceptado_en = NOW()
                WHERE id = $2
            `, [usuario.id, invitacion.id]);

            return {
                usuario,
                profesional, // null si tipo_invitacion = 'usuario_directo'
                organizacion_id: invitacion.organizacion_id,
                tipo_invitacion: invitacion.tipo_invitacion || 'profesional'
            };
        });
    }

    /**
     * Reenviar invitación (genera nuevo token)
     * @param {number} invitacionId - ID de la invitación
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Nueva invitación con token actualizado
     */
    static async reenviar(invitacionId, organizacionId) {
        const nuevoToken = this.generarToken();

        return RLSContextManager.query(organizacionId, async (db) => {
            // Marcar la anterior como reenviada
            const anteriorResult = await db.query(`
                UPDATE invitaciones_profesionales
                SET estado = 'reenviada', actualizado_en = NOW()
                WHERE id = $1 AND estado = 'pendiente'
                RETURNING profesional_id, email, nombre_sugerido, creado_por
            `, [invitacionId]);

            const anterior = anteriorResult.rows[0];
            ErrorHelper.throwIfNotFound(anterior, 'Invitación');

            // Crear nueva invitación
            const nuevaResult = await db.query(`
                INSERT INTO invitaciones_profesionales (
                    token,
                    organizacion_id,
                    profesional_id,
                    email,
                    nombre_sugerido,
                    creado_por,
                    expira_en,
                    enviado_en,
                    reenvios
                )
                SELECT
                    $1,
                    organizacion_id,
                    profesional_id,
                    email,
                    nombre_sugerido,
                    creado_por,
                    NOW() + INTERVAL '7 days',
                    NOW(),
                    reenvios + 1
                FROM invitaciones_profesionales
                WHERE id = $2
                RETURNING *
            `, [nuevoToken, invitacionId]);

            return nuevaResult.rows[0];
        });
    }

    /**
     * Cancelar invitación
     * @param {number} invitacionId - ID de la invitación
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Invitación cancelada
     */
    static async cancelar(invitacionId, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const invitacionResult = await db.query(`
                UPDATE invitaciones_profesionales
                SET estado = 'cancelada', cancelado_en = NOW()
                WHERE id = $1 AND estado = 'pendiente'
                RETURNING *
            `, [invitacionId]);

            const invitacion = invitacionResult.rows[0];
            ErrorHelper.throwIfNotFound(invitacion, 'Invitación');

            return invitacion;
        });
    }

    /**
     * Listar invitaciones por organización
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros opcionales
     * @param {string} filtros.estado - Filtrar por estado
     * @returns {Promise<Array>} Lista de invitaciones
     */
    static async listarPorOrganizacion(organizacionId, filtros = {}) {
        return RLSContextManager.query(organizacionId, async (db) => {
            let whereClause = '1=1';
            const params = [];

            if (filtros.estado) {
                params.push(filtros.estado);
                whereClause += ` AND i.estado = $${params.length}`;
            }

            const invitacionesResult = await db.query(`
                SELECT
                    i.*,
                    p.nombre_completo AS profesional_nombre,
                    u.nombre AS creador_nombre
                FROM invitaciones_profesionales i
                JOIN profesionales p ON i.profesional_id = p.id
                LEFT JOIN usuarios u ON i.creado_por = u.id
                WHERE ${whereClause}
                ORDER BY i.creado_en DESC
            `, params);

            return invitacionesResult.rows;
        });
    }

    /**
     * Obtener invitación por profesional
     * @param {number} profesionalId - ID del profesional
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} Última invitación del profesional
     */
    static async obtenerPorProfesional(profesionalId, organizacionId) {
        return RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT *
                FROM invitaciones_profesionales
                WHERE profesional_id = $1
                ORDER BY creado_en DESC
                LIMIT 1
            `, [profesionalId]);

            return result.rows[0] || null;
        });
    }
}

module.exports = InvitacionModel;
