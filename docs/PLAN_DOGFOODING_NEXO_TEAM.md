# Plan: Dogfooding Interno - Super Admin con Organización

**Versión:** 3.3.0
**Fecha:** 21 Enero 2026
**Estado:** Fase 1 Completada | Fases 2-4 Pendientes | Modelo Simplificado (Cobro por Usuario)

---

## 1. Resumen Ejecutivo

### Objetivo
Permitir que el super_admin tenga su propia organización ("Nexo Team") para gestionar las operaciones internas usando los mismos módulos que los clientes, incluyendo un **módulo de suscripciones genérico** que Nexo usará para cobrar a sus clientes y que también estará disponible para que cualquier organización gestione sus propias suscripciones.

### Enfoque
- **Un solo super_admin** con acceso a plataforma Y a su organización
- **Módulos reutilizables** - Lo que usamos internamente, lo vendemos
- **Dogfooding real** - Detectamos bugs antes que los clientes

### Beneficios
| Beneficio | Descripción |
|-----------|-------------|
| **Un solo código** | Mantenemos 1 módulo de suscripciones, no 2 |
| **Dogfooding real** | Usamos exactamente lo que vendemos |
| **Bugs detectados rápido** | Si falla para Nexo, lo arreglamos antes |
| **Features probados** | Nuevas funcionalidades se prueban internamente primero |

---

## 2. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NEXO PLATFORM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  👑 SUPER ADMIN (arellanestorillo@yahoo.com)                                │
│     │                                                                        │
│     ├─── 📊 Dashboard Plataforma (/superadmin)                              │
│     │       • Métricas globales (MRR, churn, usuarios)                      │
│     │       • Gestión de todas las organizaciones                           │
│     │       • Gestión de planes y precios de plataforma                     │
│     │                                                                        │
│     └─── 🏢 Su Organización: "Nexo Team" (/home)                            │
│             │                                                                │
│             ├─ 📦 Módulo Suscripciones (NUEVO):                             │
│             │     • Planes: Trial, Pro, Custom                              │
│             │     • Suscriptores = Organizaciones clientes                  │
│             │     • Cobros via MercadoPago/Stripe                           │
│             │     • Métricas: MRR, Churn, LTV                               │
│             │                                                                │
│             ├─ 📦 CRM:                                                      │
│             │     • Clientes vinculados a organizaciones                    │
│             │     • Pipeline de ventas                                      │
│             │                                                                │
│             ├─ 📦 Tickets/Soporte:                                          │
│             │     • Tickets desde organizaciones clientes                   │
│             │                                                                │
│             └─ 📦 Otros módulos...                                          │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🏢 ORGANIZACIONES CLIENTES                                                  │
│     │                                                                        │
│     ├── 🏋️ Gym Fitness Plus (usa módulo suscripciones)                      │
│     │      • Planes: Básico, Premium, VIP                                   │
│     │      • Suscriptores = Miembros del gimnasio                           │
│     │      • Cobros via Stripe                                              │
│     │                                                                        │
│     ├── 📰 Revista Digital (usa módulo suscripciones)                       │
│     │      • Planes: Mensual, Anual, Lifetime                               │
│     │      • Suscriptores = Lectores                                        │
│     │      • Cobros via PayPal                                              │
│     │                                                                        │
│     └── 💇 Salón María (NO usa módulo suscripciones)                        │
│            • Solo usa: Agendamiento, CRM, POS                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Estado de Fases

| Fase | Descripción | Estado |
|------|-------------|--------|
| **Fase 1** | Super Admin con Organización | ✅ COMPLETADA |
| **Fase 2** | Vincular CRM con Organizaciones | ⏳ Pendiente |
| **Fase 3** | Módulo Suscripciones Genérico | ⏳ Pendiente |
| **Fase 4** | Módulos Adicionales (Tickets, Email) | ⏳ Pendiente |

---

## 4. Fase 1: Super Admin con Organización ✅ COMPLETADA

### 4.1 Cambios Realizados

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `backend/app/modules/core/routes/setup.js` | Crear org "Nexo Team" + suscripción | ✅ |
| `backend/app/middleware/auth.js` | Bypass requireRole para super_admin | ✅ |
| `frontend/src/components/superadmin/SuperAdminLayout.jsx` | Link "Mi Org" | ✅ |
| `frontend/src/app/routes/dashboard.routes.jsx` | Permitir /home a super_admin | ✅ |
| `frontend/src/pages/auth/Login.jsx` | Redirigir a /home | ✅ |

### 4.2 Verificación

