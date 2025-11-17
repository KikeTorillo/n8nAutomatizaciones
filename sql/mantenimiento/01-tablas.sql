-- ====================================================================
-- 🔧 MÓDULO: MANTENIMIENTO - SISTEMA DE CONFIGURACIÓN Y ARCHIVADO
-- ====================================================================
--
-- PROPÓSITO:
-- Sistema completo de mantenimiento automático del SaaS con configuración
-- centralizada, archivado de datos antiguos y gestión de particiones.
--
-- COMPONENTES:
-- • Tabla configuracion_sistema: Config global singleton
-- • Tabla eventos_sistema_archivo: Archivo de eventos antiguos
-- • Columna archivada en citas: Soft delete de citas antiguas
--
-- CARACTERÍSTICAS:
-- ✅ Singleton global para configuración crítica del sistema
-- ✅ N8N_API_KEY con hot-reload (cache 60s backend)
-- ✅ Archivado automático de eventos >12 meses
-- ✅ Soft delete de citas >24 meses
-- ✅ Solo super_admin puede modificar configuración
--
-- ORDEN DE CARGA: #12 (después de chatbots)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- TABLA 1: CONFIGURACION_SISTEMA - SINGLETON GLOBAL
-- ====================================================================
-- Almacena configuraciones críticas del sistema (solo 1 fila permitida).
-- Patrón singleton para configuración centralizada.
-- ────────────────────────────────────────────────────────────────────

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
-- TABLA 2: EVENTOS_SISTEMA_ARCHIVO - ARCHIVO DE EVENTOS ANTIGUOS
-- ====================================================================
-- Almacena eventos antiguos (>12 meses) para compliance y consultas
-- históricas sin impactar performance de tabla principal.
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS eventos_sistema_archivo (
    LIKE eventos_sistema INCLUDING ALL
);

-- ====================================================================
-- COLUMNA ADICIONAL: CITAS.ARCHIVADA - SOFT DELETE DE CITAS
-- ====================================================================
-- Marca citas antiguas completadas/canceladas como archivadas
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE citas ADD COLUMN IF NOT EXISTS archivada BOOLEAN DEFAULT FALSE;

-- ====================================================================
-- 📝 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

-- Tabla configuracion_sistema
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

-- Tabla eventos_sistema_archivo
COMMENT ON TABLE eventos_sistema_archivo IS
'Tabla de archivo para eventos_sistema antiguos (>12 meses).
Estructura idéntica a eventos_sistema pero sin RLS ni triggers.
Solo para consulta histórica y compliance.
Ejecutar archivado: SELECT * FROM archivar_eventos_antiguos(12);';

-- Columna archivada
COMMENT ON COLUMN citas.archivada IS
'Marca si la cita ha sido archivada (soft delete).
Citas completadas/canceladas >24 meses se marcan automáticamente.
Usar WHERE archivada = FALSE en queries activas para mejor performance.';

-- ====================================================================
-- 📊 INSERTAR FILA INICIAL EN CONFIGURACION_SISTEMA (VACÍA)
-- ====================================================================

INSERT INTO configuracion_sistema (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
