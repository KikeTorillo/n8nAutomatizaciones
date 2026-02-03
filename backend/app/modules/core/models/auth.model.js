/**
 * @fileoverview Modelo de Autenticación
 * @description Lógica pura de autenticación separada de gestión de usuarios
 * @version 1.0.0
 *
 * Responsabilidades:
 * - Autenticar usuarios (email + password)
 * - Refrescar tokens
 * - Cambiar contraseña
 * - Reset de contraseña (solicitar, validar, confirmar)
 * - Verificar email
 * - Registrar intentos de login
 *
 * Este modelo NO maneja:
 * - CRUD de usuarios (ver usuario.model.js)
 * - Onboarding (ver onboardingService.js)
 * - Roles y permisos (ver roles.model.js)
 */

const { getDb } = require('../../../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../../../utils/logger');
const RLSHelper = require('../../../utils/rlsHelper');
const RLSContextManager = require('../../../utils/rlsContextManager');
const emailService = require('../../../services/emailService');
const JwtService = require('../../../services/jwtService');
const { ErrorHelper } = require('../../../utils/helpers');

const AUTH_CONFIG = {
    BCRYPT_SALT_ROUNDS: 12,
    TOKEN_RESET_EXPIRATION_HOURS: 1,
    RESET_TOKEN_LENGTH: 32
};

class AuthModel {

