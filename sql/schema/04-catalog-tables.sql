-- ====================================================================
-- 📋 CATÁLOGO GLOBAL DE PLANTILLAS DE SERVICIOS
-- ====================================================================
--
-- Este archivo contiene la tabla de plantillas de servicios compartidas
-- que acelera el onboarding de nuevas organizaciones.
--
-- 📊 CONTENIDO:
-- • plantillas_servicios: Catálogo global de servicios pre-configurados
-- • Indexación optimizada para búsquedas por industria
-- • Sistema de popularidad y recomendaciones inteligentes
--
-- 🔄 ORDEN DE EJECUCIÓN: #4 (Después de core tables)
-- 🔒 ACCESO: Lectura pública, escritura solo super_admin
-- ====================================================================

-- ====================================================================
-- 🎪 CAPA 3: CATÁLOGO GLOBAL - PLANTILLAS DE SERVICIOS
-- ====================================================================
-- Esta capa proporciona un catálogo GLOBAL de servicios pre-configurados
-- que todas las organizaciones pueden usar como base para crear sus
-- servicios personalizados. Es una tabla COMPARTIDA (no multi-tenant).
--
-- 🎯 OBJETIVOS PRINCIPALES:
-- • Acelerar onboarding de nuevas organizaciones
-- • Garantizar consistencia en configuraciones de servicios
-- • Proporcionar precios de referencia por industria
-- • Facilitar recomendaciones inteligentes basadas en popularidad
--
-- 📊 DATOS ACTUALES: 59 plantillas para 11 industrias
-- 🔒 ACCESO: Lectura pública, escritura solo super_admin
-- ====================================================================

-- ====================================================================
-- 🛍️ TABLA PLANTILLAS_SERVICIOS - CATÁLOGO GLOBAL
-- ====================================================================
-- Almacena servicios pre-configurados para todas las industrias soportadas.
-- Cada organización puede copiar y personalizar estas plantillas.
--
-- 🔧 CARACTERÍSTICAS TÉCNICAS:
-- • Tabla GLOBAL: No tiene organizacion_id (compartida entre todos)
-- • RLS granular: Lectura pública, escritura solo super_admin
-- • Indexación optimizada: Por industria, categoría y búsqueda full-text
-- • Configuraciones flexibles: JSONB para datos específicos por industria
--
-- 📈 ALGORITMO DE POPULARIDAD:
-- • Rango 0-100 basado en uso real de las organizaciones
-- • Se actualiza periódicamente por función de mantenimiento
-- • Usado para ordenar recomendaciones en interfaces
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE plantillas_servicios (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏭 CLASIFICACIÓN POR INDUSTRIA
    tipo_industria industria_tipo NOT NULL,    -- FK al ENUM industria_tipo

    -- ====================================================================
    -- 📋 SECCIÓN: INFORMACIÓN BÁSICA DEL SERVICIO
    -- ====================================================================
    nombre VARCHAR(100) NOT NULL,              -- Nombre del servicio
    descripcion TEXT,                          -- Descripción detallada
    categoria VARCHAR(50),                     -- Categoría principal
    subcategoria VARCHAR(50),                  -- Subcategoría específica

    -- ====================================================================
    -- ⏰ SECCIÓN: CONFIGURACIÓN DE TIEMPO Y PRECIO
    -- ====================================================================
    duracion_minutos INTEGER NOT NULL,         -- Duración base del servicio
    precio_sugerido DECIMAL(10,2),             -- Precio recomendado
    precio_minimo DECIMAL(10,2),               -- Precio mínimo sugerido
    precio_maximo DECIMAL(10,2),               -- Precio máximo sugerido

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONFIGURACIÓN OPERATIVA AVANZADA
    -- ====================================================================
    requiere_preparacion_minutos INTEGER DEFAULT 0,  -- Tiempo de setup previo
    tiempo_limpieza_minutos INTEGER DEFAULT 5,       -- Tiempo de limpieza post-servicio
    max_clientes_simultaneos INTEGER DEFAULT 1,      -- Clientes que pueden atenderse a la vez

    -- ====================================================================
    -- 🏷️ SECCIÓN: METADATOS Y CLASIFICACIÓN
    -- ====================================================================
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],       -- Tags para búsqueda y filtrado
    popularidad INTEGER DEFAULT 0,             -- Popularidad 0-100 (algoritmo ML)
    configuracion_especifica JSONB DEFAULT '{}', -- Config específica por industria

    -- ====================================================================
    -- 🎛️ SECCIÓN: CONTROL Y ESTADO
    -- ====================================================================
    activo BOOLEAN DEFAULT TRUE,               -- Plantilla disponible para usar
    es_template_oficial BOOLEAN DEFAULT TRUE,  -- TRUE = creado por super_admin
    creado_en TIMESTAMPTZ DEFAULT NOW()        -- Timestamp de creación
);

COMMENT ON TABLE plantillas_servicios IS 'Plantillas de servicios pre-configuradas por industria';
