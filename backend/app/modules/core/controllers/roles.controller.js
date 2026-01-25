/**
 * @fileoverview Controller de Roles
 * @description Endpoints CRUD para gestión de roles dinámicos
 * @version 1.0.0
 * @date Enero 2026
 */

const RolesModel = require('../models/roles.model');
const { ResponseHelper, ParseHelper, RolHelper } = require('../../../utils/helpers');
const { invalidarCacheUsuario } = require('../../../middleware/permisos');
const logger = require('../../../utils/logger');

/**
 * Listar roles de la organización
 * GET /api/v1/roles
 */
const listar = async (req, res) => {
  const organizacion_id = req.user.organizacion_id;

  const filtros = {
    organizacion_id,
    incluir_sistema: ParseHelper.parseBoolean(req.query.incluir_sistema),
    activo: ParseHelper.parseBoolean(req.query.activo),
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 50,
    order_by: req.query.order_by || 'nivel_jerarquia',
    order_direction: req.query.order_direction || 'DESC'
  };

  const resultado = await RolesModel.listar(filtros);

  return ResponseHelper.paginated(res, resultado.items, resultado.paginacion, 'Roles listados');
};

/**
 * Obtener un rol por ID
 * GET /api/v1/roles/:id
 */
const obtenerPorId = async (req, res) => {
  const { id } = req.params;
  const organizacion_id = req.user.organizacion_id;

  const rol = await RolesModel.obtenerPorId(parseInt(id), organizacion_id);

  return ResponseHelper.success(res, rol, 'Rol obtenido');
};

/**
 * Crear un nuevo rol
 * POST /api/v1/roles
 */
const crear = async (req, res) => {
  const organizacion_id = req.user.organizacion_id;
  const creado_por = req.user.id;

  // Verificar que el usuario puede modificar permisos
  if (!RolHelper.puedeModificarPermisos(req.user)) {
    return ResponseHelper.error(res, 'No tienes permisos para crear roles', 403);
  }

  const rol = await RolesModel.crear(req.body, organizacion_id, creado_por);

  return ResponseHelper.success(res, rol, 'Rol creado exitosamente', { statusCode: 201 });
};

/**
 * Actualizar un rol
 * PUT /api/v1/roles/:id
 */
const actualizar = async (req, res) => {
  const { id } = req.params;
  const organizacion_id = req.user.organizacion_id;

  // Verificar que el usuario puede modificar permisos
  if (!RolHelper.puedeModificarPermisos(req.user)) {
    return ResponseHelper.error(res, 'No tienes permisos para modificar roles', 403);
  }

  const rol = await RolesModel.actualizar(parseInt(id), req.body, organizacion_id);

  // Invalidar cache de usuarios con este rol
  // (en producción se haría con Pub/Sub para invalidar en todas las instancias)
  RolHelper.invalidarTodoCache();

  return ResponseHelper.success(res, rol, 'Rol actualizado exitosamente');
};

/**
 * Eliminar un rol
 * DELETE /api/v1/roles/:id
 */
const eliminar = async (req, res) => {
  const { id } = req.params;
  const organizacion_id = req.user.organizacion_id;

  // Verificar que el usuario puede modificar permisos
  if (!RolHelper.puedeModificarPermisos(req.user)) {
    return ResponseHelper.error(res, 'No tienes permisos para eliminar roles', 403);
  }

  await RolesModel.eliminar(parseInt(id), organizacion_id);

  return ResponseHelper.success(res, null, 'Rol eliminado exitosamente');
};

/**
 * Copiar permisos de un rol a otro
 * POST /api/v1/roles/:id/copiar-permisos
 */
const copiarPermisos = async (req, res) => {
  const { id } = req.params;
  const { rol_origen_id } = req.body;
  const organizacion_id = req.user.organizacion_id;

  // Verificar que el usuario puede modificar permisos
  if (!RolHelper.puedeModificarPermisos(req.user)) {
    return ResponseHelper.error(res, 'No tienes permisos para modificar roles', 403);
  }

  const permisosCopidos = await RolesModel.copiarPermisos(
    parseInt(rol_origen_id),
    parseInt(id),
    organizacion_id
  );

  // Invalidar cache
  RolHelper.invalidarTodoCache();

  return ResponseHelper.success(res, {
    permisos_copiados: permisosCopidos
  }, 'Permisos copiados exitosamente');
};

/**
 * Obtener permisos de un rol
 * GET /api/v1/roles/:id/permisos
 */
const obtenerPermisos = async (req, res) => {
  const { id } = req.params;
  const organizacion_id = req.user.organizacion_id;

  const permisos = await RolesModel.obtenerPermisos(parseInt(id), organizacion_id);

  // Agrupar por módulo para facilitar UI
  const permisosPorModulo = permisos.reduce((acc, permiso) => {
    if (!acc[permiso.modulo]) {
      acc[permiso.modulo] = [];
    }
    acc[permiso.modulo].push(permiso);
    return acc;
  }, {});

  return ResponseHelper.success(res, {
    permisos,
    permisos_por_modulo: permisosPorModulo,
    total: permisos.length
  }, 'Permisos del rol obtenidos');
};

/**
 * Actualizar un permiso de un rol
 * PUT /api/v1/roles/:id/permisos/:permisoId
 */
const actualizarPermiso = async (req, res) => {
  const { id, permisoId } = req.params;
  const { valor } = req.body;
  const organizacion_id = req.user.organizacion_id;

  // Verificar que el usuario puede modificar permisos
  if (!RolHelper.puedeModificarPermisos(req.user)) {
    return ResponseHelper.error(res, 'No tienes permisos para modificar roles', 403);
  }

  const permiso = await RolesModel.actualizarPermiso(
    parseInt(id),
    parseInt(permisoId),
    valor,
    organizacion_id
  );

  // Invalidar cache de permisos
  RolHelper.invalidarTodoCache();

  return ResponseHelper.success(res, permiso, 'Permiso actualizado exitosamente');
};

/**
 * Actualizar múltiples permisos de un rol (batch)
 * PUT /api/v1/roles/:id/permisos
 */
const actualizarPermisosBatch = async (req, res) => {
  const { id } = req.params;
  const { permisos } = req.body;
  const organizacion_id = req.user.organizacion_id;

  // Verificar que el usuario puede modificar permisos
  if (!RolHelper.puedeModificarPermisos(req.user)) {
    return ResponseHelper.error(res, 'No tienes permisos para modificar roles', 403);
  }

  const resultados = [];
  for (const { permiso_id, valor } of permisos) {
    const resultado = await RolesModel.actualizarPermiso(
      parseInt(id),
      permiso_id,
      valor,
      organizacion_id
    );
    resultados.push(resultado);
  }

  // Invalidar cache
  RolHelper.invalidarTodoCache();

  logger.info('Permisos de rol actualizados en batch', {
    rol_id: id,
    cantidad: permisos.length,
    organizacion_id
  });

  return ResponseHelper.success(res, {
    actualizados: resultados.length
  }, 'Permisos actualizados exitosamente');
};

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  copiarPermisos,
  obtenerPermisos,
  actualizarPermiso,
  actualizarPermisosBatch
};
