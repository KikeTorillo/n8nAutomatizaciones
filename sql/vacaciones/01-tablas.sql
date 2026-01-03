-- =====================================================
-- MÓDULO VACACIONES - Tablas Principales
-- Plan de Empleados Competitivo - Fase 3
-- Enero 2026
-- =====================================================

-- =====================================================
-- TABLA: politicas_vacaciones
-- Descripción: Configuración de vacaciones por organización
-- =====================================================
CREATE TABLE IF NOT EXISTS politicas_vacaciones (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Configuración básica
    dias_por_anio INTEGER NOT NULL DEFAULT 15,
    dias_maximos_acumulables INTEGER DEFAULT 30,
    dias_anticipacion_minimos INTEGER DEFAULT 7,

    -- Flujo de aprobación
    requiere_aprobacion BOOLEAN DEFAULT true,
    aprobador_tipo VARCHAR(30) DEFAULT 'supervisor',  -- 'supervisor', 'rrhh', 'rol_especifico'
    aprobador_rol_id INTEGER,                         -- ID de rol específico (sin FK por flexibilidad)

    -- Configuración avanzada
    permite_medios_dias BOOLEAN DEFAULT false,
    usar_niveles_antiguedad BOOLEAN DEFAULT true,     -- Usar tabla niveles_vacaciones
    ignorar_festivos BOOLEAN DEFAULT true,            -- No contar días festivos
    permite_saldo_negativo BOOLEAN DEFAULT false,     -- Sobregiro permitido
    dias_maximos_consecutivos INTEGER DEFAULT 15,     -- Máx días seguidos

    -- Período de acumulación
    mes_inicio_periodo INTEGER DEFAULT 1,             -- Enero (1-12)
    dia_inicio_periodo INTEGER DEFAULT 1,

    -- Metadata
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_por INTEGER REFERENCES usuarios(id),

    CONSTRAINT politicas_unica_org UNIQUE(organizacion_id)
);

-- =====================================================
-- TABLA: saldos_vacaciones
-- Descripción: Saldo de días por profesional y año
-- =====================================================
CREATE TABLE IF NOT EXISTS saldos_vacaciones (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- Período
    anio INTEGER NOT NULL,

    -- Días
    dias_correspondientes DECIMAL(5,1) NOT NULL DEFAULT 0,   -- Días que le tocan
    dias_acumulados_anterior DECIMAL(5,1) DEFAULT 0,         -- Arrastre año anterior
    dias_usados DECIMAL(5,1) DEFAULT 0,                      -- Días tomados
    dias_ajuste_manual DECIMAL(5,1) DEFAULT 0,               -- Ajustes manuales (+/-)
    dias_solicitados_pendientes DECIMAL(5,1) DEFAULT 0,      -- Reservados en solicitudes pendientes

    -- Campo calculado
    dias_pendientes DECIMAL(5,1) GENERATED ALWAYS AS (
        dias_correspondientes + dias_acumulados_anterior + dias_ajuste_manual - dias_usados - dias_solicitados_pendientes
    ) STORED,

    -- Notas de ajuste
    notas_ajuste TEXT,

    -- Metadata
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_por INTEGER REFERENCES usuarios(id),

    CONSTRAINT saldos_unico_prof_anio UNIQUE(organizacion_id, profesional_id, anio)
);

