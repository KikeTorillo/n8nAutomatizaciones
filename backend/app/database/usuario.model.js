/**
 * @fileoverview Modelo de Usuario para sistema de autenticación multi-tenant
 * @description Maneja operaciones CRUD de usuarios con autenticación JWT
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Modelo Usuario - Operaciones de base de datos para usuarios
 * @class UsuarioModel
 */
class UsuarioModel {

    /**
     * Crear un nuevo usuario con hash de contraseña
     * @param {Object} userData - Datos del usuario
     * @param {string} userData.email - Email único del usuario
     * @param {string} userData.password - Contraseña en texto plano
     * @param {string} userData.nombre - Nombre del usuario
     * @param {string} userData.apellidos - Apellidos del usuario
     * @param {string} userData.rol - Rol del usuario
     * @param {number} [userData.organizacion_id] - ID de la organización (opcional para super_admin)
     * @param {number} [userData.profesional_id] - ID del profesional vinculado (opcional)
     * @param {string} [userData.telefono] - Teléfono del usuario
     * @returns {Promise<Object>} Usuario creado sin contraseña
     * @throws {Error} Si el email ya existe o hay errores de validación
     */
    static async crear(userData) {
        const db = await getDb();

        try {
            // Configurar bypass RLS para permitir la creación de usuarios
            await db.query("SET app.bypass_rls = 'true'");

            // Hash de la contraseña
            const saltRounds = 12;
            const password_hash = await bcrypt.hash(userData.password, saltRounds);

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

        } catch (error) {
            if (error.code === '23505') { // Duplicate key
                throw new Error('El email ya está registrado en el sistema');
            }
            throw error;
        } finally {
            // Resetear bypass RLS
            try {
                await db.query("SET app.bypass_rls = 'false'");
            } catch (resetError) {
                // Log pero no fallar por esto
                console.warn('Error resetting RLS bypass:', resetError.message);
            }
            db.release();
        }
    }

    /**
     * Configurar contexto RLS para usuarios
     * @param {Object} db - Conexión a la base de datos
     * @param {number} userId - ID del usuario
     * @param {string} userRole - Rol del usuario
     * @param {number} organizacionId - ID de la organización
     */
    static async configurarContextoRLS(db, userId, userRole, organizacionId = null) {
        try {
            // Configurar contexto RLS para evitar recursión
            await db.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId.toString()]);
            await db.query('SELECT set_config($1, $2, true)', ['app.current_user_role', userRole]);

