/**
 * ====================================================================
 * WEBSITE AI SERVICE
 * ====================================================================
 * Servicio para generación de contenido con IA para el editor de website.
 * Preparado para integración con OpenRouter u otros proveedores LLM.
 *
 * Fecha creación: 25 Enero 2026
 */

const fetch = require('node-fetch');

// Configuración de OpenRouter (requiere API key)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'anthropic/claude-3-haiku';

// Prompts optimizados por tipo de bloque
const PROMPTS_POR_TIPO = {
  hero: {
    titulo: 'Genera un título corto (máximo 8 palabras) impactante y profesional para la sección principal de un sitio web de {industria}. Solo devuelve el título, sin comillas ni explicaciones.',
    subtitulo: 'Genera un subtítulo persuasivo (máximo 20 palabras) para un sitio web de {industria} que complemente el título "{titulo}". Solo devuelve el subtítulo, sin comillas.',
    boton: 'Genera un texto corto (2-4 palabras) para el botón de llamada a la acción de un {industria}. Ejemplos: "Agendar Cita", "Conocer Más", "Contactar Ahora". Solo devuelve el texto.',
  },
  servicios: {
    titulo: 'Genera un título (3-5 palabras) para la sección de servicios de un {industria}. Solo el título, sin comillas.',
    servicio_nombre: 'Genera un nombre corto (2-4 palabras) para un servicio típico de un {industria}. Solo el nombre.',
    servicio_descripcion: 'Genera una descripción breve (15-25 palabras) para el servicio "{servicio}" de un {industria}. Solo la descripción.',
  },
  testimonios: {
    titulo: 'Genera un título (3-6 palabras) para la sección de testimonios de un {industria}. Solo el título.',
    testimonio: 'Genera un testimonio realista y positivo (30-50 palabras) de un cliente satisfecho de un {industria}. Incluye el nombre del cliente ficticio al final entre paréntesis.',
  },
  equipo: {
    titulo: 'Genera un título (3-5 palabras) para la sección de equipo de un {industria}. Solo el título.',
    cargo: 'Genera un cargo profesional (2-4 palabras) para un miembro del equipo de un {industria}. Solo el cargo.',
    bio: 'Genera una biografía breve (20-30 palabras) para un {cargo} de un {industria}. Solo la biografía.',
  },
  cta: {
    titulo: 'Genera un título persuasivo (5-10 palabras) para una sección de llamada a la acción de un {industria}. Debe motivar al visitante. Solo el título.',
    subtitulo: 'Genera un subtítulo que complemente "{titulo}" (15-25 palabras) explicando el beneficio de contactar. Solo el subtítulo.',
    boton: 'Genera un texto de botón (2-4 palabras) para una llamada a la acción de un {industria}. Solo el texto.',
  },
  contacto: {
    titulo: 'Genera un título (3-5 palabras) para la sección de contacto de un {industria}. Solo el título.',
    subtitulo: 'Genera un subtítulo amigable (15-25 palabras) invitando a contactar al {industria}. Solo el subtítulo.',
  },
  footer: {
    descripcion: 'Genera una descripción breve (20-30 palabras) para el pie de página de un {industria}. Incluye la propuesta de valor. Solo la descripción.',
    copyright: 'Genera un texto de copyright profesional para un {industria} llamado "{nombre}". Incluye el año 2026. Solo el texto.',
  },
  texto: {
    contenido: 'Genera un párrafo de contenido (50-80 palabras) sobre {tema} para un {industria}. Estilo profesional pero accesible. Solo el párrafo.',
  },
};

