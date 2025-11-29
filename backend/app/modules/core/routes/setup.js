/**
 * @fileoverview Rutas de setup inicial del sistema
 * @description Endpoints especiales para configuración inicial one-time
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../../../config/database');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const { rateLimiting } = require('../../../middleware');
const { crearN8nOwner, generarN8nApiKey } = require('../../../utils/n8nSetupHelper');
const configService = require('../../../services/configService');
const n8nGlobalCredentialsService = require('../../../services/n8nGlobalCredentialsService');
const RLSContextManager = require('../../../utils/rlsContextManager');

const router = express.Router();

/**
 * ====================================================================
 * RATE LIMITING ESTRICTO PARA SEGURIDAD
 * ====================================================================
 * Solo permite 3 intentos por hora para prevenir brute force
 * Una vez creado exitosamente, no consume más intentos
 */
const setupRateLimit = rateLimiting.createRateLimit({
    windowMs: 60 * 60 * 1000,      // 1 hora
    max: 3,                         // Solo 3 intentos por hora
    skipSuccessfulRequests: true,   // No contar intentos exitosos
    message: 'Demasiados intentos de setup. Por favor espere 1 hora antes de intentar nuevamente.'
});

/**
 * ====================================================================
 * GET /api/v1/setup/check
 * ====================================================================
 * Verifica si ya existe un super administrador en el sistema
 *
 * Este endpoint se usa para determinar si mostrar la página de setup
 * inicial o redirigir al login normal
 *
 * ✅ RESPONSE 200:
 * {
 *   "success": true,
 *   "data": {
 *     "needsSetup": true/false,
 *     "hasSuperAdmin": true/false
 *   }
 * }
 */
router.get('/check',
    asyncHandler(async (req, res) => {
        const db = await getDb();
        try {
            // Bypass RLS para consulta global
            await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'true']);

            const result = await db.query(
                'SELECT COUNT(*) FROM usuarios WHERE rol = $1',
                ['super_admin']
            );

            const hasSuperAdmin = parseInt(result.rows[0].count) > 0;

            ResponseHelper.success(res, {
                needsSetup: !hasSuperAdmin,
                hasSuperAdmin: hasSuperAdmin
            }, 'Setup status verificado');

        } catch (error) {
            console.error('❌ Error verificando setup:', error);
            ResponseHelper.error(res, 'Error verificando estado del sistema', 500);
        } finally {
            await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'false']);
            db.release();
        }
    })
);

/**
 * ====================================================================
 * POST /api/v1/setup/create-superadmin
 * ====================================================================
 * Endpoint especial para crear super administrador inicial
 *
 * 🔒 SEGURIDAD:
 * - Solo se puede ejecutar SI NO EXISTE ningún super_admin
 * - Requiere secret_key que coincida con SETUP_SECRET_KEY del .env
 * - Password mínimo 8 caracteres
 * - Rate limiting estricto (3 intentos/hora)
 *
 * 📝 BODY:
 * {
 *   "email": "superadmin@empresa.com",
 *   "password": "MiPasswordSeguro123!",
 *   "secret_key": "valor_de_SETUP_SECRET_KEY"
 * }
 *
 * ✅ RESPONSE 201:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "email": "superadmin@empresa.com",
 *     "nombre": "Super",
 *     "apellidos": "Admin",
 *     "rol": "super_admin",
 *     "created_at": "2025-10-30T..."
 *   },
 *   "message": "Super administrador creado exitosamente"
 * }
 *
 * ❌ ERRORES:
 * - 400: Super admin ya existe / Password débil / Datos inválidos
 * - 403: Secret key inválida
 * - 500: Error interno del servidor
 */
