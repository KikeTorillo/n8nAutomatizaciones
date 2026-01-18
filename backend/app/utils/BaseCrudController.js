/**
 * Factory de Controllers CRUD Base
 * Elimina ~1600 líneas de código duplicado en controllers
 *
 * @module utils/BaseCrudController
 *
 * @example
 * // Uso básico (controller simple ~15 líneas)
 * const { createCrudController } = require('../../utils/BaseCrudController');
 * const PuestoModel = require('../models/puesto.model');
 *
 * module.exports = createCrudController({
 *   Model: PuestoModel,
 *   resourceName: 'Puesto',
 *   resourceNamePlural: 'puestos',
 *   filterSchema: { activo: 'boolean', departamento_id: 'int' }
 * });
 *
 * @example
 * // Con hooks y lógica custom
 * module.exports = createCrudController({
 *   Model: ProductoModel,
 *   resourceName: 'Producto',
 *   beforeCreate: async (data, req) => {
 *     data.creado_por = req.user.id;
 *     return data;
 *   },
 *   afterCreate: async (producto, req) => {
 *     await auditoria.registrar('producto.crear', producto.id);
 *   }
 * });
 *
 * @example
 * // Con métodos de árbol (para categorías, departamentos)
 * const { createCrudController, withTreeMethods } = require('../../utils/BaseCrudController');
 *
 * const base = createCrudController({...});
 * module.exports = withTreeMethods(base, DepartamentoModel, 'Departamento');
 */

const asyncHandler = require('../middleware/asyncHandler');
const logger = require('./logger');
const { ParseHelper, ErrorHelper, ResponseHelper } = require('./helpers');

/**
 * Crea un controller CRUD base con operaciones estándar
 *
 * @param {Object} options - Configuración del controller
 * @param {Object} options.Model - Modelo con métodos crear, listar, buscarPorId, actualizar, eliminar
 * @param {string} options.resourceName - Nombre singular del recurso (ej: 'Puesto')
 * @param {string} [options.resourceNamePlural] - Nombre plural (default: resourceName + 's')
 * @param {Object} [options.filterSchema={}] - Schema de tipos para parseo de filtros
 * @param {boolean} [options.softDelete=true] - Si usa soft delete
 * @param {string[]} [options.allowedOrderFields] - Campos permitidos para ordenar
 * @param {string} [options.defaultOrderField='creado_en'] - Campo de orden por defecto
 *
 * Hooks (todas las funciones son async):
 * @param {Function} [options.beforeCreate] - (data, req) => data modificado
 * @param {Function} [options.afterCreate] - (recurso, req) => void
 * @param {Function} [options.beforeUpdate] - (data, recurso, req) => data modificado
 * @param {Function} [options.afterUpdate] - (recurso, req) => void
 * @param {Function} [options.beforeDelete] - (recurso, req) => void
 * @param {Function} [options.afterDelete] - (id, req) => void
 * @param {Function} [options.beforeList] - (filtros, req) => filtros modificados
 * @param {Function} [options.afterList] - (resultados, req) => resultados modificados
 *
 * @returns {Object} Controller con métodos crear, listar, obtenerPorId, actualizar, eliminar
 */