```bash
# Super admin tiene organización
docker exec postgres_db psql -U admin -d postgres -c \
  "SELECT id, email, rol, organizacion_id FROM usuarios WHERE rol = 'super_admin';"

# Resultado esperado:
# id |           email            |     rol     | organizacion_id
# ---+----------------------------+-------------+-----------------
# 19 | arellanestorillo@yahoo.com | super_admin |               4
```

---

## 5. Fase 2: Vincular CRM con Organizaciones

### 5.1 Objetivo
Permitir que en el CRM de "Nexo Team", los clientes se vinculen con organizaciones reales de la plataforma para ver métricas unificadas.

### 5.2 Modelo de Datos

```sql
-- Agregar columna para vincular cliente con organización
ALTER TABLE clientes
ADD COLUMN organizacion_vinculada_id INTEGER REFERENCES organizaciones(id) ON DELETE SET NULL;

CREATE INDEX idx_clientes_org_vinculada ON clientes(organizacion_vinculada_id)
WHERE organizacion_vinculada_id IS NOT NULL;

COMMENT ON COLUMN clientes.organizacion_vinculada_id IS
'Solo para Nexo Team: vincula cliente CRM con organización de la plataforma';
```

### 5.3 UI en Detalle de Cliente

Cuando `organizacion_vinculada_id` no es NULL, mostrar card con:
- Plan actual de la organización
- Estado de suscripción (trial, activa, vencida)
- Usuarios activos
- Citas/Ventas del mes
- Fecha de registro
- Botón "Ver en Panel Admin" (link a /superadmin/organizaciones/:id)

---

## 6. Fase 3: Módulo Suscripciones Genérico

### 6.1 Visión General

Un módulo completo de gestión de suscripciones que:
- **Nexo Team usa** para cobrar a organizaciones clientes
- **Cualquier organización puede usar** para cobrar a sus propios clientes

### 6.2 Modelo de Datos

