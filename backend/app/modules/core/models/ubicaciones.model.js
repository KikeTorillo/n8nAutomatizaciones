/**
 * @fileoverview Model de Ubicaciones Geográficas
 * @description Consultas a catálogos de países, estados, ciudades y códigos postales
 * @version 1.0.0
 * @date Noviembre 2025
 *
 * NOTA: Estos catálogos son datos públicos del sistema (no multi-tenant)
 * por lo que NO usan RLSContextManager, usan pool directamente.
 */

const pool = require('../../../config/database');
const logger = require('../../../utils/logger');

class UbicacionesModel {

  // ================================================================
  // PAÍSES
  // ================================================================

  /**
   * Lista todos los países activos
   * @returns {Promise<Array>} Lista de países
   */
  static async listarPaises() {
    const query = `
      SELECT
        id,
        codigo,
        codigo_alfa2,
        nombre,
        nombre_oficial,
        codigo_telefonico,
        moneda_codigo,
        es_default
      FROM paises
      WHERE activo = true
      ORDER BY es_default DESC, nombre ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Obtiene un país por ID
   * @param {number} id - ID del país
   * @returns {Promise<Object|null>}
   */
  static async obtenerPaisPorId(id) {
    const query = `
      SELECT *
      FROM paises
      WHERE id = $1 AND activo = true
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtiene el país por defecto (México)
   * @returns {Promise<Object|null>}
   */
  static async obtenerPaisDefault() {
    const query = `
      SELECT *
      FROM paises
      WHERE es_default = true AND activo = true
      LIMIT 1
    `;

    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  // ================================================================
  // ESTADOS
  // ================================================================

  /**
   * Lista estados de un país
   * @param {number} paisId - ID del país
   * @returns {Promise<Array>} Lista de estados
   */
  static async listarEstadosPorPais(paisId) {
    const query = `
      SELECT
        e.id,
        e.codigo,
        e.abreviatura,
        e.nombre,
        e.nombre_corto,
        e.zona_horaria,
        e.pais_id
      FROM estados e
      WHERE e.pais_id = $1 AND e.activo = true
      ORDER BY e.orden_display ASC, e.nombre ASC
    `;

    const result = await pool.query(query, [paisId]);
    return result.rows;
  }

  /**
   * Lista estados de México (shortcut)
   * @returns {Promise<Array>} Lista de estados de México
   */
  static async listarEstadosMexico() {
    const query = `
      SELECT
        e.id,
        e.codigo,
        e.abreviatura,
        e.nombre,
        e.nombre_corto,
        e.zona_horaria
      FROM estados e
      JOIN paises p ON e.pais_id = p.id
      WHERE p.codigo = 'MEX' AND e.activo = true
      ORDER BY e.orden_display ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Obtiene un estado por ID
   * @param {number} id - ID del estado
   * @returns {Promise<Object|null>}
   */
  static async obtenerEstadoPorId(id) {
    const query = `
      SELECT
        e.*,
        p.nombre as pais_nombre,
        p.codigo as pais_codigo
      FROM estados e
      JOIN paises p ON e.pais_id = p.id
      WHERE e.id = $1 AND e.activo = true
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Busca estados por nombre (para autocomplete)
   * @param {string} busqueda - Texto de búsqueda
   * @param {number} paisId - ID del país (opcional)
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>}
   */
  static async buscarEstados(busqueda, paisId = null, limite = 10) {
    let query = `
      SELECT
        e.id,
        e.nombre,
        e.nombre_corto,
        e.abreviatura
      FROM estados e
      WHERE e.activo = true
        AND (
          e.nombre ILIKE $1
          OR e.nombre_corto ILIKE $1
          OR e.abreviatura ILIKE $1
        )
    `;

    const params = [`%${busqueda}%`];

    if (paisId) {
      query += ` AND e.pais_id = $2`;
      params.push(paisId);
    }

    query += ` ORDER BY e.nombre ASC LIMIT $${params.length + 1}`;
    params.push(limite);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ================================================================
  // CIUDADES
  // ================================================================

  /**
   * Lista ciudades de un estado
   * @param {number} estadoId - ID del estado
   * @param {boolean} soloPrincipales - Solo ciudades principales
   * @returns {Promise<Array>}
   */
  static async listarCiudadesPorEstado(estadoId, soloPrincipales = false) {
    let query = `
      SELECT
        c.id,
        c.nombre,
        c.nombre_completo,
        c.es_capital,
        c.es_principal,
        c.poblacion,
        c.estado_id
      FROM ciudades c
      WHERE c.estado_id = $1 AND c.activo = true
    `;

    if (soloPrincipales) {
      query += ` AND c.es_principal = true`;
    }

    query += ` ORDER BY c.es_capital DESC, c.es_principal DESC, c.poblacion DESC NULLS LAST, c.nombre ASC`;

    const result = await pool.query(query, [estadoId]);
    return result.rows;
  }

  /**
   * Obtiene una ciudad por ID
   * @param {number} id - ID de la ciudad
   * @returns {Promise<Object|null>}
   */
  static async obtenerCiudadPorId(id) {
    const query = `
      SELECT
        c.*,
        e.nombre as estado_nombre,
        e.abreviatura as estado_abreviatura,
        p.nombre as pais_nombre
      FROM ciudades c
      JOIN estados e ON c.estado_id = e.id
      JOIN paises p ON e.pais_id = p.id
      WHERE c.id = $1 AND c.activo = true
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Busca ciudades por nombre (para autocomplete)
   * @param {string} busqueda - Texto de búsqueda
   * @param {number} estadoId - ID del estado (opcional)
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>}
   */
  static async buscarCiudades(busqueda, estadoId = null, limite = 15) {
    let query = `
      SELECT
        c.id,
        c.nombre,
        c.es_capital,
        c.es_principal,
        e.nombre_corto as estado,
        e.abreviatura as estado_abreviatura
      FROM ciudades c
      JOIN estados e ON c.estado_id = e.id
      WHERE c.activo = true
        AND c.nombre ILIKE $1
    `;

    const params = [`%${busqueda}%`];

    if (estadoId) {
      query += ` AND c.estado_id = $2`;
      params.push(estadoId);
    }

    query += ` ORDER BY c.es_principal DESC, c.poblacion DESC NULLS LAST, c.nombre ASC LIMIT $${params.length + 1}`;
    params.push(limite);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Lista ciudades principales de todo México (para select inicial)
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>}
   */
  static async listarCiudadesPrincipalesMexico(limite = 50) {
    const query = `
      SELECT
        c.id,
        c.nombre,
        c.es_capital,
        e.nombre_corto as estado,
        e.abreviatura as estado_abreviatura,
        e.id as estado_id
      FROM ciudades c
      JOIN estados e ON c.estado_id = e.id
      JOIN paises p ON e.pais_id = p.id
      WHERE p.codigo = 'MEX'
        AND c.activo = true
        AND c.es_principal = true
      ORDER BY c.poblacion DESC NULLS LAST, c.nombre ASC
      LIMIT $1
    `;

    const result = await pool.query(query, [limite]);
    return result.rows;
  }

  // ================================================================
  // CÓDIGOS POSTALES (opcional)
  // ================================================================

  /**
   * Busca códigos postales
   * @param {string} codigo - Código postal (parcial o completo)
   * @param {number} estadoId - ID del estado (opcional)
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>}
   */
  static async buscarCodigosPostales(codigo, estadoId = null, limite = 20) {
    let query = `
      SELECT
        cp.id,
        cp.codigo,
        cp.colonia,
        cp.tipo_asentamiento,
        c.nombre as ciudad,
        e.nombre_corto as estado
      FROM codigos_postales cp
      LEFT JOIN ciudades c ON cp.ciudad_id = c.id
      JOIN estados e ON cp.estado_id = e.id
      WHERE cp.activo = true
        AND cp.codigo LIKE $1
    `;

    const params = [`${codigo}%`];

    if (estadoId) {
      query += ` AND cp.estado_id = $2`;
      params.push(estadoId);
    }

    query += ` ORDER BY cp.codigo ASC LIMIT $${params.length + 1}`;
    params.push(limite);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ================================================================
  // UTILIDADES
  // ================================================================

  /**
   * Obtiene ubicación completa por ciudad_id
   * @param {number} ciudadId - ID de la ciudad
   * @returns {Promise<Object|null>} Objeto con ciudad, estado y país
   */
  static async obtenerUbicacionCompleta(ciudadId) {
    const query = `
      SELECT
        c.id as ciudad_id,
        c.nombre as ciudad,
        c.es_capital,
        e.id as estado_id,
        e.nombre as estado,
        e.nombre_corto as estado_corto,
        e.abreviatura as estado_abreviatura,
        p.id as pais_id,
        p.nombre as pais,
        p.codigo as pais_codigo
      FROM ciudades c
      JOIN estados e ON c.estado_id = e.id
      JOIN paises p ON e.pais_id = p.id
      WHERE c.id = $1 AND c.activo = true
    `;

    const result = await pool.query(query, [ciudadId]);
    return result.rows[0] || null;
  }

  /**
   * Valida que una combinación ciudad/estado/país sea consistente
   * @param {number} ciudadId
   * @param {number} estadoId
   * @param {number} paisId
   * @returns {Promise<boolean>}
   */
  static async validarUbicacion(ciudadId, estadoId, paisId) {
    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM ciudades c
        JOIN estados e ON c.estado_id = e.id
        WHERE c.id = $1
          AND e.id = $2
          AND e.pais_id = $3
          AND c.activo = true
          AND e.activo = true
      ) as valida
    `;

    const result = await pool.query(query, [ciudadId, estadoId, paisId]);
    return result.rows[0]?.valida || false;
  }
}

module.exports = UbicacionesModel;
