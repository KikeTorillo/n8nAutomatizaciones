# Módulo Suscripciones Negocio

Sistema de facturación recurrente con MercadoPago para Nexo ERP.

---

## Arquitectura

```
Frontend                    Backend                         Gateway
─────────────────────────────────────────────────────────────────────
MiPlanPage ───────────────► /checkout/iniciar ────────────► MercadoPago
SuscripcionesListPage ────► /suscripciones/*                    │
PlanesPage ───────────────► /planes/*                           │
MetricasPage ─────────────► /metricas/*                         ▼
                                                            Webhooks
                                  ◄─────────────────────────────┘
                                  │
                           ┌──────┴──────┐
                           │   Services  │
                           ├─────────────┤
                           │ MercadoPago │
                           │ UsageTrack  │
                           │ Prorrateo   │
                           └──────┬──────┘
                                  │
                           ┌──────┴──────┐
                           │  Database   │
                           └─────────────┘
```

---

## Estados de Suscripción

```
[Nuevo] ──► trial ──► activa ──► pausada ──► activa
                │         │          └────► cancelada
                │         └──► pendiente_pago ──► grace_period ──► suspendida ──► cancelada
                │                     └──────────────► activa (pago exitoso)
                └──► vencida (expiró sin pago)
```

| Estado | Acceso | UX |
|--------|--------|-----|
| `trial`, `activa`, `pendiente_pago` | Completo | Normal |
| `grace_period` | Solo lectura | Banner urgente |
| `pausada`, `suspendida`, `cancelada` | Bloqueado | Redirect `/planes` |

---

## MercadoPago

### Arquitectura de Cuentas de Prueba

```
CUENTA REAL (tu cuenta principal)
  └── Panel Developers → Test Users
          │
          ├──► CUENTA VENDEDOR (Test User)
          │    • Recibe los pagos
          │    • Access Token: APP_USR-xxx
          │    • Configura webhooks
          │
          └──► CUENTA COMPRADOR (Test User)
               • Realiza los pagos
               • Email: test_user_xxx@testuser.com
               • Tiene tarjetas de prueba
```

**Importante**: Las cuentas de prueba generan tokens `APP_USR-` (no `TEST-`). Son un sandbox completo.

### Configuración del Conector

| Campo | Sandbox | Production |
|-------|---------|------------|
| `entorno` | `sandbox` | `production` |
| `access_token` | De cuenta vendedor de prueba | De cuenta real |
| `test_payer_email` | **Requerido** - Email comprador prueba | No se usa |
| `webhook_secret` | Secret del webhook | Secret del webhook |

### Flujo de Checkout

```
Usuario ──► Selecciona plan ──► POST /checkout/iniciar
                                       │
                                       ├─► Detecta entorno (sandbox/prod)
                                       ├─► Si sandbox: usa test_payer_email del conector
                                       ├─► Crea suscripción en MercadoPago
                                       └─► Retorna init_point URL
                                              │
                               Redirect a MP ◄┘
                                       │
                               Pago completado
                                       │
                               Webhook ──► Actualiza estado → activa
```

### Detección de Entorno

```javascript
// El entorno se detecta por el campo del conector, NO por prefijo del token
isSandbox() {
    return this.credentials.environment === 'sandbox';
}

// Selección de URL de checkout
const initPointUrl = isSandbox()
    ? response.data.sandbox_init_point
    : response.data.init_point;
```

### Setup Paso a Paso

1. **Crear cuentas de prueba** en https://mercadopago.com.mx/developers/panel/test-users
   - Usuario Vendedor (recibirá pagos)
   - Usuario Comprador (realizará pagos)

2. **Obtener credenciales del vendedor**
   - Login con cuenta vendedor de prueba
   - Panel developers → Credenciales de Producción
   - Copiar `Access Token` (APP_USR-xxx)

3. **Configurar webhook del vendedor**
   - URL: `https://tu-dominio/api/v1/suscripciones-negocio/webhooks/mercadopago/1`
   - Eventos: `subscription_preapproval`, `subscription_authorized_payment`
   - Guardar el Secret

4. **Crear conector en Nexo**
   - Gateway: MercadoPago
   - Entorno: Sandbox
   - Access Token: (del paso 2)
   - Email Pagador de Prueba: `test_user_xxx@testuser.com`
   - Webhook Secret: (del paso 3)
   - Marcar como principal

### Tarjetas de Prueba

| Tarjeta | Número | CVV | Vencimiento |
|---------|--------|-----|-------------|
| Mastercard | 5474 9254 3267 0366 | 123 | 11/27 |
| Visa | 4509 9535 6623 3704 | 123 | 11/27 |
| Amex | 3711 803032 57522 | 1234 | 11/27 |

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Both payer and collector must be real or test users" | Email real en sandbox | Verificar `test_payer_email` en conector |
| "No se pudo obtener enlace de pago" | Conector mal configurado | Verificar conectividad, verificar es_principal |
| Webhook no procesa | URL incorrecta o secret malo | Verificar en cuenta vendedor de prueba |