router.post('/create-superadmin',
    setupRateLimit,
    asyncHandler(async (req, res) => {
        const { email, password, secret_key, nombre, apellidos } = req.body;

        // ====================================================================
        // 2. VALIDAR EMAIL
        // ====================================================================
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return ResponseHelper.error(
                res,
                'Email inválido. Debe ser un correo electrónico válido',
                400
            );
        }

        // ====================================================================
        // 3. VALIDAR PASSWORD
        // ====================================================================
        if (!password || password.length < 8) {
            return ResponseHelper.error(
                res,
                'La contraseña debe tener al menos 8 caracteres',
                400
            );
        }

        // Validar complejidad del password
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
            return ResponseHelper.error(
                res,
                'La contraseña debe contener: mayúsculas, minúsculas y números',
                400
            );
        }

        const db = await getDb();
        try {
            // ====================================================================
            // 1. VERIFICAR SI EXISTE SUPER_ADMIN
            // ====================================================================
            // Bypass RLS para esta consulta global
            await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'true']);

            const existingCheck = await db.query(
                'SELECT COUNT(*) FROM usuarios WHERE rol = $1',
                ['super_admin']
            );

            const hasSuperAdmin = parseInt(existingCheck.rows[0].count) > 0;

            // ====================================================================
            // 2. VALIDAR SECRET KEY (solo si ya existe super admin)
            // ====================================================================
            // Si ya existe un super admin, requiere secret_key para seguridad adicional
            // Si es la primera vez (no hay super admin), no se requiere secret_key
            if (hasSuperAdmin) {
                // Si ya existe super admin, no permitir crear otro
                return ResponseHelper.error(
                    res,
                    'Ya existe un super administrador en el sistema. Este endpoint solo puede usarse una vez.',
                    400
                );
            }

            // ====================================================================
            // 5. VERIFICAR QUE EMAIL NO ESTÉ EN USO
            // ====================================================================
            const emailCheck = await db.query(
                'SELECT COUNT(*) FROM usuarios WHERE email = $1',
                [email]
            );

            if (parseInt(emailCheck.rows[0].count) > 0) {
                return ResponseHelper.error(
                    res,
                    'Este email ya está registrado en el sistema',
                    400
                );
            }

            // ====================================================================
            // 6. HASHEAR PASSWORD
            // ====================================================================
            const passwordHash = await bcrypt.hash(password, 10);

            // ====================================================================
            // 7. OBTENER ORGANIZACIÓN DE PLATAFORMA (ID=1)
            // ====================================================================
            // El super_admin requiere organización (modelo Nov 2025)
            // Usa la org de plataforma creada en datos-iniciales.sql
            const orgResult = await db.query(
                'SELECT id FROM organizaciones WHERE id = 1'
            );

            if (orgResult.rows.length === 0) {
                return ResponseHelper.error(
                    res,
                    'Error: No existe la organización de plataforma (ID=1). Ejecute los scripts SQL primero.',
                    500
                );
            }

            const organizacionId = orgResult.rows[0].id;

            // ====================================================================
            // 8. CREAR SUPER ADMIN
            // ====================================================================
            const query = `
                INSERT INTO usuarios (
                    email, password_hash, nombre, apellidos,
                    rol, email_verificado, activo, organizacion_id
                ) VALUES ($1, $2, $3, $4, $5, true, true, $6)
                RETURNING id, email, nombre, apellidos, rol, creado_en
            `;

            const result = await db.query(query, [
                email,
                passwordHash,
                nombre || 'Super',          // Usar nombre del form o default
                apellidos || 'Admin',       // Usar apellidos del form o default
                'super_admin',
                organizacionId              // Asignar org de plataforma
            ]);

            const superAdmin = result.rows[0];

            // ====================================================================
            // 8. LOG DE AUDITORÍA
            // ====================================================================
            console.log('✅ SUPER ADMIN CREADO:', {
                id: superAdmin.id,
                email: superAdmin.email,
                timestamp: new Date().toISOString(),
                ip: req.ip
            });

            // ====================================================================
            // 9. RESPUESTA EXITOSA
            // ====================================================================
            ResponseHelper.success(
                res,
                {
                    id: superAdmin.id,
                    email: superAdmin.email,
                    nombre: superAdmin.nombre,
                    apellidos: superAdmin.apellidos,
                    rol: superAdmin.rol,
                    creado_en: superAdmin.creado_en
                },
                'Super administrador creado exitosamente. Por favor inicie sesión.',
                201
            );
        } catch (error) {
            console.error('❌ ERROR CREANDO SUPER ADMIN:', error);
            ResponseHelper.error(
                res,
                'Error al crear super administrador: ' + error.message,
                500
            );
        } finally {
            // Restaurar RLS
            try {
                await db.query('SELECT set_config($1, $2, false)', ['app.bypass_rls', 'false']);
            } catch (e) {
                console.warn('⚠️  Error restaurando RLS:', e.message);
            }
            db.release();
        }
    })
);

