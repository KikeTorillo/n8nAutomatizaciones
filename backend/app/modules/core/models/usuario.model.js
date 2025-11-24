const { getDb } = require('../../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../../../utils/logger');
const RLSHelper = require('../../../utils/rlsHelper');
const RLSContextManager = require('../../../utils/rlsContextManager');
const emailService = require('../../../services/emailService');

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

                const query = `
                    INSERT INTO usuarios (
                        email, password_hash, nombre, apellidos, telefono, rol,
                        organizacion_id, profesional_id, activo, email_verificado
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING id, email, nombre, apellidos, telefono, rol,
                             organizacion_id, profesional_id, activo, email_verificado,
                             creado_en, actualizado_en
                `;

                const values = [
                    userData.email,
                    password_hash,
                    userData.nombre,
                    userData.apellidos || null,
                    userData.telefono || null,
                    userData.rol || 'empleado',
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
                throw new Error('El email ya está registrado en el sistema');
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
            return await RLSHelper.withLoginEmail(db, email, async (db) => {
                const query = `
                    SELECT u.id, u.email, u.password_hash, u.nombre, u.apellidos, u.telefono,
                           u.rol, u.organizacion_id, u.profesional_id, u.activo, u.email_verificado,
                           u.ultimo_login, u.intentos_fallidos, u.bloqueado_hasta
                    FROM usuarios u
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
            throw new Error('Credenciales inválidas');
        }

        // Verificar si el usuario está bloqueado
        if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
            const tiempoBloqueo = Math.ceil((new Date(usuario.bloqueado_hasta) - new Date()) / 60000);
            throw new Error(`Usuario bloqueado. Intente nuevamente en ${tiempoBloqueo} minutos`);
        }

        // Verificar contraseña
        const passwordValida = await this.verificarPassword(password, usuario.password_hash);

        if (!passwordValida) {
            // Registrar intento fallido
            await this.registrarIntentoLogin(email, false, ipAddress);
            throw new Error('Credenciales inválidas');
        }

        // Login exitoso - registrar y limpiar intentos fallidos
        await this.registrarIntentoLogin(email, true, ipAddress);

        // Configurar contexto RLS para futuras operaciones
        const db = await getDb();
        try {
            await RLSHelper.configurarContexto(db, usuario.id, usuario.rol, usuario.organizacion_id);
        } finally {
            db.release();
        }

        // Generar tokens
        const { accessToken, refreshToken } = this.generarTokens(usuario);

        // Preparar datos del usuario (sin información sensible)
        const usuarioSeguro = {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            apellidos: usuario.apellidos,
            telefono: usuario.telefono,
            rol: usuario.rol,
            organizacion_id: usuario.organizacion_id,
            profesional_id: usuario.profesional_id,
            email_verificado: usuario.email_verificado
        };

        return {
            usuario: usuarioSeguro,
            accessToken,
            refreshToken,
            expiresIn: AUTH_CONFIG.ACCESS_TOKEN_EXPIRATION_SECONDS
        };
    }

    static generarTokens(usuario) {
        const crypto = require('crypto');

        // Generar JTI único para garantizar que cada token sea único
        const jti = crypto.randomBytes(16).toString('hex');

        const payload = {
            userId: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
            organizacionId: usuario.organizacion_id,
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
                throw new Error('Usuario no válido');
            }

            const { accessToken } = this.generarTokens(usuario);

            return {
                accessToken,
                expiresIn: AUTH_CONFIG.ACCESS_TOKEN_EXPIRATION_SECONDS
            };

        } catch (error) {
            throw new Error('Token de refresco inválido');
        }
    }

    // Usa bypass RLS para operaciones de sistema (refresh tokens, validaciones)
    static async buscarPorId(id) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    u.id, u.email, u.nombre, u.apellidos, u.telefono,
                    u.rol, u.organizacion_id, u.activo, u.email_verificado,
                    o.categoria_id,
                    ci.codigo as categoria_codigo,
                    o.nombre_comercial,
                    o.plan_actual
                FROM usuarios u
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
                SELECT id, email, nombre, apellidos, telefono,
                       rol, organizacion_id, profesional_id, activo, email_verificado,
                       ultimo_login, zona_horaria, idioma, creado_en, actualizado_en
                FROM usuarios
                WHERE id = $1 AND activo = TRUE
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
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
            if (!result.rows[0]) {
                throw new Error('Usuario no encontrado');
            }
            return result.rows[0];
        });

        // Verificar contraseña anterior
        const passwordValida = await this.verificarPassword(passwordAnterior, usuario.password_hash);
        if (!passwordValida) {
            throw new Error('Contraseña anterior incorrecta');
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
                throw new Error('No hay campos válidos para actualizar');
            }

            // ✅ Sin filtro manual de organizacion_id - RLS lo maneja automáticamente
            const query = `
                UPDATE usuarios
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${contador}
                RETURNING id, email, nombre, apellidos, telefono, rol, organizacion_id,
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
                SELECT id, email, nombre, apellidos, rol, organizacion_id, activo
                FROM usuarios
                WHERE id = $1 AND organizacion_id = $2 AND activo = TRUE
            `;
            const validacion = await db.query(validacionQuery, [userId, organizacionId]);

            if (validacion.rows.length === 0) {
                throw new Error('Usuario no encontrado en la organización especificada');
            }

            const query = `
                UPDATE usuarios
                SET
                    intentos_fallidos = 0,
                    bloqueado_hasta = NULL,
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2 AND activo = TRUE
                RETURNING id, email, nombre, apellidos, rol, organizacion_id,
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
                SELECT id, email, nombre, apellidos, rol, intentos_fallidos,
                       bloqueado_hasta, ultimo_login, creado_en
                FROM usuarios
                WHERE organizacion_id = $1
                  AND bloqueado_hasta IS NOT NULL
                  AND bloqueado_hasta > NOW()
                  AND activo = TRUE
                ORDER BY bloqueado_hasta DESC
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
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            await db.query('BEGIN');

            try {
                // Validar que la organización existe
                const orgQuery = `
                    SELECT id, nombre_comercial, email_admin, categoria_id, activo
                    FROM organizaciones
                    WHERE id = $1 AND activo = true
                `;
                const orgResult = await db.query(orgQuery, [orgId]);

                if (orgResult.rows.length === 0) {
                    throw new Error('Organización no encontrada o inactiva');
                }

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

                const resultado = {
                    usuario: nuevoUsuario,
                    organizacion: {
                        id: organizacion.id,
                        nombre_comercial: organizacion.nombre_comercial
                    },
                    configuracion_rls: true,
                    email_bienvenida: emailResult
                };

                await db.query('COMMIT');
                return resultado;

            } catch (error) {
                await db.query('ROLLBACK');
                throw error;
            }
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

            if (rol) {
                whereConditions.push(`u.rol = $${paramCounter}`);
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
                WHERE ${whereClause}
            `;

            // Query principal con joins a profesionales
            const dataQuery = `
                SELECT
                    u.id, u.organizacion_id, u.email, u.nombre, u.apellidos, u.telefono, u.rol,
                    u.activo, u.email_verificado, u.ultimo_login, u.intentos_fallidos,
                    u.bloqueado_hasta, u.creado_en, u.actualizado_en,
                    p.id as profesional_id,
                    p.nombre_completo as profesional_nombre,
                    p.tipo_profesional_id,
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
                LEFT JOIN profesionales p ON u.profesional_id = p.id
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

    static async cambiarRol(userId, nuevoRol, orgId, adminId) {
        // ✅ Usar RLSContextManager.withBypass() para gestión automática completa
        return await RLSContextManager.withBypass(async (db) => {
            await db.query('BEGIN');

            try {
                // Validar que el usuario existe y pertenece a la organización
                const usuarioQuery = `
                    SELECT id, email, nombre, apellidos, rol, organizacion_id, activo
                    FROM usuarios
                    WHERE id = $1 AND organizacion_id = $2 AND activo = true
                `;
                const usuarioResult = await db.query(usuarioQuery, [userId, orgId]);

                if (usuarioResult.rows.length === 0) {
                    throw new Error('Usuario no encontrado en la organización especificada');
                }

                const usuario = usuarioResult.rows[0];
                const rolAnterior = usuario.rol;

                // Validar que el nuevo rol es válido
                const rolesValidos = ['admin', 'propietario', 'empleado', 'cliente'];
                if (!rolesValidos.includes(nuevoRol)) {
                    throw new Error(`Rol no válido. Opciones: ${rolesValidos.join(', ')}`);
                }

                // Validar que no sea el mismo rol
                if (rolAnterior === nuevoRol) {
                    throw new Error('El usuario ya tiene este rol asignado');
                }

                // Actualizar rol del usuario
                const updateQuery = `
                    UPDATE usuarios
                    SET
                        rol = $1,
                        actualizado_en = NOW()
                    WHERE id = $2 AND organizacion_id = $3
                    RETURNING id, email, nombre, apellidos, rol, organizacion_id,
                             activo, email_verificado, creado_en, actualizado_en
                `;

                const updateResult = await db.query(updateQuery, [nuevoRol, userId, orgId]);

                await RLSHelper.registrarEvento(db, {
                    organizacion_id: orgId,
                    evento_tipo: 'usuario_rol_cambiado',
                    entidad_tipo: 'usuario',
                    entidad_id: userId,
                    descripcion: `Rol de usuario cambiado de ${rolAnterior} a ${nuevoRol}`,
                    metadatos: {
                        usuario_email: usuario.email,
                        rol_anterior: rolAnterior,
                        rol_nuevo: nuevoRol,
                        admin_id: adminId,
                        timestamp: new Date().toISOString()
                    },
                    usuario_id: adminId
                });

                const resultado = {
                    usuario: updateResult.rows[0],
                    cambio: {
                        rol_anterior: rolAnterior,
                        rol_nuevo: nuevoRol,
                        realizado_por: adminId,
                        timestamp: new Date().toISOString()
                    }
                };

                await db.query('COMMIT');
                return resultado;

            } catch (error) {
                await db.query('ROLLBACK');
                throw error;
            }
        });
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

                logger.info(`📧 Email de recuperación enviado a: ${email}`);
            } catch (emailError) {
                // ⚠️ NO fallar la operación si el email falla
                // El token ya está guardado y es funcional
                logger.error(`❌ Error enviando email de recuperación: ${emailError.message}`);
                logger.warn('⚠️ Token generado correctamente pero email NO enviado');
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
                SELECT id, email, nombre, apellidos, rol, organizacion_id, email_verificado
                FROM usuarios
                WHERE token_verificacion_email = $1
                  AND token_verificacion_expira > NOW()
                  AND activo = true
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
                    throw new Error('Este token de recuperación ya fue utilizado');
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
                    throw new Error('Código de recuperación inválido o usuario no encontrado');
                }

                const usuarioValidacion = validacionResult.rows[0];

                if (!usuarioValidacion.token_valido) {
                    throw new Error('Código de recuperación expirado');
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
                    throw new Error('No se pudo actualizar la contraseña');
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
}

module.exports = UsuarioModel;