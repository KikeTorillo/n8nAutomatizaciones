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

---

## Endpoints Principales

```
# Suscripciones
GET    /suscripciones/mi-suscripcion
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

## Pendientes

### Alta Prioridad

| Feature | Estado |
|---------|--------|
| Ajuste por usuarios extra (probar exceder límite) | Por probar |
| Prorrateo cambio de plan mid-cycle | Por implementar |

### Media Prioridad

| Feature |
|---------|
| Retry cuando init_point viene vacío |
| Notificaciones email (recibos, alertas) |
| Customer Billing (org vende a sus clientes) |

### Fórmula Prorrateo

```
factor = días_restantes / días_período
crédito = precio_actual × factor
cargo = precio_nuevo × factor
diferencia = cargo - crédito

diferencia > 0 → cobrar inmediato (upgrade)
diferencia < 0 → acumular crédito (downgrade)
```

---

## Credenciales Actuales (Nexo Team - Sandbox)

```
# Cuenta Comprador de Prueba
Email: test_user_2716725750605322996@testuser.com
Password: UCgyF4L44D
```

---

**Estado**: Checkout funcional | **Última revisión**: 30 Enero 2026
