-- ====================================================================
-- MÓDULO WEBSITE: CONTACTOS DE FORMULARIO PÚBLICO
-- Archivo: sql/website/05-contactos.sql
-- Versión: 1.0.0
-- Descripción: Mensajes recibidos desde formularios de contacto del sitio web
-- ====================================================================

-- ====================================================================
-- TABLA: website_contactos
-- ====================================================================

CREATE TABLE IF NOT EXISTS website_contactos (
    -- Identificador único
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relaciones
    website_id UUID NOT NULL REFERENCES website_config(id) ON DELETE CASCADE,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Datos del contacto
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    mensaje TEXT,

    -- Campos personalizados (para formularios extendidos)
    datos_adicionales JSONB DEFAULT '{}',

    -- Metadatos de origen
    pagina_origen VARCHAR(100), -- slug de la página donde envió el formulario
    ip_origen INET,
    user_agent TEXT,
    referrer TEXT, -- De dónde vino el visitante

    -- Estado del mensaje
    leido BOOLEAN DEFAULT false,
    respondido BOOLEAN DEFAULT false,
    fecha_respuesta TIMESTAMPTZ,
    respondido_por INTEGER REFERENCES usuarios(id),

    -- Notas internas
    notas TEXT,

    -- Spam/Calidad
    es_spam BOOLEAN DEFAULT false,
    puntuacion_spam DECIMAL(3,2) DEFAULT 0, -- 0.00 a 1.00

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE website_contactos IS 'Mensajes recibidos desde formularios de contacto del sitio web público';
COMMENT ON COLUMN website_contactos.pagina_origen IS 'Slug de la página donde se envió el formulario';
COMMENT ON COLUMN website_contactos.datos_adicionales IS 'Campos personalizados del formulario en formato JSON';
COMMENT ON COLUMN website_contactos.puntuacion_spam IS 'Puntuación de 0 a 1 indicando probabilidad de spam';

-- ====================================================================
-- ÍNDICES
-- ====================================================================

-- Índice para listar contactos por website
CREATE INDEX IF NOT EXISTS idx_website_contactos_website
    ON website_contactos(website_id);

-- Índice para listar contactos por organización
CREATE INDEX IF NOT EXISTS idx_website_contactos_org
    ON website_contactos(organizacion_id);

-- Índice para mensajes no leídos (bandeja de entrada)
CREATE INDEX IF NOT EXISTS idx_website_contactos_no_leidos
    ON website_contactos(organizacion_id, leido)
    WHERE leido = false AND es_spam = false;

-- Índice para ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_website_contactos_fecha
    ON website_contactos(creado_en DESC);

-- Índice para buscar por email (seguimiento)
CREATE INDEX IF NOT EXISTS idx_website_contactos_email
    ON website_contactos(email)
    WHERE email IS NOT NULL;

-- ====================================================================
-- RLS POLICIES
-- ====================================================================

ALTER TABLE website_contactos ENABLE ROW LEVEL SECURITY;

-- Política: Organización puede ver sus contactos
CREATE POLICY website_contactos_org_select ON website_contactos
    FOR SELECT
    USING (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER);

-- Política: Organización puede actualizar sus contactos (marcar leído, agregar notas)
CREATE POLICY website_contactos_org_update ON website_contactos
    FOR UPDATE
    USING (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER);

-- Política: Organización puede eliminar sus contactos
CREATE POLICY website_contactos_org_delete ON website_contactos
    FOR DELETE
    USING (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER);

-- Política: Inserción pública (para formularios de contacto)
-- Nota: Los inserts públicos se hacen con bypass de RLS desde el controller
CREATE POLICY website_contactos_public_insert ON website_contactos
    FOR INSERT
    WITH CHECK (true); -- El controller valida el website_id

-- Política: SuperAdmin puede hacer todo
CREATE POLICY website_contactos_superadmin ON website_contactos
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true');

-- ====================================================================
-- FUNCIONES ÚTILES
-- ====================================================================

-- Función para contar mensajes no leídos
CREATE OR REPLACE FUNCTION website_contactos_no_leidos(p_organizacion_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM website_contactos
        WHERE organizacion_id = p_organizacion_id
          AND leido = false
          AND es_spam = false
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION website_contactos_no_leidos IS 'Retorna cantidad de mensajes no leídos para una organización';

-- ====================================================================
-- VISTA: Resumen de contactos por día
-- ====================================================================

CREATE OR REPLACE VIEW vw_website_contactos_diarios AS
SELECT
    organizacion_id,
    DATE(creado_en) AS fecha,
    COUNT(*) AS total_contactos,
    COUNT(*) FILTER (WHERE NOT leido) AS no_leidos,
    COUNT(*) FILTER (WHERE respondido) AS respondidos,
    COUNT(*) FILTER (WHERE es_spam) AS spam
FROM website_contactos
GROUP BY organizacion_id, DATE(creado_en);

COMMENT ON VIEW vw_website_contactos_diarios IS 'Resumen diario de contactos recibidos por organización';

-- ====================================================================
-- FIN DEL ARCHIVO
-- ====================================================================
