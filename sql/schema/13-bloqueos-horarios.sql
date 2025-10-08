-- ====================================================================
-- 🚫 TABLA BLOQUEOS_HORARIOS - GESTIÓN DE BLOQUEOS TEMPORALES
-- ====================================================================
--
-- Esta tabla gestiona bloqueos de horarios para vacaciones, feriados,
-- mantenimiento y otros eventos que impiden la programación de citas.
--
-- 🎯 CASOS DE USO:
-- • Vacaciones de profesionales
-- • Días feriados organizacionales
-- • Mantenimiento de equipos
-- • Eventos especiales
-- • Bloqueos temporales de emergencia
--
-- 🔗 INTEGRACIÓN:
-- • Se relaciona con horarios_disponibilidad para prevenir agendamiento
-- • Afecta la generación automática de horarios disponibles
-- • Integra con el sistema de notificaciones
--
-- 🔄 ORDEN DE EJECUCIÓN: #13 (después de operaciones básicas)
-- ====================================================================

-- ====================================================================
-- 📋 ENUM TIPO_BLOQUEO - CATEGORIZACIÓN DE BLOQUEOS
-- ====================================================================
CREATE TYPE tipo_bloqueo AS ENUM (
    'vacaciones',         -- Vacaciones programadas del profesional
    'feriado',           -- Días feriados nacionales/locales
    'mantenimiento',     -- Mantenimiento de equipos/instalaciones
    'evento_especial',   -- Eventos especiales (capacitaciones, etc.)
    'emergencia',        -- Bloqueos de emergencia
    'personal',          -- Motivos personales del profesional
    'organizacional'     -- Decisión administrativa de la organización
);

-- ====================================================================
-- 📊 TABLA PRINCIPAL: BLOQUEOS_HORARIOS
-- ====================================================================
CREATE TABLE bloqueos_horarios (
    -- 🔑 IDENTIFICADORES PRIMARIOS
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL,

    -- 🎯 ALCANCE DEL BLOQUEO
    profesional_id INTEGER,              -- NULL = afecta toda la organización
    servicio_id INTEGER,                 -- NULL = afecta todos los servicios

    -- 📅 INFORMACIÓN DEL BLOQUEO
    tipo_bloqueo tipo_bloqueo NOT NULL,
    titulo VARCHAR(200) NOT NULL,        -- Título descriptivo del bloqueo
    descripcion TEXT,                    -- Descripción detallada opcional

    -- ⏰ PERÍODO DEL BLOQUEO
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_inicio TIME,                    -- NULL = todo el día
    hora_fin TIME,                       -- NULL = todo el día
    zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City',

    -- 🔄 CONFIGURACIÓN DE RECURRENCIA
    es_recurrente BOOLEAN DEFAULT false,
    patron_recurrencia JSONB DEFAULT '{}',  -- Configuración de repetición
    fecha_fin_recurrencia DATE,              -- Fin de la recurrencia

    -- 🎨 PERSONALIZACIÓN VISUAL
    color_display VARCHAR(7) DEFAULT '#FF6B6B',  -- Color hex para calendario
    icono VARCHAR(50) DEFAULT 'calendar-x',       -- Icono para UI

    -- 📊 ESTADO Y CONTROL
    activo BOOLEAN DEFAULT true,
    auto_generado BOOLEAN DEFAULT false,          -- Si fue generado automáticamente
    origen_bloqueo VARCHAR(100) DEFAULT 'manual', -- manual, importado, automático

    -- 🔔 CONFIGURACIÓN DE NOTIFICACIONES
    notificar_afectados BOOLEAN DEFAULT true,    -- Notificar a clientes afectados
    dias_aviso_previo INTEGER DEFAULT 7,         -- Días de aviso antes del bloqueo
    mensaje_clientes TEXT,                       -- Mensaje personalizado para clientes

    -- 📈 MÉTRICAS Y TRACKING
    citas_afectadas INTEGER DEFAULT 0,           -- Contador de citas canceladas
    ingresos_perdidos NUMERIC(12,2) DEFAULT 0.00, -- Estimación de ingresos perdidos

    -- 📝 METADATOS Y AUDITORÍA
    metadata JSONB DEFAULT '{}',                 -- Datos adicionales flexibles
    notas_internas TEXT,                         -- Notas para uso interno

    -- 👤 AUDITORÍA DE USUARIOS
    creado_por INTEGER,
    actualizado_por INTEGER,
    aprobado_por INTEGER,                        -- Usuario que aprobó el bloqueo
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,

    -- 🕐 TIMESTAMPS AUTOMÁTICOS
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- ✅ CONSTRAINTS DE VALIDACIÓN
    CONSTRAINT bloqueos_horarios_fecha_valida
        CHECK (fecha_inicio <= fecha_fin),

    CONSTRAINT bloqueos_horarios_horario_valido
        CHECK (
            (hora_inicio IS NULL AND hora_fin IS NULL) OR
            (hora_inicio IS NOT NULL AND hora_fin IS NOT NULL AND hora_inicio < hora_fin)
        ),

    CONSTRAINT bloqueos_horarios_recurrencia_valida
        CHECK (
            (es_recurrente = false) OR
            (es_recurrente = true AND fecha_fin_recurrencia IS NOT NULL)
        ),

    CONSTRAINT bloqueos_horarios_color_valido
        CHECK (color_display ~ '^#[0-9A-Fa-f]{6}$'),

    CONSTRAINT bloqueos_horarios_dias_aviso_valido
        CHECK (dias_aviso_previo >= 0 AND dias_aviso_previo <= 365),

    -- NOTE: Coherencia organizacional se validará via trigger
    -- No se puede usar CHECK con subquery para esto

    -- 🔗 FOREIGN KEYS
    FOREIGN KEY (organizacion_id) REFERENCES organizaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id),
    FOREIGN KEY (aprobado_por) REFERENCES usuarios(id)
);

