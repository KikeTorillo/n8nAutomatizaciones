-- ====================================================================
-- 📅 MÓDULO CITAS - TABLAS
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 16 Noviembre 2025
-- Módulo: citas
--
-- DESCRIPCIÓN:
-- Define las tablas para gestión completa del ciclo de vida de citas,
-- desde la reserva hasta la finalización con workflow empresarial.
--
-- TABLAS:
-- • citas: Tabla particionada por fecha (range partitioning mensual)
-- • citas_servicios: Relación M:N entre citas y servicios
--
-- DEPENDENCIAS:
-- • Módulo fundamentos: ENUMs (estado_cita, plataforma_chatbot)
-- • Módulo nucleo: organizaciones, usuarios
-- • Módulo negocio: clientes, profesionales, servicios
--
-- CARACTERÍSTICAS ESPECIALES:
-- • ⚡ Particionamiento por fecha_cita (mejora 10x+ queries históricas)
-- • Workflow completo (pendiente → confirmada → completada)
-- • Múltiples servicios por cita (M:N)
-- • Trazabilidad completa y auditoría empresarial
-- • Validaciones automáticas de disponibilidad
--
-- ====================================================================

-- ====================================================================
-- 📅 TABLA CITAS - GESTIÓN COMPLETA DE CITAS (PARTICIONADA)
-- ====================================================================
CREATE TABLE citas (
    -- 🔑 IDENTIFICACIÓN Y RELACIONES PRINCIPALES
    id SERIAL,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    codigo_cita VARCHAR(50) NOT NULL,

    -- 👥 REFERENCIAS PRINCIPALES
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE RESTRICT,

    -- ⏰ INFORMACIÓN TEMPORAL CRÍTICA
    fecha_cita DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City',

    -- 🔄 WORKFLOW Y ESTADO
    estado estado_cita DEFAULT 'pendiente',
    estado_anterior estado_cita,
    motivo_cancelacion TEXT,

    -- 💰 INFORMACIÓN COMERCIAL (CALCULADOS DESDE citas_servicios)
    precio_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    duracion_total_minutos INTEGER NOT NULL DEFAULT 0,
    metodo_pago VARCHAR(20),
    pagado BOOLEAN DEFAULT FALSE,

    -- 📝 NOTAS Y COMUNICACIÓN
    notas_cliente TEXT,
    notas_profesional TEXT,
    notas_internas TEXT,
    origen_cita VARCHAR(50) DEFAULT 'manual',

    -- ⭐ CALIFICACIÓN Y FEEDBACK
    calificacion_cliente INTEGER CHECK (calificacion_cliente >= 1 AND calificacion_cliente <= 5),
    comentario_cliente TEXT,
    calificacion_profesional INTEGER CHECK (calificacion_profesional >= 1 AND calificacion_profesional <= 5),
    comentario_profesional TEXT,

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
    CONSTRAINT valid_precio_total
        CHECK (precio_total >= 0),
    CONSTRAINT valid_duracion_total
        CHECK (duracion_total_minutos >= 0 AND duracion_total_minutos <= 480),
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
                WHEN estado = 'completada' AND precio_total > 0 THEN pagado = TRUE
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

    -- ⚡ PRIMARY KEY COMPUESTA (incluye fecha_cita para particionamiento)
    PRIMARY KEY (id, fecha_cita)
) PARTITION BY RANGE (fecha_cita);

-- ====================================================================
-- 📝 COMENTARIOS DE DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TABLE citas IS
'Tabla particionada de citas con range partitioning mensual por fecha_cita';

COMMENT ON COLUMN citas.fecha_cita IS
'Fecha de la cita - columna de particionamiento (mensual). IMPORTANTE: Debe incluirse en todas las foreign keys que referencien esta tabla.';

COMMENT ON COLUMN citas.codigo_cita IS
'Código único generado automáticamente. Formato: ORG001-20251116-001';

COMMENT ON COLUMN citas.estado IS
'Workflow: pendiente → confirmada → en_curso → completada | cancelada | no_asistio';

COMMENT ON COLUMN citas.origen_cita IS
'Origen de creación: manual, whatsapp, telegram, web, telefono, api';

-- ====================================================================
-- 🔗 TABLA CITAS_SERVICIOS - RELACIÓN M:N CON SERVICIOS
-- ====================================================================
-- Permite asignar múltiples servicios a una cita
-- ====================================================================

CREATE TABLE citas_servicios (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,

    -- 🔗 RELACIONES
    cita_id INTEGER NOT NULL,
    fecha_cita DATE NOT NULL,
    servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,

    -- Foreign key compuesta que referencia la PRIMARY KEY completa de citas
    -- ON UPDATE CASCADE: Cuando se reagenda (cambia fecha_cita), se actualiza automáticamente
    FOREIGN KEY (cita_id, fecha_cita) REFERENCES citas(id, fecha_cita) ON DELETE CASCADE ON UPDATE CASCADE,

    -- 📊 METADATA DEL SERVICIO
    orden_ejecucion INTEGER NOT NULL DEFAULT 1,

    -- 💰 INFORMACIÓN COMERCIAL (SNAPSHOT)
    precio_aplicado DECIMAL(10,2) NOT NULL,
    duracion_minutos INTEGER NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0.00,

    -- 📝 NOTAS ESPECÍFICAS
    notas TEXT,

    -- ⏰ TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uq_cita_servicio_orden
        UNIQUE (cita_id, fecha_cita, orden_ejecucion),

    CONSTRAINT chk_orden_positivo
        CHECK (orden_ejecucion > 0),

    CONSTRAINT chk_precio_positivo
        CHECK (precio_aplicado >= 0),

    CONSTRAINT chk_duracion_positiva
        CHECK (duracion_minutos > 0 AND duracion_minutos <= 480),

    CONSTRAINT chk_descuento_valido
        CHECK (descuento >= 0 AND descuento <= 100)
);

-- ====================================================================
-- 📝 COMENTARIOS DE DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TABLE citas_servicios IS
'Tabla intermedia M:N entre citas y servicios - permite múltiples servicios por cita';

COMMENT ON COLUMN citas_servicios.orden_ejecucion IS
'Orden en que se ejecutan los servicios (1, 2, 3...)';

COMMENT ON COLUMN citas_servicios.precio_aplicado IS
'Precio del servicio al momento de crear la cita (snapshot - no cambia si servicio se actualiza)';

COMMENT ON COLUMN citas_servicios.duracion_minutos IS
'Duración del servicio al momento de crear la cita (snapshot)';

COMMENT ON COLUMN citas_servicios.descuento IS
'Descuento en porcentaje (0-100) aplicado a este servicio';
