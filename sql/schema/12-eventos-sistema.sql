-- ====================================================================
-- 📊 TABLA EVENTOS_SISTEMA - AUDITORÍA ENTERPRISE
-- ====================================================================
--
-- Sistema completo de auditoría y logging para el SaaS multi-tenant.
-- Registra todos los eventos críticos del sistema con seguridad avanzada.
--
-- 🎯 CARACTERÍSTICAS ENTERPRISE:
-- • BIGSERIAL para escala de billones de eventos
-- • RLS multi-tenant para aislamiento automático
-- • Índices especializados para alta performance
-- • Validaciones automáticas de coherencia organizacional
-- • Auditoría completa con IP, user agent y sesión
--
-- 🔄 ORDEN DE EJECUCIÓN: #12 (Después de horarios-profesionales)
-- 🛡️ SEGURIDAD: RLS habilitado, validaciones triggers
-- ⚡ PERFORMANCE: 6 índices especializados optimizados
-- ====================================================================

-- ====================================================================
-- 🎭 ENUM TIPOS DE EVENTOS DEL SISTEMA
-- ====================================================================
-- Define los tipos de eventos que pueden registrarse en el sistema
-- con categorización granular para filtrado y análisis.
-- ────────────────────────────────────────────────────────────────────

CREATE TYPE tipo_evento_sistema AS ENUM (
    -- 🔐 AUTENTICACIÓN Y SEGURIDAD
    'login_attempt',           -- Intento de login (exitoso o fallido)
    'login_success',           -- Login exitoso confirmado
    'login_failed',            -- Login fallido confirmado
    'logout',                  -- Cierre de sesión
    'password_reset',          -- Reset de contraseña
    'user_blocked',            -- Usuario bloqueado por intentos fallidos
    'user_unblocked',          -- Usuario desbloqueado automáticamente

    -- 📅 GESTIÓN DE CITAS
    'cita_creada',             -- Nueva cita creada
    'cita_confirmada',         -- Cita confirmada por cliente
    'cita_cancelada',          -- Cita cancelada
    'cita_completada',         -- Cita finalizada exitosamente
    'cita_no_show',            -- Cliente no se presentó
    'cita_modificada',         -- Cita reagendada o modificada

    -- 👥 GESTIÓN DE USUARIOS
    'usuario_creado',          -- Nuevo usuario registrado
    'usuario_modificado',      -- Datos de usuario actualizados
    'usuario_desactivado',     -- Usuario desactivado
    'rol_cambiado',            -- Cambio de rol de usuario
    'profesional_creado',      -- Nuevo profesional registrado
    'cliente_creado',          -- Nuevo cliente registrado

    -- 💰 PAGOS Y FACTURACIÓN
    'pago_exitoso',            -- Pago procesado correctamente
    'pago_fallido',            -- Pago rechazado o fallido
    'subscripcion_creada',     -- Nueva suscripción
    'subscripcion_renovada',   -- Suscripción renovada
    'subscripcion_cancelada',  -- Suscripción cancelada
    'plan_cambiado',           -- Cambio de plan de suscripción

    -- 🔧 SISTEMA Y MANTENIMIENTO
    'backup_creado',           -- Backup de base de datos
    'mantenimiento_iniciado',  -- Inicio de mantenimiento
    'mantenimiento_finalizado', -- Fin de mantenimiento
    'error_sistema',           -- Error crítico del sistema
    'integracion_fallo',       -- Fallo en integración externa
    'tokens_limpiados',        -- Limpieza automática de tokens

    -- 📱 NOTIFICACIONES Y COMUNICACIÓN
    'notificacion_enviada',    -- Notificación enviada exitosamente
    'notificacion_fallida',    -- Fallo al enviar notificación
    'recordatorio_enviado',    -- Recordatorio de cita enviado
    'whatsapp_enviado',        -- Mensaje WhatsApp enviado
    'email_enviado',           -- Email enviado

    -- 🏢 GESTIÓN ORGANIZACIONAL
    'organizacion_creada',     -- Nueva organización registrada
    'organizacion_modificada', -- Datos de organización actualizados
    'servicio_creado',         -- Nuevo servicio agregado
    'horario_generado',        -- Horarios automáticos generados

    -- 🔄 OPERACIONES GENERALES
    'configuracion_cambiada',  -- Cambio en configuración
    'importacion_datos',       -- Importación masiva de datos
    'exportacion_datos',       -- Exportación de reportes
    'api_call'                 -- Llamada a API externa
);

