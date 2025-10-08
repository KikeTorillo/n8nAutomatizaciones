-- ====================================================================
-- 💳 TABLA SUBSCRIPCIONES - CONTROL DE FACTURACIÓN Y LÍMITES SAAS
-- ====================================================================
--
-- Esta tabla gestiona el ciclo completo de subscripciones del SaaS:
-- facturación, límites por plan, historial de pagos y control de acceso.
--
-- 🎯 ARQUITECTURA NORMALIZADA:
-- • planes_subscripcion: Definición de planes (3NF)
-- • subscripciones: Datos de facturación específicos
-- • metricas_uso_organizacion: Contadores separados para performance
-- • historial_subscripciones: Auditoría completa
--
-- 🔄 ORDEN DE EJECUCIÓN: #10 (Después de triggers)
-- 🔒 SEGURIDAD: RLS habilitado para aislamiento de facturación
-- ====================================================================

-- ====================================================================
-- 📋 TABLA PLANES_SUBSCRIPCION - DEFINICIÓN NORMALIZADA DE PLANES
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
-- 📊 TABLA METRICAS_USO_ORGANIZACION - CONTADORES SEPARADOS
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
-- 💳 TABLA SUBSCRIPCIONES - DATOS DE FACTURACIÓN ESPECÍFICOS
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
    -- ⏰ SECCIÓN: TIMESTAMPS DE AUDITORÍA
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_por INTEGER REFERENCES usuarios(id),
    
    -- ====================================================================
    -- ✅ SECCIÓN: VALIDACIONES CORREGIDAS
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
            (fecha_limite_reactivacion IS NULL OR fecha_limite_reactivacion >= CURRENT_DATE)
        ),
    CONSTRAINT valid_cancelacion_sub
        CHECK (
            (fecha_cancelacion IS NULL AND motivo_cancelacion IS NULL) OR
            (fecha_cancelacion IS NOT NULL AND motivo_cancelacion IS NOT NULL)
        )
);

-- ====================================================================
-- 📊 TABLA HISTORIAL_SUBSCRIPCIONES - AUDITORÍA COMPLETA
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
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================
COMMENT ON TABLE planes_subscripcion IS 'Definición normalizada de planes de subscripción con límites y características';
COMMENT ON TABLE metricas_uso_organizacion IS 'Tabla desnormalizada para métricas de uso, actualizada por triggers';
COMMENT ON TABLE subscripciones IS 'Gestión completa de subscripciones SaaS con facturación normalizada';
COMMENT ON TABLE historial_subscripciones IS 'Auditoría completa de cambios en subscripciones para análisis de churn y LTV';

COMMENT ON COLUMN subscripciones.precio_actual IS 'Precio negociado específico, puede diferir del precio base del plan';
COMMENT ON COLUMN metricas_uso_organizacion.uso_citas_mes_actual IS 'Contador de citas del mes actual, se resetea automáticamente';

-- ====================================================================
-- 🔒 POLÍTICAS RLS PARA SUBSCRIPCIONES
-- ====================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE planes_subscripcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_uso_organizacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_subscripciones ENABLE ROW LEVEL SECURITY;

-- Política para planes (lectura global, escritura solo super_admin)
CREATE POLICY planes_subscripcion_select ON planes_subscripcion
    FOR SELECT
    TO saas_app
    USING (activo = true OR current_setting('app.bypass_rls', true) = 'true');

