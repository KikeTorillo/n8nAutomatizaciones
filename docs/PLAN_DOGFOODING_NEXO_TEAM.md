# Plan: Dogfooding Interno - Nexo Team

**Fecha:** 23 Enero 2026
**Estado:** Checkout MercadoPago funcional con Test Users

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

## FASE 12: Configuración Test Users MercadoPago ✅ COMPLETADO

### Problema Original

El checkout fallaba con error: **"Una de las partes con la que intentas hacer el pago es de prueba"**

**Causa:** Las credenciales `TEST-xxx` son sandbox de cuenta REAL. Al pagar con test user comprador, MP rechazaba por incompatibilidad (vendedor real ↔ comprador test).

### Solución Implementada

Usar credenciales de **Test User Vendedor** (ambos test users = compatibles).

### Test Users Configurados (México)

| Rol | User ID | Email |
|-----|---------|-------|
| **Vendedor** | 2959473295 | `test_user_8490440797252778890@testuser.com` |
| **Comprador** | TESTUSER2716725750605322996 | `test_user_2716725750605322996@testuser.com` |

**Contraseña comprador:** `UCgyF4L44D`

### Variables de Entorno

```env
# Credenciales Test User Vendedor
MERCADOPAGO_ENVIRONMENT=sandbox
MERCADOPAGO_SANDBOX_ACCESS_TOKEN=APP_USR-4508472379774132-012314-...
MERCADOPAGO_PUBLIC_KEY=APP_USR-bedf3faf-...

# Email Test User Comprador (requerido en sandbox)
MERCADOPAGO_TEST_PAYER_EMAIL=test_user_2716725750605322996@testuser.com
```

### Lógica en checkout.controller.js

```javascript
let emailPagador;
if (process.env.MERCADOPAGO_ENVIRONMENT === 'sandbox') {
    // Test users requieren email de test user
    emailPagador = process.env.MERCADOPAGO_TEST_PAYER_EMAIL;
} else {
    // Producción: email del usuario
    emailPagador = suscriptorExternoFinal?.email || req.user.email;
}
```

### Restricciones de MercadoPago con Test Users

| Restricción | Descripción |
|-------------|-------------|
| `payer_email` obligatorio | Sí |
| Debe ser test user | Si vendedor es test user, comprador también |
| Mismo país | Ambos deben ser de México |
| No auto-pago | Vendedor ≠ Comprador |

---

## Flujo de Checkout Validado ✅

```
Frontend (/planes)
    │
    ▼
Seleccionar Plan Pro → Click "Pagar $249"
    │
    ▼
Backend: POST /checkout/iniciar
    ├── Crea suscripción (estado: pendiente_pago)
    ├── Crea preferencia en MP (con MERCADOPAGO_TEST_PAYER_EMAIL)
    └── Retorna init_point
    │
    ▼
Redirect a MercadoPago
    ├── Login con Test User Comprador
    ├── Pagar con "Dinero disponible"
    └── Confirmar
    │
    ▼
MercadoPago: ¡Listo! Ya te suscribiste
    ├── status=approved
    └── Próximo pago en 1 mes
```

---

## Próximo Paso: Prueba E2E Completa

### Validar

| Paso | Verificar |
|------|-----------|
| 1. Checkout | ✅ Funciona |
| 2. Webhook MP | Que active la suscripción |
| 3. Estado en BD | `pendiente_pago` → `activa` |
| 4. Org vinculada | `plan_actual` y `modulos_activos` actualizados |

### Pendiente: Configurar Webhook en MercadoPago

Para que MP notifique al backend cuando se procese el pago:

1. Ir a [MercadoPago Developers](https://www.mercadopago.com.mx/developers/panel)
2. Crear aplicación o usar existente
3. Configurar Webhook URL: `https://<tunnel>/api/v1/mercadopago/webhook`
4. Seleccionar eventos: `payment`, `subscription_preapproval`

---

## Arquitectura Futura: Dos Páginas de Checkout

### Página Pública: `/planes`
- Para visitantes sin autenticar
- Muestra todos los planes (Trial y Pro)

### Página Privada: `/mi-plan`
- Para usuarios autenticados
- Muestra plan actual + opciones upgrade
- Acceso desde TrialBanner

| Componente | Estado |
|------------|--------|
| `PlanesPublicPage.jsx` | ✅ Existe |
| `MiPlanPage.jsx` | Pendiente |

---

## Planes Activos

| Plan | Precio | Límites |
|------|--------|---------|
| **Trial** | $0 (14 días) | 50 citas, 2 profesionales, 10 servicios |
| **Pro** | $249/mes | Ilimitado |

---

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `checkout.controller.js` | Flujo de checkout con MP |
| `mercadopago.service.js` | Cliente MP multi-tenant |
| `config/constants.js` | `NEXO_TEAM_ORG_ID` |
| `PlanesPublicPage.jsx` | Página pública de planes |
| `CheckoutModal.jsx` | Modal de confirmación |

---

**Última Actualización:** 23 Enero 2026
