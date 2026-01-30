-- ====================================================================
-- MÓDULO WEBSITE: TABLAS PRINCIPALES
-- ====================================================================
-- Permite a cada organización crear su página web pública accesible
-- via nexo.com/sitio/{slug}
--
-- TABLAS (3):
-- • website_config (20 campos) - Configuración general del sitio
-- • website_paginas (10 campos) - Páginas del sitio
-- • website_bloques (8 campos) - Bloques de contenido por página
--
-- CARACTERÍSTICAS:
-- • Constructor drag-and-drop
-- • 16 tipos de bloques: hero, servicios, testimonios, equipo, cta, contacto, footer,
--   texto, galeria, video, separador, pricing, faq, countdown, stats, timeline
-- • Integración con módulos: agendamiento, servicios, profesionales
-- • SEO avanzado (meta tags, Open Graph, schema markup)
-- • Temas personalizables (colores, fuentes)
-- • Soporte multi-idioma
--
-- DEPENDENCIAS:
-- • organizaciones (FK) - Módulo núcleo
--
-- Fecha creación: 6 Diciembre 2025
-- Basado en: docs/PLAN_MODULO_WEBSITE.md
-- ====================================================================

-- ====================================================================
-- TABLA 1/3: website_config
-- ====================================================================
-- Configuración general del sitio web de cada organización.
-- Cada organización puede tener máximo 1 sitio (UNIQUE organizacion_id).
-- ====================================================================

CREATE TABLE IF NOT EXISTS website_config (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER,  -- NULL = sitio de la org, con valor = sitio de sucursal

    -- URL y SEO
    slug VARCHAR(100) UNIQUE NOT NULL,  -- "mi-negocio" para /sitio/mi-negocio
    nombre_sitio VARCHAR(255),
    descripcion_seo VARCHAR(160),  -- Meta description
    keywords_seo TEXT,  -- Keywords separados por coma

    -- Branding
    favicon_url TEXT,
    logo_url TEXT,
    logo_alt VARCHAR(100),

    -- Tema - Colores
    color_primario VARCHAR(7) DEFAULT '#3B82F6',
    color_secundario VARCHAR(7) DEFAULT '#1E40AF',
    color_acento VARCHAR(7) DEFAULT '#F59E0B',
    color_texto VARCHAR(7) DEFAULT '#1F2937',
    color_fondo VARCHAR(7) DEFAULT '#FFFFFF',

    -- Tema - Fuentes (Google Fonts)
    fuente_titulos VARCHAR(100) DEFAULT 'Inter',
    fuente_cuerpo VARCHAR(100) DEFAULT 'Inter',

    -- Redes sociales (para footer/compartir)
    redes_sociales JSONB DEFAULT '{}',  -- {"facebook": "url", "instagram": "@user", ...}

    -- SEO Avanzado (Ene 2026)
    og_image_url TEXT,  -- Imagen para Open Graph
    schema_type VARCHAR(50) DEFAULT 'LocalBusiness',  -- Tipo de schema.org
    schema_datos JSONB DEFAULT '{}',  -- Datos adicionales para schema markup

    -- Multi-idioma (Ene 2026)
    idiomas_activos VARCHAR[] DEFAULT ARRAY['es'],  -- Array de códigos de idioma
    idioma_default VARCHAR(5) DEFAULT 'es',

    -- Estado
    publicado BOOLEAN DEFAULT false,
    fecha_publicacion TIMESTAMP WITH TIME ZONE,

    -- 🗑️ Soft Delete (Dic 2025)
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- Timestamps
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Bloqueo optimista
    version INTEGER NOT NULL DEFAULT 1
);

-- Comentarios
COMMENT ON TABLE website_config IS 'Configuración del sitio web público de cada organización';
COMMENT ON COLUMN website_config.version IS 'Bloqueo optimista - incrementa en cada UPDATE';
COMMENT ON COLUMN website_config.slug IS 'URL amigable: nexo.com/sitio/{slug}';
COMMENT ON COLUMN website_config.publicado IS 'Si es false, el sitio no es accesible públicamente';


-- ====================================================================
-- TABLA 2/3: website_paginas
-- ====================================================================
-- Páginas del sitio web. Cada sitio puede tener múltiples páginas.
-- Páginas por defecto: inicio, servicios, nosotros, contacto
-- ====================================================================

