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
-- 5. Índices de rendimiento
-- 6. Políticas RLS
-- 7. Índices únicos para prevención de duplicados
-- 8. Trigger cancelación automática
-- 9. Tabla uso_usuarios_org - Tracking de seats
-- 10. Tabla ajustes_facturacion_org - Log de ajustes
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
    precio_semestral NUMERIC(10,2),
    precio_anual NUMERIC(10,2),
    moneda VARCHAR(3) DEFAULT 'MXN',                -- MXN, USD, EUR

    -- Trial
    dias_trial INTEGER DEFAULT 0,                   -- 0 = sin trial, 14 = trial 14 días

    -- Límites (JSONB para flexibilidad)
    limites JSONB DEFAULT '{}',                     -- {"usuarios": 10, "clientes": 500}

    -- Features (array de strings descriptivos para display)
    features JSONB DEFAULT '[]',                    -- ["Usuarios ilimitados", "Soporte prioritario"]

    -- Módulos del sistema habilitados (control de acceso)
    modulos_habilitados JSONB DEFAULT '[]',         -- ["agendamiento", "pos", "inventario"]

    -- Pricing por usuario (Seat-based billing)
    precio_usuario_adicional NUMERIC(10,2) DEFAULT NULL, -- Precio por usuario extra. NULL = hard limit
    usuarios_incluidos INTEGER DEFAULT 5,                -- Usuarios incluidos en precio base
    max_usuarios_hard INTEGER DEFAULT NULL,              -- Límite absoluto. NULL = ilimitado

    -- UI
    color VARCHAR(7) DEFAULT '#6366F1',             -- Color para la UI
    icono VARCHAR(50) DEFAULT 'package',            -- Icono lucide-react
    destacado BOOLEAN DEFAULT FALSE,                -- Mostrar como "Recomendado"

    -- Control
    activo BOOLEAN DEFAULT TRUE,
    publico BOOLEAN DEFAULT TRUE,                   -- FALSE = no aparece en /planes/publicos (ej: enterprise)
    orden_display INTEGER DEFAULT 0,                -- Orden en UI

    -- Auditoría
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),

    -- Constraints
    CONSTRAINT uq_plan_codigo_org UNIQUE (organizacion_id, codigo),
    CONSTRAINT chk_precio_mensual CHECK (precio_mensual >= 0),
    CONSTRAINT chk_precio_trimestral CHECK (precio_trimestral IS NULL OR precio_trimestral >= 0),
    CONSTRAINT chk_precio_semestral CHECK (precio_semestral IS NULL OR precio_semestral >= 0),
    CONSTRAINT chk_precio_anual CHECK (precio_anual IS NULL OR precio_anual >= 0),
    CONSTRAINT chk_dias_trial CHECK (dias_trial >= 0 AND dias_trial <= 90)
);

COMMENT ON TABLE planes_suscripcion_org IS
'Planes de suscripción configurables por organización. Cada negocio crea sus propios planes.';

COMMENT ON COLUMN planes_suscripcion_org.limites IS
'Límites del plan en formato JSONB. Ej: {"usuarios": 10, "productos": 1000, "storage_gb": 50}';

COMMENT ON COLUMN planes_suscripcion_org.features IS
'Características descriptivas para display/marketing. Ej: ["Usuarios ilimitados", "API REST"]';