---

## Seat-Based Billing

### Tracking Diario (23:55)

```sql
INSERT INTO uso_usuarios_org (organizacion_id, fecha, usuarios_activos)
SELECT organizacion_id, CURRENT_DATE, COUNT(*)
FROM usuarios WHERE activo = true
GROUP BY organizacion_id;
```

### Cobro Mensual

```
usuarios_max_periodo = MAX(usuarios_activos) durante el período
usuarios_extra = usuarios_max_periodo - usuarios_incluidos
ajuste = usuarios_extra × precio_usuario_extra
total = precio_base + ajuste
```

| Plan | Incluidos | Extra | Límite |
|------|-----------|-------|--------|
| Trial | 3 | N/A | Hard (bloquea) |
| Pro | 5 | $49/usuario | Soft (cobra) |

---

## Jobs Programados

| Hora | Job | Función |
|------|-----|---------|
| 06:00 | `procesar-cobros` | Cobros automáticos |
| 07:00 | `verificar-trials` | Expira trials vencidos |
| 08:00 | `procesar-dunning` | pendiente → grace → suspendida |
| 23:55 | `registrar-uso-usuarios` | Snapshot usuarios activos |
| */5min | `polling-suscripciones` | Fallback si webhooks fallan |
| */hora :30 | `monitorear-webhooks` | Alertas de webhooks fallidos |

---

## Endpoints Principales

```
# Suscripciones
GET    /suscripciones/mi-suscripcion
GET    /suscripciones/mi-suscripcion/calcular-prorrateo?nuevo_plan_id=X
POST   /suscripciones/mi-plan/cambiar
PATCH  /suscripciones/:id/pausar
POST   /suscripciones/:id/cancelar

# Checkout
POST   /checkout/iniciar
GET    /checkout/link/:token
POST   /checkout/link/:token/pago

# Uso
GET    /uso/resumen
GET    /uso/proyeccion
GET    /uso/verificar-limite

# Métricas
GET    /metricas/mrr
GET    /metricas/churn
GET    /metricas/suscriptores-activos
```

---

## Tablas

| Tabla | Propósito |
|-------|-----------|
| `planes_suscripcion_org` | Catálogo de planes |
| `suscripciones_org` | Suscripciones activas |
| `pagos_suscripcion` | Historial de pagos |
| `uso_usuarios_org` | Tracking diario usuarios |
| `ajustes_facturacion_org` | Log de ajustes |
| `conectores_pago_org` | Gateways por organización |

---

## Bugs Corregidos (30 Enero 2026)

### 1. Webhooks MercadoPago sin idempotencia por data_id

**Problema**: MercadoPago envía múltiples webhooks con diferente `request_id` pero el mismo `data_id`. La idempotencia solo verificaba `request_id`, causando que `meses_activo` se incrementara múltiples veces.

**Archivos corregidos**:
- `models/webhooks-procesados.model.js` - Agregado método `yaFueProcesadoExitosamente(gateway, eventType, dataId)`
- `controllers/webhooks.controller.js` - Agregada verificación por `data_id + event_type` después de verificar `request_id`

### 2. Conteo de usuarios incorrecto en Platform Billing

**Problema**: `usage-tracking.service.js` contaba usuarios de `organizacion_id` de la suscripción (Nexo Team = org 1) en vez de la organización vinculada del cliente (org 2).

**Archivo corregido**:
- `services/usage-tracking.service.js` - Ahora usa `COALESCE(c.organizacion_vinculada_id, s.organizacion_id)` para obtener la organización correcta.

### 3. RLS Policy para pagos_suscripcion sin bypass (Modelo Dogfooding)

**Problema**: El endpoint `/mi-suscripcion` no mostraba el historial de pagos. Causa raíz: la política RLS de `pagos_suscripcion` no tenía condición de bypass, y en el modelo "dogfooding" las suscripciones están en org 1 (Nexo Team) pero los usuarios clientes están en orgs diferentes (ej: org 2).

**Archivos corregidos**:
- `sql/suscripciones-negocio/01-tablas.sql` - Agregada condición bypass a políticas:
  ```sql
  CREATE POLICY pagos_select_own ON pagos_suscripcion
      FOR SELECT USING (
          (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER)
          OR (current_setting('app.bypass_rls', true) = 'true')
      );
  ```
- `models/pagos.model.js` - Agregado método `listarPorSuscripcionBypass(suscripcionId, limite)` que usa `RLSContextManager.withBypass()`
- `controllers/suscripciones.controller.js` - El endpoint `obtenerMiSuscripcion` ahora incluye `ultimos_pagos` en la respuesta

