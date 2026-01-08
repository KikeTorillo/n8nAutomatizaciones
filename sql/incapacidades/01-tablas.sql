-- =====================================================
-- MÓDULO INCAPACIDADES - Tabla Principal
-- Gestión de incapacidades médicas (IMSS México)
-- Enero 2026
-- =====================================================
-- Este módulo gestiona incapacidades médicas y genera
-- bloqueos automáticos en el sistema de agendamiento.
--
-- TIPOS DE INCAPACIDAD IMSS:
-- • enfermedad_general: Máx 52 semanas, pago 60% desde día 4
-- • maternidad: 84 días fijos, pago 100% desde día 1
-- • riesgo_trabajo: Hasta recuperación, pago 100% desde día 1
--
-- INTEGRACIÓN:
-- • Genera bloqueo automático en bloqueos_horarios
-- • Actualiza profesionales.estado = 'incapacidad'
-- =====================================================

-- =====================================================
-- TABLA: incapacidades
-- Descripción: Registro de incapacidades médicas con
-- integración automática a bloqueos de horarios
-- =====================================================
CREATE TABLE IF NOT EXISTS incapacidades (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- ====================================================================
    -- IDENTIFICACIÓN
    -- ====================================================================
    codigo VARCHAR(20) NOT NULL,              -- INC-2026-0001 (autogenerado)
    folio_imss VARCHAR(50) NOT NULL,          -- Número de incapacidad IMSS (obligatorio)

    -- ====================================================================
    -- TIPO DE INCAPACIDAD IMSS
    -- ====================================================================
    tipo_incapacidad VARCHAR(30) NOT NULL,    -- 'enfermedad_general', 'maternidad', 'riesgo_trabajo'

    -- ====================================================================
    -- PERÍODO
    -- ====================================================================
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    dias_autorizados INTEGER NOT NULL,        -- Días autorizados por IMSS

    -- ====================================================================
    -- DOCUMENTACIÓN
    -- ====================================================================
    documento_url TEXT,                       -- URL al PDF escaneado (MinIO)
    documento_nombre VARCHAR(255),            -- Nombre original del archivo

    -- ====================================================================
    -- INFORMACIÓN MÉDICA
    -- ====================================================================
    medico_nombre VARCHAR(150),               -- Nombre del médico que expide
    unidad_medica VARCHAR(200),               -- Clínica/Hospital IMSS
    diagnostico TEXT,                         -- Diagnóstico (CIE-10 opcional)

    -- ====================================================================
    -- ESTADO
    -- ====================================================================
    estado VARCHAR(20) DEFAULT 'activa',      -- 'activa', 'finalizada', 'cancelada'

    -- ====================================================================
    -- INTEGRACIÓN CON BLOQUEOS
    -- ====================================================================
    bloqueo_id INTEGER REFERENCES bloqueos_horarios(id) ON DELETE SET NULL,

    -- ====================================================================
    -- INFORMACIÓN DE PAGO IMSS (Informativo)
    -- ====================================================================
    porcentaje_pago INTEGER,                  -- 60% enfermedad, 100% maternidad/riesgo
    dia_inicio_pago INTEGER,                  -- Día 4 para enfermedad, día 1 para otros

    -- ====================================================================
    -- PRÓRROGA (Incapacidades consecutivas)
    -- ====================================================================
    incapacidad_origen_id INTEGER REFERENCES incapacidades(id) ON DELETE SET NULL,
    es_prorroga BOOLEAN DEFAULT false,

    -- ====================================================================
    -- OBSERVACIONES
    -- ====================================================================
    notas_internas TEXT,
    motivo_cancelacion TEXT,                  -- Si estado='cancelada'

    -- ====================================================================
    -- METADATA Y AUDITORÍA
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- ====================================================================
    -- CONSTRAINTS
    -- ====================================================================
    -- Código único por organización
    CONSTRAINT incapacidades_codigo_unico UNIQUE(organizacion_id, codigo),

    -- Folio IMSS único por organización (evita duplicados)
    CONSTRAINT incapacidades_folio_unico UNIQUE(organizacion_id, folio_imss),

    -- Validación de fechas
    CONSTRAINT chk_incapacidades_fechas CHECK (fecha_inicio <= fecha_fin),

    -- Validación de días
    CONSTRAINT chk_incapacidades_dias CHECK (dias_autorizados > 0),

    -- Validación de tipo de incapacidad
    CONSTRAINT chk_incapacidades_tipo CHECK (
        tipo_incapacidad IN ('enfermedad_general', 'maternidad', 'riesgo_trabajo')
    ),

    -- Validación de estado
    CONSTRAINT chk_incapacidades_estado CHECK (
        estado IN ('activa', 'finalizada', 'cancelada')
    ),

    -- Validación de porcentaje de pago
    CONSTRAINT chk_incapacidades_porcentaje CHECK (
        porcentaje_pago IS NULL OR (porcentaje_pago >= 0 AND porcentaje_pago <= 100)
    )
);

-- Comentarios de documentación
COMMENT ON TABLE incapacidades IS
'Registro de incapacidades médicas (IMSS México). Genera bloqueos automáticos
en bloqueos_horarios y actualiza estado_laboral del profesional.';

COMMENT ON COLUMN incapacidades.tipo_incapacidad IS
'Tipo IMSS: enfermedad_general (60% día 4), maternidad (100% día 1), riesgo_trabajo (100% día 1)';

COMMENT ON COLUMN incapacidades.folio_imss IS
'Número único de incapacidad expedido por IMSS. Obligatorio para validación.';

COMMENT ON COLUMN incapacidades.bloqueo_id IS
'FK al bloqueo generado automáticamente. Impide agendar citas durante el período.';

COMMENT ON COLUMN incapacidades.incapacidad_origen_id IS
'Referencia a la incapacidad original cuando esta es una prórroga.';

-- =====================================================
-- TRIGGER: Actualizar timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_incapacidades_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_incapacidades_actualizado_en
    BEFORE UPDATE ON incapacidades
    FOR EACH ROW
    EXECUTE FUNCTION trigger_incapacidades_actualizado_en();