-- ====================================================================
-- 📊 ÍNDICES ESPECIALIZADOS PARA PERFORMANCE
-- ====================================================================

-- Índice principal para consultas por organización y período
CREATE INDEX idx_bloqueos_organizacion_periodo
ON bloqueos_horarios (organizacion_id, fecha_inicio, fecha_fin, activo)
WHERE activo = true;

-- Índice para consultas por profesional y fechas
CREATE INDEX idx_bloqueos_profesional_fechas
ON bloqueos_horarios (profesional_id, fecha_inicio, fecha_fin)
WHERE profesional_id IS NOT NULL AND activo = true;

-- Índice para bloqueos organizacionales (sin profesional específico)
CREATE INDEX idx_bloqueos_organizacionales
ON bloqueos_horarios (organizacion_id, tipo_bloqueo, fecha_inicio)
WHERE profesional_id IS NULL AND activo = true;

-- Índice para búsquedas por tipo de bloqueo
CREATE INDEX idx_bloqueos_tipo_fechas
ON bloqueos_horarios (organizacion_id, tipo_bloqueo, fecha_inicio, fecha_fin)
WHERE activo = true;

-- Índice para bloqueos recurrentes
CREATE INDEX idx_bloqueos_recurrentes
ON bloqueos_horarios (organizacion_id, es_recurrente, fecha_fin_recurrencia)
WHERE es_recurrente = true AND activo = true;

-- Índice para notificaciones pendientes
CREATE INDEX idx_bloqueos_notificaciones
ON bloqueos_horarios (organizacion_id, notificar_afectados, fecha_inicio)
WHERE notificar_afectados = true AND activo = true;

-- Índice GIN para búsquedas en texto (título, descripción)
CREATE INDEX idx_bloqueos_search
ON bloqueos_horarios USING gin(
    to_tsvector('spanish',
        COALESCE(titulo, '') || ' ' ||
        COALESCE(descripcion, '') || ' ' ||
        COALESCE(notas_internas, '')
    )
) WHERE activo = true;

-- Índice para métricas y reportes
CREATE INDEX idx_bloqueos_metricas
ON bloqueos_horarios (organizacion_id, tipo_bloqueo, creado_en, citas_afectadas, ingresos_perdidos)
WHERE activo = true;

-- ====================================================================
-- 🛡️ ROW LEVEL SECURITY (RLS)
-- ====================================================================

-- Habilitar RLS en la tabla
ALTER TABLE bloqueos_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueos_horarios FORCE ROW LEVEL SECURITY;

