# Módulo de Eventos Digitales (Invitaciones)

**Actualizado**: 5 Diciembre 2025
**Estado**: En producción - Funcionalidad QR en desarrollo

---

## Estado Actual

### Implementado

| Área | Funcionalidad | Estado |
|------|---------------|--------|
| **Backend** | CRUD eventos, invitados, ubicaciones, mesa de regalos, felicitaciones | ✅ |
| **Backend** | CRUD plantillas con temas (super_admin) | ✅ |
| **Backend** | Rutas públicas (RSVP, slug, tema incluido, regalos) | ✅ |
| **Backend** | Importar/Exportar CSV invitados | ✅ |
| **Frontend Admin** | Lista eventos, detalle, formulario crear/editar | ✅ |
| **Frontend Admin** | Gestión invitados con estadísticas RSVP | ✅ |
| **Frontend Admin** | Tabs: Ubicaciones, Mesa de Regalos, Felicitaciones | ✅ |
| **Frontend Admin** | Upload imágenes (portada + galería) | ✅ |
| **Frontend Admin** | Selector plantillas con preview de colores | ✅ |
| **Frontend Admin** | Panel super_admin para plantillas con editor de tema | ✅ |
| **Frontend Público** | Página invitación con tema dinámico | ✅ |
| **Frontend Público** | Contador, galería con lightbox, ubicaciones, mesa regalos | ✅ |
| **Frontend Público** | Formulario RSVP funcional con mensaje personalizado | ✅ |
| **Frontend Público** | Google Fonts cargadas dinámicamente | ✅ |
| **SQL** | 6 tablas con RLS, índices, triggers | ✅ |
| **SQL** | 13 plantillas predefinidas con temas | ✅ |

### Pendiente

| Área | Funcionalidad | Prioridad | Estado |
|------|---------------|-----------|--------|
| **QR + Check-in** | Sistema completo de QR y control de acceso | Alta | 🔄 Pendiente |
| **Calendario** | Botón "Agregar a calendario" (.ics + Google) | Baja | ✅ Completado (8 Dic 2025) |
| **Recordatorios** | Emails automáticos a invitados pendientes | Baja | Pendiente |

### Implementado Recientemente

| Fecha | Funcionalidad | Archivos |
|-------|---------------|----------|
| 8 Dic 2025 | Agregar al Calendario | `public.controller.js`, `EventoPublicoPage.jsx` |
| 8 Dic 2025 | Fix: Invitación muestra ubicaciones/regalos | `public.controller.js` |

---

## Fase 3.1: Sistema QR + Check-in (En Desarrollo)

### Objetivo

Sistema completo de códigos QR para invitaciones con funcionalidad opcional de check-in en el evento.

### Casos de Uso

| Caso | Descripción | Requiere QR |
|------|-------------|-------------|
| **Invitación física** | QR impreso en invitación de papel | ✅ Sí |
| **Check-in en evento** | Escanear QR en entrada para control de acceso | ✅ Sí |
| **Invitación digital** | Compartir por WhatsApp/Email | ❌ Link es mejor |

### Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO QR + CHECK-IN                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ADMIN PANEL                    PÁGINA PÚBLICA                  │
│  ─────────────                  ─────────────                   │
│  • Generar QR individual        • Mostrar QR (si habilitado)    │
│  • Descargar QR (PNG)           • Botón "Guardar QR"            │
│  • Descargar todos (ZIP)        • Para presentar en entrada     │
│  • Ver estado check-in                                          │
│                                                                 │
│  TAB CHECK-IN (nueva)                                           │
│  ─────────────────────                                          │
│  • Escáner con cámara                                           │
│  • Dashboard tiempo real                                        │
│  • Lista de llegadas                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Cambios en Base de Datos

