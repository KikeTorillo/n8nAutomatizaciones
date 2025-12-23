/**
 * @fileoverview Controller de Módulos
 * @description Endpoints para consultar y gestionar módulos activos por organización
 * @version 1.0.0
 */

const { ResponseHelper } = require('../../../utils/helpers');
const ModulesCache = require('../../../core/ModulesCache');
const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

/**
 * Definición de módulos disponibles con su metadata
 */
const MODULOS_DISPONIBLES = {
  core: {
    nombre: 'core',
    display_name: 'Core del Sistema',
    descripcion: 'Funcionalidades básicas: auth, usuarios, organizaciones',
    incluido_en_todos: true,
    puede_desactivar: false,
    icono: 'Settings',
    orden: 0
  },
  agendamiento: {
    nombre: 'agendamiento',
    display_name: 'Sistema de Agendamiento',
    descripcion: 'Profesionales, servicios, clientes, citas y horarios',
    incluido_en_todos: false,
    puede_desactivar: true,
    icono: 'Calendar',
    orden: 1,
    usado_por: ['comisiones', 'marketplace', 'chatbots']
  },
  inventario: {
    nombre: 'inventario',
    display_name: 'Gestión de Inventario',
    descripcion: 'Productos, proveedores, stock, alertas y análisis ABC',
    incluido_en_todos: false,
    puede_desactivar: true,
    icono: 'Package',
    orden: 10
  },
  pos: {
    nombre: 'pos',
    display_name: 'Punto de Venta',
    descripcion: 'Terminal de venta, caja y reportes',
    incluido_en_todos: false,
    puede_desactivar: true,
    dependencias: ['inventario'],
    icono: 'ShoppingCart',
    orden: 30,
    usado_por: ['comisiones']
  },
  marketplace: {
    nombre: 'marketplace',
    display_name: 'Marketplace Público',
    descripcion: 'Directorio SEO, perfiles públicos y agendamiento sin login',
    incluido_en_todos: false,
    puede_desactivar: true,
    dependencias: ['agendamiento'],
    icono: 'Globe',
    orden: 40
  },
  comisiones: {
    nombre: 'comisiones',
    display_name: 'Sistema de Comisiones',
    descripcion: 'Cálculo automático de comisiones por citas y ventas POS',
    incluido_en_todos: false,
    puede_desactivar: true,
    dependencias: [],
    dependencias_opcionales: ['agendamiento', 'pos'],
    icono: 'DollarSign',
    orden: 20
  },
  chatbots: {
    nombre: 'chatbots',
    display_name: 'Chatbots IA',
    descripcion: 'Asistente de agendamiento por Telegram y WhatsApp',
    incluido_en_todos: false,
    puede_desactivar: true,
    dependencias: ['agendamiento'],
    icono: 'Bot',
    orden: 50
  },
  'eventos-digitales': {
    nombre: 'eventos-digitales',
    display_name: 'Invitaciones Digitales',
    descripcion: 'Invitaciones para bodas, XV años, bautizos con RSVP y mesa de regalos',
    incluido_en_todos: false,
    puede_desactivar: true,
    dependencias: [],
    icono: 'PartyPopper',
    orden: 60
  },
  website: {
    nombre: 'website',
    display_name: 'Mi Sitio Web',
    descripcion: 'Página web pública con bloques arrastrables y SEO',
    incluido_en_todos: false,
    puede_desactivar: true,
    dependencias: [],
    icono: 'Globe',
    orden: 55
  },
  contabilidad: {
    nombre: 'contabilidad',
    display_name: 'Contabilidad',
    descripcion: 'Cuentas contables, asientos y reportes SAT',
    incluido_en_todos: false,
    puede_desactivar: true,
    dependencias: [],
    icono: 'Calculator',
    orden: 25
  },
  workflows: {
    nombre: 'workflows',
    display_name: 'Workflows de Aprobación',
    descripcion: 'Flujos de aprobación para órdenes de compra y otras entidades',
    incluido_en_todos: false,
    puede_desactivar: true,
    dependencias: ['inventario'],
    icono: 'ClipboardCheck',
    orden: 15
  }
};

class ModulosController {

  /**
   * GET /api/v1/modulos/disponibles
   * Lista todos los módulos disponibles en el sistema
   */
  static async listarDisponibles(req, res) {
    try {
      const modulos = Object.values(MODULOS_DISPONIBLES)
        .sort((a, b) => a.orden - b.orden)
        .map(modulo => ({
          ...modulo,
          dependencias: modulo.dependencias || []
        }));

      return ResponseHelper.success(res, {
        modulos,
        total: modulos.length
      }, 'Módulos disponibles obtenidos exitosamente');

    } catch (error) {
      logger.error('[ModulosController] Error listando módulos disponibles:', error);
      return ResponseHelper.error(res, 'Error al obtener módulos disponibles', 500);
    }
  }

