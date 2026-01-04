/**
 * @fileoverview Modelo de Ubicaciones de Trabajo
 * @description CRUD para catálogo de ubicaciones (trabajo híbrido)
 * @version 1.0.0
 * @date Enero 2026
 *
 * GAP-003 vs Odoo 19: Soporte para trabajo híbrido
 * Permite asignar ubicación diferente por día de la semana a empleados
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

class UbicacionTrabajoModel {
  /**
   * Listar ubicaciones de trabajo de la organización
   * @param {number} orgId - ID de la organización
   * @param {Object} filtros - { activas, tipo, sucursal_id }
   * @returns {Promise<Array>} Lista de ubicaciones
   */
  static async listar(orgId, filtros = {}) {
    return await RLSContextManager.query(orgId, async (db) => {
      try {
        let whereClause = 'WHERE organizacion_id = $1';
        const params = [orgId];
        let paramIndex = 2;

        if (filtros.activas !== false) {
          whereClause += ' AND activo = true';
        }

        if (filtros.es_remoto !== undefined) {
          whereClause += ` AND es_remoto = $${paramIndex}`;
          params.push(filtros.es_remoto);
          paramIndex++;
        }

        if (filtros.es_oficina_principal !== undefined) {
          whereClause += ` AND es_oficina_principal = $${paramIndex}`;
          params.push(filtros.es_oficina_principal);
          paramIndex++;
        }

        if (filtros.sucursal_id) {
          whereClause += ` AND sucursal_id = $${paramIndex}`;
          params.push(filtros.sucursal_id);
          paramIndex++;
        }

        const query = `
          SELECT
            u.id, u.organizacion_id, u.codigo, u.nombre, u.descripcion,
            u.direccion, u.ciudad, u.estado, u.codigo_postal, u.pais,
            u.latitud, u.longitud,
            u.es_remoto, u.es_cliente, u.es_oficina_principal, u.es_sucursal,
            u.sucursal_id,
            u.telefono, u.email, u.responsable,
            u.horario_apertura, u.horario_cierre, u.dias_operacion,
            u.color, u.icono, u.orden, u.activo,
            u.metadata, u.creado_en, u.actualizado_en,
            s.nombre as sucursal_nombre
          FROM ubicaciones_trabajo u
          LEFT JOIN sucursales s ON u.sucursal_id = s.id
          ${whereClause}
          ORDER BY u.orden, u.nombre
        `;

        const result = await db.query(query, params);
        return result.rows;
      } catch (error) {
        logger.error('[UbicacionTrabajoModel.listar] Error:', { error: error.message, orgId });
        throw error;
      }
    });
  }

  /**
   * Obtener ubicación por ID
   * @param {number} orgId
   * @param {number} ubicacionId
   * @returns {Promise<Object>}
   */
  static async obtenerPorId(orgId, ubicacionId) {
    return await RLSContextManager.query(orgId, async (db) => {
      const query = `
        SELECT u.*, s.nombre as sucursal_nombre
        FROM ubicaciones_trabajo u
        LEFT JOIN sucursales s ON u.sucursal_id = s.id
        WHERE u.id = $1 AND u.organizacion_id = $2
      `;

      const result = await db.query(query, [ubicacionId, orgId]);
      return result.rows[0] || null;
    });
  }

  /**
   * Crear ubicación de trabajo
   * @param {number} orgId
   * @param {Object} data
   * @param {number} usuarioId
   * @returns {Promise<Object>}
   */
  static async crear(orgId, data, usuarioId = null) {
    return await RLSContextManager.query(orgId, async (db) => {
      try {
        // Validar que el código no exista si se proporciona
        if (data.codigo) {
          const existeCodigo = await db.query(
            'SELECT id FROM ubicaciones_trabajo WHERE LOWER(codigo) = LOWER($1) AND organizacion_id = $2',
            [data.codigo, orgId]
          );

          if (existeCodigo.rows.length > 0) {
            throw new Error(`El código "${data.codigo}" ya existe`);
          }
        }

        // Validar que el nombre no exista
        const existeNombre = await db.query(
          'SELECT id FROM ubicaciones_trabajo WHERE LOWER(nombre) = LOWER($1) AND organizacion_id = $2',
          [data.nombre, orgId]
        );

        if (existeNombre.rows.length > 0) {
          throw new Error(`El nombre "${data.nombre}" ya existe`);
        }

        const query = `
          INSERT INTO ubicaciones_trabajo (
            organizacion_id, codigo, nombre, descripcion,
            direccion, ciudad, estado, codigo_postal, pais,
            latitud, longitud,
            es_remoto, es_cliente, es_oficina_principal, es_sucursal,
            sucursal_id,
            telefono, email, responsable,
            horario_apertura, horario_cierre, dias_operacion,
            color, icono, orden, metadata, creado_por
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8, $9,
            $10, $11,
            $12, $13, $14, $15,
            $16,
            $17, $18, $19,
            $20, $21, $22,
            $23, $24, $25, $26, $27
          )
          RETURNING *
        `;

        const values = [
          orgId,
          data.codigo || null,
          data.nombre,
          data.descripcion || null,
          data.direccion || null,
          data.ciudad || null,
          data.estado || null,
          data.codigo_postal || null,
          data.pais || 'México',
          data.latitud || null,
          data.longitud || null,
          data.es_remoto || false,
          data.es_cliente || false,
          data.es_oficina_principal || false,
          data.es_sucursal || false,
          data.sucursal_id || null,
          data.telefono || null,
          data.email || null,
          data.responsable || null,
          data.horario_apertura || null,
          data.horario_cierre || null,
          data.dias_operacion || null,
          data.color || '#753572',
          data.icono || 'building-2',
          data.orden || 0,
          data.metadata || {},
          usuarioId
        ];

        const result = await db.query(query, values);
        return result.rows[0];
      } catch (error) {
        logger.error('[UbicacionTrabajoModel.crear] Error:', { error: error.message, orgId });
        throw error;
      }
    });
  }

  /**
   * Actualizar ubicación de trabajo
   * @param {number} orgId
   * @param {number} ubicacionId
   * @param {Object} data
   * @param {number} usuarioId
   * @returns {Promise<Object>}
   */
  static async actualizar(orgId, ubicacionId, data, usuarioId = null) {
    return await RLSContextManager.transaction(orgId, async (db) => {
      // Verificar que existe
      const ubicacionExistente = await db.query(
        'SELECT id FROM ubicaciones_trabajo WHERE id = $1 AND organizacion_id = $2',
        [ubicacionId, orgId]
      );

      if (ubicacionExistente.rows.length === 0) {
        throw new Error('Ubicación de trabajo no encontrada');
      }

      // Validar nombre único si se actualiza
      if (data.nombre) {
        const existeNombre = await db.query(
          'SELECT id FROM ubicaciones_trabajo WHERE LOWER(nombre) = LOWER($1) AND organizacion_id = $2 AND id != $3',
          [data.nombre, orgId, ubicacionId]
        );

        if (existeNombre.rows.length > 0) {
          throw new Error(`El nombre "${data.nombre}" ya existe`);
        }
      }

      const camposActualizar = [];
      const valores = [ubicacionId, orgId];
      let paramCounter = 3;

      const camposPermitidos = [
        'codigo', 'nombre', 'descripcion',
        'direccion', 'ciudad', 'estado', 'codigo_postal', 'pais',
        'latitud', 'longitud',
        'es_remoto', 'es_cliente', 'es_oficina_principal', 'es_sucursal',
        'sucursal_id',
        'telefono', 'email', 'responsable',
        'horario_apertura', 'horario_cierre', 'dias_operacion',
        'color', 'icono', 'orden', 'metadata', 'activo'
      ];

      camposPermitidos.forEach(campo => {
        if (data.hasOwnProperty(campo)) {
          camposActualizar.push(`${campo} = $${paramCounter}`);
          valores.push(data[campo]);
          paramCounter++;
        }
      });

      if (usuarioId) {
        camposActualizar.push(`actualizado_por = $${paramCounter}`);
        valores.push(usuarioId);
      }

      if (camposActualizar.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      const query = `
        UPDATE ubicaciones_trabajo
        SET ${camposActualizar.join(', ')}, actualizado_en = NOW()
        WHERE id = $1 AND organizacion_id = $2
        RETURNING *
      `;

      const result = await db.query(query, valores);
      return result.rows[0];
    });
  }

  /**
   * Eliminar (soft delete) ubicación de trabajo
   * @param {number} orgId
   * @param {number} ubicacionId
   * @returns {Promise<Object>}
   */
  static async eliminar(orgId, ubicacionId) {
    return await RLSContextManager.transaction(orgId, async (db) => {
      // Verificar que existe
      const ubicacion = await db.query(
        'SELECT id, nombre FROM ubicaciones_trabajo WHERE id = $1 AND organizacion_id = $2',
        [ubicacionId, orgId]
      );

      if (ubicacion.rows.length === 0) {
        throw new Error('Ubicación de trabajo no encontrada');
      }

      // Verificar que no esté en uso (revisar los 7 campos de día)
      const enUso = await db.query(`
        SELECT COUNT(*) as total FROM profesionales
        WHERE (
          ubicacion_lunes_id = $1 OR
          ubicacion_martes_id = $1 OR
          ubicacion_miercoles_id = $1 OR
          ubicacion_jueves_id = $1 OR
          ubicacion_viernes_id = $1 OR
          ubicacion_sabado_id = $1 OR
          ubicacion_domingo_id = $1
        ) AND eliminado_en IS NULL
      `, [ubicacionId]);

      if (parseInt(enUso.rows[0].total) > 0) {
        throw new Error(`No se puede eliminar. Hay ${enUso.rows[0].total} profesionales usando esta ubicación`);
      }

      // Soft delete
      const result = await db.query(
        'UPDATE ubicaciones_trabajo SET activo = false, actualizado_en = NOW() WHERE id = $1 AND organizacion_id = $2 RETURNING *',
        [ubicacionId, orgId]
      );

      return { eliminado: true, ubicacion: result.rows[0] };
    });
  }

  /**
   * Obtener estadísticas de uso por día
   * @param {number} orgId
   * @returns {Promise<Object>}
   */
  static async estadisticasPorDia(orgId) {
    return await RLSContextManager.query(orgId, async (db) => {
      const query = `
        SELECT
          ut.id,
          ut.nombre,
          ut.color,
          ut.es_remoto,
          COUNT(DISTINCT CASE WHEN p.ubicacion_lunes_id = ut.id THEN p.id END) as lunes,
          COUNT(DISTINCT CASE WHEN p.ubicacion_martes_id = ut.id THEN p.id END) as martes,
          COUNT(DISTINCT CASE WHEN p.ubicacion_miercoles_id = ut.id THEN p.id END) as miercoles,
          COUNT(DISTINCT CASE WHEN p.ubicacion_jueves_id = ut.id THEN p.id END) as jueves,
          COUNT(DISTINCT CASE WHEN p.ubicacion_viernes_id = ut.id THEN p.id END) as viernes,
          COUNT(DISTINCT CASE WHEN p.ubicacion_sabado_id = ut.id THEN p.id END) as sabado,
          COUNT(DISTINCT CASE WHEN p.ubicacion_domingo_id = ut.id THEN p.id END) as domingo
        FROM ubicaciones_trabajo ut
        LEFT JOIN profesionales p ON (
          p.ubicacion_lunes_id = ut.id OR
          p.ubicacion_martes_id = ut.id OR
          p.ubicacion_miercoles_id = ut.id OR
          p.ubicacion_jueves_id = ut.id OR
          p.ubicacion_viernes_id = ut.id OR
          p.ubicacion_sabado_id = ut.id OR
          p.ubicacion_domingo_id = ut.id
        ) AND p.organizacion_id = $1 AND p.eliminado_en IS NULL AND p.estado = 'activo'
        WHERE ut.organizacion_id = $1 AND ut.activo = true
        GROUP BY ut.id, ut.nombre, ut.color, ut.es_remoto
        ORDER BY ut.nombre
      `;

      const result = await db.query(query, [orgId]);
      return result.rows;
    });
  }
}

module.exports = UbicacionTrabajoModel;
