/**
 * Rutas de prueba para testing de middlewares
 * Solo para desarrollo y testing
 */

const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { ResponseHelper } = require('../../../utils/helpers');
const middleware = require('../../../middleware');

// Test básico sin middleware
router.get('/ping', (req, res) => {
  ResponseHelper.success(res, { message: 'pong' }, 'Servidor funcionando');
});

// Test de rate limiting por IP
router.get('/rate-limit-test',
  middleware.rateLimiting.createRateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 3, // Solo 3 requests por minuto para testing
    message: 'Rate limit de prueba excedido'
  }),
  (req, res) => {
    ResponseHelper.success(res, {
      message: 'Rate limit test passed',
      timestamp: new Date().toISOString()
    });
  }
);

// Test de validación
router.post('/validation-test',
  middleware.validation.validateBody(
    Joi.object({
      nombre: middleware.validation.commonSchemas.nameRequired
    })
  ),
  (req, res) => {
    ResponseHelper.success(res, {
      received: req.body,
      message: 'Validación exitosa'
    });
  }
);

// Test de sanitización
router.post('/sanitize-test',
  middleware.validation.sanitizeInput,
  (req, res) => {
    ResponseHelper.success(res, {
      sanitized: req.body,
      message: 'Datos sanitizados'
    });
  }
);

// Test de autenticación opcional
router.get('/optional-auth-test',
  middleware.auth.optionalAuth,
  (req, res) => {
    ResponseHelper.success(res, {
      authenticated: !!req.user,
      user: req.user || null,
      tenant: req.tenant || null,
      message: 'Autenticación opcional funcionando'
    });
  }
);

// Test de autenticación requerida
router.get('/auth-required-test',
  middleware.auth.authenticateToken,
  (req, res) => {
    ResponseHelper.success(res, {
      user: req.user,
      tenant: req.tenant,
      message: 'Autenticación requerida exitosa'
    });
  }
);

// Test de autenticación completa con tenant
router.get('/full-auth-test',
  ...middleware.composed.requireFullAuth,
  (req, res) => {
    ResponseHelper.success(res, {
      user: req.user,
      tenant: req.tenant,
      message: 'Autenticación completa con tenant activo'
    });
  }
);

// Test de rol admin
router.get('/admin-test',
  ...middleware.composed.requireAdminAuth,
  (req, res) => {
    ResponseHelper.success(res, {
      user: req.user,
      message: 'Acceso de administrador exitoso'
    });
  }
);

// Test de validación de parámetros
router.get('/params-test/:id',
  middleware.validation.validateParams(
    middleware.validation.commonSchemas.id.label('id')
  ),
  (req, res) => {
    ResponseHelper.success(res, {
      params: req.params,
      message: 'Validación de parámetros exitosa'
    });
  }
);

// Test combinado: auth + validation + rate limiting
router.post('/combined-test',
  middleware.rateLimiting.userRateLimit,
  middleware.auth.authenticateToken,
  middleware.validation.validateBody({
    titulo: middleware.validation.commonSchemas.textRequired,
    descripcion: middleware.validation.commonSchemas.text
  }),
  middleware.tenant.injectTenantId,
  (req, res) => {
    ResponseHelper.success(res, {
      user: req.user,
      tenant: req.tenant,
      data: req.body,
      message: 'Test combinado exitoso'
    });
  }
);

// Test de refresh token
router.post('/refresh-token-test',
  middleware.auth.refreshToken
);

// Test de health check de middleware
router.get('/health-check',
  async (req, res) => {
    try {
      const database = require('../../../config/database');
      const healthStatus = await database.healthCheck();

      ResponseHelper.success(res, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: healthStatus,
        middleware: {
          auth: 'loaded',
          tenant: 'loaded',
          validation: 'loaded',
          rateLimiting: 'loaded'
        }
      }, 'Health check exitoso');
    } catch (error) {
      ResponseHelper.error(res, 'Health check falló', 500, {
        error: error.message
      });
    }
  }
);

// Endpoint de debug para verificar búsqueda de usuario
router.get('/debug-user/:email',
  async (req, res) => {
    try {
      const { getDb } = require('../../../config/database');
      const email = req.params.email;

      console.log('🔍 Debug: Buscando usuario:', email);

      // Hacer debug manual paso a paso
      const db = await getDb();

      try {
        // 1. Configurar contexto
        console.log('🔍 Debug: Configurando contexto login_context...');
        await db.query('SELECT set_config($1, $2, false)', ['app.current_user_role', 'login_context']);

        // 2. Verificar contexto
        const contextResult = await db.query('SELECT current_setting($1, true) as context', ['app.current_user_role']);
        console.log('🔍 Debug: Contexto configurado:', contextResult.rows[0]?.context);

        // 3. Intentar búsqueda
        console.log('🔍 Debug: Ejecutando query...');
        const query = `
          SELECT u.id, u.email, u.password_hash, u.nombre, u.apellidos, u.telefono,
                 u.rol, u.organizacion_id, u.profesional_id, u.activo, u.email_verificado,
                 u.ultimo_login, u.intentos_fallidos, u.bloqueado_hasta
          FROM usuarios u
          WHERE u.email = $1 AND u.activo = TRUE
        `;

        const result = await db.query(query, [email]);
        console.log('🔍 Debug: Resultado rows:', result.rows.length);

        const usuario = result.rows[0] || null;

        if (usuario) {
          // Ocultar password_hash en respuesta
          const { password_hash, ...usuarioSinPassword } = usuario;
          ResponseHelper.success(res, {
            usuarioEncontrado: true,
            usuario: usuarioSinPassword,
            hasPasswordHash: !!password_hash,
            contexto: contextResult.rows[0]?.context
          }, 'Usuario encontrado');
        } else {
          ResponseHelper.success(res, {
            usuarioEncontrado: false,
            contexto: contextResult.rows[0]?.context
          }, 'Usuario no encontrado');
        }
      } finally {
        db.release();
      }
    } catch (error) {
      console.error('🚨 Debug error:', error);
      ResponseHelper.error(res, 'Error en debug de usuario', 500, {
        error: error.message,
        stack: error.stack
      });
    }
  }
);

module.exports = router;