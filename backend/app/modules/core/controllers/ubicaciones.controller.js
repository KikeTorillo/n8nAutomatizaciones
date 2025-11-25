/**
 * @fileoverview Controller de Ubicaciones Geográficas
 * @description Endpoints públicos para catálogos de países, estados y ciudades de México
 * @version 1.0.0
 * @date Noviembre 2025
 *
 * NOTA: Estos endpoints son PÚBLICOS (no requieren autenticación)
 * porque los catálogos de ubicación se usan en onboarding y formularios públicos.
 */

const UbicacionesModel = require('../models/ubicaciones.model');
const { ResponseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class UbicacionesController {

  // ================================================================
  // PAÍSES
  // ================================================================

  /**
   * GET /api/v1/ubicaciones/paises
   * Lista todos los países activos
   */
  static async listarPaises(req, res) {
    try {
      const paises = await UbicacionesModel.listarPaises();

      return ResponseHelper.success(res, {
        paises,
        total: paises.length
      }, 'Países obtenidos exitosamente');

    } catch (error) {
      logger.error('[UbicacionesController] Error listando países:', error);
      return ResponseHelper.error(res, 'Error al obtener países', 500);
    }
  }

  /**
   * GET /api/v1/ubicaciones/paises/default
   * Obtiene el país por defecto (México)
   */
  static async obtenerPaisDefault(req, res) {
    try {
      const pais = await UbicacionesModel.obtenerPaisDefault();

      if (!pais) {
        return ResponseHelper.error(res, 'No se encontró país por defecto', 404);
      }

      return ResponseHelper.success(res, pais, 'País por defecto obtenido');

    } catch (error) {
      logger.error('[UbicacionesController] Error obteniendo país default:', error);
      return ResponseHelper.error(res, 'Error al obtener país', 500);
    }
  }

  // ================================================================
  // ESTADOS
  // ================================================================

  /**
   * GET /api/v1/ubicaciones/estados
   * Lista estados de México (shortcut más común)
   */
  static async listarEstadosMexico(req, res) {
    try {
      const estados = await UbicacionesModel.listarEstadosMexico();

      return ResponseHelper.success(res, {
        estados,
        total: estados.length,
        pais: 'México'
      }, 'Estados de México obtenidos exitosamente');

    } catch (error) {
      logger.error('[UbicacionesController] Error listando estados:', error);
      return ResponseHelper.error(res, 'Error al obtener estados', 500);
    }
  }

  /**
   * GET /api/v1/ubicaciones/paises/:paisId/estados
   * Lista estados de un país específico
   */
  static async listarEstadosPorPais(req, res) {
    try {
      const { paisId } = req.params;

      const estados = await UbicacionesModel.listarEstadosPorPais(paisId);

      return ResponseHelper.success(res, {
        estados,
        total: estados.length,
        pais_id: parseInt(paisId)
      }, 'Estados obtenidos exitosamente');

    } catch (error) {
      logger.error('[UbicacionesController] Error listando estados por país:', error);
      return ResponseHelper.error(res, 'Error al obtener estados', 500);
    }
  }

  /**
   * GET /api/v1/ubicaciones/estados/:id
   * Obtiene un estado por ID
   */
  static async obtenerEstado(req, res) {
    try {
      const { id } = req.params;

      const estado = await UbicacionesModel.obtenerEstadoPorId(id);

      if (!estado) {
        return ResponseHelper.error(res, 'Estado no encontrado', 404);
      }

      return ResponseHelper.success(res, estado, 'Estado obtenido');

    } catch (error) {
      logger.error('[UbicacionesController] Error obteniendo estado:', error);
      return ResponseHelper.error(res, 'Error al obtener estado', 500);
    }
  }

  /**
   * GET /api/v1/ubicaciones/estados/buscar
   * Busca estados por nombre (autocomplete)
   */
  static async buscarEstados(req, res) {
    try {
      const { q, pais_id, limite = 10 } = req.query;

      if (!q || q.length < 2) {
        return ResponseHelper.error(res, 'Se requiere al menos 2 caracteres para buscar', 400);
      }

      const estados = await UbicacionesModel.buscarEstados(
        q,
        pais_id ? parseInt(pais_id) : null,
        parseInt(limite)
      );

      return ResponseHelper.success(res, {
        estados,
        total: estados.length,
        busqueda: q
      }, 'Búsqueda completada');

    } catch (error) {
      logger.error('[UbicacionesController] Error buscando estados:', error);
      return ResponseHelper.error(res, 'Error en búsqueda', 500);
    }
  }

  // ================================================================
  // CIUDADES
  // ================================================================

  /**
   * GET /api/v1/ubicaciones/estados/:estadoId/ciudades
   * Lista ciudades de un estado
   */
  static async listarCiudadesPorEstado(req, res) {
    try {
      const { estadoId } = req.params;
      const { principales } = req.query;

      const soloPrincipales = principales === 'true' || principales === '1';
      const ciudades = await UbicacionesModel.listarCiudadesPorEstado(estadoId, soloPrincipales);

      return ResponseHelper.success(res, {
        ciudades,
        total: ciudades.length,
        estado_id: parseInt(estadoId),
        solo_principales: soloPrincipales
      }, 'Ciudades obtenidas exitosamente');

    } catch (error) {
      logger.error('[UbicacionesController] Error listando ciudades:', error);
      return ResponseHelper.error(res, 'Error al obtener ciudades', 500);
    }
  }

  /**
   * GET /api/v1/ubicaciones/ciudades/principales
   * Lista ciudades principales de México (para select inicial)
   */
  static async listarCiudadesPrincipales(req, res) {
    try {
      const { limite = 50 } = req.query;

      const ciudades = await UbicacionesModel.listarCiudadesPrincipalesMexico(parseInt(limite));

      return ResponseHelper.success(res, {
        ciudades,
        total: ciudades.length
      }, 'Ciudades principales obtenidas');

    } catch (error) {
      logger.error('[UbicacionesController] Error listando ciudades principales:', error);
      return ResponseHelper.error(res, 'Error al obtener ciudades', 500);
    }
  }

  /**
   * GET /api/v1/ubicaciones/ciudades/:id
   * Obtiene una ciudad por ID
   */
  static async obtenerCiudad(req, res) {
    try {
      const { id } = req.params;

      const ciudad = await UbicacionesModel.obtenerCiudadPorId(id);

      if (!ciudad) {
        return ResponseHelper.error(res, 'Ciudad no encontrada', 404);
      }

      return ResponseHelper.success(res, ciudad, 'Ciudad obtenida');

    } catch (error) {
      logger.error('[UbicacionesController] Error obteniendo ciudad:', error);
      return ResponseHelper.error(res, 'Error al obtener ciudad', 500);
    }
  }

  /**
   * GET /api/v1/ubicaciones/ciudades/buscar
   * Busca ciudades por nombre (autocomplete)
   */
  static async buscarCiudades(req, res) {
    try {
      const { q, estado_id, limite = 15 } = req.query;

      if (!q || q.length < 2) {
        return ResponseHelper.error(res, 'Se requiere al menos 2 caracteres para buscar', 400);
      }

      const ciudades = await UbicacionesModel.buscarCiudades(
        q,
        estado_id ? parseInt(estado_id) : null,
        parseInt(limite)
      );

      return ResponseHelper.success(res, {
        ciudades,
        total: ciudades.length,
        busqueda: q
      }, 'Búsqueda completada');

    } catch (error) {
      logger.error('[UbicacionesController] Error buscando ciudades:', error);
      return ResponseHelper.error(res, 'Error en búsqueda', 500);
    }
  }

  // ================================================================
  // CÓDIGOS POSTALES
  // ================================================================

  /**
   * GET /api/v1/ubicaciones/codigos-postales/buscar
   * Busca códigos postales (autocomplete)
   */
  static async buscarCodigosPostales(req, res) {
    try {
      const { q, estado_id, limite = 20 } = req.query;

      if (!q || q.length < 3) {
        return ResponseHelper.error(res, 'Se requiere al menos 3 caracteres para buscar', 400);
      }

      const codigosPostales = await UbicacionesModel.buscarCodigosPostales(
        q,
        estado_id ? parseInt(estado_id) : null,
        parseInt(limite)
      );

      return ResponseHelper.success(res, {
        codigos_postales: codigosPostales,
        total: codigosPostales.length,
        busqueda: q
      }, 'Búsqueda completada');

    } catch (error) {
      logger.error('[UbicacionesController] Error buscando códigos postales:', error);
      return ResponseHelper.error(res, 'Error en búsqueda', 500);
    }
  }

  // ================================================================
  // UTILIDADES
  // ================================================================

  /**
   * GET /api/v1/ubicaciones/ciudades/:ciudadId/completa
   * Obtiene ubicación completa (ciudad + estado + país)
   */
  static async obtenerUbicacionCompleta(req, res) {
    try {
      const { ciudadId } = req.params;

      const ubicacion = await UbicacionesModel.obtenerUbicacionCompleta(ciudadId);

      if (!ubicacion) {
        return ResponseHelper.error(res, 'Ubicación no encontrada', 404);
      }

      return ResponseHelper.success(res, ubicacion, 'Ubicación completa obtenida');

    } catch (error) {
      logger.error('[UbicacionesController] Error obteniendo ubicación completa:', error);
      return ResponseHelper.error(res, 'Error al obtener ubicación', 500);
    }
  }

  /**
   * POST /api/v1/ubicaciones/validar
   * Valida que una combinación de ubicación sea consistente
   */
  static async validarUbicacion(req, res) {
    try {
      const { ciudad_id, estado_id, pais_id } = req.body;

      if (!ciudad_id || !estado_id || !pais_id) {
        return ResponseHelper.error(res, 'Se requieren ciudad_id, estado_id y pais_id', 400);
      }

      const esValida = await UbicacionesModel.validarUbicacion(ciudad_id, estado_id, pais_id);

      return ResponseHelper.success(res, {
        valida: esValida,
        ciudad_id,
        estado_id,
        pais_id
      }, esValida ? 'Ubicación válida' : 'Ubicación inválida');

    } catch (error) {
      logger.error('[UbicacionesController] Error validando ubicación:', error);
      return ResponseHelper.error(res, 'Error al validar ubicación', 500);
    }
  }
}

module.exports = UbicacionesController;
