/**
 * @fileoverview Modelo de Usuario
 * @description Maneja CRUD de usuarios y operaciones de gestión
 * @version 4.0.0 - Refactorizado: auth movido a AuthModel, onboarding a OnboardingService
 *
 * NOTA: Los métodos de autenticación ahora están en auth.model.js
 * NOTA: El onboarding ahora está en onboardingService.js
 *
 * Este modelo ahora maneja solo:
 * - CRUD de usuarios
 * - Búsquedas de usuarios
 * - Gestión de roles y profesionales
 * - OAuth (buscar/crear/vincular Google)
 */

const { getDb } = require('../../../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../../../utils/logger');
const RLSHelper = require('../../../utils/rlsHelper');
const RLSContextManager = require('../../../utils/rlsContextManager');
const tokenBlacklistService = require('../../../services/tokenBlacklistService');
const { ErrorHelper } = require('../../../utils/helpers');

// Configuración de bcrypt para hashing de contraseñas
const BCRYPT_SALT_ROUNDS = 12;

class UsuarioModel {

    static async crear(userData) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        try {
            return await RLSContextManager.withBypass(async (db) => {
                const password_hash = await bcrypt.hash(userData.password, BCRYPT_SALT_ROUNDS);

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
                    tipo_evento: 'usuario_creado',
                    subtipo_evento: 'onboarding',
                    descripcion: `Usuario ${rol} creado automáticamente durante onboarding`,
                    metadata: {
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

    static async existenUsuarios() {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            const query = 'SELECT COUNT(*) as count FROM usuarios';
            const result = await db.query(query);
            const usuarioCount = parseInt(result.rows[0].count);

            return usuarioCount > 0;
        });
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
                       o.nombre_comercial,
                       (SELECT us.sucursal_id FROM usuarios_sucursales us
                        WHERE us.usuario_id = u.id AND us.activo = TRUE LIMIT 1) as sucursal_id
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

        // FIX: Usar transactionWithBypass en lugar de BEGIN/COMMIT manual
        return await RLSContextManager.transactionWithBypass(async (db) => {
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
            const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

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

            logger.info('[UsuarioModel.crearUsuarioDirecto] Usuario creado', {
                usuario_id: usuario.id,
                email: usuario.email,
                con_profesional: !!profesional_id
            });

            return usuario;
            // COMMIT automático al finalizar, ROLLBACK automático si hay error
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

}

module.exports = UsuarioModel;