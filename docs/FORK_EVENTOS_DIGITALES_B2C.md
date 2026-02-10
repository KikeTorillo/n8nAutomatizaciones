# Fork Eventos Digitales — Plataforma B2C

## Objetivo

Plataforma standalone donde cualquier persona crea invitaciones digitales (bodas, XV, bautizos, cumpleaños), paga por ellas con MercadoPago (Checkout Pro / pagos únicos) y comparte con sus invitados.

---

## Estado Actual (Feb 2026)

### Implementado dentro de Nexo (sin fork aún)

El frontend B2C se construyó **dentro de Nexo** como módulo `pages/invitaciones/`, reutilizando la infraestructura existente.

### Fases completadas

| Fase | Descripción | Estado |
|------|-------------|--------|
| Editor anónimo | Borrador localStorage sin auth | Completo |
| Gate B2C | Registro quick + pago + conversión borrador | Completo |
| Upload bloqueado en borrador | `useImageHandlers` con `enabled` param | Completo |
| Checkout B2C con auth | CheckoutModal `returnTo` + auto-checkout | Completo |
| Límite fotos galería pública | `LimitesHelper` en `public.controller.js` | Completo |
| Planes B2C en BD | 3 planes pago único (SQL idempotente) | Completo |
| Separación B2B/B2C | Filtros en PlanesPublicPage y PreciosInvitacionesPage | Completo |

---

## Flujo Completo B2C

### Anfitrión nuevo (sin cuenta)
```
Landing → Wizard (tipo + plantilla)
  → Editor borrador (localStorage, sin auth, uploads DESHABILITADOS)
  → "Publicar" → Gate modal
  → "Crear cuenta gratis" (guarda nexo_origen_b2c + nexo_plan_seleccionado) → /registro
  → Email activación → Crear contraseña
  → Auto-onboarding quick (sin wizard empresarial)
  → /invitaciones/precios → Auto-checkout (lee nexo_plan_seleccionado) → Pagar (MercadoPago)
  → /payment/callback → "Continuar con mi invitación"
  → /invitaciones/editor → Auto-open ConvertirBorradorModal
  → nombre + fecha → Crear evento BD → Editor real (/eventos-digitales/:id/editor, uploads HABILITADOS)
```

### Anfitrión existente (con cuenta)
```
Editor borrador → "Publicar" → Gate modal
  → "Ya tengo cuenta" → /login?returnTo=/invitaciones/precios
  → Vuelve a precios → Auto-checkout (lee nexo_plan_seleccionado) → Pagar
  → Callback → Continuar → ConvertirBorradorModal → Editor real
```

### Anfitrión directo (sin borrador)
```
/invitaciones/precios → Elegir plan
  → Sin auth: CheckoutModal muestra "Crear cuenta" / "Ya tengo cuenta"
  → Con auth: CheckoutModal muestra formulario de pago
  → Pagar → Crear evento desde cero
```

### Invitado (sin auth)
```
Recibir link → Ver invitación animada → RSVP → Ver mesa de regalos
  → Agregar al calendario → (Post-evento) Subir fotos (limitado por plan) → Enviar felicitación
```

---

## Arquitectura

### Páginas públicas
- **Landing**: 7 secciones (Hero, ComoFunciona, TiposEvento, PlantillasCarousel, Caracteristicas, Testimonios, CTA)
- **Tipos**: TipoEventoPage (genérica por slug), EjemplosPage (galería filtrable)
- **Precios**: PreciosInvitacionesPage (planes pago único + FAQ + CheckoutModal con `returnTo`)
- **Wizard**: CrearEventoWizardPage (2 pasos: tipo → plantilla → localStorage)
- **Editor borrador**: BorradorEditorPage (reutiliza containers del editor B2B, uploads deshabilitados)

### Dashboard protegido
- **MisEventosPage**: Grid cards de eventos
- **EventoDashboardPage**: Stats + countdown + acciones
- **InvitadosManagerPage**: Tabla + CSV import + filtros RSVP
- **CompartirPage**: Link + WhatsApp + QR + RSVPTracker
- **GaleriaModeracionPage**: Grid fotos + moderación

### Rutas
```
invitaciones.routes.jsx
Públicas: landing, precios, bodas, xv-anos, bautizos, cumpleanos, ejemplos, crear, editor
Protegidas: mis-eventos, evento/:id, evento/:id/invitados, evento/:id/compartir, evento/:id/galeria
```
`/invitaciones` en `RUTAS_EXENTAS` de SubscriptionGuard.