### 4. PaymentCallbackPage sin invalidación de cache

**Problema**: Después de un pago exitoso en MercadoPago, el usuario era redirigido a `/mi-plan` pero los datos mostrados no se actualizaban porque el cache de React Query no se invalidaba.

**Archivo corregido**:
- `frontend/src/pages/payment/PaymentCallbackPage.jsx` - Agregada invalidación de queries al detectar pago aprobado:
  ```javascript
  useEffect(() => {
    if (estadoFinal === 'aprobado' && !isLoading) {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MI_SUSCRIPCION], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USO_RESUMEN], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUSCRIPCIONES], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICAS_DASHBOARD], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['auth-user'], refetchType: 'active' });
    }
  }, [estadoFinal, isLoading, queryClient]);
  ```

---

## Mejoras Implementadas (30 Enero 2026)

### 1. API de Prorrateo y Downgrades Automáticos

**Endpoint**: `GET /mi-suscripcion/calcular-prorrateo?nuevo_plan_id=X`

Permite calcular el crédito/cargo antes de cambiar de plan:

- **Upgrade**: Cargo inmediato por días restantes
- **Downgrade**: Crédito aplicado en próxima factura

**Frontend**: `CambiarPlanDrawer` ahora muestra el prorrateo en tiempo real y permite downgrades directos (ya no muestra "Contactar soporte").

### 2. UI Balance de Ajustes

**Componente**: `BalanceAjustesCard`

Muestra en MiPlanPage:
- Créditos pendientes (verde)
- Cargos pendientes (naranja)
- Mensaje: "Se aplicará en tu próxima factura"

### 3. Circuit Breaker para MercadoPago

**Archivo**: `backend/app/utils/circuitBreaker.js`

Protege contra fallos en cascada:
- Estados: CLOSED → OPEN → HALF_OPEN → CLOSED
- maxFailures: 5 errores consecutivos
- resetTimeout: 60 segundos
- Sincroniza con `conectores_pago_org.errores_consecutivos`

### 4. Retry con Backoff Exponencial

**Archivo**: `backend/app/utils/retryWithBackoff.js`

Configuración para cobros:
- maxRetries: 3
- baseDelay: 2000ms
- maxDelay: 30000ms
- factor: 2 (exponencial)
- Incluye jitter para evitar thundering herd

### 5. Job de Monitoreo de Webhooks

**Archivo**: `jobs/monitorear-webhooks.job.js`

- Ejecuta cada hora (minuto 30)
- Cuenta errores de webhooks en la última hora
- Alertas:
  - Warning: >10 errores/hora
  - Crítico: >25 errores/hora

### 6. ultimos_pagos en endpoint mi-suscripcion

**Archivo**: `controllers/suscripciones.controller.js`

El endpoint `GET /mi-suscripcion` ahora incluye los últimos 5 pagos directamente en la respuesta:
```javascript
{
  ...suscripcion,
  dias_trial_restantes,
  balance_ajustes,
  ultimos_pagos: [{ id, monto, moneda, estado, fecha_pago, ... }]
}
```

Esto evita que el frontend tenga que hacer una query adicional y resuelve el problema de RLS en modelo dogfooding.

### 7. MiPlanPage con BackButton y header estándar

**Archivo**: `frontend/src/pages/suscripciones-negocio/MiPlanPage.jsx`

Refactorizado para seguir el patrón de páginas como AusenciasPage:
- Header con `BackButton` navegando a `/home`
- Icono CreditCard con colores del tema
- Layout consistente con el sistema de diseño

### 8. HistorialPagosCard acepta pagos directos

**Archivo**: `frontend/src/components/suscripciones-negocio/HistorialPagosCard.jsx`

El componente ahora acepta pagos como prop directamente o puede hacer fetch con `suscripcionId`:
```jsx
// Opción 1: Pagos directos (evita query adicional)
<HistorialPagosCard pagos={suscripcion.ultimos_pagos} />

// Opción 2: Fetch por suscripción
<HistorialPagosCard suscripcionId={123} limite={5} />
```

---

## Estado Actual de Pruebas

### Validaciones completadas (vía API y navegador)

| Test | Resultado |
|------|-----------|
| Checkout Trial → Pro con MercadoPago | ✅ Funcional |
| Activación de 9 features (vs 3 en Trial) | ✅ Correcto |
| Seat-based billing: detección usuario extra | ✅ Funcional |
| Cobro proyectado $49/usuario extra | ✅ Calculando correctamente |
| Historial de pagos visible en MiPlanPage | ✅ Funcional (bypass RLS) |
| Cache invalidation post-pago | ✅ Implementado |
| BackButton en MiPlanPage | ✅ Implementado |

