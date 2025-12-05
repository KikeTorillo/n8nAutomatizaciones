-- ====================================================================
-- MÓDULO EVENTOS DIGITALES - DATOS INICIALES
-- ====================================================================
-- Plantillas de diseño predefinidas para diferentes tipos de eventos
--
-- Fecha creación: 4 Diciembre 2025
-- ====================================================================

-- ====================================================================
-- PLANTILLAS DE EVENTO
-- ====================================================================

INSERT INTO plantillas_evento (codigo, nombre, tipo_evento, descripcion, configuracion_default, es_premium, orden)
VALUES
-- ========== BODAS ==========
(
    'boda-elegante-dorado',
    'Elegante Dorado',
    'boda',
    'Diseño clásico y elegante con acentos dorados. Perfecto para bodas formales.',
    '{
        "colores": {
            "primario": "#1a1a1a",
            "secundario": "#ffffff",
            "acento": "#d4af37",
            "texto": "#333333"
        },
        "tipografia": {
            "titulo": "Playfair Display",
            "cuerpo": "Lato"
        },
        "estilo": "clasico",
        "fondo": "patron-damasco"
    }',
    false,
    1
),
(
    'boda-moderno-minimalista',
    'Moderno Minimalista',
    'boda',
    'Diseño limpio y contemporáneo. Ideal para parejas modernas.',
    '{
        "colores": {
            "primario": "#000000",
            "secundario": "#ffffff",
            "acento": "#e8e8e8",
            "texto": "#333333"
        },
        "tipografia": {
            "titulo": "Montserrat",
            "cuerpo": "Open Sans"
        },
        "estilo": "minimalista",
        "fondo": "solido"
    }',
    false,
    2
),
(
    'boda-romantico-floral',
    'Romántico Floral',
    'boda',
    'Diseño romántico con elementos florales. Transmite calidez y amor.',
    '{
        "colores": {
            "primario": "#8b4557",
            "secundario": "#fff5f5",
            "acento": "#d4a574",
            "texto": "#4a3c3c"
        },
        "tipografia": {
            "titulo": "Great Vibes",
            "cuerpo": "Quicksand"
        },
        "estilo": "romantico",
        "fondo": "flores-acuarela"
    }',
    true,
    3
),
(
    'boda-rustico-natural',
    'Rústico Natural',
    'boda',
    'Estilo campestre y natural. Perfecto para bodas al aire libre.',
    '{
        "colores": {
            "primario": "#5c4033",
            "secundario": "#f5f0e8",
            "acento": "#7d9461",
            "texto": "#3d3d3d"
        },
        "tipografia": {
            "titulo": "Amatic SC",
            "cuerpo": "Josefin Sans"
        },
        "estilo": "rustico",
        "fondo": "madera-textura"
    }',
    false,
    4
),

-- ========== XV AÑOS ==========
(
    'xv-princesa-rosa',
    'Princesa Rosa',
    'xv_anos',
    'Diseño de cuento de hadas en tonos rosa. Clásico para quinceañeras.',
    '{
        "colores": {
            "primario": "#ff69b4",
            "secundario": "#fff0f5",
            "acento": "#ffd700",
            "texto": "#4a4a4a"
        },
        "tipografia": {
            "titulo": "Pinyon Script",
            "cuerpo": "Poppins"
        },
        "estilo": "princesa",
        "fondo": "corona-estrellas"
    }',
    false,
    10
),
(
    'xv-moderno-glam',
    'Moderno Glam',
    'xv_anos',
    'Diseño contemporáneo con toques glamurosos. Para quinceañeras modernas.',
    '{
        "colores": {
            "primario": "#2c2c2c",
            "secundario": "#ffffff",
            "acento": "#c9a227",
            "texto": "#333333"
        },
        "tipografia": {
            "titulo": "Bodoni Moda",
            "cuerpo": "Raleway"
        },
        "estilo": "glam",
        "fondo": "destellos"
    }',
    true,
    11
),