// Templates de contenido por industria (fallback cuando no hay API)
const TEMPLATES_CONTENIDO = {
  salon: {
    hero: {
      titulo: 'Realza Tu Belleza Natural',
      subtitulo: 'Expertos en cuidado capilar y tratamientos de belleza personalizados para ti.',
      boton_texto: 'Agendar Cita',
    },
    servicios: {
      titulo: 'Nuestros Servicios',
      items: [
        { nombre: 'Corte y Peinado', descripcion: 'Estilos modernos adaptados a tu personalidad y estilo de vida.' },
        { nombre: 'Colorimetría', descripcion: 'Tonos vibrantes y naturales aplicados por profesionales certificados.' },
        { nombre: 'Tratamientos Capilares', descripcion: 'Hidratación profunda y reparación para un cabello saludable.' },
        { nombre: 'Manicure y Pedicure', descripcion: 'Cuidado profesional de manos y pies con técnicas premium.' },
      ],
    },
  },
  restaurante: {
    hero: {
      titulo: 'Sabores que Conquistan',
      subtitulo: 'Descubre nuestra cocina artesanal con ingredientes frescos y de temporada.',
      boton_texto: 'Ver Menú',
    },
    servicios: {
      titulo: 'Nuestra Carta',
      items: [
        { nombre: 'Entradas', descripcion: 'Deliciosos aperitivos para comenzar tu experiencia gastronómica.' },
        { nombre: 'Platos Principales', descripcion: 'Especialidades de la casa preparadas con pasión y tradición.' },
        { nombre: 'Postres', descripcion: 'Creaciones dulces que endulzarán tu paladar.' },
        { nombre: 'Bebidas', descripcion: 'Selección de vinos, cocteles y bebidas artesanales.' },
      ],
    },
  },
  consultorio: {
    hero: {
      titulo: 'Tu Salud, Nuestra Prioridad',
      subtitulo: 'Atención médica de calidad con un equipo comprometido con tu bienestar.',
      boton_texto: 'Agendar Consulta',
    },
    servicios: {
      titulo: 'Especialidades',
      items: [
        { nombre: 'Medicina General', descripcion: 'Evaluaciones integrales y seguimiento de tu salud.' },
        { nombre: 'Consultas Especializadas', descripcion: 'Atención con especialistas de primer nivel.' },
        { nombre: 'Exámenes de Laboratorio', descripcion: 'Resultados precisos con tecnología de punta.' },
        { nombre: 'Telemedicina', descripcion: 'Consultas virtuales desde la comodidad de tu hogar.' },
      ],
    },
  },
  gym: {
    hero: {
      titulo: 'Transforma Tu Cuerpo',
      subtitulo: 'Entrena con los mejores equipos y entrenadores certificados.',
      boton_texto: 'Prueba Gratis',
    },
    servicios: {
      titulo: 'Programas',
      items: [
        { nombre: 'Entrenamiento Personal', descripcion: 'Planes personalizados según tus objetivos.' },
        { nombre: 'Clases Grupales', descripcion: 'Spinning, yoga, HIIT y más actividades.' },
        { nombre: 'Área de Pesas', descripcion: 'Equipamiento de última generación.' },
        { nombre: 'Nutrición', descripcion: 'Asesoría nutricional para complementar tu entrenamiento.' },
      ],
    },
  },
  // Default para cualquier industria
  default: {
    hero: {
      titulo: 'Bienvenido a Nuestro Negocio',
      subtitulo: 'Ofrecemos soluciones de calidad adaptadas a tus necesidades.',
      boton_texto: 'Contáctanos',
    },
    servicios: {
      titulo: 'Nuestros Servicios',
      items: [
        { nombre: 'Servicio Premium', descripcion: 'Soluciones de alta calidad para tus necesidades.' },
        { nombre: 'Asesoría Personalizada', descripcion: 'Te acompañamos en cada paso del proceso.' },
        { nombre: 'Soporte Continuo', descripcion: 'Estamos aquí cuando nos necesitas.' },
        { nombre: 'Garantía de Satisfacción', descripcion: 'Tu satisfacción es nuestra prioridad.' },
      ],
    },
  },
};

/**
 * Servicio de generación con IA
 */
class WebsiteAIService {
  /**
   * Verificar si la API de IA está disponible
   */
  static isAvailable() {
    return !!OPENROUTER_API_KEY;
  }

  /**
   * Generar contenido usando IA o fallback
   * @param {Object} params
   * @param {string} params.tipo - Tipo de bloque (hero, servicios, etc.)
   * @param {string} params.campo - Campo específico a generar
   * @param {string} params.industria - Industria del negocio
   * @param {Object} params.contexto - Contexto adicional
   * @returns {Promise<string>}
   */
  static async generarContenido({ tipo, campo, industria = 'default', contexto = {} }) {
    // Si tenemos API key, usar OpenRouter
    if (this.isAvailable()) {
      try {
        return await this.generarConOpenRouter({ tipo, campo, industria, contexto });
      } catch (error) {
        console.warn('[WebsiteAIService] Error con OpenRouter, usando fallback:', error.message);
      }
    }

    // Fallback: usar templates predefinidos
    return this.obtenerTemplateFallback({ tipo, campo, industria, contexto });
  }

