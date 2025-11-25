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
    precio_mensual: 0,
    incluido_en_todos: true,
    puede_desactivar: false,
    icono: 'Settings',
    orden: 0
  },
  agendamiento: {
    nombre: 'agendamiento',
    display_name: 'Sistema de Agendamiento',
    descripcion: 'Profesionales, servicios, clientes, citas y horarios',
    precio_mensual: 0,
    incluido_en_todos: true,
    puede_desactivar: false,
    icono: 'Calendar',
    orden: 1
  },
  inventario: {
    nombre: 'inventario',
    display_name: 'Gestión de Inventario',
    descripcion: 'Productos, proveedores, stock, alertas y análisis ABC',
    precio_mensual: 199,
    incluido_en_todos: false,
    puede_desactivar: true,
    icono: 'Package',
    orden: 10
  },
  pos: {
    nombre: 'pos',
    display_name: 'Punto de Venta',
    descripcion: 'Terminal de venta, caja y reportes',
    precio_mensual: 149,
    incluido_en_todos: false,
    puede_desactivar: true,
    dependencias: ['inventario'],
    icono: 'ShoppingCart',
    orden: 30
  },
  marketplace: {
    nombre: 'marketplace',
    display_name: 'Marketplace Público',
    descripcion: 'Directorio SEO, perfiles públicos y agendamiento sin login',
    precio_mensual: 199,
    incluido_en_todos: false,
    puede_desactivar: true,
    dependencias: ['agendamiento'],
    icono: 'Globe',
    orden: 40
  },
  comisiones: {
    nombre: 'comisiones',
    display_name: 'Sistema de Comisiones',
    descripcion: 'Cálculo automático de comisiones por profesional',
    precio_mensual: 99,
    incluido_en_todos: false,
    puede_desactivar: true,
    dependencias: ['agendamiento'],
    icono: 'DollarSign',
    orden: 20
  },
  chatbots: {
    nombre: 'chatbots',
    display_name: 'Chatbots IA',
    descripcion: 'Asistente de agendamiento por Telegram y WhatsApp',
    precio_mensual: 199,
    incluido_en_todos: false,
    puede_desactivar: true,
    dependencias: ['agendamiento'],
    icono: 'Bot',
    orden: 50
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
   */
  static async obtenerActivos(req, res) {
    try {
      const organizacionId = req.user.organizacion_id;

      if (!organizacionId) {
        return ResponseHelper.error(res, 'Usuario sin organización asignada', 400);
      }

      // Obtener módulos activos (con cache)
      const modulosActivos = await ModulesCache.get(organizacionId);

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
        organizacion_id: organizacionId
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
