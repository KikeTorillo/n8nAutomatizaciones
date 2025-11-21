/**
 * ============================================================================
 * MIDDLEWARE DE VALIDACIÓN DE SUSCRIPCIONES Y LÍMITES DE PLANES
 * ============================================================================
 *
 * Este middleware gestiona:
 * 1. Validación de suscripciones activas (estado, expiración)
 * 2. Verificación de límites por tipo de plan (profesionales, clientes, etc.)
 * 3. Integración con función PL/pgSQL verificar_limite_plan()
 *
 * @module middleware/subscription
 */

const { ResponseHelper } = require('../utils/helpers');
const logger = require('../utils/logger');
const RLSContextManager = require('../utils/rlsContextManager');

class SubscriptionMiddleware {

  /**
   * Middleware para verificar que la suscripción esté activa y no expirada
   *
   * @description
   * Valida:
   * - Existe suscripción activa
   * - Plan trial no ha expirado (fecha_fin_trial)
   * - Estado no sea 'morosa', 'suspendida' o 'cancelada'
   *
   * @example
   * router.post('/',
   *   auth.authenticateToken,
   *   tenant.setTenantContext,
   *   subscription.checkActiveSubscription,  // <-- Aquí
   *   asyncHandler(Controller.crear)
   * );
   *
   * @param {Object} req - Request de Express
   * @param {Object} res - Response de Express
   * @param {Function} next - Next middleware
   */
  static async checkActiveSubscription(req, res, next) {
    const organizacionId = req.tenant?.organizacionId;

    logger.debug('🔍 checkActiveSubscription - organizacionId:', organizacionId);
    logger.debug('🔍 checkActiveSubscription - req.tenant:', req.tenant);

    if (!organizacionId) {
      logger.warn('Intento de verificar suscripción sin organizacionId en req.tenant');
      return ResponseHelper.error(res, 'Organización no encontrada', 400);
    }

    try {
      // ✅ USAR BYPASS RLS para leer subscripciones (JOIN multi-tabla)
      const result = await RLSContextManager.withBypass(async (db) => {
        const query = `
          SELECT
            s.id as subscripcion_id,
            s.estado,
            s.activa,
            s.fecha_inicio,
            s.fecha_fin_trial,
            s.fecha_proximo_pago,
            ps.codigo_plan,
            ps.nombre_plan,
            CASE
              WHEN s.fecha_fin_trial IS NOT NULL THEN
                EXTRACT(DAY FROM s.fecha_fin_trial - NOW())::INTEGER
              ELSE NULL
            END as dias_restantes
          FROM subscripciones s
          JOIN planes_subscripcion ps ON s.plan_id = ps.id
          WHERE s.organizacion_id = $1 AND s.activa = true
        `;

        logger.debug('🔍 Ejecutando query de suscripción para org:', organizacionId);
        const queryResult = await db.query(query, [organizacionId]);
        logger.debug('🔍 Resultado query suscripción:', queryResult.rows);
        return queryResult;
      });

      if (result.rows.length === 0) {
        logger.warn(`Organización ${organizacionId} sin suscripción activa`);
        return ResponseHelper.error(
          res,
          'No tiene una suscripción activa. Por favor, contacte a soporte.',
          403
        );
      }

      const subscription = result.rows[0];

      // Verificar si el plan trial expiró
      if (subscription.estado === 'trial' && subscription.fecha_fin_trial) {
        const hoy = new Date();
        const fechaFin = new Date(subscription.fecha_fin_trial);

        if (hoy > fechaFin) {
          logger.info(`Plan trial expirado para organización ${organizacionId}`);
          return ResponseHelper.error(
            res,
            'Su periodo de prueba ha expirado. Por favor, actualice su plan para continuar.',
            403,
            {
              codigo_error: 'TRIAL_EXPIRED',
              dias_expirados: Math.abs(subscription.dias_restantes),
              plan_actual: subscription.codigo_plan,
              accion_requerida: 'upgrade_plan'
            }
          );
        }

        // Advertencia si quedan menos de 7 días
        if (subscription.dias_restantes <= 7 && subscription.dias_restantes > 0) {
          logger.info(`Trial expirando pronto para org ${organizacionId}: ${subscription.dias_restantes} días`);
          // No bloquear, solo agregar info al request
          req.subscription_warning = {
            tipo: 'trial_expiring_soon',
            dias_restantes: subscription.dias_restantes,
            mensaje: `Su periodo de prueba expira en ${subscription.dias_restantes} días`
          };
        }
      }

      // Verificar estado moroso
      if (subscription.estado === 'morosa') {
        logger.warn(`Organización ${organizacionId} en estado moroso`);
        return ResponseHelper.error(
          res,
          'Su suscripción está en estado moroso. Por favor, actualice su método de pago.',
          403,
          {
            codigo_error: 'SUBSCRIPTION_OVERDUE',
            fecha_proximo_pago: subscription.fecha_proximo_pago,
            accion_requerida: 'update_payment_method'
          }
        );
      }

      // Verificar suspensión
      if (subscription.estado === 'suspendida') {
        logger.warn(`Organización ${organizacionId} suspendida`);
        return ResponseHelper.error(
          res,
          'Su suscripción está suspendida. Por favor, contacte a soporte.',
          403,
          {
            codigo_error: 'SUBSCRIPTION_SUSPENDED',
            accion_requerida: 'contact_support'
          }
        );
      }

      // Verificar cancelación
      if (subscription.estado === 'cancelada') {
        logger.warn(`Organización ${organizacionId} cancelada`);
        return ResponseHelper.error(
          res,
          'Su suscripción ha sido cancelada. Por favor, reactive su cuenta.',
          403,
          {
            codigo_error: 'SUBSCRIPTION_CANCELLED',
            accion_requerida: 'reactivate_subscription'
          }
        );
      }

      // Agregar información de suscripción al request para uso posterior
      req.subscription = {
        id: subscription.subscripcion_id,
        codigo_plan: subscription.codigo_plan,
        nombre_plan: subscription.nombre_plan,
        estado: subscription.estado,
        dias_restantes: subscription.dias_restantes,
        fecha_fin_trial: subscription.fecha_fin_trial
      };

      next();

    } catch (error) {
      logger.error('❌ Error verificando suscripción activa:', error);
      logger.error('❌ Error stack:', error.stack);
      logger.error('❌ Error message:', error.message);
      return ResponseHelper.error(res, 'Error al verificar suscripción', 500);
    }
  }

