const RLSContextManager = require('../utils/rlsContextManager');
const logger = require('../utils/logger');

class TipoBloqueoModel {
  /**
   * Listar tipos disponibles (sistema + organización)
   * @param {number} orgId - ID de la organización
   * @param {Object} filtros - { solo_sistema, solo_personalizados }
   * @returns {Promise<Array>} Lista de tipos
   */
  static async listar(orgId, filtros = {}) {
    return await RLSContextManager.query(orgId, async (db) => {
      try {
        let whereClause = 'WHERE activo = true AND (organizacion_id IS NULL OR organizacion_id = $1)';
        const params = [orgId];

        if (filtros.solo_sistema) {
          whereClause = 'WHERE activo = true AND organizacion_id IS NULL';
        } else if (filtros.solo_personalizados) {
          whereClause = 'WHERE activo = true AND organizacion_id = $1';
        }

        const query = `
          SELECT
            id, organizacion_id, codigo, nombre, descripcion,
            es_sistema, permite_todo_el_dia, permite_horario_especifico,
            requiere_aprobacion, orden_display, activo,
            metadata, creado_en, actualizado_en
          FROM tipos_bloqueo
          ${whereClause}
          ORDER BY orden_display, nombre
        `;

        const result = filtros.solo_sistema
          ? await db.query(query.replace('$1', 'NULL'))
          : await db.query(query, params);

        return result.rows;
      } catch (error) {
        logger.error('[TipoBloqueoModel.listar] Error:', { error: error.message, orgId });
        throw error;
      }
    });
  }

  /**
   * Obtener tipo por ID
   * @param {number} orgId
   * @param {number} tipoId
   * @returns {Promise<Object>}
   */
  static async obtenerPorId(orgId, tipoId) {
    return await RLSContextManager.query(orgId, async (db) => {
      const query = `
        SELECT *
        FROM tipos_bloqueo
        WHERE id = $1 AND activo = true
          AND (organizacion_id IS NULL OR organizacion_id = $2)
      `;

      const result = await db.query(query, [tipoId, orgId]);
      return result.rows[0] || null;
    });
  }

  /**
   * Crear tipo personalizado (solo organizaciones, no sistema)
   * @param {number} orgId
   * @param {Object} data - { codigo, nombre, descripcion, ... }
   * @returns {Promise<Object>}
   */
  static async crear(orgId, data) {
    return await RLSContextManager.query(orgId, async (db) => {
      try {
        // Validar que el código no exista en tipos del sistema
        const tipoSistema = await db.query(
          'SELECT id FROM tipos_bloqueo WHERE LOWER(codigo) = LOWER($1) AND organizacion_id IS NULL',
          [data.codigo]
        );

        if (tipoSistema.rows.length > 0) {
          throw new Error(`El código "${data.codigo}" está reservado por un tipo del sistema`);
        }

        const query = `
          INSERT INTO tipos_bloqueo (
            organizacion_id, codigo, nombre, descripcion,
            permite_todo_el_dia, permite_horario_especifico,
            requiere_aprobacion, orden_display, metadata, es_sistema
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
          RETURNING *
        `;

        const values = [
          orgId,
          data.codigo.toLowerCase(),
          data.nombre,
          data.descripcion || null,
          data.permite_todo_el_dia !== false,
          data.permite_horario_especifico !== false,
          data.requiere_aprobacion || false,
          data.orden_display || 0,
          data.metadata || {}
        ];

        const result = await db.query(query, values);
        return result.rows[0];
      } catch (error) {
        logger.error('[TipoBloqueoModel.crear] Error:', { error: error.message, orgId });
        throw error;
      }
    });
  }

  /**
   * Actualizar tipo personalizado
   * @param {number} orgId
   * @param {number} tipoId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async actualizar(orgId, tipoId, data) {
    return await RLSContextManager.transaction(orgId, async (db) => {
      // Verificar que el tipo existe y no es del sistema
      const tipoExistente = await db.query(
        'SELECT id, es_sistema FROM tipos_bloqueo WHERE id = $1 AND organizacion_id = $2',
        [tipoId, orgId]
      );

      if (tipoExistente.rows.length === 0) {
        throw new Error('Tipo de bloqueo no encontrado');
      }

      if (tipoExistente.rows[0].es_sistema) {
        throw new Error('No se pueden modificar tipos del sistema');
      }

      const camposActualizar = [];
      const valores = [tipoId, orgId];
      let paramCounter = 3;

      const camposPermitidos = [
        'nombre', 'descripcion',
        'permite_todo_el_dia', 'permite_horario_especifico',
        'requiere_aprobacion', 'orden_display', 'metadata'
      ];

      camposPermitidos.forEach(campo => {
        if (data.hasOwnProperty(campo)) {
          camposActualizar.push(`${campo} = $${paramCounter}`);
          valores.push(data[campo]);
          paramCounter++;
        }
      });

      if (camposActualizar.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      const query = `
        UPDATE tipos_bloqueo
        SET ${camposActualizar.join(', ')}, actualizado_en = NOW()
        WHERE id = $1 AND organizacion_id = $2
        RETURNING *
      `;

      const result = await db.query(query, valores);
      return result.rows[0];
    });
  }

  /**
   * Eliminar (soft delete) tipo personalizado
   * @param {number} orgId
   * @param {number} tipoId
   * @returns {Promise<Object>}
   */
  static async eliminar(orgId, tipoId) {
    return await RLSContextManager.transaction(orgId, async (db) => {
      // Verificar que no es del sistema
      const tipo = await db.query(
        'SELECT id, es_sistema, codigo FROM tipos_bloqueo WHERE id = $1 AND organizacion_id = $2',
        [tipoId, orgId]
      );

      if (tipo.rows.length === 0) {
        throw new Error('Tipo de bloqueo no encontrado');
      }

      if (tipo.rows[0].es_sistema) {
        throw new Error('No se pueden eliminar tipos del sistema');
      }

      // Verificar que no esté en uso
      const enUso = await db.query(
        'SELECT COUNT(*) as total FROM bloqueos_horarios WHERE tipo_bloqueo_id = $1 AND activo = true',
        [tipoId]
      );

      if (parseInt(enUso.rows[0].total) > 0) {
        throw new Error(`No se puede eliminar. Hay ${enUso.rows[0].total} bloqueos activos usando este tipo`);
      }

      // Soft delete
      const result = await db.query(
        'UPDATE tipos_bloqueo SET activo = false, actualizado_en = NOW() WHERE id = $1 AND organizacion_id = $2 RETURNING *',
        [tipoId, orgId]
      );

      return { eliminado: true, tipo: result.rows[0] };
    });
  }
}

module.exports = TipoBloqueoModel;
