# Plan: Dogfooding Interno - Nexo Team

**Fecha:** 24 Enero 2026
**Estado:** Flujo E2E MercadoPago validado - Webhooks funcionando

---

## Concepto

Nexo Team (org_id=1) gestiona las organizaciones de la plataforma como clientes usando el módulo **suscripciones-negocio**.

```
Nexo Team (org_id=1)
├── Clientes CRM = Organizaciones de la plataforma
├── Suscripciones = Contratos con cada org
└── SuperAdmin Dashboard = Métricas SaaS (MRR, Churn, etc.)
```

---

## Configuración MercadoPago (CRÍTICO)

### 1. Conectores de Pago (Multi-Tenant)

Las credenciales se almacenan encriptadas en `conectores_pago_org`, NO en variables de entorno.

**Configurar desde:** Configuración > Conectores de Pago

| Campo | Valor |
|-------|-------|
| Gateway | `mercadopago` |
| Access Token | `APP_USR-xxx` (del Test User Vendedor) |
| Public Key | `APP_USR-xxx` |
| Webhook Secret | (generado por MP al configurar webhooks) |

### 2. Variables de Entorno (.env)

```env
# Solo estas variables son necesarias
MERCADOPAGO_ENVIRONMENT=sandbox
MERCADOPAGO_TEST_PAYER_EMAIL=test_user_2716725750605322996@testuser.com

# Clave para encriptar credenciales en BD
CREDENTIAL_ENCRYPTION_KEY=<64_chars_hex>
```

### 3. Configuración Webhooks en Panel MercadoPago

**IMPORTANTE:** Configurar en cuenta del **Test User Vendedor**, NO en cuenta principal.

1. Ir a https://www.mercadopago.com.mx/developers/panel
2. Seleccionar la aplicación
3. Ir a **Webhooks > Modo productivo** (NO Modo de prueba)
4. URL de producción: `https://<tu-tunnel>/api/v1/suscripciones-negocio/webhooks/mercadopago/1`
5. Eventos a habilitar:
   - **Pagos** (payments)
   - **Planes y suscripciones** (subscription_preapproval)
6. Guardar y copiar el `webhook_secret`

### 4. Test Users México

| Rol | User ID | Contraseña |
|-----|---------|------------|
| **Vendedor** | TESTUSER8490440797252778890 | `GBpO6sgCkn` |
| **Comprador** | TESTUSER2716725750605322996 | `UCgyF4L44D` |

**Regla:** Si vendedor es test user, comprador también debe serlo.

---

## Flujo E2E Validado

```
Frontend (/planes)
    │
    ▼
Seleccionar Plan Pro → Click "Pagar $249"
    │
    ▼
Backend: POST /checkout/iniciar
    ├── Crea suscripción (estado: pendiente_pago)
    ├── Crea preapproval en MP
    └── Retorna init_point
    │
    ▼
Redirect a MercadoPago
    ├── Login con Test User Comprador
    ├── Seleccionar tarjeta guardada
    └── Confirmar
    │
    ▼
MercadoPago: ¡Listo! Ya te suscribiste
    ├── status=approved
    └── Webhook enviado automáticamente
    │
    ▼
Backend recibe webhook
    ├── Valida firma HMAC
    ├── Cambia estado: pendiente_pago → activa
    └── Actualiza org vinculada (plan_actual, modulos_activos)
    │
    ▼
Frontend: Callback /payment/callback
    └── Muestra "Pago Exitoso"
```

**Resultado verificado (24 Ene 2026):**
- Suscripción ID: 3
- Estado: `activa`
- Gateway ID: `585e9984a96745d9b012f69bd84e9915`
- Webhooks recibidos: `subscription_preapproval` + `payment`

---

## Planes Activos

| Plan | Precio | Características |
|------|--------|-----------------|
| **Trial** | $0 (14 días) | agendamiento, inventario, pos |
| **Pro** | $249/mes | Todos los módulos |

---

## Próximos Pasos

### 1. Validar Módulo Completo

| Área | Verificar |
|------|-----------|
| Duplicados | Que no se creen suscripciones duplicadas al reintentar pago |
| Asociación correcta | Cliente ↔ Suscripción ↔ Organización vinculada |
| Cancelación | Flujo de cancelación desde MP y desde Nexo |
| Renovación | Cobro automático al vencer período |

### 2. Comparar con Odoo

| Feature Odoo | Estado Nexo |
|--------------|-------------|
| Planes con precios múltiples | ✅ Implementado |
| Cupones de descuento | ✅ Implementado |
| Período de prueba | ✅ Implementado |
| Métricas MRR/Churn | ✅ Implementado |
| Upgrade/Downgrade | Pendiente |
| Proration (prorrateo) | Pendiente |

### 3. Página Mi Plan

| Componente | Estado |
|------------|--------|
| `PlanesPublicPage.jsx` | ✅ Existe |
| `MiPlanPage.jsx` (upgrade desde trial) | Pendiente |

---

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `checkout.controller.js` | Flujo checkout + creación preapproval |
| `webhooks.controller.js` | Recibe y procesa webhooks MP |
| `mercadopago.service.js` | Cliente MP multi-tenant |
| `conectores.controller.js` | CRUD conectores de pago |
| `suscripciones.model.js` | Estados, transiciones, bypass RLS |

---

**Última Actualización:** 24 Enero 2026