    /**
     * Autentica un usuario con email y password
     *
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña
     * @param {string|null} ipAddress - IP del cliente
     * @returns {Promise<Object>} { usuario, accessToken, refreshToken, expiresIn, requiere_onboarding }
     * @throws {Error} Si las credenciales son inválidas o el usuario está bloqueado
     */
    static async autenticar(email, password, ipAddress = null) {
        // Buscar usuario con datos necesarios para auth
        const usuario = await this._buscarUsuarioParaAuth(email);

        if (!usuario) {
            await this.registrarIntentoLogin(email, false, ipAddress);
            ErrorHelper.throwUnauthorized('Credenciales inválidas');
        }

        // Verificar si está bloqueado
        if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
            const tiempoBloqueo = Math.ceil((new Date(usuario.bloqueado_hasta) - new Date()) / 60000);
            ErrorHelper.throwUnauthorized(`Usuario bloqueado. Intente nuevamente en ${tiempoBloqueo} minutos`);
        }

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordValida) {
            await this.registrarIntentoLogin(email, false, ipAddress);
            ErrorHelper.throwUnauthorized('Credenciales inválidas');
        }

        // Login exitoso
        await this.registrarIntentoLogin(email, true, ipAddress);

        // Configurar contexto RLS
        const db = await getDb();
        try {
            await RLSHelper.configurarContexto(db, usuario.id, usuario.rol_codigo, usuario.organizacion_id);
        } finally {
            db.release();
        }

        // Generar tokens
        const { accessToken, refreshToken, expiresIn } = JwtService.generateTokenPair(usuario);

        // Preparar datos seguros del usuario (sin password_hash)
        const usuarioSeguro = this._limpiarUsuarioParaRespuesta(usuario);

        // Determinar si requiere onboarding
        const requiereOnboarding = !usuario.es_rol_sistema &&
                                   !usuario.organizacion_id &&
                                   usuario.onboarding_completado === false;

        return {
            usuario: usuarioSeguro,
            accessToken,
            refreshToken,
            expiresIn,
            requiere_onboarding: requiereOnboarding
        };
    }

    /**
     * Refresca el access token usando un refresh token válido
     *
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<Object>} { accessToken, expiresIn }
     * @throws {Error} Si el token es inválido
     */
    static async refrescarToken(refreshToken) {
        // Verificar refresh token
        const decoded = JwtService.verifyRefreshToken(refreshToken);

        // Buscar usuario
        const usuario = await this._buscarUsuarioPorId(decoded.userId);

        if (!usuario || !usuario.activo) {
            ErrorHelper.throwUnauthorized('Usuario no válido');
        }

        // Generar solo access token
        const accessToken = JwtService.generateAccessToken(usuario);
        const { expiresIn } = JwtService.getConfig();

        return {
            accessToken,
            expiresIn: expiresIn || 3600
        };
    }

    /**
     * Cambia la contraseña del usuario
     *
     * @param {number} userId - ID del usuario
     * @param {string} passwordAnterior - Contraseña actual
     * @param {string} passwordNueva - Nueva contraseña
     * @returns {Promise<boolean>} true si se cambió exitosamente
     * @throws {Error} Si la contraseña anterior es incorrecta
     */
    static async cambiarPassword(userId, passwordAnterior, passwordNueva) {
        // Obtener usuario con password_hash
        const usuario = await RLSContextManager.withBypass(async (db) => {
            const query = `SELECT id, password_hash, organizacion_id FROM usuarios WHERE id = $1 AND activo = TRUE`;
            const result = await db.query(query, [userId]);
            ErrorHelper.throwIfNotFound(result.rows[0], 'Usuario');
            return result.rows[0];
        });

        // Verificar contraseña anterior
        const passwordValida = await bcrypt.compare(passwordAnterior, usuario.password_hash);
        if (!passwordValida) {
            ErrorHelper.throwValidation('Contraseña anterior incorrecta');
        }

        // Actualizar contraseña
        return await RLSContextManager.transaction(usuario.organizacion_id, async (db) => {
            const nuevoHash = await bcrypt.hash(passwordNueva, AUTH_CONFIG.BCRYPT_SALT_ROUNDS);

            await db.query(`
                UPDATE usuarios
                SET password_hash = $1, actualizado_en = NOW()
                WHERE id = $2
            `, [nuevoHash, userId]);

            return true;
        });
    }

    /**
     * Solicita reset de contraseña (envía email)
     *
     * @param {string} email - Email del usuario
     * @param {string|null} ipAddress - IP del cliente
     * @returns {Promise<Object>} { mensaje, token_enviado, expires_at?, reset_token? }
     */
    static async solicitarResetPassword(email, ipAddress = null) {
        return await RLSContextManager.withBypass(async (db) => {
            // Buscar usuario
            const usuarioResult = await db.query(`
                SELECT id, email, nombre, apellidos, organizacion_id, activo
                FROM usuarios
                WHERE email = $1 AND activo = true
                LIMIT 1
            `, [email]);

            if (usuarioResult.rows.length === 0) {
                // Por seguridad, no revelar si el email existe
                return {
                    mensaje: 'Si el usuario existe, se ha enviado un email con instrucciones para restablecer la contraseña',
                    token_enviado: false
                };
            }

            const usuario = usuarioResult.rows[0];

            // Generar token de reset
            const resetToken = crypto.randomBytes(AUTH_CONFIG.RESET_TOKEN_LENGTH).toString('hex');
            const resetExpiration = new Date(Date.now() + AUTH_CONFIG.TOKEN_RESET_EXPIRATION_HOURS * 60 * 60 * 1000);

            // Guardar token
            await db.query(`
                UPDATE usuarios
                SET
                    token_reset_password = $1,
                    token_reset_expira = $2,
                    token_reset_usado_en = NULL,
                    actualizado_en = NOW()
                WHERE id = $3
            `, [resetToken, resetExpiration, usuario.id]);

            // Enviar email
            try {
                await emailService.enviarRecuperacionPassword({
                    email: usuario.email,
                    nombre: usuario.nombre || 'Usuario',
                    resetToken,
                    expirationHours: AUTH_CONFIG.TOKEN_RESET_EXPIRATION_HOURS
                });
                logger.info(`[AuthModel.solicitarResetPassword] Email enviado a: ${email}`);
            } catch (emailError) {
                logger.error(`[AuthModel.solicitarResetPassword] Error enviando email: ${emailError.message}`);
            }

            return {
                mensaje: 'Si el usuario existe, se ha enviado un email con instrucciones para restablecer la contraseña',
                token_enviado: true,
                usuario_id: usuario.id,
                expires_at: resetExpiration.toISOString(),
                ...(process.env.NODE_ENV !== 'production' && { reset_token: resetToken })
            };
        });
    }

    /**
     * Valida un token de reset de contraseña
     *
     * @param {string} token - Token de reset
     * @returns {Promise<Object>} { valido, mensaje, email?, expira_en_minutos? }
     */
    static async validarTokenReset(token) {
        return await RLSContextManager.withBypass(async (db) => {
            // Verificar si ya fue usado
            const tokenUsadoResult = await db.query(`
                SELECT id, email, token_reset_usado_en
                FROM usuarios
                WHERE token_reset_password = $1
                  AND token_reset_usado_en IS NOT NULL
                  AND activo = true
            `, [token]);

            if (tokenUsadoResult.rows.length > 0) {
                return {
                    valido: false,
                    mensaje: 'Este token de recuperación ya fue utilizado'
                };
            }

            // Buscar token válido
            const result = await db.query(`
                SELECT
                    id, email, nombre, apellidos, organizacion_id,
                    token_reset_expira,
                    CASE
                        WHEN token_reset_expira > NOW() THEN true
                        ELSE false
                    END as token_valido,
                    CASE
                        WHEN token_reset_expira > NOW() THEN EXTRACT(EPOCH FROM (token_reset_expira - NOW()))/60
                        ELSE 0
                    END as minutos_restantes
                FROM usuarios
                WHERE token_reset_password = $1 AND activo = true
            `, [token]);

            if (result.rows.length === 0) {
                return {
                    valido: false,
                    mensaje: 'Token inválido o usuario no encontrado'
                };
            }

            const usuario = result.rows[0];

            if (!usuario.token_valido) {
                return {
                    valido: false,
                    mensaje: 'Token expirado',
                    expiro_hace_minutos: Math.abs(Math.floor(usuario.minutos_restantes))
                };
            }

            return {
                valido: true,
                usuario_id: usuario.id,
                email: usuario.email,
                organizacion_id: usuario.organizacion_id,
                expira_en_minutos: Math.floor(usuario.minutos_restantes),
                expira_en: usuario.token_reset_expira
            };
        });
    }

    /**
     * Confirma el reset de contraseña con nueva contraseña
     *
     * @param {string} token - Token de reset
     * @param {string} passwordNueva - Nueva contraseña
     * @param {string|null} ipAddress - IP del cliente
     * @returns {Promise<Object>} { success, email, mensaje }
     * @throws {Error} Si el token es inválido o expirado
     */
    static async confirmarResetPassword(token, passwordNueva, ipAddress = null) {
        const resultado = await RLSContextManager.withBypass(async (db) => {
            await db.query('BEGIN');

            try {
                // Verificar si ya fue usado
                const tokenUsadoResult = await db.query(`
                    SELECT id, email, token_reset_usado_en
                    FROM usuarios
                    WHERE token_reset_password = $1
                      AND token_reset_usado_en IS NOT NULL
                      AND activo = true
                `, [token]);

                if (tokenUsadoResult.rows.length > 0) {
                    ErrorHelper.throwValidation('Este token de recuperación ya fue utilizado');
                }

                // Validar token
                const validacionResult = await db.query(`
                    SELECT
                        id, email, nombre, apellidos, organizacion_id,
                        token_reset_expira,
                        CASE
                            WHEN token_reset_expira > NOW() THEN true
                            ELSE false
                        END as token_valido
                    FROM usuarios
                    WHERE token_reset_password = $1 AND activo = true
                `, [token]);

                if (validacionResult.rows.length === 0) {
                    ErrorHelper.throwValidation('Código de recuperación inválido o usuario no encontrado');
                }

                const usuario = validacionResult.rows[0];

                if (!usuario.token_valido) {
                    ErrorHelper.throwValidation('Código de recuperación expirado');
                }

                // Actualizar contraseña
                const nuevoHash = await bcrypt.hash(passwordNueva, AUTH_CONFIG.BCRYPT_SALT_ROUNDS);

                const result = await db.query(`
                    UPDATE usuarios
                    SET
                        password_hash = $1,
                        token_reset_usado_en = NOW(),
                        intentos_fallidos = 0,
                        bloqueado_hasta = NULL,
                        actualizado_en = NOW()
                    WHERE token_reset_password = $2 AND activo = true
                    RETURNING id, email, nombre, apellidos, organizacion_id
                `, [nuevoHash, token]);

                if (result.rows.length === 0) {
                    ErrorHelper.throwValidation('No se pudo actualizar la contraseña');
                }

                await db.query('COMMIT');

                return {
                    success: true,
                    mensaje: 'Contraseña actualizada exitosamente',
                    usuario_id: result.rows[0].id,
                    email: result.rows[0].email,
                    organizacion_id: result.rows[0].organizacion_id
                };

            } catch (error) {
                await db.query('ROLLBACK');
                throw error;
            }
        });

        // Registrar evento después del commit
        try {
            const db = await getDb();
            try {
                await RLSHelper.registrarEvento(db, {
                    organizacion_id: resultado.organizacion_id,
                    evento_tipo: 'password_reset_confirmado',
                    entidad_tipo: 'usuario',
                    entidad_id: resultado.usuario_id,
                    descripcion: 'Contraseña restablecida exitosamente mediante token de recuperación',
                    metadatos: {
                        email: resultado.email,
                        timestamp: new Date().toISOString(),
                        metodo: 'token_reset',
                        ip: ipAddress
                    },
                    usuario_id: resultado.usuario_id
                });
            } finally {
                db.release();
            }
        } catch (eventoError) {
            logger.warn('Error al registrar evento de password reset:', eventoError.message);
        }

        return resultado;
    }

    /**
     * Verifica email con token
     *
     * @param {string} token - Token de verificación
     * @returns {Promise<Object>} { verificado, ya_verificado, email, mensaje }
     */
    static async verificarEmail(token) {
        return await RLSContextManager.withBypass(async (db) => {
            // Verificar si ya fue usado
            const tokenUsadoResult = await db.query(`
                SELECT id, email, email_verificado, token_verificacion_usado_en
                FROM usuarios
                WHERE token_verificacion_email = $1
                  AND token_verificacion_usado_en IS NOT NULL
                  AND activo = true
            `, [token]);

            if (tokenUsadoResult.rows.length > 0) {
                return {
                    verificado: false,
                    ya_verificado: true,
                    email: tokenUsadoResult.rows[0].email,
                    mensaje: 'El email ya había sido verificado anteriormente'
                };
            }

            // Buscar token válido
            const usuarioResult = await db.query(`
                SELECT u.id, u.email, u.nombre, u.apellidos, u.rol_id,
                       r.codigo as rol_codigo, u.organizacion_id, u.email_verificado
                FROM usuarios u
                LEFT JOIN roles r ON r.id = u.rol_id
                WHERE u.token_verificacion_email = $1
                  AND u.token_verificacion_expira > NOW()
                  AND u.activo = true
            `, [token]);

            if (usuarioResult.rows.length === 0) {
                return {
                    verificado: false,
                    ya_verificado: false,
                    mensaje: 'Token de verificación inválido o expirado'
                };
            }

            const usuario = usuarioResult.rows[0];

            if (usuario.email_verificado) {
                return {
                    ya_verificado: true,
                    verificado: false,
                    email: usuario.email,
                    mensaje: 'El email ya había sido verificado anteriormente'
                };
            }

            // Marcar como verificado
            const updateResult = await db.query(`
                UPDATE usuarios
                SET
                    email_verificado = true,
                    token_verificacion_usado_en = NOW(),
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING id, email
            `, [usuario.id]);

            return {
                verificado: true,
                mensaje: 'Email verificado exitosamente',
                email: updateResult.rows[0].email
            };
        });
    }

    /**
     * Registra un intento de login (exitoso o fallido)
     *
     * @param {string} email - Email del intento
     * @param {boolean} exitoso - Si el intento fue exitoso
     * @param {string|null} ipAddress - IP del cliente
     */
    static async registrarIntentoLogin(email, exitoso, ipAddress = null) {
        const db = await getDb();

        try {
            await RLSHelper.withRole(db, 'login_context', async (db) => {
                await db.query('SELECT registrar_intento_login($1, $2, $3)', [
                    email,
                    exitoso,
                    ipAddress
                ]);
            });
        } catch (error) {
            logger.error('Error al registrar intento de login:', error);
        } finally {
            db.release();
        }
    }

    // ========================================================================
    // MÉTODOS PRIVADOS
    // ========================================================================

    /**
     * Busca usuario para autenticación con todos los datos necesarios
     * @private
     */
    static async _buscarUsuarioParaAuth(email) {
        const db = await getDb();

        try {
            return await RLSHelper.withContext(db, { loginEmail: email, bypass: true }, async (db) => {
                const query = `
                    SELECT u.id, u.email, u.password_hash, u.nombre, u.apellidos, u.telefono,
                           u.rol_id, u.organizacion_id, u.profesional_id, u.activo, u.email_verificado,
                           u.ultimo_login, u.intentos_fallidos, u.bloqueado_hasta,
                           u.onboarding_completado,
                           r.codigo AS rol_codigo,
                           r.nombre AS rol_nombre,
                           r.nivel_jerarquia,
                           r.bypass_permisos,
                           r.es_rol_sistema,
                           (SELECT us.sucursal_id FROM usuarios_sucursales us
                            WHERE us.usuario_id = u.id AND us.activo = TRUE LIMIT 1) as sucursal_id,
                           COALESCE(
                               (SELECT s.moneda FROM sucursales s
                                JOIN usuarios_sucursales us ON us.sucursal_id = s.id
                                WHERE us.usuario_id = u.id AND us.activo = TRUE
                                AND s.moneda IS NOT NULL LIMIT 1),
                               o.moneda
                           ) as moneda,
                           o.zona_horaria
                    FROM usuarios u
                    LEFT JOIN organizaciones o ON o.id = u.organizacion_id
                    LEFT JOIN roles r ON r.id = u.rol_id
                        AND (r.organizacion_id = u.organizacion_id OR r.es_rol_sistema = true)
                    WHERE u.email = $1 AND u.activo = TRUE
                `;

                const result = await db.query(query, [email]);
                return result.rows[0] || null;
            });
        } finally {
            db.release();
        }
    }

    /**
     * Busca usuario por ID con bypass RLS
     * @private
     */
    static async _buscarUsuarioPorId(id) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    u.id, u.email, u.nombre, u.apellidos, u.telefono,
                    u.rol_id, r.codigo as rol_codigo, r.nombre as rol_nombre,
                    r.nivel_jerarquia, r.bypass_permisos, r.es_rol_sistema,
                    u.organizacion_id, u.profesional_id, u.activo, u.email_verificado,
                    u.onboarding_completado,
                    (SELECT us.sucursal_id FROM usuarios_sucursales us
                     WHERE us.usuario_id = u.id AND us.activo = TRUE LIMIT 1) as sucursal_id
                FROM usuarios u
                LEFT JOIN roles r ON r.id = u.rol_id
                WHERE u.id = $1 AND u.activo = TRUE
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Limpia datos sensibles del usuario para respuesta
     * @private
     */
    static _limpiarUsuarioParaRespuesta(usuario) {
        return {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            apellidos: usuario.apellidos,
            telefono: usuario.telefono,
            rol_id: usuario.rol_id,
            rol_codigo: usuario.rol_codigo,
            rol_nombre: usuario.rol_nombre,
            nivel_jerarquia: usuario.nivel_jerarquia || 10,
            organizacion_id: usuario.organizacion_id,
            profesional_id: usuario.profesional_id,
            email_verificado: usuario.email_verificado,
            onboarding_completado: usuario.onboarding_completado,
            moneda: usuario.moneda || 'MXN',
            zona_horaria: usuario.zona_horaria || 'America/Mexico_City'
        };
    }
}

module.exports = AuthModel;
