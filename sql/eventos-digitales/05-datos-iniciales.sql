-- ====================================================================
-- MÓDULO EVENTOS DIGITALES - DATOS INICIALES
-- ====================================================================
-- Plantillas de ejemplo para eventos
-- Las plantillas se crean una por una con personalidad propia
--
-- Fecha creación: 4 Diciembre 2025
-- Actualizado: 14 Diciembre 2025 - Reset para plantillas personalizadas
-- ====================================================================

-- ====================================================================
-- PLANTILLA: GUERRERAS K-POP (HUNTR/X)
-- ====================================================================
-- Inspirada en la película de Netflix "K-Pop Demon Hunters" (2025)
-- Grupo HUNTR/X: Rumi, Mira, Zoey - Cazadoras de demonios y estrellas del pop
-- ====================================================================

INSERT INTO plantillas_evento (
    codigo,
    nombre,
    tipo_evento,
    categoria,
    subcategoria,
    descripcion,
    tema,
    es_premium,
    orden
) VALUES (
    'cumple-guerreras-kpop',
    'Guerreras K-Pop (HUNTR/X)',
    'cumpleanos',
    'infantil',
    'kpop',
    'Inspirada en Las Guerreras K-pop de Netflix. Estilo HUNTR/X con colores neón, morado y rosa. ¡Cazadoras de demonios y estrellas del pop!',
    '{
        "color_primario": "#9b30ff",
        "color_secundario": "#ff1493",
        "color_fondo": "#0a0a14",
        "color_texto": "#ffffff",
        "color_texto_claro": "#e0b0ff",
        "fuente_titulo": "Bangers",
        "fuente_cuerpo": "Poppins",
        "patron_fondo": "stars",
        "patron_opacidad": 0.25,
        "decoracion_esquinas": "estrellas",
        "icono_principal": "star",
        "animacion_entrada": "zoom",
        "efecto_titulo": "glow",
        "marco_fotos": "neon",
        "stickers": ["💜", "🎤", "✨", "⚔️", "👑", "🔮"],
        "imagen_fondo": null
    }',
    false,
    1
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema;

-- ====================================================================
-- PLANTILLA: SUPER MARIO BROS
-- ====================================================================
-- Inspirada en el icónico videojuego de Nintendo
-- Colores vibrantes, hongos, estrellas y monedas
-- ====================================================================

INSERT INTO plantillas_evento (
    codigo,
    nombre,
    tipo_evento,
    categoria,
    subcategoria,
    descripcion,
    tema,
    es_premium,
    orden
) VALUES (
    'cumple-mario-bros',
    'Super Mario Bros',
    'cumpleanos',
    'infantil',
    'superheroes',
    '¡It''s-a me, Mario! Plantilla inspirada en el mundo de Super Mario Bros con colores vibrantes, estrellas y hongos. ¡Lets-a go!',
    '{
        "color_primario": "#e52521",
        "color_secundario": "#fbd000",
        "color_fondo": "#5c94fc",
        "color_texto": "#ffffff",
        "color_texto_claro": "#ffe135",
        "fuente_titulo": "Bangers",
        "fuente_cuerpo": "Nunito",
        "patron_fondo": "geometric",
        "patron_opacidad": 0.15,
        "decoracion_esquinas": "estrellas",
        "icono_principal": "star",
        "animacion_entrada": "bounce",
        "efecto_titulo": "shadow",
        "marco_fotos": "comic",
        "stickers": ["🍄", "⭐", "🪙", "🎮", "🔥", "❓"],
        "imagen_fondo": null
    }',
    false,
    2
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema;

-- ====================================================================
-- PLANTILLA: QUIET LUXURY 2025 (BODA)
-- ====================================================================
-- Inspirada en Mocha Mousse - Color Pantone del Año 2025
-- Tendencia "Quiet Luxury" - minimalismo sofisticado
-- Fuentes: https://www.pantone.com, https://www.theknot.com
-- ====================================================================

INSERT INTO plantillas_evento (
    codigo,
    nombre,
    tipo_evento,
    categoria,
    subcategoria,
    descripcion,
    tema,
    es_premium,
    orden
) VALUES (
    'boda-quiet-luxury-2025',
    'Quiet Luxury 2025',
    'boda',
    'elegante',
    'dorado',
    'Inspirada en Mocha Mousse, el color Pantone 2025. Elegancia minimalista con toques dorados. Quiet Luxury para parejas sofisticadas.',
    '{
        "color_primario": "#A47B67",
        "color_secundario": "#D4AF37",
        "color_fondo": "#FDF8F3",
        "color_texto": "#3D2B1F",
        "color_texto_claro": "#8B7355",
        "fuente_titulo": "Cormorant Garamond",
        "fuente_cuerpo": "Montserrat",
        "patron_fondo": "none",
        "patron_opacidad": 0.05,
        "decoracion_esquinas": "none",
        "icono_principal": "heart",
        "animacion_entrada": "fade",
        "efecto_titulo": "none",
        "marco_fotos": "rounded",
        "stickers": ["💍", "🤍", "✨"],
        "imagen_fondo": null
    }',
    false,
    3
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema;

-- ====================================================================
-- PRÓXIMAS PLANTILLAS
-- ====================================================================