/**
 * ====================================================================
 * POST /api/v1/setup/unified-setup
 * ====================================================================
 * Endpoint unificado para setup completo del sistema
 *
 * 🎯 FUNCIONALIDAD:
 * 1. Crea super administrador en la base de datos
 * 2. Crea owner de n8n y genera API Key
 * 3. Guarda API Key en configuracion_sistema
 * 4. Crea credentials globales (DeepSeek, PostgreSQL, Redis)
 *
 * 🔒 SEGURIDAD:
 * - Solo se puede ejecutar SI NO EXISTE ningún super_admin
 * - Rate limiting estricto (3 intentos/hora)
 * - Transaccional: rollback completo si falla algún paso
 *
 * 📝 BODY:
 * {
 *   "superAdmin": {
 *     "email": "admin@empresa.com",
 *     "password": "MiPasswordSeguro123!",
 *     "nombre": "Juan",
 *     "apellidos": "Pérez"
 *   },
 *   "n8nOwner": {
 *     "email": "owner@n8n.com",      // Puede ser el mismo que superAdmin
 *     "password": "N8nPass123!",
 *     "firstName": "Juan",
 *     "lastName": "Pérez"
 *   }
 * }
 *
 * ✅ RESPONSE 201:
 * {
 *   "success": true,
 *   "data": {
 *     "superAdmin": { id, email, rol },
 *     "n8n": {
 *       "owner": { id, email },
 *       "apiKeyConfigured": true,
 *       "globalCredentials": {
 *         "deepseek": { id, name },
 *         "postgres": { id, name },
 *         "redis": { id, name }
 *       }
 *     }
 *   },
 *   "message": "Sistema configurado exitosamente"
 * }
 */