```sql
-- ============================================================================
-- ARCHIVO: sql/modulos/suscripciones/01-tablas.sql
-- ============================================================================

-- Planes definidos por cada organización
CREATE TABLE planes_suscripcion_org (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Identificación
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- Precios
    precio_mensual NUMERIC(10,2) NOT NULL DEFAULT 0,
    precio_trimestral NUMERIC(10,2),
    precio_semestral NUMERIC(10,2),
    precio_anual NUMERIC(10,2),
    moneda VARCHAR(3) DEFAULT 'MXN',

    -- Configuración
    periodo_default VARCHAR(20) DEFAULT 'mensual', -- mensual, trimestral, semestral, anual
    dias_trial INTEGER DEFAULT 0,
    permite_trial BOOLEAN DEFAULT TRUE,

    -- Límites (opcionales, depende del negocio)
    limites JSONB DEFAULT '{}',
    -- Ejemplo: {"usuarios": 5, "storage_mb": 1000, "api_calls": 10000}

    -- Features incluidos
    features JSONB DEFAULT '[]',
    -- Ejemplo: ["feature_basica", "soporte_email", "reportes"]

    -- UI
    color VARCHAR(7) DEFAULT '#6366F1',
    icono VARCHAR(50) DEFAULT 'package',
    destacado BOOLEAN DEFAULT FALSE, -- Mostrar como "Más popular"
    orden_display INTEGER DEFAULT 0,

    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    visible_publico BOOLEAN DEFAULT TRUE, -- Mostrar en página de precios

    -- Auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),

    CONSTRAINT uq_plan_codigo_org UNIQUE (organizacion_id, codigo),
    CONSTRAINT chk_precios_positivos CHECK (
        precio_mensual >= 0 AND
        (precio_trimestral IS NULL OR precio_trimestral >= 0) AND
        (precio_semestral IS NULL OR precio_semestral >= 0) AND
        (precio_anual IS NULL OR precio_anual >= 0)
    )
);

-- Suscripciones de clientes de cada organización
CREATE TABLE suscripciones_org (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES planes_suscripcion_org(id) ON DELETE RESTRICT,

    -- Suscriptor (puede ser cliente interno o externo)
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    -- Para casos donde el suscriptor no es un cliente del CRM:
    suscriptor_externo JSONB, -- {"nombre": "...", "email": "...", "telefono": "..."}

    -- Período actual
    periodo VARCHAR(20) NOT NULL DEFAULT 'mensual',
    precio_actual NUMERIC(10,2) NOT NULL,
    precio_original NUMERIC(10,2), -- Antes de descuentos

    -- Descuentos
    descuento_porcentaje NUMERIC(5,2) DEFAULT 0,
    descuento_codigo VARCHAR(50),
    descuento_expira_en DATE,

    -- Fechas importantes
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE, -- NULL = sin fecha de fin (auto-renovable)
    fecha_proximo_cobro DATE NOT NULL,
    fecha_ultimo_cobro DATE,

    -- Trial
    es_trial BOOLEAN DEFAULT FALSE,
    fecha_fin_trial DATE,
    trial_convertido BOOLEAN DEFAULT FALSE,

    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'activa',
    -- Valores: trial, activa, pausada, cancelada, vencida, suspendida

    -- Cancelación
    cancelada_en TIMESTAMPTZ,
    cancelada_por INTEGER REFERENCES usuarios(id),
    motivo_cancelacion TEXT,
    cancela_al_final_periodo BOOLEAN DEFAULT FALSE,

    -- Pasarela de pago
    gateway VARCHAR(30), -- stripe, mercadopago, paypal, manual
    customer_id_gateway VARCHAR(100),
    subscription_id_gateway VARCHAR(100),
    payment_method_id VARCHAR(100),

    -- Cobros
    auto_cobro BOOLEAN DEFAULT TRUE,
    intentos_cobro_fallidos INTEGER DEFAULT 0,
    max_intentos_cobro INTEGER DEFAULT 3,
    ultimo_error_cobro TEXT,

    -- Métricas
    meses_activo INTEGER DEFAULT 0,
    total_pagado NUMERIC(12,2) DEFAULT 0,
    cantidad_renovaciones INTEGER DEFAULT 0,

    -- Metadatos
    metadata JSONB DEFAULT '{}',
    notas_internas TEXT,

    -- Auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),

    CONSTRAINT chk_estado_valido CHECK (
        estado IN ('trial', 'activa', 'pausada', 'cancelada', 'vencida', 'suspendida')
    ),
    CONSTRAINT chk_suscriptor CHECK (
        cliente_id IS NOT NULL OR suscriptor_externo IS NOT NULL
    )
);

-- Historial de pagos
CREATE TABLE pagos_suscripcion (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    suscripcion_id INTEGER NOT NULL REFERENCES suscripciones_org(id) ON DELETE CASCADE,

    -- Monto
    monto NUMERIC(10,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'MXN',

    -- Período cubierto
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,

    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    -- Valores: pendiente, procesando, completado, fallido, reembolsado

    -- Gateway
    gateway VARCHAR(30),
    transaction_id_gateway VARCHAR(100),
    payment_intent_id VARCHAR(100),

    -- Detalles
    metodo_pago VARCHAR(50), -- card, oxxo, spei, paypal
    ultimos_4_digitos VARCHAR(4),
    marca_tarjeta VARCHAR(20),

    -- Errores
    error_codigo VARCHAR(50),
    error_mensaje TEXT,

    -- Fechas
    fecha_intento TIMESTAMPTZ DEFAULT NOW(),
    fecha_completado TIMESTAMPTZ,

    -- Facturación
    factura_id VARCHAR(100),
    factura_url TEXT,

    -- Auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_estado_pago CHECK (
        estado IN ('pendiente', 'procesando', 'completado', 'fallido', 'reembolsado')
    )
);

-- Cupones/Códigos promocionales
CREATE TABLE cupones_suscripcion (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100),
    descripcion TEXT,

    -- Tipo de descuento
    tipo_descuento VARCHAR(20) NOT NULL DEFAULT 'porcentaje',
    -- Valores: porcentaje, monto_fijo
    valor_descuento NUMERIC(10,2) NOT NULL,

    -- Restricciones
    planes_aplicables INTEGER[], -- IDs de planes, NULL = todos
    monto_minimo NUMERIC(10,2), -- Monto mínimo de compra

    -- Límites de uso
    max_usos_total INTEGER,
    max_usos_por_cliente INTEGER DEFAULT 1,
    usos_actuales INTEGER DEFAULT 0,

    -- Vigencia
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin DATE,

    -- Duración del descuento
    duracion_meses INTEGER, -- NULL = permanente mientras tenga suscripción
    solo_primer_pago BOOLEAN DEFAULT FALSE,

    -- Estado
    activo BOOLEAN DEFAULT TRUE,

    -- Auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),

    CONSTRAINT uq_cupon_codigo_org UNIQUE (organizacion_id, codigo),
    CONSTRAINT chk_tipo_descuento CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo')),
    CONSTRAINT chk_valor_descuento CHECK (
        (tipo_descuento = 'porcentaje' AND valor_descuento BETWEEN 0 AND 100) OR
        (tipo_descuento = 'monto_fijo' AND valor_descuento >= 0)
    )
);

-- Webhooks recibidos (para debugging y reconciliación)
CREATE TABLE webhooks_suscripcion (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER REFERENCES organizaciones(id) ON DELETE SET NULL,

    gateway VARCHAR(30) NOT NULL,
    evento VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,

    -- Procesamiento
    procesado BOOLEAN DEFAULT FALSE,
    procesado_en TIMESTAMPTZ,
    error TEXT,
    intentos INTEGER DEFAULT 0,

    -- Auditoría
    recibido_en TIMESTAMPTZ DEFAULT NOW(),
    ip_origen VARCHAR(45)
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX idx_planes_org ON planes_suscripcion_org(organizacion_id, activo);
CREATE INDEX idx_suscripciones_org ON suscripciones_org(organizacion_id, estado);
CREATE INDEX idx_suscripciones_cliente ON suscripciones_org(cliente_id) WHERE cliente_id IS NOT NULL;
CREATE INDEX idx_suscripciones_proximo_cobro ON suscripciones_org(fecha_proximo_cobro)
    WHERE estado = 'activa' AND auto_cobro = TRUE;
CREATE INDEX idx_suscripciones_gateway ON suscripciones_org(gateway, subscription_id_gateway)
    WHERE subscription_id_gateway IS NOT NULL;
CREATE INDEX idx_pagos_suscripcion ON pagos_suscripcion(suscripcion_id, estado);
CREATE INDEX idx_cupones_codigo ON cupones_suscripcion(organizacion_id, codigo, activo);
CREATE INDEX idx_webhooks_procesar ON webhooks_suscripcion(procesado, gateway) WHERE procesado = FALSE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE planes_suscripcion_org ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones_org ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_suscripcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupones_suscripcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks_suscripcion ENABLE ROW LEVEL SECURITY;

-- Políticas estándar por organizacion_id (mismo patrón que otras tablas)
CREATE POLICY planes_suscripcion_org_tenant ON planes_suscripcion_org
    FOR ALL TO saas_app
    USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
           OR current_setting('app.bypass_rls', true) = 'true');

CREATE POLICY suscripciones_org_tenant ON suscripciones_org
    FOR ALL TO saas_app
    USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
           OR current_setting('app.bypass_rls', true) = 'true');

CREATE POLICY pagos_suscripcion_tenant ON pagos_suscripcion
    FOR ALL TO saas_app
    USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
           OR current_setting('app.bypass_rls', true) = 'true');

CREATE POLICY cupones_suscripcion_tenant ON cupones_suscripcion
    FOR ALL TO saas_app
    USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
           OR current_setting('app.bypass_rls', true) = 'true');

CREATE POLICY webhooks_suscripcion_tenant ON webhooks_suscripcion
    FOR ALL TO saas_app
    USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
           OR current_setting('app.bypass_rls', true) = 'true'
           OR organizacion_id IS NULL);
```

