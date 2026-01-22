/**
 * @fileoverview Helper centralizado para gestión de roles
 * @description Proporciona métodos para verificar roles, niveles jerárquicos y bypass de permisos.
 *              Reemplaza las comparaciones hardcodeadas con ENUM en todo el codebase.
 * @version 1.0.0
 * @date Enero 2026
 *
 * MIGRACIÓN:
 * - Antes: req.user.rol === 'super_admin'
 * - Ahora: RolHelper.esSuperAdmin(req.user) o req.user.bypass_permisos
 *
 * - Antes: ['admin', 'propietario'].includes(req.user.rol)
 * - Ahora: RolHelper.tieneBypassPermisos(req.user) o req.user.bypass_permisos
 */

const { getDb } = require('../../config/database');
const logger = require('../logger');

/**
 * Códigos de roles de sistema (constantes)
 */
const ROLES_SISTEMA = {
  SUPER_ADMIN: 'super_admin',
  BOT: 'bot'
};

/**
 * Códigos de roles default de organización
 */
const ROLES_DEFAULT = {
  ADMIN: 'admin',
  PROPIETARIO: 'propietario',
  EMPLEADO: 'empleado',
  CLIENTE: 'cliente'
};

/**
 * Niveles jerárquicos de referencia
 */
const NIVELES = {
  SUPER_ADMIN: 100,
  ADMIN: 90,
  PROPIETARIO: 80,
  EMPLEADO_SENIOR: 50,
  EMPLEADO: 10,
  CLIENTE: 5,
  BOT: 1
};

/**
 * Cache en memoria para información de roles
 * TTL: 5 minutos
 */
const roleCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Limpia el cache de un usuario específico
 * @param {number} userId - ID del usuario
 */
function invalidarCacheUsuario(userId) {
  roleCache.delete(`user:${userId}`);
}

/**
 * Limpia todo el cache de roles
 */
function invalidarTodoCache() {
  roleCache.clear();
}

/**
 * Obtiene información del rol de un usuario (con cache)
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object|null>} Información del rol
 */
async function obtenerInfoRol(userId) {
  const cacheKey = `user:${userId}`;
  const cached = roleCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const db = await getDb();
  try {
    const result = await db.query(`
      SELECT * FROM obtener_info_rol_usuario($1)
    `, [userId]);

    const rolInfo = result.rows[0] || null;

    roleCache.set(cacheKey, {
      data: rolInfo,
      timestamp: Date.now()
    });

    return rolInfo;
  } catch (error) {
    logger.error('Error obteniendo info de rol', { userId, error: error.message });
    return null;
  } finally {
    db.release();
  }
}

/**
 * Verifica si el usuario es super_admin
 * @param {Object} user - Objeto user de req.user
 * @returns {boolean}
 */
function esSuperAdmin(user) {
  if (!user) return false;

  // Primero verificar por rol_codigo (nuevo sistema)
  if (user.rol_codigo === ROLES_SISTEMA.SUPER_ADMIN) return true;

  // Fallback a rol ENUM (legacy)
  if (user.rol === ROLES_SISTEMA.SUPER_ADMIN) return true;

  // Verificar por nivel jerárquico
  if (user.nivel_jerarquia >= NIVELES.SUPER_ADMIN) return true;

  return false;
}

/**
 * Verifica si el usuario es un bot de sistema
 * @param {Object} user - Objeto user de req.user
 * @returns {boolean}
 */
function esBot(user) {
  if (!user) return false;
  return user.rol_codigo === ROLES_SISTEMA.BOT || user.rol === ROLES_SISTEMA.BOT;
}

/**
 * Verifica si el usuario es un rol de sistema (super_admin o bot)
 * @param {Object} user - Objeto user de req.user
 * @returns {boolean}
 */
function esRolSistema(user) {
  if (!user) return false;
  return user.es_rol_sistema === true || esSuperAdmin(user) || esBot(user);
}

