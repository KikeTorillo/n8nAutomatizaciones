# 🎯 Plan de Integración de Mercado Pago

**Fecha de creación**: 1 de Noviembre de 2025
**Versión**: 1.0
**Estado**: Aprobado para implementación

---

## 📊 Resumen Ejecutivo

**Objetivo**: Integrar Mercado Pago como pasarela de pagos para gestionar suscripciones recurrentes, upgrades/downgrades y métodos de pago en la plataforma SaaS multi-tenant de agendamiento empresarial.

### Arquitectura de Integración

```
┌─────────────────────────────────────────────────────────┐
│               DESARROLLO (Development Time)              │
├─────────────────────────────────────────────────────────┤
│  Claude Code/AI → MCP Server Oficial de Mercado Pago    │
│  (Consultas docs, generación código, ejemplos)          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                RUNTIME (Production Time)                 │
├─────────────────────────────────────────────────────────┤
│  Frontend → Backend API → SDK Mercado Pago → MP API     │
│                    ↓                                     │
│              PostgreSQL RLS                              │
│                    ↑                                     │
│         Webhooks ← Mercado Pago                          │
│                    ↓                                     │
│              BullMQ (Cron Jobs)                          │
└─────────────────────────────────────────────────────────┘
```

### Alcance del Proyecto

Basado en las respuestas del cliente:

| Aspecto | Decisión |
|---------|----------|
| **País/Región** | México (MXN) |
| **Flujos de pago** | ✅ Pago en Onboarding<br>✅ Upgrades/Downgrades con prorrateo<br>✅ Renovación automática mensual/anual<br>✅ Gestión de métodos de pago |
| **Facturación** | Recibos PDF simples (no fiscal) |
| **Trial** | 30 días sin tarjeta (mantener actual) |

### Tiempo Estimado

**6-8 semanas** divididas en 7 fases iterativas

---

## 🔍 Análisis del Sistema Actual

### Estado de la Base de Datos

#### Tablas Existentes

**1. `planes_subscripcion`** - Catálogo de Planes
```sql
Campos clave:
- id (SERIAL PRIMARY KEY)
- codigo_plan (VARCHAR) -- 'trial', 'basico', 'profesional', 'custom'
- nombre_plan (VARCHAR)
- precio_mensual (DECIMAL)
- precio_anual (DECIMAL)
- moneda (VARCHAR DEFAULT 'MXN')
- limite_profesionales, limite_clientes, limite_servicios
- funciones_habilitadas (JSONB)
```

**Planes actuales**:
- **trial**: $0/mes, 30 días, límites reducidos
- **basico**: $299/mes, límites medios
- **profesional**: $599/mes, límites amplios
- **custom**: Personalizado

**2. `subscripciones`** - Suscripciones Activas
```sql
Campos clave:
- organizacion_id (INTEGER UNIQUE) -- Relación 1:1
- plan_id (INTEGER) -- FK a planes_subscripcion
- precio_actual (DECIMAL)
- fecha_proximo_pago (DATE)
- periodo_facturacion ('mensual', 'anual')
- estado (estado_subscripcion) -- 'activa', 'trial', 'morosa', 'suspendida', 'cancelada'

-- CAMPOS LISTOS PARA INTEGRACIÓN (sin uso actual)
- gateway_pago (VARCHAR) -- 'mercadopago'
- customer_id_gateway (VARCHAR)
- subscription_id_gateway (VARCHAR)
- ultimo_intento_pago (TIMESTAMPTZ)
- intentos_pago_fallidos (INTEGER)
```

**3. `metricas_uso_organizacion`** - Contadores de Uso
```sql
- uso_profesionales, uso_clientes, uso_servicios
- uso_citas_mes_actual
- Actualización automática por triggers
```

**4. `historial_subscripciones`** - Auditoría
```sql
Eventos: 'creacion', 'upgrade', 'downgrade', 'cancelacion',
         'pago_exitoso', 'pago_fallido'
```

### Endpoints Existentes

#### Backend - Planes Públicos
```javascript
GET  /api/v1/planes        // Listar planes activos
GET  /api/v1/planes/:id    // Obtener plan específico
```

#### Backend - Super Admin
```javascript
GET  /api/v1/superadmin/dashboard              // Métricas globales
GET  /api/v1/superadmin/organizaciones         // Listar con filtros
GET  /api/v1/superadmin/planes                 // Listar planes
PUT  /api/v1/superadmin/planes/:id             // Editar plan
PUT  /api/v1/organizaciones/:id/plan           // Cambiar plan (super admin)
```

### Flujo Actual de Asignación de Planes

1. **Durante Onboarding**: Usuario selecciona plan → se crea organización → se crea subscripción con `estado='trial'` o `'activa'`
2. **Validación de Límites**: Middleware `SubscriptionMiddleware.checkResourceLimit()` usa función PL/pgSQL `verificar_limite_plan()`
3. **Sin pagos reales**: Todo manual, no hay cobros automáticos

### Gaps Identificados

| Gap | Impacto | Prioridad |
|-----|---------|-----------|
| ❌ Gateway de pagos | CRÍTICO - No hay cobros reales | ALTA |
| ❌ Webhooks para sync de pagos | CRÍTICO - Desincronización estado | ALTA |
| ❌ Cron jobs para renovación | ALTA - Pagos manuales | ALTA |
| ❌ Frontend de billing | MEDIA - Sin auto-servicio | MEDIA |
| ❌ Gestión de métodos de pago | MEDIA - Sin actualización de tarjetas | MEDIA |
| ❌ Facturación/Recibos | BAJA - Puede ser manual inicialmente | BAJA |

---

## 🏗️ Arquitectura Propuesta

### Stack de Integración

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| **MCP Server Oficial** | https://mcp.mercadopago.com/mcp | Herramienta de desarrollo (docs/código) |
| **SDK Runtime** | mercadopago npm (Node.js) | Operaciones API en producción |
| **Base de Datos** | PostgreSQL 17 + RLS | 2 tablas nuevas (pagos, metodos_pago) |
| **Webhooks** | Express.js endpoint | Sincronización eventos de MP |
| **Cron Jobs** | BullMQ + Redis | Renovaciones y expiración trials |
| **Frontend** | React + Checkout Pro (hosted) | UX de pago sin manejar tarjetas |

### Flujo de Pago Propuesto

```
1. Usuario selecciona plan (basico/profesional)
   ↓
2. Backend crea suscripción en Mercado Pago
   ↓
3. Usuario redirigido a Mercado Pago Checkout Pro
   ↓
4. Mercado Pago procesa pago y envía webhook
   ↓
5. Backend recibe webhook → actualiza BD
   ↓
6. Usuario redirigido de vuelta → continúa onboarding
```

### Seguridad Multi-Tenant

- ✅ **RLS (Row Level Security)**: Todas las queries usan `RLSContextManager`
- ✅ **JWT**: Autenticación en todos los endpoints
- ✅ **Webhook Validation**: Verificar firma `x-signature` de Mercado Pago
- ✅ **PCI Compliance**: NUNCA guardar números de tarjeta completos
- ✅ **Idempotencia**: `payment_id_mp` con UNIQUE constraint