### 6.3 Estructura Backend

```
backend/app/modules/suscripciones-negocio/
├── models/
│   ├── planes.model.js
│   ├── suscripciones.model.js
│   ├── pagos.model.js
│   └── cupones.model.js
├── controllers/
│   ├── planes.controller.js
│   ├── suscripciones.controller.js
│   ├── pagos.controller.js
│   ├── cupones.controller.js
│   ├── webhooks.controller.js
│   └── metricas.controller.js
├── routes/
│   ├── index.js
│   ├── planes.js
│   ├── suscripciones.js
│   ├── pagos.js
│   ├── cupones.js
│   └── webhooks.js
├── schemas/
│   └── suscripciones.schemas.js
├── services/
│   ├── cobro.service.js          # Lógica de cobros automáticos
│   ├── stripe.service.js         # Integración Stripe
│   ├── mercadopago.service.js    # Integración MercadoPago
│   └── notificaciones.service.js # Emails de cobro, recordatorios
└── jobs/
    ├── procesar-cobros.job.js    # Cron para cobros automáticos
    └── verificar-trials.job.js   # Cron para expiración de trials
```

### 6.4 Endpoints API

```
# Planes
GET    /api/v1/suscripciones-negocio/planes           # Listar planes
POST   /api/v1/suscripciones-negocio/planes           # Crear plan
GET    /api/v1/suscripciones-negocio/planes/:id       # Detalle plan
PUT    /api/v1/suscripciones-negocio/planes/:id       # Editar plan
DELETE /api/v1/suscripciones-negocio/planes/:id       # Eliminar plan
GET    /api/v1/suscripciones-negocio/planes/publicos  # Planes para página de precios

# Suscripciones
GET    /api/v1/suscripciones-negocio/suscripciones                    # Listar
POST   /api/v1/suscripciones-negocio/suscripciones                    # Crear
GET    /api/v1/suscripciones-negocio/suscripciones/:id                # Detalle
PUT    /api/v1/suscripciones-negocio/suscripciones/:id                # Editar
POST   /api/v1/suscripciones-negocio/suscripciones/:id/cancelar       # Cancelar
POST   /api/v1/suscripciones-negocio/suscripciones/:id/pausar         # Pausar
POST   /api/v1/suscripciones-negocio/suscripciones/:id/reactivar      # Reactivar
POST   /api/v1/suscripciones-negocio/suscripciones/:id/cambiar-plan   # Upgrade/Downgrade
GET    /api/v1/suscripciones-negocio/suscripciones/cliente/:clienteId # Por cliente

# Pagos
GET    /api/v1/suscripciones-negocio/pagos                            # Listar pagos
GET    /api/v1/suscripciones-negocio/pagos/:id                        # Detalle
POST   /api/v1/suscripciones-negocio/pagos/:id/reembolsar             # Reembolsar
GET    /api/v1/suscripciones-negocio/pagos/suscripcion/:suscripcionId # Por suscripción

# Cupones
GET    /api/v1/suscripciones-negocio/cupones                          # Listar
POST   /api/v1/suscripciones-negocio/cupones                          # Crear
PUT    /api/v1/suscripciones-negocio/cupones/:id                      # Editar
DELETE /api/v1/suscripciones-negocio/cupones/:id                      # Eliminar
POST   /api/v1/suscripciones-negocio/cupones/validar                  # Validar código

# Webhooks (públicos, sin auth)
POST   /api/v1/webhooks/stripe                                        # Webhook Stripe
POST   /api/v1/webhooks/mercadopago                                   # Webhook MercadoPago

# Métricas
GET    /api/v1/suscripciones-negocio/metricas/dashboard               # Dashboard
GET    /api/v1/suscripciones-negocio/metricas/mrr                     # MRR histórico
GET    /api/v1/suscripciones-negocio/metricas/churn                   # Tasa de cancelación
GET    /api/v1/suscripciones-negocio/metricas/ltv                     # Lifetime Value
```