---

## Editor Anónimo

| Archivo | Función |
|---------|---------|
| `editor/hooks/useBorradorStorage.js` | CRUD localStorage (key: `nexo-borrador-invitacion`) |
| `editor/context/BorradorEditorContext.jsx` | Tercer variant de EditorContext (datos locales, autosave 1.5s) |
| `editor/BorradorEditorPage.jsx` | Página wrapper, reutiliza containers B2B |
| `editor/components/BorradorBanner.jsx` | Banner "Borrador local" con CTA |
| `editor/components/ConvertirBorradorModal.jsx` | Gate (registro/login) + formulario conversión |

**Decisiones técnicas:**
- **Noop Zustand store** para `getFreePositionStore()` — containers lo llaman como hook selector
- **`isBorrador` guard**: `usePlantillas({}, { enabled: !isBorrador })` + `usePlantillasPublicas()` evita 401 sin auth
- **Auto-open modal**: `useEffect` + `autoOpenedRef` detecta `isAuthenticated + borrador` al volver del login/pago
- **Uploads deshabilitados**: `useImageHandlers({ enabled: !isBorrador })` retorna `null` para upload/unsplash → editores ocultan botones

---

## Gate B2C — Registro + Pago + Conversión

### localStorage Keys

| Key | Contenido | Ciclo de vida |
|-----|-----------|---------------|
| `nexo-borrador-invitacion` | `{ version, tipoEvento, plantilla, bloques, tema, updatedAt }` | Wizard → Editor → Limpiado al convertir |
| `nexo_origen_b2c` | `"true"` | CheckoutModal (con `returnTo`) → ActivarCuentaPage consume y elimina |
| `nexo_plan_seleccionado` | `{ plan_id, plan_nombre, periodo, timestamp }` | CheckoutModal → PreciosInvitacionesPage auto-checkout (1h TTL) |

### Backend: Onboarding Quick

`POST /auth/onboarding/quick` (autenticado)
- Schema: solo `nombre_negocio` opcional
- Crea org mínima: módulo `eventos-digitales` únicamente, sin estado/ciudad
- Reutiliza `OnboardingService.completar()` internamente
- Retorna nuevos tokens JWT con `organizacion_id`

### Archivos modificados para el Gate

| Archivo | Cambio |
|---------|--------|
| `auth/schemas/activacion.schemas.js` | Schema `onboardingQuick` |
| `auth/controllers/auth.controller.js` | Método `onboardingQuick` |
| `auth/routes/auth-onboarding.js` | Ruta `POST /onboarding/quick` |
| `features/auth/api/auth.api.js` | Método `onboardingQuick()` |
| `features/auth/pages/ActivarCuentaPage.jsx` | Detecta flag B2C → auto-onboard → redirect precios |
| `pages/payment/PaymentCallbackPage.jsx` | Detecta borrador → "Continuar con mi invitación" |

---

## Checkout B2C

### Flujo sin auth
1. Usuario en `/invitaciones/precios` hace clic en un plan
2. Se abre `CheckoutModal` con prop `returnTo="/invitaciones/precios"`
3. Modal muestra "Crear cuenta gratis" / "Ya tengo cuenta"
4. Al elegir, guarda `nexo_plan_seleccionado` + `nexo_origen_b2c` en localStorage
5. Login redirige a `returnTo` (precios), Registro pasa por ActivarCuentaPage (quick onboarding) → precios

### Flujo con auth
1. Usuario autenticado hace clic en un plan → CheckoutModal abre directo a formulario de pago
2. Pago vía MercadoPago → callback → continuar

### Auto-checkout
`PreciosInvitacionesPage` tiene un `useEffect` que al detectar `isAuthenticated + nexo_plan_seleccionado`:
- Lee y valida el plan guardado (TTL 1 hora)
- Auto-selecciona el plan y abre CheckoutModal
- Limpia localStorage

### Archivos clave

| Archivo | Cambio |
|---------|--------|
| `components/checkout/CheckoutModal.jsx` | Prop `returnTo`, guarda `nexo_origen_b2c`, login con `?returnTo=` |
| `pages/invitaciones/precios/PreciosInvitacionesPage.jsx` | Auto-checkout useEffect, filtro `tipo_cobro === 'unico'`, `returnTo` |
| `pages/planes/PlanesPublicPage.jsx` | Filtro `tipo_cobro !== 'unico'` (excluye planes B2C) |