  /**
   * GET /api/v1/modulos/activos
   * Obtiene los módulos activos de la organización del usuario autenticado
   * Incluye información del plan para modelo Free/Pro (Nov 2025)
   *
   * ACTUALIZADO Dic 2025:
   * modulos_acceso fue eliminado. Los permisos ahora se gestionan via
   * sistema normalizado (permisos_catalogo, permisos_rol, permisos_usuario_sucursal)
   * Por ahora, todos los usuarios tienen acceso a los módulos de su suscripción.
   * TODO: Implementar filtrado via tiene_permiso() SQL
   */
  static async obtenerActivos(req, res) {
    try {
      const organizacionId = req.user.organizacion_id;
      const userRole = req.user.rol;
      const userId = req.user.id;

      if (!organizacionId) {
        return ResponseHelper.error(res, 'Usuario sin organización asignada', 400);
      }

      // Obtener módulos activos de la suscripción (con cache)
      let modulosActivos = await ModulesCache.get(organizacionId);

      // ACTUALIZADO Dic 2025: modulos_acceso eliminado
      // Por ahora, empleados tienen acceso a todos los módulos de la suscripción
      // TODO: Implementar filtrado via permisos_usuario_sucursal
      if (userRole === 'empleado') {
        logger.info(`[ModulosController] Empleado ${userId}: acceso a módulos de suscripción (permisos granulares pendiente)`);
      }

      // Obtener información del plan y app_seleccionada (Modelo Free/Pro Nov 2025)
      let planInfo = null;
      try {
        const result = await RLSContextManager.withBypass(async (db) => {
          const query = `
            SELECT
              p.codigo_plan,
              p.nombre_plan,
              o.app_seleccionada
            FROM subscripciones s
            JOIN planes_subscripcion p ON s.plan_id = p.id
            JOIN organizaciones o ON s.organizacion_id = o.id
            WHERE s.organizacion_id = $1 AND s.activa = true
            LIMIT 1
          `;
          return await db.query(query, [organizacionId]);
        });

        if (result.rows.length > 0) {
          const row = result.rows[0];
          const tipo = row.codigo_plan; // codigo_plan es el tipo (trial, pro, custom)
          planInfo = {
            codigo: row.codigo_plan,
            nombre: row.nombre_plan,
            tipo: tipo,
            app_seleccionada: row.app_seleccionada,
            es_free: tipo === 'free',
            es_pro: tipo === 'pro',
            es_trial: tipo === 'trial',
            todas_las_apps: ['pro', 'trial', 'custom'].includes(tipo)
          };
        }
      } catch (planError) {
        logger.warn('[ModulosController] Error obteniendo info del plan:', planError.message);
      }

      // Enriquecer con metadata
      const modulosEnriquecidos = {};
      for (const [nombre, activo] of Object.entries(modulosActivos)) {
        if (MODULOS_DISPONIBLES[nombre]) {
          modulosEnriquecidos[nombre] = {
            activo,
            ...MODULOS_DISPONIBLES[nombre]
          };
        } else {
          modulosEnriquecidos[nombre] = { activo, nombre };
        }
      }

      // Agregar módulos que no están en modulosActivos pero existen
      for (const [nombre, metadata] of Object.entries(MODULOS_DISPONIBLES)) {
        if (!modulosEnriquecidos[nombre]) {
          modulosEnriquecidos[nombre] = {
            activo: false,
            ...metadata
          };
        }
      }

      return ResponseHelper.success(res, {
        modulos_activos: modulosActivos,
        modulos: modulosEnriquecidos,
        organizacion_id: organizacionId,
        plan: planInfo  // Modelo Free/Pro Nov 2025
      }, 'Módulos activos obtenidos exitosamente');

    } catch (error) {
      logger.error('[ModulosController] Error obteniendo módulos activos:', error);
      return ResponseHelper.error(res, 'Error al obtener módulos activos', 500);
    }
  }