### 6.5 Estructura Frontend

```
frontend/src/pages/suscripciones-negocio/
├── SuscripcionesPage.jsx              # Dashboard principal
├── PlanesPage.jsx                     # CRUD de planes
├── PlanFormDrawer.jsx                 # Formulario plan
├── SuscripcionesListPage.jsx          # Lista de suscripciones
├── SuscripcionDetailPage.jsx          # Detalle suscripción
├── SuscripcionFormDrawer.jsx          # Crear/editar suscripción
├── CuponesPage.jsx                    # CRUD de cupones
├── PagosPage.jsx                      # Historial de pagos
└── MetricasPage.jsx                   # Dashboard de métricas

frontend/src/components/suscripciones-negocio/
├── PlanCard.jsx                       # Card de plan para pricing
├── SuscripcionStatusBadge.jsx         # Badge de estado
├── PagoStatusBadge.jsx                # Badge de pago
├── MRRChart.jsx                       # Gráfico MRR
├── ChurnChart.jsx                     # Gráfico Churn
└── SuscriptoresChart.jsx              # Gráfico suscriptores
```

### 6.6 Integraciones de Pago

#### Stripe
```javascript
// backend/app/modules/suscripciones-negocio/services/stripe.service.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
    // Crear cliente en Stripe
    async crearCliente(cliente) {
        return stripe.customers.create({
            email: cliente.email,
            name: cliente.nombre,
            metadata: {
                organizacion_id: cliente.organizacion_id,
                cliente_id: cliente.id
            }
        });
    }

    // Crear suscripción
    async crearSuscripcion(customerId, priceId, trialDays = 0) {
        return stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            trial_period_days: trialDays,
            payment_behavior: 'default_incomplete',
            expand: ['latest_invoice.payment_intent']
        });
    }

    // Cancelar suscripción
    async cancelarSuscripcion(subscriptionId, alFinalDelPeriodo = true) {
        if (alFinalDelPeriodo) {
            return stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true
            });
        }
        return stripe.subscriptions.cancel(subscriptionId);
    }

    // Procesar webhook
    async procesarWebhook(payload, signature) {
        const event = stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
        return event;
    }
}
```