---

## Entitlements — Límites del Plan

### Límite de fotos en galería pública

La ruta pública `POST /evento/:slug/:token/galeria` verifica el límite antes de aceptar uploads:

```js
// public.controller.js — en subirFoto() y subirFotoConArchivo()
await LimitesHelper.verificarLimiteFotosGaleriaOLanzar(evento.organizacion_id, evento.id, 1);
```

`LimitesHelper` usa `withBypass` internamente → funciona sin contexto RLS en rutas públicas.

### Upload deshabilitado en editor borrador

```js
// useImageHandlers.js — framework level
export function useImageHandlers({ entity, onUpdate, uploadConfig, enabled = true }) {
  // ... lógica existente ...
  return {
    openUnsplash: enabled ? openUnsplash : null,       // null → editores ocultan botón
    handleUploadImage: enabled ? handleUploadImage : null,
    // ...
  };
}

// useInvitacionEditorContent.js — pasa isBorrador
const { isBorrador } = useInvitacionEditor();
useImageHandlers({ ..., enabled: !isBorrador });
```

---

## Planes B2C

### SQL: `sql/suscripciones-negocio/09-planes-invitaciones-b2c.sql`

3 planes bajo Nexo Team (org 1) con `tipo_cobro = 'unico'`:

| Plan | Código | Precio | Eventos | Invitados | Fotos | Extras |
|------|--------|--------|---------|-----------|-------|--------|
| Básico | `invitacion-basico` | $199 MXN | 1 | 100 | 50 | RSVP, WhatsApp |
| Premium | `invitacion-premium` | $399 MXN | 1 | 500 | 200 | + Mesa regalos, Seating chart |
| Ilimitado | `invitacion-ilimitado` | $699 MXN | 3 | Ilimitados | Ilimitadas | + Soporte prioritario |

Idempotente: verifica existencia antes de insertar. Se ejecuta en `init-data.sh`.

### Separación B2B/B2C

- `/planes` (B2B): Filtra `tipo_cobro !== 'unico'` → solo muestra planes recurrentes (Pro, Trial)
- `/invitaciones/precios` (B2C): Filtra `tipo_cobro === 'unico'` → solo muestra planes pago único

---

## Modelo de Negocio

- **Pago único por invitación** (Checkout Pro de MercadoPago)
- 3 niveles de plan con límites diferenciados (eventos, invitados, fotos)
- Upsell: mesa de regalos y seating chart solo en Premium+

---

## Decisión Pendiente: Fork vs Módulo

**Recomendación**: Mantener como módulo hasta validar product-market fit. Si escala → fork conservando:

### Módulos backend a conservar
- `auth` — registro, login, activación, onboarding quick
- `core` — organizaciones, usuarios (1 user = 1 org)
- `eventos-digitales` — invitaciones, galería, RSVP, felicitaciones
- `suscripciones-negocio` — planes, pagos, MercadoPago

### Frontend a conservar
- `components/ui/` — Atomic Design completo
- `components/editor-framework/` — Store factory, bloques, canvas
- `components/shared/` — UnsplashPicker, AddToCalendar, InvitacionDinamica
- `components/checkout/` — CheckoutModal
- `features/auth/` — Auth store, páginas, API
- `pages/invitaciones/` — Landing, wizard, precios, dashboard
- `pages/eventos-digitales/editor/` — Editor real + borrador
- `pages/payment/` — Callback MercadoPago
- `hooks/factories/` — createCRUDHooks, createStatusMutationHook
- `hooks/config/` — queryKeys, errorHandlerFactory, queryConfig
- `hooks/suscripciones-negocio/` — usePlanesPublicos, useCheckout
- `store/` — authStore, permisosStore, createEditorStore
- `services/api/` — client, módulos relevantes

### Qué eliminar en fork
- Módulos: agendamiento, inventario, POS, contabilidad, personas, website, marketplace
- `pages/` de módulos eliminados
- `hooks/` de módulos eliminados
- `services/api/modules/` de módulos eliminados

---

## Pendiente

- [ ] SEO / Open Graph preview para links compartidos
- [ ] Email de confirmación RSVP
- [ ] Analytics (eventos creados, RSVPs, conversión)
- [ ] Webhook MercadoPago para confirmar pago asíncrono
- [ ] Tests E2E del flujo completo B2C