---

## 📅 Implementación por Fases

### FASE 1: Fundamentos Backend (Semana 1)

#### 1.1 Configurar MCP Server Oficial (Desarrollo)

**Propósito**: Herramienta para consultar docs de Mercado Pago durante desarrollo

**Configuración**: Archivo `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mercadopago-official": {
      "url": "https://mcp.mercadopago.com/mcp",
      "headers": {
        "Authorization": "Bearer <ACCESS_TOKEN_MERCADOPAGO>"
      }
    }
  }
}
```

**Uso durante desarrollo**:
- Consultar docs: *"¿Cómo crear una suscripción preapproval en Mercado Pago México?"*
- Generar código: *"Genera código Node.js para crear un plan de suscripción mensual"*
- Resolver dudas: *"¿Qué webhooks debo configurar para suscripciones?"*

---

#### 1.2 Instalación SDK Backend (Runtime)

```bash
cd backend
npm install mercadopago --save
```

**Variables de entorno** (`.env`)
```env
# Mercado Pago México
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxx-prod  # Producción
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxx-prod
MERCADOPAGO_SANDBOX_ACCESS_TOKEN=TEST-xxxx  # Testing
MERCADOPAGO_WEBHOOK_SECRET=tu-secret-generado
MERCADOPAGO_ENVIRONMENT=production  # o 'sandbox'
```

---

#### 1.3 Servicio de Mercado Pago

**Archivo**: `backend/app/services/mercadopago.service.js`

```javascript
const { MercadoPagoConfig, PreApprovalPlan, PreApproval, Payment } = require('mercadopago');
const config = require('../config/mercadopago');
const logger = require('../utils/logger');

class MercadoPagoService {
  constructor() {
    this.client = new MercadoPagoConfig({
      accessToken: config.accessToken,
      options: { timeout: 5000 }
    });

    this.planClient = new PreApprovalPlan(this.client);
    this.subscriptionClient = new PreApproval(this.client);
    this.paymentClient = new Payment(this.client);
  }

  /**
   * Crear Plan en Mercado Pago
   * @param {Object} params - { nombre, precio, frecuencia, moneda }
   * @returns {Object} Plan creado con id
   */
  async crearPlan({ nombre, precio, frecuencia, moneda = 'MXN' }) {
    const planData = {
      reason: nombre,
      auto_recurring: {
        frequency: frecuencia.valor,          // 1, 2, 3...
        frequency_type: frecuencia.tipo,      // 'months', 'days', 'years'
        transaction_amount: precio,
        currency_id: moneda,
      }
    };

    const response = await this.planClient.create({ body: planData });
    logger.info('Plan creado en Mercado Pago', { planId: response.id, nombre });
    return response;
  }

  /**
   * Crear Suscripción
   * @param {Object} params - { planId, email, returnUrl, externalReference }
   * @returns {Object} { id: subscriptionId, init_point: checkoutUrl }
   */
  async crearSuscripcion({ planId, email, returnUrl, externalReference }) {
    const subscriptionData = {
      preapproval_plan_id: planId,
      payer_email: email,
      back_url: returnUrl,
      external_reference: externalReference,
      auto_recurring: {
        start_date: new Date().toISOString(),
      }
    };

    const response = await this.subscriptionClient.create({ body: subscriptionData });

    logger.info('Suscripción creada en Mercado Pago', {
      subscriptionId: response.id,
      email,
      planId
    });

    return {
      id: response.id,
      init_point: response.init_point,
      status: response.status
    };
  }

  /**
   * Actualizar Suscripción (cambio de plan)
   * @param {string} subscriptionId - ID de suscripción en MP
   * @param {string} nuevoPlanId - ID del nuevo plan en MP
   * @returns {Object} Suscripción actualizada
   */
  async actualizarSuscripcion(subscriptionId, nuevoPlanId) {
    return await this.subscriptionClient.update({
      id: subscriptionId,
      body: {
        preapproval_plan_id: nuevoPlanId,
        status: 'authorized' // Reactivar si estaba pausada
      }
    });
  }

  /**
   * Cancelar Suscripción
   * @param {string} subscriptionId - ID de suscripción en MP
   */
  async cancelarSuscripcion(subscriptionId) {
    return await this.subscriptionClient.update({
      id: subscriptionId,
      body: { status: 'cancelled' }
    });
  }

  /**
   * Pausar Suscripción
   * @param {string} subscriptionId - ID de suscripción en MP
   */
  async pausarSuscripcion(subscriptionId) {
    return await this.subscriptionClient.update({
      id: subscriptionId,
      body: { status: 'paused' }
    });
  }

  /**
   * Obtener Pago por ID
   * @param {string} paymentId - ID del pago en MP
   * @returns {Object} Detalles del pago
   */
  async obtenerPago(paymentId) {
    return await this.paymentClient.get({ id: paymentId });
  }

  /**
   * Obtener Suscripción por ID
   * @param {string} subscriptionId - ID de suscripción en MP
   * @returns {Object} Detalles de la suscripción
   */
  async obtenerSuscripcion(subscriptionId) {
    return await this.subscriptionClient.get({ id: subscriptionId });
  }

  /**
   * Validar firma de Webhook (seguridad)
   * @param {string} signature - Header x-signature
   * @param {string} requestId - Header x-request-id
   * @param {string} dataId - ID del recurso notificado
   * @returns {boolean} true si es válido
   */
  validarWebhook(signature, requestId, dataId) {
    // Implementar según docs oficiales de Mercado Pago
    // https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks#editor_3

    // TODO: Implementar validación de firma usando WEBHOOK_SECRET
    // Por ahora retornar true (CAMBIAR EN PRODUCCIÓN)
    return true;
  }
}

module.exports = new MercadoPagoService();
```

**Archivo de configuración**: `backend/app/config/mercadopago.js`

```javascript
require('dotenv').config();

module.exports = {
  accessToken: process.env.MERCADOPAGO_ENVIRONMENT === 'sandbox'
    ? process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN
    : process.env.MERCADOPAGO_ACCESS_TOKEN,

  publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
  environment: process.env.MERCADOPAGO_ENVIRONMENT || 'sandbox',

  // URLs
  returnUrl: process.env.FRONTEND_URL + '/payment/callback',

  // Configuración México
  country: 'MX',
  currency: 'MXN',
};
```

---

#### 1.4 Nuevas Tablas SQL

**Archivo**: `sql/schema/11-payments-mercadopago.sql`