            if (organizacionId) {
                await db.query('SELECT set_config($1, $2, true)', ['app.current_tenant_id', organizacionId.toString()]);
            }
        } catch (error) {
            // Log pero no fallar por errores de configuración RLS
            const logger = require('../utils/logger');
            logger.warn('Error configurando contexto RLS', { error: error.message });
        }
    }

    /**
     * Buscar usuario por email para login (usa política RLS login_context)
     * @param {string} email - Email del usuario
     * @returns {Promise<Object|null>} Usuario con hash de contraseña o null
     */
    static async buscarPorEmail(email) {
        const db = await getDb();

        try {
            // Configurar contexto para login (permite acceso a través de política RLS)
            // IMPORTANTE: usar false para que persista en la sesión, no solo en transacción
            await db.query('SELECT set_config($1, $2, false)', ['app.current_user_role', 'login_context']);

            const query = `
                SELECT u.id, u.email, u.password_hash, u.nombre, u.apellidos, u.telefono,
                       u.rol, u.organizacion_id, u.profesional_id, u.activo, u.email_verificado,
                       u.ultimo_login, u.intentos_fallidos, u.bloqueado_hasta
                FROM usuarios u
                WHERE u.email = $1 AND u.activo = TRUE
            `;

            const result = await db.query(query, [email]);
            return result.rows[0] || null;
        } finally {
            db.release();
        }
    }

    /**
     * Verificar contraseña de usuario
     * @param {string} password - Contraseña en texto plano
     * @param {string} hash - Hash almacenado en base de datos
     * @returns {Promise<boolean>} True si la contraseña es correcta
     */
    static async verificarPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Autenticar usuario (login completo)
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña en texto plano
     * @param {string} [ipAddress] - IP del cliente para logs
     * @returns {Promise<Object>} Objeto con token, refresh token y datos del usuario
     * @throws {Error} Si las credenciales son inválidas o el usuario está bloqueado
     */
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

        // TODO: Verificar organización activa cuando tabla organizaciones esté disponible
        // if (usuario.rol !== 'super_admin' && !usuario.organizacion_activa) {
        //     throw new Error('Organización suspendida. Contacte al administrador');
        // }

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
            await this.configurarContextoRLS(db, usuario.id, usuario.rol, usuario.organizacion_id);
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
            expiresIn: 3600 // 1 hora
        };
    }

    /**
     * Generar tokens JWT (access y refresh)
     * @param {Object} usuario - Datos del usuario
     * @returns {Object} Objeto con accessToken y refreshToken
     */
    static generarTokens(usuario) {
        const payload = {
            userId: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
            organizacionId: usuario.organizacion_id
        };

        // Access token (1 hora)
        const accessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Refresh token (7 días) - usar secret dedicado para mayor seguridad
        const refreshToken = jwt.sign(
            { userId: usuario.id, type: 'refresh' },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        return { accessToken, refreshToken };
    }

    /**
     * Refrescar token de acceso
     * @param {string} refreshToken - Token de refresco
     * @returns {Promise<Object>} Nuevo access token
     * @throws {Error} Si el refresh token es inválido
     */
    static async refrescarToken(refreshToken) {
        try {
            // Verificar refresh token - usar secret dedicado
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

            // Buscar usuario por ID
            const usuario = await this.buscarPorId(decoded.userId);

            if (!usuario || !usuario.activo) {
                throw new Error('Usuario no válido');
            }

            // Generar nuevo access token
            const { accessToken } = this.generarTokens(usuario);

            return {
                accessToken,
                expiresIn: 3600
            };

        } catch (error) {
            throw new Error('Token de refresco inválido');
        }
    }

    /**
     * Buscar usuario por ID (configura contexto RLS para self-access)
     * @param {number} id - ID del usuario
     * @returns {Promise<Object|null>} Usuario encontrado o null
     */
    static async buscarPorId(id) {
        const db = await getDb();

        try {
            // Configurar contexto para self-access (usuario accede a su propio registro)
            await db.query('SELECT set_config($1, $2, false)', ['app.current_user_id', id.toString()]);

            const query = `
                SELECT u.id, u.email, u.nombre, u.apellidos, u.telefono,
                       u.rol, u.organizacion_id, u.activo, u.email_verificado
                FROM usuarios u
                WHERE u.id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        } finally {
            db.release();
        }
    }

    /**
     * Registrar intento de login para auditoría y control de seguridad
     * @param {string} email - Email del usuario
     * @param {boolean} exitoso - Si el login fue exitoso
     * @param {string} [ipAddress] - IP del cliente
     * @returns {Promise<void>}
     */
    static async registrarIntentoLogin(email, exitoso, ipAddress = null) {
        const db = await getDb();

        try {
            // Configurar contexto para login
            await db.query('SELECT set_config($1, $2, false)', ['app.current_user_role', 'login_context']);

            // Llamar a la función de base de datos para registrar el intento
            await db.query('SELECT registrar_intento_login($1, $2, $3)', [
                email,
                exitoso,
                ipAddress
            ]);
        } catch (error) {
            // Log error pero no fallar el login por esto
            console.error('Error al registrar intento de login:', error);
        } finally {
            db.release();
        }
    }

    /**
     * Cambiar contraseña de usuario
     * @param {number} userId - ID del usuario
     * @param {string} passwordAnterior - Contraseña actual
     * @param {string} passwordNueva - Nueva contraseña
     * @returns {Promise<boolean>} True si se cambió exitosamente
     * @throws {Error} Si la contraseña anterior es incorrecta
     */
    static async cambiarPassword(userId, passwordAnterior, passwordNueva) {
        const db = await getDb();

        // Obtener usuario con hash actual
        const query = `SELECT password_hash FROM usuarios WHERE id = $1 AND activo = TRUE`;
        const result = await db.query(query, [userId]);

        if (!result.rows[0]) {
            throw new Error('Usuario no encontrado');
        }

        // Verificar contraseña anterior
        const passwordValida = await this.verificarPassword(passwordAnterior, result.rows[0].password_hash);

        if (!passwordValida) {
            throw new Error('Contraseña anterior incorrecta');
        }

        // Hash de la nueva contraseña
        const saltRounds = 12;
        const nuevoHash = await bcrypt.hash(passwordNueva, saltRounds);

        // Actualizar contraseña
        const updateQuery = `
            UPDATE usuarios
            SET password_hash = $1, actualizado_en = NOW()
            WHERE id = $2
        `;

        await db.query(updateQuery, [nuevoHash, userId]);
        return true;
    }

    /**
     * Listar usuarios por organización (para administradores)
     * @param {number} organizacionId - ID de la organización
     * @param {Object} [filtros] - Filtros opcionales
     * @param {number} [filtros.limite] - Límite de resultados
     * @param {number} [filtros.offset] - Offset para paginación
     * @returns {Promise<Array>} Lista de usuarios
     */
    static async listarPorOrganizacion(organizacionId, filtros = {}) {
        const db = await getDb();

        const { limite = 50, offset = 0 } = filtros;

        const query = `
            SELECT u.id, u.email, u.nombre, u.apellidos, u.telefono, u.rol,
                   u.activo, u.email_verificado, u.ultimo_login,
                   p.nombre_completo as profesional_nombre, p.tipo_profesional,
                   u.creado_en, u.actualizado_en
            FROM usuarios u
            LEFT JOIN profesionales p ON u.profesional_id = p.id
            WHERE u.organizacion_id = $1
            ORDER BY u.creado_en DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await db.query(query, [organizacionId, limite, offset]);
        return result.rows;
    }

    /**
     * Actualizar perfil de usuario
     * @param {number} userId - ID del usuario
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object>} Usuario actualizado
     */
    static async actualizarPerfil(userId, datos) {
        const db = await getDb();

        const camposPermitidos = ['nombre', 'apellidos', 'telefono', 'zona_horaria', 'idioma', 'configuracion_ui'];
        const campos = [];
        const valores = [];
        let contador = 1;

        // Construir query dinámico solo con campos permitidos
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
        return result.rows[0];
    }

    /**
     * Desbloquear usuario y resetear intentos fallidos
     * @param {number} userId - ID del usuario a desbloquear
     * @param {number} adminId - ID del administrador que realiza el desbloqueo
     * @returns {Promise<Object>} Usuario desbloqueado
     * @throws {Error} Si el usuario no existe o no se puede desbloquear
     */
    static async desbloquearUsuario(userId, adminId) {
        const db = await getDb();

        try {
            // Configurar contexto como super_admin para acceso total
            await db.query('SELECT set_config($1, $2, false)', ['app.current_user_role', 'super_admin']);

            const query = `
                UPDATE usuarios
                SET
                    intentos_fallidos = 0,
                    bloqueado_hasta = NULL,
                    actualizado_en = NOW()
                WHERE id = $1 AND activo = TRUE
                RETURNING id, email, nombre, apellidos, rol, organizacion_id,
                         intentos_fallidos, bloqueado_hasta, activo
            `;

            const result = await db.query(query, [userId]);

            if (result.rows.length === 0) {
                throw new Error('Usuario no encontrado o inactivo');
            }

            // Log de auditoría
            const logger = require('../utils/logger');
            logger.info('Usuario desbloqueado por administrador', {
                usuarioDesbloqueado: userId,
                administrador: adminId,
                timestamp: new Date().toISOString()
            });

            return result.rows[0];

        } finally {
            db.release();
        }
    }

    /**
     * Obtener lista de usuarios bloqueados por organización
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} Lista de usuarios bloqueados
     */
    static async obtenerUsuariosBloqueados(organizacionId) {
        const db = await getDb();

        try {
            // Configurar contexto como super_admin para acceso total
            await db.query('SELECT set_config($1, $2, false)', ['app.current_user_role', 'super_admin']);

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

        } finally {
            db.release();
        }
    }

    /**
     * Verificar si un usuario está actualmente bloqueado
     * @param {number} userId - ID del usuario
     * @param {string} [contextRole] - Rol del contexto (super_admin, admin, etc.)
     * @returns {Promise<Object>} Estado de bloqueo del usuario
     */
    static async verificarBloqueo(userId, contextRole = 'super_admin') {
        const db = await getDb();

        try {
            // Configurar contexto según el rol
            if (contextRole === 'super_admin') {
                await db.query('SELECT set_config($1, $2, false)', ['app.current_user_role', 'super_admin']);
            } else {
                // Para self-access
                await db.query('SELECT set_config($1, $2, false)', ['app.current_user_id', userId.toString()]);
            }

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

        } finally {
            db.release();
        }
    }

    /**
     * Crear usuario automáticamente asignado a organización (CRÍTICO para onboarding)
     * @param {number} orgId - ID de la organización
     * @param {Object} userData - Datos del usuario
     * @param {string} rol - Rol del usuario ('admin', 'propietario', 'empleado')
     * @param {Object} opciones - Opciones adicionales
     * @returns {Promise<Object>} Usuario creado + resultado de email de bienvenida
     */
    static async crearUsuarioOrganizacion(orgId, userData, rol, opciones = {}) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            // Configurar bypass RLS para creación
            await db.query("SET app.current_user_role = 'super_admin'");
            await db.query("SET app.bypass_rls = 'true'");

            // Validar que la organización existe
            const orgQuery = `
                SELECT id, nombre_comercial, email_admin, tipo_industria, activo
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

            // Configurar contexto RLS para el nuevo usuario
            await this.configurarContextoRLS(db, nuevoUsuario.id, rol, orgId);

            // Registrar evento en auditoría (si tabla eventos_sistema existe)
            try {
                const eventoQuery = `
                    INSERT INTO eventos_sistema (
                        organizacion_id, evento_tipo, entidad_tipo, entidad_id,
                        descripcion, metadatos, usuario_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `;

                await db.query(eventoQuery, [
                    orgId,
                    'usuario_creado',
                    'usuario',
                    nuevoUsuario.id,
                    `Usuario ${rol} creado automáticamente durante onboarding`,
                    JSON.stringify({
                        rol: rol,
                        email: nuevoUsuario.email,
                        nombre_completo: `${nuevoUsuario.nombre} ${nuevoUsuario.apellidos || ''}`.trim(),
                        organizacion_nombre: organizacion.nombre_comercial
                    }),
                    nuevoUsuario.id
                ]);
            } catch (eventoError) {
                // No fallar por esto, la tabla podría no existir
                console.warn('No se pudo registrar evento en auditoría:', eventoError.message);
            }

            await db.query('COMMIT');

            const logger = require('../utils/logger');
            logger.info('Usuario de organización creado automáticamente', {
                usuario_id: nuevoUsuario.id,
                organizacion_id: orgId,
                rol: rol,
                email: nuevoUsuario.email,
                organizacion_nombre: organizacion.nombre_comercial
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

        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * Listar usuarios de una organización específica con filtros avanzados
     * @param {number} orgId - ID de la organización
     * @param {Object} filtros - Filtros de búsqueda
     * @param {Object} paginacion - Configuración de paginación
     * @returns {Promise<Object>} Lista de usuarios con metadatos
     */
    static async listarPorOrganizacion(orgId, filtros = {}, paginacion = {}) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
            await db.query("SET app.current_user_role = 'super_admin'");
            await db.query("SET app.bypass_rls = 'true'");

            const {
                rol = null,
                activo = null,
                email_verificado = null,
                buscar = null // búsqueda por nombre o email
            } = filtros;

            const {
                page = 1,
                limit = 10,
                order_by = 'creado_en',
                order_direction = 'DESC'
            } = paginacion;

            const offset = (page - 1) * limit;

            // Construir WHERE dinámico
            let whereConditions = ['u.organizacion_id = $1'];
            let queryParams = [orgId];
            let paramCounter = 2;

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

            const whereClause = whereConditions.join(' AND ');

            // Query para contar total de registros
            const countQuery = `
                SELECT COUNT(*) as total
                FROM usuarios u
                WHERE ${whereClause}
            `;

            // Query principal con joins a profesionales
            const dataQuery = `
                SELECT
                    u.id, u.email, u.nombre, u.apellidos, u.telefono, u.rol,
                    u.activo, u.email_verificado, u.ultimo_login, u.intentos_fallidos,
                    u.bloqueado_hasta, u.creado_en, u.actualizado_en,
                    p.id as profesional_id,
                    p.nombre_completo as profesional_nombre,
                    p.tipo_profesional,
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
                ORDER BY u.${order_by} ${order_direction}
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

        } finally {
            db.release();
        }
    }

    /**
     * Cambiar rol de usuario con validaciones de permisos y log de auditoría
     * @param {number} userId - ID del usuario
     * @param {string} nuevoRol - Nuevo rol a asignar
     * @param {number} orgId - ID de la organización
     * @param {number} adminId - ID del administrador que realiza el cambio
     * @returns {Promise<Object>} Usuario con rol actualizado
     */
    static async cambiarRol(userId, nuevoRol, orgId, adminId) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            // Configurar contexto como super_admin
            await db.query("SET app.current_user_role = 'super_admin'");
            await db.query("SET app.bypass_rls = 'true'");

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

            // Registrar en auditoría
            try {
                const eventoQuery = `
                    INSERT INTO eventos_sistema (
                        organizacion_id, evento_tipo, entidad_tipo, entidad_id,
                        descripcion, metadatos, usuario_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `;

                await db.query(eventoQuery, [
                    orgId,
                    'usuario_rol_cambiado',
                    'usuario',
                    userId,
                    `Rol de usuario cambiado de ${rolAnterior} a ${nuevoRol}`,
                    JSON.stringify({
                        usuario_email: usuario.email,
                        rol_anterior: rolAnterior,
                        rol_nuevo: nuevoRol,
                        admin_id: adminId,
                        timestamp: new Date().toISOString()
                    }),
                    adminId
                ]);
            } catch (eventoError) {
                console.warn('No se pudo registrar evento de cambio de rol:', eventoError.message);
            }

            await db.query('COMMIT');

            const logger = require('../utils/logger');
            logger.info('Rol de usuario cambiado', {
                usuario_id: userId,
                organizacion_id: orgId,
                rol_anterior: rolAnterior,
                rol_nuevo: nuevoRol,
                admin_id: adminId
            });

            return {
                usuario: updateResult.rows[0],
                cambio: {
                    rol_anterior: rolAnterior,
                    rol_nuevo: nuevoRol,
                    realizado_por: adminId,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * Reset password específico por organización (con token temporal)
     * @param {string} email - Email del usuario
     * @param {number} orgId - ID de la organización
     * @returns {Promise<Object>} Información del token de reset
     */
    static async resetPassword(email, orgId) {
        const db = await getDb();

        try {
            // Configurar contexto para acceso
            await db.query("SET app.current_user_role = 'super_admin'");
            await db.query("SET app.bypass_rls = 'true'");

            // Buscar usuario por email y organización
            const usuarioQuery = `
                SELECT id, email, nombre, apellidos, organizacion_id, activo
                FROM usuarios
                WHERE email = $1 AND organizacion_id = $2 AND activo = true
            `;
            const usuarioResult = await db.query(usuarioQuery, [email, orgId]);

            if (usuarioResult.rows.length === 0) {
                // Por seguridad, no revelar si el usuario existe o no
                return {
                    mensaje: 'Si el usuario existe, se ha enviado un email con instrucciones para restablecer la contraseña',
                    token_enviado: false
                };
            }

            const usuario = usuarioResult.rows[0];

            // Generar token temporal de reset (válido por 1 hora)
            const crypto = require('crypto');
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

            // Actualizar usuario con token de reset
            const updateQuery = `
                UPDATE usuarios
                SET
                    token_reset_password = $1,
                    token_reset_expira = $2,
                    actualizado_en = NOW()
                WHERE id = $3
            `;

            await db.query(updateQuery, [resetToken, resetExpiration, usuario.id]);

            const logger = require('../utils/logger');
            logger.info('Token de reset password generado', {
                usuario_id: usuario.id,
                email: email,
                organizacion_id: orgId,
                token_expira: resetExpiration.toISOString()
            });

            // TODO: Enviar email con token (integración futura)
            return {
                mensaje: 'Token de reset generado exitosamente',
                token_enviado: true,
                usuario_id: usuario.id,
                expires_at: resetExpiration.toISOString(),
                // En desarrollo, incluir token (REMOVER en producción)
                ...(process.env.NODE_ENV !== 'production' && { reset_token: resetToken })
            };

        } finally {
            db.release();
        }
    }

    /**
     * Verificar email con token (proceso de verificación de cuenta)
     * @param {string} token - Token de verificación de email
     * @returns {Promise<Object>} Resultado de la verificación
     */
    static async verificarEmail(token) {
        const db = await getDb();

        try {
            // Configurar contexto para verificación
            await db.query("SET app.current_user_role = 'super_admin'");
            await db.query("SET app.bypass_rls = 'true'");

            // Buscar usuario por token (implementar cuando tabla soporte tokens de verificación)
            // Por ahora, asumir que el token es un JWT simple con userId
            let userId;
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId;
            } catch (jwtError) {
                throw new Error('Token de verificación inválido o expirado');
            }

            // Buscar y verificar usuario
            const usuarioQuery = `
                SELECT id, email, nombre, apellidos, rol, organizacion_id, email_verificado
                FROM usuarios
                WHERE id = $1 AND activo = true
            `;
            const usuarioResult = await db.query(usuarioQuery, [userId]);

            if (usuarioResult.rows.length === 0) {
                throw new Error('Usuario no encontrado');
            }

            const usuario = usuarioResult.rows[0];

            if (usuario.email_verificado) {
                return {
                    ya_verificado: true,
                    mensaje: 'El email ya había sido verificado anteriormente',
                    usuario: {
                        id: usuario.id,
                        email: usuario.email,
                        nombre: `${usuario.nombre} ${usuario.apellidos || ''}`.trim()
                    }
                };
            }

            // Marcar email como verificado
            const updateQuery = `
                UPDATE usuarios
                SET
                    email_verificado = true,
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING id, email, nombre, apellidos, rol, organizacion_id, email_verificado
            `;

            const updateResult = await db.query(updateQuery, [userId]);

            const logger = require('../utils/logger');
            logger.info('Email de usuario verificado', {
                usuario_id: userId,
                email: usuario.email,
                organizacion_id: usuario.organizacion_id
            });

            return {
                verificado: true,
                mensaje: 'Email verificado exitosamente',
                usuario: {
                    id: updateResult.rows[0].id,
                    email: updateResult.rows[0].email,
                    nombre: `${updateResult.rows[0].nombre} ${updateResult.rows[0].apellidos || ''}`.trim(),
                    rol: updateResult.rows[0].rol,
                    email_verificado: updateResult.rows[0].email_verificado
                }
            };

        } finally {
            db.release();
        }
    }
}

module.exports = UsuarioModel;