CREATE TABLE IF NOT EXISTS website_paginas (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES website_config(id) ON DELETE CASCADE,

    -- Configuración de página
    slug VARCHAR(100) NOT NULL,  -- "servicios", "nosotros", "contacto" (vacío = inicio)
    titulo VARCHAR(255) NOT NULL,
    descripcion_seo VARCHAR(160),

    -- SEO Avanzado (Ene 2026)
    og_image_url TEXT,  -- Imagen específica de página para Open Graph
    noindex BOOLEAN DEFAULT false,  -- Si true, no indexar en buscadores

    -- Navegación
    orden INTEGER DEFAULT 0,
    visible_menu BOOLEAN DEFAULT true,
    icono VARCHAR(50),  -- Nombre de icono (opcional)

    -- Estado
    publicada BOOLEAN DEFAULT true,

    -- Timestamps
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Bloqueo optimista
    version INTEGER NOT NULL DEFAULT 1,

    -- Restricción: slug único por sitio
    UNIQUE(website_id, slug)
);

-- Comentarios
COMMENT ON TABLE website_paginas IS 'Páginas individuales del sitio web';
COMMENT ON COLUMN website_paginas.version IS 'Bloqueo optimista - incrementa en cada UPDATE';
COMMENT ON COLUMN website_paginas.slug IS 'Ruta de la página. Vacío = página de inicio';
COMMENT ON COLUMN website_paginas.orden IS 'Orden en el menú de navegación';


-- ====================================================================
-- TABLA 3/3: website_bloques
-- ====================================================================
-- Bloques de contenido dentro de cada página.
-- Sistema drag-and-drop: cada bloque puede reordenarse.
-- ====================================================================

CREATE TABLE IF NOT EXISTS website_bloques (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pagina_id UUID NOT NULL REFERENCES website_paginas(id) ON DELETE CASCADE,

    -- Tipo de bloque
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
        'hero',
        'servicios',
        'testimonios',
        'equipo',
        'cta',
        'contacto',
        'footer',
        'texto',
        'galeria',
        'video',
        'separador',
        'pricing',
        'faq',
        'countdown',
        'stats',
        'timeline'
    )),

    -- Contenido (estructura depende del tipo)
    contenido JSONB NOT NULL DEFAULT '{}',

    -- Estilos personalizados (override del tema)
    estilos JSONB DEFAULT '{}',

    -- Orden y visibilidad
    orden INTEGER DEFAULT 0,
    visible BOOLEAN DEFAULT true,

    -- Timestamps
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Bloqueo optimista
    version INTEGER NOT NULL DEFAULT 1
);

-- Comentarios
COMMENT ON TABLE website_bloques IS 'Bloques de contenido arrastrables dentro de cada página';
COMMENT ON COLUMN website_bloques.version IS 'Bloqueo optimista - incrementa en cada UPDATE';
COMMENT ON COLUMN website_bloques.tipo IS 'Tipo de bloque: hero, servicios, testimonios, equipo, cta, contacto, footer, etc.';
COMMENT ON COLUMN website_bloques.contenido IS 'Contenido del bloque en formato JSON. Estructura varía según el tipo.';
COMMENT ON COLUMN website_bloques.estilos IS 'Estilos CSS personalizados que sobreescriben el tema';


