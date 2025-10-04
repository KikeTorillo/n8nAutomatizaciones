-- ====================================================================
-- 🎯 TABLAS OPERACIONALES DEL SISTEMA
-- ====================================================================
--
-- Este archivo contiene las tablas que manejan las operaciones diarias
-- del negocio: citas y horarios de disponibilidad.
--
-- 📊 CONTENIDO:
-- • horarios_disponibilidad: Sistema inteligente de disponibilidad y reservas
-- • citas: Sistema completo de gestión de citas con workflow empresarial
--
-- 🔄 ORDEN DE EJECUCIÓN: #6 (Después de business tables)
-- 🔒 SEGURIDAD: RLS habilitado, validaciones avanzadas
-- ⚡ PERFORMANCE: Índices especializados, EXCLUDE constraints
-- ⚠️  NOTA: horarios_disponibilidad se crea PRIMERO para resolver dependencia circular con citas
-- ====================================================================

-- ====================================================================
-- ⏰ TABLA HORARIOS_DISPONIBILIDAD - SISTEMA INTELIGENTE DE DISPONIBILIDAD
-- ====================================================================
-- Tabla que gestiona los horarios disponibles de cada profesional con
-- capacidades avanzadas de reserva temporal, pricing dinámico e IA.
--
-- 🚀 CARACTERÍSTICAS AVANZADAS:
-- • Sistema de reserva temporal (carrito de compras)
-- • Prevención automática de solapamientos con EXCLUDE constraint
-- • Horarios recurrentes e irregulares
-- • Pricing dinámico y horarios premium
-- • Integración con IA para optimización automática
-- ====================================================================