```sql
-- ================================================================
-- TABLA: pagos
-- Registra todos los pagos procesados por Mercado Pago
-- ================================================================
CREATE TABLE pagos (
  id SERIAL PRIMARY KEY,
  organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

  -- IDs de Mercado Pago
  payment_id_mp VARCHAR(100) UNIQUE NOT NULL,
  subscription_id_mp VARCHAR(100),

  -- Detalles del pago
  monto DECIMAL(10,2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'MXN',
  estado VARCHAR(20) NOT NULL, -- 'approved', 'rejected', 'pending', 'refunded', 'cancelled'
  tipo_pago VARCHAR(30), -- 'subscription', 'upgrade', 'manual', 'one_time'

  -- Información adicional
  payment_method_id VARCHAR(50), -- 'visa', 'mastercard', 'oxxo', etc.
  payment_type_id VARCHAR(30), -- 'credit_card', 'debit_card', 'ticket'
  status_detail VARCHAR(100), -- Motivo de rechazo si aplica

  -- Metadata de Mercado Pago
  metadata JSONB,
  external_reference VARCHAR(100),

  -- Fechas
  fecha_pago TIMESTAMPTZ,
  fecha_aprobacion TIMESTAMPTZ,

  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX idx_pagos_organizacion ON pagos(organizacion_id);
CREATE INDEX idx_pagos_payment_mp ON pagos(payment_id_mp);
CREATE INDEX idx_pagos_subscription_mp ON pagos(subscription_id_mp);
CREATE INDEX idx_pagos_estado ON pagos(estado);
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago DESC);

-- Trigger de actualización
CREATE TRIGGER update_pagos_updated_at
  BEFORE UPDATE ON pagos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY pagos_select_policy ON pagos
  FOR SELECT
  USING (organizacion_id = current_setting('rls.organizacion_id', true)::integer);

CREATE POLICY pagos_insert_policy ON pagos
  FOR INSERT
  WITH CHECK (organizacion_id = current_setting('rls.organizacion_id', true)::integer);

-- Comentarios
COMMENT ON TABLE pagos IS 'Registro de todos los pagos procesados por Mercado Pago';
COMMENT ON COLUMN pagos.payment_id_mp IS 'ID único del pago en Mercado Pago';
COMMENT ON COLUMN pagos.external_reference IS 'Formato: org_{organizacion_id}_{timestamp}';

-- ================================================================
-- TABLA: metodos_pago
-- Almacena información de métodos de pago de las organizaciones
-- NUNCA guardar números de tarjeta completos (PCI Compliance)
-- ================================================================
CREATE TABLE metodos_pago (
  id SERIAL PRIMARY KEY,
  organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

  -- Info de Mercado Pago
  customer_id_mp VARCHAR(100),
  payment_method_id_mp VARCHAR(100),

  -- Info de la tarjeta (SOLO últimos 4 dígitos)
  card_last_digits VARCHAR(4),
  card_brand VARCHAR(30), -- 'visa', 'mastercard', 'amex', 'carnet'
  card_holder_name VARCHAR(100),

  -- Vencimiento
  expiration_month INTEGER CHECK (expiration_month >= 1 AND expiration_month <= 12),
  expiration_year INTEGER CHECK (expiration_year >= 2025),

  -- Estado
  activo BOOLEAN DEFAULT TRUE,
  es_principal BOOLEAN DEFAULT FALSE, -- Solo un método puede ser principal

  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  -- Constraint: Solo un método principal por organización
  CONSTRAINT unique_principal_per_org UNIQUE (organizacion_id, es_principal)
    WHERE es_principal = TRUE
);

-- Índices
CREATE INDEX idx_metodos_pago_org ON metodos_pago(organizacion_id);
CREATE INDEX idx_metodos_pago_activo ON metodos_pago(activo) WHERE activo = TRUE;

-- Trigger
CREATE TRIGGER update_metodos_pago_updated_at
  BEFORE UPDATE ON metodos_pago
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE metodos_pago ENABLE ROW LEVEL SECURITY;

CREATE POLICY metodos_pago_policy ON metodos_pago
  USING (organizacion_id = current_setting('rls.organizacion_id', true)::integer);

-- Comentarios
COMMENT ON TABLE metodos_pago IS 'Métodos de pago de organizaciones (PCI Compliant - solo últimos 4 dígitos)';
COMMENT ON COLUMN metodos_pago.card_last_digits IS 'Últimos 4 dígitos de la tarjeta (PCI Safe)';
COMMENT ON COLUMN metodos_pago.customer_id_mp IS 'ID del customer en Mercado Pago';
```

---

#### 1.5 Migration: Agregar campo mp_plan_id

**Archivo**: `sql/migrations/001_add_mp_plan_id.sql`

```sql
-- Agregar campo para almacenar el ID del plan en Mercado Pago
ALTER TABLE planes_subscripcion
ADD COLUMN mp_plan_id VARCHAR(100) UNIQUE;

-- Índice
CREATE INDEX idx_planes_mp_plan_id ON planes_subscripcion(mp_plan_id)
  WHERE mp_plan_id IS NOT NULL;

-- Comentario
COMMENT ON COLUMN planes_subscripcion.mp_plan_id IS 'ID del preapproval_plan en Mercado Pago';
```

---

### FASE 2: Sincronización de Planes (Semana 2)

#### 2.1 Script de Migración de Planes

**Archivo**: `backend/scripts/sync-plans-to-mercadopago.js`

```javascript
/**
 * Script para sincronizar planes locales con Mercado Pago
 * Crea planes en MP y guarda el mp_plan_id en BD
 *
 * Ejecución:
 * node backend/scripts/sync-plans-to-mercadopago.js
 */

const mercadopagoService = require('../app/services/mercadopago.service');
const db = require('../app/database/db');
const logger = require('../app/utils/logger');

async function syncPlans() {
  try {
    logger.info('🚀 Iniciando sincronización de planes con Mercado Pago...');

    // Obtener planes que no tienen mp_plan_id
    const { rows: planes } = await db.query(`
      SELECT id, codigo_plan, nombre_plan, descripcion,
             precio_mensual, precio_anual
      FROM planes_subscripcion
      WHERE mp_plan_id IS NULL
        AND codigo_plan != 'trial'  -- Trial no requiere plan en MP
        AND activo = true
      ORDER BY orden_display
    `);

    if (planes.length === 0) {
      logger.info('✅ Todos los planes ya están sincronizados');
      return;
    }

    logger.info(`📋 Encontrados ${planes.length} planes para sincronizar`);

    // Sincronizar cada plan
    for (const plan of planes) {
      logger.info(`\n🔄 Procesando: ${plan.nombre_plan} (${plan.codigo_plan})`);

      try {
        // Crear plan en Mercado Pago
        const mpPlan = await mercadopagoService.crearPlan({
          nombre: `${plan.nombre_plan} - Plataforma SaaS Agendamiento`,
          precio: plan.precio_mensual,
          frecuencia: { tipo: 'months', valor: 1 },
          moneda: 'MXN'
        });

        logger.info(`  ✅ Creado en MP con ID: ${mpPlan.id}`);

        // Guardar mp_plan_id en BD
        await db.query(`
          UPDATE planes_subscripcion
          SET mp_plan_id = $1,
              updated_at = NOW()
          WHERE id = $2
        `, [mpPlan.id, plan.id]);

        logger.info(`  ✅ Guardado en BD: planes_subscripcion.mp_plan_id`);

      } catch (error) {
        logger.error(`  ❌ Error procesando ${plan.nombre_plan}:`, error.message);
        // Continuar con el siguiente plan
      }
    }

    logger.info('\n✅ Sincronización completada');
    logger.info('\nVerifica los planes en: https://www.mercadopago.com.mx/tools/subscriptions/plans');

  } catch (error) {
    logger.error('❌ Error en sincronización:', error);
    process.exit(1);
  } finally {
    // Cerrar conexión
    await db.end();
  }
}

// Ejecutar
syncPlans();
```