/**
 * Verifica si el usuario tiene bypass de permisos (admin/propietario)
 * @param {Object} user - Objeto user de req.user
 * @returns {boolean}
 */
function tieneBypassPermisos(user) {
  if (!user) return false;

  // Verificar propiedad directa (nuevo sistema)
  if (user.bypass_permisos === true) return true;

  // Fallback: verificar por nivel jerárquico (admin/propietario = nivel >= 80)
  if (user.nivel_jerarquia >= NIVELES.PROPIETARIO) return true;

  // Fallback legacy: verificar por rol ENUM
  const rolesConBypass = [
    ROLES_SISTEMA.SUPER_ADMIN,
    ROLES_DEFAULT.ADMIN,
    ROLES_DEFAULT.PROPIETARIO
  ];
  if (rolesConBypass.includes(user.rol)) return true;

  return false;
}

/**
 * Verifica si el usuario tiene rol administrativo (nivel >= 80)
 * @param {Object} user - Objeto user de req.user
 * @returns {boolean}
 */
function esRolAdministrativo(user) {
  if (!user) return false;

  // Verificar por nivel jerárquico
  if (user.nivel_jerarquia >= NIVELES.PROPIETARIO) return true;

  // Fallback legacy
  const rolesAdmin = [
    ROLES_SISTEMA.SUPER_ADMIN,
    ROLES_DEFAULT.ADMIN,
    ROLES_DEFAULT.PROPIETARIO
  ];
  return rolesAdmin.includes(user.rol) || rolesAdmin.includes(user.rol_codigo);
}

/**
 * Verifica si el usuario puede crear otros usuarios
 * @param {Object} user - Objeto user de req.user
 * @returns {boolean}
 */
function puedeCrearUsuarios(user) {
  if (!user) return false;

  // Verificar propiedad directa (nuevo sistema)
  if (user.puede_crear_usuarios === true) return true;

  // Fallback: roles administrativos pueden crear usuarios
  return esRolAdministrativo(user);
}

/**
 * Verifica si el usuario puede modificar permisos
 * @param {Object} user - Objeto user de req.user
 * @returns {boolean}
 */
function puedeModificarPermisos(user) {
  if (!user) return false;

  // Verificar propiedad directa (nuevo sistema)
  if (user.puede_modificar_permisos === true) return true;

  // Fallback: roles administrativos pueden modificar permisos
  return esRolAdministrativo(user);
}

/**
 * Verifica si un usuario puede gestionar a otro (basado en jerarquía)
 * @param {Object} gestor - Usuario que intenta gestionar
 * @param {Object} objetivo - Usuario objetivo
 * @returns {boolean}
 */
function puedeGestionarUsuario(gestor, objetivo) {
  if (!gestor || !objetivo) return false;

  const nivelGestor = gestor.nivel_jerarquia || getNivelPorRol(gestor.rol || gestor.rol_codigo);
  const nivelObjetivo = objetivo.nivel_jerarquia || getNivelPorRol(objetivo.rol || objetivo.rol_codigo);

  // Gestor debe tener nivel mayor que objetivo
  return nivelGestor > nivelObjetivo;
}

/**
 * Obtiene el nivel jerárquico por código de rol (fallback para sistema legacy)
 * @param {string} rolCodigo - Código del rol
 * @returns {number}
 */
function getNivelPorRol(rolCodigo) {
  const nivelesPorRol = {
    [ROLES_SISTEMA.SUPER_ADMIN]: NIVELES.SUPER_ADMIN,
    [ROLES_DEFAULT.ADMIN]: NIVELES.ADMIN,
    [ROLES_DEFAULT.PROPIETARIO]: NIVELES.PROPIETARIO,
    [ROLES_DEFAULT.EMPLEADO]: NIVELES.EMPLEADO,
    [ROLES_DEFAULT.CLIENTE]: NIVELES.CLIENTE,
    [ROLES_SISTEMA.BOT]: NIVELES.BOT
  };

  return nivelesPorRol[rolCodigo] || NIVELES.EMPLEADO;
}

