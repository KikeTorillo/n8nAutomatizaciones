-- ====================================================================
-- MÓDULO NÚCLEO: TABLAS DE SUBSCRIPCIONES
-- ====================================================================
-- Sistema completo de subscripciones SaaS con facturación y métricas:
-- • planes_subscripcion: Definición normalizada de planes (3NF)
-- • metricas_uso_organizacion: Contadores separados para performance
-- • subscripciones: Datos de facturación específicos
-- • historial_subscripciones: Auditoría completa
--
-- Migrado de: sql/schema/10-subscriptions-table.sql
-- Fecha migración: 16 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- TABLA: planes_subscripcion
-- ====================================================================
-- Tabla de referencia que define los planes disponibles y sus límites.
-- Separada para cumplir con 3NF y evitar duplicación de datos.
-- ====================================================================
CREATE TABLE planes_subscripcion (
    id SERIAL PRIMARY KEY,

    -- Identificación del plan
    codigo_plan VARCHAR(20) NOT NULL UNIQUE,  -- 'trial', 'basico', 'pro', 'enterprise'
    nombre_plan VARCHAR(100) NOT NULL,        -- 'Plan Básico', 'Plan Professional'
    descripcion TEXT,

    -- Configuración de precios
    precio_mensual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    precio_anual DECIMAL(10,2),  -- Descuento anual
    moneda VARCHAR(3) DEFAULT 'MXN',

    -- Límites por plan
    limite_profesionales INTEGER,  -- NULL = ilimitado
    limite_clientes INTEGER,
    limite_servicios INTEGER,
    limite_usuarios INTEGER DEFAULT 3,
    limite_citas_mes INTEGER,

    -- Características habilitadas
    funciones_habilitadas JSONB DEFAULT '{}',

    -- Control
    activo BOOLEAN DEFAULT TRUE,
    orden_display INTEGER DEFAULT 0,  -- Para ordenar en UI

    -- Integración Mercado Pago
    mp_plan_id VARCHAR(100) UNIQUE,  -- ID del preapproval_plan en Mercado Pago

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Validaciones
    CONSTRAINT valid_precios_plan
        CHECK (precio_mensual >= 0 AND (precio_anual IS NULL OR precio_anual >= 0)),
    CONSTRAINT valid_limites_plan
        CHECK (
            (limite_profesionales IS NULL OR limite_profesionales > 0) AND
            (limite_clientes IS NULL OR limite_clientes > 0) AND
            (limite_servicios IS NULL OR limite_servicios > 0) AND
            (limite_usuarios > 0) AND
            (limite_citas_mes IS NULL OR limite_citas_mes > 0)
        )
);

-- ====================================================================
-- TABLA: metricas_uso_organizacion
-- ====================================================================
-- Tabla desnormalizada SOLO para métricas, actualizada por triggers.
-- Separada para evitar race conditions y mejorar performance.
-- ====================================================================
CREATE TABLE metricas_uso_organizacion (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL UNIQUE REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Contadores actuales
    uso_profesionales INTEGER DEFAULT 0,
    uso_clientes INTEGER DEFAULT 0,
    uso_servicios INTEGER DEFAULT 0,
    uso_usuarios INTEGER DEFAULT 1,

    -- Métricas mensuales (se resetea cada mes)
    uso_citas_mes_actual INTEGER DEFAULT 0,
    mes_actual DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),

    -- Métricas históricas máximas
    max_citas_mes INTEGER DEFAULT 0,
    mes_max_citas DATE,

    -- Control de actualización
    ultima_actualizacion TIMESTAMPTZ DEFAULT NOW(),

    -- Validaciones
    CONSTRAINT valid_contadores
        CHECK (
            uso_profesionales >= 0 AND
            uso_clientes >= 0 AND
            uso_servicios >= 0 AND
            uso_usuarios >= 1 AND
            uso_citas_mes_actual >= 0 AND
            max_citas_mes >= 0
        )
);