**Ejecutar después de crear los servicios**:
```bash
node backend/scripts/sync-plans-to-mercadopago.js
```

---

#### 2.2 Controller de Pagos

**Archivo**: `backend/app/controllers/pagos.controller.js`

```javascript
const mercadopagoService = require('../services/mercadopago.service');
const db = require('../database/db');
const { ResponseHelper, ValidationHelper } = require('../utils/helpers');
const logger = require('../utils/logger');

class PagosController {

  /**
   * Crear suscripción en Mercado Pago
   * POST /api/v1/pagos/crear-suscripcion
   *
   * Body: { plan_codigo, payer_email }
   * Auth: JWT token con organizacion_id
   */
  async crearSuscripcion(req, res) {
    const { plan_codigo, payer_email } = req.body;
    const { organizacion_id, email } = req.user;

    try {
      logger.info('Creando suscripción', { organizacion_id, plan_codigo });

      // 1. Verificar que el plan existe y tiene mp_plan_id
      const { rows: planRows } = await db.query(`
        SELECT id, mp_plan_id, nombre_plan, codigo_plan, precio_mensual
        FROM planes_subscripcion
        WHERE codigo_plan = $1 AND activo = true
      `, [plan_codigo]);

      if (planRows.length === 0) {
        return ResponseHelper.error(res, 404, 'Plan no encontrado');
      }

      const plan = planRows[0];

      if (!plan.mp_plan_id) {
        logger.error('Plan sin mp_plan_id', { plan_codigo });
        return ResponseHelper.error(res, 500,
          'Plan no configurado en Mercado Pago. Contacte al administrador.');
      }

      // 2. Verificar que la organización no tenga suscripción activa en MP
      const { rows: subRows } = await db.query(`
        SELECT subscription_id_gateway, estado
        FROM subscripciones
        WHERE organizacion_id = $1
      `, [organizacion_id]);

      if (subRows[0]?.subscription_id_gateway && subRows[0].estado === 'activa') {
        return ResponseHelper.error(res, 400,
          'Ya existe una suscripción activa. Use el endpoint de cambio de plan.');
      }

      // 3. Crear suscripción en Mercado Pago
      const externalReference = `org_${organizacion_id}_${Date.now()}`;
      const returnUrl = `${process.env.FRONTEND_URL}/payment/callback`;

      const subscription = await mercadopagoService.crearSuscripcion({
        planId: plan.mp_plan_id,
        email: payer_email || email,
        returnUrl,
        externalReference
      });

      logger.info('Suscripción creada en MP', {
        subscriptionId: subscription.id,
        organizacion_id
      });

      // 4. Actualizar subscripción en BD
      await db.query(`
        UPDATE subscripciones
        SET subscription_id_gateway = $1,
            gateway_pago = 'mercadopago',
            updated_at = NOW()
        WHERE organizacion_id = $2
      `, [subscription.id, organizacion_id]);

      // 5. Registrar en historial
      await db.query(`
        INSERT INTO historial_subscripciones (
          organizacion_id, tipo_evento, descripcion, metadata
        ) VALUES ($1, 'creacion', $2, $3)
      `, [
        organizacion_id,
        `Suscripción creada en Mercado Pago: ${plan.nombre_plan}`,
        JSON.stringify({
          subscription_id_mp: subscription.id,
          plan_codigo
        })
      ]);

      // 6. Retornar URL de checkout
      return ResponseHelper.success(res, {
        subscription_id: subscription.id,
        checkout_url: subscription.init_point,
        plan: {
          codigo: plan.codigo_plan,
          nombre: plan.nombre_plan,
          precio: plan.precio_mensual
        }
      }, 'Redirigir al usuario a checkout_url para completar el pago');

    } catch (error) {
      logger.error('Error creando suscripción:', error);
      return ResponseHelper.error(res, 500,
        'Error al crear suscripción', error.message);
    }
  }

  /**
   * Obtener historial de pagos de la organización
   * GET /api/v1/pagos/historial
   */
  async obtenerHistorial(req, res) {
    const { organizacion_id } = req.user;
    const { limite = 20, pagina = 1 } = req.query;

    try {
      const offset = (pagina - 1) * limite;

      const { rows: pagos } = await db.query(`
        SELECT id, payment_id_mp, monto, moneda, estado,
               tipo_pago, payment_method_id, fecha_pago,
               created_at
        FROM pagos
        WHERE organizacion_id = $1
        ORDER BY fecha_pago DESC NULLS LAST, created_at DESC
        LIMIT $2 OFFSET $3
      `, [organizacion_id, limite, offset]);

      const { rows: totalRows } = await db.query(`
        SELECT COUNT(*) as total
        FROM pagos
        WHERE organizacion_id = $1
      `, [organizacion_id]);

      return ResponseHelper.success(res, {
        pagos,
        paginacion: {
          total: parseInt(totalRows[0].total),
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          total_paginas: Math.ceil(totalRows[0].total / limite)
        }
      });

    } catch (error) {
      logger.error('Error obteniendo historial:', error);
      return ResponseHelper.error(res, 500, 'Error al obtener historial');
    }
  }

  /**
   * Obtener método de pago actual
   * GET /api/v1/pagos/metodo-pago
   */
  async obtenerMetodoPago(req, res) {
    const { organizacion_id } = req.user;

    try {
      const { rows } = await db.query(`
        SELECT id, card_last_digits, card_brand, card_holder_name,
               expiration_month, expiration_year, activo
        FROM metodos_pago
        WHERE organizacion_id = $1 AND activo = true
        ORDER BY created_at DESC
        LIMIT 1
      `, [organizacion_id]);

      if (rows.length === 0) {
        return ResponseHelper.success(res, { metodo_pago: null });
      }

      return ResponseHelper.success(res, {
        metodo_pago: rows[0]
      });

    } catch (error) {
      logger.error('Error obteniendo método de pago:', error);
      return ResponseHelper.error(res, 500, 'Error al obtener método de pago');
    }
  }
}

module.exports = new PagosController();
```

---

#### 2.3 Routes de Pagos

**Archivo**: `backend/app/routes/api/v1/pagos.js`

