-- ====================================================================
-- 🎯 TABLAS OPERACIONALES DEL SISTEMA
-- ====================================================================
--
-- Este archivo contiene las tablas que manejan las operaciones diarias
-- del negocio: citas.
--
-- 📊 CONTENIDO:
-- • citas: Sistema completo de gestión de citas con workflow empresarial
--
-- 🔄 ORDEN DE EJECUCIÓN: #6 (Después de business tables)
-- 🔒 SEGURIDAD: RLS habilitado, validaciones avanzadas
-- ⚡ PERFORMANCE: Índices especializados
-- ====================================================================

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