```sql
-- Agregar campo check-in a invitados_evento
ALTER TABLE invitados_evento
ADD COLUMN IF NOT EXISTS checkin_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN invitados_evento.checkin_at IS
    'Timestamp de cuando el invitado hizo check-in en el evento';

-- La configuración del evento usa JSONB existente:
-- configuracion: { "habilitar_qr_checkin": true/false }
```

### Endpoints Backend

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/eventos/:id/invitados/:invitadoId/qr` | Generar QR individual | Admin |
| GET | `/eventos/:id/qr-masivo` | ZIP con todos los QR | Admin |
| POST | `/eventos/:id/checkin` | Marcar check-in | Admin |
| GET | `/eventos/:id/checkin/stats` | Estadísticas check-in | Admin |
| GET | `/public/evento/:slug/:token/qr` | QR para página pública | Público |

### Librerías Necesarias

```bash
# Backend
npm install qrcode archiver

# Frontend
npm install html5-qrcode
```

### Tareas de Implementación

#### Backend
- [ ] Agregar columna `checkin_at` a `invitados_evento`
- [ ] Instalar `qrcode` y `archiver`
- [ ] Endpoint: Generar QR individual
- [ ] Endpoint: Generar ZIP masivo
- [ ] Endpoint: Marcar check-in por token
- [ ] Endpoint: Estadísticas check-in
- [ ] Endpoint público: QR para invitación

#### Frontend Admin
- [ ] Botón "Ver QR" en tabla de invitados
- [ ] Modal con QR + botón descargar
- [ ] Botón "Descargar todos los QR"
- [ ] Nueva tab "Check-in" en detalle evento
- [ ] Componente escáner de cámara
- [ ] Dashboard check-in tiempo real
- [ ] Columna estado check-in en tabla invitados

#### Frontend Público
- [ ] Mostrar QR en invitación (si habilitado)
- [ ] Botón "Guardar QR"
- [ ] Estilo coherente con tema del evento

### Flujo de Check-in en el Evento

```
┌──────────────────────────────────────────────────────────────┐
│  PANTALLA CHECK-IN (tablet/móvil)                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   1. Admin abre tab "Check-in" en detalle del evento        │
│                                                              │
│   2. Click "Iniciar escaneo" → activa cámara                │
│                                                              │
│   3. Escanea QR del invitado                                │
│      QR contiene: https://nexo.app/e/slug/TOKEN             │
│                                                              │
│   4. Sistema extrae TOKEN y valida:                         │
│      • Token válido y pertenece al evento                   │
│      • No ha hecho check-in previamente                     │
│                                                              │
│   5. Respuesta visual:                                       │
│      ┌─────────────────────────────┐                        │
│      │  ✓ BIENVENIDO               │  (verde = OK)          │
│      │    Juan Pérez               │                        │
│      │    Familia Pérez            │                        │
│      │    4 personas               │                        │
│      └─────────────────────────────┘                        │
│                                                              │
│      ┌─────────────────────────────┐                        │
│      │  ⚠ YA REGISTRADO            │  (amarillo = duplicado)│
│      │    Juan Pérez               │                        │
│      │    Llegó: 14:32             │                        │
│      └─────────────────────────────┘                        │
│                                                              │
│      ┌─────────────────────────────┐                        │
│      │  ✗ QR INVÁLIDO              │  (rojo = error)        │
│      │    No encontrado            │                        │
│      └─────────────────────────────┘                        │
│                                                              │
│   6. Auto-regresa a modo escaneo en 3 segundos              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Configuración del Evento

```javascript
// En evento.configuracion (JSONB)
{
  "mostrar_ubicaciones": true,
  "mostrar_mesa_regalos": true,
  "permitir_felicitaciones": true,
  "habilitar_qr_checkin": false  // ← NUEVO (default: false)
}
```

---

## Fase 3.2: Agregar a Calendario ✅ COMPLETADO (8 Dic 2025)

### Objetivo

Permitir a los invitados agregar el evento a su calendario.

### Funcionalidades Implementadas

