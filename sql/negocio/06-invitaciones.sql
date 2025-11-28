-- ====================================================================
-- TABLA INVITACIONES_PROFESIONALES
-- Sistema de invitaciones para empleados/profesionales
-- Nov 2025 - Modelo Unificado Profesional-Usuario
-- ====================================================================

-- ====================================================================
-- ENUM PARA ESTADO DE INVITACIÓN
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_invitacion') THEN
        CREATE TYPE estado_invitacion AS ENUM (
            'pendiente',    -- Enviada, esperando aceptación
            'aceptada',     -- Usuario creado y vinculado
            'expirada',     -- Pasó fecha límite sin aceptar
            'cancelada',    -- Admin la canceló manualmente
            'reenviada'     -- Se generó nueva invitación (esta queda inactiva)
        );
    END IF;
END$$;

-- ====================================================================
-- TABLA PRINCIPAL
-- ====================================================================
CREATE TABLE IF NOT EXISTS invitaciones_profesionales (
    id SERIAL PRIMARY KEY,

    -- Identificador único de la invitación (para URL)
    token VARCHAR(64) UNIQUE NOT NULL,

    -- Organización que invita
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Profesional al que se vinculará el usuario
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Email del invitado (debe coincidir al registrarse)
    email VARCHAR(150) NOT NULL,

    -- Nombre sugerido (del profesional, editable al registrarse)
    nombre_sugerido VARCHAR(150),

    -- Estado de la invitación
    estado estado_invitacion DEFAULT 'pendiente',

    -- Usuario creado al aceptar (NULL hasta que se acepte)
    usuario_id INTEGER REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- Quién envió la invitación
    creado_por INTEGER NOT NULL REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- Control de expiración
    expira_en TIMESTAMPTZ NOT NULL,

    -- Tracking
    enviado_en TIMESTAMPTZ,           -- Cuándo se envió el email
    aceptado_en TIMESTAMPTZ,          -- Cuándo se completó el registro
    cancelado_en TIMESTAMPTZ,         -- Cuándo se canceló (si aplica)

    -- Intentos de reenvío
    reenvios INTEGER DEFAULT 0,
    ultimo_reenvio TIMESTAMPTZ,

    -- Timestamps estándar
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CHECK (char_length(email) >= 5),
    CHECK (expira_en > creado_en)
);

-- ====================================================================
-- ÍNDICES
-- ====================================================================

-- Búsqueda por token (para validación de URL)
CREATE INDEX IF NOT EXISTS idx_invitaciones_token
    ON invitaciones_profesionales (token);

-- Búsqueda por organización
CREATE INDEX IF NOT EXISTS idx_invitaciones_organizacion
    ON invitaciones_profesionales (organizacion_id);

-- Búsqueda por profesional
CREATE INDEX IF NOT EXISTS idx_invitaciones_profesional
    ON invitaciones_profesionales (profesional_id);

-- Búsqueda por email (para verificar duplicados)
CREATE INDEX IF NOT EXISTS idx_invitaciones_email
    ON invitaciones_profesionales (email, organizacion_id);

-- Filtrar por estado (invitaciones activas)
CREATE INDEX IF NOT EXISTS idx_invitaciones_estado
    ON invitaciones_profesionales (estado)
    WHERE estado = 'pendiente';

-- Limpiar expiradas
CREATE INDEX IF NOT EXISTS idx_invitaciones_expiracion
    ON invitaciones_profesionales (expira_en)
    WHERE estado = 'pendiente';

-- ====================================================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- ====================================================================
CREATE OR REPLACE FUNCTION update_invitaciones_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invitaciones_updated_at ON invitaciones_profesionales;
CREATE TRIGGER trigger_invitaciones_updated_at
    BEFORE UPDATE ON invitaciones_profesionales
    FOR EACH ROW
    EXECUTE FUNCTION update_invitaciones_timestamp();

-- ====================================================================
-- FUNCIÓN PARA MARCAR EXPIRADAS AUTOMÁTICAMENTE
-- ====================================================================
CREATE OR REPLACE FUNCTION marcar_invitaciones_expiradas()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE invitaciones_profesionales
    SET estado = 'expirada',
        actualizado_en = NOW()
    WHERE estado = 'pendiente'
      AND expira_en < NOW();

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- ROW LEVEL SECURITY
-- ====================================================================
ALTER TABLE invitaciones_profesionales ENABLE ROW LEVEL SECURITY;

-- Política para usuarios de la organización
DROP POLICY IF EXISTS invitaciones_org_isolation ON invitaciones_profesionales;
CREATE POLICY invitaciones_org_isolation ON invitaciones_profesionales
    FOR ALL
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- COMENTARIOS
-- ====================================================================
COMMENT ON TABLE invitaciones_profesionales IS 'Invitaciones para que empleados se registren y vinculen a profesionales';
COMMENT ON COLUMN invitaciones_profesionales.token IS 'Token único para URL de registro (64 chars hex)';
COMMENT ON COLUMN invitaciones_profesionales.profesional_id IS 'Profesional al que se vinculará el usuario al aceptar';
COMMENT ON COLUMN invitaciones_profesionales.email IS 'Email al que se envía la invitación (debe coincidir al registrarse)';
COMMENT ON COLUMN invitaciones_profesionales.nombre_sugerido IS 'Nombre del profesional, sugerido pero editable';
COMMENT ON COLUMN invitaciones_profesionales.expira_en IS 'Fecha límite para aceptar (default 7 días)';
