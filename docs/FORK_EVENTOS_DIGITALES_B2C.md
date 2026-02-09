# Plan: Fork Eventos Digitales — Plataforma B2C

## Objetivo

Crear un fork del proyecto Nexo que solo conserve el módulo **eventos-digitales** (invitaciones digitales), reutilizando la arquitectura existente de **suscripciones-negocio** para gestionar los pagos de las invitaciones, y construir un frontend B2C completo para usuarios finales.

---

## 1. Visión del Producto

### Qué es
Una plataforma standalone donde cualquier persona puede crear invitaciones digitales para sus eventos (bodas, XV años, bautizos, cumpleaños, etc.), pagar por ellas con MercadoPago (Checkout Pro / pagos únicos), y compartirlas con sus invitados.

### Modelo de negocio
- **Pagos únicos** por invitación/evento (tipo_cobro = 'unico' del módulo suscripciones)
- Planes escalonados: Básico (gratis/limitado), Premium, Deluxe
- Cada plan desbloquea: # invitados, galería de fotos, mesa de regalos, RSVP, plantillas premium, etc.

### Usuarios
| Rol | Descripción |
|-----|-------------|
| **Anfitrión** (B2C) | Crea su evento, personaliza invitación, compra plan, comparte link |
| **Invitado** (público) | Ve la invitación, confirma asistencia (RSVP), sube fotos |
| **Admin** (interno) | Gestiona planes, métricas, soporte |

---

## 2. Módulos a Conservar del Fork

### Conservar íntegros
| Módulo | Razón |
|--------|-------|
| `auth` | Login, registro, JWT, refresh tokens |
| `core` | Organizaciones, config base (cada anfitrión = 1 org) |
| `eventos-digitales` | El producto completo: eventos, invitaciones, RSVP, galería, mesa de regalos, felicitaciones, mesas |
| `suscripciones-negocio` | Pagos únicos (Checkout Pro), planes, checkout, webhooks MercadoPago, historial de pagos |

### Conservar parcialmente
| Módulo | Qué conservar |
|--------|---------------|
| `website` | Solo el `editor-framework` compartido (bloques, canvas, posición libre) — eliminar la parte de sitio web |

### Eliminar completamente
| Módulo | Razón |
|--------|-------|
| `agendamiento` | Citas, calendarios — no aplica |
| `inventario` | Productos, stock, combos — no aplica |
| `pos` | Punto de venta, sesiones de caja — no aplica |
| `contabilidad` | Contabilidad — no aplica |

---

## 3. Cambios Backend

### 3.1 Estructura de módulos

```
backend/app/modules/
├── auth/              # Sin cambios
├── core/              # Simplificar: 1 org = 1 usuario (auto-crear org al registro)
├── eventos-digitales/ # Sin cambios
├── suscripciones/     # Renombrar de suscripciones-negocio, simplificar
└── shared/            # Helpers compartidos (MinIO, email, etc.)
```

### 3.2 Simplificación de auth/core

- **Registro**: Al crear usuario → auto-crear organización (sin onboarding empresarial)
- **Roles**: Solo `admin` (dueño del evento) y `super_admin` (nosotros). Eliminar propietario/supervisor/empleado
- **RLS**: Mantener tal cual — cada usuario tiene su org, aislamiento garantizado
- **Dogfooding**: Mantener — la plataforma misma es la "org 1" que vende planes

### 3.3 Simplificación de suscripciones

- Foco en `tipo_cobro = 'unico'` (Checkout Pro)
- Eliminar: preapproval (recurrente), seat-based billing, ajustes de balance
- Conservar: planes, checkout, webhooks MP, historial de pagos, cupones
- **LimitesHelper**: Adaptar límites a entidades de eventos:
  - `eventos_activos` — # de eventos que puede crear
  - `invitados_evento` — # invitados por evento
  - `fotos_galeria` — # fotos en galería
  - `plantillas_premium` — acceso a plantillas premium (boolean)
  - `mesa_regalos` — habilitar mesa de regalos (boolean)
  - `mesas_asignacion` — habilitar asignación de mesas (boolean)

### 3.4 Rutas públicas

Agregar rutas sin auth para la experiencia del invitado:
```
GET /api/v1/eventos/:slug                    # Ver invitación pública
POST /api/v1/eventos/:slug/rsvp              # Confirmar asistencia
POST /api/v1/eventos/:slug/galeria           # Subir foto
GET /api/v1/eventos/:slug/galeria            # Ver galería
POST /api/v1/eventos/:slug/felicitaciones    # Enviar felicitación
GET /api/v1/eventos/:slug/mesa-regalos       # Ver mesa de regalos
```

---

## 4. Frontend B2C — Nuevo

### 4.1 Estructura de páginas