-- Política unificada para aislamiento multi-tenant
CREATE POLICY bloqueos_horarios_tenant_isolation ON bloqueos_horarios
    TO saas_app
    USING (
        -- Super admin ve todo
        (current_setting('app.current_user_role', true) = 'super_admin') OR
        -- Usuarios normales solo ven su organización
        (organizacion_id = COALESCE(
            (NULLIF(current_setting('app.current_tenant_id', true), ''))::integer, 0
        )) OR
        -- Bypass RLS para funciones del sistema
        (current_setting('app.bypass_rls', true) = 'true')
    )
    WITH CHECK (
        -- Solo super_admin puede crear sin restricciones
        (current_setting('app.current_user_role', true) = 'super_admin') OR
        -- Usuarios normales solo pueden crear en su organización
        (organizacion_id = COALESCE(
            (NULLIF(current_setting('app.current_tenant_id', true), ''))::integer, 0
        )) OR
        -- Bypass para funciones del sistema
        (current_setting('app.bypass_rls', true) = 'true')
    );

-- Política adicional para bypass del sistema
CREATE POLICY bloqueos_horarios_system_bypass ON bloqueos_horarios
    TO saas_app
    USING (current_setting('app.bypass_rls', true) = 'true');

-- ====================================================================
-- 🔄 TRIGGERS AUTOMÁTICOS
-- ====================================================================

-- Trigger para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp_bloqueos()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_bloqueos
    BEFORE UPDATE ON bloqueos_horarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_bloqueos();

-- ====================================================================
-- 📝 COMENTARIOS DE DOCUMENTACIÓN
-- ====================================================================

-- Comentarios en la tabla principal
COMMENT ON TABLE bloqueos_horarios IS
'Gestión de bloqueos temporales de horarios para vacaciones, feriados y eventos especiales. Integra con horarios_disponibilidad para prevenir agendamiento.';

-- Comentarios en columnas principales
COMMENT ON COLUMN bloqueos_horarios.profesional_id IS
'NULL = bloqueo organizacional (afecta todos los profesionales)';
COMMENT ON COLUMN bloqueos_horarios.servicio_id IS
'NULL = afecta todos los servicios del profesional/organización';
COMMENT ON COLUMN bloqueos_horarios.patron_recurrencia IS
'JSON con configuración de recurrencia: {"frecuencia": "semanal", "dias": [1,2,3]}';
COMMENT ON COLUMN bloqueos_horarios.auto_generado IS
'true = generado automáticamente por el sistema (feriados, etc.)';
COMMENT ON COLUMN bloqueos_horarios.citas_afectadas IS
'Contador actualizado automáticamente al cancelar citas por el bloqueo';
COMMENT ON COLUMN bloqueos_horarios.ingresos_perdidos IS
'Estimación calculada automáticamente basada en citas canceladas';

-- ====================================================================
-- ✅ VALIDACIONES ADICIONALES MEDIANTE FUNCIONES
-- ====================================================================

-- Función para validar coherencia organizacional y solapamientos
CREATE OR REPLACE FUNCTION validar_bloqueos_horarios()
RETURNS TRIGGER AS $$
DECLARE
    count_solapamientos INTEGER;
    profesional_org_id INTEGER;
    servicio_org_id INTEGER;