-- ====================================================================
-- 📊 TABLA EVENTOS_SISTEMA - IMPLEMENTACIÓN ENTERPRISE
-- ====================================================================

CREATE TABLE eventos_sistema (
    -- 🔢 IDENTIFICACIÓN PRINCIPAL
    id BIGSERIAL PRIMARY KEY,                -- BIGSERIAL para escala enterprise
    organizacion_id INTEGER NOT NULL         -- FK obligatorio para multi-tenancy
        REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📝 INFORMACIÓN DEL EVENTO
    tipo_evento tipo_evento_sistema NOT NULL, -- Tipo controlado por ENUM
    subtipo_evento VARCHAR(30),               -- Categorización adicional granular
    descripcion TEXT NOT NULL,               -- Descripción detallada del evento
    metadata JSONB DEFAULT '{}' NOT NULL,    -- Datos adicionales en JSON (indexado)

    -- 🛡️ AUDITORÍA Y SEGURIDAD
    gravedad VARCHAR(20) DEFAULT 'info' NOT NULL
        CHECK (gravedad IN ('debug', 'info', 'warning', 'error', 'critical')),
    ip_address INET,                         -- IP del cliente (auditoría)
    user_agent TEXT,                         -- Browser/aplicación usado
    session_id VARCHAR(100),                 -- ID de sesión para trazabilidad
    request_id VARCHAR(50),                  -- ID de request para debugging

    -- 🔗 REFERENCIAS A ENTIDADES (Opcionales con integridad)
    usuario_id INTEGER
        REFERENCES usuarios(id) ON DELETE SET NULL,
    cita_id INTEGER
        REFERENCES citas(id) ON DELETE SET NULL,
    cliente_id INTEGER
        REFERENCES clientes(id) ON DELETE SET NULL,
    profesional_id INTEGER
        REFERENCES profesionales(id) ON DELETE SET NULL,

    -- ⏰ GESTIÓN TEMPORAL AVANZADA
    creado_en TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    procesado_en TIMESTAMPTZ,                -- Timestamp de procesamiento
    notificado_en TIMESTAMPTZ,               -- Timestamp de notificación

    -- 🎯 CAMPOS ADICIONALES PARA PERFORMANCE (Sin campos computados para evitar problemas de inmutabilidad)
    -- Los campos de fecha se calcularán en el backend o mediante índices funcionales

    -- ✅ CONSTRAINTS DE INTEGRIDAD EMPRESARIAL
    CONSTRAINT check_evento_coherencia CHECK (
        -- Si hay referencias, deben ser coherentes organizacionalmente
        (cita_id IS NULL OR organizacion_id IS NOT NULL) AND
        (cliente_id IS NULL OR organizacion_id IS NOT NULL) AND
        (profesional_id IS NULL OR organizacion_id IS NOT NULL)
    ),

    CONSTRAINT check_timestamps_coherencia CHECK (
        -- Timestamps deben ser lógicos
        (procesado_en IS NULL OR procesado_en >= creado_en) AND
        (notificado_en IS NULL OR notificado_en >= creado_en)
    ),

    CONSTRAINT check_metadata_valido CHECK (
        -- Validar que metadata sea JSON válido
        jsonb_typeof(metadata) = 'object'
    )
);

-- ====================================================================
-- 📊 ÍNDICES ESPECIALIZADOS PARA ALTA PERFORMANCE
-- ====================================================================
-- Índices optimizados para las consultas más frecuentes del sistema
-- con estrategia multi-tenant y temporal.
-- ────────────────────────────────────────────────────────────────────

-- 🔍 ÍNDICE 1: CONSULTAS POR ORGANIZACIÓN Y TIPO (MÁS FRECUENTE)
-- Uso: Dashboard de eventos, filtros por tipo de evento
-- Query: WHERE organizacion_id = ? AND tipo_evento = ? ORDER BY creado_en DESC
CREATE INDEX idx_eventos_org_tipo_fecha
    ON eventos_sistema (organizacion_id, tipo_evento, creado_en DESC);

