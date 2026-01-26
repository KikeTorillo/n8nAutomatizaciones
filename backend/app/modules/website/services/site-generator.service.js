/**
 * ====================================================================
 * SITE GENERATOR SERVICE
 * ====================================================================
 * Servicio para generar sitios web completos usando IA.
 * Genera configuracion, paginas y bloques desde un prompt del usuario.
 */

const WebsiteAIService = require('./ai.service');

// Estructura de paginas por industria
const ESTRUCTURAS_INDUSTRIA = {
  salon: {
    paginas: ['inicio', 'servicios', 'galeria', 'nosotros', 'contacto'],
    colores: {
      primario: '#EC4899',
      secundario: '#1F2937',
      acento: '#F59E0B',
    },
    fuentes: {
      titulos: 'Playfair Display',
      cuerpo: 'Inter',
    },
  },
  restaurante: {
    paginas: ['inicio', 'menu', 'galeria', 'nosotros', 'reservas'],
    colores: {
      primario: '#DC2626',
      secundario: '#292524',
      acento: '#F59E0B',
    },
    fuentes: {
      titulos: 'Playfair Display',
      cuerpo: 'Lato',
    },
  },
  consultorio: {
    paginas: ['inicio', 'servicios', 'equipo', 'nosotros', 'contacto'],
    colores: {
      primario: '#0EA5E9',
      secundario: '#1E3A5F',
      acento: '#10B981',
    },
    fuentes: {
      titulos: 'Inter',
      cuerpo: 'Inter',
    },
  },
  gym: {
    paginas: ['inicio', 'programas', 'entrenadores', 'horarios', 'contacto'],
    colores: {
      primario: '#EF4444',
      secundario: '#18181B',
      acento: '#F59E0B',
    },
    fuentes: {
      titulos: 'Oswald',
      cuerpo: 'Inter',
    },
  },
  tienda: {
    paginas: ['inicio', 'productos', 'nosotros', 'faq', 'contacto'],
    colores: {
      primario: '#8B5CF6',
      secundario: '#1F2937',
      acento: '#F59E0B',
    },
    fuentes: {
      titulos: 'Inter',
      cuerpo: 'Inter',
    },
  },
  agencia: {
    paginas: ['inicio', 'servicios', 'portafolio', 'equipo', 'contacto'],
    colores: {
      primario: '#3B82F6',
      secundario: '#0F172A',
      acento: '#F59E0B',
    },
    fuentes: {
      titulos: 'Inter',
      cuerpo: 'Inter',
    },
  },
  default: {
    paginas: ['inicio', 'servicios', 'nosotros', 'contacto'],
    colores: {
      primario: '#753572',
      secundario: '#1F2937',
      acento: '#F59E0B',
    },
    fuentes: {
      titulos: 'Inter',
      cuerpo: 'Inter',
    },
  },
};

// Bloques por tipo de pagina
const BLOQUES_POR_PAGINA = {
  inicio: ['hero', 'servicios', 'testimonios', 'cta', 'footer'],
  servicios: ['hero', 'servicios', 'pricing', 'cta', 'footer'],
  menu: ['hero', 'servicios', 'galeria', 'cta', 'footer'],
  galeria: ['hero', 'galeria', 'cta', 'footer'],
  nosotros: ['hero', 'texto', 'equipo', 'timeline', 'footer'],
  equipo: ['hero', 'equipo', 'testimonios', 'footer'],
  contacto: ['hero', 'contacto', 'faq', 'footer'],
  reservas: ['hero', 'cta', 'contacto', 'footer'],
  portafolio: ['hero', 'galeria', 'testimonios', 'cta', 'footer'],
  productos: ['hero', 'servicios', 'pricing', 'cta', 'footer'],
  programas: ['hero', 'servicios', 'stats', 'pricing', 'cta', 'footer'],
  entrenadores: ['hero', 'equipo', 'testimonios', 'footer'],
  horarios: ['hero', 'texto', 'cta', 'contacto', 'footer'],
  faq: ['hero', 'faq', 'cta', 'footer'],
};

/**
 * Servicio para generar sitios completos
 */
class SiteGeneratorService {
  /**
   * Generar estructura de sitio desde descripcion
   * @param {Object} params
   * @param {string} params.descripcion - Descripcion del negocio
   * @param {string} params.industria - Tipo de industria
   * @param {string} params.estilo - Estilo visual preferido
   * @param {string} params.nombre - Nombre del negocio
   * @returns {Promise<Object>} Estructura completa del sitio
   */
  static async generarSitio({ descripcion, industria = 'default', estilo = 'moderno', nombre }) {
    const estructuraBase = ESTRUCTURAS_INDUSTRIA[industria] || ESTRUCTURAS_INDUSTRIA.default;

    // Generar configuracion del sitio
    const config = await this.generarConfig({
      nombre,
      descripcion,
      industria,
      estilo,
      estructuraBase,
    });

    // Generar paginas con bloques
    const paginas = await this.generarPaginas({
      estructuraBase,
      industria,
      nombre,
      descripcion,
    });

    return {
      config,
      paginas,
      metadata: {
        industria,
        estilo,
        totalPaginas: paginas.length,
        totalBloques: paginas.reduce((acc, p) => acc + p.bloques.length, 0),
        generadoEn: new Date().toISOString(),
      },
    };
  }

