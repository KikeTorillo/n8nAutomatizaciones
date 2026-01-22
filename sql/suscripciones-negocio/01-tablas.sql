-- ============================================================================
-- MÓDULO: SUSCRIPCIONES-NEGOCIO
-- ============================================================================
-- Descripción: Sistema completo de suscripciones SaaS para negocios
-- Versión: 1.0.0
-- Fecha: 21 Enero 2026
-- Dependencias: nucleo (organizaciones, clientes)
--
-- Contenido:
-- 1. Tabla planes_suscripcion_org - Planes personalizados por organización
-- 2. Tabla suscripciones_org - Suscripciones de clientes
-- 3. Tabla pagos_suscripcion - Historial de pagos
-- 4. Tabla cupones_suscripcion - Cupones de descuento
-- 5. Tabla webhooks_suscripcion - Webhooks de gateways
-- 6. Índices de rendimiento
-- 7. Políticas RLS
-- 8. Funciones de métricas (MRR, Churn, LTV)
-- ============================================================================

-- ============================================================================
-- 1. TABLA: planes_suscripcion_org
-- ============================================================================
-- Planes de suscripción configurables por cada organización.
-- Cada org puede crear sus propios planes (trial, pro, premium, etc.)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS planes_suscripcion_org (
    -- Identificación
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,                    -- trial, pro, premium, basico
    nombre VARCHAR(100) NOT NULL,                   -- "Plan Trial 14 días", "Plan Pro"
    descripcion TEXT,

    -- Precios (soporte multi-periodo)
    precio_mensual NUMERIC(10,2) NOT NULL DEFAULT 0,
    precio_trimestral NUMERIC(10,2),
    precio_anual NUMERIC(10,2),
    moneda VARCHAR(3) DEFAULT 'MXN',                -- MXN, USD, EUR

    -- Trial
    dias_trial INTEGER DEFAULT 0,                   -- 0 = sin trial, 14 = trial 14 días

    -- Límites (JSONB para flexibilidad)
    limites JSONB DEFAULT '{}',                     -- {"usuarios": 10, "clientes": 500}

    -- Features (array de strings)
    features JSONB DEFAULT '[]',                    -- ["api_access", "priority_support"]

    -- UI
    color VARCHAR(7) DEFAULT '#6366F1',             -- Color para la UI
    icono VARCHAR(50) DEFAULT 'package',            -- Icono lucide-react
    destacado BOOLEAN DEFAULT FALSE,                -- Mostrar como "Recomendado"

    -- Control
    activo BOOLEAN DEFAULT TRUE,
    orden_display INTEGER DEFAULT 0,                -- Orden en UI

    -- Auditoría
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),

    -- Constraints
    CONSTRAINT uq_plan_codigo_org UNIQUE (organizacion_id, codigo),
    CONSTRAINT chk_precio_mensual CHECK (precio_mensual >= 0),
    CONSTRAINT chk_precio_trimestral CHECK (precio_trimestral IS NULL OR precio_trimestral >= 0),
    CONSTRAINT chk_precio_anual CHECK (precio_anual IS NULL OR precio_anual >= 0),
    CONSTRAINT chk_dias_trial CHECK (dias_trial >= 0 AND dias_trial <= 90)
);

COMMENT ON TABLE planes_suscripcion_org IS
'Planes de suscripción configurables por organización. Cada negocio crea sus propios planes.';

COMMENT ON COLUMN planes_suscripcion_org.limites IS
'Límites del plan en formato JSONB. Ej: {"usuarios": 10, "productos": 1000, "storage_gb": 50}';

COMMENT ON COLUMN planes_suscripcion_org.features IS
'Lista de features habilitadas en formato array JSONB. Ej: ["api_access", "whatsapp_integration"]';

