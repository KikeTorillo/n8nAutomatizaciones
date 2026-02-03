# Módulo Suscripciones Negocio

Sistema de facturación recurrente para Nexo ERP.

---

## Resumen

| Aspecto | Valor |
|---------|-------|
| **Modelo** | Platform Billing (Dogfooding) |
| **Gateway activo** | MercadoPago (Preapproval API) |
| **Billing** | Seat-based + Prorrateo |
| **Fuente de verdad** | `suscripciones_org` → `organizaciones.modulos_activos` |

---

## Arquitectura Dogfooding

Nexo Team (org 1) usa su propio módulo de suscripciones para cobrar a las organizaciones cliente.

```
NEXO TEAM (org 1)
├── clientes
│   ├── id=100, nombre="Gimnasio ABC", organizacion_vinculada_id=5
│   └── id=101, nombre="SaaS XYZ", organizacion_vinculada_id=10
│
└── suscripciones_org
    ├── cliente_id=100, plan_id=2 (pro)  → Org 5 tiene plan pro
    └── cliente_id=101, plan_id=3 (premium) → Org 10 tiene plan premium
```

### Campo clave: `organizacion_vinculada_id`

Conecta un cliente de Nexo Team con la organización real del usuario:

```sql
-- Buscar suscripción de org 5
SELECT s.* FROM suscripciones_org s
INNER JOIN clientes c ON s.cliente_id = c.id
WHERE c.organizacion_vinculada_id = 5
```

### Flujo automático al crear organización

```
1. Usuario registra org → Event: auth:organizacion.creada
2. DogfoodingSubscriber escucha el evento
3. DogfoodingService.vincularOrganizacionComoCliente():
   - Crea cliente en Nexo Team con organizacion_vinculada_id = org_id
   - Crea suscripción trial automática
   - Sincroniza módulos del plan trial
```

### RLS y Bypass

Muchas operaciones usan `RLSContextManager.withBypass()` porque:
- Los planes están en org 1 (Nexo Team)
- Las suscripciones están en org 1
- Los usuarios son de diferentes orgs
- JOINs cross-org fallan con RLS activo

---

## Estados de Suscripción

### Transiciones válidas

```javascript
{
  'trial': ['activa', 'cancelada', 'vencida', 'pendiente_pago'],
  'pendiente_pago': ['activa', 'cancelada', 'vencida', 'grace_period'],
  'activa': ['pausada', 'cancelada', 'vencida', 'grace_period', 'suspendida'],
  'grace_period': ['activa', 'suspendida', 'cancelada'],
  'pausada': ['activa', 'cancelada'],
  'vencida': ['activa', 'grace_period', 'suspendida'],
  'suspendida': ['activa', 'cancelada'],
  'cancelada': []  // Estado final
}
```

### Nivel de acceso

| Estado | Acceso | UX |
|--------|--------|-----|
| `trial`, `activa`, `pendiente_pago` | ✅ Completo | Normal |
| `vencida`, `grace_period` | ⚠️ Solo lectura | Banner urgente |
| `pausada`, `suspendida`, `cancelada` | ❌ Bloqueado | Redirect `/planes` |

**Bypasses**: `organizacion_id === 1`, `nivel >= 100`, rutas `/auth/*`, `/planes/*`, `/checkout/*`

---

## Sincronización de Módulos

### ModulosSyncService

```javascript
// Construir con merge inteligente (respeta preferencias del usuario)
ModulosSyncService.construirModulosActivos(
  ['inventario', 'pos', 'website'],  // módulos del plan
  { inventario: true, pos: false }    // preferencias actuales
)
// → { core: true, inventario: true, pos: false, website: true }
//   pos=false respetado, website=true porque es nuevo

// Sincronizar al editar entitlements de un plan
await ModulosSyncService.sincronizarPorPlan(planId);
```

### Lógica de merge

| Escenario | Comportamiento |
|-----------|----------------|
| Módulo NUEVO en el plan | Se activa por defecto |
| Módulo que PERMANECE | Mantiene estado actual de la org |
| Módulo que SALE del plan | Se elimina |
| `core` | Siempre activo |

### Triggers

| Evento | Método |
|--------|--------|
| Activación suscripción | `sincronizarOrganizacion()` |
| Edición entitlements | `sincronizarPorPlan()` |
| Fix manual | `sincronizarTodas()` |

---

## Seat-Based Billing

```
1. 23:55 diario    → registrar-uso-usuarios guarda snapshot
2. Día 28, 20:00   → ajustar-preapproval actualiza monto en MP
3. Ciclo MP        → MercadoPago cobra el monto ajustado

Ejemplo:
Plan Pro ($249, 5 usuarios, $49/extra)
MAX enero: 8 → Extra: 3 → Ajuste: $147 → TOTAL: $396
```

---

## Jobs Programados