  /**
   * Generar configuracion del sitio
   */
  static async generarConfig({ nombre, descripcion, industria, estilo, estructuraBase }) {
    // Generar slug desde nombre
    const slug = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);

    // Ajustar colores segun estilo
    let colores = { ...estructuraBase.colores };
    if (estilo === 'oscuro') {
      colores = {
        ...colores,
        fondo: '#111827',
        texto: '#F9FAFB',
      };
    } else if (estilo === 'minimalista') {
      colores = {
        primario: '#000000',
        secundario: '#6B7280',
        acento: '#000000',
        fondo: '#FFFFFF',
        texto: '#111827',
      };
    }

    return {
      slug,
      nombre_sitio: nombre,
      descripcion_seo: descripcion.slice(0, 160),
      keywords_seo: this.extraerKeywords(descripcion, industria),
      color_primario: colores.primario,
      color_secundario: colores.secundario,
      color_acento: colores.acento,
      color_fondo: colores.fondo || '#FFFFFF',
      color_texto: colores.texto || '#111827',
      fuente_titulos: estructuraBase.fuentes.titulos,
      fuente_cuerpo: estructuraBase.fuentes.cuerpo,
      industria,
    };
  }

  /**
   * Generar paginas con bloques
   */
  static async generarPaginas({ estructuraBase, industria, nombre, descripcion }) {
    const paginas = [];

    for (let i = 0; i < estructuraBase.paginas.length; i++) {
      const tipoPagina = estructuraBase.paginas[i];
      const bloquesTipo = BLOQUES_POR_PAGINA[tipoPagina] || ['hero', 'texto', 'footer'];

      const pagina = {
        slug: tipoPagina === 'inicio' ? 'inicio' : tipoPagina,
        titulo: this.getTituloPagina(tipoPagina),
        descripcion_seo: `${this.getTituloPagina(tipoPagina)} - ${nombre}`,
        orden: i,
        visible_menu: true,
        es_inicio: tipoPagina === 'inicio',
        publicada: true,
        bloques: [],
      };

      // Generar bloques para esta pagina (usar templates para velocidad)
      for (let j = 0; j < bloquesTipo.length; j++) {
        const tipoBloque = bloquesTipo[j];
        // Usar templates directamente para generación rápida
        // La IA se puede usar después para mejorar contenido individual
        const contenido = await WebsiteAIService.generarBloqueCompleto(
          tipoBloque,
          industria,
          { nombre, descripcion, usarTemplates: true }
        );

        pagina.bloques.push({
          tipo: tipoBloque,
          contenido,
          estilos: {},
          orden: j,
          visible: true,
        });
      }

      paginas.push(pagina);
    }

    return paginas;
  }

  /**
   * Obtener titulo de pagina desde tipo
   */
  static getTituloPagina(tipo) {
    const titulos = {
      inicio: 'Inicio',
      servicios: 'Servicios',
      menu: 'Menu',
      galeria: 'Galeria',
      nosotros: 'Nosotros',
      equipo: 'Equipo',
      contacto: 'Contacto',
      reservas: 'Reservas',
      portafolio: 'Portafolio',
      productos: 'Productos',
      programas: 'Programas',
      entrenadores: 'Entrenadores',
      horarios: 'Horarios',
      faq: 'Preguntas Frecuentes',
    };
    return titulos[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1);
  }

  /**
   * Extraer keywords desde descripcion
   */
  static extraerKeywords(descripcion, industria) {
    // Keywords base por industria
    const keywordsBase = {
      salon: 'salon, belleza, cabello, estilista, corte, color',
      restaurante: 'restaurante, comida, cocina, menu, reservas',
      consultorio: 'medico, salud, consulta, doctor, clinica',
      gym: 'gimnasio, fitness, entrenamiento, ejercicio, salud',
      tienda: 'tienda, productos, compras, online',
      agencia: 'agencia, servicios, profesional, proyectos',
      default: 'negocio, servicios, profesional',
    };

    const base = keywordsBase[industria] || keywordsBase.default;

    // Extraer palabras relevantes de la descripcion
    const palabrasDescripcion = descripcion
      .toLowerCase()
      .replace(/[^\w\sáéíóúñ]/g, '')
      .split(/\s+/)
      .filter(p => p.length > 4)
      .slice(0, 5)
      .join(', ');

    return `${base}, ${palabrasDescripcion}`.slice(0, 255);
  }

  /**
   * Detectar industria desde descripcion
   */
  static detectarIndustria(descripcion) {
    const desc = descripcion.toLowerCase();

    const patrones = {
      salon: /salon|peluquer|belleza|cabello|estilis|spa|u[ñn]as|maquilla/,
      restaurante: /restaurante|comida|cocina|chef|gastronom|bar|cafe|menu/,
      consultorio: /medic|doctor|clinica|salud|consultorio|hospital|dental|psicolog/,
      gym: /gym|gimnasio|fitness|entren|ejercicio|deporte|crossfit|yoga/,
      tienda: /tienda|venta|producto|comercio|shop|ecommerce/,
      agencia: /agencia|marketing|dise[ñn]o|publicidad|digital|web|software/,
    };

    for (const [industria, patron] of Object.entries(patrones)) {
      if (patron.test(desc)) {
        return industria;
      }
    }

    return 'default';
  }
}

module.exports = SiteGeneratorService;