#### MercadoPago
```javascript
// backend/app/modules/suscripciones-negocio/services/mercadopago.service.js

const mercadopago = require('mercadopago');

class MercadoPagoService {
    constructor(accessToken) {
        mercadopago.configure({ access_token: accessToken });
    }

    // Crear preferencia de pago
    async crearPreferencia(suscripcion, plan) {
        const preference = {
            items: [{
                title: plan.nombre,
                unit_price: parseFloat(suscripcion.precio_actual),
                quantity: 1
            }],
            back_urls: {
                success: `${process.env.FRONTEND_URL}/suscripcion/success`,
                failure: `${process.env.FRONTEND_URL}/suscripcion/failure`,
                pending: `${process.env.FRONTEND_URL}/suscripcion/pending`
            },
            auto_return: 'approved',
            external_reference: `sub_${suscripcion.id}`,
            notification_url: `${process.env.API_URL}/api/v1/webhooks/mercadopago`
        };

        return mercadopago.preferences.create(preference);
    }

    // Crear suscripción recurrente
    async crearSuscripcionRecurrente(cliente, plan) {
        const preapproval = {
            payer_email: cliente.email,
            back_url: `${process.env.FRONTEND_URL}/suscripcion/callback`,
            reason: plan.nombre,
            auto_recurring: {
                frequency: 1,
                frequency_type: plan.periodo_default === 'anual' ? 'years' : 'months',
                transaction_amount: parseFloat(plan.precio_mensual),
                currency_id: plan.moneda
            },
            external_reference: `cliente_${cliente.id}`
        };

        return mercadopago.preapproval.create(preapproval);
    }
}
```

### 6.7 Dashboard de Métricas

```javascript
// Métricas clave a mostrar

const metricas = {
    // MRR (Monthly Recurring Revenue)
    mrr: {
        actual: 125000,
        cambio_mes: '+8.5%',
        grafico: [/* datos últimos 12 meses */]
    },

    // ARR (Annual Recurring Revenue)
    arr: {
        actual: 1500000,
        proyeccion: 1800000
    },

    // Churn Rate
    churn: {
        mensual: 2.3,  // %
        anual: 24.5,   // %
        tendencia: 'bajando'
    },

    // LTV (Lifetime Value)
    ltv: {
        promedio: 8500,
        por_plan: {
            basico: 3200,
            pro: 12000,
            enterprise: 45000
        }
    },

    // Suscriptores
    suscriptores: {
        total: 847,
        activos: 812,
        trial: 35,
        nuevos_mes: 67,
        cancelados_mes: 12
    },

    // Cobros
    cobros: {
        exitosos_mes: 798,
        fallidos_mes: 14,
        tasa_exito: 98.3,
        pendientes: 5
    }
};
```

### 6.8 Cron Jobs

```javascript
// backend/app/modules/suscripciones-negocio/jobs/procesar-cobros.job.js

/**
 * Ejecutar diariamente a las 6:00 AM
 * Procesa todos los cobros programados para hoy
 */
async function procesarCobrosDelDia() {
    const hoy = new Date().toISOString().split('T')[0];

    // Obtener suscripciones con cobro hoy
    const suscripciones = await SuscripcionesModel.obtenerParaCobro(hoy);

    for (const sub of suscripciones) {
        try {
            // Intentar cobro según gateway
            const resultado = await CobroService.procesarCobro(sub);

            if (resultado.exitoso) {
                // Actualizar fecha próximo cobro
                await SuscripcionesModel.actualizarProximoCobro(sub.id);
                // Registrar pago
                await PagosModel.registrar(sub.id, resultado);
                // Enviar email de confirmación
                await NotificacionesService.enviarConfirmacionPago(sub);
            } else {
                // Incrementar intentos fallidos
                await SuscripcionesModel.registrarFalloCobro(sub.id, resultado.error);
                // Enviar email de fallo
                await NotificacionesService.enviarFalloPago(sub);
            }
        } catch (error) {
            logger.error('Error procesando cobro', { suscripcionId: sub.id, error });
        }
    }
}
```

### 6.9 Cómo Nexo Team lo Usará

```
Configuración de Nexo Team:
├── Módulo: suscripciones-negocio (activado)
├── Gateway: MercadoPago (cuenta de Nexo)
│
├── Planes configurados:
│   ├── trial:    $0/mes, 14 días, features: [core, agendamiento]
│   ├── pro:      $499/mes, features: [todos]
│   └── custom:   Variable, negociado
│
├── Suscriptores:
│   └── Cada organización cliente = 1 cliente en CRM de Nexo Team
│       └── Con organizacion_vinculada_id apuntando a la org real
│
└── Flujo:
    1. Cliente se registra en Nexo (crea organización)
    2. Se crea automáticamente como cliente en CRM de Nexo Team
    3. Se crea suscripción en estado "trial"
    4. Al terminar trial, se cobra automáticamente via MercadoPago
    5. Métricas se ven en dashboard de suscripciones de Nexo Team
```

---

