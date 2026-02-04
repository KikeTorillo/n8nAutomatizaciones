-- ====================================================================
-- 🚫 MÓDULO: BLOQUEOS DE HORARIOS
-- ====================================================================
--
-- PROPÓSITO:
-- Gestión de bloqueos temporales de horarios para vacaciones, feriados,
-- mantenimiento y eventos especiales. Previene el agendamiento de citas
-- durante períodos específicos.
--
-- COMPONENTES:
-- • Tabla: bloqueos_horarios
--
-- CARACTERÍSTICAS:
-- ✅ Bloqueos organizacionales o por profesional
-- ✅ Bloqueos de todo el día o por horario específico
-- ✅ Soporte para recurrencia con patrón JSONB
-- ✅ Tracking de citas afectadas e ingresos perdidos
-- ✅ Configuración de notificaciones automáticas
-- ✅ Validación de coherencia organizacional
-- ✅ Validación de solapamientos
-- ✅ Personalización visual (color, icono)
--
-- INTEGRACIÓN:
-- • tipos_bloqueo (catálogo de tipos)
-- • profesionales, servicios (alcance del bloqueo)
-- • citas (validación bidireccional)
--
-- ORDEN DE CARGA: #8 (después de catálogos y negocio)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- TABLA: BLOQUEOS_HORARIOS
-- ====================================================================
-- Gestiona bloqueos temporales de horarios para vacaciones, feriados
-- y eventos especiales. Integra con horarios_disponibilidad para
-- prevenir agendamiento.
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE bloqueos_horarios (
    -- 🔑 IDENTIFICADORES PRIMARIOS
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL,
    sucursal_id INTEGER,                 -- NULL = afecta todas las sucursales (FK se agrega después)

    -- 🎯 ALCANCE DEL BLOQUEO
    profesional_id INTEGER,              -- NULL = afecta toda la organización
    servicio_id INTEGER,                 -- NULL = afecta todos los servicios

    -- 📅 INFORMACIÓN DEL BLOQUEO
    tipo_bloqueo_id INTEGER NOT NULL REFERENCES tipos_bloqueo(id),
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

    -- 🗑️ SOFT DELETE (Dic 2025)
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER,

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
-- 📝 COMENTARIOS DE DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TABLE bloqueos_horarios IS
'Gestión de bloqueos temporales de horarios para vacaciones, feriados y eventos especiales. Integra con horarios_disponibilidad para prevenir agendamiento.';

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