COMMENT ON COLUMN planes_suscripcion_org.modulos_habilitados IS
'Módulos del sistema habilitados para control de acceso. Valores válidos: agendamiento, inventario, pos, comisiones, contabilidad, marketplace, chatbots, workflows, eventos-digitales, website, suscripciones-negocio';

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
    fecha_proximo_cobro DATE,                       -- NULL para estado pendiente_pago
    fecha_fin DATE,                                 -- NULL = renovación automática, NOT NULL = fecha de cancelación

    -- Trial
    es_trial BOOLEAN DEFAULT FALSE,
    fecha_fin_trial DATE,

    -- Grace Period (Ene 2026)
    fecha_gracia DATE,                        -- Fecha límite de grace period
    ultimo_intento_cobro TIMESTAMP,           -- Último intento de cobro automático
    intentos_cobro_fallidos INTEGER DEFAULT 0,-- Contador de intentos fallidos consecutivos

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

    -- Tracking de usuarios (Seat-based billing)
    usuarios_contratados INTEGER DEFAULT 0,             -- Snapshot de usuarios al último cobro
    usuarios_max_periodo INTEGER DEFAULT 0,             -- Máximo usuarios activos del período
    precio_usuario_snapshot NUMERIC(10,2),              -- Precio por usuario al momento de suscripción
    ajuste_pendiente NUMERIC(10,2) DEFAULT 0,           -- Monto adicional a cobrar en próxima factura

    -- Prorrateo
    credito_pendiente NUMERIC(10,2) DEFAULT 0,          -- Crédito por downgrade para próxima factura

    -- Auditoría
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    cancelado_por INTEGER REFERENCES usuarios(id),
    razon_cancelacion TEXT,

    -- Constraints
    CONSTRAINT chk_estado_valido CHECK (
        estado IN ('trial', 'pendiente_pago', 'activa', 'pausada', 'cancelada', 'vencida', 'suspendida', 'grace_period')
    ),
    CONSTRAINT chk_periodo_valido CHECK (
        periodo IN ('mensual', 'trimestral', 'semestral', 'anual')
    ),
    CONSTRAINT chk_gateway_valido CHECK (
        gateway IS NULL OR gateway IN ('stripe', 'mercadopago', 'paypal', 'manual', 'cupon_100')
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
'Estados: trial (prueba), pendiente_pago (checkout iniciado), activa (pagando), pausada (temporal), cancelada (fin), vencida (no pago), suspendida (bloqueada), grace_period (período de gracia, solo lectura)';

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

    -- Período cubierto (NULL para pagos pendientes de checkout)
    fecha_inicio_periodo DATE,
    fecha_fin_periodo DATE,

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
-- 4.1. AGREGAR FOREIGN KEY CIRCULAR (después de crear cupones)
-- ============================================================================
-- Agregar FK de cupon_aplicado_id ahora que la tabla cupones_suscripcion existe

ALTER TABLE suscripciones_org
    ADD CONSTRAINT fk_suscripciones_cupon
    FOREIGN KEY (cupon_aplicado_id)
    REFERENCES cupones_suscripcion(id)
    ON DELETE SET NULL;

-- ============================================================================
-- 5. ÍNDICES DE RENDIMIENTO
-- ============================================================================

-- Índices para planes_suscripcion_org
CREATE INDEX IF NOT EXISTS idx_planes_organizacion ON planes_suscripcion_org(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_planes_activos ON planes_suscripcion_org(activo) WHERE activo = TRUE;

-- Índices para suscripciones_org
CREATE INDEX IF NOT EXISTS idx_suscripciones_organizacion ON suscripciones_org(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_cliente ON suscripciones_org(cliente_id) WHERE cliente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON suscripciones_org(estado);
CREATE INDEX IF NOT EXISTS idx_suscripciones_activas ON suscripciones_org(organizacion_id, estado) WHERE estado IN ('activa', 'trial');

-- Índice compuesto para middleware unificado (query de verificación de tenant + suscripción)
-- Optimiza JOINs donde se busca suscripción activa por organizacion_id
CREATE INDEX IF NOT EXISTS idx_suscripciones_org_estado_org
    ON suscripciones_org(organizacion_id, estado);

-- **CRÍTICO**: Índice para cron job de cobros automáticos
CREATE INDEX IF NOT EXISTS idx_suscripciones_proximo_cobro
    ON suscripciones_org(fecha_proximo_cobro)
    WHERE estado IN ('activa', 'trial') AND auto_cobro = TRUE;

CREATE INDEX IF NOT EXISTS idx_suscripciones_gateway ON suscripciones_org(gateway, subscription_id_gateway);

-- Índice para jobs de grace period
CREATE INDEX IF NOT EXISTS idx_suscripciones_grace_period
    ON suscripciones_org(estado, fecha_gracia)
    WHERE estado = 'grace_period';

-- Índices para pagos_suscripcion
CREATE INDEX IF NOT EXISTS idx_pagos_organizacion ON pagos_suscripcion(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_pagos_suscripcion ON pagos_suscripcion(suscripcion_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos_suscripcion(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_completados ON pagos_suscripcion(estado, fecha_pago) WHERE estado = 'completado';
CREATE INDEX IF NOT EXISTS idx_pagos_transaction_id ON pagos_suscripcion(gateway, transaction_id);

-- Índices para cupones_suscripcion
CREATE INDEX IF NOT EXISTS idx_cupones_organizacion ON cupones_suscripcion(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_cupones_activos ON cupones_suscripcion(activo, fecha_expiracion) WHERE activo = TRUE;

-- ============================================================================
-- 6. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================
-- Todas las tablas usan RLS estricto con organizacion_id.
-- ----------------------------------------------------------------------------

-- Habilitar RLS en todas las tablas
ALTER TABLE planes_suscripcion_org ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones_org ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_suscripcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupones_suscripcion ENABLE ROW LEVEL SECURITY;

-- Políticas para planes_suscripcion_org
-- NOTA: Incluye bypass para permitir JOINs cross-org (suscripciones de clientes con planes de Nexo Team)
CREATE POLICY planes_select_own ON planes_suscripcion_org
    FOR SELECT USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY planes_insert_own ON planes_suscripcion_org
    FOR INSERT WITH CHECK (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY planes_update_own ON planes_suscripcion_org
    FOR UPDATE USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY planes_delete_own ON planes_suscripcion_org
    FOR DELETE USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

-- Políticas para suscripciones_org
-- NOTA: Incluye bypass para permitir operaciones desde webhooks, polling y búsquedas cross-org
-- El bypass es necesario porque:
-- - Los planes pertenecen a Nexo Team (org 1)
-- - Las suscripciones pertenecen a clientes (org N)
-- - El polling y webhooks necesitan actualizar suscripciones de cualquier org
CREATE POLICY suscripciones_select_own ON suscripciones_org
    FOR SELECT USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY suscripciones_insert_own ON suscripciones_org
    FOR INSERT WITH CHECK (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY suscripciones_update_own ON suscripciones_org
    FOR UPDATE USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY suscripciones_delete_own ON suscripciones_org
    FOR DELETE USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

-- Políticas para pagos_suscripcion
-- Incluye bypass para endpoint mi-suscripcion (dogfooding: suscripción en org 1, usuario en otra org)
CREATE POLICY pagos_select_own ON pagos_suscripcion
    FOR SELECT USING (
        (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER)
        OR (current_setting('app.bypass_rls', true) = 'true')
    );

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

-- ============================================================================
-- 7. ÍNDICES ÚNICOS PARA PREVENCIÓN DE DUPLICADOS
-- ============================================================================
-- Prevenir que un cliente tenga múltiples suscripciones activas.
-- Solo permite 1 suscripción activa por cliente (sin importar el plan).
-- Excluye 'pendiente_pago' para permitir checkout mientras hay trial activo.
-- ----------------------------------------------------------------------------

-- Para clientes internos (con cliente_id)
-- NOTA: Excluye pendiente_pago para permitir checkout de upgrade mientras hay trial
CREATE UNIQUE INDEX IF NOT EXISTS idx_suscripciones_cliente_unica_activa
    ON suscripciones_org (cliente_id)
    WHERE cliente_id IS NOT NULL
      AND estado IN ('activa', 'trial', 'pausada', 'grace_period');

-- Para suscriptores externos (sin cliente_id, usa email del JSONB)
CREATE UNIQUE INDEX IF NOT EXISTS idx_suscripciones_externo_unica_activa
    ON suscripciones_org ((suscriptor_externo->>'email'))
    WHERE cliente_id IS NULL
      AND suscriptor_externo->>'email' IS NOT NULL
      AND estado IN ('activa', 'trial', 'pausada', 'grace_period');

-- ============================================================================
-- 8. TRIGGER: CANCELAR SUSCRIPCIONES ANTERIORES AL ACTIVAR
-- ============================================================================
-- Cuando una suscripción cambia a estado 'activa', cancela automáticamente
-- cualquier otra suscripción del mismo cliente (trial, pausada, etc.)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_cancelar_suscripciones_anteriores()
RETURNS TRIGGER AS $$
DECLARE
    v_canceladas INTEGER;
BEGIN
    -- Solo actuar cuando el estado cambia a 'activa'
    IF NEW.estado = 'activa' AND (OLD.estado IS NULL OR OLD.estado != 'activa') THEN
        -- Cancelar suscripciones anteriores del mismo cliente
        IF NEW.cliente_id IS NOT NULL THEN
            UPDATE suscripciones_org
            SET estado = 'cancelada',
                fecha_fin = CURRENT_DATE,
                razon_cancelacion = 'Cancelada automáticamente por upgrade a plan ' ||
                    COALESCE((SELECT nombre FROM planes_suscripcion_org WHERE id = NEW.plan_id), 'nuevo'),
                actualizado_en = NOW()
            WHERE cliente_id = NEW.cliente_id
              AND id != NEW.id
              AND estado IN ('trial', 'activa', 'pausada', 'grace_period', 'pendiente_pago');

            GET DIAGNOSTICS v_canceladas = ROW_COUNT;

            IF v_canceladas > 0 THEN
                RAISE NOTICE 'Suscripciones anteriores canceladas: % para cliente_id=%', v_canceladas, NEW.cliente_id;
            END IF;
        -- Para suscriptores externos, usar email
        ELSIF NEW.suscriptor_externo->>'email' IS NOT NULL THEN
            UPDATE suscripciones_org
            SET estado = 'cancelada',
                fecha_fin = CURRENT_DATE,
                razon_cancelacion = 'Cancelada automáticamente por upgrade',
                actualizado_en = NOW()
            WHERE suscriptor_externo->>'email' = NEW.suscriptor_externo->>'email'
              AND id != NEW.id
              AND estado IN ('trial', 'activa', 'pausada', 'grace_period', 'pendiente_pago');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger AFTER UPDATE para no interferir con la transacción principal
DROP TRIGGER IF EXISTS trg_cancelar_suscripciones_anteriores ON suscripciones_org;
CREATE TRIGGER trg_cancelar_suscripciones_anteriores
    AFTER UPDATE ON suscripciones_org
    FOR EACH ROW
    EXECUTE FUNCTION fn_cancelar_suscripciones_anteriores();

-- También ejecutar en INSERT si se crea directamente como 'activa'
DROP TRIGGER IF EXISTS trg_cancelar_suscripciones_anteriores_insert ON suscripciones_org;
CREATE TRIGGER trg_cancelar_suscripciones_anteriores_insert
    AFTER INSERT ON suscripciones_org
    FOR EACH ROW
    WHEN (NEW.estado = 'activa')
    EXECUTE FUNCTION fn_cancelar_suscripciones_anteriores();

COMMENT ON FUNCTION fn_cancelar_suscripciones_anteriores IS
'Cancela automáticamente suscripciones anteriores cuando una nueva se activa. Evita duplicados.';

-- ============================================================================
-- 9. TABLA: uso_usuarios_org
-- ============================================================================
-- Tracking diario de uso de usuarios para seat-based billing.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS uso_usuarios_org (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    suscripcion_id INTEGER NOT NULL REFERENCES suscripciones_org(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    usuarios_activos INTEGER NOT NULL,
    usuarios_incluidos INTEGER NOT NULL,
    creado_en TIMESTAMP DEFAULT NOW(),

    CONSTRAINT uq_uso_usuarios_fecha UNIQUE(suscripcion_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_uso_usuarios_fecha ON uso_usuarios_org(suscripcion_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_uso_usuarios_org ON uso_usuarios_org(organizacion_id);

ALTER TABLE uso_usuarios_org ENABLE ROW LEVEL SECURITY;

CREATE POLICY uso_usuarios_select ON uso_usuarios_org
    FOR SELECT USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY uso_usuarios_insert ON uso_usuarios_org
    FOR INSERT WITH CHECK (
        current_setting('app.bypass_rls', true) = 'true'
    );

COMMENT ON TABLE uso_usuarios_org IS 'Tracking diario de usuarios activos para cálculo de ajuste mensual por excedentes.';

-- ============================================================================
-- 10. TABLA: ajustes_facturacion_org
-- ============================================================================
-- Log de ajustes aplicados a facturas (usuarios extra, prorrateo, créditos).
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ajustes_facturacion_org (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    suscripcion_id INTEGER NOT NULL REFERENCES suscripciones_org(id) ON DELETE CASCADE,
    pago_id INTEGER REFERENCES pagos_suscripcion(id) ON DELETE SET NULL,

    tipo VARCHAR(30) NOT NULL,                         -- usuario_adicional, prorrateo_cargo, prorrateo_credito
    monto NUMERIC(10,2) NOT NULL,
    descripcion TEXT,

    -- Detalles para tipo usuario_adicional
    usuarios_base INTEGER,
    usuarios_facturados INTEGER,
    precio_unitario NUMERIC(10,2),

    -- Detalles para tipo prorrateo
    dias_prorrateados INTEGER,
    dias_periodo INTEGER,

    creado_en TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_tipo_ajuste CHECK (
        tipo IN ('usuario_adicional', 'prorrateo_cargo', 'prorrateo_credito', 'credito_manual')
    )
);

CREATE INDEX IF NOT EXISTS idx_ajustes_suscripcion ON ajustes_facturacion_org(suscripcion_id, creado_en DESC);

ALTER TABLE ajustes_facturacion_org ENABLE ROW LEVEL SECURITY;

CREATE POLICY ajustes_select ON ajustes_facturacion_org
    FOR SELECT USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY ajustes_insert ON ajustes_facturacion_org
    FOR INSERT WITH CHECK (
        current_setting('app.bypass_rls', true) = 'true'
    );

COMMENT ON TABLE ajustes_facturacion_org IS 'Registro de ajustes aplicados a facturas: usuarios extra, prorrateo, créditos.';

-- ============================================================================
-- MIGRACIÓN COMPLETADA
-- ============================================================================
-- Tablas creadas: 6 (planes, suscripciones, pagos, cupones, uso_usuarios, ajustes)
-- Índices creados: 18 (incluyendo índices únicos de duplicados)
-- Políticas RLS: 16
-- Triggers: 2 (cancelación automática de suscripciones duplicadas)
-- NOTA: webhooks se manejan en webhooks_procesados (08-idempotencia-webhooks.sql)
-- ============================================================================