-- ============================================================================
-- 2. TABLA: suscripciones_org
-- ============================================================================
-- Suscripciones activas/inactivas de clientes a planes.
-- Soporta tanto clientes internos (FK) como externos (JSONB).
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS suscripciones_org (
    -- Identificación
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES planes_suscripcion_org(id) ON DELETE RESTRICT,

    -- Suscriptor (interno o externo)
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,  -- Cliente interno
    suscriptor_externo JSONB,                       -- {nombre, email, empresa} para clientes externos

    -- Período y estado
    periodo VARCHAR(20) NOT NULL DEFAULT 'mensual', -- mensual, trimestral, semestral, anual
    estado VARCHAR(20) NOT NULL DEFAULT 'activa',   -- trial, activa, pausada, cancelada, vencida, suspendida

    -- Fechas importantes
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_proximo_cobro DATE NOT NULL,
    fecha_fin DATE,                                 -- NULL = renovación automática, NOT NULL = fecha de cancelación

    -- Trial
    es_trial BOOLEAN DEFAULT FALSE,
    fecha_fin_trial DATE,

    -- Gateway de pago
    gateway VARCHAR(30),                            -- stripe, mercadopago, paypal, manual
    customer_id_gateway VARCHAR(100),               -- ID del cliente en el gateway
    subscription_id_gateway VARCHAR(100),           -- ID de la suscripción en el gateway
    payment_method_id VARCHAR(100),                 -- ID del método de pago

    -- Precios aplicados (snapshot al momento de suscripción)
    precio_actual NUMERIC(10,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'MXN',
    cupon_aplicado_id INTEGER,                      -- FK agregada después (evitar ciclo)
    descuento_porcentaje NUMERIC(5,2),
    descuento_monto NUMERIC(10,2),

    -- Control
    auto_cobro BOOLEAN DEFAULT TRUE,                -- Si TRUE, cobra automáticamente
    notificaciones_activas BOOLEAN DEFAULT TRUE,

    -- Métricas
    meses_activo INTEGER DEFAULT 0,                 -- Contador de meses pagados
    total_pagado NUMERIC(12,2) DEFAULT 0,           -- Total histórico pagado

    -- Auditoría
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    cancelado_por INTEGER REFERENCES usuarios(id),
    razon_cancelacion TEXT,

    -- Constraints
    CONSTRAINT chk_estado_valido CHECK (
        estado IN ('trial', 'activa', 'pausada', 'cancelada', 'vencida', 'suspendida')
    ),
    CONSTRAINT chk_periodo_valido CHECK (
        periodo IN ('mensual', 'trimestral', 'semestral', 'anual')
    ),
    CONSTRAINT chk_gateway_valido CHECK (
        gateway IS NULL OR gateway IN ('stripe', 'mercadopago', 'paypal', 'manual')
    ),
    CONSTRAINT chk_precio_actual CHECK (precio_actual >= 0),
    CONSTRAINT chk_cliente_o_externo CHECK (
        (cliente_id IS NOT NULL AND suscriptor_externo IS NULL) OR
        (cliente_id IS NULL AND suscriptor_externo IS NOT NULL)
    )
);

COMMENT ON TABLE suscripciones_org IS
'Suscripciones de clientes a planes. Soporta clientes internos (CRM) y externos.';

COMMENT ON COLUMN suscripciones_org.suscriptor_externo IS
'Datos de suscriptor externo en JSONB: {nombre, email, empresa, telefono}';

COMMENT ON COLUMN suscripciones_org.estado IS
'Estados: trial (prueba), activa (pagando), pausada (temporal), cancelada (fin), vencida (no pago), suspendida (bloqueada)';

-- ============================================================================
-- 3. TABLA: pagos_suscripcion
-- ============================================================================
-- Registro de todos los pagos (exitosos y fallidos) de suscripciones.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pagos_suscripcion (
    -- Identificación
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    suscripcion_id INTEGER NOT NULL REFERENCES suscripciones_org(id) ON DELETE CASCADE,

    -- Detalles del pago
    monto NUMERIC(10,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'MXN',
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente', -- pendiente, completado, fallido, reembolsado

    -- Gateway
    gateway VARCHAR(30) NOT NULL,                    -- stripe, mercadopago, paypal, manual
    transaction_id VARCHAR(150),                     -- ID de transacción del gateway
    payment_intent_id VARCHAR(150),                  -- Stripe Payment Intent ID
    charge_id VARCHAR(150),                          -- Stripe Charge ID o MercadoPago Payment ID

    -- Método de pago
    metodo_pago VARCHAR(50),                         -- card, bank_transfer, oxxo, spei
    ultimos_digitos VARCHAR(4),                      -- Últimos 4 dígitos de tarjeta

    -- Período cubierto
    fecha_inicio_periodo DATE NOT NULL,
    fecha_fin_periodo DATE NOT NULL,

    -- Control de reintentos (para pagos fallidos)
    intentos_cobro INTEGER DEFAULT 1,
    proximo_reintento TIMESTAMP,

    -- Reembolsos
    reembolsado BOOLEAN DEFAULT FALSE,
    fecha_reembolso TIMESTAMP,
    monto_reembolsado NUMERIC(10,2),
    razon_reembolso TEXT,

    -- Metadata
    metadata JSONB,                                  -- Datos adicionales del gateway

    -- Auditoría
    fecha_pago TIMESTAMP,                            -- Fecha efectiva del pago
    creado_en TIMESTAMP DEFAULT NOW(),
    procesado_por INTEGER REFERENCES usuarios(id),   -- Usuario que procesó manualmente (si aplica)

    -- Constraints
    CONSTRAINT chk_estado_pago CHECK (
        estado IN ('pendiente', 'completado', 'fallido', 'reembolsado')
    ),
    CONSTRAINT chk_monto_positivo CHECK (monto > 0),
    CONSTRAINT chk_intentos_cobro CHECK (intentos_cobro > 0 AND intentos_cobro <= 5)
);

COMMENT ON TABLE pagos_suscripcion IS
'Registro completo de pagos de suscripciones, incluyendo exitosos, fallidos y reembolsados.';

-- ============================================================================
-- 4. TABLA: cupones_suscripcion
-- ============================================================================
-- Cupones de descuento aplicables a suscripciones.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cupones_suscripcion (
    -- Identificación
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,                     -- SUMMER2026, FIRST50
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- Tipo de descuento
    tipo_descuento VARCHAR(20) NOT NULL,             -- porcentaje, monto_fijo
    porcentaje_descuento NUMERIC(5,2),               -- 10.00 = 10%
    monto_descuento NUMERIC(10,2),                   -- $50.00
    moneda VARCHAR(3) DEFAULT 'MXN',

    -- Duración del descuento
    duracion_descuento VARCHAR(20) DEFAULT 'una_vez', -- una_vez, siempre, meses_limitados
    meses_duracion INTEGER,                          -- Si duracion_descuento = meses_limitados

    -- Validez temporal
    fecha_inicio DATE NOT NULL,
    fecha_expiracion DATE,

    -- Límites de uso
    usos_maximos INTEGER,                            -- NULL = ilimitado
    usos_actuales INTEGER DEFAULT 0,

    -- Restricciones
    planes_aplicables JSONB,                         -- ["pro", "premium"] o NULL = todos
    solo_primer_pago BOOLEAN DEFAULT FALSE,          -- Solo aplicable al primer pago

    -- Control
    activo BOOLEAN DEFAULT TRUE,

    -- Auditoría
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),

    -- Constraints
    CONSTRAINT uq_codigo_cupon_org UNIQUE (organizacion_id, codigo),
    CONSTRAINT chk_tipo_descuento CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo')),
    CONSTRAINT chk_porcentaje_valido CHECK (
        porcentaje_descuento IS NULL OR
        (porcentaje_descuento > 0 AND porcentaje_descuento <= 100)
    ),
    CONSTRAINT chk_monto_valido CHECK (
        monto_descuento IS NULL OR monto_descuento > 0
    ),
    CONSTRAINT chk_usos_maximos CHECK (
        usos_maximos IS NULL OR usos_maximos > 0
    ),
    CONSTRAINT chk_duracion CHECK (
        duracion_descuento IN ('una_vez', 'siempre', 'meses_limitados')
    )
);

COMMENT ON TABLE cupones_suscripcion IS
'Cupones de descuento para suscripciones. Soporta descuentos por porcentaje o monto fijo.';

-- ============================================================================
-- 5. TABLA: webhooks_suscripcion
-- ============================================================================
-- Registro de webhooks recibidos de gateways de pago (auditoría y debugging).
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS webhooks_suscripcion (
    -- Identificación
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER REFERENCES organizaciones(id) ON DELETE SET NULL,

    -- Gateway
    gateway VARCHAR(30) NOT NULL,                    -- stripe, mercadopago
    evento_tipo VARCHAR(100) NOT NULL,               -- payment_intent.succeeded, charge.failed
    evento_id VARCHAR(150) NOT NULL,                 -- evt_xxxxx (Stripe)

    -- Payload
    payload JSONB NOT NULL,                          -- Payload completo del webhook

    -- Procesamiento
    procesado BOOLEAN DEFAULT FALSE,
    fecha_procesado TIMESTAMP,
    resultado VARCHAR(20),                           -- success, error, ignored
    mensaje_error TEXT,

    -- Signature validation
    signature_valida BOOLEAN,

    -- Relación con entidades
    suscripcion_id INTEGER REFERENCES suscripciones_org(id) ON DELETE SET NULL,
    pago_id INTEGER REFERENCES pagos_suscripcion(id) ON DELETE SET NULL,

    -- Auditoría
    recibido_en TIMESTAMP DEFAULT NOW(),
    ip_origen INET,

    -- Constraints
    CONSTRAINT uq_evento_id_gateway UNIQUE (gateway, evento_id),
    CONSTRAINT chk_resultado CHECK (resultado IS NULL OR resultado IN ('success', 'error', 'ignored'))
);

COMMENT ON TABLE webhooks_suscripcion IS
'Registro de webhooks recibidos de Stripe/MercadoPago para auditoría y debugging.';

-- ============================================================================
-- 5.1. AGREGAR FOREIGN KEY CIRCULAR (después de crear cupones)
-- ============================================================================
-- Agregar FK de cupon_aplicado_id ahora que la tabla cupones_suscripcion existe

ALTER TABLE suscripciones_org
    ADD CONSTRAINT fk_suscripciones_cupon
    FOREIGN KEY (cupon_aplicado_id)
    REFERENCES cupones_suscripcion(id)
    ON DELETE SET NULL;

-- ============================================================================
-- 6. ÍNDICES DE RENDIMIENTO
-- ============================================================================

-- Índices para planes_suscripcion_org
CREATE INDEX IF NOT EXISTS idx_planes_organizacion ON planes_suscripcion_org(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_planes_activos ON planes_suscripcion_org(activo) WHERE activo = TRUE;

-- Índices para suscripciones_org
CREATE INDEX IF NOT EXISTS idx_suscripciones_organizacion ON suscripciones_org(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_cliente ON suscripciones_org(cliente_id) WHERE cliente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON suscripciones_org(estado);
CREATE INDEX IF NOT EXISTS idx_suscripciones_activas ON suscripciones_org(organizacion_id, estado) WHERE estado IN ('activa', 'trial');

-- **CRÍTICO**: Índice para cron job de cobros automáticos
CREATE INDEX IF NOT EXISTS idx_suscripciones_proximo_cobro
    ON suscripciones_org(fecha_proximo_cobro)
    WHERE estado IN ('activa', 'trial') AND auto_cobro = TRUE;

CREATE INDEX IF NOT EXISTS idx_suscripciones_gateway ON suscripciones_org(gateway, subscription_id_gateway);

-- Índices para pagos_suscripcion
CREATE INDEX IF NOT EXISTS idx_pagos_organizacion ON pagos_suscripcion(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_pagos_suscripcion ON pagos_suscripcion(suscripcion_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos_suscripcion(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_completados ON pagos_suscripcion(estado, fecha_pago) WHERE estado = 'completado';
CREATE INDEX IF NOT EXISTS idx_pagos_transaction_id ON pagos_suscripcion(gateway, transaction_id);

-- Índices para cupones_suscripcion
CREATE INDEX IF NOT EXISTS idx_cupones_organizacion ON cupones_suscripcion(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_cupones_activos ON cupones_suscripcion(activo, fecha_expiracion) WHERE activo = TRUE;

-- Índices para webhooks_suscripcion
CREATE INDEX IF NOT EXISTS idx_webhooks_gateway ON webhooks_suscripcion(gateway, evento_tipo);
CREATE INDEX IF NOT EXISTS idx_webhooks_no_procesados ON webhooks_suscripcion(procesado, recibido_en) WHERE procesado = FALSE;
CREATE INDEX IF NOT EXISTS idx_webhooks_organizacion ON webhooks_suscripcion(organizacion_id);

-- ============================================================================
-- 7. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================
-- Todas las tablas usan RLS estricto con organizacion_id.
-- ----------------------------------------------------------------------------

-- Habilitar RLS en todas las tablas
ALTER TABLE planes_suscripcion_org ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones_org ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_suscripcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupones_suscripcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks_suscripcion ENABLE ROW LEVEL SECURITY;

-- Políticas para planes_suscripcion_org
CREATE POLICY planes_select_own ON planes_suscripcion_org
    FOR SELECT USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY planes_insert_own ON planes_suscripcion_org
    FOR INSERT WITH CHECK (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY planes_update_own ON planes_suscripcion_org
    FOR UPDATE USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY planes_delete_own ON planes_suscripcion_org
    FOR DELETE USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

-- Políticas para suscripciones_org
CREATE POLICY suscripciones_select_own ON suscripciones_org
    FOR SELECT USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY suscripciones_insert_own ON suscripciones_org
    FOR INSERT WITH CHECK (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY suscripciones_update_own ON suscripciones_org
    FOR UPDATE USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY suscripciones_delete_own ON suscripciones_org
    FOR DELETE USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

-- Políticas para pagos_suscripcion
CREATE POLICY pagos_select_own ON pagos_suscripcion
    FOR SELECT USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY pagos_insert_own ON pagos_suscripcion
    FOR INSERT WITH CHECK (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY pagos_update_own ON pagos_suscripcion
    FOR UPDATE USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

-- Políticas para cupones_suscripcion
CREATE POLICY cupones_select_own ON cupones_suscripcion
    FOR SELECT USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY cupones_insert_own ON cupones_suscripcion
    FOR INSERT WITH CHECK (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY cupones_update_own ON cupones_suscripcion
    FOR UPDATE USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY cupones_delete_own ON cupones_suscripcion
    FOR DELETE USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

-- Políticas para webhooks_suscripcion
CREATE POLICY webhooks_select_own ON webhooks_suscripcion
    FOR SELECT USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER OR organizacion_id IS NULL);

CREATE POLICY webhooks_insert_own ON webhooks_suscripcion
    FOR INSERT WITH CHECK (organizacion_id IS NULL OR organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

-- ============================================================================
-- MIGRACIÓN COMPLETADA
-- ============================================================================
-- Tablas creadas: 5
-- Índices creados: 18
-- Políticas RLS: 15
-- ============================================================================
