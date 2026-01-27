const { getDb } = require('../../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../../../utils/logger');
const RLSHelper = require('../../../utils/rlsHelper');
const RLSContextManager = require('../../../utils/rlsContextManager');
const emailService = require('../../../services/emailService');
const RutasOperacionModel = require('../../inventario/models/rutas-operacion.model');
const SecureRandom = require('../../../utils/helpers/SecureRandom');
const tokenBlacklistService = require('../../../services/tokenBlacklistService');
const { ErrorHelper } = require('../../../utils/helpers');

const AUTH_CONFIG = {
    BCRYPT_SALT_ROUNDS: 12,
    TOKEN_RESET_EXPIRATION_HOURS: 1,
    ACCESS_TOKEN_EXPIRATION: '1h',
    ACCESS_TOKEN_EXPIRATION_SECONDS: 3600,
    REFRESH_TOKEN_EXPIRATION: '7d',
    RESET_TOKEN_LENGTH: 32
};

class UsuarioModel {

    static async crear(userData) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        try {
            return await RLSContextManager.withBypass(async (db) => {
                const password_hash = await bcrypt.hash(userData.password, AUTH_CONFIG.BCRYPT_SALT_ROUNDS);

                // Obtener rol_id basado en código de rol
                const rolCodigo = userData.rol_codigo || userData.rol || 'empleado';
                let rolId = userData.rol_id || null;

                if (!rolId) {
                    // Buscar rol_id: primero en la organización, luego rol de sistema
                    const rolQuery = userData.organizacion_id
                        ? `SELECT id FROM roles WHERE codigo = $1 AND (organizacion_id = $2 OR es_rol_sistema = TRUE) LIMIT 1`
                        : `SELECT id FROM roles WHERE codigo = $1 AND es_rol_sistema = TRUE LIMIT 1`;

                    const rolParams = userData.organizacion_id
                        ? [rolCodigo, userData.organizacion_id]
                        : [rolCodigo];

                    const rolResult = await db.query(rolQuery, rolParams);
                    rolId = rolResult.rows[0]?.id || null;

                    if (!rolId) {
                        ErrorHelper.throwValidation(`Rol '${rolCodigo}' no encontrado`);
                    }
                }

                const query = `
                    INSERT INTO usuarios (
                        email, password_hash, nombre, apellidos, telefono, rol_id,
                        organizacion_id, profesional_id, activo, email_verificado
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING id, email, nombre, apellidos, telefono, rol_id,
                             organizacion_id, profesional_id, activo, email_verificado,
                             creado_en, actualizado_en
                `;

                const values = [
                    userData.email,
                    password_hash,
                    userData.nombre,
                    userData.apellidos || null,
                    userData.telefono || null,
                    rolId,
                    userData.organizacion_id || null,
                    userData.profesional_id || null,
                    userData.activo !== undefined ? userData.activo : true,
                    userData.email_verificado !== undefined ? userData.email_verificado : false
                ];

                const result = await db.query(query, values);
                return result.rows[0];
            });
        } catch (error) {
            if (error.code === '23505') { // Duplicate key
                ErrorHelper.throwConflict('El email ya está registrado en el sistema');
            }
            throw error;
        }
    }

    /**
     * Buscar usuario por email
     * Usado para login (no requiere RLS context de organización)
     *
     * FIX: Usa RLSHelper.withLoginEmail() para establecer app.login_email
     * y satisfacer política RLS usuarios_unified_access que requiere:
     * current_setting('app.login_email') = email
     */
    static async buscarPorEmail(email) {
        const db = await getDb();

        try {
            // Usar bypass para acceder a usuarios_sucursales durante login
            return await RLSHelper.withContext(db, { loginEmail: email, bypass: true }, async (db) => {
                // Incluir rol_id y datos del rol dinámico
                const query = `
                    SELECT u.id, u.email, u.password_hash, u.nombre, u.apellidos, u.telefono,
                           u.rol_id, u.organizacion_id, u.profesional_id, u.activo, u.email_verificado,
                           u.ultimo_login, u.intentos_fallidos, u.bloqueado_hasta,
                           u.onboarding_completado,
                           -- Datos del rol dinámico
                           r.codigo AS rol_codigo,
                           r.nombre AS rol_nombre,
                           r.nivel_jerarquia,
                           r.bypass_permisos,
                           r.es_rol_sistema,
                           (SELECT us.sucursal_id FROM usuarios_sucursales us
                            WHERE us.usuario_id = u.id AND us.activo = TRUE LIMIT 1) as sucursal_id,
                           -- Moneda: sucursal override > organización (Dic 2025)
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
                    -- JOIN con condición para satisfacer RLS de roles
                    -- (roles pueden ser de sistema o de la misma organización del usuario)
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

    static async verificarPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    static async autenticar(email, password, ipAddress = null) {
        // Buscar usuario
        const usuario = await this.buscarPorEmail(email);

        if (!usuario) {
            // Registrar intento de login fallido para email no existente
            await this.registrarIntentoLogin(email, false, ipAddress);
            ErrorHelper.throwUnauthorized('Credenciales inválidas');
        }

        // Verificar si el usuario está bloqueado
        if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
            const tiempoBloqueo = Math.ceil((new Date(usuario.bloqueado_hasta) - new Date()) / 60000);
            ErrorHelper.throwUnauthorized(`Usuario bloqueado. Intente nuevamente en ${tiempoBloqueo} minutos`);
        }

        // Verificar contraseña
        const passwordValida = await this.verificarPassword(password, usuario.password_hash);

        if (!passwordValida) {
            // Registrar intento fallido
            await this.registrarIntentoLogin(email, false, ipAddress);
            ErrorHelper.throwUnauthorized('Credenciales inválidas');
        }

        // Login exitoso - registrar y limpiar intentos fallidos
        await this.registrarIntentoLogin(email, true, ipAddress);

        // Configurar contexto RLS para futuras operaciones
        // FASE 7: Usar rol_codigo del sistema dinámico
        const db = await getDb();
        try {
            await RLSHelper.configurarContexto(db, usuario.id, usuario.rol_codigo, usuario.organizacion_id);
        } finally {
            db.release();
        }

        // Generar tokens
        const { accessToken, refreshToken } = this.generarTokens(usuario);

        // Preparar datos del usuario (sin información sensible)
        // FASE 7 COMPLETADA (Ene 2026): Solo sistema de roles dinámicos
        const usuarioSeguro = {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            apellidos: usuario.apellidos,
            telefono: usuario.telefono,
            // Sistema de roles dinámicos (solo rol_id como fuente de verdad)
            rol_id: usuario.rol_id,                              // FK al sistema de roles dinámicos
            rol_codigo: usuario.rol_codigo,                      // Código del rol (para lógica de negocio)
            rol_nombre: usuario.rol_nombre,                      // Nombre legible del rol (para UI)
            nivel_jerarquia: usuario.nivel_jerarquia || 10,      // Nivel jerárquico para guards de rutas
            // Contexto organizacional
            organizacion_id: usuario.organizacion_id,
            profesional_id: usuario.profesional_id,
            email_verificado: usuario.email_verificado,
            onboarding_completado: usuario.onboarding_completado,
            // Multi-moneda
            moneda: usuario.moneda || 'MXN',
            zona_horaria: usuario.zona_horaria || 'America/Mexico_City'
        };

        // Determinar si requiere onboarding (Dic 2025)
        // Ene 2026: Roles de sistema (super_admin, bot) NUNCA requieren onboarding
        const requiereOnboarding = !usuario.es_rol_sistema &&
                                   !usuario.organizacion_id &&
                                   usuario.onboarding_completado === false;

        return {
            usuario: usuarioSeguro,
            accessToken,
            refreshToken,
            expiresIn: AUTH_CONFIG.ACCESS_TOKEN_EXPIRATION_SECONDS,
            requiere_onboarding: requiereOnboarding  // Dic 2025 - Flujo unificado
        };
    }

    static generarTokens(usuario) {
        const crypto = require('crypto');

        // Generar JTI único para garantizar que cada token sea único
        const jti = crypto.randomBytes(16).toString('hex');

        // FASE 7 COMPLETADA (Ene 2026): Solo rol_id en JWT (sistema dinámico)
        const payload = {
            userId: usuario.id,
            email: usuario.email,
            rolId: usuario.rol_id,                   // FK al sistema de roles dinámicos
            organizacionId: usuario.organizacion_id,
            sucursalId: usuario.sucursal_id || null, // Sucursal principal del usuario
            jti: jti // JWT ID único
        };

        const accessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: AUTH_CONFIG.ACCESS_TOKEN_EXPIRATION }
        );

        const refreshToken = jwt.sign(
            { userId: usuario.id, type: 'refresh', jti: crypto.randomBytes(16).toString('hex') },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: AUTH_CONFIG.REFRESH_TOKEN_EXPIRATION }
        );

        return { accessToken, refreshToken };
    }

    static async refrescarToken(refreshToken) {
        try {
            // Verificar refresh token - usar secret dedicado
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

            // Buscar usuario por ID
            const usuario = await this.buscarPorId(decoded.userId);

            if (!usuario || !usuario.activo) {
                ErrorHelper.throwUnauthorized('Usuario no válido');
            }

            const { accessToken } = this.generarTokens(usuario);

            return {
                accessToken,
                expiresIn: AUTH_CONFIG.ACCESS_TOKEN_EXPIRATION_SECONDS
            };

        } catch (error) {
            ErrorHelper.throwUnauthorized('Token de refresco inválido');
        }
    }

    // Usa bypass RLS para operaciones de sistema (refresh tokens, validaciones)
    static async buscarPorId(id) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    u.id, u.email, u.nombre, u.apellidos, u.telefono,
                    u.rol_id, r.codigo as rol_codigo, r.nombre as rol_nombre,
                    r.nivel_jerarquia, r.bypass_permisos, r.es_rol_sistema,
                    u.organizacion_id, u.profesional_id, u.activo, u.email_verificado,
                    u.onboarding_completado,
                    o.categoria_id,
                    ci.codigo as categoria_codigo,
                    o.nombre_comercial,
                    o.plan_actual,
                    o.moneda,
                    o.zona_horaria,
                    (SELECT us.sucursal_id FROM usuarios_sucursales us
                     WHERE us.usuario_id = u.id AND us.activo = TRUE LIMIT 1) as sucursal_id
                FROM usuarios u
                LEFT JOIN roles r ON r.id = u.rol_id
                LEFT JOIN organizaciones o ON u.organizacion_id = o.id
                LEFT JOIN categorias ci ON o.categoria_id = ci.id
                WHERE u.id = $1 AND u.activo = TRUE
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    static async buscarPorIdConRLS(id, organizacionId) {
        // ✅ Usar RLSContextManager para configuración automática de RLS
        // Las políticas PostgreSQL filtran automáticamente por organizacion_id
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT u.id, u.email, u.nombre, u.apellidos, u.telefono,
                       u.rol_id, r.codigo as rol_codigo, r.nombre as rol_nombre,
                       u.organizacion_id, u.profesional_id, u.activo, u.email_verificado,
                       u.ultimo_login, u.zona_horaria, u.idioma, u.creado_en, u.actualizado_en
                FROM usuarios u
                LEFT JOIN roles r ON r.id = u.rol_id
                WHERE u.id = $1 AND u.activo = TRUE
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Buscar usuario con sucursal específica para cambio de contexto
     * Valida pertenencia y retorna usuario con sucursal_id actualizada
     * Ene 2026 - Sucursal dinámica en JWT
     *
     * @param {number} userId - ID del usuario
     * @param {number} sucursalId - ID de la sucursal a la que cambiar
     * @returns {Promise<Object>} Usuario con sucursal actualizada
     * @throws {Error} Si el usuario no tiene acceso a la sucursal
     */
    static async buscarPorIdConSucursal(userId, sucursalId) {
        return await RLSContextManager.withBypass(async (db) => {
            // 1. Verificar pertenencia a la sucursal
            const pertenencia = await db.query(
                `SELECT 1 FROM usuarios_sucursales
                 WHERE usuario_id = $1 AND sucursal_id = $2 AND activo = true`,
                [userId, sucursalId]
            );

            if (pertenencia.rows.length === 0) {
                const error = new Error('No tienes acceso a esta sucursal');
                error.statusCode = 403;
                throw error;
            }

            // 2. Obtener usuario con sucursal especificada
            const query = `
                SELECT
                    u.id, u.email, u.nombre, u.apellidos, u.telefono,
                    u.rol_id, r.codigo as rol_codigo, r.nombre as rol_nombre,
                    r.nivel_jerarquia, r.bypass_permisos, r.es_rol_sistema,
                    u.organizacion_id, u.profesional_id, u.activo,
                    u.email_verificado, u.onboarding_completado,
                    $2::integer as sucursal_id,
                    COALESCE(s.moneda, o.moneda) as moneda,
                    o.zona_horaria
                FROM usuarios u
                LEFT JOIN roles r ON r.id = u.rol_id
                LEFT JOIN organizaciones o ON u.organizacion_id = o.id
                LEFT JOIN sucursales s ON s.id = $2
                WHERE u.id = $1 AND u.activo = TRUE
            `;

            const result = await db.query(query, [userId, sucursalId]);

            ErrorHelper.throwIfNotFound(result.rows[0], 'Usuario');

            return result.rows[0];
        });
    }

    static async registrarIntentoLogin(email, exitoso, ipAddress = null) {
        const db = await getDb();

        try {
            await RLSHelper.withRole(db, 'login_context', async (db) => {
                // Llamar a la función de base de datos para registrar el intento
                await db.query('SELECT registrar_intento_login($1, $2, $3)', [
                    email,
                    exitoso,
                    ipAddress
                ]);
            });
        } catch (error) {
            // Log error pero no fallar el login por esto
            logger.error('Error al registrar intento de login:', error);
        } finally {
            db.release();
        }
    }

    static async cambiarPassword(userId, passwordAnterior, passwordNueva) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        // Primero obtener usuario con organizacion_id usando bypass
        const usuario = await RLSContextManager.withBypass(async (db) => {
            const query = `SELECT id, password_hash, organizacion_id FROM usuarios WHERE id = $1 AND activo = TRUE`;
            const result = await db.query(query, [userId]);
            ErrorHelper.throwIfNotFound(result.rows[0], 'Usuario');
            return result.rows[0];
        });

        // Verificar contraseña anterior
        const passwordValida = await this.verificarPassword(passwordAnterior, usuario.password_hash);
        if (!passwordValida) {
            ErrorHelper.throwValidation('Contraseña anterior incorrecta');
        }

        // Actualizar contraseña con contexto RLS
        return await RLSContextManager.transaction(usuario.organizacion_id, async (db) => {
            const nuevoHash = await bcrypt.hash(passwordNueva, AUTH_CONFIG.BCRYPT_SALT_ROUNDS);

            const updateQuery = `
                UPDATE usuarios
                SET password_hash = $1, actualizado_en = NOW()
                WHERE id = $2
            `;

            await db.query(updateQuery, [nuevoHash, userId]);
            return true;
        });
    }

    static async actualizarPerfil(userId, datos, organizacionId, currentUserId) {
        // ✅ Usar RLSContextManager.transaction() para operación con aislamiento automático
        // Las políticas PostgreSQL filtran automáticamente por organizacion_id
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const camposPermitidos = ['nombre', 'apellidos', 'telefono', 'zona_horaria', 'idioma', 'configuracion_ui'];
            const campos = [];
            const valores = [];
            let contador = 1;

            for (const [campo, valor] of Object.entries(datos)) {
                if (camposPermitidos.includes(campo) && valor !== undefined) {
                    campos.push(`${campo} = $${contador}`);
                    valores.push(valor);
                    contador++;
                }
            }

            if (campos.length === 0) {
                ErrorHelper.throwValidation('No hay campos válidos para actualizar');
            }

            // ✅ Sin filtro manual de organizacion_id - RLS lo maneja automáticamente
            const query = `
                UPDATE usuarios
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${contador}
                RETURNING id, email, nombre, apellidos, telefono, organizacion_id,
                         profesional_id, activo, email_verificado, zona_horaria, idioma,
                         creado_en, actualizado_en
            `;

            valores.push(userId);

            const result = await db.query(query, valores);
            return result.rows[0] || null;
        });
    }

    static async desbloquearUsuario(userId, adminId, organizacionId) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            // Validar que el usuario existe y pertenece a la organización
            const validacionQuery = `
                SELECT u.id, u.email, u.nombre, u.apellidos, u.rol_id,
                       r.codigo as rol_codigo, u.organizacion_id, u.activo
                FROM usuarios u
                LEFT JOIN roles r ON r.id = u.rol_id
                WHERE u.id = $1 AND u.organizacion_id = $2 AND u.activo = TRUE
            `;
            const validacion = await db.query(validacionQuery, [userId, organizacionId]);

            ErrorHelper.throwIfNotFound(validacion.rows[0], 'Usuario en la organización');

            const query = `
                UPDATE usuarios
                SET
                    intentos_fallidos = 0,
                    bloqueado_hasta = NULL,
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2 AND activo = TRUE
                RETURNING id, email, nombre, apellidos, rol_id, organizacion_id,
                         intentos_fallidos, bloqueado_hasta, activo
            `;

            const result = await db.query(query, [userId, organizacionId]);
            return result.rows[0];
        });
    }

    static async obtenerUsuariosBloqueados(organizacionId) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT u.id, u.email, u.nombre, u.apellidos, u.rol_id,
                       r.codigo as rol_codigo, r.nombre as rol_nombre,
                       u.intentos_fallidos, u.bloqueado_hasta, u.ultimo_login, u.creado_en
                FROM usuarios u
                LEFT JOIN roles r ON r.id = u.rol_id
                WHERE u.organizacion_id = $1
                  AND u.bloqueado_hasta IS NOT NULL
                  AND u.bloqueado_hasta > NOW()
                  AND u.activo = TRUE
                ORDER BY u.bloqueado_hasta DESC
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }

    static async verificarBloqueo(userId, contextRole = 'super_admin') {
        const db = await getDb();

        try {
            // Configurar contexto según el rol (super_admin o self-access)
            const contextConfig = contextRole === 'super_admin'
                ? { role: 'super_admin' }
                : { userId: userId };

            return await RLSHelper.withContext(db, contextConfig, async (db) => {
                const query = `
                    SELECT id, email, intentos_fallidos, bloqueado_hasta,
                           CASE
                               WHEN bloqueado_hasta IS NULL THEN FALSE
                               WHEN bloqueado_hasta > NOW() THEN TRUE
                               ELSE FALSE
                           END as esta_bloqueado,
                           CASE
                               WHEN bloqueado_hasta > NOW() THEN EXTRACT(EPOCH FROM (bloqueado_hasta - NOW()))/60
                               ELSE 0
                           END as minutos_restantes
                    FROM usuarios
                    WHERE id = $1 AND activo = TRUE
                `;

                const result = await db.query(query, [userId]);
                return result.rows[0] || null;
            });
        } finally {
            db.release();
        }
    }

    static async crearUsuarioOrganizacion(orgId, userData, rol, opciones = {}) {
        // ✅ FIX v2.1: Usar transactionWithBypass en lugar de BEGIN/COMMIT manual
        return await RLSContextManager.transactionWithBypass(async (db) => {
                // Validar que la organización existe
                const orgQuery = `
                    SELECT id, nombre_comercial, email_admin, categoria_id, activo
                    FROM organizaciones
                    WHERE id = $1 AND activo = true
                `;
                const orgResult = await db.query(orgQuery, [orgId]);

                ErrorHelper.throwIfNotFound(orgResult.rows[0], 'Organización');

                const organizacion = orgResult.rows[0];

                // Preparar datos de usuario con organización
                const usuarioData = {
                    ...userData,
                    organizacion_id: orgId,
                    rol: rol,
                    activo: true,
                    email_verificado: opciones.verificar_email_automaticamente || false
                };

                // Crear usuario usando el método existente
                const nuevoUsuario = await this.crear(usuarioData);

                await RLSHelper.configurarContexto(db, nuevoUsuario.id, rol, orgId);

                await RLSHelper.registrarEvento(db, {
                    organizacion_id: orgId,
                    evento_tipo: 'usuario_creado',
                    entidad_tipo: 'usuario',
                    entidad_id: nuevoUsuario.id,
                    descripcion: `Usuario ${rol} creado automáticamente durante onboarding`,
                    metadatos: {
                        rol: rol,
                        email: nuevoUsuario.email,
                        nombre_completo: `${nuevoUsuario.nombre} ${nuevoUsuario.apellidos || ''}`.trim(),
                        organizacion_nombre: organizacion.nombre_comercial
                    },
                    usuario_id: nuevoUsuario.id
                });

                // TODO: Enviar email de bienvenida (integración futura)
                let emailResult = null;
                if (opciones.enviar_email_bienvenida) {
                    emailResult = {
                        enviado: false,
                        mensaje: 'Email de bienvenida pendiente de implementación'
                    };
                }

            return {
                usuario: nuevoUsuario,
                organizacion: {
                    id: organizacion.id,
                    nombre_comercial: organizacion.nombre_comercial
                },
                configuracion_rls: true,
                email_bienvenida: emailResult
            };
            // COMMIT automático al finalizar, ROLLBACK automático si hay error
        });
    }

    static async listarPorOrganizacion(orgId, filtros = {}, paginacion = {}) {
        // ✅ Usar RLSContextManager.query() para configuración automática de RLS
        // Las políticas PostgreSQL filtran automáticamente por organizacion_id
        return await RLSContextManager.query(orgId, async (db) => {
            const {
                rol = null,
                activo = null,
                email_verificado = null,
                buscar = null
            } = filtros;

            const {
                page = 1,
                limit = 10,
                order_by = 'creado_en',
                order_direction = 'DESC'
            } = paginacion;

            const offset = (page - 1) * limit;

            // Construir WHERE dinámico (sin filtro manual de organizacion_id - RLS lo maneja)
            let whereConditions = [];
            let queryParams = [];
            let paramCounter = 1;

            // Filtrar por código de rol (usando JOIN con tabla roles)
            if (rol) {
                whereConditions.push(`r.codigo = $${paramCounter}`);
                queryParams.push(rol);
                paramCounter++;
            }

            if (activo !== null) {
                whereConditions.push(`u.activo = $${paramCounter}`);
                queryParams.push(activo);
                paramCounter++;
            }

            if (email_verificado !== null) {
                whereConditions.push(`u.email_verificado = $${paramCounter}`);
                queryParams.push(email_verificado);
                paramCounter++;
            }

            if (buscar) {
                whereConditions.push(`(
                    u.nombre ILIKE $${paramCounter} OR
                    u.apellidos ILIKE $${paramCounter} OR
                    u.email ILIKE $${paramCounter}
                )`);
                queryParams.push(`%${buscar}%`);
                paramCounter++;
            }

            // Si no hay condiciones, usar TRUE para evitar WHERE vacío
            const whereClause = whereConditions.length > 0
                ? whereConditions.join(' AND ')
                : 'TRUE';

            // Validar order_by para evitar SQL injection
            const orderByPermitidos = ['creado_en', 'nombre', 'email', 'ultimo_login', 'id'];
            const orderBySeguro = orderByPermitidos.includes(order_by) ? order_by : 'creado_en';
            const orderDirSeguro = order_direction === 'ASC' ? 'ASC' : 'DESC';

            // Query para contar total de registros
            const countQuery = `
                SELECT COUNT(*) as total
                FROM usuarios u
                LEFT JOIN roles r ON r.id = u.rol_id
                WHERE ${whereClause}
            `;

            // Query principal con joins a profesionales y roles
            const dataQuery = `
                SELECT
                    u.id, u.organizacion_id, u.email, u.nombre, u.apellidos, u.telefono,
                    u.rol_id, r.codigo as rol_codigo, r.nombre as rol_nombre,
                    r.nivel_jerarquia, r.bypass_permisos,
                    u.activo, u.email_verificado, u.ultimo_login, u.intentos_fallidos,
                    u.bloqueado_hasta, u.creado_en, u.actualizado_en,
                    p.id as profesional_id,
                    p.nombre_completo as profesional_nombre,
                    -- Calcular estado de bloqueo
                    CASE
                        WHEN u.bloqueado_hasta IS NULL THEN FALSE
                        WHEN u.bloqueado_hasta > NOW() THEN TRUE
                        ELSE FALSE
                    END as esta_bloqueado,
                    CASE
                        WHEN u.bloqueado_hasta > NOW() THEN EXTRACT(EPOCH FROM (u.bloqueado_hasta - NOW()))/60
                        ELSE 0
                    END as minutos_restantes_bloqueo
                FROM usuarios u
                LEFT JOIN roles r ON r.id = u.rol_id
                LEFT JOIN profesionales p ON p.usuario_id = u.id
                WHERE ${whereClause}
                ORDER BY u.${orderBySeguro} ${orderDirSeguro}
                LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
            `;

            // Ejecutar queries
            const [countResult, dataResult] = await Promise.all([
                db.query(countQuery, queryParams),
                db.query(dataQuery, [...queryParams, limit, offset])
            ]);

            const total = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(total / limit);

            return {
                data: dataResult.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                },
                filtros_aplicados: filtros,
                resumen: {
                    total_usuarios: total,
                    usuarios_activos: dataResult.rows.filter(u => u.activo).length,
                    usuarios_bloqueados: dataResult.rows.filter(u => u.esta_bloqueado).length
                }
            };
        });
    }

    static async cambiarRol(userId, nuevoRolCodigo, orgId, adminId) {
        return await RLSContextManager.withBypass(async (db) => {
            // Validar que el usuario existe y pertenece a la organización
            const usuarioQuery = `
                SELECT u.id, u.email, u.nombre, u.apellidos, u.rol_id, u.organizacion_id, u.activo,
                       r.codigo as rol_codigo
                FROM usuarios u
                LEFT JOIN roles r ON r.id = u.rol_id
                WHERE u.id = $1 AND u.organizacion_id = $2 AND u.activo = true
            `;
            const usuarioResult = await db.query(usuarioQuery, [userId, orgId]);

            ErrorHelper.throwIfNotFound(usuarioResult.rows[0], 'Usuario en la organización');

            const usuario = usuarioResult.rows[0];
            const rolCodigoAnterior = usuario.rol_codigo;

            // Buscar el nuevo rol_id basado en el código
            const nuevoRolQuery = `
                SELECT id, codigo, nombre FROM roles
                WHERE codigo = $1 AND organizacion_id = $2
            `;
            const nuevoRolResult = await db.query(nuevoRolQuery, [nuevoRolCodigo, orgId]);

            if (!nuevoRolResult.rows[0]) {
                ErrorHelper.throwValidation(`Rol '${nuevoRolCodigo}' no encontrado en la organización`);
            }

            const nuevoRol = nuevoRolResult.rows[0];

            // Validar que no sea el mismo rol
            if (usuario.rol_id === nuevoRol.id) {
                ErrorHelper.throwConflict('El usuario ya tiene este rol asignado');
            }

            // Actualizar rol_id del usuario
            const updateQuery = `
                UPDATE usuarios
                SET
                    rol_id = $1,
                    actualizado_en = NOW()
                WHERE id = $2 AND organizacion_id = $3
                RETURNING id, email, nombre, apellidos, rol_id, organizacion_id,
                         activo, email_verificado, creado_en, actualizado_en
            `;

            const updateResult = await db.query(updateQuery, [nuevoRol.id, userId, orgId]);

            // SECURITY FIX (Ene 2026): Invalidar tokens del usuario al cambiar rol
            // Esto fuerza al usuario a re-autenticarse con el nuevo rol
            try {
                await tokenBlacklistService.invalidateUserTokens(
                    userId,
                    `cambio_rol_${rolCodigoAnterior}_a_${nuevoRolCodigo}`
                );
                logger.info('[UsuarioModel.cambiarRol] Tokens invalidados por cambio de rol', {
                    usuario_id: userId,
                    rol_anterior: rolCodigoAnterior,
                    rol_nuevo: nuevoRolCodigo
                });
            } catch (tokenError) {
                // No fallar la operación si la invalidación falla
                logger.error('[UsuarioModel.cambiarRol] Error invalidando tokens', {
                    error: tokenError.message,
                    usuario_id: userId
                });
            }

            await RLSHelper.registrarEvento(db, {
                organizacion_id: orgId,
                tipo_evento: 'usuario_rol_cambiado',
                descripcion: `Rol de usuario cambiado de ${rolCodigoAnterior} a ${nuevoRolCodigo}`,
                metadata: {
                    usuario_email: usuario.email,
                    rol_anterior: rolCodigoAnterior,
                    rol_nuevo: nuevoRolCodigo,
                    admin_id: adminId,
                    tokens_invalidados: true
                },
                usuario_id: adminId
            });

            return {
                usuario: updateResult.rows[0],
                cambio: {
                    rol_anterior: rolCodigoAnterior,
                    rol_nuevo: nuevoRolCodigo,
                    realizado_por: adminId,
                    timestamp: new Date().toISOString(),
                    tokens_invalidados: true
                }
            };
        }); // Sin useTransaction - auto-commit cada query
    }

    static async resetPassword(email, ipAddress = null) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            const usuarioQuery = `
                SELECT id, email, nombre, apellidos, organizacion_id, activo
                FROM usuarios
                WHERE email = $1 AND activo = true
                LIMIT 1
            `;
            const usuarioResult = await db.query(usuarioQuery, [email]);

            if (usuarioResult.rows.length === 0) {
                return {
                    mensaje: 'Si el usuario existe, se ha enviado un email con instrucciones para restablecer la contraseña',
                    token_enviado: false
                };
            }

            const usuario = usuarioResult.rows[0];

            const crypto = require('crypto');
            const resetToken = crypto.randomBytes(AUTH_CONFIG.RESET_TOKEN_LENGTH).toString('hex');
            const resetExpiration = new Date(Date.now() + AUTH_CONFIG.TOKEN_RESET_EXPIRATION_HOURS * 60 * 60 * 1000);

            const updateQuery = `
                UPDATE usuarios
                SET
                    token_reset_password = $1,
                    token_reset_expira = $2,
                    token_reset_usado_en = NULL,
                    actualizado_en = NOW()
                WHERE id = $3
            `;

            await db.query(updateQuery, [resetToken, resetExpiration, usuario.id]);

            // 📧 Enviar email de recuperación
            try {
                await emailService.enviarRecuperacionPassword({
                    email: usuario.email,
                    nombre: usuario.nombre || 'Usuario',
                    resetToken,
                    expirationHours: AUTH_CONFIG.TOKEN_RESET_EXPIRATION_HOURS
                });

                logger.info(`[Usuario.solicitarRecuperacion] Email de recuperación enviado a: ${email}`);
            } catch (emailError) {
                // NO fallar la operación si el email falla
                // El token ya está guardado y es funcional
                logger.error(`[Usuario.solicitarRecuperacion] Error enviando email: ${emailError.message}`);
                logger.warn('[Usuario.solicitarRecuperacion] Token generado pero email NO enviado');
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

    static async verificarEmail(token) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            // Primero buscar si el token fue usado
            const tokenUsadoQuery = `
                SELECT id, email, email_verificado, token_verificacion_usado_en
                FROM usuarios
                WHERE token_verificacion_email = $1
                  AND token_verificacion_usado_en IS NOT NULL
                  AND activo = true
            `;
            const tokenUsadoResult = await db.query(tokenUsadoQuery, [token]);

            if (tokenUsadoResult.rows.length > 0) {
                return {
                    verificado: false,
                    ya_verificado: true,
                    email: tokenUsadoResult.rows[0].email,
                    mensaje: 'El email ya había sido verificado anteriormente'
                };
            }

            // Buscar token válido y no expirado
            const usuarioQuery = `
                SELECT u.id, u.email, u.nombre, u.apellidos, u.rol_id,
                       r.codigo as rol_codigo, u.organizacion_id, u.email_verificado
                FROM usuarios u
                LEFT JOIN roles r ON r.id = u.rol_id
                WHERE u.token_verificacion_email = $1
                  AND u.token_verificacion_expira > NOW()
                  AND u.activo = true
            `;
            const usuarioResult = await db.query(usuarioQuery, [token]);

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

            // Marcar token como usado
            const updateQuery = `
                UPDATE usuarios
                SET
                    email_verificado = true,
                    token_verificacion_usado_en = NOW(),
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING id, email
            `;

            const updateResult = await db.query(updateQuery, [usuario.id]);

            return {
                verificado: true,
                mensaje: 'Email verificado exitosamente',
                email: updateResult.rows[0].email
            };
        });
    }

    static async existenUsuarios() {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            const query = 'SELECT COUNT(*) as count FROM usuarios';
            const result = await db.query(query);
            const usuarioCount = parseInt(result.rows[0].count);

            return usuarioCount > 0;
        });
    }

    static async validarTokenReset(token) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            // Primero verificar si el token ya fue usado
            const tokenUsadoQuery = `
                SELECT id, email, token_reset_usado_en
                FROM usuarios
                WHERE token_reset_password = $1
                  AND token_reset_usado_en IS NOT NULL
                  AND activo = true
            `;
            const tokenUsadoResult = await db.query(tokenUsadoQuery, [token]);

            if (tokenUsadoResult.rows.length > 0) {
                return {
                    valido: false,
                    mensaje: 'Este token de recuperación ya fue utilizado'
                };
            }

            // Buscar token válido
            const query = `
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
            `;

            const result = await db.query(query, [token]);

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

    static async confirmarResetPassword(token, passwordNueva, ipAddress = null) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        const resultado = await RLSContextManager.withBypass(async (db) => {
            await db.query('BEGIN');

            try {
                // Primero verificar si el token ya fue usado
                const tokenUsadoQuery = `
                    SELECT id, email, token_reset_usado_en
                    FROM usuarios
                    WHERE token_reset_password = $1
                      AND token_reset_usado_en IS NOT NULL
                      AND activo = true
                `;
                const tokenUsadoResult = await db.query(tokenUsadoQuery, [token]);

                if (tokenUsadoResult.rows.length > 0) {
                    ErrorHelper.throwValidation('Este token de recuperación ya fue utilizado');
                }

                // Validar token inline (usar misma conexión de transacción)
                const validacionQuery = `
                    SELECT
                        id, email, nombre, apellidos, organizacion_id,
                        token_reset_expira,
                        CASE
                            WHEN token_reset_expira > NOW() THEN true
                            ELSE false
                        END as token_valido
                    FROM usuarios
                    WHERE token_reset_password = $1 AND activo = true
                `;

                const validacionResult = await db.query(validacionQuery, [token]);

                if (validacionResult.rows.length === 0) {
                    ErrorHelper.throwValidation('Código de recuperación inválido o usuario no encontrado');
                }

                const usuarioValidacion = validacionResult.rows[0];

                if (!usuarioValidacion.token_valido) {
                    ErrorHelper.throwValidation('Código de recuperación expirado');
                }

                const nuevoHash = await bcrypt.hash(passwordNueva, AUTH_CONFIG.BCRYPT_SALT_ROUNDS);

                const updateQuery = `
                    UPDATE usuarios
                    SET
                        password_hash = $1,
                        token_reset_usado_en = NOW(),
                        intentos_fallidos = 0,
                        bloqueado_hasta = NULL,
                        actualizado_en = NOW()
                    WHERE token_reset_password = $2 AND activo = true
                    RETURNING id, email, nombre, apellidos, organizacion_id
                `;

                const result = await db.query(updateQuery, [nuevoHash, token]);

                if (result.rows.length === 0) {
                    ErrorHelper.throwValidation('No se pudo actualizar la contraseña');
                }

                const usuario = result.rows[0];

                await db.query('COMMIT');

                return {
                    success: true,
                    mensaje: 'Contraseña actualizada exitosamente',
                    usuario_id: usuario.id,
                    email: usuario.email,
                    organizacion_id: usuario.organizacion_id
                };

            } catch (error) {
                await db.query('ROLLBACK');
                throw error;
            }
        });

        // Registrar evento DESPUÉS del COMMIT (fuera de la transacción con bypass)
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
            // No lanzar el error, ya se hizo commit
            logger.warn('Error al registrar evento de password reset:', eventoError.message);
        }

        return resultado;
    }

    // ====================================================================
    // OAUTH GOOGLE - Dic 2025
    // ====================================================================

    /**
     * Buscar usuario por Google ID
     * @param {string} googleId - ID único de Google
     * @returns {Promise<Object|null>} Usuario encontrado o null
     */
    static async buscarPorGoogleId(googleId) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT u.id, u.email, u.nombre, u.apellidos, u.telefono,
                       u.rol_id, r.codigo as rol_codigo, r.nombre as rol_nombre,
                       r.nivel_jerarquia, r.bypass_permisos, r.es_rol_sistema,
                       u.organizacion_id, u.activo, u.email_verificado,
                       u.google_id, u.avatar_url, u.onboarding_completado,
                       o.nombre_comercial
                FROM usuarios u
                LEFT JOIN roles r ON r.id = u.rol_id
                LEFT JOIN organizaciones o ON u.organizacion_id = o.id
                WHERE u.google_id = $1 AND u.activo = TRUE
            `;

            const result = await db.query(query, [googleId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Crear usuario desde datos de Google OAuth
     * NOTA: Este usuario NO tiene organización aún (requiere onboarding)
     *
     * @param {Object} googleData - Datos de Google
     * @param {string} googleData.googleId - ID único de Google
     * @param {string} googleData.email - Email de Google
     * @param {string} googleData.nombre - Nombre
     * @param {string} googleData.apellidos - Apellidos
     * @param {string} googleData.avatar_url - URL del avatar
     * @returns {Promise<Object>} Usuario creado
     */
    static async crearDesdeGoogle(googleData) {
        const { googleId, email, nombre, apellidos, avatar_url } = googleData;

        return await RLSContextManager.withBypass(async (db) => {
            // Verificar que el email no exista
            const existeEmail = await db.query(
                'SELECT id FROM usuarios WHERE email = LOWER($1)',
                [email]
            );

            if (existeEmail.rows[0]) {
                ErrorHelper.throwConflict('Este email ya está registrado. Intenta iniciar sesión.');
            }

            // Crear usuario sin organización (requiere onboarding)
            // El rol_id se asignará cuando complete onboarding y se cree su organización
            // Por ahora usamos un rol_id temporal del rol de sistema 'bot' que será actualizado
            // Nota: Usuarios OAuth sin org no pueden hacer nada hasta completar onboarding
            const query = `
                INSERT INTO usuarios (
                    email, nombre, apellidos, google_id, avatar_url,
                    rol_id, activo, email_verificado, onboarding_completado
                ) VALUES (
                    LOWER($1), $2, $3, $4, $5,
                    (SELECT id FROM roles WHERE codigo = 'bot' AND es_rol_sistema = TRUE LIMIT 1),
                    TRUE, TRUE, FALSE
                )
                RETURNING id, email, nombre, apellidos, rol_id, organizacion_id,
                          google_id, avatar_url, activo, email_verificado,
                          onboarding_completado, creado_en
            `;

            const result = await db.query(query, [
                email, nombre, apellidos, googleId, avatar_url
            ]);

            const usuario = result.rows[0];

            logger.info('[UsuarioModel.crearDesdeGoogle] Usuario creado via OAuth', {
                usuario_id: usuario.id,
                email: usuario.email,
                google_id: googleId
            });

            return usuario;
        });
    }

    /**
     * Vincular cuenta de Google a usuario existente
     *
     * @param {number} userId - ID del usuario
     * @param {Object} googleData - Datos de Google
     * @returns {Promise<Object>} Usuario actualizado
     */
    static async vincularGoogle(userId, googleData) {
        const { googleId, avatar_url } = googleData;

        return await RLSContextManager.withBypass(async (db) => {
            // Verificar que el google_id no esté vinculado a otro usuario
            const existeGoogle = await db.query(
                'SELECT id FROM usuarios WHERE google_id = $1 AND id != $2',
                [googleId, userId]
            );

            if (existeGoogle.rows[0]) {
                ErrorHelper.throwConflict('Esta cuenta de Google ya está vinculada a otro usuario');
            }

            // Vincular Google al usuario
            const query = `
                UPDATE usuarios
                SET google_id = $1,
                    avatar_url = COALESCE(avatar_url, $2),
                    actualizado_en = NOW()
                WHERE id = $3
                RETURNING id, email, nombre, apellidos, rol_id, organizacion_id,
                          google_id, avatar_url, onboarding_completado
            `;

            const result = await db.query(query, [googleId, avatar_url, userId]);
            ErrorHelper.throwIfNotFound(result.rows[0], 'Usuario');

            logger.info('[UsuarioModel.vincularGoogle] Google vinculado a usuario existente', {
                usuario_id: userId,
                google_id: googleId
            });

            return result.rows[0];
        });
    }

    // ====================================================================
    // GESTIÓN DE USUARIOS ESTILO ODOO - Dic 2025
    // ====================================================================

    /**
     * Crear usuario directamente sin profesional (contador, auditor, etc.)
     * Similar a res.users en Odoo
     *
     * @param {Object} userData - Datos del usuario
     * @param {number} organizacionId - ID de la organización
     * @param {number} creadoPor - ID del usuario que crea
     * @returns {Promise<Object>} Usuario creado
     */
    static async crearUsuarioDirecto(userData, organizacionId, creadoPor) {
        const {
            email,
            password,
            nombre,
            apellidos,
            telefono,
            rol = 'empleado',
            profesional_id = null,
            activo = true
        } = userData;

        return await RLSContextManager.withBypass(async (db) => {
            await db.query('BEGIN');

            try {
                // Verificar que el email no exista
                const existeEmail = await db.query(
                    'SELECT id FROM usuarios WHERE email = LOWER($1)',
                    [email]
                );

                if (existeEmail.rows[0]) {
                    ErrorHelper.throwConflict('Este email ya está registrado en el sistema');
                }

                // Si se especifica profesional_id, verificar que exista y no tenga usuario
                if (profesional_id) {
                    const profesional = await db.query(`
                        SELECT id, usuario_id, nombre_completo
                        FROM profesionales
                        WHERE id = $1 AND organizacion_id = $2
                    `, [profesional_id, organizacionId]);

                    ErrorHelper.throwIfNotFound(profesional.rows[0], 'Profesional');

                    if (profesional.rows[0].usuario_id) {
                        ErrorHelper.throwConflict('Este profesional ya tiene un usuario vinculado');
                    }
                }

                // Hashear password
                const password_hash = await bcrypt.hash(password, AUTH_CONFIG.BCRYPT_SALT_ROUNDS);

                // Obtener rol_id basado en código de rol
                const rolResult = await db.query(
                    `SELECT id FROM roles WHERE codigo = $1 AND (organizacion_id = $2 OR es_rol_sistema = TRUE) LIMIT 1`,
                    [rol, organizacionId]
                );
                const rolId = rolResult.rows[0]?.id;

                if (!rolId) {
                    ErrorHelper.throwValidation(`Rol '${rol}' no encontrado en la organización`);
                }

                // Crear usuario
                const usuarioResult = await db.query(`
                    INSERT INTO usuarios (
                        organizacion_id, email, password_hash, nombre, apellidos,
                        telefono, rol_id, profesional_id, activo, email_verificado
                    ) VALUES ($1, LOWER($2), $3, $4, $5, $6, $7, $8, $9, TRUE)
                    RETURNING id, organizacion_id, email, nombre, apellidos, telefono,
                              rol_id, profesional_id, activo, email_verificado, creado_en
                `, [
                    organizacionId, email, password_hash, nombre, apellidos || null,
                    telefono || null, rolId, profesional_id, activo
                ]);

                const usuario = usuarioResult.rows[0];
                logger.info('[crearUsuarioDirecto] INSERT ejecutado, usuario:', { id: usuario.id, email: usuario.email });

                // Si hay profesional_id, vincular profesional al usuario
                if (profesional_id) {
                    await db.query(`
                        UPDATE profesionales
                        SET usuario_id = $1, actualizado_en = NOW()
                        WHERE id = $2
                    `, [usuario.id, profesional_id]);
                }

                await db.query('COMMIT');
                logger.info('[crearUsuarioDirecto] COMMIT ejecutado');

                logger.info('[UsuarioModel.crearUsuarioDirecto] Usuario creado', {
                    usuario_id: usuario.id,
                    email: usuario.email,
                    con_profesional: !!profesional_id
                });

                return usuario;

            } catch (error) {
                await db.query('ROLLBACK');
                throw error;
            }
        });
    }

    /**
     * Cambiar estado activo de usuario y profesional vinculado
     * Cuando se desactiva un usuario, también se desactiva su profesional
     *
     * @param {number} userId - ID del usuario
     * @param {boolean} activo - Nuevo estado
     * @param {number} organizacionId - ID de la organización
     * @param {number} adminId - ID del admin que hace el cambio
     * @returns {Promise<Object>} Usuario actualizado
     */
    static async cambiarEstadoActivo(userId, activo, organizacionId, adminId) {
        return await RLSContextManager.withBypass(async (db) => {
            // Obtener usuario con su profesional vinculado (relación: profesionales.usuario_id → usuarios.id)
            const usuarioResult = await db.query(`
                SELECT u.id, u.email, u.nombre, u.activo as estado_anterior,
                       p.id as prof_id, p.nombre_completo as prof_nombre
                FROM usuarios u
                LEFT JOIN profesionales p ON p.usuario_id = u.id
                WHERE u.id = $1 AND u.organizacion_id = $2
            `, [userId, organizacionId]);

            ErrorHelper.throwIfNotFound(usuarioResult.rows[0], 'Usuario en la organización');

            const usuario = usuarioResult.rows[0];

            // No permitir desactivar al propio usuario
            if (userId === adminId && !activo) {
                ErrorHelper.throwValidation('No puedes desactivar tu propia cuenta');
            }

            // Actualizar usuario
            await db.query(`
                UPDATE usuarios
                SET activo = $1, actualizado_en = NOW()
                WHERE id = $2
            `, [activo, userId]);

            // Si tiene profesional vinculado, actualizar estado del profesional
            let profesionalActualizado = null;
            if (usuario.prof_id) {
                if (!activo) {
                    // Desactivar: poner en baja
                    await db.query(`
                        UPDATE profesionales
                        SET estado = 'baja', fecha_baja = NOW(), actualizado_en = NOW()
                        WHERE id = $1
                    `, [usuario.prof_id]);
                } else {
                    // Activar: volver a activo
                    await db.query(`
                        UPDATE profesionales
                        SET estado = 'activo', fecha_baja = NULL, actualizado_en = NOW()
                        WHERE id = $1
                    `, [usuario.prof_id]);
                }

                profesionalActualizado = {
                    id: usuario.prof_id,
                    nombre: usuario.prof_nombre,
                    estado: activo ? 'activo' : 'baja'
                };
            }

            // Registrar evento
            await RLSHelper.registrarEvento(db, {
                organizacion_id: organizacionId,
                tipo_evento: activo ? 'usuario_activado' : 'usuario_desactivado',
                descripcion: `Usuario ${activo ? 'activado' : 'desactivado'}${profesionalActualizado ? ' junto con su profesional' : ''}`,
                metadata: {
                    email: usuario.email,
                    estado_anterior: usuario.estado_anterior,
                    estado_nuevo: activo,
                    profesional_afectado: profesionalActualizado,
                    admin_id: adminId
                },
                usuario_id: adminId
            });

            return {
                usuario: {
                    id: userId,
                    email: usuario.email,
                    nombre: usuario.nombre,
                    activo: activo,
                    estado_anterior: usuario.estado_anterior
                },
                profesional: profesionalActualizado,
                cambio: {
                    realizado_por: adminId,
                    timestamp: new Date().toISOString()
                }
            };
        }); // Sin useTransaction - auto-commit cada query
    }

    /**
     * Vincular o desvincular profesional a usuario
     *
     * @param {number} userId - ID del usuario
     * @param {number|null} profesionalId - ID del profesional o null para desvincular
     * @param {number} organizacionId - ID de la organización
     * @param {number} adminId - ID del admin que hace el cambio
     * @returns {Promise<Object>} Usuario actualizado
     */
    static async vincularProfesional(userId, profesionalId, organizacionId, adminId) {
        return await RLSContextManager.withBypass(async (db) => {
            // Obtener usuario actual
            const usuarioResult = await db.query(`
                SELECT id, email, nombre
                FROM usuarios
                WHERE id = $1 AND organizacion_id = $2
            `, [userId, organizacionId]);

            ErrorHelper.throwIfNotFound(usuarioResult.rows[0], 'Usuario en la organización');

            const usuario = usuarioResult.rows[0];

            // Buscar profesional actualmente vinculado (relación está en profesionales.usuario_id)
            const profActualResult = await db.query(`
                SELECT id, nombre_completo
                FROM profesionales
                WHERE usuario_id = $1 AND organizacion_id = $2
            `, [userId, organizacionId]);

            const profesionalAnteriorId = profActualResult.rows[0]?.id || null;

            // Si se está vinculando un nuevo profesional
            if (profesionalId) {
                // Verificar que el profesional exista y no tenga usuario
                const profesionalResult = await db.query(`
                    SELECT id, nombre_completo, usuario_id
                    FROM profesionales
                    WHERE id = $1 AND organizacion_id = $2
                `, [profesionalId, organizacionId]);

                ErrorHelper.throwIfNotFound(profesionalResult.rows[0], 'Profesional');

                if (profesionalResult.rows[0].usuario_id && profesionalResult.rows[0].usuario_id !== userId) {
                    ErrorHelper.throwConflict('Este profesional ya tiene un usuario vinculado');
                }
            }

            // Si había profesional anterior, desvincular
            if (profesionalAnteriorId && profesionalAnteriorId !== profesionalId) {
                await db.query(`
                    UPDATE profesionales
                    SET usuario_id = NULL, actualizado_en = NOW()
                    WHERE id = $1
                `, [profesionalAnteriorId]);
            }

            // Si hay nuevo profesional, vincularlo
            if (profesionalId) {
                await db.query(`
                    UPDATE profesionales
                    SET usuario_id = $1, actualizado_en = NOW()
                    WHERE id = $2
                `, [userId, profesionalId]);
            }

            // Obtener datos del nuevo profesional para respuesta
            let nuevoProfesional = null;
            if (profesionalId) {
                const profResult = await db.query(
                    'SELECT id, nombre_completo, usuario_id FROM profesionales WHERE id = $1',
                    [profesionalId]
                );
                nuevoProfesional = profResult.rows[0];
            }

            // Registrar evento (usa campos correctos para RLSHelper.registrarEvento)
            await RLSHelper.registrarEvento(db, {
                organizacion_id: organizacionId,
                tipo_evento: profesionalId ? 'usuario_profesional_vinculado' : 'usuario_profesional_desvinculado',
                descripcion: profesionalId
                    ? `Profesional vinculado a usuario`
                    : `Profesional desvinculado de usuario`,
                metadata: {
                    email: usuario.email,
                    profesional_anterior: profesionalAnteriorId,
                    profesional_nuevo: profesionalId,
                    admin_id: adminId
                },
                usuario_id: adminId
            });

            return {
                usuario: {
                    id: userId,
                    email: usuario.email,
                    nombre: usuario.nombre,
                    profesional_id: profesionalId
                },
                profesional: nuevoProfesional,
                profesional_anterior: profesionalAnteriorId,
                cambio: {
                    realizado_por: adminId,
                    timestamp: new Date().toISOString()
                }
            };
        }); // Sin useTransaction - auto-commit cada query
    }

    /**
     * Obtener profesionales sin usuario vinculado (para selector)
     *
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} Lista de profesionales sin usuario
     */
    static async obtenerProfesionalesSinUsuario(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT id, nombre_completo, email, estado
                FROM profesionales
                WHERE usuario_id IS NULL
                  AND estado = 'activo'
                ORDER BY nombre_completo
            `);

            return result.rows;
        });
    }

    /**
     * Obtener usuarios sin profesional vinculado (para vincular al crear profesional)
     * Dic 2025: Para flujo de crear profesional y vincular a usuario existente
     *
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} Lista de usuarios sin profesional vinculado
     */
    static async obtenerUsuariosSinProfesional(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT u.id, u.nombre, u.apellidos, u.email, r.codigo as rol_codigo
                FROM usuarios u
                LEFT JOIN roles r ON r.id = u.rol_id
                LEFT JOIN profesionales p ON p.usuario_id = u.id
                WHERE p.id IS NULL
                  AND u.activo = true
                  AND r.codigo != 'bot'
                ORDER BY u.nombre, u.apellidos
            `);

            return result.rows;
        });
    }

    /**
     * Completar onboarding de usuario OAuth
     * Crea la organización y vincula al usuario
     *
     * @param {number} userId - ID del usuario
     * @param {Object} orgData - Datos de la organización
     * @returns {Promise<Object>} Usuario y organización actualizados
     */
    static async completarOnboarding(userId, orgData) {
        const {
            nombre_negocio,
            industria,
            estado_id,
            ciudad_id,
            soy_profesional = true,
            modulos = {}  // Módulos seleccionados por usuario (Dic 2025 - estilo Odoo)
        } = orgData;

        // Construir módulos activos con core siempre activo
        const modulosActivos = { core: true };

        // Agregar módulos seleccionados por el usuario
        Object.entries(modulos).forEach(([key, value]) => {
            if (value === true) {
                modulosActivos[key] = true;
            }
        });

        // Auto-resolver dependencias
        // POS requiere inventario
        if (modulosActivos.pos && !modulosActivos.inventario) {
            modulosActivos.inventario = true;
        }
        // Marketplace requiere agendamiento
        if (modulosActivos.marketplace && !modulosActivos.agendamiento) {
            modulosActivos.agendamiento = true;
        }
        // Chatbots requiere agendamiento
        if (modulosActivos.chatbots && !modulosActivos.agendamiento) {
            modulosActivos.agendamiento = true;
        }

        // ✅ FIX v2.1: Usar transactionWithBypass en lugar de BEGIN/COMMIT manual
        const result = await RLSContextManager.transactionWithBypass(async (db) => {
            // 1. Obtener usuario
                const usuarioResult = await db.query(
                    'SELECT id, email, nombre, apellidos, onboarding_completado FROM usuarios WHERE id = $1',
                    [userId]
                );

                ErrorHelper.throwIfNotFound(usuarioResult.rows[0], 'Usuario');

                const usuario = usuarioResult.rows[0];

                if (usuario.onboarding_completado) {
                    ErrorHelper.throwConflict('El onboarding ya fue completado');
                }

                // 2. Resolver categoria_id desde código de industria (opcional - Ene 2026)
                let categoria_id = null;
                if (industria) {
                    const categoriaResult = await db.query(
                        'SELECT id FROM categorias WHERE codigo = $1 AND activo = TRUE LIMIT 1',
                        [industria]
                    );
                    if (categoriaResult.rows[0]) {
                        categoria_id = categoriaResult.rows[0].id;
                    }
                }
                // Nota: categoria_id puede ser null, se configura después en Configuración > Mi Negocio

                // 3. Generar código de tenant único
                const codigoTenant = `org-${Date.now().toString(36)}`;
                const slug = nombre_negocio
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '')
                    .substring(0, 50) + '-' + SecureRandom.slugSuffix(4);

                // 4. Crear organización (con módulos activos seleccionados)
                const orgResult = await db.query(`
                    INSERT INTO organizaciones (
                        codigo_tenant, slug, nombre_comercial, razon_social,
                        email_admin, categoria_id, estado_id, ciudad_id,
                        plan_actual, activo, modulos_activos
                    ) VALUES ($1, $2, $3, $3, $4, $5, $6, $7, 'trial', TRUE, $8)
                    RETURNING id, codigo_tenant, slug, nombre_comercial
                `, [codigoTenant, slug, nombre_negocio, usuario.email, categoria_id, estado_id, ciudad_id, modulosActivos]);

                const organizacion = orgResult.rows[0];

                // 5. Módulos activos - ya no se usa tabla legacy subscripciones (Fase 0 - Ene 2026)
                // Los módulos se guardan en la org o se omiten si la columna no existe
                // La suscripción se maneja ahora por el módulo suscripciones-negocio via dogfooding hook
                logger.info('[completarOnboarding] Módulos seleccionados:', { modulosActivos });

                // 5.1 Asegurar que los roles default existan (el trigger puede no ser visible en la transacción)
                // Llamamos explícitamente a la función SQL para garantizar que existan antes de buscarlos
                await db.query(`SELECT crear_roles_default_organizacion($1)`, [organizacion.id]);

                // 6. Actualizar usuario con organización y rol_id
                // Obtener rol_id del rol 'admin' de la nueva organización
                // El usuario que crea la org es el administrador (nivel 90)
                const rolResult = await db.query(
                    `SELECT id FROM roles WHERE codigo = 'admin' AND organizacion_id = $1 LIMIT 1`,
                    [organizacion.id]
                );
                const rolId = rolResult.rows[0]?.id || null;

                if (!rolId) {
                    logger.error('[completarOnboarding] CRÍTICO: No se encontró rol admin para org', {
                        organizacion_id: organizacion.id
                    });
                }

                await db.query(`
                    UPDATE usuarios
                    SET organizacion_id = $1,
                        rol_id = $2,
                        onboarding_completado = TRUE,
                        actualizado_en = NOW()
                    WHERE id = $3
                `, [organizacion.id, rolId, userId]);

                // 7. Si soy_profesional, crear profesional vinculado
                if (soy_profesional) {
                    const nombreCompleto = usuario.nombre +
                        (usuario.apellidos ? ' ' + usuario.apellidos : '');

                    // ACTUALIZADO Dic 2025: modulos_acceso eliminado
                    // Los permisos se asignan via permisos_rol según el rol del usuario
                    await db.query(`
                        INSERT INTO profesionales (
                            organizacion_id, nombre_completo, email,
                            usuario_id, activo
                        ) VALUES ($1, $2, $3, $4, TRUE)
                    `, [
                        organizacion.id,
                        nombreCompleto,
                        usuario.email,
                        userId
                    ]);
                }

                // ═══════════════════════════════════════════════════════════════════
                // Crear rutas de operación default para inventario
                // ═══════════════════════════════════════════════════════════════════
                try {
                    await RutasOperacionModel.crearRutasDefaultConDb(organizacion.id, userId, db);
                    logger.info('[UsuarioModel.completarOnboarding] Rutas de operación creadas', {
                        organizacion_id: organizacion.id
                    });
                } catch (rutasError) {
                    // No bloquear onboarding si falla la creación de rutas
                    logger.warn('[UsuarioModel.completarOnboarding] Error creando rutas default', {
                        error: rutasError.message
                    });
                }

            logger.info('[UsuarioModel.completarOnboarding] Onboarding completado', {
                usuario_id: userId,
                organizacion_id: organizacion.id
            });

            // Obtener datos completos del rol para incluir en respuesta
            const rolData = await db.query(
                `SELECT id, codigo, nombre, nivel_jerarquia FROM roles WHERE id = $1`,
                [rolId]
            );
            const rol = rolData.rows[0];

            return {
                usuario: {
                    id: userId,
                    email: usuario.email,
                    nombre: usuario.nombre,
                    apellidos: usuario.apellidos,
                    organizacion_id: organizacion.id,
                    onboarding_completado: true,
                    // Fix Ene 2026: Incluir rol actualizado para que frontend actualice estado
                    rol_id: rolId,
                    rol_codigo: rol?.codigo,
                    rol_nombre: rol?.nombre,
                    nivel_jerarquia: rol?.nivel_jerarquia
                },
                organizacion
            };
            // COMMIT automático al finalizar, ROLLBACK automático si hay error
        });

        // ═══════════════════════════════════════════════════════════════════
        // 🔗 HOOK DOGFOODING (Ene 2026)
        // Vincular nueva org como cliente en Nexo Team (org_id = 1 en dev)
        // ═══════════════════════════════════════════════════════════════════
        if (result && result.organizacion) {
            setImmediate(async () => {
                try {
                    const DogfoodingService = require('../../../services/dogfoodingService');
                    await DogfoodingService.vincularOrganizacionComoCliente({
                        id: result.organizacion.id,
                        nombre_comercial: result.organizacion.nombre_comercial,
                        email_admin: result.usuario.email,
                        telefono: null,
                        razon_social: result.organizacion.nombre_comercial
                    });
                    logger.info('[completarOnboarding] Dogfooding hook ejecutado', {
                        organizacion_id: result.organizacion.id
                    });
                } catch (err) {
                    logger.error('[completarOnboarding] Error en dogfooding hook:', err);
                }
            });
        }

        return result;
    }
}

module.exports = UsuarioModel;