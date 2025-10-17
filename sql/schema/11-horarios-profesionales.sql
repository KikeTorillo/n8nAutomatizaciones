-- ====================================================================
-- 🕒 TABLA HORARIOS PROFESIONALES - PLANTILLAS DE TRABAJO BASE
-- ====================================================================
--
-- Esta tabla define los horarios base/plantilla de trabajo de cada profesional
-- que sirven para generar automáticamente los slots de disponibilidad.
--
-- 🎯 DIFERENCIA CLAVE CON horarios_disponibilidad:
-- • horarios_profesionales = Plantillas/horarios base (ej: "Lunes 9-18")
-- • horarios_disponibilidad = Slots específicos generados (ej: "2024-01-15 9:30-10:00")
--
-- 📊 CASOS DE USO:
-- • Horarios regulares de trabajo
-- • Breaks y tiempos de almuerzo
-- • Horarios premium con recargo
-- • Configuración de duraciones de slot personalizadas
-- • Vigencia temporal (vacaciones, cambios estacionales)
--
-- 🔄 ORDEN DE EJECUCIÓN: #11 (Después de subscriptions)
-- 🔒 SEGURIDAD: RLS habilitado para aislamiento multi-tenant
-- ====================================================================

-- ====================================================================
-- 🕒 TABLA HORARIOS_PROFESIONALES - PLANTILLAS DE HORARIOS BASE
-- ====================================================================
-- Define los horarios de trabajo base de cada profesional que servirán
-- para generar automáticamente los slots de disponibilidad específicos.
--
-- 🔧 CARACTERÍSTICAS AVANZADAS:
-- • Múltiples horarios por día (mañana/tarde con break)
-- • Tipos de horario (regular, break, almuerzo, premium)
-- • Vigencia temporal para cambios estacionales
-- • Configuración de slots y precios personalizables
-- • Validaciones exhaustivas de coherencia temporal
-- ====================================================================

CREATE TABLE horarios_profesionales (
    -- 🔑 IDENTIFICACIÓN Y RELACIONES
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- ====================================================================
    -- 📅 SECCIÓN: CONFIGURACIÓN TEMPORAL BASE
    -- ====================================================================
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=domingo, 6=sábado
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City',

    -- ====================================================================
    -- 🎯 SECCIÓN: TIPO Y CONFIGURACIÓN DE HORARIO
    -- ====================================================================
    tipo_horario VARCHAR(20) NOT NULL DEFAULT 'regular', -- 'regular', 'break', 'almuerzo', 'premium'
    nombre_horario VARCHAR(50),                          -- Ej: "Horario Matutino", "Break Almuerzo"
    descripcion TEXT,                                    -- Descripción del horario

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONFIGURACIÓN OPERATIVA
    -- ====================================================================
    permite_citas BOOLEAN NOT NULL DEFAULT TRUE,        -- FALSE para breaks/almuerzos

    -- ====================================================================
    -- 💰 SECCIÓN: CONFIGURACIÓN COMERCIAL
    -- ====================================================================
    precio_premium DECIMAL(5,2) DEFAULT 0.00,           -- Recargo por horario premium
    permite_descuentos BOOLEAN DEFAULT TRUE,             -- Si aplican descuentos promocionales

    -- ====================================================================
    -- 📅 SECCIÓN: VIGENCIA TEMPORAL (OPCIONAL)
    -- ====================================================================
    fecha_inicio DATE DEFAULT CURRENT_DATE,             -- Desde cuándo aplica este horario
    fecha_fin DATE,                                     -- Hasta cuándo (NULL = indefinido)
    motivo_vigencia TEXT,                               -- Ej: "Horario de invierno", "Vacaciones"

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONFIGURACIÓN AVANZADA
    -- ====================================================================
    capacidad_maxima INTEGER DEFAULT 1,                 -- Para servicios grupales
    configuracion_especial JSONB DEFAULT '{}',          -- Configuraciones adicionales flexibles
                                                        -- Ej: {"solo_servicios": ["corte_premium"], "requiere_confirmacion": true}

    -- ====================================================================
    -- 🎛️ SECCIÓN: CONTROL Y ESTADO
    -- ====================================================================
    activo BOOLEAN DEFAULT TRUE,                        -- Horario activo para usar
    prioridad INTEGER DEFAULT 0,                        -- Orden de preferencia (mayor = más prioritario)
    creado_automaticamente BOOLEAN DEFAULT FALSE,       -- Si fue generado por el sistema

    -- ====================================================================
    -- ⏰ SECCIÓN: TIMESTAMPS DE AUDITORÍA
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_por INTEGER REFERENCES usuarios(id),

    -- ====================================================================
    -- ✅ SECCIÓN: VALIDACIONES EXHAUSTIVAS
    -- ====================================================================
    CONSTRAINT valid_horario_base
        CHECK (hora_inicio < hora_fin),
    CONSTRAINT valid_duracion_minima_horario
        CHECK (hora_fin - hora_inicio >= INTERVAL '15 minutes'),
    CONSTRAINT valid_vigencia_temporal
        CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    CONSTRAINT valid_precio_premium
        CHECK (precio_premium >= 0 AND precio_premium <= 999.99),
    CONSTRAINT valid_capacidad_maxima
        CHECK (
            -- Breaks y almuerzos pueden tener capacidad 0 (no permiten citas)
            (tipo_horario IN ('break', 'almuerzo') AND capacidad_maxima >= 0 AND capacidad_maxima <= 50)
            OR
            -- Otros tipos de horarios requieren capacidad > 0
            (tipo_horario NOT IN ('break', 'almuerzo') AND capacidad_maxima > 0 AND capacidad_maxima <= 50)
        ),
    CONSTRAINT valid_tipo_horario
        CHECK (tipo_horario IN ('regular', 'break', 'almuerzo', 'premium')),
    CONSTRAINT valid_configuracion_permite_citas
        CHECK (
            CASE tipo_horario
                WHEN 'break' THEN permite_citas = FALSE
                WHEN 'almuerzo' THEN permite_citas = FALSE
                ELSE TRUE
            END
        ),

    -- 🔒 CONSTRAINT ÚNICO MEJORADO
    -- Permite múltiples horarios por día siempre que no se solapen
    -- Nota: Usamos tsrange con fecha dummy para simular timerange
    EXCLUDE USING gist (
        profesional_id WITH =,
        dia_semana WITH =,
        fecha_inicio WITH =,
        tsrange(
            ('2000-01-01'::date + hora_inicio)::timestamp,
            ('2000-01-01'::date + hora_fin)::timestamp,
            '[)'
        ) WITH &&
    ) WHERE (activo = TRUE)
);

