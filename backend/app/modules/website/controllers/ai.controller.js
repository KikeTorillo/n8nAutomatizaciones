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
const SiteGeneratorService = require('../services/site-generator.service');
const ConfigModel = require('../models/config.model');
const PaginasModel = require('../models/paginas.model');
const BloquesModel = require('../models/bloques.model');
const RLSContextManager = require('../../../utils/rlsContextManager');
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
    circuit_breaker: WebsiteAIService.getCircuitBreakerStatus(),
  });
});

/**
 * Generar sitio web completo desde descripcion
 * POST /api/v1/website/ai/generar-sitio
 *
 * Body:
 * - descripcion: string (requerido) - Descripcion del negocio
 * - nombre: string (requerido) - Nombre del negocio
 * - industria: string (opcional) - Tipo de industria (salon, restaurante, etc.)
 * - estilo: string (opcional) - Estilo visual (moderno, minimalista, oscuro)
 * - aplicar: boolean (opcional) - Si true, crea el sitio en la BD
 */
const generarSitio = asyncHandler(async (req, res) => {
  const { descripcion, nombre, industria, estilo, aplicar } = req.body;
  const orgId = req.user.organizacion_id;
  const userId = req.user.id;

  if (!descripcion || !nombre) {
    ErrorHelper.throwBadRequest('Se requiere descripcion y nombre del negocio');
  }

  // Detectar industria si no se especifica
  const industriaDetectada = industria || SiteGeneratorService.detectarIndustria(descripcion);

  // Generar estructura del sitio
  const sitioGenerado = await SiteGeneratorService.generarSitio({
    descripcion,
    nombre,
    industria: industriaDetectada,
    estilo: estilo || 'moderno',
  });

  // Si aplicar es true, crear el sitio en la BD
  if (aplicar) {
    const sitioCreado = await RLSContextManager.transaction(orgId, async (db) => {
      // Verificar si ya existe un sitio
      const existente = await db.query(
        'SELECT id FROM website_config WHERE organizacion_id = $1 LIMIT 1',
        [orgId]
      );

      if (existente.rows.length > 0) {
        ErrorHelper.throwConflict('Ya existe un sitio web para esta organizacion. Elimina el existente primero.');
      }

      // Crear configuracion
      const configData = {
        ...sitioGenerado.config,
        organizacion_id: orgId,
      };

      const { rows: [config] } = await db.query(
        `INSERT INTO website_config (
          organizacion_id, slug, nombre_sitio, descripcion_seo, keywords_seo,
          color_primario, color_secundario, color_acento, color_fondo, color_texto,
          fuente_titulos, fuente_cuerpo, publicado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false)
        RETURNING *`,
        [
          orgId,
          configData.slug,
          configData.nombre_sitio,
          configData.descripcion_seo,
          configData.keywords_seo,
          configData.color_primario,
          configData.color_secundario,
          configData.color_acento,
          configData.color_fondo,
          configData.color_texto,
          configData.fuente_titulos,
          configData.fuente_cuerpo,
        ]
      );

      // Crear paginas con bloques
      const paginasCreadas = [];

      for (const pagina of sitioGenerado.paginas) {
        const { rows: [paginaCreada] } = await db.query(
          `INSERT INTO website_paginas (
            website_id, slug, titulo, descripcion_seo,
            orden, visible_menu, publicada
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *`,
          [
            config.id,
            pagina.slug,
            pagina.titulo,
            pagina.descripcion_seo,
            pagina.orden,
            pagina.visible_menu,
            true,
          ]
        );

        // Crear bloques de la pagina
        const bloquesCreados = [];
        for (const bloque of pagina.bloques) {
          const { rows: [bloqueCreado] } = await db.query(
            `INSERT INTO website_bloques (
              pagina_id, tipo, contenido, estilos, orden, visible
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
              paginaCreada.id,
              bloque.tipo,
              JSON.stringify(bloque.contenido),
              JSON.stringify(bloque.estilos || {}),
              bloque.orden,
              bloque.visible,
            ]
          );
          bloquesCreados.push(bloqueCreado);
        }

        paginasCreadas.push({
          ...paginaCreada,
          bloques: bloquesCreados,
        });
      }

      return {
        config,
        paginas: paginasCreadas,
      };
    });

    ResponseHelper.created(res, {
      sitio: sitioCreado,
      metadata: sitioGenerado.metadata,
      generado_con_ia: WebsiteAIService.isAvailable(),
      aplicado: true,
    });
  } else {
    // Solo devolver preview sin crear
    ResponseHelper.success(res, {
      preview: sitioGenerado,
      generado_con_ia: WebsiteAIService.isAvailable(),
      aplicado: false,
    });
  }
});

/**
 * Detectar industria desde descripcion
 * POST /api/v1/website/ai/detectar-industria
 */
const detectarIndustria = asyncHandler(async (req, res) => {
  const { descripcion } = req.body;

  if (!descripcion) {
    ErrorHelper.throwBadRequest('Se requiere descripcion');
  }

  const industria = SiteGeneratorService.detectarIndustria(descripcion);

  ResponseHelper.success(res, {
    industria,
    confianza: industria === 'default' ? 'baja' : 'alta',
  });
});

module.exports = {
  generarContenido,
  generarBloque,
  obtenerStatus,
  generarSitio,
  detectarIndustria,
};
