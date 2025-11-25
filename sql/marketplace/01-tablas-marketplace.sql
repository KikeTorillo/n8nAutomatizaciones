-- ====================================================================
-- MÓDULO MARKETPLACE: TABLAS PRINCIPALES
-- ====================================================================
-- Implementa directorio público de negocios con sistema de reseñas,
-- analytics de tráfico y agendamiento sin registro.
--
-- TABLAS (4):
-- • marketplace_perfiles (30 campos) - Perfiles públicos de negocios
-- • marketplace_reseñas (17 campos) - Sistema de reseñas 5 estrellas
-- • marketplace_analytics (8 campos) - Tracking de vistas y clics
-- • marketplace_categorias (9 campos) - Categorías de servicios
--
-- CARACTERÍSTICAS:
-- • SEO-optimized con meta tags y schema.org
-- • Búsqueda full-text en español (tsvector)
-- • Geolocalización con latitud/longitud
-- • Sistema de moderación para reseñas
-- • Analytics GDPR-compliant (hash de IPs)
-- • Agendamiento público sin registro
--
-- DEPENDENCIAS:
-- • organizaciones (FK) - Módulo núcleo
-- • clientes (FK) - Módulo negocio
-- • citas (FK compuesta) - Módulo citas
-- • profesionales (FK) - Módulo negocio
-- • usuarios (FK) - Módulo núcleo
--
-- Fecha creación: 17 Noviembre 2025
-- Basado en: docs/PLAN_IMPLEMENTACION_MARKETPLACE.md
-- ====================================================================

-- ====================================================================
-- TABLA 1/4: marketplace_perfiles
-- ====================================================================
-- Configuración del perfil público de cada negocio en el directorio.
-- Cada organización puede tener máximo 1 perfil (UNIQUE organizacion_id).
-- ====================================================================

CREATE TABLE marketplace_perfiles (
    -- 🔑 Identificación
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER UNIQUE NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 🎯 Estado del Perfil
    activo BOOLEAN DEFAULT false,  -- Admin activa/desactiva manualmente
    visible_en_directorio BOOLEAN DEFAULT true,  -- Aparece en búsquedas

    -- 🔍 SEO y URLs
    slug VARCHAR(100) UNIQUE NOT NULL,  -- URL amigable: /guadalajara/barberia/salon-juan
    meta_titulo VARCHAR(70),  -- SEO title tag (max 70 chars)
    meta_descripcion VARCHAR(160),  -- SEO meta description (max 160 chars)

    -- 📝 Información Pública
    descripcion_corta VARCHAR(200),  -- Tagline del negocio
    descripcion_larga TEXT,  -- Descripción completa (markdown)

    -- 📍 Ubicación Geográfica (Normalizada con catálogos - Nov 2025)
    pais_id INTEGER REFERENCES paises(id) ON DELETE SET NULL,
    estado_id INTEGER REFERENCES estados(id) ON DELETE SET NULL,
    ciudad_id INTEGER NOT NULL REFERENCES ciudades(id) ON DELETE RESTRICT,
    codigo_postal VARCHAR(10),
    direccion_completa TEXT,
    latitud DECIMAL(10, 8),  -- Para mapas
    longitud DECIMAL(11, 8),

    -- 📞 Contacto Público
    telefono_publico VARCHAR(20),
    email_publico VARCHAR(150),
    sitio_web VARCHAR(255),

    -- 📱 Redes Sociales
    instagram VARCHAR(100),  -- @username
    facebook VARCHAR(255),  -- URL completa
    tiktok VARCHAR(100),  -- @username

    -- 🖼️ Galería de Fotos
    logo_url VARCHAR(500),  -- URL de logo principal
    portada_url VARCHAR(500),  -- Imagen de portada/banner
    galeria_urls JSONB DEFAULT '[]',  -- Array de URLs: ["url1", "url2", ...]

    -- 🕒 Horarios de Atención Públicos
    horarios_atencion JSONB DEFAULT '{}',  -- { "lunes": "9:00-18:00", ... }

    -- 📊 Estadísticas (calculadas automáticamente)
    total_reseñas INTEGER DEFAULT 0,
    rating_promedio DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating_promedio >= 0 AND rating_promedio <= 5),
    total_citas_completadas INTEGER DEFAULT 0,

    -- ⏰ Metadata
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    publicado_en TIMESTAMPTZ,  -- Timestamp de primera publicación

    -- 🔍 Índice full-text search (actualizado por trigger)
    search_vector tsvector,  -- Para búsqueda de texto completo

    -- ✅ Constraints
    CHECK (LENGTH(slug) >= 3)
);

-- ====================================================================
-- TABLA 2/4: marketplace_reseñas
-- ====================================================================
-- Sistema de reseñas 5 estrellas para negocios.
-- Solo clientes con cita completada pueden dejar reseña.
-- ====================================================================