-- =====================================================
-- TABLA: solicitudes_vacaciones
-- Descripción: Solicitudes con integración a bloqueos
-- =====================================================
CREATE TABLE IF NOT EXISTS solicitudes_vacaciones (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- Identificador único
    codigo VARCHAR(20) NOT NULL,  -- VAC-2026-0001

    -- Período solicitado
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    dias_solicitados DECIMAL(5,1) NOT NULL,
    es_medio_dia BOOLEAN DEFAULT false,
    turno_medio_dia VARCHAR(10),  -- 'manana', 'tarde' (solo si es_medio_dia=true)

    -- Estado
    estado VARCHAR(20) DEFAULT 'pendiente',  -- 'pendiente', 'aprobada', 'rechazada', 'cancelada'

    -- Aprobación
    aprobador_id INTEGER REFERENCES usuarios(id),
    fecha_decision TIMESTAMPTZ,
    motivo_rechazo TEXT,

    -- Integración con bloqueos
    bloqueo_id INTEGER REFERENCES bloqueos_horarios(id) ON DELETE SET NULL,

    -- Observaciones
    motivo_solicitud TEXT,
    notas_internas TEXT,

    -- Metadata
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_fechas_solicitud CHECK (fecha_inicio <= fecha_fin),
    CONSTRAINT chk_dias_positivos CHECK (dias_solicitados > 0),
    CONSTRAINT chk_estado_valido CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'cancelada')),
    CONSTRAINT solicitud_codigo_unico UNIQUE(organizacion_id, codigo)
);

