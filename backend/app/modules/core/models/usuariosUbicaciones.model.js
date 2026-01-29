/**
 * @fileoverview Model de Usuarios Ubicaciones
 * @description Gestión de asignación de ubicaciones de almacén a usuarios
 * @version 1.0.0
 * @date Enero 2026
 *
 * Relación N:M entre usuarios y ubicaciones_almacen
 * Cada asignación incluye permisos granulares: es_default, puede_recibir, puede_despachar
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const RLSHelper = require('../../../utils/rlsHelper');
const { ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class UsuariosUbicacionesModel {

  /**
   * Obtener ubicaciones asignadas a un usuario
   * @param {number} usuarioId - ID del usuario
   * @param {number} organizacionId - ID de la organización (para RLS)
   * @returns {Promise<Array>} Lista de ubicaciones con datos del almacén y sucursal
   */
  static async obtenerPorUsuario(usuarioId, organizacionId) {
    return await RLSContextManager.query(organizacionId, async (db) => {
      const query = `
        SELECT
          uu.id,
          uu.usuario_id,
          uu.ubicacion_id,
          uu.es_default,
          uu.puede_recibir,
          uu.puede_despachar,
          uu.activo,
          uu.creado_en,
          uu.actualizado_en,
          ua.codigo as ubicacion_codigo,
          ua.nombre as ubicacion_nombre,
          ua.tipo as ubicacion_tipo,
          ua.activo as ubicacion_activa,
          s.id as sucursal_id,
          s.nombre as sucursal_nombre,
          s.codigo as sucursal_codigo
        FROM usuarios_ubicaciones uu
        JOIN ubicaciones_almacen ua ON uu.ubicacion_id = ua.id
        JOIN sucursales s ON ua.sucursal_id = s.id
        WHERE uu.usuario_id = $1
          AND uu.activo = true
        ORDER BY uu.es_default DESC, s.nombre, ua.codigo
      `;

      const result = await db.query(query, [usuarioId]);
      return result.rows;
    });
  }

  /**
   * Asignar ubicación a usuario (UPSERT)
   * Si ya existe la asignación, actualiza los permisos
   * @param {number} usuarioId - ID del usuario
   * @param {Object} data - Datos de asignación
   * @param {number} data.ubicacion_id - ID de la ubicación
   * @param {boolean} [data.es_default=false] - Si es ubicación por defecto
   * @param {boolean} [data.puede_recibir=true] - Permiso para recibir
   * @param {boolean} [data.puede_despachar=true] - Permiso para despachar
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object>} Asignación creada/actualizada
   */
  static async asignar(usuarioId, data, organizacionId) {
    const {
      ubicacion_id,
      es_default = false,
      puede_recibir = true,
      puede_despachar = true
    } = data;

    return await RLSContextManager.transaction(organizacionId, async (db) => {
      // Verificar que la ubicación exista y pertenezca a una sucursal del usuario
      const ubicacionCheck = await db.query(`
        SELECT ua.id, ua.codigo, ua.nombre, s.id as sucursal_id, s.nombre as sucursal_nombre
        FROM ubicaciones_almacen ua
        JOIN sucursales s ON ua.sucursal_id = s.id
        WHERE ua.id = $1 AND ua.activo = true
      `, [ubicacion_id]);

      ErrorHelper.throwIfNotFound(ubicacionCheck.rows[0], 'Ubicación de almacén');

      // Verificar que el usuario tenga asignación a la sucursal de la ubicación
      const sucursalCheck = await db.query(`
        SELECT 1 FROM usuarios_sucursales
        WHERE usuario_id = $1 AND sucursal_id = $2 AND activo = true
      `, [usuarioId, ubicacionCheck.rows[0].sucursal_id]);

      if (sucursalCheck.rows.length === 0) {
        ErrorHelper.throwValidation(
          `El usuario no está asignado a la sucursal "${ubicacionCheck.rows[0].sucursal_nombre}". ` +
          `Primero debe asignar el usuario a la sucursal.`
        );
      }

      // Si es_default = true, quitar default de otras ubicaciones del usuario
      if (es_default) {
        await db.query(`
          UPDATE usuarios_ubicaciones
          SET es_default = false, actualizado_en = NOW()
          WHERE usuario_id = $1 AND es_default = true
        `, [usuarioId]);
      }

      // UPSERT: insertar o actualizar si ya existe
      const upsertQuery = `
        INSERT INTO usuarios_ubicaciones (
          organizacion_id, usuario_id, ubicacion_id, es_default, puede_recibir, puede_despachar, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (usuario_id, ubicacion_id)
        DO UPDATE SET
          es_default = EXCLUDED.es_default,
          puede_recibir = EXCLUDED.puede_recibir,
          puede_despachar = EXCLUDED.puede_despachar,
          activo = true,
          actualizado_en = NOW()
        RETURNING *
      `;

      const result = await db.query(upsertQuery, [
        organizacionId,
        usuarioId,
        ubicacion_id,
        es_default,
        puede_recibir,
        puede_despachar
      ]);

      logger.info('[UsuariosUbicaciones.asignar] Ubicación asignada', {
        usuario_id: usuarioId,
        ubicacion_id,
        es_default
      });

      // Retornar con datos completos de la ubicación
      return {
        ...result.rows[0],
        ubicacion_codigo: ubicacionCheck.rows[0].codigo,
        ubicacion_nombre: ubicacionCheck.rows[0].nombre,
        sucursal_id: ubicacionCheck.rows[0].sucursal_id,
        sucursal_nombre: ubicacionCheck.rows[0].sucursal_nombre
      };
    });
  }

  /**
   * Actualizar permisos de una asignación existente
   * @param {number} usuarioId - ID del usuario
   * @param {number} ubicacionId - ID de la ubicación
   * @param {Object} data - Datos a actualizar
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object>} Asignación actualizada
   */
  static async actualizar(usuarioId, ubicacionId, data, organizacionId) {
    return await RLSContextManager.transaction(organizacionId, async (db) => {
      // Si se está marcando como default, quitar default de otras
      if (data.es_default === true) {
        await db.query(`
          UPDATE usuarios_ubicaciones
          SET es_default = false, actualizado_en = NOW()
          WHERE usuario_id = $1 AND ubicacion_id != $2 AND es_default = true
        `, [usuarioId, ubicacionId]);
      }

      // Construir query dinámica de actualización
      const campos = [];
      const valores = [];
      let paramIndex = 1;

      if (data.es_default !== undefined) {
        campos.push(`es_default = $${paramIndex}`);
        valores.push(data.es_default);
        paramIndex++;
      }
      if (data.puede_recibir !== undefined) {
        campos.push(`puede_recibir = $${paramIndex}`);
        valores.push(data.puede_recibir);
        paramIndex++;
      }
      if (data.puede_despachar !== undefined) {
        campos.push(`puede_despachar = $${paramIndex}`);
        valores.push(data.puede_despachar);
        paramIndex++;
      }

      if (campos.length === 0) {
        ErrorHelper.throwValidation('No hay campos válidos para actualizar');
      }

      campos.push('actualizado_en = NOW()');

      const query = `
        UPDATE usuarios_ubicaciones
        SET ${campos.join(', ')}
        WHERE usuario_id = $${paramIndex} AND ubicacion_id = $${paramIndex + 1}
        RETURNING *
      `;

      valores.push(usuarioId, ubicacionId);

      const result = await db.query(query, valores);

      ErrorHelper.throwIfNotFound(result.rows[0], 'Asignación de ubicación');

      logger.info('[UsuariosUbicaciones.actualizar] Asignación actualizada', {
        usuario_id: usuarioId,
        ubicacion_id: ubicacionId,
        campos_actualizados: Object.keys(data)
      });

      return result.rows[0];
    });
  }

  /**
   * Desasignar ubicación de usuario (soft delete)
   * @param {number} usuarioId - ID del usuario
   * @param {number} ubicacionId - ID de la ubicación
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async desasignar(usuarioId, ubicacionId, organizacionId) {
    return await RLSContextManager.query(organizacionId, async (db) => {
      // Verificar que exista la asignación
      const existeQuery = `
        SELECT uu.id, uu.es_default, ua.codigo, ua.nombre
        FROM usuarios_ubicaciones uu
        JOIN ubicaciones_almacen ua ON uu.ubicacion_id = ua.id
        WHERE uu.usuario_id = $1 AND uu.ubicacion_id = $2 AND uu.activo = true
      `;
      const existe = await db.query(existeQuery, [usuarioId, ubicacionId]);

      ErrorHelper.throwIfNotFound(existe.rows[0], 'Asignación de ubicación');

      const asignacion = existe.rows[0];

      // Soft delete
      const deleteQuery = `
        UPDATE usuarios_ubicaciones
        SET activo = false, es_default = false, actualizado_en = NOW()
        WHERE usuario_id = $1 AND ubicacion_id = $2
      `;

      await db.query(deleteQuery, [usuarioId, ubicacionId]);

      logger.info('[UsuariosUbicaciones.desasignar] Ubicación desasignada', {
        usuario_id: usuarioId,
        ubicacion_id: ubicacionId,
        ubicacion_codigo: asignacion.codigo
      });

      return {
        desasignado: true,
        usuario_id: usuarioId,
        ubicacion_id: ubicacionId,
        ubicacion_codigo: asignacion.codigo,
        ubicacion_nombre: asignacion.nombre,
        era_default: asignacion.es_default
      };
    });
  }

  /**
   * Obtener ubicaciones disponibles para asignar a un usuario
   * Filtra por sucursales donde el usuario está asignado
   * @param {number} usuarioId - ID del usuario
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Array>} Lista de ubicaciones disponibles
   */
  static async obtenerDisponibles(usuarioId, organizacionId) {
    return await RLSContextManager.query(organizacionId, async (db) => {
      const query = `
        SELECT
          ua.id,
          ua.codigo,
          ua.nombre,
          ua.tipo,
          s.id as sucursal_id,
          s.nombre as sucursal_nombre,
          s.codigo as sucursal_codigo
        FROM ubicaciones_almacen ua
        JOIN sucursales s ON ua.sucursal_id = s.id
        JOIN usuarios_sucursales us ON us.sucursal_id = s.id
        LEFT JOIN usuarios_ubicaciones uu ON uu.ubicacion_id = ua.id
          AND uu.usuario_id = $1
          AND uu.activo = true
        WHERE us.usuario_id = $1
          AND us.activo = true
          AND ua.activo = true
          AND uu.id IS NULL
        ORDER BY s.nombre, ua.codigo
      `;

      const result = await db.query(query, [usuarioId]);
      return result.rows;
    });
  }

  /**
   * Verificar si un usuario tiene acceso a una ubicación específica
   * @param {number} usuarioId - ID del usuario
   * @param {number} ubicacionId - ID de la ubicación
   * @param {string} [permiso] - Permiso específico a verificar ('recibir' | 'despachar')
   * @returns {Promise<boolean>} Si tiene acceso
   */
  static async verificarAcceso(usuarioId, ubicacionId, permiso = null) {
    return await RLSContextManager.withBypass(async (db) => {
      let query = `
        SELECT puede_recibir, puede_despachar
        FROM usuarios_ubicaciones
        WHERE usuario_id = $1 AND ubicacion_id = $2 AND activo = true
      `;

      const result = await db.query(query, [usuarioId, ubicacionId]);

      if (result.rows.length === 0) return false;

      const asignacion = result.rows[0];

      if (!permiso) return true;
      if (permiso === 'recibir') return asignacion.puede_recibir;
      if (permiso === 'despachar') return asignacion.puede_despachar;

      return true;
    });
  }
}

module.exports = UsuariosUbicacionesModel;