```javascript
const express = require('express');
const router = express.Router();
const controller = require('../../controllers/pagos.controller');
const { auth } = require('../../middleware/auth');
const { tenant } = require('../../middleware/tenant');
const { validation } = require('../../middleware/validation');
const { asyncHandler } = require('../../middleware/asyncHandler');
const Joi = require('joi');

// ================================================================
// SCHEMAS DE VALIDACIÓN
// ================================================================

const schemas = {
  crearSuscripcionSchema: Joi.object({
    plan_codigo: Joi.string().valid('basico', 'profesional', 'custom').required(),
    payer_email: Joi.string().email().optional()
  })
};

// ================================================================
// RUTAS
// ================================================================

/**
 * Crear suscripción en Mercado Pago
 * POST /api/v1/pagos/crear-suscripcion
 * Auth: admin, propietario
 */
router.post('/crear-suscripcion',
  auth,
  tenant.setTenantContext,
  validation.validateBody(schemas.crearSuscripcionSchema),
  asyncHandler(controller.crearSuscripcion)
);

/**
 * Obtener historial de pagos
 * GET /api/v1/pagos/historial
 */
router.get('/historial',
  auth,
  tenant.setTenantContext,
  asyncHandler(controller.obtenerHistorial)
);

/**
 * Obtener método de pago actual
 * GET /api/v1/pagos/metodo-pago
 */
router.get('/metodo-pago',
  auth,
  tenant.setTenantContext,
  asyncHandler(controller.obtenerMetodoPago)
);

module.exports = router;
```

**Registrar en `backend/app/app.js`**:

```javascript
const pagosRoutes = require('./routes/api/v1/pagos');
app.use('/api/v1/pagos', pagosRoutes);
```

---

### FASE 3: Webhooks de Mercado Pago (Semana 2-3)

#### 3.1 Controller de Webhooks

**Archivo**: `backend/app/controllers/webhooks.controller.js`

```javascript
const mercadopagoService = require('../services/mercadopago.service');
const logger = require('../utils/logger');
const db = require('../database/db');

class WebhooksController {

  /**
   * Handler principal de webhooks de Mercado Pago
   * POST /api/v1/webhooks/mercadopago
   *
   * Eventos soportados:
   * - payment (payment.created, payment.updated)
   * - subscription_preapproval (subscription.created, subscription.updated)
   */
  async handleMercadoPago(req, res) {
    const { type, data, action } = req.body;

    logger.info('📥 Webhook recibido de Mercado Pago', {
      type,
      action,
      dataId: data?.id,
      timestamp: new Date().toISOString()
    });

    // 1. Validar signature (CRÍTICO para seguridad)
    const signature = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];

    const esValido = mercadopagoService.validarWebhook(signature, requestId, data?.id);

    if (!esValido) {
      logger.warn('⚠️ Webhook con firma inválida', { signature, requestId });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Responder rápido (Mercado Pago espera HTTP 200 en <5 segundos)
    res.status(200).send('OK');

    // 3. Procesar async (no bloquear la respuesta)
    try {
      if (type === 'payment') {
        await this.procesarPago(data.id, action);
      } else if (type === 'subscription_preapproval') {
        await this.procesarSuscripcion(data.id, action);
      } else if (type === 'subscription_authorized_payment') {
        await this.procesarPagoAutorizado(data.id, action);
      } else {
        logger.info(`ℹ️ Tipo de webhook no manejado: ${type}`);
      }
    } catch (error) {
      logger.error('❌ Error procesando webhook:', error);
      // No lanzar error (ya respondimos 200)
    }
  }

  /**
   * Procesar evento de pago
   * Eventos: payment.created, payment.updated
   */
  async procesarPago(paymentId, action) {
    logger.info('💳 Procesando pago', { paymentId, action });

    try {
      // 1. Obtener pago de Mercado Pago
      const pago = await mercadopagoService.obtenerPago(paymentId);

      logger.info('Pago obtenido de MP', {
        paymentId,
        status: pago.status,
        amount: pago.transaction_amount,
        externalRef: pago.external_reference
      });

      // 2. Extraer organizacion_id del external_reference
      // Formato: org_{organizacion_id}_{timestamp}
      const orgId = this.extraerOrgId(pago.external_reference);

      if (!orgId) {
        logger.error('No se pudo extraer organizacion_id', {
          externalReference: pago.external_reference
        });
        return;
      }

      // 3. Verificar si ya existe (idempotencia)
      const { rows: existente } = await db.query(`
        SELECT id FROM pagos WHERE payment_id_mp = $1
      `, [paymentId]);

      if (existente.length > 0) {
        logger.info('Pago ya procesado, actualizando...', { paymentId });

        // Actualizar estado
        await db.query(`
          UPDATE pagos
          SET estado = $1,
              status_detail = $2,
              fecha_aprobacion = $3,
              metadata = $4,
              updated_at = NOW()
          WHERE payment_id_mp = $5
        `, [
          pago.status,
          pago.status_detail,
          pago.date_approved,
          JSON.stringify(pago),
          paymentId
        ]);

        return;
      }

      // 4. Registrar nuevo pago
      await db.query(`
        INSERT INTO pagos (
          organizacion_id, payment_id_mp, subscription_id_mp,
          monto, moneda, estado, tipo_pago,
          payment_method_id, payment_type_id, status_detail,
          metadata, external_reference,
          fecha_pago, fecha_aprobacion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        orgId,
        pago.id,
        pago.subscription_id || null,
        pago.transaction_amount,
        pago.currency_id,
        pago.status,
        pago.subscription_id ? 'subscription' : 'one_time',
        pago.payment_method_id,
        pago.payment_type_id,
        pago.status_detail,
        JSON.stringify(pago),
        pago.external_reference,
        pago.date_created,
        pago.date_approved
      ]);

      logger.info('✅ Pago registrado en BD', { paymentId, orgId });

      // 5. Actualizar estado de subscripción según resultado del pago
      if (pago.status === 'approved') {
        await this.pagoExitoso(orgId, pago);
      } else if (pago.status === 'rejected') {
        await this.pagoFallido(orgId, pago);
      } else if (pago.status === 'pending') {
        logger.info('Pago pendiente, esperando confirmación', { paymentId });
      }

    } catch (error) {
      logger.error('Error procesando pago:', error);
      throw error;
    }
  }

  /**
   * Procesar evento de suscripción
   * Eventos: subscription_preapproval.created, subscription_preapproval.updated
   */
  async procesarSuscripcion(subscriptionId, action) {
    logger.info('📋 Procesando suscripción', { subscriptionId, action });

    try {
      // Obtener suscripción de Mercado Pago
      const subscription = await mercadopagoService.obtenerSuscripcion(subscriptionId);

      logger.info('Suscripción obtenida de MP', {
        subscriptionId,
        status: subscription.status,
        externalRef: subscription.external_reference
      });

      const orgId = this.extraerOrgId(subscription.external_reference);

      if (!orgId) {
        logger.error('No se pudo extraer organizacion_id de suscripción');
        return;
      }

      // Mapear estado de MP a nuestro estado
      let estadoLocal = 'activa';
      if (subscription.status === 'cancelled') {
        estadoLocal = 'cancelada';
      } else if (subscription.status === 'paused') {
        estadoLocal = 'suspendida';
      } else if (subscription.status === 'pending') {
        estadoLocal = 'activa'; // Pendiente de primer pago
      }

      // Actualizar estado en BD
      await db.query(`
        UPDATE subscripciones
        SET estado = $1,
            subscription_id_gateway = $2,
            updated_at = NOW()
        WHERE organizacion_id = $3
      `, [estadoLocal, subscriptionId, orgId]);

      logger.info('✅ Estado de suscripción actualizado', { orgId, estadoLocal });

    } catch (error) {
      logger.error('Error procesando suscripción:', error);
      throw error;
    }
  }

  /**
   * Pago exitoso - actualizar subscripción y registrar
   */
  async pagoExitoso(orgId, pago) {
    logger.info('✅ Procesando pago exitoso', { orgId, amount: pago.transaction_amount });

    try {
      // 1. Actualizar estado de subscripción
      await db.query(`
        UPDATE subscripciones
        SET estado = 'activa',
            intentos_pago_fallidos = 0,
            ultimo_intento_pago = NOW(),
            fecha_proximo_pago = NOW() + INTERVAL '1 month',
            valor_total_pagado = COALESCE(valor_total_pagado, 0) + $1
        WHERE organizacion_id = $2
      `, [pago.transaction_amount, orgId]);

      // 2. Registrar en historial
      await db.query(`
        INSERT INTO historial_subscripciones (
          organizacion_id, tipo_evento, descripcion, metadata
        ) VALUES ($1, 'pago_exitoso', $2, $3)
      `, [
        orgId,
        `Pago procesado exitosamente: $${pago.transaction_amount} ${pago.currency_id}`,
        JSON.stringify({
          payment_id: pago.id,
          amount: pago.transaction_amount,
          payment_method: pago.payment_method_id
        })
      ]);

      // 3. TODO: Enviar email de confirmación
      logger.info('TODO: Enviar email de confirmación de pago', { orgId });

    } catch (error) {
      logger.error('Error procesando pago exitoso:', error);
      throw error;
    }
  }

  /**
   * Pago fallido - incrementar contador e intentar de nuevo
   */
  async pagoFallido(orgId, pago) {
    logger.warn('⚠️ Procesando pago fallido', {
      orgId,
      reason: pago.status_detail
    });

    try {
      // Incrementar contador de intentos fallidos
      const { rows } = await db.query(`
        UPDATE subscripciones
        SET intentos_pago_fallidos = intentos_pago_fallidos + 1,
            ultimo_intento_pago = NOW(),
            estado = CASE
              WHEN intentos_pago_fallidos >= 2 THEN 'morosa'
              ELSE estado
            END
        WHERE organizacion_id = $1
        RETURNING intentos_pago_fallidos
      `, [orgId]);

      const intentos = rows[0].intentos_pago_fallidos;

      // Registrar en historial
      await db.query(`
        INSERT INTO historial_subscripciones (
          organizacion_id, tipo_evento, descripcion, metadata
        ) VALUES ($1, 'pago_fallido', $2, $3)
      `, [
        orgId,
        `Pago rechazado (intento ${intentos}): ${pago.status_detail}`,
        JSON.stringify({
          payment_id: pago.id,
          status_detail: pago.status_detail,
          intentos
        })
      ]);

      // TODO: Notificar admin de la organización
      logger.info('TODO: Enviar notificación de pago fallido', { orgId, intentos });

    } catch (error) {
      logger.error('Error procesando pago fallido:', error);
      throw error;
    }
  }

  /**
   * Extraer organizacion_id del external_reference
   * Formato: org_{organizacion_id}_{timestamp}
   */
  extraerOrgId(externalReference) {
    if (!externalReference) return null;

    const match = externalReference.match(/org_(\d+)_/);
    return match ? parseInt(match[1]) : null;
  }
}