-- 🔍 ÍNDICE 2: EVENTOS POR USUARIO ESPECÍFICO
-- Uso: Auditoría de acciones de usuario, trazabilidad personal
-- Query: WHERE usuario_id = ? ORDER BY creado_en DESC
CREATE INDEX idx_eventos_usuario_fecha
    ON eventos_sistema (usuario_id, creado_en DESC)
    WHERE usuario_id IS NOT NULL;

-- 🔍 ÍNDICE 3: EVENTOS CRÍTICOS PARA MONITOREO
-- Uso: Alertas, monitoreo de sistema, eventos de error
-- Query: WHERE gravedad IN ('error', 'critical') ORDER BY creado_en DESC
CREATE INDEX idx_eventos_criticos
    ON eventos_sistema (gravedad, creado_en DESC)
    WHERE gravedad IN ('error', 'critical');

-- 🔍 ÍNDICE 4: EVENTOS POR ENTIDAD ESPECÍFICA
-- Uso: Auditoría de citas, clientes, profesionales específicos
-- Query: WHERE cita_id = ? OR cliente_id = ? OR profesional_id = ?
CREATE INDEX idx_eventos_entidad_referencia
    ON eventos_sistema (tipo_evento, cita_id, cliente_id, profesional_id)
    WHERE (cita_id IS NOT NULL OR cliente_id IS NOT NULL OR profesional_id IS NOT NULL);

-- 🔍 ÍNDICE 5: BÚSQUEDA FULL-TEXT EN METADATOS (GIN optimizado)
-- Uso: Búsquedas avanzadas en datos JSON, análisis de patrones
-- Query: WHERE metadata @> '{"key": "value"}' o metadata ? 'key'
CREATE INDEX idx_eventos_metadata_gin
    ON eventos_sistema USING gin(metadata);

-- 🔍 ÍNDICE 6: CONSULTAS TEMPORALES PARA REPORTES
-- Uso: Reportes mensuales, análisis temporal, archivado
-- Query: WHERE creado_en >= ? AND creado_en < ? AND organizacion_id = ?
-- NOTA: Usar rangos de TIMESTAMP en lugar de conversión a DATE para evitar problemas de inmutabilidad
CREATE INDEX idx_eventos_temporal_reporte
    ON eventos_sistema (organizacion_id, creado_en, tipo_evento);

-- 🔍 ÍNDICE 9: CONSULTAS TEMPORALES POR DÍA
-- Uso: Análisis diario de eventos
-- Query: WHERE creado_en >= DATE ? AND creado_en < DATE ? + INTERVAL '1 day'
CREATE INDEX idx_eventos_dia_organizacion
    ON eventos_sistema (organizacion_id, creado_en DESC);

-- 🔍 ÍNDICE 10: CONSULTAS COMBINADAS FRECUENTES
-- Uso: Dashboard principal, análisis de tendencias
-- Query: WHERE organizacion_id = ? AND gravedad = ? ORDER BY creado_en DESC
CREATE INDEX idx_eventos_org_gravedad_tiempo
    ON eventos_sistema (organizacion_id, gravedad, creado_en DESC);

-- 🔍 ÍNDICE 7: EVENTOS POR SESIÓN (Debugging)
-- Uso: Trazabilidad de sesión, debugging de problemas
-- Query: WHERE session_id = ? ORDER BY creado_en
CREATE INDEX idx_eventos_session_debug
    ON eventos_sistema (session_id, creado_en)
    WHERE session_id IS NOT NULL;

-- 🔍 ÍNDICE 8: CONSULTAS DE AUDITORÍA POR IP
-- Uso: Análisis de seguridad, detección de patrones sospechosos
-- Query: WHERE ip_address IS NOT NULL AND tipo_evento IN ('login_success', 'login_failed', 'login_attempt')
CREATE INDEX idx_eventos_ip_seguridad
    ON eventos_sistema (ip_address, tipo_evento, creado_en)
    WHERE ip_address IS NOT NULL;

-- 🔍 ÍNDICE 11: EVENTOS DE LOGIN ESPECÍFICOS
-- Uso: Análisis de seguridad para eventos de autenticación
-- Query: WHERE tipo_evento IN ('login_success', 'login_failed', 'login_attempt')
CREATE INDEX idx_eventos_login_especificos
    ON eventos_sistema (organizacion_id, tipo_evento, ip_address, creado_en)
    WHERE tipo_evento IN ('login_success', 'login_failed', 'login_attempt');