function createCrudController(options) {
  const {
    Model,
    resourceName,
    resourceNamePlural = `${resourceName}s`,
    filterSchema = {},
    softDelete = true,
    allowedOrderFields = ['creado_en', 'nombre', 'actualizado_en'],
    defaultOrderField = 'creado_en',
    // Hooks
    beforeCreate,
    afterCreate,
    beforeUpdate,
    afterUpdate,
    beforeDelete,
    afterDelete,
    beforeList,
    afterList
  } = options;

  // Validar que Model tenga los métodos requeridos
  const requiredMethods = ['crear', 'listar', 'buscarPorId', 'actualizar', 'eliminar'];
  for (const method of requiredMethods) {
    if (typeof Model[method] !== 'function') {
      throw new Error(`Model debe implementar método "${method}" para ${resourceName}Controller`);
    }
  }

  return {
    /**
     * POST / - Crear recurso
     */
    crear: asyncHandler(async (req, res) => {
      const organizacionId = req.tenant.organizacionId;
      let data = { ...req.body };

      // Hook beforeCreate
      if (beforeCreate) {
        data = await beforeCreate(data, req) || data;
      }

      const recurso = await Model.crear(organizacionId, data);

      // Hook afterCreate
      if (afterCreate) {
        await afterCreate(recurso, req);
      }

      logger.info(`${resourceName} creado: ${recurso.nombre || recurso.id}`, {
        organizacionId,
        [`${resourceName.toLowerCase()}Id`]: recurso.id,
        usuario: req.user.email
      });

      res.status(201).json({
        success: true,
        data: recurso
      });
    }),

    /**
     * GET / - Listar recursos con filtros y paginación
     */
    listar: asyncHandler(async (req, res) => {
      const organizacionId = req.tenant.organizacionId;

      // Parsear parámetros
      const { pagination, filters, ordering } = ParseHelper.parseListParams(
        req.query,
        filterSchema,
        { allowedOrderFields, defaultOrderField }
      );

      // Construir filtros para el modelo
      let filtros = {
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset,
        order_by: ordering.orderBy,
        order_direction: ordering.orderDirection
      };

      // Hook beforeList
      if (beforeList) {
        filtros = await beforeList(filtros, req) || filtros;
      }

      let resultado = await Model.listar(organizacionId, filtros);

      // Hook afterList
      if (afterList) {
        resultado = await afterList(resultado, req) || resultado;
      }

      // Normalizar respuesta (algunos modelos devuelven { data, total }, otros array)
      const isArrayResult = Array.isArray(resultado);
      const data = isArrayResult ? resultado : (resultado.data || resultado);
      const total = isArrayResult ? resultado.length : (resultado.total || data.length);

      res.json({
        success: true,
        data,
        meta: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          offset: pagination.offset,
          pages: Math.ceil(total / pagination.limit)
        }
      });
    }),

    /**
     * GET /:id - Obtener recurso por ID
     */
    obtenerPorId: asyncHandler(async (req, res) => {
      const organizacionId = req.tenant.organizacionId;
      const { id } = req.params;

      const recurso = await Model.buscarPorId(organizacionId, id);

      ErrorHelper.throwIfNotFound(recurso, resourceName);

      res.json({
        success: true,
        data: recurso
      });
    }),

    /**
     * PUT /:id - Actualizar recurso
     */
    actualizar: asyncHandler(async (req, res) => {
      const organizacionId = req.tenant.organizacionId;
      const { id } = req.params;
      let data = { ...req.body };

      // Verificar que existe antes de actualizar
      const existente = await Model.buscarPorId(organizacionId, id);
      ErrorHelper.throwIfNotFound(existente, resourceName);

      // Hook beforeUpdate
      if (beforeUpdate) {
        data = await beforeUpdate(data, existente, req) || data;
      }

      const recurso = await Model.actualizar(organizacionId, id, data);

      // Hook afterUpdate
      if (afterUpdate) {
        await afterUpdate(recurso, req);
      }

      logger.info(`${resourceName} actualizado: ${recurso.nombre || recurso.id}`, {
        organizacionId,
        [`${resourceName.toLowerCase()}Id`]: id,
        usuario: req.user.email
      });

      res.json({
        success: true,
        data: recurso
      });
    }),

    /**
     * DELETE /:id - Eliminar recurso
     */
    eliminar: asyncHandler(async (req, res) => {
      const organizacionId = req.tenant.organizacionId;
      const { id } = req.params;

      // Verificar que existe antes de eliminar
      const existente = await Model.buscarPorId(organizacionId, id);
      ErrorHelper.throwIfNotFound(existente, resourceName);

      // Hook beforeDelete
      if (beforeDelete) {
        await beforeDelete(existente, req);
      }

      const eliminado = await Model.eliminar(organizacionId, id);

      // Hook afterDelete
      if (afterDelete) {
        await afterDelete(id, req);
      }

      logger.info(`${resourceName} eliminado: ${id}`, {
        organizacionId,
        [`${resourceName.toLowerCase()}Id`]: id,
        usuario: req.user.email
      });

      res.json({
        success: true,
        message: `${resourceName} eliminado correctamente`
      });
    })
  };
}