CREATE POLICY planes_subscripcion_modify ON planes_subscripcion
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.current_user_role', true) = 'super_admin'
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política para métricas de uso
CREATE POLICY metricas_uso_access ON metricas_uso_organizacion
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.current_user_role', true) = 'super_admin'
        OR current_setting('app.bypass_rls', true) = 'true'
        OR (
            current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
            AND organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

-- Política unificada para subscripciones
CREATE POLICY subscripciones_unified_access ON subscripciones
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.current_user_role', true) = 'super_admin'
        OR current_setting('app.bypass_rls', true) = 'true'
        OR (
            current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
            AND organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

-- Política para historial (solo lectura para organizaciones)
CREATE POLICY historial_subscripciones_access ON historial_subscripciones
    FOR SELECT
    TO saas_app
    USING (
        current_setting('app.current_user_role', true) = 'super_admin'
        OR current_setting('app.bypass_rls', true) = 'true'
        OR (
            current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
            AND organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

-- Política para historial (escritura desde triggers con bypass)
CREATE POLICY historial_subscripciones_insert ON historial_subscripciones
    FOR INSERT
    TO saas_app
    WITH CHECK (
        current_setting('app.bypass_rls', true) = 'true'
        OR current_setting('app.current_user_role', true) = 'super_admin'
    );

-- ====================================================================
-- 📊 ÍNDICES ESPECIALIZADOS PARA PERFORMANCE
-- ====================================================================

-- Índices para planes_subscripcion
CREATE INDEX idx_planes_subscripcion_codigo ON planes_subscripcion(codigo_plan) WHERE activo = true;
CREATE INDEX idx_planes_subscripcion_precio ON planes_subscripcion(precio_mensual, precio_anual);

-- Índices para metricas_uso_organizacion
CREATE INDEX idx_metricas_uso_organizacion ON metricas_uso_organizacion(organizacion_id);
CREATE INDEX idx_metricas_uso_mes_actual ON metricas_uso_organizacion(mes_actual);

-- Índices para subscripciones
CREATE INDEX idx_subscripciones_organizacion_activa ON subscripciones(organizacion_id) WHERE activa = true;
CREATE INDEX idx_subscripciones_proximo_pago ON subscripciones(fecha_proximo_pago) WHERE activa = true AND auto_renovacion = true;
CREATE INDEX idx_subscripciones_canceladas ON subscripciones(fecha_cancelacion, motivo_cancelacion) WHERE NOT activa;
CREATE INDEX idx_subscripciones_plan ON subscripciones(plan_id);
CREATE INDEX idx_subscripciones_gateway ON subscripciones(gateway_pago, customer_id_gateway) WHERE gateway_pago IS NOT NULL;
-- Índice para consultas combinadas de planes y estado (AGREGADO: auditoría 2025-10-02)
CREATE INDEX idx_subscripciones_org_plan_estado ON subscripciones(organizacion_id, plan_id, estado, activa) WHERE activa = true;

-- Índices para historial_subscripciones
CREATE INDEX idx_historial_subscripciones_org_fecha ON historial_subscripciones(organizacion_id, ocurrido_en DESC);
CREATE INDEX idx_historial_subscripciones_tipo_evento ON historial_subscripciones(tipo_evento, ocurrido_en DESC);
CREATE INDEX idx_historial_subscripciones_sub ON historial_subscripciones(subscripcion_id, ocurrido_en DESC);

-- ====================================================================
-- 🔄 FUNCIONES AUXILIARES CORREGIDAS
-- ====================================================================

-- Función mejorada que usa las tablas normalizadas
CREATE OR REPLACE FUNCTION verificar_limite_plan(
    p_organizacion_id INTEGER,
    p_tipo_recurso VARCHAR(50),
    p_cantidad_adicional INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    v_limite INTEGER;
    v_uso_actual INTEGER;
BEGIN
    -- Obtener límite del plan actual
    SELECT 
        CASE p_tipo_recurso
            WHEN 'profesionales' THEN ps.limite_profesionales
            WHEN 'clientes' THEN ps.limite_clientes
            WHEN 'servicios' THEN ps.limite_servicios
            WHEN 'usuarios' THEN ps.limite_usuarios
            WHEN 'citas_mes' THEN ps.limite_citas_mes
            ELSE NULL
        END
    INTO v_limite
    FROM subscripciones s
    JOIN planes_subscripcion ps ON s.plan_id = ps.id
    WHERE s.organizacion_id = p_organizacion_id AND s.activa = true;
    
    -- Si no hay subscripción activa, denegar
    IF v_limite IS NULL AND NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Si no hay límite (NULL), permitir
    IF v_limite IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Obtener uso actual desde tabla de métricas
    SELECT 
        CASE p_tipo_recurso
            WHEN 'profesionales' THEN uso_profesionales
            WHEN 'clientes' THEN uso_clientes
            WHEN 'servicios' THEN uso_servicios
            WHEN 'usuarios' THEN uso_usuarios
            WHEN 'citas_mes' THEN uso_citas_mes_actual
            ELSE 0
        END
    INTO v_uso_actual
    FROM metricas_uso_organizacion
    WHERE organizacion_id = p_organizacion_id;
    
    -- Si no existe registro de métricas, crear uno
    IF NOT FOUND THEN
        INSERT INTO metricas_uso_organizacion (organizacion_id) 
        VALUES (p_organizacion_id);
        v_uso_actual := 0;
    END IF;
    
    -- Verificar límite
    RETURN (v_uso_actual + p_cantidad_adicional) <= v_limite;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener características habilitadas
CREATE OR REPLACE FUNCTION tiene_caracteristica_habilitada(
    p_organizacion_id INTEGER,
    p_caracteristica VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_funciones JSONB;
BEGIN
    SELECT ps.funciones_habilitadas
    INTO v_funciones
    FROM subscripciones s
    JOIN planes_subscripcion ps ON s.plan_id = ps.id
    WHERE s.organizacion_id = p_organizacion_id AND s.activa = true;
    
    -- Si no existe la subscripción, negar acceso
    IF v_funciones IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar si la característica está habilitada
    RETURN COALESCE((v_funciones ->> p_caracteristica)::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 🔄 TRIGGERS PARA AUTOMATIZACIÓN CORREGIDOS
-- ====================================================================

-- Función para actualizar métricas en tabla separada
CREATE OR REPLACE FUNCTION actualizar_metricas_uso()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id INTEGER;
    v_mes_actual DATE;
BEGIN
    v_org_id := COALESCE(NEW.organizacion_id, OLD.organizacion_id);

    -- Si es NULL (super_admin), no hacer nada
    IF v_org_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    v_mes_actual := DATE_TRUNC('month', CURRENT_DATE);

    -- Asegurar que existe registro de métricas
    INSERT INTO metricas_uso_organizacion (organizacion_id, mes_actual)
    VALUES (v_org_id, v_mes_actual)
    ON CONFLICT (organizacion_id) DO NOTHING;
    
    -- Actualizar contadores según la tabla
    IF TG_TABLE_NAME = 'profesionales' THEN
        UPDATE metricas_uso_organizacion 
        SET 
            uso_profesionales = (
                SELECT COUNT(*) FROM profesionales 
                WHERE organizacion_id = v_org_id AND activo = true
            ),
            ultima_actualizacion = NOW()
        WHERE organizacion_id = v_org_id;
        
    ELSIF TG_TABLE_NAME = 'clientes' THEN
        UPDATE metricas_uso_organizacion 
        SET 
            uso_clientes = (
                SELECT COUNT(*) FROM clientes 
                WHERE organizacion_id = v_org_id AND activo = true
            ),
            ultima_actualizacion = NOW()
        WHERE organizacion_id = v_org_id;
        
    ELSIF TG_TABLE_NAME = 'servicios' THEN
        UPDATE metricas_uso_organizacion 
        SET 
            uso_servicios = (
                SELECT COUNT(*) FROM servicios 
                WHERE organizacion_id = v_org_id AND activo = true
            ),
            ultima_actualizacion = NOW()
        WHERE organizacion_id = v_org_id;
        
    ELSIF TG_TABLE_NAME = 'usuarios' THEN
        UPDATE metricas_uso_organizacion 
        SET 
            uso_usuarios = (
                SELECT COUNT(*) FROM usuarios 
                WHERE organizacion_id = v_org_id AND activo = true
            ),
            ultima_actualizacion = NOW()
        WHERE organizacion_id = v_org_id;
        
    ELSIF TG_TABLE_NAME = 'citas' THEN
        -- Solo para citas del mes actual
        WITH citas_mes AS (
            SELECT COUNT(*) as total
            FROM citas 
            WHERE organizacion_id = v_org_id 
            AND DATE_TRUNC('month', fecha_cita) = v_mes_actual
        )
        UPDATE metricas_uso_organizacion 
        SET 
            uso_citas_mes_actual = citas_mes.total,
            max_citas_mes = GREATEST(max_citas_mes, citas_mes.total),
            mes_max_citas = CASE 
                WHEN citas_mes.total > max_citas_mes THEN v_mes_actual 
                ELSE mes_max_citas 
            END,
            ultima_actualizacion = NOW()
        FROM citas_mes
        WHERE organizacion_id = v_org_id;
        
        -- Resetear contador si cambió el mes
        UPDATE metricas_uso_organizacion 
        SET 
            uso_citas_mes_actual = 0,
            mes_actual = v_mes_actual
        WHERE organizacion_id = v_org_id 
        AND mes_actual < v_mes_actual;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers a las tablas relevantes
CREATE TRIGGER trigger_actualizar_metricas_profesionales
    AFTER INSERT OR UPDATE OR DELETE ON profesionales
    FOR EACH ROW EXECUTE FUNCTION actualizar_metricas_uso();

CREATE TRIGGER trigger_actualizar_metricas_clientes
    AFTER INSERT OR UPDATE OR DELETE ON clientes
    FOR EACH ROW EXECUTE FUNCTION actualizar_metricas_uso();

CREATE TRIGGER trigger_actualizar_metricas_servicios
    AFTER INSERT OR UPDATE OR DELETE ON servicios
    FOR EACH ROW EXECUTE FUNCTION actualizar_metricas_uso();

CREATE TRIGGER trigger_actualizar_metricas_usuarios
    AFTER INSERT OR UPDATE OR DELETE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION actualizar_metricas_uso();

CREATE TRIGGER trigger_actualizar_metricas_citas
    AFTER INSERT OR UPDATE OR DELETE ON citas
    FOR EACH ROW EXECUTE FUNCTION actualizar_metricas_uso();

-- Trigger para registrar cambios importantes en historial
CREATE OR REPLACE FUNCTION registrar_cambio_subscripcion()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar cambios significativos
    IF TG_OP = 'INSERT' THEN
        INSERT INTO historial_subscripciones (
            organizacion_id, subscripcion_id, tipo_evento, 
            precio_nuevo, motivo, iniciado_por
        ) VALUES (
            NEW.organizacion_id, NEW.id, 'creacion',
            NEW.precio_actual, 'Subscripción inicial', 'sistema'
        );
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Cambio de plan
        IF OLD.plan_id != NEW.plan_id THEN
            INSERT INTO historial_subscripciones (
                organizacion_id, subscripcion_id, tipo_evento,
                precio_anterior, precio_nuevo,
                motivo, iniciado_por
            ) VALUES (
                NEW.organizacion_id, NEW.id, 'cambio_plan',
                OLD.precio_actual, NEW.precio_actual,
                'Cambio de plan', 'usuario'
            );
        END IF;
        
        -- Cancelación
        IF OLD.activa = true AND NEW.activa = false THEN
            INSERT INTO historial_subscripciones (
                organizacion_id, subscripcion_id, tipo_evento,
                motivo, iniciado_por
            ) VALUES (
                NEW.organizacion_id, NEW.id, 'cancelacion',
                NEW.motivo_cancelacion, 'usuario'
            );
        END IF;
        
        -- Reactivación
        IF OLD.activa = false AND NEW.activa = true THEN
            INSERT INTO historial_subscripciones (
                organizacion_id, subscripcion_id, tipo_evento,
                motivo, iniciado_por
            ) VALUES (
                NEW.organizacion_id, NEW.id, 'reactivacion',
                'Subscripción reactivada', 'usuario'
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_historial_subscripciones
    AFTER INSERT OR UPDATE ON subscripciones
    FOR EACH ROW EXECUTE FUNCTION registrar_cambio_subscripcion();

-- ====================================================================
-- 📋 DATOS INICIALES PARA PLANES
-- ====================================================================

INSERT INTO planes_subscripcion (
    codigo_plan, nombre_plan, descripcion, precio_mensual, precio_anual,
    limite_profesionales, limite_clientes, limite_servicios, limite_usuarios, limite_citas_mes,
    funciones_habilitadas, orden_display
) VALUES 
-- Plan Trial
('trial', 'Plan de Prueba', 'Prueba gratuita por 30 días', 0.00, NULL,
 2, 50, 5, 2, 50,
 '{"whatsapp_integration": false, "advanced_reports": false, "custom_branding": false, "api_access": false}', 1),

-- Plan Básico  
('basico', 'Plan Básico', 'Perfecto para negocios pequeños', 299.00, 2990.00,
 5, 200, 15, 3, 200,
 '{"whatsapp_integration": true, "advanced_reports": false, "custom_branding": false, "api_access": false}', 2),

-- Plan Professional
('profesional', 'Plan Professional', 'Para negocios en crecimiento', 599.00, 5990.00,
 15, 1000, 50, 8, 800,
 '{"whatsapp_integration": true, "advanced_reports": true, "custom_branding": true, "api_access": false}', 3),

-- Plan Enterprise (actualizado con límites altos)
('empresarial', 'Plan Empresarial', 'Para empresas grandes y cadenas', 1299.00, 12990.00,
 100, 50000, 500, 25, 10000,
 '{"whatsapp_integration": true, "advanced_reports": true, "custom_branding": true, "api_access": true, "priority_support": true, "multi_branch": true}', 4),

-- Plan Custom (para necesidades específicas)
('custom', 'Plan Personalizado', 'Plan a medida para organizaciones con necesidades específicas', 0.00, NULL,
 NULL, NULL, NULL, NULL, NULL,
 '{"whatsapp_integration": true, "advanced_reports": true, "custom_branding": true, "api_access": true, "priority_support": true, "dedicated_support": true, "sla_guarantee": true, "custom_features": true}', 5)
ON CONFLICT (codigo_plan) DO NOTHING;

-- ====================================================================
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================
COMMENT ON TABLE subscripciones IS 'Gestión completa de subscripciones SaaS con límites, facturación y métricas de negocio';
COMMENT ON TABLE historial_subscripciones IS 'Auditoría completa de cambios en subscripciones para análisis de churn y LTV';

COMMENT ON COLUMN planes_subscripcion.funciones_habilitadas IS 'JSONB con features específicas habilitadas por plan (whatsapp, reports, branding, api, etc.)';
COMMENT ON COLUMN subscripciones.precio_actual IS 'Precio negociado específico, puede diferir del precio base del plan';
COMMENT ON COLUMN subscripciones.valor_total_pagado IS 'Lifetime Value (LTV) acumulado del cliente';
COMMENT ON COLUMN metricas_uso_organizacion.uso_profesionales IS 'Contador actual actualizado automáticamente via triggers';

-- ====================================================================
-- 🔒 POLÍTICAS RLS PARA SUBSCRIPCIONES
-- ====================================================================

-- Habilitar RLS en ambas tablas
ALTER TABLE subscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_subscripciones ENABLE ROW LEVEL SECURITY;



-- ====================================================================
-- 🔄 NOTA: TRIGGERS YA DEFINIDOS ARRIBA (Líneas 560-578)
-- ====================================================================
-- Los triggers para actualizar métricas ya están correctamente implementados
-- arriba usando la función actualizar_metricas_uso() que incluye:
-- - Manejo de profesionales, clientes, servicios, usuarios
-- - Manejo de citas con reseteo mensual
-- - Actualización de max_citas_mes
--
-- ❌ ELIMINADOS: Triggers duplicados con función actualizar_contadores_subscripcion()
-- que NO manejaba citas y causaba doble procesamiento.

-- Trigger para registrar cambios importantes en historial
CREATE OR REPLACE FUNCTION registrar_cambio_subscripcion()
RETURNS TRIGGER AS $$
DECLARE
    plan_codigo_nuevo text;
    plan_codigo_anterior text;
BEGIN
    -- Solo registrar cambios significativos
    IF TG_OP = 'INSERT' THEN
        -- Obtener código del plan nuevo
        SELECT codigo_plan INTO plan_codigo_nuevo
        FROM planes_subscripcion WHERE id = NEW.plan_id;

        INSERT INTO historial_subscripciones (
            organizacion_id, subscripcion_id, tipo_evento,
            plan_nuevo, precio_nuevo, motivo, iniciado_por
        ) VALUES (
            NEW.organizacion_id, NEW.id, 'creacion',
            plan_codigo_nuevo::plan_tipo, NEW.precio_actual, 'Subscripción inicial', 'sistema'
        );

    ELSIF TG_OP = 'UPDATE' THEN
        -- Obtener códigos de planes
        SELECT codigo_plan INTO plan_codigo_anterior
        FROM planes_subscripcion WHERE id = OLD.plan_id;
        SELECT codigo_plan INTO plan_codigo_nuevo
        FROM planes_subscripcion WHERE id = NEW.plan_id;

        -- Cambio de plan
        IF OLD.plan_id != NEW.plan_id THEN
            INSERT INTO historial_subscripciones (
                organizacion_id, subscripcion_id, tipo_evento,
                plan_anterior, plan_nuevo, precio_anterior, precio_nuevo,
                motivo, iniciado_por
            ) VALUES (
                NEW.organizacion_id, NEW.id,
                CASE WHEN NEW.plan_id > OLD.plan_id THEN 'upgrade' ELSE 'downgrade' END,
                plan_codigo_anterior::plan_tipo, plan_codigo_nuevo::plan_tipo,
                OLD.precio_actual, NEW.precio_actual,
                'Cambio de plan', 'usuario'
            );
        END IF;

        -- Cancelación
        IF OLD.activa = true AND NEW.activa = false THEN
            INSERT INTO historial_subscripciones (
                organizacion_id, subscripcion_id, tipo_evento,
                motivo, iniciado_por
            ) VALUES (
                NEW.organizacion_id, NEW.id, 'cancelacion',
                COALESCE(NEW.motivo_cancelacion, 'Sin motivo especificado'), 'usuario'
            );
        END IF;

        -- Reactivación
        IF OLD.activa = false AND NEW.activa = true THEN
            INSERT INTO historial_subscripciones (
                organizacion_id, subscripcion_id, tipo_evento,
                motivo, iniciado_por
            ) VALUES (
                NEW.organizacion_id, NEW.id, 'reactivacion',
                'Subscripción reactivada', 'usuario'
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 🎯 NOTA: FUNCIONES AUXILIARES YA DEFINIDAS ARRIBA (Líneas 374-458)
-- ====================================================================
-- Las funciones verificar_limite_plan() y tiene_caracteristica_habilitada()
-- ya están correctamente implementadas arriba con JOIN a planes_subscripcion
-- y metricas_uso_organizacion.
--
-- ❌ ELIMINADAS: Definiciones duplicadas e incorrectas que buscaban campos
-- que no existen en la tabla subscripciones.

-- ====================================================================
-- 📝 DOCUMENTACIÓN DE POLÍTICAS RLS
-- ====================================================================
-- Comentarios de políticas que se crean en 08-rls-policies.sql
-- pero se documentan aquí porque las tablas se crean en este archivo
-- ────────────────────────────────────────────────────────────────────

-- Política de planes de subscripción (lectura)
COMMENT ON POLICY planes_subscripcion_select ON planes_subscripcion IS
'Lectura de planes activos para todos los usuarios.
Permite visualizar catálogo de planes en frontend.
Solo planes con activo=true son visibles.';

-- Política de planes de subscripción (modificación)
COMMENT ON POLICY planes_subscripcion_modify ON planes_subscripcion IS
'Solo super_admin puede crear/modificar/eliminar planes de subscripción.
Operaciones críticas: Pricing, límites, características de planes.';

-- Política de subscripciones
COMMENT ON POLICY subscripciones_unified_access ON subscripciones IS
'Acceso a subscripciones por organización:
- Usuario accede solo a subscripción de su organización
- Super admin tiene acceso global
- Validación de formato numérico en tenant_id (regex: ^[0-9]+$)

Crítico para: Facturación, límites de uso, upgrades/downgrades.';

-- Política de historial subscripciones
COMMENT ON POLICY historial_subscripciones_access ON historial_subscripciones IS
'Acceso de solo lectura al historial de subscripciones:
- Usuario ve historial de su organización
- Super admin ve todo el historial
- Usado para auditoría y reportes de facturación';

-- Política de métricas uso
COMMENT ON POLICY metricas_uso_access ON metricas_uso_organizacion IS
'Acceso a métricas de uso de organización:
- Usuario ve métricas de su organización
- Super admin ve todas las métricas
- Usado para: Dashboard, límites de plan, alertas de cuota.';