-- ====================================================================
-- DOCUMENTACIÓN: Estructura de contenido JSONB por tipo de bloque
-- ====================================================================
/*
HERO:
{
  "titulo": "Bienvenido a Mi Negocio",
  "subtitulo": "Los mejores servicios",
  "imagen_url": "https://...",
  "imagen_overlay": 0.5,
  "alineacion": "center",  -- left, center, right
  "boton_texto": "Agendar Cita",
  "boton_url": "#contacto",
  "boton_tipo": "agendar"  -- agendar, link, whatsapp
}

SERVICIOS:
{
  "titulo_seccion": "Nuestros Servicios",
  "subtitulo_seccion": "Lo que ofrecemos",
  "columnas": 3,  -- 2, 3, 4
  "origen": "manual",  -- manual, modulo
  "mostrar_precio": true,
  "items": [
    {
      "icono": "scissors",
      "titulo": "Corte de cabello",
      "descripcion": "...",
      "precio": 150,
      "imagen_url": "..."
    }
  ]
}

TESTIMONIOS:
{
  "titulo_seccion": "Lo que dicen nuestros clientes",
  "origen": "manual",  -- manual, resenas (del marketplace)
  "layout": "carousel",  -- carousel, grid
  "items": [
    {
      "foto_url": "https://...",
      "nombre": "Juan Pérez",
      "texto": "Excelente servicio...",
      "rating": 5
    }
  ]
}

EQUIPO:
{
  "titulo_seccion": "Nuestro Equipo",
  "origen": "manual",  -- manual, profesionales
  "layout": "grid",
  "mostrar_redes": true,
  "items": [
    {
      "foto_url": "...",
      "nombre": "María García",
      "cargo": "Estilista Senior",
      "descripcion": "...",
      "redes": {"instagram": "@maria"}
    }
  ]
}

CTA:
{
  "titulo": "¿Listo para agendar?",
  "descripcion": "Reserva tu cita en minutos",
  "boton_texto": "Agendar Ahora",
  "boton_tipo": "agendar",
  "boton_url": "",
  "fondo_tipo": "color",  -- color, imagen, gradiente
  "fondo_valor": "#3B82F6"
}

CONTACTO:
{
  "titulo_seccion": "Contáctanos",
  "mostrar_formulario": true,
  "campos_formulario": ["nombre", "email", "telefono", "mensaje"],
  "mostrar_info": true,
  "telefono": "+52 55 1234 5678",
  "email": "contacto@minegocio.com",
  "direccion": "Calle Principal #123",
  "mostrar_mapa": true,
  "coordenadas": {"lat": 19.4326, "lng": -99.1332},
  "horarios": "Lun-Vie 9:00-18:00"
}

FOOTER:
{
  "logo_url": "...",
  "descripcion": "Tu negocio de confianza",
  "columnas": [
    {
      "titulo": "Enlaces",
      "links": [
        {"texto": "Inicio", "url": "/"},
        {"texto": "Servicios", "url": "/servicios"}
      ]
    }
  ],
  "mostrar_redes": true,
  "copyright": "© 2025 Mi Negocio. Todos los derechos reservados."
}

TEXTO:
{
  "contenido": "<p>Texto HTML aquí...</p>",
  "alineacion": "left"
}

GALERIA:
{
  "titulo_seccion": "Nuestros Trabajos",
  "layout": "grid",  -- grid, masonry, carousel
  "columnas": 3,
  "imagenes": [
    {"url": "...", "alt": "Descripción", "caption": "..."}
  ]
}

VIDEO:
{
  "titulo_seccion": "Conócenos",
  "tipo": "youtube",  -- youtube, vimeo, mp4
  "url": "https://youtube.com/...",
  "autoplay": false,
  "mostrar_controles": true
}

SEPARADOR:
{
  "tipo": "linea",  -- linea, espacio, ondas
  "altura": 50,
  "color": "#E5E7EB"
}

PRICING:
{
  "titulo_seccion": "Nuestros Planes",
  "subtitulo_seccion": "Elige el plan perfecto para ti",
  "columnas": 3,
  "mostrar_popular": true,
  "moneda": "USD",
  "mostrar_toggle_anual": false,
  "descuento_anual": 20,
  "planes": [
    {
      "nombre": "Básico",
      "precio": 29,
      "periodo": "mes",
      "descripcion": "Ideal para empezar",
      "caracteristicas": ["Feature 1", "Feature 2"],
      "es_popular": false,
      "boton_texto": "Comenzar",
      "boton_url": "#contacto"
    }
  ]
}

FAQ:
{
  "titulo_seccion": "Preguntas Frecuentes",
  "subtitulo_seccion": "Encuentra respuestas",
  "layout": "accordion",
  "permitir_multiple": false,
  "items": [
    {
      "pregunta": "¿Cómo puedo agendar?",
      "respuesta": "Puedes agendar fácilmente..."
    }
  ]
}

COUNTDOWN:
{
  "titulo": "Gran Inauguración",
  "subtitulo": "No te lo pierdas",
  "fecha_objetivo": "2026-02-01T00:00:00Z",
  "mostrar_dias": true,
  "mostrar_horas": true,
  "mostrar_minutos": true,
  "mostrar_segundos": true,
  "texto_finalizado": "¡El evento ha comenzado!",
  "accion_finalizado": "ocultar",  -- ocultar, mostrar_mensaje
  "fondo_tipo": "color",
  "fondo_valor": "#1F2937",
  "color_texto": "#FFFFFF",
  "boton_texto": "Registrarse",
  "boton_url": "#contacto"
}

STATS:
{
  "titulo_seccion": "Nuestros Números",
  "subtitulo_seccion": "Lo que hemos logrado",
  "columnas": 4,
  "animar": true,
  "duracion_animacion": 2000,
  "items": [
    {
      "numero": 500,
      "sufijo": "+",
      "prefijo": "",
      "titulo": "Clientes Satisfechos",
      "icono": "users"
    }
  ]
}

TIMELINE:
{
  "titulo_seccion": "Nuestra Historia",
  "subtitulo_seccion": "Un recorrido por nuestros logros",
  "layout": "alternado",  -- izquierda, derecha, alternado
  "mostrar_linea": true,
  "color_linea": "#3B82F6",
  "items": [
    {
      "fecha": "2020",
      "titulo": "Fundación",
      "descripcion": "Comenzamos nuestra aventura",
      "icono": "rocket"
    }
  ]
}
*/
