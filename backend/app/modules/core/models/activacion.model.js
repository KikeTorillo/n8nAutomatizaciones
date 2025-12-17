/**
 * ====================================================================
 * MODELO ACTIVACIÓN DE CUENTA
 * ====================================================================
 *
 * Gestiona activaciones de cuenta para el onboarding simplificado.
 * Flujo: Registro sin password → Email activación → Crear password
 *
 * Patrón reutilizado de: invitacion.model.js
 * Nov 2025 - Fase 2: Onboarding Simplificado
 *
 * @module modules/core/models/activacion.model
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const TokenManager = require('../../../utils/tokenManager');
const logger = require('../../../utils/logger');

class ActivacionModel {

    /**
     * Crear nueva activación pendiente
     * Dic 2025 - Flujo unificado: organizacion_id es opcional (null para registro simplificado)
     *
     * @param {Object} data - Datos de la activación
     * @param {number} [data.organizacion_id] - ID de la organización (null para flujo simplificado)
     * @param {string} data.email - Email del usuario
     * @param {string} data.nombre - Nombre completo del usuario
     * @param {boolean} [data.soy_profesional=true] - Si crear profesional al activar
     * @param {number} [data.horas_expiracion=24] - Horas hasta expiración
     * @returns {Promise<Object>} Activación creada con token
     */
    static async crear(data) {
        const {
            organizacion_id = null,  // Nullable para flujo unificado (Dic 2025)
            email,
            nombre,
            soy_profesional = true,  // Default true (caso más común en PYMES)
            horas_expiracion = 24
        } = data;

        const token = TokenManager.generate();

        return RLSContextManager.withBypass(async (db) => {
            // Verificar si ya existe activación pendiente para este email
            const existenteResult = await db.query(`
                SELECT id, estado, expira_en
                FROM activaciones_cuenta
                WHERE email = LOWER($1)
                  AND estado = 'pendiente'
            `, [email]);

            if (existenteResult.rows[0]) {
                throw new Error('Ya existe una activación pendiente para este email');
            }

            // Verificar que el email no esté registrado como usuario
            const emailUsuarioResult = await db.query(`
                SELECT id FROM usuarios WHERE email = LOWER($1)
            `, [email]);

            if (emailUsuarioResult.rows[0]) {
                throw new Error('Este email ya está registrado en el sistema');
            }

            // Crear activación (organizacion_id puede ser null)
            const activacionResult = await db.query(`
                INSERT INTO activaciones_cuenta (
                    token,
                    organizacion_id,
                    email,
                    nombre,
                    soy_profesional,
                    expira_en,
                    email_enviado_en
                ) VALUES (
                    $1, $2, LOWER($3), $4, $5,
                    NOW() + INTERVAL '${horas_expiracion} hours',
                    NOW()
                )
                RETURNING *
            `, [token, organizacion_id, email, nombre, soy_profesional]);

            const activacion = activacionResult.rows[0];

            logger.info(`[ActivacionModel.crear] Activación creada para ${email}`, {
                activacion_id: activacion.id,
                organizacion_id: organizacion_id || 'sin-org (flujo unificado)',
                expira_en: activacion.expira_en
            });

            return activacion;
        });
    }

    /**
     * Crear magic link para usuario existente
     * @param {Object} data - Datos del magic link
     * @param {string} data.email - Email del usuario existente
     * @param {number} [data.minutos_expiracion=15] - Minutos hasta expiración
     * @returns {Promise<Object>} Magic link creado con token
     */
    static async crearMagicLink(data) {
        const {
            email,
            minutos_expiracion = 15
        } = data;

        const token = TokenManager.generate();

        return RLSContextManager.withBypass(async (db) => {
            // Verificar que el usuario existe
            const usuarioResult = await db.query(`
                SELECT id, email, nombre, organizacion_id
                FROM usuarios
                WHERE email = LOWER($1) AND activo = TRUE
            `, [email]);

            if (!usuarioResult.rows[0]) {
                // Por seguridad, no revelar si el email existe o no
                // Retornamos éxito simulado para evitar enumeración de usuarios
                logger.info(`[ActivacionModel.crearMagicLink] Email no encontrado: ${email}`);
                return {
                    token: null,
                    email,
                    expira_en: null,
                    simulado: true // Para que el controller sepa que no debe enviar email
                };
            }

            const usuario = usuarioResult.rows[0];

            // Invalidar magic links anteriores pendientes para este email
            await db.query(`
                UPDATE activaciones_cuenta
                SET estado = 'expirada'
                WHERE email = LOWER($1)
                  AND tipo = 'magic_link'
                  AND estado = 'pendiente'
            `, [email]);

            // Crear magic link
            const magicLinkResult = await db.query(`
                INSERT INTO activaciones_cuenta (
                    token,
                    organizacion_id,
                    email,
                    nombre,
                    tipo,
                    expira_en,
                    email_enviado_en
                ) VALUES (
                    $1, NULL, LOWER($2), NULL, 'magic_link',
                    NOW() + INTERVAL '${minutos_expiracion} minutes',
                    NOW()
                )
                RETURNING *
            `, [token, email]);

            const magicLink = magicLinkResult.rows[0];

            logger.info(`[ActivacionModel.crearMagicLink] Magic link creado para ${email}`, {
                activacion_id: magicLink.id,
                expira_en: magicLink.expira_en
            });

            return {
                ...magicLink,
                usuario_nombre: usuario.nombre,
                simulado: false
            };
        });
    }

    /**
     * Verificar y autenticar con magic link
     * @param {string} token - Token del magic link
     * @returns {Promise<Object>} Usuario autenticado
     */
    static async verificarMagicLink(token) {
        // Validar formato del token
        if (!TokenManager.isValidFormat(token)) {
            return { valido: false, error: 'Enlace inválido' };
        }

        return RLSContextManager.withBypass(async (db) => {
            // Marcar expiradas primero
            await db.query(`SELECT marcar_activaciones_expiradas()`);

            // Buscar magic link pendiente
            const magicLinkResult = await db.query(`
                SELECT a.*
                FROM activaciones_cuenta a
                WHERE a.token = $1 AND a.tipo = 'magic_link'
            `, [token]);

            const magicLink = magicLinkResult.rows[0];

            if (!magicLink) {
                return { valido: false, error: 'Enlace no encontrado o ya utilizado' };
            }

            if (magicLink.estado === 'activada') {
                return { valido: false, error: 'Este enlace ya fue utilizado' };
            }

            if (magicLink.estado === 'expirada' || new Date(magicLink.expira_en) < new Date()) {
                return { valido: false, error: 'El enlace ha expirado. Solicita uno nuevo.' };
            }

            // Buscar usuario
            const usuarioResult = await db.query(`
                SELECT u.id, u.email, u.nombre, u.apellidos, u.rol, u.organizacion_id,
                       u.activo, u.email_verificado, u.onboarding_completado,
                       o.nombre_comercial
                FROM usuarios u
                LEFT JOIN organizaciones o ON u.organizacion_id = o.id
                WHERE u.email = LOWER($1) AND u.activo = TRUE
            `, [magicLink.email]);

            const usuario = usuarioResult.rows[0];

            if (!usuario) {
                return { valido: false, error: 'Usuario no encontrado' };
            }

            // Marcar magic link como usado
            await db.query(`
                UPDATE activaciones_cuenta
                SET estado = 'activada',
                    usuario_id = $1,
                    activada_en = NOW()
                WHERE id = $2
            `, [usuario.id, magicLink.id]);

            // Actualizar último login del usuario
            await db.query(`
                UPDATE usuarios
                SET ultimo_login = NOW()
                WHERE id = $1
            `, [usuario.id]);

            logger.info(`[ActivacionModel.verificarMagicLink] Login exitoso via magic link`, {
                usuario_id: usuario.id,
                email: usuario.email
            });

            return {
                valido: true,
                usuario: {
                    id: usuario.id,
                    email: usuario.email,
                    nombre: usuario.nombre,
                    apellidos: usuario.apellidos,
                    rol: usuario.rol,
                    organizacion_id: usuario.organizacion_id,
                    email_verificado: usuario.email_verificado,
                    onboarding_completado: usuario.onboarding_completado
                },
                organizacion: usuario.nombre_comercial ? {
                    nombre_comercial: usuario.nombre_comercial
                } : null
            };
        });
    }

    /**
     * Validar token de activación (público, sin RLS)
     * @param {string} token - Token de la activación
     * @returns {Promise<Object>} Resultado de validación con datos de la activación
     */
    static async validarToken(token) {
        // Validar formato del token
        if (!TokenManager.isValidFormat(token)) {
            return { valido: false, error: 'Formato de enlace inválido' };
        }

        return RLSContextManager.withBypass(async (db) => {
            // Marcar expiradas primero
            await db.query(`SELECT marcar_activaciones_expiradas()`);

            // LEFT JOIN para soportar magic_link (sin organizacion_id)
            const activacionResult = await db.query(`
                SELECT
                    a.*,
                    o.nombre_comercial,
                    o.logo_url
                FROM activaciones_cuenta a
                LEFT JOIN organizaciones o ON a.organizacion_id = o.id
                WHERE a.token = $1
            `, [token]);

            const activacion = activacionResult.rows[0];

            if (!activacion) {
                return { valido: false, error: 'Enlace de activación no encontrado' };
            }

            if (activacion.estado === 'activada') {
                return { valido: false, error: 'Esta cuenta ya fue activada. Puedes iniciar sesión.' };
            }

            if (activacion.estado === 'expirada') {
                return { valido: false, error: 'El enlace de activación ha expirado. Solicita uno nuevo.' };
            }

            // Calcular tiempo restante
            const tiempoRestante = TokenManager.getTimeRemaining(activacion.expira_en);

            if (tiempoRestante.expired) {
                // Marcar como expirada
                await db.query(`
                    UPDATE activaciones_cuenta SET estado = 'expirada' WHERE id = $1
                `, [activacion.id]);
                return { valido: false, error: 'El enlace de activación ha expirado' };
            }

            return {
                valido: true,
                activacion: {
                    id: activacion.id,
                    email: activacion.email,
                    nombre: activacion.nombre,
                    nombre_negocio: activacion.nombre_comercial,
                    logo_url: activacion.logo_url,
                    organizacion_id: activacion.organizacion_id,
                    soy_profesional: activacion.soy_profesional,  // Para crear profesional al activar
                    expira_en: activacion.expira_en,
                    tiempo_restante: TokenManager.formatTimeRemaining(activacion.expira_en),
                    minutos_restantes: tiempoRestante.minutes
                }
            };
        });
    }

    /**
     * Activar cuenta (crear usuario)
     * Dic 2025 - Flujo unificado: soporta activación sin organización
     * Si no hay organizacion_id, crea usuario con onboarding_completado=false
     *
     * @param {string} token - Token de la activación
     * @param {string} password_hash - Hash de la contraseña (bcrypt)
     * @returns {Promise<Object>} Usuario creado y datos de la organización (si existe)
     */
    static async activar(token, password_hash) {
        return RLSContextManager.withBypass(async (db) => {
            // Obtener y validar activación (LEFT JOIN para soportar sin org)
            const activacionResult = await db.query(`
                SELECT a.*, o.nombre_comercial
                FROM activaciones_cuenta a
                LEFT JOIN organizaciones o ON a.organizacion_id = o.id
                WHERE a.token = $1 AND a.estado = 'pendiente'
            `, [token]);

            const activacion = activacionResult.rows[0];

            if (!activacion) {
                throw new Error('Enlace de activación no válido o ya utilizado');
            }

            // Verificar expiración
            if (new Date(activacion.expira_en) < new Date()) {
                await db.query(`
                    UPDATE activaciones_cuenta
                    SET estado = 'expirada'
                    WHERE id = $1
                `, [activacion.id]);
                throw new Error('El enlace de activación ha expirado');
            }

            // Separar nombre y apellidos
            const nombrePartes = activacion.nombre.trim().split(/\s+/);
            const nombre = nombrePartes[0] || 'Usuario';
            const apellidos = nombrePartes.slice(1).join(' ') || null;

            // Determinar si tiene organización (flujo legacy vs unificado)
            const tieneOrganizacion = !!activacion.organizacion_id;

            // Crear usuario
            // - Con org: rol='admin', onboarding_completado implícito
            // - Sin org: rol='admin' (temporal), onboarding_completado=false
            const usuarioResult = await db.query(`
                INSERT INTO usuarios (
                    organizacion_id,
                    email,
                    password_hash,
                    nombre,
                    apellidos,
                    rol,
                    activo,
                    email_verificado,
                    onboarding_completado
                ) VALUES (
                    $1, LOWER($2), $3, $4, $5, 'admin', TRUE, TRUE, $6
                )
                RETURNING id, email, nombre, apellidos, rol, organizacion_id, activo,
                          email_verificado, onboarding_completado, creado_en
            `, [
                activacion.organizacion_id,  // null si flujo unificado
                activacion.email,
                password_hash,
                nombre,
                apellidos,
                tieneOrganizacion  // onboarding_completado = true solo si ya tiene org
            ]);

            const usuario = usuarioResult.rows[0];

            // Marcar activación como completada
            await db.query(`
                UPDATE activaciones_cuenta
                SET estado = 'activada',
                    usuario_id = $1,
                    activada_en = NOW()
                WHERE id = $2
            `, [usuario.id, activacion.id]);

            logger.info(`[ActivacionModel.activar] Cuenta activada exitosamente`, {
                usuario_id: usuario.id,
                email: usuario.email,
                organizacion_id: activacion.organizacion_id || 'pendiente-onboarding',
                requiere_onboarding: !tieneOrganizacion
            });

            return {
                usuario,
                organizacion: tieneOrganizacion ? {
                    id: activacion.organizacion_id,
                    nombre_comercial: activacion.nombre_comercial
                } : null,
                soy_profesional: activacion.soy_profesional,
                requiere_onboarding: !tieneOrganizacion
            };
        });
    }

    /**
     * Reenviar activación (genera nuevo token)
     * @param {string} email - Email de la activación
     * @returns {Promise<Object>} Nueva activación con token actualizado
     */
    static async reenviar(email) {
        const nuevoToken = TokenManager.generate();

        return RLSContextManager.withBypass(async (db) => {
            // Buscar activación pendiente
            const anteriorResult = await db.query(`
                SELECT id, organizacion_id, nombre, reenvios
                FROM activaciones_cuenta
                WHERE email = LOWER($1) AND estado = 'pendiente'
                ORDER BY creado_en DESC
                LIMIT 1
            `, [email]);

            const anterior = anteriorResult.rows[0];

            if (!anterior) {
                throw new Error('No hay activación pendiente para este email');
            }

            // Limitar reenvíos (máximo 5)
            if (anterior.reenvios >= 5) {
                throw new Error('Se ha excedido el límite de reenvíos. Contacta soporte.');
            }

            // Actualizar con nuevo token y extender expiración
            const nuevaResult = await db.query(`
                UPDATE activaciones_cuenta
                SET token = $1,
                    expira_en = NOW() + INTERVAL '24 hours',
                    reenvios = reenvios + 1,
                    ultimo_reenvio = NOW(),
                    email_enviado_en = NOW()
                WHERE id = $2
                RETURNING *
            `, [nuevoToken, anterior.id]);

            logger.info(`[ActivacionModel.reenviar] Activación reenviada para ${email}`, {
                activacion_id: anterior.id,
                reenvio_numero: anterior.reenvios + 1
            });

            return nuevaResult.rows[0];
        });
    }

    /**
     * Obtener activación por email
     * Dic 2025 - Soporta activaciones sin organización (LEFT JOIN)
     * @param {string} email - Email a buscar
     * @returns {Promise<Object|null>} Activación encontrada o null
     */
    static async obtenerPorEmail(email) {
        return RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                SELECT a.*, o.nombre_comercial
                FROM activaciones_cuenta a
                LEFT JOIN organizaciones o ON a.organizacion_id = o.id
                WHERE a.email = LOWER($1)
                ORDER BY a.creado_en DESC
                LIMIT 1
            `, [email]);

            return result.rows[0] || null;
        });
    }

    /**
     * Limpiar activaciones expiradas (para job de mantenimiento)
     * @param {number} diasAntiguedad - Eliminar expiradas hace más de X días
     * @returns {Promise<number>} Número de registros eliminados
     */
    static async limpiarExpiradas(diasAntiguedad = 30) {
        return RLSContextManager.withBypass(async (db) => {
            // Primero marcar expiradas
            await db.query(`SELECT marcar_activaciones_expiradas()`);

            // Luego eliminar las muy antiguas
            const result = await db.query(`
                DELETE FROM activaciones_cuenta
                WHERE estado = 'expirada'
                  AND actualizado_en < NOW() - INTERVAL '${diasAntiguedad} days'
            `);

            const eliminadas = result.rowCount;

            if (eliminadas > 0) {
                logger.info(`[ActivacionModel.limpiarExpiradas] Eliminadas ${eliminadas} activaciones expiradas`);
            }

            return eliminadas;
        });
    }
}

module.exports = ActivacionModel;