## 7. Fase 4: Módulos Adicionales

| Módulo | Descripción | Prioridad |
|--------|-------------|-----------|
| **Tickets/Soporte** | Sistema de tickets desde organizaciones | Media |
| **Email Marketing** | Campañas de email a suscriptores | Baja |
| **Proyectos** | Roadmap y tareas internas | Baja |

Estos módulos seguirán el mismo patrón: **Nexo los usa primero, luego se ofrecen a clientes**.

---

## 8. Eliminación del Sistema Actual de Suscripciones

### 8.1 Sistema a Eliminar

El proyecto se levantará desde cero, por lo que **no hay migración de datos**. Se elimina directamente el sistema actual:

| Tipo | Archivo a ELIMINAR |
|------|-------------------|
| **SQL** | `sql/nucleo/02-tablas-subscripciones.sql` |
| **Model** | `backend/app/modules/core/models/subscripcion.model.js` |
| **Controller** | `backend/app/modules/core/controllers/subscripciones.controller.js` |
| **Routes** | `backend/app/modules/core/routes/subscripciones.js` |
| **Schema** | `backend/app/modules/core/schemas/subscripciones.schemas.js` |
| **Frontend** | `frontend/src/services/api/modules/subscripciones.api.js` |

### 8.2 Tablas a Eliminar

```sql
-- Tablas del sistema antiguo (ya no se crearán)
DROP TABLE IF EXISTS historial_subscripciones;
DROP TABLE IF EXISTS subscripciones;
DROP TABLE IF EXISTS metricas_uso_organizacion;  -- ❌ ELIMINAR COMPLETAMENTE
DROP TABLE IF EXISTS planes_subscripcion;
```

### 8.3 Modelo de Negocio Final: Cobro por Usuario, Sin Límites

```
┌─────────────────────────────────────────────────────────────┐
│                    MODELO NEXO FINAL                        │
├─────────────────────────────────────────────────────────────┤
│  PLAN     │  PRECIO/USUARIO       │  LÍMITES               │
├───────────┼───────────────────────┼────────────────────────┤
│  Trial    │  $0 (14 días)         │  SIN LÍMITES           │
│  Pro      │  $249/usuario/mes     │  SIN LÍMITES           │
│  Custom   │  $X/usuario/mes       │  SIN LÍMITES           │
│           │  (descuento volumen)  │                        │
└─────────────────────────────────────────────────────────────┘
```

**Custom = Pro con descuento por volumen.** Ejemplo:
- 1-10 usuarios → $249/usuario (Pro estándar)
- 11-50 usuarios → $200/usuario (Custom negociado)
- 50+ usuarios → $150/usuario (Custom negociado)

**Todo es ilimitado en TODOS los planes:**
- ✅ Usuarios ilimitados
- ✅ Sucursales ilimitadas
- ✅ Profesionales ilimitados
- ✅ Clientes ilimitados
- ✅ Servicios ilimitados
- ✅ Productos ilimitados
- ✅ Citas ilimitadas
- ✅ Todas las apps incluidas

**La única restricción:** Después de 14 días de Trial → pagar o bloquearse.

### 8.4 Ejemplo de Facturación

| Organización | Plan | Precio/Usuario | Usuarios | Factura Mensual |
|--------------|------|----------------|----------|-----------------|
| Salón María | Pro | $249 | 3 | $747 |
| Gym Fitness | Pro | $249 | 8 | $1,992 |
| Cadena Grande | Custom | $180 | 50 | $9,000 |
| Corporativo | Custom | $150 | 200 | $30,000 |
| Startup Nueva | Trial | $0 | 15 | $0 (14 días) |

### 8.5 Tabla `metricas_uso_organizacion` → ELIMINAR COMPLETAMENTE

**No se necesita ningún contador de límites.** El único dato relevante es:

```sql
-- Para facturar: contar usuarios activos
SELECT COUNT(*) FROM usuarios WHERE organizacion_id = $1 AND activo = true;
```

Este conteo se hace en tiempo real para facturación, no para limitar.

### 8.6 Middleware `subscription.js` → SIMPLIFICAR DRÁSTICAMENTE

```javascript
// ANTES: Verificaba 10+ tipos de límites
static checkResourceLimit(tipoRecurso) { ... }  // ❌ ELIMINAR

// DESPUÉS: Solo verificar si Trial expiró
static checkActiveSubscription(req, res, next) {
    // super_admin bypass
    if (req.user?.rol === 'super_admin') return next();

    // Verificar estado de suscripción
    if (req.subscription?.estado === 'trial') {
        const hoy = new Date();
        const fechaFin = new Date(req.subscription.fecha_fin_trial);
        if (hoy > fechaFin) {
            return ResponseHelper.error(res, 'Trial expirado. Actualiza a Pro.', 403);
        }
    }

    // Verificar estados bloqueantes
    if (['suspendida', 'cancelada', 'morosa'].includes(req.subscription?.estado)) {
        return ResponseHelper.error(res, 'Suscripción inactiva', 403);
    }

    next();
}
```