```
src/pages/
├── landing/                    # Landing page pública
│   ├── LandingPage.jsx         # Hero, features, testimonios, CTA
│   ├── PreciosPage.jsx         # Planes y precios (reutiliza PlanesPublicPage)
│   └── EjemplosPage.jsx        # Galería de invitaciones de ejemplo
│
├── auth/                       # Login/Registro simplificado
│   ├── LoginPage.jsx           # Login
│   ├── RegistroPage.jsx        # Registro (sin onboarding empresarial)
│   └── RecuperarPage.jsx       # Recuperar contraseña
│
├── dashboard/                  # Dashboard del anfitrión (post-login)
│   ├── DashboardPage.jsx       # Mis eventos, stats rápidos
│   ├── MiPlanPage.jsx          # Plan actual (reutiliza MiPlanPage adaptado)
│   └── ConfiguracionPage.jsx   # Perfil, contraseña
│
├── eventos/                    # CRUD de eventos (anfitrión)
│   ├── MisEventosPage.jsx      # Lista de mis eventos
│   ├── CrearEventoPage.jsx     # Wizard: tipo, fecha, datos básicos
│   ├── EventoDetailPage.jsx    # Detalle con tabs
│   └── components/
│       ├── EventoWizard.jsx    # Wizard paso a paso
│       ├── InvitadosManager.jsx # Gestión de invitados + RSVP stats
│       ├── GaleriaManager.jsx  # Galería de fotos
│       ├── MesaRegalosManager.jsx
│       └── MesasManager.jsx    # Asignación de mesas
│
├── editor/                     # Editor de invitación (reutiliza editor-framework)
│   ├── EditorPage.jsx          # Editor de posición libre
│   └── PlantillasPage.jsx      # Galería de plantillas
│
├── invitacion/                 # Vista pública de invitación (sin auth)
│   ├── InvitacionPublicaPage.jsx  # Renderiza la invitación
│   ├── RSVPPage.jsx               # Formulario de confirmación
│   ├── GaleriaPublicaPage.jsx     # Galería de fotos públicas
│   └── FelicitacionesPage.jsx     # Enviar/ver felicitaciones
│
├── checkout/                   # Flujo de compra
│   ├── CheckoutPage.jsx        # Selección de plan + pago (reutiliza CheckoutModal)
│   └── PaymentCallbackPage.jsx # Callback de MercadoPago (ya existe)
│
└── planes/
    └── PreciosPage.jsx         # Vista pública de planes
```

### 4.2 Componentes reutilizados de Nexo

| Componente Nexo | Uso en Fork |
|-----------------|-------------|
| `editor-framework/` | Editor de invitaciones completo (posición libre, bloques, temas) |
| `FreePositionCanvas` | Canvas del editor |
| `InvitacionDinamica` | Renderizado público de la invitación |
| `TemplateGalleryModal` | Selección de plantillas |
| `ThemeEditorPanel` | Personalización de colores/fuentes |
| `CheckoutModal` | Flujo de pago (tipo_cobro=unico) |
| `PlanesPublicPage` | Página de precios (adaptada) |
| `MiPlanPage` | Dashboard de plan del anfitrión (adaptada, sin recurrente) |
| `ui/` (atoms, molecules, organisms) | Design system completo |
| `shared/media/UnsplashPicker` | Selector de imágenes |
| `shared/calendar/AddToCalendar` | Agregar al calendario |

### 4.3 Componentes nuevos a construir

| Componente | Descripción |
|------------|-------------|
| `LandingHero` | Hero section con demo interactiva de invitación |
| `TestimoniosCarousel` | Testimonios de clientes |
| `EventoWizard` | Wizard: tipo de evento → datos → seleccionar plantilla → personalizar |
| `InvitadosManager` | CRUD de invitados + importar CSV + stats RSVP |
| `RSVPTracker` | Dashboard de confirmaciones (confirmados/pendientes/rechazados) |
| `CompartirInvitacion` | Generar link, WhatsApp share, copiar, QR |
| `DashboardAnfitrion` | Cards de resumen: mis eventos, invitados, próximo evento |

### 4.4 Flujo principal del usuario

```
Landing → Registro → Dashboard → Crear Evento (wizard) →
  → Seleccionar Plantilla → Editor de Invitación →
  → Agregar Invitados → Seleccionar Plan → Pagar (MercadoPago) →
  → Compartir Link → Trackear RSVPs
```

### 4.5 Flujo del invitado (sin auth)

```
Recibir link (WhatsApp/email) → Ver invitación animada →
  → Confirmar asistencia (RSVP) → Ver mesa de regalos →
  → Agregar al calendario → (Después del evento) Subir fotos → Enviar felicitación
```

---

## 5. Base de Datos — Limpieza

