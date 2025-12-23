/**
 * Controller de Custom Fields
 * Gestión de campos personalizados dinámicos
 *
 * @module modules/custom-fields/controllers/custom-fields.controller
 */

const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

/**
 * Controller para gestión de campos personalizados
 */
class CustomFieldsController {
  /**
   * Listar definiciones de campos
   * GET /api/v1/custom-fields/definiciones
   */
  static listDefiniciones = asyncHandler(async (req, res) => {
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

    const {
      entidad_tipo,
      activo,
      seccion,
      visible_en_formulario,
      visible_en_listado,
      limit = 50,
      offset = 0
    } = req.query;

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

    return ResponseHelper.success(res, result.rows, 'Definiciones obtenidas exitosamente');
  });

  /**
   * Obtener definición por ID
   * GET /api/v1/custom-fields/definiciones/:id
   */
  static getDefinicion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

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

    if (result.rows.length === 0) {
      return ResponseHelper.error(res, 'Definición no encontrada', 404);
    }

    return ResponseHelper.success(res, result.rows[0], 'Definición obtenida exitosamente');
  });

  /**
   * Crear definición de campo
   * POST /api/v1/custom-fields/definiciones
   */
  static createDefinicion = asyncHandler(async (req, res) => {
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

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
    } = req.body;

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

    return ResponseHelper.success(
      res,
      result.rows[0],
      'Definición de campo creada exitosamente',
      201
    );
  });

  /**
   * Actualizar definición de campo
   * PUT /api/v1/custom-fields/definiciones/:id
   */
  static updateDefinicion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

    // Verificar que existe
    const checkQuery = `
      SELECT id, tipo_dato FROM custom_fields_definiciones
      WHERE id = $1 AND eliminado_en IS NULL
    `;
    const checkResult = await RLSContextManager.query(organizacionId, checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return ResponseHelper.error(res, 'Definición no encontrada', 404);
    }

    // Construir query dinámico con los campos proporcionados
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
      if (req.body[field] !== undefined) {
        let value = req.body[field];

        // Serializar JSON para campos específicos
        if (['opciones', 'valor_defecto'].includes(field) && value !== null) {
          value = JSON.stringify(value);
        }

        updates.push(`${field} = $${paramIndex++}`);
        params.push(value);
      }
    }

    if (updates.length === 0) {
      return ResponseHelper.error(res, 'No se proporcionaron campos para actualizar', 400);
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

    return ResponseHelper.success(res, result.rows[0], 'Definición actualizada exitosamente');
  });

  /**
   * Eliminar definición de campo (soft delete)
   * DELETE /api/v1/custom-fields/definiciones/:id
   */
  static deleteDefinicion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

    const query = `
      UPDATE custom_fields_definiciones
      SET eliminado_en = NOW(), eliminado_por = $1
      WHERE id = $2 AND eliminado_en IS NULL
      RETURNING id, nombre
    `;

    const result = await RLSContextManager.query(
      organizacionId,
      query,
      [req.user?.id || null, id]
    );

    if (result.rows.length === 0) {
      return ResponseHelper.error(res, 'Definición no encontrada', 404);
    }

    logger.info(`[CustomFields] Definición eliminada: ${id}`);

    return ResponseHelper.success(res, result.rows[0], 'Definición eliminada exitosamente');
  });

  /**
   * Reordenar definiciones
   * PUT /api/v1/custom-fields/definiciones/reorder
   */
  static reorderDefiniciones = asyncHandler(async (req, res) => {
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

    const { entidad_tipo, orden } = req.body;

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

    return ResponseHelper.success(res, { reordenados: orden.length }, 'Orden actualizado exitosamente');
  });

  /**
   * Obtener valores de campos personalizados de una entidad
   * GET /api/v1/custom-fields/valores/:entidad_tipo/:entidad_id
   */
  static getValores = asyncHandler(async (req, res) => {
    const { entidad_tipo, entidad_id } = req.params;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

    // Usar la función SQL que creamos
    const query = `SELECT obtener_custom_fields_entidad($1, $2, $3) as campos`;
    const result = await RLSContextManager.query(
      organizacionId,
      query,
      [organizacionId, entidad_tipo, entidad_id]
    );

    return ResponseHelper.success(
      res,
      result.rows[0]?.campos || [],
      'Valores obtenidos exitosamente'
    );
  });

  /**
   * Guardar valores de campos personalizados de una entidad
   * POST /api/v1/custom-fields/valores/:entidad_tipo/:entidad_id
   */
  static saveValores = asyncHandler(async (req, res) => {
    const { entidad_tipo, entidad_id } = req.params;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

    const valores = req.body;

    // Primero validar los valores
    const validateQuery = `SELECT validar_custom_fields($1, $2, $3) as resultado`;
    const validateResult = await RLSContextManager.query(
      organizacionId,
      validateQuery,
      [organizacionId, entidad_tipo, JSON.stringify(valores)]
    );

    const validacion = validateResult.rows[0]?.resultado;

    if (!validacion?.valido) {
      return ResponseHelper.error(res, 'Errores de validación', 400, {
        errores: validacion?.errores || []
      });
    }

    // Guardar los valores usando la función SQL
    const saveQuery = `SELECT guardar_custom_fields_entidad($1, $2, $3, $4) as resultado`;
    const saveResult = await RLSContextManager.query(
      organizacionId,
      saveQuery,
      [organizacionId, entidad_tipo, entidad_id, JSON.stringify(valores)]
    );

    const resultado = saveResult.rows[0]?.resultado;

    logger.info(`[CustomFields] Valores guardados para ${entidad_tipo}:${entidad_id} - ${resultado?.campos_guardados} campos`);

    return ResponseHelper.success(res, resultado, 'Valores guardados exitosamente');
  });

  /**
   * Validar valores de campos personalizados (sin guardar)
   * POST /api/v1/custom-fields/validar/:entidad_tipo
   */
  static validateValores = asyncHandler(async (req, res) => {
    const { entidad_tipo } = req.params;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

    const valores = req.body;

    const query = `SELECT validar_custom_fields($1, $2, $3) as resultado`;
    const result = await RLSContextManager.query(
      organizacionId,
      query,
      [organizacionId, entidad_tipo, JSON.stringify(valores)]
    );

    return ResponseHelper.success(
      res,
      result.rows[0]?.resultado || { valido: true, errores: [] },
      'Validación completada'
    );
  });

  /**
   * Obtener secciones disponibles para una entidad
   * GET /api/v1/custom-fields/secciones/:entidad_tipo
   */
  static getSecciones = asyncHandler(async (req, res) => {
    const { entidad_tipo } = req.params;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!organizacionId) {
      return ResponseHelper.error(res, 'No se pudo determinar la organización', 401);
    }

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

    return ResponseHelper.success(
      res,
      result.rows.map(r => r.seccion),
      'Secciones obtenidas exitosamente'
    );
  });
}

module.exports = CustomFieldsController;
