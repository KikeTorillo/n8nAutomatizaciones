-- ====================================================================
-- ⚙️ TABLA CONFIGURACION_SISTEMA - SINGLETON GLOBAL
-- ====================================================================
-- Almacena configuraciones críticas del sistema (solo 1 fila permitida).
-- Patrón singleton para configuración centralizada.
--
-- 🎯 PROPÓSITO:
-- • Almacenar N8N_API_KEY (hot-reload sin restart backend)
-- • Vincular super_admin con n8n owner
-- • Configuraciones SMTP, notificaciones, etc.
--
-- 🔒 SEGURIDAD: Solo super_admin puede modificar
-- ⚡ PERFORMANCE: Cache de 60s en backend (configService)
-- ====================================================================

CREATE TABLE IF NOT EXISTS configuracion_sistema (
    -- 🔑 PRIMARY KEY (Singleton pattern)
    id INTEGER PRIMARY KEY DEFAULT 1,

    -- ====================================================================
    -- 🔗 SECCIÓN: INTEGRACIÓN N8N
    -- ====================================================================
    n8n_api_key TEXT,                               -- API Key de n8n (hot-reload)
    n8n_owner_email TEXT,                           -- Email del owner en n8n
    n8n_configured BOOLEAN DEFAULT false,           -- Si n8n está configurado
    n8n_last_sync TIMESTAMPTZ,                      -- Última sincronización

    -- ====================================================================
    -- 👤 SECCIÓN: SUPER ADMINISTRADOR
    -- ====================================================================
    super_admin_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- ====================================================================
    -- 📧 SECCIÓN: CONFIGURACIÓN SMTP (FUTURO)
    -- ====================================================================
    smtp_configurado BOOLEAN DEFAULT false,
    smtp_config JSONB DEFAULT '{}'::jsonb,
    -- Ejemplo:
    -- {
    --   "host": "smtp.gmail.com",
    --   "port": 587,
    --   "secure": false,
    --   "auth_user": "noreply@empresa.com"
    -- }

    -- ====================================================================
    -- 🔔 SECCIÓN: CONFIGURACIÓN NOTIFICACIONES (FUTURO)
    -- ====================================================================
    notif_email_habilitado BOOLEAN DEFAULT false,
    notif_sms_habilitado BOOLEAN DEFAULT false,
    notif_config JSONB DEFAULT '{}'::jsonb,

    -- ====================================================================
    -- 📊 SECCIÓN: METADATOS FLEXIBLES
    -- ====================================================================
    metadata JSONB DEFAULT '{}'::jsonb,             -- Configuraciones adicionales
    notas_internas TEXT,                             -- Notas para equipo técnico

    -- ====================================================================
    -- ⏰ SECCIÓN: TIMESTAMPS DE AUDITORÍA
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- ====================================================================
    -- ✅ SECCIÓN: VALIDACIONES
    -- ====================================================================
    -- Solo permite ID = 1 (singleton global)
    CONSTRAINT chk_singleton_id CHECK (id = 1),

    -- N8N API Key debe tener formato JWT válido (más de 50 caracteres)
    CONSTRAINT chk_n8n_api_key_format
        CHECK (
            n8n_api_key IS NULL
            OR LENGTH(n8n_api_key) > 50
        ),

    -- Email n8n owner debe ser válido
    CONSTRAINT chk_n8n_owner_email_format
        CHECK (
            n8n_owner_email IS NULL
            OR n8n_owner_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
        )
);

-- ====================================================================
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================
COMMENT ON TABLE configuracion_sistema IS
'Configuración global del sistema (singleton pattern). Solo 1 fila permitida.';

COMMENT ON COLUMN configuracion_sistema.id IS
'Siempre = 1. Constraint CHECK garantiza singleton.';

COMMENT ON COLUMN configuracion_sistema.n8n_api_key IS
'API Key de n8n. Leída por backend con cache de 60s (hot-reload sin restart).';

COMMENT ON COLUMN configuracion_sistema.super_admin_id IS
'FK al super_admin del sistema. Mismo usuario que n8n owner.';

COMMENT ON COLUMN configuracion_sistema.metadata IS
'JSONB flexible para configuraciones futuras sin alterar schema.';

-- ====================================================================
-- 📊 INSERTAR FILA INICIAL (VACÍA)
-- ====================================================================
INSERT INTO configuracion_sistema (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 🔄 TRIGGER PARA ACTUALIZAR TIMESTAMP
-- ====================================================================
CREATE TRIGGER update_configuracion_sistema_timestamp
    BEFORE UPDATE ON configuracion_sistema
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- ====================================================================
-- 🔒 POLÍTICAS RLS
-- ====================================================================
ALTER TABLE configuracion_sistema ENABLE ROW LEVEL SECURITY;

-- Solo super_admin puede leer/modificar
CREATE POLICY configuracion_sistema_access ON configuracion_sistema
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.current_user_role', true) = 'super_admin'
        OR current_setting('app.bypass_rls', true) = 'true'
    );

COMMENT ON POLICY configuracion_sistema_access ON configuracion_sistema IS
'Solo super_admin o bypass_rls pueden acceder a configuración del sistema.
Crítico para seguridad: N8N_API_KEY, SMTP credentials, etc.';
