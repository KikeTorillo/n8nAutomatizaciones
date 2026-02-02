# Módulo Suscripciones Negocio

Sistema de facturación recurrente multi-propósito para Nexo ERP.

---

## Resumen

| Aspecto | Valor |
|---------|-------|
| **Propósito** | Facturación recurrente con MercadoPago/Stripe |
| **Modelo** | Dogfooding (Nexo lo usa + clientes pueden usarlo) |
| **Estado** | Platform Billing ✅ | Customer Billing 🟡 |
| **Fuente de verdad** | `suscripciones_org` → `organizaciones.modulos_activos` |
| **Última revisión** | 2 Febrero 2026 |

---

## Arquitectura Dogfooding

```
┌─────────────────────────────────────────────────────────────────┐
│  NEXO TEAM (org_id=1)              CLIENTES DE NEXO             │
│  ├── Define planes                 ├── Pagan suscripciones      │
│  ├── Cobra a organizaciones        ├── Reciben modulos_activos  │
│  └── Configura entitlements        └── Tienen límites aplicados │
└─────────────────────────────────────────────────────────────────┘
```

| Aspecto | Platform Billing | Customer Billing |
|---------|------------------|------------------|
| **Vendor** | Nexo Team (org 1) | Cualquier organización |
| **Comprador** | Organizaciones | Clientes del CRM |
| **Módulos/Límites** | ✅ Se sincronizan | ❌ No aplican |

---

## Estados de Suscripción

```
trial → pendiente_pago → activa → grace_period → suspendida
                           ↓
                        pausada → cancelada
```

| Estado | Acceso | UX |
|--------|--------|-----|
| `trial`, `activa`, `pendiente_pago` | ✅ Completo | Normal |
| `grace_period` | ⚠️ Solo lectura | Banner urgente |
| `pausada`, `suspendida`, `cancelada` | ❌ Bloqueado | Redirect `/planes` |

**Bypasses**: `organizacion_id === 1`, `nivel >= 100`, rutas `/auth/*`, `/planes/*`, `/checkout/*`

---

## Sincronización de Módulos

### Servicio Central: ModulosSyncService

```javascript
// backend/app/services/modulosSyncService.js

// Construir objeto desde array
ModulosSyncService.construirModulosActivos(['inventario', 'pos'])
// → { core: true, inventario: true, pos: true }

// Sincronizar una organización
await ModulosSyncService.sincronizarOrganizacion(orgId);

// Sincronizar todas las orgs de un plan (al editar entitlements)
await ModulosSyncService.sincronizarPorPlan(planId);

// Sincronizar toda la plataforma (operación pesada)
await ModulosSyncService.sincronizarTodas();
```

### Flujo de Sincronización

```
1. Webhook MP/Stripe → subscription.authorized
                              ↓
2. dogfoodingService.procesarWebhook()
                              ↓
3. ModulosSyncService.sincronizarOrganizacion(orgId)
                              ↓
4. plan.modulos_habilitados → organizacion.modulos_activos
                              ↓
5. ModulesCache.invalidate(orgId)
```

### Triggers de Sincronización

| Evento | Método | Automático |
|--------|--------|------------|
| Activación suscripción | `sincronizarOrganizacion()` | ✅ Webhook |
| Edición entitlements plan | `sincronizarPorPlan()` | ✅ Controller |
| Migración/Fix manual | `sincronizarTodas()` | ❌ Admin |

---

## Gestión de Módulos (UI)

### Páginas

| Ruta | Componente | Propósito |
|------|------------|-----------|
| `/configuracion/modulos` | ModulosPage | Activar/desactivar módulos |
| `/onboarding` | ModuloSelector | Selección inicial en registro |

### Hook: useEstadoSuscripcion

```javascript
const { data } = useEstadoSuscripcion();

// Campos disponibles:
data.plan_actual           // 'trial', 'basico', 'pro'
data.plan_nombre           // 'Plan Profesional'
data.modulos_activos       // { core: true, pos: true }
data.modulos_habilitados   // ['agendamiento', 'pos'] - permitidos por plan
data.estado_suscripcion    // 'activa', 'trial', etc.
```

### Lógica de Dependencias

```javascript
// moduleHelpers en ModulosPage.jsx
puedeActivar(modulo)        // Tiene dependencias satisfechas
puedeDesactivar(modulo)     // Ningún módulo activo depende de él
getDependenciasFaltantes()  // Lista de deps requeridas
getModulosDependientesHard() // Módulos que bloquean desactivación
```