CREATE TABLE marketplace_reseñas (
    -- 🔑 Identificación
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 🔗 Relaciones
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    cita_id INTEGER NOT NULL,  -- FK compuesta a citas
    fecha_cita DATE NOT NULL,
    FOREIGN KEY (cita_id, fecha_cita) REFERENCES citas(id, fecha_cita) ON DELETE CASCADE,

    profesional_id INTEGER REFERENCES profesionales(id) ON DELETE SET NULL,  -- Opcional

    -- ⭐ Contenido de la Reseña
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    titulo VARCHAR(100),  -- Título corto de la reseña
    comentario TEXT,  -- Comentario completo (opcional)

    -- 💬 Respuesta del Negocio
    respuesta_negocio TEXT,
    respondido_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    respondido_en TIMESTAMPTZ,

    -- 🚦 Estado y Moderación
    estado VARCHAR(20) DEFAULT 'publicada' CHECK (estado IN ('pendiente', 'publicada', 'reportada', 'oculta')),
    motivo_reporte TEXT,  -- Si estado = 'reportada'
    moderada_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    moderada_en TIMESTAMPTZ,

    -- 👍 Utilidad (votos de otros usuarios)
    votos_util INTEGER DEFAULT 0,
    votos_no_util INTEGER DEFAULT 0,

    -- ⏰ Metadata
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ Constraints
    UNIQUE(cita_id, fecha_cita),  -- Una reseña por cita
    CHECK (LENGTH(comentario) <= 1000)  -- Máximo 1000 caracteres
);

-- ====================================================================
-- TABLA 3/4: marketplace_analytics
-- ====================================================================
-- Tracking de vistas y clics del perfil público.
-- GDPR-compliant: Hash de IPs (no almacena IPs reales).
-- ====================================================================

CREATE TABLE marketplace_analytics (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📊 Datos del Evento
    evento_tipo VARCHAR(30) NOT NULL CHECK (evento_tipo IN (
        'vista_perfil',
        'clic_agendar',
        'clic_telefono',
        'clic_sitio_web',
        'clic_instagram',
        'clic_facebook'
    )),

    -- 🌐 Información de Tráfico
    fuente VARCHAR(50),  -- 'google', 'directo', 'facebook', etc.
    ip_hash VARCHAR(64),  -- Hash SHA256 de IP (para contar únicos, GDPR-friendly)
    user_agent TEXT,

    -- 📍 Geolocalización (del visitante)
    pais_visitante VARCHAR(50),
    ciudad_visitante VARCHAR(100),

    -- ⏰ Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    fecha DATE GENERATED ALWAYS AS (extract_date_immutable(creado_en)) STORED  -- Para particionamiento
);

-- ====================================================================
-- TABLA 4/4: marketplace_categorias
-- ====================================================================
-- Categorías de servicios para facilitar navegación en directorio.
-- Catálogo base con 10 categorías + posibilidad de agregar más.
-- ====================================================================

CREATE TABLE marketplace_categorias (
    id SERIAL PRIMARY KEY,

    -- 📋 Jerarquía
    nombre VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icono VARCHAR(50),  -- Nombre de ícono (ej: 'scissors', 'spa')

    -- 🔍 SEO
    meta_titulo VARCHAR(70),
    meta_descripcion VARCHAR(160),

    -- 🎯 Estado
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,  -- Para ordenar en UI

    -- ⏰ Metadata
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

-- Tablas principales
COMMENT ON TABLE marketplace_perfiles IS 'Perfiles públicos de negocios en el marketplace. Directorio SEO-optimizado con búsqueda full-text';
COMMENT ON TABLE marketplace_reseñas IS 'Reseñas de clientes sobre negocios. Requiere cita completada. Sistema de moderación incluido';
COMMENT ON TABLE marketplace_analytics IS 'Eventos de analytics del marketplace (vistas, clics). GDPR-compliant con hash de IPs';
COMMENT ON TABLE marketplace_categorias IS 'Categorías principales para organizar el directorio del marketplace';

-- Columnas críticas de marketplace_perfiles
COMMENT ON COLUMN marketplace_perfiles.activo IS 'Admin puede activar/desactivar perfil (moderación). FALSE por defecto hasta activación manual';
COMMENT ON COLUMN marketplace_perfiles.slug IS 'URL amigable única. Ej: guadalajara-barberia-el-corte. Se genera automáticamente';
COMMENT ON COLUMN marketplace_perfiles.search_vector IS 'Vector de búsqueda full-text actualizado automáticamente por trigger';
COMMENT ON COLUMN marketplace_perfiles.rating_promedio IS 'Calculado automáticamente desde reseñas (0.00-5.00). Actualizado por trigger';
COMMENT ON COLUMN marketplace_perfiles.total_reseñas IS 'Contador actualizado automáticamente por trigger tras INSERT/UPDATE de reseñas';
COMMENT ON COLUMN marketplace_perfiles.galeria_urls IS 'Array JSON de URLs de fotos. Max 10 fotos. Ej: ["url1", "url2"]';
COMMENT ON COLUMN marketplace_perfiles.horarios_atencion IS 'JSONB con horarios por día. Ej: {"lunes": "9:00-18:00", "martes": "9:00-18:00"}';

-- Columnas críticas de marketplace_reseñas
COMMENT ON COLUMN marketplace_reseñas.estado IS 'publicada: visible | pendiente: moderación | reportada: flagged | oculta: no visible';
COMMENT ON COLUMN marketplace_reseñas.votos_util IS 'Cantidad de usuarios que marcaron la reseña como útil';
COMMENT ON COLUMN marketplace_reseñas.respuesta_negocio IS 'Respuesta del negocio a la reseña. Visible públicamente';

-- Columnas críticas de marketplace_analytics
COMMENT ON COLUMN marketplace_analytics.ip_hash IS 'Hash SHA256 de IP para contar visitantes únicos sin almacenar IPs reales (GDPR)';
COMMENT ON COLUMN marketplace_analytics.evento_tipo IS 'Tipo de interacción del usuario con el perfil público';
COMMENT ON COLUMN marketplace_analytics.fecha IS 'Columna GENERATED usando extract_date_immutable() para particionamiento futuro';
