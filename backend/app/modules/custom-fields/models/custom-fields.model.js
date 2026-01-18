/**
 * Model de Custom Fields
 * Encapsula operaciones de base de datos para campos personalizados
 *
 * @module modules/custom-fields/models/custom-fields.model
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

class CustomFieldsModel {
  /**
   * Listar definiciones de campos personalizados
   * @param {number} organizacionId - ID de la organización
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>} Lista de definiciones
   */
  static async listarDefiniciones(organizacionId, filtros = {}) {
    const {
      entidad_tipo,
      activo,
      seccion,
      visible_en_formulario,
      visible_en_listado,
      limit = 50,
      offset = 0
    } = filtros;

    let query = `
      SELECT id, nombre, nombre_clave, descripcion, entidad_tipo, tipo_dato,
             opciones, valor_defecto, requerido, placeholder, tooltip,
             seccion, orden, ancho_columnas, icono, visible_en_formulario,
             visible_en_listado, buscable, activo, longitud_minima, longitud_maxima,
             valor_minimo, valor_maximo, patron_regex, mensaje_error,
             creado_en, actualizado_en
      FROM custom_fields_definiciones
      WHERE eliminado_en IS NULL
    `;
    const params = [];
    let paramIndex = 1;

    if (entidad_tipo) {
      query += ` AND entidad_tipo = $${paramIndex++}`;
      params.push(entidad_tipo);
    }

    if (activo !== undefined) {
      query += ` AND activo = $${paramIndex++}`;
      params.push(activo);
    }

    if (seccion) {
      query += ` AND seccion = $${paramIndex++}`;
      params.push(seccion);
    }

    if (visible_en_formulario !== undefined) {
      query += ` AND visible_en_formulario = $${paramIndex++}`;
      params.push(visible_en_formulario);
    }

    if (visible_en_listado !== undefined) {
      query += ` AND visible_en_listado = $${paramIndex++}`;
      params.push(visible_en_listado);
    }

    query += ` ORDER BY seccion NULLS LAST, orden ASC`;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await RLSContextManager.query(organizacionId, query, params);
    return result.rows;
  }

  /**
   * Obtener definición por ID
   * @param {number} organizacionId - ID de la organización
   * @param {number} id - ID de la definición
   * @returns {Promise<Object|null>} Definición encontrada o null
   */
  static async obtenerDefinicionPorId(organizacionId, id) {
    const query = `
      SELECT id, nombre, nombre_clave, descripcion, entidad_tipo, tipo_dato,
             opciones, valor_defecto, requerido, placeholder, tooltip,
             seccion, orden, ancho_columnas, icono, visible_en_formulario,
             visible_en_listado, buscable, activo, longitud_minima, longitud_maxima,
             valor_minimo, valor_maximo, patron_regex, mensaje_error,
             creado_en, actualizado_en
      FROM custom_fields_definiciones
      WHERE id = $1 AND eliminado_en IS NULL
    `;

    const result = await RLSContextManager.query(organizacionId, query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Crear definición de campo
   * @param {number} organizacionId - ID de la organización
   * @param {Object} datos - Datos de la definición
   * @returns {Promise<Object>} Definición creada
   */
  static async crearDefinicion(organizacionId, datos) {
    const {
      nombre,
      nombre_clave,
      descripcion,
      entidad_tipo,
      tipo_dato,
      opciones,
      valor_defecto,
      requerido,
      placeholder,
      tooltip,
      seccion,
      orden,
      ancho_columnas,
      icono,
      visible_en_formulario,
      visible_en_listado,
      buscable,
      longitud_minima,
      longitud_maxima,
      valor_minimo,
      valor_maximo,
      patron_regex,
      mensaje_error
    } = datos;

    const query = `
      INSERT INTO custom_fields_definiciones (
        organizacion_id, nombre, nombre_clave, descripcion, entidad_tipo, tipo_dato,
        opciones, valor_defecto, requerido, placeholder, tooltip, seccion, orden,
        ancho_columnas, icono, visible_en_formulario, visible_en_listado, buscable,
        longitud_minima, longitud_maxima, valor_minimo, valor_maximo,
        patron_regex, mensaje_error
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24
      )
      RETURNING *
    `;

    const params = [
      organizacionId,
      nombre,
      nombre_clave || null,
      descripcion || null,
      entidad_tipo,
      tipo_dato,
      opciones ? JSON.stringify(opciones) : null,
      valor_defecto !== undefined ? JSON.stringify(valor_defecto) : null,
      requerido || false,
      placeholder || null,
      tooltip || null,
      seccion || null,
      orden || 0,
      ancho_columnas || 12,
      icono || null,
      visible_en_formulario !== false,
      visible_en_listado || false,
      buscable || false,
      longitud_minima || null,
      longitud_maxima || null,
      valor_minimo || null,
      valor_maximo || null,
      patron_regex || null,
      mensaje_error || null
    ];

    const result = await RLSContextManager.query(organizacionId, query, params);

    logger.info(`[CustomFields] Definición creada: ${result.rows[0].id} (${nombre}) para ${entidad_tipo}`);

    return result.rows[0];
  }

  /**
   * Actualizar definición de campo
   * @param {number} organizacionId - ID de la organización
   * @param {number} id - ID de la definición
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object|null>} Definición actualizada o null
   */
  static async actualizarDefinicion(organizacionId, id, datos) {
    // Verificar que existe
    const checkQuery = `
      SELECT id, tipo_dato FROM custom_fields_definiciones
      WHERE id = $1 AND eliminado_en IS NULL
    `;
    const checkResult = await RLSContextManager.query(organizacionId, checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return null;
    }

    // Construir query dinámico
    const updates = [];
    const params = [];
    let paramIndex = 1;

    const allowedFields = [
      'nombre', 'descripcion', 'opciones', 'valor_defecto', 'requerido',
      'placeholder', 'tooltip', 'seccion', 'orden', 'ancho_columnas', 'icono',
      'visible_en_formulario', 'visible_en_listado', 'buscable', 'activo',
      'longitud_minima', 'longitud_maxima', 'valor_minimo', 'valor_maximo',
      'patron_regex', 'mensaje_error'
    ];

    for (const field of allowedFields) {
      if (datos[field] !== undefined) {
        let value = datos[field];

        // Serializar JSON para campos específicos
        if (['opciones', 'valor_defecto'].includes(field) && value !== null) {
          value = JSON.stringify(value);
        }

        updates.push(`${field} = $${paramIndex++}`);
        params.push(value);
      }
    }

    if (updates.length === 0) {
      return null;
    }

    params.push(id);
    const query = `
      UPDATE custom_fields_definiciones
      SET ${updates.join(', ')}, actualizado_en = NOW()
      WHERE id = $${paramIndex} AND eliminado_en IS NULL
      RETURNING *
    `;

    const result = await RLSContextManager.query(organizacionId, query, params);

    logger.info(`[CustomFields] Definición actualizada: ${id}`);

    return result.rows[0];
  }

  /**
   * Eliminar definición (soft delete)
   * @param {number} organizacionId - ID de la organización
   * @param {number} id - ID de la definición
   * @param {number} usuarioId - ID del usuario que elimina
   * @returns {Promise<Object|null>} Definición eliminada o null
   */
  static async eliminarDefinicion(organizacionId, id, usuarioId) {
    const query = `
      UPDATE custom_fields_definiciones
      SET eliminado_en = NOW(), eliminado_por = $1
      WHERE id = $2 AND eliminado_en IS NULL
      RETURNING id, nombre
    `;

    const result = await RLSContextManager.query(
      organizacionId,
      query,
      [usuarioId || null, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info(`[CustomFields] Definición eliminada: ${id}`);

    return result.rows[0];
  }

  /**
   * Reordenar definiciones
   * @param {number} organizacionId - ID de la organización
   * @param {string} entidad_tipo - Tipo de entidad
   * @param {Array} orden - Array de {id, orden}
   * @returns {Promise<number>} Cantidad reordenada
   */
  static async reordenarDefiniciones(organizacionId, entidad_tipo, orden) {
    await RLSContextManager.transaction(organizacionId, async (client) => {
      for (const item of orden) {
        await client.query(
          `UPDATE custom_fields_definiciones
           SET orden = $1, actualizado_en = NOW()
           WHERE id = $2 AND entidad_tipo = $3 AND eliminado_en IS NULL`,
          [item.orden, item.id, entidad_tipo]
        );
      }
    });

    logger.info(`[CustomFields] Definiciones reordenadas para ${entidad_tipo}`);

    return orden.length;
  }

  /**
   * Obtener valores de campos de una entidad
   * @param {number} organizacionId - ID de la organización
   * @param {string} entidad_tipo - Tipo de entidad
   * @param {number} entidad_id - ID de la entidad
   * @returns {Promise<Array>} Valores de campos
   */
  static async obtenerValores(organizacionId, entidad_tipo, entidad_id) {
    const query = `SELECT obtener_custom_fields_entidad($1, $2, $3) as campos`;
    const result = await RLSContextManager.query(
      organizacionId,
      query,
      [organizacionId, entidad_tipo, entidad_id]
    );

    return result.rows[0]?.campos || [];
  }

  /**
   * Validar valores de campos
   * @param {number} organizacionId - ID de la organización
   * @param {string} entidad_tipo - Tipo de entidad
   * @param {Object} valores - Valores a validar
   * @returns {Promise<Object>} Resultado de validación
   */
  static async validarValores(organizacionId, entidad_tipo, valores) {
    const query = `SELECT validar_custom_fields($1, $2, $3) as resultado`;
    const result = await RLSContextManager.query(
      organizacionId,
      query,
      [organizacionId, entidad_tipo, JSON.stringify(valores)]
    );

    return result.rows[0]?.resultado || { valido: true, errores: [] };
  }

  /**
   * Guardar valores de campos de una entidad
   * @param {number} organizacionId - ID de la organización
   * @param {string} entidad_tipo - Tipo de entidad
   * @param {number} entidad_id - ID de la entidad
   * @param {Object} valores - Valores a guardar
   * @returns {Promise<Object>} Resultado del guardado
   */
  static async guardarValores(organizacionId, entidad_tipo, entidad_id, valores) {
    const query = `SELECT guardar_custom_fields_entidad($1, $2, $3, $4) as resultado`;
    const result = await RLSContextManager.query(
      organizacionId,
      query,
      [organizacionId, entidad_tipo, entidad_id, JSON.stringify(valores)]
    );

    const resultado = result.rows[0]?.resultado;

    logger.info(`[CustomFields] Valores guardados para ${entidad_tipo}:${entidad_id} - ${resultado?.campos_guardados} campos`);

    return resultado;
  }

  /**
   * Obtener secciones disponibles para un tipo de entidad
   * @param {number} organizacionId - ID de la organización
   * @param {string} entidad_tipo - Tipo de entidad
   * @returns {Promise<Array<string>>} Lista de secciones
   */
  static async obtenerSecciones(organizacionId, entidad_tipo) {
    const query = `
      SELECT DISTINCT seccion
      FROM custom_fields_definiciones
      WHERE entidad_tipo = $1
        AND activo = TRUE
        AND eliminado_en IS NULL
        AND seccion IS NOT NULL
      ORDER BY seccion
    `;

    const result = await RLSContextManager.query(organizacionId, query, [entidad_tipo]);
    return result.rows.map(r => r.seccion);
  }
}

module.exports = CustomFieldsModel;
