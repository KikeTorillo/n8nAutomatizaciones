-- ====================================================================
-- MÓDULO WEBSITE: ÍNDICES
-- ====================================================================
-- Índices para optimizar consultas frecuentes del módulo website.
--
-- ÍNDICES (6):
-- • website_config_slug - Búsqueda por slug (acceso público)
-- • website_config_org - Búsqueda por organización (admin)
-- • website_paginas_website - Páginas por sitio
-- • website_paginas_orden - Ordenamiento de páginas
-- • website_bloques_pagina - Bloques por página
-- • website_bloques_orden - Ordenamiento de bloques
--
-- Fecha creación: 6 Diciembre 2025
-- ====================================================================

-- ====================================================================
-- ÍNDICES PARA website_config
-- ====================================================================

-- Búsqueda por slug (acceso público más frecuente)
-- Usado en: GET /sitio/:slug
CREATE INDEX IF NOT EXISTS idx_website_config_slug
    ON website_config(slug)
    WHERE publicado = true;

-- Búsqueda por organización (panel admin)
-- Usado en: GET /api/v1/website/config
CREATE INDEX IF NOT EXISTS idx_website_config_org
    ON website_config(organizacion_id);

-- ====================================================================
-- ÍNDICES PARA website_paginas
-- ====================================================================

-- Páginas por sitio web
-- Usado en: Listar páginas de un sitio
CREATE INDEX IF NOT EXISTS idx_website_paginas_website
    ON website_paginas(website_id);

-- Ordenamiento de páginas en menú
-- Usado en: Renderizar navegación
CREATE INDEX IF NOT EXISTS idx_website_paginas_orden
    ON website_paginas(website_id, orden);

-- Páginas publicadas (para vista pública)
CREATE INDEX IF NOT EXISTS idx_website_paginas_publicadas
    ON website_paginas(website_id, publicada)
    WHERE publicada = true;

-- ====================================================================
-- ÍNDICES PARA website_bloques
-- ====================================================================

-- Bloques por página
-- Usado en: Renderizar página completa
CREATE INDEX IF NOT EXISTS idx_website_bloques_pagina
    ON website_bloques(pagina_id);

-- Ordenamiento de bloques
-- Usado en: Renderizar bloques en orden correcto
CREATE INDEX IF NOT EXISTS idx_website_bloques_orden
    ON website_bloques(pagina_id, orden);

-- Bloques visibles (para vista pública)
CREATE INDEX IF NOT EXISTS idx_website_bloques_visibles
    ON website_bloques(pagina_id, visible)
    WHERE visible = true;

-- Índice por tipo de bloque (para analytics/búsquedas)
CREATE INDEX IF NOT EXISTS idx_website_bloques_tipo
    ON website_bloques(tipo);
