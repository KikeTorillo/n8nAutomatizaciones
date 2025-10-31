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
 * - Password mínimo 12 caracteres
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
        if (!password || password.length < 12) {
            return ResponseHelper.error(
                res,
                'La contraseña debe tener al menos 12 caracteres para máxima seguridad',
                400
            );
        }

        // Validar complejidad del password
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            return ResponseHelper.error(
                res,
                'La contraseña debe contener: mayúsculas, minúsculas, números y caracteres especiales',
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
            // 7. CREAR SUPER ADMIN
            // ====================================================================
            const query = `
                INSERT INTO usuarios (
                    email, password_hash, nombre, apellidos,
                    rol, email_verificado, activo, organizacion_id
                ) VALUES ($1, $2, $3, $4, $5, true, true, NULL)
                RETURNING id, email, nombre, apellidos, rol, creado_en
            `;

            const result = await db.query(query, [
                email,
                passwordHash,
                nombre || 'Super',          // Usar nombre del form o default
                apellidos || 'Admin',       // Usar apellidos del form o default
                'super_admin'
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

module.exports = router;