/**
 * Extiende un controller con métodos para estructuras de árbol
 * Para categorías, departamentos, etc.
 *
 * @param {Object} controller - Controller base creado con createCrudController
 * @param {Object} Model - Modelo que implementa obtenerArbol
 * @param {string} resourceName - Nombre del recurso
 * @returns {Object} Controller extendido con obtenerArbol
 */
function withTreeMethods(controller, Model, resourceName) {
  if (typeof Model.obtenerArbol !== 'function') {
    throw new Error(`Model debe implementar "obtenerArbol" para withTreeMethods`);
  }

  return {
    ...controller,

    /**
     * GET /arbol - Obtener estructura jerárquica
     */
    obtenerArbol: asyncHandler(async (req, res) => {
      const organizacionId = req.tenant.organizacionId;
      const incluirInactivos = ParseHelper.parseBoolean(req.query.incluir_inactivos, false);

      const arbol = await Model.obtenerArbol(organizacionId, { incluirInactivos });

      res.json({
        success: true,
        data: arbol
      });
    })
  };
}

/**
 * Extiende un controller con métodos bulk (crear/eliminar múltiples)
 *
 * @param {Object} controller - Controller base
 * @param {Object} Model - Modelo que implementa crearBulk, eliminarBulk
 * @param {string} resourceName - Nombre del recurso
 * @returns {Object} Controller extendido
 */
function withBulkMethods(controller, Model, resourceName) {
  return {
    ...controller,

    /**
     * POST /bulk - Crear múltiples recursos
     */
    crearBulk: asyncHandler(async (req, res) => {
      const organizacionId = req.tenant.organizacionId;
      const { items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        ErrorHelper.throwValidation('Se requiere un array de items');
      }

      if (items.length > 100) {
        ErrorHelper.throwValidation('Máximo 100 items por operación bulk');
      }

      const resultados = await Model.crearBulk(organizacionId, items);

      logger.info(`${resourceName} bulk create: ${resultados.length} items`, {
        organizacionId,
        cantidad: resultados.length,
        usuario: req.user.email
      });

      res.status(201).json({
        success: true,
        data: resultados,
        meta: { total: resultados.length }
      });
    }),

    /**
     * DELETE /bulk - Eliminar múltiples recursos
     */
    eliminarBulk: asyncHandler(async (req, res) => {
      const organizacionId = req.tenant.organizacionId;
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        ErrorHelper.throwValidation('Se requiere un array de IDs');
      }

      if (ids.length > 100) {
        ErrorHelper.throwValidation('Máximo 100 items por operación bulk');
      }

      const eliminados = await Model.eliminarBulk(organizacionId, ids);

      logger.info(`${resourceName} bulk delete: ${eliminados} items`, {
        organizacionId,
        cantidad: eliminados,
        usuario: req.user.email
      });

      res.json({
        success: true,
        message: `${eliminados} ${resourceName.toLowerCase()}(s) eliminado(s)`,
        meta: { eliminados }
      });
    })
  };
}

/**
 * Extiende un controller con método de toggle activo/inactivo
 *
 * @param {Object} controller - Controller base
 * @param {Object} Model - Modelo que implementa toggleActivo
 * @param {string} resourceName - Nombre del recurso
 * @returns {Object} Controller extendido
 */
function withToggleActivo(controller, Model, resourceName) {
  return {
    ...controller,

    /**
     * PATCH /:id/toggle-activo - Alternar estado activo
     */
    toggleActivo: asyncHandler(async (req, res) => {
      const organizacionId = req.tenant.organizacionId;
      const { id } = req.params;

      const existente = await Model.buscarPorId(organizacionId, id);
      ErrorHelper.throwIfNotFound(existente, resourceName);

      const recurso = await Model.toggleActivo(organizacionId, id);

      logger.info(`${resourceName} toggle activo: ${id} -> ${recurso.activo}`, {
        organizacionId,
        [`${resourceName.toLowerCase()}Id`]: id,
        activo: recurso.activo,
        usuario: req.user.email
      });

      res.json({
        success: true,
        data: recurso
      });
    })
  };
}

module.exports = {
  createCrudController,
  withTreeMethods,
  withBulkMethods,
  withToggleActivo
};
