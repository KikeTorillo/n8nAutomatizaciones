/**
 * ====================================================================
 * WEBSITE AI SERVICE
 * ====================================================================
 * Servicio para generación de contenido con IA para el editor de website.
 * Preparado para integración con OpenRouter u otros proveedores LLM.
 *
 * Incluye Circuit Breaker para protección contra fallas:
 * - Timeout: 10 segundos por request
 * - Umbral de fallas: 5 consecutivas abre el circuito
 * - Reset: 30 segundos después intenta de nuevo
 *
 * Fecha creación: 25 Enero 2026
 */

const fetch = require('node-fetch');
const AbortController = require('abort-controller');

// Configuración de OpenRouter (requiere API key)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
// Mismo modelo que el agente de citas de n8n (Qwen3 Flagship 235B)
const DEFAULT_MODEL = 'qwen/qwen3-235b-a22b';

// ====================================================================
// CIRCUIT BREAKER CONFIGURATION
// ====================================================================
const CIRCUIT_BREAKER = {
    /** Timeout en milisegundos para requests a OpenRouter */
    TIMEOUT_MS: 10000,
    /** Número de fallas consecutivas para abrir el circuito */
    FAILURE_THRESHOLD: 5,
    /** Tiempo en ms antes de intentar cerrar el circuito */
    RESET_TIMEOUT_MS: 30000,
    /** Estado actual del circuito */
    state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
    /** Contador de fallas consecutivas */
    failureCount: 0,
    /** Timestamp de cuando se abrió el circuito */
    openedAt: null,
    /** Último error registrado */
    lastError: null
};

/**
 * Verifica si el circuito está abierto
 * @returns {boolean}
 */
function isCircuitOpen() {
    if (CIRCUIT_BREAKER.state === 'OPEN') {
        // Verificar si es tiempo de intentar cerrar
        const now = Date.now();
        if (now - CIRCUIT_BREAKER.openedAt >= CIRCUIT_BREAKER.RESET_TIMEOUT_MS) {
            CIRCUIT_BREAKER.state = 'HALF_OPEN';
            console.log('[WebsiteAIService] Circuit breaker: HALF_OPEN - intentando reconectar');
            return false;
        }
        return true;
    }
    return false;
}

/**
 * Registra una falla en el circuit breaker
 * @param {Error} error
 */
function recordFailure(error) {
    CIRCUIT_BREAKER.failureCount++;
    CIRCUIT_BREAKER.lastError = error.message;

    if (CIRCUIT_BREAKER.failureCount >= CIRCUIT_BREAKER.FAILURE_THRESHOLD) {
        CIRCUIT_BREAKER.state = 'OPEN';
        CIRCUIT_BREAKER.openedAt = Date.now();
        console.warn('[WebsiteAIService] Circuit breaker: OPEN - demasiadas fallas consecutivas', {
            failureCount: CIRCUIT_BREAKER.failureCount,
            lastError: CIRCUIT_BREAKER.lastError
        });
    }
}

/**
 * Registra un éxito y resetea el circuit breaker
 */
function recordSuccess() {
    CIRCUIT_BREAKER.failureCount = 0;
    CIRCUIT_BREAKER.lastError = null;
    if (CIRCUIT_BREAKER.state !== 'CLOSED') {
        console.log('[WebsiteAIService] Circuit breaker: CLOSED - conexión restaurada');
    }
    CIRCUIT_BREAKER.state = 'CLOSED';
}

/**
 * Obtiene el estado actual del circuit breaker
 * @returns {Object}
 */