- ✅ Botón "Google Calendar" (abre Google Calendar con evento pre-llenado)
- ✅ Botón "Descargar .ics" (Apple Calendar, Outlook, cualquier app)
- ✅ Recordatorios automáticos en .ics (1 día antes + 2 horas antes)

### Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `backend/.../controllers/public.controller.js` | Método `generarCalendario()` |
| `backend/.../routes/public.routes.js` | Ruta GET `/evento/:slug/calendario` |
| `frontend/.../EventoPublicoPage.jsx` | Botones de calendario en hero |

### Endpoint

```
GET /api/v1/public/evento/:slug/calendario
Content-Type: text/calendar
Content-Disposition: attachment; filename="slug.ics"
```

---

## Fase 3.3: Recordatorios Automáticos (Pendiente - Baja Prioridad)

### Objetivo

Enviar recordatorios automáticos a invitados pendientes de confirmar.

### Funcionalidades

- Job programado que revisa invitados con `estado_rsvp = 'pendiente'`
- Envío de email/WhatsApp X días antes del evento
- Tracking de recordatorios enviados

### Notas

Requiere:
- Configuración SMTP
- Plantillas de email
- Posible integración con WhatsApp Business API

Se implementará como última fase del módulo.

---

## Arquitectura de Referencia

### Estructura Backend

```
backend/app/modules/eventos-digitales/
├── controllers/  (eventos, invitados, ubicaciones, mesa-regalos, felicitaciones, plantillas, public)
├── models/       (evento, invitado, ubicacion, mesa-regalos, felicitacion, plantilla)
├── routes/       (eventos, invitados, ubicaciones, mesa-regalos, felicitaciones, plantillas, public)
└── schemas/      (validación Joi)
```

### Estructura Frontend

```
frontend/src/pages/eventos-digitales/
├── EventosPage.jsx          # Lista de eventos
├── EventoDetailPage.jsx     # Detalle con tabs
├── EventoFormPage.jsx       # Crear/editar con selector plantillas
└── EventoPublicoPage.jsx    # Página pública con tema dinámico

frontend/src/pages/superadmin/
└── PlantillasEventos.jsx    # CRUD plantillas con editor de tema
```

### Endpoints Principales

```
# Admin (autenticado)
GET/POST    /api/v1/eventos-digitales/eventos
GET/PUT/DEL /api/v1/eventos-digitales/eventos/:id
POST        /api/v1/eventos-digitales/eventos/:id/publicar
GET         /api/v1/eventos-digitales/eventos/:id/estadisticas

# Invitados
GET/POST    /api/v1/eventos-digitales/eventos/:id/invitados
PUT/DEL     /api/v1/eventos-digitales/invitados/:id
POST        /api/v1/eventos-digitales/eventos/:id/invitados/importar
GET         /api/v1/eventos-digitales/eventos/:id/invitados/exportar

# QR + Check-in (NUEVO)
GET         /api/v1/eventos-digitales/eventos/:id/invitados/:invitadoId/qr
GET         /api/v1/eventos-digitales/eventos/:id/qr-masivo
POST        /api/v1/eventos-digitales/eventos/:id/checkin
GET         /api/v1/eventos-digitales/eventos/:id/checkin/stats

# Plantillas (lectura: todos, escritura: super_admin)
GET/POST    /api/v1/eventos-digitales/plantillas
PUT/DEL     /api/v1/eventos-digitales/plantillas/:id

# Público (sin auth)
GET         /api/v1/public/evento/:slug
GET         /api/v1/public/evento/:slug/ubicaciones
GET         /api/v1/public/evento/:slug/regalos
GET         /api/v1/public/evento/:slug/calendario    # Descarga .ics
GET         /api/v1/public/evento/:slug/:token
POST        /api/v1/public/evento/:slug/:token/rsvp
GET         /api/v1/public/evento/:slug/:token/whatsapp
GET         /api/v1/public/evento/:slug/:token/qr     # PENDIENTE
```