| Hora | Job | Función |
|------|-----|---------|
| 03:00 (día 1) | `purgar-datos-historicos` | Limpia uso_usuarios y webhooks antiguos |
| 06:00 | `procesar-cobros` | Cobros Stripe/Manual |
| 07:00 | `verificar-trials` | Expira trials vencidos |
| 08:00 | `procesar-dunning` | Grace period → Suspensión |
| 10:00 | `recordatorio-cobro` | Notifica 3 días antes |
| 20:00 (día 28) | `ajustar-preapproval` | Actualiza monto MP |
| 23:55 | `registrar-uso-usuarios` | Snapshot usuarios diario |
| */5min | `polling-suscripciones` | Fallback webhooks MP |
| */30min | `monitorear-webhooks` | Detecta webhooks no procesados |

---

## Gateways de Pago

### Implementados

| Gateway | Estado | API |
|---------|--------|-----|
| MercadoPago | ✅ Activo | Preapproval API |
| Stripe | ⚠️ Placeholder | Subscriptions API |

### Eventos normalizados

| Evento | Acción |
|--------|--------|
| `subscription.authorized` | Activar + sincronizar módulos |
| `subscription.cancelled` | Cancelar suscripción |
| `payment.approved` | Registrar pago |
| `payment.rejected` | Grace period |

---

## Endpoints Principales

```bash
# Mi Plan
GET    /suscripciones/mi-suscripcion
POST   /suscripciones/mi-plan/cancelar

# Checkout (Platform Billing)
POST   /checkout/iniciar

# Estado Suscripción
GET    /organizaciones/:id/estado-suscripcion

# Entitlements (SuperAdmin)
GET    /entitlements/planes
PUT    /entitlements/planes/:id

# Webhooks
POST   /webhooks/mercadopago
POST   /webhooks/stripe
```

---

## Tablas Principales

| Tabla | Propósito |
|-------|-----------|
| `planes_suscripcion_org` | Catálogo de planes (precios, módulos, límites) |
| `suscripciones_org` | Estado actual de suscripciones |
| `pagos_suscripcion` | Historial de pagos |
| `clientes.organizacion_vinculada_id` | Vincula cliente Nexo → org real |
| `uso_usuarios_org` | Tracking diario para seat-based |
| `webhooks_procesados` | Idempotencia de webhooks |
| `conectores_pago_org` | Credenciales gateways (AES-256-GCM) |

### Campos clave en suscripciones_org

```sql
-- Identificación
cliente_id, suscriptor_externo (JSONB, no usado actualmente)
-- Grace Period
fecha_gracia, intentos_cobro_fallidos
-- Seat-based
usuarios_max_periodo, ajuste_pendiente
-- Prorrateo
credito_pendiente
```

---

## Archivos Clave

### Backend

| Archivo | Propósito |
|---------|-----------|
| `services/dogfoodingService.js` | Vinculación org → cliente Nexo Team |
| `services/modulosSyncService.js` | Sincronización plan → org |
| `events/subscribers/dogfoodingSubscriber.js` | Crea cliente/trial al registrar org |
| `modules/suscripciones-negocio/models/suscripciones.model.js` | Model principal |
| `modules/suscripciones-negocio/strategies/PlatformBillingStrategy.js` | Estrategia activa |
| `modules/suscripciones-negocio/gateways/MercadoPagoGateway.js` | Gateway MP |

### Frontend

| Archivo | Propósito |
|---------|-----------|
| `hooks/sistema/useEstadoSuscripcion.js` | Estado suscripción actual |
| `hooks/sistema/useModulos.js` | Verificar acceso a módulos |
| `pages/configuracion/ModulosPage.jsx` | UI gestión de módulos |
| `pages/suscripciones-negocio/MiPlanPage.jsx` | Vista del plan actual |

---

## Customer Billing (Preparado)

Sistema preparado para que organizaciones cobren a sus propios clientes. **No activo actualmente.**

### Diferencias con Platform Billing

| Aspecto | Platform Billing | Customer Billing |
|---------|------------------|------------------|
| Vendor | Nexo Team (org 1) | Cualquier org |
| Clientes | Orgs con `organizacion_vinculada_id` | Clientes CRM normales |
| Sincronización módulos | ✅ Automática | ❌ No aplica |
| Estrategia | `PlatformBillingStrategy` | `CustomerBillingStrategy` |

### Campo `suscriptor_externo`

Existe en el schema como alternativa a `cliente_id` para checkout público sin registro. **Actualmente 0 suscripciones lo usan.**

```sql
CONSTRAINT chk_cliente_o_externo CHECK (
    (cliente_id IS NOT NULL AND suscriptor_externo IS NULL) OR
    (cliente_id IS NULL AND suscriptor_externo IS NOT NULL)
)
```

---

## MercadoPago Sandbox

| Campo | Valor |
|-------|-------|
| Entorno | `sandbox` |
| Mastercard | 5474 9254 3267 0366, CVV 123 |
| Visa | 4509 9535 6623 3704, CVV 123 |
| `test_payer_email` | Requerido en conector |

---

## Pendientes

| Feature | Prioridad |
|---------|-----------|
| Stripe Gateway completo | Alta |
| Customer Billing endpoints | Media |
| Webhook monitoring dashboard | Baja |

---

**Estado**: Platform Billing ✅ | Seat-Based ✅ | Módulos Sync ✅ | Customer Billing ⚠️ (preparado) | Stripe ⚠️ (placeholder)
