# Fork Eventos Digitales — Plataforma B2C

## Objetivo

Plataforma standalone donde cualquier persona crea invitaciones digitales (bodas, XV, bautizos, cumpleaños), paga por ellas con MercadoPago (Checkout Pro / pagos únicos) y comparte con sus invitados.

---

## Estado Actual (Feb 2026)

### Implementado dentro de Nexo (sin fork aún)

El frontend B2C se construyó **dentro de Nexo** como módulo `pages/invitaciones/`, reutilizando la infraestructura existente.

---

## Flujo Completo B2C

### Anfitrión nuevo (sin cuenta)
```
Landing → Wizard (tipo + plantilla)
  → Editor borrador (localStorage, sin auth)
  → "Publicar" → Gate modal
  → "Crear cuenta gratis" (guarda flag nexo_origen_b2c) → /registro
  → Email activación → Crear contraseña
  → Auto-onboarding quick (sin wizard empresarial)
  → /invitaciones/precios → Elegir plan → Pagar (MercadoPago)
  → /payment/callback → "Continuar con mi invitación"
  → /invitaciones/editor → Auto-open ConvertirBorradorModal
  → nombre + fecha → Crear evento BD → Editor real (/eventos-digitales/:id/editor)
```

### Anfitrión existente (con cuenta)
```
Editor borrador → "Publicar" → Gate modal
  → "Ya tengo cuenta" → /login?returnTo=/invitaciones/editor
  → Vuelve al editor → Auto-open ConvertirBorradorModal → Crear evento BD
```

### Invitado (sin auth)
```
Recibir link → Ver invitación animada → RSVP → Ver mesa de regalos
  → Agregar al calendario → (Post-evento) Subir fotos → Enviar felicitación
```

---

## Arquitectura

### Páginas públicas
- **Landing**: 7 secciones (Hero, ComoFunciona, TiposEvento, PlantillasCarousel, Caracteristicas, Testimonios, CTA)
- **Tipos**: TipoEventoPage (genérica por slug), EjemplosPage (galería filtrable)
- **Precios**: PreciosInvitacionesPage (planes + FAQ + CheckoutModal)
- **Wizard**: CrearEventoWizardPage (2 pasos: tipo → plantilla → localStorage)
- **Editor borrador**: BorradorEditorPage (reutiliza containers del editor B2B)

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

---

## Gate B2C — Registro + Pago + Conversión

### localStorage Keys

| Key | Contenido | Ciclo de vida |
|-----|-----------|---------------|
| `nexo-borrador-invitacion` | `{ version, tipoEvento, plantilla, bloques, tema, updatedAt }` | Wizard → Editor → Limpiado al convertir |
| `nexo_origen_b2c` | `"true"` | Gate modal → ActivarCuentaPage consume y elimina |
| `nexo_plan_seleccionado` | `{ plan_id, plan_nombre, periodo, timestamp }` | CheckoutModal → Se usa post-login |

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

## Modelo de Negocio

- **Pago único por invitación** (Checkout Pro de MercadoPago)
- Sin planes ni suscripciones — el usuario paga una vez para publicar su invitación

---

## Decisión Pendiente: Fork vs Módulo

**Recomendación**: Mantener como módulo hasta validar product-market fit. Si escala → fork conservando `auth`, `core` (1 user = 1 org), `eventos-digitales`, `suscripciones-negocio`, `editor-framework`, `ui/`, `shared/`.

---

## Pendiente

- [ ] SEO / Open Graph preview para links compartidos
- [ ] Email de confirmación RSVP
- [ ] Analytics (eventos creados, RSVPs, conversión)
