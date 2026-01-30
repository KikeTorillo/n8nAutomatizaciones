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
  const orgId = req.tenant.organizacionId;
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

/**
 * Generar texto con tono personalizado
 * POST /api/v1/website/ai/generar-texto
 *
 * Body:
 * - campo: string (requerido) - Nombre del campo (titulo, descripcion, etc.)
 * - industria: string (opcional) - Tipo de industria
 * - tono: string (requerido) - Tono del texto (profesional, casual, persuasivo, informativo, emotivo)
 * - contexto: object (opcional) - Contexto adicional
 * - longitud: string (opcional) - Longitud del texto (corto, medio, largo)
 */
const generarTextoConTono = asyncHandler(async (req, res) => {
  const { campo, industria, tono, contexto, longitud } = req.body;

  if (!campo) {
    ErrorHelper.throwBadRequest('Se requiere el campo a generar');
  }

  if (!tono) {
    ErrorHelper.throwBadRequest('Se requiere el tono');
  }

  const tonosValidos = ['profesional', 'casual', 'persuasivo', 'informativo', 'emotivo'];
  if (!tonosValidos.includes(tono)) {
    ErrorHelper.throwBadRequest(`Tono invalido. Opciones: ${tonosValidos.join(', ')}`);
  }

  const longitudesValidas = ['corto', 'medio', 'largo'];
  const longitudFinal = longitudesValidas.includes(longitud) ? longitud : 'medio';

  // Mapear longitud a palabras
  const palabrasPorLongitud = {
    corto: '10-20',
    medio: '30-50',
    largo: '70-100',
  };

  // Construir prompt con tono
  const instruccionesTono = {
    profesional: 'Usa un tono formal, corporativo y profesional. Evita jerga coloquial.',
    casual: 'Usa un tono amigable, cercano y conversacional. Conecta con el lector.',
    persuasivo: 'Usa un tono orientado a ventas, con llamadas a la acción. Genera urgencia.',
    informativo: 'Usa un tono educativo y claro. Enfocate en explicar y ensenar.',
    emotivo: 'Usa un tono que conecte emocionalmente. Apela a sentimientos y valores.',
  };

  // Generar texto usando el servicio de IA con instrucciones de tono
  const texto = await WebsiteAIService.generarConTono({
    campo,
    industria: industria || 'default',
    tono,
    instruccionesTono: instruccionesTono[tono],
    palabras: palabrasPorLongitud[longitudFinal],
    contexto: contexto || {},
  });

  ResponseHelper.success(res, {
    texto,
    tono,
    longitud: longitudFinal,
    generado_con_ia: WebsiteAIService.isAvailable(),
  });
});

module.exports = {
  generarContenido,
  generarBloque,
  obtenerStatus,
  generarSitio,
  detectarIndustria,
  generarTextoConTono,
};