**Métodos a ELIMINAR del middleware:**
- `checkResourceLimit()` → No hay límites
- `checkResourceWarning()` → No hay límites
- `checkAppAccess()` → Todas las apps incluidas en todos los planes

### 8.7 Columnas a Eliminar de Tablas

```sql
-- En planes_subscripcion (o nuevo módulo): ELIMINAR todas las columnas de límites
limite_profesionales    -- ❌ ELIMINAR
limite_clientes         -- ❌ ELIMINAR
limite_servicios        -- ❌ ELIMINAR
limite_citas_mes        -- ❌ ELIMINAR
limite_sucursales       -- ❌ ELIMINAR
limite_usuarios         -- ❌ ELIMINAR
limite_productos        -- ❌ ELIMINAR
limite_proveedores      -- ❌ ELIMINAR
limite_eventos_activos  -- ❌ ELIMINAR
-- etc.
```

**El plan solo necesita:**
```sql
CREATE TABLE planes_suscripcion_org (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER REFERENCES organizaciones(id),
    codigo VARCHAR(50) NOT NULL,        -- 'trial', 'pro', 'custom'
    nombre VARCHAR(100) NOT NULL,
    precio_por_usuario NUMERIC(10,2),   -- $249 para Pro, NULL para Trial
    dias_trial INTEGER DEFAULT 14,      -- Solo aplica a Trial
    moneda VARCHAR(3) DEFAULT 'MXN',
    activo BOOLEAN DEFAULT TRUE,
    -- SIN columnas de límites
);
```

### 8.8 Nuevo Sistema Unificado

El módulo genérico `suscripciones-negocio` será el **único sistema de suscripciones**:

```
┌─────────────────────────────────────────────────────────────┐
│ MÓDULO: suscripciones-negocio (ÚNICO)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tablas:                                                    │
│  • planes_suscripcion_org                                   │
│  • suscripciones_org                                        │
│  • pagos_suscripcion                                        │
│  • cupones_suscripcion                                      │
│  • webhooks_suscripcion                                     │
│                                                             │
│  Usuarios:                                                  │
│  • Nexo Team → Cobra a organizaciones clientes              │
│  • Gimnasio  → Cobra membresías a sus miembros              │
│  • Revista   → Cobra suscripciones a lectores               │
│                                                             │
│  ✅ Un solo código para todos                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Plan de Ejecución

### Semana 1: SQL y Backend Base
- [ ] Crear archivo SQL con tablas
- [ ] Ejecutar migraciones
- [ ] Crear modelos básicos
- [ ] Crear endpoints CRUD planes y suscripciones

### Semana 2: Integraciones de Pago
- [ ] Implementar StripeService
- [ ] Implementar MercadoPagoService
- [ ] Crear endpoints de webhooks
- [ ] Probar flujo de cobro manual

### Semana 3: Automatización
- [ ] Implementar cron de cobros automáticos
- [ ] Implementar cron de trials
- [ ] Crear servicio de notificaciones
- [ ] Probar flujo completo

### Semana 4: Frontend
- [ ] Dashboard de suscripciones
- [ ] CRUD de planes
- [ ] Lista de suscripciones
- [ ] Detalle de suscripción
- [ ] Dashboard de métricas

### Semana 5: Integración Nexo Team
- [ ] Configurar planes de Nexo
- [ ] Conectar con onboarding de organizaciones
- [ ] Probar cobros reales (sandbox)
- [ ] Vincular con CRM (Fase 2)

---

## 9. Verificación Final

```bash
# 1. Módulo activado para Nexo Team
docker exec postgres_db psql -U admin -d postgres -c \
  "SELECT modulos_activos FROM subscripciones WHERE organizacion_id = 4;"

# 2. Planes de Nexo Team creados
docker exec postgres_db psql -U admin -d postgres -c \
  "SELECT codigo, nombre, precio_mensual FROM planes_suscripcion_org WHERE organizacion_id = 4;"

# 3. Métricas funcionando
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/suscripciones-negocio/metricas/dashboard"
```

---

**Documento actualizado:** 21 Enero 2026
**Versión:** 3.3.0 (Modelo Simplificado: Cobro por Usuario, Sin Límites, Custom = Descuento Volumen)
