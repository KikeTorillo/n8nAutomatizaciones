/**
 * ====================================================================
 * WEBSITE AI CONTROLLER
 * ====================================================================
 * Controlador para endpoints de generación de contenido con IA.
 *
 * Fecha creación: 25 Enero 2026
 */

const asyncHandler = require('express-async-handler');
const WebsiteAIService = require('../services/ai.service');
const { ResponseHelper, ErrorHelper } = require('../../../utils/helpers');

/**
 * Generar contenido para un campo específico
 * POST /api/v1/website/ai/generar
 */
const generarContenido = asyncHandler(async (req, res) => {
  const { tipo, campo, industria, contexto } = req.body;

  if (!tipo || !campo) {
    ErrorHelper.throwBadRequest('Se requiere tipo y campo');
  }

  const contenido = await WebsiteAIService.generarContenido({
    tipo,
    campo,
    industria: industria || 'default',
    contexto: contexto || {},
  });

  ResponseHelper.success(res, {
    contenido,
    generado_con_ia: WebsiteAIService.isAvailable(),
  });
});

/**
 * Generar contenido completo para un bloque
 * POST /api/v1/website/ai/generar-bloque
 */
const generarBloque = asyncHandler(async (req, res) => {
  const { tipo, industria, contexto } = req.body;

  if (!tipo) {
    ErrorHelper.throwBadRequest('Se requiere el tipo de bloque');
  }

  const contenido = await WebsiteAIService.generarBloqueCompleto(
    tipo,
    industria || 'default',
    contexto || {}
  );

  ResponseHelper.success(res, {
    contenido,
    generado_con_ia: WebsiteAIService.isAvailable(),
  });
});

/**
 * Verificar disponibilidad del servicio de IA
 * GET /api/v1/website/ai/status
 */
const obtenerStatus = asyncHandler(async (req, res) => {
  ResponseHelper.success(res, {
    disponible: WebsiteAIService.isAvailable(),
    proveedor: WebsiteAIService.isAvailable() ? 'openrouter' : 'templates',
  });
});

module.exports = {
  generarContenido,
  generarBloque,
  obtenerStatus,
};