-- ========== BAUTIZOS ==========
(
    'bautizo-angelical',
    'Angelical',
    'bautizo',
    'Diseño tierno con ángeles y tonos celestiales.',
    '{
        "colores": {
            "primario": "#87ceeb",
            "secundario": "#ffffff",
            "acento": "#ffd700",
            "texto": "#4a4a4a"
        },
        "tipografia": {
            "titulo": "Sacramento",
            "cuerpo": "Nunito"
        },
        "estilo": "angelical",
        "fondo": "nubes-suaves"
    }',
    false,
    20
),
(
    'bautizo-tradicional',
    'Tradicional',
    'bautizo',
    'Diseño clásico y elegante para bautizos tradicionales.',
    '{
        "colores": {
            "primario": "#4a6fa5",
            "secundario": "#f8f8f8",
            "acento": "#c9a227",
            "texto": "#333333"
        },
        "tipografia": {
            "titulo": "Cormorant Garamond",
            "cuerpo": "Source Sans Pro"
        },
        "estilo": "tradicional",
        "fondo": "patron-cruz"
    }',
    false,
    21
),

-- ========== CUMPLEAÑOS ==========
(
    'cumple-fiesta-colores',
    'Fiesta de Colores',
    'cumpleanos',
    'Diseño alegre y colorido. Perfecto para cualquier edad.',
    '{
        "colores": {
            "primario": "#ff6b6b",
            "secundario": "#ffffff",
            "acento": "#ffd93d",
            "texto": "#333333"
        },
        "tipografia": {
            "titulo": "Fredoka One",
            "cuerpo": "Nunito"
        },
        "estilo": "festivo",
        "fondo": "confeti"
    }',
    false,
    30
),
(
    'cumple-elegante-adulto',
    'Elegante Adulto',
    'cumpleanos',
    'Diseño sofisticado para cumpleaños de adultos.',
    '{
        "colores": {
            "primario": "#1a1a1a",
            "secundario": "#f5f5f5",
            "acento": "#c9a227",
            "texto": "#333333"
        },
        "tipografia": {
            "titulo": "Playfair Display",
            "cuerpo": "Lato"
        },
        "estilo": "elegante",
        "fondo": "patron-geometrico"
    }',
    false,
    31
),

-- ========== CORPORATIVO ==========
(
    'corp-profesional',
    'Profesional',
    'corporativo',
    'Diseño corporativo limpio y profesional.',
    '{
        "colores": {
            "primario": "#003366",
            "secundario": "#ffffff",
            "acento": "#0066cc",
            "texto": "#333333"
        },
        "tipografia": {
            "titulo": "Roboto",
            "cuerpo": "Open Sans"
        },
        "estilo": "corporativo",
        "fondo": "solido"
    }',
    false,
    40
),
(
    'corp-moderno',
    'Moderno Empresarial',
    'corporativo',
    'Diseño moderno para eventos empresariales.',
    '{
        "colores": {
            "primario": "#2d3436",
            "secundario": "#ffffff",
            "acento": "#00b894",
            "texto": "#2d3436"
        },
        "tipografia": {
            "titulo": "Poppins",
            "cuerpo": "Inter"
        },
        "estilo": "tech",
        "fondo": "gradiente-sutil"
    }',
    true,
    41
),

-- ========== UNIVERSAL ==========
(
    'universal-clasico',
    'Clásico Universal',
    'universal',
    'Diseño versátil que funciona para cualquier tipo de evento.',
    '{
        "colores": {
            "primario": "#333333",
            "secundario": "#ffffff",
            "acento": "#c9a227",
            "texto": "#333333"
        },
        "tipografia": {
            "titulo": "Playfair Display",
            "cuerpo": "Lato"
        },
        "estilo": "clasico",
        "fondo": "solido"
    }',
    false,
    50
)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    configuracion_default = EXCLUDED.configuracion_default,
    es_premium = EXCLUDED.es_premium,
    orden = EXCLUDED.orden,
    actualizado_en = NOW();

-- ====================================================================
-- VERIFICACIÓN
-- ====================================================================
-- SELECT codigo, nombre, tipo_evento, es_premium FROM plantillas_evento ORDER BY orden;