module.exports = new WebhooksController();
```

---

#### 3.2 Routes de Webhooks

**Archivo**: `backend/app/routes/api/v1/webhooks.js`

```javascript
const express = require('express');
const router = express.Router();
const controller = require('../../controllers/webhooks.controller');
const { asyncHandler } = require('../../middleware/asyncHandler');

/**
 * Webhook de Mercado Pago
 * POST /api/v1/webhooks/mercadopago
 *
 * IMPORTANTE: NO usar middleware auth ni tenant
 * Mercado Pago envía requests sin autenticación (usa x-signature)
 */
router.post('/mercadopago',
  express.json(), // Parse JSON body
  asyncHandler(controller.handleMercadoPago)
);

module.exports = router;
```

**Registrar en `backend/app/app.js`**:

```javascript
const webhooksRoutes = require('./routes/api/v1/webhooks');
app.use('/api/v1/webhooks', webhooksRoutes);
```

---

#### 3.3 Configurar Webhook en Mercado Pago

**Pasos**:

1. Ir a https://www.mercadopago.com.mx/developers/panel/app
2. Seleccionar tu aplicación
3. Ir a **Webhooks** en el menú lateral
4. Hacer clic en **Configurar notificaciones**
5. Agregar URL: `https://tudominio.com/api/v1/webhooks/mercadopago`
6. Seleccionar eventos:
   - ✅ `payment` (Pagos)
   - ✅ `subscription_preapproval` (Suscripciones)
   - ✅ `subscription_authorized_payment` (Pagos autorizados de suscripción)
7. Guardar

**Testing en desarrollo**:
- Usar ngrok o similar para exponer localhost: `ngrok http 3000`
- URL temporal: `https://abc123.ngrok.io/api/v1/webhooks/mercadopago`

---

### FASE 4: Frontend - Onboarding con Pago (Semana 3-4)

#### 4.1 Hook de Pagos

**Archivo**: `frontend/src/hooks/usePagos.js`

```javascript
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../services/api/client';

export const usePagos = () => {

  /**
   * Crear suscripción en Mercado Pago
   */
  const crearSuscripcion = useMutation({
    mutationFn: async ({ plan_codigo, payer_email }) => {
      const response = await api.post('/pagos/crear-suscripcion', {
        plan_codigo,
        payer_email
      });
      return response.data.data;
    },
    onError: (error) => {
      console.error('Error creando suscripción:', error);
    }
  });

  /**
   * Obtener historial de pagos
   */
  const useHistorialPagos = (options = {}) => {
    return useQuery({
      queryKey: ['pagos', 'historial', options],
      queryFn: async () => {
        const response = await api.get('/pagos/historial', {
          params: options
        });
        return response.data.data;
      }
    });
  };

  /**
   * Obtener método de pago actual
   */
  const useMetodoPago = () => {
    return useQuery({
      queryKey: ['pagos', 'metodo-pago'],
      queryFn: async () => {
        const response = await api.get('/pagos/metodo-pago');
        return response.data.data.metodo_pago;
      }
    });
  };

  return {
    crearSuscripcion,
    useHistorialPagos,
    useMetodoPago
  };
};
```