  /**
   * PUT /api/v1/modulos/activar
   * Activa un módulo para la organización
   * Solo admin/propietario puede activar módulos
   */
  static async activarModulo(req, res) {
    try {
      const organizacionId = req.user.organizacion_id;
      const { modulo } = req.body;

      if (!organizacionId) {
        return ResponseHelper.error(res, 'Usuario sin organización asignada', 400);
      }

      // Validar que el módulo existe
      if (!MODULOS_DISPONIBLES[modulo]) {
        return ResponseHelper.error(res, `Módulo "${modulo}" no existe`, 400);
      }

      // Validar dependencias
      const dependencias = MODULOS_DISPONIBLES[modulo].dependencias || [];
      const modulosActuales = await ModulesCache.get(organizacionId);

      for (const dep of dependencias) {
        if (!modulosActuales[dep]) {
          return ResponseHelper.error(
            res,
            `El módulo "${modulo}" requiere que "${dep}" esté activo primero`,
            400
          );
        }
      }

      // Actualizar en BD
      await RLSContextManager.withBypass(async (db) => {
        const nuevoModulos = { ...modulosActuales, [modulo]: true };

        await db.query(`
          UPDATE subscripciones
          SET modulos_activos = $1::jsonb,
              actualizado_en = NOW(),
              actualizado_por = $3
          WHERE organizacion_id = $2 AND activa = true
        `, [JSON.stringify(nuevoModulos), organizacionId, req.user.id]);
      });

      // Invalidar cache
      await ModulesCache.invalidate(organizacionId);

      logger.info(`[ModulosController] Módulo ${modulo} activado para org ${organizacionId}`);

      return ResponseHelper.success(res, {
        modulo,
        activo: true,
        mensaje: `Módulo "${MODULOS_DISPONIBLES[modulo].display_name}" activado exitosamente`
      }, 'Módulo activado');

    } catch (error) {
      logger.error('[ModulosController] Error activando módulo:', error);

      // Manejar error del trigger de validación
      if (error.message.includes('requiere')) {
        return ResponseHelper.error(res, error.message, 400);
      }

      return ResponseHelper.error(res, 'Error al activar módulo', 500);
    }
  }

  /**
   * PUT /api/v1/modulos/desactivar
   * Desactiva un módulo para la organización
   * Solo admin/propietario puede desactivar módulos
   */
  static async desactivarModulo(req, res) {
    try {
      const organizacionId = req.user.organizacion_id;
      const { modulo } = req.body;

      if (!organizacionId) {
        return ResponseHelper.error(res, 'Usuario sin organización asignada', 400);
      }

      // Validar que el módulo existe
      if (!MODULOS_DISPONIBLES[modulo]) {
        return ResponseHelper.error(res, `Módulo "${modulo}" no existe`, 400);
      }

      // Validar que se puede desactivar
      if (!MODULOS_DISPONIBLES[modulo].puede_desactivar) {
        return ResponseHelper.error(
          res,
          `El módulo "${modulo}" no puede ser desactivado`,
          400
        );
      }

      // Verificar que ningún otro módulo dependa de este
      const modulosActuales = await ModulesCache.get(organizacionId);

      for (const [nombre, metadata] of Object.entries(MODULOS_DISPONIBLES)) {
        const dependencias = metadata.dependencias || [];
        if (dependencias.includes(modulo) && modulosActuales[nombre]) {
          return ResponseHelper.error(
            res,
            `No puedes desactivar "${modulo}" porque el módulo "${nombre}" depende de él. Desactiva "${nombre}" primero.`,
            400
          );
        }
      }

      // Actualizar en BD
      await RLSContextManager.withBypass(async (db) => {
        const nuevoModulos = { ...modulosActuales, [modulo]: false };

        await db.query(`
          UPDATE subscripciones
          SET modulos_activos = $1::jsonb,
              actualizado_en = NOW(),
              actualizado_por = $3
          WHERE organizacion_id = $2 AND activa = true
        `, [JSON.stringify(nuevoModulos), organizacionId, req.user.id]);
      });

      // Invalidar cache
      await ModulesCache.invalidate(organizacionId);

      logger.info(`[ModulosController] Módulo ${modulo} desactivado para org ${organizacionId}`);

      return ResponseHelper.success(res, {
        modulo,
        activo: false,
        mensaje: `Módulo "${MODULOS_DISPONIBLES[modulo].display_name}" desactivado exitosamente`
      }, 'Módulo desactivado');

    } catch (error) {
      logger.error('[ModulosController] Error desactivando módulo:', error);

      // Manejar error del trigger de validación
      if (error.message.includes('core') || error.message.includes('requiere')) {
        return ResponseHelper.error(res, error.message, 400);
      }

      return ResponseHelper.error(res, 'Error al desactivar módulo', 500);
    }
  }

  /**
   * GET /api/v1/modulos/verificar/:modulo
   * Verifica si un módulo específico está activo
   */
  static async verificarModulo(req, res) {
    try {
      const organizacionId = req.user.organizacion_id;
      const { modulo } = req.params;

      if (!organizacionId) {
        return ResponseHelper.error(res, 'Usuario sin organización asignada', 400);
      }

      const modulosActivos = await ModulesCache.get(organizacionId);
      const activo = modulosActivos[modulo] === true;

      return ResponseHelper.success(res, {
        modulo,
        activo,
        metadata: MODULOS_DISPONIBLES[modulo] || null
      }, activo ? 'Módulo activo' : 'Módulo inactivo');

    } catch (error) {
      logger.error('[ModulosController] Error verificando módulo:', error);
      return ResponseHelper.error(res, 'Error al verificar módulo', 500);
    }
  }
}

module.exports = ModulosController;
