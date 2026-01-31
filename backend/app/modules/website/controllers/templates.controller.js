/**
 * ====================================================================
 * WEBSITE TEMPLATES CONTROLLER
 * ====================================================================
 * Controlador para templates prediseñados de sitios web.
 */

const asyncHandler = require('express-async-handler');
const WebsiteTemplatesModel = require('../models/templates.model');
const WebsiteConfigModel = require('../models/config.model');
const WebsitePaginasModel = require('../models/paginas.model');
const WebsiteBloquesModel = require('../models/bloques.model');
const { ResponseHelper, ErrorHelper } = require('../../../utils/helpers');
const RLSContextManager = require('../../../utils/rlsContextManager');

/**
 * Lista todos los templates disponibles
 * GET /api/v1/website/templates
 */
const listar = asyncHandler(async (req, res) => {
  const organizacionId = req.tenant.organizacionId;
  const { industria, destacados } = req.query;

  const templates = await WebsiteTemplatesModel.listar(organizacionId, {
    industria,
    solo_destacados: destacados === 'true',
  });

  ResponseHelper.success(res, templates);
});

/**
 * Obtiene un template por ID
 * GET /api/v1/website/templates/:id
 */
const obtener = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizacionId = req.tenant.organizacionId;

  const template = await WebsiteTemplatesModel.obtenerPorId(id, organizacionId);

  if (!template) {
    ErrorHelper.throwNotFound('Template no encontrado');
  }

  ResponseHelper.success(res, template);
});

/**
 * Obtiene la estructura de un template (para previsualización)
 * GET /api/v1/website/templates/:id/estructura
 */
const obtenerEstructura = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizacionId = req.tenant.organizacionId;

  const estructura = await WebsiteTemplatesModel.obtenerEstructura(
    id,
    organizacionId
  );

  if (!estructura) {
    ErrorHelper.throwNotFound('Template no encontrado');
  }

  ResponseHelper.success(res, estructura);
});

/**
 * Aplica un template a un sitio existente o crea uno nuevo
 * POST /api/v1/website/templates/:id/aplicar
 */
const aplicar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nombre_sitio, slug, descripcion } = req.body;
  const organizacionId = req.tenant.organizacionId;

  // Obtener template
  const template = await WebsiteTemplatesModel.obtenerPorId(id, organizacionId);
  if (!template) {
    ErrorHelper.throwNotFound('Template no encontrado');
  }

  // Verificar si ya existe un sitio
  const configExistente = await WebsiteConfigModel.obtenerPorOrganizacion(
    organizacionId
  );

  let config;

  await RLSContextManager.transaction(organizacionId, async (db) => {
    // Si no existe sitio, crear uno nuevo
    if (!configExistente) {
      // Generar slug automático si no se proporciona
      const slugFinal = slug || `sitio-${organizacionId}-${Date.now()}`.toLowerCase();

      config = await WebsiteConfigModel.crear(
        {
          nombre_sitio: nombre_sitio || template.nombre,
          slug: slugFinal,
          descripcion: descripcion || template.descripcion,
          ...template.tema_default,
        },
        organizacionId
      );
    } else {
      config = configExistente;

      // Opcionalmente actualizar tema (incluir version para bloqueo optimista)
      if (template.tema_default && Object.keys(template.tema_default).length > 0) {
        await WebsiteConfigModel.actualizar(
          config.id,
          {
            ...template.tema_default,
            version: config.version, // Requerido para bloqueo optimista
          },
          organizacionId
        );
      }

      // Eliminar páginas existentes (y sus bloques en cascada) para reemplazar con el template
      const paginasExistentes = await WebsitePaginasModel.listar(config.id, organizacionId);
      for (const pagina of paginasExistentes) {
        await WebsitePaginasModel.eliminar(pagina.id, organizacionId);
      }
    }

    const estructura = template.estructura;

    // Crear páginas y bloques del template
    if (estructura.paginas && Array.isArray(estructura.paginas)) {
      for (const paginaTemplate of estructura.paginas) {
        // Crear página
        const pagina = await WebsitePaginasModel.crear(
          {
            website_id: config.id,
            slug: paginaTemplate.slug,
            titulo: paginaTemplate.titulo,
            es_inicio: paginaTemplate.es_inicio || false,
            visible_menu: paginaTemplate.visible_menu !== false,
          },
          organizacionId
        );

        // Crear bloques de la página
        const bloquesTemplate =
          estructura.bloques_por_pagina?.[paginaTemplate.slug] || [];

        for (let orden = 0; orden < bloquesTemplate.length; orden++) {
          const bloqueTemplate = bloquesTemplate[orden];

          await WebsiteBloquesModel.crear(
            {
              pagina_id: pagina.id,
              tipo: bloqueTemplate.tipo,
              contenido: bloqueTemplate.contenido || {},
              estilos: bloqueTemplate.estilos || {},
              orden,
            },
            organizacionId
          );
        }
      }
    }

    // Incrementar contador de uso del template
    await WebsiteTemplatesModel.incrementarUso(id);
  });

  // Recargar config con datos actualizados
  const configFinal = await WebsiteConfigModel.obtenerPorOrganizacion(
    organizacionId
  );

  ResponseHelper.success(res, configFinal, 201);
});