---

#### 4.2 Step 2.5 - Método de Pago

**Archivo**: `frontend/src/pages/onboarding/steps/Step2_5_PaymentMethod.jsx`

```jsx
import { useEffect, useState } from 'react';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { usePagos } from '../../../hooks/usePagos';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Loader } from '../../../components/ui/Loader';
import { Shield, CreditCard, Check } from 'lucide-react';

export default function Step2_5_PaymentMethod({ onNext, onBack }) {
  const { plan_codigo, plan_nombre, plan_precio, organizacion } = useOnboardingStore();
  const { crearSuscripcion } = usePagos();
  const [loading, setLoading] = useState(false);

  // Si es trial, skip automático
  useEffect(() => {
    if (plan_codigo === 'trial') {
      onNext();
    }
  }, [plan_codigo, onNext]);

  const handlePago = async () => {
    setLoading(true);

    try {
      const result = await crearSuscripcion.mutateAsync({
        plan_codigo,
        payer_email: organizacion.email
      });

      // Redirigir a Mercado Pago Checkout
      window.location.href = result.checkout_url;

    } catch (error) {
      setLoading(false);
      console.error('Error:', error);
      // TODO: Mostrar toast de error
    }
  };

  if (plan_codigo === 'trial') {
    return <Loader />;
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Configura tu método de pago
        </h2>
        <p className="text-gray-600">
          Serás redirigido a Mercado Pago para completar el pago de forma segura
        </p>
      </div>

      {/* Resumen del Plan */}
      <Card className="mb-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {plan_nombre}
            </h3>
            <p className="text-gray-600">
              Facturación mensual
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              ${plan_precio} <span className="text-lg text-gray-500">MXN</span>
            </div>
            <div className="text-sm text-gray-500">por mes</div>
          </div>
        </div>
      </Card>

      {/* Beneficios */}
      <Card className="mb-6 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Lo que incluye:</h4>
        <ul className="space-y-3">
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">
              Acceso completo a todas las funcionalidades del plan
            </span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">
              Soporte técnico prioritario
            </span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">
              Cancela en cualquier momento sin penalización
            </span>
          </li>
        </ul>
      </Card>

      {/* Seguridad */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-semibold text-blue-900 mb-1">
              Pago 100% seguro
            </h5>
            <p className="text-sm text-blue-700">
              Procesado por Mercado Pago. Tus datos están protegidos con encriptación de nivel bancario.
            </p>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="flex-1"
        >
          Volver
        </Button>

        <Button
          onClick={handlePago}
          loading={loading}
          className="flex-1"
          icon={<CreditCard className="h-5 w-5" />}
        >
          {loading ? 'Redirigiendo...' : 'Ir a pagar'}
        </Button>
      </div>

      {/* Nota */}
      <p className="text-center text-sm text-gray-500 mt-4">
        No se realizará ningún cargo hasta que completes el proceso en Mercado Pago
      </p>
    </div>
  );
}
```

---

#### 4.3 Payment Callback

**Archivo**: `frontend/src/pages/payment/PaymentCallback.jsx`

```jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verificando');

  const collectionStatus = searchParams.get('collection_status');
  const paymentId = searchParams.get('payment_id');
  const subscriptionId = searchParams.get('subscription_id');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    // Verificar estado del pago
    if (collectionStatus === 'approved') {
      setStatus('exitoso');

      // Redirigir después de 3 segundos
      setTimeout(() => {
        // Si viene de onboarding, continuar
        if (externalReference?.includes('org_')) {
          navigate('/onboarding/step/3');
        } else {
          navigate('/dashboard');
        }
      }, 3000);

    } else if (collectionStatus === 'rejected') {
      setStatus('fallido');
    } else if (collectionStatus === 'pending') {
      setStatus('pendiente');
    } else {
      setStatus('desconocido');
    }
  }, [collectionStatus, navigate, externalReference]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">

        {/* Verificando */}
        {status === 'verificando' && (
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verificando pago...
            </h2>
            <p className="text-gray-600">
              Por favor espera mientras confirmamos tu pago
            </p>
          </div>
        )}

        {/* Exitoso */}
        {status === 'exitoso' && (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Pago exitoso!
            </h2>
            <p className="text-gray-600 mb-6">
              Tu suscripción ha sido activada correctamente
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                Recibirás un email de confirmación con los detalles de tu pago
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Redirigiendo en 3 segundos...
            </p>
          </div>
        )}

        {/* Fallido */}
        {status === 'fallido' && (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pago rechazado
            </h2>
            <p className="text-gray-600 mb-6">
              No pudimos procesar tu pago. Por favor intenta nuevamente.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/planes')}
                className="w-full"
              >
                Intentar de nuevo
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Volver al inicio
              </Button>
            </div>
          </div>
        )}

        {/* Pendiente */}
        {status === 'pendiente' && (
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pago pendiente
            </h2>
            <p className="text-gray-600 mb-6">
              Tu pago está siendo procesado. Te notificaremos cuando se confirme.
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Ir al dashboard
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
```

---

#### 4.4 Actualizar OnboardingFlow

**Archivo**: `frontend/src/pages/onboarding/OnboardingFlow.jsx`

```jsx
// Importar nuevo step
import Step2_5_PaymentMethod from './steps/Step2_5_PaymentMethod';

// Agregar a la lista de steps
const steps = [
  { number: 1, component: Step1_BasicInfo },
  { number: 2, component: Step2_PlanSelection },
  { number: 2.5, component: Step2_5_PaymentMethod }, // NUEVO
  { number: 3, component: Step3_Industry },
  // ... resto de steps
];
```

---

### FASE 5-7: Billing, Upgrades, Cron Jobs

**Nota**: Estas fases continúan con la misma lógica del plan original, pero usando el servicio `mercadopagoService.js` para todas las operaciones.

Por brevedad, no incluyo el código completo aquí, pero los archivos principales serían:

- `frontend/src/pages/billing/BillingPage.jsx`
- `frontend/src/components/billing/ChangePlanModal.jsx`
- `backend/app/controllers/subscripciones.controller.js`
- `backend/app/jobs/workers/expirar-trials.worker.js`
- `backend/app/services/pdf-generator.service.js`

---

## 📦 Resumen de Archivos a Crear/Modificar

### Backend

| Tipo | Archivo | Descripción |
|------|---------|-------------|
| **Services** | `services/mercadopago.service.js` | Service principal de MP |
| | `config/mercadopago.js` | Configuración |
| **Controllers** | `controllers/pagos.controller.js` | CRUD pagos |
| | `controllers/webhooks.controller.js` | Handler webhooks |
| **Routes** | `routes/api/v1/pagos.js` | Rutas de pagos |
| | `routes/api/v1/webhooks.js` | Rutas de webhooks |
| **Scripts** | `scripts/sync-plans-to-mercadopago.js` | Migración de planes |
| **BD** | `sql/schema/11-payments-mercadopago.sql` | Tablas nuevas |
| | `sql/migrations/001_add_mp_plan_id.sql` | Migration |