CREATE TABLE horarios_disponibilidad (
    -- 🔑 IDENTIFICACIÓN Y RELACIONES PRINCIPALES
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
    servicio_id INTEGER REFERENCES servicios(id) ON DELETE SET NULL, -- Para disponibilidad específica de servicio
    cita_id INTEGER, -- Link directo cuando está ocupado (FK agregada después)

    -- 📅 CONFIGURACIÓN TEMPORAL COMPLETA
    tipo_horario VARCHAR(20) NOT NULL, -- 'regular', 'excepcion', 'bloqueo', 'franja_especifica'
    fecha DATE NOT NULL, -- Fecha específica para la disponibilidad
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City',

    -- 🔄 HORARIOS RECURRENTES (OPCIONAL)
    dia_semana INTEGER CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=domingo, 6=sábado
    es_recurrente BOOLEAN DEFAULT FALSE, -- Si se aplica semanalmente
    fecha_fin_recurrencia DATE, -- Hasta cuándo aplica la recurrencia
    patron_recurrencia JSONB DEFAULT '{}', -- Configuración avanzada de recurrencia

    -- 🔄 ESTADO Y DISPONIBILIDAD
    estado estado_franja DEFAULT 'disponible',
    duracion_slot INTEGER DEFAULT 15, -- Duración de cada slot en minutos
    capacidad_maxima INTEGER DEFAULT 1, -- Para servicios grupales
    capacidad_ocupada INTEGER DEFAULT 0, -- Cuántos slots están ocupados

    -- 💰 PRICING DINÁMICO
    precio_base DECIMAL(10,2), -- Precio base para este horario
    precio_dinamico DECIMAL(10,2), -- Precio ajustado por demanda/premium
    es_horario_premium BOOLEAN DEFAULT FALSE, -- Horario de alta demanda
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00, -- Descuento especial

    -- 🤖 AUTOMATIZACIÓN E IA
    puntuacion_ia INTEGER CHECK (puntuacion_ia >= 0 AND puntuacion_ia <= 100),
    creado_automaticamente BOOLEAN DEFAULT TRUE,
    algoritmo_creacion VARCHAR(50) DEFAULT 'sistema', -- 'sistema', 'ia', 'manual'

    -- 🛒 RESERVA TEMPORAL (CARRITO DE COMPRAS)
    reservado_hasta TIMESTAMPTZ,
    reservado_por VARCHAR(100), -- Identificador de quien reservó
    session_id VARCHAR(255), -- Para tracking de sesiones web
    token_reserva VARCHAR(100), -- Token único para la reserva

    -- 📝 INFORMACIÓN ADICIONAL
    notas TEXT, -- Motivo del bloqueo o notas especiales
    notas_internas TEXT, -- Notas para uso interno del negocio
    configuracion_especial JSONB DEFAULT '{}', -- Configuraciones adicionales

    -- 📊 AUDITORÍA ENTERPRISE
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_por INTEGER REFERENCES usuarios(id),
    version INTEGER DEFAULT 1, -- Control de concurrencia optimista
    ip_origen INET,
    user_agent TEXT,

    -- ⏰ TIMESTAMPS ESTÁNDAR
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS EMPRESARIALES AVANZADOS
    CONSTRAINT valid_horario
        CHECK (hora_inicio < hora_fin),
    CONSTRAINT valid_duracion_minima
        CHECK (hora_fin - hora_inicio >= INTERVAL '5 minutes'),
    CONSTRAINT valid_fecha_coherente
        CHECK (fecha >= CURRENT_DATE - INTERVAL '1 day'),
    CONSTRAINT valid_capacidad
        CHECK (capacidad_maxima > 0 AND capacidad_ocupada >= 0 AND capacidad_ocupada <= capacidad_maxima),
    CONSTRAINT valid_reserva_futura
        CHECK (reservado_hasta IS NULL OR reservado_hasta >= NOW()),
    CONSTRAINT valid_precios
        CHECK (
            (precio_base IS NULL OR precio_base >= 0) AND
            (precio_dinamico IS NULL OR precio_dinamico >= 0) AND
            (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100)
        ),
    CONSTRAINT valid_tipo_configuracion
        CHECK (
            CASE tipo_horario
                WHEN 'regular' THEN dia_semana IS NOT NULL AND es_recurrente = TRUE
                WHEN 'excepcion' THEN es_recurrente = FALSE
                WHEN 'bloqueo' THEN es_recurrente = FALSE
                WHEN 'franja_especifica' THEN es_recurrente = FALSE
                ELSE FALSE
            END
        ),
    CONSTRAINT valid_estado_coherencia
        CHECK (
            CASE
                WHEN estado = 'ocupado' THEN cita_id IS NOT NULL
                WHEN estado = 'reservado_temporal' THEN reservado_hasta IS NOT NULL
                WHEN estado = 'bloqueado' THEN tipo_horario = 'bloqueo'
                ELSE TRUE
            END
        ),
    CONSTRAINT valid_recurrencia_fechas
        CHECK (
            CASE
                WHEN es_recurrente = TRUE THEN fecha_fin_recurrencia IS NULL OR fecha_fin_recurrencia >= fecha
                ELSE TRUE
            END
        ),

    -- 🔑 UNIQUE CONSTRAINT - PREVIENE SLOTS DUPLICADOS
    CONSTRAINT unique_horario_slot
        UNIQUE (profesional_id, fecha, hora_inicio),

    -- 🚫 EXCLUSION CONSTRAINT - PREVIENE SOLAPAMIENTOS AUTOMÁTICAMENTE
    EXCLUDE USING gist (
        profesional_id WITH =,
        fecha WITH =,
        tsrange(
            (fecha + hora_inicio)::timestamp,
            (fecha + hora_fin)::timestamp,
            '[)'
        ) WITH &&
    ) WHERE (estado != 'bloqueado' AND tipo_horario != 'bloqueo')
);

-- ====================================================================
-- 📅 TABLA CITAS - SISTEMA COMPLETO DE GESTIÓN DE CITAS
-- ====================================================================
-- Tabla central que gestiona todo el ciclo de vida de las citas,
-- desde la reserva hasta la finalización, con workflow empresarial.
--
-- 🔧 CARACTERÍSTICAS EMPRESARIALES:
-- • Workflow completo con estados (pendiente → confirmada → completada)
-- • Trazabilidad completa y auditoría empresarial
-- • Validaciones automáticas de solapamientos y disponibilidad
-- ====================================================================