### Tablas a conservar

```sql
-- Auth & Core
usuarios, organizaciones, roles, permisos, sesiones_refresh

-- Eventos Digitales
eventos_digitales, invitaciones, invitados, confirmaciones_asistencia,
galeria_fotos, mesa_regalos, regalos, felicitaciones,
mesas_evento, asignaciones_mesa, ubicaciones_evento

-- Suscripciones (simplificado)
planes_suscripcion_org, suscripciones_cliente, pagos_suscripcion,
cupones_suscripcion, checkout_tokens

-- Storage
-- MinIO buckets: invitaciones, galerias
```

### Tablas a eliminar

```sql
-- Agendamiento
citas, servicios, horarios, bloqueos, citas_recurrentes, recordatorios

-- Inventario
productos, categorias, stock, movimientos_stock, numeros_serie,
ordenes_compra, transferencias, combos, modificadores, listas_precios

-- POS
ventas_pos, items_venta_pos, sesiones_caja, movimientos_caja,
cupones_pos, promociones, programa_lealtad, puntos_cliente

-- Personas (parcial)
profesionales, empleados, departamentos, puestos, vacaciones,
habilidades, experiencia_laboral, educacion_formal, documentos_empleado

-- Contabilidad
cuentas_bancarias, movimientos_contables
```

---

## 6. Orden de Ejecución

### Fase 1: Fork y limpieza (1-2 semanas)
1. Crear repositorio nuevo desde fork
2. Eliminar módulos backend no necesarios
3. Eliminar tablas y migraciones no necesarias
4. Simplificar auth (registro → auto-crear org)
5. Verificar que eventos-digitales + suscripciones funcionen aislados

### Fase 2: Rutas públicas + API invitado (1 semana)
1. Rutas públicas sin auth para invitados
2. RSVP público
3. Galería pública (subida de fotos)
4. Felicitaciones públicas

### Fase 3: Frontend B2C — Core (2-3 semanas)
1. Landing page
2. Registro/login simplificado
3. Dashboard anfitrión
4. Crear evento (wizard)
5. Editor de invitación (reutilizar editor-framework)

### Fase 4: Frontend B2C — Pagos y compartir (1-2 semanas)
1. Página de precios (adaptar PlanesPublicPage)
2. Checkout con pagos únicos (reutilizar CheckoutModal)
3. Mi Plan (adaptar MiPlanPage)
4. Compartir invitación (link, WhatsApp, QR)

### Fase 5: Frontend B2C — Experiencia invitado (1-2 semanas)
1. Vista pública de invitación (InvitacionDinamica ya existe)
2. RSVP público
3. Galería pública
4. Felicitaciones
5. Add to calendar

### Fase 6: Polish y lanzamiento (1 semana)
1. SEO y meta tags para links compartidos
2. Open Graph preview de invitaciones
3. Email de confirmación RSVP
4. Analytics básico (eventos creados, RSVPs, conversión)
5. Deploy

---

## 7. Consideraciones Técnicas

### Dominio y deploy
- Dominio propio (ej: `invitalo.mx`, `tuinvitacion.com`)
- Mismo stack Docker: front + back + postgres + redis + minio
- Separar de Nexo completamente — DB independiente

### Ventajas de reutilizar la arquitectura Nexo
- **RLS multi-tenant** ya funciona (1 usuario = 1 org = aislamiento)
- **Suscripciones con MercadoPago** ya integrado (Checkout Pro, webhooks, pagos únicos)
- **Editor de invitaciones** maduro (posición libre, plantillas, temas)
- **UI component library** completa (atoms, molecules, organisms)
- **MinIO** para almacenamiento de imágenes

### Riesgos
- Acoplamiento residual entre módulos eliminados (imports cruzados en shared)
- Middleware chain puede tener referencias a módulos eliminados
- Frontend routing tiene rutas de todos los módulos — limpiar `AppRouter`

### Métricas de éxito (MVP)
- Tiempo de creación de invitación < 15 minutos
- Conversión landing → registro > 5%
- Conversión registro → pago > 15%
- RSVP rate > 60% de invitados

---

## 8. Diferencias clave Nexo vs Fork

| Aspecto | Nexo (ERP) | Fork (B2C Eventos) |
|---------|------------|-------------------|
| Audiencia | Negocios (B2B) | Personas (B2C) |
| Registro | Onboarding empresarial | Signup simple (email/Google) |
| Módulos | 8+ módulos | Solo eventos + pagos |
| Pagos | Recurrentes (preapproval) | Únicos (Checkout Pro) |
| Roles | 5+ niveles RBAC | Solo anfitrión + admin |
| Navegación | Sidebar empresarial | Navegación simple, mobile-first |
| Branding | Nexo | Marca nueva (TBD) |