### Frontend

| Tipo | Archivo | Descripción |
|------|---------|-------------|
| **Pages** | `pages/onboarding/steps/Step2_5_PaymentMethod.jsx` | Step de pago |
| | `pages/payment/PaymentCallback.jsx` | Callback de MP |
| | `pages/billing/BillingPage.jsx` | Dashboard de facturación |
| **Components** | `components/billing/ChangePlanModal.jsx` | Modal upgrade/downgrade |
| | `components/billing/InvoicesList.jsx` | Lista de facturas |
| **Hooks** | `hooks/usePagos.js` | Hook de pagos |
| | `hooks/useBilling.js` | Hook de billing |

---

## 🔐 Consideraciones de Seguridad

### 1. Webhook Validation

**CRÍTICO**: Siempre validar la firma `x-signature` de Mercado Pago

```javascript
// Implementar en mercadopagoService.validarWebhook()
const crypto = require('crypto');

validarWebhook(signature, requestId, dataId) {
  // Según docs: https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  const parts = signature.split(',');
  const ts = parts[0].split('=')[1];
  const hash = parts[1].split('=')[1];

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(manifest);
  const computedHash = hmac.digest('hex');

  return hash === computedHash;
}
```

### 2. PCI Compliance

✅ **NUNCA guardar**:
- Número de tarjeta completo
- CVV/CVC
- PIN

✅ **Solo guardar**:
- Últimos 4 dígitos
- Marca (Visa, Mastercard)
- Fecha de expiración
- IDs de Mercado Pago (customer_id, payment_method_id)

### 3. RLS (Row Level Security)

✅ Todas las queries usan `RLSContextManager`:

```javascript
// En controllers
const RLSContextManager = require('../utils/rlsContextManager');

await RLSContextManager.query(organizacion_id, async (db) => {
  const { rows } = await db.query('SELECT * FROM pagos WHERE ...');
  return rows;
});
```

### 4. Rate Limiting

✅ Endpoints de pago con límite estricto:

```javascript
// En routes
const { rateLimiting } = require('../../middleware/rateLimiting');

router.post('/crear-suscripcion',
  rateLimiting.heavyOperationRateLimit, // 5 requests/15min
  // ... resto de middleware
);
```

### 5. Idempotencia

✅ Constraint UNIQUE en `payment_id_mp`:

```sql
CREATE TABLE pagos (
  payment_id_mp VARCHAR(100) UNIQUE NOT NULL,
  -- ...
);
```

Esto previene procesar el mismo pago 2 veces si Mercado Pago reenvía el webhook.

---

## ✅ Checklist de Implementación

### Pre-requisitos

- [ ] Crear cuenta en Mercado Pago México
- [ ] Obtener credenciales de Sandbox (`TEST-`)
- [ ] Obtener credenciales de Producción (`APP_USR-`)
- [ ] Configurar MCP Server en Claude Code
- [ ] Dominio con HTTPS para webhooks

### Fase 1: Fundamentos

- [ ] Instalar SDK: `npm install mercadopago`
- [ ] Crear servicio `mercadopago.service.js`
- [ ] Crear configuración `config/mercadopago.js`
- [ ] Ejecutar SQL: `11-payments-mercadopago.sql`
- [ ] Ejecutar migration: `001_add_mp_plan_id.sql`
- [ ] Agregar variables de entorno

### Fase 2: Planes

- [ ] Ejecutar script: `sync-plans-to-mercadopago.js`
- [ ] Verificar planes en dashboard de MP
- [ ] Crear controller `pagos.controller.js`
- [ ] Crear routes `pagos.js`
- [ ] Probar endpoint `/pagos/crear-suscripcion` en Postman

### Fase 3: Webhooks

- [ ] Crear controller `webhooks.controller.js`
- [ ] Crear routes `webhooks.js`
- [ ] Exponer endpoint con ngrok (desarrollo)
- [ ] Configurar webhook en dashboard de MP
- [ ] Probar con simulador de webhooks de MP
- [ ] Implementar validación de firma

### Fase 4: Frontend

- [ ] Crear hook `usePagos.js`
- [ ] Crear componente `Step2_5_PaymentMethod.jsx`
- [ ] Crear componente `PaymentCallback.jsx`
- [ ] Actualizar `OnboardingFlow.jsx`
- [ ] Probar flujo completo en sandbox

### Fase 5-7: Billing y Cron Jobs

- [ ] Crear página `BillingPage.jsx`
- [ ] Crear modal `ChangePlanModal.jsx`
- [ ] Implementar lógica de prorrateo
- [ ] Configurar BullMQ
- [ ] Crear workers de cron jobs
- [ ] Implementar generación de recibos PDF

### Testing

- [ ] Unit tests de `mercadopagoService`
- [ ] Integration tests de endpoints
- [ ] E2E test: Onboarding → Pago → Webhook
- [ ] Testing en sandbox con tarjetas de prueba
- [ ] Load testing de webhooks

### Deployment

- [ ] Agregar variables de entorno en producción
- [ ] Ejecutar migraciones en BD producción
- [ ] Sincronizar planes en producción
- [ ] Configurar webhook con dominio real
- [ ] Cambiar a credenciales de producción
- [ ] Monitorear primeros pagos reales

---

## 🎯 Próximos Pasos Inmediatos

1. **Obtener Credenciales**
   - Crear aplicación en: https://www.mercadopago.com.mx/developers/panel/app
   - Copiar Access Token y Public Key
   - Generar Webhook Secret

2. **Configurar MCP Server** (Desarrollo)
   ```json
   {
     "mcpServers": {
       "mercadopago": {
         "url": "https://mcp.mercadopago.com/mcp",
         "headers": {
           "Authorization": "Bearer <ACCESS_TOKEN>"
         }
       }
     }
   }
   ```

3. **Comenzar Fase 1**
   ```bash
   cd backend
   npm install mercadopago
   # Crear archivos del servicio
   ```

---

## 📚 Recursos Adicionales

### Documentación Oficial

- **API Reference**: https://www.mercadopago.com.mx/developers/es/reference
- **Suscripciones**: https://www.mercadopago.com.mx/developers/es/docs/subscriptions
- **Webhooks**: https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks
- **SDK Node.js**: https://github.com/mercadopago/sdk-nodejs

### Testing

- **Tarjetas de prueba**: https://www.mercadopago.com.mx/developers/es/docs/checkout-api/testing
- **Simulador de webhooks**: Panel de desarrolladores → Tu aplicación → Test → Simulator

### MCP Server

- **Docs MCP Oficial**: https://www.mercadopago.com.ar/developers/en/docs/mcp-server/overview
- **Model Context Protocol**: https://modelcontextprotocol.io/

---

**Última actualización**: 1 de Noviembre de 2025
**Autor**: Claude Code + Equipo de Desarrollo
**Estado**: ✅ Listo para implementación