/**
 * Lista las industrias disponibles
 * GET /api/v1/website/templates/industrias
 */
const listarIndustrias = asyncHandler(async (req, res) => {
  const industrias = await WebsiteTemplatesModel.listarIndustrias();

  // Agregar labels amigables
  const industriasConLabels = industrias.map((i) => ({
    ...i,
    label: INDUSTRIA_LABELS[i.industria] || i.industria,
  }));

  ResponseHelper.success(res, industriasConLabels);
});

// Labels de industrias
const INDUSTRIA_LABELS = {
  salon: 'Salón de Belleza',
  restaurante: 'Restaurante',
  consultorio: 'Consultorio Médico',
  gym: 'Gimnasio',
  landing: 'Landing Page',
  portfolio: 'Portfolio',
  tienda: 'Tienda',
  agencia: 'Agencia',
};

/**
 * Crea un template personalizado (guarda el sitio actual como template)
 * POST /api/v1/website/templates
 */
const crear = asyncHandler(async (req, res) => {
  const { nombre, descripcion, industria } = req.body;
  const organizacionId = req.tenant.organizacionId;

  // Obtener sitio actual
  const config = await WebsiteConfigModel.obtenerPorOrganizacion(organizacionId);
  if (!config) {
    ErrorHelper.throwBadRequest('No tienes un sitio web para guardar como template');
  }

  // Obtener páginas y bloques
  const paginas = await WebsitePaginasModel.listar(config.id, organizacionId);

  const estructura = {
    paginas: paginas.map((p) => ({
      slug: p.slug,
      titulo: p.titulo,
      es_inicio: p.es_inicio,
      visible_menu: p.visible_menu,
    })),
    bloques_por_pagina: {},
  };

  // Obtener bloques de cada página
  for (const pagina of paginas) {
    const bloques = await WebsiteBloquesModel.listar(pagina.id, organizacionId);
    estructura.bloques_por_pagina[pagina.slug] = bloques.map((b) => ({
      tipo: b.tipo,
      contenido: b.contenido,
      estilos: b.estilos,
    }));
  }

  // Crear template
  const template = await WebsiteTemplatesModel.crear(
    {
      nombre,
      descripcion,
      industria,
      estructura,
      tema_default: {
        color_primario: config.color_primario,
        color_secundario: config.color_secundario,
        color_acento: config.color_acento,
        color_texto: config.color_texto,
        color_fondo: config.color_fondo,
        fuente_titulos: config.fuente_titulos,
        fuente_cuerpo: config.fuente_cuerpo,
      },
    },
    organizacionId
  );

  ResponseHelper.success(res, template, 201);
});

/**
 * Elimina un template personalizado
 * DELETE /api/v1/website/templates/:id
 */
const eliminar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizacionId = req.tenant.organizacionId;

  const eliminado = await WebsiteTemplatesModel.eliminar(id, organizacionId);

  if (!eliminado) {
    ErrorHelper.throwNotFound(
      'Template no encontrado o no puedes eliminarlo'
    );
  }

  ResponseHelper.success(res, { message: 'Template eliminado' });
});

module.exports = {
  listar,
  obtener,
  obtenerEstructura,
  aplicar,
  listarIndustrias,
  crear,
  eliminar,
};
