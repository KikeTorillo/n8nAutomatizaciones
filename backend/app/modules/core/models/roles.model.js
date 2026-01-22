/**
 * @fileoverview Modelo de Roles
 * @description CRUD para la tabla roles (sistema de roles dinámicos)
 * @version 1.0.0
 * @date Enero 2026
 */

const { getDb } = require('../../../config/database');
const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper, ParseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class RolesModel {
  /**
   * Campos permitidos para ordenamiento
   */
  static ALLOWED_ORDER_FIELDS = ['nombre', 'codigo', 'nivel_jerarquia', 'creado_en'];

  /**
   * Listar roles de una organización
   * Incluye roles de sistema (super_admin, bot) si se solicita
   * @param {Object} filtros
   * @param {number} filtros.organizacion_id - ID de la organización
   * @param {boolean} filtros.incluir_sistema - Incluir roles de sistema
   * @param {boolean} filtros.activo - Filtrar por estado activo
   * @param {number} filtros.page
   * @param {number} filtros.limit
   * @param {string} filtros.order_by
   * @param {string} filtros.order_direction
   * @returns {Promise<{items: Array, paginacion: Object}>}
   */
  static async listar(filtros = {}) {
    const {
      organizacion_id,
      incluir_sistema = false,
      activo,
      page = 1,
      limit = 50,
      order_by = 'nivel_jerarquia',
      order_direction = 'DESC'
    } = filtros;

    const { offset } = ParseHelper.parsePagination({ page, limit });

    // Validar campo de ordenamiento
    const ordenSeguro = this.ALLOWED_ORDER_FIELDS.includes(order_by) ? order_by : 'nivel_jerarquia';
    const direccionSegura = order_direction === 'ASC' ? 'ASC' : 'DESC';

    return await RLSContextManager.query(organizacion_id, async (db) => {
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // Filtrar por organización o incluir roles de sistema
      if (incluir_sistema) {
        conditions.push(`(organizacion_id = $${paramIndex} OR es_rol_sistema = TRUE)`);
      } else {
        conditions.push(`organizacion_id = $${paramIndex}`);
      }
      params.push(organizacion_id);
      paramIndex++;

      // Filtrar por estado activo
      if (activo != null) {
        conditions.push(`activo = $${paramIndex}`);
        params.push(activo);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Contar total
      const countQuery = `SELECT COUNT(*) as total FROM roles ${whereClause}`;
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Obtener datos
      const query = `
        SELECT
          id,
          codigo,
          nombre,
          descripcion,
          organizacion_id,
          nivel_jerarquia,
          es_rol_sistema,
          bypass_permisos,
          puede_crear_usuarios,
          puede_modificar_permisos,
          color,
          icono,
          activo,
          creado_en,
          actualizado_en,
          (SELECT COUNT(*) FROM usuarios u WHERE u.rol_id = roles.id) as usuarios_count
        FROM roles
        ${whereClause}
        ORDER BY ${ordenSeguro} ${direccionSegura}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const result = await db.query(query, [...params, limit, offset]);

      return {
        items: result.rows,
        paginacion: {
          total,
          pagina: page,
          limite: limit,
          paginas: Math.ceil(total / limit)
        }
      };
    });
  }

  /**
   * Obtener un rol por ID
   * @param {number} id - ID del rol
   * @param {number} organizacion_id - ID de la organización (para RLS)
   * @returns {Promise<Object>}
   */
  static async obtenerPorId(id, organizacion_id) {
    return await RLSContextManager.query(organizacion_id, async (db) => {
      const query = `
        SELECT
          r.id,
          r.codigo,
          r.nombre,
          r.descripcion,
          r.organizacion_id,
          r.nivel_jerarquia,
          r.es_rol_sistema,
          r.bypass_permisos,
          r.puede_crear_usuarios,
          r.puede_modificar_permisos,
          r.color,
          r.icono,
          r.activo,
          r.creado_en,
          r.actualizado_en,
          r.creado_por,
          (SELECT COUNT(*) FROM usuarios u WHERE u.rol_id = r.id) as usuarios_count
        FROM roles r
        WHERE r.id = $1
          AND (r.organizacion_id = $2 OR r.es_rol_sistema = TRUE)
      `;

      const result = await db.query(query, [id, organizacion_id]);
      ErrorHelper.throwIfNotFound(result.rows[0], 'Rol');

      return result.rows[0];
    });
  }

  /**
   * Obtener un rol por código
   * @param {string} codigo - Código del rol
   * @param {number} organizacion_id - ID de la organización
   * @returns {Promise<Object|null>}
   */
  static async obtenerPorCodigo(codigo, organizacion_id) {
    return await RLSContextManager.query(organizacion_id, async (db) => {
      const query = `
        SELECT
          id,
          codigo,
          nombre,
          descripcion,
          organizacion_id,
          nivel_jerarquia,
          es_rol_sistema,
          bypass_permisos,
          puede_crear_usuarios,
          puede_modificar_permisos,
          color,
          icono,
          activo
        FROM roles
        WHERE codigo = $1
          AND (organizacion_id = $2 OR es_rol_sistema = TRUE)
      `;

      const result = await db.query(query, [codigo, organizacion_id]);
      return result.rows[0] || null;
    });
  }

  /**
   * Crear un nuevo rol
   * @param {Object} datos
   * @param {number} organizacion_id - ID de la organización
   * @param {number} creado_por - ID del usuario que crea
   * @returns {Promise<Object>}
   */
  static async crear(datos, organizacion_id, creado_por) {
    const {
      codigo,
      nombre,
      descripcion,
      nivel_jerarquia = 10,
      bypass_permisos = false,
      puede_crear_usuarios = false,
      puede_modificar_permisos = false,
      color = '#6B7280',
      icono = 'user',
      activo = true
    } = datos;

    return await RLSContextManager.query(organizacion_id, async (db) => {
      // Verificar que el código no existe en la organización
      const existente = await db.query(
        'SELECT id FROM roles WHERE codigo = $1 AND organizacion_id = $2',
        [codigo, organizacion_id]
      );

      if (existente.rows.length > 0) {
        ErrorHelper.throwConflict(`Ya existe un rol con el código "${codigo}"`);
      }

      // Validar nivel jerárquico (no puede ser mayor a 89, reservado para admin)
      if (nivel_jerarquia >= 90) {
        ErrorHelper.throwValidation('El nivel jerárquico máximo permitido es 89');
      }

      const query = `
        INSERT INTO roles (
          codigo,
          nombre,
          descripcion,
          organizacion_id,
          nivel_jerarquia,
          es_rol_sistema,
          bypass_permisos,
          puede_crear_usuarios,
          puede_modificar_permisos,
          color,
          icono,
          activo,
          creado_por
        ) VALUES ($1, $2, $3, $4, $5, FALSE, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const result = await db.query(query, [
        codigo,
        nombre,
        descripcion || null,
        organizacion_id,
        nivel_jerarquia,
        bypass_permisos,
        puede_crear_usuarios,
        puede_modificar_permisos,
        color,
        icono,
        activo,
        creado_por
      ]);

      logger.info('Rol creado', {
        rol_id: result.rows[0].id,
        codigo,
        organizacion_id,
        creado_por
      });

      return result.rows[0];
    });
  }

  /**
   * Actualizar un rol
   * @param {number} id - ID del rol
   * @param {Object} datos - Datos a actualizar
   * @param {number} organizacion_id - ID de la organización
   * @returns {Promise<Object>}
   */
  static async actualizar(id, datos, organizacion_id) {
    return await RLSContextManager.query(organizacion_id, async (db) => {
      // Verificar que el rol existe y no es de sistema
      const rolActual = await db.query(
        'SELECT id, es_rol_sistema, codigo FROM roles WHERE id = $1 AND organizacion_id = $2',
        [id, organizacion_id]
      );

      if (rolActual.rows.length === 0) {
        ErrorHelper.throwNotFound('Rol');
      }

      if (rolActual.rows[0].es_rol_sistema) {
        ErrorHelper.throwValidation('No se pueden modificar roles de sistema');
      }

      // Si se cambia el código, verificar que no existe
      if (datos.codigo && datos.codigo !== rolActual.rows[0].codigo) {
        const existente = await db.query(
          'SELECT id FROM roles WHERE codigo = $1 AND organizacion_id = $2 AND id != $3',
          [datos.codigo, organizacion_id, id]
        );

        if (existente.rows.length > 0) {
          ErrorHelper.throwConflict(`Ya existe un rol con el código "${datos.codigo}"`);
        }
      }

      // Validar nivel jerárquico
      if (datos.nivel_jerarquia && datos.nivel_jerarquia >= 90) {
        ErrorHelper.throwValidation('El nivel jerárquico máximo permitido es 89');
      }

      // Construir query dinámico
      const campos = [];
      const valores = [];
      let paramIndex = 1;

      const camposPermitidos = [
        'codigo', 'nombre', 'descripcion', 'nivel_jerarquia',
        'bypass_permisos', 'puede_crear_usuarios', 'puede_modificar_permisos',
        'color', 'icono', 'activo'
      ];

      for (const campo of camposPermitidos) {
        if (datos[campo] !== undefined) {
          campos.push(`${campo} = $${paramIndex}`);
          valores.push(datos[campo]);
          paramIndex++;
        }
      }

      if (campos.length === 0) {
        return await this.obtenerPorId(id, organizacion_id);
      }

      campos.push(`actualizado_en = NOW()`);

      const query = `
        UPDATE roles
        SET ${campos.join(', ')}
        WHERE id = $${paramIndex} AND organizacion_id = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await db.query(query, [...valores, id, organizacion_id]);

      logger.info('Rol actualizado', { rol_id: id, campos: Object.keys(datos), organizacion_id });

      return result.rows[0];
    });
  }

  /**
   * Eliminar un rol
   * @param {number} id - ID del rol
   * @param {number} organizacion_id - ID de la organización
   * @returns {Promise<boolean>}
   */
  static async eliminar(id, organizacion_id) {
    return await RLSContextManager.query(organizacion_id, async (db) => {
      // Verificar que el rol existe y no es de sistema
      const rol = await db.query(
        'SELECT id, es_rol_sistema, codigo FROM roles WHERE id = $1 AND organizacion_id = $2',
        [id, organizacion_id]
      );

      if (rol.rows.length === 0) {
        ErrorHelper.throwNotFound('Rol');
      }

      if (rol.rows[0].es_rol_sistema) {
        ErrorHelper.throwValidation('No se pueden eliminar roles de sistema');
      }

      // Verificar que no tiene usuarios asignados
      const usuariosCount = await db.query(
        'SELECT COUNT(*) as count FROM usuarios WHERE rol_id = $1',
        [id]
      );

      if (parseInt(usuariosCount.rows[0].count) > 0) {
        ErrorHelper.throwConflict(
          `No se puede eliminar el rol "${rol.rows[0].codigo}" porque tiene ${usuariosCount.rows[0].count} usuario(s) asignado(s)`
        );
      }

      // Eliminar permisos asociados al rol
      await db.query('DELETE FROM permisos_rol WHERE rol_id = $1', [id]);

      // Eliminar rol
      await db.query('DELETE FROM roles WHERE id = $1', [id]);

      logger.info('Rol eliminado', { rol_id: id, codigo: rol.rows[0].codigo, organizacion_id });

      return true;
    });
  }

  /**
   * Copiar permisos de un rol a otro
   * @param {number} rolOrigenId - ID del rol origen
   * @param {number} rolDestinoId - ID del rol destino
   * @param {number} organizacion_id - ID de la organización
   * @returns {Promise<number>} Cantidad de permisos copiados
   */
  static async copiarPermisos(rolOrigenId, rolDestinoId, organizacion_id) {
    return await RLSContextManager.query(organizacion_id, async (db) => {
      // Verificar que ambos roles existen
      const roles = await db.query(
        'SELECT id, codigo FROM roles WHERE id IN ($1, $2) AND (organizacion_id = $3 OR es_rol_sistema = TRUE)',
        [rolOrigenId, rolDestinoId, organizacion_id]
      );

      if (roles.rows.length !== 2) {
        ErrorHelper.throwNotFound('Uno o ambos roles no encontrados');
      }

      // Eliminar permisos existentes del rol destino
      await db.query('DELETE FROM permisos_rol WHERE rol_id = $1', [rolDestinoId]);

      // Copiar permisos del rol origen
      const result = await db.query(`
        INSERT INTO permisos_rol (rol_id, permiso_id, valor, creado_en)
        SELECT $1, permiso_id, valor, NOW()
        FROM permisos_rol
        WHERE rol_id = $2
      `, [rolDestinoId, rolOrigenId]);

      logger.info('Permisos copiados entre roles', {
        rol_origen_id: rolOrigenId,
        rol_destino_id: rolDestinoId,
        permisos_copiados: result.rowCount,
        organizacion_id
      });

      return result.rowCount;
    });
  }

  /**
   * Obtener permisos de un rol
   * @param {number} rolId - ID del rol
   * @param {number} organizacion_id - ID de la organización
   * @returns {Promise<Array>}
   */
  static async obtenerPermisos(rolId, organizacion_id) {
    return await RLSContextManager.query(organizacion_id, async (db) => {
      const query = `
        SELECT
          pc.id as permiso_id,
          pc.codigo,
          pc.modulo,
          pc.categoria,
          pc.nombre,
          pc.descripcion,
          pc.tipo_valor,
          COALESCE(pr.valor, pc.valor_default) as valor,
          CASE WHEN pr.id IS NOT NULL THEN 'rol' ELSE 'default' END as origen
        FROM permisos_catalogo pc
        LEFT JOIN permisos_rol pr ON pr.permiso_id = pc.id AND pr.rol_id = $1
        WHERE pc.activo = TRUE
        ORDER BY pc.modulo, pc.orden_display, pc.codigo
      `;

      const result = await db.query(query, [rolId]);
      return result.rows;
    });
  }

  /**
   * Actualizar permiso de un rol
   * @param {number} rolId - ID del rol
   * @param {number} permisoId - ID del permiso
   * @param {*} valor - Valor del permiso
   * @param {number} organizacion_id - ID de la organización
   * @returns {Promise<Object>}
   */
  static async actualizarPermiso(rolId, permisoId, valor, organizacion_id) {
    return await RLSContextManager.query(organizacion_id, async (db) => {
      // Verificar que el rol existe y no es de sistema
      const rol = await db.query(
        'SELECT id, es_rol_sistema FROM roles WHERE id = $1 AND (organizacion_id = $2 OR es_rol_sistema = FALSE)',
        [rolId, organizacion_id]
      );

      if (rol.rows.length === 0) {
        ErrorHelper.throwNotFound('Rol');
      }

      // No permitir editar permisos de roles de sistema desde aquí
      if (rol.rows[0].es_rol_sistema) {
        ErrorHelper.throwValidation('No se pueden modificar permisos de roles de sistema');
      }

      // Upsert del permiso
      const query = `
        INSERT INTO permisos_rol (rol_id, permiso_id, valor, creado_en)
        VALUES ($1, $2, $3::jsonb, NOW())
        ON CONFLICT (rol_id, permiso_id)
        DO UPDATE SET valor = $3::jsonb, actualizado_en = NOW()
        RETURNING *
      `;

      // Convertir valor a JSONB
      const valorJsonb = JSON.stringify(valor);

      const result = await db.query(query, [rolId, permisoId, valorJsonb]);

      logger.debug('Permiso de rol actualizado', {
        rol_id: rolId,
        permiso_id: permisoId,
        valor,
        organizacion_id
      });

      return result.rows[0];
    });
  }
}

module.exports = RolesModel;