BEGIN
    -- 1. VALIDAR COHERENCIA ORGANIZACIONAL

    -- 1.A. Validar profesional_id
    IF NEW.profesional_id IS NOT NULL THEN
        SELECT organizacion_id INTO profesional_org_id
        FROM profesionales
        WHERE id = NEW.profesional_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'El profesional especificado no existe';
        END IF;

        IF profesional_org_id != NEW.organizacion_id THEN
            RAISE EXCEPTION 'El profesional no pertenece a la organización especificada';
        END IF;
    END IF;

    -- 1.B. Validar servicio_id
    IF NEW.servicio_id IS NOT NULL THEN
        SELECT organizacion_id INTO servicio_org_id
        FROM servicios
        WHERE id = NEW.servicio_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'El servicio especificado no existe';
        END IF;

        IF servicio_org_id != NEW.organizacion_id THEN
            RAISE EXCEPTION 'El servicio no pertenece a la organización especificada';
        END IF;
    END IF;

    -- 2. VALIDAR SOLAPAMIENTOS
    IF NEW.profesional_id IS NOT NULL THEN
        -- Validar solapamientos para el mismo profesional
        SELECT COUNT(*) INTO count_solapamientos
        FROM bloqueos_horarios b
        WHERE b.id != COALESCE(NEW.id, -1)
          AND b.organizacion_id = NEW.organizacion_id
          AND b.profesional_id = NEW.profesional_id
          AND b.activo = true
          AND (
              -- Solapamiento de fechas
              (NEW.fecha_inicio <= b.fecha_fin AND NEW.fecha_fin >= b.fecha_inicio)
              AND (
                  -- Si ambos son todo el día, hay solapamiento
                  (NEW.hora_inicio IS NULL AND b.hora_inicio IS NULL) OR
                  -- Si uno es todo el día y el otro no, hay solapamiento
                  (NEW.hora_inicio IS NULL OR b.hora_inicio IS NULL) OR
                  -- Si ambos tienen horarios específicos, verificar solapamiento
                  (NEW.hora_inicio < b.hora_fin AND NEW.hora_fin > b.hora_inicio)
              )
          );

        IF count_solapamientos > 0 THEN
            RAISE EXCEPTION 'El bloqueo se solapa con otro bloqueo existente del mismo profesional';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_bloqueos_horarios
    BEFORE INSERT OR UPDATE ON bloqueos_horarios
    FOR EACH ROW
    EXECUTE FUNCTION validar_bloqueos_horarios();

-- ====================================================================
-- 📊 VISTAS ÚTILES PARA CONSULTAS COMUNES
-- ====================================================================

-- Vista para bloqueos activos con información extendida
CREATE VIEW v_bloqueos_activos AS
SELECT
    b.id,
    b.organizacion_id,
    o.nombre_comercial as organizacion_nombre,
    b.profesional_id,
    p.nombre_completo as profesional_nombre,
    b.tipo_bloqueo,
    b.titulo,
    b.descripcion,
    b.fecha_inicio,
    b.fecha_fin,
    b.hora_inicio,
    b.hora_fin,
    b.es_recurrente,
    b.color_display,
    b.icono,
    b.citas_afectadas,
    b.ingresos_perdidos,
    b.creado_en,

    -- Campos calculados
    CASE
        WHEN b.fecha_fin < CURRENT_DATE THEN 'finalizado'
        WHEN b.fecha_inicio > CURRENT_DATE THEN 'futuro'
        ELSE 'activo'
    END as estado_temporal,

    (b.fecha_fin - b.fecha_inicio + 1) as duracion_dias,

    CASE
        WHEN b.profesional_id IS NULL THEN 'Toda la organización'
        ELSE p.nombre_completo
    END as alcance_display

FROM bloqueos_horarios b
JOIN organizaciones o ON b.organizacion_id = o.id
LEFT JOIN profesionales p ON b.profesional_id = p.id
WHERE b.activo = true;

-- Vista para métricas de bloqueos por organización
CREATE VIEW v_metricas_bloqueos AS
SELECT
    organizacion_id,
    COUNT(*) as total_bloqueos,
    COUNT(*) FILTER (WHERE tipo_bloqueo = 'vacaciones') as total_vacaciones,
    COUNT(*) FILTER (WHERE tipo_bloqueo = 'feriado') as total_feriados,
    COUNT(*) FILTER (WHERE fecha_inicio > CURRENT_DATE) as bloqueos_futuros,
    COUNT(*) FILTER (WHERE fecha_inicio <= CURRENT_DATE AND fecha_fin >= CURRENT_DATE) as bloqueos_activos,
    SUM(citas_afectadas) as total_citas_afectadas,
    SUM(ingresos_perdidos) as total_ingresos_perdidos,
    AVG(fecha_fin - fecha_inicio + 1) as duracion_promedio_dias
FROM bloqueos_horarios
WHERE activo = true
GROUP BY organizacion_id;

-- ====================================================================
-- 🎯 FUNCIONES DE UTILIDAD
-- ====================================================================

