const { getDb } = require('../config/database');

/**
 * Modelo de Planes de Subscripción
 */
class PlanModel {
  /**
   * Listar todos los planes activos
   * @returns {Promise<Array>}
   */
  static async listar() {
    const db = await getDb();
    try {
      const query = `
        SELECT
          id,
          codigo_plan,
          nombre_plan as nombre,
          descripcion,
          precio_mensual,
          precio_anual,
          moneda,
          mp_plan_id,
          limite_profesionales as max_profesionales,
          limite_clientes as max_clientes,
          limite_servicios as max_servicios,
          limite_usuarios as max_usuarios,
          limite_citas_mes as max_citas_mes,
          funciones_habilitadas,
          orden_display
        FROM planes_subscripcion
        WHERE activo = true
        ORDER BY orden_display, precio_mensual
      `;

      const result = await db.query(query);
      return result.rows;
    } finally {
      db.release();
    }
  }

  /**
   * Obtener un plan por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  static async obtenerPorId(id) {
    const db = await getDb();
    try {
      const query = `
        SELECT
          id,
          codigo_plan,
          nombre_plan as nombre,
          descripcion,
          precio_mensual,
          precio_anual,
          moneda,
          mp_plan_id,
          limite_profesionales as max_profesionales,
          limite_clientes as max_clientes,
          limite_servicios as max_servicios,
          limite_usuarios as max_usuarios,
          limite_citas_mes as max_citas_mes,
          funciones_habilitadas
        FROM planes_subscripcion
        WHERE id = $1 AND activo = true
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        throw new Error('Plan no encontrado');
      }

      return result.rows[0];
    } finally {
      db.release();
    }
  }

  /**
   * Obtener un plan por código
   * @param {string} codigo
   * @returns {Promise<Object>}
   */
  static async obtenerPorCodigo(codigo) {
    const db = await getDb();
    try {
      const query = `
        SELECT
          id,
          codigo_plan,
          nombre_plan as nombre,
          descripcion,
          precio_mensual,
          precio_anual,
          moneda,
          limite_profesionales as max_profesionales,
          limite_clientes as max_clientes,
          limite_servicios as max_servicios,
          limite_usuarios as max_usuarios,
          limite_citas_mes as max_citas_mes,
          funciones_habilitadas
        FROM planes_subscripcion
        WHERE codigo_plan = $1 AND activo = true
      `;

      const result = await db.query(query, [codigo]);

      if (result.rows.length === 0) {
        throw new Error('Plan no encontrado');
      }

      return result.rows[0];
    } finally {
      db.release();
    }
  }
}

module.exports = PlanModel;