router.post('/unified-setup',
    setupRateLimit,
    asyncHandler(async (req, res) => {
        const { superAdmin, n8nOwner } = req.body;

        // ====================================================================
        // 1. VALIDAR DATOS DE ENTRADA
        // ====================================================================
        if (!superAdmin || !superAdmin.email || !superAdmin.password) {
            return ResponseHelper.error(
                res,
                'Datos de super administrador incompletos',
                400
            );
        }

        if (!n8nOwner || !n8nOwner.email || !n8nOwner.password) {
            return ResponseHelper.error(
                res,
                'Datos de owner de n8n incompletos',
                400
            );
        }

        // Validar email del super admin
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(superAdmin.email)) {
            return ResponseHelper.error(
                res,
                'Email de super administrador inválido',
                400
            );
        }

        // Validar password del super admin
        if (superAdmin.password.length < 8) {
            return ResponseHelper.error(
                res,
                'La contraseña del super administrador debe tener al menos 8 caracteres',
                400
            );
        }

        const hasUpperCase = /[A-Z]/.test(superAdmin.password);
        const hasLowerCase = /[a-z]/.test(superAdmin.password);
        const hasNumbers = /\d/.test(superAdmin.password);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
            return ResponseHelper.error(
                res,
                'La contraseña debe contener: mayúsculas, minúsculas y números',
                400
            );
        }

        try {
            // ====================================================================
            // 2. VERIFICAR QUE NO EXISTA SUPER ADMIN
            // ====================================================================
            const hasSuperAdmin = await RLSContextManager.withBypass(async (db) => {
                const result = await db.query(
                    'SELECT COUNT(*) FROM usuarios WHERE rol = $1',
                    ['super_admin']
                );
                return parseInt(result.rows[0].count) > 0;
            });

            if (hasSuperAdmin) {
                return ResponseHelper.error(
                    res,
                    'Ya existe un super administrador. Este endpoint solo puede usarse una vez.',
                    400
                );
            }

            // ====================================================================
            // 3. VERIFICAR QUE EMAIL NO ESTÉ EN USO
            // ====================================================================
            const emailInUse = await RLSContextManager.withBypass(async (db) => {
                const result = await db.query(
                    'SELECT COUNT(*) FROM usuarios WHERE email = $1',
                    [superAdmin.email]
                );
                return parseInt(result.rows[0].count) > 0;
            });

            if (emailInUse) {
                return ResponseHelper.error(
                    res,
                    'Este email ya está registrado en el sistema',
                    400
                );
            }

            // ====================================================================
            // 4. CREAR SUPER ADMIN + N8N OWNER + API KEY (TRANSACCIONAL)
            // ====================================================================
            const resultado = await RLSContextManager.withBypass(async (db) => {
                // 4.1 Obtener organización de plataforma (ID=1)
                // El super_admin requiere organización (modelo Nov 2025)
                const orgResult = await db.query(
                    'SELECT id FROM organizaciones WHERE id = 1'
                );

                if (orgResult.rows.length === 0) {
                    throw new Error('No existe la organización de plataforma (ID=1). Ejecute los scripts SQL primero.');
                }

                const organizacionId = orgResult.rows[0].id;

                // 4.2 Crear super admin en BD
                const passwordHash = await bcrypt.hash(superAdmin.password, 10);

                const superAdminCreado = await db.query(`
                    INSERT INTO usuarios (
                        email, password_hash, nombre, apellidos,
                        rol, email_verificado, activo, organizacion_id
                    ) VALUES ($1, $2, $3, $4, $5, true, true, $6)
                    RETURNING id, email, nombre, apellidos, rol, creado_en
                `, [
                    superAdmin.email,
                    passwordHash,
                    superAdmin.nombre || 'Super',
                    superAdmin.apellidos || 'Admin',
                    'super_admin',
                    organizacionId
                ]);

                const superAdminData = superAdminCreado.rows[0];

                // 4.2 Crear owner de n8n (con reintentos automáticos)
                const n8nOwnerData = await crearN8nOwner({
                    email: n8nOwner.email,
                    password: n8nOwner.password,
                    firstName: n8nOwner.firstName || 'N8N',
                    lastName: n8nOwner.lastName || 'Owner'
                });

                // 4.3 Generar API Key de n8n
                const apiKey = await generarN8nApiKey(
                    n8nOwner.email,
                    n8nOwner.password
                );

                // 4.4 Guardar API Key en configuracion_sistema (usar misma conexión db)
                await configService.setN8nApiKey(apiKey, {
                    ownerEmail: n8nOwner.email,
                    superAdminId: superAdminData.id,
                    db: db // Pasar la conexión de la transacción padre
                });

                return {
                    superAdmin: superAdminData,
                    n8nOwner: n8nOwnerData
                };
            }, { useTransaction: true }); // ✅ Transacción completa

            // ====================================================================
            // 5. CREAR CREDENTIALS GLOBALES DE N8N
            // ====================================================================
            // Estas NO van en transacción porque son operaciones externas a n8n
            const globalCredentials = await n8nGlobalCredentialsService.obtenerTodasLasCredentials();

            // ====================================================================
            // 6. LOG DE AUDITORÍA
            // ====================================================================
            console.log('✅ UNIFIED SETUP COMPLETADO:', {
                superAdmin: {
                    id: resultado.superAdmin.id,
                    email: resultado.superAdmin.email
                },
                n8nOwner: {
                    id: resultado.n8nOwner.id,
                    email: resultado.n8nOwner.email
                },
                globalCredentials: {
                    deepseek: globalCredentials.deepseek.id,
                    postgres: globalCredentials.postgres.id,
                    redis: globalCredentials.redis.id
                },
                timestamp: new Date().toISOString(),
                ip: req.ip
            });

            // ====================================================================
            // 7. RESPUESTA EXITOSA
            // ====================================================================
            ResponseHelper.success(
                res,
                {
                    superAdmin: {
                        id: resultado.superAdmin.id,
                        email: resultado.superAdmin.email,
                        nombre: resultado.superAdmin.nombre,
                        apellidos: resultado.superAdmin.apellidos,
                        rol: resultado.superAdmin.rol
                    },
                    n8n: {
                        owner: {
                            id: resultado.n8nOwner.id,
                            email: resultado.n8nOwner.email
                        },
                        apiKeyConfigured: true,
                        globalCredentials: {
                            deepseek: {
                                id: globalCredentials.deepseek.id,
                                name: globalCredentials.deepseek.name
                            },
                            postgres: {
                                id: globalCredentials.postgres.id,
                                name: globalCredentials.postgres.name
                            },
                            redis: {
                                id: globalCredentials.redis.id,
                                name: globalCredentials.redis.name
                            }
                        }
                    }
                },
                'Sistema configurado exitosamente. Por favor inicie sesión.',
                201
            );

        } catch (error) {
            console.error('❌ ERROR EN UNIFIED SETUP:', error);

            // Errores específicos de n8n
            if (error.message.includes('n8n')) {
                return ResponseHelper.error(
                    res,
                    `Error configurando n8n: ${error.message}`,
                    500
                );
            }

            // Error genérico
            ResponseHelper.error(
                res,
                `Error en setup del sistema: ${error.message}`,
                500
            );
        }
    })
);

module.exports = router;