-- ====================================================================
-- TABLA: subscripciones
-- ====================================================================
-- Tabla normalizada que maneja SOLO la información de subscripción
-- y facturación específica de cada organización.
-- ====================================================================
CREATE TABLE subscripciones (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIONES NORMALIZADAS
    organizacion_id INTEGER NOT NULL UNIQUE REFERENCES organizaciones(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES planes_subscripcion(id) ON DELETE RESTRICT,

    -- ====================================================================
    -- 💰 SECCIÓN: INFORMACIÓN DE FACTURACIÓN ESPECÍFICA
    -- ====================================================================
    precio_actual DECIMAL(10,2) NOT NULL,  -- Precio negociado (puede diferir del plan base)
    precio_con_descuento DECIMAL(10,2),    -- Precio después de descuentos aplicados

    descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    descuento_expira_en DATE,
    codigo_promocional VARCHAR(50),

    -- ====================================================================
    -- 📅 SECCIÓN: CICLO DE FACTURACIÓN
    -- ====================================================================
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    fecha_proximo_pago DATE NOT NULL,
    dia_facturacion INTEGER DEFAULT EXTRACT(DAY FROM CURRENT_DATE),

    periodo_facturacion VARCHAR(20) DEFAULT 'mensual',  -- 'mensual', 'anual'
    auto_renovacion BOOLEAN DEFAULT TRUE,

    -- ====================================================================
    -- 🎁 SECCIÓN: TRIAL / PERÍODO DE PRUEBA
    -- ====================================================================
    fecha_inicio_trial TIMESTAMPTZ,                     -- Fecha de inicio del trial
    fecha_fin_trial TIMESTAMPTZ,                        -- Fecha de fin del trial
    dias_trial INTEGER DEFAULT 14,                      -- Duración del trial en días

    -- ====================================================================
    -- 🎛️ SECCIÓN: ESTADO Y CONTROL
    -- ====================================================================
    estado estado_subscripcion NOT NULL DEFAULT 'trial',
    activa BOOLEAN DEFAULT TRUE,

    cancelada_por_usuario BOOLEAN DEFAULT FALSE,
    motivo_cancelacion TEXT,
    fecha_cancelacion TIMESTAMPTZ,

    permite_reactivacion BOOLEAN DEFAULT TRUE,
    fecha_limite_reactivacion DATE,

    -- ====================================================================
    -- 💳 SECCIÓN: INTEGRACIÓN CON GATEWAY DE PAGO
    -- ====================================================================
    gateway_pago VARCHAR(30),                            -- 'stripe', 'paypal', 'conekta', 'mercadopago'
    customer_id_gateway VARCHAR(100),                    -- ID del cliente en el gateway
    subscription_id_gateway VARCHAR(100),               -- ID de la subscripción en el gateway

    ultimo_intento_pago TIMESTAMPTZ,                     -- Último intento de cobro
    intentos_pago_fallidos INTEGER DEFAULT 0,            -- Contador de fallos consecutivos

    -- ====================================================================
    -- 📊 SECCIÓN: MÉTRICAS DE NEGOCIO (SIN CONTADORES DE USO)
    -- ====================================================================
    valor_total_pagado DECIMAL(12,2) DEFAULT 0.00,       -- LTV acumulado
    meses_como_cliente INTEGER DEFAULT 0,                -- Antigüedad como cliente
    veces_cancelado INTEGER DEFAULT 0,                   -- Cuántas veces ha cancelado y reactivado

    -- ====================================================================
    -- 📝 SECCIÓN: METADATOS
    -- ====================================================================
    notas_internas TEXT,                                 -- Notas para el equipo de soporte
    metadata JSONB DEFAULT '{}',                         -- Datos adicionales flexibles

    -- ====================================================================
    -- 🧩 SECCIÓN: SISTEMA MODULAR
    -- ====================================================================
    -- Módulos activos para esta organización
    -- Estructura: {"core": true, "agendamiento": true, "inventario": true, ...}
    -- core siempre debe estar activo (validado por trigger)
    modulos_activos JSONB NOT NULL DEFAULT '{"core": true, "agendamiento": true}'::jsonb,

    -- ====================================================================
    -- ⏰ SECCIÓN: TIMESTAMPS DE AUDITORÍA
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_por INTEGER REFERENCES usuarios(id),

    -- ====================================================================
    -- ✅ SECCIÓN: VALIDACIONES
    -- ====================================================================
    CONSTRAINT valid_precios_sub
        CHECK (
            precio_actual >= 0 AND
            (precio_con_descuento IS NULL OR precio_con_descuento >= 0) AND
            (precio_con_descuento IS NULL OR precio_con_descuento <= precio_actual)
        ),
    CONSTRAINT valid_descuento_sub
        CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
    CONSTRAINT valid_dia_facturacion_sub
        CHECK (dia_facturacion >= 1 AND dia_facturacion <= 31),
    CONSTRAINT valid_intentos_pago_sub
        CHECK (intentos_pago_fallidos >= 0 AND intentos_pago_fallidos <= 10),
    CONSTRAINT valid_fechas_sub
        CHECK (
            fecha_proximo_pago >= fecha_inicio AND
            (fecha_fin IS NULL OR fecha_fin >= fecha_inicio) AND
            (descuento_expira_en IS NULL OR descuento_expira_en >= fecha_inicio) AND
            (fecha_limite_reactivacion IS NULL OR fecha_limite_reactivacion >= CURRENT_DATE) AND
            (fecha_fin_trial IS NULL OR fecha_inicio_trial IS NULL OR fecha_fin_trial >= fecha_inicio_trial) AND
            (dias_trial IS NULL OR dias_trial > 0)
        ),
    CONSTRAINT valid_cancelacion_sub
        CHECK (
            (fecha_cancelacion IS NULL AND motivo_cancelacion IS NULL) OR
            (fecha_cancelacion IS NOT NULL AND motivo_cancelacion IS NOT NULL)
        )
);

-- ====================================================================
-- TABLA: historial_subscripciones
-- ====================================================================
-- Registra todos los cambios importantes en las subscripciones para
-- análisis de churn, LTV y comportamiento de clientes.
-- ====================================================================
CREATE TABLE historial_subscripciones (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    subscripcion_id INTEGER REFERENCES subscripciones(id) ON DELETE SET NULL,

    -- ====================================================================
    -- 📋 SECCIÓN: INFORMACIÓN DEL CAMBIO
    -- ====================================================================
    tipo_evento VARCHAR(50) NOT NULL,  -- 'creacion', 'upgrade', 'downgrade', 'cancelacion', 'reactivacion', 'pago_exitoso', 'pago_fallido'
    plan_anterior plan_tipo,
    plan_nuevo plan_tipo,
    precio_anterior DECIMAL(10,2),
    precio_nuevo DECIMAL(10,2),

    -- ====================================================================
    -- 📊 SECCIÓN: MÉTRICAS DEL MOMENTO
    -- ====================================================================
    valor_pago DECIMAL(10,2),                           -- Monto del pago (si aplica)
    metodo_pago VARCHAR(30),                             -- Método usado para el pago
    gateway_utilizado VARCHAR(30),                      -- Gateway que procesó
    transaction_id VARCHAR(100),                        -- ID de transacción externa

    -- ====================================================================
    -- 📝 SECCIÓN: CONTEXTO Y RAZONES
    -- ====================================================================
    motivo TEXT,                                         -- Razón del cambio
    iniciado_por VARCHAR(20) DEFAULT 'usuario',         -- 'usuario', 'sistema', 'admin', 'gateway'
    usuario_responsable INTEGER REFERENCES usuarios(id),

    ip_origen INET,                                      -- IP desde donde se hizo el cambio
    user_agent TEXT,                                     -- Navegador/app utilizada

    -- ====================================================================
    -- ⏰ TIMESTAMPS
    -- ====================================================================
    ocurrido_en TIMESTAMPTZ DEFAULT NOW(),
    procesado_en TIMESTAMPTZ,                           -- Cuándo se completó el procesamiento

    -- ====================================================================
    -- ✅ VALIDACIONES
    -- ====================================================================
    CONSTRAINT valid_evento
        CHECK (tipo_evento IN ('creacion', 'upgrade', 'downgrade', 'cancelacion', 'reactivacion', 'pago_exitoso', 'pago_fallido', 'cambio_precio', 'suspension')),
    CONSTRAINT valid_iniciador
        CHECK (iniciado_por IN ('usuario', 'sistema', 'admin', 'gateway'))
);

-- ====================================================================
-- 📊 ÍNDICES
-- ====================================================================

-- Índice GIN para búsqueda eficiente en modulos_activos JSONB
-- Permite queries como: modulos_activos ? 'inventario' (verificar si clave existe)
-- Performance: O(log n) vs O(n) sin índice
CREATE INDEX idx_subscripciones_modulos_activos
ON subscripciones USING GIN (modulos_activos);

COMMENT ON INDEX idx_subscripciones_modulos_activos IS
'Índice GIN para búsqueda eficiente de módulos activos por organización. Soporta operadores ?, ?&, ?| y @>';

-- ====================================================================
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================
COMMENT ON TABLE planes_subscripcion IS 'Definición normalizada de planes de subscripción con límites y características';
COMMENT ON TABLE metricas_uso_organizacion IS 'Tabla desnormalizada para métricas de uso, actualizada por triggers';
COMMENT ON TABLE subscripciones IS 'Gestión completa de subscripciones SaaS con facturación normalizada';
COMMENT ON TABLE historial_subscripciones IS 'Auditoría completa de cambios en subscripciones para análisis de churn y LTV';

COMMENT ON COLUMN subscripciones.precio_actual IS 'Precio negociado específico, puede diferir del precio base del plan';
COMMENT ON COLUMN metricas_uso_organizacion.uso_citas_mes_actual IS 'Contador de citas del mes actual, se resetea automáticamente';
COMMENT ON COLUMN planes_subscripcion.funciones_habilitadas IS 'JSONB con features específicas habilitadas por plan (whatsapp, reports, branding, api, etc.)';
COMMENT ON COLUMN subscripciones.valor_total_pagado IS 'Lifetime Value (LTV) acumulado del cliente';
COMMENT ON COLUMN subscripciones.modulos_activos IS 'JSONB con módulos activos para la organización. Estructura: {"core": true, "agendamiento": true, "inventario": false, ...}. El módulo core siempre debe estar activo';