  /**
   * Middleware factory para verificar límites por tipo de recurso
   *
   * @description
   * Llama a la función PL/pgSQL verificar_limite_plan() para validar
   * que no se exceda el límite del plan actual.
   *
   * Recursos soportados:
   * - profesionales
   * - clientes
   * - servicios
   * - usuarios
   * - citas_mes
   * - productos (nuevo)
   * - categorias_productos (nuevo)
   * - proveedores (nuevo)
   * - ventas_pos_mes (nuevo)
   *
   * @param {string} tipoRecurso - Tipo de recurso a validar
   * @returns {Function} Middleware de Express
   *
   * @example
   * router.post('/profesionales',
   *   subscription.checkResourceLimit('profesionales'),
   *   asyncHandler(Controller.crear)
   * );
   */
  static checkResourceLimit(tipoRecurso) {
    // Validar que el tipo de recurso sea válido
    const tiposValidos = [
      'profesionales',
      'clientes',
      'servicios',
      'usuarios',
      'citas_mes',
      'productos',
      'categorias_productos',
      'proveedores',
      'ventas_pos_mes'
    ];
    if (!tiposValidos.includes(tipoRecurso)) {
      throw new Error(`Tipo de recurso inválido: ${tipoRecurso}. Debe ser uno de: ${tiposValidos.join(', ')}`);
    }

    return async (req, res, next) => {
      const organizacionId = req.tenant?.organizacionId;

      if (!organizacionId) {
        logger.warn('Intento de verificar límite sin organizacionId en req.tenant');
        return ResponseHelper.error(res, 'Organización no encontrada', 400);
      }

      try {
        // ✅ USAR BYPASS RLS para llamar a función PL/pgSQL que lee subscripciones
        const verificarResult = await RLSContextManager.withBypass(async (db) => {
          const verificarQuery = `SELECT verificar_limite_plan($1, $2, 1) as puede_crear`;
          return await db.query(verificarQuery, [organizacionId, tipoRecurso]);
        });

        const puedeCrear = verificarResult.rows[0]?.puede_crear;

        if (!puedeCrear) {
          // ✅ USAR BYPASS RLS para obtener detalles del límite
          const detallesResult = await RLSContextManager.withBypass(async (db) => {
            const detallesQuery = `
              SELECT
                ps.codigo_plan,
                ps.nombre_plan,
                CASE $2
                  WHEN 'profesionales' THEN ps.limite_profesionales
                  WHEN 'clientes' THEN ps.limite_clientes
                  WHEN 'servicios' THEN ps.limite_servicios
                  WHEN 'usuarios' THEN ps.limite_usuarios
                  WHEN 'citas_mes' THEN ps.limite_citas_mes
                  WHEN 'productos' THEN ps.limite_productos
                  WHEN 'categorias_productos' THEN ps.limite_categorias_productos
                  WHEN 'proveedores' THEN ps.limite_proveedores
                  WHEN 'ventas_pos_mes' THEN ps.limite_ventas_pos_mes
                END as limite,
                CASE $2
                  WHEN 'profesionales' THEN m.uso_profesionales
                  WHEN 'clientes' THEN m.uso_clientes
                  WHEN 'servicios' THEN m.uso_servicios
                  WHEN 'usuarios' THEN m.uso_usuarios
                  WHEN 'citas_mes' THEN m.uso_citas_mes_actual
                  WHEN 'productos' THEN m.uso_productos
                  WHEN 'categorias_productos' THEN m.uso_categorias_productos
                  WHEN 'proveedores' THEN m.uso_proveedores
                  WHEN 'ventas_pos_mes' THEN m.uso_ventas_pos_mes_actual
                END as uso_actual
              FROM subscripciones s
              JOIN planes_subscripcion ps ON s.plan_id = ps.id
              LEFT JOIN metricas_uso_organizacion m ON m.organizacion_id = s.organizacion_id
              WHERE s.organizacion_id = $1 AND s.activa = true
            `;
            return await db.query(detallesQuery, [organizacionId, tipoRecurso]);
          });

          const detalles = detallesResult.rows[0];

          if (!detalles) {
            logger.error(`No se pudo obtener detalles del plan para org ${organizacionId}`);
            return ResponseHelper.error(
              res,
              `Ha alcanzado el límite de ${tipoRecurso} para su plan.`,
              403
            );
          }

          const limite = detalles.limite;
          const usoActual = detalles.uso_actual || 0;

          // Nombres amigables para el usuario
          const nombresRecursos = {
            'profesionales': 'profesionales',
            'clientes': 'clientes',
            'servicios': 'servicios',
            'usuarios': 'usuarios',
            'citas_mes': 'citas por mes',
            'productos': 'productos',
            'categorias_productos': 'categorías de productos',
            'proveedores': 'proveedores',
            'ventas_pos_mes': 'ventas POS por mes'
          };

          const nombreAmigable = nombresRecursos[tipoRecurso] || tipoRecurso;

          logger.info(`Límite alcanzado para org ${organizacionId}: ${tipoRecurso} (${usoActual}/${limite})`);

          return ResponseHelper.error(
            res,
            `Ha alcanzado el límite de ${nombreAmigable} (${limite}) para su plan ${detalles.nombre_plan}. Por favor, actualice su suscripción.`,
            403,
            {
              codigo_error: 'PLAN_LIMIT_REACHED',
              recurso: tipoRecurso,
              limite: limite,
              uso_actual: usoActual,
              plan_actual: detalles.codigo_plan,
              accion_requerida: 'upgrade_plan'
            }
          );
        }

        // Límite OK, continuar
        next();

      } catch (error) {
        logger.error(`Error verificando límite de ${tipoRecurso}:`, error);
        return ResponseHelper.error(res, 'Error al verificar límite del plan', 500);
      }
    };
  }

