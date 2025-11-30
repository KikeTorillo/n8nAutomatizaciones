-- ====================================================================
-- TABLA ACTIVACIONES_CUENTA
-- Sistema de activación de cuentas por email
-- Nov 2025 - Onboarding Simplificado (Fase 2)
-- ====================================================================
--
-- Flujo:
-- 1. Usuario hace registro con datos básicos (sin password)
-- 2. Se crea organización + esta activación pendiente
-- 3. Se envía email con link de activación
-- 4. Usuario crea password en página de activación
-- 5. Se crea usuario admin vinculado a la organización
--
-- Patrón reutilizado de: invitaciones_profesionales
-- ====================================================================

-- ====================================================================
-- TABLA PRINCIPAL
-- ====================================================================
CREATE TABLE IF NOT EXISTS activaciones_cuenta (
    id SERIAL PRIMARY KEY,

    -- Token único para URL de activación (64 chars hex)
    token VARCHAR(64) UNIQUE NOT NULL,

    -- Organización creada (sin admin aún)
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Datos del usuario a crear
    email VARCHAR(150) NOT NULL,
    nombre VARCHAR(150) NOT NULL,

    -- Auto-crear profesional vinculado al admin (Nov 2025)
    soy_profesional BOOLEAN DEFAULT TRUE,

    -- Estado de la activación
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'activada', 'expirada')),

    -- Usuario creado al activar (NULL hasta que se active)
    usuario_id INTEGER REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- Control de expiración (24 horas por defecto)
    expira_en TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

    -- Tracking
    activada_en TIMESTAMPTZ,          -- Cuándo se completó la activación
    email_enviado_en TIMESTAMPTZ,     -- Cuándo se envió el email

    -- Intentos de reenvío
    reenvios INTEGER DEFAULT 0,
    ultimo_reenvio TIMESTAMPTZ,

    -- Timestamps estándar
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CHECK (char_length(email) >= 5),
    CHECK (char_length(nombre) >= 2),
    CHECK (expira_en > creado_en)
);

-- ====================================================================
-- ÍNDICES
-- ====================================================================

-- Búsqueda por token (para validación de URL) - crítico para performance
CREATE INDEX IF NOT EXISTS idx_activaciones_token
    ON activaciones_cuenta (token);

-- Búsqueda por email (para verificar duplicados)
CREATE INDEX IF NOT EXISTS idx_activaciones_email
    ON activaciones_cuenta (email);

-- Filtrar por estado (activaciones pendientes)
CREATE INDEX IF NOT EXISTS idx_activaciones_estado_pendiente
    ON activaciones_cuenta (estado)
    WHERE estado = 'pendiente';

-- Limpiar expiradas (para job de mantenimiento)
CREATE INDEX IF NOT EXISTS idx_activaciones_expiracion
    ON activaciones_cuenta (expira_en)
    WHERE estado = 'pendiente';

-- Búsqueda por organización
CREATE INDEX IF NOT EXISTS idx_activaciones_organizacion
    ON activaciones_cuenta (organizacion_id);

-- ====================================================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- ====================================================================
CREATE OR REPLACE FUNCTION update_activaciones_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_activaciones_updated_at ON activaciones_cuenta;
CREATE TRIGGER trigger_activaciones_updated_at
    BEFORE UPDATE ON activaciones_cuenta
    FOR EACH ROW
    EXECUTE FUNCTION update_activaciones_timestamp();

-- ====================================================================
-- FUNCIÓN PARA MARCAR EXPIRADAS AUTOMÁTICAMENTE
-- ====================================================================
CREATE OR REPLACE FUNCTION marcar_activaciones_expiradas()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE activaciones_cuenta
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
-- NOTA: Esta tabla NO usa RLS porque:
-- 1. Los endpoints de activación son públicos (sin auth)
-- 2. El token es el único mecanismo de acceso
-- 3. Se accede con withBypass() desde el modelo
--
-- Si en el futuro se requiere listar activaciones por admin,
-- se puede agregar RLS similar a invitaciones_profesionales
-- ====================================================================

-- ====================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================
COMMENT ON TABLE activaciones_cuenta IS 'Activaciones pendientes para cuentas registradas sin password. Token expira en 24h.';
COMMENT ON COLUMN activaciones_cuenta.token IS 'Token único para URL de activación (64 chars hex, crypto.randomBytes(32))';
COMMENT ON COLUMN activaciones_cuenta.organizacion_id IS 'Organización creada en el registro, esperando activación de admin';
COMMENT ON COLUMN activaciones_cuenta.email IS 'Email del usuario a crear (será el admin de la organización)';
COMMENT ON COLUMN activaciones_cuenta.nombre IS 'Nombre completo del usuario (se puede separar en nombre/apellidos al crear)';
COMMENT ON COLUMN activaciones_cuenta.soy_profesional IS 'Si TRUE, se crea profesional vinculado al usuario admin al activar. Default TRUE (caso común PYMES)';
COMMENT ON COLUMN activaciones_cuenta.expira_en IS 'Fecha límite para activar (default 24 horas desde creación)';
COMMENT ON COLUMN activaciones_cuenta.usuario_id IS 'Usuario admin creado al activar. NULL mientras está pendiente.';
