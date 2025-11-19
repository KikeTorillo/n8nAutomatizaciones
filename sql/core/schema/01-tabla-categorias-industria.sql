-- ====================================================================
-- CORE: TABLA CATEGORIAS_INDUSTRIA (Solo Estructura)
-- ====================================================================
--
-- Descripción: Tabla dinámica para categorías/tipos de organizaciones
-- Reemplaza: ENUM industria_tipo (específico de agendamiento)
-- Orden: 01 (ANTES de tabla organizaciones)
--
-- ⚠️ IMPORTANTE: Este archivo define SOLO la estructura
-- Los datos (categorías) se agregan mediante seeds en templates/
--
-- 💡 VENTAJAS sobre ENUM:
-- - Cada SaaS define sus propias categorías sin modificar el core
-- - Agregar categorías sin ALTER TYPE (sin downtime)
-- - Metadata JSONB permite campos custom por dominio
-- - Soft delete (activo/inactivo)
-- - Reutilizable en múltiples proyectos SaaS
--
-- 🎯 CASOS DE USO:
-- • SaaS Agendamiento: barberia, spa, veterinaria, consultorio
-- • SaaS Invitaciones: bodas, xv_anos, baby_shower, cumpleanos
-- • SaaS E-commerce: fashion, electronics, food, beauty
-- • Personalizado: Define tus propias categorías
--
-- Fecha creación: 18 Noviembre 2025 (Refactor multi-SaaS)
-- Última actualización: 19 Noviembre 2025 (Limpieza core)
-- ====================================================================

CREATE TABLE categorias_industria (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    sector VARCHAR(50),
    descripcion TEXT,
    icono VARCHAR(50),
    color VARCHAR(7),
    orden INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT TRUE,
    es_sistema BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    
    CHECK (char_length(codigo) >= 2),
    CHECK (char_length(nombre) >= 3),
    CHECK (orden >= 0)
);

-- Índices
CREATE INDEX idx_categorias_industria_codigo
    ON categorias_industria(codigo) WHERE activo = TRUE;

CREATE INDEX idx_categorias_industria_sector
    ON categorias_industria(sector, activo) WHERE activo = TRUE;

-- ====================================================================
-- 📝 DATOS INICIALES
-- ====================================================================
-- ⚠️ Este archivo del CORE define SOLO la estructura de la tabla.
-- Los datos (categorías) se insertan según el template usado:
--
-- • SaaS de Agendamiento:
--   → sql/templates/scheduling-saas/seeds/categorias-agendamiento.sql
--
-- • SaaS de Invitaciones:
--   → sql/templates/invitations-saas/seeds/categorias-invitaciones.sql
--
-- • SaaS de E-commerce:
--   → sql/templates/ecommerce-saas/seeds/categorias-ecommerce.sql
--
-- • Personalizado:
--   → Crear tu propio seed con las categorías que necesites
-- ====================================================================

COMMENT ON TABLE categorias_industria IS
'Tabla dinámica para categorías/tipos de organizaciones.
Reemplaza ENUMs hardcodeados para permitir flexibilidad multi-dominio.
Los datos se insertan mediante seeds específicos por template.';