### Bloqueo por Plan

Módulos no incluidos en `modulos_habilitados`:
- Muestran candado 🔒
- No pueden activarse
- Enlace "Actualiza tu plan"

---

## Entitlements (Solo Nexo Team)

Configurados desde `/superadmin/entitlements-plataforma`.

### Campos en planes_suscripcion_org

| Campo | Propósito | Ejemplo |
|-------|-----------|---------|
| `features` | Display/Marketing | `["Usuarios ilimitados"]` |
| `modulos_habilitados` | Control de acceso | `["agendamiento", "pos"]` |
| `limites` | Restricciones de uso | `{"usuarios": 5}` |
| `usuarios_incluidos` | Base del plan | `5` |
| `precio_usuario_adicional` | Soft limit | `49.00` |
| `max_usuarios_hard` | Límite absoluto | `10` |

### Módulos Válidos

```
agendamiento, inventario, pos, comisiones, contabilidad,
marketplace, chatbots, workflows, eventos-digitales, website,
suscripciones-negocio
```

---

## Seat-Based Billing

| Paso | Timing | Acción |
|------|--------|--------|
| 1 | 23:55 diario | `registrar-uso-usuarios` guarda snapshot |
| 2 | Día 28, 20:00 | `ajustar-preapproval` actualiza monto en MP |
| 3 | Ciclo MP | MercadoPago cobra el monto ajustado |

```
Plan Pro ($249, 5 usuarios, $49/extra):
MAX enero: 8 → Extra: 3 → Ajuste: $147 → TOTAL: $396
```

---

## Jobs Programados

| Hora | Job | Función |
|------|-----|---------|
| 06:00 | `procesar-cobros` | Cobros Stripe/Manual |
| 07:00 | `verificar-trials` | Expira trials vencidos |
| 08:00 | `procesar-dunning` | Grace period → Suspensión |
| 20:00 día 28 | `ajustar-preapproval` | Actualiza monto MP |
| 23:55 | `registrar-uso-usuarios` | Snapshot usuarios |
| */5min | `polling-suscripciones` | Fallback webhooks |

---

## Gateways de Pago

```
gateways/
├── PaymentGateway.js       # Interfaz base
├── MercadoPagoGateway.js   # Preapproval API
├── StripeGateway.js        # Subscriptions API
└── events/NormalizedEvent.js
```

### Eventos Normalizados

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

# Checkout
POST   /checkout/iniciar
POST   /checkout/publico/crear-suscripcion

# Estado Suscripción (usado por UI)
GET    /organizaciones/:id/estado-suscripcion

# Entitlements (SuperAdmin)
GET    /entitlements/planes
PUT    /entitlements/planes/:id  # Sincroniza orgs automáticamente

# Webhooks
POST   /webhooks/mercadopago
POST   /webhooks/stripe
```

---

## Tablas Principales

| Tabla | Propósito |
|-------|-----------|
| `planes_suscripcion_org` | Catálogo (features + modulos_habilitados) |
| `suscripciones_org` | Estado actual de suscripciones |
| `pagos_suscripcion` | Historial de pagos |
| `conectores_pago_org` | Configuración gateways |
| `webhooks_procesados` | Idempotencia |
| `organizaciones.modulos_activos` | Módulos activos (destino sync) |

---

## MercadoPago Sandbox

| Campo | Valor |
|-------|-------|
| Entorno | `sandbox` |
| `test_payer_email` | Requerido en conector |
| Mastercard | 5474 9254 3267 0366, CVV 123 |
| Visa | 4509 9535 6623 3704, CVV 123 |

---

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `modulosSyncService.js` | Sincronización plan → org |
| `dogfoodingService.js` | Lógica Platform Billing |
| `useEstadoSuscripcion.js` | Hook estado frontend |
| `ModulosPage.jsx` | UI gestión módulos |
| `modulosIconos.js` | Iconos centralizados |

---

## Pendientes

| Feature | Prioridad |
|---------|-----------|
| Customer Billing E2E | Alta |
| Prorrateo cambio de plan | Media |
| Stripe UI | Baja |

---

**Estado**: Platform Billing ✅ | Customer Billing 🟡 | Seat-Based ✅ | Módulos Sync ✅