-- ====================================================================
-- 📊 ÍNDICES ESPECIALIZADOS PARA PERFORMANCE
-- ====================================================================

-- Índice principal para búsquedas por profesional
CREATE INDEX idx_horarios_profesionales_profesional
    ON horarios_profesionales(profesional_id, activo) WHERE activo = TRUE;

-- Índice para búsquedas por día de semana
CREATE INDEX idx_horarios_profesionales_dia_activo
    ON horarios_profesionales(dia_semana, activo, permite_citas)
    WHERE activo = TRUE;

-- Índice para horarios con vigencia temporal
CREATE INDEX idx_horarios_profesionales_vigencia
    ON horarios_profesionales(fecha_inicio, fecha_fin, activo)
    WHERE activo = TRUE;

-- Índice para horarios premium
CREATE INDEX idx_horarios_profesionales_premium
    ON horarios_profesionales(profesional_id, precio_premium)
    WHERE activo = TRUE AND precio_premium > 0;

-- Índice compuesto para generación de disponibilidad
CREATE INDEX idx_horarios_profesionales_generacion
    ON horarios_profesionales(profesional_id, dia_semana, permite_citas, activo)
    WHERE activo = TRUE AND permite_citas = TRUE;

-- ====================================================================
-- 🔒 POLÍTICAS RLS PARA SEGURIDAD MULTI-TENANT
-- ====================================================================

-- Habilitar RLS en la tabla
ALTER TABLE horarios_profesionales ENABLE ROW LEVEL SECURITY;