-- =====================================================
-- TABLA: dias_festivos
-- Descripción: Días festivos por organización
-- =====================================================
CREATE TABLE IF NOT EXISTS dias_festivos (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    es_nacional BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT dias_festivos_unico UNIQUE(organizacion_id, fecha)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- dias_festivos
CREATE INDEX IF NOT EXISTS idx_dias_festivos_org_fecha ON dias_festivos(organizacion_id, fecha);

-- politicas_vacaciones
CREATE INDEX IF NOT EXISTS idx_politicas_vac_org ON politicas_vacaciones(organizacion_id);

-- saldos_vacaciones
CREATE INDEX IF NOT EXISTS idx_saldos_vac_org_prof ON saldos_vacaciones(organizacion_id, profesional_id);
CREATE INDEX IF NOT EXISTS idx_saldos_vac_anio ON saldos_vacaciones(organizacion_id, anio);
CREATE INDEX IF NOT EXISTS idx_saldos_vac_pendientes ON saldos_vacaciones(organizacion_id, profesional_id)
    WHERE dias_pendientes > 0;

-- solicitudes_vacaciones
CREATE INDEX IF NOT EXISTS idx_solicitudes_vac_org_prof ON solicitudes_vacaciones(organizacion_id, profesional_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_vac_estado ON solicitudes_vacaciones(organizacion_id, estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_vac_pendientes ON solicitudes_vacaciones(organizacion_id, estado)
    WHERE estado = 'pendiente';
CREATE INDEX IF NOT EXISTS idx_solicitudes_vac_fechas ON solicitudes_vacaciones(organizacion_id, fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_solicitudes_vac_bloqueo ON solicitudes_vacaciones(bloqueo_id)
    WHERE bloqueo_id IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE politicas_vacaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE saldos_vacaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_vacaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE dias_festivos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: politicas_vacaciones
CREATE POLICY politicas_vac_tenant_policy ON politicas_vacaciones
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Políticas RLS: saldos_vacaciones
CREATE POLICY saldos_vac_tenant_policy ON saldos_vacaciones
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Políticas RLS: solicitudes_vacaciones
CREATE POLICY solicitudes_vac_tenant_policy ON solicitudes_vacaciones
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Políticas RLS: dias_festivos
CREATE POLICY dias_festivos_tenant_policy ON dias_festivos
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Generar código de solicitud
CREATE OR REPLACE FUNCTION generar_codigo_solicitud_vacaciones(p_organizacion_id INTEGER)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_anio INTEGER;
    v_secuencia INTEGER;
BEGIN
    v_anio := EXTRACT(YEAR FROM CURRENT_DATE);

    SELECT COALESCE(MAX(
        CAST(SUBSTRING(codigo FROM 'VAC-\d{4}-(\d+)') AS INTEGER)
    ), 0) + 1 INTO v_secuencia
    FROM solicitudes_vacaciones
    WHERE organizacion_id = p_organizacion_id
      AND codigo LIKE 'VAC-' || v_anio || '-%';

    RETURN 'VAC-' || v_anio || '-' || LPAD(v_secuencia::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Calcular días hábiles entre dos fechas (excluyendo fines de semana y festivos)
CREATE OR REPLACE FUNCTION calcular_dias_habiles_vacaciones(
    p_organizacion_id INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE,
    p_ignorar_festivos BOOLEAN DEFAULT true
)
RETURNS DECIMAL(5,1) AS $$
DECLARE
    v_dias DECIMAL(5,1) := 0;
    v_fecha DATE;
BEGIN
    v_fecha := p_fecha_inicio;

    WHILE v_fecha <= p_fecha_fin LOOP
        -- Excluir fines de semana (0 = domingo, 6 = sábado)
        IF EXTRACT(DOW FROM v_fecha) NOT IN (0, 6) THEN
            -- Si ignorar festivos, verificar que no sea festivo
            IF p_ignorar_festivos THEN
                IF NOT EXISTS (
                    SELECT 1 FROM dias_festivos
                    WHERE organizacion_id = p_organizacion_id
                      AND fecha = v_fecha
                      AND activo = true
                ) THEN
                    v_dias := v_dias + 1;
                END IF;
            ELSE
                v_dias := v_dias + 1;
            END IF;
        END IF;

        v_fecha := v_fecha + 1;
    END LOOP;

    RETURN v_dias;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para generar código automático
CREATE OR REPLACE FUNCTION trigger_generar_codigo_solicitud()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
        NEW.codigo := generar_codigo_solicitud_vacaciones(NEW.organizacion_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generar_codigo_solicitud ON solicitudes_vacaciones;
CREATE TRIGGER trg_generar_codigo_solicitud
    BEFORE INSERT ON solicitudes_vacaciones
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generar_codigo_solicitud();

-- Trigger para actualizar actualizado_en
CREATE OR REPLACE FUNCTION trigger_actualizar_timestamp_vacaciones()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_politicas_vac ON politicas_vacaciones;
CREATE TRIGGER trg_actualizar_politicas_vac
    BEFORE UPDATE ON politicas_vacaciones
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_timestamp_vacaciones();

DROP TRIGGER IF EXISTS trg_actualizar_saldos_vac ON saldos_vacaciones;
CREATE TRIGGER trg_actualizar_saldos_vac
    BEFORE UPDATE ON saldos_vacaciones
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_timestamp_vacaciones();

DROP TRIGGER IF EXISTS trg_actualizar_solicitudes_vac ON solicitudes_vacaciones;
CREATE TRIGGER trg_actualizar_solicitudes_vac
    BEFORE UPDATE ON solicitudes_vacaciones
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_timestamp_vacaciones();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE politicas_vacaciones IS 'Configuración de vacaciones por organización';
COMMENT ON TABLE saldos_vacaciones IS 'Saldo de días de vacaciones por profesional y año';
COMMENT ON TABLE solicitudes_vacaciones IS 'Solicitudes de vacaciones con integración a bloqueos';
COMMENT ON TABLE dias_festivos IS 'Días festivos por organización para cálculo de días hábiles';

COMMENT ON COLUMN politicas_vacaciones.usar_niveles_antiguedad IS 'Si true, usa tabla niveles_vacaciones para calcular días';
COMMENT ON COLUMN politicas_vacaciones.aprobador_tipo IS 'Quién aprueba: supervisor, rrhh, o rol_especifico';
COMMENT ON COLUMN saldos_vacaciones.dias_pendientes IS 'Campo calculado: correspondientes + acumulados + ajustes - usados - solicitados_pendientes';
COMMENT ON COLUMN saldos_vacaciones.dias_solicitados_pendientes IS 'Días reservados en solicitudes aún no aprobadas/rechazadas';
COMMENT ON COLUMN solicitudes_vacaciones.bloqueo_id IS 'Referencia al bloqueo_horarios creado al aprobar la solicitud';