### Estado de la suscripción de prueba

```
Plan: Pro ($249/mes)
Usuarios activos: 6
Usuarios incluidos: 5
Usuarios extra: 1
Cobro adicional proyectado: $49 MXN
Próximo cobro: 28 Feb 2026
Estado: excedido (120%)
```

---

## PRÓXIMA SESIÓN - Pruebas E2E desde Frontend

**IMPORTANTE**: Las pruebas anteriores se hicieron mayormente con peticiones directas a la API.
Es necesario validar el flujo completo desde la interfaz del navegador.

### Checklist de pruebas pendientes (usar Playwright/navegador)

1. **Flujo Mi Plan**
   - [ ] Ver página Mi Plan como usuario org 2
   - [ ] Verificar que muestra 6/5 usuarios correctamente
   - [ ] Verificar banner de "excedido" y cobro adicional proyectado

2. **Flujo de upgrade (desde cero)**
   - [ ] Crear organización nueva con plan Trial
   - [ ] Navegar a Mi Plan → Cambiar Plan
   - [ ] Seleccionar Plan Pro → Ir a Pagar
   - [ ] Completar pago en MercadoPago (cuenta comprador prueba)
   - [ ] Verificar redirect y activación del plan

3. **Flujo de usuarios**
   - [ ] Crear usuarios desde UI de Usuarios
   - [ ] Verificar advertencia de costo adicional al exceder 5 usuarios
   - [ ] Verificar que el contador en Mi Plan se actualiza

4. **Validar UI de conectores**
   - [ ] Ir a Configuración → Conectores de Pago (como superadmin)
   - [ ] Verificar que muestra el conector MercadoPago configurado
   - [ ] Probar botón "Verificar Conectividad"

---

## Pendientes

### Completado ✅

| Feature | Estado |
|---------|--------|
| Prorrateo cambio de plan mid-cycle | ✅ Implementado |
| API calcular-prorrateo | ✅ Implementado |
| UI downgrades con crédito automático | ✅ Implementado |
| Balance de ajustes en MiPlanPage | ✅ Implementado |
| Circuit Breaker MercadoPago | ✅ Implementado |
| Retry con backoff exponencial | ✅ Implementado |
| Job monitoreo webhooks | ✅ Implementado |
| RLS bypass para pagos_suscripcion (dogfooding) | ✅ Corregido |
| ultimos_pagos en endpoint mi-suscripcion | ✅ Implementado |
| Cache invalidation en PaymentCallbackPage | ✅ Implementado |
| MiPlanPage con BackButton y header estándar | ✅ Refactorizado |

### Alta Prioridad

| Feature | Estado |
|---------|--------|
| Pruebas E2E completas desde frontend | **PENDIENTE** |

### Media Prioridad

| Feature |
|---------|
| Notificaciones email (recibos, alertas) |
| Customer Billing (org vende a sus clientes) |

### Fórmula Prorrateo (Implementada)

```
factor = días_restantes / días_período
crédito = precio_actual × factor
cargo = precio_nuevo × factor
diferencia = cargo - crédito

diferencia > 0 → cobrar inmediato (upgrade)
diferencia < 0 → acumular crédito (downgrade)
```

---

## Próximos Pasos

1. **Reiniciar contenedores** para aplicar cambios:
   ```bash
   docker restart back front
   ```

2. **Validar endpoints** con curl/Postman:
   - `GET /mi-suscripcion` → Verificar `balance_ajustes` en respuesta
   - `GET /mi-suscripcion/calcular-prorrateo?nuevo_plan_id=X` → Verificar cálculo

3. **Probar UI de cambio de plan**:
   - Abrir CambiarPlanDrawer
   - Seleccionar plan más barato
   - Verificar que muestra crédito (no modal soporte)

4. **Verificar logs** del circuit breaker y retry

5. **PASO FINAL: Pruebas E2E completas** (Playwright/navegador):
   - Flujo completo checkout
   - Flujo upgrade/downgrade
   - Flujo de usuarios y seat-based billing
   - Validar UI conectores MercadoPago

---

## Credenciales Actuales (Nexo Team - Sandbox)

```
# Cuenta Comprador de Prueba MercadoPago
Email: test_user_2716725750605322996@testuser.com
Password: UCgyF4L44D

# Usuario Admin Org 2 (para pruebas)
Email: arellanestorillo@gmail.com
Password: Enrique23

# SuperAdmin
Email: arellanestorillo@yahoo.com
Password: Enrique23
```

---

**Estado**: Checkout funcional, Prorrateo implementado, Circuit Breaker activo, Historial pagos con bypass RLS | **Última revisión**: 30 Enero 2026 (sesión PM)
