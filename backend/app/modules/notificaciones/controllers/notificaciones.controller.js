/**
 * Controller de Notificaciones
 * Gestion del centro de notificaciones
 *
 * @module modules/notificaciones/controllers/notificaciones.controller
 */

const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const RLSContextManager = require('../../../utils/rlsContextManager');
const NotificacionesService = require('../services/notificaciones.service');
const logger = require('../../../utils/logger');

/**
 * Controller para gestion de notificaciones
 */
class NotificacionesController {
  /**
   * Listar notificaciones del usuario
   * GET /api/v1/notificaciones
   */
  static list = asyncHandler(async (req, res) => {
    const usuarioId = req.user?.id;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!usuarioId) {
      return ResponseHelper.error(res, 'No se pudo determinar el usuario', 401);
    }

    const {
      solo_no_leidas = false,
      categoria = null,
      limit = 20,
      offset = 0
    } = req.query;

    const query = `
      SELECT * FROM obtener_feed_notificaciones($1, $2, $3, $4, $5)
    `;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(
        query,
        [usuarioId, solo_no_leidas === 'true' || solo_no_leidas === true, categoria, parseInt(limit), parseInt(offset)]
      );
    });

    return ResponseHelper.success(res, result.rows, 'Notificaciones obtenidas exitosamente');
  });

  /**
   * Contar notificaciones no leidas
   * GET /api/v1/notificaciones/count
   */
  static count = asyncHandler(async (req, res) => {
    const usuarioId = req.user?.id;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    if (!usuarioId) {
      return ResponseHelper.error(res, 'No se pudo determinar el usuario', 401);
    }

    const query = `SELECT contar_notificaciones_no_leidas($1) as count`;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query, [usuarioId]);
    });

    return ResponseHelper.success(res, {
      no_leidas: result.rows[0]?.count || 0
    }, 'Contador obtenido');
  });

  /**
   * Marcar notificacion como leida
   * PUT /api/v1/notificaciones/:id/leer
   */
  static marcarLeida = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const usuarioId = req.user?.id;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    const query = `SELECT marcar_notificacion_leida($1, $2) as success`;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query, [id, usuarioId]);
    });

    if (!result.rows[0]?.success) {
      return ResponseHelper.error(res, 'Notificacion no encontrada', 404);
    }

    return ResponseHelper.success(res, { id: parseInt(id) }, 'Notificacion marcada como leida');
  });

  /**
   * Marcar todas como leidas
   * PUT /api/v1/notificaciones/leer-todas
   */
  static marcarTodasLeidas = asyncHandler(async (req, res) => {
    const usuarioId = req.user?.id;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    const query = `SELECT marcar_todas_notificaciones_leidas($1) as count`;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query, [usuarioId]);
    });

    const count = result.rows[0]?.count || 0;

    logger.info(`[Notificaciones] Usuario ${usuarioId} marco ${count} como leidas`);

    return ResponseHelper.success(res, {
      marcadas: count
    }, `${count} notificaciones marcadas como leidas`);
  });

  /**
   * Archivar notificacion
   * PUT /api/v1/notificaciones/:id/archivar
   */
  static archivar = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const usuarioId = req.user?.id;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    const query = `SELECT archivar_notificacion($1, $2) as success`;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query, [id, usuarioId]);
    });

    if (!result.rows[0]?.success) {
      return ResponseHelper.error(res, 'Notificacion no encontrada', 404);
    }

    return ResponseHelper.success(res, { id: parseInt(id) }, 'Notificacion archivada');
  });

  /**
   * Eliminar notificacion
   * DELETE /api/v1/notificaciones/:id
   */
  static delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const usuarioId = req.user?.id;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    const query = `
      DELETE FROM notificaciones
      WHERE id = $1 AND usuario_id = $2
      RETURNING id
    `;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query, [id, usuarioId]);
    });

    if (result.rows.length === 0) {
      return ResponseHelper.error(res, 'Notificacion no encontrada', 404);
    }

    return ResponseHelper.success(res, { id: parseInt(id) }, 'Notificacion eliminada');
  });

  /**
   * Crear notificacion (admin/sistema)
   * POST /api/v1/notificaciones
   */
  static create = asyncHandler(async (req, res) => {
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    const {
      usuario_id,
      tipo,
      categoria,
      titulo,
      mensaje,
      nivel,
      icono,
      accion_url,
      accion_texto,
      entidad_tipo,
      entidad_id,
      expira_en
    } = req.body;

    const notificacionId = await NotificacionesService.crear({
      organizacionId,
      usuarioId: usuario_id,
      tipo,
      categoria,
      titulo,
      mensaje,
      nivel,
      icono,
      accionUrl: accion_url,
      accionTexto: accion_texto,
      entidadTipo: entidad_tipo,
      entidadId: entidad_id,
      expiraEn: expira_en
    });

    if (!notificacionId) {
      return ResponseHelper.error(res, 'No se pudo crear la notificacion (preferencias deshabilitadas)', 400);
    }

    return ResponseHelper.success(res, { id: notificacionId }, 'Notificacion creada', 201);
  });

  /**
   * Obtener preferencias del usuario
   * GET /api/v1/notificaciones/preferencias
   */
  static getPreferencias = asyncHandler(async (req, res) => {
    const usuarioId = req.user?.id;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    const query = `SELECT * FROM obtener_preferencias_notificaciones($1)`;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query, [usuarioId]);
    });

    // Agrupar por categoria
    const preferencias = result.rows.reduce((acc, pref) => {
      if (!acc[pref.categoria]) {
        acc[pref.categoria] = [];
      }
      acc[pref.categoria].push(pref);
      return acc;
    }, {});

    return ResponseHelper.success(res, preferencias, 'Preferencias obtenidas');
  });

  /**
   * Actualizar preferencias del usuario
   * PUT /api/v1/notificaciones/preferencias
   */
  static updatePreferencias = asyncHandler(async (req, res) => {
    const usuarioId = req.user?.id;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    const { preferencias } = req.body;

    await RLSContextManager.transaction(organizacionId, async (client) => {
      for (const pref of preferencias) {
        await client.query(
          `SELECT actualizar_preferencia_notificacion($1, $2, $3, $4, $5, $6, $7)`,
          [
            organizacionId,
            usuarioId,
            pref.tipo,
            pref.in_app,
            pref.email,
            pref.push || false,
            pref.whatsapp || false
          ]
        );
      }
    });

    logger.info(`[Notificaciones] Usuario ${usuarioId} actualizo ${preferencias.length} preferencias`);

    return ResponseHelper.success(res, {
      actualizadas: preferencias.length
    }, 'Preferencias actualizadas');
  });

  /**
   * Listar tipos de notificacion disponibles
   * GET /api/v1/notificaciones/tipos
   */
  static getTipos = asyncHandler(async (req, res) => {
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    const query = `
      SELECT tipo, categoria, nombre, descripcion, icono_default, nivel_default,
             default_in_app, default_email, default_push, orden
      FROM notificaciones_tipos
      WHERE activo = TRUE
      ORDER BY categoria, orden
    `;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(query);
    });

    // Agrupar por categoria
    const tipos = result.rows.reduce((acc, tipo) => {
      if (!acc[tipo.categoria]) {
        acc[tipo.categoria] = [];
      }
      acc[tipo.categoria].push(tipo);
      return acc;
    }, {});

    return ResponseHelper.success(res, tipos, 'Tipos de notificacion obtenidos');
  });

  /**
   * Listar plantillas de la organizacion
   * GET /api/v1/notificaciones/plantillas
   */
  static getPlantillas = asyncHandler(async (req, res) => {
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    const query = `
      SELECT id, tipo_notificacion, nombre, titulo_template, mensaje_template,
             icono, nivel, activo, creado_en, actualizado_en
      FROM notificaciones_plantillas
      WHERE organizacion_id = $1
      ORDER BY tipo_notificacion
    `;

    const result = await RLSContextManager.query(organizacionId, query, [organizacionId]);

    return ResponseHelper.success(res, result.rows, 'Plantillas obtenidas');
  });

  /**
   * Crear plantilla
   * POST /api/v1/notificaciones/plantillas
   */
  static createPlantilla = asyncHandler(async (req, res) => {
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;
    const creadorId = req.user?.id;

    const {
      tipo_notificacion,
      nombre,
      titulo_template,
      mensaje_template,
      icono,
      nivel,
      activo
    } = req.body;

    const query = `
      INSERT INTO notificaciones_plantillas (
        organizacion_id, tipo_notificacion, nombre, titulo_template,
        mensaje_template, icono, nivel, activo, creado_por
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await RLSContextManager.query(
      organizacionId,
      query,
      [
        organizacionId,
        tipo_notificacion,
        nombre,
        titulo_template,
        mensaje_template,
        icono || null,
        nivel || 'info',
        activo !== false,
        creadorId
      ]
    );

    return ResponseHelper.success(res, result.rows[0], 'Plantilla creada', 201);
  });

  /**
   * Actualizar plantilla
   * PUT /api/v1/notificaciones/plantillas/:id
   */
  static updatePlantilla = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    // Construir query dinamico
    const updates = [];
    const params = [];
    let paramIndex = 1;

    const allowedFields = [
      'nombre', 'titulo_template', 'mensaje_template',
      'icono', 'nivel', 'activo'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return ResponseHelper.error(res, 'No se proporcionaron campos para actualizar', 400);
    }

    params.push(id);
    params.push(organizacionId);

    const query = `
      UPDATE notificaciones_plantillas
      SET ${updates.join(', ')}, actualizado_en = NOW()
      WHERE id = $${paramIndex++} AND organizacion_id = $${paramIndex}
      RETURNING *
    `;

    const result = await RLSContextManager.query(organizacionId, query, params);

    if (result.rows.length === 0) {
      return ResponseHelper.error(res, 'Plantilla no encontrada', 404);
    }

    return ResponseHelper.success(res, result.rows[0], 'Plantilla actualizada');
  });

  /**
   * Eliminar plantilla
   * DELETE /api/v1/notificaciones/plantillas/:id
   */
  static deletePlantilla = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizacionId = req.tenant?.organizacionId || req.user?.organizacion_id;

    const query = `
      DELETE FROM notificaciones_plantillas
      WHERE id = $1 AND organizacion_id = $2
      RETURNING id
    `;

    const result = await RLSContextManager.query(organizacionId, query, [id, organizacionId]);

    if (result.rows.length === 0) {
      return ResponseHelper.error(res, 'Plantilla no encontrada', 404);
    }

    return ResponseHelper.success(res, { id: parseInt(id) }, 'Plantilla eliminada');
  });
}

module.exports = NotificacionesController;