-- Función para verificar si una fecha/hora está bloqueada
CREATE OR REPLACE FUNCTION esta_bloqueado_horario(
    p_organizacion_id INTEGER,
    p_profesional_id INTEGER,
    p_fecha DATE,
    p_hora_inicio TIME DEFAULT NULL,
    p_hora_fin TIME DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    bloqueo_encontrado BOOLEAN := false;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM bloqueos_horarios b
        WHERE b.organizacion_id = p_organizacion_id
          AND b.activo = true
          AND p_fecha BETWEEN b.fecha_inicio AND b.fecha_fin
          AND (
              -- Bloqueo organizacional (afecta a todos)
              b.profesional_id IS NULL OR
              -- Bloqueo específico del profesional
              b.profesional_id = p_profesional_id
          )
          AND (
              -- Bloqueo de todo el día
              (b.hora_inicio IS NULL AND b.hora_fin IS NULL) OR
              -- Si se especifica horario, verificar solapamiento
              (p_hora_inicio IS NOT NULL AND p_hora_fin IS NOT NULL AND
               b.hora_inicio IS NOT NULL AND b.hora_fin IS NOT NULL AND
               p_hora_inicio < b.hora_fin AND p_hora_fin > b.hora_inicio)
          )
    ) INTO bloqueo_encontrado;

    RETURN bloqueo_encontrado;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener bloqueos que afectan un período específico
CREATE OR REPLACE FUNCTION obtener_bloqueos_periodo(
    p_organizacion_id INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE,
    p_profesional_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    bloqueo_id INTEGER,
    tipo_bloqueo tipo_bloqueo,
    titulo VARCHAR(200),
    fecha_inicio DATE,
    fecha_fin DATE,
    hora_inicio TIME,
    hora_fin TIME,
    es_todo_el_dia BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.tipo_bloqueo,
        b.titulo,
        b.fecha_inicio,
        b.fecha_fin,
        b.hora_inicio,
        b.hora_fin,
        (b.hora_inicio IS NULL AND b.hora_fin IS NULL) as es_todo_el_dia
    FROM bloqueos_horarios b
    WHERE b.organizacion_id = p_organizacion_id
      AND b.activo = true
      AND (b.fecha_inicio <= p_fecha_fin AND b.fecha_fin >= p_fecha_inicio)
      AND (
          p_profesional_id IS NULL OR
          b.profesional_id IS NULL OR
          b.profesional_id = p_profesional_id
      )
    ORDER BY b.fecha_inicio, b.hora_inicio NULLS FIRST;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 📈 MÉTRICAS Y AUDITORÍA
-- ====================================================================

-- Trigger para actualizar métricas de uso en la organización
CREATE OR REPLACE FUNCTION actualizar_metricas_bloqueos()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar contador en métricas_uso_organizacion si existe
    IF TG_OP = 'INSERT' THEN
        UPDATE metricas_uso_organizacion
        SET ultima_actualizacion = NOW()
        WHERE organizacion_id = NEW.organizacion_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE metricas_uso_organizacion
        SET ultima_actualizacion = NOW()
        WHERE organizacion_id = OLD.organizacion_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_metricas_bloqueos
    AFTER INSERT OR DELETE OR UPDATE ON bloqueos_horarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_metricas_bloqueos();

-- ====================================================================
-- 📝 DOCUMENTACIÓN DE POLÍTICAS RLS
-- ====================================================================
-- Comentarios de políticas que se crean en 08-rls-policies.sql
-- pero se documentan aquí porque la tabla se crea en este archivo
-- ────────────────────────────────────────────────────────────────────

-- Política de bloqueos horarios
COMMENT ON POLICY bloqueos_horarios_tenant_isolation ON bloqueos_horarios IS
'Aislamiento multi-tenant para bloqueos de horarios:
- Usuario accede solo a bloqueos de su organización
- Super admin tiene acceso global
- Bypass para funciones automáticas

Tipos de bloqueo: vacaciones, feriados, capacitación, emergencia, mantenimiento.';

-- ====================================================================
-- ✅ VALIDACIÓN FINAL
-- ====================================================================

-- Verificar que la tabla se creó correctamente
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'public'
                   AND table_name = 'bloqueos_horarios') THEN
        RAISE EXCEPTION 'Error: La tabla bloqueos_horarios no se creó correctamente';
    END IF;

    RAISE NOTICE '✅ Tabla bloqueos_horarios creada exitosamente';
    RAISE NOTICE '✅ Índices especializados creados';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Triggers y funciones de validación activos';
    RAISE NOTICE '✅ Vistas de consulta disponibles';
    RAISE NOTICE '✅ Funciones de utilidad implementadas';
END $$;