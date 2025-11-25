/**
 * @fileoverview Rutas de Ubicaciones Geográficas
 * @description Endpoints públicos para catálogos de países, estados y ciudades
 * @version 1.0.0
 * @date Noviembre 2025
 *
 * NOTA: Estos endpoints son PÚBLICOS (no requieren autenticación)
 * Se usan en onboarding, marketplace y formularios públicos.
 *
 * ENDPOINTS (13):
 * - GET  /paises                           - Lista países
 * - GET  /paises/default                   - País por defecto (México)
 * - GET  /paises/:paisId/estados           - Estados de un país
 * - GET  /estados                          - Estados de México (shortcut)
 * - GET  /estados/buscar                   - Buscar estados
 * - GET  /estados/:id                      - Obtener estado
 * - GET  /estados/:estadoId/ciudades       - Ciudades de un estado
 * - GET  /ciudades/principales             - Ciudades principales de México
 * - GET  /ciudades/buscar                  - Buscar ciudades
 * - GET  /ciudades/:id                     - Obtener ciudad
 * - GET  /ciudades/:ciudadId/completa      - Ubicación completa
 * - GET  /codigos-postales/buscar          - Buscar códigos postales
 * - POST /validar                          - Validar combinación de ubicación
 */

const express = require('express');
const router = express.Router();
const UbicacionesController = require('../controllers/ubicaciones.controller');
const { asyncHandler } = require('../../../middleware');

// ================================================================
// PAÍSES
// ================================================================

/**
 * @route GET /api/v1/ubicaciones/paises
 * @desc Lista todos los países activos
 * @access Public
 */
router.get('/paises',
  asyncHandler(UbicacionesController.listarPaises)
);

/**
 * @route GET /api/v1/ubicaciones/paises/default
 * @desc Obtiene el país por defecto (México)
 * @access Public
 */
router.get('/paises/default',
  asyncHandler(UbicacionesController.obtenerPaisDefault)
);

/**
 * @route GET /api/v1/ubicaciones/paises/:paisId/estados
 * @desc Lista estados de un país específico
 * @access Public
 */
router.get('/paises/:paisId/estados',
  asyncHandler(UbicacionesController.listarEstadosPorPais)
);

// ================================================================
// ESTADOS
// ================================================================

/**
 * @route GET /api/v1/ubicaciones/estados
 * @desc Lista estados de México (shortcut)
 * @access Public
 */
router.get('/estados',
  asyncHandler(UbicacionesController.listarEstadosMexico)
);

/**
 * @route GET /api/v1/ubicaciones/estados/buscar
 * @desc Busca estados por nombre (autocomplete)
 * @query q - Texto de búsqueda (min 2 chars)
 * @query pais_id - Filtrar por país (opcional)
 * @query limite - Límite de resultados (default 10)
 * @access Public
 */
router.get('/estados/buscar',
  asyncHandler(UbicacionesController.buscarEstados)
);

/**
 * @route GET /api/v1/ubicaciones/estados/:id
 * @desc Obtiene un estado por ID
 * @access Public
 */
router.get('/estados/:id',
  asyncHandler(UbicacionesController.obtenerEstado)
);

/**
 * @route GET /api/v1/ubicaciones/estados/:estadoId/ciudades
 * @desc Lista ciudades de un estado
 * @query principales - Solo ciudades principales (true/false)
 * @access Public
 */
router.get('/estados/:estadoId/ciudades',
  asyncHandler(UbicacionesController.listarCiudadesPorEstado)
);

// ================================================================
// CIUDADES
// ================================================================

/**
 * @route GET /api/v1/ubicaciones/ciudades/principales
 * @desc Lista ciudades principales de México
 * @query limite - Límite de resultados (default 50)
 * @access Public
 */
router.get('/ciudades/principales',
  asyncHandler(UbicacionesController.listarCiudadesPrincipales)
);

/**
 * @route GET /api/v1/ubicaciones/ciudades/buscar
 * @desc Busca ciudades por nombre (autocomplete)
 * @query q - Texto de búsqueda (min 2 chars)
 * @query estado_id - Filtrar por estado (opcional)
 * @query limite - Límite de resultados (default 15)
 * @access Public
 */
router.get('/ciudades/buscar',
  asyncHandler(UbicacionesController.buscarCiudades)
);

/**
 * @route GET /api/v1/ubicaciones/ciudades/:id
 * @desc Obtiene una ciudad por ID
 * @access Public
 */
router.get('/ciudades/:id',
  asyncHandler(UbicacionesController.obtenerCiudad)
);

/**
 * @route GET /api/v1/ubicaciones/ciudades/:ciudadId/completa
 * @desc Obtiene ubicación completa (ciudad + estado + país)
 * @access Public
 */
router.get('/ciudades/:ciudadId/completa',
  asyncHandler(UbicacionesController.obtenerUbicacionCompleta)
);

// ================================================================
// CÓDIGOS POSTALES
// ================================================================

/**
 * @route GET /api/v1/ubicaciones/codigos-postales/buscar
 * @desc Busca códigos postales (autocomplete)
 * @query q - Código postal (min 3 chars)
 * @query estado_id - Filtrar por estado (opcional)
 * @query limite - Límite de resultados (default 20)
 * @access Public
 */
router.get('/codigos-postales/buscar',
  asyncHandler(UbicacionesController.buscarCodigosPostales)
);

// ================================================================
// UTILIDADES
// ================================================================

/**
 * @route POST /api/v1/ubicaciones/validar
 * @desc Valida que una combinación de ubicación sea consistente
 * @body ciudad_id, estado_id, pais_id
 * @access Public
 */
router.post('/validar',
  asyncHandler(UbicacionesController.validarUbicacion)
);

module.exports = router;