  /**
   * Generar usando OpenRouter
   */
  static async generarConOpenRouter({ tipo, campo, industria, contexto }) {
    const promptTemplate = PROMPTS_POR_TIPO[tipo]?.[campo];
    if (!promptTemplate) {
      throw new Error(`No hay prompt para ${tipo}.${campo}`);
    }

    // Reemplazar variables en el prompt
    let prompt = promptTemplate
      .replace(/{industria}/g, industria)
      .replace(/{nombre}/g, contexto.nombre || 'Mi Negocio')
      .replace(/{titulo}/g, contexto.titulo || '')
      .replace(/{servicio}/g, contexto.servicio || '')
      .replace(/{cargo}/g, contexto.cargo || '')
      .replace(/{tema}/g, contexto.tema || 'nuestros servicios');

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://nexo.com',
        'X-Title': 'Nexo Website Editor',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en copywriting y marketing digital. Generas contenido conciso, profesional y persuasivo para sitios web de negocios. Responde SOLO con el texto solicitado, sin explicaciones adicionales.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  }

  /**
   * Obtener contenido de templates predefinidos
   */
  static obtenerTemplateFallback({ tipo, campo, industria, contexto }) {
    const industriaKey = TEMPLATES_CONTENIDO[industria] ? industria : 'default';
    const template = TEMPLATES_CONTENIDO[industriaKey];

    // Navegar al contenido específico
    if (tipo === 'hero') {
      return template.hero?.[campo] || template.hero?.titulo || '';
    }

    if (tipo === 'servicios') {
      if (campo === 'titulo') {
        return template.servicios?.titulo || 'Nuestros Servicios';
      }
      // Para items individuales
      return template.servicios?.items || [];
    }

    // Fallback genérico
    return contexto.default || '';
  }

  /**
   * Generar contenido completo para un bloque
   * @param {string} tipo - Tipo de bloque
   * @param {string} industria - Industria del negocio
   * @param {Object} contexto - Contexto adicional
   * @returns {Promise<Object>}
   */
  static async generarBloqueCompleto(tipo, industria = 'default', contexto = {}) {
    const industriaKey = TEMPLATES_CONTENIDO[industria] ? industria : 'default';
    const template = TEMPLATES_CONTENIDO[industriaKey];

    // Si tenemos API, generar con IA
    if (this.isAvailable()) {
      try {
        return await this.generarBloqueConIA(tipo, industria, contexto);
      } catch (error) {
        console.warn('[WebsiteAIService] Error generando bloque con IA:', error.message);
      }
    }

    // Fallback: usar template
    switch (tipo) {
      case 'hero':
        return {
          titulo: template.hero?.titulo || 'Bienvenido',
          subtitulo: template.hero?.subtitulo || 'Tu mensaje aquí',
          boton_texto: template.hero?.boton_texto || 'Contactar',
          boton_url: '#contacto',
        };

      case 'servicios':
        return {
          titulo: template.servicios?.titulo || 'Servicios',
          items: template.servicios?.items || [],
        };

      case 'testimonios':
        return {
          titulo: 'Lo que dicen nuestros clientes',
          items: [
            {
              texto: 'Excelente servicio, muy profesionales y atentos. Lo recomiendo ampliamente.',
              autor: 'María García',
              cargo: 'Cliente satisfecha',
            },
            {
              texto: 'Superaron mis expectativas. Definitivamente volveré.',
              autor: 'Carlos López',
              cargo: 'Cliente frecuente',
            },
          ],
        };

      case 'cta':
        return {
          titulo: '¿Listo para comenzar?',
          subtitulo: 'Contáctanos hoy y descubre cómo podemos ayudarte.',
          boton_texto: 'Contactar Ahora',
          boton_url: '#contacto',
        };

      case 'contacto':
        return {
          titulo: 'Contáctanos',
          subtitulo: 'Estamos aquí para ayudarte. Envíanos un mensaje.',
        };

      default:
        return {
          titulo: 'Título del bloque',
          contenido: 'Contenido del bloque.',
        };
    }
  }

  /**
   * Generar bloque completo usando IA
   */
  static async generarBloqueConIA(tipo, industria, contexto) {
    const contenido = {};
    const prompts = PROMPTS_POR_TIPO[tipo];

    if (!prompts) {
      throw new Error(`No hay prompts para tipo ${tipo}`);
    }

    // Generar cada campo en paralelo
    const campos = Object.keys(prompts);
    const resultados = await Promise.all(
      campos.map(async (campo) => {
        try {
          const valor = await this.generarConOpenRouter({
            tipo,
            campo,
            industria,
            contexto,
          });
          return { campo, valor };
        } catch (error) {
          return { campo, valor: null };
        }
      })
    );

    // Combinar resultados
    for (const { campo, valor } of resultados) {
      if (valor) {
        contenido[campo] = valor;
      }
    }

    return contenido;
  }
}

module.exports = WebsiteAIService;
