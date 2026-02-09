# Fork Eventos Digitales — Plataforma B2C

## Objetivo

Plataforma standalone donde cualquier persona crea invitaciones digitales (bodas, XV, bautizos, cumpleaños), paga por ellas con MercadoPago (Checkout Pro / pagos únicos) y comparte con sus invitados.

---

## Estado Actual (Feb 2026)

### Implementado dentro de Nexo (sin fork aún)

El frontend B2C se construyó **dentro de Nexo** como módulo `pages/invitaciones/`, reutilizando la infraestructura existente. No se ha hecho fork — todo convive con el ERP.

#### Frontend B2C — Páginas públicas
- **Landing**: 7 secciones (Hero, ComoFunciona, TiposEvento, PlantillasCarousel, Caracteristicas, Testimonios, CTA)
- **Tipos**: TipoEventoPage (genérica por slug), EjemplosPage (galería filtrable)
- **Precios**: PreciosInvitacionesPage (planes + FAQ + CheckoutModal)

#### Frontend B2C — Dashboard (protegido)
- **MisEventosPage**: Grid de cards de eventos del anfitrión
- **EventoDashboardPage**: Stats + countdown + acciones rápidas
- **InvitadosManagerPage**: Tabla + agregar + importar CSV + filtros RSVP
- **CompartirPage**: Link copiable + WhatsApp + QR + RSVPTracker
- **GaleriaModeracionPage**: Grid fotos + aprobar/ocultar/eliminar

#### Editor Anónimo B2C (completado)
Flujo estilo invitio.events — el visitante edita sin registrarse:

```
Landing → Wizard (2 pasos: tipo + plantilla)
  → Guardar borrador en localStorage
  → Editor completo (/invitaciones/editor — PÚBLICO)
  → Editar bloques, colores, decoraciones
  → "Publicar" / "Guardar" → Gate modal → Login
  → Convertir borrador → evento real en BD
  → Redirigir a editor B2B (/eventos-digitales/:id/editor)
```

**Archivos clave:**

| Archivo | Función |
|---------|---------|
| `editor/hooks/useBorradorStorage.js` | localStorage (key: `nexo-borrador-invitacion`, version: 1) |
| `editor/context/BorradorEditorContext.jsx` | Tercer variant de EditorContext (misma shape, datos locales) |
| `editor/BorradorEditorPage.jsx` | Página wrapper, reutiliza containers del editor B2B |
| `editor/components/BorradorBanner.jsx` | Banner "Borrador local" con CTA |
| `editor/components/ConvertirBorradorModal.jsx` | Gate: login prompt / formulario datos → crear evento |

**Decisiones técnicas:**
- **Noop Zustand store** para `getFreePositionStore()` — containers lo llaman como hook selector, retornar `null` crashea
- **`createCRUDHooks.useList`** acepta `options?: { enabled?: boolean }` — necesario para desactivar `usePlantillas` sin auth
- **SidebarContainer + DrawersContainer + InvitacionTemplateGallery** usan `isBorrador` del contexto para elegir `usePlantillasPublicas` vs `usePlantillas` (evita 401 → hard redirect a `/login` del interceptor axios)

#### Backend — Pagos únicos (Checkout Pro)
- `tipo_cobro = 'unico'` implementado en suscripciones-negocio
- Terminal Point (POS) integrada
- Planes B2C configurados

#### Rutas
```
invitaciones.routes.jsx — 9 públicas + 5 protegidas
Públicas: landing, precios, bodas, xv-anos, bautizos, cumpleanos, ejemplos, crear, editor
Protegidas: mis-eventos, evento/:id, evento/:id/invitados, evento/:id/compartir, evento/:id/galeria
```

`/invitaciones` agregado a `RUTAS_EXENTAS` en SubscriptionGuard.

---

## Decisión Pendiente: Fork vs Módulo

### Opción A: Mantener dentro de Nexo (actual)
- **Pro**: Una sola codebase, shared components sin duplicación, deploys unificados
- **Contra**: Carga de módulos innecesarios para B2C, routing complejo, bundle más grande

### Opción B: Fork a repo independiente
- **Pro**: Bundle optimizado, dominio propio, UX limpia sin sidebar empresarial
- **Contra**: Mantenimiento de dos codebases, divergencia del editor framework

### Recomendación
Mantener como módulo hasta validar product-market fit. Si escala → fork conservando:
- `auth`, `core` (simplificado: 1 user = 1 org), `eventos-digitales`, `suscripciones-negocio`
- `editor-framework`, `ui/`, `shared/`

---

## Modelo de Negocio

- **Pagos únicos** por evento (Checkout Pro de MercadoPago)
- Planes: Básico (gratis/limitado), Premium, Deluxe
- Límites: eventos_activos, invitados_evento, fotos_galeria, plantillas_premium, mesa_regalos, mesas_asignacion

---

## Flujos de Usuario

### Anfitrión (B2C)
```
Landing → Wizard (tipo + plantilla) → Editor borrador (localStorage)
  → Login/Registro → Convertir borrador → Dashboard evento
  → Agregar invitados → Seleccionar plan → Pagar → Compartir link → Trackear RSVPs
```

### Invitado (sin auth)
```
Recibir link → Ver invitación animada → RSVP → Ver mesa de regalos
  → Agregar al calendario → (Post-evento) Subir fotos → Enviar felicitación
```

---

## Pendiente

- [ ] Rutas públicas backend para invitado (RSVP, galería, felicitaciones sin auth)
- [ ] SEO / Open Graph preview para links compartidos
- [ ] Email de confirmación RSVP
- [ ] Flujo completo de ConvertirBorradorModal (crear evento + guardar bloques + limpiar localStorage)
- [ ] Verificar editor B2B no se afectó (necesita test con sesión autenticada)
- [ ] Analytics (eventos creados, RSVPs, conversión)
