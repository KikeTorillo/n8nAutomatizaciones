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

INSERT INTO plantillas_evento (codigo, nombre, tipo_evento, descripcion, tema, es_premium, orden)
VALUES
-- ========== BODAS ==========
(
    'boda-elegante-dorado',
    'Elegante Dorado',
    'boda',
    'Diseño clásico y elegante con acentos dorados. Perfecto para bodas formales.',
    '{
        "color_primario": "#d4af37",
        "color_secundario": "#1a1a1a",
        "color_fondo": "#ffffff",
        "color_texto": "#333333",
        "color_texto_claro": "#666666",
        "fuente_titulo": "Playfair Display",
        "fuente_cuerpo": "Lato"
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
        "color_primario": "#000000",
        "color_secundario": "#e8e8e8",
        "color_fondo": "#ffffff",
        "color_texto": "#333333",
        "color_texto_claro": "#888888",
        "fuente_titulo": "Montserrat",
        "fuente_cuerpo": "Open Sans"
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
        "color_primario": "#8b4557",
        "color_secundario": "#d4a574",
        "color_fondo": "#fff5f5",
        "color_texto": "#4a3c3c",
        "color_texto_claro": "#7a6a6a",
        "fuente_titulo": "Great Vibes",
        "fuente_cuerpo": "Quicksand"
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
        "color_primario": "#8b5a2b",
        "color_secundario": "#f5f0e6",
        "color_fondo": "#faf8f5",
        "color_texto": "#3e3e3e",
        "color_texto_claro": "#6b6b6b",
        "fuente_titulo": "Amatic SC",
        "fuente_cuerpo": "Roboto"
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
        "color_primario": "#ff69b4",
        "color_secundario": "#ffd700",
        "color_fondo": "#fff0f5",
        "color_texto": "#4a4a4a",
        "color_texto_claro": "#888888",
        "fuente_titulo": "Pinyon Script",
        "fuente_cuerpo": "Poppins"
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
        "color_primario": "#c9a227",
        "color_secundario": "#2c2c2c",
        "color_fondo": "#ffffff",
        "color_texto": "#333333",
        "color_texto_claro": "#666666",
        "fuente_titulo": "Bodoni Moda",
        "fuente_cuerpo": "Raleway"
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
        "color_primario": "#87ceeb",
        "color_secundario": "#ffd700",
        "color_fondo": "#ffffff",
        "color_texto": "#4a4a4a",
        "color_texto_claro": "#888888",
        "fuente_titulo": "Sacramento",
        "fuente_cuerpo": "Nunito"
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
        "color_primario": "#4a6fa5",
        "color_secundario": "#c9a227",
        "color_fondo": "#f8f8f8",
        "color_texto": "#333333",
        "color_texto_claro": "#666666",
        "fuente_titulo": "Cormorant Garamond",
        "fuente_cuerpo": "Source Sans Pro"
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
        "color_primario": "#ff6b6b",
        "color_secundario": "#ffd93d",
        "color_fondo": "#ffffff",
        "color_texto": "#333333",
        "color_texto_claro": "#666666",
        "fuente_titulo": "Fredoka One",
        "fuente_cuerpo": "Nunito"
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
        "color_primario": "#c9a227",
        "color_secundario": "#1a1a1a",
        "color_fondo": "#f5f5f5",
        "color_texto": "#333333",
        "color_texto_claro": "#666666",
        "fuente_titulo": "Playfair Display",
        "fuente_cuerpo": "Lato"
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
        "color_primario": "#003366",
        "color_secundario": "#0066cc",
        "color_fondo": "#ffffff",
        "color_texto": "#333333",
        "color_texto_claro": "#666666",
        "fuente_titulo": "Roboto",
        "fuente_cuerpo": "Open Sans"
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
        "color_primario": "#00b894",
        "color_secundario": "#2d3436",
        "color_fondo": "#ffffff",
        "color_texto": "#2d3436",
        "color_texto_claro": "#636e72",
        "fuente_titulo": "Poppins",
        "fuente_cuerpo": "Inter"
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
        "color_primario": "#c9a227",
        "color_secundario": "#333333",
        "color_fondo": "#ffffff",
        "color_texto": "#333333",
        "color_texto_claro": "#666666",
        "fuente_titulo": "Playfair Display",
        "fuente_cuerpo": "Lato"
    }',
    false,
    50
)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    es_premium = EXCLUDED.es_premium,
    orden = EXCLUDED.orden,
    actualizado_en = NOW();

-- ====================================================================
-- VERIFICACIÓN
-- ====================================================================
-- SELECT codigo, nombre, tipo_evento, es_premium FROM plantillas_evento ORDER BY orden;
