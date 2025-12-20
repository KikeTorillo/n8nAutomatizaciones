-- ====================================================================
-- 📅 MÓDULO AGENDAMIENTO - TABLAS
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 16 Noviembre 2025
-- Módulo: agendamiento
--
-- DESCRIPCIÓN:
-- Define las tablas para gestión de horarios y disponibilidad de profesionales.
-- Base para generación automática de slots de citas.
--
-- TABLAS:
-- • horarios_profesionales: Plantillas de horarios base (ej: "Lunes 9-18")
--
-- DEPENDENCIAS:
-- • Módulo nucleo (organizaciones, usuarios)
-- • Módulo negocio (profesionales)
--
-- ====================================================================

-- ====================================================================
-- 🕒 TABLA HORARIOS_PROFESIONALES - PLANTILLAS DE HORARIOS BASE
-- ====================================================================
-- Define los horarios de trabajo base de cada profesional que servirán
-- para generar automáticamente los slots de disponibilidad específicos.
--
-- 🎯 DIFERENCIA CLAVE:
-- • horarios_profesionales = Plantillas/horarios base (ej: "Lunes 9-18")
-- • disponibilidad = Slots específicos calculados (ej: "2024-01-15 9:30-10:00")
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
    -- 🗑️ SECCIÓN: SOFT DELETE (Dic 2025)
    -- ====================================================================
    eliminado_en TIMESTAMPTZ DEFAULT NULL,              -- NULL = activo, con valor = eliminado
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

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
-- 📝 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TABLE horarios_profesionales IS
'Plantillas de horarios base de profesionales para generar automáticamente slots de disponibilidad';

COMMENT ON COLUMN horarios_profesionales.tipo_horario IS
'Tipo de horario: regular (trabajo), break (descanso), almuerzo, premium (con recargo)';

COMMENT ON COLUMN horarios_profesionales.permite_citas IS
'FALSE para breaks y almuerzos donde no se pueden agendar citas';

COMMENT ON COLUMN horarios_profesionales.fecha_inicio IS
'Fecha desde la cual este horario es válido (útil para cambios estacionales)';

COMMENT ON COLUMN horarios_profesionales.fecha_fin IS
'Fecha hasta la cual este horario es válido (NULL = indefinido)';