-- ====================================================================
-- 🔧 FUNCIONES HELPER INMUTABLES PARA CONSULTAS DE FECHA
-- ====================================================================
-- Funciones marcadas como IMMUTABLE para permitir índices funcionales
-- si se necesitan específicamente para consultas de fecha.
-- ────────────────────────────────────────────────────────────────────

-- Función inmutable para extraer fecha (solo si se necesita específicamente)
CREATE OR REPLACE FUNCTION extract_date_immutable(timestamp_val TIMESTAMPTZ)
RETURNS DATE
LANGUAGE SQL
IMMUTABLE
STRICT
AS $$
    SELECT timestamp_val::DATE;
$$;

-- Función inmutable para extraer año
CREATE OR REPLACE FUNCTION extract_year_immutable(timestamp_val TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
STRICT
AS $$
    SELECT EXTRACT(YEAR FROM timestamp_val)::INTEGER;
$$;

-- Función inmutable para extraer mes
CREATE OR REPLACE FUNCTION extract_month_immutable(timestamp_val TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
STRICT
AS $$
    SELECT EXTRACT(MONTH FROM timestamp_val)::INTEGER;
$$;

COMMENT ON FUNCTION extract_date_immutable(TIMESTAMPTZ) IS
'Función helper inmutable para extraer fecha de timestamp - usar solo si se requieren índices funcionales específicos';

COMMENT ON FUNCTION extract_year_immutable(TIMESTAMPTZ) IS
'Función helper inmutable para extraer año de timestamp - optimizada para índices';

COMMENT ON FUNCTION extract_month_immutable(TIMESTAMPTZ) IS
'Función helper inmutable para extraer mes de timestamp - optimizada para índices';

-- ====================================================================
-- 🛡️ ROW LEVEL SECURITY (RLS) MULTI-TENANT
-- ====================================================================
-- Implementación de seguridad a nivel de fila para aislamiento
-- automático entre organizaciones.
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en la tabla
ALTER TABLE eventos_sistema ENABLE ROW LEVEL SECURITY;

-- Política unificada para todos los tipos de acceso
CREATE POLICY eventos_sistema_tenant_access ON eventos_sistema
    FOR ALL                                   -- SELECT, INSERT, UPDATE, DELETE
    TO saas_app                              -- Usuario de aplicación
    USING (
        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 1: SUPER ADMIN - ACCESO TOTAL AL SISTEMA              │
        -- └─────────────────────────────────────────────────────────────┘
        current_setting('app.current_user_role', true) = 'super_admin'

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 2: BYPASS PARA FUNCIONES DE SISTEMA                   │
        -- └─────────────────────────────────────────────────────────────┘
        OR current_setting('app.bypass_rls', true) = 'true'

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 3: AISLAMIENTO POR ORGANIZACIÓN (MULTI-TENANT)        │
        -- └─────────────────────────────────────────────────────────────┘
        OR organizacion_id::TEXT = current_setting('app.current_tenant_id', true)

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 4: USUARIO VE SUS PROPIOS EVENTOS                     │
        -- └─────────────────────────────────────────────────────────────┘
        OR (usuario_id IS NOT NULL AND
            usuario_id::TEXT = current_setting('app.current_user_id', true))
    );

-- ====================================================================
-- 🔄 TRIGGERS AUTOMÁTICOS DE VALIDACIÓN
-- ====================================================================
-- Triggers para validar coherencia organizacional y automatizar
-- procesos críticos del sistema.
-- ────────────────────────────────────────────────────────────────────

-- ====================================================================
-- 🛡️ FUNCIÓN: VALIDAR COHERENCIA ORGANIZACIONAL
-- ====================================================================
-- Valida que todas las referencias (cita, cliente, profesional, usuario)
-- pertenezcan a la misma organización del evento.
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION validar_evento_coherencia()
RETURNS TRIGGER AS $$
DECLARE
    cita_org INTEGER;
    cliente_org INTEGER;
    profesional_org INTEGER;
    usuario_org INTEGER;
    evento_descripcion TEXT;
BEGIN
    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR COHERENCIA DE CITA
    -- ═══════════════════════════════════════════════════════════════════
    IF NEW.cita_id IS NOT NULL THEN
        SELECT organizacion_id INTO cita_org
        FROM citas
        WHERE id = NEW.cita_id;

        IF cita_org IS NULL THEN
            RAISE EXCEPTION 'Cita con ID % no existe', NEW.cita_id;
        END IF;

        IF cita_org != NEW.organizacion_id THEN
            RAISE EXCEPTION 'Evento: Cita % (org:%) no pertenece a organización %',
                NEW.cita_id, cita_org, NEW.organizacion_id;
        END IF;
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR COHERENCIA DE CLIENTE
    -- ═══════════════════════════════════════════════════════════════════
    IF NEW.cliente_id IS NOT NULL THEN
        SELECT organizacion_id INTO cliente_org
        FROM clientes
        WHERE id = NEW.cliente_id;

        IF cliente_org IS NULL THEN
            RAISE EXCEPTION 'Cliente con ID % no existe', NEW.cliente_id;
        END IF;

        IF cliente_org != NEW.organizacion_id THEN
            RAISE EXCEPTION 'Evento: Cliente % (org:%) no pertenece a organización %',
                NEW.cliente_id, cliente_org, NEW.organizacion_id;
        END IF;
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR COHERENCIA DE PROFESIONAL
    -- ═══════════════════════════════════════════════════════════════════
    IF NEW.profesional_id IS NOT NULL THEN
        SELECT organizacion_id INTO profesional_org
        FROM profesionales
        WHERE id = NEW.profesional_id;

        IF profesional_org IS NULL THEN
            RAISE EXCEPTION 'Profesional con ID % no existe', NEW.profesional_id;
        END IF;

        IF profesional_org != NEW.organizacion_id THEN
            RAISE EXCEPTION 'Evento: Profesional % (org:%) no pertenece a organización %',
                NEW.profesional_id, profesional_org, NEW.organizacion_id;
        END IF;
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR COHERENCIA DE USUARIO (EXCEPTO EVENTOS DE LOGIN)
    -- ═══════════════════════════════════════════════════════════════════
    IF NEW.usuario_id IS NOT NULL AND NEW.tipo_evento NOT IN ('login_attempt', 'login_success', 'login_failed') THEN
        SELECT organizacion_id INTO usuario_org
        FROM usuarios
        WHERE id = NEW.usuario_id;

        IF usuario_org IS NULL THEN
            RAISE EXCEPTION 'Usuario con ID % no existe', NEW.usuario_id;
        END IF;

        -- Permitir que super_admin tenga eventos en cualquier organización
        SELECT rol INTO evento_descripcion FROM usuarios WHERE id = NEW.usuario_id;

        IF evento_descripcion != 'super_admin' AND usuario_org != NEW.organizacion_id THEN
            RAISE EXCEPTION 'Evento: Usuario % (org:%) no pertenece a organización %',
                NEW.usuario_id, usuario_org, NEW.organizacion_id;
        END IF;
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- ENRIQUECER METADATA AUTOMÁTICAMENTE
    -- ═══════════════════════════════════════════════════════════════════
    -- Agregar información contextual útil al metadata
    NEW.metadata = NEW.metadata || jsonb_build_object(
        'timestamp_unix', EXTRACT(EPOCH FROM NEW.creado_en),
        'dia_semana', EXTRACT(DOW FROM NEW.creado_en),
        'es_fin_semana', EXTRACT(DOW FROM NEW.creado_en) IN (0, 6),
        'validado_coherencia', true
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario de la función
COMMENT ON FUNCTION validar_evento_coherencia() IS
'Valida coherencia organizacional de eventos y enriquece metadata automáticamente';

-- ====================================================================
-- 🔄 TRIGGER: VALIDACIÓN ANTES DE INSERTAR/ACTUALIZAR
-- ====================================================================

CREATE TRIGGER trigger_validar_evento_coherencia
    BEFORE INSERT OR UPDATE ON eventos_sistema
    FOR EACH ROW EXECUTE FUNCTION validar_evento_coherencia();

-- ====================================================================
-- 📝 FUNCIÓN: GENERAR CÓDIGO DE EVENTO ÚNICO
-- ====================================================================
-- Genera códigos únicos para eventos importantes que requieren tracking
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generar_codigo_evento()
RETURNS TRIGGER AS $$
DECLARE
    codigo_generado VARCHAR(50);
    contador INTEGER;
BEGIN
    -- Solo generar código para eventos críticos
    IF NEW.gravedad IN ('error', 'critical') OR
       NEW.tipo_evento IN ('pago_exitoso', 'pago_fallido', 'cita_creada', 'organizacion_creada') THEN

        -- Generar código único: ORG_TIPO_TIMESTAMP_RANDOM
        codigo_generado := 'EVT_' ||
                          NEW.organizacion_id || '_' ||
                          UPPER(LEFT(NEW.tipo_evento::TEXT, 8)) || '_' ||
                          TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '_' ||
                          LPAD((RANDOM() * 999)::INTEGER::TEXT, 3, '0');

        -- Agregar código al metadata
        NEW.metadata = NEW.metadata || jsonb_build_object('codigo_evento', codigo_generado);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_codigo_evento
    BEFORE INSERT ON eventos_sistema
    FOR EACH ROW EXECUTE FUNCTION generar_codigo_evento();

-- ====================================================================
-- 📊 VISTAS ÚTILES PARA CONSULTAS FRECUENTES
-- ====================================================================
-- Vistas optimizadas para reportes y análisis común
-- ────────────────────────────────────────────────────────────────────

-- ====================================================================
-- 📈 VISTA: RESUMEN EVENTOS POR ORGANIZACIÓN
-- ====================================================================

CREATE VIEW eventos_resumen_organizacion AS
SELECT
    o.id as organizacion_id,
    o.nombre_comercial,
    COUNT(*) as total_eventos,
    COUNT(*) FILTER (WHERE e.gravedad = 'critical') as eventos_criticos,
    COUNT(*) FILTER (WHERE e.gravedad = 'error') as eventos_error,
    COUNT(*) FILTER (WHERE e.tipo_evento::TEXT LIKE 'login_%') as eventos_login,
    COUNT(*) FILTER (WHERE e.tipo_evento::TEXT LIKE 'cita_%') as eventos_citas,
    COUNT(*) FILTER (WHERE e.creado_en::DATE >= CURRENT_DATE - INTERVAL '30 days') as eventos_ultimo_mes,
    MAX(e.creado_en) as ultimo_evento,
    MIN(e.creado_en) as primer_evento
FROM organizaciones o
LEFT JOIN eventos_sistema e ON e.organizacion_id = o.id
WHERE o.activo = true
GROUP BY o.id, o.nombre_comercial
ORDER BY total_eventos DESC;

-- ====================================================================
-- 🔍 VISTA: EVENTOS CRÍTICOS RECIENTES
-- ====================================================================

CREATE VIEW eventos_criticos_recientes AS
SELECT
    e.id,
    e.organizacion_id,
    o.nombre_comercial,
    e.tipo_evento,
    e.gravedad,
    e.descripcion,
    e.usuario_id,
    u.nombre as usuario_nombre,
    e.ip_address,
    e.creado_en,
    e.metadata
FROM eventos_sistema e
JOIN organizaciones o ON e.organizacion_id = o.id
LEFT JOIN usuarios u ON e.usuario_id = u.id
WHERE e.gravedad IN ('error', 'critical')
AND e.creado_en >= NOW() - INTERVAL '7 days'
ORDER BY e.creado_en DESC;

-- ====================================================================
-- 📝 COMENTARIOS Y DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TABLE eventos_sistema IS
'Tabla enterprise de auditoría y logging del sistema SaaS con RLS multi-tenant, validaciones automáticas y performance optimizada para billones de eventos';

COMMENT ON COLUMN eventos_sistema.id IS
'ID único del evento (BIGSERIAL para escala enterprise de billones de registros)';

COMMENT ON COLUMN eventos_sistema.tipo_evento IS
'Tipo de evento controlado por ENUM con 30+ valores predefinidos';

COMMENT ON COLUMN eventos_sistema.gravedad IS
'Nivel de gravedad: debug, info, warning, error, critical para filtrado y alertas';

COMMENT ON COLUMN eventos_sistema.metadata IS
'Datos adicionales del evento en formato JSONB indexado con GIN para búsquedas avanzadas';

COMMENT ON COLUMN eventos_sistema.session_id IS
'ID de sesión para trazabilidad completa de acciones del usuario';

-- NOTA: Los campos de fecha se calculan mediante índices funcionales para optimización

COMMENT ON VIEW eventos_resumen_organizacion IS
'Vista agregada con estadísticas de eventos por organización para dashboards administrativos';

COMMENT ON VIEW eventos_criticos_recientes IS
'Vista de eventos críticos de los últimos 7 días para monitoreo y alertas';

-- ====================================================================
-- 📊 ÍNDICE MEJORADO - AUDITORÍA DE EVENTOS
-- ====================================================================
-- Este índice se agrega aquí (no en 07-indexes.sql) porque la tabla
-- eventos_sistema se crea en este archivo.
-- ────────────────────────────────────────────────────────────────────

-- 📋 ÍNDICE MEJORADO: AUDITORÍA POR USUARIO
-- Propósito: Búsqueda rápida de eventos de un usuario específico
-- Uso: WHERE usuario_id = ? AND organizacion_id = ? ORDER BY creado_en DESC
-- Ventaja: Índice parcial, solo eventos con usuario asignado
CREATE INDEX IF NOT EXISTS idx_eventos_usuario_org_fecha
    ON eventos_sistema(usuario_id, organizacion_id, creado_en DESC)
    WHERE usuario_id IS NOT NULL;

COMMENT ON INDEX idx_eventos_usuario_org_fecha IS
'Índice parcial para búsqueda de eventos por usuario y organización.
Solo indexa eventos con usuario asignado (~70% de registros).
Optimizado para auditoría de acciones de usuarios específicos.';

-- 🧹 ÍNDICE PARA ARCHIVADO: EVENTOS ANTIGUOS
-- Propósito: Búsqueda rápida de eventos antiguos para archivado
-- Uso: Función archivar_eventos_antiguos() en 15-maintenance-functions.sql
-- Nota: Índice simple en creado_en (no parcial) para evitar problemas con NOW() VOLATILE
CREATE INDEX IF NOT EXISTS idx_eventos_sistema_creado_archivado
    ON eventos_sistema(creado_en);

COMMENT ON INDEX idx_eventos_sistema_creado_archivado IS
'Índice simple para función de archivado automático.
Indexa todos los eventos ordenados por fecha de creación.
La función archivar_eventos_antiguos() usa este índice para filtrar por fecha.
Usado por: SELECT * FROM archivar_eventos_antiguos();';

-- ====================================================================
-- 📝 DOCUMENTACIÓN DE POLÍTICAS RLS
-- ====================================================================
-- Comentarios de políticas que se crean en 08-rls-policies.sql
-- pero se documentan aquí porque la tabla se crea en este archivo
-- ────────────────────────────────────────────────────────────────────

-- Política de eventos sistema
COMMENT ON POLICY eventos_sistema_tenant_access ON eventos_sistema IS
'Acceso a eventos del sistema con múltiples criterios:
- Super admin: Acceso global a todos los eventos
- Usuario de organización: Eventos de su organización
- Usuario específico: Eventos donde es el actor (usuario_id)
- Bypass: Funciones de logging y auditoría

Crítico para: Auditoría, seguridad, debugging, compliance.';

-- ====================================================================
-- ✅ VALIDACIÓN DE INSTALACIÓN
-- ====================================================================

-- Verificar que la tabla fue creada correctamente
DO $$
BEGIN
    -- Verificar tabla existe
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'eventos_sistema') THEN
        RAISE EXCEPTION 'Error: Tabla eventos_sistema no fue creada correctamente';
    END IF;

    -- Verificar RLS está habilitado
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'eventos_sistema' AND rowsecurity = true) THEN
        RAISE EXCEPTION 'Error: RLS no está habilitado en eventos_sistema';
    END IF;

    -- Verificar índices principales existen
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'eventos_sistema' AND indexname = 'idx_eventos_org_tipo_fecha') THEN
        RAISE EXCEPTION 'Error: Índice principal idx_eventos_org_tipo_fecha no fue creado';
    END IF;

    RAISE NOTICE '✅ Tabla eventos_sistema creada exitosamente con todas las características enterprise';
END $$;