  /**
   * Middleware opcional para agregar warning headers si el límite está cerca
   *
   * @description
   * No bloquea la request, solo agrega headers informativos cuando
   * el uso está por encima del 80% del límite.
   *
   * @param {string} tipoRecurso - Tipo de recurso a validar
   * @returns {Function} Middleware de Express
   */
  static checkResourceWarning(tipoRecurso) {
    return async (req, res, next) => {
      const organizacionId = req.tenant?.organizacionId;

      if (!organizacionId) {
        return next();
      }

      try {
        // ✅ USAR BYPASS RLS para leer métricas de uso
        const result = await RLSContextManager.withBypass(async (db) => {
          const query = `
            SELECT
              CASE $2
                WHEN 'profesionales' THEN ps.limite_profesionales
                WHEN 'clientes' THEN ps.limite_clientes
                WHEN 'servicios' THEN ps.limite_servicios
                WHEN 'usuarios' THEN ps.limite_usuarios
                WHEN 'citas_mes' THEN ps.limite_citas_mes
                WHEN 'productos' THEN ps.limite_productos
                WHEN 'categorias_productos' THEN ps.limite_categorias_productos
                WHEN 'proveedores' THEN ps.limite_proveedores
                WHEN 'ventas_pos_mes' THEN ps.limite_ventas_pos_mes
              END as limite,
              CASE $2
                WHEN 'profesionales' THEN m.uso_profesionales
                WHEN 'clientes' THEN m.uso_clientes
                WHEN 'servicios' THEN m.uso_servicios
                WHEN 'usuarios' THEN m.uso_usuarios
                WHEN 'citas_mes' THEN m.uso_citas_mes_actual
                WHEN 'productos' THEN m.uso_productos
                WHEN 'categorias_productos' THEN m.uso_categorias_productos
                WHEN 'proveedores' THEN m.uso_proveedores
                WHEN 'ventas_pos_mes' THEN m.uso_ventas_pos_mes_actual
              END as uso_actual
            FROM subscripciones s
            JOIN planes_subscripcion ps ON s.plan_id = ps.id
            LEFT JOIN metricas_uso_organizacion m ON m.organizacion_id = s.organizacion_id
            WHERE s.organizacion_id = $1 AND s.activa = true
          `;
          return await db.query(query, [organizacionId, tipoRecurso]);
        });

        if (result.rows.length > 0) {
          const { limite, uso_actual } = result.rows[0];

          if (limite && uso_actual) {
            const porcentajeUso = (uso_actual / limite) * 100;

            // Si el uso está por encima del 80%, agregar warning
            if (porcentajeUso >= 80) {
              res.setHeader('X-Plan-Warning', `${tipoRecurso}: ${uso_actual}/${limite} (${porcentajeUso.toFixed(0)}%)`);
              res.setHeader('X-Plan-Upgrade-Suggested', 'true');
            }
          }
        }

        next();

      } catch (error) {
        // No fallar si hay error, solo loggear
        logger.error(`Error en checkResourceWarning para ${tipoRecurso}:`, error);
        next();
      }
    };
  }
}

module.exports = SubscriptionMiddleware;