-- Política unificada para acceso multi-tenant
CREATE POLICY horarios_profesionales_unified_access ON horarios_profesionales
    FOR ALL
    TO saas_app
    USING (
        -- Super admin tiene acceso total
        current_setting('app.current_user_role', true) = 'super_admin'
        -- Bypass RLS para funciones de sistema
        OR current_setting('app.bypass_rls', true) = 'true'
        -- Acceso por organización para usuarios regulares
        OR (
            current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
            AND organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

-- ====================================================================
-- ⚡ FUNCIONES ESPECIALIZADAS PARA HORARIOS PROFESIONALES
-- ====================================================================

-- ====================================================================
-- 🔍 FUNCIÓN 2: VALIDAR SOLAPAMIENTO DE HORARIOS
-- ====================================================================
-- Valida que no haya solapamientos entre horarios del mismo profesional
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION validar_solapamiento_horarios()
RETURNS TRIGGER AS $$
DECLARE
    v_conflictos INTEGER;
BEGIN
    -- Verificar solapamientos con otros horarios activos del mismo profesional en el mismo día
    SELECT COUNT(*)
    INTO v_conflictos
    FROM horarios_profesionales hp
    WHERE hp.profesional_id = NEW.profesional_id
    AND hp.dia_semana = NEW.dia_semana
    AND hp.activo = TRUE
    AND hp.id != COALESCE(NEW.id, 0)  -- Excluir el registro actual en caso de UPDATE
    AND (
        -- Verificar solapamiento temporal
        (NEW.fecha_inicio <= COALESCE(hp.fecha_fin, '2099-12-31') AND
         COALESCE(NEW.fecha_fin, '2099-12-31') >= hp.fecha_inicio)
        AND
        -- Verificar solapamiento de horarios
        (NEW.hora_inicio < hp.hora_fin AND NEW.hora_fin > hp.hora_inicio)
    );

    IF v_conflictos > 0 THEN
        RAISE EXCEPTION 'Horario se solapa con otro horario existente del profesional en el mismo día';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 🔄 FUNCIÓN 3: ACTUALIZAR TIMESTAMP HORARIOS PROFESIONALES
-- ====================================================================
-- Actualiza automáticamente el timestamp al modificar horarios
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION actualizar_timestamp_horarios_profesionales()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- ⚡ TRIGGERS AUTOMÁTICOS
-- ====================================================================

-- TRIGGER 1: Validación de solapamientos
CREATE TRIGGER trigger_validar_solapamiento_horarios
    BEFORE INSERT OR UPDATE ON horarios_profesionales
    FOR EACH ROW EXECUTE FUNCTION validar_solapamiento_horarios();

-- TRIGGER 2: Actualización automática de timestamps
CREATE TRIGGER trigger_actualizar_timestamp_horarios_prof
    BEFORE UPDATE ON horarios_profesionales
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_horarios_profesionales();

-- ====================================================================
-- 📝 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TABLE horarios_profesionales IS
'Plantillas de horarios base de profesionales para generar automáticamente slots de disponibilidad';

COMMENT ON COLUMN horarios_profesionales.tipo_horario IS
'Tipo de horario: regular (trabajo), break (descanso), almuerzo, premium (con recargo), especial';

COMMENT ON COLUMN horarios_profesionales.permite_citas IS
'FALSE para breaks y almuerzos donde no se pueden agendar citas';

COMMENT ON COLUMN horarios_profesionales.fecha_inicio IS
'Fecha desde la cual este horario es válido (útil para cambios estacionales)';

COMMENT ON COLUMN horarios_profesionales.fecha_fin IS
'Fecha hasta la cual este horario es válido (NULL = indefinido)';

-- ====================================================================
-- 📝 DOCUMENTACIÓN DE POLÍTICAS RLS
-- ====================================================================
-- Comentarios de políticas que se crean en 08-rls-policies.sql
-- pero se documentan aquí porque la tabla se crea en este archivo
-- ────────────────────────────────────────────────────────────────────

-- Política de horarios profesionales
COMMENT ON POLICY horarios_profesionales_unified_access ON horarios_profesionales IS
'Acceso a configuración de horarios de profesionales:
- Usuario accede solo a horarios de su organización
- Super admin tiene acceso global
- Validación de formato numérico en tenant_id

Usado para: Configuración de disponibilidad semanal, breaks, horarios premium.';

-- ====================================================================
-- 📊 DATOS DE EJEMPLO PARA TESTING
-- ====================================================================

-- Estos datos se pueden usar para testing, comentar en producción
/*
-- Ejemplo: Barbero con horario regular Lunes-Viernes
INSERT INTO horarios_profesionales (
    organizacion_id, profesional_id, dia_semana, hora_inicio, hora_fin,
    tipo_horario, nombre_horario
) VALUES
-- Lunes a Viernes 9:00-18:00 con almuerzo 13:00-14:00
(1, 1, 1, '09:00', '13:00', 'regular', 'Horario Matutino'),
(1, 1, 1, '13:00', '14:00', 'almuerzo', 'Hora de Almuerzo'),
(1, 1, 1, '14:00', '18:00', 'regular', 'Horario Vespertino'),
(1, 1, 2, '09:00', '13:00', 'regular', 'Horario Matutino'),
(1, 1, 2, '13:00', '14:00', 'almuerzo', 'Hora de Almuerzo'),
(1, 1, 2, '14:00', '18:00', 'regular', 'Horario Vespertino');
*/