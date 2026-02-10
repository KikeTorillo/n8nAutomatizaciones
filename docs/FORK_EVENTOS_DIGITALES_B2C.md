# Fork Eventos Digitales — Plataforma B2C

## Objetivo

Plataforma standalone donde cualquier persona crea invitaciones digitales (bodas, XV, bautizos, cumpleaños), paga con MercadoPago (pago único) y comparte con sus invitados.

---

## Flujo B2C

### Anfitrión nuevo
```
Landing → Wizard (tipo + plantilla) → Editor borrador (localStorage, sin auth, sin uploads)
  → "Publicar" → CheckoutModal → "Crear cuenta" → Registro → Quick onboarding
  → /invitaciones/precios → Auto-checkout → MercadoPago → Callback
  → /invitaciones/editor → ConvertirBorradorModal → Editor real (con uploads)
```

### Anfitrión existente
```
CheckoutModal → "Ya tengo cuenta" → /login?returnTo=/invitaciones/precios
  → Auto-checkout → MercadoPago → Callback → Editor real
```

### Invitado (sin auth)
```
Link → Invitación animada → RSVP → Mesa de regalos → Fotos (limitado por plan) → Felicitación
```

---

## Arquitectura — Qué conservar en el fork

### Backend (4 módulos)

| Módulo | Función | Notas fork |
|--------|---------|------------|
| `auth` | Registro, login, activación, onboarding quick | Mantener `POST /onboarding/quick` (crea org mínima solo con módulo eventos-digitales) |
| `core` | Organizaciones, usuarios | 1 user = 1 org en B2C |
| `eventos-digitales` | Invitaciones, galería, RSVP, felicitaciones | Módulo principal. `public.controller.js` tiene `LimitesHelper` para fotos |
| `suscripciones-negocio` | Planes, checkout, pagos, webhooks, conectores | Bifurcación `tipo_cobro === 'unico'` → Checkout Pro. Webhook en `/webhooks/mercadopago/:orgId` |

**Eliminar**: agendamiento, inventario, POS, contabilidad, personas, website, marketplace, chatbots, workflows

### Frontend

| Carpeta | Función | Conservar |
|---------|---------|-----------|
| `components/ui/` | Atomic Design | Todo |
| `components/editor-framework/` | Store factory, bloques, canvas | Todo |
| `components/shared/` | UnsplashPicker, AddToCalendar, InvitacionDinamica | Todo |
| `components/checkout/` | CheckoutModal (prop `returnTo` para B2C) | Todo |
| `features/auth/` | Auth store, páginas, API | Todo |
| `pages/invitaciones/` | Landing, wizard, precios, dashboard B2C | Todo |
| `pages/eventos-digitales/editor/` | Editor real + borrador | Todo |
| `pages/payment/` | Callback MercadoPago | Todo |
| `hooks/factories/` | createCRUDHooks, createStatusMutationHook | Todo |
| `hooks/config/` | queryKeys, errorHandlerFactory | Todo |
| `hooks/suscripciones-negocio/` | usePlanesPublicos, useCheckout | Todo |
| `hooks/eventos-digitales/` | Hooks del módulo | Todo |
| `store/` | authStore, permisosStore, createEditorStore | Todo |
| `services/api/` | client + módulos relevantes | Solo: auth, eventos-digitales, suscripciones-negocio, website (Unsplash) |

**Eliminar**: `pages/` y `hooks/` de módulos no listados, `pages/planes/` (B2B)

### SQL (2 triggers en `organizaciones`)

| Archivo | Trigger | Función |
|---------|---------|---------|
| `03-datos-nexo-team.sql` | `trigger_crear_planes_nexo_team` | Crea plan enterprise + cliente interno + suscripción (necesario para superadmin) |
| `09-planes-invitaciones-b2c.sql` | `trigger_crear_planes_b2c_invitaciones` | Crea 3 planes pago único (B2C) |

Ambos se disparan en `AFTER INSERT ON organizaciones WHERE codigo_tenant = 'nexo-team'`. En el fork: eliminar planes trial/pro del `03`, conservar enterprise (superadmin lo necesita).

---

## Planes B2C

| Plan | Código | Precio | Eventos | Invitados | Fotos | Extras |
|------|--------|--------|---------|-----------|-------|--------|
| Básico | `invitacion-basico` | $199 MXN | 1 | 100 | 50 | RSVP, WhatsApp |
| Premium | `invitacion-premium` | $399 MXN | 1 | 500 | 200 | + Mesa regalos, Seating chart |
| Ilimitado | `invitacion-ilimitado` | $699 MXN | 3 | Ilimitados | Ilimitadas | + Soporte prioritario |

Separación: `/invitaciones/precios` filtra `tipo_cobro === 'unico'`, `/planes` filtra `tipo_cobro !== 'unico'`.

---

## localStorage Keys

| Key | Contenido | Ciclo de vida |
|-----|-----------|---------------|
| `nexo-borrador-invitacion` | Borrador completo (plantilla, bloques, tema) | Wizard → Editor → Limpiado al convertir |
| `nexo_origen_b2c` | `"true"` | CheckoutModal → ActivarCuentaPage consume |
| `nexo_plan_seleccionado` | `{ plan_id, timestamp }` | CheckoutModal → PreciosInvitacionesPage auto-checkout (TTL 1h) |

---

## MercadoPago — Configuración

### Conector requerido
Configurar en **Suscripciones → Conectores** de Nexo Team (org 1):
- **Gateway**: MercadoPago
- **Entorno**: Sandbox (pruebas) / Production
- **Access Token**: `TEST-...` o `APP_USR-...`
- **Webhook Secret**: Clave secreta de la app MP (para validación HMAC)
- **Email pagador prueba**: Solo sandbox (`test_user_xxx@testuser.com`)
- **Marcar como principal**

### Webhook URL (configurar en panel MP)
```
https://<dominio>/api/v1/suscripciones-negocio/webhooks/mercadopago/1
```

### Flujo de pago
1. Backend crea `preference` MP con `notification_url` → retorna `init_point`
2. Frontend redirige a MP → usuario paga → MP redirige a `/payment/callback`
3. MP envía webhook → backend valida HMAC → activa suscripción

Sin webhook configurado: el callback URL muestra "Exitoso" por `collection_status` pero la suscripción queda `pendiente_pago` hasta recibir webhook.

---

## Pendiente

- [ ] Configurar conector MP sandbox y probar flujo de pago completo
- [ ] SEO / Open Graph preview para links compartidos
- [ ] Email de confirmación RSVP
- [ ] Analytics (eventos creados, RSVPs, conversión)
- [ ] Tests E2E del flujo completo B2C