/**
 * Obtiene el código del rol de un usuario
 * @param {Object} user - Objeto user de req.user
 * @returns {string|null}
 */
function getCodigoRol(user) {
  if (!user) return null;
  return user.rol_codigo || user.rol || null;
}

/**
 * Verifica si el usuario tiene un rol específico
 * @param {Object} user - Objeto user de req.user
 * @param {string|string[]} roles - Código(s) del rol a verificar
 * @returns {boolean}
 */
function tieneRol(user, roles) {
  if (!user) return false;

  const rolesArray = Array.isArray(roles) ? roles : [roles];
  const userRol = getCodigoRol(user);

  return rolesArray.includes(userRol);
}

/**
 * Verifica si el usuario tiene al menos cierto nivel jerárquico
 * @param {Object} user - Objeto user de req.user
 * @param {number} nivelMinimo - Nivel mínimo requerido
 * @returns {boolean}
 */
function tieneNivelMinimo(user, nivelMinimo) {
  if (!user) return false;

  const nivelUsuario = user.nivel_jerarquia || getNivelPorRol(getCodigoRol(user));
  return nivelUsuario >= nivelMinimo;
}

/**
 * Enriquece el objeto user con información del rol
 * Para usar en middleware de auth
 * @param {Object} user - Objeto user básico
 * @returns {Promise<Object>} User enriquecido con info de rol
 */
async function enriquecerConInfoRol(user) {
  if (!user?.id) return user;

  const rolInfo = await obtenerInfoRol(user.id);

  if (!rolInfo) {
    // Fallback: usar información del rol ENUM si existe
    return {
      ...user,
      rol_codigo: user.rol,
      nivel_jerarquia: getNivelPorRol(user.rol),
      bypass_permisos: tieneBypassPermisos(user),
      es_rol_sistema: user.rol === ROLES_SISTEMA.SUPER_ADMIN || user.rol === ROLES_SISTEMA.BOT,
      puede_crear_usuarios: esRolAdministrativo(user),
      puede_modificar_permisos: esRolAdministrativo(user)
    };
  }

  return {
    ...user,
    rol_id: rolInfo.rol_id,
    rol_codigo: rolInfo.rol_codigo,
    rol_nombre: rolInfo.rol_nombre,
    nivel_jerarquia: rolInfo.nivel_jerarquia,
    bypass_permisos: rolInfo.bypass_permisos,
    es_rol_sistema: rolInfo.es_rol_sistema,
    puede_crear_usuarios: rolInfo.puede_crear_usuarios,
    puede_modificar_permisos: rolInfo.puede_modificar_permisos,
    rol_color: rolInfo.color,
    rol_icono: rolInfo.icono
  };
}

/**
 * Lista de roles que requieren organización (no son de sistema)
 * @param {string} rolCodigo
 * @returns {boolean}
 */
function requiereOrganizacion(rolCodigo) {
  return !Object.values(ROLES_SISTEMA).includes(rolCodigo);
}

module.exports = {
  // Constantes
  ROLES_SISTEMA,
  ROLES_DEFAULT,
  NIVELES,

  // Verificaciones principales
  esSuperAdmin,
  esBot,
  esRolSistema,
  tieneBypassPermisos,
  esRolAdministrativo,

  // Verificaciones de capacidades
  puedeCrearUsuarios,
  puedeModificarPermisos,
  puedeGestionarUsuario,

  // Utilidades
  getCodigoRol,
  getNivelPorRol,
  tieneRol,
  tieneNivelMinimo,
  requiereOrganizacion,

  // Enriquecimiento
  obtenerInfoRol,
  enriquecerConInfoRol,

  // Cache
  invalidarCacheUsuario,
  invalidarTodoCache
};