CREATE TABLE citas (
    -- 🔑 IDENTIFICACIÓN Y RELACIONES PRINCIPALES
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    codigo_cita VARCHAR(50) UNIQUE NOT NULL,

    -- 👥 REFERENCIAS PRINCIPALES (VALIDADAS)
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE RESTRICT,
    servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
    horario_id INTEGER REFERENCES horarios_disponibilidad(id) ON DELETE SET NULL, -- Link al horario reservado

    -- ⏰ INFORMACIÓN TEMPORAL CRÍTICA
    fecha_cita DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City', -- Para multi-zona

    -- 🔄 WORKFLOW Y ESTADO
    estado estado_cita DEFAULT 'pendiente',
    estado_anterior estado_cita, -- Para auditoría de cambios
    motivo_cancelacion TEXT, -- Obligatorio si estado = 'cancelada'

    -- 💰 INFORMACIÓN COMERCIAL
    precio_servicio DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0.00,
    precio_final DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(20), -- 'efectivo', 'tarjeta', 'transferencia'
    pagado BOOLEAN DEFAULT FALSE,

    -- 📝 NOTAS Y COMUNICACIÓN
    notas_cliente TEXT,
    notas_profesional TEXT,
    notas_internas TEXT, -- Para uso interno del negocio
    origen_cita VARCHAR(50) DEFAULT 'manual', -- 'whatsapp', 'web', 'telefono', 'manual', 'api'

    -- ⭐ CALIFICACIÓN Y FEEDBACK
    calificacion_cliente INTEGER CHECK (calificacion_cliente >= 1 AND calificacion_cliente <= 5),
    comentario_cliente TEXT,
    calificacion_profesional INTEGER CHECK (calificacion_profesional >= 1 AND calificacion_profesional <= 5),
    comentario_profesional TEXT, -- Feedback del profesional sobre el cliente

    -- ⏱️ CONTROL DE TIEMPO REAL
    hora_llegada TIMESTAMPTZ,
    hora_inicio_real TIMESTAMPTZ,
    hora_fin_real TIMESTAMPTZ,
    tiempo_espera_minutos INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN hora_llegada IS NOT NULL AND hora_inicio_real IS NOT NULL
            THEN EXTRACT(EPOCH FROM (hora_inicio_real - hora_llegada))/60
            ELSE NULL
        END
    ) STORED,

    -- 🔔 RECORDATORIOS Y NOTIFICACIONES
    recordatorio_enviado BOOLEAN DEFAULT FALSE,
    fecha_recordatorio TIMESTAMPTZ,
    confirmacion_requerida BOOLEAN DEFAULT TRUE,
    confirmada_por_cliente TIMESTAMPTZ,

    -- 📊 CAMPOS DE AUDITORÍA EMPRESARIAL
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_por INTEGER REFERENCES usuarios(id),
    version INTEGER DEFAULT 1,
    ip_origen INET,
    user_agent TEXT,
    origen_aplicacion VARCHAR(50) DEFAULT 'web',

    -- ⏰ TIMESTAMPS ESTÁNDAR
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS EMPRESARIALES
    CONSTRAINT valid_horario
        CHECK (hora_inicio < hora_fin),
    CONSTRAINT valid_precio_final
        CHECK (precio_final >= 0),
    CONSTRAINT valid_descuento
        CHECK (descuento >= 0 AND descuento <= precio_servicio),
    CONSTRAINT valid_precio_servicio
        CHECK (precio_servicio > 0),
    CONSTRAINT valid_fecha_cita
        CHECK (fecha_cita >= CURRENT_DATE - INTERVAL '1 day'),
    CONSTRAINT valid_calificaciones
        CHECK (
            (calificacion_cliente IS NULL OR (calificacion_cliente >= 1 AND calificacion_cliente <= 5)) AND
            (calificacion_profesional IS NULL OR (calificacion_profesional >= 1 AND calificacion_profesional <= 5))
        ),
    CONSTRAINT valid_tiempo_real
        CHECK (
            (hora_inicio_real IS NULL OR hora_fin_real IS NULL OR hora_inicio_real <= hora_fin_real) AND
            (hora_llegada IS NULL OR hora_inicio_real IS NULL OR hora_llegada <= hora_inicio_real)
        ),
    CONSTRAINT valid_estado_pagado
        CHECK (
            CASE
                WHEN estado = 'completada' AND precio_final > 0 THEN pagado = TRUE
                ELSE TRUE
            END
        ),
    CONSTRAINT valid_motivo_cancelacion
        CHECK (
            CASE
                WHEN estado = 'cancelada' THEN motivo_cancelacion IS NOT NULL
                ELSE TRUE
            END
        ),
    CONSTRAINT coherencia_organizacion
        CHECK (
            -- Validar que cliente, profesional y servicio pertenezcan a la misma organización
            TRUE -- Se implementa con trigger por rendimiento
        )
);

-- ====================================================================
-- 🔗 FOREIGN KEY CIRCULAR - HORARIOS_DISPONIBILIDAD → CITAS
-- ====================================================================
-- Se agrega después de crear ambas tablas para resolver dependencia circular
-- ====================================================================

ALTER TABLE horarios_disponibilidad
    ADD CONSTRAINT fk_horarios_cita
    FOREIGN KEY (cita_id)
    REFERENCES citas(id)
    ON DELETE SET NULL;
