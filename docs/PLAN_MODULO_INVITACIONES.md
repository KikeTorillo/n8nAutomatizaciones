# Módulo de Eventos Digitales (Invitaciones)

**Actualizado**: 5 Diciembre 2025
**Estado**: En producción - Funcionalidades extras pendientes

---

## Estado Actual

### Implementado

| Área | Funcionalidad | Estado |
|------|---------------|--------|
| **Backend** | CRUD eventos, invitados, ubicaciones, mesa de regalos, felicitaciones | ✅ |
| **Backend** | CRUD plantillas con temas (super_admin) | ✅ |
| **Backend** | Rutas públicas (RSVP, slug, tema incluido) | ✅ |
| **Backend** | Importar/Exportar CSV invitados | ✅ |
| **Frontend Admin** | Lista eventos, detalle, formulario crear/editar | ✅ |
| **Frontend Admin** | Gestión invitados con estadísticas RSVP | ✅ |
| **Frontend Admin** | Tabs: Ubicaciones, Mesa de Regalos, Felicitaciones | ✅ |
| **Frontend Admin** | Upload imágenes (portada + galería) | ✅ |
| **Frontend Admin** | Selector plantillas con preview de colores | ✅ |
| **Frontend Admin** | Panel super_admin para plantillas con editor de tema | ✅ |
| **Frontend Público** | Página invitación con tema dinámico | ✅ |
| **Frontend Público** | Contador, galería con lightbox, ubicaciones | ✅ |
| **Frontend Público** | Formulario RSVP funcional con mensaje personalizado | ✅ |
| **Frontend Público** | Google Fonts cargadas dinámicamente | ✅ |
| **SQL** | 6 tablas con RLS, índices, triggers | ✅ |
| **SQL** | 13 plantillas predefinidas con temas | ✅ |

### Pendiente - Fase 3

| Área | Funcionalidad | Prioridad |
|------|---------------|-----------|
| **QR** | Generación de código QR por invitado | Alta |
| **Calendario** | Botón "Agregar a calendario" (.ics + Google) | Media |
| **Recordatorios** | Emails automáticos a invitados pendientes | Baja |

---

## Siguiente Paso: Código QR por Invitado

### Objetivo

Generar un código QR único para cada invitado que enlace a su invitación personalizada.

### Implementación

#### 1. Backend - Instalar librería QR

```bash
npm install qrcode
```

#### 2. Backend - Endpoint para generar QR

En `invitados.controller.js`:

```javascript
const QRCode = require('qrcode');

// GET /api/v1/eventos-digitales/eventos/:eventoId/invitados/:id/qr
static async generarQR(req, res) {
  const { id, eventoId } = req.params;
  const organizacionId = req.user.organizacion_id;

  const invitado = await InvitadoModel.obtenerPorId(id, organizacionId);
  if (!invitado) {
    return ResponseHelper.error(res, 'Invitado no encontrado', 404);
  }

  // Obtener slug del evento
  const evento = await EventoModel.obtenerPorId(eventoId, organizacionId);

  // Generar URL de invitación
  const baseUrl = process.env.FRONTEND_URL || 'https://nexo.app';
  const invitacionUrl = `${baseUrl}/e/${evento.slug}/${invitado.token}`;

  // Generar QR como Data URL
  const qrDataUrl = await QRCode.toDataURL(invitacionUrl, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });

  return ResponseHelper.success(res, {
    qr: qrDataUrl,
    url: invitacionUrl,
    invitado: invitado.nombre
  });
}
```

#### 3. Frontend - Mostrar QR en detalle de invitado

```jsx
// Botón para ver QR
<Button onClick={() => setShowQRModal(true)}>
  <QrCode className="w-4 h-4 mr-2" />
  Ver QR
</Button>

// Modal con QR
{showQRModal && (
  <Modal onClose={() => setShowQRModal(false)}>
    <img src={qrData.qr} alt="QR Invitación" />
    <p>{qrData.url}</p>
    <Button onClick={() => descargarQR()}>Descargar QR</Button>
  </Modal>
)}
```

### Tareas

1. [ ] Instalar `qrcode` en backend
2. [ ] Crear endpoint GET `/eventos/:eventoId/invitados/:id/qr`
3. [ ] Agregar hook `useGenerarQR` en frontend
4. [ ] Crear modal de visualización de QR
5. [ ] Agregar botón "Descargar QR" (como PNG)
6. [ ] Agregar botón "Descargar todos los QR" (ZIP)

---

## Fase 3.2: Agregar a Calendario

### Objetivo

Permitir a los invitados agregar el evento a su calendario (Google Calendar, Apple Calendar, Outlook).

### Implementación

#### 1. Generar archivo .ics

```javascript
// utils/icsGenerator.js
function generarICS(evento) {
  const inicio = new Date(evento.fecha_evento);
  const fin = evento.fecha_fin_evento
    ? new Date(evento.fecha_fin_evento)
    : new Date(inicio.getTime() + 4 * 60 * 60 * 1000); // +4 horas default

  const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Nexo//Eventos Digitales//ES
BEGIN:VEVENT
UID:${evento.id}@nexo.app
DTSTART:${formatDate(inicio)}
DTEND:${formatDate(fin)}
SUMMARY:${evento.nombre}
DESCRIPTION:${evento.descripcion || ''}
LOCATION:${evento.ubicaciones?.[0]?.direccion || ''}
END:VEVENT
END:VCALENDAR`;
}
```

#### 2. Botón en página pública

```jsx
// Botones de calendario
<div className="flex gap-2">
  <a
    href={`data:text/calendar;charset=utf8,${encodeURIComponent(generarICS(evento))}`}
    download={`${evento.slug}.ics`}
    className="btn"
  >
    <Download className="w-4 h-4" />
    Descargar .ics
  </a>

  <a
    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evento.nombre)}&dates=${fechaInicio}/${fechaFin}&details=${encodeURIComponent(evento.descripcion)}`}
    target="_blank"
    className="btn"
  >
    <Calendar className="w-4 h-4" />
    Google Calendar
  </a>
</div>
```

### Tareas

1. [ ] Crear función `generarICS` en utils
2. [ ] Agregar botón "Agregar a calendario" en EventoPublicoPage
3. [ ] Soporte para Google Calendar (link directo)
4. [ ] Soporte para .ics (Apple/Outlook)

---

## Fase 3.3: Recordatorios por Email

### Objetivo

Enviar recordatorios automáticos a invitados que no han confirmado.

### Implementación

1. Crear tabla `recordatorios_enviados`
2. Job de n8n que revisa invitados pendientes
3. Envío de email con link de confirmación
4. Tracking de emails enviados

**Nota**: Requiere configuración de email SMTP y plantillas de email.

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
GET         /api/v1/eventos-digitales/eventos/:id/invitados/:id/qr  # PENDIENTE

# Plantillas (lectura: todos, escritura: super_admin)
GET/POST    /api/v1/eventos-digitales/plantillas
PUT/DEL     /api/v1/eventos-digitales/plantillas/:id

# Público (sin auth)
GET         /api/v1/public/evento/:slug
GET         /api/v1/public/evento/:slug/:token
POST        /api/v1/public/evento/:slug/:token/rsvp
```
