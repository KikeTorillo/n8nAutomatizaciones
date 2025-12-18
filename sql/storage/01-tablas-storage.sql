-- ====================================================================
-- MÓDULO STORAGE: TABLA ARCHIVOS_STORAGE
-- ====================================================================
-- Sistema de almacenamiento de archivos con MinIO
-- Guarda metadata de archivos, el contenido está en MinIO
--
-- Fecha creación: 3 Diciembre 2025
-- ====================================================================

-- ====================================================================
-- TABLA: archivos_storage
-- ====================================================================
-- Metadatos de archivos subidos a MinIO
-- El contenido real está en MinIO, aquí solo la referencia
-- ====================================================================
CREATE TABLE IF NOT EXISTS archivos_storage (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER,  -- Sucursal a la que pertenece el archivo (NULL = global)

    -- ====================================================================
    -- REFERENCIA A ENTIDAD
    -- ====================================================================
    -- Tipo de entidad: 'organizacion', 'producto', 'profesional', 'evento_invitacion', etc.
    entidad_tipo VARCHAR(50),
    entidad_id INTEGER,

    -- ====================================================================
    -- INFORMACIÓN DEL ARCHIVO
    -- ====================================================================
    nombre_original VARCHAR(255) NOT NULL,      -- Nombre original del archivo
    nombre_storage VARCHAR(255) NOT NULL,       -- UUID + extension (nombre en MinIO)
    mime_type VARCHAR(100) NOT NULL,            -- Tipo MIME del archivo
    tamano_bytes INTEGER NOT NULL,              -- Tamaño en bytes

    -- ====================================================================
    -- UBICACIÓN EN MINIO
    -- ====================================================================
    bucket VARCHAR(50) NOT NULL,                -- Nombre del bucket (nexo-public, nexo-private, nexo-temp)
    path TEXT NOT NULL,                         -- Path completo en MinIO
    url_publica TEXT,                           -- URL pública (solo para bucket público)
    thumbnail_url TEXT,                         -- URL del thumbnail (si existe)

    -- ====================================================================
    -- METADATA ADICIONAL
    -- ====================================================================
    es_principal BOOLEAN DEFAULT false,         -- Si es la imagen principal de la entidad
    orden INTEGER DEFAULT 0,                    -- Orden para galerías
    metadata JSONB DEFAULT '{}',                -- Datos adicionales flexibles

    -- ====================================================================
    -- CONTROL
    -- ====================================================================
    activo BOOLEAN DEFAULT true,                -- Soft delete
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ====================================================================
    -- CONSTRAINTS
    -- ====================================================================
    CONSTRAINT valid_tamano CHECK (tamano_bytes > 0),
    CONSTRAINT valid_bucket CHECK (bucket IN ('nexo-public', 'nexo-private', 'nexo-temp'))
);

-- ====================================================================
-- ÍNDICES
-- ====================================================================

-- Índice principal por organización
CREATE INDEX IF NOT EXISTS idx_archivos_storage_org
ON archivos_storage(organizacion_id);

-- Índice para búsqueda por entidad
CREATE INDEX IF NOT EXISTS idx_archivos_storage_entidad
ON archivos_storage(entidad_tipo, entidad_id);

-- Índice por bucket para queries de limpieza
CREATE INDEX IF NOT EXISTS idx_archivos_storage_bucket
ON archivos_storage(bucket);

-- Índice compuesto para listados por org + activo
CREATE INDEX IF NOT EXISTS idx_archivos_storage_org_activo
ON archivos_storage(organizacion_id, activo)
WHERE activo = true;

-- ====================================================================
-- ROW LEVEL SECURITY
-- ====================================================================

ALTER TABLE archivos_storage ENABLE ROW LEVEL SECURITY;

-- Política de tenant: cada organización solo ve sus archivos
CREATE POLICY archivos_storage_tenant_policy ON archivos_storage
    USING (
        organizacion_id = COALESCE(
            NULLIF(current_setting('app.current_tenant_id', true), '')::integer,
            0
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- COMENTARIOS
-- ====================================================================

COMMENT ON TABLE archivos_storage IS 'Metadatos de archivos almacenados en MinIO. El contenido real está en el bucket de MinIO.';
COMMENT ON COLUMN archivos_storage.entidad_tipo IS 'Tipo de entidad relacionada: organizacion, producto, profesional, evento_invitacion, etc.';
COMMENT ON COLUMN archivos_storage.entidad_id IS 'ID de la entidad relacionada en su tabla correspondiente';
COMMENT ON COLUMN archivos_storage.nombre_storage IS 'Nombre único del archivo en MinIO (UUID + extensión)';
COMMENT ON COLUMN archivos_storage.bucket IS 'Bucket de MinIO: nexo-public (acceso público), nexo-private (requiere auth), nexo-temp (auto-delete)';
COMMENT ON COLUMN archivos_storage.path IS 'Path completo en MinIO: org-{id}/{folder}/{filename}';
COMMENT ON COLUMN archivos_storage.url_publica IS 'URL pública directa. Solo disponible para archivos en bucket público.';
COMMENT ON COLUMN archivos_storage.thumbnail_url IS 'URL del thumbnail generado automáticamente para imágenes';
COMMENT ON COLUMN archivos_storage.es_principal IS 'Indica si es la imagen principal de la entidad (para logos, fotos de perfil, etc.)';
COMMENT ON COLUMN archivos_storage.metadata IS 'Datos adicionales en JSON: dimensiones, duración, etc.';