function getCircuitBreakerStatus() {
    return {
        state: CIRCUIT_BREAKER.state,
        failureCount: CIRCUIT_BREAKER.failureCount,
        lastError: CIRCUIT_BREAKER.lastError,
        openedAt: CIRCUIT_BREAKER.openedAt,
        timeUntilRetry: CIRCUIT_BREAKER.state === 'OPEN'
            ? Math.max(0, CIRCUIT_BREAKER.RESET_TIMEOUT_MS - (Date.now() - CIRCUIT_BREAKER.openedAt))
            : 0
    };
}

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
  pricing: {
    titulo: 'Genera un título (3-5 palabras) para la sección de precios de un {industria}. Solo el título.',
    subtitulo: 'Genera un subtítulo persuasivo (15-25 palabras) para la sección de planes y precios de un {industria}. Solo el subtítulo.',
    plan_nombre: 'Genera un nombre creativo (1-2 palabras) para un plan de precios de un {industria}. Solo el nombre.',
    plan_descripcion: 'Genera una descripción breve (10-15 palabras) para el plan "{plan}" de un {industria}. Solo la descripción.',
  },
  faq: {
    titulo: 'Genera un título (3-5 palabras) para la sección de preguntas frecuentes de un {industria}. Solo el título.',
    subtitulo: 'Genera un subtítulo amigable (15-20 palabras) para la sección de FAQ de un {industria}. Solo el subtítulo.',
    pregunta: 'Genera una pregunta frecuente realista (8-15 palabras) que haría un cliente de un {industria}. Solo la pregunta con signos de interrogación.',
    respuesta: 'Genera una respuesta clara y útil (30-50 palabras) a la pregunta "{pregunta}" para un {industria}. Solo la respuesta.',
  },
  countdown: {
    titulo: 'Genera un título impactante (3-6 palabras) para un contador regresivo de evento/promoción de un {industria}. Solo el título.',
    subtitulo: 'Genera un subtítulo que genere urgencia (15-20 palabras) para un countdown de un {industria}. Solo el subtítulo.',
  },
  stats: {
    titulo: 'Genera un título (3-5 palabras) para la sección de estadísticas/logros de un {industria}. Solo el título.',
    subtitulo: 'Genera un subtítulo (15-20 palabras) para mostrar los números/logros de un {industria}. Solo el subtítulo.',
    stat_titulo: 'Genera un título corto (2-4 palabras) para una estadística de un {industria} con el número {numero}. Solo el título.',
  },
  timeline: {
    titulo: 'Genera un título (3-5 palabras) para la sección de historia/proceso de un {industria}. Solo el título.',
    subtitulo: 'Genera un subtítulo (15-20 palabras) para la línea de tiempo de un {industria}. Solo el subtítulo.',
    evento_titulo: 'Genera un título corto (2-4 palabras) para un hito importante de un {industria}. Solo el título.',
    evento_descripcion: 'Genera una descripción breve (15-25 palabras) para el hito "{evento}" de un {industria}. Solo la descripción.',
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
   * Generar usando OpenRouter con Circuit Breaker
   * @throws {Error} Si el circuito está abierto o la request falla
   */
  static async generarConOpenRouter({ tipo, campo, industria, contexto }) {
    // Verificar estado del circuit breaker
    if (isCircuitOpen()) {
      throw new Error(`Circuit breaker OPEN: servicio de IA temporalmente no disponible. ` +
        `Reintentando en ${Math.ceil(getCircuitBreakerStatus().timeUntilRetry / 1000)}s`);
    }

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

    // Configurar timeout con AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CIRCUIT_BREAKER.TIMEOUT_MS);

    try {
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
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const result = data.choices[0]?.message?.content?.trim() || '';

      // Éxito: resetear circuit breaker
      recordSuccess();

      return result;

    } catch (error) {
      clearTimeout(timeoutId);

      // Manejar timeout específicamente
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout: OpenRouter no respondió en ${CIRCUIT_BREAKER.TIMEOUT_MS / 1000}s`);
        recordFailure(timeoutError);
        throw timeoutError;
      }

      // Registrar falla en circuit breaker
      recordFailure(error);
      throw error;
    }
  }

  /**
   * Obtener estado del circuit breaker (para monitoreo)
   * @returns {Object}
   */
  static getCircuitBreakerStatus() {
    return getCircuitBreakerStatus();
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

    // Si se solicita usar templates directamente (generación masiva), saltar IA
    const usarTemplates = contexto.usarTemplates === true;

    // Si tenemos API y no se fuerza templates, generar con IA
    if (this.isAvailable() && !usarTemplates) {
      try {
        const resultado = await this.generarBloqueConIA(tipo, industria, contexto);
        // Si retorna contenido válido, usarlo; si es null, usar fallback
        if (resultado && Object.keys(resultado).length > 0) {
          return resultado;
        }
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

      case 'pricing':
        return {
          titulo_seccion: 'Nuestros Planes',
          subtitulo_seccion: 'Elige el plan que mejor se adapte a tus necesidades.',
          planes: [
            {
              nombre: 'Básico',
              precio: 29,
              periodo: 'mes',
              descripcion: 'Ideal para comenzar',
              caracteristicas: ['Acceso básico', 'Soporte por email', 'Actualizaciones mensuales'],
              es_popular: false,
              boton_texto: 'Comenzar',
            },
            {
              nombre: 'Profesional',
              precio: 59,
              periodo: 'mes',
              descripcion: 'Para negocios en crecimiento',
              caracteristicas: ['Todo del Básico', 'Soporte prioritario', 'Funciones avanzadas', 'Reportes'],
              es_popular: true,
              boton_texto: 'Elegir Plan',
            },
            {
              nombre: 'Empresarial',
              precio: 99,
              periodo: 'mes',
              descripcion: 'Solución completa',
              caracteristicas: ['Todo del Profesional', 'Soporte 24/7', 'Personalización', 'API completa'],
              es_popular: false,
              boton_texto: 'Contactar',
            },
          ],
        };

      case 'faq':
        return {
          titulo_seccion: 'Preguntas Frecuentes',
          subtitulo_seccion: 'Encuentra respuestas a las dudas más comunes.',
          items: [
            {
              pregunta: '¿Cómo puedo comenzar?',
              respuesta: 'Es muy sencillo. Solo tienes que registrarte y seguir los pasos del proceso de configuración.',
            },
            {
              pregunta: '¿Qué métodos de pago aceptan?',
              respuesta: 'Aceptamos tarjetas de crédito, débito, PayPal y transferencias bancarias.',
            },
            {
              pregunta: '¿Puedo cancelar en cualquier momento?',
              respuesta: 'Sí, puedes cancelar tu suscripción cuando quieras sin penalizaciones.',
            },
          ],
        };

      case 'countdown':
        return {
          titulo: 'Próximamente',
          subtitulo: 'Algo increíble está por llegar. ¡No te lo pierdas!',
          fecha_objetivo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          texto_finalizado: '¡Ya está disponible!',
        };

      case 'stats':
        return {
          titulo_seccion: 'Nuestros Logros',
          subtitulo_seccion: 'Números que hablan por sí solos.',
          items: [
            { numero: 500, sufijo: '+', titulo: 'Clientes', icono: 'users' },
            { numero: 10, sufijo: '', titulo: 'Años', icono: 'calendar' },
            { numero: 1000, sufijo: '+', titulo: 'Proyectos', icono: 'briefcase' },
            { numero: 98, sufijo: '%', titulo: 'Satisfacción', icono: 'star' },
          ],
        };

      case 'timeline':
        return {
          titulo_seccion: 'Nuestra Historia',
          subtitulo_seccion: 'Un recorrido por nuestros momentos más importantes.',
          items: [
            { fecha: '2020', titulo: 'Fundación', descripcion: 'Comenzamos con un sueño.', icono: 'rocket' },
            { fecha: '2021', titulo: 'Crecimiento', descripcion: 'Expandimos nuestro equipo.', icono: 'users' },
            { fecha: '2022', titulo: 'Reconocimiento', descripcion: 'Premio al mejor servicio.', icono: 'award' },
            { fecha: '2023', titulo: 'Expansión', descripcion: 'Nueva sede inaugurada.', icono: 'building' },
          ],
        };

      case 'galeria':
        return {
          titulo_seccion: 'Nuestra Galería',
          subtitulo_seccion: 'Explora nuestro trabajo y proyectos.',
          imagenes: [
            { url: '/placeholder-1.jpg', alt: 'Imagen 1', titulo: 'Proyecto destacado' },
            { url: '/placeholder-2.jpg', alt: 'Imagen 2', titulo: 'Nuestro equipo' },
            { url: '/placeholder-3.jpg', alt: 'Imagen 3', titulo: 'Instalaciones' },
            { url: '/placeholder-4.jpg', alt: 'Imagen 4', titulo: 'Eventos' },
          ],
          columnas: 2,
        };

      case 'video':
        return {
          titulo_seccion: 'Conócenos',
          subtitulo_seccion: 'Mira nuestro video de presentación.',
          video_url: '',
          video_tipo: 'youtube',
          autoplay: false,
          mostrar_controles: true,
        };

      case 'separador':
        return {
          estilo: 'linea',
          altura: 40,
          color: 'inherit',
        };

      case 'equipo':
        return {
          titulo_seccion: 'Nuestro Equipo',
          subtitulo_seccion: 'Conoce a los profesionales que hacen posible nuestro trabajo.',
          miembros: [
            { nombre: 'Juan Pérez', cargo: 'Director General', foto_url: '', bio: 'Más de 15 años de experiencia.' },
            { nombre: 'Ana García', cargo: 'Directora de Operaciones', foto_url: '', bio: 'Experta en gestión empresarial.' },
            { nombre: 'Carlos López', cargo: 'Director Técnico', foto_url: '', bio: 'Especialista en tecnología.' },
          ],
        };

      case 'footer':
        return {
          descripcion: 'Tu socio de confianza. Contáctanos para más información.',
          copyright: `© ${new Date().getFullYear()} ${contexto.nombre || 'Mi Negocio'}. Todos los derechos reservados.`,
          redes_sociales: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: '',
          },
          enlaces: [
            { texto: 'Inicio', url: '/' },
            { texto: 'Servicios', url: '/servicios' },
            { texto: 'Contacto', url: '/contacto' },
          ],
        };

      case 'texto':
        return {
          contenido: 'Este es un bloque de texto. Puedes agregar cualquier contenido aquí.',
          alineacion: 'left',
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

    // Si no hay prompts para este tipo, usar fallback (no lanzar error)
    if (!prompts) {
      return null; // Retornar null para que use el template fallback
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
